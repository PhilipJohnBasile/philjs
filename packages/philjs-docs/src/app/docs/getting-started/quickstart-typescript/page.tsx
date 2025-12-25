import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Quick Start (TypeScript)',
  description: 'Build your first PhilJS application with TypeScript. Learn signals, components, and reactivity.',
};

export default function QuickStartTypescriptPage() {
  return (
    <div className="mdx-content">
      <h1>Quick Start (TypeScript)</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        Build your first PhilJS application in under 5 minutes. We'll create a simple counter app to learn the fundamentals.
      </p>

      <h2 id="create-project">Create a New Project</h2>

      <Terminal commands={[
        'npm create philjs@latest my-counter-app',
        'cd my-counter-app',
        'npm install',
        'npm run dev',
      ]} />

      <p>
        Open <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer">http://localhost:5173</a> in your browser to see your app running.
      </p>

      <h2 id="project-structure">Understanding the Project</h2>

      <p>Your new project has this structure:</p>

      <CodeBlock
        code={`my-counter-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/
│   │   └── Counter.tsx     # Example component
│   └── main.tsx            # Entry point
├── public/
├── package.json
├── tsconfig.json
└── vite.config.ts`}
        language="plaintext"
        showLineNumbers={false}
      />

      <h2 id="first-signal">Your First Signal</h2>

      <p>
        Signals are the foundation of PhilJS reactivity. Let's create a simple counter:
      </p>

      <CodeBlock
        code={`import { signal } from 'philjs-core';

function Counter() {
  // Create a reactive signal with initial value 0
  const count = signal(0);

  return (
    <div className="counter">
      <h1>Count: {count}</h1>
      <button onClick={() => count.set(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}`}
        language="typescript"
        filename="src/components/Counter.tsx"
      />

      <Callout type="info" title="How Signals Work">
        When you read <code>count</code> in JSX, PhilJS automatically tracks it as a dependency.
        When <code>count.set()</code> is called, only the parts of the UI that depend on it will update.
      </Callout>

      <h2 id="computed-values">Computed Values with Memos</h2>

      <p>
        Use <code>memo</code> to create derived values that automatically update:
      </p>

      <CodeBlock
        code={`import { signal, memo } from 'philjs-core';

function Counter() {
  const count = signal(0);

  // Computed value - automatically updates when count changes
  const doubled = memo(() => count() * 2);
  const isEven = memo(() => count() % 2 === 0);

  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <p>Is Even: {isEven() ? 'Yes' : 'No'}</p>
      <button onClick={() => count.set(c => c + 1)}>+1</button>
    </div>
  );
}`}
        language="typescript"
        filename="src/components/Counter.tsx"
      />

      <h2 id="effects">Side Effects</h2>

      <p>
        Use <code>effect</code> to run code when signals change:
      </p>

      <CodeBlock
        code={`import { signal, effect } from 'philjs-core';

function Counter() {
  const count = signal(0);

  // Run when count changes
  effect(() => {
    console.log('Count changed to:', count());

    // Optional cleanup function
    return () => console.log('Cleaning up...');
  });

  // Save to localStorage whenever count changes
  effect(() => {
    localStorage.setItem('count', String(count()));
  });

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => count.set(c => c + 1)}>+1</button>
    </div>
  );
}`}
        language="typescript"
        filename="src/components/Counter.tsx"
      />

      <h2 id="todo-list">Building a Todo List</h2>

      <p>
        Let's build something more complete - a todo list with add, toggle, and delete:
      </p>

      <CodeBlock
        code={`import { signal, memo } from 'philjs-core';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

function TodoList() {
  const todos = signal<Todo[]>([]);
  const newTodo = signal('');

  const remaining = memo(() =>
    todos().filter(t => !t.done).length
  );

  const addTodo = () => {
    const text = newTodo().trim();
    if (text) {
      todos.set(t => [...t, {
        id: Date.now(),
        text,
        done: false,
      }]);
      newTodo.set('');
    }
  };

  const toggleTodo = (id: number) => {
    todos.set(t => t.map(todo =>
      todo.id === id
        ? { ...todo, done: !todo.done }
        : todo
    ));
  };

  const deleteTodo = (id: number) => {
    todos.set(t => t.filter(todo => todo.id !== id));
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Todo List</h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTodo()}
          onInput={(e) => newTodo.set(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          placeholder="What needs to be done?"
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={addTodo}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {todos().map(todo => (
          <li
            key={todo.id}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded"
          >
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span
              className={todo.done ? 'line-through text-gray-400' : ''}
            >
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-gray-500">
        {remaining()} items remaining
      </p>
    </div>
  );
}`}
        language="typescript"
        filename="src/components/TodoList.tsx"
      />

      <h2 id="async-data">Async Data with Resources</h2>

      <p>
        Use <code>resource</code> to fetch and manage async data:
      </p>

      <CodeBlock
        code={`import { signal, resource } from 'philjs-core';

interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile() {
  const userId = signal(1);

  const user = resource<User>(async () => {
    const res = await fetch(
      \`https://api.example.com/users/\${userId()}\`
    );
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

  return (
    <div>
      <select
        value={userId()}
        onChange={(e) => {
          userId.set(Number(e.target.value));
          user.refresh();
        }}
      >
        <option value={1}>User 1</option>
        <option value={2}>User 2</option>
        <option value={3}>User 3</option>
      </select>

      {user.loading() ? (
        <p>Loading...</p>
      ) : user.error() ? (
        <p className="text-red-500">
          Error: {user.error()?.message}
        </p>
      ) : (
        <div>
          <h2>{user().name}</h2>
          <p>{user().email}</p>
        </div>
      )}
    </div>
  );
}`}
        language="typescript"
        filename="src/components/UserProfile.tsx"
      />

      <h2 id="next-steps">Next Steps</h2>

      <p>
        Now that you understand the basics, explore these topics:
      </p>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/core-concepts/signals"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Signals Deep Dive</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Learn advanced signal patterns and best practices
          </p>
        </Link>

        <Link
          href="/docs/guides/routing"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Routing</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Set up file-based routing for your app
          </p>
        </Link>

        <Link
          href="/docs/core-concepts/components"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Components</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Build reusable, composable UI components
          </p>
        </Link>

        <Link
          href="/docs/guides/ssr"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Server-Side Rendering</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Render your app on the server for better performance
          </p>
        </Link>
      </div>
    </div>
  );
}
