/**
 * @module otso/build
 *
 * Building every distribution a project declares.
 *
 * Two steps per distribution and nothing else: stage the source for its target,
 * then hand the staged tree to deno-dist. The interesting half is the first one
 * and it lives in `./stage.ts`; this module is the loop around it and the
 * decision about what counts as a failure.
 */

import { outputDirFor, removeStaging, stage } from "./stage.ts";
import { buildDistribution } from "./dist.ts";
import type { BuildResult, BuildTargetResult, Distribution, OtsoConfig } from "./types.ts";

/** What to do around a build. */
export interface BuildOptions {
  /** Pass `--verbose` down to deno-dist. */
  readonly verbose?: boolean;
  /** Leave staged trees on disk, which is what makes a failure inspectable. */
  readonly keepStaged?: boolean;
  /** Called as each distribution starts, so a caller can say so. */
  readonly onDistribution?: (distribution: Distribution) => void;
}

/**
 * Build every distribution in `config`.
 *
 * One failing distribution does not stop the others. A build of three targets
 * that stops at the first is a report about one target, and the useful thing to
 * know is which of them are broken rather than which is broken first.
 *
 * Staged trees are removed on success and kept on failure, because on failure
 * they are the evidence: what deno-dist was actually given, with the stripping
 * already applied.
 */
export async function build(
  config: OtsoConfig,
  options: BuildOptions = {},
): Promise<BuildResult> {
  const started = performance.now();
  const targets: BuildTargetResult[] = [];
  // Sequential because deno-dist writes into a shared dist directory and the
  // node path shells out to dnt, which is heavy enough that overlapping two of
  // them buys little and makes the output unreadable.
  for (const distribution of config.distributions) {
    options.onDistribution?.(distribution);
    // deno-lint-ignore no-await-in-loop -- sequential on purpose, see the comment above
    targets.push(await buildOne(config, distribution, options));
  }

  const success = targets.every((t) => t.success);
  if (success && options.keepStaged !== true) await removeStaging(config);

  return { success, targets, durationMs: performance.now() - started };
}

/** Stage one distribution and build it. */
export async function buildOne(
  config: OtsoConfig,
  distribution: Distribution,
  options: BuildOptions = {},
): Promise<BuildTargetResult> {
  const started = performance.now();
  const staged = await stage(config, distribution);
  const outputDir = outputDirFor(config, distribution);

  const errors = staged.diagnostics.filter((d) => d.severity === "error");
  if (errors.length > 0) {
    return {
      distribution,
      success: false,
      outputDir,
      stage: staged,
      output: errors.map((d) => `${d.file}: ${d.message}`).join("\n"),
      durationMs: performance.now() - started,
    };
  }

  const result = await buildDistribution(staged.stagedDir, distribution.name, {
    verbose: options.verbose,
  });

  return {
    distribution,
    success: result.success,
    outputDir,
    stage: staged,
    output: result.output,
    durationMs: performance.now() - started,
  };
}
