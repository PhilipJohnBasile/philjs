/**
 * @philjs/hollow
 * Framework-agnostic Web Components with multi-framework wrappers
 *
 * @example
 * ```ts
 * // Use directly as Web Components
 * import '@philjs/hollow';
 *
 * // Or use framework-specific wrappers
 * import { Button } from '@philjs/hollow/react';
 * import { HollowButton } from '@philjs/hollow/vue';
 * import { hollow } from '@philjs/hollow/svelte';
 * import { Button } from '@philjs/hollow/philjs';
 * ```
 *
 * @module @philjs/hollow
 */
// Core exports
export { HollowElement, property, defineElement, } from './core/base-element.js';
// Design tokens
export { tokens, colors, typography, spacing, borderRadius, shadows, transitions, zIndex, designTokensCSS, createTheme, } from './styles/tokens.js';
// Components
export { HollowButton, } from './components/button.js';
export { HollowInput, } from './components/input.js';
export { HollowCard, } from './components/card.js';
// Register all components
import './components/index.js';
// Re-export wrappers namespace
export * as react from './wrappers/react.js';
export * as vue from './wrappers/vue.js';
export * as svelte from './wrappers/svelte.js';
export * as philjs from './wrappers/philjs.js';
//# sourceMappingURL=index.js.map