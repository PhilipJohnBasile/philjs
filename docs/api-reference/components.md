# Components API

Component rendering and JSX in PhilJS.

## render()

Renders a component into a DOM container.

### Signature

```typescript
function render(
  component: JSX.Element,
  container: HTMLElement
): void
```

### Parameters

- **component**: `JSX.Element` - The component to render
- **container**: `HTMLElement` - The DOM element to render into

### Returns

`void`

### Examples

#### Basic Rendering

```typescript
import { render } from '@philjs/core';

function App() {
  return <h1>Hello, PhilJS!</h1>;
}

render(<App />, document.getElementById('app')!);
```

#### With Props

```typescript
interface GreetingProps {
  name: string;
}

function Greeting({ name }: GreetingProps) {
  return <h1>Hello, {name}!</h1>;
}

render(<Greeting name="Alice" />, document.getElementById('app')!);
```

### Notes

- Replaces all content in the container
- Automatically creates a render root
- Use `hydrate()` for server-rendered content

---

## hydrate()

Hydrates server-rendered HTML by attaching event listeners and reactive state.

### Signature

```typescript
function hydrate(
  component: JSX.Element,
  container: HTMLElement
): void
```

### Parameters

- **component**: `JSX.Element` - The component to hydrate
- **container**: `HTMLElement` - The DOM element containing server-rendered HTML

### Returns

`void`

### Examples

#### Basic Hydration

```typescript
import { hydrate } from '@philjs/core';

// Server sent HTML
// <div id="app"><h1>Hello, PhilJS!</h1></div>

function App() {
  return <h1>Hello, PhilJS!</h1>;
}

hydrate(<App />, document.getElementById('app')!);
```

#### With Interactive Components

```typescript
function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}

// Hydrate makes button interactive
hydrate(<Counter />, document.getElementById('app')!);
```

### Notes

- Expects server-rendered HTML to match component output
- More performant than `render()` for server-rendered apps
- Attaches event listeners without re-rendering
- Hydration mismatches cause warnings in development

---

## JSX

PhilJS supports JSX syntax for describing UI.

### JSX Elements

```typescript
// HTML elements
<div className="container">
  <h1>Title</h1>
  <p>Paragraph</p>
</div>

// Components
<MyComponent prop="value" />

// Fragments
<>
  <Header />
  <Main />
  <Footer />
</>
```

### Props

```typescript
// String props
<input type="text" placeholder="Enter name" />

// Number props
<input type="number" min={0} max={100} />

// Boolean props
<input type="checkbox" checked={true} disabled={false} />

// Event handlers
<button onClick={(e) => console.log('Clicked', e)}>
  Click me
</button>

// Spread props
const props = { type: 'text', placeholder: 'Name' };
<input {...props} />
```

### Children

```typescript
// Text children
<div>Hello, world!</div>

// Element children
<div>
  <span>Child 1</span>
  <span>Child 2</span>
</div>

// Expression children
<div>{count()}</div>

// Array children
<ul>
  {items().map(item => (
    <li key={item.id}>{item.name}</li>
  ))}
</ul>

// Conditional children
<div>
  {isLoggedIn() ? <Dashboard /> : <Login />}
</div>
```

### Attributes

#### HTML Attributes

```typescript
<div
  id="app"
  className="container"
  style={{ color: 'red', fontSize: '16px' }}
  data-testid="app-container"
  aria-label="Application"
>
  Content
</div>
```

#### Event Handlers

```typescript
<button
  onClick={(e) => handleClick(e)}
  onMouseEnter={() => handleHover()}
  onKeyDown={(e) => handleKeyPress(e)}
>
  Button
</button>
```

#### Refs

```typescript
function Component() {
  let inputRef: HTMLInputElement | undefined;

  const focusInput = () => {
    inputRef?.focus();
  };

  return (
    <div>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus</button>
    </div>
  );
}
```

---

## Fragment

Groups multiple elements without adding extra DOM nodes.

### Signature

```typescript
<>
  {children}
</>

// Or explicitly
<Fragment>
  {children}
</Fragment>
```

### Examples

#### Basic Fragment

```typescript
function List() {
  return (
    <>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </>
  );
}

// Renders without wrapper element
```

#### Fragment with Key

```typescript
function Items() {
  return items().map(item => (
    <Fragment key={item.id}>
      <dt>{item.term}</dt>
      <dd>{item.definition}</dd>
    </Fragment>
  ));
}
```

### Notes

- Fragments don't create DOM elements
- Use fragments to avoid unnecessary wrapper divs
- Fragments can have `key` prop for lists

---

## lazy()

Lazily loads a component with code splitting.

### Signature

```typescript
function lazy<P>(
  loader: () => Promise<{ default: Component<P> }>
): Component<P>
```

### Parameters

- **loader**: `() => Promise<{ default: Component<P> }>` - Function that returns a dynamic import

### Returns

A lazy-loaded component

### Examples

#### Basic Lazy Loading

```typescript
import { lazy, Suspense } from '@philjs/core';

const Dashboard = lazy(() => import('./Dashboard'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
    </Suspense>
  );
}
```

