/**
 * Vite plugin for PhilJS optimizer
 */
import type { Plugin } from 'vite';
import type { OptimizerOptions } from './types.js';
export interface ViteOptimizerOptions extends Partial<OptimizerOptions> {
    /** Bundling strategy */
    strategy?: 'default' | 'aggressive' | 'conservative' | 'route' | 'depth' | 'size' | 'hybrid';
    /** Include patterns */
    include?: string | string[];
    /** Exclude patterns */
    exclude?: string | string[];
    /** Whether to generate source maps */
    sourcemap?: boolean;
    /** Base URL for lazy chunks */
    baseUrl?: string;
}
/**
 * Vite plugin for PhilJS optimizer
 */
export declare function philjsOptimizer(options?: ViteOptimizerOptions): Plugin;
/**
 * Default export
 */
export default philjsOptimizer;
//# sourceMappingURL=vite.d.ts.map