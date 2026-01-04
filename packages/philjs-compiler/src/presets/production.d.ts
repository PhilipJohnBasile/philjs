/**
 * Production Build Preset
 * Optimized configuration for production deployments
 *
 * Features:
 * - Maximum minification
 * - Aggressive tree shaking
 * - Optimized chunk splitting
 * - Source maps for debugging
 * - Asset optimization
 * - Performance budgets
 */
import type { CompilerConfig } from '../types.js';
import type { UserConfig } from 'vite';
export interface ProductionPresetOptions {
    /**
     * Enable source maps (recommended for error tracking)
     * @default true
     */
    sourceMaps?: boolean;
    /**
     * Minification level
     * @default 'aggressive'
     */
    minify?: 'none' | 'basic' | 'aggressive';
    /**
     * Enable code splitting
     * @default true
     */
    codeSplitting?: boolean;
    /**
     * Target browsers (for polyfills and transpilation)
     * @default ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']
     */
    target?: string | string[];
    /**
     * Performance budgets (in bytes)
     */
    budgets?: {
        /** Maximum initial bundle size */
        maxInitial?: number;
        /** Maximum chunk size */
        maxChunk?: number;
        /** Maximum total size */
        maxTotal?: number;
    };
    /**
     * Asset optimization settings
     */
    assets?: {
        /** Inline assets smaller than this (bytes) */
        inlineLimit?: number;
        /** Enable image optimization */
        optimizeImages?: boolean;
        /** Enable SVG optimization */
        optimizeSvg?: boolean;
        /** Enable font subsetting */
        subsetFonts?: boolean;
    };
    /**
     * Preload/prefetch hints
     */
    hints?: {
        /** Enable preload for critical chunks */
        preload?: boolean;
        /** Enable prefetch for lazy chunks */
        prefetch?: boolean;
    };
    /**
     * Enable bundle analysis report
     * @default true
     */
    analyze?: boolean;
}
/**
 * Default production configuration
 */
export declare const defaultProductionConfig: Required<ProductionPresetOptions>;
/**
 * Create production preset for PhilJS compiler
 */
export declare function createProductionPreset(options?: ProductionPresetOptions): CompilerConfig;
/**
 * Create Vite configuration for production builds
 */
export declare function createProductionViteConfig(options?: ProductionPresetOptions): Partial<UserConfig>;
/**
 * Generate module preload directives for critical chunks
 */
export declare function generatePreloadHints(chunks: string[]): string;
/**
 * Generate prefetch directives for lazy chunks
 */
export declare function generatePrefetchHints(chunks: string[]): string;
/**
 * Check if build meets performance budgets
 */
export declare function checkPerformanceBudgets(stats: {
    size: number;
    gzipSize: number;
    name: string;
}[], budgets?: ProductionPresetOptions['budgets']): {
    passed: boolean;
    violations: Array<{
        type: string;
        limit: number;
        actual: number;
    }>;
};
/**
 * Format size for display
 */
export declare function formatSize(bytes: number): string;
/**
 * Calculate compression ratio
 */
export declare function calculateCompressionRatio(original: number, compressed: number): string;
export default createProductionPreset;
//# sourceMappingURL=production.d.ts.map