// deno-lint-ignore-file no-redeclare -- three declarations of one name under
// conditions that cannot both hold is the pattern; the build leaves one.
/**
 * Reading a file, three ways, one of which survives each build.
 *
 * The declarations below are the same function three times under conditions
 * that cannot both hold. That is the shape `@cfg` is for and it is deliberately
 * not valid TypeScript as it stands: two `readText` in one file is a duplicate
 * identifier, and any compiler pointed at this file says so. It compiles once
 * the build has chosen a target and removed the other two, which is what
 * `otso check` checks and why checking the source directly is not the same
 * thing.
 *
 * Reaching for a runtime's own global costs one line of configuration: `deno
 * check`, which is what `otso check` runs over each staged tree, knows nothing
 * about `Bun` until the manifest's `compilerOptions.types` says where to find
 * it. That line is in this example's deno.json, and without it the bun target
 * is the only one that fails to check.
 *
 * All three return the same string for the same file. The reason to have three
 * is that each runtime's own path is the quick one on that runtime, and a
 * distribution that carries only its own has nothing to decide at run time.
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
