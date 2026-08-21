// deno-lint-ignore-file no-await-in-loop -- every loop here installs a package
// or runs a build, and those are sequential on purpose.
/**
 * The whole point, checked the way a consumer would check it.
 *
 * One source tree with `@cfg` markers in it goes through otso, comes out as a
 * jsr, an npm and a bun distribution, and each is then installed and imported
 * by package name under the runtime it was built for. The three have to print
 * the same bytes. Importing by relative path would pass while the packaging was
 * broken, so nothing load-bearing here does that.
 *
 * The properties, and each is here because it can fail on its own:
 *
 * 1. The marked declarations are resolved rather than shipped. Each
 *    distribution carries its own implementation and neither of the others,
 *    which is checked by reading the output rather than by trusting the counts.
 * 2. The authored source does not type-check and the staged trees do. That is
 *    the reason `otso check` exists, so it is asserted rather than described.
 * 3. Turning a feature off changes what is built, and changes it the same way
 *    for all three.
 * 4. The three agree, byte for byte, with the feature on and with it off.
 *
 * These take a while: three distributions, one of them through dnt, plus an
 * npm and a bun install each time. There is no faster arrangement that still
 * answers the question, because the question is about what a consumer gets.
 *
 * @module
 */

import { assert, assertEquals, assertFalse, assertStringIncludes } from "@std/assert";
import { dirname, fromFileUrl, join, toFileUrl } from "@std/path";

import { build } from "../src/build.ts";
import { check } from "../src/check.ts";
import { loadConfig } from "../src/config.ts";

const REPO_ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const LIBRARY = join(REPO_ROOT, "examples", "library");

/**
 * The consumer program. Integer counts and a hex digest, so identical output
 * is a property of the distributions rather than of number formatting.
 */
const CONSUMER = `import { describe, readText, summarise } from "@hiisi/otso-example-library";
const text = await readText("input.txt");
const s = await summarise("input.txt", text);
console.log(describe(s));
console.log(JSON.stringify(s));
`;

const INPUT = "alpha\nbeta\ngamma\n";

interface Ran {
  readonly ok: boolean;
  readonly stdout: string;
  readonly stderr: string;
}

async function run(cmd: string, args: readonly string[], cwd: string): Promise<Ran> {
  const { success, stdout, stderr } = await new Deno.Command(cmd, {
    args: [...args],
    cwd,
    stdout: "piped",
    stderr: "piped",
  }).output();
  const decoder = new TextDecoder();
  return { ok: success, stdout: decoder.decode(stdout), stderr: decoder.decode(stderr) };
}

