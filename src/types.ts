/**
 * @module otso/types
 *
 * What otso works with: a project, the distributions it produces, and what each
 * one is built for.
 *
 * The vocabulary is borrowed rather than invented. A target is a `tgts` target
 * and a feature is an `ft-flags` feature, because those are the same two things
 * `@cfg` asks about, and a build that answered them differently would be
 * answering a different question than the source is asking.
 */

import type { FeatureId } from "@hiisi/ft-flags";
import type { TargetId } from "@hiisi/tgts";

// =============================================================================
// Configuration
// =============================================================================

/**
 * One distribution: a name, the target its source is stripped for, and the
 * features that are on while that happens.
 *
 * The name is deno-dist's. It keys the entry in the `dist` block and it names
 * the output directory, so `node` here is `target/node` on disk.
 */
export interface Distribution {
  /** The `dist` block key this was read from. */
  readonly name: string;
  /** The target `@cfg` predicates are evaluated against. */
  readonly target: TargetId;
  /** The features that are on for this distribution. */
  readonly features: ReadonlySet<FeatureId>;
}

/**
 * A project otso can build.
 *
 * There is no entry point here, and that is deliberate: deno-dist reads the
 * `exports` map to find its entries, so naming them again would be a second
 * copy of a fact that is already written down and already used.
 */
export interface OtsoConfig {
  /** Absolute path to the directory holding `deno.json`. */
  readonly projectDir: string;
  /** Where distributions are written, relative to the project. */
  readonly distDir: string;
  /** Every distribution the `dist` block declares. */
  readonly distributions: readonly Distribution[];
  /** Directory names never staged, on top of the ones always skipped. */
  readonly exclude: readonly string[];
}

// =============================================================================
// Results
// =============================================================================

/** What staging one distribution came to. */
export interface StageResult {
  /** The distribution staged. */
  readonly distribution: Distribution;
  /** Absolute path to the staged tree. */
  readonly stagedDir: string;
  /** How many files were written, transformed or copied. */
  readonly fileCount: number;
  /** Declarations kept across every file. */
  readonly kept: number;
  /** Declarations stripped across every file. */
  readonly stripped: number;
  /** Anything the transformer had to say, with the file it said it about. */
  readonly diagnostics: readonly StageDiagnostic[];
}

/** Something the transformer noticed while staging a file. */
export interface StageDiagnostic {
  readonly severity: "error" | "warning" | "info";
  readonly message: string;
  /** Path relative to the project root. */
  readonly file: string;
  readonly line?: number;
}

/** What building one distribution came to. */
export interface BuildTargetResult {
  readonly distribution: Distribution;
  readonly success: boolean;
  /** Absolute path to the built distribution. */
  readonly outputDir: string;
  /** The staging step, which ran whether or not the build after it did. */
  readonly stage: StageResult;
  /** What deno-dist printed, kept so a failure can be read rather than guessed at. */
  readonly output: string;
  readonly durationMs: number;
}

/** What a whole build came to. */
export interface BuildResult {
  readonly success: boolean;
  readonly targets: readonly BuildTargetResult[];
  readonly durationMs: number;
}

/** What checking one distribution came to. */
export interface CheckTargetResult {
  readonly distribution: Distribution;
  readonly success: boolean;
  /** The compiler's own output, verbatim. */
  readonly output: string;
}

/** What a whole check came to. */
export interface CheckResult {
  readonly success: boolean;
  readonly targets: readonly CheckTargetResult[];
}

// =============================================================================
// CLI
// =============================================================================

/** The commands otso answers to. */
export type CliCommand = "build" | "check" | "clean" | "help" | "version";

/** Command line arguments, once read. */
export interface CliArgs {
  readonly command: CliCommand;
  /** Distributions to act on. Empty means all of them. */
  readonly distributions: readonly string[];
  /** Features to turn on for every distribution, on top of the config. */
  readonly features: readonly string[];
  /** Features to turn off, whatever the config says. */
  readonly noFeatures: readonly string[];
  /** Path to the project directory. */
  readonly projectDir: string;
  readonly verbose: boolean;
  readonly quiet: boolean;
  /** Leave the staged trees in place instead of removing them. */
  readonly keepStaged: boolean;
}

// =============================================================================
// Errors
// =============================================================================

/** The project's configuration cannot be used. */
export class ConfigError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(`configuration error${field ? ` (${field})` : ""}: ${message}`);
    this.name = "ConfigError";
  }
}

/** A build failed, for one distribution or for the run. */
export class BuildError extends Error {
  constructor(message: string, public readonly distribution?: string) {
    super(`build failed${distribution ? ` for ${distribution}` : ""}: ${message}`);
    this.name = "BuildError";
  }
}
