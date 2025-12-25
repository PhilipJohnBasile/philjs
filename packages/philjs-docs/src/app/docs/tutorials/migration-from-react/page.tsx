import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Migration from React',
  description: 'Step-by-step guide to migrating your React applications to PhilJS with comparison examples and migration strategies.',
};

export default function MigrationFromReactPage() {
  return (
    <div className="mdx-content">
      <h1>Migration from React</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        Step-by-step guide to migrating your React applications to PhilJS with comparison examples and migration strategies.
      </p>

      <h2 id="why-migrate">Why Migrate to PhilJS?</h2>

      <ul>
        <li><strong>Performance:</strong> Fine-grained reactivity means no virtual DOM diffing</li>
        <li><strong>Bundle Size:</strong> Smaller bundles without runtime overhead</li>
        <li><strong>Developer Experience:</strong> Simpler mental model, less boilerplate</li>
        <li><strong>Type Safety:</strong> Better TypeScript integration with signal types</li>
        <li><strong>Flexibility:</strong> Choose between CSR, SSR, or Islands architecture</li>
      </ul>

      <h2 id="comparison">Key Differences</h2>

      <h3>State Management</h3>

      <div className="grid md:grid-cols-2 gap-4 not-prose mb-6">
        <div>
          <p className="font-semibold mb-2">React</p>
          <CodeBlock
            code={`function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}`}
            language="typescript"
          />
        </div>
        <div>
          <p className="font-semibold mb-2">PhilJS</p>
          <CodeBlock
            code={`function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count()}
    </button>
  );
}`}
            language="typescript"
          />
        </div>
      </div>

      <h3>Effects</h3>

      <div className="grid md:grid-cols-2 gap-4 not-prose mb-6">
        <div>
          <p className="font-semibold mb-2">React</p>
          <CodeBlock
            code={`useEffect(() => {
  console.log('Count:', count);
}, [count]);

useEffect(() => {
  // Runs once on mount
  fetchData();
}, []);`}
            language="typescript"
          />
        </div>
        <div>
          <p className="font-semibold mb-2">PhilJS</p>
          <CodeBlock
            code={`createEffect(() => {
  console.log('Count:', count());
});

onMount(() => {
  // Runs once on mount
  fetchData();
});`}
            language="typescript"
          />
        </div>
      </div>

      <Callout type="info" title="Auto-tracking">
        PhilJS effects automatically track dependencies. No dependency array needed!
      </Callout>

      <h3>Computed Values</h3>

      <div className="grid md:grid-cols-2 gap-4 not-prose mb-6">
        <div>
          <p className="font-semibold mb-2">React</p>
          <CodeBlock
            code={`const doubled = useMemo(
  () => count * 2,
  [count]
);`}
            language="typescript"
          />
        </div>
        <div>
          <p className="font-semibold mb-2">PhilJS</p>
          <CodeBlock
            code={`const doubled = createMemo(
  () => count() * 2
);`}
            language="typescript"
          />
        </div>
      </div>

      <h3>Conditional Rendering</h3>

      <div className="grid md:grid-cols-2 gap-4 not-prose mb-6">
        <div>
          <p className="font-semibold mb-2">React</p>
          <CodeBlock
            code={`{isLoggedIn ? (
  <Dashboard />
) : (
  <LoginForm />
)}

{messages.length > 0 && (
  <MessageList messages={messages} />
)}`}
            language="typescript"
          />
        </div>
        <div>
          <p className="font-semibold mb-2">PhilJS</p>
          <CodeBlock
            code={`<Show
  when={isLoggedIn()}
  fallback={<LoginForm />}
>
  <Dashboard />
</Show>

<Show when={messages().length > 0}>
  <MessageList messages={messages()} />
</Show>`}
            language="typescript"
          />
        </div>
      </div>

      <h3>Lists</h3>

      <div className="grid md:grid-cols-2 gap-4 not-prose mb-6">
        <div>
          <p className="font-semibold mb-2">React</p>
          <CodeBlock
            code={`{items.map(item => (
  <Item
    key={item.id}
    item={item}
  />
))}`}
            language="typescript"
          />
        </div>
        <div>
          <p className="font-semibold mb-2">PhilJS</p>
          <CodeBlock
            code={`<For each={items()}>
  {(item) => (
    <Item item={item} />
  )}
</For>`}
            language="typescript"
          />
        </div>
      </div>

      <h2 id="migration-strategy">Migration Strategy</h2>

      <h3>1. Incremental Migration</h3>

      <p>
        You can gradually migrate your React app by running PhilJS alongside React:
      </p>

      <CodeBlock
        code={`// Install PhilJS
npm install philjs-core philjs-router

// In your existing React app
import { render } from 'philjs-core';
import { PhilJSComponent } from './PhilJSComponent';

function App() {
  return (
    <div>
      {/* Existing React code */}
      <ReactComponent />

      {/* New PhilJS component */}
      <div ref={el => {
        if (el) render(PhilJSComponent, el);
      }} />
    </div>
  );
}`}
        language="typescript"
      />

      <h3>2. Component-by-Component</h3>

      <p>
        Start with leaf components (no children) and work your way up:
      </p>

      <ol>
        <li>Identify components with no dependencies on React-specific features</li>
        <li>Convert simple presentational components first</li>
        <li>Move to components with state and effects</li>
        <li>Convert context providers and consumers</li>
        <li>Finally, convert routing and layout components</li>
      </ol>

      <h2 id="hooks-mapping">Hooks Migration Guide</h2>

      <table>
        <thead>
          <tr>
            <th>React Hook</th>
            <th>PhilJS Equivalent</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>useState</code></td>
            <td><code>createSignal</code></td>
            <td>Signals return getters/setters</td>
          </tr>
          <tr>
            <td><code>useEffect</code></td>
            <td><code>createEffect</code></td>
            <td>Auto-tracks dependencies</td>
          </tr>
          <tr>
            <td><code>useMemo</code></td>
            <td><code>createMemo</code></td>
            <td>Auto-tracks dependencies</td>
          </tr>
          <tr>
            <td><code>useCallback</code></td>
            <td>Not needed</td>
            <td>Functions are stable by default</td>
          </tr>
          <tr>
            <td><code>useRef</code></td>
            <td><code>let variable</code></td>
            <td>Regular variables work fine</td>
          </tr>
          <tr>
            <td><code>useContext</code></td>
            <td><code>useContext</code></td>
            <td>Similar API, use with <code>provide_context</code></td>
          </tr>
          <tr>
            <td><code>useReducer</code></td>
            <td><code>createStore</code></td>
            <td>More powerful with nested reactivity</td>
          </tr>
        </tbody>
      </table>

      <h2 id="patterns">Common Patterns</h2>

      <h3>Custom Hooks</h3>

      <div className="grid md:grid-cols-2 gap-4 not-prose mb-6">
        <div>
          <p className="font-semibold mb-2">React</p>
          <CodeBlock
            code={`function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);

  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return { count, increment };
}

// Usage
const { count, increment } = useCounter();`}
            language="typescript"
          />
        </div>
        <div>
          <p className="font-semibold mb-2">PhilJS</p>
          <CodeBlock
            code={`function createCounter(initial = 0) {
  const [count, setCount] = createSignal(initial);

  const increment = () => {
    setCount(c => c + 1);
  };

  return { count, increment };
}

// Usage
const { count, increment } = createCounter();`}
            language="typescript"
          />
        </div>
      </div>

      <h3>Context</h3>

      <div className="grid md:grid-cols-2 gap-4 not-prose mb-6">
        <div>
          <p className="font-semibold mb-2">React</p>
          <CodeBlock
            code={`const ThemeContext = createContext();

function App() {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const { theme } = useContext(ThemeContext);
  return <div>{theme}</div>;
}`}
            language="typescript"
          />
        </div>
        <div>
          <p className="font-semibold mb-2">PhilJS</p>
          <CodeBlock
            code={`const ThemeContext = createContext();

function App() {
  const [theme, setTheme] = createSignal('light');

  provide_context(ThemeContext, { theme, setTheme });

  return <Child />;
}

function Child() {
  const { theme } = useContext(ThemeContext);
  return <div>{theme()}</div>;
}`}
            language="typescript"
          />
        </div>
      </div>

      <h3>Data Fetching</h3>

      <div className="grid md:grid-cols-2 gap-4 not-prose mb-6">
        <div>
          <p className="font-semibold mb-2">React</p>
          <CodeBlock
            code={`function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Spinner />;
  if (error) return <Error error={error} />;
  return <div>{user.name}</div>;
}`}
            language="typescript"
          />
        </div>
        <div>
          <p className="font-semibold mb-2">PhilJS</p>
          <CodeBlock
            code={`function UserProfile(props) {
  const [user] = createResource(
    () => props.userId,
    (id) => fetch(\`/api/users/\${id}\`)
      .then(res => res.json())
  );

  return (
    <Show
      when={!user.loading}
      fallback={<Spinner />}
    >
      <Show
        when={!user.error}
        fallback={<Error error={user.error} />}
      >
        <div>{user()?.name}</div>
      </Show>
    </Show>
  );
}`}
            language="typescript"
          />
        </div>
      </div>

      <h2 id="tooling">Tooling Migration</h2>

      <h3>Package.json Updates</h3>

      <CodeBlock
        code={`{
  "dependencies": {
    // Remove React
    // "react": "^18.2.0",
    // "react-dom": "^18.2.0",

    // Add PhilJS
    "philjs-core": "^1.0.0",
    "philjs-router": "^1.0.0"
  },
  "devDependencies": {
    // Update JSX config
    "vite": "^5.0.0",
    "philjs-compiler": "^1.0.0"
  }
}`}
        language="json"
        filename="package.json"
      />

      <h3>Vite Configuration</h3>

      <CodeBlock
        code={`import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';

export default defineConfig({
  plugins: [philjs()],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'philjs-core',
  },
});`}
        language="typescript"
        filename="vite.config.ts"
      />

      <h3>TypeScript Configuration</h3>

      <CodeBlock
        code={`{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "philjs-core",
    // ... other options
  }
}`}
        language="json"
        filename="tsconfig.json"
      />

      <h2 id="common-issues">Common Migration Issues</h2>

      <h3>Issue: Reading Signal Values</h3>

      <Callout type="warning" title="Common Mistake">
        Remember to call signals as functions to read their values!
      </Callout>

      <CodeBlock
        code={`const [count, setCount] = createSignal(0);

// Wrong
console.log(count); // Logs the signal function

// Correct
console.log(count()); // Logs the value`}
        language="typescript"
      />

      <h3>Issue: Dependency Tracking</h3>

      <CodeBlock
        code={`const [count, setCount] = createSignal(0);

// Wrong - reads outside effect, won't track
const value = count();
createEffect(() => {
  console.log(value); // Won't re-run when count changes
});

// Correct - reads inside effect
createEffect(() => {
  console.log(count()); // Re-runs when count changes
});`}
        language="typescript"
      />

      <h3>Issue: Conditional Signal Reads</h3>

      <CodeBlock
        code={`// Avoid conditional signal reads in effects
createEffect(() => {
  if (someCondition) {
    console.log(count()); // May break reactivity
  }
});

// Better: Use Show or createMemo
createEffect(() => {
  const value = count(); // Always read signals
  if (someCondition) {
    console.log(value);
  }
});`}
        language="typescript"
      />

      <h2 id="example-migration">Complete Example: Todo App</h2>

      <p>Here's a complete before/after of a todo app migration:</p>

      <details>
        <summary className="cursor-pointer font-semibold text-primary-600 dark:text-primary-400 mb-4">
          Click to see full React version
        </summary>
        <CodeBlock
          code={`import { useState, useCallback } from 'react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter(t => !t.completed);
      case 'completed':
        return todos.filter(t => t.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const addTodo = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setTodos(prev => [...prev, {
      id: crypto.randomUUID(),
      text: input,
      completed: false,
    }]);
    setInput('');
  }, [input]);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed }
        : todo
    ));
  }, []);

  return (
    <div>
      <form onSubmit={addTodo}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <div>
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>

      <ul>
        {filteredTodos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}`}
          language="typescript"
        />
      </details>

      <details>
        <summary className="cursor-pointer font-semibold text-primary-600 dark:text-primary-400 mb-4 mt-4">
          Click to see PhilJS version
        </summary>
        <CodeBlock
          code={`import { createSignal, createMemo, For } from 'philjs-core';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

function TodoApp() {
  const [todos, setTodos] = createSignal<Todo[]>([]);
  const [input, setInput] = createSignal('');
  const [filter, setFilter] = createSignal<'all' | 'active' | 'completed'>('all');

  const filteredTodos = createMemo(() => {
    switch (filter()) {
      case 'active':
        return todos().filter(t => !t.completed);
      case 'completed':
        return todos().filter(t => t.completed);
      default:
        return todos();
    }
  });

  const addTodo = (e: Event) => {
    e.preventDefault();
    const text = input().trim();
    if (!text) return;

    setTodos(prev => [...prev, {
      id: crypto.randomUUID(),
      text,
      completed: false,
    }]);
    setInput('');
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed }
        : todo
    ));
  };

  return (
    <div>
      <form onSubmit={addTodo}>
        <input
          value={input()}
          onInput={e => setInput(e.currentTarget.value)}
        />
        <button type="submit">Add</button>
      </form>

      <div>
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>

      <ul>
        <For each={filteredTodos()}>
          {(todo) => (
            <li>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span>{todo.text}</span>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}`}
          language="typescript"
        />
      </details>

      <h2 id="resources">Additional Resources</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/core-concepts/signals"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Signals Deep Dive</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Understand PhilJS's reactivity system
          </p>
        </Link>

        <Link
          href="/docs/api/core"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">API Reference</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Complete API documentation
          </p>
        </Link>
      </div>
    </div>
  );
}
