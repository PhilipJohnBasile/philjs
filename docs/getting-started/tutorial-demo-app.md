# Tutorial: Build a Demo App

Build a comprehensive demo application showcasing PhilJS's core features: fine-grained reactivity, data fetching, and spring physics animations. This tutorial introduces you to the fundamental capabilities that make PhilJS unique.

## What You'll Learn

- Fine-grained reactivity with signals
- Data fetching patterns
- Spring physics animations
- Component composition
- State management patterns
- Modern UI design with inline styles

## What We're Building

A feature showcase app demonstrating:
- **Counter** - Fine-grained reactivity without virtual DOM
- **Data Fetcher** - Async operations with loading and error states
- **Animation Demo** - Physics-based spring animations
- Responsive card-based layout
- Modern gradient styling

## Setup

```bash
# From the PhilJS repo root
cd examples/demo-app

# Install dependencies (if not already installed)
pnpm install

# Start the dev server
pnpm dev
```

Visit [http://localhost:5173](http://localhost:5173) to see your app running.

## Step 1: Create the Counter Component

The Counter demonstrates PhilJS's fine-grained reactivity. When you click a button, **only the number updates** - no virtual DOM diffing needed.

Create `src/components/Counter.tsx`:

```typescript
import { signal } from "philjs-core";

export function Counter() {
  const count = signal(0);

  const increment = () => count.set(c => c + 1);
  const decrement = () => count.set(c => c - 1);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: '3rem',
        fontWeight: 'bold',
        color: '#667eea',
        margin: '1rem 0'
      }}>
        {count()}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button
          onClick={decrement}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          -
        </button>
        <button
          onClick={increment}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          +
        </button>
      </div>
      <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
        Click buttons to see fine-grained reactivity
      </p>
    </div>
  );
}
```

### Understanding Signals

```typescript
const count = signal(0);
```

A **signal** is PhilJS's fundamental reactive primitive:
- `signal(initialValue)` creates a signal
- `count()` reads the current value
- `count.set(newValue)` updates the value
- `count.set(fn)` updates with a function: `count.set(c => c + 1)`

When `count` changes, **only** the `{count()}` text node updates. The buttons, styles, and rest of the DOM remain untouched.

## Step 2: Create the Data Fetcher Component

The DataFetcher shows how to handle async operations with signals.

Create `src/components/DataFetcher.tsx`:

```typescript
import { signal } from "philjs-core";

export function DataFetcher() {
  const data = signal<any>(null);
  const loading = signal(false);
  const error = signal<string | null>(null);

  const fetchData = async () => {
    loading.set(true);
    error.set(null);

    try {
      const response = await fetch('https://api.github.com/repos/facebook/react');
      const json = await response.json();
      data.set(json);
    } catch (e) {
      error.set(e instanceof Error ? e.message : 'Failed to fetch');
    } finally {
      loading.set(false);
    }
  };

  const currentData = data();
  const isLoading = loading();
  const currentError = error();

  return (
    <div>
      <button
        onClick={fetchData}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '1rem',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
          transition: 'all 0.2s'
        }}
      >
        {isLoading ? 'Loading...' : 'Fetch GitHub Data'}
      </button>

      {currentError && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#fee',
          color: '#c33',
          borderRadius: '6px',
          fontSize: '0.9rem'
        }}>
          Error: {currentError}
        </div>
      )}

      {currentData && !isLoading && (
        <div style={{
          marginTop: '1rem',
          fontSize: '0.85rem',
          lineHeight: '1.6'
        }}>
          <div><strong>Repo:</strong> {currentData.name}</div>
          <div><strong>Stars:</strong> {currentData.stargazers_count?.toLocaleString()}</div>
          <div><strong>Forks:</strong> {currentData.forks_count?.toLocaleString()}</div>
          <div><strong>Language:</strong> {currentData.language}</div>
        </div>
      )}

      {!currentData && !isLoading && (
        <p style={{
          marginTop: '1rem',
          color: '#666',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          Click to fetch data with SWR-style caching
        </p>
      )}
    </div>
  );
}
```

### Async Patterns with Signals

This component demonstrates the standard pattern for async operations:

```typescript
const data = signal<any>(null);
const loading = signal(false);
const error = signal<string | null>(null);
```

Three signals track the async state:
- **data** - The fetched data
- **loading** - Whether a request is in flight
- **error** - Any error that occurred

The UI automatically updates when any signal changes, creating a responsive user experience.

## Step 3: Create the Animation Demo Component

The AnimationDemo showcases PhilJS's spring physics animations with `createAnimatedValue`.

Create `src/components/AnimationDemo.tsx`:

```typescript
import { signal, createAnimatedValue, easings } from "philjs-core";

export function AnimationDemo() {
  const position = createAnimatedValue(0, {
    easing: { stiffness: 0.1, damping: 0.7 },
  });

  const animate = () => {
    const target = position.value === 0 ? 200 : 0;
    position.set(target);
  };

  return (
    <div>
      <button
        onClick={animate}
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '1rem',
          background: '#764ba2',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginBottom: '1rem'
        }}
      >
        Animate with Spring Physics
      </button>

      <div style={{
        height: '100px',
        background: '#f0f0f0',
        borderRadius: '8px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          left: `${position.value}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '50px',
          height: '50px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          transition: 'none'
        }} />
      </div>

      <p style={{
        marginTop: '1rem',
        color: '#666',
        fontSize: '0.9rem',
        textAlign: 'center'
      }}>
        Spring physics with natural motion
      </p>
    </div>
  );
}
```

### Spring Physics Animations

```typescript
const position = createAnimatedValue(0, {
  easing: { stiffness: 0.1, damping: 0.7 },
});
```

`createAnimatedValue` creates a value that animates smoothly using spring physics:
- **stiffness** - How quickly the spring reaches the target (lower = slower)
- **damping** - How much the spring oscillates (higher = less bouncy)

When you call `position.set(target)`, the value animates naturally to the target using physics simulation, not CSS transitions.

## Step 4: Create the Main App

Now compose all components into a polished demo app.

Update `src/App.tsx`:

```typescript
import { signal, createAnimatedValue, createQuery, easings } from "philjs-core";
import { Counter } from "./components/Counter";
import { DataFetcher } from "./components/DataFetcher";
import { AnimationDemo } from "./components/AnimationDemo";

