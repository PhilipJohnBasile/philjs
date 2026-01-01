# philjs-zustand

Zustand-style state management for PhilJS with fine-grained reactive signals.

## Features

- Minimal, unopinionated API
- Signal-based reactivity for optimal performance
- Middleware support (persist, devtools, immer)
- TypeScript support
- No boilerplate
- Easy to test

## Installation

```bash
npm install philjs-zustand philjs-core
```

## Basic Usage

### Create a Store

```typescript
import { createStore } from 'philjs-zustand';

const useStore = createStore((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
```

### Use in Components

```typescript
function Counter() {
  const count = useStore(state => state.count);
  const increment = useStore(state => state.increment);
  const decrement = useStore(state => state.decrement);

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
```

### Access State Outside Components

```typescript
// Get current state
const currentState = useStore.getState();
console.log(currentState.count);

// Update state
useStore.setState({ count: 10 });

// Subscribe to changes
const unsubscribe = useStore.subscribe((state, prevState) => {
  console.log('Count changed from', prevState.count, 'to', state.count);
});

// Later...
unsubscribe();
```

## Middleware

### Persist - Save to LocalStorage

```typescript
import { createStore, persist } from 'philjs-zustand';

const useStore = createStore(
  persist(
    (set) => ({
      name: '',
      age: 0,
      setName: (name) => set({ name }),
      setAge: (age) => set({ age }),
    }),
    {
      name: 'user-storage', // LocalStorage key
      storage: localStorage, // or sessionStorage
      partialize: (state) => ({ name: state.name }), // Only persist name
    }
  )
);
```

#### Persist Options

- `name` - LocalStorage key (required)
- `storage` - Storage object (default: `localStorage`)
- `serialize` - Custom serializer (default: `JSON.stringify`)
- `deserialize` - Custom deserializer (default: `JSON.parse`)
- `partialize` - Select which fields to persist
- `version` - Version number for migrations
- `migrate` - Migration function for version updates

### DevTools - Redux DevTools Integration

```typescript
import { createStore, devtools } from 'philjs-zustand';

const useStore = createStore(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 }), false, 'increment'),
      decrement: () => set((s) => ({ count: s.count - 1 }), false, 'decrement'),
    }),
    { name: 'CounterStore' }
  )
);
```

Note: Pass action name as third argument to `set()` for better DevTools tracking.

### Immer - Mutable Updates

```typescript
import { createStore, immer } from 'philjs-zustand';

const useStore = createStore(
  immer((set) => ({
    nested: { deeply: { value: 0 } },
    items: [1, 2, 3],
    updateNested: () => set((state) => {
      state.nested.deeply.value++; // Mutable syntax!
    }),
    addItem: (item) => set((state) => {
      state.items.push(item); // Mutable array operations!
    }),
  }))
);
```

### Combining Middleware

```typescript
import { createStore, persist, devtools, immer } from 'philjs-zustand';

const useStore = createStore(
  devtools(
    persist(
      immer((set) => ({
        todos: [],
        addTodo: (text) => set((state) => {
          state.todos.push({ id: Date.now(), text, done: false });
        }),
      })),
      { name: 'todos-storage' }
    ),
    { name: 'TodoStore' }
  )
);
```

## Advanced Patterns

### Slices Pattern

```typescript
import { createStore } from 'philjs-zustand';

// Define slices
const createUserSlice = (set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
});

const createCartSlice = (set, get) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),
  total: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.price, 0);
  },
});

// Combine slices
const useStore = createStore((set, get, api) => ({
  ...createUserSlice(set, get, api),
  ...createCartSlice(set, get, api),
}));
```

### Combining Multiple Stores

```typescript
import { createStore, combine } from 'philjs-zustand';

const useUserStore = createStore(() => ({ name: 'John' }));
const useCartStore = createStore(() => ({ items: [] }));

const useAppStore = combine({
  user: useUserStore,
  cart: useCartStore,
});

// Access combined state
const { user, cart } = useAppStore.getState();
```

### Selectors with Equality

```typescript
import { shallow } from 'philjs-zustand';

// Prevent unnecessary re-renders with shallow equality
const { firstName, lastName } = useStore(
  (state) => ({ firstName: state.firstName, lastName: state.lastName }),
  shallow
);
```

### Async Actions

```typescript
const useStore = createStore((set, get) => ({
  user: null,
  loading: false,
  error: null,

  fetchUser: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/users/${id}`);
      const user = await response.json();
      set({ user, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

## API Reference

### `createStore(createState)`

Creates a new store.

**Parameters:**
- `createState(set, get, api)` - Function that returns initial state

**Returns:** Store hook with attached methods

### `set(partial, replace?, actionName?)`

Updates the store state.

**Parameters:**
- `partial` - New state or updater function
- `replace` - If true, replace entire state (default: false)
- `actionName` - Action name for DevTools (optional)

### `get()`

Returns current state.

### `subscribe(listener)`

Subscribes to state changes.

**Parameters:**
- `listener(state, prevState)` - Callback function

**Returns:** Unsubscribe function

### `destroy()`

Destroys the store and clears all listeners.

## TypeScript

Full TypeScript support with type inference:

```typescript
interface BearState {
  bears: number;
  increase: (by: number) => void;
}

const useStore = createStore<BearState>((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}));
```

## Performance Tips

1. Use selectors to prevent unnecessary re-renders
2. Memoize selector functions for better performance
3. Use `shallow` for object selectors
4. Batch updates with `batch()` from philjs-core
5. Use slices to organize large stores

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-zustand/src/index.ts

### Public API
- Direct exports: Destroy, DevToolsOptions, GetState, Middleware, PersistOptions, SetState, StateCreator, StoreApi, Subscribe, UseStore, combine, createSlice, createStore, devtools, immer, persist, shallow
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
