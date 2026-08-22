/**
 * @module otso/stage
 *
 * Producing the source tree one distribution is built from.
 *
 * Every `.ts` file goes through cfg-ts with that distribution's target and
 * features, so what lands in the staged tree is the half of the source that
 * target needs and none of the half written for another one. Everything else is
 * copied as it is.
 *
 * The staged tree exists because the authored source is not a thing a compiler
 * will accept. Two declarations of one name under opposite `@cfg` conditions is
 * the pattern the marker is for, and it is a duplicate identifier to
 * TypeScript, which reports it long before any target has been chosen. Stripping
 * first is what makes the file mean what it was written to mean, and it is why
 * `otso check` checks the staged tree rather than the source.
 */

import { join, relative, resolve } from "@std/path";
import { contextFromStrings, transformSource } from "@hiisi/cfg-ts";

import { ALWAYS_EXCLUDED } from "./config.ts";
import type { Distribution, OtsoConfig, StageDiagnostic, StageResult } from "./types.ts";

/** Extensions the transformer is run over. Everything else is copied verbatim. */
const TRANSFORMED_EXTENSIONS: readonly string[] = [".ts", ".tsx", ".mts", ".cts"];

/** The directory staged trees live in, inside the dist directory. */
export const STAGING_DIR_NAME = ".otso";

/**
 * Where the staged tree for `distribution` goes.
 *
 * Two levels below the dist directory, always, so the manifest written into it
 * can point deno-dist back out with a `../..` that does not depend on how deeply
 * the dist directory itself is nested.
 */
export function stagedDirFor(config: OtsoConfig, distribution: Distribution): string {
  return join(config.projectDir, config.distDir, STAGING_DIR_NAME, distribution.name);
}

/** Where the built distribution goes. */
export function outputDirFor(config: OtsoConfig, distribution: Distribution): string {
  return join(config.projectDir, config.distDir, distribution.name);
}

/**
 * Stage the project for one distribution.
 *
 * The staged tree is removed and rewritten each time. An incremental staging
 * would have to know which outputs a source file no longer produces, and a
 * stale file left behind in a tree that is about to be published is a worse
 * failure than the second or so this costs.
 */
export async function stage(
  config: OtsoConfig,
  distribution: Distribution,
): Promise<StageResult> {
  const stagedDir = stagedDirFor(config, distribution);
  await removeIfPresent(stagedDir);
  await Deno.mkdir(stagedDir, { recursive: true });

  const files = await collectFiles(config);
  const context = {
    ...contextFromStrings(distribution.target, [...distribution.features]),
  };

  const results = await Promise.all(files.map(async (rel) => {
    const from = join(config.projectDir, rel);
    const to = join(stagedDir, rel);
    await Deno.mkdir(dirOf(to), { recursive: true });
    if (!isTransformed(rel)) {
      await Deno.copyFile(from, to);
      return { kept: 0, stripped: 0, diagnostics: [] as StageDiagnostic[] };
    }
    const code = await Deno.readTextFile(from);
    try {
      const result = transformSource(code, rel, context);
      await Deno.writeTextFile(to, result.code);
      return {
        kept: result.stats.elementsKept,
        stripped: result.stats.elementsStripped,
        diagnostics: result.diagnostics.map((d): StageDiagnostic => ({
          severity: d.severity,
          message: d.message,
          file: rel,
          line: d.line,
        })),
      };
    } catch (error) {
      // A predicate that will not evaluate is a fact about the source, so it is
      // reported against the file that carries it rather than thrown out of the
      // walk, where it would hide every other file's problems behind the first.
      return {
        kept: 0,
        stripped: 0,
        diagnostics: [{
          severity: "error" as const,
          message: error instanceof Error ? error.message : String(error),
          file: rel,
        }],
      };
    }
  }));

  await writeStagedManifest(distribution, config.projectDir, stagedDir);

  return {
    distribution,
    stagedDir,
    fileCount: files.length,
    kept: results.reduce((sum, r) => sum + r.kept, 0),
    stripped: results.reduce((sum, r) => sum + r.stripped, 0),
    diagnostics: results.flatMap((r) => r.diagnostics),
  };
}

