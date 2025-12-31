/**
 * PhilJS Storage Hooks
 * Signal-based hooks for file operations
 */
import type { StorageClient, StorageFile, UploadOptions, DownloadOptions, ListOptions } from './index.js';
export interface UploadState {
    isUploading: boolean;
    progress: number;
    error: Error | null;
    metadata: StorageFile | null;
}
export declare function useUpload(client: StorageClient): {
    state: () => any;
    upload: (key: string, file: File | Blob | Buffer | ArrayBuffer, options?: UploadOptions) => Promise<StorageFile | null>;
    reset: () => void;
};
export interface DownloadState {
    isDownloading: boolean;
    progress: number;
    error: Error | null;
    data: Buffer | null;
}
export declare function useDownload(client: StorageClient): {
    state: () => any;
    download: (key: string, options?: DownloadOptions) => Promise<Buffer | null>;
    reset: () => void;
};
export interface FileListState {
    isLoading: boolean;
    error: Error | null;
    files: StorageFile[];
    cursor: string | undefined;
    hasMore: boolean;
}
export declare function useFileList(client: StorageClient): {
    state: () => any;
    list: (options?: ListOptions) => Promise<StorageFile[]>;
    loadMore: (options?: ListOptions) => Promise<StorageFile[]>;
    refresh: () => Promise<StorageFile[]>;
    reset: () => void;
};
//# sourceMappingURL=hooks.d.ts.map