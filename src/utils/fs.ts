/**
 * File system utilities for otso build framework
 *
 * Cross-runtime file system operations that work in Deno, Node, and Bun.
 *
 * @module
 */

/**
 * Reads a file as text.
 *
 * @param path - Path to the file
 * @returns File contents as string
 *
 * TODO: Implement cross-runtime file reading
 * - Use Deno.readTextFile in Deno
 * - Use fs.promises.readFile in Node
 * - Use Bun.file().text() in Bun
 */
export async function readTextFile(_path: string): Promise<string> {
  // TODO: Detect runtime
  // TODO: Use appropriate API
  throw new Error("Not implemented: readTextFile");
}

/**
 * Writes text to a file.
 *
 * @param path - Path to the file
 * @param content - Content to write
 *
 * TODO: Implement cross-runtime file writing
 */
export async function writeTextFile(
  _path: string,
  _content: string,
): Promise<void> {
  // TODO: Detect runtime
  // TODO: Use appropriate API
  throw new Error("Not implemented: writeTextFile");
}

/**
 * Checks if a path exists.
 *
 * @param path - Path to check
 * @returns True if the path exists
 *
 * TODO: Implement cross-runtime existence check
 */
export async function exists(_path: string): Promise<boolean> {
  // TODO: Detect runtime
  // TODO: Use appropriate API
  throw new Error("Not implemented: exists");
}

/**
 * Checks if a path is a directory.
 *
 * @param path - Path to check
 * @returns True if the path is a directory
 *
 * TODO: Implement cross-runtime directory check
 */
export async function isDirectory(_path: string): Promise<boolean> {
  // TODO: Detect runtime
  // TODO: Use appropriate API
  throw new Error("Not implemented: isDirectory");
}

/**
 * Checks if a path is a file.
 *
 * @param path - Path to check
 * @returns True if the path is a file
 *
 * TODO: Implement cross-runtime file check
 */
export async function isFile(_path: string): Promise<boolean> {
  // TODO: Detect runtime
  // TODO: Use appropriate API
  throw new Error("Not implemented: isFile");
}

/**
 * Creates a directory and all parent directories.
 *
 * @param path - Path of directory to create
 *
 * TODO: Implement cross-runtime directory creation
 */
export async function mkdir(_path: string): Promise<void> {
  // TODO: Detect runtime
  // TODO: Use appropriate API with recursive option
  throw new Error("Not implemented: mkdir");
}

/**
 * Removes a file or directory.
 *
 * @param path - Path to remove
 * @param options - Remove options
 *
 * TODO: Implement cross-runtime removal
 */
export async function remove(
  _path: string,
  _options?: { recursive?: boolean },
): Promise<void> {
  // TODO: Detect runtime
  // TODO: Use appropriate API
  throw new Error("Not implemented: remove");
}

/**
 * Lists files in a directory.
 *
 * @param path - Directory path
 * @returns Array of entry names
 *
 * TODO: Implement cross-runtime directory listing
 */
export async function readDir(_path: string): Promise<string[]> {
  // TODO: Detect runtime
  // TODO: Use appropriate API
  throw new Error("Not implemented: readDir");
}

/**
 * Copies a file.
 *
 * @param src - Source path
 * @param dest - Destination path
 *
 * TODO: Implement cross-runtime file copying
 */
export async function copyFile(
  _src: string,
  _dest: string,
): Promise<void> {
  // TODO: Detect runtime
  // TODO: Use appropriate API
  throw new Error("Not implemented: copyFile");
}

/**
 * Gets file stats.
 *
 * @param path - Path to get stats for
 * @returns File stat information
 *
 * TODO: Implement cross-runtime stat
 */
export async function stat(_path: string): Promise<FileStat> {
  // TODO: Detect runtime
  // TODO: Use appropriate API
  throw new Error("Not implemented: stat");
}

/**
 * File stat information
 */
export interface FileStat {
  /** Whether this is a file */
  readonly isFile: boolean;
  /** Whether this is a directory */
  readonly isDirectory: boolean;
  /** File size in bytes */
  readonly size: number;
  /** Last modified time */
  readonly mtime: Date | null;
}

/**
 * Walks a directory recursively, yielding all files.
 *
 * @param path - Directory path to walk
 * @param options - Walk options
 * @yields File paths
 *
 * TODO: Implement directory walking
 */
export async function* walk(
  _path: string,
  _options?: WalkOptions,
): AsyncGenerator<WalkEntry> {
  // TODO: Implement recursive directory walking
  throw new Error("Not implemented: walk");
}

/**
 * Options for walking a directory
 */
export interface WalkOptions {
  /** Maximum depth to recurse (undefined = unlimited) */
  readonly maxDepth?: number;
  /** Whether to include directories in results */
  readonly includeDirs?: boolean;
  /** Whether to include files in results */
  readonly includeFiles?: boolean;
  /** Patterns to match files against */
  readonly match?: readonly RegExp[];
  /** Patterns to skip */
  readonly skip?: readonly RegExp[];
}

/**
 * An entry from walking a directory
 */
export interface WalkEntry {
  /** Full path to the entry */
  readonly path: string;
  /** Entry name (without directory) */
  readonly name: string;
  /** Whether this is a file */
  readonly isFile: boolean;
  /** Whether this is a directory */
  readonly isDirectory: boolean;
}

/**
 * Resolves a path relative to a base directory.
 *
 * @param base - Base directory
 * @param paths - Path segments to join
 * @returns Resolved path
 */
export function resolvePath(_base: string, ..._paths: string[]): string {
  // TODO: Implement path resolution
  throw new Error("Not implemented: resolvePath");
}

/**
 * Gets the directory name from a path.
 *
 * @param path - Path to get directory from
 * @returns Directory portion of the path
 */
export function dirname(_path: string): string {
  // TODO: Implement dirname
  throw new Error("Not implemented: dirname");
}

/**
 * Gets the base name from a path.
 *
 * @param path - Path to get base name from
 * @param ext - Optional extension to remove
 * @returns Base name of the path
 */
export function basename(_path: string, _ext?: string): string {
  // TODO: Implement basename
  throw new Error("Not implemented: basename");
}

/**
 * Gets the extension from a path.
 *
 * @param path - Path to get extension from
 * @returns Extension including the dot, or empty string
 */
export function extname(_path: string): string {
  // TODO: Implement extname
  throw new Error("Not implemented: extname");
}

/**
 * Joins path segments.
 *
 * @param paths - Path segments to join
 * @returns Joined path
 */
export function joinPath(..._paths: string[]): string {
  // TODO: Implement path joining
  throw new Error("Not implemented: joinPath");
}

/**
 * Normalizes a path (resolves . and ..).
 *
 * @param path - Path to normalize
 * @returns Normalized path
 */
export function normalizePath(_path: string): string {
  // TODO: Implement path normalization
  throw new Error("Not implemented: normalizePath");
}

/**
 * Gets the relative path from one path to another.
 *
 * @param from - Starting path
 * @param to - Target path
 * @returns Relative path from `from` to `to`
 */
export function relativePath(_from: string, _to: string): string {
  // TODO: Implement relative path calculation
  throw new Error("Not implemented: relativePath");
}

/**
 * Checks if a path is absolute.
 *
 * @param path - Path to check
 * @returns True if the path is absolute
 */
export function isAbsolute(_path: string): boolean {
  // TODO: Implement absolute path check
  throw new Error("Not implemented: isAbsolute");
}
