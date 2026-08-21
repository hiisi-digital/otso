/**
 * @module otso-example-library
 *
 * One source, three distributions, and nothing in any of them written twice.
 *
 * Two mechanisms, and which one to reach for is decided by measurement rather
 * than by habit. Most of what a library needs has converged: `node:fs`,
 * `node:path`, `process`, `crypto.subtle` and `performance` answer the same on
 * all three runtimes, so the shared code below imports them directly and there
 * is nothing to choose. `probes/runtime_divergence.mjs` in this repository is
 * that measurement, and it found four differences in seventeen checks.
 *
 * Where they do differ, `@hiisi/shimp` covers the difference behind one API and
 * the code stays written once. Permissions, terminal detection and workers are
 * that list, and it is short on purpose.
 *
 * `@cfg` is for what is left, and `src/read.ts` is the honest case: every
 * runtime can read a file through `node:fs`, and each one has a faster way of
 * its own. Marking the three and letting the build keep one is how a
 * distribution reaches its own runtime's path without the other two riding
 * along, and without a branch being taken at runtime to decide.
 */

export { readText } from "./src/read.ts";
export { describe, summarise } from "./src/report.ts";
export type { Summary } from "./src/report.ts";
