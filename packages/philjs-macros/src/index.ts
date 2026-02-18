/**
 * @philjs/macros - TypeScript Types for PhilJS Rust Macros
 *
 * This package provides TypeScript type definitions that mirror
 * the Rust procedural macros. The actual macro processing happens
 * at compile time in Rust, but these types enable TypeScript
 * interoperability and IDE support.
 */

// ============================================================================
// Component Types
// ============================================================================

/**
 * Component function type
 */
export type Component<P = Record<string, unknown>> = (props: P) => View;

/**
 * Options for the @component decorator
 */
export interface ComponentOptions {
  /** Skip props struct generation */
  transparent?: boolean;
  /** Display name override */
  displayName?: string;
}

/**
 * Props configuration for component parameters
 */
export interface PropOptions<T = unknown> {
  /** Default value for the prop */
  default?: T;
  /** Make the prop optional */
  optional?: boolean;
  /** Accept any type that converts to T */
  into?: boolean;
}

// ============================================================================
// View Types
// ============================================================================

/**
 * View node type - result of view! macro
 */
export interface View {
  readonly __brand: 'View';
}

/**
 * Fragment type for grouping children without a wrapper
 */
export interface Fragment extends View {
  readonly children: View[];
}

/**
 * Element attributes
 */
export interface ElementAttributes {
  class?: string | Record<string, boolean>;
  style?: string | Record<string, string | number>;
  id?: string;
  ref?: RefObject<HTMLElement>;
  [key: string]: unknown;
}

/**
 * Event handler with modifiers
 */
export interface EventHandler<E = Event> {
  (event: E): void;
}

/**
 * Event modifiers for on:* handlers
 */
export type EventModifiers = {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  stopImmediatePropagation?: boolean;
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
};

// ============================================================================
// Reactivity Types
// ============================================================================

/**
 * Signal - reactive value container
 */
export interface Signal<T> {
  /** Get current value */
  get(): T;
  /** Set new value */
  set(value: T): void;
  /** Update value with a function */
  update(fn: (current: T) => T): void;
  /** Subscribe to changes */
  subscribe(fn: (value: T) => void): () => void;
}

/**
 * Memo - cached computation
 */
export interface Memo<T> {
  /** Get computed value */
  get(): T;
}

/**
 * Resource - async data with loading state
 */
export interface Resource<T, E = Error> {
  /** Get current value (undefined while loading) */
  get(): T | undefined;
  /** Loading state */
  loading(): boolean;
  /** Error state */
  error(): E | undefined;
  /** Refetch data */
  refetch(): Promise<void>;
}

/**
 * Effect cleanup function
 */
export type CleanupFn = () => void;

/**
 * Effect function
 */
export type EffectFn = () => void | CleanupFn;

/**
 * Ref object for DOM elements
 */
export interface RefObject<T> {
  current: T | null;
}

// ============================================================================
// Store Types
// ============================================================================

/**
 * Store - reactive object with fine-grained updates
 */
export type Store<T extends object> = {
  [K in keyof T]: Signal<T[K]>;
};

/**
 * Create a store from an initial value
 */
export type CreateStore = <T extends object>(initial: T) => Store<T>;

// ============================================================================
// Server Function Types
// ============================================================================

/**
 * Server function error
 */
export class ServerFnError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ServerFnError';
  }
}

/**
 * Server function options
 */
export interface ServerFnOptions {
  /** Custom endpoint path */
  endpoint?: string;
  /** API prefix */
  prefix?: string;
  /** Encoding format */
  encoding?: 'json' | 'cbor' | 'url' | 'multipart';
  /** Enable streaming responses */
  streaming?: boolean;
  /** Middleware to apply */
  middleware?: string | string[];
  /** Rate limit (requests per minute) */
  rateLimit?: number;
  /** Required permission */
  require?: string;
  /** Cache duration in seconds */
  cache?: number;
  /** Generate OpenAPI documentation */
  openapi?: boolean;
}

/**
 * Action error (form submission)
 */
export class ActionError extends ServerFnError {
  constructor(
    message: string,
    public readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ActionError';
  }
}

/**
 * Loader error (data fetching)
 */
export class LoaderError extends ServerFnError {
  constructor(message: string, status?: number) {
    super(message, undefined, status);
    this.name = 'LoaderError';
  }
}

// ============================================================================
// Routing Types
// ============================================================================

/**
 * Route options
 */
export interface RouteOptions {
  /** SSR mode */
  ssr?: 'ssr' | 'csr' | 'ssg' | 'isr';
  /** ISR revalidation interval in seconds */
  revalidate?: number;
  /** Route guard function name */
  guard?: string;
  /** Page title for metadata */
  title?: string;
  /** Enable route preloading */
  preload?: boolean;
}

/**
 * Route params (extracted from URL path)
 */
