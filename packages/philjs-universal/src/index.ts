/**
 * @philjs/universal
 *
 * Universal Component Protocol - Write once, render in any framework
 *
 * This package provides a framework-agnostic way to define components
 * that can be rendered in React, Vue, Svelte, Solid, or as Web Components.
 */

// Core protocol
export {
  defineComponent,
  h,
  text,
  Fragment,
  PropTypes,
  registerComponent,
  getComponent,
  getAllComponents,
  clearRegistry,
} from './protocol.js';

// Types
export type {
  UniversalComponentDef,
  PropDefinition,
  EventDefinition,
  SlotDefinition,
  RenderContext,
  SlotContent,
  LifecycleHooks,
  VNode,
  RenderOutput,
  ComponentRef,
} from './protocol.js';

// Adapters
export { toWebComponent, type WebComponentOptions } from './adapters/web-component.js';
export { toPhilJS, type PhilJSComponentOptions } from './adapters/philjs.js';
