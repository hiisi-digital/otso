/**
 * Per-target build execution
 *
 * Handles building for a single target (runtime/platform/architecture combination).
 * Applies target-specific transformations and outputs to the target subdirectory.
 *
 * @module
 */

import type { TargetId } from "@hiisi/tgts";
import type {
    BuildDiagnostic,
    OtsoConfig,
    OutputFile,
    PluginContext,
    SourceFile,
    TargetBuildResult,
} from "../types.ts";

/**
 * Options for building a single target
 */
export interface TargetBuildOptions {
  /** The target to build for */
  readonly target: TargetId;
  /** The full build configuration */
  readonly config: OtsoConfig;
  /** Source files to process */
  readonly sourceFiles: readonly SourceFile[];
  /** Plugin context for this build */
  readonly pluginContext: PluginContext;
}

/**
 * Builds for a single target.
 *
 * This is the main entry point for per-target builds. It:
 * 1. Creates an evaluation context for the target
 * 2. Runs the @cfg transformer to strip/stub code
 * 3. Applies any target-specific transformations
 * 4. Outputs to target/<target-id>/
 *
 * @param options - Build options for this target
 * @returns Build result for this target
 *
 * TODO: Implement target build:
 * - Create evaluation context with target and enabled features
 * - Run cfg-ts transformer on each source file
 * - Apply target-specific output format transformations
 * - Write output files to target directory
 * - Collect and return diagnostics
 */
export async function buildTarget(
  _options: TargetBuildOptions,
): Promise<TargetBuildResult> {
  // TODO: Create evaluation context for cfg-ts
  // TODO: Transform each source file
  // TODO: Apply output format (esm, cjs, etc.)
  // TODO: Write files to target/<target-id>/
  // TODO: Generate source maps if enabled
  // TODO: Return build result
  throw new Error("Not implemented: buildTarget");
}

/**
 * Transforms source files for a specific target.
 *
 * @param files - Source files to transform
 * @param target - The target to transform for
 * @param config - Build configuration
 * @returns Transformed source files
 *
 * TODO: Implement transformation:
 * - Run cfg-ts transformer
 * - Run shimp transformations if applicable
 * - Run onlywhen transformations
 * - Apply any plugin transformations
 */
export async function transformForTarget(
  _files: SourceFile[],
  _target: TargetId,
  _config: OtsoConfig,
): Promise<SourceFile[]> {
  // TODO: Create transformer with target context
  // TODO: Transform each file
  // TODO: Filter out fully stripped files
  // TODO: Return transformed files
  throw new Error("Not implemented: transformForTarget");
}

/**
 * Gets the output directory for a target.
 *
 * @param target - The target ID
 * @param config - Build configuration
 * @returns The output directory path
 *
 * TODO: Implement output path resolution:
 * - Use config.outDir as base (default: "./target")
 * - Append target ID as subdirectory
 */
export function getTargetOutputDir(
  _target: TargetId,
  _config: OtsoConfig,
): string {
  // TODO: Get base output dir from config
  // TODO: Join with target ID
  // TODO: Return absolute or relative path
  throw new Error("Not implemented: getTargetOutputDir");
}

/**
 * Writes output files to the target directory.
 *
 * @param files - Files to write
 * @param outputDir - Directory to write to
 * @returns Array of written output files with sizes
 *
 * TODO: Implement file writing:
 * - Create output directory if needed
 * - Write each file
 * - Calculate file sizes
 * - Return output file metadata
 */
export async function writeTargetOutput(
  _files: SourceFile[],
  _outputDir: string,
): Promise<OutputFile[]> {
  // TODO: Ensure output directory exists
  // TODO: Write each file
  // TODO: Write source maps if present
  // TODO: Calculate and return file metadata
  throw new Error("Not implemented: writeTargetOutput");
}

/**
 * Cleans the output directory for a target.
 *
 * @param target - The target whose output to clean
 * @param config - Build configuration
 *
 * TODO: Implement clean:
 * - Get target output directory
 * - Remove all files in directory
 * - Optionally remove directory itself
 */
export async function cleanTargetOutput(
  _target: TargetId,
  _config: OtsoConfig,
): Promise<void> {
  // TODO: Get target output dir
  // TODO: Remove directory contents
  throw new Error("Not implemented: cleanTargetOutput");
}

/**
 * Collects diagnostics from transformation for a target.
 *
 * @param transformResults - Results from transformations
 * @returns Array of build diagnostics
 */
export function collectDiagnostics(
  _transformResults: unknown[],
): BuildDiagnostic[] {
  // TODO: Extract diagnostics from each transform result
  // TODO: Add target context to each diagnostic
  // TODO: Return collected diagnostics
  throw new Error("Not implemented: collectDiagnostics");
}
