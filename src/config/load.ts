/**
 * Configuration loading for otso build framework
 *
 * Loads build configuration from various sources:
 * - otso.config.ts (primary)
 * - deno.json (otso field)
 * - package.json (otso field)
 * - CLI arguments
 * - Environment variables
 *
 * @module
 */

import type { OtsoConfig, ResolvedConfig } from "./types.ts";

/**
 * Configuration file names to search for, in priority order.
 */
export const CONFIG_FILE_NAMES = [
  "otso.config.ts",
  "otso.config.js",
  "otso.config.mjs",
] as const;

/**
 * JSON config files that may contain an "otso" field.
 */
export const JSON_CONFIG_FILES = ["deno.json", "package.json"] as const;

/**
 * Loads otso configuration from the project directory.
 *
 * Searches for configuration in this order:
 * 1. otso.config.ts / otso.config.js
 * 2. deno.json "otso" field
 * 3. package.json "otso" field
 * 4. Default configuration
 *
 * @param projectDir - The project root directory
 * @returns The loaded configuration
 *
 * TODO: Implement configuration loading:
 * - Search for config files in priority order
 * - Dynamically import TypeScript config
 * - Parse JSON configs
 * - Merge with defaults
 */
export async function loadConfig(_projectDir: string): Promise<ResolvedConfig> {
  // TODO: Search for otso.config.ts first
  // TODO: Try deno.json next
  // TODO: Try package.json next
  // TODO: Fall back to defaults
  // TODO: Validate loaded config
  // TODO: Return resolved config
  throw new Error("Not implemented: loadConfig");
}

/**
 * Loads configuration from an otso.config.ts file.
 *
 * @param configPath - Path to the config file
 * @returns The loaded configuration or null if not found
 *
 * TODO: Implement TypeScript config loading:
 * - Dynamic import the config file
 * - Handle default export
 * - Handle named export
 * - Validate structure
 */
export async function loadTsConfig(
  _configPath: string,
): Promise<OtsoConfig | null> {
  // TODO: Check if file exists
  // TODO: Dynamic import
  // TODO: Extract config from exports
  // TODO: Return config or null
  throw new Error("Not implemented: loadTsConfig");
}

/**
 * Loads configuration from a JSON file (deno.json or package.json).
 *
 * @param jsonPath - Path to the JSON file
 * @returns The otso configuration from the file or null
 *
 * TODO: Implement JSON config loading:
 * - Read and parse JSON file
 * - Extract "otso" field if present
 * - Return null if field doesn't exist
 */
export async function loadJsonConfig(
  _jsonPath: string,
): Promise<OtsoConfig | null> {
  // TODO: Read JSON file
  // TODO: Parse JSON
  // TODO: Extract "otso" field
  // TODO: Return config or null
  throw new Error("Not implemented: loadJsonConfig");
}

/**
 * Finds the project root directory.
 *
 * Searches upward from the current directory for common project markers:
 * - deno.json
 * - package.json
 * - otso.config.ts
 *
 * @param startDir - Directory to start searching from
 * @returns The project root directory or null if not found
 *
 * TODO: Implement project root detection
 */
export async function findProjectRoot(
  _startDir?: string,
): Promise<string | null> {
  // TODO: Start from startDir or cwd
  // TODO: Search upward for project markers
  // TODO: Return first directory containing a marker
  throw new Error("Not implemented: findProjectRoot");
}

/**
 * Merges CLI arguments into configuration.
 *
 * @param config - Base configuration
 * @param args - CLI arguments to merge
 * @returns Configuration with CLI overrides applied
 *
 * TODO: Implement CLI argument merging:
 * - Parse CLI arguments
 * - Override corresponding config values
 * - Handle array values (append vs replace)
 */
export function mergeCliArgs(
  _config: OtsoConfig,
  _args: string[],
): OtsoConfig {
  // TODO: Parse relevant CLI arguments
  // TODO: Override config values
  // TODO: Return merged config
  throw new Error("Not implemented: mergeCliArgs");
}

/**
 * Merges environment variables into configuration.
 *
 * Environment variables are prefixed with OTSO_.
 * Examples:
 * - OTSO_TARGET=deno
 * - OTSO_FEATURES=shimp.fs,shimp.env
 *
 * @param config - Base configuration
 * @returns Configuration with environment overrides applied
 *
 * TODO: Implement environment variable merging
 */
export function mergeEnvVars(_config: OtsoConfig): OtsoConfig {
  // TODO: Scan for OTSO_* environment variables
  // TODO: Parse and apply to config
  // TODO: Return merged config
  throw new Error("Not implemented: mergeEnvVars");
}
