import { Metadata } from 'next';
import { CodeBlock } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Components - Core Concepts',
  description: 'Learn how to create reusable, composable components in PhilJS with props, children, and lifecycle management.',
};

export default function ComponentsPage() {
  return (
    <div className="mdx-content">
      <h1>Components</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        Components are the building blocks of PhilJS applications. Learn how to create reusable, composable UI elements.
      </p>

      <h2 id="basic-components">Basic Components</h2>

      <p>
        In PhilJS, components are just functions that return JSX:
      </p>

      <CodeBlock
        code={`function Greeting() {
  return <h1>Hello, World!</h1>;
}

// Usage
function App() {
  return (
    <div>
      <Greeting />
    </div>
  );
}`}
        language="typescript"
      />

      <h2 id="props">Props</h2>

      <p>
        Pass data to components using props:
      </p>

      <CodeBlock
        code={`interface GreetingProps {
  name: string;
  age?: number;
}

function Greeting(props: GreetingProps) {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      {props.age && <p>You are {props.age} years old.</p>}
    </div>
  );
}

// Usage
<Greeting name="Alice" age={30} />`}
        language="typescript"
      />

      <Callout type="info" title="Props are Reactive">
        Props automatically update when their values change. You don't need to wrap them in signals.
      </Callout>

      <h3>Destructuring Props</h3>

      <CodeBlock
        code={`// Direct destructuring
function Greeting({ name, age }: GreetingProps) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      {age && <p>You are {age} years old.</p>}
    </div>
  );
}

// With defaults
function Button({ label = 'Click me', onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}`}
        language="typescript"
      />

      <Callout type="warning" title="Destructuring Breaks Reactivity">
        Destructuring props early can break reactivity. If you need reactive props, destructure
        them inside your JSX or use <code>props.value</code> directly.
      </Callout>

      <h2 id="children">Children</h2>

      <CodeBlock
        code={`import { JSX } from 'philjs-core';

interface CardProps {
  title: string;
  children: JSX.Element;
}

function Card(props: CardProps) {
  return (
    <div className="card">
      <h2>{props.title}</h2>
      <div className="card-content">
        {props.children}
      </div>
    </div>
  );
}

// Usage
<Card title="Welcome">
  <p>This is the card content</p>
  <button>Click me</button>
</Card>`}
        language="typescript"
      />

      <h3>Render Props Pattern</h3>

      <CodeBlock
        code={`interface DataListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => JSX.Element;
}

function DataList<T>(props: DataListProps<T>) {
  return (
    <ul>
      <For each={props.data}>
        {(item, index) => (
          <li>{props.renderItem(item, index())}</li>
        )}
      </For>
    </ul>
  );
}

// Usage
<DataList
  data={users()}
  renderItem={(user, idx) => (
    <div>
      {idx + 1}. {user.name}
    </div>
  )}
/>`}
        language="typescript"
      />

      <h2 id="component-state">Component State</h2>

      <CodeBlock
        code={`function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}

// Complex state
function TodoList() {
  const [todos, setTodos] = createSignal<Todo[]>([]);
  const [filter, setFilter] = createSignal<'all' | 'active'>('all');

  const filteredTodos = createMemo(() =>
    filter() === 'all'
      ? todos()
      : todos().filter(t => !t.completed)
  );

  return (
    <div>
      {/* ... */}
    </div>
  );
}`}
        language="typescript"
      />

      <h2 id="lifecycle">Lifecycle</h2>

      <h3>onMount</h3>

      <CodeBlock
        code={`import { onMount } from 'philjs-core';

function DataFetcher() {
  const [data, setData] = createSignal(null);

  onMount(async () => {
    const response = await fetch('/api/data');
    const json = await response.json();
    setData(json);
  });

  return <div>{data() ? JSON.stringify(data()) : 'Loading...'}</div>;
}`}
        language="typescript"
      />

      <h3>onCleanup</h3>

      <CodeBlock
        code={`import { onMount, onCleanup } from 'philjs-core';

function Timer() {
  const [time, setTime] = createSignal(0);

  onMount(() => {
    const interval = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);

    // Cleanup function
    onCleanup(() => {
      clearInterval(interval);
    });
  });

  return <div>Time: {time()}s</div>;
}`}
        language="typescript"
      />

      <h2 id="refs">Refs</h2>

      <p>
        Access DOM elements directly using refs:
      </p>

      <CodeBlock
        code={`function FocusInput() {
  let inputRef: HTMLInputElement | undefined;

  const focus = () => {
    inputRef?.focus();
  };

  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={focus}>Focus Input</button>
    </div>
  );
}

// With callback ref
function ScrollToBottom() {
  const handleRef = (el: HTMLDivElement) => {
    el.scrollTop = el.scrollHeight;
  };

  return <div ref={handleRef}>{/* content */}</div>;
}`}
        language="typescript"
      />

      <h2 id="conditional-rendering">Conditional Rendering</h2>

      <h3>Show Component</h3>

      <CodeBlock
        code={`import { Show } from 'philjs-core';

function UserProfile() {
  const [user, setUser] = createSignal<User | null>(null);

  return (
    <Show
      when={user()}
      fallback={<p>Loading...</p>}
    >
      {(userData) => (
        <div>
          <h1>{userData.name}</h1>
          <p>{userData.email}</p>
        </div>
      )}
    </Show>
  );
}`}
        language="typescript"
      />

      <h3>Switch/Match Component</h3>

      <CodeBlock
        code={`import { Switch, Match } from 'philjs-core';

function StatusIndicator() {
  const [status, setStatus] = createSignal<'loading' | 'success' | 'error'>('loading');

  return (
    <Switch fallback={<p>Unknown status</p>}>
      <Match when={status() === 'loading'}>
        <Spinner />
      </Match>
      <Match when={status() === 'success'}>
        <SuccessMessage />
      </Match>
      <Match when={status() === 'error'}>
        <ErrorMessage />
      </Match>
    </Switch>
  );
}`}
        language="typescript"
      />

      <h2 id="lists">Rendering Lists</h2>

      <h3>For Component</h3>

      <CodeBlock
        code={`import { For } from 'philjs-core';

function TodoList() {
  const [todos, setTodos] = createSignal<Todo[]>([]);

  return (
    <ul>
      <For each={todos()}>
        {(todo, index) => (
          <li>
            {index() + 1}. {todo.text}
          </li>
        )}
      </For>
    </ul>
  );
}`}
        language="typescript"
      />

      <Callout type="info" title="Why Use For?">
        The <code>For</code> component is optimized for keyed lists. It only re-renders items that
        change, unlike <code>map()</code> which re-renders everything.
      </Callout>

      <h3>Index Component</h3>

      <CodeBlock
        code={`import { Index } from 'philjs-core';

// Use Index when items are primitives and order matters
function ColorList() {
  const [colors, setColors] = createSignal(['red', 'green', 'blue']);

  return (
    <ul>
      <Index each={colors()}>
        {(color, index) => (
          <li style={{ color: color() }}>
            {index}: {color()}
          </li>
        )}
      </Index>
    </ul>
  );
}`}
        language="typescript"
      />

      <h2 id="composition">Component Composition</h2>

      <h3>Higher-Order Components</h3>

      <CodeBlock
        code={`function withLoading<P extends object>(
  Component: (props: P) => JSX.Element
) {
  return (props: P & { loading: boolean }) => {
    return (
      <Show
        when={!props.loading}
        fallback={<Spinner />}
      >
        <Component {...props} />
      </Show>
    );
  };
}

// Usage
const UserProfileWithLoading = withLoading(UserProfile);
<UserProfileWithLoading user={user()} loading={isLoading()} />`}
        language="typescript"
      />

      <h3>Slots Pattern</h3>

      <CodeBlock
        code={`interface LayoutProps {
  header: JSX.Element;
  sidebar: JSX.Element;
  children: JSX.Element;
}

function Layout(props: LayoutProps) {
  return (
    <div className="layout">
      <header>{props.header}</header>
      <aside>{props.sidebar}</aside>
      <main>{props.children}</main>
    </div>
  );
}

// Usage
<Layout
  header={<Header />}
  sidebar={<Sidebar />}
>
  <MainContent />
</Layout>`}
        language="typescript"
      />

      <h2 id="context">Context</h2>

      <CodeBlock
        code={`import { createContext, useContext } from 'philjs-core';

interface ThemeContextType {
  theme: Accessor<'light' | 'dark'>;
  setTheme: Setter<'light' | 'dark'>;
}

const ThemeContext = createContext<ThemeContextType>();

function ThemeProvider(props: { children: JSX.Element }) {
  const [theme, setTheme] = createSignal<'light' | 'dark'>('light');

  const value = { theme, setTheme };

  return (
    <ThemeContext.Provider value={value}>
      {props.children}
    </ThemeContext.Provider>
  );
}

// Usage in child components
function ThemedButton() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('ThemeContext not found');

  return (
    <button className={context.theme()}>
      Current theme: {context.theme()}
    </button>
  );
}`}
        language="typescript"
      />

      <h2 id="error-boundaries">Error Boundaries</h2>

      <CodeBlock
        code={`import { ErrorBoundary } from 'philjs-core';

function App() {
  return (
    <ErrorBoundary
      fallback={(err, reset) => (
        <div>
          <h1>Something went wrong</h1>
          <pre>{err.message}</pre>
          <button onClick={reset}>Try again</button>
        </div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}`}
        language="typescript"
      />

      <h2 id="dynamic-imports">Dynamic Imports</h2>

      <CodeBlock
        code={`import { lazy } from 'philjs-core';

// Lazy load a component
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}`}
        language="typescript"
      />

      <h2 id="best-practices">Best Practices</h2>

      <ol>
        <li><strong>Keep components small:</strong> Each component should do one thing well</li>
        <li><strong>Use TypeScript:</strong> Define prop interfaces for better DX</li>
        <li><strong>Avoid prop drilling:</strong> Use context for deeply nested state</li>
        <li><strong>Memoize expensive computations:</strong> Use <code>createMemo</code></li>
        <li><strong>Clean up effects:</strong> Always use <code>onCleanup</code> for subscriptions</li>
        <li><strong>Use semantic HTML:</strong> Maintain accessibility</li>
      </ol>

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/core-concepts/effects"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Effects</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Learn about side effects and lifecycle
          </p>
        </Link>

        <Link
          href="/docs/core-concepts/stores"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Stores</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Manage complex nested state
          </p>
        </Link>
      </div>
    </div>
  );
}
