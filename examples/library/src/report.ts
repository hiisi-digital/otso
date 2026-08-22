// deno-lint-ignore-file no-unreachable -- the second return is reachable in
// the build where the first one was stripped, which is the whole point.
/**
 * The part that needed no marker at all, which is most of a library.
 *
 * `@std/path` is string manipulation with no runtime behaviour to diverge, and
 * `crypto.subtle` is a Web standard all three implement, so this file is written
 * once and shipped unchanged to each. It is here to make
 * the ratio visible: the marked file next to it is the exception, and a project
 * where every file looks like that one is reaching for `@cfg` too early.
 */

import { basename, extname } from "@std/path";

/** What {@link summarise} works out about a file. */
export interface Summary {
  /** The file's name without its directory. */
  readonly name: string;
  /** The extension, including the dot, or an empty string. */
  readonly extension: string;
  /** How many characters the contents came to. */
  readonly length: number;
  /** How many lines, counting a trailing newline as ending the last one. */
  readonly lines: number;
  /** A hex sha-256 of the contents, when the `checksum` feature is on. */
  readonly checksum?: string;
}

/**
 * Summarise a file's contents.
 *
 * The checksum is behind a feature rather than always computed, because hashing
 * a large file is not free and a caller that does not want it should not pay
 * for it. With the feature off the hashing is not in the build at all, rather
 * than sitting in it behind a branch that is never taken.
 */
export async function summarise(
  path: string,
  contents: string,
): Promise<Summary> {
  const base = {
    name: basename(path),
    extension: extname(path),
    length: contents.length,
    lines: contents === "" ? 0 : contents.replace(/\n$/, "").split("\n").length,
  };
  //@cfg(feature("checksum"))
  return { ...base, checksum: await sha256(contents) };
  //@cfg(not(feature("checksum")))
  return base;
}

//@cfg(feature("checksum"))
async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** One line describing a summary, in a form that is the same on every runtime. */
export function describe(summary: Summary): string {
  const checksum = summary.checksum === undefined ? "" : ` sha256=${summary.checksum.slice(0, 12)}`;
  return `${summary.name} ${summary.length}c ${summary.lines}L${checksum}`;
}
