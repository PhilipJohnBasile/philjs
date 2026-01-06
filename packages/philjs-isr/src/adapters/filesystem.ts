/**
 * PhilJS ISR Filesystem Cache Adapter
 *
 * File-based cache storage for traditional server deployments.
 * Supports atomic writes and file locking for concurrent access.
 */

import type { CacheAdapter, CacheStats } from '../cache.js';
import type { CacheEntry, CacheEntryMeta, RevalidationStatus } from '../config.js';

/**
 * Filesystem cache configuration
 */
export interface FilesystemCacheConfig {
  /** Directory to store cache files */
  cacheDir?: string;
  /** File extension for cache files */
  extension?: string;
  /** Create directory if it doesn't exist */
  createDir?: boolean;
  /** Use atomic writes (write to temp then rename) */
  atomicWrites?: boolean;
  /** File permissions (default: 0o644) */
  fileMode?: number;
  /** Directory permissions (default: 0o755) */
  dirMode?: number;
}

/**
 * Node.js fs/promises interface
 */
interface FSPromises {
  readFile(path: string, options: { encoding: BufferEncoding }): Promise<string>;
  writeFile(path: string, data: string, options?: { mode?: number }): Promise<void>;
  unlink(path: string): Promise<void>;
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<{ size: number; mtimeMs: number }>;
  mkdir(path: string, options?: { recursive?: boolean; mode?: number }): Promise<string | undefined>;
  access(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
}

/**
 * Filesystem cache adapter implementation
 */
export class FilesystemCacheAdapter implements CacheAdapter {
  readonly name = 'filesystem';

  private config: Required<FilesystemCacheConfig>;
  private fs: FSPromises | null = null;
  private path: { join: (...parts: string[]) => string; dirname: (p: string) => string } | null = null;
  private initialized: boolean = false;
  private tagIndexPath: string = '';

  constructor(config: FilesystemCacheConfig = {}) {
    this.config = {
      cacheDir: config.cacheDir ?? '.cache/isr',
      extension: config.extension ?? '.json',
      createDir: config.createDir ?? true,
      atomicWrites: config.atomicWrites ?? true,
      fileMode: config.fileMode ?? 0o644,
      dirMode: config.dirMode ?? 0o755,
    };
  }

  /**
   * Initialize filesystem access
   */
  private async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Dynamically import fs and path
    const fsModule = await import('node:fs/promises');
    const pathModule = await import('node:path');

    this.fs = fsModule as unknown as FSPromises;
    this.path = pathModule;
    this.tagIndexPath = this.path.join(this.config.cacheDir, '_tags.json');

    // Create cache directory if needed
    if (this.config.createDir) {
      try {
        await this.fs.mkdir(this.config.cacheDir, {
          recursive: true,
          mode: this.config.dirMode,
        });
      } catch (error: unknown) {
        // Ignore if exists
        if ((error as { code?: string }).code !== 'EEXIST') {
          throw error;
        }
      }
    }

    this.initialized = true;
  }

  /**
   * Get the file path for a cache key
   */
  private getFilePath(path: string): string {
    // Sanitize path to create valid filename
    const sanitized = path
      .replace(/^\/+/, '') // Remove leading slashes
      .replace(/\/+/g, '__') // Replace slashes with double underscore
      .replace(/[^a-zA-Z0-9_-]/g, '_'); // Replace special chars

    return this.path!.join(
      this.config.cacheDir,
      sanitized + this.config.extension
    );
  }

  /**
   * Get the meta file path for a cache key
   */
  private getMetaPath(path: string): string {
    const sanitized = path
      .replace(/^\/+/, '')
      .replace(/\/+/g, '__')
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    return this.path!.join(
      this.config.cacheDir,
      sanitized + '.meta' + this.config.extension
    );
  }

  async get(path: string): Promise<CacheEntry | null> {
    await this.init();

    try {
      const filePath = this.getFilePath(path);
      const content = await this.fs!.readFile(filePath, { encoding: 'utf-8' });
      const entry: CacheEntry = JSON.parse(content);
      return entry;
    } catch (error: unknown) {
      if ((error as { code?: string }).code === 'ENOENT') {
        return null;
      }
      console.error(`[ISR:Filesystem] Error reading ${path}:`, error);
      return null;
    }
  }