function assertRan(result: Ran, what: string): void {
  assert(result.ok, `${what} failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
}

async function copyTree(from: string, to: string): Promise<void> {
  await Deno.mkdir(to, { recursive: true });
  for await (const entry of Deno.readDir(from)) {
    const src = join(from, entry.name);
    const dest = join(to, entry.name);
    if (entry.isDirectory) {
      if (entry.name === "target") continue;
      await copyTree(src, dest);
    } else {
      await Deno.copyFile(src, dest);
    }
  }
}

/** Install a distribution the way a consumer does, run the program, return stdout. */
async function consume(work: string, project: string, runtime: string): Promise<string> {
  const consumer = join(work, `${runtime}-consumer`);
  await Deno.mkdir(consumer, { recursive: true });
  await Deno.writeTextFile(join(consumer, "input.txt"), INPUT);
  await Deno.writeTextFile(join(consumer, "main.ts"), CONSUMER);
  const dist = join(project, "target", runtime);

  if (runtime === "deno") {
    // a directory cannot be added by name the way a registry package can, so the
    // name is bound through the import map, which is the resolution jsr performs
    await Deno.writeTextFile(
      join(consumer, "deno.json"),
      JSON.stringify({
        imports: {
          "@hiisi/otso-example-library": toFileUrl(join(dist, "mod.ts")).href,
        },
      }),
    );
    const result = await run(Deno.execPath(), ["run", "-A", "main.ts"], consumer);
    assertRan(result, "deno run");
    return result.stdout;
  }

  if (runtime === "bun") {
    await Deno.writeTextFile(
      join(consumer, "package.json"),
      JSON.stringify({
        name: "consumer",
        private: true,
        dependencies: { "@hiisi/otso-example-library": `file:${dist}` },
      }),
    );
    assertRan(await run("bun", ["install"], consumer), "bun install");
    const result = await run("bun", ["main.ts"], consumer);
    assertRan(result, "bun main.ts");
    return result.stdout;
  }

  await Deno.writeTextFile(
    join(consumer, "package.json"),
    JSON.stringify({ name: "consumer", private: true, type: "module" }),
  );
  assertRan(
    await run("npm", ["install", "--no-audit", "--no-fund", `file:${dist}`], consumer),
    "npm install",
  );
  const result = await run("node", ["main.ts"], consumer);
  assertRan(result, "node main.ts");
  return result.stdout;
}

/** The text of a built distribution's read implementation, however it was emitted. */
async function readImplementation(project: string, runtime: string): Promise<string> {
  const candidates = [
    join(project, "target", runtime, "src", "read.ts"),
    join(project, "target", runtime, "esm", "src", "read.js"),
  ];
  const found = await Promise.all(candidates.map(async (path) => {
    try {
      return await Deno.readTextFile(path);
    } catch {
      return undefined;
    }
  }));
  const text = found.find((value) => value !== undefined);
  assert(text !== undefined, `no read implementation found for ${runtime} in ${candidates}`);
  return text;
}

Deno.test("one source, three distributions, one output", async (t) => {
  const work = await Deno.makeTempDir({ prefix: "otso_e2e_" });
  const project = join(work, "library");
  const withFeature: Record<string, string> = {};
  const withoutFeature: Record<string, string> = {};

  try {
    await copyTree(LIBRARY, project);

    await t.step("the authored source does not type-check, which is why check exists", async () => {
      // two `readText` under opposite conditions is a duplicate identifier until
      // a target has been chosen. If this ever passes, the example has stopped
      // demonstrating the thing the example is for.
      const result = await run(Deno.execPath(), ["check", "mod.ts"], project);
      assertFalse(result.ok, "the marked source should not check as it stands");
      assertStringIncludes(result.stderr + result.stdout, "readText");
    });

    await t.step("every staged tree does type-check", async () => {
      const config = await loadConfig(project);
      const result = await check(config);
      for (const target of result.targets) {
        assert(target.success, `${target.distribution.name} did not check:\n${target.output}`);
      }
    });

    await t.step("the build produces every distribution", async () => {
      const config = await loadConfig(project);
      const result = await build(config);
      for (const target of result.targets) {
        assert(target.success, `${target.distribution.name} failed:\n${target.output}`);
      }
      assertEquals(result.targets.length, 3);
    });

    await t.step("each distribution carries its own implementation and no other", async () => {
      const own: Record<string, string> = {
        deno: "Deno.readTextFile",
        bun: "Bun.file",
        node: "node:fs/promises",
      };
      for (const [runtime, marker] of Object.entries(own)) {
        const text = await readImplementation(project, runtime);
        assertStringIncludes(text, marker, `${runtime} should carry ${marker}`);
        for (const [other, otherMarker] of Object.entries(own)) {
          if (other === runtime) continue;
          assertFalse(
            text.includes(otherMarker),
            `${runtime} should not carry ${other}'s ${otherMarker}`,
          );
        }
      }
    });

    await t.step("staging leaves nothing behind after a successful build", async () => {
      // a staged tree is a copy of the source under a name nobody looks at, and
      // it sits inside the directory that gets published
      const staged = join(project, "target", ".otso");
      const exists = await Deno.stat(staged).then(() => true).catch(() => false);
      assertFalse(exists, `${staged} should have been removed`);
    });

    await t.step("node installs and runs", async () => {
      withFeature["node"] = await consume(work, project, "node");
    });
    await t.step("bun installs and runs", async () => {
      withFeature["bun"] = await consume(work, project, "bun");
    });
    await t.step("deno resolves and runs", async () => {
      withFeature["deno"] = await consume(work, project, "deno");
    });

    await t.step("all three print the same bytes", () => {
      assert(
        withFeature["node"] !== undefined && withFeature["node"] !== "",
        "node printed nothing",
      );
      assertEquals(withFeature["bun"], withFeature["node"], "bun disagrees with node");
      assertEquals(withFeature["deno"], withFeature["node"], "deno disagrees with node");
    });

    await t.step("the feature was on, and its effect is visible", () => {
      assertStringIncludes(withFeature["node"] ?? "", "sha256=");
      assertStringIncludes(withFeature["node"] ?? "", '"checksum"');
    });

    await t.step("turning the feature off changes the build for all three", async () => {
      const config = await loadConfig(project, { noFeatures: ["checksum"] });
      const result = await build(config);
      for (const target of result.targets) {
        assert(target.success, `${target.distribution.name} failed:\n${target.output}`);
      }
      for (const runtime of ["node", "bun", "deno"]) {
        withoutFeature[runtime] = await consume(
          join(work, "off"),
          project,
          runtime,
        );
      }
      for (const runtime of ["node", "bun", "deno"]) {
        assertFalse(
          (withoutFeature[runtime] ?? "").includes("checksum"),
          `${runtime} still computes a checksum with the feature off`,
        );
      }
      assertEquals(withoutFeature["bun"], withoutFeature["node"], "bun disagrees with node");
      assertEquals(withoutFeature["deno"], withoutFeature["node"], "deno disagrees with node");
      // and the feature genuinely changed something, so the check above is not
      // passing because both runs happened to produce the same thing
      assert(
        withoutFeature["node"] !== withFeature["node"],
        "the feature made no difference, so nothing here was measured",
      );
    });
  } finally {
    await Deno.remove(work, { recursive: true });
  }
});
