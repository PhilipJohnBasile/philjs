// @ts-nocheck
/**
 * PhilJS Native - Capacitor Filesystem Plugin
 *
 * Provides file system access for reading, writing, and managing
 * files and directories on the device.
 */

import { signal, type Signal } from 'philjs-core';
import {
  isCapacitor,
  isNativePlatform,
  callPlugin,
  registerPlugin,
} from '../index.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Directory types
 */
export type Directory =
  | 'Documents'
  | 'Data'
  | 'Library'
  | 'Cache'
  | 'External'
  | 'ExternalStorage';

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
  ctime: number; // Created time
  mtime: number; // Modified time
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
export interface StatResult extends FileInfo {}

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

// ============================================================================
// State
// ============================================================================

/**
 * File operation progress
 */
export const fileProgress: Signal<{
  operation: string;
  progress: number;
  path: string;
} | null> = signal(null);

// ============================================================================
// Web Storage Implementation
// ============================================================================

/**
 * Web filesystem using IndexedDB for persistence
 */
class WebFilesystem {
  private dbName = 'philjs_filesystem';
  private storeName = 'files';
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(new Error('Failed to open database'));

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'path' });
        }
      };
    });
  }

  private getFullPath(path: string, directory?: Directory): string {
    const dir = directory || 'Documents';
    return `/${dir}/${path}`.replace(/\/+/g, '/');
  }

  async readFile(options: ReadFileOptions): Promise<ReadFileResult> {
    const db = await this.getDB();
    const fullPath = this.getFullPath(options.path, options.directory);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(fullPath);

      request.onsuccess = () => {
        if (request.result) {
          resolve({ data: request.result.data });
        } else {
          reject(new Error(`File not found: ${fullPath}`));
        }
      };

      request.onerror = () => reject(new Error('Failed to read file'));
    });
  }

  async writeFile(options: WriteFileOptions): Promise<WriteFileResult> {
    const db = await this.getDB();
    const fullPath = this.getFullPath(options.path, options.directory);

    // Create parent directories if recursive
    if (options.recursive) {
      const parts = fullPath.split('/').filter(Boolean);
      let currentPath = '';
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath += '/' + parts[i];
        await this.ensureDir(currentPath);
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const now = Date.now();
      const request = store.put({
        path: fullPath,
        data: options.data,
        type: 'file',
        size: new Blob([options.data]).size,
        ctime: now,
        mtime: now,
      });

      request.onsuccess = () => resolve({ uri: fullPath });
      request.onerror = () => reject(new Error('Failed to write file'));
    });
  }

  async appendFile(options: AppendFileOptions): Promise<void> {
    try {
      const existing = await this.readFile({
        path: options.path,
        directory: options.directory,
      });
      await this.writeFile({
        path: options.path,
        data: existing.data + options.data,
        directory: options.directory,
        encoding: options.encoding,
      });
    } catch {
      // File doesn't exist, create it
      await this.writeFile({
        path: options.path,
        data: options.data,
        directory: options.directory,
        encoding: options.encoding,
      });
    }
  }

  async deleteFile(options: DeleteFileOptions): Promise<void> {
    const db = await this.getDB();
    const fullPath = this.getFullPath(options.path, options.directory);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(fullPath);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete file'));
    });
  }

  async mkdir(options: MkdirOptions): Promise<void> {
    const fullPath = this.getFullPath(options.path, options.directory);

    if (options.recursive) {
      const parts = fullPath.split('/').filter(Boolean);
      let currentPath = '';
      for (const part of parts) {
        currentPath += '/' + part;
        await this.ensureDir(currentPath);
      }
    } else {
      await this.ensureDir(fullPath);
    }
  }

  private async ensureDir(path: string): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const now = Date.now();
      const request = store.put({
        path,
        type: 'directory',
        size: 0,
        ctime: now,
        mtime: now,
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to create directory'));
    });
  }

  async rmdir(options: RmdirOptions): Promise<void> {
    const db = await this.getDB();
    const fullPath = this.getFullPath(options.path, options.directory);

    if (options.recursive) {
      // Delete all files in directory
      const files = await this.readdir({ path: options.path, directory: options.directory });
      for (const file of files.files) {
        if (file.type === 'directory') {
          await this.rmdir({
            path: `${options.path}/${file.name}`,
            directory: options.directory,
            recursive: true,
          });
        } else {
          await this.deleteFile({
            path: `${options.path}/${file.name}`,
            directory: options.directory,
          });
        }
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(fullPath);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to remove directory'));
    });
  }

  async readdir(options: ReaddirOptions): Promise<ReaddirResult> {
    const db = await this.getDB();
    const fullPath = this.getFullPath(options.path, options.directory);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const files: FileInfo[] = request.result
          .filter((item: any) => {
            const itemDir = item.path.substring(0, item.path.lastIndexOf('/'));
            return itemDir === fullPath;
          })
          .map((item: any) => ({
            name: item.path.split('/').pop(),
            type: item.type,
            size: item.size,
            ctime: item.ctime,
            mtime: item.mtime,
            uri: item.path,
          }));

        resolve({ files });
      };

      request.onerror = () => reject(new Error('Failed to read directory'));
    });
  }

  async stat(options: StatOptions): Promise<StatResult> {
    const db = await this.getDB();
    const fullPath = this.getFullPath(options.path, options.directory);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(fullPath);

      request.onsuccess = () => {
        if (request.result) {
          resolve({
            name: fullPath.split('/').pop() || '',
            type: request.result.type,
            size: request.result.size,
            ctime: request.result.ctime,
            mtime: request.result.mtime,
            uri: fullPath,
          });
        } else {
          reject(new Error(`File not found: ${fullPath}`));
        }
      };

      request.onerror = () => reject(new Error('Failed to stat file'));
    });
  }

  async copy(options: CopyOptions): Promise<void> {
    const data = await this.readFile({
      path: options.from,
      directory: options.directory,
    });

    await this.writeFile({
      path: options.to,
      data: data.data,
      directory: options.toDirectory || options.directory,
    });
  }

  async rename(options: RenameOptions): Promise<void> {
    await this.copy(options);
    await this.deleteFile({
      path: options.from,
      directory: options.directory,
    });
  }

  async downloadFile(options: DownloadFileOptions): Promise<DownloadFileResult> {
    const response = await fetch(options.url);
    const blob = await response.blob();
    const text = await blob.text();

    await this.writeFile({
      path: options.path,
      data: text,
      directory: options.directory,
    });

    return {
      path: this.getFullPath(options.path, options.directory),
      blob,
    };
  }
}

