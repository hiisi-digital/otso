/**
 * Filesystem helpers shared by the stages.
 *
 * @module
 */

/**
 * Remove a path if it is there, and say whether it was.
 *
 * Two copies of this existed, one returning whether it removed anything and one
 * returning nothing. The boolean is the more informative of the two and the
 * caller that does not want it can ignore it, so that is the one that survived.
 *
 * @param path The file or directory to remove.
 * @returns `true` when something was removed, `false` when there was nothing there.
 */
export async function removeIfPresent(path: string): Promise<boolean> {
  try {
    await Deno.remove(path, { recursive: true });
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}
