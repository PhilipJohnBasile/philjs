/**
 * PhilJS Styles
 *
 * Comprehensive styling solution for PhilJS:
 * - Scoped CSS (Svelte-style)
 * - CSS Modules
 * - CSS-in-JS
 * - Theming
 */
export { css, styled, keyframes, createGlobalStyle } from './scoped.js';
export { cssModules, useCSSModule, bindStyles } from './css-modules.js';
export { createStyled, createTheme, useTheme, ThemeProvider } from './css-in-js.js';
export { philjsStylesPlugin } from './vite-plugin.js';
export { cx, clsx, classNames, mergeStyles, extractCriticalCSS, injectStyles, } from './utils.js';
export type { StyleObject, CSSProperties, Theme, ThemeConfig, StyleVariant, } from './types.js';
//# sourceMappingURL=index.d.ts.map