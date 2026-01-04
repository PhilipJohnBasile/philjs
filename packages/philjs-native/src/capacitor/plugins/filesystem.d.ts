/**
 * PhilJS Native - Capacitor Filesystem Plugin
 *
 * Provides file system access for reading, writing, and managing
 * files and directories on the device.
 */
import { type Signal } from '@philjs/core';
/**
 * Directory types
 */
export type Directory = 'Documents' | 'Data' | 'Library' | 'Cache' | 'External' | 'ExternalStorage';
/**
 * Encoding types
 */
export type Encoding = 'utf8' | 'ascii' | 'utf16';
/**
 * File info
 */
export interface FileInfo {
    name: string;
    type: 'file' | 'directory';
    size: number;
    ctime: number;
    mtime: number;
    uri: string;
}
/**
 * Read file options
 */
export interface ReadFileOptions {
    path: string;
    directory?: Directory;
    encoding?: Encoding;
}
/**
 * Read file result
 */
export interface ReadFileResult {
    data: string;
}
/**
 * Write file options
 */
export interface WriteFileOptions {
    path: string;
    data: string;
    directory?: Directory;
    encoding?: Encoding;
    recursive?: boolean;
}
/**
 * Write file result
 */
export interface WriteFileResult {
    uri: string;
}
/**
 * Append file options
 */
export interface AppendFileOptions {
    path: string;
    data: string;
    directory?: Directory;
    encoding?: Encoding;
}
/**
 * Delete file options
 */
export interface DeleteFileOptions {
    path: string;
    directory?: Directory;
}
/**
 * Make directory options
 */
export interface MkdirOptions {
    path: string;
    directory?: Directory;
    recursive?: boolean;
}
/**
 * Remove directory options
 */
export interface RmdirOptions {
    path: string;
    directory?: Directory;
    recursive?: boolean;
}
/**
 * Read directory options
 */
export interface ReaddirOptions {
    path: string;
    directory?: Directory;
}
/**
 * Read directory result
 */
export interface ReaddirResult {
    files: FileInfo[];
}
/**
 * Stat options
 */
export interface StatOptions {
    path: string;
    directory?: Directory;
}
/**
 * Stat result
 */
export interface StatResult extends FileInfo {
}
/**
 * Copy options
 */
export interface CopyOptions {
    from: string;
    to: string;
    directory?: Directory;
    toDirectory?: Directory;
}
/**
 * Rename options
 */
export interface RenameOptions {
    from: string;
    to: string;
    directory?: Directory;
    toDirectory?: Directory;
}
/**
 * Download file options
 */
export interface DownloadFileOptions {
    url: string;
    path: string;
    directory?: Directory;
    progress?: boolean;
}
/**
 * Download file result
 */
export interface DownloadFileResult {
    path: string;
    blob?: Blob;
}
/**
 * File operation progress
 */
export declare const fileProgress: Signal<{
    operation: string;
    progress: number;
    path: string;
} | null>;
/**
 * Filesystem API
 */
export declare const CapacitorFilesystem: {
    /**
     * Read a file
     */
    readFile(options: ReadFileOptions): Promise<ReadFileResult>;
    /**
     * Read a file as binary (base64)
     */
    readFileBinary(options: Omit<ReadFileOptions, "encoding">): Promise<{
        data: ArrayBuffer;
    }>;
    /**
     * Write a file
     */
    writeFile(options: WriteFileOptions): Promise<WriteFileResult>;
    /**
     * Write binary data to a file
     */
    writeFileBinary(options: Omit<WriteFileOptions, "encoding" | "data"> & {
        data: ArrayBuffer;
    }): Promise<WriteFileResult>;
    /**
     * Append to a file
     */
    appendFile(options: AppendFileOptions): Promise<void>;
    /**
     * Delete a file
     */
    deleteFile(options: DeleteFileOptions): Promise<void>;
    /**
     * Create a directory
     */
    mkdir(options: MkdirOptions): Promise<void>;
    /**
     * Remove a directory
     */
    rmdir(options: RmdirOptions): Promise<void>;
    /**
     * Read directory contents
     */
    readdir(options: ReaddirOptions): Promise<ReaddirResult>;
    /**
     * Get file/directory stats
     */
    stat(options: StatOptions): Promise<StatResult>;
    /**
     * Check if file/directory exists
     */
    exists(options: StatOptions): Promise<boolean>;
    /**
     * Copy a file
     */
    copy(options: CopyOptions): Promise<void>;
    /**
     * Rename/move a file
     */
    rename(options: RenameOptions): Promise<void>;
    /**
     * Download a file from URL
     */
    downloadFile(options: DownloadFileOptions): Promise<DownloadFileResult>;
    /**
     * Get URI for a file
     */
    getUri(options: {
        path: string;
        directory?: Directory;
    }): Promise<{
        uri: string;
    }>;
    /**
     * Request permissions (Android)
     */
    requestPermissions(): Promise<{
        publicStorage: "granted" | "denied";
    }>;
    /**
     * Check permissions
     */
    checkPermissions(): Promise<{
        publicStorage: "granted" | "denied" | "prompt";
    }>;
};
/**
 * Read JSON file
 */
export declare function readJsonFile<T>(path: string, directory?: Directory): Promise<T>;
/**
 * Write JSON file
 */
export declare function writeJsonFile<T>(path: string, data: T, directory?: Directory): Promise<void>;
/**
 * Hook to get file progress
 */
export declare function useFileProgress(): {
    operation: string;
    progress: number;
    path: string;
} | null;
export default CapacitorFilesystem;
//# sourceMappingURL=filesystem.d.ts.map