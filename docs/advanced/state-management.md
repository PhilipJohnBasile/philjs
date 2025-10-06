# Advanced State Management

Complex state patterns for large-scale PhilJS applications.

## What You'll Learn

- Global state management
- State machines
- Undo/redo functionality
- State persistence
- Cross-tab synchronization
- Optimistic updates
- Best practices

## Global State

### Create Global Store

```typescript
import { signal, memo } from 'philjs-core';

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
  preferences: UserPreferences;
}

const initialState: AppState = {
  user: null,
  theme: 'light',
  notifications: [],
  preferences: {}
};

const appState = signal<AppState>(initialState);

export function useAppState() {
  const updateUser = (user: User | null) => {
    appState.set({ ...appState(), user });
  };

  const setTheme = (theme: 'light' | 'dark') => {
    appState.set({ ...appState(), theme });
  };

  const addNotification = (notification: Notification) => {
    appState.set({
      ...appState(),
      notifications: [...appState().notifications, notification]
    });
  };

  const removeNotification = (id: string) => {
    appState.set({
      ...appState(),
      notifications: appState().notifications.filter(n => n.id !== id)
    });
  };

  return {
    state: appState,
    updateUser,
    setTheme,
    addNotification,
    removeNotification
  };
}
```

### Immutable Updates with Immer

```typescript
import { produce } from 'immer';

const appState = signal<AppState>(initialState);

export function useAppState() {
  const updateState = (updater: (draft: AppState) => void) => {
    const nextState = produce(appState(), updater);
    appState.set(nextState);
  };

  const addNotification = (notification: Notification) => {
    updateState(draft => {
      draft.notifications.push(notification);
    });
  };

  const markNotificationRead = (id: string) => {
    updateState(draft => {
      const notification = draft.notifications.find(n => n.id === id);
      if (notification) {
        notification.read = true;
      }
    });
  };

  return {
    state: appState,
    updateState,
    addNotification,
    markNotificationRead
  };
}
```

## State Machines

### Finite State Machine

```typescript
type State = 'idle' | 'loading' | 'success' | 'error';

type Event =
  | { type: 'FETCH' }
  | { type: 'SUCCESS'; data: any }
  | { type: 'ERROR'; error: Error }
  | { type: 'RESET' };

interface MachineState {
  state: State;
  data: any;
  error: Error | null;
}

function reducer(state: MachineState, event: Event): MachineState {
  switch (state.state) {
    case 'idle':
      if (event.type === 'FETCH') {
        return { state: 'loading', data: null, error: null };
      }
      break;

    case 'loading':
      if (event.type === 'SUCCESS') {
        return { state: 'success', data: event.data, error: null };
      }
      if (event.type === 'ERROR') {
        return { state: 'error', data: null, error: event.error };
      }
      break;

    case 'success':
    case 'error':
      if (event.type === 'RESET') {
        return { state: 'idle', data: null, error: null };
      }
      if (event.type === 'FETCH') {
        return { state: 'loading', data: null, error: null };
      }
      break;
  }

  return state;
}

export function useFetchMachine() {
  const state = signal<MachineState>({
    state: 'idle',
    data: null,
    error: null
  });

  const send = (event: Event) => {
    state.set(reducer(state(), event));
  };

  const fetch = async (url: string) => {
    send({ type: 'FETCH' });

    try {
      const response = await window.fetch(url);
      const data = await response.json();
      send({ type: 'SUCCESS', data });
    } catch (error) {
      send({ type: 'ERROR', error: error as Error });
    }
  };

  const reset = () => {
    send({ type: 'RESET' });
  };

  return {
    state,
    fetch,
    reset
  };
}

// Usage
function DataFetcher() {
  const machine = useFetchMachine();

  return (
    <div>
      {machine.state().state === 'idle' && (
        <button onClick={() => machine.fetch('/api/data')}>
          Load Data
        </button>
      )}

      {machine.state().state === 'loading' && <div>Loading...</div>}

      {machine.state().state === 'success' && (
        <div>Data: {JSON.stringify(machine.state().data)}</div>
      )}

      {machine.state().state === 'error' && (
        <div>
          Error: {machine.state().error?.message}
          <button onClick={machine.reset}>Retry</button>
        </div>
      )}
    </div>
  );
}
```

## Undo/Redo

### History Stack

