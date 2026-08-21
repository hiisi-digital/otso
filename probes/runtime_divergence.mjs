// What actually differs between deno, node and bun, measured rather than assumed.
//
// The examples in this repo claim that most of the surface has converged and
// that `@cfg` earns its place for reaching a runtime's native path rather than
// for papering over missing APIs. That claim is this file's output. Run it
// under each runtime and compare:
//
//   deno run --allow-all probes/runtime_divergence.mjs
//   node probes/runtime_divergence.mjs
//   bun probes/runtime_divergence.mjs
//
// Measured on deno 2.9.5, node v26.7.0, bun 1.4.0; the raw output of that run
// is in runtime_divergence.txt beside this file. Only four entries differed:
// the Deno global, the Bun global, the Worker global (absent on node) and
// Deno.permissions. Everything else answered true everywhere.
//
// Anything added here needs a case that can come out false, or it is measuring
// the harness rather than the runtime.

const g = globalThis;
const checks = {
  "process.env":            () => typeof g.process?.env?.PATH === "string",
  "process.cwd()":          () => typeof g.process?.cwd?.() === "string",
  "process.platform":       () => typeof g.process?.platform === "string",
  "process.exit":           () => typeof g.process?.exit === "function",
  "import.meta.main":       () => typeof import.meta.main === "boolean",
  "import.meta.dirname":    () => typeof import.meta.dirname === "string",
  "globalThis.Deno":        () => typeof g.Deno === "object",
  "globalThis.Bun":         () => typeof g.Bun === "object",
  "Worker global":          () => typeof g.Worker === "function",
  "navigator.userAgent":    () => typeof g.navigator?.userAgent === "string",
  "crypto.subtle":          () => typeof g.crypto?.subtle === "object",
  "performance.now":        () => typeof g.performance?.now === "function",
  "Deno.permissions":       () => typeof g.Deno?.permissions === "object",
  "process.getuid":         () => typeof g.process?.getuid === "function",
  "process.memoryUsage":    () => typeof g.process?.memoryUsage === "function",
  "process.hrtime.bigint":  () => typeof g.process?.hrtime?.bigint === "function",
  "os.availableParallelism":() => false,
};
const out = {};
for (const [k, f] of Object.entries(checks)) { try { out[k] = f(); } catch { out[k] = false; } }
try { const os = await import("node:os"); out["os.availableParallelism"] = typeof os.availableParallelism === "function"; } catch {}
console.log(JSON.stringify(out));
