/**
 * Removing what a build wrote.
 *
 * Small, and worth pinning anyway, because the two ways this can be wrong are
 * both silent: removing a directory that was not this project's, and leaving a
 * staged tree behind inside the directory that gets published.
 *
 * @module
 */

import { assert, assertEquals, assertFalse } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { join } from "@std/path";

import { clean } from "../src/clean.ts";
import { parseConfig } from "../src/config.ts";
import { STAGING_DIR_NAME } from "../src/stage.ts";
import type { OtsoConfig } from "../src/types.ts";

const MANIFEST = JSON.stringify({
  name: "@scope/thing",
  exports: "./mod.ts",
  dist: {
    node: { runtime: "node" },
    deno: { runtime: "deno" },
  },
});

let root = "";
let config: OtsoConfig;

async function exists(path: string): Promise<boolean> {
  return await Deno.stat(path).then(() => true).catch(() => false);
}

async function place(...rels: string[]): Promise<void> {
  await Promise.all(rels.map(async (rel) => {
    const path = join(root, rel);
    await Deno.mkdir(join(path, ".."), { recursive: true });
    await Deno.writeTextFile(path, "x");
  }));
}

beforeEach(async () => {
  root = await Deno.makeTempDir({ prefix: "otso_clean_" });
  config = parseConfig(MANIFEST, root);
});

afterEach(async () => {
  await Deno.remove(root, { recursive: true });
});

describe("clean", () => {
  it("removes every distribution's output and reports what it removed", async () => {
    await place("target/node/mod.js", "target/deno/mod.ts");
    const result = await clean(config);
    assertEquals(result.removed.length, 2);
    assertFalse(await exists(join(root, "target", "node")));
    assertFalse(await exists(join(root, "target", "deno")));
  });

  it("removes the staging directory along with them", async () => {
    await place(`target/${STAGING_DIR_NAME}/node/mod.ts`, "target/node/mod.js");
    await clean(config);
    assertFalse(
      await exists(join(root, "target", STAGING_DIR_NAME)),
      "a staged tree is a copy of the source sitting where output gets published",
    );
  });

  it("reports only what was actually there", async () => {
    await place("target/node/mod.js");
    const result = await clean(config);
    assertEquals(result.removed.length, 1, "the deno output never existed");
    assert(result.removed[0]?.endsWith(join("target", "node")), result.removed[0]);
  });

  it("removes nothing when there is nothing, rather than failing", async () => {
    const result = await clean(config);
    assertEquals(result.removed, []);
  });

  it("touches nothing outside the dist directory", async () => {
    await place("target/node/mod.js", "src/thing.ts", "mod.ts", "deno.json");
    await clean(config);
    const survivors = ["src/thing.ts", "mod.ts", "deno.json"];
    const found = await Promise.all(survivors.map((rel) => exists(join(root, rel))));
    for (const [index, ok] of found.entries()) {
      assert(ok, `${survivors[index]} should have survived a clean`);
    }
  });

  it("removes only what was selected, when a distribution was named", async () => {
    await place("target/node/mod.js", "target/deno/mod.ts");
    const only = parseConfig(MANIFEST, root, { only: ["node"] });
    await clean(only);
    assertFalse(await exists(join(root, "target", "node")));
    assert(await exists(join(root, "target", "deno")), "deno was not asked for");
  });
});
