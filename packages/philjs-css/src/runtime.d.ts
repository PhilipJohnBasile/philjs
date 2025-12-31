/**
 * PhilJS CSS Runtime - SSR Hydration and Dynamic Styles
 *
 * This module provides runtime utilities for:
 * - SSR style hydration
 * - Dynamic style injection
 * - Theme switching at runtime
 * - CSS-in-JS to CSS extraction
 */
import type { CSSStyleObject, Theme, CSSResult } from './types.js';
/**
 * Inject a style rule at runtime
 */
export declare function injectStyle(className: string, cssText: string): void;
/**
 * Remove a style rule at runtime
 */
export declare function removeStyle(className: string): void;
/**
 * Clear all runtime styles
 */
export declare function clearStyles(): void;
/**
 * Hydrate styles from SSR
 *
 * Call this on the client to sync with server-rendered styles
 *
 * @example
 * ```ts
 * // In your app entry point
 * import { hydrateStyles } from 'philjs-css/runtime';
 *
 * hydrateStyles();
 * ```
 */
export declare function hydrateStyles(): void;
/**
 * Get SSR style tag for server rendering
 *
 * @example
 * ```ts
 * // In your SSR handler
 * import { getSSRStyles } from 'philjs-css/runtime';
 *
 * const html = `
 *   <html>
 *     <head>${getSSRStyles()}</head>
 *     <body>${app}</body>
 *   </html>
 * `;
 * ```
 */
export declare function getSSRStyles(): string;
/**
 * Get SSR style tag with critical CSS only
 */
export declare function getCriticalSSRStyles(usedClasses: string[]): string;
/**
 * Create a dynamic style that can change at runtime
 *
 * @example
 * ```ts
 * const dynamicButton = createDynamicStyle({
 *   padding: '10px 20px',
 *   backgroundColor: 'blue'
 * });
 *
 * // Later, update the style
 * dynamicButton.update({ backgroundColor: 'red' });
 *
 * // Clean up when done
 * dynamicButton.dispose();
 * ```
 */
export declare function createDynamicStyle(initialStyles: CSSStyleObject): {
    className: string;
    update: (styles: CSSStyleObject) => void;
    dispose: () => void;
};
/**
 * Create a reactive style that updates based on a signal/observable
 *
 * @example
 * ```ts
 * const [getColor, setColor] = createSignal('blue');
 *
 * const reactiveStyle = createReactiveStyle(() => ({
 *   backgroundColor: getColor()
 * }));
 *
 * // Style updates automatically when color changes
 * setColor('red');
 * ```
 */
export declare function createReactiveStyle(getStyles: () => CSSStyleObject): {
    className: string;
    refresh: () => void;
    dispose: () => void;
};
/**
 * Apply a theme at runtime
 *
 * @example
 * ```ts
 * const darkTheme = createThemeVariant(lightTheme, 'dark', {
 *   colors: { background: '#1a1a1a', text: '#ffffff' }
 * });
 *
 * // Switch to dark theme
 * applyTheme(darkTheme);
 *
 * // Switch to light theme
 * applyTheme(lightTheme, '[data-theme="light"]');
 * ```
 */
export declare function applyTheme(theme: Theme, selector?: string): void;
/**
 * Toggle between light and dark themes
 *
 * @example
 * ```ts
 * const { toggle, isDark } = createThemeToggle(lightTheme, darkTheme);
 *
 * // Toggle theme
 * toggle();
 *
 * // Check current theme
 * console.log(isDark()); // true or false
 * ```
 */
export declare function createThemeToggle(lightTheme: Theme, darkTheme: Theme): {
    toggle: () => void;
    setTheme: (mode: 'light' | 'dark') => void;
    isDark: () => boolean;
};
/**
 * Sync theme with system preference
 *
 * @example
 * ```ts
 * syncWithSystemTheme(lightTheme, darkTheme);
 * // Theme will automatically change when system preference changes
 * ```
 */
export declare function syncWithSystemTheme(lightTheme: Theme, darkTheme: Theme): () => void;
/**
 * Set a CSS variable at runtime
 *
 * @example
 * ```ts
 * setCSSVariable('--primary-color', '#3b82f6');
 * setCSSVariable('--spacing-md', '16px', document.querySelector('.container'));
 * ```
 */
export declare function setCSSVariable(name: string, value: string, element?: HTMLElement): void;
/**
 * Get a CSS variable value at runtime
 */
export declare function getCSSVariable(name: string, element?: HTMLElement): string;
/**
 * Remove a CSS variable at runtime
 */
export declare function removeCSSVariable(name: string, element?: HTMLElement): void;
/**
 * Batch set multiple CSS variables
 *
 * @example
 * ```ts
 * setCSSVariables({
 *   '--primary-color': '#3b82f6',
 *   '--secondary-color': '#10b981',
 *   '--spacing-md': '16px'
 * });
 * ```
 */
export declare function setCSSVariables(variables: Record<string, string>, element?: HTMLElement): void;
/**
 * Batch style updates for better performance
 *
 * @example
 * ```ts
 * batchStyleUpdates(() => {
 *   injectStyle('class1', '.class1 { color: red; }');
 *   injectStyle('class2', '.class2 { color: blue; }');
 *   injectStyle('class3', '.class3 { color: green; }');
 * });
 * ```
 */
export declare function batchStyleUpdates(fn: () => void): void;
/**
 * Prefetch and cache styles for components
 *
 * @example
 * ```ts
 * // Prefetch styles for components that will be rendered soon
 * prefetchStyles([buttonStyles, cardStyles, modalStyles]);
 * ```
 */
export declare function prefetchStyles(styles: CSSResult[]): void;
/**
 * Get debug info about current styles
 */
export declare function getStyleDebugInfo(): {
    totalRules: number;
    rulesByType: Record<string, number>;
    totalSize: number;
};
//# sourceMappingURL=runtime.d.ts.map