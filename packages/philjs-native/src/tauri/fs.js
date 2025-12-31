/**
 * PhilJS Native - Tauri File System Access
 *
 * Provides comprehensive file system operations for Tauri applications
 * with path resolution, file watching, and streaming support.
 */
import { signal, effect } from 'philjs-core';
import { isTauri, getTauriInternals, invoke } from './index.js';
import { subscribe, publish } from './events.js';
// ============================================================================
// Path Resolution
// ============================================================================
/**
 * Resolve path with base directory
 */
export async function resolvePath(path, baseDir) {
    if (!isTauri()) {
        return path;
    }
    const internals = getTauriInternals();
    const pathModule = internals?.path;
    if (!pathModule)
        return path;
    if (baseDir) {
        const basePath = await getBaseDir(baseDir);
        return await pathModule.resolve(basePath, path);
    }
    return await pathModule.resolve(path);
}
/**
 * Get base directory path
 */
export async function getBaseDir(dir) {
    if (!isTauri()) {
        return '';
    }
    const internals = getTauriInternals();
    const pathModule = internals?.path;
    if (!pathModule)
        return '';
    const dirFunctions = {
        App: () => pathModule.appDir(),
        AppCache: () => pathModule.appCacheDir(),
        AppConfig: () => pathModule.appConfigDir(),
        AppData: () => pathModule.appDataDir(),
        AppLocalData: () => pathModule.appLocalDataDir(),
        AppLog: () => pathModule.appLogDir(),
        Audio: () => pathModule.audioDir(),
        Cache: () => pathModule.cacheDir(),
        Config: () => pathModule.configDir(),
        Data: () => pathModule.dataDir(),
        Desktop: () => pathModule.desktopDir(),
        Document: () => pathModule.documentDir(),
        Download: () => pathModule.downloadDir(),
        Executable: () => pathModule.executableDir(),
        Font: () => pathModule.fontDir(),
        Home: () => pathModule.homeDir(),
        LocalData: () => pathModule.localDataDir(),
        Log: () => pathModule.logDir(),
        Picture: () => pathModule.pictureDir(),
        Public: () => pathModule.publicDir(),
        Resource: () => pathModule.resourceDir(),
        Runtime: () => pathModule.runtimeDir(),
        Temp: () => pathModule.tempDir(),
        Template: () => pathModule.templateDir(),
        Video: () => pathModule.videoDir(),
    };
    return await dirFunctions[dir]?.() || '';
}
/**
 * Join paths
 */
export async function joinPath(...paths) {
    if (!isTauri()) {
        return paths.join('/');
    }
    const internals = getTauriInternals();
    return await internals?.path?.join(...paths) || paths.join('/');
}
/**
 * Get directory name
 */
export async function dirname(path) {
    if (!isTauri()) {
        const parts = path.split('/');
        parts.pop();
        return parts.join('/');
    }
    const internals = getTauriInternals();
    return await internals?.path?.dirname(path) || '';
}
/**
 * Get base name
 */
export async function basename(path, ext) {
    if (!isTauri()) {
        const name = path.split('/').pop() || '';
        if (ext && name.endsWith(ext)) {
            return name.slice(0, -ext.length);
        }
        return name;
    }
    const internals = getTauriInternals();
    return await internals?.path?.basename(path, ext) || '';
}
/**
 * Get extension
 */
export async function extname(path) {
    if (!isTauri()) {
        const name = path.split('/').pop() || '';
        const dotIndex = name.lastIndexOf('.');
        return dotIndex > 0 ? name.slice(dotIndex) : '';
    }
    const internals = getTauriInternals();
    return await internals?.path?.extname(path) || '';
}
/**
 * Normalize path
 */
export async function normalize(path) {
    if (!isTauri()) {
        return path.replace(/\\/g, '/').replace(/\/+/g, '/');
    }
    const internals = getTauriInternals();
    return await internals?.path?.normalize(path) || path;
}
// ============================================================================
// File Operations
// ============================================================================
/**
 * Read file as text
 */
export async function readTextFile(path, options) {
    if (!isTauri()) {
        throw new Error('File system access requires Tauri');
    }
    const internals = getTauriInternals();
    const fs = internals?.fs;
    if (!fs) {
        throw new Error('Tauri fs module not available');
    }
    const resolvedPath = await resolvePath(path, options?.baseDir);
    return await fs.readTextFile(resolvedPath, { dir: options?.baseDir });
}
/**
 * Read file as binary
 */
export async function readBinaryFile(path, options) {
    if (!isTauri()) {
        throw new Error('File system access requires Tauri');
    }
    const internals = getTauriInternals();
    const fs = internals?.fs;
    if (!fs) {
        throw new Error('Tauri fs module not available');
    }
    const resolvedPath = await resolvePath(path, options?.baseDir);
    return await fs.readBinaryFile(resolvedPath, { dir: options?.baseDir });
}
/**
 * Write text file
 */
