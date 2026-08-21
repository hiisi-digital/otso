// deno-lint-ignore-file no-redeclare -- two declarations of one name under
// conditions that cannot both hold is the pattern; the build leaves one.
/**
 * What the tool does.
 *
 * The one marked declaration is the same choice the library example makes for
 * the same reason: every runtime can list a directory through `node:fs`, and
 * each has a quicker way of its own, so the build keeps the one that belongs to
 * the target and the others are not shipped.
 */

import { basename } from "node:path";

/** What a run came to: lines to print, and the code to exit with. */
export interface Output {
  readonly lines: readonly string[];
  readonly code: number;
}

//@cfg(target("deno"))
async function entryNames(dir: string): Promise<string[]> {
  const names: string[] = [];
  for await (const entry of Deno.readDir(dir)) names.push(entry.name);
  return names;
}

//@cfg(any(target("node"), target("bun")))
async function entryNames(dir: string): Promise<string[]> {
  const { readdir } = await import("node:fs/promises");
  return await readdir(dir);
}

/**
 * List a directory, sorted, one name per line.
 *
 * Sorted because the order a filesystem hands entries back in is not the same
 * on every platform, and this example's whole point is that the three
 * distributions print the same bytes.
 */
export async function run(args: readonly string[]): Promise<Output> {
  const dir = args[0];
  if (dir === undefined || dir === "--help") {
    return { lines: ["usage: otso-example <directory>"], code: dir === undefined ? 2 : 0 };
  }
  try {
    const names = await entryNames(dir);
    return { lines: [`${basename(dir)}:`, ...names.sort()], code: 0 };
  } catch {
    return { lines: [`cannot read ${dir}`], code: 1 };
  }
}
