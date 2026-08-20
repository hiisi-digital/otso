/**
 * Tests for the logger.
 *
 * Every case captures output through the injectable sink rather than the
 * console, so an assertion is about what was written and not about what a
 * reader thought was written.
 *
 * @module
 */

import { assert, assertEquals, assertFalse, assertStringIncludes } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

import {
  COLORS,
  createLogger,
  createProgressBar,
  createSpinner,
  formatDuration,
  formatMessage,
  formatSize,
  LOG_LEVELS,
  shouldLog,
} from "../src/utils/logger.ts";

/**
 * The levels are read off the implementation rather than written out here, so
 * a level added to LOG_LEVELS is swept by these laws without anyone
 * remembering to extend a list. It also keeps this file off the `tgts`
 * dependency chain, which the logger itself does not need.
 */
type LogLevel = keyof typeof LOG_LEVELS;

/** A logger writing into an array, so the test asserts on lines rather than on a stream. */
function capturing(
  options: Parameters<typeof createLogger>[0] = {},
): { log: ReturnType<typeof createLogger>; lines: string[] } {
  const lines: string[] = [];
  const log = createLogger({ colors: false, ...options, output: (l) => lines.push(l) });
  return { log, lines };
}

const LEVELS = Object.keys(LOG_LEVELS) as LogLevel[];

describe("shouldLog", () => {
  it("admits a message at or above the threshold and refuses one below, over every pair", () => {
    for (const msg of LEVELS) {
      for (const threshold of LEVELS) {
        assertEquals(
          shouldLog(msg, threshold),
          LOG_LEVELS[msg] >= LOG_LEVELS[threshold],
          `${msg} against ${threshold}`,
        );
      }
    }
  });

  it("silences everything at the silent threshold except silent itself", () => {
    for (const msg of ["debug", "info", "warn", "error"] as LogLevel[]) {
      assertFalse(shouldLog(msg, "silent"), `${msg} should be silenced`);
    }
  });
});

describe("createLogger", () => {
  it("writes the levels at or above its threshold and drops the rest", () => {
    const { log, lines } = capturing({ level: "warn" });
    log.debug("d");
    log.info("i");
    log.warn("w");
    log.error("e");
    assertEquals(lines.length, 2);
    assertStringIncludes(lines[0], "w");
    assertStringIncludes(lines[1], "e");
  });

  it("writes nothing at all at the silent threshold", () => {
    const { log, lines } = capturing({ level: "silent" });
    log.debug("d");
    log.info("i");
    log.warn("w");
    log.error("e");
    log.success("s");
    assertEquals(lines, []);
  });

  it("silences success along with info, because success is not its own level", () => {
    const { log, lines } = capturing({ level: "warn" });
    log.success("done");
    assertEquals(lines, [], "quieting a build should quiet its success lines too");
  });

  it("defaults to info, so debug is dropped and info is kept", () => {
    const { log, lines } = capturing();
    log.debug("d");
    log.info("i");
    assertEquals(lines.length, 1);
  });

  it("carries the prefix into every line", () => {
    const { log, lines } = capturing({ prefix: "otso" });
    log.info("building");
    assertStringIncludes(lines[0], "[otso]");
  });

  it("renders an error argument with its stack rather than as an object", () => {
    const { log, lines } = capturing();
    log.error("failed", new Error("the cause"));
    assertStringIncludes(lines[0], "the cause");
    assertFalse(lines[0].includes("[object Object]"));
  });

  it("renders a plain object as json rather than as [object Object]", () => {
    const { log, lines } = capturing();
    log.info("config", { target: "node" });
    assertStringIncludes(lines[0], '"target":"node"');
  });

  it("survives a cyclic argument instead of throwing out of a log call", () => {
    const { log, lines } = capturing();
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    log.info("cyclic", cyclic);
    assertEquals(lines.length, 1, "the call returned and wrote a line");
  });

  it("emits no colour when colours are off, and colour when they are on", () => {
    const plain = capturing({ colors: false });
    plain.log.error("boom");
    assertFalse(plain.lines[0].includes("\x1b["), plain.lines[0]);

    const lines: string[] = [];
    createLogger({ colors: true, output: (l) => lines.push(l) }).error("boom");
    assertStringIncludes(lines[0], COLORS.red);
    assertStringIncludes(lines[0], COLORS.reset);
  });

  it("tints success differently from a plain info line", () => {
    const lines: string[] = [];
    const log = createLogger({ colors: true, output: (l) => lines.push(l) });
    log.info("a");
    log.success("b");
    assertStringIncludes(lines[0], COLORS.blue);
    assertStringIncludes(lines[1], COLORS.green);
  });

  it("reports the level it was built with", () => {
    assertEquals(createLogger({ level: "error" }).level, "error");
  });
});

describe("formatMessage", () => {
  it("names the level in upper case and keeps the message", () => {
    const line = formatMessage("warn", "careful");
    assertStringIncludes(line, "WARN");
    assertStringIncludes(line, "careful");
  });

  it("adds no escape codes unless asked", () => {
    assertFalse(formatMessage("error", "x").includes("\x1b["));
    assert(formatMessage("error", "x", { colors: true }).includes("\x1b["));
  });
});

describe("progress and spinner", () => {
  it("fills the bar in proportion, and clamps outside the range", () => {
    const seen: string[] = [];
    const original = console.log;
    console.log = (l: string) => void seen.push(l);
    try {
      const bar = createProgressBar(10, 10);
      bar.update(0);
      bar.update(5);
      bar.update(10);
      bar.update(50);
      bar.update(-1);
      bar.finish();
    } finally {
      console.log = original;
    }
    assertStringIncludes(seen[0], "  0%");
    assertStringIncludes(seen[1], " 50%");
    assertStringIncludes(seen[2], "100%");
    assertStringIncludes(seen[3], "100%", "over the total clamps rather than overflowing");
    assertStringIncludes(seen[4], "  0%", "under zero clamps too");
    assertStringIncludes(seen[5], "100%");
  });

  it("reads a zero total as complete rather than dividing by zero", () => {
    const seen: string[] = [];
    const original = console.log;
    console.log = (l: string) => void seen.push(l);
    try {
      createProgressBar(0, 4).update(0);
    } finally {
      console.log = original;
    }
    assertStringIncludes(seen[0], "100%");
  });

  it("prints the message once and the outcome on stop", () => {
    const seen: string[] = [];
    const original = console.log;
    console.log = (l: string) => void seen.push(l);
    try {
      createSpinner("working").stop("done");
    } finally {
      console.log = original;
    }
    assertEquals(seen, ["working", "done"]);
  });
});

describe("formatting helpers", () => {
  it("scales durations across the unit boundaries", () => {
    assertEquals(formatDuration(1), "1ms");
    assertEquals(formatDuration(999), "999ms");
    assertEquals(formatDuration(1000), "1.00s");
    assertEquals(formatDuration(59_999), "60.00s");
    assertEquals(formatDuration(60_000), "1m 0.0s");
    assertEquals(formatDuration(90_000), "1m 30.0s");
    assertEquals(formatDuration(3_600_000), "60m 0.0s");
  });

  it("scales sizes across the unit boundaries", () => {
    assertStringIncludes(formatSize(512), "B");
    assertStringIncludes(formatSize(2048), "KB");
    assertStringIncludes(formatSize(5 * 1024 * 1024), "MB");
  });
});
