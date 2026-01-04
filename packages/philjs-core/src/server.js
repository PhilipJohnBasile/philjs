/**
 * @fileoverview Server-only exports for @philjs/core
 * These modules use Node.js APIs and should only be used in server environments
 * (Node.js, build tools, SSR, etc.)
 */
// Virtual Modules Plugin (uses fs/promises, path)
export { virtualModulesPlugin, generateVirtualModuleTypes, writeVirtualModuleTypes, } from "./virtual-modules.js";
// File Utilities (uses fs/promises, path, fs)
export { readFile, writeFile, copyFile, getStats, fileExists, dirExists, readDir, matchFiles, deleteFile, deleteDir, createDir, moveFile, watchFile, watchDir, readJSON, writeJSON, clearCaches, getCacheStats, fileUtils, } from "./file-utils.js";
// Re-export everything from main for convenience in server environments
// This allows `import { signal, readFile } from "@philjs/core/server"`
export * from "./index.browser.js";
//# sourceMappingURL=server.js.map