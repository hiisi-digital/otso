/**
 * Reading the command line.
 *
 * Every flag is checked in both the forms it accepts, because a flag that works
 * as `--feature x` and silently does nothing as `--feature=x` is worse than one
 * that does not exist. The refusals matter as much: a misspelled flag that is
 * ignored produces a build that succeeds and is missing what the flag was for,
 * and nothing downstream can tell that happened.
 *
 * @module
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { dirname, fromFileUrl, join } from "@std/path";

import { HELP_TEXT, parseArgs, VERSION } from "../cli.ts";

const REPO_ROOT = dirname(dirname(fromFileUrl(import.meta.url)));

describe("commands", () => {
  it("reads each command it accepts", () => {
    for (const command of ["build", "check", "clean"] as const) {
      assertEquals(parseArgs([command]).command, command);
    }
  });

  it("asks for help when given nothing", () => {
    assertEquals(parseArgs([]).command, "help");
  });

  it("refuses a command it does not have, rather than falling back to help", () => {
    // the old shape defaulted an unknown command to help, so `otso buidl` printed
    // usage and exited zero, which reads as success in a script
    const error = assertThrows(() => parseArgs(["buidl"]), Error);
    assert(error.message.includes("buidl"), error.message);
  });

  it("takes --help and --version wherever they appear", () => {
    for (const argv of [["--help"], ["build", "--help"], ["build", "node", "-h"]]) {
      assertEquals(parseArgs(argv).command, "help", argv.join(" "));
    }
    for (const argv of [["--version"], ["build", "--version"]]) {
      assertEquals(parseArgs(argv).command, "version", argv.join(" "));
    }
  });

  it("prefers help over version when both are asked for", () => {
    assertEquals(parseArgs(["--version", "--help"]).command, "help");
  });
});

describe("distributions", () => {
  it("collects positional names, in order", () => {
    assertEquals(parseArgs(["build", "node", "bun"]).distributions, ["node", "bun"]);
  });

  it("is empty when none are named, which every command reads as all of them", () => {
    assertEquals(parseArgs(["build"]).distributions, []);
  });

  it("keeps names that turn up after a flag", () => {
    assertEquals(parseArgs(["build", "--verbose", "node"]).distributions, ["node"]);
    assertEquals(parseArgs(["build", "-f", "json", "node"]).distributions, ["node"]);
  });
});

describe("value flags", () => {
  const cases = [
    { flags: ["-f", "--feature"], field: "features" },
    { flags: ["--no-feature"], field: "noFeatures" },
  ] as const;

  it("takes a value as a separate argument and as an inline one", () => {
    for (const { flags, field } of cases) {
      for (const flag of flags) {
        assertEquals(parseArgs(["build", flag, "json"])[field], ["json"], `${flag} json`);
        if (flag.startsWith("--")) {
          assertEquals(parseArgs(["build", `${flag}=json`])[field], ["json"], `${flag}=json`);
        }
      }
    }
  });

  it("accumulates repeats rather than keeping the last", () => {
    assertEquals(parseArgs(["build", "-f", "a", "--feature=b", "-f", "c"]).features, [
      "a",
      "b",
      "c",
    ]);
  });

  it("keeps the two feature lists apart", () => {
    const args = parseArgs(["build", "-f", "on", "--no-feature", "off"]);
    assertEquals(args.features, ["on"]);
    assertEquals(args.noFeatures, ["off"]);
  });

  it("takes the project directory in every form", () => {
    for (const argv of [["build", "-C", "/p"], ["build", "--dir", "/p"], ["build", "--dir=/p"]]) {
      assertEquals(parseArgs(argv).projectDir, "/p", argv.join(" "));
    }
    assertEquals(parseArgs(["build"]).projectDir, ".");
  });

  it("refuses a value flag with nothing after it", () => {
    for (const argv of [["build", "-f"], ["build", "--feature"], ["build", "--dir"]]) {
      assertThrows(() => parseArgs(argv), Error, undefined, argv.join(" "));
    }
  });

  it("refuses an empty inline value", () => {
    assertThrows(() => parseArgs(["build", "--feature="]), Error);
  });
});

describe("boolean flags", () => {
  const flags = [
    { spellings: ["-v", "--verbose"], field: "verbose" },
    { spellings: ["-q", "--quiet"], field: "quiet" },
    { spellings: ["--keep-staged"], field: "keepStaged" },
  ] as const;

  it("is off unless asked for, and on in every spelling", () => {
    for (const { spellings, field } of flags) {
      assertEquals(parseArgs(["build"])[field], false, `${field} default`);
      for (const spelling of spellings) {
        assertEquals(parseArgs(["build", spelling])[field], true, spelling);
      }
    }
  });

  it("refuses a value on a flag that takes none", () => {
    assertThrows(() => parseArgs(["build", "--verbose=yes"]), Error);
  });
});

describe("unknown options", () => {
  it("refuses anything that looks like a flag and is not one", () => {
    for (const argv of [["build", "--featrue=json"], ["build", "-x"], ["build", "--targets"]]) {
      const error = assertThrows(() => parseArgs(argv), Error, undefined, argv.join(" "));
      assert(error.message.includes("unknown option"), error.message);
    }
  });
});

describe("the help text and the version", () => {
  it("names every command it accepts", () => {
    for (const command of ["build", "check", "clean"]) {
      assert(HELP_TEXT.includes(command), `help does not mention ${command}`);
    }
  });

  it("names every flag parseArgs accepts, so the two cannot drift apart", () => {
    const flags = ["-f", "--feature", "--no-feature", "-C", "--dir", "--keep-staged", "-v", "-q"];
    for (const flag of flags) {
      assert(HELP_TEXT.includes(flag), `help does not mention ${flag}`);
    }
  });

  it("describes no command the parser would refuse", () => {
    // a help text listing a command that does not exist is a promise the tool breaks
    const listed = [...HELP_TEXT.matchAll(/^ {2}(\w+) {2,}[A-Z]/gm)].map((m) => m[1] ?? "");
    assert(listed.length > 0, "found no command lines in the help text");
    for (const command of listed) {
      parseArgs([command]);
    }
  });

  it("carries the version the manifest carries", async () => {
    const manifest = JSON.parse(
      await Deno.readTextFile(join(REPO_ROOT, "deno.json")),
    ) as { version: string };
    assertEquals(VERSION, manifest.version);
  });
});
