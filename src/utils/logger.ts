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
export function createLogger(options: LoggerOptions = {}): Logger {
  const level = options.level ?? "info";
  // Colour is opt-out rather than always-on: piping a build log into a file
  // should not fill it with escape codes. When the caller says nothing, ask the
  // runtime whether stdout is a terminal, and fall back to plain when there is
  // no way to ask, which is every non-Deno runtime today.
  const colors = options.colors ?? isTerminal();
  const out = options.output ?? ((line: string) => console.log(line));
  // `success` is not a level: it is an info-level message the caller wants
  // marked as an outcome. Keeping it out of LogLevel means a threshold of
  // "warn" silences it along with every other info line, which is what someone
  // quieting a build expects. The colour is the only thing that differs.
  const emit = (
    msgLevel: LogLevel,
    message: string,
    args: unknown[],
    tint?: string,
  ) => {
    if (!shouldLog(msgLevel, level)) return;
    const rendered = args.length > 0 ? `${message} ${args.map(render).join(" ")}` : message;
    const line = formatMessage(msgLevel, rendered, { ...options, colors: false });
    out(colors ? `${tint ?? getLevelColor(msgLevel)}${line}${COLORS.reset}` : line);
  };
  return {
    level,
    debug: (m, ...a) => emit("debug", m, a),
    info: (m, ...a) => emit("info", m, a),
    warn: (m, ...a) => emit("warn", m, a),
    error: (m, ...a) => emit("error", m, a),
    success: (m, ...a) => emit("info", m, a, COLORS.green),
  };
}

/** Whether stdout is a terminal, as far as the running runtime will say. */
function isTerminal(): boolean {
  const g = globalThis as {
    Deno?: { stdout?: { isTerminal?: () => boolean } };
    process?: { stdout?: { isTTY?: boolean } };
  };
  if (g.Deno?.stdout?.isTerminal) return g.Deno.stdout.isTerminal();
  if (g.process?.stdout) return g.process.stdout.isTTY === true;
  return false;
}

/** Renders one interpolated argument, keeping objects readable rather than [object Object]. */
function render(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.stack ?? value.message;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    // Cyclic, or something JSON refuses. Say so rather than throwing from a log call.
    return String(value);
  }
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
  level: LogLevel,
  message: string,
  options?: LoggerOptions,
): string {
  const parts: string[] = [];
  if (options?.prefix) parts.push(`[${options.prefix}]`);
  parts.push(`${level.toUpperCase()}`);
  parts.push(message);
  const line = parts.join(" ");
  return options?.colors ? `${getLevelColor(level)}${line}${COLORS.reset}` : line;
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
  if (ms >= 60_000) {
    // A build that takes minutes should say so. Reporting "300.00s" makes the
    // reader do the division, and a watch loop prints this on every rebuild.
    const minutes = Math.floor(ms / 60_000);
    const seconds = (ms % 60_000) / 1000;
    return `${minutes}m ${seconds.toFixed(1)}s`;
  }
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
export function createSpinner(
  message: string,
): { stop: (finalMessage?: string) => void } {
  // No animation. A spinner writes escape codes on a timer, which is noise in a
  // log file and a leaked interval if the caller forgets to stop it. The message
  // is printed once, and stop() prints the outcome; callers get the same
  // information and the contract stays honest about being non-interactive.
  console.log(message);
  return {
    stop(finalMessage?: string): void {
      if (finalMessage) console.log(finalMessage);
    },
  };
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
  total: number,
  width: number = 30,
): { update: (current: number, message?: string) => void; finish: () => void } {
  const filledChar = "=";
  const emptyChar = "-";
  return {
    update(current: number, message?: string): void {
      // A total of zero means there is nothing to be part-way through, so the
      // bar reads complete rather than dividing by zero.
      const ratio = total <= 0 ? 1 : Math.min(1, Math.max(0, current / total));
      const filled = Math.round(ratio * width);
      const bar = filledChar.repeat(filled) + emptyChar.repeat(width - filled);
      const pct = `${Math.round(ratio * 100)}%`.padStart(4);
      console.log(message ? `[${bar}] ${pct} ${message}` : `[${bar}] ${pct}`);
    },
    finish(): void {
      console.log(`[${filledChar.repeat(width)}] 100%`);
    },
  };
}

/**
 * Clears the console output.
 *
 * TODO: Handle different terminal types
 */
export function clearConsole(): void {
  // The ANSI sequence rather than a runtime-specific call, because it is the one
  // thing every terminal understands and needs no capability the tool would
  // otherwise not ask for. On a non-terminal it writes two harmless characters.
  if (!isTerminal()) return;
  console.log("\x1b[2J\x1b[H");
}

/**
 * Default logger instance with info level
 */
export const defaultLogger = createLogger({ level: "info" });
