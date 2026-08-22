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
import { exists } from "@hiisi/shimp";
import { runCommand } from "./process.ts";

/**
 * The deno-dist CLI, as a specifier this runtime can execute.
 *
 * Resolved through otso's own import map, so it is a `file:` URL when the map
 * names a path and an `https://jsr.io/...` URL when it names a jsr specifier.
 * Both are things `deno run` accepts.
 *
 * `links` is not enough to make it the first of those, which is worth knowing
 * because it looks like it should be. The CLI resolves a linked checkout when it
 * builds the module graph, and `import.meta.resolve` does not see that: it hands
 * back the jsr URL, the subprocess asks the registry, and a version that is only
 * a sibling on disk is reported as not existing. A local checkout wants an exact
 * mapping in `imports` as well.
 */
export function denoDistCli(): string {
  return import.meta.resolve("@hiisi/deno-dist/cli");
}

/**
 * The config deno-dist should run under, when it is a checkout on disk.
 *
 * A deno program started by file path resolves its own bare specifiers against
 * the config in the working directory, not against the one beside the program.
 * deno-dist is run from the staged tree, so the moment it has any dependency of
 * its own it looks for it in the staged project's manifest and does not find it.
 * The symptom names deno-dist's own source file and a package the staged project
 * never heard of, which is a confusing way to learn this.
 *
 * `undefined` for a jsr specifier, which carries its own resolution.
 */
export async function denoDistConfig(cli: string = denoDistCli()): Promise<string | undefined> {
  if (!cli.startsWith("file:")) return undefined;
  // `<checkout>/src/cli.ts` resolves against `<checkout>/src/`, so one step up
  // is the manifest's directory. Two was wrong and produced `undefined`
  // silently, which reads exactly like "there is no checkout".
  const root = new URL("../", cli);
  // The local variant first, for the same reason it exists at all: it is the one
  // that resolves siblings that are not published yet.
  const candidates = ["deno.local.json", "deno.json"].map((name) => new URL(name, root));
  const found = await Promise.all(candidates.map((url) => exists(url)));
  return candidates[found.indexOf(true)]?.pathname;
}

/** Build one distribution from a staged tree. */
export async function buildDistribution(
  stagedDir: string,
  name: string,
  options: { readonly verbose?: boolean } = {},
): Promise<CommandResult> {
  const cli = denoDistCli();
  const config = await denoDistConfig(cli);
  const args = ["run", "-A"];
  if (config !== undefined) args.push("-c", config);
  args.push(cli, "build", name);
  if (options.verbose === true) args.push("--verbose");
  return await runCommand(Deno.execPath(), args, stagedDir);
}
