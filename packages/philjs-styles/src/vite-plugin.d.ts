/**
 * PhilJS Styles Vite Plugin
 *
 * Provides CSS scoping, CSS Modules, and style extraction for PhilJS.
 */
import type { Plugin } from 'vite';
export interface PhilJSStylesPluginOptions {
    /** Enable CSS scoping */
    scoping?: boolean;
    /** CSS Modules configuration */
    cssModules?: {
        scopeBehaviour?: 'local' | 'global';
        localsConvention?: 'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly';
    };
    /** Extract critical CSS for SSR */
    extractCritical?: boolean;
    /** Prefix for scoped class names */
    classPrefix?: string;
}
export declare function philjsStylesPlugin(options?: PhilJSStylesPluginOptions): Plugin;
export default philjsStylesPlugin;
//# sourceMappingURL=vite-plugin.d.ts.map