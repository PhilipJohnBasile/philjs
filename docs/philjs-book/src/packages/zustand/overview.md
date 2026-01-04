# @philjs/zustand

The `@philjs/zustand` package provides Zustand-style state management backed by PhilJS signals for fine-grained reactivity.

## Installation

```bash
npm install @philjs/zustand
```

## Features

- **Familiar API** - Zustand-compatible store creation
- **Signal-Backed** - Fine-grained reactivity with PhilJS signals
- **Middleware** - Persist, devtools, and immer middleware
- **Selectors** - Optimized re-renders with selectors
- **Subscriptions** - External state listeners
- **Composable** - Combine stores and create slices

## Quick Start

```typescript
import { createStore } from '@philjs/zustand';

// Create a store
const useStore = createStore((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

// Use in components
function Counter() {
  const count = useStore(state => state.count);
  const increment = useStore(state => state.increment);
  const decrement = useStore(state => state.decrement);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={decrement}>-</button>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

---

## Creating Stores

### Basic Store

```typescript
import { createStore } from '@philjs/zustand';
import type { StateCreator, UseStore } from '@philjs/zustand';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  incrementBy: (amount: number) => void;
}

const useCounterStore = createStore<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  incrementBy: (amount) => set((state) => ({ count: state.count + amount })),
}));
```

### Using get() for Current State

```typescript
interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  getFilteredTodos: () => Todo[];
}

const useTodoStore = createStore<TodoState>((set, get) => ({
  todos: [],
  filter: 'all',

  addTodo: (text) => set((state) => ({
    todos: [...state.todos, {
      id: crypto.randomUUID(),
      text,
      completed: false,
    }],
  })),

  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ),
  })),

  // Use get() to access current state
  getFilteredTodos: () => {
    const { todos, filter } = get();
    switch (filter) {
      case 'active':
        return todos.filter((t) => !t.completed);
      case 'completed':
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  },
}));
```

### Accessing the API

```typescript
const useStore = createStore((set, get, api) => ({
  count: 0,

  // Access the full store API
  subscribeToChanges: () => {
    return api.subscribe((state, prevState) => {
      console.log('State changed:', prevState, '->', state);
    });
  },

  // Replace entire state
  reset: () => api.setState({ count: 0 }, true), // true = replace
}));
```

---

## Selectors

### Basic Selectors

```typescript
function Component() {
  // Select specific state - only re-renders when count changes
  const count = useStore((state) => state.count);

  // Select action - stable reference, never triggers re-render
  const increment = useStore((state) => state.increment);

  return <button onClick={increment}>{count}</button>;
}
```

### Derived State

```typescript
function TodoStats() {
  // Compute derived state
  const totalTodos = useTodoStore((state) => state.todos.length);
  const completedCount = useTodoStore((state) =>
    state.todos.filter((t) => t.completed).length
  );
  const activeCount = useTodoStore((state) =>
    state.todos.filter((t) => !t.completed).length
  );

  return (
    <div>
      <p>Total: {totalTodos}</p>
      <p>Active: {activeCount}</p>
      <p>Completed: {completedCount}</p>
    </div>
  );
}
```

### Shallow Equality

Use `shallow` for object/array selectors to prevent unnecessary re-renders:

```typescript
import { createStore, shallow } from '@philjs/zustand';

