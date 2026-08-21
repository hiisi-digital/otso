/**
 * The process wrapper: arguments in, exit code out, and nothing else.
 *
 * Everything here answers the same on deno, node and bun, so there is no
 * marker in this file and no need for one. `process.argv`, `process.exit` and
 * `import.meta.main` were measured on all three and agreed; the measurement is
 * `probes/runtime_divergence.mjs` in the otso repository.
 *
 * The node distribution is built as an ES module only, which is the first place
 * a tool differs from a library. `await` at the top level of a module is how a
 * command line entry point waits for its own work, and dnt refuses to emit that
 * as CommonJS, correctly, because CommonJS has no way to express it. A library
 * wants both module systems and would not put an await there; a tool wants one
 * and does. That is the `cjs: false` in this example's dist block.
 *
 * There is no shebang, and that is the one thing this example cannot finish.
 * A shebang has to be the first line and has to name the runtime that will run
 * the file, so it is per-distribution by nature and out of reach of a marker on
 * a declaration. Emitting it, and the `bin` entry beside it that makes
 * `npm install -g` install a command, belongs to whatever writes the package
 * manifest. deno-dist does not write either yet.
 */

import { run } from "./mod.ts";

if (import.meta.main) {
  const result = await run(process.argv.slice(2));
  for (const line of result.lines) console.log(line);
  process.exit(result.code);
}
