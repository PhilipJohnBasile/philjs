/**
 * Universal Component Protocol
 *
 * Defines the standard interface for cross-framework components.
 * Any component implementing this protocol can be rendered in
 * React, Vue, Svelte, Solid, or as a Web Component.
 */

import type { Signal } from '@philjs/core';

// ============================================================================
// Core Protocol Types
// ============================================================================

/**
 * Property definition with metadata for cross-framework translation
 */
export interface PropDefinition<T = unknown> {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function' | 'signal';
  required?: boolean;
  default?: T;
  validator?: (value: T) => boolean;
}

/**
 * Event definition for cross-framework event handling
 */
export interface EventDefinition<T = unknown> {
  /** Event payload type */
  payload?: T;
  /** Whether the event bubbles */
  bubbles?: boolean;
  /** Whether the event is cancelable */
  cancelable?: boolean;
}

/**
 * Slot definition for content projection
 */
export interface SlotDefinition {
  /** Slot name (empty string for default slot) */
  name: string;
  /** Expected content type hint */
  accepts?: 'text' | 'element' | 'any';
}

/**
 * Universal Component Definition
 */
export interface UniversalComponentDef<
  Props extends Record<string, unknown> = Record<string, unknown>,
  Events extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Unique component identifier */
  name: string;

  /** Component version (semver) */
  version?: string;

  /** Property definitions */
  props: Record<keyof Props, PropDefinition>;

  /** Event definitions */
  events?: Record<keyof Events, EventDefinition>;

  /** Slot definitions */
  slots?: SlotDefinition[];

  /** Component render function */
  render: (ctx: RenderContext<Props, Events>) => RenderOutput;

  /** Lifecycle hooks */
  lifecycle?: LifecycleHooks;

  /** Style encapsulation mode */
  styleMode?: 'scoped' | 'global' | 'shadow';

  /** CSS styles */
  styles?: string | string[];
}

/**
 * Render context provided to component render function
 */
export interface RenderContext<
  Props extends Record<string, unknown> = Record<string, unknown>,
  Events extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Reactive props */
  props: { [K in keyof Props]: Signal<Props[K]> };

  /** Emit event to parent */
  emit: <K extends keyof Events>(event: K, payload: Events[K]) => void;

  /** Get slot content */
  slot: (name?: string) => SlotContent;

  /** Access host element */
  host: () => Element | null;

  /** Request component update */
  update: () => void;
}

/**
 * Content passed to a slot
 */
export type SlotContent = {
  hasContent: boolean;
  render: () => RenderOutput;
};

/**
 * Component lifecycle hooks
 */
export interface LifecycleHooks {
  /** Called before component mounts */
  beforeMount?: () => void | Promise<void>;
  /** Called after component mounts */
  mounted?: () => void;
  /** Called before component updates */
  beforeUpdate?: () => void;
  /** Called after component updates */
  updated?: () => void;
  /** Called before component unmounts */
  beforeUnmount?: () => void;
  /** Called after component unmounts */
  unmounted?: () => void;
}

/**
 * Render output - framework-agnostic virtual node
 */
export interface VNode {
  type: string | typeof Fragment | ComponentRef;
  props: Record<string, unknown>;
  children: (VNode | string | number | null | undefined)[];
  key?: string | number;
}

export const Fragment = Symbol.for('philjs.fragment');

export type ComponentRef = UniversalComponentDef<any, any>;

export type RenderOutput = VNode | VNode[] | string | number | null | undefined;

// ============================================================================
// Component Definition Helpers
// ============================================================================

/**
 * Define a universal component
 */
export function defineComponent<
  Props extends Record<string, unknown> = Record<string, unknown>,
  Events extends Record<string, unknown> = Record<string, unknown>,
>(def: UniversalComponentDef<Props, Events>): UniversalComponentDef<Props, Events> {
  // Validate component definition
  if (!def.name) {
    throw new Error('Component must have a name');
  }
  if (!def.render) {
    throw new Error('Component must have a render function');
  }

  return Object.freeze(def);
}

/**
 * Create a virtual node
 */
export function h(
  type: string | typeof Fragment | ComponentRef,
  props: Record<string, unknown> | null,
  ...children: (VNode | string | number | null | undefined)[]
): VNode {
  return {
    type,
    props: props ?? {},
    children: children.flat(),
  };
}

/**
 * Create a text node
 */
export function text(content: string | number): VNode {
  return {
    type: 'TEXT_NODE',
    props: { nodeValue: String(content) },
    children: [],
  };
}

// ============================================================================
// Property Helpers
// ============================================================================

export const PropTypes = {
  string: (options?: Partial<PropDefinition<string>>): PropDefinition<string> => ({
    type: 'string',
    ...options,
  }),
  number: (options?: Partial<PropDefinition<number>>): PropDefinition<number> => ({
    type: 'number',
    ...options,
  }),
  boolean: (options?: Partial<PropDefinition<boolean>>): PropDefinition<boolean> => ({
    type: 'boolean',
    ...options,
  }),
  object: <T extends object>(options?: Partial<PropDefinition<T>>): PropDefinition<T> => ({
    type: 'object',
    ...options,
  }),
  array: <T>(options?: Partial<PropDefinition<T[]>>): PropDefinition<T[]> => ({
    type: 'array',
    ...options,
  }),
  function: <T extends (...args: any[]) => any>(
    options?: Partial<PropDefinition<T>>
  ): PropDefinition<T> => ({
    type: 'function',
    ...options,
  }),
  signal: <T>(options?: Partial<PropDefinition<Signal<T>>>): PropDefinition<Signal<T>> => ({
    type: 'signal',
    ...options,
  }),
};

// ============================================================================
// Component Registry
// ============================================================================

const registry = new Map<string, UniversalComponentDef>();

/**
 * Register a universal component globally
 */
export function registerComponent(component: UniversalComponentDef): void {
  if (registry.has(component.name)) {
    console.warn(`Component "${component.name}" is already registered. Overwriting.`);
  }
  registry.set(component.name, component);
}

/**
 * Get a registered component by name
 */
export function getComponent(name: string): UniversalComponentDef | undefined {
  return registry.get(name);
}

/**
 * Get all registered components
 */
export function getAllComponents(): Map<string, UniversalComponentDef> {
  return new Map(registry);
}

/**
 * Clear the component registry
 */
export function clearRegistry(): void {
  registry.clear();
}
