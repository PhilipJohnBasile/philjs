/**
 * Universal Component Protocol Types
 * Defines the core interfaces for cross-framework component interoperability.
 */

import type { Signal, Memo } from '@philjs/core';

// ============================================================================
// Component Types
// ============================================================================

/** Supported source frameworks for universal components */
export type FrameworkSource =
  | 'philjs'
  | 'react'
  | 'vue'
  | 'svelte'
  | 'angular'
  | 'solid'
  | 'custom';

/** Lifecycle events for universal components */
export type LifecycleEvent =
  | 'beforeMount'
  | 'mounted'
  | 'beforeUpdate'
  | 'updated'
  | 'beforeUnmount'
  | 'unmounted'
  | 'error';

/** Lifecycle event handler */
export type LifecycleHandler = () => void;

/** Error handler for component errors */
export type ErrorHandler = (error: Error) => void;

/**
 * Universal Component Definition
 * A framework-agnostic component that can be used across different UI frameworks.
 */
export interface UniversalComponent<Props = Record<string, unknown>> {
  /** Unique component identifier */
  readonly id: string;

  /** Component display name */
  readonly name: string;

  /** Source framework this component originates from */
  readonly source: FrameworkSource;

  /** Component version (optional) */
  readonly version?: string;

  /**
   * Mount the component to a DOM element
   * @param container - The container element to mount into
   * @param props - Initial props for the component
   * @returns An instance handle for managing the mounted component
   */
  mount(container: HTMLElement, props: Props): UniversalInstance<Props>;

  /**
   * Serialize component state for hydration (optional)
   * Used for SSR/SSG scenarios
   */
  serialize?(): SerializedState;
}

/**
 * Running instance of a Universal Component
 */
export interface UniversalInstance<Props = Record<string, unknown>> {
  /** Current props passed to the component */
  readonly props: Props;

  /** The container element this instance is mounted to */
  readonly element: HTMLElement;

  /** The component definition */
  readonly component: UniversalComponent<Props>;

  /**
   * Update the component props
   * Signals passed as props will automatically trigger updates
   */
  update(newProps: Partial<Props>): void;

  /**
   * Unmount the component and cleanup resources
   */
  unmount(): void;

  /**
   * Subscribe to lifecycle events
   * @returns Unsubscribe function
   */
  on(event: LifecycleEvent, handler: LifecycleHandler): () => void;

  /**
   * Subscribe to errors
   * @returns Unsubscribe function
   */
  onError(handler: ErrorHandler): () => void;

  /**
   * Get the root DOM element of the component
   */
  getElement(): HTMLElement;
}

// ============================================================================
// Signal Bridge Types
// ============================================================================

/**
 * Bridge interface for connecting reactive state between frameworks.
 * Provides a unified API that works with PhilJS signals, React state,
 * Vue refs, and other reactive primitives.
 */
export interface SignalBridge<T> {
  /**
   * Read the current value without tracking dependencies.
   * Safe to call during render in any framework.
   */
  peek(): T;

  /**
   * Read the current value with dependency tracking.
   * Use within computed/memo contexts to establish reactive dependencies.
   */
  get(): T;

  /**
   * Update the value and notify all subscribers.
   * Accepts either a new value or an updater function.
   */
  set(value: T | ((prev: T) => T)): void;

  /**
   * Subscribe to value changes.
   * @param callback - Called with new value when it changes
   * @returns Unsubscribe function
   */
  subscribe(callback: (value: T) => void): () => void;

  /**
   * Convert to framework-specific reactive primitive.
   * Returns the underlying signal/ref/atom.
   */
  toReactive(): Signal<T> | unknown;

  /**
   * Check if this bridge wraps a PhilJS signal
   */
  isPhilJSSignal(): boolean;
}

/**
 * Options for creating a signal bridge
 */
export interface SignalBridgeOptions<T> {
  /** Custom equality function for change detection */
  equals?: (a: T, b: T) => boolean;

  /** Name for debugging */
  name?: string;
}

