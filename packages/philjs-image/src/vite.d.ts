/**
 * PhilJS Image - Vite Plugin
 *
 * Optimizes images during build and serves them in development
 */
import type { Plugin } from 'vite';
import type { ImageOptimizationConfig } from './types.js';
interface PhilJSImagePluginOptions extends ImageOptimizationConfig {
}
export default function philjsImage(options?: PhilJSImagePluginOptions): Plugin;
export {};
//# sourceMappingURL=vite.d.ts.map