# Deep Reactive Stores

PhilJS provides a powerful store system for managing complex application state with deep reactivity, path-based updates, undo/redo support, and middleware.

## Overview

While signals are perfect for simple state, stores excel at managing complex nested objects and arrays. They provide:

- **Deep Reactivity**: Automatic tracking at any depth
- **Path-Based Updates**: Update nested values with intuitive path syntax
- **Immutable Updates**: State is never mutated directly
- **DevTools Integration**: Time-travel debugging support
- **Persistence**: Built-in localStorage/sessionStorage support
- **Middleware**: Intercept and transform state changes
- **Undo/Redo**: Built-in history management

## Creating a Store

### Basic Store

```typescript
import { createStore } from '@philjs/core';

interface AppState {
  user: {
    name: string;
    email: string;
    preferences: {
      theme: 'light' | 'dark';
      notifications: boolean;
    };
  };
  items: Array<{ id: string; text: string; done: boolean }>;
  count: number;
}

const [store, setStore] = createStore<AppState>({
  user: {
    name: 'John',
    email: 'john@example.com',
    preferences: {
      theme: 'light',
      notifications: true
    }
  },
  items: [],
  count: 0
});
```

### Store with Options

```typescript
const [store, setStore] = createStore(initialState, {
  // Name for DevTools
  name: 'AppStore',

  // Enable DevTools integration
  devtools: true,

  // Persist to localStorage
  persist: {
    key: 'app-state',
    storage: 'localStorage', // or 'sessionStorage'
    serialize: JSON.stringify,
    deserialize: JSON.parse,
    partialize: (state) => ({
      // Only persist these fields
      user: state.user,
      count: state.count
    })
  },

  // Maximum history for undo/redo
  historyLimit: 50,

  // Middleware
  middleware: [
    (state, next) => {
      console.log('Before update:', state);
      const result = next(state);
      console.log('After update:', result);
      return result;
    }
  ]
});
```

## Reading Store Values

### Direct Access

Store values are accessed using property syntax. Each access is reactive:

```typescript
// Access nested values
const userName = store.user.name;
const theme = store.user.preferences.theme;
const firstItem = store.items[0];

// Use in components
function UserProfile() {
  return (
    <div>
      <h1>{store.user.name}</h1>
      <p>{store.user.email}</p>
      <span>Theme: {store.user.preferences.theme}</span>
    </div>
  );
}
```

### Tracking Granularity

The store tracks dependencies at the property level:

```typescript
import { effect } from '@philjs/core';

// Only re-runs when user.name changes
effect(() => {
  console.log('Name:', store.user.name);
});

// Only re-runs when items array reference changes
effect(() => {
  console.log('Items count:', store.items.length);
});

// Re-runs when any user property changes
effect(() => {
  console.log('User:', store.user);
});
```

## Updating Store Values

### Path-Based Updates

The `setStore` function accepts paths to deeply nested values:

```typescript
// Simple property
setStore('count', 5);

// Nested property
setStore('user', 'name', 'Jane');

// Deeply nested property
setStore('user', 'preferences', 'theme', 'dark');

// Array item by index
setStore('items', 0, 'done', true);

// Using setter function
setStore('count', c => c + 1);
setStore('user', 'name', name => name.toUpperCase());
```

### Batch Updates

Multiple updates are automatically batched:

```typescript
import { batch } from '@philjs/core';

// These are automatically batched
setStore('user', 'name', 'Jane');
setStore('user', 'email', 'jane@example.com');

// Or use explicit batch for guaranteed single update
batch(() => {
  setStore('user', 'name', 'Jane');
  setStore('user', 'email', 'jane@example.com');
  setStore('count', c => c + 1);
});
```

### Array Operations

