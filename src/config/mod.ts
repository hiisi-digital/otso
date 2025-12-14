/**
 * Configuration system for otso build framework
 *
 * Handles loading, validation, and merging of otso configuration
 * from various sources (otso.config.ts, deno.json, package.json).
 *
 * @module
 */

export { mergeConfigs, mergeWithDefaults } from "./defaults.ts";
export { loadConfig, loadFromDenoJson, loadFromOtsoConfig, loadFromPackageJson } from "./load.ts";
export { validateConfig, validateTargets } from "./validate.ts";

export type { OtsoConfig, OtsoConfigFile, ResolvedConfig } from "./types.ts";