#### Route-Based Code Splitting

```typescript
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

function App() {
  return (
    <Router>
      <Route path="/" component={() => (
        <Suspense fallback={<Loading />}>
          <Home />
        </Suspense>
      )} />

      <Route path="/about" component={() => (
        <Suspense fallback={<Loading />}>
          <About />
        </Suspense>
      )} />
    </Router>
  );
}
```

### Notes

- Must be used with `Suspense` component
- Component is loaded on first render
- Subsequent renders use cached component
- Supports named exports with wrapper

---

## Suspense

Displays fallback UI while lazy components load.

### Signature

```typescript
interface SuspenseProps {
  fallback: JSX.Element;
  children: JSX.Element;
}

function Suspense({ fallback, children }: SuspenseProps): JSX.Element
```

### Parameters

- **fallback**: `JSX.Element` - UI to show while loading
- **children**: `JSX.Element` - Content that may suspend

### Examples

#### Basic Suspense

```typescript
<Suspense fallback={<div>Loading...</div>}>
  <LazyComponent />
</Suspense>
```

#### Nested Suspense

```typescript
<Suspense fallback={<AppLoading />}>
  <Layout>
    <Suspense fallback={<SidebarLoading />}>
      <Sidebar />
    </Suspense>

    <Suspense fallback={<ContentLoading />}>
      <Content />
    </Suspense>
  </Layout>
</Suspense>
```

#### Multiple Lazy Components

```typescript
<Suspense fallback={<Loading />}>
  <LazyHeader />
  <LazyContent />
  <LazyFooter />
</Suspense>
// Shows fallback until all components load
```

### Notes

- Catches closest suspended component
- Can be nested for granular loading states
- Fallback shows immediately when suspending
- Children render when all async dependencies resolve

---

## ErrorBoundary

Catches errors in component tree.

### Signature

```typescript
interface ErrorBoundaryProps {
  fallback: (error: Error, reset: () => void) => JSX.Element;
  onError?: (error: Error, errorInfo: any) => void;
  children: JSX.Element;
}

function ErrorBoundary(props: ErrorBoundaryProps): JSX.Element
```

### Parameters

- **fallback**: `(error: Error, reset: () => void) => JSX.Element` - Error UI renderer
- **onError**: `(error: Error, errorInfo: any) => void` - Error callback (optional)
- **children**: `JSX.Element` - Components to catch errors from

### Examples

#### Basic Error Boundary

```typescript
<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <h1>Error: {error.message}</h1>
      <button onClick={reset}>Try again</button>
    </div>
  )}
>
  <App />
</ErrorBoundary>
```

#### With Error Logging

```typescript
<ErrorBoundary
  fallback={(error) => <ErrorPage error={error} />}
  onError={(error, errorInfo) => {
    logErrorToService(error, errorInfo);
  }}
>
  <App />
</ErrorBoundary>
```

#### Nested Error Boundaries

```typescript
<ErrorBoundary fallback={AppError}>
  <Header />

  <ErrorBoundary fallback={ContentError}>
    <Content />
  </ErrorBoundary>

  <Footer />
</ErrorBoundary>
```

### Notes

- Catches errors during rendering, in effects, and in event handlers
- Does not catch errors in async code (use try-catch)
- Reset function re-renders children
- Can be nested for granular error handling

---

## Portal

Renders children outside the DOM hierarchy.

### Signature

```typescript
interface PortalProps {
  children: JSX.Element;
  container?: HTMLElement;
}

function Portal({ children, container }: PortalProps): JSX.Element
```

### Parameters

- **children**: `JSX.Element` - Content to render in portal
- **container**: `HTMLElement` - Target container (defaults to `document.body`)

### Examples

#### Modal Portal

```typescript
function Modal({ isOpen, children }: ModalProps) {
  if (!isOpen()) return null;

  return (
    <Portal>
      <div className="modal-overlay">
        <div className="modal-content">
          {children}
        </div>
      </div>
    </Portal>
  );
}
```

#### Custom Container

```typescript
<Portal container={document.getElementById('modals')!}>
  <Dialog />
</Portal>
```

### Notes

- Useful for modals, tooltips, and dropdowns
- Events bubble through portal to React tree
- Portal content styled separately from parent

---

## Best Practices

### Use TypeScript for Props

```typescript
// ✅ Type-safe props
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: JSX.Element;
}

function Button({ variant, onClick, children }: ButtonProps) {
  return (
    <button className={`btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}
```

### Lazy Load Heavy Components

```typescript
// ✅ Code split large components
const Chart = lazy(() => import('./Chart'));
const Editor = lazy(() => import('./Editor'));
```

### Handle Loading States

```typescript
// ✅ Always provide fallback
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

### Handle Errors Gracefully

```typescript
// ✅ Error boundaries at appropriate levels
<ErrorBoundary fallback={ErrorPage}>
  <App />
</ErrorBoundary>
```

---

**Next:** [Context API →](./context.md) Context and dependency injection
