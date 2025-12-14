/**
 * Build pipeline for otso
 *
 * Orchestrates the complete build process including:
 * - Source file discovery
 * - Configuration resolution
 * - Transformer chain execution
 * - Output generation
 *
 * @module
 */

import type { FeatureId } from "@hiisi/ft-flags";
import type { TargetId } from "@hiisi/tgts";
import type {
    BuildResult,
    OtsoConfig,
    OtsoPlugin,
    PluginContext,
    SourceFile,
    TargetBuildResult,
} from "../types.ts";

/**
 * Build pipeline options
 */
export interface PipelineOptions {
  /** The project root directory */
  readonly projectDir: string;
  /** The resolved configuration */
  readonly config: OtsoConfig;
  /** Whether to emit output files */
  readonly emit?: boolean;
  /** Whether to run in watch mode */
  readonly watch?: boolean;
  /** Logger for build output */
  readonly logger?: unknown;
}

/**
 * Pipeline state during a build
 */
export interface PipelineState {
  /** Current target being built */
  readonly target: TargetId;
  /** Enabled features for this target */
  readonly features: ReadonlySet<FeatureId>;
  /** Source files being processed */
  readonly files: SourceFile[];
  /** Registered plugins */
  readonly plugins: OtsoPlugin[];
  /** Build diagnostics collected */
  readonly diagnostics: unknown[];
}

/**
 * Creates a new build pipeline.
 *
 * @param options - Pipeline configuration options
 * @returns A build pipeline instance
 *
 * TODO: Implement pipeline creation:
 * - Initialize pipeline state
 * - Load and validate configuration
 * - Set up plugin chain
 * - Prepare file discovery
 */
export function createPipeline(_options: PipelineOptions): BuildPipeline {
  // TODO: Initialize pipeline state
  // TODO: Validate configuration
  // TODO: Set up plugins
  throw new Error("Not implemented: createPipeline");
}

/**
 * Build pipeline interface
 */
export interface BuildPipeline {
  /** Run the build for all configured targets */
  build(): Promise<BuildResult>;
  /** Run the build for a specific target */
  buildTarget(target: TargetId): Promise<TargetBuildResult>;
  /** Add a plugin to the pipeline */
  addPlugin(plugin: OtsoPlugin): void;
  /** Get the current pipeline state */
  getState(): PipelineState;
}

/**
 * Runs the complete build pipeline for all targets.
 *
 * @param options - Build options
 * @returns Build result with success status and diagnostics
 *
 * TODO: Implement build execution:
 * - Discover source files
 * - For each target:
 *   - Create evaluation context
 *   - Run plugin setup hooks
 *   - Apply transformers (cfg-ts, shimp, onlywhen)
 *   - Run plugin post-transform hooks
 *   - Emit output files
 *   - Run plugin teardown hooks
 * - Collect and return results
 */
export async function runBuild(_options: PipelineOptions): Promise<BuildResult> {
  // TODO: Discover source files from entry points
  // TODO: Create build context
  // TODO: Run build for each target (parallel or sequential)
  // TODO: Collect results
  // TODO: Return combined build result
  throw new Error("Not implemented: runBuild");
}

/**
 * Runs the build pipeline for a single target.
 *
 * @param target - The target to build for
 * @param options - Build options
 * @returns Build result for the target
 *
 * TODO: Implement single-target build:
 * - Create target-specific context
 * - Apply transformers for this target
 * - Emit files to target output directory
 */
export async function buildForTarget(
  _target: TargetId,
  _options: PipelineOptions,
): Promise<TargetBuildResult> {
  // TODO: Create evaluation context for target
  // TODO: Copy source files for transformation
  // TODO: Apply cfg-ts transformer
  // TODO: Apply shimp transformer
  // TODO: Apply onlywhen transformer
  // TODO: Run plugins
  // TODO: Emit output files
  // TODO: Return target build result
  throw new Error("Not implemented: buildForTarget");
}

/**
 * Discovers source files from entry points.
 *
 * @param entryPoints - Array of entry point paths
 * @param projectDir - Project root directory
 * @returns Array of discovered source files
 *
 * TODO: Implement source discovery:
 * - Resolve entry point paths
 * - Follow import graph
 * - Filter to project files (not external dependencies)
 */
export async function discoverSources(
  _entryPoints: string[],
  _projectDir: string,
): Promise<SourceFile[]> {
  // TODO: Resolve each entry point
  // TODO: Parse imports recursively
  // TODO: Build list of all source files
  // TODO: Read file contents
  throw new Error("Not implemented: discoverSources");
}

/**
 * Applies all transformers to a source file.
 *
 * @param file - The source file to transform
 * @param context - Plugin context with target and feature info
 * @returns Transformed source file
 *
 * TODO: Implement transformer chain:
 * 1. cfg-ts transformer (conditional compilation)
 * 2. shimp transformer (cross-runtime shims)
 * 3. onlywhen transformer (runtime detection)
 * 4. Custom plugin transforms
 */
export async function applyTransformers(
  _file: SourceFile,
  _context: PluginContext,
): Promise<SourceFile> {
  // TODO: Apply cfg-ts transformer
  // TODO: Apply shimp transformer
  // TODO: Apply onlywhen transformer
  // TODO: Apply plugin transforms
  // TODO: Return transformed file
  throw new Error("Not implemented: applyTransformers");
}

/**
 * Emits transformed files to the output directory.
 *
 * @param files - Transformed source files
 * @param outDir - Output directory path
 * @param options - Output options (format, sourcemaps, etc.)
 * @returns Array of emitted file paths
 *
 * TODO: Implement file emission:
 * - Create output directory if needed
 * - Write each file
 * - Generate source maps if enabled
 * - Handle file extension changes
 */
export async function emitFiles(
  _files: SourceFile[],
  _outDir: string,
  _options?: unknown,
): Promise<string[]> {
  // TODO: Ensure output directory exists
  // TODO: Write each file to output
  // TODO: Handle source maps
  // TODO: Return list of written file paths
  throw new Error("Not implemented: emitFiles");
}

/**
 * Creates a plugin context for a build target.
 *
 * @param target - The target being built
 * @param config - The build configuration
 * @param features - Set of enabled features
 * @returns Plugin context for transformers and plugins
 */
export function createPluginContext(
  _target: TargetId,
  _config: OtsoConfig,
  _features: ReadonlySet<FeatureId>,
): PluginContext {
  // TODO: Build plugin context object
  // TODO: Include logger
  // TODO: Include file manipulation methods
  throw new Error("Not implemented: createPluginContext");
}
