/**
 * Configuration validation for otso build framework.
 *
 * Validates otso.config.ts, deno.json, and package.json configuration
 * against expected schemas.
 *
 * @module
 */

import type { FeatureConfig, OtsoConfig, OutputConfig, TargetConfig } from "./types.ts";

/**
 * Validation result with errors and warnings
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
}

/**
 * A validation error that prevents the build from proceeding
 */
export interface ValidationError {
  readonly path: string;
  readonly message: string;
  readonly value?: unknown;
}

/**
 * A validation warning that doesn't prevent the build but should be addressed
 */
export interface ValidationWarning {
  readonly path: string;
  readonly message: string;
  readonly suggestion?: string;
}

/**
 * Validates a complete otso configuration.
 *
 * @param config - The configuration object to validate
 * @returns Validation result with errors and warnings
 *
 * TODO: Implement validation logic:
 * - Check required fields (entry, targets)
 * - Validate entry file exists
 * - Validate each target configuration
 * - Validate feature configuration
 * - Validate output configuration
 * - Check for conflicting options
 */
export function validateConfig(_config: OtsoConfig): ValidationResult {
  // TODO: Validate entry field
  // TODO: Validate targets array
  // TODO: Validate features object
  // TODO: Validate output object
  // TODO: Collect all errors and warnings
  // TODO: Return validation result
  throw new Error("Not implemented: validateConfig");
}

/**
 * Validates target configuration.
 *
 * @param target - The target configuration to validate
 * @param index - Index in the targets array (for error messages)
 * @returns Array of validation errors
 *
 * TODO: Implement target validation:
 * - Check target is a valid target ID or TargetConfig object
 * - Validate runtime, platform, architecture if specified
 * - Validate target-specific options
 */
export function validateTargetConfig(
  _target: string | TargetConfig,
  _index: number,
): ValidationError[] {
  // TODO: Check if target is string or object
  // TODO: Validate target ID format
  // TODO: Validate TargetConfig fields
  throw new Error("Not implemented: validateTargetConfig");
}

/**
 * Validates feature configuration.
 *
 * @param features - The feature configuration to validate
 * @returns Array of validation errors
 *
 * TODO: Implement feature validation:
 * - Check enabled is an array of strings
 * - Check disabled is an array of strings
 * - Warn if same feature is in both enabled and disabled
 */
export function validateFeatureConfig(
  _features: FeatureConfig,
): ValidationError[] {
  // TODO: Validate enabled array
  // TODO: Validate disabled array
  // TODO: Check for conflicts
  throw new Error("Not implemented: validateFeatureConfig");
}

/**
 * Validates output configuration.
 *
 * @param output - The output configuration to validate
 * @returns Array of validation errors
 *
 * TODO: Implement output validation:
 * - Check dir is a valid path
 * - Check format is valid ("esm" | "cjs" | "iife")
 * - Validate sourceMaps option
 */
export function validateOutputConfig(
  _output: OutputConfig,
): ValidationError[] {
  // TODO: Validate dir path
  // TODO: Validate format
  // TODO: Validate other output options
  throw new Error("Not implemented: validateOutputConfig");
}

/**
 * Checks if a path is a valid entry file.
 *
 * @param entryPath - The entry file path to check
 * @returns True if the path is a valid entry file
 *
 * TODO: Implement entry validation:
 * - Check file extension (.ts, .tsx, .js, .jsx)
 * - Optionally check if file exists (async version)
 */
export function isValidEntryPath(_entryPath: string): boolean {
  // TODO: Check for valid file extension
  // TODO: Validate path format
  throw new Error("Not implemented: isValidEntryPath");
}

/**
 * Checks if a target ID is valid.
 *
 * @param targetId - The target ID to validate
 * @returns True if the target ID is valid
 *
 * TODO: Validate against known targets:
 * - Runtime: deno, node, bun, browser
 * - Platform: darwin, linux, windows
 * - Architecture: x64, arm64
 * - Composed: node-linux-x64, deno-darwin-arm64, etc.
 */
export function isValidTargetId(_targetId: string): boolean {
  // TODO: Parse target ID
  // TODO: Validate each component
  throw new Error("Not implemented: isValidTargetId");
}

/**
 * Creates an empty validation result (valid with no errors/warnings).
 *
 * @returns A valid ValidationResult with empty errors and warnings
 */
export function createEmptyResult(): ValidationResult {
  return {
    valid: true,
    errors: [],
    warnings: [],
  };
}

/**
 * Merges multiple validation results into one.
 *
 * @param results - The validation results to merge
 * @returns A single ValidationResult combining all errors and warnings
 */
export function mergeResults(...results: ValidationResult[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const result of results) {
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
