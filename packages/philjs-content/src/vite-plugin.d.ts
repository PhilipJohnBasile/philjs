/**
 * PhilJS Content Collections - Vite Plugin
 *
 * Provides build-time processing for content collections including:
 * - Type generation for collections
 * - Frontmatter extraction
 * - MDX compilation
 * - Image optimization
 * - Hot module replacement
 */
import type { Plugin } from 'vite';
import type { ContentPluginOptions } from './types.js';
/**
 * PhilJS Content Vite Plugin
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import { contentPlugin } from 'philjs-content/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     contentPlugin({
 *       contentDir: './content',
 *       optimizeImages: true,
 *     }),
 *   ],
 * });
 * ```
 */
export declare function contentPlugin(userOptions?: ContentPluginOptions): Plugin;
/**
 * Alias for contentPlugin
 */
export declare const philJSContent: typeof contentPlugin;
/**
 * Default export
 */
export default contentPlugin;
//# sourceMappingURL=vite-plugin.d.ts.map