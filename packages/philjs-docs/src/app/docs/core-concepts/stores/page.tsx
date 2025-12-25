import { Metadata } from 'next';
import { CodeBlock } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Stores - Core Concepts',
  description: 'Learn how to manage complex nested state with PhilJS stores and fine-grained reactivity.',
};

export default function StoresPage() {
  return (
    <div className="mdx-content">
      <h1>Stores</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        Stores provide fine-grained reactive state management for complex nested data structures.
      </p>

      <h2 id="why-stores">Why Use Stores?</h2>

      <p>
        While signals work great for primitive values, stores excel at managing complex objects
        with nested reactivity:
      </p>

      <ul>
        <li>Fine-grained updates to nested properties</li>
        <li>Immutable update patterns</li>
        <li>Path-based access and updates</li>
        <li>Array and object manipulation helpers</li>
      </ul>

      <h2 id="create-store">createStore</h2>

      <CodeBlock
        code={`import { createStore } from 'philjs-core';

const [state, setState] = createStore({
  user: {
    name: 'Alice',
    age: 30,
    preferences: {
      theme: 'dark',
      notifications: true,
    },
  },
  todos: [
    { id: 1, text: 'Learn PhilJS', completed: false },
    { id: 2, text: 'Build app', completed: false },
  ],
});

// Read values
console.log(state.user.name); // 'Alice'
console.log(state.todos[0].text); // 'Learn PhilJS'`}
        language="typescript"
      />

      <Callout type="info" title="Proxies">
        Stores use JavaScript Proxies to track property access and enable fine-grained reactivity.
      </Callout>

      <h2 id="updating-stores">Updating Stores</h2>

      <h3>Simple Updates</h3>

      <CodeBlock
        code={`// Update top-level property
setState('user', { name: 'Bob', age: 25, preferences: {...} });

// Update nested property
setState('user', 'name', 'Bob');
setState('user', 'age', 31);

// Update deeply nested
setState('user', 'preferences', 'theme', 'light');`}
        language="typescript"
      />

      <h3>Function Updates</h3>

      <CodeBlock
        code={`// Update based on previous value
setState('user', 'age', age => age + 1);

// Update with path
setState('user', 'preferences', prefs => ({
  ...prefs,
  notifications: false,
}));`}
        language="typescript"
      />

      <h3>Multiple Updates</h3>

      <CodeBlock
        code={`// Update multiple properties at once
setState({
  user: {
    ...state.user,
    name: 'Charlie',
    age: 35,
  },
});

// Or using the produce pattern
import { produce } from 'philjs-core';

setState(produce(draft => {
  draft.user.name = 'Charlie';
  draft.user.age = 35;
  draft.todos.push({ id: 3, text: 'New todo', completed: false });
}));`}
        language="typescript"
      />

      <h2 id="array-updates">Array Updates</h2>

      <CodeBlock
        code={`const [state, setState] = createStore({
  todos: [
    { id: 1, text: 'First', completed: false },
    { id: 2, text: 'Second', completed: true },
  ],
});

// Add item
setState('todos', todos => [...todos, newTodo]);

// Remove item
setState('todos', todos => todos.filter(t => t.id !== 1));

// Update specific item
setState('todos', 0, 'completed', true);

// Update item by condition
setState(
  'todos',
  todo => todo.id === 2,
  'text',
  'Updated text'
);

// Batch array operations
setState('todos', produce(todos => {
  todos.push(newTodo);
  todos[0].completed = true;
  todos.sort((a, b) => a.id - b.id);
}));`}
        language="typescript"
      />

      <h2 id="reconcile">Reconcile for Immutable Updates</h2>

      <CodeBlock
        code={`import { reconcile } from 'philjs-core';

// Replace entire state while maintaining reactivity
const newData = await fetchData();
setState(reconcile(newData));

// Reconcile nested object
setState('user', reconcile({
  name: 'New Name',
  age: 40,
  preferences: { theme: 'dark', notifications: true },
}));`}
        language="typescript"
      />

      <Callout type="info" title="Reconcile vs Replace">
        <code>reconcile</code> intelligently merges new data, only updating changed values.
        This preserves references and minimizes reactive updates.
      </Callout>

      <h2 id="store-patterns">Common Patterns</h2>

      <h3>Global Store</h3>

      <CodeBlock
        code={`// store.ts
import { createStore } from 'philjs-core';

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

export const [appState, setAppState] = createStore<AppState>({
  user: null,
  theme: 'light',
  notifications: [],
});

// Actions
export const actions = {
  setUser(user: User | null) {
    setAppState('user', user);
  },

  toggleTheme() {
    setAppState('theme', theme =>
      theme === 'light' ? 'dark' : 'light'
    );
  },

  addNotification(notification: Notification) {
    setAppState('notifications', notifications => [
      ...notifications,
      notification,
    ]);
  },

  clearNotifications() {
    setAppState('notifications', []);
  },
};

// Usage
import { appState, actions } from './store';

function App() {
  return (
    <div className={appState.theme}>
      <Show when={appState.user}>
        {user => <div>Welcome, {user.name}!</div>}
      </Show>
    </div>
  );
}`}
        language="typescript"
      />

      <h3>Store Context</h3>

      <CodeBlock
        code={`import { createContext, useContext } from 'philjs-core';

interface TodoStore {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  removeTodo: (id: number) => void;
}

const TodoContext = createContext<TodoStore>();

export function TodoProvider(props: { children: JSX.Element }) {
  const [state, setState] = createStore({
    todos: [] as Todo[],
  });

  const store: TodoStore = {
    get todos() {
      return state.todos;
    },

    addTodo(text: string) {
      const newTodo = {
        id: Date.now(),
        text,
        completed: false,
      };
      setState('todos', todos => [...todos, newTodo]);
    },

    toggleTodo(id: number) {
      setState(
        'todos',
        todo => todo.id === id,
        'completed',
        completed => !completed
      );
    },

    removeTodo(id: number) {
      setState('todos', todos => todos.filter(t => t.id !== id));
    },
  };

  return (
    <TodoContext.Provider value={store}>
      {props.children}
    </TodoContext.Provider>
  );
}

export function useTodos() {
  const context = useContext(TodoContext);
  if (!context) throw new Error('TodoContext not found');
  return context;
}

// Usage
function TodoList() {
  const todos = useTodos();

  return (
    <For each={todos.todos}>
      {todo => (
        <TodoItem
          todo={todo}
          onToggle={() => todos.toggleTodo(todo.id)}
          onRemove={() => todos.removeTodo(todo.id)}
        />
      )}
    </For>
  );
}`}
        language="typescript"
      />

      <h3>Form State</h3>

      <CodeBlock
        code={`function RegistrationForm() {
  const [form, setForm] = createStore({
    values: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    errors: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    touched: {
      name: false,
      email: false,
      password: false,
      confirmPassword: false,
    },
  });

  const handleChange = (field: string, value: string) => {
    setForm('values', field, value);
    setForm('touched', field, true);
    validate(field, value);
  };

  const validate = (field: string, value: string) => {
    let error = '';

    switch (field) {
      case 'name':
        error = value.length < 2 ? 'Name too short' : '';
        break;
      case 'email':
        error = !value.includes('@') ? 'Invalid email' : '';
        break;
      case 'password':
        error = value.length < 8 ? 'Password too short' : '';
        break;
      case 'confirmPassword':
        error = value !== form.values.password ? 'Passwords must match' : '';
        break;
    }

    setForm('errors', field, error);
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (Object.values(form.errors).some(err => err)) {
      return;
    }
    submitForm(form.values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={form.values.name}
        onInput={e => handleChange('name', e.currentTarget.value)}
      />
      <Show when={form.touched.name && form.errors.name}>
        <span className="error">{form.errors.name}</span>
      </Show>
      {/* Other fields... */}
    </form>
  );
}`}
        language="typescript"
      />

      <h2 id="selectors">Memoized Selectors</h2>

      <CodeBlock
        code={`const [state, setState] = createStore({
  todos: [] as Todo[],
  filter: 'all' as 'all' | 'active' | 'completed',
});

// Create memoized selectors
const filteredTodos = createMemo(() => {
  const todos = state.todos;
  const filter = state.filter;

  switch (filter) {
    case 'active':
      return todos.filter(t => !t.completed);
    case 'completed':
      return todos.filter(t => t.completed);
    default:
      return todos;
  }
});

const activeTodoCount = createMemo(() =>
  state.todos.filter(t => !t.completed).length
);

const completedTodoCount = createMemo(() =>
  state.todos.filter(t => t.completed).length
);`}
        language="typescript"
      />

      <h2 id="performance">Performance Tips</h2>

      <ul>
        <li><strong>Use specific paths:</strong> Update only what changed</li>
        <li><strong>Batch updates:</strong> Use <code>produce</code> for multiple changes</li>
        <li><strong>Memoize selectors:</strong> Don't recompute derived state unnecessarily</li>
        <li><strong>Use reconcile for API data:</strong> Efficient immutable updates</li>
      </ul>

      <CodeBlock
        code={`// Bad: Triggers multiple updates
setState('user', 'name', 'Alice');
setState('user', 'age', 30);
setState('user', 'email', 'alice@example.com');

// Good: Single update
setState(produce(draft => {
  draft.user.name = 'Alice';
  draft.user.age = 30;
  draft.user.email = 'alice@example.com';
}));`}
        language="typescript"
      />

      <h2 id="typescript">TypeScript Support</h2>

      <CodeBlock
        code={`interface User {
  id: number;
  name: string;
  profile: {
    bio: string;
    avatar: string;
  };
}

interface AppState {
  users: User[];
  currentUserId: number | null;
}

const [state, setState] = createStore<AppState>({
  users: [],
  currentUserId: null,
});

// Fully typed updates
setState('users', 0, 'profile', 'bio', 'New bio');

// TypeScript catches errors
setState('users', 0, 'invalid', 'value'); // Error!`}
        language="typescript"
      />

      <h2 id="best-practices">Best Practices</h2>

      <ol>
        <li><strong>Use stores for complex state:</strong> Simple values work fine with signals</li>
        <li><strong>Keep stores normalized:</strong> Avoid deep nesting when possible</li>
        <li><strong>Create action creators:</strong> Encapsulate update logic</li>
        <li><strong>Use context for component stores:</strong> Avoid global state when not needed</li>
        <li><strong>Memoize expensive selectors:</strong> Cache computed values</li>
      </ol>

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/core-concepts/ssr"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Server-Side Rendering</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Learn about SSR and hydration
          </p>
        </Link>

        <Link
          href="/docs/guides/state"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">State Management Guide</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Advanced state management patterns
          </p>
        </Link>
      </div>
    </div>
  );
}
