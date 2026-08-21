/**
 * @module otso/clean
 *
 * Removing what a build wrote.
 *
 * Named distributions or all of them, and in either case the staged trees go
 * too. A staged tree left behind after its distribution has been removed is a
 * copy of the source under a name nobody is looking at, which is the shape of
 * thing that gets published by accident.
 *
 * The dist directory itself stays, empty. It is not necessarily otso's: a
 * project can put other things beside its distributions, and removing a
 * directory on the grounds that this tool happened to write into it is how a
 * clean takes something it was not asked for.
 */

import { join } from "@std/path";

import { outputDirFor, removeStaging } from "./stage.ts";
import type { Distribution, OtsoConfig } from "./types.ts";

/** What a clean removed. */
export interface CleanResult {
  /** Absolute paths that existed and are now gone. */
  readonly removed: readonly string[];
}

/**
 * Remove the output of every distribution in `config`, and the staging
 * directory with it.
 */
export async function clean(config: OtsoConfig): Promise<CleanResult> {
  const directories = config.distributions.map((d: Distribution) => outputDirFor(config, d));
  const removed = await Promise.all(directories.map(async (dir) => {
    return await removeIfPresent(dir) ? dir : undefined;
  }));
  await removeStaging(config);
  return { removed: removed.filter((dir): dir is string => dir !== undefined) };
}

/** The directory a clean would remove for `distribution`. */
export function cleanTargetFor(config: OtsoConfig, distribution: Distribution): string {
  return join(config.projectDir, config.distDir, distribution.name);
}

async function removeIfPresent(path: string): Promise<boolean> {
  try {
    await Deno.remove(path, { recursive: true });
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}
