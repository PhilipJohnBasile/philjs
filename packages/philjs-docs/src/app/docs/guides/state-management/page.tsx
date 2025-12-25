import { Metadata } from 'next';
import { CodeBlock } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'State Management Guide',
  description: 'Advanced state management patterns in PhilJS with signals, stores, and context.',
};

export default function StateManagementGuidePage() {
  return (
    <div className="mdx-content">
      <h1>State Management</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        PhilJS provides fine-grained reactivity with signals, stores, and context for managing
        state at every level of your application.
      </p>

      <h2 id="signals">Signals: The Foundation</h2>

      <p>
        Signals are reactive primitives that hold a value and notify subscribers when it changes.
        They're the building blocks of all state in PhilJS:
      </p>

      <CodeBlock
        code={`import { createSignal, createEffect } from 'philjs-core';

// Create a signal with initial value
const [count, setCount] = createSignal(0);

// Read the current value
console.log(count()); // 0

// Update the value
setCount(1);
setCount(prev => prev + 1);

// Effects automatically track and re-run when dependencies change
createEffect(() => {
  console.log('Count is now:', count());
});`}
        language="typescript"
        filename="signals-basics.ts"
      />

      <h3 id="derived-state">Derived State with Memos</h3>

      <p>
        Use <code>createMemo</code> for derived values that cache their result:
      </p>

      <CodeBlock
        code={`import { createSignal, createMemo } from 'philjs-core';

const [items, setItems] = createSignal<Item[]>([]);
const [filter, setFilter] = createSignal<'all' | 'active' | 'completed'>('all');

// Computed value - only recalculates when items or filter changes
const filteredItems = createMemo(() => {
  const f = filter();
  return items().filter(item => {
    if (f === 'active') return !item.completed;
    if (f === 'completed') return item.completed;
    return true;
  });
});

// Statistics derived from items
const stats = createMemo(() => ({
  total: items().length,
  active: items().filter(i => !i.completed).length,
  completed: items().filter(i => i.completed).length,
}));`}
        language="typescript"
        filename="derived-state.ts"
      />

      <h2 id="stores">Stores: Nested Reactive State</h2>

      <p>
        For complex nested state, use <code>createStore</code> which provides fine-grained
        reactivity at any depth:
      </p>

      <CodeBlock
        code={`import { createStore } from 'philjs-core';

interface AppState {
  user: {
    name: string;
    preferences: {
      theme: 'light' | 'dark';
      notifications: boolean;
    };
  };
  todos: Array<{
    id: number;
    text: string;
    completed: boolean;
  }>;
}

const [state, setState] = createStore<AppState>({
  user: {
    name: 'John',
    preferences: {
      theme: 'light',
      notifications: true,
    },
  },
  todos: [],
});

// Read nested values
console.log(state.user.preferences.theme);

// Update nested values - only components using this path re-render
setState('user', 'preferences', 'theme', 'dark');

// Update array items
setState('todos', todo => todo.id === 1, 'completed', true);

// Add to arrays
setState('todos', todos => [...todos, { id: 2, text: 'New', completed: false }]);

// Batch multiple updates
setState(state => ({
  ...state,
  user: {
    ...state.user,
    name: 'Jane',
  },
}));`}
        language="typescript"
        filename="stores.ts"
      />

      <h3 id="store-utilities">Store Utilities</h3>

      <CodeBlock
        code={`import { createStore, produce, reconcile } from 'philjs-core';

const [state, setState] = createStore({ items: [] });

// Use produce for immutable updates with mutable syntax
setState(produce(draft => {
  draft.items.push({ id: 1, name: 'New Item' });
  draft.items[0].name = 'Updated';
}));

// Use reconcile to diff and update efficiently
const newData = await fetchItems();
setState('items', reconcile(newData));`}
        language="typescript"
        filename="store-utilities.ts"
      />

      <h2 id="context">Context: Dependency Injection</h2>

      <p>
        Use context to pass state down the component tree without prop drilling:
      </p>

      <CodeBlock
        code={`import { createContext, useContext, createSignal } from 'philjs-core';

// Define context type
interface AuthContext {
  user: () => User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

// Create context with optional default
const AuthContext = createContext<AuthContext>();

// Provider component
function AuthProvider(props: { children: any }) {
  const [user, setUser] = createSignal<User | null>(null);

  const login = async (credentials: Credentials) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const userData = await res.json();
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const isAuthenticated = () => user() !== null;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {props.children}
    </AuthContext.Provider>
  );
}

// Consumer hook
function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Usage in components
function UserProfile() {
  const { user, logout } = useAuth();

  return (
    <Show when={user()}>
      {(u) => (
        <div>
          <span>Welcome, {u.name}</span>
          <button onClick={logout}>Logout</button>
        </div>
      )}
    </Show>
  );
}`}
        language="tsx"
        filename="AuthContext.tsx"
      />

      <h2 id="global-state">Global State Patterns</h2>

      <h3 id="singleton-store">Singleton Store</h3>

      <p>
        For truly global state, create a singleton store outside components:
      </p>

      <CodeBlock
        code={`// stores/appStore.ts
import { createStore, createRoot } from 'philjs-core';

interface AppStore {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
}

// Create store in a reactive root so it persists
const { state, actions } = createRoot(() => {
  const [state, setState] = createStore<AppStore>({
    theme: 'light',
    sidebarOpen: true,
    notifications: [],
  });

  const actions = {
    toggleTheme: () => {
      setState('theme', t => t === 'light' ? 'dark' : 'light');
    },
    toggleSidebar: () => {
      setState('sidebarOpen', open => !open);
    },
    addNotification: (notification: Notification) => {
      setState('notifications', n => [...n, notification]);
    },
    dismissNotification: (id: string) => {
      setState('notifications', n => n.filter(x => x.id !== id));
    },
  };

  return { state, actions };
});

export { state as appState, actions as appActions };

// Usage in any component
import { appState, appActions } from './stores/appStore';

function Sidebar() {
  return (
    <aside class={appState.sidebarOpen ? 'open' : 'closed'}>
      {/* ... */}
    </aside>
  );
}

function ThemeToggle() {
  return (
    <button onClick={appActions.toggleTheme}>
      {appState.theme === 'light' ? 'Dark' : 'Light'} Mode
    </button>
  );
}`}
        language="typescript"
        filename="appStore.ts"
      />

      <h3 id="entity-store">Entity Store Pattern</h3>

      <CodeBlock
        code={`// stores/entityStore.ts
import { createStore } from 'philjs-core';

interface Entity {
  id: string;
  [key: string]: any;
}

function createEntityStore<T extends Entity>() {
  const [store, setStore] = createStore<{
    byId: Record<string, T>;
    ids: string[];
    loading: boolean;
    error: string | null;
  }>({
    byId: {},
    ids: [],
    loading: false,
    error: null,
  });

  return {
    // Selectors
    getById: (id: string) => store.byId[id],
    getAll: () => store.ids.map(id => store.byId[id]),
    isLoading: () => store.loading,
    getError: () => store.error,

    // Actions
    setMany: (entities: T[]) => {
      const byId: Record<string, T> = {};
      const ids: string[] = [];
      entities.forEach(e => {
        byId[e.id] = e;
        ids.push(e.id);
      });
      setStore({ byId, ids, loading: false, error: null });
    },

    upsert: (entity: T) => {
      setStore('byId', entity.id, entity);
      if (!store.ids.includes(entity.id)) {
        setStore('ids', ids => [...ids, entity.id]);
      }
    },

    remove: (id: string) => {
      setStore('ids', ids => ids.filter(i => i !== id));
      setStore('byId', id, undefined as any);
    },

    setLoading: (loading: boolean) => setStore('loading', loading),
    setError: (error: string | null) => setStore('error', error),
  };
}

// Usage
const usersStore = createEntityStore<User>();

// Fetch and populate
async function fetchUsers() {
  usersStore.setLoading(true);
  try {
    const users = await api.getUsers();
    usersStore.setMany(users);
  } catch (e) {
    usersStore.setError(e.message);
  }
}`}
        language="typescript"
        filename="entityStore.ts"
      />

      <h2 id="async-state">Async State with Resources</h2>

      <p>
        Use <code>createResource</code> for async data fetching with built-in loading
        and error states:
      </p>

      <CodeBlock
        code={`import { createResource, createSignal, Suspense, ErrorBoundary } from 'philjs-core';

// Fetch function
const fetchUser = async (id: string): Promise<User> => {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
};

function UserProfile() {
  const [userId, setUserId] = createSignal('1');

  // Resource automatically refetches when userId changes
  const [user, { refetch, mutate }] = createResource(userId, fetchUser);

  return (
    <div>
      <select onChange={(e) => setUserId(e.target.value)}>
        <option value="1">User 1</option>
        <option value="2">User 2</option>
      </select>

      <Suspense fallback={<div>Loading...</div>}>
        <ErrorBoundary fallback={(err) => <div>Error: {err.message}</div>}>
          <Show when={user()}>
            {(u) => (
              <div>
                <h2>{u.name}</h2>
                <p>{u.email}</p>
                <button onClick={refetch}>Refresh</button>
              </div>
            )}
          </Show>
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}`}
        language="tsx"
        filename="UserProfile.tsx"
      />

      <h3 id="optimistic-updates">Optimistic Updates</h3>

      <CodeBlock
        code={`import { createResource } from 'philjs-core';

function TodoItem({ todo }: { todo: Todo }) {
  const [, { mutate }] = createResource(() => todo);

  const toggleComplete = async () => {
    // Optimistically update the UI
    const previous = todo;
    mutate({ ...todo, completed: !todo.completed });

    try {
      await api.updateTodo(todo.id, { completed: !todo.completed });
    } catch (e) {
      // Rollback on error
      mutate(previous);
      toast.error('Failed to update todo');
    }
  };

  return (
    <label>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={toggleComplete}
      />
      {todo.text}
    </label>
  );
}`}
        language="tsx"
        filename="OptimisticUpdate.tsx"
      />

      <h2 id="state-machines">State Machines</h2>

      <p>
        For complex UI logic, use state machines to make state transitions explicit:
      </p>

      <CodeBlock
        code={`import { createSignal, createMemo } from 'philjs-core';

type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function createFetchMachine<T>(fetcher: () => Promise<T>) {
  const [state, setState] = createSignal<FetchState<T>>({ status: 'idle' });

  const execute = async () => {
    setState({ status: 'loading' });
    try {
      const data = await fetcher();
      setState({ status: 'success', data });
    } catch (error) {
      setState({ status: 'error', error: error as Error });
    }
  };

  const reset = () => setState({ status: 'idle' });

  // Derived states
  const isIdle = createMemo(() => state().status === 'idle');
  const isLoading = createMemo(() => state().status === 'loading');
  const isSuccess = createMemo(() => state().status === 'success');
  const isError = createMemo(() => state().status === 'error');
  const data = createMemo(() =>
    state().status === 'success' ? state().data : undefined
  );
  const error = createMemo(() =>
    state().status === 'error' ? state().error : undefined
  );

  return {
    state,
    execute,
    reset,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    data,
    error,
  };
}

// Usage
function DataComponent() {
  const machine = createFetchMachine(() => fetch('/api/data').then(r => r.json()));

  return (
    <div>
      <Switch>
        <Match when={machine.isIdle()}>
          <button onClick={machine.execute}>Load Data</button>
        </Match>
        <Match when={machine.isLoading()}>
          <Spinner />
        </Match>
        <Match when={machine.isError()}>
          <div>
            Error: {machine.error()?.message}
            <button onClick={machine.execute}>Retry</button>
          </div>
        </Match>
        <Match when={machine.isSuccess()}>
          <DataDisplay data={machine.data()} />
        </Match>
      </Switch>
    </div>
  );
}`}
        language="tsx"
        filename="StateMachine.tsx"
      />

      <Callout type="info" title="Best Practices">
        <ul className="list-disc list-inside space-y-1">
          <li>Keep signals as the source of truth, derive everything else</li>
          <li>Use stores for complex nested state</li>
          <li>Use context for dependency injection, not global state</li>
          <li>Prefer composition over complex single stores</li>
          <li>Consider state machines for complex UI flows</li>
        </ul>
      </Callout>

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/core-concepts/signals"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Signals Deep Dive</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Detailed documentation on the signals API
          </p>
        </Link>

        <Link
          href="/docs/core-concepts/stores"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Stores Deep Dive</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Advanced patterns with nested reactive stores
          </p>
        </Link>
      </div>
    </div>
  );
}
