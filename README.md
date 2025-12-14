# `otso`

<div align="center" style="text-align: center;">

[![JSR](https://jsr.io/badges/@hiisi/otso)](https://jsr.io/@hiisi/otso)
[![npm Version](https://img.shields.io/npm/v/otso?logo=npm)](https://www.npmjs.com/package/otso)
[![GitHub Issues](https://img.shields.io/github/issues/hiisi-digital/otso.svg)](https://github.com/hiisi-digital/otso/issues)
![License](https://img.shields.io/github/license/hiisi-digital/otso?color=%23009689)

> A build framework for cross-runtime TypeScript with first-class support for custom syntax, feature flags, and multi-target compilation.

</div>

## What it does

`otso` is a comprehensive build framework that enables writing TypeScript with extended syntax and compiling it to optimized, runtime-specific bundles. Think of it like Next.js or Vite, but for cross-runtime library and application development.

It orchestrates the entire build pipeline:

- **Custom TypeScript syntax** via `@hiisi/cfg-ts` decorators
- **Feature flags** via `@hiisi/ft-flags` for conditional compilation
- **Target compilation** via `@hiisi/tgts` for runtime/platform/arch-specific builds
- **Cross-runtime shims** via `@hiisi/shimp` for unified APIs
- **Static analysis** via `@hiisi/onlywhen` for build-time optimization

Write once in `src/`, build to `target/` with optimized outputs per runtime.

## Installation

```bash
# Deno
deno add jsr:@hiisi/otso

# npm / yarn / pnpm
npm install otso
```

## Related Packages

- [`@hiisi/cfg-ts`](https://jsr.io/@hiisi/cfg-ts) - The `@cfg` decorator system for conditional compilation
- [`@hiisi/ft-flags`](https://jsr.io/@hiisi/ft-flags) - Feature flag definitions and runtime evaluation
- [`@hiisi/tgts`](https://jsr.io/@hiisi/tgts) - Target definitions (runtime, platform, architecture)
- [`@hiisi/shimp`](https://jsr.io/@hiisi/shimp) - Cross-runtime compatibility shims
- [`@hiisi/onlywhen`](https://jsr.io/@hiisi/onlywhen) - Runtime detection and conditional execution

## Support

Whether you use this project, have learned something from it, or just like it,
please consider supporting it by buying me a coffee, so I can dedicate more time
on open-source projects like this :)

<a href="https://buymeacoffee.com/orgrinrt" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

## License

> You can check out the full license [here](https://github.com/hiisi-digital/otso/blob/main/LICENSE)

This project is licensed under the terms of the **Mozilla Public License 2.0**.

`SPDX-License-Identifier: MPL-2.0`
