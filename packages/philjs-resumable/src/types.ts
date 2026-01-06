/**
 * Core Type Definitions for PhilJS Resumable
 *
 * This module provides comprehensive type definitions for the resumability system,
 * including QRLs, signals, serialization, and hydration.
 */

// ============================================================================
// QRL Types
// ============================================================================

/**
 * QRL (Quick Resource Locator) - A lazy reference to a resource
 */
export interface QRL<T = unknown> {
  /** The unique identifier for this QRL */
  readonly $id$: string;
  /** The chunk/module path containing the resource */
  readonly $chunk$: string;
  /** The symbol/export name within the chunk */
  readonly $symbol$: string;
  /** Captured closure variables */
  readonly $capture$: unknown[];
  /** Captured closure variable names (for debugging) */
  readonly $captureNames$?: string[];
  /** Resolved value (cached after first load) */
  $resolved$?: T;
  /** Whether this QRL has been resolved */
  $isResolved$: boolean;
  /** Resolve and return the referenced value */
  resolve(): Promise<T>;
  /** Get the serialized form of this QRL */
  serialize(): string;
  /** Invoke if this is a function QRL */
  invoke(...args: T extends (...args: infer A) => unknown ? A : never[]): Promise<T extends (...args: unknown[]) => infer R ? R : never>;
}

/**
 * Options for creating a QRL
 */
export interface QRLOptions<T = unknown> {
  /** The chunk/module path */
  chunk: string;
  /** The export symbol name */
  symbol: string;
  /** Captured closure variables */
  capture?: unknown[];
  /** Captured variable names (for debugging) */
  captureNames?: string[];
  /** Pre-resolved value (for development/testing) */
  resolved?: T;
}

/**
 * A lazy event handler that will be loaded on first interaction
 */
export type QRLEventHandler<E extends Event = Event> = QRL<(event: E) => void | Promise<void>>;

/**
 * A lazy component that will be loaded when rendered
 */
export type QRLComponent<P = Record<string, unknown>> = QRL<(props: P) => unknown>;

// ============================================================================
// Signal Types
// ============================================================================

/**
 * A resumable signal that can be serialized and restored
 */
export interface ResumableSignal<T> {
  /** Get the current value (tracked) */
  (): T;
  /** Get value without tracking dependencies */
  peek(): T;
  /** Set a new value */
  set(value: T | ((prev: T) => T)): void;
  /** Unique signal ID for serialization */
  readonly $id$: string;
  /** Subscribe to value changes */
  subscribe(fn: (value: T) => void): () => void;
  /** Brand for type checking */
  readonly $brand$: 'ResumableSignal';
}

/**
 * A resumable computed value
 */
export interface ResumableComputed<T> {
  /** Get the computed value (tracked) */
  (): T;
  /** Get value without tracking dependencies */
  peek(): T;
  /** Unique ID for serialization */
  readonly $id$: string;
  /** Subscribe to value changes */
  subscribe(fn: (value: T) => void): () => void;
  /** Brand for type checking */
  readonly $brand$: 'ResumableComputed';
}

/**
 * A resumable effect that runs after hydration
 */
export interface ResumableEffect {
  /** Effect ID */
  readonly $id$: string;
  /** Dispose the effect */
  dispose(): void;
  /** Whether the effect is active */
  readonly isActive: boolean;
  /** Brand for type checking */
  readonly $brand$: 'ResumableEffect';
}

// ============================================================================
// Serialization Types
// ============================================================================

/**
 * Serialized signal state
 */
export interface SerializedSignal {
  /** Unique signal ID */
  id: string;
  /** Serialized value */
  value: SerializedValue;
  /** Subscriber element IDs */
  subscribers: string[];
}

/**
 * Serialized value with type information for proper deserialization
 */
export interface SerializedValue {
  /** Type discriminator */
  type: SerializedValueType;
  /** Serialized data */
  data: unknown;
}

/**
 * All supported serializable value types
 */
export type SerializedValueType =
  | 'primitive'
  | 'object'
  | 'array'
  | 'date'
  | 'map'
  | 'set'
  | 'signal'
  | 'qrl'
  | 'undefined'
  | 'regexp'
  | 'bigint'
  | 'error'
  | 'url'
  | 'promise';

