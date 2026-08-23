#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-net

/**
 * @module otso/cli
 *
 * The command line front end.
 *
 * ```
 * otso build [<distribution>...] [--feature <id>] [--no-feature <id>]
 * otso check [<distribution>...]
 * otso clean [<distribution>...]
 * ```
 */

import { build } from "./src/build.ts";
import { check } from "./src/check.ts";
import { clean } from "./src/clean.ts";
import { loadConfig } from "./src/config.ts";
import { createLogger, formatDuration } from "./src/utils/logger.ts";
import { ConfigError } from "./src/types.ts";
import type { CliArgs, CliCommand } from "./src/types.ts";

import manifest from "./deno.json" with { type: "json" };

/**
 * The version, read from the manifest rather than repeated here.
 *
 * It used to be a literal kept in step by hand, and it drifted: the manifest
 * said 0.1.1 while `otso --version` said 0.1.0. The test that caught it is
 * still worth keeping, but a value with one source cannot disagree with itself.
 */
export const VERSION: string = manifest.version;

/** What `otso --help` prints. */
export const HELP_TEXT = `otso - cross-runtime TypeScript builds from one source

USAGE:
  otso <command> [distribution...] [options]

COMMANDS:
  build     Strip the source for each distribution and package it
  check     Type-check what each distribution is built from
  clean     Remove built distributions and staged trees

With no distribution named, a command acts on every distribution the
deno.json \`dist\` block declares.

OPTIONS:
  -f, --feature <id>      Turn a feature on for every distribution
      --no-feature <id>   Turn a feature off, whatever the config says
  -C, --dir <path>        Act on the project in <path> (default: .)
      --keep-staged       Leave staged trees in place after a build
  -v, --verbose           Say more
  -q, --quiet             Say nothing but errors
  -h, --help              Print this
      --version           Print the version

EXAMPLES:
  otso build
  otso build node bun
  otso build --feature json --no-feature telemetry
  otso check node
`;

/** Flags taking a value, mapped to the field they fill. */
const VALUE_FLAGS: Readonly<Record<string, "features" | "noFeatures" | "projectDir">> = {
  "-f": "features",
  "--feature": "features",
  "--no-feature": "noFeatures",
  "-C": "projectDir",
  "--dir": "projectDir",
};

/** Flags taking no value. */
const BOOLEAN_FLAGS: Readonly<Record<string, "verbose" | "quiet" | "keepStaged">> = {
  "-v": "verbose",
  "--verbose": "verbose",
  "-q": "quiet",
  "--quiet": "quiet",
  "--keep-staged": "keepStaged",
};

const COMMANDS: readonly CliCommand[] = ["build", "check", "clean", "help", "version"];

/**
 * Read the command line.
 *
 * An argument nothing here recognises is an error rather than something to
 * ignore. A misspelled `--featrue` that is quietly dropped produces a build
 * that runs, succeeds, and is missing whatever that feature guarded, which is
 * the worst of the three available outcomes.
 *
 * @throws {Error} On an unknown command, an unknown flag, or a flag with no value.
 */
export function parseArgs(argv: readonly string[]): CliArgs {
  const args = {
    command: "help" as CliCommand,
    distributions: [] as string[],
    features: [] as string[],
    noFeatures: [] as string[],
    projectDir: ".",
    verbose: false,
    quiet: false,
    keepStaged: false,
  };
  if (argv.length === 0) return args;

  if (argv.includes("-h") || argv.includes("--help")) return { ...args, command: "help" };
  if (argv.includes("--version")) return { ...args, command: "version" };

  const first = argv[0] ?? "";
  if (!COMMANDS.includes(first as CliCommand)) {
    throw new Error(`unknown command "${first}". Try one of ${COMMANDS.join(", ")}`);
  }
  args.command = first as CliCommand;

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i] ?? "";
    const equals = arg.indexOf("=");
    const name = arg.startsWith("--") && equals !== -1 ? arg.slice(0, equals) : arg;
    const inline = arg.startsWith("--") && equals !== -1 ? arg.slice(equals + 1) : undefined;

    const valueField = VALUE_FLAGS[name];
    if (valueField !== undefined) {
      const value = inline ?? argv[++i];
      if (value === undefined || value === "") {
        throw new Error(`${name} needs a value`);
      }
      if (valueField === "projectDir") args.projectDir = value;
      else args[valueField].push(value);
      continue;
    }

    const booleanField = BOOLEAN_FLAGS[name];
    if (booleanField !== undefined) {
      if (inline !== undefined) throw new Error(`${name} takes no value`);
      args[booleanField] = true;
      continue;
    }

    if (arg.startsWith("-")) throw new Error(`unknown option "${arg}"`);
    args.distributions.push(arg);
  }

  return args;
}

/**
 * Run the CLI.
 *
 * @returns The exit code: zero when everything asked for succeeded.
 */
export async function main(argv: readonly string[]): Promise<number> {
  let args: CliArgs;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    console.error("run `otso --help` for usage");
    return 2;
  }

  if (args.command === "help") {
    console.log(HELP_TEXT);
    return 0;
  }
  if (args.command === "version") {
    console.log(`otso ${VERSION}`);
    return 0;
  }

  const log = createLogger({
    level: args.quiet ? "error" : args.verbose ? "debug" : "info",
    prefix: "otso",
  });

  try {
    const config = await loadConfig(args.projectDir, {
      features: args.features,
      noFeatures: args.noFeatures,
      only: args.distributions,
    });
    return await run(args, config, log);
  } catch (error) {
    if (error instanceof ConfigError) {
      log.error(error.message);
      return 2;
    }
    log.error("unexpected failure", error);
    return 1;
  }
}

async function run(
  args: CliArgs,
  config: Awaited<ReturnType<typeof loadConfig>>,
  log: ReturnType<typeof createLogger>,
): Promise<number> {
  if (args.command === "clean") {
    const { removed } = await clean(config);
    for (const dir of removed) log.info(`removed ${dir}`);
    log.success(`cleaned ${removed.length} ${removed.length === 1 ? "directory" : "directories"}`);
    return 0;
  }

  if (args.command === "check") {
    const result = await check(config, {
      onDistribution: (d) => log.info(`checking ${d.name} for ${d.target}`),
    });
    for (const target of result.targets) {
      if (target.success) log.success(`${target.distribution.name} checks clean`);
      else log.error(`${target.distribution.name} does not check:\n${target.output}`);
    }
    return result.success ? 0 : 1;
  }

  const result = await build(config, {
    verbose: args.verbose,
    keepStaged: args.keepStaged,
    onDistribution: (d) =>
      log.info(`building ${d.name} for ${d.target}${describeFeatures(d.features)}`),
  });
  for (const target of result.targets) {
    const { name } = target.distribution;
    if (target.success) {
      log.success(
        `${name} -> ${target.outputDir} (${target.stage.kept} kept, ` +
          `${target.stage.stripped} stripped, ${formatDuration(target.durationMs)})`,
      );
    } else {
      log.error(`${name} failed:\n${target.output}`);
      log.info(`the staged tree is at ${target.stage.stagedDir}`);
    }
  }
  log.info(`${result.targets.length} built in ${formatDuration(result.durationMs)}`);
  return result.success ? 0 : 1;
}

function describeFeatures(features: ReadonlySet<string>): string {
  return features.size === 0 ? "" : ` with ${[...features].sort().join(", ")}`;
}

if (import.meta.main) {
  Deno.exit(await main(Deno.args));
}