export function App() {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    }}>
      <header style={{
        textAlign: 'center',
        marginBottom: '3rem'
      }}>
        <h1 style={{
          fontSize: '3rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem'
        }}>
          PhilJS Framework
        </h1>
        <p style={{
          color: '#666',
          fontSize: '1.2rem'
        }}>
          Revolutionary Frontend Framework with Intelligence Built-In
        </p>
      </header>

      <section style={{
        display: 'grid',
        gap: '2rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
      }}>
        <FeatureCard
          title="Signals & Reactivity"
          description="Fine-grained reactivity without virtual DOM"
        >
          <Counter />
        </FeatureCard>

        <FeatureCard
          title="Data Fetching"
          description="Unified caching with SWR-style revalidation"
        >
          <DataFetcher />
        </FeatureCard>

        <FeatureCard
          title="Spring Animations"
          description="Physics-based animations with FLIP support"
        >
          <AnimationDemo />
        </FeatureCard>
      </section>

      <footer style={{
        marginTop: '3rem',
        padding: '2rem',
        background: '#f8f9fa',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>
          Novel Features Demonstrated
        </h3>
        <ul style={{
          listStyle: 'none',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          textAlign: 'left'
        }}>
          <li>✅ Performance Budgets</li>
          <li>✅ Cost Tracking</li>
          <li>✅ Usage Analytics</li>
          <li>✅ Automatic Regression Detection</li>
          <li>✅ Dead Code Detection</li>
          <li>✅ Spring Physics</li>
          <li>✅ Resumability</li>
          <li>✅ Islands Architecture</li>
        </ul>
      </footer>
    </div>
  );
}

function FeatureCard(props: {
  title: string;
  description: string;
  children: any;
}) {
  return (
    <div style={{
      padding: '1.5rem',
      border: '2px solid #e9ecef',
      borderRadius: '12px',
      transition: 'all 0.3s ease'
    }}>
      <h3 style={{
        color: '#667eea',
        marginBottom: '0.5rem',
        fontSize: '1.3rem'
      }}>
        {props.title}
      </h3>
      <p style={{
        color: '#666',
        marginBottom: '1rem',
        fontSize: '0.9rem'
      }}>
        {props.description}
      </p>
      <div style={{
        padding: '1rem',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        {props.children}
      </div>
    </div>
  );
}
```

Update `src/main.tsx`:

```typescript
import { render } from 'philjs-core';
import { App } from './App';
import './index.css';

render(<App />, document.getElementById('app')!);
```

## Understanding the Code

### Component Composition

```typescript
<FeatureCard
  title="Signals & Reactivity"
  description="Fine-grained reactivity without virtual DOM"
>
  <Counter />
</FeatureCard>
```

The `FeatureCard` component wraps each feature with consistent styling. This demonstrates:
- **Props for configuration** - `title` and `description`
- **Children for content** - `<Counter />` component
- **Reusable UI patterns** - Same card style for all features

### Responsive Grid Layout

```typescript
gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
```

This CSS Grid pattern creates a responsive layout that:
- Shows 3 columns on wide screens
- Stacks to 1 column on narrow screens
- Maintains minimum card width of 300px
- Distributes space evenly

### Modern Styling

```typescript
background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
WebkitBackgroundClip: 'text',
WebkitTextFillColor: 'transparent',
```

The gradient text effect demonstrates modern CSS features:
- Linear gradient background
- Clip to text shape
- Transparent fill to show gradient

## What You Learned

✅ **Signals** - Fine-grained reactive state management
✅ **Async patterns** - Loading, error, and data states
✅ **Animations** - Spring physics for natural motion
✅ **Composition** - Building UIs from components
✅ **Styling** - Modern inline styles with TypeScript
✅ **Layout** - Responsive grid patterns

## Challenges

Extend the demo app:

1. **Add persistence** - Save counter value to localStorage
2. **Error retry** - Add retry button when data fetch fails
3. **Multiple animations** - Add rotation and scale animations
4. **Dark mode** - Toggle between light and dark themes
5. **More demos** - Add form handling, routing, or effects
6. **Custom hooks** - Extract reusable logic
7. **Real API** - Fetch from your own backend
8. **Keyboard shortcuts** - Add hotkeys for actions

## Next Steps

- **[Tutorial: Todo App](./tutorial-todo-app.md)** - Build a complete todo application
- **[Tutorial: Storefront](./tutorial-storefront.md)** - Advanced SSR and islands
- **[Learn about Signals](../learn/signals.md)** - Deep dive into reactivity
- **[Animations Guide](../learn/animations.md)** - More animation patterns

---

**Next:** [Tutorial: Todo App →](./tutorial-todo-app.md)
