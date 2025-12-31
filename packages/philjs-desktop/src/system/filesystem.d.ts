/**
 * File System APIs
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
}
export interface ReadOptions {
    encoding?: 'utf-8' | 'binary';
}
export interface WriteOptions {
    /** Create parent directories if they don't exist */
    createDirs?: boolean;
    /** Append to file instead of overwriting */
    append?: boolean;
}
export interface CopyOptions {
    /** Overwrite existing files */
    overwrite?: boolean;
}
export type BaseDirectory = 'app' | 'appCache' | 'appConfig' | 'appData' | 'appLocalData' | 'appLog' | 'audio' | 'cache' | 'config' | 'data' | 'desktop' | 'document' | 'download' | 'executable' | 'font' | 'home' | 'localData' | 'log' | 'picture' | 'public' | 'runtime' | 'temp' | 'template' | 'video' | 'resource';
/**
 * File System API
 */
export declare const FileSystem: {
    /**
     * Read a text file
     */
    readTextFile(path: string, baseDir?: BaseDirectory): Promise<string>;
    /**
     * Read a binary file
     */
    readBinaryFile(path: string, baseDir?: BaseDirectory): Promise<Uint8Array>;
    /**
     * Write a text file
     */
    writeTextFile(path: string, contents: string, options?: WriteOptions & {
        baseDir?: BaseDirectory;
    }): Promise<void>;
    /**
     * Write a binary file
     */
    writeBinaryFile(path: string, contents: Uint8Array, options?: WriteOptions & {
        baseDir?: BaseDirectory;
    }): Promise<void>;
    /**
     * Check if a path exists
     */
    exists(path: string, baseDir?: BaseDirectory): Promise<boolean>;
    /**
     * Create a directory
     */
    createDir(path: string, options?: {
        recursive?: boolean;
        baseDir?: BaseDirectory;
    }): Promise<void>;
    /**
     * Remove a file
     */
    removeFile(path: string, baseDir?: BaseDirectory): Promise<void>;
    /**
     * Remove a directory
     */
    removeDir(path: string, options?: {
        recursive?: boolean;
        baseDir?: BaseDirectory;
    }): Promise<void>;
    /**
     * Read directory contents
     */
    readDir(path: string, baseDir?: BaseDirectory): Promise<FileEntry[]>;
    /**
     * Copy a file
     */
    copyFile(source: string, destination: string, options?: CopyOptions): Promise<void>;
    /**
     * Rename/move a file
     */
    rename(oldPath: string, newPath: string): Promise<void>;
    /**
     * Get file metadata
     */
    stat(path: string, baseDir?: BaseDirectory): Promise<FileEntry>;
    /**
     * Watch a path for changes
     */
    watch(path: string | string[], callback: (event: {
        type: string;
        paths: string[];
    }) => void, options?: {
        recursive?: boolean;
        baseDir?: BaseDirectory;
    }): Promise<() => void>;
};
export declare const readTextFile: (path: string, baseDir?: BaseDirectory) => Promise<string>;
export declare const readBinaryFile: (path: string, baseDir?: BaseDirectory) => Promise<Uint8Array>;
export declare const writeTextFile: (path: string, contents: string, options?: WriteOptions & {
    baseDir?: BaseDirectory;
}) => Promise<void>;
export declare const writeBinaryFile: (path: string, contents: Uint8Array, options?: WriteOptions & {
    baseDir?: BaseDirectory;
}) => Promise<void>;
export declare const exists: (path: string, baseDir?: BaseDirectory) => Promise<boolean>;
export declare const createDir: (path: string, options?: {
    recursive?: boolean;
    baseDir?: BaseDirectory;
}) => Promise<void>;
export declare const removeFile: (path: string, baseDir?: BaseDirectory) => Promise<void>;
export declare const removeDir: (path: string, options?: {
    recursive?: boolean;
    baseDir?: BaseDirectory;
}) => Promise<void>;
export declare const readDir: (path: string, baseDir?: BaseDirectory) => Promise<FileEntry[]>;
export declare const copyFile: (source: string, destination: string, options?: CopyOptions) => Promise<void>;
export declare const rename: (oldPath: string, newPath: string) => Promise<void>;
export declare const stat: (path: string, baseDir?: BaseDirectory) => Promise<FileEntry>;
export declare const watchPath: (path: string | string[], callback: (event: {
    type: string;
    paths: string[];
}) => void, options?: {
    recursive?: boolean;
    baseDir?: BaseDirectory;
}) => Promise<() => void>;
//# sourceMappingURL=filesystem.d.ts.map