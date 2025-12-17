/**
 * PhilJS Tailwind Vite Plugin
 *
 * Optimizations for Tailwind CSS in PhilJS applications.
 */
import type { Plugin } from 'vite';
export interface PhilJSTailwindViteOptions {
    /** Enable Just-in-Time mode optimizations */
    jit?: boolean;
    /** Content paths for Tailwind */
    content?: string[];
    /** Purge unused styles in production */
    purge?: boolean;
    /** Extract critical CSS for SSR */
    extractCritical?: boolean;
}
export declare function philjsTailwindVite(options?: PhilJSTailwindViteOptions): Plugin;
export default philjsTailwindVite;
//# sourceMappingURL=vite-plugin.d.ts.map