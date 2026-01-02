# JSX and Rendering

PhilJS provides a custom JSX runtime that transforms JSX into efficient DOM operations with fine-grained reactivity.

## JSX Runtime

### Configuration

Configure your project to use PhilJS JSX:

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@philjs/core"
  }
}
```

**vite.config.ts:**
```ts
import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@philjs/core'
  }
});
```

## Components

### Function Components

PhilJS components are plain functions that return JSX:

```tsx
import { signal } from '@philjs/core';

// Simple component
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}

// Component with state
function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Props

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: JSX.Element;
}

function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children
}: ButtonProps) {
  return (
    <button
      class={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Children

```tsx
function Card({ title, children }: { title: string; children: JSX.Element }) {
  return (
    <div class="card">
      <div class="card-header">{title}</div>
      <div class="card-body">{children}</div>
    </div>
  );
}

// Usage
<Card title="Welcome">
  <p>This is the card content.</p>
</Card>
```

## Reactive Expressions

JSX expressions automatically subscribe to signals:

```tsx
const name = signal('World');
const count = signal(0);

function App() {
  return (
    <div>
      {/* Reactive text */}
      <h1>Hello, {name()}!</h1>

      {/* Reactive attributes */}
      <input value={name()} onInput={e => name.set(e.target.value)} />

      {/* Reactive styles */}
      <div style={{ opacity: count() > 5 ? 1 : 0.5 }}>
        Fades in at count > 5
      </div>

      {/* Reactive classes */}
      <div class={count() % 2 === 0 ? 'even' : 'odd'}>
        Even/Odd indicator
      </div>
    </div>
  );
}
```

## Conditional Rendering

### Ternary Operator

```tsx
const isLoggedIn = signal(false);

function AuthStatus() {
  return (
    <div>
      {isLoggedIn()
        ? <UserDashboard />
        : <LoginForm />
      }
    </div>
  );
}
```

### Logical AND

```tsx
const showBanner = signal(true);

function Page() {
  return (
    <div>
      {showBanner() && <PromoBanner />}
      <MainContent />
    </div>
  );
}
```

### Switch/Match Pattern

```tsx
const status = signal<'loading' | 'success' | 'error'>('loading');

function StatusDisplay() {
  return (
    <div>
      {(() => {
        switch (status()) {
          case 'loading':
            return <Spinner />;
          case 'success':
            return <SuccessMessage />;
          case 'error':
            return <ErrorMessage />;
        }
      })()}
    </div>
  );
}
```

## List Rendering

### Basic Lists

```tsx
const items = signal(['Apple', 'Banana', 'Cherry']);

function FruitList() {
  return (
    <ul>
      {items().map((fruit, index) => (
        <li key={fruit}>{index + 1}. {fruit}</li>
      ))}
    </ul>
  );
}
```

### Keyed Lists (Important!)

Always provide unique keys for list items:

```tsx
interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const todos = signal<Todo[]>([]);

function TodoList() {
  return (
    <ul>
      {todos().map(todo => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => toggleTodo(todo.id)}
          />
          <span class={todo.done ? 'done' : ''}>{todo.text}</span>
        </li>
      ))}
    </ul>
  );
}
```

### Index-Based Keys (When No ID)

```tsx
// Only use index keys for static lists that won't reorder
function StaticList() {
  return (
    <ul>
      {staticItems.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
```

## Fragments

Use fragments to return multiple elements:

```tsx
import { Fragment } from '@philjs/core';

function MultipleElements() {
  return (
    <>
      <Header />
      <Main />
      <Footer />
    </>
  );
}

// Or explicit Fragment
function ExplicitFragment() {
  return (
    <Fragment>
      <Header />
      <Main />
      <Footer />
    </Fragment>
  );
}
```

## Event Handling

### Basic Events

```tsx
function EventExamples() {
  return (
    <div>
      <button onClick={() => console.log('Clicked!')}>
        Click me
      </button>

      <input
        onInput={e => console.log(e.target.value)}
        onFocus={() => console.log('Focused')}
        onBlur={() => console.log('Blurred')}
      />

      <form onSubmit={e => {
        e.preventDefault();
        handleSubmit();
      }}>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
```

### Event Modifiers

```tsx
function EventModifiers() {
  return (
    <div>
      {/* Prevent default */}
      <a href="/page" onClick={e => {
        e.preventDefault();
        navigate('/page');
      }}>
        Navigate
      </a>

      {/* Stop propagation */}
      <div onClick={() => console.log('Parent')}>
        <button onClick={e => {
          e.stopPropagation();
          console.log('Child only');
        }}>
          Click
        </button>
      </div>
    </div>
  );
}
```

### Keyboard Events

```tsx
function KeyboardHandler() {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      submitForm();
    }
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  return (
    <input
      onKeyDown={handleKeyDown}
      placeholder="Ctrl+Enter to submit"
    />
  );
}
```

## Refs

Access DOM elements directly:

```tsx
function InputWithFocus() {
  let inputRef: HTMLInputElement;

  const focusInput = () => {
    inputRef?.focus();
  };

  return (
    <div>
      <input ref={el => inputRef = el} />
      <button onClick={focusInput}>Focus Input</button>
    </div>
  );
}
```

### Ref Patterns

```tsx
function VideoPlayer() {
  let videoRef: HTMLVideoElement;

  const play = () => videoRef?.play();
  const pause = () => videoRef?.pause();
  const seek = (time: number) => {
    if (videoRef) videoRef.currentTime = time;
  };

  return (
    <div>
      <video ref={el => videoRef = el} src="/video.mp4" />
      <div class="controls">
        <button onClick={play}>Play</button>
        <button onClick={pause}>Pause</button>
        <button onClick={() => seek(0)}>Restart</button>
      </div>
    </div>
  );
}
```

## Styles

### Inline Styles

```tsx
const color = signal('blue');
const size = signal(16);

function StyledComponent() {
  return (
    <div style={{
      color: color(),
      fontSize: `${size()}px`,
      padding: '1rem',
      backgroundColor: 'white'
    }}>
      Styled content
    </div>
  );
}
```

### Dynamic Classes

```tsx
const isActive = signal(false);
const variant = signal<'primary' | 'secondary'>('primary');

function DynamicClasses() {
  return (
    <button
      class={`btn btn-${variant()} ${isActive() ? 'active' : ''}`}
    >
      Click me
    </button>
  );
}

// Using classList helper
function ClassListExample() {
  return (
    <div classList={{
      'card': true,
      'card-active': isActive(),
      'card-primary': variant() === 'primary',
      'card-secondary': variant() === 'secondary'
    }}>
      Content
    </div>
  );
}
```

## Client-Side Rendering

### `render(component, container)`

Mount a component to the DOM:

```tsx
import { render } from '@philjs/core';

function App() {
  return <h1>Hello, World!</h1>;
}

// Mount to DOM
render(() => <App />, document.getElementById('app')!);
```

### `hydrate(component, container)`

Hydrate server-rendered HTML:

```tsx
import { hydrate } from '@philjs/core';

// Hydrate existing HTML from SSR
hydrate(() => <App />, document.getElementById('app')!);
```

## Server-Side Rendering

### `renderToString(component)`

Render to HTML string:

```tsx
import { renderToString } from '@philjs/core/render-to-string';

const html = await renderToString(() => <App />);
// <div><h1>Hello, World!</h1></div>
```

### `renderToStream(component)`

Stream HTML for faster TTFB:

```tsx
import { renderToStream } from '@philjs/core/render-to-string';

const stream = renderToStream(() => <App />);

// In Express/Hono/etc.
app.get('/', async (c) => {
  const stream = renderToStream(() => <App />);
  return new Response(stream, {
    headers: { 'Content-Type': 'text/html' }
  });
});
```

## Special Attributes

### `innerHTML` and `textContent`

```tsx
const rawHtml = signal('<strong>Bold</strong>');

function RawContent() {
  return (
    <div>
      {/* Render raw HTML (be careful with XSS!) */}
      <div innerHTML={rawHtml()} />

      {/* Safe text content */}
      <div textContent={rawHtml()} />
    </div>
  );
}
```

### `data-*` Attributes

```tsx
function DataAttributes() {
  return (
    <button
      data-testid="submit-button"
      data-analytics="click:submit"
      data-user-id={userId()}
    >
      Submit
    </button>
  );
}
```

### ARIA Attributes

```tsx
const isExpanded = signal(false);

function AccessibleAccordion() {
  return (
    <div>
      <button
        aria-expanded={isExpanded()}
        aria-controls="content"
        onClick={() => isExpanded.set(e => !e)}
      >
        Toggle Content
      </button>
      <div
        id="content"
        role="region"
        aria-hidden={!isExpanded()}
        hidden={!isExpanded()}
      >
        Accordion content
      </div>
    </div>
  );
}
```

## Performance Tips

### 1. Minimize Re-renders

```tsx
// Bad: Entire list re-renders on any change
const state = signal({ items: [], filter: '' });

// Good: Granular signals
const items = signal([]);
const filter = signal('');
```

### 2. Memoize Components

```tsx
import { memo } from '@philjs/core';

// Only re-renders when props change
const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  return <div>{/* Complex rendering */}</div>;
});
```

### 3. Lazy Load Components

```tsx
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyChart data={data()} />
    </Suspense>
  );
}
```

## TypeScript Types

```tsx
import type { JSXElement, VNode, CSSProperties } from '@philjs/core';

// Component props type
interface MyComponentProps {
  title: string;
  children?: JSXElement;
  style?: CSSProperties;
}

function MyComponent({ title, children, style }: MyComponentProps): JSXElement {
  return (
    <div style={style}>
      <h1>{title}</h1>
      {children}
    </div>
  );
}
```

## Next Steps

- [Data Layer](./data-layer.md)
- [Forms and Validation](./forms.md)
- [Server-Side Rendering](./ssr.md)
