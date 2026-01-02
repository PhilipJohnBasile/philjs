/**
 * PhilJS Storage Hooks
 * Signal-based hooks for file operations
 */

import { signal } from '@philjs/core';
import type { StorageClient, StorageFile, UploadOptions, DownloadOptions, ListOptions, ListResult } from './index.js';

// ============================================================================
// Upload Hook
// ============================================================================

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: Error | null;
  metadata: StorageFile | null;
}

export function useUpload(client: StorageClient) {
  const state = signal<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    metadata: null,
  });

  const upload = async (
    key: string,
    file: File | Blob | Buffer | ArrayBuffer,
    options: UploadOptions = {}
  ): Promise<StorageFile | null> => {
    state.set({
      isUploading: true,
      progress: 0,
      error: null,
      metadata: null,
    });

    try {
      const buffer = file instanceof Buffer
        ? file
        : file instanceof ArrayBuffer
        ? Buffer.from(file)
        : Buffer.from(await (file as Blob).arrayBuffer());

      const metadata = await client.upload(key, buffer, {
        ...options,
        onProgress: (progress) => {
          state.set({
            ...state(),
            progress: progress.percentage,
          });
          options.onProgress?.(progress);
        },
      });

      state.set({
        isUploading: false,
        progress: 100,
        error: null,
        metadata,
      });

      return metadata;
    } catch (error) {
      state.set({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: null,
      });
      return null;
    }
  };

  const reset = () => {
    state.set({
      isUploading: false,
      progress: 0,
      error: null,
      metadata: null,
    });
  };

  return {
    state: () => state(),
    upload,
    reset,
  };
}

// ============================================================================
// Download Hook
// ============================================================================

export interface DownloadState {
  isDownloading: boolean;
  progress: number;
  error: Error | null;
  data: Buffer | null;
}

export function useDownload(client: StorageClient) {
  const state = signal<DownloadState>({
    isDownloading: false,
    progress: 0,
    error: null,
    data: null,
  });

  const download = async (
    key: string,
    options: DownloadOptions = {}
  ): Promise<Buffer | null> => {
    state.set({
      isDownloading: true,
      progress: 0,
      error: null,
      data: null,
    });

    try {
      const data = await client.download(key, {
        ...options,
        onProgress: (progress) => {
          state.set({
            ...state(),
            progress: progress.percentage,
          });
          options.onProgress?.(progress);
        },
      });

      state.set({
        isDownloading: false,
        progress: 100,
        error: null,
        data,
      });

      return data;
    } catch (error) {
      state.set({
        isDownloading: false,
        progress: 0,
        error: error instanceof Error ? error : new Error(String(error)),
        data: null,
      });
      return null;
    }
  };

  const reset = () => {
    state.set({
      isDownloading: false,
      progress: 0,
      error: null,
      data: null,
    });
  };

  return {
    state: () => state(),
    download,
    reset,
  };
}

// ============================================================================
// File List Hook
// ============================================================================

export interface FileListState {
  isLoading: boolean;
  error: Error | null;
  files: StorageFile[];
  cursor: string | undefined;
  hasMore: boolean;
}

export function useFileList(client: StorageClient) {
  const state = signal<FileListState>({
    isLoading: false,
    error: null,
    files: [],
    cursor: undefined,
    hasMore: false,
  });

  const list = async (options: ListOptions = {}): Promise<StorageFile[]> => {
    state.set({
      ...state(),
      isLoading: true,
      error: null,
    });

    try {
      const result = await client.list(options);

      state.set({
        isLoading: false,
        error: null,
        files: result.files,
        cursor: result.nextToken,
        hasMore: result.isTruncated,
      });

      return result.files;
    } catch (error) {
      state.set({
        ...state(),
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return [];
    }
  };

  const loadMore = async (options: ListOptions = {}): Promise<StorageFile[]> => {
    const currentState = state();
    if (!currentState.cursor || currentState.isLoading) {
      return [];
    }

    state.set({
      ...currentState,
      isLoading: true,
      error: null,
    });

    try {
      const result = await client.list({
        ...options,
        continuationToken: currentState.cursor,
      });

      state.set({
        isLoading: false,
        error: null,
        files: [...currentState.files, ...result.files],
        cursor: result.nextToken,
        hasMore: result.isTruncated,
      });

      return result.files;
    } catch (error) {
      state.set({
        ...currentState,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return [];
    }
  };

  const refresh = () => list();

  const reset = () => {
    state.set({
      isLoading: false,
      error: null,
      files: [],
      cursor: undefined,
      hasMore: false,
    });
  };

  return {
    state: () => state(),
    list,
    loadMore,
    refresh,
    reset,
  };
}
