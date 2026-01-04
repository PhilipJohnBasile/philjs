/**
 * PhilJS CSS Modules Support
 *
 * Import and use CSS Modules with type safety.
 */
import type { CSSModuleConfig } from './types.js';
export type CSSModuleClasses = {
    readonly [key: string]: string;
};
/**
 * Create a CSS Modules helper
 */
export declare function cssModules<T extends CSSModuleClasses>(classes: T): T & {
    compose: (...classNames: (keyof T | string | undefined | null | false)[]) => string;
};
/**
 * Hook for using CSS Modules in components
 */
export declare function useCSSModule<T extends CSSModuleClasses>(styles: T): {
    styles: T;
    cx: (...classNames: (keyof T | string | undefined | null | false)[]) => string;
    getClass: (name: keyof T) => string;
};
/**
 * Bind styles to a component for easier usage
 */
export declare function bindStyles<T extends CSSModuleClasses>(styles: T): { [K in keyof T]: string; } & {
    cx: (...names: (keyof T | string | boolean | null | undefined)[]) => string;
};
/**
 * Generate CSS Module loader config for build tools
 */
export declare function getCSSModuleConfig(options?: CSSModuleConfig): {
    vite: {
        css: {
            modules: {
                scopeBehaviour: "local" | "global";
                localsConvention: "camelCase" | "camelCaseOnly" | "dashes" | "dashesOnly";
                generateScopedName: string;
            };
        };
    };
    postcss: {
        'postcss-modules': {
            scopeBehaviour: "local" | "global";
            localsConvention: "camelCase" | "camelCaseOnly" | "dashes" | "dashesOnly";
            generateScopedName: string;
        };
    };
    webpack: {
        modules: {
            mode: "local" | "global";
            localIdentName: string;
            exportLocalsConvention: "camelCase" | "camelCaseOnly" | "dashes" | "dashesOnly";
        };
    };
};
/**
 * Type-safe CSS Module import helper
 */
export declare function importCSSModule<T extends CSSModuleClasses>(modulePromise: Promise<{
    default: T;
}>): Promise<T>;
/**
 * Create conditional class names from CSS Module
 */
export declare function createClassNames<T extends CSSModuleClasses>(styles: T): (conditions: Partial<{ [K in keyof T]: boolean; }> | (keyof T)[]) => string;
//# sourceMappingURL=css-modules.d.ts.map