  async set(path: string, entry: CacheEntry): Promise<void> {
    await this.init();

    const filePath = this.getFilePath(path);
    const metaPath = this.getMetaPath(path);
    const content = JSON.stringify(entry, null, 2);
    const metaContent = JSON.stringify(entry.meta, null, 2);

    try {
      // Ensure directory exists
      const dir = this.path!.dirname(filePath);
      await this.fs!.mkdir(dir, { recursive: true, mode: this.config.dirMode });

      if (this.config.atomicWrites) {
        // Atomic write: write to temp file then rename
        const tempPath = filePath + '.tmp.' + Date.now();
        const tempMetaPath = metaPath + '.tmp.' + Date.now();

        await this.fs!.writeFile(tempPath, content, { mode: this.config.fileMode });
        await this.fs!.writeFile(tempMetaPath, metaContent, { mode: this.config.fileMode });

        await this.fs!.rename(tempPath, filePath);
        await this.fs!.rename(tempMetaPath, metaPath);
      } else {
        await this.fs!.writeFile(filePath, content, { mode: this.config.fileMode });
        await this.fs!.writeFile(metaPath, metaContent, { mode: this.config.fileMode });
      }

      // Update tag index
      await this.updateTagIndex(path, entry.meta.tags);
    } catch (error) {
      console.error(`[ISR:Filesystem] Error writing ${path}:`, error);
      throw error;
    }
  }

  async delete(path: string): Promise<boolean> {
    await this.init();

    try {
      const filePath = this.getFilePath(path);
      const metaPath = this.getMetaPath(path);

      // Get tags before delete to update index
      const entry = await this.get(path);

      await this.fs!.unlink(filePath).catch(() => { /* ignore */ });
      await this.fs!.unlink(metaPath).catch(() => { /* ignore */ });

      // Remove from tag index
      if (entry) {
        await this.removeFromTagIndex(path, entry.meta.tags);
      }

      return true;
    } catch (error: unknown) {
      if ((error as { code?: string }).code === 'ENOENT') {
        return false;
      }
      console.error(`[ISR:Filesystem] Error deleting ${path}:`, error);
      return false;
    }
  }

  async has(path: string): Promise<boolean> {
    await this.init();

    try {
      await this.fs!.access(this.getFilePath(path));
      return true;
    } catch {
      return false;
    }
  }

