/**
 * File System APIs
 */

import { isTauri } from '../tauri/context';

// FileSystem types
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

export type BaseDirectory =
  | 'app'
  | 'appCache'
  | 'appConfig'
  | 'appData'
  | 'appLocalData'
  | 'appLog'
  | 'audio'
  | 'cache'
  | 'config'
  | 'data'
  | 'desktop'
  | 'document'
  | 'download'
  | 'executable'
  | 'font'
  | 'home'
  | 'localData'
  | 'log'
  | 'picture'
  | 'public'
  | 'runtime'
  | 'temp'
  | 'template'
  | 'video'
  | 'resource';

/**
 * File System API
 */
export const FileSystem = {
  /**
   * Read a text file
   */
  async readTextFile(path: string, baseDir?: BaseDirectory): Promise<string> {
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
  async readBinaryFile(path: string, baseDir?: BaseDirectory): Promise<Uint8Array> {
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
  async writeTextFile(
    path: string,
    contents: string,
    options?: WriteOptions & { baseDir?: BaseDirectory }
  ): Promise<void> {
    if (!isTauri()) {
      throw new Error('File system access not available in browser');
    }

    const { writeTextFile, mkdir } = await import('@tauri-apps/plugin-fs');

    if (options?.createDirs) {
      const dir = path.substring(0, path.lastIndexOf('/'));
      await mkdir(dir, { recursive: true }).catch(() => {});
    }

    const baseDirValue = options?.baseDir ? await getBaseDir(options.baseDir) : undefined;
    await writeTextFile(path, contents, {
      baseDir: baseDirValue,
      append: options?.append,
    });
  },

  /**
   * Write a binary file
   */
  async writeBinaryFile(
    path: string,
    contents: Uint8Array,
    options?: WriteOptions & { baseDir?: BaseDirectory }
  ): Promise<void> {
    if (!isTauri()) {
      throw new Error('File system access not available in browser');
    }

    const { writeFile, mkdir } = await import('@tauri-apps/plugin-fs');

    if (options?.createDirs) {
      const dir = path.substring(0, path.lastIndexOf('/'));
      await mkdir(dir, { recursive: true }).catch(() => {});
    }

    const baseDirValue = options?.baseDir ? await getBaseDir(options.baseDir) : undefined;
    await writeFile(path, contents, {
      baseDir: baseDirValue,
      append: options?.append,
    });
  },

  /**
   * Check if a path exists
   */
  async exists(path: string, baseDir?: BaseDirectory): Promise<boolean> {
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
  async createDir(path: string, options?: { recursive?: boolean; baseDir?: BaseDirectory }): Promise<void> {
    if (!isTauri()) {
      throw new Error('File system access not available in browser');
    }

    const { mkdir } = await import('@tauri-apps/plugin-fs');
    const baseDirValue = options?.baseDir ? await getBaseDir(options.baseDir) : undefined;
    await mkdir(path, {
      recursive: options?.recursive,
      baseDir: baseDirValue,
    });
  },

  /**
   * Remove a file
   */
  async removeFile(path: string, baseDir?: BaseDirectory): Promise<void> {
    if (!isTauri()) {
      throw new Error('File system access not available in browser');
    }

    const { remove } = await import('@tauri-apps/plugin-fs');
    const baseDirValue = baseDir ? await getBaseDir(baseDir) : undefined;
    await remove(path, { baseDir: baseDirValue });
  },

  /**
   * Remove a directory
   */
  async removeDir(path: string, options?: { recursive?: boolean; baseDir?: BaseDirectory }): Promise<void> {
    if (!isTauri()) {
      throw new Error('File system access not available in browser');
    }

    const { remove } = await import('@tauri-apps/plugin-fs');
    const baseDirValue = options?.baseDir ? await getBaseDir(options.baseDir) : undefined;
    await remove(path, {
      recursive: options?.recursive,
      baseDir: baseDirValue,
    });
  },

  /**
   * Read directory contents
   */
  async readDir(path: string, baseDir?: BaseDirectory): Promise<FileEntry[]> {
    if (!isTauri()) {
      throw new Error('File system access not available in browser');
    }

    const { readDir, stat } = await import('@tauri-apps/plugin-fs');
    const baseDirValue = baseDir ? await getBaseDir(baseDir) : undefined;
    const entries = await readDir(path, baseDirValue ? { baseDir: baseDirValue } : undefined);

    const result: FileEntry[] = [];
    for (const entry of entries) {
      const fullPath = `${path}/${entry.name}`;
      try {
        const info = await stat(fullPath, baseDirValue ? { baseDir: baseDirValue } : undefined);
        result.push({
          name: entry.name,
          path: fullPath,
          isDirectory: info.isDirectory,
          isFile: info.isFile,
          isSymlink: info.isSymlink,
          size: info.size,
          modifiedAt: info.mtime ? new Date(info.mtime) : undefined,
          createdAt: info.birthtime ? new Date(info.birthtime) : undefined,
        });
      } catch {
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
  async copyFile(source: string, destination: string, options?: CopyOptions): Promise<void> {
    if (!isTauri()) {
      throw new Error('File system access not available in browser');
    }

    const { copyFile } = await import('@tauri-apps/plugin-fs');
    await copyFile(source, destination);
  },

  /**
   * Rename/move a file
   */
  async rename(oldPath: string, newPath: string): Promise<void> {
    if (!isTauri()) {
      throw new Error('File system access not available in browser');
    }

    const { rename } = await import('@tauri-apps/plugin-fs');
    await rename(oldPath, newPath);
  },

  /**
   * Get file metadata
   */
  async stat(path: string, baseDir?: BaseDirectory): Promise<FileEntry> {
    if (!isTauri()) {
      throw new Error('File system access not available in browser');
    }

    const { stat } = await import('@tauri-apps/plugin-fs');
    const baseDirValue = baseDir ? await getBaseDir(baseDir) : undefined;
    const info = await stat(path, baseDirValue ? { baseDir: baseDirValue } : undefined);

    const name = path.split('/').pop() || path;

    return {
      name,
      path,
      isDirectory: info.isDirectory,
      isFile: info.isFile,
      isSymlink: info.isSymlink,
      size: info.size,
      modifiedAt: info.mtime ? new Date(info.mtime) : undefined,
      createdAt: info.birthtime ? new Date(info.birthtime) : undefined,
    };
  },

  /**
   * Watch a path for changes
   */
  async watch(
    path: string | string[],
    callback: (event: { type: string; paths: string[] }) => void,
    options?: { recursive?: boolean; baseDir?: BaseDirectory }
  ): Promise<() => void> {
    if (!isTauri()) {
      throw new Error('File watching not available in browser');
    }

    const { watch } = await import('@tauri-apps/plugin-fs');
    const baseDirValue = options?.baseDir ? await getBaseDir(options.baseDir) : undefined;
    const unwatch = await watch(
      path,
      (event) => {
        callback({
          type: String(event.type),
          paths: event.paths.map(p => String(p)),
        });
      },
      {
        recursive: options?.recursive,
        baseDir: baseDirValue,
      }
    );

    return unwatch;
  },
};

// Helper to get base directory enum
// This is a simple async helper - caller must await
async function getBaseDir(dir: BaseDirectory): Promise<number> {
  const { BaseDirectory: BD } = await import('@tauri-apps/plugin-fs');
  const mapping: Record<string, number> = {
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
