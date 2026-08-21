/**
 * What lands in a staged tree, and what does not.
 *
 * The end-to-end test covers whether a build works. These cover the decisions
 * staging makes on its own, which that test cannot isolate: which files it
 * walks, what it does to the manifest on the way past, and what it does with a
 * file whose markers do not evaluate.
 *
 * @module
 */

import { assert, assertEquals, assertFalse, assertStringIncludes } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { join } from "@std/path";

import { parseConfig } from "../src/config.ts";
import { outputDirFor, removeStaging, stage, stagedDirFor } from "../src/stage.ts";
import type { OtsoConfig } from "../src/types.ts";

const MANIFEST = {
  name: "@scope/thing",
  version: "0.1.0",
  exports: "./mod.ts",
  dist: {
    node: { runtime: "node", plugins: ["deno-to-node"] },
    deno: { runtime: "deno", plugins: ["deno-passthrough"] },
  },
  otso: { features: ["extra"] },
};

const SOURCE = `//@cfg(target("deno"))
export const runtime = "deno";

//@cfg(target("node"))
export const runtime = "node";

//@cfg(feature("extra"))
export const extra = true;

export const shared = 1;
`;

let root = "";

async function write(rel: string, text: string): Promise<void> {
  const path = join(root, rel);
  await Deno.mkdir(join(path, ".."), { recursive: true });
  await Deno.writeTextFile(path, text);
}

async function exists(path: string): Promise<boolean> {
  return await Deno.stat(path).then(() => true).catch(() => false);
}

function configFor(overrides: Parameters<typeof parseConfig>[2] = {}): OtsoConfig {
  return parseConfig(JSON.stringify(MANIFEST), root, overrides);
}

beforeEach(async () => {
  root = await Deno.makeTempDir({ prefix: "otso_stage_" });
  await write("deno.json", JSON.stringify(MANIFEST));
  await write("mod.ts", `export { runtime, shared } from "./src/thing.ts";\n`);
  await write("src/thing.ts", SOURCE);
  await write("README.md", "# thing\n");
  await write("assets/logo.svg", "<svg/>");
});

afterEach(async () => {
  await Deno.remove(root, { recursive: true });
});

describe("what gets transformed", () => {
  it("keeps the declaration for the target and drops the others, per target", async () => {
    const config = configFor();
    // each distribution stages into its own directory, so these do not collide
    const staged = await Promise.all(config.distributions.map(async (distribution) => {
      const result = await stage(config, distribution);
      return {
        distribution,
        text: await Deno.readTextFile(join(result.stagedDir, "src", "thing.ts")),
      };
    }));
    for (const { distribution, text } of staged) {
      assertStringIncludes(
        text,
        `export const runtime = "${distribution.name}"`,
        distribution.name,
      );
      const others = config.distributions.filter((d) => d.name !== distribution.name);
      for (const other of others) {
        assertFalse(
          text.includes(`export const runtime = "${other.name}"`),
          `${distribution.name} kept ${other.name}'s declaration`,
        );
      }
    }
  });

  it("keeps a feature-gated declaration when the feature is on and drops it when off", async () => {
    // one at a time: both configs stage the same distribution, so they stage
    // into the same directory, and running them at once has them clobber each
    // other rather than measure anything
    const on = configFor();
    const onResult = await stage(on, on.distributions[0] as never);
    const onText = await Deno.readTextFile(join(onResult.stagedDir, "src", "thing.ts"));

    const off = configFor({ noFeatures: ["extra"] });
    const offResult = await stage(off, off.distributions[0] as never);
    const offText = await Deno.readTextFile(join(offResult.stagedDir, "src", "thing.ts"));

    assertStringIncludes(onText, "export const extra");
    assertFalse(offText.includes("export const extra"));
  });

  it("leaves untouched whatever carries no marker", async () => {
    const config = configFor();
    const result = await stage(config, config.distributions[0] as never);
    assertStringIncludes(
      await Deno.readTextFile(join(result.stagedDir, "src", "thing.ts")),
      "export const shared = 1",
    );
  });

  it("copies non-TypeScript files byte for byte", async () => {
    const config = configFor();
    const result = await stage(config, config.distributions[0] as never);
    assertEquals(await Deno.readTextFile(join(result.stagedDir, "assets", "logo.svg")), "<svg/>");
    assertEquals(await Deno.readTextFile(join(result.stagedDir, "README.md")), "# thing\n");
  });

  it("counts what it kept and what it stripped", async () => {
    const config = configFor();
    const result = await stage(config, config.distributions[0] as never);
    // one runtime declaration of two, plus the feature-gated one
    assertEquals(result.stripped, 1);
    assertEquals(result.kept, 2);
  });
});

