/**
 * @module otso/process
 *
 * Running a subprocess and keeping what it said.
 *
 * Both streams are captured and both are kept, because the useful half of a
 * failed build is on stderr and the useful half of a successful one is on
 * stdout, and which of those a given tool uses is not otso's to predict.
 */

/** What a subprocess came to. */
export interface CommandResult {
  readonly success: boolean;
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
  /** Both streams in one string, for reporting a failure to a person. */
  readonly output: string;
}

/** Run `command` with `args` in `cwd`, capturing everything it writes. */
export async function runCommand(
  command: string,
  args: readonly string[],
  cwd: string,
): Promise<CommandResult> {
  const { success, code, stdout, stderr } = await new Deno.Command(command, {
    args: [...args],
    cwd,
    stdout: "piped",
    stderr: "piped",
  }).output();
  const decoder = new TextDecoder();
  const out = decoder.decode(stdout);
  const err = decoder.decode(stderr);
  return { success, code, stdout: out, stderr: err, output: `${out}${err}` };
}
