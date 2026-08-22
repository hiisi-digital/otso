/**
 * @module otso-example-library
 *
 * One source, three distributions, and nothing in any of them written twice.
 *
 * One rule, and the order in it is the point: **reach for the shared API first,
 * and mark only what it cannot express.**
 *
 * `@hiisi/shimp` is that shared API, and a project depends on it the moment it
 * needs the runtime surface. This example does not, which is worth seeing: what
 * it actually reads and writes goes through the marked arms, and everything else
 * it needs is `@std/path`, which is string manipulation with no runtime
 * behaviour to diverge, and the Web standards `crypto.subtle` and `performance`,
 * which need no door at all.
 *
 * `@cfg` is for what is left, and `src/read.ts` is the honest case. Each runtime
 * has a file read of its own and none of the three exists on the other two, so
 * there is no shared API to put them behind. A `node:` import inside a
 * `target("node")` arm is that arm's own code rather than a cross-runtime answer,
 * which is the distinction that decides whether a namespace import is a leak.
 *
 * The ratio is the thing to take from this example rather than the marks. One
 * marked file, two unmarked, and `probes/runtime_divergence.mjs` in this
 * repository is the measurement behind that: four differences in seventeen
 * checks. A project where every file looks like `src/read.ts` is reaching for
 * `@cfg` far too early.
 *
 * The `checksum` feature in `src/report.ts` is the other axis. With it off the
 * hashing is not in the build at all, rather than sitting in it behind a branch
 * nobody takes.
 */

export { readText } from "./src/read.ts";
export { describe, summarise } from "./src/report.ts";
export type { Summary } from "./src/report.ts";