describe("what gets walked", () => {
  it("does not copy the dist directory into itself", async () => {
    // the staged tree lives under the dist directory, so a walk that did not
    // skip it would copy its own output, and then that copy
    const config = configFor();
    await Deno.mkdir(join(root, "target", "node"), { recursive: true });
    await Deno.writeTextFile(join(root, "target", "node", "stale.ts"), "export const x = 1;\n");
    const result = await stage(config, config.distributions[0] as never);
    assertFalse(await exists(join(result.stagedDir, "target")), "the dist directory was copied");
  });

  it("skips what the otso block excludes", async () => {
    await write("scripts/tool.ts", "export const x = 1;\n");
    const config = parseConfig(
      JSON.stringify({ ...MANIFEST, otso: { exclude: ["scripts"] } }),
      root,
    );
    const result = await stage(config, config.distributions[0] as never);
    assertFalse(await exists(join(result.stagedDir, "scripts")));
    assert(await exists(join(result.stagedDir, "src")), "src should still be there");
  });

  it("skips node_modules and .git without being told to", async () => {
    await write("node_modules/dep/index.js", "module.exports = {};\n");
    await write(".git/HEAD", "ref: refs/heads/main\n");
    const config = configFor();
    const result = await stage(config, config.distributions[0] as never);
    assertFalse(await exists(join(result.stagedDir, "node_modules")));
    assertFalse(await exists(join(result.stagedDir, ".git")));
  });

  it("rewrites the tree rather than adding to it", async () => {
    const config = configFor();
    const first = await stage(config, config.distributions[0] as never);
    await Deno.writeTextFile(join(first.stagedDir, "stale.ts"), "export const gone = 1;\n");
    const second = await stage(config, config.distributions[0] as never);
    assertFalse(
      await exists(join(second.stagedDir, "stale.ts")),
      "a file from a previous staging survived into the next one",
    );
  });
});

describe("the staged manifest", () => {
  it("carries only the distribution being built", async () => {
    const config = configFor();
    const manifests = await Promise.all(config.distributions.map(async (distribution) => {
      const result = await stage(config, distribution);
      return {
        distribution,
        manifest: JSON.parse(
          await Deno.readTextFile(join(result.stagedDir, "deno.json")),
        ) as { dist: Record<string, unknown> },
      };
    }));
    for (const { distribution, manifest } of manifests) {
      assertEquals(Object.keys(manifest.dist), [distribution.name]);
    }
  });

  it("points the dist directory back out of the staging tree", async () => {
    const config = configFor();
    const distribution = config.distributions[0] as never;
    const result = await stage(config, distribution);
    const manifest = JSON.parse(
      await Deno.readTextFile(join(result.stagedDir, "deno.json")),
    ) as { distDir: string };
    // the staged tree is two levels below the dist directory, so this is what
    // makes output land beside the staged trees rather than inside one
    assertEquals(manifest.distDir, "../..");
    assertEquals(
      join(result.stagedDir, manifest.distDir, config.distributions[0]?.name ?? ""),
      outputDirFor(config, distribution),
    );
  });

  it("drops the otso block, which is build machinery", async () => {
    const config = configFor();
    const result = await stage(config, config.distributions[0] as never);
    const manifest = JSON.parse(await Deno.readTextFile(join(result.stagedDir, "deno.json")));
    assertFalse("otso" in manifest, "the otso block leaked into the staged tree");
    // and keeps what the package actually is
    assertEquals(manifest.name, "@scope/thing");
    assertEquals(manifest.exports, "./mod.ts");
  });
});

describe("markers that do not evaluate", () => {
  it("reports the file rather than throwing out of the walk", async () => {
    await write("src/broken.ts", `//@cfg(nonsense("x"))\nexport const a = 1;\n`);
    await write("src/fine.ts", `export const b = 2;\n`);
    const config = configFor();
    const result = await stage(config, config.distributions[0] as never);
    const errors = result.diagnostics.filter((d) => d.severity === "error");
    assert(errors.length > 0, "a predicate nothing understands should be reported");
    assert(
      errors.some((d) => d.file.includes("broken")),
      `the diagnostic should name the file: ${JSON.stringify(errors)}`,
    );
    // the rest of the walk still happened, which is the point of not throwing
    assert(await exists(join(result.stagedDir, "src", "fine.ts")));
  });
});

describe("removing staging", () => {
  it("takes the staged trees and leaves the built output", async () => {
    const config = configFor();
    const distribution = config.distributions[0] as never;
    await stage(config, distribution);
    await Deno.mkdir(outputDirFor(config, distribution), { recursive: true });
    await Deno.writeTextFile(join(outputDirFor(config, distribution), "kept.txt"), "x");
    await removeStaging(config);
    assertFalse(await exists(stagedDirFor(config, distribution)));
    assert(await exists(join(outputDirFor(config, distribution), "kept.txt")));
  });

  it("is fine when there is nothing to remove", async () => {
    await removeStaging(configFor());
  });
});
