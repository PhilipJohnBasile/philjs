# API Reference

Complete API reference for `@philjs/core`. This document covers all exports from the package with their type signatures, parameters, and usage examples.

## Table of Contents

- [Reactivity](#reactivity)
- [JSX Runtime](#jsx-runtime)
- [Rendering](#rendering)
- [Context](#context)
- [Store](#store)
- [Async Primitives](#async-primitives)
- [Forms](#forms)
- [Result Type](#result-type)
- [Error Handling](#error-handling)
- [Animation](#animation)
- [Security](#security)
- [Serialization](#serialization)
- [Disposables](#disposables)
- [Lazy Handlers](#lazy-handlers)
- [Resumability](#resumability)
- [Performance](#performance)
- [Utilities](#utilities)

---

## Reactivity

### signal

Creates a reactive signal with automatic dependency tracking.

```typescript
function signal<T>(initialValue: T): Signal<T>

interface Signal<T> {
  (): T;                                      // Read value (tracks dependencies)
  get: () => T;                               // Alias for reading
  set: (value: T | ((prev: T) => T)) => void; // Write value
  subscribe: (fn: (value: T) => void) => () => void; // Manual subscription
  peek: () => T;                              // Read without tracking
}
```

**Example:**
```typescript
const count = signal(0);

// Read
console.log(count()); // 0

// Write
count.set(5);

// Update with function
count.set(prev => prev + 1);

// Peek without tracking
const value = count.peek();

// Subscribe
const unsubscribe = count.subscribe(v => console.log(v));
```

---

### memo

Creates a memoized computed value that automatically tracks dependencies.

```typescript
function memo<T>(computation: () => T): Memo<T>

interface Memo<T> {
  (): T;                                      // Read computed value
  get: () => T;                               // Alias for reading
  subscribe?: (fn: (value: T) => void) => () => void; // Subscribe to changes
}
```

**Example:**
```typescript
const firstName = signal('John');
const lastName = signal('Doe');

const fullName = memo(() => `${firstName()} ${lastName()}`);

console.log(fullName()); // "John Doe"
```

---

### linkedSignal

Creates a writable computed signal that can be manually overridden.

```typescript
function linkedSignal<T>(
  computation: () => T,
  options?: LinkedSignalOptions
): LinkedSignal<T>

interface LinkedSignalOptions {
  resetOnChange?: boolean; // Default: true
}

interface LinkedSignal<T> {
  (): T;                    // Read value
  get: () => T;             // Alias for reading
  set: (value: T | ((prev: T) => T)) => void; // Override value
  reset: () => void;        // Reset to computed value
  isOverridden: () => boolean; // Check if manually set
}
```

**Example:**
```typescript
const source = signal('Hello');
const derived = linkedSignal(() => source().toUpperCase());

console.log(derived()); // "HELLO"
derived.set('Manual');
console.log(derived()); // "Manual"
console.log(derived.isOverridden()); // true

source.set('World');
console.log(derived()); // "WORLD" (reset to computed)
```

---

### effect

Creates a side effect that automatically tracks dependencies.

```typescript
function effect(fn: EffectFunction): EffectCleanup

type EffectFunction = () => void | EffectCleanup;
type EffectCleanup = () => void;
```

**Example:**
```typescript
const dispose = effect(() => {
  console.log(`Count: ${count()}`);

  return () => {
    console.log('Cleanup');
  };
});

// Stop the effect
dispose();
```

---

### batch

Batches multiple signal updates into a single update cycle.

```typescript
function batch<T>(fn: () => T): T
```

**Example:**
```typescript
batch(() => {
  firstName.set('Jane');
  lastName.set('Smith');
  age.set(25);
});
// Effects run once with final values
```

---

### untrack

Reads signal values without creating dependencies.

```typescript
function untrack<T>(fn: () => T): T
```

**Example:**
```typescript
effect(() => {
  const tracked = count();           // Creates dependency
  const untracked = untrack(() => other()); // No dependency
});
```

---

### onCleanup

Registers a cleanup function within the current effect.

```typescript
function onCleanup(cleanup: EffectCleanup): void
```

**Example:**
```typescript
effect(() => {
  const timer = setInterval(tick, 1000);
  onCleanup(() => clearInterval(timer));
});
```

---

### createRoot

Creates a root scope for managing effect lifetimes.

```typescript
function createRoot<T>(fn: (dispose: () => void) => T): T
```

**Example:**
```typescript
const { api, dispose } = createRoot(dispose => {
  const state = signal(0);
  effect(() => console.log(state()));

  return {
    api: { increment: () => state.set(s => s + 1) },
    dispose
  };
});
```

---

### resource

Creates an async resource with loading and error states.

```typescript
function resource<T>(fetcher: ResourceFetcher<T>): Resource<T>

type ResourceFetcher<T> = () => T | Promise<T>;

interface Resource<T> {
  (): T;                    // Get data (throws if error)
  get: () => T;             // Alias for reading
  refresh: () => void;      // Refetch data
  loading: () => boolean;   // Loading state
  error: () => Error | null; // Error state
}
```

**Example:**
```typescript
const user = resource(async () => {
  const res = await fetch('/api/user');
  return res.json();
});

if (user.loading()) return <Spinner />;
if (user.error()) return <Error message={user.error()!.message} />;
return <UserProfile user={user()} />;
```

---

## JSX Runtime

### jsx / jsxs / jsxDEV

JSX factory functions used by the TypeScript/Babel transform.

```typescript
function jsx(
  type: string | Function,
  props: Record<string, any>,
  key?: string | number
): JSXElement

function jsxs(
  type: string | Function,
  props: Record<string, any>,
  key?: string | number
): JSXElement

function jsxDEV(
  type: string | Function,
  props: Record<string, any>,
  key?: string | number
): JSXElement
```

---

### Fragment

Fragment component for grouping children without a wrapper element.

```typescript
function Fragment(props: { children?: any }): JSXElement
```

**Example:**
```tsx
<>
  <Header />
  <Main />
  <Footer />
</>
```

---

### createElement

React-compatible element creation API.

```typescript
function createElement(
  type: string | Function,
  props: Record<string, any> | null,
  ...children: any[]
): JSXElement
```

---

### isJSXElement

Type guard for JSX elements.

```typescript
function isJSXElement(value: any): value is JSXElement
```

---

## Rendering

### render

Mounts a component to the DOM.

```typescript
function render(vnode: VNode, container: Element): void
```

**Example:**
```typescript
render(<App />, document.getElementById('app')!);
```

---

### hydrate

Hydrates server-rendered HTML with client-side interactivity.

```typescript
function hydrate(vnode: VNode, container: Element): void
```

**Example:**
```typescript
hydrate(<App />, document.getElementById('app')!);
```

---

### renderToString

Renders a component to an HTML string (SSR).

```typescript
function renderToString(vnode: VNode): string
```

**Example:**
```typescript
const html = renderToString(<App />);
```

---

### renderToStream

Renders a component as an async stream (streaming SSR).

```typescript
async function* renderToStream(vnode: VNode): AsyncGenerator<string>
```

**Example:**
```typescript
for await (const chunk of renderToStream(<App />)) {
  res.write(chunk);
}
```

---

## Context

### createContext

Creates a context for sharing values across the component tree.

```typescript
function createContext<T>(defaultValue: T): Context<T>

interface Context<T> {
  id: symbol;
  defaultValue: T;
  Provider: (props: { value: T; children: VNode }) => JSXElement;
  Consumer: (props: { children: (value: T) => VNode }) => JSXElement;
}
```

**Example:**
```typescript
const ThemeContext = createContext<'light' | 'dark'>('light');

// Provider
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>
```

---

### useContext

Consumes a context value.

```typescript
function useContext<T>(context: Context<T>): T
```

**Example:**
```typescript
const theme = useContext(ThemeContext);
```

---

### createSignalContext

Creates a context with a reactive signal value.

```typescript
function createSignalContext<T>(defaultValue: T): SignalContext<T>
```

---

### createThemeContext

Creates a theme context with CSS variables.

```typescript
function createThemeContext<T extends Record<string, any>>(
  defaultTheme: T
): ThemeContext<T>
```

---

### combineProviders

Combines multiple providers into one.

```typescript
function combineProviders(
  ...providers: Array<{ Provider: any; value: any }>
): (props: { children: VNode }) => VNode
```

---

## Store

### createStore

Creates a deep reactive store with path-based updates.

```typescript
function createStore<T extends StoreNode>(
  initialState: T,
  options?: StoreOptions<T>
): [Store<T>, SetStoreFunction<T>]

interface StoreOptions<T> {
  name?: string;
  devtools?: boolean;
  persist?: PersistConfig<T>;
  middleware?: StoreMiddleware<T>[];
  historyLimit?: number;
}
```

**Example:**
```typescript
const [store, setStore] = createStore({
  user: { name: 'John', age: 30 },
  items: []
});

// Read (reactive)
console.log(store.user.name);

// Update
setStore('user', 'name', 'Jane');
setStore('items', items => [...items, newItem]);
```

---

### createStoreWithActions

Creates a store with predefined actions.

```typescript
function createStoreWithActions<T extends StoreNode, A extends Actions>(
  initialState: T,
  actions: A,
  options?: StoreOptions<T>
): [Store<T>, SetStoreFunction<T>, BoundActions<A>]
```

---

### createUndoableStore

Creates a store with undo/redo capabilities.

```typescript
function createUndoableStore<T extends StoreNode>(
  initialState: T,
  options?: StoreOptions<T> & { historyLimit?: number }
): UndoRedoStore<T>

interface UndoRedoStore<T> {
  store: Store<T>;
  setStore: SetStoreFunction<T>;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}
```

---

### derive

Creates a derived value from a store.

```typescript
function derive<T extends StoreNode, R>(
  store: Store<T>,
  selector: (state: T) => R
): () => R
```

---

### produce

Creates immutable updates (Immer-like).

```typescript
function produce<T extends StoreNode>(
  state: T,
  recipe: (draft: T) => void
): T
```

---

### reconcile

Efficiently reconciles arrays.

```typescript
function reconcile<T>(
  oldArray: T[],
  newArray: T[],
  keyFn: (item: T) => string | number
): T[]
```

---

## Async Primitives

### createAsync

Creates an async resource with advanced features.

```typescript
function createAsync<T>(
  fetcher: () => Promise<T>,
  options?: AsyncOptions<T>
): AsyncResource<T>

interface AsyncOptions<T> {
  initialData?: T;
  retry?: RetryConfig;
  cache?: CacheConfig;
  dedupe?: boolean;
  timeout?: number;
  refetchOnFocus?: boolean;
  refetchInterval?: number;
  keepPreviousData?: boolean;
  placeholderData?: T | (() => T);
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onSettled?: (data: T | undefined, error: Error | undefined) => void;
}
```

---

### createMutation

Creates a mutation with optimistic updates.

```typescript
function createMutation<T, V = void>(
  mutator: (variables: V) => Promise<T>,
  options?: MutationOptions<T, V>
): Mutation<T, V>
```

---

### debounceAsync

Creates a debounced async function.

```typescript
function debounceAsync<T, A extends any[]>(
  fn: (...args: A) => Promise<T>,
  delay: number
): (...args: A) => Promise<T>
```

---

### throttleAsync

Creates a throttled async function.

```typescript
function throttleAsync<T, A extends any[]>(
  fn: (...args: A) => Promise<T>,
  limit: number
): (...args: A) => Promise<T>
```

---

### createQueue

Creates a sequential task queue.

```typescript
function createQueue<T>(): {
  add: (task: () => Promise<T>) => Promise<T>;
  clear: () => void;
  size: () => number;
}
```

---

### createConcurrencyLimiter

Limits concurrent async operations.

```typescript
function createConcurrencyLimiter(limit: number): {
  run: <T>(task: () => Promise<T>) => Promise<T>;
  active: () => number;
}
```

---

## Forms

### useForm

Creates a form with validation.

```typescript
function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
): FormApi<T>

interface UseFormOptions<T> {
  schema: Record<keyof T, Schema<any>>;
  initialValues?: Partial<T>;
  onSubmit: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface FormApi<T> {
  values: Signal<T>;
  errors: Signal<Record<keyof T, string[]>>;
  touched: Signal<Record<keyof T, boolean>>;
  dirty: Signal<Record<keyof T, boolean>>;
  isValid: Signal<boolean>;
  isSubmitting: Signal<boolean>;
  submitCount: Signal<number>;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: (field: keyof T, message: string) => void;
  clearError: (field: keyof T) => void;
  setTouched: (field: keyof T, touched: boolean) => void;
  validate: (field?: keyof T) => Promise<boolean>;
  handleSubmit: (e?: Event) => Promise<void>;
  handleChange: <K extends keyof T>(field: K) => (e: Event) => void;
  handleBlur: (field: keyof T) => (e: Event) => void;
  reset: () => void;
}
```

---

### Validators (v)

Schema builders for form validation.

```typescript
const v = {
  string(): Schema<string>;
  number(): Schema<number>;
  boolean(): Schema<boolean>;
  email(): Schema<string>;
  url(): Schema<string>;
  date(): Schema<Date>;
  custom<T>(validator: (val: any) => val is T): Schema<T>;
}

interface Schema<T> {
  required(message?: string): Schema<T>;
  min(min: number, message?: string): Schema<T>;
  max(max: number, message?: string): Schema<T>;
  pattern(regex: RegExp, message?: string): Schema<T>;
  email(message?: string): Schema<T>;
  url(message?: string): Schema<T>;
  custom(rule: ValidationRule<T>): Schema<T>;
  transform(fn: (value: any) => T): Schema<T>;
  default(value: T): Schema<T>;
}
```

**Example:**
```typescript
const form = useForm({
  schema: {
    name: v.string().required().min(2),
    email: v.email().required(),
    age: v.number().min(18).max(120)
  },
  onSubmit: async (values) => {
    await saveUser(values);
  }
});
```

---

## Result Type

Rust-inspired Result type for ergonomic error handling.

### Ok

Creates a success result.

```typescript
function Ok<T>(value: T): Result<T, never>
```

---

### Err

Creates an error result.

```typescript
function Err<E>(error: E): Result<never, E>
```

---

### isOk / isErr

Type guards for Result.

```typescript
function isOk<T, E>(result: Result<T, E>): result is Ok<T>
function isErr<T, E>(result: Result<T, E>): result is Err<E>
```

---

### map / mapErr

Transforms Result values.

```typescript
function map<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E>

function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F>
```

---

### andThen

Chains Result operations.

```typescript
function andThen<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E>
```

---

### unwrap / unwrapOr

Extracts Result values.

```typescript
function unwrap<T, E>(result: Result<T, E>): T  // Throws on Err
function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T
```

---

### matchResult

Pattern matching for Result.

```typescript
function matchResult<T, E, U>(
  result: Result<T, E>,
  handlers: { ok: (value: T) => U; err: (error: E) => U }
): U
```

**Example:**
```typescript
const result = await fetchUser();

const message = matchResult(result, {
  ok: user => `Welcome, ${user.name}!`,
  err: error => `Failed: ${error.message}`
});
```

---

## Error Handling

### ErrorBoundary

Component that catches errors and renders fallback UI.

```typescript
function ErrorBoundary(props: ErrorBoundaryProps): VNode

interface ErrorBoundaryProps {
  fallback?: (error: ErrorInfo, retry: () => void) => VNode;
  onError?: (error: ErrorInfo) => void;
  onRecover?: () => void;
  children: VNode;
  name?: string;
  fallbackPattern?: 'default' | 'skeleton' | 'empty-state' | 'partial' | 'minimal';
  maxRetries?: number;
  autoRecover?: boolean;
  retryDelay?: number;
  resetOnSuccess?: boolean;
}
```

**Example:**
```tsx
<ErrorBoundary
  fallback={(error, retry) => (
    <div>
      <p>Error: {error.error.message}</p>
      <button onClick={retry}>Retry</button>
    </div>
  )}
>
  <RiskyComponent />
</ErrorBoundary>
```

---

### setupGlobalErrorHandler

Sets up global error handling.

```typescript
function setupGlobalErrorHandler(
  onError: (error: ErrorInfo) => void
): () => void
```

---

### errorRecovery

Global error recovery instance.

```typescript
const errorRecovery: ErrorRecovery

class ErrorRecovery {
  addStrategy(category: ErrorCategory, strategy: RecoveryStrategy): void;
  recover(error: Error, category: ErrorCategory, context: RecoveryContext): Promise<any>;
}
```

---

## Animation

### createAnimatedValue

Creates an animated value with spring physics.

```typescript
function createAnimatedValue(
  initialValue: number,
  defaultOptions?: AnimationOptions
): AnimatedValue

interface AnimatedValue {
  value: number;
  target: number;
  velocity: number;
  isAnimating: boolean;
  set: (value: number, options?: AnimationOptions) => void;
  stop: () => void;
  subscribe: (callback: (value: number) => void) => () => void;
}

interface AnimationOptions {
  duration?: number;
  easing?: EasingFunction | SpringConfig;
  delay?: number;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fill?: 'none' | 'forwards' | 'backwards' | 'both';
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
}

interface SpringConfig {
  stiffness?: number;  // 0-1, default: 0.15
  damping?: number;    // 0-1, default: 0.8
  mass?: number;       // default: 1
  restVelocity?: number;
  restDistance?: number;
}
```

---

### easings

Built-in easing functions.

```typescript
const easings = {
  linear: (t: number) => number;
  easeIn: (t: number) => number;
  easeOut: (t: number) => number;
  easeInOut: (t: number) => number;
  easeInCubic: (t: number) => number;
  easeOutCubic: (t: number) => number;
  easeInOutCubic: (t: number) => number;
  easeInQuart: (t: number) => number;
  easeOutQuart: (t: number) => number;
  easeInOutQuart: (t: number) => number;
  bounce: (t: number) => number;
}
```

---

### FLIPAnimator

FLIP animation helper class.

```typescript
class FLIPAnimator {
  recordPositions(selector?: string): void;
  animateChanges(options?: AnimationOptions): void;
}
```

**Example:**
```typescript
const flip = new FLIPAnimator();

// Before DOM change
flip.recordPositions('[data-flip]');

// Make DOM changes
reorderItems();

// Animate from old to new positions
flip.animateChanges({ duration: 300 });
```

---

### attachGestures

Attaches gesture handlers to an element.

```typescript
function attachGestures(
  element: HTMLElement,
  handlers: GestureHandlers
): () => void

interface GestureHandlers {
  onDragStart?: (event: PointerEvent) => void;
  onDrag?: (event: PointerEvent, delta: { x: number; y: number }) => void;
  onDragEnd?: (event: PointerEvent) => void;
  onPinchStart?: (event: TouchEvent) => void;
  onPinch?: (event: TouchEvent, scale: number) => void;
  onPinchEnd?: (event: TouchEvent) => void;
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
}
```

---

### createParallax

Creates a parallax scroll effect.

```typescript
function createParallax(
  element: HTMLElement,
  options?: {
    speed?: number;
    offset?: number;
    axis?: 'x' | 'y' | 'both';
  }
): () => void
```

---

## Security

### escapeHtml / escapeAttr / escapeJs / escapeUrl

Escape functions for different contexts.

```typescript
function escapeHtml(str: string): string
function escapeAttr(str: string): string
function escapeJs(str: string): string
function escapeUrl(str: string): string
```

---

### sanitizeHtml / sanitizeUrl

Sanitizes potentially dangerous input.

```typescript
function sanitizeHtml(html: string, options?: SanitizeOptions): string
function sanitizeUrl(url: string): string
```

---

### safeJsonParse

Safely parses JSON with type checking.

```typescript
function safeJsonParse<T>(json: string, fallback: T): T
```

---

### generateSecureToken / createCspNonce

Security token generation.

```typescript
function generateSecureToken(length?: number): string
function createCspNonce(): string
```

---

### constantTimeEqual

Timing-safe string comparison.

```typescript
function constantTimeEqual(a: string, b: string): boolean
```

---

## Serialization

### serialize / deserialize

Serializes and deserializes signal state.

```typescript
function serialize<T>(value: T): SerializedState
function deserialize<T>(state: SerializedState): T
```

---

### persistentSignal

Creates a signal that persists to localStorage.

```typescript
function persistentSignal<T>(
  key: string,
  initialValue: T
): Signal<T>
```

---

### urlSignal

Creates a signal synced with URL parameters.

```typescript
function urlSignal<T>(
  key: string,
  initialValue: T
): Signal<T>
```

---

### serializeForHydration / hydrateFromSSR

SSR hydration helpers.

```typescript
function serializeForHydration(signals: Map<string, any>): string
function hydrateFromSSR(serialized: string): Map<string, any>
```

---

## Disposables

TypeScript 6 Explicit Resource Management utilities.

### disposableTimeout / disposableInterval

Disposable timer functions.

```typescript
function disposableTimeout(
  callback: () => void,
  ms: number
): Disposable

function disposableInterval(
  callback: () => void,
  ms: number
): Disposable
```

---

### disposableEventListener

Disposable event listener.

```typescript
function disposableEventListener<K extends keyof WindowEventMap>(
  target: EventTarget,
  type: K,
  listener: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions
): Disposable
```

---

### disposableSubscription

Disposable signal subscription.

```typescript
function disposableSubscription<T>(
  signal: Signal<T>,
  callback: (value: T) => void
): Disposable
```

---

### createDisposableScope / createAsyncDisposableScope

Scope management.

```typescript
function createDisposableScope(): DisposableScope
function createAsyncDisposableScope(): AsyncDisposableScope
```

---

## Lazy Handlers

### $ / $$

Lazy handler markers for resumability.

```typescript
function $(handler: Function): LazyHandler
function $$(handler: Function): LazyHandler
```

---

### loadHandler

Loads a lazy handler.

```typescript
function loadHandler(
  modulePath: string,
  exportName: string
): Promise<Function>
```

---

### prefetchHandler

Prefetches a handler for faster execution.

```typescript
function prefetchHandler(
  modulePath: string,
  exportName: string
): void
```

---

## Resumability

### initResumability

Initializes resumability context for SSR.

```typescript
function initResumability(): ResumableState
```

---

### serializeResumableState

Serializes resumable state to JSON.

```typescript
function serializeResumableState(): string
```

---

### resume

Resumes interactivity on the client.

```typescript
function resume(): void
```

---

### resumable

Makes a component resumable.

```typescript
function resumable<T extends Record<string, any>>(
  Component: (props: T) => VNode,
  options: { module: string; handlers?: Record<string, string> }
): (props: T) => VNode
```

---

## Performance

### WebVitalsMonitor

Monitors Core Web Vitals.

```typescript
class WebVitalsMonitor {
  constructor(options?: WebVitalsOptions);
  start(): void;
  stop(): void;
  getMetrics(): PerformanceMetrics;
}
```

---

### PerformanceTracker

Tracks component and API performance.

```typescript
class PerformanceTracker {
  mark(name: string): void;
  measure(name: string, startMark: string, endMark?: string): number;
  getReport(): PerformanceReport;
}
```

---

### measureAsync / measureSync

Measures async/sync function execution time.

```typescript
function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T>

function measureSync<T>(
  name: string,
  fn: () => T
): T
```

---

## Utilities

### Path Utilities

SvelteKit-style path utilities.

```typescript
const paths: {
  base: string;
  assets: string;
}

function configurePaths(config: PathConfig): void
function resolveRoute(route: string, params?: RouteParams): string
function buildPath(...segments: string[]): string
function matchPath(pattern: string, path: string): RouteParams | null
```

---

### Glob Utilities

Astro-style glob imports.

```typescript
function glob(pattern: string): Promise<string[]>
function importGlob<T>(pattern: string): Promise<Record<string, T>>
function loadContent<T>(pattern: string): Promise<ContentItem<T>[]>
```

---

### File Utilities

File system operations (Node.js only).

```typescript
function readFile(path: string, options?: ReadFileOptions): Promise<string>
function writeFile(path: string, content: string, options?: WriteFileOptions): Promise<void>
function fileExists(path: string): Promise<boolean>
function readJSON<T>(path: string): Promise<T>
function writeJSON<T>(path: string, data: T): Promise<void>
```

---

## Type Exports

Key types exported from `@philjs/core`:

```typescript
// Reactivity
export type { Signal, Memo, LinkedSignal, Resource, EffectCleanup };

// JSX
export type { JSXElement, VNode, JSXChild, CSSProperties };

// Store
export type { Store, StoreNode, SetStoreFunction, StoreOptions };

// Async
export type { AsyncState, AsyncOptions, RetryConfig, CacheConfig };

// Forms
export type { FormApi, FormSchema, FieldSchema, ValidationRule, ValidationError };

// Result
export type { Result };

// Error
export type { ErrorInfo, ErrorBoundaryProps, ErrorCategory, ErrorSuggestion };

// Animation
export type { AnimationOptions, SpringConfig, AnimatedValue, GestureHandlers };

// Context
export type { Context };
```

---

## Module Paths

All available import paths:

```typescript
import { /* ... */ } from '@philjs/core';
import { /* ... */ } from '@philjs/core/signals';
import { /* ... */ } from '@philjs/core/jsx-runtime';
import { /* ... */ } from '@philjs/core/jsx-dev-runtime';
import { /* ... */ } from '@philjs/core/render-to-string';
import { /* ... */ } from '@philjs/core/hydrate';
import { /* ... */ } from '@philjs/core/context';
import { /* ... */ } from '@philjs/core/error-boundary';
import { /* ... */ } from '@philjs/core/forms';
import { /* ... */ } from '@philjs/core/i18n';
import { /* ... */ } from '@philjs/core/animation';
import { /* ... */ } from '@philjs/core/accessibility';
import { /* ... */ } from '@philjs/core/ab-testing';
import { /* ... */ } from '@philjs/core/result';
import { /* ... */ } from '@philjs/core/core';
import { /* ... */ } from '@philjs/core/resumability';
import { /* ... */ } from '@philjs/core/data-layer';
import { /* ... */ } from '@philjs/core/service-worker';
import { /* ... */ } from '@philjs/core/performance-budgets';
import { /* ... */ } from '@philjs/core/cost-tracking';
import { /* ... */ } from '@philjs/core/usage-analytics';
import { /* ... */ } from '@philjs/core/testing';
import { /* ... */ } from '@philjs/core/superjson';
import { /* ... */ } from '@philjs/core/plugin-system';
import { /* ... */ } from '@philjs/core/tiny';
import { /* ... */ } from '@philjs/core/html';
import { /* ... */ } from '@philjs/core/element';
import { /* ... */ } from '@philjs/core/tc39-signals';
import { /* ... */ } from '@philjs/core/tc39-signals-polyfill';
import { /* ... */ } from '@philjs/core/view-transitions';
import { /* ... */ } from '@philjs/core/navigation';
import { /* ... */ } from '@philjs/core/store';
import { /* ... */ } from '@philjs/core/async';
import { /* ... */ } from '@philjs/core/disposable';
```
