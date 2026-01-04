/**
 * PhilJS Styles
 *
 * Comprehensive styling solution for PhilJS:
 * - Scoped CSS (Svelte-style)
 * - CSS Modules
 * - CSS-in-JS
 * - Theming
 */
// Scoped styles
export { css, styled, keyframes, createGlobalStyle } from './scoped.js';
// CSS Modules
export { cssModules, useCSSModule, bindStyles } from './css-modules.js';
// CSS-in-JS
export { createStyled, createTheme, useTheme, ThemeProvider } from './css-in-js.js';
// Vite plugin
export { philjsStylesPlugin } from './vite-plugin.js';
// Utilities
export { cx, clsx, classNames, mergeStyles, extractCriticalCSS, injectStyles, } from './utils.js';
//# sourceMappingURL=index.js.map