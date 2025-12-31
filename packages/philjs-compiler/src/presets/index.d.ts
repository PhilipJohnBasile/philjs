/**
 * PhilJS Compiler Presets
 * Pre-configured build settings for different scenarios
 */
export { createProductionPreset, createProductionViteConfig, generatePreloadHints, generatePrefetchHints, checkPerformanceBudgets, formatSize, calculateCompressionRatio, defaultProductionConfig, type ProductionPresetOptions, } from './production.js';
export { createDevelopmentPreset, createDevelopmentViteConfig, formatDevError, printDevBuildReport, DevPerformanceTracker, defaultDevelopmentConfig, type DevelopmentPresetOptions, type DevMetrics, type DevBuildReport, } from './development.js';
export { createLibraryPreset, createLibraryViteConfig, generatePackageJsonFields, validateLibraryBuild, printLibraryBuildReport, defaultLibraryConfig, type LibraryPresetOptions, type LibraryValidation, } from './library.js';
//# sourceMappingURL=index.d.ts.map