```typescript
// Add item
setStore('items', items => [...items, {
  id: crypto.randomUUID(),
  text: 'New item',
  done: false
}]);

// Remove item
setStore('items', items => items.filter(item => item.id !== targetId));

// Update specific item
setStore('items', index, 'done', true);

// Update multiple items
setStore('items', items => items.map(item =>
  item.done ? { ...item, text: `[Done] ${item.text}` } : item
));

// Sort items
setStore('items', items => [...items].sort((a, b) =>
  a.text.localeCompare(b.text)
));
```

### Produce (Immer-style)

For complex mutations, use `produce` for an Immer-like API:

```typescript
import { produce } from '@philjs/core';

setStore('user', produce(draft => {
  draft.name = 'Jane';
  draft.preferences.theme = 'dark';
  draft.preferences.notifications = false;
}));

// Complex array operations
setStore('items', produce(draft => {
  // Add item at beginning
  draft.unshift({ id: '1', text: 'First', done: false });

  // Mark all as done
  draft.forEach(item => {
    item.done = true;
  });

  // Remove last item
  draft.pop();
}));
```

## Derived Values

### Using derive

Create computed values from store state:

```typescript
import { derive } from '@philjs/core';

const doneCount = derive(store, state =>
  state.items.filter(item => item.done).length
);

const undoneCount = derive(store, state =>
  state.items.filter(item => !item.done).length
);

const progress = derive(store, state => {
  const total = state.items.length;
  if (total === 0) return 0;
  const done = state.items.filter(item => item.done).length;
  return Math.round((done / total) * 100);
});

// Use in components
function ProgressBar() {
  return (
    <div class="progress-bar">
      <div
        class="progress-fill"
        style={{ width: `${progress()}%` }}
      />
      <span>{doneCount()} / {store.items.length}</span>
    </div>
  );
}
```

### Memoized Selectors

For expensive computations, use memoized selectors:

```typescript
import { memo } from '@philjs/core';

const filteredItems = memo(() => {
  const filter = filterSignal();
  const items = store.items;

  if (filter === 'all') return items;
  if (filter === 'done') return items.filter(i => i.done);
  return items.filter(i => !i.done);
});

const sortedItems = memo(() => {
  const items = filteredItems();
  const sortBy = sortBySignal();

  return [...items].sort((a, b) => {
    if (sortBy === 'text') return a.text.localeCompare(b.text);
    if (sortBy === 'done') return Number(a.done) - Number(b.done);
    return 0;
  });
});
```

## Store with Actions

### createStoreWithActions

Bundle actions with your store for better organization:

```typescript
import { createStoreWithActions } from '@philjs/core';

const [store, setStore, actions] = createStoreWithActions(
  {
    items: [] as Item[],
    filter: 'all' as 'all' | 'done' | 'pending'
  },
  {
    addItem: (text: string) => (state, set) => {
      set('items', items => [...items, {
        id: crypto.randomUUID(),
        text,
        done: false
      }]);
    },

    removeItem: (id: string) => (state, set) => {
      set('items', items => items.filter(item => item.id !== id));
    },

    toggleItem: (id: string) => (state, set) => {
      const index = state.items.findIndex(item => item.id === id);
      if (index >= 0) {
        set('items', index, 'done', done => !done);
      }
    },

    clearDone: () => (state, set) => {
      set('items', items => items.filter(item => !item.done));
    },

    setFilter: (filter: 'all' | 'done' | 'pending') => (state, set) => {
      set('filter', filter);
    }
  }
);

// Use actions
actions.addItem('Buy groceries');
actions.toggleItem('some-id');
actions.clearDone();
```

## Undo/Redo Store

### createUndoableStore

Create a store with built-in undo/redo:

```typescript
import { createUndoableStore } from '@philjs/core';

const {
  store,
  setStore,
  undo,
  redo,
  canUndo,
  canRedo,
  clear
} = createUndoableStore(
  {
    document: {
      title: 'Untitled',
      content: ''
    }
  },
  {
    historyLimit: 100 // Max undo steps
  }
);

// Make changes
setStore('document', 'title', 'My Document');
setStore('document', 'content', 'Hello, World!');

// Undo
if (canUndo()) {
  undo();
}

// Redo
if (canRedo()) {
  redo();
}

// Clear history
clear();
```

