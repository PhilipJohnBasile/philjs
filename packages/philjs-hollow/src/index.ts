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
export {
  HollowElement,
  property,
  defineElement,
  type PropertyOptions,
} from './core/base-element.js';

// Design tokens
export {
  tokens,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  designTokensCSS,
  createTheme,
} from './styles/tokens.js';

// Components
export {
  HollowButton,
  type ButtonVariant,
  type ButtonSize,
} from './components/button.js';

export {
  HollowInput,
  type InputVariant,
  type InputSize,
  type InputType,
} from './components/input.js';

export {
  HollowCard,
  type CardVariant,
  type CardPadding,
} from './components/card.js';

// Register all components
import './components/index.js';

// Re-export wrappers namespace
export * as react from './wrappers/react.js';
export * as vue from './wrappers/vue.js';
export * as svelte from './wrappers/svelte.js';
export * as philjs from './wrappers/philjs.js';
