# State Management

Best practices for managing state at all scales in PhilJS applications.

## State Categories

### Local Component State

State that belongs to a single component.

```tsx
function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>Increment</button>
    </div>
  );
}
```

**Use when:**
- State is only needed in one component
- No other components need to access it
- State doesn't need to persist

### Lifted State

State shared between multiple components via props.

```tsx
function ParentComponent() {
  const searchTerm = signal('');
  const filteredItems = memo(() =>
    items.filter(item => item.name.includes(searchTerm()))
  );

  return (
    <div>
      <SearchInput value={searchTerm()} onChange={searchTerm.set} />
      <ItemList items={filteredItems()} />
    </div>
  );
}
```

**Use when:**
- Multiple sibling components need same state
- Parent needs to coordinate children
- State doesn't belong globally

### Global State

State accessible throughout the application.

```tsx
// stores/userStore.ts
import { signal, memo } from 'philjs-core';

function createUserStore() {
  const user = signal<User | null>(null);
  const isAuthenticated = memo(() => user() !== null);
  const isAdmin = memo(() => user()?.role === 'admin');

  const login = async (credentials: Credentials) => {
    const userData = await authService.login(credentials);
    user.set(userData);
  };

  const logout = () => {
    user.set(null);
  };

  return {
    user,
    isAuthenticated,
    isAdmin,
    login,
    logout
  };
}

export const userStore = createUserStore();

// Usage in components
import { userStore } from '@/stores/userStore';

function Header() {
  const { user, logout } = userStore;

  return (
    <header>
      <span>Welcome, {user()?.name}</span>
      <button onClick={logout}>Logout</button>
    </header>
  );
}
```

**Use when:**
- State needed across many components
- Deep prop drilling would be cumbersome
- State should persist across routes

## Store Patterns

### Simple Store

```tsx
// stores/themeStore.ts
import { signal } from 'philjs-core';

const theme = signal<'light' | 'dark'>('light');

export const themeStore = {
  theme,
  toggle: () => {
    theme.set(theme() === 'light' ? 'dark' : 'light');
  }
};
```

### Factory Store

```tsx
// stores/todoStore.ts
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

function createTodoStore() {
  const todos = signal<Todo[]>([]);
  const filter = signal<'all' | 'active' | 'completed'>('all');

  const filteredTodos = memo(() => {
    const allTodos = todos();

    switch (filter()) {
      case 'active':
        return allTodos.filter(t => !t.completed);
      case 'completed':
        return allTodos.filter(t => t.completed);
      default:
        return allTodos;
    }
  });

  const activeCount = memo(() =>
    todos().filter(t => !t.completed).length
  );

  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false
    };

    todos.set([...todos(), newTodo]);
  };

  const toggleTodo = (id: string) => {
    todos.set(
      todos().map(todo =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    todos.set(todos().filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    todos.set(todos().filter(t => !t.completed));
  };

  return {
    // State
    todos,
    filter,

    // Computed
    filteredTodos,
    activeCount,

    // Actions
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted
  };
}

export const todoStore = createTodoStore();
```

### Async Store

```tsx
// stores/productsStore.ts
interface Product {
  id: string;
  name: string;
  price: number;
}

function createProductsStore() {
  const products = signal<Product[]>([]);
  const loading = signal(false);
  const error = signal<string | null>(null);

  const fetchProducts = async () => {
    loading.set(true);
    error.set(null);

    try {
      const data = await api.get<Product[]>('/products');
      products.set(data);
    } catch (err) {
      error.set(err.message);
    } finally {
      loading.set(false);
    }
  };

  const createProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const newProduct = await api.post<Product>('/products', product);
      products.set([...products(), newProduct]);
      return newProduct;
    } catch (err) {
      error.set(err.message);
      throw err;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const updated = await api.patch<Product>(`/products/${id}`, updates);
      products.set(
        products().map(p => p.id === id ? updated : p)
      );
      return updated;
    } catch (err) {
      error.set(err.message);
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await api.delete(`/products/${id}`);
      products.set(products().filter(p => p.id !== id));
    } catch (err) {
      error.set(err.message);
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  };
}

export const productsStore = createProductsStore();
```

### Persistent Store