/**
 * Serialized event handler
 */
export interface SerializedHandler {
  /** QRL string for the handler */
  qrl: string;
  /** Event type (e.g., 'click', 'input') */
  event: string;
  /** Whether to prevent default */
  preventDefault?: boolean;
  /** Whether to stop propagation */
  stopPropagation?: boolean;
  /** Capture phase */
  capture?: boolean;
}

/**
 * Serialized element state
 */
export interface SerializedElement {
  /** Element ID */
  id: string;
  /** Event handlers */
  handlers: SerializedHandler[];
  /** Signal bindings (signal ID -> attribute/property name) */
  bindings: Record<string, string>;
  /** Inline state for this element */
  state?: Record<string, SerializedValue>;
  /** Component QRL if this is a component root */
  componentQRL?: string;
}

/**
 * Serialized component
 */
export interface SerializedComponent {
  /** Component ID */
  id: string;
  /** Component QRL */
  qrl: string;
  /** Serialized props */
  props: Record<string, SerializedValue>;
  /** Child element IDs */
  children: string[];
}

/**
 * Complete serialization context
 */
export interface SerializationContext {
  /** Counter for generating unique IDs */
  nextId: number;
  /** Serialized signals */
  signals: Map<string, SerializedSignal>;
  /** Serialized elements */
  elements: Map<string, SerializedElement>;
  /** QRL references */
  qrls: Map<string, string>;
  /** Captured closures */
  closures: Map<string, SerializedValue[]>;
  /** Component boundaries */
  components: Map<string, SerializedComponent>;
  /** Streaming chunks */
  chunks: string[];
  /** Development mode */
  isDev: boolean;
}

/**
 * Complete serialized state for the page
 */
export interface SerializedState {
  /** Version for compatibility checking */
  version: number;
  /** All signals */
  signals: Record<string, SerializedSignal>;
  /** All elements */
  elements: Record<string, SerializedElement>;
  /** All components */
  components: Record<string, SerializedComponent>;
  /** QRL registry */
  qrls: Record<string, string>;
  /** Closure captures */
  closures: Record<string, SerializedValue[]>;
  /** Chunk manifest */
  chunks: string[];
}

// ============================================================================
// Hydration Types
// ============================================================================

/**
 * Hydration strategy types
 */
export type HydrationStrategy =
  | 'idle'
  | 'visible'
  | 'interaction'
  | 'media'
  | 'never'
  | 'load'
  | 'custom';

/**
 * Hydration trigger configuration
 */
export interface HydrationTrigger {
  /** Trigger type */
  type: HydrationStrategy;
  /** Setup function */
  setup: (element: Element, hydrate: () => Promise<void>) => (() => void) | void;
  /** Priority for scheduling */
  priority?: number;
  /** Whether to prefetch before triggering */
  prefetch?: boolean;
}

/**
 * Common hydration options
 */
export interface HydrationOptions {
  /** The hydration strategy */
  when: HydrationStrategy;
  /** Priority for scheduling */
  priority?: number;
  /** Component ID for prefetching */
  componentId?: string;
  /** Whether to prefetch the component */
  prefetch?: boolean;
  /** Callback when hydration completes */
  onHydrate?: () => void;
  /** Callback on hydration error */
  onError?: (error: Error) => void;
}

/**
 * Visible strategy options
 */
export interface VisibleHydrationOptions extends HydrationOptions {
  when: 'visible';
  /** Root element for intersection observer */
  root?: Element | null;
  /** Root margin */
  rootMargin?: string;
  /** Visibility threshold */
  threshold?: number | number[];
}

/**
 * Interaction strategy options
 */
export interface InteractionHydrationOptions extends HydrationOptions {
  when: 'interaction';
  /** Events that trigger hydration */
  events?: string[];
  /** Single event shorthand */
  event?: string;
  /** Re-dispatch event after hydration */
  redispatch?: boolean;
}

/**
 * Media query strategy options
 */
export interface MediaHydrationOptions extends HydrationOptions {
  when: 'media';
  /** Media query string */
  query: string;
}

/**
 * Idle strategy options
 */