export async function writeTextFile(path, contents, options) {
    if (!isTauri()) {
        throw new Error('File system access requires Tauri');
    }
    const internals = getTauriInternals();
    const fs = internals?.fs;
    if (!fs) {
        throw new Error('Tauri fs module not available');
    }
    const resolvedPath = await resolvePath(path, options?.baseDir);
    await fs.writeTextFile(resolvedPath, contents, { dir: options?.baseDir });
}
/**
 * Write binary file
 */
export async function writeBinaryFile(path, contents, options) {
    if (!isTauri()) {
        throw new Error('File system access requires Tauri');
    }
    const internals = getTauriInternals();
    const fs = internals?.fs;
    if (!fs) {
        throw new Error('Tauri fs module not available');
    }
    const data = contents instanceof ArrayBuffer ? new Uint8Array(contents) : contents;
    const resolvedPath = await resolvePath(path, options?.baseDir);
    await fs.writeBinaryFile(resolvedPath, data, { dir: options?.baseDir });
}
/**
 * Read JSON file
 */
export async function readJsonFile(path, options) {
    const content = await readTextFile(path, options);
    return JSON.parse(content);
}
/**
 * Write JSON file
 */
export async function writeJsonFile(path, data, options) {
    const content = options?.pretty
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data);
    await writeTextFile(path, content, options);
}
/**
 * Append to file
 */
export async function appendFile(path, contents, options) {
    if (!isTauri()) {
        throw new Error('File system access requires Tauri');
    }
    try {
        const existing = await readTextFile(path, options);
        await writeTextFile(path, existing + contents, options);
    }
    catch {
        // File doesn't exist, create it
        await writeTextFile(path, contents, options);
    }
}
// ============================================================================
// Directory Operations
// ============================================================================
/**
 * Read directory
 */
export async function readDir(path, options) {
    if (!isTauri()) {
        throw new Error('File system access requires Tauri');
    }
    const internals = getTauriInternals();
    const fs = internals?.fs;
    if (!fs) {
        throw new Error('Tauri fs module not available');
    }
    const resolvedPath = await resolvePath(path, options?.baseDir);
    const entries = await fs.readDir(resolvedPath, {
        dir: options?.baseDir,
        recursive: options?.recursive,
    });
    return entries.map((entry) => ({
        name: entry.name || '',
        path: entry.path,
        isDirectory: !!entry.children,
        isFile: !entry.children,
        isSymlink: false,
        children: entry.children?.map((child) => ({
            name: child.name || '',
            path: child.path,
            isDirectory: !!child.children,
            isFile: !child.children,
            isSymlink: false,
        })),
    }));
}
/**
 * Create directory
 */
export async function createDir(path, options) {
    if (!isTauri()) {
        throw new Error('File system access requires Tauri');
    }
    const internals = getTauriInternals();
    const fs = internals?.fs;
    if (!fs) {
        throw new Error('Tauri fs module not available');
    }
    const resolvedPath = await resolvePath(path, options?.baseDir);
    await fs.createDir(resolvedPath, {
        dir: options?.baseDir,
        recursive: options?.recursive ?? true,
    });
}
/**
 * Remove directory
 */
export async function removeDir(path, options) {
    if (!isTauri()) {
        throw new Error('File system access requires Tauri');
    }
    const internals = getTauriInternals();
    const fs = internals?.fs;
    if (!fs) {
        throw new Error('Tauri fs module not available');
    }
    const resolvedPath = await resolvePath(path, options?.baseDir);
    await fs.removeDir(resolvedPath, {
        dir: options?.baseDir,
        recursive: options?.recursive,
    });
}
/**
 * Remove file
 */
export async function removeFile(path, options) {
    if (!isTauri()) {
        throw new Error('File system access requires Tauri');
    }
    const internals = getTauriInternals();
    const fs = internals?.fs;
    if (!fs) {
        throw new Error('Tauri fs module not available');
    }
    const resolvedPath = await resolvePath(path, options?.baseDir);
    await fs.removeFile(resolvedPath, { dir: options?.baseDir });
}
/**
 * Rename/move file or directory
 */
export async function rename(from, to, options) {
    if (!isTauri()) {
        throw new Error('File system access requires Tauri');
    }
    const internals = getTauriInternals();
    const fs = internals?.fs;
    if (!fs) {
        throw new Error('Tauri fs module not available');
    }
    const fromPath = await resolvePath(from, options?.fromBaseDir);
    const toPath = await resolvePath(to, options?.toBaseDir);
    await fs.renameFile(fromPath, toPath);
}
/**
 * Copy file
 */
