/**
 * @fileoverview File utilities for build-time operations
 * Provides file reading, writing, and pattern matching with caching
 */

import type { Stats } from 'fs';

/**
 * File cache entry
 */
interface CacheEntry<T> {
  /** Cached value */
  value: T;
  /** Timestamp when cached */
  timestamp: number;
  /** File modification time */
  mtime?: number;
}

/**
 * File cache
 */
class FileCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private _ttl: number;

  constructor(ttl = 60000) {
    this._ttl = ttl;
  }

  setTTL(ttl: number): void {
    this._ttl = ttl;
  }

  getTTL(): number {
    return this._ttl;
  }

  get(path: string, mtime?: number): T | undefined {
    const entry = this.cache.get(path);
    if (!entry) return undefined;

    // Check if expired
    if (Date.now() - entry.timestamp > this._ttl) {
      this.cache.delete(path);
      return undefined;
    }

    // Check if file modified
    if (mtime !== undefined && entry.mtime !== mtime) {
      this.cache.delete(path);
      return undefined;
    }

    return entry.value;
  }

  set(path: string, value: T, mtime?: number): void {
    this.cache.set(path, {
      value,
      timestamp: Date.now(),
      mtime,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(path: string): void {
    this.cache.delete(path);
  }
}

// Global caches
const readCache = new FileCache<string>();
const statCache = new FileCache<Stats>();
const patternCache = new FileCache<string[]>();

/**
 * Read file options
 */
export interface ReadFileOptions {
  /** Encoding (default: 'utf-8') */
  encoding?: BufferEncoding;
  /** Use cache */
  cache?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
}

/**
 * Read file with caching
 */
export async function readFile(
  path: string,
  options: ReadFileOptions = {}
): Promise<string> {
  const { encoding = 'utf-8', cache = true, cacheTTL } = options;

  if (cacheTTL) {
    readCache.setTTL(cacheTTL);
  }

  if (cache) {
    // Check cache
    const stat = await getStats(path, { cache: true });
    const cached = readCache.get(path, stat?.mtimeMs);
    if (cached !== undefined) {
      return cached;
    }
  }

  // Read from filesystem
  const { readFile: fsReadFile } = await import('fs/promises');
  const content = await fsReadFile(path, encoding);

  if (cache) {
    const stat = await getStats(path, { cache: true });
    readCache.set(path, content, stat?.mtimeMs);
  }

  return content;
}

/**
 * Write file options
 */
export interface WriteFileOptions {
  /** Encoding (default: 'utf-8') */
  encoding?: BufferEncoding;
  /** Create directory if not exists */
  createDir?: boolean;
  /** Invalidate cache after write */
  invalidateCache?: boolean;
}

/**
 * Write file
 */
export async function writeFile(
  path: string,
  content: string,
  options: WriteFileOptions = {}
): Promise<void> {
  const { encoding = 'utf-8', createDir = true, invalidateCache = true } = options;

  if (createDir) {
    const { dirname } = await import('path');
    const { mkdir } = await import('fs/promises');
    await mkdir(dirname(path), { recursive: true });
  }

  const { writeFile: fsWriteFile } = await import('fs/promises');
  await fsWriteFile(path, content, encoding);

  if (invalidateCache) {
    readCache.delete(path);
    statCache.delete(path);
  }
}

/**
 * Copy file options
 */
export interface CopyFileOptions {
  /** Overwrite if exists */
  overwrite?: boolean;
  /** Create directory if not exists */
  createDir?: boolean;
}

/**
 * Copy file
 */
export async function copyFile(
  src: string,
  dest: string,
  options: CopyFileOptions = {}
): Promise<void> {
  const { overwrite = true, createDir = true } = options;

  // Check if destination exists
  if (!overwrite) {
    const exists = await fileExists(dest);
    if (exists) {
      throw new Error(`File already exists: ${dest}`);
    }
  }

  if (createDir) {
    const { dirname } = await import('path');
    const { mkdir } = await import('fs/promises');
    await mkdir(dirname(dest), { recursive: true });
  }

  const { copyFile: fsCopyFile } = await import('fs/promises');
  await fsCopyFile(src, dest);
}

/**
 * Get file stats options
 */
export interface GetStatsOptions {
  /** Use cache */
  cache?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
}

/**
 * Get file stats
 */
export async function getStats(
  path: string,
  options: GetStatsOptions = {}
): Promise<Stats | null> {
  const { cache = true, cacheTTL } = options;

  if (cacheTTL) {
    statCache.setTTL(cacheTTL);
  }

  if (cache) {
    const cached = statCache.get(path);
    if (cached !== undefined) {
      return cached;
    }
  }

  try {
    const { stat } = await import('fs/promises');
    const stats = await stat(path);

    if (cache) {
      statCache.set(path, stats);
    }

    return stats;
  } catch (error) {
    return null;
  }
}

/**
 * Check if file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  const stats = await getStats(path, { cache: true });
  return stats !== null && stats.isFile();
}

/**
 * Check if directory exists
 */
export async function dirExists(path: string): Promise<boolean> {
  const stats = await getStats(path, { cache: true });
  return stats !== null && stats.isDirectory();
}

/**
 * Read directory options
 */
export interface ReadDirOptions {
  /** Pattern to match */
  pattern?: string | RegExp;
  /** Recursive */
  recursive?: boolean;
  /** Return full paths */
  fullPaths?: boolean;
  /** Use cache */
  cache?: boolean;
}

/**
 * Read directory with pattern matching
 */
export async function readDir(
  path: string,
  options: ReadDirOptions = {}
): Promise<string[]> {
  const { pattern, recursive = false, fullPaths = false, cache = false } = options;

  const cacheKey = `${path}:${JSON.stringify(options)}`;

  if (cache) {
    const cached = patternCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
  }

  const { readdir } = await import('fs/promises');
  const { join } = await import('path');

  let files: string[];

  if (recursive) {
    files = [];
    const scan = async (dir: string) => {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    };
    await scan(path);

    if (!fullPaths) {
      const { relative } = await import('path');
      files = files.map(f => relative(path, f));
    }
  } else {
    const entries = await readdir(path, { withFileTypes: true });
    files = entries
      .filter(e => e.isFile())
      .map(e => fullPaths ? join(path, e.name) : e.name);
  }

  // Apply pattern
  if (pattern) {
    const regex = pattern instanceof RegExp ? pattern : globToRegex(pattern);
    files = files.filter(f => regex.test(f));
  }

  if (cache) {
    patternCache.set(cacheKey, files);
  }

  return files;
}

/**
 * Convert glob pattern to RegExp
 */
function globToRegex(pattern: string): RegExp {
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
    .replace(/\{([^}]+)\}/g, (_, group) => {
      return `(${group.split(',').join('|')})`;
    });

  return new RegExp(`^${regexPattern}$`);
}

/**
 * Match files by pattern
 */
export async function matchFiles(
  baseDir: string,
  patterns: string | string[]
): Promise<string[]> {
  const { glob } = await import('fast-glob');
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];

  return glob(patternArray, {
    cwd: baseDir,
    absolute: false,
  });
}

