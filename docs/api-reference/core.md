# Core API Reference

Complete API reference for philjs-core package.

## Table of Contents

- [Signals & Reactivity](#signals--reactivity)
- [Rendering](#rendering)
- [Resumability](#resumability)
- [Data Layer](#data-layer)
- [Context API](#context-api)
- [Animation & Motion](#animation--motion)
- [Internationalization](#internationalization)
- [Error Boundaries](#error-boundaries)
- [Service Worker](#service-worker)
- [Performance & Intelligence](#performance--intelligence)
- [Error Handling & Result](#error-handling--result)
- [Forms & Validation](#forms--validation)
- [Accessibility](#accessibility)
- [A/B Testing](#ab-testing)
- [Partial Pre-rendering (PPR)](#partial-pre-rendering-ppr)
- [Activity Component](#activity-component)

---

## Signals & Reactivity

### signal()

**Signature**: `<T>(initialValue: T) => Signal<T>`

**Description**: Create reactive state that automatically tracks dependencies and triggers updates.

**Example**:
```typescript
import { signal } from 'philjs-core';

const count = signal(0);

// Read value
console.log(count()); // 0

// Set value
count.set(5);

// Update based on current
count.set(c => c + 1);
```

**See also**: [memo()](#memo), [effect()](#effect)

---

### memo()

**Signature**: `<T>(fn: () => T) => Memo<T>`

**Description**: Create a computed value that automatically updates when its dependencies change. Memoized computations only re-run when necessary.

**Example**:
```typescript
import { memo, signal } from 'philjs-core';

const count = signal(5);
const doubled = memo(() => count() * 2);

console.log(doubled()); // 10
count.set(10);
console.log(doubled()); // 20
```

**See also**: [signal()](#signal), [effect()](#effect)

---

### linkedSignal()

**Signature**: `<T>(source: Signal<T>, transform?: (value: T) => T) => LinkedSignal<T>`

**Description**: Create a signal that is linked to a source signal. The linked signal can have its own local value but can be synchronized with the source.

**Example**:
```typescript
import { signal, linkedSignal } from 'philjs-core';

const primary = signal(5);
const linked = linkedSignal(primary, (val) => val * 2);

console.log(linked()); // 10
primary.set(10);
console.log(linked()); // 20

// Can also set independently
linked.set(15);
console.log(linked()); // 15
```

**See also**: [signal()](#signal), [memo()](#memo)

---

### resource()

**Signature**: `<T>(fetcher: () => Promise<T>, options?: ResourceOptions) => Resource<T>`

**Description**: Create a reactive resource for async data fetching with loading, error, and data states.

**Example**:
```typescript
import { resource } from 'philjs-core';

const user = resource(() => fetch('/api/user').then(r => r.json()));

// Access resource state
if (user.loading) return <Spinner />;
if (user.error) return <Error message={user.error.message} />;
return <div>{user().name}</div>;
```

**See also**: [createQuery()](#createquery), [effect()](#effect)

---

### effect()

**Signature**: `(fn: () => void | (() => void)) => void`

**Description**: Run side effects that automatically track reactive dependencies. Returns a cleanup function if provided.

**Example**:
```typescript
import { effect, signal } from 'philjs-core';

const count = signal(0);

effect(() => {
  console.log('Count changed:', count());
  // Optional cleanup
  return () => console.log('Cleaning up');
});

count.set(1); // Logs: "Count changed: 1"
```

**See also**: [signal()](#signal), [onCleanup()](#oncleanup)

---

### batch()

**Signature**: `(fn: () => void) => void`

**Description**: Batch multiple signal updates into a single update cycle to prevent unnecessary re-renders.

**Example**:
```typescript
import { batch, signal } from 'philjs-core';

const firstName = signal('John');
const lastName = signal('Doe');

batch(() => {
  firstName.set('Jane');
  lastName.set('Smith');
}); // Only triggers one update
```

**See also**: [signal()](#signal), [effect()](#effect)

---

### untrack()

**Signature**: `<T>(fn: () => T) => T`

**Description**: Run a function without tracking reactive dependencies. Useful for reading signals without creating subscriptions.

**Example**:
```typescript
import { untrack, signal, effect } from 'philjs-core';

const count = signal(0);
const multiplier = signal(2);

effect(() => {
  // Only tracks count, not multiplier
  const current = count();
  const mult = untrack(() => multiplier());
  console.log(current * mult);
});
```

**See also**: [effect()](#effect), [signal()](#signal)

---

### onCleanup()

**Signature**: `(fn: () => void) => void`

**Description**: Register a cleanup function to run when the current reactive scope is disposed.

**Example**:
```typescript
import { onCleanup, effect } from 'philjs-core';

effect(() => {
  const id = setInterval(() => console.log('tick'), 1000);

  onCleanup(() => {
    clearInterval(id);
    console.log('Effect cleaned up');
  });
});
```

**See also**: [effect()](#effect), [createRoot()](#createroot)

---

### createRoot()

**Signature**: `<T>(fn: () => T) => T`

**Description**: Create a root reactive scope that won't be automatically disposed. Useful for creating persistent reactive contexts.

**Example**:
```typescript
import { createRoot, signal, effect } from 'philjs-core';

const cleanup = createRoot(() => {
  const count = signal(0);

  effect(() => {
    console.log(count());
  });

  return () => {
    // Manual cleanup logic
  };
});

// Later...
cleanup(); // Dispose of the root
```

**See also**: [effect()](#effect), [onCleanup()](#oncleanup)

---

## Rendering

### jsx()

**Signature**: `(type: string | Component, props: Props, ...children: any[]) => JSXElement`

**Description**: JSX pragma for creating virtual DOM elements. Automatically used by JSX transpiler.

**Example**:
```typescript
import { jsx } from 'philjs-core';

// Automatically used in JSX:
const element = <div className="container">Hello</div>;

// Equivalent to:
const element = jsx('div', { className: 'container' }, 'Hello');
```

**See also**: [Fragment](#fragment), [createElement()](#createelement)

---

### Fragment

**Signature**: `Symbol`

**Description**: Component for rendering multiple children without a wrapper element.

**Example**:
```typescript
import { Fragment } from 'philjs-core';

function List() {
  return (
    <Fragment>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </Fragment>
  );
}
```

**See also**: [jsx()](#jsx)

---

### renderToString()

**Signature**: `(element: JSXElement) => string`

**Description**: Render a component tree to an HTML string for server-side rendering.

**Example**:
```typescript
import { renderToString } from 'philjs-core';

function App() {
  return <div>Hello World</div>;
}

const html = renderToString(<App />);
// Returns: "<div>Hello World</div>"
```

**See also**: [renderToStream()](#rendertostream), [hydrate()](#hydrate)

---

### renderToStream()

**Signature**: `(element: JSXElement) => ReadableStream<string>`

**Description**: Render a component tree to a streaming HTML response for optimized SSR.

**Example**:
```typescript
import { renderToStream } from 'philjs-core';

function App() {
  return <div>Hello World</div>;
}

const stream = renderToStream(<App />);
// Can be piped to HTTP response
```

**See also**: [renderToString()](#rendertostring), [hydrate()](#hydrate)

---

### hydrate()

**Signature**: `(element: JSXElement, container: HTMLElement) => void`

**Description**: Hydrate server-rendered HTML with client-side interactivity.

**Example**:
```typescript
import { hydrate } from 'philjs-core';

function App() {
  return <div>Hello World</div>;
}

hydrate(<App />, document.getElementById('root'));
```

**See also**: [render()](#render), [renderToString()](#rendertostring)

---

### render()

**Signature**: `(element: JSXElement, container: HTMLElement) => void`

**Description**: Render a component tree to a DOM container for client-side rendering.

**Example**:
```typescript
import { render } from 'philjs-core';

function App() {
  return <div>Hello World</div>;
}

render(<App />, document.getElementById('root'));
```

**See also**: [hydrate()](#hydrate)

---

## Resumability

### initResumability()

**Signature**: `() => void`

**Description**: Initialize the resumability system for zero-hydration startup.

**Example**:
```typescript
import { initResumability } from 'philjs-core';

// Call once at app startup
initResumability();
```

**See also**: [resume()](#resume), [resumable()](#resumable)

---

### getResumableState()

**Signature**: `() => ResumableState`

**Description**: Get the current resumable state for serialization.

**Example**:
```typescript
import { getResumableState } from 'philjs-core';

const state = getResumableState();
console.log(state.handlers, state.signals);
```

**See also**: [serializeResumableState()](#serializeresumablestate)

---

### serializeResumableState()

**Signature**: `(state: ResumableState) => string`

**Description**: Serialize resumable state to a string for embedding in HTML.

**Example**:
```typescript
import { getResumableState, serializeResumableState } from 'philjs-core';

const state = getResumableState();
const serialized = serializeResumableState(state);

// Embed in HTML:
const html = `<script>window.__RESUMABLE__=${serialized}</script>`;
```

**See also**: [getResumableState()](#getresumablestate), [resume()](#resume)

---

### resume()

**Signature**: `(serializedState: string) => void`

**Description**: Resume application from serialized state.

**Example**:
```typescript
import { resume } from 'philjs-core';

// On client:
const state = window.__RESUMABLE__;
resume(state);
```

**See also**: [initResumability()](#initresumability)

---

### resumable()

**Signature**: `<T extends Function>(fn: T) => T`

**Description**: Mark a function as resumable for automatic serialization.

**Example**:
```typescript
import { resumable } from 'philjs-core';

const handleClick = resumable(() => {
  console.log('Clicked!');
});

<button onClick={handleClick}>Click Me</button>
```

**See also**: [registerHandler()](#registerhandler)

---

### registerHandler()

**Signature**: `(name: string, handler: Function) => void`

**Description**: Register a named event handler for resumability.

**Example**:
```typescript
import { registerHandler } from 'philjs-core';

registerHandler('handleSubmit', (e) => {
  e.preventDefault();
  // Handle form submission
});
```

**See also**: [resumable()](#resumable)

---

### registerState()

**Signature**: `(name: string, value: any) => void`

**Description**: Register state for resumability serialization.

**Example**:
```typescript
import { registerState, signal } from 'philjs-core';

const count = signal(0);
registerState('count', count);
```

**See also**: [getResumableState()](#getresumablestate)

---

## Data Layer

### createQuery()

**Signature**: `<T>(queryFn: () => Promise<T>, options?: QueryOptions) => QueryResult<T>`

**Description**: Create a reactive data query with caching, refetching, and state management.

**Example**:
```typescript
import { createQuery } from 'philjs-core';

function UserProfile({ userId }) {
  const query = createQuery(() =>
    fetch(`/api/users/${userId}`).then(r => r.json()),
    {
      cacheKey: `user-${userId}`,
      staleTime: 60000, // 1 minute
    }
  );

  if (query.isLoading) return <Spinner />;
  if (query.isError) return <Error error={query.error} />;

  return <div>{query.data.name}</div>;
}
```

**See also**: [createMutation()](#createmutation), [queryCache](#querycache)

---

### createMutation()

**Signature**: `<T, V>(mutationFn: (variables: V) => Promise<T>, options?: MutationOptions) => MutationResult<T, V>`

**Description**: Create a mutation for data updates with optimistic updates and rollback.

**Example**:
```typescript
import { createMutation } from 'philjs-core';

function UpdateProfile() {
  const mutation = createMutation(
    (data) => fetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    {
      onSuccess: () => {
        console.log('Profile updated!');
      },
    }
  );

  const handleSubmit = () => {
    mutation.mutate({ name: 'Alice' });
  };

  return <button onClick={handleSubmit}>Update</button>;
}
```

**See also**: [createQuery()](#createquery), [invalidateQueries()](#invalidatequeries)

---

### queryCache

**Signature**: `QueryCache`

**Description**: Global query cache instance for managing query data.

**Example**:
```typescript
import { queryCache } from 'philjs-core';

// Access cached data
const data = queryCache.get('user-123');

// Set cache data
queryCache.set('user-123', userData);

// Clear cache
queryCache.clear();
```

**See also**: [createQuery()](#createquery), [invalidateQueries()](#invalidatequeries)

---

### invalidateQueries()

**Signature**: `(cacheKey?: string | string[]) => void`

**Description**: Invalidate cached queries to trigger refetching.

**Example**:
```typescript
import { invalidateQueries } from 'philjs-core';

// Invalidate specific query
invalidateQueries('user-123');

// Invalidate multiple queries
invalidateQueries(['user-123', 'posts-456']);

// Invalidate all queries
invalidateQueries();
```

**See also**: [createQuery()](#createquery), [queryCache](#querycache)

---

### prefetchQuery()

**Signature**: `<T>(cacheKey: string, queryFn: () => Promise<T>) => Promise<void>`

**Description**: Prefetch query data for improved performance.

**Example**:
```typescript
import { prefetchQuery } from 'philjs-core';

// Prefetch user data on hover
<Link
  href="/user/123"
  onMouseEnter={() =>
    prefetchQuery('user-123', () =>
      fetch('/api/users/123').then(r => r.json())
    )
  }
>
  View Profile
</Link>
```

**See also**: [createQuery()](#createquery)

---

## Context API

### createContext()

**Signature**: `<T>(defaultValue?: T) => Context<T>`

**Description**: Create a context for passing data through the component tree.

**Example**:
```typescript
import { createContext } from 'philjs-core';

const ThemeContext = createContext<'light' | 'dark'>('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Header />
    </ThemeContext.Provider>
  );
}
```

**See also**: [useContext()](#usecontext), [createSignalContext()](#createsignalcontext)

---

### useContext()

**Signature**: `<T>(context: Context<T>) => T`

**Description**: Access the current value of a context.

**Example**:
```typescript
import { useContext } from 'philjs-core';

function Header() {
  const theme = useContext(ThemeContext);
  return <header className={theme}>...</header>;
}
```

**See also**: [createContext()](#createcontext)

---

### createSignalContext()

**Signature**: `<T>(initialValue: T) => SignalContext<T>`

**Description**: Create a reactive context that automatically updates subscribers.

**Example**:
```typescript
import { createSignalContext } from 'philjs-core';

const CountContext = createSignalContext(0);

function App() {
  return (
    <CountContext.Provider value={signal(0)}>
      <Counter />
    </CountContext.Provider>
  );
}

function Counter() {
  const count = useContext(CountContext);
  return <div>{count()}</div>;
}
```

**See also**: [createContext()](#createcontext), [signal()](#signal)

---

### createThemeContext()

**Signature**: `(themes: Record<string, Theme>) => ThemeContext`

**Description**: Create a specialized context for theme management.

**Example**:
```typescript
import { createThemeContext } from 'philjs-core';

const ThemeContext = createThemeContext({
  light: { bg: '#fff', text: '#000' },
  dark: { bg: '#000', text: '#fff' },
});

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Content />
    </ThemeContext.Provider>
  );
}
```

**See also**: [createContext()](#createcontext)

---

### combineProviders()

**Signature**: `(providers: Provider[]) => Component`

**Description**: Combine multiple context providers into a single component.

**Example**:
```typescript
import { combineProviders } from 'philjs-core';

const AppProviders = combineProviders([
  <ThemeContext.Provider value="dark" />,
  <UserContext.Provider value={user} />,
  <I18nProvider locale="en" />,
]);

function App() {
  return (
    <AppProviders>
      <Content />
    </AppProviders>
  );
}
```

**See also**: [createContext()](#createcontext)

---

## Animation & Motion

### createAnimatedValue()

**Signature**: `(initialValue: number, options?: AnimationOptions) => AnimatedValue`

**Description**: Create an animated value with spring physics or custom easing.

**Example**:
```typescript
import { createAnimatedValue } from 'philjs-core';

const x = createAnimatedValue(0, {
  spring: { tension: 170, friction: 26 },
});

x.set(100); // Animates to 100
```

**See also**: [easings](#easings), [FLIPAnimator](#flipanimator)

---

### easings

**Signature**: `Record<string, EasingFunction>`

**Description**: Collection of easing functions for animations.

**Example**:
```typescript
import { easings, createAnimatedValue } from 'philjs-core';

const opacity = createAnimatedValue(0, {
  duration: 300,
  easing: easings.easeInOut,
});
```

**See also**: [createAnimatedValue()](#createanimatedvalue)

---

### FLIPAnimator

**Signature**: `class FLIPAnimator`

**Description**: FLIP (First, Last, Invert, Play) animation helper for smooth layout transitions.

**Example**:
```typescript
import { FLIPAnimator } from 'philjs-core';

const animator = new FLIPAnimator();

// Before layout change
animator.capture(element);

// Apply layout change
element.style.transform = 'translateX(100px)';

// Animate the change
animator.play(element);
```

**See also**: [createAnimatedValue()](#createanimatedvalue)

---

### attachGestures()

**Signature**: `(element: HTMLElement, handlers: GestureHandlers) => () => void`

**Description**: Attach gesture event handlers (swipe, pinch, pan) to an element.

**Example**:
```typescript
import { attachGestures } from 'philjs-core';

const cleanup = attachGestures(element, {
  onSwipeLeft: () => console.log('Swiped left'),
  onSwipeRight: () => console.log('Swiped right'),
  onPinch: (scale) => console.log('Pinched:', scale),
});

// Later...
cleanup();
```

**See also**: [createAnimatedValue()](#createanimatedvalue)

---

### createParallax()

**Signature**: `(options: ParallaxOptions) => ParallaxController`

**Description**: Create a parallax scrolling effect.

**Example**:
```typescript
import { createParallax } from 'philjs-core';

const parallax = createParallax({
  speed: 0.5,
  direction: 'vertical',
});

<div ref={parallax.ref} style={{ transform: parallax.transform }}>
  Background Layer
</div>
```

**See also**: [createAnimatedValue()](#createanimatedvalue)

---

## Internationalization

### I18nProvider

**Signature**: `Component<I18nProviderProps>`

**Description**: Provider component for internationalization support.

**Example**:
```typescript
import { I18nProvider } from 'philjs-core';

const translations = {
  en: { hello: 'Hello' },
  es: { hello: 'Hola' },
};

function App() {
  return (
    <I18nProvider locale="en" translations={translations}>
      <Content />
    </I18nProvider>
  );
}
```

**See also**: [useI18n()](#usei18n), [useTranslation()](#usetranslation)

---

### useI18n()

**Signature**: `() => I18nContext`

**Description**: Access the i18n context for locale management.

**Example**:
```typescript
import { useI18n } from 'philjs-core';

function LanguageSwitcher() {
  const i18n = useI18n();

  return (
    <select
      value={i18n.locale()}
      onChange={(e) => i18n.setLocale(e.target.value)}
    >
      <option value="en">English</option>
      <option value="es">Español</option>
    </select>
  );
}
```

**See also**: [I18nProvider](#i18nprovider), [useTranslation()](#usetranslation)

---

### useTranslation()

**Signature**: `(namespace?: string) => TranslationFunction`

**Description**: Access translation function for the current locale.

**Example**:
```typescript
import { useTranslation } from 'philjs-core';

function Greeting() {
  const t = useTranslation();

  return <h1>{t('hello')}</h1>;
}
```

**See also**: [I18nProvider](#i18nprovider), [useI18n()](#usei18n)

---

## Error Boundaries

### ErrorBoundary

**Signature**: `Component<ErrorBoundaryProps>`

**Description**: Component for catching and handling errors in the component tree.

**Example**:
```typescript
import { ErrorBoundary } from 'philjs-core';

function App() {
  return (
    <ErrorBoundary fallback={(error) => <ErrorDisplay error={error} />}>
      <Content />
    </ErrorBoundary>
  );
}
```

**See also**: [setupGlobalErrorHandler()](#setupglobalerrorhandler), [errorRecovery()](#errorrecovery)

---

### setupGlobalErrorHandler()

**Signature**: `(handler: (error: Error, errorInfo: ErrorInfo) => void) => void`

**Description**: Set up a global error handler for unhandled errors.

**Example**:
```typescript
import { setupGlobalErrorHandler } from 'philjs-core';

setupGlobalErrorHandler((error, errorInfo) => {
  console.error('Global error:', error);
  // Send to error tracking service
});
```

**See also**: [ErrorBoundary](#errorboundary)

---

### errorRecovery()

**Signature**: `(error: Error) => ErrorSuggestion[]`

**Description**: Get recovery suggestions for common errors.

**Example**:
```typescript
import { errorRecovery } from 'philjs-core';

try {
  // Some code
} catch (error) {
  const suggestions = errorRecovery(error);
  console.log('Try:', suggestions);
}
```

**See also**: [ErrorBoundary](#errorboundary)

---

## Service Worker

### generateServiceWorker()

**Signature**: `(config: ServiceWorkerConfig) => string`

**Description**: Generate a service worker script with caching strategies.

**Example**:
```typescript
import { generateServiceWorker } from 'philjs-core';

const sw = generateServiceWorker({
  cacheStrategy: 'network-first',
  cacheName: 'my-app-v1',
});
```

**See also**: [registerServiceWorker()](#registerserviceworker)

---

### registerServiceWorker()

**Signature**: `(scriptURL: string, options?: RegistrationOptions) => Promise<ServiceWorkerRegistration>`

**Description**: Register a service worker for offline support.

**Example**:
```typescript
import { registerServiceWorker } from 'philjs-core';

if ('serviceWorker' in navigator) {
  registerServiceWorker('/sw.js').then(reg => {
    console.log('Service worker registered:', reg);
  });
}
```

**See also**: [generateServiceWorker()](#generateserviceworker)

---

## Performance & Intelligence

### performanceBudgets

**Signature**: `PerformanceBudgetManager`

**Description**: Monitor and enforce performance budgets for your application.

**Example**:
```typescript
import { performanceBudgets } from 'philjs-core';

performanceBudgets.setBudget('/', {
  fcp: 1500, // First Contentful Paint
  lcp: 2500, // Largest Contentful Paint
  tti: 3500, // Time to Interactive
});

const report = performanceBudgets.check('/');
```

**See also**: [PerformanceBudgetManager](#performancebudgetmanager)

---

### costTracker

**Signature**: `CostTracker`

**Description**: Track and estimate cloud infrastructure costs.

**Example**:
```typescript
import { costTracker } from 'philjs-core';

costTracker.trackRequest('/api/users', {
  computeTime: 100,
  bandwidth: 1024,
});

const estimate = costTracker.estimateCost();
console.log('Monthly cost:', estimate.monthly);
```

**See also**: [CostTracker](#costtracker)

---

### usageAnalytics

**Signature**: `UsageAnalytics`

**Description**: Analyze component usage and identify dead code.

**Example**:
```typescript
import { usageAnalytics } from 'philjs-core';

usageAnalytics.track('MyComponent');

const report = usageAnalytics.generateReport();
console.log('Unused components:', report.deadCode);
```

**See also**: [UsageAnalytics](#usageanalytics)

---

## Error Handling & Result

### Ok()

**Signature**: `<T>(value: T) => Result<T, never>`

**Description**: Create a successful Result value (Rust-style error handling).

**Example**:
```typescript
import { Ok, Err, matchResult } from 'philjs-core';

function divide(a: number, b: number) {
  if (b === 0) return Err('Division by zero');
  return Ok(a / b);
}

const result = divide(10, 2);
matchResult(result, {
  ok: (value) => console.log('Result:', value),
  err: (error) => console.error('Error:', error),
});
```

**See also**: [Err()](#err), [matchResult()](#matchresult)

---

### Err()

**Signature**: `<E>(error: E) => Result<never, E>`

**Description**: Create a failed Result value.

**Example**:
```typescript
import { Err, isErr } from 'philjs-core';

const result = Err('Something went wrong');

if (isErr(result)) {
  console.error('Error:', result.error);
}
```

**See also**: [Ok()](#ok), [isErr()](#iserr)

---

### isOk()

**Signature**: `<T, E>(result: Result<T, E>) => result is Ok<T>`

**Description**: Check if a Result is successful.

**Example**:
```typescript
import { Ok, isOk } from 'philjs-core';

const result = Ok(42);

if (isOk(result)) {
  console.log('Value:', result.value);
}
```

**See also**: [Ok()](#ok), [isErr()](#iserr)

---

### isErr()

**Signature**: `<T, E>(result: Result<T, E>) => result is Err<E>`

**Description**: Check if a Result is an error.

**Example**:
```typescript
import { Err, isErr } from 'philjs-core';

const result = Err('Failed');

if (isErr(result)) {
  console.error('Error:', result.error);
}
```

**See also**: [Err()](#err), [isOk()](#isok)

---

### map()

**Signature**: `<T, U, E>(result: Result<T, E>, fn: (value: T) => U) => Result<U, E>`

**Description**: Transform the value inside a successful Result.

**Example**:
```typescript
import { Ok, map } from 'philjs-core';

const result = Ok(5);
const doubled = map(result, (x) => x * 2);
// doubled = Ok(10)
```

**See also**: [mapErr()](#maperr), [andThen()](#andthen)

---

### mapErr()

**Signature**: `<T, E, F>(result: Result<T, E>, fn: (error: E) => F) => Result<T, F>`

**Description**: Transform the error inside a failed Result.

**Example**:
```typescript
import { Err, mapErr } from 'philjs-core';

const result = Err(404);
const mapped = mapErr(result, (code) => `Error ${code}`);
// mapped = Err('Error 404')
```

**See also**: [map()](#map), [andThen()](#andthen)

---

### andThen()

**Signature**: `<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>) => Result<U, E>`

**Description**: Chain Result-returning operations.

**Example**:
```typescript
import { Ok, andThen } from 'philjs-core';

const parse = (s: string) => Ok(parseInt(s));
const validate = (n: number) => n > 0 ? Ok(n) : Err('Must be positive');

const result = andThen(parse('42'), validate);
```

**See also**: [map()](#map), [matchResult()](#matchresult)

---

### unwrap()

**Signature**: `<T, E>(result: Result<T, E>) => T`

**Description**: Extract the value from a Result, throwing if it's an error.

**Example**:
```typescript
import { Ok, unwrap } from 'philjs-core';

const result = Ok(42);
const value = unwrap(result); // 42
```

**See also**: [unwrapOr()](#unwrapor), [matchResult()](#matchresult)

---

### unwrapOr()

**Signature**: `<T, E>(result: Result<T, E>, defaultValue: T) => T`

**Description**: Extract the value from a Result, returning a default if it's an error.

**Example**:
```typescript
import { Err, unwrapOr } from 'philjs-core';

const result = Err('Failed');
const value = unwrapOr(result, 0); // 0
```

**See also**: [unwrap()](#unwrap), [matchResult()](#matchresult)

---

### matchResult()

**Signature**: `<T, E, R>(result: Result<T, E>, handlers: { ok: (value: T) => R; err: (error: E) => R }) => R`

**Description**: Pattern match on a Result value.

**Example**:
```typescript
import { Ok, Err, matchResult } from 'philjs-core';

const result = Ok(42);

const message = matchResult(result, {
  ok: (value) => `Success: ${value}`,
  err: (error) => `Error: ${error}`,
});
```

**See also**: [Ok()](#ok), [Err()](#err)

---

## Forms & Validation

### useForm()

**Signature**: `<T extends Record<string, any>>(schema: FormSchema<T>, options?: UseFormOptions) => FormApi<T>`

**Description**: Create a form with validation and state management.

**Example**:
```typescript
import { useForm, validators as v } from 'philjs-core';

function LoginForm() {
  const form = useForm({
    email: {
      initialValue: '',
      validators: [v.required(), v.email()],
    },
    password: {
      initialValue: '',
      validators: [v.required(), v.minLength(8)],
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.validate()) {
      console.log('Form data:', form.values());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input {...form.field('email')} />
      {form.errors().email && <span>{form.errors().email}</span>}

      <input type="password" {...form.field('password')} />
      {form.errors().password && <span>{form.errors().password}</span>}

      <button type="submit">Submit</button>
    </form>
  );
}
```

**See also**: [validators](#validators), [createField()](#createfield)

---

### validators

**Signature**: `Record<string, ValidatorFactory>`

**Description**: Collection of built-in validators for form validation.

**Example**:
```typescript
import { validators as v } from 'philjs-core';

const validators = [
  v.required('This field is required'),
  v.email('Must be a valid email'),
  v.minLength(8, 'Must be at least 8 characters'),
  v.maxLength(100, 'Must be less than 100 characters'),
  v.pattern(/^[A-Z]/, 'Must start with uppercase'),
  v.custom((value) => value !== 'admin' || 'Username taken'),
];
```

**See also**: [useForm()](#useform)

---

### createField()

**Signature**: `<T>(initialValue: T, validators?: ValidationRule[]) => FieldProps<T>`

**Description**: Create a standalone form field with validation.

**Example**:
```typescript
import { createField, validators as v } from 'philjs-core';

const email = createField('', [v.required(), v.email()]);

<input
  value={email.value()}
  onChange={(e) => email.setValue(e.target.value)}
  onBlur={() => email.validate()}
/>
{email.error() && <span>{email.error()}</span>}
```

**See also**: [useForm()](#useform), [validators](#validators)

---

## Accessibility

For detailed accessibility APIs, see [Advanced: Accessibility](/docs/advanced/accessibility.md)

Key exports:
- `configureA11y()` - Configure accessibility settings
- `enhanceWithAria()` - Auto-generate ARIA labels
- `validateHeadingHierarchy()` - Validate heading structure
- `getContrastRatio()` - Calculate color contrast
- `auditAccessibility()` - Run full accessibility audit
- `createFocusManager()` - Manage keyboard focus
- `announceToScreenReader()` - Announce to screen readers

---

## A/B Testing

For detailed A/B testing APIs, see [Advanced: A/B Testing](/docs/advanced/ab-testing.md)

Key exports:
- `initABTesting()` - Initialize A/B testing engine
- `useExperiment()` - Assign users to variants
- `ABTest` - Component for A/B testing
- `useFeatureFlag()` - Feature flag management
- `calculateSignificance()` - Statistical analysis

---

## Partial Pre-rendering (PPR)

For detailed PPR APIs, see [Advanced: Partial Pre-rendering](/docs/advanced/ppr.md)

Key exports:
- `PPRBoundary` - Boundary component for PPR
- `staticShell()` - Mark content as static
- `dynamicContent()` - Mark content as dynamic
- `configurePPR()` - Configure PPR settings
- `renderWithPPR()` - Render with PPR support

---

## Activity Component

For detailed Activity Component APIs, see [Advanced: Activity Component](/docs/advanced/activity.md)

Key exports:
- `Activity` - Priority-based rendering component
- `useActivityState()` - Access activity state
- `createTabs()` - Tab-like activity management
- `configureActivity()` - Configure activity behavior

---

## Next Steps

- [Router API](/docs/api-reference/router.md) - Router APIs
- [Data API](/docs/api-reference/data.md) - Data fetching APIs
- [Advanced Topics](/docs/advanced/overview.md) - Advanced features

---

ℹ️ **Note**: All APIs are fully typed with TypeScript. See the TypeScript definitions for complete type information.
