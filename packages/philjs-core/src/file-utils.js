/**
 * @fileoverview File utilities for build-time operations
 * Provides file reading, writing, and pattern matching with caching
 */
/**
 * File cache
 */
class FileCache {
    cache = new Map();
    _ttl;
    constructor(ttl = 60000) {
        this._ttl = ttl;
    }
    setTTL(ttl) {
        this._ttl = ttl;
    }
    getTTL() {
        return this._ttl;
    }
    get(path, mtime) {
        const entry = this.cache.get(path);
        if (!entry)
            return undefined;
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
    set(path, value, mtime) {
        this.cache.set(path, {
            value,
            timestamp: Date.now(),
            ...(mtime !== undefined ? { mtime } : {}),
        });
    }
    clear() {
        this.cache.clear();
    }
    delete(path) {
        this.cache.delete(path);
    }
}
// Global caches
const readCache = new FileCache();
const statCache = new FileCache();
const patternCache = new FileCache();
/**
 * Read file with caching
 */
export async function readFile(path, options = {}) {
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
 * Write file
 */
export async function writeFile(path, content, options = {}) {
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
 * Copy file
 */
export async function copyFile(src, dest, options = {}) {
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
 * Get file stats
 */
export async function getStats(path, options = {}) {
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
    }
    catch (error) {
        return null;
    }
}
/**
 * Check if file exists
 */
export async function fileExists(path) {
    const stats = await getStats(path, { cache: true });
    return stats !== null && stats.isFile();
}
/**
 * Check if directory exists
 */
export async function dirExists(path) {
    const stats = await getStats(path, { cache: true });
    return stats !== null && stats.isDirectory();
}
/**
 * Read directory with pattern matching
 */
export async function readDir(path, options = {}) {
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
    let files;
    if (recursive) {
        files = [];
        const scan = async (dir) => {
            const entries = await readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(dir, entry.name);
                if (entry.isDirectory()) {
                    await scan(fullPath);
                }
                else {
                    files.push(fullPath);
                }
            }
        };
        await scan(path);
        if (!fullPaths) {
            const { relative } = await import('path');
            files = files.map(f => relative(path, f));
        }
    }
    else {
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
function globToRegex(pattern) {
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
export async function matchFiles(baseDir, patterns) {
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
export async function deleteFile(path) {
    const { unlink } = await import('fs/promises');
    await unlink(path);
    readCache.delete(path);
    statCache.delete(path);
}
/**
 * Delete directory
 */
export async function deleteDir(path, options = {}) {
    const { rm } = await import('fs/promises');
    await rm(path, { recursive: options.recursive ?? true });
}
/**
 * Create directory
 */
export async function createDir(path) {
    const { mkdir } = await import('fs/promises');
    await mkdir(path, { recursive: true });
}
/**
 * Move/rename file
 */
export async function moveFile(src, dest) {
    const { rename } = await import('fs/promises');
    await rename(src, dest);
    readCache.delete(src);
    statCache.delete(src);
}
/**
 * Watch file for changes
 */
export async function watchFile(path, callback, options = {}) {
    const { debounce = 100 } = options;
    let timeout = null;
    const fs = await import('fs');
    const watcher = fs.watch(path, (eventType) => {
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
export async function watchDir(path, callback, options = {}) {
    const { debounce = 100 } = options;
    const timeouts = new Map();
    const fs = await import('fs');
    const pathModule = await import('path');
    const watcher = fs.watch(path, { recursive: true }, (eventType, filename) => {
        if (!filename)
            return;
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
export async function readJSON(path, options = {}) {
    const content = await readFile(path, options);
    return JSON.parse(content);
}
/**
 * Write JSON file
 */
export async function writeJSON(path, data, options = {}) {
    const { indent = 2, ...writeOptions } = options;
    const content = JSON.stringify(data, null, indent);
    await writeFile(path, content, writeOptions);
}
/**
 * Clear all caches
 */
export function clearCaches() {
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
            size: readCache.cache.size,
            ttl: readCache.getTTL(),
        },
        statCache: {
            size: statCache.cache.size,
            ttl: statCache.getTTL(),
        },
        patternCache: {
            size: patternCache.cache.size,
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
//# sourceMappingURL=file-utils.js.map