export interface IdleHydrationOptions extends HydrationOptions {
  when: 'idle';
  /** Timeout before forcing hydration */
  timeout?: number;
}

/**
 * Custom strategy options
 */
export interface CustomHydrationOptions extends HydrationOptions {
  when: 'custom';
  /** Custom hydration trigger */
  trigger: (element: Element, hydrate: () => Promise<void>) => void | (() => void);
}

/**
 * All hydration option types
 */
export type AnyHydrationOptions =
  | VisibleHydrationOptions
  | InteractionHydrationOptions
  | MediaHydrationOptions
  | IdleHydrationOptions
  | CustomHydrationOptions
  | (HydrationOptions & { when: 'load' | 'never' });

// ============================================================================
// Component Types
// ============================================================================

/**
 * Resumable component function
 */
export interface ResumableComponent<P = Record<string, unknown>> {
  (props: P): unknown;
  /** QRL for lazy loading */
  $qrl$: QRL<(props: P) => unknown>;
  /** Display name */
  displayName?: string;
  /** Hydration trigger */
  $trigger$?: HydrationTrigger;
  /** Whether to prefetch */
  $prefetch$?: boolean;
  /** Priority */
  $priority$?: number;
}

/**
 * Options for creating resumable components
 */
export interface ResumableComponentOptions<P = Record<string, unknown>> {
  /** Hydration trigger */
  trigger?: HydrationStrategy | HydrationTrigger;
  /** Module path for code splitting */
  module?: string;
  /** Export symbol name */
  symbol?: string;
  /** Whether to prefetch on hover */
  prefetch?: boolean;
  /** Priority for hydration scheduling */
  priority?: number;
  /** Fallback to show before hydration */
  fallback?: (props: P) => unknown;
  /** Callback when hydration completes */
  onHydrate?: () => void;
  /** Callback on hydration error */
  onError?: (error: Error) => void;
}

// ============================================================================
// Context Types
// ============================================================================

/**
 * Context for resumable rendering
 */
export interface ResumableContext {
  /** Serialization context */
  serialization: SerializationContext;
  /** Current component stack */
  componentStack: string[];
  /** Signal registry */
  signals: Map<string, ResumableSignal<unknown>>;
  /** Whether we're on the server */
  isServer: boolean;
  /** Whether we're hydrating */
  isHydrating: boolean;
}

/**
 * Resumable app configuration
 */
export interface ResumableConfig {
  /** Base path for chunk loading */
  basePath?: string;
  /** Development mode */
  isDev?: boolean;
  /** Enable streaming SSR */
  streaming?: boolean;
  /** Custom chunk resolver */
  resolver?: (chunk: string) => Promise<Record<string, unknown>>;
}

// ============================================================================
// Container Types
// ============================================================================

/**
 * Container state
 */
export interface ContainerState {
  /** Unique container ID */
  id: string;
  /** Whether the container has been hydrated */
  hydrated: boolean;
  /** Serialization context */
  serialization: SerializationContext | null;
  /** Resumable context */
  resumable: ResumableContext | null;
  /** Error state */
  error: Error | null;
  /** Loading state */
  loading: boolean;
}

/**
 * Container configuration
 */
export interface ContainerConfig extends ResumableConfig {
  /** Container element ID */
  id?: string;
  /** Default hydration strategy */
  defaultHydration?: HydrationStrategy;
  /** Enable automatic discovery */
  autoDiscover?: boolean;
  /** Enable error boundaries */
  errorBoundary?: boolean;
  /** Error fallback component */
  errorFallback?: (error: Error) => unknown;
  /** Loading fallback component */
  loadingFallback?: unknown;
  /** On hydration complete */
  onHydrate?: () => void;
  /** On error */
  onError?: (error: Error) => void;
}

// ============================================================================
// Loader Types
// ============================================================================

/**
 * A lazy component loader function
 */
export type ComponentLoader = () => Promise<{
  default?: unknown;
  [key: string]: unknown;
}>;

/**
 * Component definition with metadata
 */
