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
export { css, styled, keyframes, createGlobalStyle } from './scoped';
// CSS Modules
export { cssModules, useCSSModule, bindStyles } from './css-modules';
// CSS-in-JS
export { createStyled, createTheme, useTheme, ThemeProvider } from './css-in-js';
// Vite plugin
export { philjsStylesPlugin } from './vite-plugin';
// Utilities
export { cx, clsx, classNames, mergeStyles, extractCriticalCSS, injectStyles, } from './utils';
//# sourceMappingURL=index.js.map