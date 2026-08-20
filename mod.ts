/**
 * @module @hiisi/otso
 *
 * Cross-runtime TypeScript build framework with conditional compilation.
 * Orchestrates @cfg transforms, feature flags, and multi-target builds.
 *
 * @example
 * ```ts
 * import { build, loadConfig } from "@hiisi/otso";
 *
 * const config = await loadConfig("./");
 * const result = await build(config);
 *
 * if (result.success) {
 *   console.log("Build complete!");
 * }
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export type {
    BuildDiagnostic,
    BuildResult,
    CliArgs,
    CliCommand,
    FeatureConfig, Logger, LogLevel, OtsoConfig,
    OtsoPlugin,
    OutputConfig,
    OutputFile,
    OutputFormat,
    PluginConfig,
    PluginContext,
    SourceFile,
    SourceMapConfig,
    TargetBuildResult,
    TsConfigOverrides,
    WatchConfig
} from "./src/types.ts";

export { BuildError, CliError, ConfigError } from "./src/types.ts";

// =============================================================================
// Configuration
// =============================================================================

export {
    findProjectRoot, loadConfig,
    loadJsonConfig,
    loadTsConfig, mergeCliArgs,
    mergeEnvVars
} from "./src/config/load.ts";

export {
    isValidEntryPath,
    isValidTargetId, validateConfig, validateFeatureConfig,
    validateOutputConfig, validateTargetConfig
} from "./src/config/validate.ts";

export {
    DEFAULT_CONFIG,
    DEFAULT_OUTPUT_CONFIG,
    DEFAULT_TARGET_CONFIGS,
    getDefaultConfig,
    getDefaultTargetConfig
} from "./src/config/defaults.ts";

// =============================================================================
// Build Pipeline
// =============================================================================

export {
    applyTransformers, buildForTarget, createPipeline, createPluginContext, discoverSources, emitFiles, runBuild
} from "./src/build/pipeline.ts";

export type { BuildPipeline, PipelineOptions, PipelineState } from "./src/build/pipeline.ts";

export {
    buildTarget, cleanTargetOutput, getTargetOutputDir, transformForTarget, writeTargetOutput
} from "./src/build/target.ts";

export type { TargetBuildOptions } from "./src/build/target.ts";

export {
    cleanAllOutput, cleanOutputDir, ensureDir, getOutputPath, writeFile, writeOutputFiles
} from "./src/build/output.ts";

export type { WriteError, WriteOptions, WriteResult } from "./src/build/output.ts";

// =============================================================================
// Commands
// =============================================================================

export { getExitCode, parseBuildOptions, resolveTargets, runBuildCommand } from "./src/commands/build.ts";
export type { BuildCommandOptions } from "./src/commands/build.ts";

export { check, checkTarget, formatCheckResult } from "./src/commands/check.ts";
export type { CheckOptions, CheckResult, TargetCheckResult } from "./src/commands/check.ts";

export { createWatcher, dev, incrementalRebuild } from "./src/commands/dev.ts";
export type { DevOptions, DevState } from "./src/commands/dev.ts";

export { clean, cleanAll, cleanTarget, listCleanTargets } from "./src/commands/clean.ts";
export type { CleanError, CleanOptions, CleanResult } from "./src/commands/clean.ts";

// =============================================================================
// Utilities
// =============================================================================

export {
    COLORS, createLogger, formatDuration, formatMessage, formatSize,
    LOG_LEVELS, shouldLog
} from "./src/utils/logger.ts";

export type { LoggerOptions } from "./src/utils/logger.ts";

export {
    basename, copyFile, dirname, exists, extname, isAbsolute, isDirectory,
    isFile, joinPath, mkdir, normalizePath, readDir, readTextFile, relativePath, remove, resolvePath, stat,
    walk, writeTextFile
} from "./src/utils/fs.ts";

export type { FileStat, WalkEntry, WalkOptions } from "./src/utils/fs.ts";

// =============================================================================
// CLI
// =============================================================================

export { HELP_TEXT, main, parseArgs, VERSION } from "./cli.ts";

// =============================================================================
// High-level API
// =============================================================================

/**
 * Builds the project with the given configuration.
 *
 * This is the main programmatic entry point for building.
 *
 * @param config - Build configuration
 * @returns Build result with success status
 *
 * TODO: Implement as wrapper around createPipeline and runBuild
 */
export async function build(_config: OtsoConfig): Promise<BuildResult> {
  // TODO: Create pipeline with config
  // TODO: Run build
  // TODO: Return result
  throw new Error("Not implemented: build");
}

// Import for build function signature
import type { BuildResult, OtsoConfig } from "./src/types.ts";
