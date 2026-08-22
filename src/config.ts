/**
 * @module otso/config
 *
 * Reading a project's configuration out of its `deno.json`.
 *
 * The distribution list is deno-dist's `dist` block, read rather than
 * duplicated. A project that already builds with deno-dist therefore builds
 * with otso without adding anything, and the optional `otso` block only says
 * the two things `dist` has no room for: which target a distribution's `@cfg`
 * predicates are evaluated against, and which features are on while they are.
 *
 * @example
 * ```jsonc
 * {
 *   "dist": {
 *     "node": { "runtime": "node", "plugins": ["deno-to-node"] }
 *   },
 *   "otso": {
 *     "features": ["json"],
 *     "distributions": { "node": { "features": ["fast"] } }
 *   }
 * }
 * ```
 */

import { parse as parseJsonc } from "@std/jsonc";
import { dirname, isAbsolute, join, resolve } from "@std/path";
import { featureId } from "@hiisi/ft-flags";
import type { FeatureId } from "@hiisi/ft-flags";
import { resolveTarget, targetId } from "@hiisi/tgts";
import type { TargetId } from "@hiisi/tgts";

import { ConfigError } from "./types.ts";
import type { Distribution, OtsoConfig } from "./types.ts";

/**
 * The manifest names otso looks for, in the order it prefers them.
 *
 * These are deno's own names and nothing else belongs here. The list used to
 * begin with `deno.local.json`, a private convention for resolving siblings
 * that are not published yet, which put one workspace's habit inside a tool
 * that has no business knowing it. That convention is gone: a `links` block in
 * `deno.json` does the same job in the file deno already reads, so a project
 * with unpublished dependencies stages correctly with no second manifest and
 * no name for otso to special-case.
 */
export const CONFIG_FILE_NAMES = ["deno.json", "deno.jsonc"] as const;

/** Where distributions land when the manifest does not say. */
export const DEFAULT_DIST_DIR = "target";

/**
 * Directories never staged, whatever the configuration says.
 *
 * The dist directory is on this list for a reason worth stating: staging copies
 * the project into a directory underneath it, so a walk that did not skip it
 * would copy its own output, and then that copy's copy.
 */
export const ALWAYS_EXCLUDED: readonly string[] = [".git", "node_modules"];

/** Overrides a caller can apply on top of what the manifest says. */
export interface ConfigOverrides {
  /** Features turned on for every distribution. */
  readonly features?: readonly string[];
  /** Features turned off for every distribution, after everything else. */
  readonly noFeatures?: readonly string[];
  /** Keep only these distributions. Empty or absent keeps all of them. */
  readonly only?: readonly string[];
}

/**
 * Find the manifest for `startDir`, walking up until one turns up.
 *
 * @returns The absolute path to the manifest, or undefined at the filesystem root.
 */
