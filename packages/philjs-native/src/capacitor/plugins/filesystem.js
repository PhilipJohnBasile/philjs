// @ts-nocheck
/**
 * PhilJS Native - Capacitor Filesystem Plugin
 *
 * Provides file system access for reading, writing, and managing
 * files and directories on the device.
 */
import { signal } from 'philjs-core';
import { isCapacitor, isNativePlatform, callPlugin, registerPlugin, } from '../index.js';
// ============================================================================
// State
// ============================================================================
/**
 * File operation progress
 */
export const fileProgress = signal(null);
// ============================================================================
// Web Storage Implementation
// ============================================================================
/**
 * Web filesystem using IndexedDB for persistence
 */
class WebFilesystem {
    dbName = 'philjs_filesystem';
    storeName = 'files';
    db = null;
    async getDB() {
        if (this.db)
            return this.db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onerror = () => reject(new Error('Failed to open database'));
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'path' });
                }
            };
        });
    }
    getFullPath(path, directory) {
        const dir = directory || 'Documents';
        return `/${dir}/${path}`.replace(/\/+/g, '/');
    }
    async readFile(options) {
        const db = await this.getDB();
        const fullPath = this.getFullPath(options.path, options.directory);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(fullPath);
            request.onsuccess = () => {
                if (request.result) {
                    resolve({ data: request.result.data });
                }
                else {
                    reject(new Error(`File not found: ${fullPath}`));
                }
            };
            request.onerror = () => reject(new Error('Failed to read file'));
        });
    }
    async writeFile(options) {
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
    async appendFile(options) {
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
        }
        catch {
            // File doesn't exist, create it
            await this.writeFile({
                path: options.path,
                data: options.data,
                directory: options.directory,
                encoding: options.encoding,
            });
        }
    }
    async deleteFile(options) {
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
    async mkdir(options) {
        const fullPath = this.getFullPath(options.path, options.directory);
        if (options.recursive) {
            const parts = fullPath.split('/').filter(Boolean);
            let currentPath = '';
            for (const part of parts) {
                currentPath += '/' + part;
                await this.ensureDir(currentPath);
            }
        }
        else {
            await this.ensureDir(fullPath);
        }
    }
    async ensureDir(path) {
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
    async rmdir(options) {
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
                }
                else {
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
    async readdir(options) {
        const db = await this.getDB();
        const fullPath = this.getFullPath(options.path, options.directory);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            request.onsuccess = () => {
                const files = request.result
                    .filter((item) => {
                    const itemDir = item.path.substring(0, item.path.lastIndexOf('/'));
                    return itemDir === fullPath;
                })
                    .map((item) => ({
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
    async stat(options) {
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
                }
                else {
                    reject(new Error(`File not found: ${fullPath}`));
                }
            };
            request.onerror = () => reject(new Error('Failed to stat file'));
        });
    }
    async copy(options) {
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
    async rename(options) {
        await this.copy(options);
        await this.deleteFile({
            path: options.from,
            directory: options.directory,
        });
    }
    async downloadFile(options) {
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
    async readFile(options) {
        if (!isNativePlatform()) {
            return webFilesystem.readFile(options);
        }
        return callPlugin('Filesystem', 'readFile', options);
    },
    /**
     * Read a file as binary (base64)
     */
    async readFileBinary(options) {
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
    async writeFile(options) {
        if (!isNativePlatform()) {
            return webFilesystem.writeFile(options);
        }
        return callPlugin('Filesystem', 'writeFile', options);
    },
    /**
     * Write binary data to a file
     */
    async writeFileBinary(options) {
        const binary = Array.from(new Uint8Array(options.data))
            .map((b) => String.fromCharCode(b))
            .join('');
        const base64 = btoa(binary);
        return this.writeFile({ ...options, data: base64 });
    },
    /**
     * Append to a file
     */
    async appendFile(options) {
        if (!isNativePlatform()) {
            return webFilesystem.appendFile(options);
        }
        await callPlugin('Filesystem', 'appendFile', options);
    },
    /**
     * Delete a file
     */
    async deleteFile(options) {
        if (!isNativePlatform()) {
            return webFilesystem.deleteFile(options);
        }
        await callPlugin('Filesystem', 'deleteFile', options);
    },
    /**
     * Create a directory
     */
    async mkdir(options) {
        if (!isNativePlatform()) {
            return webFilesystem.mkdir(options);
        }
        await callPlugin('Filesystem', 'mkdir', options);
    },
    /**
     * Remove a directory
     */
    async rmdir(options) {
        if (!isNativePlatform()) {
            return webFilesystem.rmdir(options);
        }
        await callPlugin('Filesystem', 'rmdir', options);
    },
    /**
     * Read directory contents
     */
    async readdir(options) {
        if (!isNativePlatform()) {
            return webFilesystem.readdir(options);
        }
        return callPlugin('Filesystem', 'readdir', options);
    },
    /**
     * Get file/directory stats
     */
    async stat(options) {
        if (!isNativePlatform()) {
            return webFilesystem.stat(options);
        }
        return callPlugin('Filesystem', 'stat', options);
    },
    /**
     * Check if file/directory exists
     */
    async exists(options) {
        try {
            await this.stat(options);
            return true;
        }
        catch {
            return false;
        }
    },
    /**
     * Copy a file
     */
    async copy(options) {
        if (!isNativePlatform()) {
            return webFilesystem.copy(options);
        }
        await callPlugin('Filesystem', 'copy', options);
    },
    /**
     * Rename/move a file
     */
    async rename(options) {
        if (!isNativePlatform()) {
            return webFilesystem.rename(options);
        }
        await callPlugin('Filesystem', 'rename', options);
    },
    /**
     * Download a file from URL
     */
    async downloadFile(options) {
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
        const result = await callPlugin('Filesystem', 'downloadFile', options);
        fileProgress.set(null);
        return result;
    },
    /**
     * Get URI for a file
     */
    async getUri(options) {
        if (!isNativePlatform()) {
            return { uri: `file://${options.directory || 'Documents'}/${options.path}` };
        }
        return callPlugin('Filesystem', 'getUri', options);
    },
    /**
     * Request permissions (Android)
     */
    async requestPermissions() {
        if (!isNativePlatform()) {
            return { publicStorage: 'granted' };
        }
        return callPlugin('Filesystem', 'requestPermissions');
    },
    /**
     * Check permissions
     */
    async checkPermissions() {
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
export async function readJsonFile(path, directory) {
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
export async function writeJsonFile(path, data, directory) {
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
export function useFileProgress() {
    return fileProgress();
}
// ============================================================================
// Exports
// ============================================================================
export default CapacitorFilesystem;
//# sourceMappingURL=filesystem.js.map