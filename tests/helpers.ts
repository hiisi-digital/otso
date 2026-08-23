/**
 * Helpers shared by the suites here.
 *
 * Both of these existed twice, byte for byte, in two test files each. A copied
 * helper is one that can drift, and a suite where two files disagree about what
 * "exists" means is worse than one with a shared import.
 *
 * @module
 */

import { join } from "@std/path";

/** Whether a path is there at all. */
export async function exists(path: string): Promise<boolean> {
  return await Deno.stat(path).then(() => true).catch(() => false);
}

/**
 * Copy a directory tree, skipping `target`.
 *
 * `target` is where builds land, so copying it into a fixture would carry a
 * previous run's output into the next one's expectations.
 */
export async function copyTree(from: string, to: string): Promise<void> {
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

/** What running a command produced. */
export interface Ran {
  readonly ok: boolean;
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

/**
 * Run a command and collect everything it produced.
 *
 * Two suites had their own `Ran` and their own `run`, and the two `Ran`s
 * differed by one field, so a helper written against one silently did not fit
 * the other. `cwd` is optional because one of them ran in place.
 */
export async function run(
  cmd: string,
  args: readonly string[],
  cwd?: string,
): Promise<Ran> {
  const { success, code, stdout, stderr } = await new Deno.Command(cmd, {
    args: [...args],
    ...(cwd === undefined ? {} : { cwd }),
    stdout: "piped",
    stderr: "piped",
  }).output();
  const decoder = new TextDecoder();
  return {
    ok: success,
    code,
    stdout: decoder.decode(stdout),
    stderr: decoder.decode(stderr),
  };
}