// ============================================================================
// Context Bridge Types
// ============================================================================

/**
 * Universal Context for sharing state across framework boundaries.
 * Unlike framework-specific contexts, UniversalContext works with any framework.
 */
export interface UniversalContext<T> {
  /** Unique context identifier */
  readonly id: string;

  /**
   * Get the current context value.
   * Returns undefined if no value has been set.
   */
  get(): T | undefined;

  /**
   * Set the context value.
   * All subscribers will be notified.
   */
  set(value: T): void;

  /**
   * Subscribe to context value changes.
   * Callback is immediately invoked with current value.
   * @returns Unsubscribe function
   */
  subscribe(callback: (value: T | undefined) => void): () => void;

  /**
   * Check if context has a value set
   */
  hasValue(): boolean;

  /**
   * Reset context to undefined
   */
  reset(): void;
}

/**
 * Context bridge for managing multiple contexts and inheritance
 */
export interface ContextBridgeInstance {
  /**
   * Create a new context
   */
  createContext<T>(id: string, defaultValue?: T): UniversalContext<T>;

  /**
   * Get an existing context by ID
   */
  getContext<T>(id: string): UniversalContext<T> | undefined;

  /**
   * Check if a context exists
   */
  hasContext(id: string): boolean;

  /**
   * Set up inheritance from a parent context bridge
   */
  inherit(parent: ContextBridgeInstance): void;

  /**
   * List all context IDs
   */
  listContexts(): string[];
}

// ============================================================================
// Event Bridge Types
// ============================================================================

/**
 * Options for emitting events through the tunnel
 */
export interface EventTunnelOptions {
  /** Whether the event should bubble up through component boundaries */
  bubbles?: boolean;

  /** Whether the event can be cancelled */
  cancelable?: boolean;

  /** Whether the event crosses shadow DOM boundaries */
  composed?: boolean;
}

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (detail: T) => void;

/**
 * Event Tunnel for routing events across framework boundaries.
 * Ensures events from React/Vue/etc. components bubble correctly
 * through the PhilJS component tree.
 */
export interface EventTunnel {
  /**
   * Emit an event that can be caught by parent components.
   * @param name - Event name
   * @param detail - Event payload
   * @param options - Event options
   * @returns true if event was not cancelled
   */
  emit<T = unknown>(name: string, detail: T, options?: EventTunnelOptions): boolean;

  /**
   * Listen to events from child components.
   * @param name - Event name to listen for
   * @param handler - Handler function
   * @returns Unsubscribe function
   */
  on<T = unknown>(name: string, handler: EventHandler<T>): () => void;

  /**
   * Listen to an event once, then automatically unsubscribe.
   */
  once<T = unknown>(name: string, handler: EventHandler<T>): () => void;

  /**
   * Remove all listeners for an event
   */
  off(name: string): void;

  /**
   * Create a scoped tunnel for a child component subtree.
   * Events emitted in the scope bubble up to this tunnel.
   */
  scope(componentId: string): EventTunnel;

  /**
   * Get the parent tunnel, if any
   */
  getParent(): EventTunnel | null;
}

// ============================================================================
// Update Boundary Types
// ============================================================================

/**
 * Update boundary for isolating framework updates.
 * Prevents update cascades between React, Vue, and PhilJS.
 */
export interface UpdateBoundary {
  /**
   * Run a function in an isolated update context.
   * Updates within this context won't trigger parent component updates.
   */
  isolate<T>(fn: () => T): T;

  /**
   * Batch multiple updates into a single render cycle.
   */
  batch<T>(fn: () => T): T;

  /**
   * Schedule an update for the next frame.
   * Useful for deferring expensive operations.
   */
  schedule(fn: () => void): void;

  /**
   * Flush all pending scheduled updates immediately.
   */
  flush(): void;

  /**
   * Check if we're currently inside an isolated context
   */
  isIsolated(): boolean;
}

// ============================================================================
// Registry Types
// ============================================================================

/**
 * Entry in the component registry
 */
