#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run

/**
 * @module otso/cli
 *
 * Command-line interface for the otso build framework.
 *
 * Usage:
 *   otso build [--target=<target>] [--clean] [--features=<features>]
 *   otso check [--target=<target>]
 *   otso dev [--target=<target>]
 *   otso clean [--target=<target>]
 *   otso init
 *   otso --help
 *   otso --version
 */

import type { CliArgs, CliCommand } from "./src/types.ts";

/**
 * CLI version (should match deno.json version)
 */
export const VERSION = "0.1.0";

/**
 * CLI help text
 */
export const HELP_TEXT = `
otso - Cross-runtime TypeScript build framework

USAGE:
  otso <command> [options]

COMMANDS:
  build     Build the project for configured targets
  check     Type-check the project with @cfg support
  dev       Watch mode with hot rebuilds
  clean     Remove build output directories
  init      Initialize a new otso project

OPTIONS:
  -t, --target <id>     Build for specific target(s)
  -c, --config <path>   Use a specific config file
  -f, --feature <id>    Enable a feature flag
  --no-feature <id>     Disable a feature flag
  --clean               Clean output before building
  -w, --watch           Enable watch mode
  -v, --verbose         Verbose output
  -q, --quiet           Suppress non-error output
  -h, --help            Show this help message
  --version             Show version number

EXAMPLES:
  otso build
  otso build --target=node --target=deno
  otso build --feature=shimp.fs --clean
  otso check --target=node
  otso dev
  otso clean --target=node

For more information, visit: https://github.com/hiisi-digital/otso
`;

/**
 * Main CLI entry point.
 *
 * Parses arguments and dispatches to the appropriate command handler.
 *
 * TODO: Implement CLI:
 * - Parse command line arguments
 * - Load configuration
 * - Dispatch to command handlers
 * - Handle errors and exit codes
 */
export async function main(args: string[]): Promise<number> {
  // TODO: Parse arguments
  // TODO: Handle --help and --version
  // TODO: Load configuration
  // TODO: Dispatch to command
  // TODO: Return exit code

  const parsedArgs = parseArgs(args);

  if (parsedArgs.command === "help") {
    console.log(HELP_TEXT);
    return 0;
  }

  if (parsedArgs.command === "version") {
    console.log(`otso v${VERSION}`);
    return 0;
  }

  // TODO: Implement command dispatch
  console.error(`Command '${parsedArgs.command}' is not yet implemented.`);
  console.error(`Run 'otso --help' for usage information.`);
  return 1;
}

/**
 * Parses command line arguments into a structured object.
 *
 * @param args - Raw command line arguments
 * @returns Parsed CLI arguments
 *
 * TODO: Implement argument parsing:
 * - Extract command (first positional arg)
 * - Parse flags (--flag, -f)
 * - Parse options (--option=value, --option value)
 * - Handle repeated options (--target=a --target=b)
 */
export function parseArgs(args: string[]): CliArgs {
  // Default to help if no args
  if (args.length === 0) {
    return { command: "help" };
  }

  const firstArg = args[0];

  // Check for --help or -h anywhere
  if (args.includes("--help") || args.includes("-h")) {
    return { command: "help" };
  }

  // Check for --version
  if (args.includes("--version")) {
    return { command: "version" };
  }

  // Determine command
  let command: CliCommand = "help";
  switch (firstArg) {
    case "build":
      command = "build";
      break;
    case "check":
      command = "check";
      break;
    case "dev":
      command = "dev";
      break;
    case "clean":
      command = "clean";
      break;
    case "init":
      command = "init";
      break;
    case "help":
      command = "help";
      break;
    default:
      // Unknown command
      command = "help";
  }

  // TODO: Parse remaining arguments
  const targets: string[] = [];
  const features: string[] = [];
  const noFeatures: string[] = [];
  let config: string | undefined;
  let watch = false;
  let verbose = false;
  let quiet = false;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--target=")) {
      targets.push(arg.slice("--target=".length));
    } else if (arg === "-t" || arg === "--target") {
      if (i + 1 < args.length) {
        targets.push(args[++i]);
      }
    } else if (arg.startsWith("--config=")) {
      config = arg.slice("--config=".length);
    } else if (arg === "-c" || arg === "--config") {
      if (i + 1 < args.length) {
        config = args[++i];
      }
    } else if (arg.startsWith("--feature=")) {
      features.push(arg.slice("--feature=".length));
    } else if (arg === "-f" || arg === "--feature") {
      if (i + 1 < args.length) {
        features.push(args[++i]);
      }
    } else if (arg.startsWith("--no-feature=")) {
      noFeatures.push(arg.slice("--no-feature=".length));
    } else if (arg === "--no-feature") {
      if (i + 1 < args.length) {
        noFeatures.push(args[++i]);
      }
    } else if (arg === "-w" || arg === "--watch") {
      watch = true;
    } else if (arg === "-v" || arg === "--verbose") {
      verbose = true;
    } else if (arg === "-q" || arg === "--quiet") {
      quiet = true;
    }
  }

  return {
    command,
    targets: targets.length > 0 ? targets : undefined,
    config,
    watch,
    verbose,
    quiet,
    features: features.length > 0 ? features : undefined,
    noFeatures: noFeatures.length > 0 ? noFeatures : undefined,
  };
}

/**
 * Dispatches to the appropriate command handler.
 *
 * @param args - Parsed CLI arguments
 * @returns Exit code
 *
 * TODO: Implement dispatch:
 * - Load configuration
 * - Call appropriate command handler
 * - Handle errors
 */
export async function dispatch(_args: CliArgs): Promise<number> {
  // TODO: Implement command dispatch
  throw new Error("Not implemented: dispatch");
}

/**
 * Prints an error message to stderr.
 *
 * @param message - Error message to print
 */
export function printError(message: string): void {
  console.error(`\x1b[31merror:\x1b[0m ${message}`);
}

/**
 * Prints a warning message to stderr.
 *
 * @param message - Warning message to print
 */
export function printWarning(message: string): void {
  console.error(`\x1b[33mwarning:\x1b[0m ${message}`);
}

/**
 * Prints a success message to stdout.
 *
 * @param message - Success message to print
 */
export function printSuccess(message: string): void {
  console.log(`\x1b[32m✓\x1b[0m ${message}`);
}

/**
 * Prints an info message to stdout.
 *
 * @param message - Info message to print
 */
export function printInfo(message: string): void {
  console.log(`\x1b[34minfo:\x1b[0m ${message}`);
}

// Run CLI if this is the main module
if (import.meta.main) {
  const exitCode = await main(Deno.args);
  Deno.exit(exitCode);
}
