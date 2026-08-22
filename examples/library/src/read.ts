// deno-lint-ignore-file no-redeclare -- three declarations of one name under
// conditions that cannot both hold is the pattern; the build leaves one.
/**
 * Reading a file, and what a marked arm is allowed to contain.
 *
 * Each of the three below is the target's own file read. Deno and bun have one
 * that skips a layer, node's is `node:fs`, and none of the three exists on the
 * other two. That is what makes this a case for `@cfg`: there is no shared API
 * to put them behind, and marking them lets each distribution carry its own
 * without the others riding along or a branch at run time to choose.
 *
 * **A `node:` import inside a `target("node")` arm is not the leak it looks
 * like.** The thing to avoid is reaching for one runtime's namespace as the
 * cross-runtime answer, which puts the question of what differs into every
 * consumer. Inside an arm that only ships to node, `node:fs` is simply node's
 * code, and it is the same category as `Deno.readTextFile` in the arm above it.
 *
 * Where a shared API does exist, use it and write no arms at all. `@hiisi/shimp`
 * covers the runtime surface and `src/report.ts` is what that looks like: no
 * marks, no imports of anyone's namespace, one file shipped unchanged to three.
 *
 * As it stands this file is deliberately not valid TypeScript: three `readText`
 * in one file is a duplicate identifier and any compiler says so. It compiles
 * once the build has chosen a target and removed the other two, which is what
 * `otso check` checks over each staged tree, and why checking the source
 * directly is not the same thing.
 *
 * Reaching for a runtime's own global costs one line of configuration. `deno
 * check` knows nothing about `Bun` until the manifest's `compilerOptions.types`
 * says where to find it, and that line is in this example's deno.json.
 */

//@cfg(target("deno"))
export function readText(path: string): Promise<string> {
  return Deno.readTextFile(path);
}

//@cfg(target("bun"))
export function readText(path: string): Promise<string> {
  return Bun.file(path).text();
}

//@cfg(target("node"))
export async function readText(path: string): Promise<string> {
  const { readFile } = await import("node:fs/promises");
  return await readFile(path, "utf8");
}
