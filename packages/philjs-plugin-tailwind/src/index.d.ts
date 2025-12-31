/**
 * PhilJS Tailwind CSS Plugin
 * Automatic Tailwind CSS setup and optimization
 */
import type { Plugin } from "philjs-core/plugin-system";
/**
 * Tailwind plugin configuration
 */
export interface TailwindPluginConfig {
    /** Path to Tailwind config file */
    configPath?: string;
    /** Enable JIT mode */
    jit?: boolean;
    /** Custom content paths */
    content?: string[];
    /** Tailwind theme customization */
    theme?: Record<string, any>;
    /** Plugins to include */
    plugins?: any[];
    /** Enable dark mode */
    darkMode?: "media" | "class" | false;
    /** Optimization settings */
    optimization?: {
        /** Purge unused styles in production */
        purge?: boolean;
        /** Minify CSS */
        minify?: boolean;
        /** Remove comments */
        removeComments?: boolean;
    };
}
/**
 * Create Tailwind plugin
 */
export declare function createTailwindPlugin(userConfig?: TailwindPluginConfig): Plugin;
/**
 * Default export
 */
declare const _default: Plugin;
export default _default;
/**
 * Tailwind utility helpers
 */
export declare const tailwindUtils: {
    /**
     * Generate Tailwind class validator
     */
    createClassValidator(): (className: string) => boolean;
    /**
     * Merge Tailwind classes (removes duplicates, handles conflicts)
     */
    mergeClasses(...classes: (string | undefined | null | false)[]): string;
    /**
     * Convert CSS variables to Tailwind theme
     */
    cssVarsToTheme(cssVars: Record<string, string>): Record<string, any>;
    /**
     * Detect content paths from project structure
     */
    detectContentPaths(rootDir: string): Promise<string[]>;
    /**
     * Generate responsive utilities helper
     */
    responsive(base: string, variants: Record<string, string>): string;
    /**
     * Generate state variants
     */
    withStates(base: string, states?: string[]): string;
};
/**
 * Re-export utilities
 */
export * from './utils.js';
export * from './content-detector.js';
export { generateColorPalette, generateBrandTheme, generateTypographyScale, generateSpacingScale, generateBorderRadiusScale, generateShadowScale, generateBreakpoints, generateFontFamilies, generateCompleteTheme, cssVarsToTheme, presetThemes, type ColorPalette, type ThemeConfig, } from './theme-generator.js';
export * from './optimizer.js';
//# sourceMappingURL=index.d.ts.map