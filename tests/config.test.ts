/**
 * Reading a project's configuration.
 *
 * The laws here are about the two things this module decides that nothing else
 * does: which distributions exist, and what each one's target and feature set
 * come to once the manifest, the `otso` block and the command line have all had
 * their say. Every refusal is checked for refusing, because a manifest that is
 * wrong in a way nothing complains about produces a build that is quietly
 * missing whatever the bad line was guarding.
 *
 * @module
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { targetId } from "@hiisi/tgts";

import { DEFAULT_DIST_DIR, parseConfig } from "../src/config.ts";
import { ConfigError } from "../src/types.ts";

/** A manifest with `dist` entries for every runtime tgts knows and this tool targets. */
function manifest(extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    name: "@scope/thing",
    version: "1.0.0",
    exports: "./mod.ts",
    dist: {
      node: { runtime: "node" },
      bun: { runtime: "bun" },
      deno: { runtime: "deno" },
    },
    ...extra,
  });
}

const RUNTIMES = ["node", "bun", "deno"] as const;

function featuresOf(config: ReturnType<typeof parseConfig>, name: string): string[] {
  const found = config.distributions.find((d) => d.name === name);
  assert(found !== undefined, `no distribution named ${name}`);
  return [...found.features].sort();
}

describe("distributions come from the dist block", () => {
  it("produces one distribution per entry, in declaration order", () => {
    const config = parseConfig(manifest(), "/p");
    assertEquals(config.distributions.map((d) => d.name), [...RUNTIMES]);
  });

  it("takes each target from that entry's runtime, for every runtime", () => {
    const config = parseConfig(manifest(), "/p");
    for (const runtime of RUNTIMES) {
      assertEquals(
        config.distributions.find((d) => d.name === runtime)?.target,
        targetId(runtime),
        `${runtime} should target itself`,
      );
    }
  });

  it("lets a distribution be named anything and still name its target", () => {
    // the name is deno-dist's output directory, so it is free; the target is not
    const config = parseConfig(
      JSON.stringify({ dist: { "node-legacy": { runtime: "node" } } }),
      "/p",
    );
    assertEquals(config.distributions[0]?.name, "node-legacy");
    assertEquals(config.distributions[0]?.target, targetId("node"));
  });

  it("lets the otso block override the target without touching the dist block", () => {
    const config = parseConfig(
      manifest({ otso: { distributions: { node: { target: "bun" } } } }),
      "/p",
    );
    assertEquals(config.distributions.find((d) => d.name === "node")?.target, targetId("bun"));
    // and leaves the others where they were
    assertEquals(config.distributions.find((d) => d.name === "bun")?.target, targetId("bun"));
  });
});

describe("feature resolution", () => {
  it("gives every distribution the global features", () => {
    const config = parseConfig(manifest({ otso: { features: ["json", "net"] } }), "/p");
    for (const runtime of RUNTIMES) {
      assertEquals(featuresOf(config, runtime), ["json", "net"], runtime);
    }
  });

  it("adds per-distribution features to the global ones rather than replacing them", () => {
    const config = parseConfig(
      manifest({ otso: { features: ["json"], distributions: { node: { features: ["fast"] } } } }),
      "/p",
    );
    assertEquals(featuresOf(config, "node"), ["fast", "json"]);
    assertEquals(featuresOf(config, "bun"), ["json"]);
  });

  it("adds the command line's features to every distribution", () => {
    const config = parseConfig(manifest({ otso: { features: ["json"] } }), "/p", {
      features: ["extra"],
    });
    for (const runtime of RUNTIMES) {
      assertEquals(featuresOf(config, runtime), ["extra", "json"], runtime);
    }
  });

  it("removes a feature the command line turned off, from whichever layer set it", () => {
    const config = parseConfig(
      manifest({ otso: { features: ["json"], distributions: { node: { features: ["fast"] } } } }),
      "/p",
      { features: ["extra"], noFeatures: ["json", "fast", "extra"] },
    );
    // every source of a feature loses to --no-feature, which is what makes it
    // usable for turning something off without editing the manifest
    for (const runtime of RUNTIMES) {
      assertEquals(featuresOf(config, runtime), [], runtime);
    }
  });

  it("turning off a feature nothing enabled is not an error", () => {
    const config = parseConfig(manifest(), "/p", { noFeatures: ["absent"] });
    assertEquals(featuresOf(config, "node"), []);
  });

  it("defaults to no features at all", () => {
    const config = parseConfig(manifest(), "/p");
    for (const runtime of RUNTIMES) assertEquals(featuresOf(config, runtime), [], runtime);
  });
});

