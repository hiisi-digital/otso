/**
 * Default configuration values for otso
 *
 * @module
 */

import type { OtsoConfig, OutputConfig, TargetConfig } from "./types.ts";

/**
 * Default output configuration
 */
export const DEFAULT_OUTPUT_CONFIG: OutputConfig = {
  /** Output directory (relative to project root) */
  dir: "./target",
  /** Module format for output */
  format: "esm",
  /** Whether to generate source maps */
  sourceMaps: true,
  /** Whether to minify output */
  minify: false,
  /** Whether to generate declaration files */
  declarations: true,
};

/**
 * Default target configurations for common runtimes
 */
export const DEFAULT_TARGET_CONFIGS: Record<string, TargetConfig> = {
  deno: {
    runtime: "deno",
    format: "esm",
    // Deno supports TypeScript natively, minimal transformation needed
    transformOptions: {
      preserveDecorators: false,
    },
  },
  node: {
    runtime: "node",
    format: "esm",
    // Node ESM requires .js extensions in imports
    transformOptions: {
      rewriteExtensions: true,
    },
  },
  "node-cjs": {
    runtime: "node",
    format: "cjs",
    // CommonJS for older Node environments
    transformOptions: {
      rewriteExtensions: true,
    },
  },
  bun: {
    runtime: "bun",
    format: "esm",
    transformOptions: {
      preserveDecorators: false,
    },
  },
  browser: {
    runtime: "browser",
    format: "esm",
    // Browser builds typically need bundling
    transformOptions: {
      bundle: true,
    },
  },
};

/**
 * Default feature flags configuration
 */
export const DEFAULT_FEATURES_CONFIG = {
  /** Features enabled by default */
  enabled: [] as string[],
  /** Features explicitly disabled */
  disabled: [] as string[],
  /** Whether to enable all features by default */
  enableAll: false,
};

/**
 * Default configuration for the entire otso build system
 */
export const DEFAULT_CONFIG: OtsoConfig = {
  /** Entry point for the build */
  entry: "./src/mod.ts",
  /** Targets to build for */
  targets: ["deno"],
  /** Output configuration */
  output: DEFAULT_OUTPUT_CONFIG,
  /** Feature flags */
  features: DEFAULT_FEATURES_CONFIG,
  /** Watch mode settings */
  watch: {
    /** Patterns to watch for changes */
    include: ["src/**/*.ts"],
    /** Patterns to ignore */
    exclude: ["**/node_modules/**", "**/target/**"],
    /** Debounce delay in milliseconds */
    debounce: 100,
  },
  /** Build options */
  build: {
    /** Whether to run in parallel */
    parallel: true,
    /** Whether to use incremental builds */
    incremental: true,
    /** Whether to clean output before build */
    clean: false,
  },
};

/**
 * Gets the default configuration, optionally merged with overrides.
 *
 * TODO: Implement deep merging
 *
 * @param overrides - Partial configuration to merge with defaults
 * @returns Complete configuration with defaults applied
 */
export function getDefaultConfig(_overrides?: Partial<OtsoConfig>): OtsoConfig {
  // TODO: Deep merge overrides with DEFAULT_CONFIG
  // TODO: Handle nested objects (output, features, watch, build)
  // TODO: Validate merged config
  throw new Error("Not implemented: getDefaultConfig");
}

/**
 * Gets the default target configuration for a runtime.
 *
 * @param runtime - The runtime name
 * @returns Target configuration or undefined if not predefined
 */
export function getDefaultTargetConfig(runtime: string): TargetConfig | undefined {
  return DEFAULT_TARGET_CONFIGS[runtime];
}
