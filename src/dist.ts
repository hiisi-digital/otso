/**
 * @module otso/dist
 *
 * Handing a staged tree to deno-dist.
 *
 * otso does not package anything itself. deno-dist already turns one Deno
 * project into a jsr, an npm and a bun distribution, it has an end-to-end test
 * that installs all three and checks they agree, and a second implementation of
 * that living here would be a second set of bugs for one job. What otso adds is
 * the tree deno-dist is pointed at, which is the part deno-dist has no opinion
 * about.
 *
 * The handoff is a subprocess with its working directory set to the staged
 * tree, because deno-dist reads its manifest from the working directory and
 * takes its source from there too. In-process would mean `Deno.chdir`, which is
 * one global for the whole runtime and so cannot be right for two distributions
 * being built at once.
 */

import type { CommandResult } from "./process.ts";
import { runCommand } from "./process.ts";

/**
 * The deno-dist CLI, as a specifier this runtime can execute.
 *
 * Resolved through otso's own import map, so it is a `file:` URL when a
 * checkout is linked in and an `https://jsr.io/...` URL when it is not. Both
 * are things `deno run` accepts.
 */
export function denoDistCli(): string {
  return import.meta.resolve("@hiisi/deno-dist/cli");
}

/** Build one distribution from a staged tree. */
export function buildDistribution(
  stagedDir: string,
  name: string,
  options: { readonly verbose?: boolean } = {},
): Promise<CommandResult> {
  const args = ["run", "-A", denoDistCli(), "build", name];
  if (options.verbose === true) args.push("--verbose");
  return runCommand(Deno.execPath(), args, stagedDir);
}