export interface RegistryEntry<Props = Record<string, unknown>> {
  /** The component definition */
  component: UniversalComponent<Props>;

  /** All active instances of this component */
  instances: Set<UniversalInstance<Props>>;

  /** Registration timestamp */
  registeredAt: number;

  /** Metadata about the component */
  metadata?: Record<string, unknown>;
}

/**
 * Component registry for discovering and managing universal components
 */
export interface ComponentRegistry {
  /**
   * Register a component
   */
  register<Props>(component: UniversalComponent<Props>, metadata?: Record<string, unknown>): void;

  /**
   * Unregister a component
   */
  unregister(id: string): boolean;

  /**
   * Get a component by ID
   */
  get<Props = Record<string, unknown>>(id: string): UniversalComponent<Props> | undefined;

  /**
   * Check if a component is registered
   */
  has(id: string): boolean;

  /**
   * List all registered component IDs
   */
  list(): string[];

  /**
   * List components filtered by source framework
   */
  listBySource(source: FrameworkSource): string[];

  /**
   * Get all instances of a component
   */
  getInstances<Props = Record<string, unknown>>(id: string): Set<UniversalInstance<Props>>;

  /**
   * Track a new instance
   */
  trackInstance<Props>(componentId: string, instance: UniversalInstance<Props>): void;

  /**
   * Untrack an instance (when unmounted)
   */
  untrackInstance<Props>(componentId: string, instance: UniversalInstance<Props>): void;
}

// ============================================================================
// Lifecycle Types
// ============================================================================

/**
 * Lifecycle manager for coordinating component lifecycles
 */
export interface LifecycleManager {
  /**
   * Register lifecycle callbacks for an instance
   */
  register(instanceId: string): LifecycleHandle;

  /**
   * Unregister and cleanup all callbacks for an instance
   */
  unregister(instanceId: string): void;

  /**
   * Emit a lifecycle event for an instance
   */
  emit(instanceId: string, event: LifecycleEvent, error?: Error): void;
}

/**
 * Handle for managing lifecycle subscriptions
 */
export interface LifecycleHandle {
  /** The instance ID */
  readonly instanceId: string;

  /**
   * Subscribe to a lifecycle event
   */
  on(event: LifecycleEvent, handler: LifecycleHandler): () => void;

  /**
   * Subscribe to errors
   */
  onError(handler: ErrorHandler): () => void;

  /**
   * Cleanup all subscriptions
   */
  dispose(): void;
}

// ============================================================================
// Serialization Types
// ============================================================================

/**
 * Serialized component state for hydration
 */
export interface SerializedState {
  /** Component ID */
  componentId: string;

  /** Serialized props (JSON-safe) */
  props: Record<string, unknown>;

  /** Internal component state (framework-specific) */
  state?: Record<string, unknown>;

  /** Timestamp of serialization */
  timestamp: number;

  /** Hash for cache invalidation */
  hash?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Props that can include signals
 */
export type SignalAwareProps<Props> = {
  [K in keyof Props]: Props[K] | Signal<Props[K]> | Memo<Props[K]>;
};

/**
 * Extract the raw prop types from signal-aware props
 */
export type ExtractRawProps<Props> = {
  [K in keyof Props]: Props[K] extends Signal<infer T>
    ? T
    : Props[K] extends Memo<infer T>
      ? T
      : Props[K];
};

/**
 * Check if a value is a signal
 */
export function isSignal<T>(value: unknown): value is Signal<T> {
  return (
    typeof value === 'function' &&
    'set' in value &&
    'subscribe' in value &&
    'peek' in value
  );
}

/**
 * Check if a value is a memo/computed
 */
export function isMemo<T>(value: unknown): value is Memo<T> {
  return (
    typeof value === 'function' &&
    'subscribe' in value &&
    !('set' in value)
  );
}

/**
 * Check if a value is reactive (signal or memo)
 */
export function isReactive<T>(value: unknown): value is Signal<T> | Memo<T> {
  return isSignal(value) || isMemo(value);
}
