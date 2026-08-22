/**
 * Which manifest this tool reads, and which it refuses to.
 *
 * `CONFIG_FILE_NAMES` is exported through `mod.ts`, so it is public surface and
 * shrinking it is a breaking change. Nothing asserted its contents, nothing
 * asserted the walk upward, and nothing asserted that a file this tool has no
 * business knowing about is ignored. All three are laws a consumer relies on
 * and all three were only in a doc comment.
 *
 * @module
 */

import { assert, assertEquals } from "@std/assert";
import { join } from "@std/path";

import { CONFIG_FILE_NAMES, findManifest } from "../src/config.ts";

/** A throwaway tree, removed whether the law passes or not. */
async function inTempDir(body: (dir: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: "otso_manifest_" });
  try {
    await body(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test("the names are deno's own, and only those", () => {
  // shrinking this array is a breaking change to an exported const, and it has
  // been shrunk once already. Pinning the contents is what makes the next
  // change to it a deliberate one.
  assertEquals([...CONFIG_FILE_NAMES], ["deno.json", "deno.jsonc"]);
});

Deno.test("a manifest in the directory itself is found", async () => {
  await inTempDir(async (dir) => {
    await Deno.writeTextFile(join(dir, "deno.json"), "{}");
    assertEquals(await findManifest(dir), join(dir, "deno.json"));
  });
});

Deno.test("deno.jsonc counts, since deno reads it too", async () => {
  await inTempDir(async (dir) => {
    await Deno.writeTextFile(join(dir, "deno.jsonc"), "{}");
    assertEquals(await findManifest(dir), join(dir, "deno.jsonc"));
  });
});

Deno.test("the walk goes up until a manifest turns up", async () => {
  await inTempDir(async (dir) => {
    const deep = join(dir, "a", "b", "c");
    await Deno.mkdir(deep, { recursive: true });
    await Deno.writeTextFile(join(dir, "deno.json"), "{}");
    assertEquals(await findManifest(deep), join(dir, "deno.json"));
  });
});

Deno.test("a file this tool does not name is not a manifest", async () => {
  // the case the change that added this file is about: a workspace-private
  // second manifest used to be preferred over deno.json, which put one
  // project's development habit inside a general packaging tool. A directory
  // holding only such a file has no manifest at all now.
  await inTempDir(async (dir) => {
    const deep = join(dir, "project");
    await Deno.mkdir(deep);
    await Deno.writeTextFile(join(deep, "deno.local.json"), "{}");

    const found = await findManifest(deep);
    assert(
      found === undefined || !found.startsWith(deep),
      `${found} was treated as a manifest and it is not one of ${CONFIG_FILE_NAMES}`,
    );
  });
});

Deno.test("deno.json wins over deno.jsonc when both are there", async () => {
  await inTempDir(async (dir) => {
    await Deno.writeTextFile(join(dir, "deno.json"), "{}");
    await Deno.writeTextFile(join(dir, "deno.jsonc"), "{}");
    // the order in CONFIG_FILE_NAMES is the preference, so it is a law rather
    // than an accident of how the directory happens to enumerate.
    assertEquals(await findManifest(dir), join(dir, "deno.json"));
  });
});