```tsx
// stores/settingsStore.ts
import { signal, effect } from 'philjs-core';

interface Settings {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

const defaultSettings: Settings = {
  theme: 'light',
  language: 'en',
  notifications: true
};

function createSettingsStore() {
  // Load from localStorage
  const stored = localStorage.getItem('settings');
  const initial = stored ? JSON.parse(stored) : defaultSettings;

  const settings = signal<Settings>(initial);

  // Persist to localStorage
  effect(() => {
    localStorage.setItem('settings', JSON.stringify(settings()));
  });

  const updateSettings = (updates: Partial<Settings>) => {
    settings.set({ ...settings(), ...updates });
  };

  const reset = () => {
    settings.set(defaultSettings);
  };

  return {
    settings,
    updateSettings,
    reset
  };
}

export const settingsStore = createSettingsStore();
```

## State Composition

### Combining Stores

```tsx
// stores/cartStore.ts
import { userStore } from './userStore';

function createCartStore() {
  const items = signal<CartItem[]>([]);

  const total = memo(() =>
    items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  const discount = memo(() => {
    const user = userStore.user();
    if (!user) return 0;

    // Premium users get 10% discount
    if (user.isPremium) {
      return total() * 0.1;
    }

    return 0;
  });

  const finalTotal = memo(() => total() - discount());

  const addItem = (product: Product) => {
    const existing = items().find(item => item.id === product.id);

    if (existing) {
      items.set(
        items().map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      items.set([...items(), {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }]);
    }
  };

  return {
    items,
    total,
    discount,
    finalTotal,
    addItem
  };
}

export const cartStore = createCartStore();
```

### Derived Stores

```tsx
// stores/analyticsStore.ts
import { productsStore } from './productsStore';
import { cartStore } from './cartStore';

function createAnalyticsStore() {
  const totalRevenue = memo(() => {
    // Compute from cart history
    return cartStore.finalTotal();
  });

  const popularProducts = memo(() => {
    const products = productsStore.products();
    // Sort by popularity
    return products.sort((a, b) => b.views - a.views).slice(0, 5);
  });

  const averageOrderValue = memo(() => {
    // Calculate from orders
    return totalRevenue() / orderCount();
  });

  return {
    totalRevenue,
    popularProducts,
    averageOrderValue
  };
}

export const analyticsStore = createAnalyticsStore();
```

## State Machines

### Finite State Machine

```tsx
type State = 'idle' | 'loading' | 'success' | 'error';

type Event =
  | { type: 'FETCH' }
  | { type: 'SUCCESS'; data: any }
  | { type: 'ERROR'; error: string }
  | { type: 'RETRY' };

function createFetchMachine() {
  const state = signal<State>('idle');
  const data = signal<any>(null);
  const error = signal<string | null>(null);

  const send = (event: Event) => {
    const current = state();

    switch (event.type) {
      case 'FETCH':
        if (current === 'idle' || current === 'error') {
          state.set('loading');
          error.set(null);
        }
        break;

      case 'SUCCESS':
        if (current === 'loading') {
          state.set('success');
          data.set(event.data);
        }
        break;

      case 'ERROR':
        if (current === 'loading') {
          state.set('error');
          error.set(event.error);
        }
        break;

      case 'RETRY':
        if (current === 'error') {
          state.set('loading');
          error.set(null);
        }
        break;
    }
  };

  return {
    state,
    data,
    error,
    send
  };
}

// Usage
function DataComponent() {
  const machine = createFetchMachine();

  effect(async () => {
    if (machine.state() === 'loading') {
      try {
        const result = await fetchData();
        machine.send({ type: 'SUCCESS', data: result });
      } catch (err) {
        machine.send({ type: 'ERROR', error: err.message });
      }
    }
  });

  return (
    <div>
      {machine.state() === 'idle' && (
        <button onClick={() => machine.send({ type: 'FETCH' })}>
          Load Data
        </button>
      )}

      {machine.state() === 'loading' && <Spinner />}

      {machine.state() === 'success' && (
        <DataView data={machine.data()} />
      )}

      {machine.state() === 'error' && (
        <div>
          <p>Error: {machine.error()}</p>
          <button onClick={() => machine.send({ type: 'RETRY' })}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
```

## Optimistic Updates

