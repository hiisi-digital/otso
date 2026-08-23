/**
 * @module @hiisi/otso
 *
 * Build one TypeScript codebase into a distribution for deno, node and bun,
 * with the parts each runtime does not need removed rather than shipped.
 *
 * The work splits in two. Where the three runtimes differ and a shared library
 * can cover the difference, use the shared library and write the code once.
 * Where it cannot, mark the alternatives with `@cfg` from `@hiisi/cfg-ts` and
 * otso keeps the one that belongs in each build, the way `#[cfg]` does in Rust.
 * Packaging the result is `@hiisi/deno-dist`, which otso calls rather than
 * reimplements.
 *
 * @example
 * ```ts
 * import { build, loadConfig } from "@hiisi/otso";
 *
 * const config = await loadConfig(".");
 * const result = await build(config);
 * for (const target of result.targets) {
 *   console.log(target.distribution.name, target.success ? "ok" : target.output);
 * }
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export type {
  BuildResult,
  BuildTargetResult,
  CheckResult,
  CheckTargetResult,
  CliArgs,
  CliCommand,
  Distribution,
  OtsoConfig,
  StageDiagnostic,
  StageResult,
} from "./src/types.ts";

export { BuildError, ConfigError } from "./src/types.ts";

// =============================================================================
// Configuration
// =============================================================================

export {
  ALWAYS_EXCLUDED,
  CONFIG_FILE_NAMES,
  DEFAULT_DIST_DIR,
  findManifest,
  loadConfig,
  parseConfig,
} from "./src/config.ts";

export type { ConfigOverrides } from "./src/config.ts";

// =============================================================================
// Staging
// =============================================================================

export { outputDirFor, removeStaging, stage, stagedDirFor, STAGING_DIR_NAME } from "./src/stage.ts";

// =============================================================================
// Commands
// =============================================================================

export { build, buildOne } from "./src/build.ts";
export type { BuildOptions } from "./src/build.ts";

export { check, checkOne, entryPoints } from "./src/check.ts";

export { clean, cleanTargetFor } from "./src/clean.ts";
export type { CleanResult } from "./src/clean.ts";

export { buildDistribution, denoDistCli } from "./src/dist.ts";
// `buildDistribution` returns one of these, so a consumer that wants to name
// what it got back needs the type. It was reachable only inside the package,
// which made the return type unspellable from outside.
export type { CommandResult } from "./src/process.ts";

// =============================================================================
// Output
// =============================================================================

export {
  COLORS,
  createLogger,
  formatDuration,
  formatMessage,
  formatSize,
  LOG_LEVELS,
  shouldLog,
} from "./src/utils/logger.ts";

export type { Logger, LoggerOptions, LogLevel } from "./src/utils/logger.ts";

// =============================================================================
// CLI
// =============================================================================

export { HELP_TEXT, main, parseArgs, VERSION } from "./cli.ts";
