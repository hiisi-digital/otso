/**
 * @module otso/check
 *
 * Type-checking what a distribution is actually built from.
 *
 * This is the command that has no counterpart in the tools underneath, and the
 * reason is the pattern `@cfg` exists for. Two implementations of one name under
 * opposite conditions is how a runtime difference is written down, and it is a
 * duplicate identifier to any compiler pointed at the file. Checking the source
 * therefore reports errors that are not errors, and reports them for every
 * project that uses the marker at all.
 *
 * What is checkable is the staged tree, once per distribution, because that is
 * the code the target will run and the only arrangement in which each name has
 * one meaning.
 */

import { join } from "@std/path";

import { stage, stagedDirFor } from "./stage.ts";
import { runCommand } from "./process.ts";
import type { CheckResult, CheckTargetResult, Distribution, OtsoConfig } from "./types.ts";

/**
 * Type-check every distribution in `config`.
 *
 * Staging runs first and is not reused from a previous build, so a check
 * answers for the source as it is now rather than for whatever was on disk.
 */
export async function check(
  config: OtsoConfig,
  options: { readonly onDistribution?: (d: Distribution) => void } = {},
): Promise<CheckResult> {
  const targets: CheckTargetResult[] = [];
  // Sequential on purpose: two checks at once interleave their compiler output,
  // and the output is the whole product of this command.
  for (const distribution of config.distributions) {
    options.onDistribution?.(distribution);
    // deno-lint-ignore no-await-in-loop -- sequential on purpose, see the comment above
    targets.push(await checkOne(config, distribution));
  }
  return { success: targets.every((t) => t.success), targets };
}

/** Type-check one distribution, staging it first. */
export async function checkOne(
  config: OtsoConfig,
  distribution: Distribution,
): Promise<CheckTargetResult> {
  const staged = await stage(config, distribution);
  const errors = staged.diagnostics.filter((d) => d.severity === "error");
  if (errors.length > 0) {
    return {
      distribution,
      success: false,
      output: errors.map((d) => `${d.file}: ${d.message}`).join("\n"),
    };
  }

  const dir = stagedDirFor(config, distribution);
  const entries = await entryPoints(dir);
  if (entries.length === 0) {
    return {
      distribution,
      success: false,
      output: "the manifest declares no exports, so there is nothing to check",
    };
  }

  const result = await runCommand(Deno.execPath(), ["check", ...entries], dir);
  return { distribution, success: result.success, output: result.output };
}

/**
 * The files a manifest's `exports` names.
 *
 * Everything the package offers, rather than one entry point, because a subpath
 * export that does not compile is broken for whoever imports it whatever the
 * main entry does.
 */
export async function entryPoints(stagedDir: string): Promise<string[]> {
  const raw = JSON.parse(await Deno.readTextFile(join(stagedDir, "deno.json"))) as {
    exports?: unknown;
  };
  const exports = raw.exports;
  if (typeof exports === "string") return [exports];
  if (exports !== null && typeof exports === "object" && !Array.isArray(exports)) {
    return Object.values(exports as Record<string, unknown>).filter(
      (value): value is string => typeof value === "string",
    );
  }
  return [];
}
