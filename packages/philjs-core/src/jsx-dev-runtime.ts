/**
 * JSX development runtime for PhilJS.
 * Used by Vite/esbuild in development mode for better error messages and debugging.
 */

// Re-export everything from the main jsx-runtime
export { jsx, jsxs, jsxDEV, Fragment, createElement, isJSXElement } from "./jsx-runtime.js";
export type { JSXElement, VNode } from "./jsx-runtime.js";
