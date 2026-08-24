# `otso`

<div align="center" style="text-align: center;">

[![JSR](https://jsr.io/badges/@hiisi/otso)](https://jsr.io/@hiisi/otso)
[![GitHub Issues](https://img.shields.io/github/issues/hiisi-digital/otso.svg)](https://github.com/hiisi-digital/otso/issues)
![License](https://img.shields.io/github/license/hiisi-digital/otso?color=%23009689)

> Build one TypeScript codebase into deno, node and bun distributions, stripping what each runtime does not need.

</div>

## What it does

You write a library once. It has to go to jsr for deno, to npm for node, and to
npm again in a shape bun is happy with. Most of the code is the same for all
three, a little of it is not, and the usual answer is a runtime check in the
middle of the source that every distribution then carries whether it needs it or
not.

`otso` takes the other answer, which is Rust's. The places that differ are
marked with a condition, the build evaluates the condition for the target it is
producing, and what comes out is only that target's half. There is no runtime
check because the decision was made before the code shipped, and the deno branch
is not in the node package at all.

Most of a library needs none of this, which is worth saying before the rest of
the page makes it look otherwise. `node:fs`, `node:path`, `process`,
`crypto.subtle` and the web globals answer the same on all three runtimes;
`probes/runtime_divergence.mjs` in this repository measures that, and it found
four differences across seventeen checks. Where they do differ,
[`@hiisi/shimp`](https://github.com/hiisi-digital/shimp) covers the difference
behind one API and the code still gets written once. The marker is for what is
left, and for reaching a runtime's own faster path when you want it.

Packaging is not otso's work. [`@hiisi/deno-dist`](https://github.com/hiisi-digital/deno-dist)
already turns a deno project into jsr, npm and bun distributions and has an
end-to-end test that installs all three and checks they agree. otso prepares the
tree it is given and calls it.

## Installation

```bash
# deno, as a command
deno install --global --allow-read --allow-write --allow-env --allow-run --allow-net -n otso jsr:@hiisi/otso/cli

# or as a library
deno add jsr:@hiisi/otso
```

From a checkout, without installing:

```bash
deno run -A cli.ts build --dir path/to/project
```

## Usage

Configuration is deno-dist's `dist` block, read rather than duplicated. A
project that already builds with deno-dist builds with otso without adding
anything. The optional `otso` block says the two things `dist` has no room for:
which target a distribution's conditions are evaluated against, and which
features are on while they are.

```jsonc
{
  "name": "@scope/thing",
  "version": "0.1.0",
  "exports": "./mod.ts",
  "dist": {
    "node": { "runtime": "node", "plugins": ["deno-to-node"] },
    "bun": { "runtime": "bun", "plugins": ["deno-to-bun"] },
    "deno": { "runtime": "deno", "plugins": ["deno-passthrough"] }
  },
  "otso": {
    // on for every distribution
    "features": ["checksum"],
    // the target is taken from the dist entry's runtime unless it says otherwise
    "distributions": { "node": { "features": ["fast"] } }
  }
}
```

The marker goes on whatever differs. Both spellings mean the same thing: a
comment, which is legal anywhere and needs no import, or a decorator, which
reads better where TypeScript allows one.

```ts
//@cfg(target("deno"))
export function readText(path: string): Promise<string> {
  return Deno.readTextFile(path);
}

//@cfg(target("bun"))
export function readText(path: string): Promise<string> {
  return Bun.file(path).text();
}

//@cfg(target("node"))
export async function readText(path: string): Promise<string> {
  const { readFile } = await import("node:fs/promises");
  return await readFile(path, "utf8");
}
```

Three declarations of one name is a duplicate identifier as it stands, and any
compiler pointed at that file says so. That is the point: it becomes one
declaration once a target has been chosen, and choosing is what the build does.

```bash
otso build          # every distribution the dist block declares
otso build node bun # only these
otso check          # type-check what each distribution is built from
otso clean          # remove the output and the staged trees
```

`check` is the command with no counterpart underneath. Because the source is not
checkable until a target has been chosen, checking it directly reports errors
that are not errors, so `otso check` strips first and checks each result.
`--feature` and `--no-feature` turn features on and off for a run without
editing the manifest.

## Worked examples

Two, both built and run by the test suite rather than only described.

- [`examples/library`](examples/library) is a library. It reads a file three
  different ways, one per runtime, and computes a checksum behind a feature flag.
  `tests/e2e.test.ts` builds it, installs each distribution the way a consumer
  would, and asserts all three print the same bytes with the feature on and with
  it off.
- [`examples/binary`](examples/binary) is a command line tool. It shows the two
  places a tool differs from a library: its entry point awaits at the top level,
  which CommonJS cannot express, and it needs to be installable as a command.

## Status

Early, and honest about which parts are which.

What works: configuration, staging, the conditional stripping, `check`, `clean`,
and building all three distributions. The end-to-end test installs each one
under its own runtime and compares the output, so the claim on this page is a
test rather than a description.

A tool built here also installs as a command: the manifests carry a `bin` entry,
the entry point carries the right shebang for its runtime, and the file is
executable. `tests/e2e_binary.test.ts` covers both halves and they run rather
than sitting ignored.

Every package this reaches for is on jsr, and the `links` block in `deno.json`
is what points at the checkouts beside it while they are being worked on.

## Related packages

- [`@hiisi/cfg-ts`](https://github.com/hiisi-digital/cfg-ts) evaluates the conditions and does the stripping
- [`@hiisi/tgts`](https://github.com/hiisi-digital/tgts) is what a target is
- [`@hiisi/ft-flags`](https://github.com/hiisi-digital/ft-flags) is what a feature is
- [`@hiisi/deno-dist`](https://github.com/hiisi-digital/deno-dist) packages the result
- [`@hiisi/shimp`](https://github.com/hiisi-digital/shimp) covers the differences that need no marker
- [`@hiisi/onlywhen`](https://jsr.io/@hiisi/onlywhen) picks between them at runtime, where a build-time answer will not do

## A note on coding agents

We do not recommend using coding agents with this codebase.

If you still choose to use a coding agent:

- Be aware of the environmental and social impact of large-scale model inference.
  Minimise agent use where it is not needed. Be responsible.
- Only use an agent if you yourself understand the architecture. Do not use an
  agent because you do not understand; you will waste time and energy, both
  yours and the planet's.

The recommendation stands: do this work yourself unless you know what you are doing
and why.

## Support

Whether you use this project, have learned something from it, or just like it,
please consider supporting it by buying me a coffee, so I can dedicate more time
on open-source projects like this :)

<a href="https://buymeacoffee.com/orgrinrt" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

## License

> You can check out the full license [here](https://github.com/hiisi-digital/otso/blob/main/LICENSE)

This project is licensed under the terms of the **Mozilla Public License 2.0**.

`SPDX-License-Identifier: MPL-2.0`