const webFilesystem = new WebFilesystem();

// ============================================================================
// Filesystem API
// ============================================================================

registerPlugin('Filesystem', { web: webFilesystem });

/**
 * Filesystem API
 */
export const CapacitorFilesystem = {
  /**
   * Read a file
   */
  async readFile(options: ReadFileOptions): Promise<ReadFileResult> {
    if (!isNativePlatform()) {
      return webFilesystem.readFile(options);
    }

    return callPlugin<ReadFileOptions, ReadFileResult>('Filesystem', 'readFile', options);
  },

  /**
   * Read a file as binary (base64)
   */
  async readFileBinary(options: Omit<ReadFileOptions, 'encoding'>): Promise<{ data: ArrayBuffer }> {
    const result = await this.readFile({ ...options, encoding: undefined });
    const binary = atob(result.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { data: bytes.buffer };
  },

  /**
   * Write a file
   */
  async writeFile(options: WriteFileOptions): Promise<WriteFileResult> {
    if (!isNativePlatform()) {
      return webFilesystem.writeFile(options);
    }

    return callPlugin<WriteFileOptions, WriteFileResult>('Filesystem', 'writeFile', options);
  },

  /**
   * Write binary data to a file
   */
  async writeFileBinary(
    options: Omit<WriteFileOptions, 'encoding' | 'data'> & { data: ArrayBuffer }
  ): Promise<WriteFileResult> {
    const binary = Array.from(new Uint8Array(options.data))
      .map((b) => String.fromCharCode(b))
      .join('');
    const base64 = btoa(binary);

    return this.writeFile({ ...options, data: base64 });
  },

  /**
   * Append to a file
   */
  async appendFile(options: AppendFileOptions): Promise<void> {
    if (!isNativePlatform()) {
      return webFilesystem.appendFile(options);
    }

    await callPlugin<AppendFileOptions, void>('Filesystem', 'appendFile', options);
  },

  /**
   * Delete a file
   */
  async deleteFile(options: DeleteFileOptions): Promise<void> {
    if (!isNativePlatform()) {
      return webFilesystem.deleteFile(options);
    }

    await callPlugin<DeleteFileOptions, void>('Filesystem', 'deleteFile', options);
  },

  /**
   * Create a directory
   */
  async mkdir(options: MkdirOptions): Promise<void> {
    if (!isNativePlatform()) {
      return webFilesystem.mkdir(options);
    }

    await callPlugin<MkdirOptions, void>('Filesystem', 'mkdir', options);
  },

  /**
   * Remove a directory
   */
  async rmdir(options: RmdirOptions): Promise<void> {
    if (!isNativePlatform()) {
      return webFilesystem.rmdir(options);
    }

    await callPlugin<RmdirOptions, void>('Filesystem', 'rmdir', options);
  },

  /**
   * Read directory contents
   */
  async readdir(options: ReaddirOptions): Promise<ReaddirResult> {
    if (!isNativePlatform()) {
      return webFilesystem.readdir(options);
    }

    return callPlugin<ReaddirOptions, ReaddirResult>('Filesystem', 'readdir', options);
  },

  /**
   * Get file/directory stats
   */
  async stat(options: StatOptions): Promise<StatResult> {
    if (!isNativePlatform()) {
      return webFilesystem.stat(options);
    }

    return callPlugin<StatOptions, StatResult>('Filesystem', 'stat', options);
  },

  /**
   * Check if file/directory exists
   */
  async exists(options: StatOptions): Promise<boolean> {
    try {
      await this.stat(options);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Copy a file
   */
  async copy(options: CopyOptions): Promise<void> {
    if (!isNativePlatform()) {
      return webFilesystem.copy(options);
    }

    await callPlugin<CopyOptions, void>('Filesystem', 'copy', options);
  },

  /**
   * Rename/move a file
   */
  async rename(options: RenameOptions): Promise<void> {
    if (!isNativePlatform()) {
      return webFilesystem.rename(options);
    }

    await callPlugin<RenameOptions, void>('Filesystem', 'rename', options);
  },

  /**
   * Download a file from URL
   */
  async downloadFile(options: DownloadFileOptions): Promise<DownloadFileResult> {
    if (!isNativePlatform()) {
      return webFilesystem.downloadFile(options);
    }

    if (options.progress) {
      fileProgress.set({
        operation: 'download',
        progress: 0,
        path: options.path,
      });
    }

    const result = await callPlugin<DownloadFileOptions, DownloadFileResult>(
      'Filesystem',
      'downloadFile',
      options
    );

    fileProgress.set(null);
    return result;
  },

  /**
   * Get URI for a file
   */
  async getUri(options: { path: string; directory?: Directory }): Promise<{ uri: string }> {
    if (!isNativePlatform()) {
      return { uri: `file://${options.directory || 'Documents'}/${options.path}` };
    }

    return callPlugin('Filesystem', 'getUri', options);
  },

  /**
   * Request permissions (Android)
   */
  async requestPermissions(): Promise<{ publicStorage: 'granted' | 'denied' }> {
    if (!isNativePlatform()) {
      return { publicStorage: 'granted' };
    }

    return callPlugin('Filesystem', 'requestPermissions');
  },

  /**
   * Check permissions
   */
  async checkPermissions(): Promise<{ publicStorage: 'granted' | 'denied' | 'prompt' }> {
    if (!isNativePlatform()) {
      return { publicStorage: 'granted' };
    }

    return callPlugin('Filesystem', 'checkPermissions');
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Read JSON file
 */
export async function readJsonFile<T>(
  path: string,
  directory?: Directory
): Promise<T> {
  const result = await CapacitorFilesystem.readFile({
    path,
    directory,
    encoding: 'utf8',
  });
  return JSON.parse(result.data);
}

/**
 * Write JSON file
 */
export async function writeJsonFile<T>(
  path: string,
  data: T,
  directory?: Directory
): Promise<void> {
  await CapacitorFilesystem.writeFile({
    path,
    data: JSON.stringify(data, null, 2),
    directory,
    encoding: 'utf8',
    recursive: true,
  });
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to get file progress
 */
export function useFileProgress(): {
  operation: string;
  progress: number;
  path: string;
} | null {
  return fileProgress();
}

// ============================================================================
// Exports
// ============================================================================

export default CapacitorFilesystem;