### Usage in Components

```typescript
function DocumentEditor() {
  return (
    <div>
      <div class="toolbar">
        <button
          onClick={undo}
          disabled={!canUndo()}
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
        >
          Redo
        </button>
      </div>

      <input
        value={store.document.title}
        onInput={e => setStore('document', 'title', e.target.value)}
      />

      <textarea
        value={store.document.content}
        onInput={e => setStore('document', 'content', e.target.value)}
      />
    </div>
  );
}
```

### Keyboard Shortcuts

```typescript
effect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        if (canRedo()) redo();
      } else {
        if (canUndo()) undo();
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  onCleanup(() => document.removeEventListener('keydown', handleKeyDown));
});
```

## Reconciliation

### reconcile

Efficiently update arrays while preserving references:

```typescript
import { reconcile } from '@philjs/core';

// Fetch new items from API
const newItems = await fetchItems();

// Reconcile preserves unchanged items
setStore('items', items =>
  reconcile(items, newItems, item => item.id)
);
```

### Why Reconcile?

Without reconcile, replacing an array creates new references for all items:

```typescript
// Without reconcile - all items are new references
setStore('items', newItems);

// With reconcile - unchanged items keep same reference
setStore('items', items =>
  reconcile(items, newItems, item => item.id)
);
```

This matters for:
- Preserving component state
- Optimizing re-renders
- Maintaining scroll position in virtualized lists

## Middleware

### Creating Middleware

Middleware intercepts state changes:

```typescript
import { createStore } from '@philjs/core';

// Logger middleware
const logger = (state, next) => {
  console.log('Previous state:', state);
  const result = next(state);
  console.log('Next state:', result);
  return result;
};

// Validation middleware
const validate = (state, next) => {
  const result = next(state);

  // Validate result
  if (result.count < 0) {
    console.error('Count cannot be negative');
    return state; // Reject update
  }

  return result;
};

// Analytics middleware
const analytics = (state, next) => {
  const result = next(state);

  // Track changes
  if (state.user.preferences.theme !== result.user.preferences.theme) {
    trackEvent('theme_changed', { theme: result.user.preferences.theme });
  }

  return result;
};

const [store, setStore] = createStore(initialState, {
  middleware: [logger, validate, analytics]
});
```

### Async Middleware

```typescript
const asyncMiddleware = async (state, next) => {
  const result = next(state);

  // Sync to server
  await fetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify(result)
  });

  return result;
};
```

## Persistence

### Local Storage Persistence

```typescript
const [store, setStore] = createStore(initialState, {
  persist: {
    key: 'app-state',
    storage: 'localStorage'
  }
});
```

### Session Storage

```typescript
const [store, setStore] = createStore(initialState, {
  persist: {
    key: 'session-state',
    storage: 'sessionStorage'
  }
});
```

### Partial Persistence

Only persist specific parts of state:

```typescript
const [store, setStore] = createStore(initialState, {
  persist: {
    key: 'app-state',
    storage: 'localStorage',
    partialize: (state) => ({
      // Only persist user preferences, not items
      user: {
        preferences: state.user.preferences
      }
    })
  }
});
```

### Custom Serialization

```typescript
import superjson from 'superjson';

const [store, setStore] = createStore(initialState, {
  persist: {
    key: 'app-state',
    storage: 'localStorage',
    serialize: superjson.stringify,
    deserialize: superjson.parse
  }
});
```

### Versioned Persistence

Handle state schema migrations:

```typescript
const [store, setStore] = createStore(initialState, {
  persist: {
    key: 'app-state',
    storage: 'localStorage',
    version: 2,
    migrate: (persisted, version) => {
      if (version === 1) {
        // Migrate from v1 to v2
        return {
          ...persisted,
          user: {
            ...persisted.user,
            preferences: {
              theme: persisted.user.theme || 'light',
              notifications: true
            }
          }
        };
      }
      return persisted;
    }
  }
});
```