describe("selecting distributions", () => {
  it("keeps every distribution when nothing is named", () => {
    for (const only of [undefined, []]) {
      const config = parseConfig(manifest(), "/p", { only });
      assertEquals(config.distributions.length, 3, `only=${JSON.stringify(only)}`);
    }
  });

  it("keeps only what was named", () => {
    const config = parseConfig(manifest(), "/p", { only: ["node", "deno"] });
    assertEquals(config.distributions.map((d) => d.name), ["node", "deno"]);
  });

  it("refuses a name the manifest does not declare, and says what it does declare", () => {
    const error = assertThrows(
      () => parseConfig(manifest(), "/p", { only: ["nodejs"] }),
      ConfigError,
    );
    assert(error.message.includes("nodejs"), error.message);
    assert(error.message.includes("node, bun, deno"), error.message);
  });
});

describe("the dist directory", () => {
  it("defaults to target", () => {
    assertEquals(parseConfig(manifest(), "/p").distDir, DEFAULT_DIST_DIR);
  });

  it("takes what the manifest says", () => {
    assertEquals(parseConfig(manifest({ distDir: "build" }), "/p").distDir, "build");
  });

  it("refuses an absolute one, because deno-dist refuses it later", () => {
    assertThrows(() => parseConfig(manifest({ distDir: "/tmp/out" }), "/p"), ConfigError);
  });

  it("refuses an empty or non-string one", () => {
    for (const value of ["", "   ", 7, null, []]) {
      assertThrows(
        () => parseConfig(manifest({ distDir: value }), "/p"),
        ConfigError,
        undefined,
        `distDir ${JSON.stringify(value)} should be refused`,
      );
    }
  });
});

describe("refusals", () => {
  it("refuses a manifest with no dist block, and says what to add", () => {
    const error = assertThrows(
      () => parseConfig(JSON.stringify({ name: "x" }), "/p"),
      ConfigError,
    );
    assert(error.message.includes("dist"), error.message);
    assert(error.message.includes("runtime"), "the message should show the shape to add");
  });

  it("refuses an empty dist block the same way", () => {
    assertThrows(() => parseConfig(JSON.stringify({ dist: {} }), "/p"), ConfigError);
  });

  it("refuses a distribution naming no runtime", () => {
    for (const entry of [{}, { runtime: "" }, { runtime: 3 }]) {
      assertThrows(
        () => parseConfig(JSON.stringify({ dist: { a: entry } }), "/p"),
        ConfigError,
        undefined,
        JSON.stringify(entry),
      );
    }
  });

  it("refuses a runtime tgts does not know, and repeats the ones it does", () => {
    const error = assertThrows(
      () => parseConfig(JSON.stringify({ dist: { a: { runtime: "erlang" } } }), "/p"),
      ConfigError,
    );
    assert(error.message.includes("erlang"), error.message);
    assert(error.message.includes("deno"), "the message should list what is available");
  });

  it("refuses a feature id that is not a feature id, wherever it was written", () => {
    const bad = "Not A Feature";
    assertThrows(
      () => parseConfig(manifest({ otso: { features: [bad] } }), "/p"),
      ConfigError,
    );
    assertThrows(
      () => parseConfig(manifest({ otso: { distributions: { node: { features: [bad] } } } }), "/p"),
      ConfigError,
    );
    assertThrows(() => parseConfig(manifest(), "/p", { features: [bad] }), ConfigError);
    assertThrows(() => parseConfig(manifest(), "/p", { noFeatures: [bad] }), ConfigError);
  });

  it("refuses a feature list that is not a list of strings", () => {
    for (const value of ["json", 7, {}, [1], ["ok", 2]]) {
      assertThrows(
        () => parseConfig(manifest({ otso: { features: value } }), "/p"),
        ConfigError,
        undefined,
        JSON.stringify(value),
      );
    }
  });

  it("refuses a manifest that will not parse, and one that is not an object", () => {
    assertThrows(() => parseConfig("{ not json", "/p"), ConfigError);
    for (const text of ["[]", '"a string"', "7", "null"]) {
      assertThrows(() => parseConfig(text, "/p"), ConfigError, undefined, text);
    }
  });
});

describe("jsonc", () => {
  it("reads a manifest with comments and trailing commas", () => {
    const config = parseConfig(
      `{
        // the distributions this project ships
        "dist": { "node": { "runtime": "node" } },
      }`,
      "/p",
    );
    assertEquals(config.distributions.map((d) => d.name), ["node"]);
  });
});
