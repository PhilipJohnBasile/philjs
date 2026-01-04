/**
 * @fileoverview Server-only exports for @philjs/core
 * These modules use Node.js APIs and should only be used in server environments
 * (Node.js, build tools, SSR, etc.)
 */
export { virtualModulesPlugin, generateVirtualModuleTypes, writeVirtualModuleTypes, } from "./virtual-modules.js";
export type { VirtualModuleConfig, RouteMetadata } from "./virtual-modules.js";
export { readFile, writeFile, copyFile, getStats, fileExists, dirExists, readDir, matchFiles, deleteFile, deleteDir, createDir, moveFile, watchFile, watchDir, readJSON, writeJSON, clearCaches, getCacheStats, fileUtils, } from "./file-utils.js";
export type { ReadFileOptions, WriteFileOptions, CopyFileOptions, GetStatsOptions, ReadDirOptions, WatchOptions, } from "./file-utils.js";
export * from "./index.browser.js";
//# sourceMappingURL=server.d.ts.map