export async function findManifest(startDir: string): Promise<string | undefined> {
  let dir = resolve(startDir);
  for (;;) {
    // deno-lint-ignore no-await-in-loop -- each step decides whether there is a next one
    const found = await firstExisting(dir);
    if (found !== undefined) return found;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

async function firstExisting(dir: string): Promise<string | undefined> {
  const candidates = CONFIG_FILE_NAMES.map((name) => join(dir, name));
  const found = await Promise.all(
    candidates.map(async (path) => [path, await isFile(path)] as const),
  );
  return found.find(([, ok]) => ok)?.[0];
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isFile;
  } catch {
    return false;
  }
}

/**
 * Load the configuration for the project at or above `projectDir`.
 *
 * @throws {ConfigError} When no manifest is found, when it will not parse, or
 * when it declares a target or a feature that does not exist.
 */
export async function loadConfig(
  projectDir: string,
  overrides: ConfigOverrides = {},
): Promise<OtsoConfig> {
  const manifest = await findManifest(projectDir);
  if (manifest === undefined) {
    throw new ConfigError(
      `no ${CONFIG_FILE_NAMES.join(" or ")} found in ${
        resolve(projectDir)
      } or any directory above it`,
    );
  }
  const text = await Deno.readTextFile(manifest);
  return parseConfig(text, dirname(manifest), overrides);
}

/**
 * Read a manifest's text into a configuration.
 *
 * Separate from {@link loadConfig} so the parsing can be tested without a
 * directory on disk, and so an embedder holding the text already does not have
 * to write it out to use this.
 */
export function parseConfig(
  text: string,
  projectDir: string,
  overrides: ConfigOverrides = {},
): OtsoConfig {
  const raw = parseManifest(text);
  const distDir = readDistDir(raw);
  const otso = asRecord(raw["otso"]) ?? {};
  const globalFeatures = readFeatureList(otso["features"], "otso.features");
  const perDistribution = asRecord(otso["distributions"]) ?? {};

  const dist = asRecord(raw["dist"]);
  if (dist === undefined || Object.keys(dist).length === 0) {
    throw new ConfigError(
      "no distributions declared. Add a `dist` block naming at least one, for example " +
        '`"dist": { "node": { "runtime": "node", "plugins": ["deno-to-node"] } }`',
      "dist",
    );
  }

  const wanted = new Set(overrides.only ?? []);
  const names = Object.keys(dist).filter((name) => wanted.size === 0 || wanted.has(name));
  const unknown = [...wanted].filter((name) => !(name in dist));
  if (unknown.length > 0) {
    throw new ConfigError(
      `no distribution named ${unknown.join(", ")}. The manifest declares ${
        Object.keys(dist).join(", ")
      }`,
      "dist",
    );
  }

  const off = new Set(readFeatureList(overrides.noFeatures ?? [], "--no-feature"));
  const on = readFeatureList(overrides.features ?? [], "--feature");

  const distributions = names.map((name): Distribution => {
    const entry = asRecord(dist[name]) ?? {};
    const own = asRecord(perDistribution[name]) ?? {};
    const target = readTarget(own["target"] ?? entry["runtime"], name);
    const features = new Set<FeatureId>([
      ...globalFeatures,
      ...readFeatureList(own["features"], `otso.distributions.${name}.features`),
      ...on,
    ]);
    for (const feature of off) features.delete(feature);
    return { name, target, features };
  });

  return {
    projectDir: resolve(projectDir),
    distDir,
    distributions,
    exclude: readStringList(otso["exclude"], "otso.exclude"),
  };
}

function parseManifest(text: string): Record<string, unknown> {
  let raw: unknown;
  try {
    raw = parseJsonc(text);
  } catch (error) {
    throw new ConfigError(`the manifest will not parse: ${String(error)}`);
  }
  const record = asRecord(raw);
  if (record === undefined) throw new ConfigError("the manifest is not an object");
  return record;
}

function readDistDir(raw: Record<string, unknown>): string {
  const value = raw["distDir"];
  if (value === undefined) return DEFAULT_DIST_DIR;
  if (typeof value !== "string" || value.trim() === "") {
    throw new ConfigError("distDir must be a non-empty string", "distDir");
  }
  if (isAbsolute(value)) {
    // deno-dist refuses an absolute distDir, so refusing it here too puts the
    // complaint next to the line that caused it rather than several steps later.
    throw new ConfigError("distDir must be relative to the project", "distDir");
  }
  return value;
}

function readTarget(value: unknown, distribution: string): TargetId {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ConfigError(
      `distribution "${distribution}" names no target. Give it a \`runtime\` in the dist block, ` +
        `or a \`target\` under otso.distributions.${distribution}`,
      `dist.${distribution}.runtime`,
    );
  }
  try {
    const id = targetId(value);
    resolveTarget(id);
    return id;
  } catch (error) {
    throw new ConfigError(
      `distribution "${distribution}": ${error instanceof Error ? error.message : String(error)}`,
      `dist.${distribution}.runtime`,
    );
  }
}

function readFeatureList(value: unknown, field: string): FeatureId[] {
  return readStringList(value, field).map((name) => {
    try {
      return featureId(name);
    } catch (error) {
      throw new ConfigError(
        error instanceof Error ? error.message : String(error),
        field,
      );
    }
  });
}

function readStringList(value: unknown, field: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new ConfigError("must be an array of strings", field);
  }
  return value as string[];
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}
