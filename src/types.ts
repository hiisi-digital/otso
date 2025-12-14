/**
 * @module otso/types
 * Core type definitions for the otso build framework.
 */

import type { FeatureId } from "@hiisi/ft-flags";
import type { TargetId } from "@hiisi/tgts";

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Output format for compiled code.
 */
export type OutputFormat = "esm" | "cjs" | "iife" | "umd";

/**
 * Source map configuration.
 */
export type SourceMapConfig = boolean | "inline" | "external" | "hidden";

/**
 * Otso build configuration.
 */
export interface OtsoConfig {
  /** Entry point(s) for the build */
  readonly entry: string | readonly string[];
  /** Output directory (default: "./target") */
  readonly outDir?: string;
  /** Targets to build for */
  readonly targets: readonly TargetId[];
  /** Feature flags configuration */
  readonly features?: FeatureConfig;
  /** Output configuration */
  readonly output?: OutputConfig;
  /** Plugin configuration */
  readonly plugins?: readonly PluginConfig[];
  /** Watch mode configuration */
  readonly watch?: WatchConfig;
  /** Whether to clean output directory before build */
  readonly clean?: boolean;
  /** TypeScript configuration overrides */
  readonly tsconfig?: string | TsConfigOverrides;
}

/**
 * Feature flags configuration for the build.
 */
export interface FeatureConfig {
  /** Features to enable */
  readonly enabled?: readonly string[];
  /** Features to disable (overrides enabled) */
  readonly disabled?: readonly string[];
  /** Enable all features by default */
  readonly enableAll?: boolean;
}

/**
 * Output configuration.
 */
export interface OutputConfig {
  /** Output format (default: "esm") */
  readonly format?: OutputFormat;
  /** Whether to bundle output */
  readonly bundle?: boolean;
  /** Whether to minify output */
  readonly minify?: boolean;
  /** Source map configuration */
  readonly sourcemap?: SourceMapConfig;
  /** File extension for output files */
  readonly extension?: string;
  /** Whether to preserve directory structure */
  readonly preserveStructure?: boolean;
}

/**
 * Watch mode configuration.
 */
export interface WatchConfig {
  /** Directories to watch */
  readonly paths?: readonly string[];
  /** File patterns to ignore */
  readonly ignore?: readonly string[];
  /** Debounce delay in milliseconds */
  readonly debounce?: number;
  /** Whether to clear console on rebuild */
  readonly clearScreen?: boolean;
}

/**
 * TypeScript configuration overrides.
 */
export interface TsConfigOverrides {
  readonly target?: string;
  readonly module?: string;
  readonly strict?: boolean;
  readonly declaration?: boolean;
  readonly [key: string]: unknown;
}

// =============================================================================
// Plugin Types
// =============================================================================

/**
 * Plugin configuration.
 */
export interface PluginConfig {
  /** Plugin name or path */
  readonly name: string;
  /** Plugin options */
  readonly options?: Readonly<Record<string, unknown>>;
  /** Whether plugin is enabled */
  readonly enabled?: boolean;
}

/**
 * Plugin interface for extending the build pipeline.
 */
export interface OtsoPlugin {
  /** Plugin name for logging/debugging */
  readonly name: string;
  /** Called at the start of the build */
  setup?(context: PluginContext): Promise<void> | void;
  /** Called to transform source files */
  transform?(file: SourceFile, context: PluginContext): Promise<SourceFile | null> | SourceFile | null;
  /** Called after all files are transformed */
  postTransform?(files: SourceFile[], context: PluginContext): Promise<SourceFile[]> | SourceFile[];
  /** Called after build is complete */
  teardown?(context: PluginContext): Promise<void> | void;
}

/**
 * Context provided to plugins during build.
 */