export async function copyFile(from, to, options) {
    if (!isTauri()) {
        throw new Error('File system access requires Tauri');
    }
    const internals = getTauriInternals();
    const fs = internals?.fs;
    if (!fs) {
        throw new Error('Tauri fs module not available');
    }
    const fromPath = await resolvePath(from, options?.fromBaseDir);
    const toPath = await resolvePath(to, options?.toBaseDir);
    await fs.copyFile(fromPath, toPath);
}
/**
 * Check if path exists
 */
export async function exists(path, options) {
    if (!isTauri()) {
        return false;
    }
    const internals = getTauriInternals();
    const fs = internals?.fs;
    if (!fs) {
        return false;
    }
    try {
        const resolvedPath = await resolvePath(path, options?.baseDir);
        await fs.readDir(resolvedPath);
        return true;
    }
    catch {
        try {
            await readTextFile(path, options);
            return true;
        }
        catch {
            return false;
        }
    }
}
// ============================================================================
// File Watching
// ============================================================================
/**
 * Watch handles
 */
const watchHandles = new Map();
/**
 * Watch a file or directory for changes
 */
export async function watch(paths, callback, options) {
    if (!isTauri()) {
        throw new Error('File watching requires Tauri');
    }
    const pathArray = Array.isArray(paths) ? paths : [paths];
    const resolvedPaths = await Promise.all(pathArray.map((p) => resolvePath(p, options?.baseDir)));
    const watchId = `watch_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    try {
        // Use Tauri's watch API
        const unsubscribe = await subscribe(`tauri://fs-watch/${watchId}`, (event) => {
            callback(event);
        });
        // Start the watch via command
        await invoke('plugin:fs|watch', {
            paths: resolvedPaths,
            options: {
                recursive: options?.recursive ?? true,
            },
            id: watchId,
        });
        const cleanup = () => {
            unsubscribe();
            invoke('plugin:fs|unwatch', { id: watchId }).catch(() => { });
            watchHandles.delete(watchId);
        };
        watchHandles.set(watchId, cleanup);
        return cleanup;
    }
    catch {
        // Fallback: poll for changes
        console.warn('Native file watching not available, using polling fallback');
        return watchPoll(resolvedPaths, callback, 1000);
    }
}
/**
 * Polling fallback for file watching
 */
function watchPoll(paths, callback, interval) {
    const lastModified = new Map();
    let running = true;
    const poll = async () => {
        while (running) {
            for (const path of paths) {
                try {
                    const content = await readTextFile(path);
                    const hash = content.length; // Simplified change detection
                    const prevHash = lastModified.get(path);
                    if (prevHash !== undefined && prevHash !== hash) {
                        callback({ type: 'modify', paths: [path] });
                    }
                    lastModified.set(path, hash);
                }
                catch {
                    // File might not exist or be readable
                }
            }
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
    };
    poll();
    return () => {
        running = false;
    };
}
/**
 * Stop all file watches
 */
export function unwatchAll() {
    watchHandles.forEach((cleanup) => cleanup());
    watchHandles.clear();
}
// ============================================================================
// Hooks
// ============================================================================
/**
 * Hook to read a file
 */
export function useFile(path, options) {
    const content = signal(null);
    const loading = signal(true);
    const error = signal(null);
    const reload = async () => {
        loading.set(true);
        error.set(null);
        try {
            const text = await readTextFile(path, options);
            content.set(text);
        }
        catch (e) {
            error.set(e);
        }
        finally {
            loading.set(false);
        }
    };
    effect(() => {
        reload();
    });
    return {
        content: content(),
        loading: loading(),
        error: error(),
        reload,
    };
}
/**
 * Hook to watch a file
 */
export function useFileWatch(path, options) {
    const events = signal([]);
    effect(() => {
        let cleanup;
        watch(path, (event) => {
            events.set([...events(), event]);
        }, options).then((c) => (cleanup = c));
        return () => cleanup?.();
    });
    return {
        events: events(),
        clear: () => events.set([]),
    };
}
// ============================================================================
// Exports
// ============================================================================
export default {
    // Path utilities
    resolvePath,
    getBaseDir,
    joinPath,
    dirname,
    basename,
    extname,
    normalize,
    // File operations
    readTextFile,
    readBinaryFile,
    writeTextFile,
    writeBinaryFile,
    readJsonFile,
    writeJsonFile,
    appendFile,
    // Directory operations
    readDir,
    createDir,
    removeDir,
    removeFile,
    rename,
    copyFile,
    exists,
    // Watching
    watch,
    unwatchAll,
};
//# sourceMappingURL=fs.js.map