```typescript
interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistory<T>(initialState: T) {
  const history = signal<HistoryState<T>>({
    past: [],
    present: initialState,
    future: []
  });

  const canUndo = memo(() => history().past.length > 0);
  const canRedo = memo(() => history().future.length > 0);

  const set = (newState: T) => {
    const current = history();

    history.set({
      past: [...current.past, current.present],
      present: newState,
      future: []
    });
  };

  const undo = () => {
    if (!canUndo()) return;

    const current = history();
    const previous = current.past[current.past.length - 1];
    const newPast = current.past.slice(0, -1);

    history.set({
      past: newPast,
      present: previous,
      future: [current.present, ...current.future]
    });
  };

  const redo = () => {
    if (!canRedo()) return;

    const current = history();
    const next = current.future[0];
    const newFuture = current.future.slice(1);

    history.set({
      past: [...current.past, current.present],
      present: next,
      future: newFuture
    });
  };

  const reset = () => {
    history.set({
      past: [],
      present: initialState,
      future: []
    });
  };

  return {
    state: memo(() => history().present),
    canUndo,
    canRedo,
    set,
    undo,
    redo,
    reset
  };
}

// Usage - Text Editor
function TextEditor() {
  const editor = useHistory('');

  return (
    <div>
      <div>
        <button onClick={editor.undo} disabled={!editor.canUndo()}>
          Undo
        </button>
        <button onClick={editor.redo} disabled={!editor.canRedo()}>
          Redo
        </button>
      </div>

      <textarea
        value={editor.state()}
        onInput={(e) => editor.set(e.target.value)}
      />
    </div>
  );
}
```

## State Persistence

### LocalStorage Persistence

```typescript
export function usePersistentState<T>(key: string, initialValue: T) {
  // Load from localStorage
  const loadedValue = (() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  })();

  const state = signal<T>(loadedValue);

  // Save to localStorage on changes
  effect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state()));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  });

  return state;
}

// Usage
function ThemeSelector() {
  const theme = usePersistentState('theme', 'light');

  return (
    <select value={theme()} onChange={(e) => theme.set(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
```

### IndexedDB Persistence

```typescript
import { openDB, DBSchema } from 'idb';

interface AppDB extends DBSchema {
  state: {
    key: string;
    value: any;
  };
}

const dbPromise = openDB<AppDB>('app-state', 1, {
  upgrade(db) {
    db.createObjectStore('state');
  }
});

export function useIndexedDBState<T>(key: string, initialValue: T) {
  const state = signal<T>(initialValue);
  const loaded = signal(false);

  // Load from IndexedDB
  effect(async () => {
    try {
      const db = await dbPromise;
      const value = await db.get('state', key);

      if (value !== undefined) {
        state.set(value);
      }
      loaded.set(true);
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error);
      loaded.set(true);
    }
  });

  // Save to IndexedDB on changes
  effect(async () => {
    if (!loaded()) return;

    try {
      const db = await dbPromise;
      await db.put('state', state(), key);
    } catch (error) {
      console.error('Failed to save to IndexedDB:', error);
    }
  });

  return state;
}
```

## Cross-Tab Synchronization

### BroadcastChannel API

```typescript
export function useSyncedState<T>(key: string, initialValue: T) {
  const state = usePersistentState(key, initialValue);
  const channel = new BroadcastChannel(key);

  // Listen for updates from other tabs
  effect(() => {
    const handleMessage = (event: MessageEvent) => {
      state.set(event.data);
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  });

  // Broadcast updates to other tabs
  effect(() => {
    channel.postMessage(state());
  });

  return state;
}

// Usage
function SyncedCounter() {
  const count = useSyncedState('counter', 0);

  return (
    <div>
      <p>Count: {count()} (synced across tabs)</p>
      <button onClick={() => count.set(count() + 1)}>Increment</button>
    </div>
  );
}
```

### Storage Event

```typescript
export function useStorageSyncedState<T>(key: string, initialValue: T) {
  const state = usePersistentState(key, initialValue);

  effect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          state.set(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Failed to parse storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => window.removeEventListener('storage', handleStorage);
  });

  return state;
}
```

## Optimistic Updates

### Optimistic State Pattern

