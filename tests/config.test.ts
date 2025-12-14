/**
 * Tests for otso configuration loading and validation
 *
 * @module
 */

import { describe, it } from "@std/testing/bdd";

// TODO: Import from ../src/config/mod.ts once implemented
// import { loadConfig, validateConfig, mergeConfigs } from "../src/config/mod.ts";

describe("Configuration Loading", () => {
  describe("loadConfig", () => {
    it.skip("should load config from otso.config.ts", async () => {
      // TODO: Implement test
      // const config = await loadConfig("./fixtures/with-otso-config/");
      // assertExists(config);
    });

    it.skip("should load config from deno.json otso field", async () => {
      // TODO: Implement test
      // const config = await loadConfig("./fixtures/with-deno-json/");
      // assertExists(config);
    });

    it.skip("should load config from package.json otso field", async () => {
      // TODO: Implement test
      // const config = await loadConfig("./fixtures/with-package-json/");
      // assertExists(config);
    });

    it.skip("should use default config when no config file found", async () => {
      // TODO: Implement test
      // const config = await loadConfig("./fixtures/no-config/");
      // assertEquals(config.targets, ["deno"]);
    });

    it.skip("should merge CLI arguments with config file", async () => {
      // TODO: Implement test
    });
  });

  describe("validateConfig", () => {
    it.skip("should validate a correct configuration", () => {
      // TODO: Implement test
      // const result = validateConfig({
      //   entry: "./src/mod.ts",
      //   targets: ["deno", "node"],
      // });
      // assertEquals(result.valid, true);
    });

    it.skip("should return errors for missing entry", () => {
      // TODO: Implement test
      // const result = validateConfig({ targets: ["deno"] });
      // assertEquals(result.valid, false);
      // assert(result.errors.length > 0);
    });

    it.skip("should return errors for missing targets", () => {
      // TODO: Implement test
      // const result = validateConfig({ entry: "./src/mod.ts" });
      // assertEquals(result.valid, false);
    });

    it.skip("should return errors for invalid target", () => {
      // TODO: Implement test
      // const result = validateConfig({
      //   entry: "./src/mod.ts",
      //   targets: ["invalid-target"],
      // });
      // assertEquals(result.valid, false);
    });

    it.skip("should warn for deprecated options", () => {
      // TODO: Implement test
    });
  });

  describe("mergeConfigs", () => {
    it.skip("should merge two configurations", () => {
      // TODO: Implement test
      // const base = { entry: "./src/mod.ts", targets: ["deno"] };
      // const override = { targets: ["node"] };
      // const merged = mergeConfigs(base, override);
      // assertEquals(merged.entry, "./src/mod.ts");
      // assertEquals(merged.targets, ["node"]);
    });

    it.skip("should deep merge nested objects", () => {
      // TODO: Implement test
      // const base = { output: { dir: "./dist", format: "esm" } };
      // const override = { output: { format: "cjs" } };
      // const merged = mergeConfigs(base, override);
      // assertEquals(merged.output.dir, "./dist");
      // assertEquals(merged.output.format, "cjs");
    });

    it.skip("should concatenate array options", () => {
      // TODO: Implement test
      // const base = { features: { enabled: ["a"] } };
      // const override = { features: { enabled: ["b"] } };
      // const merged = mergeConfigs(base, override);
      // assertArrayIncludes(merged.features.enabled, ["a", "b"]);
    });
  });
});

describe("Default Configuration", () => {
  it.skip("should have sensible defaults", () => {
    // TODO: Implement test
    // const defaults = getDefaultConfig();
    // assertEquals(defaults.entry, "./src/mod.ts");
    // assertEquals(defaults.targets, ["deno"]);
    // assertEquals(defaults.output.dir, "./target");
  });

  it.skip("should merge overrides with defaults", () => {
    // TODO: Implement test
    // const config = getDefaultConfig({ targets: ["node", "bun"] });
    // assertEquals(config.targets, ["node", "bun"]);
    // assertEquals(config.entry, "./src/mod.ts"); // default preserved
  });
});

describe("Target Configuration", () => {
  it.skip("should get default config for known runtimes", () => {
    // TODO: Implement test
    // const denoConfig = getDefaultTargetConfig("deno");
    // assertEquals(denoConfig.runtime, "deno");
    // assertEquals(denoConfig.format, "esm");
  });

  it.skip("should return undefined for unknown runtimes", () => {
    // TODO: Implement test
    // const config = getDefaultTargetConfig("unknown");
    // assertEquals(config, undefined);
  });
});
