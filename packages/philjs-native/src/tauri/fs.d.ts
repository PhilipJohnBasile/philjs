/**
 * PhilJS Native - Tauri File System Access
 *
 * Provides comprehensive file system operations for Tauri applications
 * with path resolution, file watching, and streaming support.
 */
/**
 * Base directory types
 */
export type BaseDirectory = 'App' | 'AppCache' | 'AppConfig' | 'AppData' | 'AppLocalData' | 'AppLog' | 'Audio' | 'Cache' | 'Config' | 'Data' | 'Desktop' | 'Document' | 'Download' | 'Executable' | 'Font' | 'Home' | 'LocalData' | 'Log' | 'Picture' | 'Public' | 'Resource' | 'Runtime' | 'Temp' | 'Template' | 'Video';
/**
 * File entry
 */
export interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    isFile: boolean;
    isSymlink: boolean;
    size?: number;
    modifiedAt?: Date;
    createdAt?: Date;
    readonly?: boolean;
    hidden?: boolean;
    children?: FileEntry[];
}
/**
 * Read file options
 */
export interface ReadFileOptions {
    baseDir?: BaseDirectory;
}
/**
 * Write file options
 */
export interface WriteFileOptions {
    baseDir?: BaseDirectory;
    append?: boolean;
    createNew?: boolean;
}
/**
 * Read directory options
 */
export interface ReadDirOptions {
    baseDir?: BaseDirectory;
    recursive?: boolean;
}
/**
 * Copy/Move options
 */
export interface CopyMoveOptions {
    fromBaseDir?: BaseDirectory;
    toBaseDir?: BaseDirectory;
    overwrite?: boolean;
}
/**
 * Watch event type
 */
export type WatchEventType = 'create' | 'modify' | 'remove' | 'rename' | 'other';
/**
 * Watch event
 */
export interface WatchEvent {
    type: WatchEventType;
    paths: string[];
}
/**
 * Watch options
 */
export interface WatchOptions {
    recursive?: boolean;
    baseDir?: BaseDirectory;
}
/**
 * Resolve path with base directory
 */
export declare function resolvePath(path: string, baseDir?: BaseDirectory): Promise<string>;
/**
 * Get base directory path
 */
export declare function getBaseDir(dir: BaseDirectory): Promise<string>;
/**
 * Join paths
 */
export declare function joinPath(...paths: string[]): Promise<string>;
/**
 * Get directory name
 */
export declare function dirname(path: string): Promise<string>;
/**
 * Get base name
 */
export declare function basename(path: string, ext?: string): Promise<string>;
/**
 * Get extension
 */
export declare function extname(path: string): Promise<string>;
/**
 * Normalize path
 */
export declare function normalize(path: string): Promise<string>;
/**
 * Read file as text
 */
export declare function readTextFile(path: string, options?: ReadFileOptions): Promise<string>;
/**
 * Read file as binary
 */
export declare function readBinaryFile(path: string, options?: ReadFileOptions): Promise<Uint8Array>;
/**
 * Write text file
 */
export declare function writeTextFile(path: string, contents: string, options?: WriteFileOptions): Promise<void>;
/**
 * Write binary file
 */
export declare function writeBinaryFile(path: string, contents: Uint8Array | ArrayBuffer, options?: WriteFileOptions): Promise<void>;
/**
 * Read JSON file
 */
export declare function readJsonFile<T = unknown>(path: string, options?: ReadFileOptions): Promise<T>;
/**
 * Write JSON file
 */
export declare function writeJsonFile<T>(path: string, data: T, options?: WriteFileOptions & {
    pretty?: boolean;
}): Promise<void>;
/**
 * Append to file
 */
export declare function appendFile(path: string, contents: string, options?: WriteFileOptions): Promise<void>;
/**
 * Read directory
 */
export declare function readDir(path: string, options?: ReadDirOptions): Promise<FileEntry[]>;
/**
 * Create directory
 */
export declare function createDir(path: string, options?: {
    baseDir?: BaseDirectory;
    recursive?: boolean;
}): Promise<void>;
/**
 * Remove directory
 */
export declare function removeDir(path: string, options?: {
    baseDir?: BaseDirectory;
    recursive?: boolean;
}): Promise<void>;
/**
 * Remove file
 */
export declare function removeFile(path: string, options?: {
    baseDir?: BaseDirectory;
}): Promise<void>;
/**
 * Rename/move file or directory
 */
export declare function rename(from: string, to: string, options?: CopyMoveOptions): Promise<void>;
/**
 * Copy file
 */
export declare function copyFile(from: string, to: string, options?: CopyMoveOptions): Promise<void>;
/**
 * Check if path exists
 */
export declare function exists(path: string, options?: {
    baseDir?: BaseDirectory;
}): Promise<boolean>;
/**
 * Watch a file or directory for changes
 */
export declare function watch(paths: string | string[], callback: (event: WatchEvent) => void, options?: WatchOptions): Promise<() => void>;
/**
 * Stop all file watches
 */
export declare function unwatchAll(): void;
/**
 * Hook to read a file
 */
export declare function useFile(path: string, options?: ReadFileOptions): {
    content: string | null;
    loading: boolean;
    error: Error | null;
    reload: () => void;
};
/**
 * Hook to watch a file
 */
export declare function useFileWatch(path: string, options?: WatchOptions): {
    events: WatchEvent[];
    clear: () => void;
};
declare const _default: {
    resolvePath: typeof resolvePath;
    getBaseDir: typeof getBaseDir;
    joinPath: typeof joinPath;
    dirname: typeof dirname;
    basename: typeof basename;
    extname: typeof extname;
    normalize: typeof normalize;
    readTextFile: typeof readTextFile;
    readBinaryFile: typeof readBinaryFile;
    writeTextFile: typeof writeTextFile;
    writeBinaryFile: typeof writeBinaryFile;
    readJsonFile: typeof readJsonFile;
    writeJsonFile: typeof writeJsonFile;
    appendFile: typeof appendFile;
    readDir: typeof readDir;
    createDir: typeof createDir;
    removeDir: typeof removeDir;
    removeFile: typeof removeFile;
    rename: typeof rename;
    copyFile: typeof copyFile;
    exists: typeof exists;
    watch: typeof watch;
    unwatchAll: typeof unwatchAll;
};
export default _default;
//# sourceMappingURL=fs.d.ts.map