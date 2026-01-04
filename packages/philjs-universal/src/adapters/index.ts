/**
 * Universal Component Adapters
 *
 * Provides adapters to convert Universal Components to framework-specific formats.
 */

export { toWebComponent, WebComponentOptions } from './web-component';
export { toPhilJS } from './philjs';

// Re-export types
export type {
  UniversalComponentDef,
  VNode,
  RenderContext,
  PropDefinition,
  EventDefinition,
} from '../protocol';
