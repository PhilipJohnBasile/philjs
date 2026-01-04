/**
 * Vue 3 Adapter Types for Universal Component Protocol
 */

import type { Component, DefineComponent, App, Plugin, Ref } from 'vue';

// ============================================================================
// Signal Types (simplified to avoid circular dependency issues)
// ============================================================================

/**
 * A PhilJS signal interface
 */
export interface Signal<T> {
  (): T;
  set(value: T): void;
  peek(): T;
  subscribe(callback: (value: T) => void): () => void;
}

/**
 * A PhilJS memo interface
 */
export interface Memo<T> {
  (): T;
  subscribe(callback: (value: T) => void): () => void;
}

/**
 * Universal Component interface
 */
export interface UniversalComponent<Props = Record<string, unknown>> {
  readonly id: string;
  readonly name: string;
  readonly source: string;
  readonly version?: string;
  mount(container: HTMLElement, props: Props): UniversalInstance<Props>;
}

/**
 * Universal Instance interface
 */
export interface UniversalInstance<Props = Record<string, unknown>> {
  readonly props: Props;
  readonly element: HTMLElement;
  update(newProps: Partial<Props>): void;
  unmount(): void;
  on(event: string, handler: () => void): () => void;
  onError(handler: (error: Error) => void): () => void;
  getElement(): HTMLElement;
}

/**
 * Signal Bridge interface
 */
export interface SignalBridge<T> {
  peek(): T;
  get(): T;
  set(value: T | ((prev: T) => T)): void;
  subscribe(callback: (value: T) => void): () => void;
}

// ============================================================================
// Vue Component Types
// ============================================================================

/**
 * Vue component that can be wrapped for universal use.
 * Supports both Options API and Composition API components.
 */
export type VueComponent<Props = Record<string, unknown>> = Component<Props>;

/**
 * Options for converting Vue components to Universal components
 */
export interface FromVueOptions {
  /** Component identifier (auto-generated if not provided) */
  id?: string;

  /** Component display name (extracted from component if not provided) */
  name?: string;

  /** Component version */
  version?: string;

  /**
   * Whether to automatically convert PhilJS signals to Vue refs.
   * When true, signal props will be unwrapped and synced with reactive refs.
   * @default true
   */
  convertSignals?: boolean;

  /**
   * Custom prop transformer for advanced prop handling.
   * Called before props are passed to the Vue component.
   */
  transformProps?: <P>(props: P) => P;

  /**
   * Event name transformer.
   * By default, Vue events are prefixed with 'vue:'.
   */
  transformEventName?: (eventName: string) => string;

  /**
   * Whether to expose Vue instance methods.
   * @default false
   */
  exposeInstance?: boolean;
}

/**
 * Options for converting Universal components to Vue components
 */
export interface ToVueOptions {
  /**
   * Whether to convert UniversalContext to Vue provide/inject.
   * @default true
   */
  useProvideInject?: boolean;

  /**
   * Custom slot configuration.
   * Maps slot names to Universal component children.
   */
  slots?: Record<string, string>;

  /**
   * Event name transformer for Universal to Vue events.
   * By default, events are emitted as-is.
   */
  transformEventName?: (eventName: string) => string;
}

// ============================================================================
// Signal Integration Types
// ============================================================================

/**
 * A PhilJS signal that can be used in Vue composables
 */
export interface ReactiveSignal<T> {
  /** Get current value */
  (): T;
  /** Set new value */
  set(value: T): void;
  /** Get value without tracking */
  peek(): T;
  /** Subscribe to changes */
  subscribe(callback: (value: T) => void): () => void;
}

/**
 * Type guard to check if a value is a PhilJS signal
 */
export function isPhilJSSignal<T>(value: unknown): value is Signal<T> {
  return (
    typeof value === 'function' &&
    value !== null &&
    'set' in value &&
    'peek' in value &&
    'subscribe' in value
  );
}

/**
 * Type guard to check if a value is a PhilJS memo/computed
 */
export function isPhilJSMemo<T>(value: unknown): value is Memo<T> {
  return (
    typeof value === 'function' &&
    value !== null &&
    'subscribe' in value &&
    !('set' in value)
  );
}

/**
 * Check if a value is any reactive PhilJS primitive
 */
export function isPhilJSReactive<T>(value: unknown): value is Signal<T> | Memo<T> {
  return isPhilJSSignal(value) || isPhilJSMemo(value);
}

// ============================================================================
// Plugin Types
// ============================================================================

/**
 * Options for the PhilJS Vue plugin
 */
export interface PhilJSPluginOptions {
  /**
   * Whether to install global composables.
   * @default true
   */
  installComposables?: boolean;

  /**
   * Custom global provide key for PhilJS context.
   * @default '__philjs__'
   */
  contextKey?: string | symbol;

  /**
   * Whether to add devtools integration.
   * @default true in development
   */
  devtools?: boolean;
}

/**
 * PhilJS context provided to Vue components
 */
export interface PhilJSVueContext {
  /** Access to universal context bridge */
  contexts: Map<string, SignalBridge<unknown>>;

  /** Register a new context */
  registerContext<T>(id: string, bridge: SignalBridge<T>): void;

  /** Get a context by ID */
  getContext<T>(id: string): SignalBridge<T> | undefined;

  /** Check if a context exists */
  hasContext(id: string): boolean;
}

// ============================================================================
// Instance Types
// ============================================================================

/**
 * Extended Universal instance with Vue-specific features
 */
export interface VueUniversalInstance<Props = Record<string, unknown>>
  extends UniversalInstance<Props> {
  /** Access to the Vue app instance (if exposed) */
  vueApp?: App;

  /** Access to the root Vue component instance (if exposed) */
  vueInstance?: unknown;
}

/**
 * Props that may contain signals, for use with Vue components
 */
export type SignalProps<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] | Signal<T[K]> | Memo<T[K]>;
};

/**
 * Unwrap signal props to their raw values
 */
export type UnwrapSignalProps<T> = {
  [K in keyof T]: T[K] extends Signal<infer V>
    ? V
    : T[K] extends Memo<infer V>
      ? V
      : T[K];
};
