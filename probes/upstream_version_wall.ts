/**
 * The wall this package is standing behind, and the two one-line fixes for it.
 *
 * `@hiisi/cfg-ts` declares `jsr:@hiisi/ft-flags@^0.2.0`. No such version exists:
 * the checkout beside it is `0.1.2` and so is the newest on jsr. Nothing that
 * imports cfg-ts resolves, which is every module in otso that does any work, so
 * otso's own suite cannot run and neither can cfg-ts's.
 *
 * This probe shows the wall, then shows both candidate fixes clearing it, on
 * copies, so nothing in the sibling checkouts is touched. Run it with:
 *
 * ```bash
 * deno run -A probes/upstream_version_wall.ts
 * ```
 *
 * It is here because the claim "otso is blocked on one number in a sibling
 * repo" is worth being able to re-run rather than take on trust, and because
 * whoever lands the fix needs to know which of the two repos it belongs in.
 *
 * Delete this file once the fix lands. It describes a state, not a design.
 */

import { join } from "@std/path";

const SIBLINGS = "/Users/orgrinrt/Dev/clause-work/patchwork";

interface Outcome {
  readonly name: string;
  readonly ok: boolean;
  readonly tail: string;
}

async function run(cmd: string[], cwd: string): Promise<{ ok: boolean; text: string }> {
  const { success, stdout, stderr } = await new Deno.Command(cmd[0] as string, {
    args: cmd.slice(1),
    cwd,
    stdout: "piped",
    stderr: "piped",
  }).output();
  const decoder = new TextDecoder();
  return { ok: success, text: decoder.decode(stdout) + decoder.decode(stderr) };
}

async function copyPackage(name: string, into: string): Promise<string> {
  const dest = join(into, name);
  await Deno.mkdir(into, { recursive: true });
  await new Deno.Command("cp", { args: ["-R", join(SIBLINGS, name), dest] }).output();
  await Deno.remove(join(dest, ".git"), { recursive: true }).catch(() => {});
  return dest;
}

async function editJson(
  path: string,
  edit: (value: Record<string, unknown>) => void,
): Promise<void> {
  const value = JSON.parse(await Deno.readTextFile(path)) as Record<string, unknown>;
  edit(value);
  await Deno.writeTextFile(path, JSON.stringify(value, null, 2));
}

/** Point a cfg-ts copy's local config at the checkouts it should resolve against. */
async function linkAgainst(cfgTs: string, tgts: string, ftFlags: string): Promise<void> {
  await editJson(join(cfgTs, "deno.json"), (c) => {
    c["links"] = [tgts, ftFlags];
  });
}

async function main(): Promise<void> {
  const work = await Deno.makeTempDir({ prefix: "otso_wall_" });
  const outcomes: Outcome[] = [];
  try {
    // The case that must fail. If this passes, the wall is gone and this whole
    // probe, plus the report that cites it, is describing something that is no
    // longer true.
    {
      const cfgTs = await copyPackage("cfg-ts", join(work, "asis"));
      const tgts = await copyPackage("tgts", join(work, "asis"));
      const ftFlags = await copyPackage("ft-flags", join(work, "asis"));
      await linkAgainst(cfgTs, tgts, ftFlags);
      const { ok, text } = await run(["deno", "task", "check:local"], cfgTs);
      outcomes.push({ name: "as it stands (must fail)", ok, tail: lastLines(text, 2) });
    }

    // Fix A, in cfg-ts: ask for the version that exists.
    {
      const cfgTs = await copyPackage("cfg-ts", join(work, "fixA"));
      const tgts = await copyPackage("tgts", join(work, "fixA"));
      const ftFlags = await copyPackage("ft-flags", join(work, "fixA"));
      for (const file of ["deno.json"]) {
        // deno-lint-ignore no-await-in-loop -- two files, and order keeps the failure readable
        await editJson(join(cfgTs, file), (c) => {
          const imports = c["imports"] as Record<string, string>;
          imports["@hiisi/ft-flags"] = "jsr:@hiisi/ft-flags@^0.1.2";
        });
      }
      await linkAgainst(cfgTs, tgts, ftFlags);
      const { ok, text } = await run(["deno", "task", "check:local"], cfgTs);
      outcomes.push({ name: "fix A: cfg-ts asks for ^0.1.2", ok, tail: lastLines(text, 2) });
    }

    // Fix B, in ft-flags: be the version cfg-ts and tgts were bumped for.
    // cfg-ts is untouched here.
    {
      const cfgTs = await copyPackage("cfg-ts", join(work, "fixB"));
      const tgts = await copyPackage("tgts", join(work, "fixB"));
      const ftFlags = await copyPackage("ft-flags", join(work, "fixB"));
      await editJson(join(ftFlags, "deno.json"), (c) => {
        c["version"] = "0.2.0";
      });
      await linkAgainst(cfgTs, tgts, ftFlags);
      const { ok, text } = await run(["deno", "task", "check:local"], cfgTs);
      outcomes.push({ name: "fix B: ft-flags becomes 0.2.0", ok, tail: lastLines(text, 2) });
    }

    for (const outcome of outcomes) {
      console.log(`${outcome.ok ? "PASS" : "FAIL"}  ${outcome.name}`);
      console.log(`      ${outcome.tail.replaceAll("\n", "\n      ")}`);
    }

    const asIs = outcomes[0];
    const fixes = outcomes.slice(1);
    console.log();
    if (asIs?.ok === true) {
      console.log("the wall is gone: cfg-ts resolves as it stands, so delete this probe");
    } else if (fixes.every((f) => f.ok)) {
      console.log("the wall is real and both fixes clear it; either repo can carry the change");
    } else {
      console.log("a fix that was expected to clear the wall did not; read the tails above");
    }
  } finally {
    await Deno.remove(work, { recursive: true });
  }
}

function lastLines(text: string, count: number): string {
  return text.trimEnd().split("\n").slice(-count).join("\n");
}

await main();
