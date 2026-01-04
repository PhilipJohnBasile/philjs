/**
 * Plugin generator utilities
 */
import type { Plugin } from './index.js';
export interface PluginOptions {
    name: string;
    description?: string;
    author?: string;
    license?: string;
    template?: 'basic' | 'vite' | 'full';
}
/**
 * Create a new plugin from options
 */
export declare function createPlugin(options: PluginOptions): Plugin;
/**
 * Generate plugin files
 */
export declare function generatePluginFiles(targetDir: string, options: PluginOptions): Promise<void>;
/**
 * Initialize a new plugin project
 */
export declare function initPlugin(options: PluginOptions): Promise<string>;
//# sourceMappingURL=generator.d.ts.map