/**
 * Write the manifest the staged tree is built from.
 *
 * Four edits to the project's own. The `dist` block is narrowed to the one
 * distribution being built, so a build of `node` cannot be talked into
 * producing `bun` as well. `distDir` is repointed out of the staging directory,
 * so output lands beside the staged trees rather than inside one. The `otso`
 * block goes, because it is build machinery and nothing downstream of here has
 * any use for it. And any import that names a relative path is made absolute.
 *
 * That last one is not cosmetic. A staged tree sits two directories below the
 * dist directory, so a path that resolved from the project root resolves to
 * nothing from here, and a project that reaches a sibling checkout by path
 * builds fine by hand and fails the moment it is staged. Making them absolute is
 * the only edit that keeps the staged tree meaning what the project meant.
 */
async function writeStagedManifest(
  distribution: Distribution,
  projectDir: string,
  stagedDir: string,
): Promise<void> {
  const path = join(stagedDir, "deno.json");
  const raw = JSON.parse(await Deno.readTextFile(path)) as Record<string, unknown>;
  const dist = raw["dist"] as Record<string, unknown>;
  const staged = {
    ...raw,
    ...(raw["imports"] === undefined
      ? {}
      : { imports: absoluteImports(raw["imports"] as Record<string, string>, projectDir) }),
    dist: { [distribution.name]: dist[distribution.name] },
    distDir: "../..",
  };
  delete (staged as Record<string, unknown>)["otso"];
  await Deno.writeTextFile(path, `${JSON.stringify(staged, null, 2)}\n`);
}

/**
 * An import map whose relative paths survive being moved.
 *
 * Only the entries that name a path are touched. A bare specifier, a `jsr:`,
 * `npm:` or `node:` target, and an absolute path all mean the same thing from
 * anywhere and are left exactly as the project wrote them.
 */
function absoluteImports(
  imports: Readonly<Record<string, string>>,
  projectDir: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [specifier, target] of Object.entries(imports)) {
    out[specifier] = target.startsWith("./") || target.startsWith("../")
      ? resolve(projectDir, target)
      : target;
  }
  return out;
}

/**
 * Every file to be staged, as paths relative to the project root.
 *
 * The dist directory is skipped whatever it is called, which is what stops the
 * walk from copying its own output back into itself.
 */
async function collectFiles(config: OtsoConfig): Promise<string[]> {
  const skip = new Set<string>([
    ...ALWAYS_EXCLUDED,
    ...config.exclude,
    config.distDir.split("/")[0] ?? config.distDir,
  ]);
  const found: string[] = [];
  await walk(config.projectDir, config.projectDir, skip, found);
  return found.sort();
}

async function walk(
  dir: string,
  root: string,
  skip: ReadonlySet<string>,
  into: string[],
): Promise<void> {
  const entries: Deno.DirEntry[] = [];
  for await (const entry of Deno.readDir(dir)) entries.push(entry);
  const directories = entries.filter((e) => e.isDirectory && !skip.has(e.name));
  for (const entry of entries) {
    if (entry.isFile) into.push(relative(root, join(dir, entry.name)));
  }
  await Promise.all(
    directories.map((entry) => walk(join(dir, entry.name), root, skip, into)),
  );
}

function isTransformed(path: string): boolean {
  return TRANSFORMED_EXTENSIONS.some((extension) => path.endsWith(extension));
}

function dirOf(path: string): string {
  const at = path.lastIndexOf("/");
  return at === -1 ? path : path.slice(0, at);
}

async function removeIfPresent(path: string): Promise<void> {
  try {
    await Deno.remove(path, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
}

/** Remove every staged tree, leaving built distributions alone. */
export async function removeStaging(config: OtsoConfig): Promise<void> {
  await removeIfPresent(resolve(config.projectDir, config.distDir, STAGING_DIR_NAME));
}
