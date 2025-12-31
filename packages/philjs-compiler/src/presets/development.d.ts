/**
 * Development Build Preset
 * Optimized configuration for development workflow
 *
 * Features:
 * - Fast rebuilds with caching
 * - Detailed source maps
 * - HMR optimization
 * - Enhanced error messages
 * - Performance profiling
 * - No minification (for readability)
 */
import type { CompilerConfig } from '../types.js';
import type { UserConfig } from 'vite';
export interface DevelopmentPresetOptions {
    /**
     * Enable source maps
     * @default true
     */
    sourceMaps?: boolean;
    /**
     * Enable verbose logging
     * @default false
     */
    verbose?: boolean;
    /**
     * Enable HMR state preservation
     * @default true
     */
    hmrStatePreservation?: boolean;
    /**
     * Enable enhanced error overlay
     * @default true
     */
    enhancedErrors?: boolean;
    /**
     * Enable performance profiling
     * @default true
     */
    profiling?: boolean;
    /**
     * Enable build caching
     * @default true
     */
    cache?: boolean;
    /**
     * Port for dev server
     * @default 3000
     */
    port?: number;
    /**
     * Enable HTTPS
     * @default false
     */
    https?: boolean;
    /**
     * Open browser on start
     * @default true
     */
    open?: boolean;
}
/**
 * Default development configuration
 */
export declare const defaultDevelopmentConfig: Required<DevelopmentPresetOptions>;
/**
 * Create development preset for PhilJS compiler
 */
export declare function createDevelopmentPreset(options?: DevelopmentPresetOptions): CompilerConfig;
/**
 * Create Vite configuration for development builds
 */
export declare function createDevelopmentViteConfig(options?: DevelopmentPresetOptions): Partial<UserConfig>;
/**
 * Development performance metrics
 */
export interface DevMetrics {
    /** HMR update time (ms) */
    hmrTime: number;
    /** Full rebuild time (ms) */
    rebuildTime: number;
    /** Cache hit rate (%) */
    cacheHitRate: number;
    /** Number of modules */
    moduleCount: number;
    /** Memory usage (MB) */
    memoryUsage: number;
}
/**
 * Track development performance metrics
 */
export declare class DevPerformanceTracker {
    private metrics;
    private startTime;
    start(): void;
    end(type: 'hmr' | 'rebuild'): number;
    getMetrics(): DevMetrics[];
    getAverageHmrTime(): number;
    getAverageRebuildTime(): number;
    private getMemoryUsage;
    reset(): void;
    printSummary(): void;
}
/**
 * Enhanced error formatter for development
 */
export declare function formatDevError(error: Error): string;
/**
 * Development build reporter
 */
export interface DevBuildReport {
    /** Build duration (ms) */
    duration: number;
    /** Modules processed */
    modules: number;
    /** Cache hits */
    cacheHits: number;
    /** Warnings */
    warnings: string[];
    /** Errors */
    errors: string[];
}
export declare function printDevBuildReport(report: DevBuildReport): void;
export default createDevelopmentPreset;
//# sourceMappingURL=development.d.ts.map