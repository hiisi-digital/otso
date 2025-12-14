/**
 * Build pipeline for otso build framework
 *
 * Orchestrates the build process across multiple targets,
 * managing transformers, plugins, and output.
 *
 * @module
 */

export { createBuildContext, getBuildContext } from "./context.ts";
export { cleanOutputDir, writeOutput, writeOutputFile } from "./output.ts";
export { build, buildAll, buildTarget } from "./pipeline.ts";

export type {
    BuildContext,
    BuildOptions,
    BuildResult,
    TargetBuildResult
} from "./types.ts";

