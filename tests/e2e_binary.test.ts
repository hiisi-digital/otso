// deno-lint-ignore-file no-await-in-loop -- every loop here runs a built
// binary under a runtime, one at a time so the output stays attributable.
/**
 * The other half of what a package can be: a command line tool.
 *
 * A tool differs from a library in two ways that the packaging has to know
 * about, and this file is here to pin both. The first is that a tool's entry
 * point awaits at the top level, which CommonJS cannot express, so the node
 * distribution is built as an ES module only. The second is that a tool has to
 * be installable as a command, which needs a `bin` entry in the manifest and a
 * shebang on the file it names, and neither is produced today. That one is
 * catalogued at the bottom rather than quietly left out.
 *
 * @module
 */

import { assert, assertEquals, assertFalse, assertStringIncludes } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { dirname, fromFileUrl, join } from "@std/path";

import { build } from "../src/build.ts";
import { loadConfig } from "../src/config.ts";

const REPO_ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const BINARY = join(REPO_ROOT, "examples", "binary");

/** Where each runtime's built entry point lands, relative to its distribution. */
const ENTRY: Readonly<Record<string, string>> = {
  node: "esm/cli.js",
  bun: "cli.ts",
  deno: "cli.ts",
};

interface Ran {
  readonly ok: boolean;
  readonly stdout: string;
  readonly stderr: string;
  readonly code: number;
}

async function run(cmd: string, args: readonly string[]): Promise<Ran> {
  const { success, code, stdout, stderr } = await new Deno.Command(cmd, {
    args: [...args],
    stdout: "piped",
    stderr: "piped",
  }).output();
  const decoder = new TextDecoder();
  return { ok: success, code, stdout: decoder.decode(stdout), stderr: decoder.decode(stderr) };
}

async function copyTree(from: string, to: string): Promise<void> {
  await Deno.mkdir(to, { recursive: true });
  for await (const entry of Deno.readDir(from)) {
    const src = join(from, entry.name);
    const dest = join(to, entry.name);
    if (entry.isDirectory) {
      if (entry.name === "target") continue;
      await copyTree(src, dest);
    } else {
      await Deno.copyFile(src, dest);
    }
  }
}

/** Build the tool once and hand every case the same output to look at. */
async function built(): Promise<{ project: string; fixture: string; work: string }> {
  const work = await Deno.makeTempDir({ prefix: "otso_bin_e2e_" });
  const project = join(work, "binary");
  await copyTree(BINARY, project);
  const config = await loadConfig(project);
  const result = await build(config);
  for (const target of result.targets) {
    assert(target.success, `${target.distribution.name} failed:\n${target.output}`);
  }
  // a fixture whose entries are deliberately not in filesystem order, so the
  // sort the tool does is load-bearing rather than incidental
  const fixture = join(work, "listing");
  await Deno.mkdir(join(fixture, "sub"), { recursive: true });
  await Promise.all(
    ["gamma.txt", "alpha.txt", "beta.txt"].map((name) =>
      Deno.writeTextFile(join(fixture, name), "")
    ),
  );
  return { project, fixture, work };
}

describe("a command line tool, built for three runtimes", () => {
  it("runs under each runtime and prints the same bytes", async () => {
    const { project, fixture, work } = await built();
    try {
      const outputs: Record<string, string> = {};
      for (const [runtime, entry] of Object.entries(ENTRY)) {
        const path = join(project, "target", runtime, entry);
        const result = runtime === "deno"
          ? await run(Deno.execPath(), ["run", "-A", path, fixture])
          : await run(runtime, [path, fixture]);
        assert(result.ok, `${runtime} failed:\n${result.stdout}${result.stderr}`);
        outputs[runtime] = result.stdout;
      }
      assertStringIncludes(outputs["node"] ?? "", "alpha.txt");
      assertEquals(outputs["bun"], outputs["node"], "bun disagrees with node");
      assertEquals(outputs["deno"], outputs["node"], "deno disagrees with node");
    } finally {
      await Deno.remove(work, { recursive: true });
    }
  });

  it("exits non-zero with no argument, under each runtime", async () => {
    const { project, work } = await built();
    try {
      for (const [runtime, entry] of Object.entries(ENTRY)) {
        const path = join(project, "target", runtime, entry);
        const result = runtime === "deno"
          ? await run(Deno.execPath(), ["run", "-A", path])
          : await run(runtime, [path]);
        assertEquals(result.code, 2, `${runtime} should exit 2 with no argument`);
        assertStringIncludes(result.stdout, "usage:", runtime);
      }
    } finally {
      await Deno.remove(work, { recursive: true });
    }
  });

  it("builds the node distribution as an es module only", async () => {
    // a tool awaits at the top level of its entry point and CommonJS cannot
    // express that, so asking for both module systems fails the build outright
    const { project, work } = await built();
    try {
      const manifest = JSON.parse(
        await Deno.readTextFile(join(project, "target", "node", "package.json")),
      ) as Record<string, unknown>;
      assertEquals(manifest["main"], undefined, "a script build should not have been emitted");
      const script = await Deno.stat(join(project, "target", "node", "script")).then(() => true)
        .catch(() => false);
      assertFalse(script, "a script (CommonJS) directory should not exist");
    } finally {
      await Deno.remove(work, { recursive: true });
    }
  });

  // Catalogued, not skipped for convenience. The body is real and it fails
  // today, for the npm and bun manifests specifically. Both are generated
  // rather than copied: the node one comes from dnt's `package` block, which
  // deno-dist fills from an allow-list carrying description, license, author,
  // homepage, keywords and repository and nothing else, and the bun one is
  // assembled field by field with no `bin` among them. The deno artifact is a
  // different case and is not asserted here: its manifest is the source's with
  // the build keys deleted, so a declared `bin` survives, and it means nothing
  // either way because deno installs a command from an export rather than from
  // a bin field.
  // Remove the ignore when deno-dist emits one; nothing here needs to change.
  it.ignore("declares a bin entry so the tool installs as a command", async () => {
    const { project, work } = await built();
    try {
      for (const runtime of ["node", "bun"]) {
        const manifest = JSON.parse(
          await Deno.readTextFile(join(project, "target", runtime, "package.json")),
        ) as Record<string, unknown>;
        const bin = manifest["bin"];
        assert(bin !== undefined, `${runtime} manifest carries no bin entry`);
      }
    } finally {
      await Deno.remove(work, { recursive: true });
    }
  });

  // The other half of the same gap. A `bin` entry is only useful if the file it
  // names starts with a shebang naming the runtime that will run it, and a
  // shebang is per-distribution by nature: it has to be the first line and it
  // has to say `node` for the npm package and `bun` for the bun one. Nothing
  // emits one, and no marker on a declaration can, because a shebang is not a
  // declaration. This also belongs to whatever writes the manifest.
  it.ignore("puts a runtime-appropriate shebang on the entry it names", async () => {
    const { project, work } = await built();
    try {
      const expected: Readonly<Record<string, string>> = {
        node: "#!/usr/bin/env node",
        bun: "#!/usr/bin/env bun",
      };
      for (const [runtime, shebang] of Object.entries(expected)) {
        const text = await Deno.readTextFile(
          join(project, "target", runtime, ENTRY[runtime] ?? ""),
        );
        assert(text.startsWith(shebang), `${runtime} entry does not start with ${shebang}`);
      }
    } finally {
      await Deno.remove(work, { recursive: true });
    }
  });
});
