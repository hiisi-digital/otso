/**
 * What this package has to be true of before anything may be committed.
 *
 * Deliberately harsher than the code currently is. A lint set tuned to what
 * already passes measures nothing, and the point of putting it here is that it
 * refuses work rather than describes it.
 *
 * @module
 */

import defaultLints from "@hiisi/viola-default-lints";
import typescript from "@hiisi/viola-grammar-ts";
import { report, viola, when } from "@hiisi/viola";

export default viola()
  .use(defaultLints)
  // the grammar is what turns a file into something a lint can ask questions
  // of. the alias defaults to the grammar's own id, so naming it "typescript"
  // said the same thing twice.
  .add(typescript)
  // anything a linter has any confidence in at all is a failure. a warning
  // is a finding nobody acts on, and a gate that warns is not a gate. the
  // floor was 50 and everything under it passed silently.
  .rule(report.error, when.confidence.atLeast(1))
  // tests are held to the same bar as source. a fixture that drifts is how a
  // suite stops measuring the thing it names.
  .rule(report.error, when.in("tests/**/*.ts"))
  // fixtures that are supposed to be wrong are the one exception, since being
  // wrong is their entire job.
  .rule(report.off, when.in("tests/compile_fail/**"))
  .rule(report.off, when.in("**/fixtures/**"))
  // a literal spelled out across several test cases is several tests each
  // asserting its own expected value. counting those toward a duplication
  // threshold asks for a shared constant, and a test comparing a constant to
  // itself has stopped testing anything. they still show in the locations
  // list, they just do not push a string over the threshold on their own.
  .set("duplicate-strings.countIn", [
    "**",
    "!**/*_test.ts",
    "!**/*.test.ts",
    "!**/tests/**",
    // examples are the same case as tests: an example that imports a shared
    // constant instead of spelling the literal out has stopped being an
    // example, and this package's examples are mostly flag and target names,
    // which is exactly what a reader came to see.
    "!**/examples/**",
    "!**/fixtures/**",
  ])
  // `deno.json` publishes `./cli` alongside `.`, so `cli.ts` is an entry point
  // and everything reachable only through it is public rather than orphaned.
  // viola guesses entry points from filenames and knows `mod` and `index`; the
  // manifest's `exports` is the actual answer and that is filed upstream.
  .set("orphaned-code.entryPointPatterns", [/^cli$/])
  // The examples are three `@cfg`-gated definitions of one function, which is
  // the entire thing this package does. Only one survives the transform, so
  // reading them as duplicates or as undocumented overloads is reading source
  // that never ships in that shape. They run as tests, which is where their
  // correctness is actually checked.
  // `probes/` holds spikes: throwaway programs built to check one thing, kept
  // for the audit trail rather than maintained. Holding them to the shipping
  // bar would either bend the spike or bend the bar.
  .rule(report.off, when.in("probes/**"))
  .rule(report.off, when.in("examples/**").and(when.linter("similar-functions")))
  .rule(report.off, when.in("examples/**").and(when.linter("missing-docs")))
  // What is left is vocabulary rather than repetition. `dist`, `features`,
  // `otso` and `target` are manifest keys, each now named once in `MANIFEST`
  // and spelled again only inside the error message that tells a reader which
  // key was wrong; interpolating a constant there would make the message harder
  // to grep for than the thing it describes. The flag names are the keys of the
  // flag tables and the members of the union those tables map to, which is the
  // one place a flag has to be written literally.
  .set("duplicate-strings.ignoreStrings", [
    "dist",
    "features",
    "otso",
    "target",
    "verbose",
    "quiet",
    "--feature",
    "--no-feature",
  ]);