  async keys(): Promise<string[]> {
    await this.init();

    try {
      const files = await this.fs!.readdir(this.config.cacheDir);
      return files
        .filter(f => f.endsWith(this.config.extension) && !f.endsWith('.meta' + this.config.extension) && !f.startsWith('_'))
        .map(f => {
          // Reverse the sanitization
          const base = f.replace(this.config.extension, '');
          return '/' + base.replace(/__/g, '/').replace(/_/g, '-');
        });
    } catch (error: unknown) {
      if ((error as { code?: string }).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async clear(): Promise<void> {
    await this.init();

    try {
      // Remove entire cache directory and recreate
      await this.fs!.rm(this.config.cacheDir, { recursive: true, force: true });
      await this.fs!.mkdir(this.config.cacheDir, {
        recursive: true,
        mode: this.config.dirMode,
      });
    } catch (error) {
      console.error('[ISR:Filesystem] Error clearing cache:', error);
    }
  }

  async getByTag(tag: string): Promise<string[]> {
    await this.init();

    try {
      const content = await this.fs!.readFile(this.tagIndexPath, { encoding: 'utf-8' });
      const index: Record<string, string[]> = JSON.parse(content);
      return index[tag] ?? [];
    } catch {
      return [];
    }
  }

  async updateMeta(path: string, meta: Partial<CacheEntryMeta>): Promise<boolean> {
    await this.init();

    try {
      const entry = await this.get(path);
      if (!entry) {
        return false;
      }

      // Handle tag changes
      if (meta.tags && JSON.stringify(meta.tags) !== JSON.stringify(entry.meta.tags)) {
        await this.removeFromTagIndex(path, entry.meta.tags);
        await this.updateTagIndex(path, meta.tags);
      }

      entry.meta = { ...entry.meta, ...meta };
      await this.set(path, entry);

      return true;
    } catch (error) {
      console.error(`[ISR:Filesystem] Error updating meta for ${path}:`, error);
      return false;
    }
  }

  async getMeta(path: string): Promise<CacheEntryMeta | null> {
    await this.init();

    try {
      const metaPath = this.getMetaPath(path);
      const content = await this.fs!.readFile(metaPath, { encoding: 'utf-8' });
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async getStats(): Promise<CacheStats> {
    await this.init();

    try {
      const keys = await this.keys();
      const byStatus: Record<RevalidationStatus, number> = {
        fresh: 0,
        stale: 0,
        revalidating: 0,
        error: 0,
      };

      let sizeBytes = 0;
      let staleCount = 0;
      let oldestEntry: number | undefined;
      let newestEntry: number | undefined;

      for (const key of keys) {
        try {
          const filePath = this.getFilePath(key);
          const stat = await this.fs!.stat(filePath);
          sizeBytes += stat.size;

          const meta = await this.getMeta(key);
          if (meta) {
            byStatus[meta.status]++;

            if (!oldestEntry || meta.createdAt < oldestEntry) {
              oldestEntry = meta.createdAt;
            }
            if (!newestEntry || meta.createdAt > newestEntry) {
              newestEntry = meta.createdAt;
            }

            const now = Date.now();
            const age = now - meta.revalidatedAt;
            if (age > meta.revalidateInterval * 1000) {
              staleCount++;
            }
          }
        } catch {
          // Skip files that can't be read
        }
      }

      const stats: CacheStats = {
        entryCount: keys.length,
        sizeBytes,
        staleCount,
        byStatus,
      };
      if (oldestEntry !== undefined) stats.oldestEntry = oldestEntry;
      if (newestEntry !== undefined) stats.newestEntry = newestEntry;
      return stats;
    } catch {
      return {
        entryCount: 0,
        sizeBytes: 0,
        staleCount: 0,
        byStatus: { fresh: 0, stale: 0, revalidating: 0, error: 0 },
      };
    }
  }

  async close(): Promise<void> {
    // Nothing to close for filesystem
    this.initialized = false;
  }

  /**
   * Update tag index with new path -> tags mapping
   */
  private async updateTagIndex(path: string, tags: string[]): Promise<void> {
    let index: Record<string, string[]> = {};

    try {
      const content = await this.fs!.readFile(this.tagIndexPath, { encoding: 'utf-8' });
      index = JSON.parse(content);
    } catch {
      // Index doesn't exist yet
    }

    for (const tag of tags) {
      if (!index[tag]) {
        index[tag] = [];
      }
      if (!index[tag].includes(path)) {
        index[tag].push(path);
      }
    }

    await this.fs!.writeFile(this.tagIndexPath, JSON.stringify(index, null, 2), {
      mode: this.config.fileMode,
    });
  }

  /**
   * Remove path from tag index
   */
  private async removeFromTagIndex(path: string, tags: string[]): Promise<void> {
    try {
      const content = await this.fs!.readFile(this.tagIndexPath, { encoding: 'utf-8' });
      const index: Record<string, string[]> = JSON.parse(content);

      for (const tag of tags) {
        if (index[tag]) {
          index[tag] = index[tag].filter(p => p !== path);
          if (index[tag].length === 0) {
            delete index[tag];
          }
        }
      }

      await this.fs!.writeFile(this.tagIndexPath, JSON.stringify(index, null, 2), {
        mode: this.config.fileMode,
      });
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Create a filesystem cache adapter
 */
export function createFilesystemCache(config?: FilesystemCacheConfig): FilesystemCacheAdapter {
  return new FilesystemCacheAdapter(config);
}