/**
 * Delete file
 */
export async function deleteFile(path: string): Promise<void> {
  const { unlink } = await import('fs/promises');
  await unlink(path);
  readCache.delete(path);
  statCache.delete(path);
}

/**
 * Delete directory
 */
export async function deleteDir(path: string, options: { recursive?: boolean } = {}): Promise<void> {
  const { rm } = await import('fs/promises');
  await rm(path, { recursive: options.recursive ?? true });
}

/**
 * Create directory
 */
export async function createDir(path: string): Promise<void> {
  const { mkdir } = await import('fs/promises');
  await mkdir(path, { recursive: true });
}

/**
 * Move/rename file
 */
export async function moveFile(src: string, dest: string): Promise<void> {
  const { rename } = await import('fs/promises');
  await rename(src, dest);
  readCache.delete(src);
  statCache.delete(src);
}

/**
 * Watch file for changes
 */
export interface WatchOptions {
  /** Callback when file changes */
  onChange?: (path: string) => void;
  /** Debounce delay in milliseconds */
  debounce?: number;
}

/**
 * Watch file for changes
 */
export async function watchFile(
  path: string,
  callback: (path: string) => void,
  options: WatchOptions = {}
): Promise<() => void> {
  const { debounce = 100 } = options;
  let timeout: NodeJS.Timeout | null = null;

  const fs = await import('fs');
  const watcher = fs.watch(path, (eventType: string) => {
    if (eventType === 'change') {
      // Invalidate cache
      readCache.delete(path);
      statCache.delete(path);

      // Debounce callback
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        callback(path);
        timeout = null;
      }, debounce);
    }
  });

  return () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    watcher.close();
  };
}

/**
 * Watch directory for changes
 */
export async function watchDir(
  path: string,
  callback: (path: string, event: string) => void,
  options: WatchOptions = {}
): Promise<() => void> {
  const { debounce = 100 } = options;
  const timeouts = new Map<string, NodeJS.Timeout>();

  const fs = await import('fs');
  const pathModule = await import('path');
  const watcher = fs.watch(path, { recursive: true }, (eventType: string, filename: string) => {
    if (!filename) return;

    const fullPath = pathModule.join(path, filename);

    // Invalidate cache
    readCache.delete(fullPath);
    statCache.delete(fullPath);

    // Debounce callback
    const existing = timeouts.get(fullPath);
    if (existing) {
      clearTimeout(existing);
    }

    const timeout = setTimeout(() => {
      callback(fullPath, eventType);
      timeouts.delete(fullPath);
    }, debounce);

    timeouts.set(fullPath, timeout);
  });

  return () => {
    timeouts.forEach(timeout => clearTimeout(timeout));
    timeouts.clear();
    watcher.close();
  };
}

/**
 * Read JSON file
 */
export async function readJSON<T = any>(
  path: string,
  options: ReadFileOptions = {}
): Promise<T> {
  const content = await readFile(path, options);
  return JSON.parse(content);
}

/**
 * Write JSON file
 */
export async function writeJSON(
  path: string,
  data: any,
  options: WriteFileOptions & { indent?: number } = {}
): Promise<void> {
  const { indent = 2, ...writeOptions } = options;
  const content = JSON.stringify(data, null, indent);
  await writeFile(path, content, writeOptions);
}

/**
 * Clear all caches
 */
export function clearCaches(): void {
  readCache.clear();
  statCache.clear();
  patternCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    readCache: {
      size: (readCache as any).cache.size,
      ttl: readCache.getTTL(),
    },
    statCache: {
      size: (statCache as any).cache.size,
      ttl: statCache.getTTL(),
    },
    patternCache: {
      size: (patternCache as any).cache.size,
      ttl: patternCache.getTTL(),
    },
  };
}

// Export file utilities
export const fileUtils = {
  readFile,
  writeFile,
  copyFile,
  getStats,
  fileExists,
  dirExists,
  readDir,
  matchFiles,
  deleteFile,
  deleteDir,
  createDir,
  moveFile,
  watchFile,
  watchDir,
  readJSON,
  writeJSON,
  clearCaches,
  getCacheStats,
};