export interface LazyComponent {
  /** Component identifier */
  id: string;
  /** Loader function */
  loader: ComponentLoader;
  /** Preloaded module */
  preloaded?: Promise<unknown>;
  /** Resolved component */
  resolved?: unknown;
  /** Loading state */
  status: 'idle' | 'loading' | 'loaded' | 'error';
  /** Error if loading failed */
  error?: Error;
}

/**
 * Loader configuration
 */
export interface LoaderConfig {
  /** Base path for chunk loading */
  basePath: string;
  /** Custom chunk resolver */
  resolver?: (chunkPath: string) => Promise<Record<string, unknown>>;
  /** Enable prefetching on hover/focus */
  prefetchOnHover: boolean;
  /** Prefetch timeout in ms */
  prefetchTimeout: number;
  /** Maximum concurrent loads */
  maxConcurrent: number;
  /** Retry failed loads */
  retryOnError: boolean;
  /** Maximum retries */
  maxRetries: number;
  /** Retry delay in ms */
  retryDelay: number;
  /** Development mode */
  isDev: boolean;
}

// ============================================================================
// Compiler Types
// ============================================================================

/**
 * Options for the resumable compiler transform
 */
export interface TransformOptions {
  /** Source file path */
  filePath: string;
  /** Development mode */
  isDev?: boolean;
  /** Minify output */
  minify?: boolean;
  /** Generate source maps */
  sourceMap?: boolean;
  /** Base path for QRL generation */
  basePath?: string;
  /** Symbol naming strategy */
  symbolNaming?: 'hash' | 'descriptive';
}

/**
 * Transform result
 */
export interface TransformResult {
  /** Transformed code */
  code: string;
  /** Source map */
  map?: string;
  /** Generated chunks */
  chunks: ChunkInfo[];
  /** QRL manifest */
  qrls: QRLManifest;
}

/**
 * Chunk information
 */
export interface ChunkInfo {
  /** Chunk file name */
  fileName: string;
  /** Original source file */
  sourceFile: string;
  /** Exported symbols */
  exports: string[];
  /** Dependencies */
  dependencies: string[];
}

/**
 * QRL manifest for build output
 */
export interface QRLManifest {
  /** QRL ID to chunk mapping */
  mapping: Record<string, { chunk: string; symbol: string }>;
  /** Chunk dependencies */
  dependencies: Record<string, string[]>;
}

/**
 * Vite plugin options
 */
export interface VitePluginOptions {
  /** Include patterns */
  include?: string | RegExp | (string | RegExp)[];
  /** Exclude patterns */
  exclude?: string | RegExp | (string | RegExp)[];
  /** Development mode */
  isDev?: boolean;
  /** Source map generation */
  sourceMap?: boolean;
  /** Debug mode */
  debug?: boolean;
}

// ============================================================================
// Event Delegation Types
// ============================================================================

/**
 * Event delegation configuration
 */
export interface EventDelegationConfig {
  /** Event types to delegate */
  events: string[];
  /** Root element for delegation */
  root?: Element;
  /** Capture phase */
  capture?: boolean;
}

/**
 * Pending event invocation
 */
export interface PendingInvocation {
  /** QRL string */
  qrl: string;
  /** Original event */
  event: Event;
  /** Target element */
  element: Element;
  /** Element ID */
  qid: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Check if a value is a ResumableSignal
 */
export function isResumableSignal<T>(value: unknown): value is ResumableSignal<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    '$brand$' in value &&
    (value as ResumableSignal<T>).$brand$ === 'ResumableSignal'
  );
}

/**
 * Check if a value is a ResumableComputed
 */
export function isResumableComputed<T>(value: unknown): value is ResumableComputed<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    '$brand$' in value &&
    (value as ResumableComputed<T>).$brand$ === 'ResumableComputed'
  );
}

/**
 * Check if a value is a QRL
 */
export function isQRL<T>(value: unknown): value is QRL<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    '$id$' in value &&
    '$chunk$' in value &&
    '$symbol$' in value
  );
}

/**
 * Extract the inner type from a ResumableSignal
 */
export type SignalValue<S> = S extends ResumableSignal<infer T> ? T : never;

/**
 * Props with signal support
 */
export type SignalProps<P> = {
  [K in keyof P]: P[K] | ResumableSignal<P[K]>;
};