```tsx
function createOptimisticStore() {
  const items = signal<Item[]>([]);
  const pendingUpdates = signal<Map<string, Item>>(new Map());

  const addItem = async (item: Omit<Item, 'id'>) => {
    const tempId = crypto.randomUUID();
    const optimisticItem = { ...item, id: tempId };

    // Optimistically add to UI
    items.set([...items(), optimisticItem]);
    pendingUpdates.set(new Map(pendingUpdates()).set(tempId, optimisticItem));

    try {
      // Send to server
      const serverItem = await api.post<Item>('/items', item);

      // Replace optimistic item with server item
      items.set(
        items().map(i => i.id === tempId ? serverItem : i)
      );

      const updates = new Map(pendingUpdates());
      updates.delete(tempId);
      pendingUpdates.set(updates);
    } catch (err) {
      // Rollback on error
      items.set(items().filter(i => i.id !== tempId));

      const updates = new Map(pendingUpdates());
      updates.delete(tempId);
      pendingUpdates.set(updates);

      throw err;
    }
  };

  const updateItem = async (id: string, updates: Partial<Item>) => {
    const original = items().find(i => i.id === id);
    if (!original) return;

    // Optimistically update
    const optimisticItem = { ...original, ...updates };
    items.set(items().map(i => i.id === id ? optimisticItem : i));
    pendingUpdates.set(new Map(pendingUpdates()).set(id, original));

    try {
      const serverItem = await api.patch<Item>(`/items/${id}`, updates);
      items.set(items().map(i => i.id === id ? serverItem : i));

      const pending = new Map(pendingUpdates());
      pending.delete(id);
      pendingUpdates.set(pending);
    } catch (err) {
      // Rollback
      items.set(items().map(i => i.id === id ? original : i));

      const pending = new Map(pendingUpdates());
      pending.delete(id);
      pendingUpdates.set(pending);

      throw err;
    }
  };

  return {
    items,
    pendingUpdates,
    addItem,
    updateItem
  };
}
```

## Undo/Redo

```tsx
function createUndoableStore<T>(initialValue: T) {
  const present = signal(initialValue);
  const past = signal<T[]>([]);
  const future = signal<T[]>([]);

  const canUndo = memo(() => past().length > 0);
  const canRedo = memo(() => future().length > 0);

  const set = (value: T) => {
    past.set([...past(), present()]);
    present.set(value);
    future.set([]); // Clear redo history
  };

  const undo = () => {
    if (!canUndo()) return;

    const previous = past()[past().length - 1];
    future.set([present(), ...future()]);
    present.set(previous);
    past.set(past().slice(0, -1));
  };

  const redo = () => {
    if (!canRedo()) return;

    const next = future()[0];
    past.set([...past(), present()]);
    present.set(next);
    future.set(future().slice(1));
  };

  const reset = () => {
    present.set(initialValue);
    past.set([]);
    future.set([]);
  };

  return {
    value: present,
    canUndo,
    canRedo,
    set,
    undo,
    redo,
    reset
  };
}

// Usage
const editor = createUndoableStore('');

function TextEditor() {
  return (
    <div>
      <div className="toolbar">
        <button
          onClick={() => editor.undo()}
          disabled={!editor.canUndo()}
        >
          Undo
        </button>
        <button
          onClick={() => editor.redo()}
          disabled={!editor.canRedo()}
        >
          Redo
        </button>
      </div>

      <textarea
        value={editor.value()}
        onInput={(e) => editor.set(e.currentTarget.value)}
      />
    </div>
  );
}
```

## Performance Optimization

### Batching Updates

```tsx
import { batch } from 'philjs-core';

function createFormStore() {
  const firstName = signal('');
  const lastName = signal('');
  const email = signal('');
  const age = signal(0);

  const loadUser = (user: User) => {
    // Batch multiple updates into single effect run
    batch(() => {
      firstName.set(user.firstName);
      lastName.set(user.lastName);
      email.set(user.email);
      age.set(user.age);
    });
  };

  return {
    firstName,
    lastName,
    email,
    age,
    loadUser
  };
}
```

### Selective Updates

```tsx
function createOptimizedStore() {
  const data = signal<LargeDataset>({ /* huge object */ });

  // ✅ Update only what changed
  const updateField = (field: string, value: any) => {
    data.set({
      ...data(),
      [field]: value
    });
  };

  // ❌ Avoid replacing entire object if only one field changed
  const badUpdate = (newData: LargeDataset) => {
    data.set(newData); // Triggers update even if values are same
  };

  return { data, updateField };
}
```

## Summary

**Best Practices:**

✅ Keep state as local as possible
✅ Use stores for truly global state
✅ Compose stores instead of creating monoliths
✅ Implement async patterns correctly
✅ Use optimistic updates for better UX
✅ Batch related updates
✅ Consider state machines for complex flows
✅ Persist state when needed
✅ Implement undo/redo for editors

**Next:** [Performance →](./performance.md)
