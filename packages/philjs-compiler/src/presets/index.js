/**
 * PhilJS Compiler Presets
 * Pre-configured build settings for different scenarios
 */
export { createProductionPreset, createProductionViteConfig, generatePreloadHints, generatePrefetchHints, checkPerformanceBudgets, formatSize, calculateCompressionRatio, defaultProductionConfig, } from './production.js';
export { createDevelopmentPreset, createDevelopmentViteConfig, formatDevError, printDevBuildReport, DevPerformanceTracker, defaultDevelopmentConfig, } from './development.js';
export { createLibraryPreset, createLibraryViteConfig, generatePackageJsonFields, validateLibraryBuild, printLibraryBuildReport, defaultLibraryConfig, } from './library.js';
//# sourceMappingURL=index.js.map