```typescript
interface OptimisticState<T> {
  data: T;
  pending: T[];
  errors: Map<string, Error>;
}

export function useOptimistic<T>(initialData: T) {
  const state = signal<OptimisticState<T>>({
    data: initialData,
    pending: [],
    errors: new Map()
  });

  const currentData = memo(() => {
    const current = state();
    // Apply pending updates
    return current.pending.reduce(
      (data, update) => ({ ...data, ...update }),
      current.data
    );
  });

  const mutate = async (
    id: string,
    optimisticUpdate: Partial<T>,
    serverUpdate: () => Promise<T>
  ) => {
    // Apply optimistic update
    state.set({
      ...state(),
      pending: [...state().pending, optimisticUpdate as T]
    });

    try {
      // Perform server update
      const result = await serverUpdate();

      // Remove pending and apply server result
      state.set({
        data: result,
        pending: state().pending.filter(u => u !== optimisticUpdate),
        errors: new Map(state().errors)
      });
    } catch (error) {
      // Revert optimistic update and store error
      const errors = new Map(state().errors);
      errors.set(id, error as Error);

      state.set({
        ...state(),
        pending: state().pending.filter(u => u !== optimisticUpdate),
        errors
      });
    }
  };

  return {
    data: currentData,
    mutate
  };
}

// Usage - Like button
function LikeButton({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const likes = useOptimistic({ count: initialLikes });

  const handleLike = async () => {
    await likes.mutate(
      postId,
      { count: likes.data().count + 1 }, // Optimistic
      async () => {
        // Server request
        const response = await fetch(`/api/posts/${postId}/like`, {
          method: 'POST'
        });
        return await response.json();
      }
    );
  };

  return (
    <button onClick={handleLike}>
      ❤️ {likes.data().count}
    </button>
  );
}
```

## Derived State

### Computed Values

```typescript
const todos = signal<Todo[]>([]);

const completedTodos = memo(() =>
  todos().filter(todo => todo.completed)
);

const activeTodos = memo(() =>
  todos().filter(todo => !todo.completed)
);

const todoStats = memo(() => ({
  total: todos().length,
  completed: completedTodos().length,
  active: activeTodos().length,
  percentComplete: todos().length > 0
    ? (completedTodos().length / todos().length) * 100
    : 0
}));

// Usage
function TodoStats() {
  const stats = todoStats();

  return (
    <div>
      <p>Total: {stats.total}</p>
      <p>Completed: {stats.completed}</p>
      <p>Active: {stats.active}</p>
      <p>Progress: {stats.percentComplete.toFixed(0)}%</p>
    </div>
  );
}
```

## Best Practices

### Keep State Minimal

```typescript
// ❌ Redundant state
const todos = signal<Todo[]>([]);
const completedCount = signal(0); // Derived from todos
const activeCount = signal(0);    // Derived from todos

// ✅ Minimal state with computed values
const todos = signal<Todo[]>([]);

const completedCount = memo(() =>
  todos().filter(t => t.completed).length
);

const activeCount = memo(() =>
  todos().filter(t => !t.completed).length
);
```

### Normalize Complex State

```typescript
// ❌ Nested arrays (hard to update)
const posts = signal([
  {
    id: '1',
    comments: [
      { id: 'c1', text: 'Great!' },
      { id: 'c2', text: 'Thanks!' }
    ]
  }
]);

// ✅ Normalized state
const posts = signal({
  '1': { id: '1', commentIds: ['c1', 'c2'] }
});

const comments = signal({
  'c1': { id: 'c1', text: 'Great!' },
  'c2': { id: 'c2', text: 'Thanks!' }
});

// Easy to update individual comment
const updateComment = (id: string, text: string) => {
  comments.set({
    ...comments(),
    [id]: { ...comments()[id], text }
  });
};
```

### Use Selectors

```typescript
// Selector pattern
export function selectUser(state: AppState) {
  return state.user;
}

export function selectIsAuthenticated(state: AppState) {
  return state.user !== null;
}

export function selectUserRole(state: AppState) {
  return state.user?.role || 'guest';
}

// Usage
const user = memo(() => selectUser(appState()));
const isAuth = memo(() => selectIsAuthenticated(appState()));
const role = memo(() => selectUserRole(appState()));
```

## Summary

You've learned:

✅ Global state management patterns
✅ State machines for complex flows
✅ Undo/redo functionality
✅ State persistence (localStorage, IndexedDB)
✅ Cross-tab state synchronization
✅ Optimistic updates for better UX
✅ Derived state with memos
✅ Best practices for state management

Advanced state patterns enable scalable applications!

---

**Next:** [WebSockets →](./websockets.md) Real-time communication
