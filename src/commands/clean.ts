/**
 * Clean command for otso CLI
 *
 * Removes build output directories.
 *
 * @module
 */

import type { CliArgs, OtsoConfig } from "../types.ts";

/**
 * Options for the clean command
 */
export interface CleanOptions {
  /** Only clean specific target(s) */
  readonly targets?: readonly string[];
  /** Clean all targets (default behavior) */
  readonly all?: boolean;
  /** Dry run - show what would be cleaned without actually deleting */
  readonly dryRun?: boolean;
  /** Verbose output */
  readonly verbose?: boolean;
}

/**
 * Result of the clean command
 */
export interface CleanResult {
  /** Whether the clean succeeded */
  readonly success: boolean;
  /** Directories that were cleaned */
  readonly cleaned: readonly string[];
  /** Any errors that occurred */
  readonly errors: readonly CleanError[];
}

/**
 * An error that occurred during cleaning
 */
export interface CleanError {
  readonly path: string;
  readonly message: string;
  readonly cause?: Error;
}

/**
 * Runs the clean command.
 *
 * Removes the target/ directory or specific target subdirectories.
 *
 * @param args - CLI arguments
 * @param config - Build configuration
 * @returns Clean result
 *
 * TODO: Implement clean logic:
 * - Parse targets from args (or clean all if none specified)
 * - Get output directory from config
 * - Remove target directories
 * - Report what was cleaned
 */
export async function clean(
  _args: CliArgs,
  _config: OtsoConfig,
): Promise<CleanResult> {
  // TODO: Determine what to clean (all or specific targets)
  // TODO: Get output directory from config
  // TODO: Remove directories
  // TODO: Report results
  throw new Error("Not implemented: clean");
}

/**
 * Cleans output for a specific target.
 *
 * @param target - The target to clean
 * @param config - Build configuration
 * @returns Whether the clean succeeded
 *
 * TODO: Implement target-specific clean:
 * - Get target output directory
 * - Remove directory contents
 */
export async function cleanTarget(
  _target: string,
  _config: OtsoConfig,
): Promise<boolean> {
  // TODO: Get target output directory
  // TODO: Check if directory exists
  // TODO: Remove directory
  // TODO: Return success status
  throw new Error("Not implemented: cleanTarget");
}

/**
 * Cleans all build output.
 *
 * @param config - Build configuration
 * @returns Whether the clean succeeded
 *
 * TODO: Implement full clean:
 * - Get output directory from config
 * - Remove entire output directory
 */
export async function cleanAll(_config: OtsoConfig): Promise<boolean> {
  // TODO: Get output directory from config
  // TODO: Check if directory exists
  // TODO: Remove directory
  // TODO: Return success status
  throw new Error("Not implemented: cleanAll");
}

/**
 * Lists what would be cleaned without actually cleaning.
 *
 * @param config - Build configuration
 * @param targets - Specific targets to check (or all if not specified)
 * @returns Array of paths that would be cleaned
 *
 * TODO: Implement dry run:
 * - Find all directories that would be removed
 * - Return paths without actually deleting
 */
export async function listCleanTargets(
  _config: OtsoConfig,
  _targets?: readonly string[],
): Promise<string[]> {
  // TODO: Get output directory
  // TODO: List directories that would be cleaned
  // TODO: Return paths
  throw new Error("Not implemented: listCleanTargets");
}
