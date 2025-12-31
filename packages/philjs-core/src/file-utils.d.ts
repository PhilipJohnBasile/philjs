/**
 * @fileoverview File utilities for build-time operations
 * Provides file reading, writing, and pattern matching with caching
 */
import type { Stats } from 'fs';
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
export declare function readFile(path: string, options?: ReadFileOptions): Promise<string>;
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
export declare function writeFile(path: string, content: string, options?: WriteFileOptions): Promise<void>;
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
export declare function copyFile(src: string, dest: string, options?: CopyFileOptions): Promise<void>;
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
export declare function getStats(path: string, options?: GetStatsOptions): Promise<Stats | null>;
/**
 * Check if file exists
 */
export declare function fileExists(path: string): Promise<boolean>;
/**
 * Check if directory exists
 */
export declare function dirExists(path: string): Promise<boolean>;
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
export declare function readDir(path: string, options?: ReadDirOptions): Promise<string[]>;
/**
 * Match files by pattern
 */
export declare function matchFiles(baseDir: string, patterns: string | string[]): Promise<string[]>;
/**
 * Delete file
 */
export declare function deleteFile(path: string): Promise<void>;
/**
 * Delete directory
 */
export declare function deleteDir(path: string, options?: {
    recursive?: boolean;
}): Promise<void>;
/**
 * Create directory
 */
export declare function createDir(path: string): Promise<void>;
/**
 * Move/rename file
 */
export declare function moveFile(src: string, dest: string): Promise<void>;
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
export declare function watchFile(path: string, callback: (path: string) => void, options?: WatchOptions): Promise<() => void>;
/**
 * Watch directory for changes
 */
export declare function watchDir(path: string, callback: (path: string, event: string) => void, options?: WatchOptions): Promise<() => void>;
/**
 * Read JSON file
 */
export declare function readJSON<T = any>(path: string, options?: ReadFileOptions): Promise<T>;
/**
 * Write JSON file
 */
export declare function writeJSON(path: string, data: any, options?: WriteFileOptions & {
    indent?: number;
}): Promise<void>;
/**
 * Clear all caches
 */
export declare function clearCaches(): void;
/**
 * Get cache statistics
 */
export declare function getCacheStats(): {
    readCache: {
        size: any;
        ttl: number;
    };
    statCache: {
        size: any;
        ttl: number;
    };
    patternCache: {
        size: any;
        ttl: number;
    };
};
export declare const fileUtils: {
    readFile: typeof readFile;
    writeFile: typeof writeFile;
    copyFile: typeof copyFile;
    getStats: typeof getStats;
    fileExists: typeof fileExists;
    dirExists: typeof dirExists;
    readDir: typeof readDir;
    matchFiles: typeof matchFiles;
    deleteFile: typeof deleteFile;
    deleteDir: typeof deleteDir;
    createDir: typeof createDir;
    moveFile: typeof moveFile;
    watchFile: typeof watchFile;
    watchDir: typeof watchDir;
    readJSON: typeof readJSON;
    writeJSON: typeof writeJSON;
    clearCaches: typeof clearCaches;
    getCacheStats: typeof getCacheStats;
};
//# sourceMappingURL=file-utils.d.ts.map