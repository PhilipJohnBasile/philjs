/**
 * Ambient module declarations for third-party dependencies
 * These modules ship their own types but may not be properly resolved
 * in monorepo/workspace configurations.
 */

declare module 'commander' {
  export class Command {
    constructor(name?: string);
    name(str: string): this;
    description(str: string): this;
    version(str: string, flags?: string, description?: string): this;
    argument(name: string, description?: string, defaultValue?: string): this;
    option(flags: string, description?: string, defaultValue?: string | boolean): this;
    action(fn: (...args: any[]) => void | Promise<void>): this;
    parse(argv?: string[]): this;
    opts(): Record<string, unknown>;
  }
}

declare module 'chalk' {
  interface ChalkInstance {
    (text: string): string;
    bold: ChalkInstance;
    dim: ChalkInstance;
    red: ChalkInstance;
    green: ChalkInstance;
    yellow: ChalkInstance;
    blue: ChalkInstance;
    cyan: ChalkInstance;
    magenta: ChalkInstance;
    white: ChalkInstance;
    gray: ChalkInstance;
    grey: ChalkInstance;
    bgRed: ChalkInstance;
    bgGreen: ChalkInstance;
    bgBlue: ChalkInstance;
    bgCyan: ChalkInstance;
    bgMagenta: ChalkInstance;
    bgYellow: ChalkInstance;
    bgWhite: ChalkInstance;
  }

  const chalk: ChalkInstance;
  export default chalk;
}

declare module 'ora' {
  interface Spinner {
    start(text?: string): Spinner;
    stop(): Spinner;
    succeed(text?: string): Spinner;
    fail(text?: string): Spinner;
    warn(text?: string): Spinner;
    info(text?: string): Spinner;
    text: string;
    isSpinning: boolean;
  }

  interface OraOptions {
    text?: string;
    spinner?: string | object;
    color?: string;
    hideCursor?: boolean;
    indent?: number;
    interval?: number;
    stream?: NodeJS.WritableStream;
    isEnabled?: boolean;
    isSilent?: boolean;
    discardStdin?: boolean;
  }

  function ora(options?: string | OraOptions): Spinner;
  export default ora;
}

declare module 'fs-extra' {
  import * as fs from 'fs';

  // fs-extra specific methods
  export function ensureDirSync(path: string): void;
  export function ensureDir(path: string): Promise<void>;
  export function writeJsonSync(file: string, object: any, options?: { spaces?: number }): void;
  export function writeJson(file: string, object: any, options?: { spaces?: number }): Promise<void>;
  export function readJsonSync(file: string): any;
  export function readJson(file: string): Promise<any>;
  export function copySync(src: string, dest: string, options?: object): void;
  export function copy(src: string, dest: string, options?: object): Promise<void>;
  export function removeSync(path: string): void;
  export function remove(path: string): Promise<void>;
  export function pathExistsSync(path: string): boolean;
  export function pathExists(path: string): Promise<boolean>;
  export function outputFileSync(file: string, data: string | Buffer): void;
  export function outputFile(file: string, data: string | Buffer): Promise<void>;
  export function emptyDirSync(path: string): void;
  export function emptyDir(path: string): Promise<void>;
  export function moveSync(src: string, dest: string, options?: { overwrite?: boolean }): void;
  export function move(src: string, dest: string, options?: { overwrite?: boolean }): Promise<void>;

  // Re-export all fs methods
  export const readFileSync: typeof fs.readFileSync;
  export const writeFileSync: typeof fs.writeFileSync;
  export const existsSync: typeof fs.existsSync;
  export const mkdirSync: typeof fs.mkdirSync;
  export const readdirSync: typeof fs.readdirSync;
  export const statSync: typeof fs.statSync;
  export const unlinkSync: typeof fs.unlinkSync;
  export const rmdirSync: typeof fs.rmdirSync;
  export const renameSync: typeof fs.renameSync;
  export const copyFileSync: typeof fs.copyFileSync;
  export const readFile: typeof fs.readFile;
  export const writeFile: typeof fs.writeFile;
  export const mkdir: typeof fs.mkdir;
  export const readdir: typeof fs.readdir;
  export const stat: typeof fs.stat;
  export const unlink: typeof fs.unlink;
  export const rmdir: typeof fs.rmdir;
  export const rename: typeof fs.rename;
  export const copyFile: typeof fs.copyFile;

  // Extended fs type that includes fs-extra methods
  interface FsExtra {
    // fs-extra methods
    ensureDirSync(path: string): void;
    ensureDir(path: string): Promise<void>;
    writeJsonSync(file: string, object: any, options?: { spaces?: number }): void;
    writeJson(file: string, object: any, options?: { spaces?: number }): Promise<void>;
    readJsonSync(file: string): any;
    readJson(file: string): Promise<any>;
    copySync(src: string, dest: string, options?: object): void;
    copy(src: string, dest: string, options?: object): Promise<void>;
    removeSync(path: string): void;
    remove(path: string): Promise<void>;
    pathExistsSync(path: string): boolean;
    pathExists(path: string): Promise<boolean>;
    outputFileSync(file: string, data: string | Buffer): void;
    outputFile(file: string, data: string | Buffer): Promise<void>;
    emptyDirSync(path: string): void;
    emptyDir(path: string): Promise<void>;
    moveSync(src: string, dest: string, options?: { overwrite?: boolean }): void;
    move(src: string, dest: string, options?: { overwrite?: boolean }): Promise<void>;
    // Standard fs methods
    readFileSync: typeof fs.readFileSync;
    writeFileSync: typeof fs.writeFileSync;
    existsSync: typeof fs.existsSync;
    mkdirSync: typeof fs.mkdirSync;
    readdirSync: typeof fs.readdirSync;
    statSync: typeof fs.statSync;
    unlinkSync: typeof fs.unlinkSync;
    rmdirSync: typeof fs.rmdirSync;
    renameSync: typeof fs.renameSync;
    copyFileSync: typeof fs.copyFileSync;
    readFile: typeof fs.readFile;
    writeFile: typeof fs.writeFile;
    mkdir: typeof fs.mkdir;
    readdir: typeof fs.readdir;
    stat: typeof fs.stat;
    unlink: typeof fs.unlink;
    rmdir: typeof fs.rmdir;
    rename: typeof fs.rename;
    copyFile: typeof fs.copyFile;
  }

  const fsExtra: FsExtra;
  export default fsExtra;
}