function TodoList() {
  // With shallow - only re-renders if array contents change
  const todos = useTodoStore(
    (state) => state.todos,
    shallow
  );

  // Without shallow - would re-render on every state update
  // const todos = useTodoStore((state) => state.todos);

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
```

### Multiple Values

```typescript
function UserProfile() {
  // Select multiple values with shallow comparison
  const { name, email, avatar } = useUserStore(
    (state) => ({
      name: state.name,
      email: state.email,
      avatar: state.avatar,
    }),
    shallow
  );

  return (
    <div>
      <img src={avatar} alt={name} />
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
}
```

---

## Store API

### External Access

```typescript
const useStore = createStore((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));

// Access store outside components
const count = useStore.getState().count;
useStore.setState({ count: 10 });

// Subscribe to changes
const unsubscribe = useStore.subscribe((state, prevState) => {
  console.log('Count changed:', prevState.count, '->', state.count);
});

// Cleanup
unsubscribe();
useStore.destroy();
```

### Replace vs Merge

```typescript
interface State {
  count: number;
  name: string;
}

const useStore = createStore<State>((set) => ({
  count: 0,
  name: 'Default',

  // Merge update (default)
  updateCount: () => set({ count: 1 }),
  // Result: { count: 1, name: 'Default' }

  // Replace entire state
  resetState: () => set({ count: 0, name: 'Default' }, true),
  // Result: { count: 0, name: 'Default' }
}));
```

---

## Middleware

### Persist Middleware

Save state to localStorage/sessionStorage:

```typescript
import { createStore, persist } from '@philjs/zustand';
import type { PersistOptions } from '@philjs/zustand';

interface SettingsState {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
}

const useSettingsStore = createStore(
  persist<SettingsState>(
    (set) => ({
      theme: 'light',
      language: 'en',
      notifications: true,
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'app-settings', // localStorage key
      storage: localStorage, // or sessionStorage
    }
  )
);
```

### Persist Options

```typescript
interface PersistOptions<T> {
  /** Storage key name */
  name: string;

  /** Storage engine (default: localStorage) */
  storage?: Storage;

  /** Custom serializer */
  serialize?: (state: T) => string;

  /** Custom deserializer */
  deserialize?: (str: string) => T;

  /** Partial state to persist */
  partialize?: (state: T) => Partial<T>;

  /** Callback when state is rehydrated */
  onRehydrateStorage?: (state: T) => void | ((state?: T, error?: Error) => void);

  /** State version for migrations */
  version?: number;

  /** Migration function */
  migrate?: (persistedState: any, version: number) => T;
}
```

### Selective Persistence

```typescript
const useAuthStore = createStore(
  persist<AuthState>(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      login: async (credentials) => { /* ... */ },
    }),
    {
      name: 'auth-storage',
      // Only persist user and token, not isLoading
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
```

### State Migrations

```typescript
const useStore = createStore(
  persist<State>(
    (set) => ({ /* ... */ }),
    {
      name: 'my-store',
      version: 2, // Current version
      migrate: (persisted, version) => {
        if (version === 0) {
          // Migrate from v0 to v1
          persisted.newField = 'default';
        }
        if (version === 1) {
          // Migrate from v1 to v2
          persisted.renamedField = persisted.oldField;
          delete persisted.oldField;
        }
        return persisted;
      },
    }
  )
);
```

---

### DevTools Middleware

Integrate with Redux DevTools Extension:

```typescript
import { createStore, devtools } from '@philjs/zustand';
import type { DevToolsOptions } from '@philjs/zustand';

const useStore = createStore(
  devtools<CounterState>(
    (set) => ({
      count: 0,
      // Named actions for better debugging
      increment: () => set(
        (s) => ({ count: s.count + 1 }),
        false, // don't replace
        'increment' // action name
      ),
      decrement: () => set(
        (s) => ({ count: s.count - 1 }),
        false,
        'decrement'
      ),
    }),
    {
      name: 'CounterStore', // DevTools instance name
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
```

### DevTools Options

```typescript
interface DevToolsOptions {
  /** Store name in DevTools */
  name?: string;

  /** Enable/disable DevTools */
  enabled?: boolean;

  /** Default action type name */
  anonymousActionType?: string;

  /** Store identifier for multiple stores */
  store?: string;
}
```

---

### Immer Middleware

Use mutable syntax for immutable updates:

```typescript
import { createStore, immer } from '@philjs/zustand';

interface NestedState {
  user: {
    profile: {
      name: string;
      settings: {
        theme: string;
        notifications: boolean;
      };
    };
  };
  updateTheme: (theme: string) => void;
}

const useStore = createStore(
  immer<NestedState>((set) => ({
    user: {
      profile: {
        name: 'John',
        settings: {
          theme: 'light',
          notifications: true,
        },
      },
    },
    // Mutable syntax - looks like mutation but creates new state
    updateTheme: (theme) => set((state) => {
      state.user.profile.settings.theme = theme;
    }),
  }))
);
```

### Combining Middleware

```typescript
const useStore = createStore(
  devtools(
    persist(
      immer<State>((set) => ({
        // ... state and actions
      })),
      { name: 'my-store' }
    ),
    { name: 'MyStore' }
  )
);
```

---

## Store Composition

### Combining Stores

```typescript
import { createStore, combine } from '@philjs/zustand';

// Individual stores
const useUserStore = createStore<UserState>((set) => ({
  name: '',
  email: '',
  setUser: (user) => set(user),
}));

const useCartStore = createStore<CartState>((set) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
}));

// Combined store
const useCombinedStore = combine({
  user: useUserStore,
  cart: useCartStore,
});

// Usage
function App() {
  const { user, cart } = useCombinedStore();

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Cart items: {cart.items.length}</p>
    </div>
  );
}
```

### Store Slices

Organize large stores with slices:

```typescript
import { createStore, createSlice } from '@philjs/zustand';
import type { StateCreator } from '@philjs/zustand';

// User slice
interface UserSlice {
  name: string;
  email: string;
  setName: (name: string) => void;
}

const createUserSlice: StateCreator<UserSlice & CartSlice, [], [], UserSlice> = (set) => ({
  name: '',
  email: '',
  setName: (name) => set({ name }),
});

// Cart slice
interface CartSlice {
  items: Item[];
  addItem: (item: Item) => void;
  clearCart: () => void;
}

const createCartSlice: StateCreator<UserSlice & CartSlice, [], [], CartSlice> = (set) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  clearCart: () => set({ items: [] }),
});

// Combined store
const useStore = createStore<UserSlice & CartSlice>((set, get, api) => ({
  ...createUserSlice(set, get, api),
  ...createCartSlice(set, get, api),
}));
```

---

## Types Reference

```typescript
// State creator function
type StateCreator<T> = (
  set: SetState<T>,
  get: GetState<T>,
  api: StoreApi<T>
) => T;

// Set state function
type SetState<T> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean
) => void;

// Get state function
type GetState<T> = () => T;

// Subscribe function
type Subscribe<T> = (
  listener: (state: T, prevState: T) => void
) => () => void;

// Store API
interface StoreApi<T> {
  setState: SetState<T>;
  getState: GetState<T>;
  subscribe: Subscribe<T>;
  destroy: Destroy;
}

// UseStore hook type
type UseStore<T> = {
  (): T;
  <U>(selector: (state: T) => U, equals?: (a: U, b: U) => boolean): U;
  setState: SetState<T>;
  getState: GetState<T>;
  subscribe: Subscribe<T>;
  destroy: Destroy;
};

// Middleware type
type Middleware<T> = (
  config: StateCreator<T>
) => StateCreator<T>;

// Persist options
interface PersistOptions<T> {
  name: string;
  storage?: Storage;
  serialize?: (state: T) => string;
  deserialize?: (str: string) => T;
  partialize?: (state: T) => Partial<T>;
  onRehydrateStorage?: (state: T) => void | ((state?: T, error?: Error) => void);
  version?: number;
  migrate?: (persistedState: any, version: number) => T;
}

// DevTools options
interface DevToolsOptions {
  name?: string;
  enabled?: boolean;
  anonymousActionType?: string;
  store?: string;
}
```

---

## Best Practices

### 1. Keep Stores Focused

```typescript
// Good - focused stores
const useUserStore = createStore<UserState>(/* ... */);
const useCartStore = createStore<CartState>(/* ... */);
const useUIStore = createStore<UIState>(/* ... */);

// Avoid - monolithic stores
// const useAppStore = createStore<Everything>(/* ... */);
```

### 2. Use Selectors

```typescript
// Good - granular selections
const name = useUserStore((s) => s.name);
const email = useUserStore((s) => s.email);

// Avoid - selecting entire state
// const state = useUserStore();
```

### 3. Colocate Actions with State

```typescript
// Good - actions defined in store
const useStore = createStore((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));

// Avoid - actions outside store
// const increment = () => useStore.setState((s) => ({ count: s.count + 1 }));
```

### 4. Use Shallow for Object Selectors

```typescript
// Good - prevents unnecessary re-renders
const { x, y } = useStore((s) => ({ x: s.x, y: s.y }), shallow);

// Be careful - re-renders on every change
// const { x, y } = useStore((s) => ({ x: s.x, y: s.y }));
```

---

## API Reference

| Export | Description |
|--------|-------------|
| `createStore` | Create a Zustand-style store |
| `persist` | Middleware for state persistence |
| `devtools` | Middleware for Redux DevTools |
| `immer` | Middleware for Immer-style updates |
| `shallow` | Shallow equality comparison |
| `combine` | Combine multiple stores |
| `createSlice` | Create a store slice |

---

## Next Steps

- [@philjs/atoms for Atomic State](../atoms/overview.md)
- [@philjs/xstate for State Machines](../xstate/overview.md)
- [@philjs/devtools for Debugging](../devtools/overview.md)
