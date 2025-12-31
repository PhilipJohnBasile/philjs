/**
 * File System APIs
 */
import { isTauri } from '../tauri/context.js';
/**
 * File System API
 */
export const FileSystem = {
    /**
     * Read a text file
     */
    async readTextFile(path, baseDir) {
        if (!isTauri()) {
            throw new Error('File system access not available in browser');
        }
        const { readTextFile } = await import('@tauri-apps/plugin-fs');
        const baseDirValue = baseDir ? await getBaseDir(baseDir) : undefined;
        return readTextFile(path, baseDirValue ? { baseDir: baseDirValue } : undefined);
    },
    /**
     * Read a binary file
     */
    async readBinaryFile(path, baseDir) {
        if (!isTauri()) {
            throw new Error('File system access not available in browser');
        }
        const { readFile } = await import('@tauri-apps/plugin-fs');
        const baseDirValue = baseDir ? await getBaseDir(baseDir) : undefined;
        return readFile(path, baseDirValue ? { baseDir: baseDirValue } : undefined);
    },
    /**
     * Write a text file
     */
    async writeTextFile(path, contents, options) {
        if (!isTauri()) {
            throw new Error('File system access not available in browser');
        }
        const { writeTextFile, mkdir } = await import('@tauri-apps/plugin-fs');
        if (options?.createDirs) {
            const dir = path.substring(0, path.lastIndexOf('/'));
            await mkdir(dir, { recursive: true }).catch(() => { });
        }
        const baseDirValue = options?.baseDir ? await getBaseDir(options.baseDir) : undefined;
        const writeOptions = {};
        if (baseDirValue !== undefined)
            writeOptions.baseDir = baseDirValue;
        if (options?.append !== undefined)
            writeOptions.append = options.append;
        await writeTextFile(path, contents, writeOptions);
    },
    /**
     * Write a binary file
     */
    async writeBinaryFile(path, contents, options) {
        if (!isTauri()) {
            throw new Error('File system access not available in browser');
        }
        const { writeFile, mkdir } = await import('@tauri-apps/plugin-fs');
        if (options?.createDirs) {
            const dir = path.substring(0, path.lastIndexOf('/'));
            await mkdir(dir, { recursive: true }).catch(() => { });
        }
        const baseDirValue = options?.baseDir ? await getBaseDir(options.baseDir) : undefined;
        const writeOptions = {};
        if (baseDirValue !== undefined)
            writeOptions.baseDir = baseDirValue;
        if (options?.append !== undefined)
            writeOptions.append = options.append;
        await writeFile(path, contents, writeOptions);
    },
    /**
     * Check if a path exists
     */
    async exists(path, baseDir) {
        if (!isTauri()) {
            return false;
        }
        const { exists } = await import('@tauri-apps/plugin-fs');
        const baseDirValue = baseDir ? await getBaseDir(baseDir) : undefined;
        return exists(path, baseDirValue ? { baseDir: baseDirValue } : undefined);
    },
    /**
     * Create a directory
     */
    async createDir(path, options) {
        if (!isTauri()) {
            throw new Error('File system access not available in browser');
        }
        const { mkdir } = await import('@tauri-apps/plugin-fs');
        const baseDirValue = options?.baseDir ? await getBaseDir(options.baseDir) : undefined;
        const mkdirOptions = {};
        if (options?.recursive !== undefined)
            mkdirOptions.recursive = options.recursive;
        if (baseDirValue !== undefined)
            mkdirOptions.baseDir = baseDirValue;
        await mkdir(path, mkdirOptions);
    },
    /**
     * Remove a file
     */
    async removeFile(path, baseDir) {
        if (!isTauri()) {
            throw new Error('File system access not available in browser');
        }
        const { remove } = await import('@tauri-apps/plugin-fs');
        const baseDirValue = baseDir ? await getBaseDir(baseDir) : undefined;
        const removeOptions = {};
        if (baseDirValue !== undefined)
            removeOptions.baseDir = baseDirValue;
        await remove(path, removeOptions);
    },
    /**
     * Remove a directory
     */
    async removeDir(path, options) {
        if (!isTauri()) {
            throw new Error('File system access not available in browser');
        }
        const { remove } = await import('@tauri-apps/plugin-fs');
        const baseDirValue = options?.baseDir ? await getBaseDir(options.baseDir) : undefined;
        const removeDirOptions = {};
        if (options?.recursive !== undefined)
            removeDirOptions.recursive = options.recursive;
        if (baseDirValue !== undefined)
            removeDirOptions.baseDir = baseDirValue;
        await remove(path, removeDirOptions);
    },
    /**
     * Read directory contents
     */
    async readDir(path, baseDir) {
        if (!isTauri()) {
            throw new Error('File system access not available in browser');
        }
        const { readDir, stat } = await import('@tauri-apps/plugin-fs');
        const baseDirValue = baseDir ? await getBaseDir(baseDir) : undefined;
        const entries = await readDir(path, baseDirValue ? { baseDir: baseDirValue } : undefined);
        const result = [];
        for (const entry of entries) {
            const fullPath = `${path}/${entry.name}`;
            try {
                const info = await stat(fullPath, baseDirValue ? { baseDir: baseDirValue } : undefined);
                const fileEntry = {
                    name: entry.name,
                    path: fullPath,
                    isDirectory: info.isDirectory,
                    isFile: info.isFile,
                    isSymlink: info.isSymlink,
                    size: info.size,
                };
                if (info.mtime)
                    fileEntry.modifiedAt = new Date(info.mtime);
                if (info.birthtime)
                    fileEntry.createdAt = new Date(info.birthtime);
                result.push(fileEntry);
            }
            catch {
                result.push({
                    name: entry.name,
                    path: fullPath,
                    isDirectory: entry.isDirectory || false,
                    isFile: entry.isFile || false,
                    isSymlink: entry.isSymlink || false,
                });
            }
        }
        return result;
    },
    /**
     * Copy a file
     */
    async copyFile(source, destination, options) {
        if (!isTauri()) {
            throw new Error('File system access not available in browser');
        }
        const { copyFile } = await import('@tauri-apps/plugin-fs');
        await copyFile(source, destination);
    },
    /**
     * Rename/move a file
     */
    async rename(oldPath, newPath) {
        if (!isTauri()) {
            throw new Error('File system access not available in browser');
        }
        const { rename } = await import('@tauri-apps/plugin-fs');
        await rename(oldPath, newPath);
    },
    /**
     * Get file metadata
     */
    async stat(path, baseDir) {
        if (!isTauri()) {
            throw new Error('File system access not available in browser');
        }
        const { stat } = await import('@tauri-apps/plugin-fs');
        const baseDirValue = baseDir ? await getBaseDir(baseDir) : undefined;
        const info = await stat(path, baseDirValue ? { baseDir: baseDirValue } : undefined);
        const name = path.split('/').pop() || path;
        const fileEntry = {
            name,
            path,
            isDirectory: info.isDirectory,
            isFile: info.isFile,
            isSymlink: info.isSymlink,
            size: info.size,
        };
        if (info.mtime)
            fileEntry.modifiedAt = new Date(info.mtime);
        if (info.birthtime)
            fileEntry.createdAt = new Date(info.birthtime);
        return fileEntry;
    },
    /**
     * Watch a path for changes
     */
    async watch(path, callback, options) {
        if (!isTauri()) {
            throw new Error('File watching not available in browser');
        }
        const { watch } = await import('@tauri-apps/plugin-fs');
        const baseDirValue = options?.baseDir ? await getBaseDir(options.baseDir) : undefined;
        const watchOptions = {};
        if (options?.recursive !== undefined)
            watchOptions.recursive = options.recursive;
        if (baseDirValue !== undefined)
            watchOptions.baseDir = baseDirValue;
        const unwatch = await watch(path, (event) => {
            callback({
                type: String(event.type),
                paths: event.paths.map(p => String(p)),
            });
        }, watchOptions);
        return unwatch;
    },
};
// Helper to get base directory enum
// This is a simple async helper - caller must await
async function getBaseDir(dir) {
    const { BaseDirectory: BD } = await import('@tauri-apps/plugin-fs');
    const mapping = {
        app: BD.AppConfig,
        appCache: BD.AppCache,
        appConfig: BD.AppConfig,
        appData: BD.AppData,
        appLocalData: BD.AppLocalData,
        appLog: BD.AppLog,
        audio: BD.Audio,
        cache: BD.Cache,
        config: BD.Config,
        data: BD.Data,
        desktop: BD.Desktop,
        document: BD.Document,
        download: BD.Download,
        executable: BD.Executable,
        font: BD.Font,
        home: BD.Home,
        localData: BD.LocalData,
        log: BD.AppLog,
        picture: BD.Picture,
        public: BD.Public,
        runtime: BD.Runtime,
        temp: BD.Temp,
        template: BD.Template,
        video: BD.Video,
        resource: BD.Resource,
    };
    return mapping[dir] ?? BD.AppData;
}
// Convenience exports
export const readTextFile = FileSystem.readTextFile;
export const readBinaryFile = FileSystem.readBinaryFile;
export const writeTextFile = FileSystem.writeTextFile;
export const writeBinaryFile = FileSystem.writeBinaryFile;
export const exists = FileSystem.exists;
export const createDir = FileSystem.createDir;
export const removeFile = FileSystem.removeFile;
export const removeDir = FileSystem.removeDir;
export const readDir = FileSystem.readDir;
export const copyFile = FileSystem.copyFile;
export const rename = FileSystem.rename;
export const stat = FileSystem.stat;
export const watchPath = FileSystem.watch;
//# sourceMappingURL=filesystem.js.map