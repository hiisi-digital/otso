/**
 * @module otso-example-binary
 *
 * The tool's behaviour, separated from the process it usually runs in.
 *
 * `run` takes its arguments and returns its output rather than reading
 * `process.argv` and calling `console.log`, which is what lets the same
 * function be tested directly and be driven by `cli.ts` on all three runtimes
 * without any of them needing a different entry point.
 */

export { run } from "./src/run.ts";
export type { Output } from "./src/run.ts";
