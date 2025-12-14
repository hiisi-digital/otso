/**
 * Check command for otso
 *
 * Runs type checking with cfg-ts support across all configured targets.
 * Uses the TypeScript compiler API with the cfg-ts transformer to validate
 * code that would be included for each target.
 *
 * @module
 */

import type { BuildDiagnostic, CliArgs, OtsoConfig } from "../types.ts";

/**
 * Result of the check command
 */
export interface CheckResult {
  /** Whether all checks passed */
  readonly success: boolean;
  /** Diagnostics per target */
  readonly targetResults: readonly TargetCheckResult[];
  /** Total errors across all targets */
  readonly errorCount: number;
  /** Total warnings across all targets */
  readonly warningCount: number;
  /** Check duration in milliseconds */
  readonly duration: number;
}

/**
 * Result of checking a single target
 */
export interface TargetCheckResult {
  /** The target that was checked */
  readonly target: string;
  /** Whether this target passed */
  readonly success: boolean;
  /** Diagnostics for this target */
  readonly diagnostics: readonly BuildDiagnostic[];
  /** Error count for this target */
  readonly errorCount: number;
  /** Warning count for this target */
  readonly warningCount: number;
}

/**
 * Options for the check command
 */
export interface CheckOptions {
  /** Configuration to use */
  readonly config: OtsoConfig;
  /** Specific targets to check (default: all) */
  readonly targets?: readonly string[];
  /** Whether to emit output (default: false) */
  readonly emit?: boolean;
  /** Whether to include warnings (default: true) */
  readonly includeWarnings?: boolean;
  /** Whether to use incremental checking */
  readonly incremental?: boolean;
}

/**
 * Runs the check command.
 *
 * This command type-checks the project for each configured target,
 * taking into account @cfg predicates to only check code that would
 * be included for each target.
 *
 * @param args - Parsed CLI arguments
 * @returns Check result with diagnostics
 *
 * TODO: Implement check command:
 * - Load configuration
 * - For each target:
 *   - Create TypeScript program with cfg-ts transformer
 *   - Run type checking
 *   - Collect diagnostics
 * - Aggregate and report results
 */
export async function check(_args: CliArgs): Promise<CheckResult> {
  // TODO: Load project configuration
  // TODO: Determine targets to check
  // TODO: Run check for each target
  // TODO: Aggregate results
  // TODO: Return combined result
  throw new Error("Not implemented: check");
}

/**
 * Runs type checking for a single target.
 *
 * @param target - The target to check
 * @param options - Check options
 * @returns Check result for the target
 *
 * TODO: Implement single-target checking:
 * - Create evaluation context for cfg-ts
 * - Create TypeScript program with transformer
 * - Run diagnostics
 * - Filter to target-relevant diagnostics
 */
export async function checkTarget(
  _target: string,
  _options: CheckOptions,
): Promise<TargetCheckResult> {
  // TODO: Create cfg-ts evaluation context
  // TODO: Create TypeScript CompilerHost
  // TODO: Create Program with transformer
  // TODO: Get semantic diagnostics
  // TODO: Convert to BuildDiagnostic format
  // TODO: Return result
  throw new Error("Not implemented: checkTarget");
}

/**
 * Formats check results for console output.
 *
 * @param result - The check result to format
 * @returns Formatted string for console output
 *
 * TODO: Implement result formatting:
 * - Show per-target summary
 * - List errors and warnings
 * - Show total counts
 * - Use colors for severity
 */
export function formatCheckResult(_result: CheckResult): string {
  // TODO: Format target results
  // TODO: Format diagnostics
  // TODO: Format summary
  throw new Error("Not implemented: formatCheckResult");
}

/**
 * Creates a TypeScript program with cfg-ts transformer for checking.
 *
 * @param files - Files to include in the program
 * @param target - The target to check for
 * @param options - Check options
 * @returns TypeScript Program configured for checking
 *
 * TODO: Implement program creation:
 * - Set up CompilerOptions
 * - Configure cfg-ts transformer
 * - Create and return Program
 */
export function createCheckProgram(
  _files: string[],
  _target: string,
  _options: CheckOptions,
): unknown {
  // TODO: Create CompilerOptions
  // TODO: Create CompilerHost
  // TODO: Add cfg-ts transformer
  // TODO: Create and return Program
  throw new Error("Not implemented: createCheckProgram");
}