export type RouteParams<T extends string> = T extends `${string}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof RouteParams<Rest>]: string }
  : T extends `${string}:${infer Param}`
  ? { [K in Param]: string }
  : Record<string, never>;

/**
 * Query params
 */
export type QueryParams = Record<string, string | string[] | undefined>;

/**
 * Navigation options
 */
export interface NavigateOptions {
  /** Replace current history entry */
  replace?: boolean;
  /** State to pass to the route */
  state?: unknown;
  /** Scroll to top after navigation */
  scroll?: boolean;
}

/**
 * Redirect options
 */
export interface RedirectOptions extends NavigateOptions {
  /** HTTP status code for server redirects */
  status?: 301 | 302 | 303 | 307 | 308;
}

// ============================================================================
// Control Flow Types
// ============================================================================

/**
 * Show component props
 */
export interface ShowProps {
  when: boolean | (() => boolean);
  fallback?: View;
  children: View;
}

/**
 * For component props
 */
export interface ForProps<T> {
  each: T[] | (() => T[]);
  key?: (item: T, index: number) => string | number;
  children: (item: T, index: number) => View;
}

/**
 * Match component props
 */
export interface MatchProps<T> {
  value: T | (() => T);
  children: Array<{
    when: T | ((v: T) => boolean);
    children: View | (() => View);
  }>;
}

/**
 * Suspense component props
 */
export interface SuspenseProps {
  fallback?: View | (() => View);
  children: View;
}

/**
 * ErrorBoundary component props
 */
export interface ErrorBoundaryProps {
  fallback: (error: Error, reset: () => void) => View;
  children: View;
}

// ============================================================================
// Builder Pattern Helpers
// ============================================================================

/**
 * Create a signal
 */
export function createSignal<T>(initial: T): [Signal<T>, (value: T) => void] {
  throw new Error('This is a type stub. Use the Rust implementation.');
}

/**
 * Create a memo
 */
export function createMemo<T>(fn: () => T): Memo<T> {
  throw new Error('This is a type stub. Use the Rust implementation.');
}

/**
 * Create an effect
 */
export function createEffect(fn: EffectFn): void {
  throw new Error('This is a type stub. Use the Rust implementation.');
}

/**
 * Create a resource
 */
export function createResource<T, S>(
  source: () => S,
  fetcher: (source: S) => Promise<T>
): Resource<T> {
  throw new Error('This is a type stub. Use the Rust implementation.');
}

/**
 * Create a ref
 */
export function createRef<T = HTMLElement>(): RefObject<T> {
  return { current: null };
}

// ============================================================================
// Decorators (for TypeScript decorator syntax)
// ============================================================================

/**
 * Component decorator (mirrors #[component])
 */
export function component(options?: ComponentOptions): ClassDecorator {
  return function <TFunction extends Function>(target: TFunction): TFunction | void {
    return target;
  };
}

/**
 * Signal decorator (mirrors #[signal])
 */
export function signal(): PropertyDecorator {
  return function (_target: object, _key: string | symbol) {
    // Type stub
  };
}

/**
 * Server function decorator (mirrors #[server])
 */
export function server(options?: ServerFnOptions): MethodDecorator {
  return function (_target: object, _key: string | symbol, descriptor: PropertyDescriptor) {
    return descriptor;
  };
}

/**
 * Action decorator (mirrors #[action])
 */
export function action(options?: Omit<ServerFnOptions, 'encoding'>): MethodDecorator {
  return function (_target: object, _key: string | symbol, descriptor: PropertyDescriptor) {
    return descriptor;
  };
}

/**
 * Loader decorator (mirrors #[loader])
 */
export function loader(options?: Omit<ServerFnOptions, 'encoding'>): MethodDecorator {
  return function (_target: object, _key: string | symbol, descriptor: PropertyDescriptor) {
    return descriptor;
  };
}

/**
 * Route decorator (mirrors #[route])
 */
export function route(path: string, options?: RouteOptions): ClassDecorator {
  return function <TFunction extends Function>(target: TFunction): TFunction | void {
    return target;
  };
}

/**
 * Layout decorator (mirrors #[layout])
 */
export function layout(path: string): ClassDecorator {
  return function <TFunction extends Function>(target: TFunction): TFunction | void {
    return target;
  };
}

/**
 * API decorator (mirrors #[api])
 */
export function api(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'): MethodDecorator {
  return function (_target: object, _key: string | symbol, descriptor: PropertyDescriptor) {
    return descriptor;
  };
}

// ============================================================================
// Navigation Helpers
// ============================================================================

/**
 * Navigate to a route
 */
export function navigate(path: string, options?: NavigateOptions): void {
  throw new Error('This is a type stub. Use the Rust implementation.');
}

/**
 * Redirect to a route
 */
export function redirect(path: string, options?: RedirectOptions): never {
  throw new Error('This is a type stub. Use the Rust implementation.');
}

/**
 * Get current route params
 */
export function useParams<T extends object>(): T {
  throw new Error('This is a type stub. Use the Rust implementation.');
}

/**
 * Get current query params
 */
export function useQuery<T extends QueryParams>(): T {
  throw new Error('This is a type stub. Use the Rust implementation.');
}

// All types are exported at their declaration points above