## DevTools Integration

### Enable DevTools

```typescript
const [store, setStore] = createStore(initialState, {
  name: 'MyStore',
  devtools: true
});
```

### Custom DevTools Actions

```typescript
// Actions are automatically tracked
actions.addItem('Task 1');
// DevTools shows: "addItem" action with payload

// Named setStore operations
setStore('user', 'name', 'Jane', { action: 'UPDATE_USER_NAME' });
```

## Best Practices

### 1. Structure State by Feature

```typescript
// Good: Feature-based organization
const [store] = createStore({
  auth: {
    user: null,
    isLoading: false,
    error: null
  },
  todos: {
    items: [],
    filter: 'all'
  },
  ui: {
    sidebarOpen: false,
    theme: 'light'
  }
});

// Bad: Flat structure
const [store] = createStore({
  user: null,
  isAuthLoading: false,
  authError: null,
  todoItems: [],
  todoFilter: 'all',
  sidebarOpen: false,
  theme: 'light'
});
```

### 2. Use Actions for Complex Operations

```typescript
// Good: Encapsulated logic
const actions = {
  login: async (credentials) => {
    setStore('auth', 'isLoading', true);
    try {
      const user = await api.login(credentials);
      setStore('auth', { user, isLoading: false, error: null });
    } catch (error) {
      setStore('auth', { isLoading: false, error: error.message });
    }
  }
};

// Bad: Logic scattered in components
onClick={async () => {
  setStore('auth', 'isLoading', true);
  // ...complex logic in component
}}
```

### 3. Normalize Nested Data

```typescript
// Good: Normalized
const [store] = createStore({
  users: {
    byId: {},
    allIds: []
  },
  posts: {
    byId: {},
    allIds: []
  }
});

// Bad: Deeply nested
const [store] = createStore({
  users: [
    {
      id: 1,
      posts: [
        { id: 1, comments: [...] }
      ]
    }
  ]
});
```

### 4. Use Derive for Computed Values

```typescript
// Good: Derived values
const completedTodos = derive(store, s =>
  s.todos.items.filter(t => t.done)
);

// Bad: Computing in component
function Component() {
  const completed = store.todos.items.filter(t => t.done);
  // Recomputes every render
}
```

### 5. Batch Related Updates

```typescript
// Good: Batched
batch(() => {
  setStore('user', 'name', 'Jane');
  setStore('user', 'email', 'jane@example.com');
  setStore('user', 'updatedAt', Date.now());
});

// Also good: Object update
setStore('user', {
  name: 'Jane',
  email: 'jane@example.com',
  updatedAt: Date.now()
});
```

## TypeScript Integration

### Strong Typing

```typescript
interface AppState {
  user: User | null;
  items: Item[];
  settings: Settings;
}

const [store, setStore] = createStore<AppState>({
  user: null,
  items: [],
  settings: defaultSettings
});

// TypeScript enforces correct paths and values
setStore('user', 'name', 'Jane'); // Error if user is null
setStore('items', 0, 'text', 'Updated'); // Correct
setStore('settings', 'theme', 'invalid'); // Error: invalid value
```

### Type-Safe Actions

```typescript
type Actions = {
  addItem: (text: string) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
};

const [store, setStore, actions] = createStoreWithActions<AppState, Actions>(
  initialState,
  {
    addItem: (text) => (state, set) => { /* ... */ },
    removeItem: (id) => (state, set) => { /* ... */ },
    updateItem: (id, updates) => (state, set) => { /* ... */ }
  }
);
```

## Next Steps

- [Signals and Reactivity](./signals.md) - Foundation of reactivity
- [Effects and Lifecycle](./effects-lifecycle.md) - Side effects
- [Async Primitives](./async.md) - Async data handling
- [API Reference](./api-reference.md) - Complete API documentation
