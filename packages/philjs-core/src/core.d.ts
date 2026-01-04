/**
 * @philjs/core/core - Minimal core bundle (~4KB)
 *
 * Import from '@philjs/core/core' for the smallest possible bundle.
 * Only includes signals and JSX runtime - everything you need for basic apps.
 *
 * For additional features, import them separately:
 * - '@philjs/core/forms' - Form handling
 * - '@philjs/core/i18n' - Internationalization
 * - '@philjs/core/animation' - Animations
 * - '@philjs/core/context' - Context API
 * - etc.
 */
export { signal, memo, linkedSignal, resource, effect, batch, untrack, onCleanup, createRoot } from "./signals.js";
export type { Signal, Memo, LinkedSignal, Resource, EffectCleanup } from "./signals.js";
export { jsx, jsxs, jsxDEV, Fragment, createElement, isJSXElement } from "./jsx-runtime.js";
export type { JSXElement, VNode } from "./jsx-runtime.js";
export { hydrate, render } from "./hydrate.js";
//# sourceMappingURL=core.d.ts.map