/**
 * Universal Component Adapters
 *
 * Provides adapters to convert Universal Components to framework-specific formats.
 */

export { toWebComponent } from './web-component.js';
export type { WebComponentOptions } from './web-component.js';
export { toPhilJS } from './philjs.js';

// Re-export types
export type {
  UniversalComponentDef,
  VNode,
  RenderContext,
  PropDefinition,
  EventDefinition,
} from '../protocol.js';
