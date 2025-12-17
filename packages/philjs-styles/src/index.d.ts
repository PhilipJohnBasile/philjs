/**
 * PhilJS Styles
 *
 * Comprehensive styling solution for PhilJS:
 * - Scoped CSS (Svelte-style)
 * - CSS Modules
 * - CSS-in-JS
 * - Theming
 */
export { css, styled, keyframes, createGlobalStyle } from './scoped';
export { cssModules, useCSSModule, bindStyles } from './css-modules';
export { createStyled, createTheme, useTheme, ThemeProvider } from './css-in-js';
export { philjsStylesPlugin } from './vite-plugin';
export { cx, clsx, classNames, mergeStyles, extractCriticalCSS, injectStyles, } from './utils';
export type { StyleObject, CSSProperties, Theme, ThemeConfig, StyleVariant, } from './types';
//# sourceMappingURL=index.d.ts.map