export interface PluginContext {
  /** The current target being built */
  readonly target: TargetId;
  /** The full build configuration */
  readonly config: OtsoConfig;
  /** Enabled features for this build */
  readonly enabledFeatures: ReadonlySet<FeatureId>;
  /** Logger for plugin output */
  readonly logger: Logger;
  /** Add a file to the build */
  addFile(file: SourceFile): void;
  /** Remove a file from the build */
  removeFile(path: string): void;
  /** Emit a diagnostic */
  emitDiagnostic(diagnostic: BuildDiagnostic): void;
}

// =============================================================================
// Source File Types
// =============================================================================

/**
 * A source file in the build.
 */
export interface SourceFile {
  /** File path relative to project root */
  readonly path: string;
  /** File content */
  content: string;
  /** Source map (if any) */
  map?: string;
  /** Whether this file has been transformed */
  transformed?: boolean;
  /** Metadata attached by plugins */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Build Types
// =============================================================================

/**
 * Build result for a single target.
 */
export interface TargetBuildResult {
  /** The target that was built */
  readonly target: TargetId;
  /** Whether the build succeeded */
  readonly success: boolean;
  /** Output directory for this target */
  readonly outDir: string;
  /** Files that were output */
  readonly files: readonly OutputFile[];
  /** Diagnostics from the build */
  readonly diagnostics: readonly BuildDiagnostic[];
  /** Build duration in milliseconds */
  readonly duration: number;
}

/**
 * An output file from the build.
 */
export interface OutputFile {
  /** Output file path */
  readonly path: string;
  /** File size in bytes */
  readonly size: number;
  /** Whether this is a source map */
  readonly isSourceMap?: boolean;
}

/**
 * Complete build result for all targets.
 */
export interface BuildResult {
  /** Whether all builds succeeded */
  readonly success: boolean;
  /** Results per target */
  readonly targets: readonly TargetBuildResult[];
  /** Total build duration in milliseconds */
  readonly duration: number;
}

/**
 * A diagnostic message from the build process.
 */
export interface BuildDiagnostic {
  readonly severity: "error" | "warning" | "info";
  readonly message: string;
  readonly file?: string;
  readonly line?: number;
  readonly column?: number;
  readonly code?: string;
  readonly source?: string;
}

// =============================================================================
// CLI Types
// =============================================================================

/**
 * CLI command type.
 */
export type CliCommand = "build" | "check" | "dev" | "clean" | "init" | "help" | "version";

/**
 * Parsed CLI arguments.
 */
export interface CliArgs {
  /** The command to run */
  readonly command: CliCommand;
  /** Target(s) to build for */
  readonly targets?: readonly string[];
  /** Config file path */
  readonly config?: string;
  /** Enable watch mode */
  readonly watch?: boolean;
  /** Enable verbose output */
  readonly verbose?: boolean;
  /** Enable quiet mode */
  readonly quiet?: boolean;
  /** Additional features to enable */
  readonly features?: readonly string[];
  /** Features to disable */
  readonly noFeatures?: readonly string[];
  /** Positional arguments */
  readonly positional?: readonly string[];
}

// =============================================================================
// Logger Types
// =============================================================================

/**
 * Log level for output filtering.
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

/**
 * Logger interface for build output.
 */
export interface Logger {
  readonly level: LogLevel;
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  success(message: string, ...args: unknown[]): void;
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * Error thrown when configuration is invalid.
 */
export class ConfigError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(`Configuration error${field ? ` (${field})` : ""}: ${message}`);
    this.name = "ConfigError";
  }
}

/**
 * Error thrown when a build fails.
 */
export class BuildError extends Error {
  constructor(
    message: string,
    public readonly target?: TargetId,
    public readonly diagnostics?: readonly BuildDiagnostic[],
  ) {
    super(`Build failed${target ? ` for ${target}` : ""}: ${message}`);
    this.name = "BuildError";
  }
}

/**
 * Error thrown when a CLI command fails.
 */
export class CliError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number = 1,
  ) {
    super(message);
    this.name = "CliError";
  }
}
