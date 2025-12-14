/**
 * Logger utilities for otso build framework
 *
 * Provides structured logging with levels, colors, and formatting
 * for build output.
 *
 * @module
 */

import type { Logger, LogLevel } from "../types.ts";

/**
 * Log level priority (lower = more verbose)
 */
export const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

/**
 * ANSI color codes for terminal output
 */
export const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
} as const;

/**
 * Options for creating a logger
 */
export interface LoggerOptions {
  /** Minimum log level to output */
  readonly level?: LogLevel;
  /** Whether to use colors in output */
  readonly colors?: boolean;
  /** Prefix for all log messages */
  readonly prefix?: string;
  /** Custom output function (defaults to console) */
  readonly output?: (message: string) => void;
}

/**
 * Creates a new logger instance.
 *
 * @param options - Logger configuration options
 * @returns A logger instance
 *
 * TODO: Implement logger creation:
 * - Set up log level filtering
 * - Configure color output
 * - Set up output function
 */
export function createLogger(_options?: LoggerOptions): Logger {
  // TODO: Parse options with defaults
  // TODO: Create log functions for each level
  // TODO: Return Logger interface
  throw new Error("Not implemented: createLogger");
}

/**
 * Formats a log message with optional colors and prefix.
 *
 * @param level - The log level
 * @param message - The message to format
 * @param options - Logger options
 * @returns Formatted message string
 *
 * TODO: Implement formatting:
 * - Add timestamp
 * - Add level indicator with color
 * - Add prefix if configured
 */
export function formatMessage(
  _level: LogLevel,
  _message: string,
  _options?: LoggerOptions,
): string {
  // TODO: Build formatted message
  // TODO: Add colors if enabled
  // TODO: Add timestamp and level
  throw new Error("Not implemented: formatMessage");
}

/**
 * Checks if a message at the given level should be logged.
 *
 * @param messageLevel - Level of the message to log
 * @param loggerLevel - Configured level of the logger
 * @returns True if the message should be logged
 */
export function shouldLog(messageLevel: LogLevel, loggerLevel: LogLevel): boolean {
  return LOG_LEVELS[messageLevel] >= LOG_LEVELS[loggerLevel];
}

/**
 * Gets the color for a log level.
 *
 * @param level - The log level
 * @returns ANSI color code for the level
 */
export function getLevelColor(level: LogLevel): string {
  switch (level) {
    case "debug":
      return COLORS.gray;
    case "info":
      return COLORS.blue;
    case "warn":
      return COLORS.yellow;
    case "error":
      return COLORS.red;
    default:
      return COLORS.reset;
  }
}

/**
 * Formats a duration in milliseconds for display.
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string (e.g., "1.23s", "456ms")
 */
export function formatDuration(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${Math.round(ms)}ms`;
}

/**
 * Formats a file size in bytes for display.
 *
 * @param bytes - Size in bytes
 * @returns Formatted size string (e.g., "1.5 KB", "2.3 MB")
 */
export function formatSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return unitIndex === 0 ? `${size} ${units[unitIndex]}` : `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Creates a spinner for long-running operations.
 *
 * @param message - Message to display with the spinner
 * @returns Object with stop() method to stop the spinner
 *
 * TODO: Implement spinner:
 * - Animate spinner characters
 * - Update message
 * - Clear on stop
 */
export function createSpinner(_message: string): { stop: (finalMessage?: string) => void } {
  // TODO: Set up spinner animation
  // TODO: Return stop function
  throw new Error("Not implemented: createSpinner");
}

/**
 * Creates a progress bar for tracking build progress.
 *
 * @param total - Total number of items
 * @param width - Width of the progress bar in characters
 * @returns Object with update() method to update progress
 *
 * TODO: Implement progress bar:
 * - Draw progress bar
 * - Update percentage
 * - Show item count
 */
export function createProgressBar(
  _total: number,
  _width?: number,
): { update: (current: number, message?: string) => void; finish: () => void } {
  // TODO: Set up progress tracking
  // TODO: Return update and finish functions
  throw new Error("Not implemented: createProgressBar");
}

/**
 * Clears the console output.
 *
 * TODO: Handle different terminal types
 */
export function clearConsole(): void {
  // TODO: Clear console based on environment
  throw new Error("Not implemented: clearConsole");
}

/**
 * Default logger instance with info level
 */
export const defaultLogger = createLogger({ level: "info" });
