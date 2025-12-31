# State Management Patterns

Comprehensive guide to managing state at all scales in PhilJS applications, from local component state to complex global patterns.

## Table of Contents

1. [State Categories](#state-categories)
2. [Local Component State](#local-component-state)
3. [Shared State Patterns](#shared-state-patterns)
4. [Global State with Context](#global-state-with-context)
5. [Store Patterns](#store-patterns)
6. [State Persistence](#state-persistence)
7. [State Synchronization](#state-synchronization)
8. [Advanced Patterns](#advanced-patterns)

## State Categories

Understanding where state should live is crucial for maintainable applications:

- **Local State**: Single component scope
- **Shared State**: Multiple components (siblings, parent-child)
- **Global State**: Application-wide access
- **Persistent State**: Survives page reloads
- **Synchronized State**: Connected to external sources

## Local Component State

State that belongs to a single component. This is the most common and simplest form of state management.

### Basic Signal State

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

### Multiple Related Signals

```tsx
function UserProfile() {
  const firstName = signal('John');
  const lastName = signal('Doe');
  const email = signal('john.doe@example.com');
  const age = signal(30);

  // Computed full name
  const fullName = memo(() => `${firstName()} ${lastName()}`);

  const handleSubmit = () => {
    console.log('Saving:', {
      firstName: firstName(),
      lastName: lastName(),
      email: email(),
      age: age()
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={firstName}
        onInput={(e) => firstName.set(e.currentTarget.value)}
        placeholder="First Name"
      />
      <input
        type="text"
        value={lastName}
        onInput={(e) => lastName.set(e.currentTarget.value)}
        placeholder="Last Name"
      />
      <input
        type="email"
        value={email}
        onInput={(e) => email.set(e.currentTarget.value)}
        placeholder="Email"
      />
      <input
        type="number"
        value={age}
        onInput={(e) => age.set(Number(e.currentTarget.value))}
        placeholder="Age"
      />
      <p>Full Name: {fullName()}</p>
      <button type="submit">Save Profile</button>
    </form>
  );
}
```

### Object State Pattern

```tsx
interface FormData {
  username: string;
  email: string;
  bio: string;
}

function ProfileForm() {
  const formData = signal<FormData>({
    username: '',
    email: '',
    bio: ''
  });

  const isValid = memo(() => {
    const data = formData();
    return data.username.length >= 3 &&
           data.email.includes('@') &&
           data.bio.length <= 500;
  });

  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    formData.set({ ...formData(), [field]: value });
  };

  return (
    <form>
      <input
        value={formData().username}
        onInput={(e) => updateField('username', e.currentTarget.value)}
        placeholder="Username"
      />
      <input
        value={formData().email}
        onInput={(e) => updateField('email', e.currentTarget.value)}
        placeholder="Email"
      />
      <textarea
        value={formData().bio}
        onInput={(e) => updateField('bio', e.currentTarget.value)}
        placeholder="Bio"
      />
      <p>{formData().bio.length}/500 characters</p>
      <button type="submit" disabled={!isValid()}>
        Submit
      </button>
    </form>
  );
}
```

**Use local state when:**
- State is only needed in one component
- No other components need to access it
- State doesn't need to persist beyond component lifetime
- The component is self-contained

## Shared State Patterns

When multiple components need access to the same state, you have several options depending on the component relationship.

### Lifted State (Parent-Child)

State shared between multiple components via props. Lift state to the closest common ancestor.

```tsx
function ParentComponent() {
  const searchTerm = signal('');
  const items = signal([
    { id: 1, name: 'Apple', category: 'fruit' },
    { id: 2, name: 'Banana', category: 'fruit' },
    { id: 3, name: 'Carrot', category: 'vegetable' }
  ]);

  const filteredItems = memo(() =>
    items().filter(item =>
      item.name.toLowerCase().includes(searchTerm().toLowerCase())
    )
  );

  return (
    <div>
      <SearchInput value={searchTerm()} onChange={searchTerm.set} />
      <ItemList items={filteredItems()} />
      <ItemCount count={filteredItems().length} />
    </div>
  );
}

function SearchInput({ value, onChange }: {
  value: Signal<string>;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="search"
      value={value}
      onInput={(e) => onChange(e.currentTarget.value)}
      placeholder="Search items..."
    />
  );
}

function ItemList({ items }: { items: Memo<Item[]> }) {
  return (
    <ul>
      {() => items().map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}

function ItemCount({ count }: { count: number }) {
  return <p>Found {count} items</p>;
}
```

### Custom Hook Pattern

Encapsulate related state logic in reusable functions.

```tsx
// hooks/useToggle.ts
function useToggle(initialValue = false) {
  const value = signal(initialValue);

  const toggle = () => value.set(!value());
  const setTrue = () => value.set(true);
  const setFalse = () => value.set(false);

  return {
    value,
    toggle,
    setTrue,
    setFalse
  };
}

// hooks/usePagination.ts
function usePagination<T>(items: T[], pageSize = 10) {
  const currentPage = signal(1);

  const totalPages = memo(() =>
    Math.ceil(items.length / pageSize)
  );

  const paginatedItems = memo(() => {
    const start = (currentPage() - 1) * pageSize;
    return items.slice(start, start + pageSize);
  });

  const nextPage = () => {
    if (currentPage() < totalPages()) {
      currentPage.set(currentPage() + 1);
    }
  };

  const prevPage = () => {
    if (currentPage() > 1) {
      currentPage.set(currentPage() - 1);
    }
  };

  const goToPage = (page: number) => {
    const safePage = Math.max(1, Math.min(page, totalPages()));
    currentPage.set(safePage);
  };

  return {
    currentPage,
    totalPages,
    paginatedItems,
    nextPage,
    prevPage,
    goToPage
  };
}

// Usage in component
function ProductList({ products }: { products: Product[] }) {
  const {
    paginatedItems,
    currentPage,
    totalPages,
    nextPage,
    prevPage
  } = usePagination(products, 12);

  return (
    <div>
      <div class="product-grid">
        {() => paginatedItems().map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div class="pagination">
        <button onClick={prevPage} disabled={currentPage() === 1}>
          Previous
        </button>
        <span>Page {currentPage()} of {totalPages()}</span>
        <button onClick={nextPage} disabled={currentPage() === totalPages()}>
          Next
        </button>
      </div>
    </div>
  );
}
```

### Module-Level Shared State

For state shared across unrelated components without context overhead.

```tsx
// state/modal.ts
import { signal } from '@philjs/core';

interface ModalState {
  isOpen: boolean;
  title: string;
  content: string | null;
}

const modalState = signal<ModalState>({
  isOpen: false,
  title: '',
  content: null
});

export const modal = {
  state: modalState,

  open: (title: string, content: string) => {
    modalState.set({
      isOpen: true,
      title,
      content
    });
  },

  close: () => {
    modalState.set({
      isOpen: false,
      title: '',
      content: null
    });
  },

  isOpen: () => modalState().isOpen
};

// Usage in any component
import { modal } from './state/modal';

function ConfirmButton() {
  const handleClick = () => {
    modal.open('Confirm Action', 'Are you sure you want to continue?');
  };

  return <button onClick={handleClick}>Delete</button>;
}

function Modal() {
  const state = modal.state;

  return (
    <>
      {() => state().isOpen && (
        <div class="modal-overlay" onClick={modal.close}>
          <div class="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{state().title}</h2>
            <p>{state().content}</p>
            <button onClick={modal.close}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
```

**Use shared state patterns when:**
- Multiple sibling components need same state
- Parent needs to coordinate children
- State logic is reusable across components
- State doesn't need to be truly global

## Global State with Context

PhilJS provides a powerful Context API for dependency injection and global state management without prop drilling.

### Basic Context Pattern

```tsx
// contexts/ThemeContext.tsx
import { createContext, useContext } from '@philjs/core';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {}
});

export function ThemeProvider({ children }: { children: any }) {
  const theme = signal<Theme>('light');

  const contextValue = {
    theme: theme(),
    setTheme: (newTheme: Theme) => theme.set(newTheme)
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Usage
function App() {
  return (
    <ThemeProvider>
      <Header />
      <MainContent />
    </ThemeProvider>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current: {theme}
    </button>
  );
}
```

### Signal Context Pattern (Reactive)

```tsx
// contexts/UserContext.tsx
import { createSignalContext, signal, memo } from '@philjs/core';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

function createUserContext() {
  const user = signal<User | null>(null);
  const isAuthenticated = memo(() => user() !== null);
  const isAdmin = memo(() => user()?.role === 'admin');

  const login = async (credentials: { email: string; password: string }) => {
    // Simulate API call
    const userData = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }).then(r => r.json());

    user.set(userData);
  };

  const logout = () => {
    user.set(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user()) {
      user.set({ ...user()!, ...updates });
    }
  };

  return {
    user,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    updateProfile
  };
}

const UserContext = createContext(createUserContext());

export function UserProvider({ children }: { children: any }) {
  const userState = createUserContext();

  return (
    <UserContext.Provider value={userState}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

// Usage in components
function Header() {
  const { user, isAuthenticated, logout } = useUser();

  return (
    <header>
      {() => isAuthenticated() ? (
        <>
          <span>Welcome, {user()?.name}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <a href="/login">Login</a>
      )}
    </header>
  );
}

function ProtectedRoute({ children }: { children: any }) {
  const { isAuthenticated } = useUser();

  return (
    <>
      {() => isAuthenticated() ? children : <Navigate to="/login" />}
    </>
  );
}
```

### Multiple Contexts Pattern

```tsx
// contexts/AppContext.tsx
import { combineProviders } from '@philjs/core';
import { UserProvider } from './UserContext';
import { ThemeProvider } from './ThemeContext';
import { NotificationProvider } from './NotificationContext';

export function AppProviders({ children }: { children: any }) {
  const Providers = combineProviders(
    { Provider: UserProvider, value: undefined },
    { Provider: ThemeProvider, value: undefined },
    { Provider: NotificationProvider, value: undefined }
  );

  return <Providers>{children}</Providers>;
}

// Usage
function App() {
  return (
    <AppProviders>
      <Router />
    </AppProviders>
  );
}
```

### Theme Context with CSS Variables

```tsx
// contexts/ThemeContext.tsx
import { createThemeContext, signal, effect } from '@philjs/core';

interface AppTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
}

const lightTheme: AppTheme = {
  primaryColor: '#af4bcc',
  secondaryColor: '#6c5ce7',
  backgroundColor: '#ffffff',
  textColor: '#333333',
  borderRadius: '8px'
};

const darkTheme: AppTheme = {
  primaryColor: '#a29bfe',
  secondaryColor: '#74b9ff',
  backgroundColor: '#1a1a1a',
  textColor: '#e0e0e0',
  borderRadius: '8px'
};

const themeContext = createThemeContext(lightTheme);

export function ThemeProvider({ children }: { children: any }) {
  const isDark = signal(false);
  const currentTheme = memo(() => isDark() ? darkTheme : lightTheme);

  // Apply theme to document
  effect(() => {
    const theme = currentTheme();
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
  });

  const toggleTheme = () => isDark.set(!isDark());

  return (
    <themeContext.ThemeProvider theme={currentTheme()}>
      <div data-theme={isDark() ? 'dark' : 'light'}>
        <button onClick={toggleTheme}>
          Toggle Theme
        </button>
        {children}
      </div>
    </themeContext.ThemeProvider>
  );
}

export const useTheme = themeContext.useTheme;
```

### Global State Store Pattern

State accessible throughout the application without context overhead.

```tsx
// stores/userStore.ts
import { signal, memo } from '@philjs/core';

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

**Use global state when:**
- State needed across many unrelated components
- Deep prop drilling would be cumbersome
- State should persist across routes
- The state is truly application-wide (user, theme, language)

## Store Patterns

### Simple Store

```tsx
// stores/themeStore.ts
import { signal } from '@philjs/core';

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

## State Persistence

State that survives page reloads and browser sessions.

### LocalStorage Persistence

```tsx
// stores/settingsStore.ts
import { signal, effect } from '@philjs/core';

interface Settings {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  fontSize: number;
}

const defaultSettings: Settings = {
  theme: 'light',
  language: 'en',
  notifications: true,
  fontSize: 16
};

function createSettingsStore() {
  // Load from localStorage with error handling
  const loadSettings = (): Settings => {
    try {
      const stored = localStorage.getItem('settings');
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
    return defaultSettings;
  };

  const settings = signal<Settings>(loadSettings());

  // Persist to localStorage with debouncing
  let timeoutId: number | undefined;
  effect(() => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('settings', JSON.stringify(settings()));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    }, 300) as unknown as number;
  });

  const updateSettings = (updates: Partial<Settings>) => {
    settings.set({ ...settings(), ...updates });
  };

  const reset = () => {
    settings.set(defaultSettings);
    localStorage.removeItem('settings');
  };

  return {
    settings,
    updateSettings,
    reset
  };
}

export const settingsStore = createSettingsStore();
```

### Generic Persistent Signal

```tsx
// utils/persistentSignal.ts
import { signal, effect, Signal } from '@philjs/core';

interface PersistOptions<T> {
  key: string;
  storage?: Storage;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  debounce?: number;
}

export function persistentSignal<T>(
  initialValue: T,
  options: PersistOptions<T>
): Signal<T> {
  const {
    key,
    storage = localStorage,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    debounce = 0
  } = options;

  // Load initial value from storage
  const loadValue = (): T => {
    try {
      const stored = storage.getItem(key);
      return stored ? deserialize(stored) : initialValue;
    } catch (error) {
      console.warn(`Failed to load ${key}:`, error);
      return initialValue;
    }
  };

  const sig = signal<T>(loadValue());

  // Persist changes to storage
  let timeoutId: number | undefined;
  effect(() => {
    const value = sig();

    if (debounce > 0) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        try {
          storage.setItem(key, serialize(value));
        } catch (error) {
          console.error(`Failed to save ${key}:`, error);
        }
      }, debounce) as unknown as number;
    } else {
      try {
        storage.setItem(key, serialize(value));
      } catch (error) {
        console.error(`Failed to save ${key}:`, error);
      }
    }
  });

  return sig;
}

// Usage
const theme = persistentSignal<'light' | 'dark'>('light', {
  key: 'app-theme'
});

const recentSearches = persistentSignal<string[]>([], {
  key: 'recent-searches',
  debounce: 500
});

const userPreferences = persistentSignal({
  notifications: true,
  emailDigest: 'weekly',
  timezone: 'UTC'
}, {
  key: 'user-preferences',
  debounce: 1000
});
```

### SessionStorage for Temporary State

```tsx
// stores/formDraftStore.ts
import { signal, effect } from '@philjs/core';

interface FormDraft {
  title: string;
  content: string;
  lastSaved: number;
}

function createFormDraftStore() {
  const loadDraft = (): FormDraft | null => {
    try {
      const stored = sessionStorage.getItem('form-draft');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const draft = signal<FormDraft | null>(loadDraft());

  // Auto-save to sessionStorage
  effect(() => {
    const currentDraft = draft();
    if (currentDraft) {
      sessionStorage.setItem('form-draft', JSON.stringify({
        ...currentDraft,
        lastSaved: Date.now()
      }));
    } else {
      sessionStorage.removeItem('form-draft');
    }
  });

  const saveDraft = (title: string, content: string) => {
    draft.set({ title, content, lastSaved: Date.now() });
  };

  const clearDraft = () => {
    draft.set(null);
  };

  return {
    draft,
    saveDraft,
    clearDraft
  };
}

export const formDraftStore = createFormDraftStore();

// Usage
function BlogPostEditor() {
  const { draft, saveDraft, clearDraft } = formDraftStore;
  const title = signal('');
  const content = signal('');

  // Load draft on mount
  effect(() => {
    const savedDraft = draft();
    if (savedDraft) {
      title.set(savedDraft.title);
      content.set(savedDraft.content);
    }
  });

  // Auto-save every 5 seconds
  effect(() => {
    const interval = setInterval(() => {
      if (title() || content()) {
        saveDraft(title(), content());
      }
    }, 5000);

    return () => clearInterval(interval);
  });

  const handlePublish = () => {
    // Publish post...
    clearDraft(); // Clear after successful publish
  };

  return (
    <form>
      <input
        value={title}
        onInput={(e) => title.set(e.currentTarget.value)}
        placeholder="Post title"
      />
      <textarea
        value={content}
        onInput={(e) => content.set(e.currentTarget.value)}
        placeholder="Write your post..."
      />
      {() => draft() && (
        <p class="draft-status">
          Draft saved at {new Date(draft()!.lastSaved).toLocaleTimeString()}
        </p>
      )}
      <button type="button" onClick={handlePublish}>Publish</button>
    </form>
  );
}
```

### IndexedDB for Large Data

```tsx
// utils/indexedDBStore.ts
import { signal } from '@philjs/core';

class IndexedDBStore<T> {
  private db: IDBDatabase | null = null;
  private readonly dbName: string;
  private readonly storeName: string;

  constructor(dbName: string, storeName: string) {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async get(key: string): Promise<T | undefined> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async set(key: string, value: T): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Usage for offline-first app
interface CachedData {
  products: Product[];
  lastFetch: number;
}

const dbStore = new IndexedDBStore<CachedData>('myapp', 'cache');

function createProductCache() {
  const products = signal<Product[]>([]);
  const loading = signal(true);
  const isStale = signal(false);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const loadProducts = async () => {
    loading.set(true);

    // Try to load from cache
    const cached = await dbStore.get('products');

    if (cached) {
      products.set(cached.products);
      const age = Date.now() - cached.lastFetch;
      isStale.set(age > CACHE_DURATION);
    }

    // Fetch fresh data
    try {
      const freshData = await fetch('/api/products').then(r => r.json());
      products.set(freshData);

      // Update cache
      await dbStore.set('products', {
        products: freshData,
        lastFetch: Date.now()
      });

      isStale.set(false);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Use cached data if available
    } finally {
      loading.set(false);
    }
  };

  return {
    products,
    loading,
    isStale,
    loadProducts
  };
}
```

## State Synchronization

Keeping state synchronized with external sources like WebSockets, Server-Sent Events, or polling.

### WebSocket Synchronization

```tsx
// stores/realtimeStore.ts
import { signal, effect } from '@philjs/core';

interface Message {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
}

function createRealtimeStore() {
  const messages = signal<Message[]>([]);
  const connected = signal(false);
  const error = signal<string | null>(null);
  let ws: WebSocket | null = null;

  const connect = (url: string) => {
    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        connected.set(true);
        error.set(null);
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data) as Message;

        // Add new message to the list
        messages.set([...messages(), message]);
      };

      ws.onerror = (event) => {
        error.set('WebSocket error occurred');
        console.error('WebSocket error:', event);
      };

      ws.onclose = () => {
        connected.set(false);
        console.log('WebSocket disconnected');

        // Auto-reconnect after 3 seconds
        setTimeout(() => {
          if (!connected()) {
            connect(url);
          }
        }, 3000);
      };
    } catch (err) {
      error.set(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  const sendMessage = (text: string, userId: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message: Message = {
        id: crypto.randomUUID(),
        userId,
        text,
        timestamp: Date.now()
      };

      ws.send(JSON.stringify(message));
    } else {
      error.set('Not connected to server');
    }
  };

  const disconnect = () => {
    if (ws) {
      ws.close();
      ws = null;
    }
  };

  return {
    messages,
    connected,
    error,
    connect,
    sendMessage,
    disconnect
  };
}

export const realtimeStore = createRealtimeStore();

// Usage
function ChatRoom() {
  const { messages, connected, sendMessage, connect } = realtimeStore;
  const inputValue = signal('');

  // Connect on mount
  effect(() => {
    connect('wss://api.example.com/chat');
    return () => realtimeStore.disconnect();
  });

  const handleSend = () => {
    if (inputValue().trim()) {
      sendMessage(inputValue(), 'user-123');
      inputValue.set('');
    }
  };

  return (
    <div class="chat-room">
      <div class="connection-status">
        {() => connected() ? 'Connected' : 'Disconnected'}
      </div>

      <div class="messages">
        {() => messages().map(msg => (
          <div key={msg.id} class="message">
            <strong>{msg.userId}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <div class="input-area">
        <input
          value={inputValue}
          onInput={(e) => inputValue.set(e.currentTarget.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
```

### Server-Sent Events (SSE)

```tsx
// stores/notificationStore.ts
import { signal } from '@philjs/core';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

function createNotificationStore() {
  const notifications = signal<Notification[]>([]);
  const connected = signal(false);
  let eventSource: EventSource | null = null;

  const connect = (url: string) => {
    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      connected.set(true);
    };

    eventSource.addEventListener('notification', (event) => {
      const notification = JSON.parse(event.data) as Notification;
      notifications.set([...notifications(), notification]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        remove(notification.id);
      }, 5000);
    });

    eventSource.onerror = () => {
      connected.set(false);
      eventSource?.close();

      // Reconnect after 5 seconds
      setTimeout(() => connect(url), 5000);
    };
  };

  const remove = (id: string) => {
    notifications.set(notifications().filter(n => n.id !== id));
  };

  const clear = () => {
    notifications.set([]);
  };

  const disconnect = () => {
    eventSource?.close();
    eventSource = null;
    connected.set(false);
  };

  return {
    notifications,
    connected,
    connect,
    remove,
    clear,
    disconnect
  };
}

export const notificationStore = createNotificationStore();
```

### Polling Pattern

```tsx
// stores/pollingStore.ts
import { signal, effect } from '@philjs/core';

interface PollingOptions {
  interval: number;
  immediate?: boolean;
}

function createPollingStore<T>(
  fetcher: () => Promise<T>,
  options: PollingOptions
) {
  const { interval, immediate = true } = options;

  const data = signal<T | null>(null);
  const loading = signal(false);
  const error = signal<Error | null>(null);
  const enabled = signal(true);

  let intervalId: number | undefined;

  const fetch = async () => {
    if (!enabled()) return;

    loading.set(true);
    error.set(null);

    try {
      const result = await fetcher();
      data.set(result);
    } catch (err) {
      error.set(err instanceof Error ? err : new Error(String(err)));
    } finally {
      loading.set(false);
    }
  };

  const start = () => {
    enabled.set(true);

    if (immediate) {
      fetch();
    }

    intervalId = setInterval(fetch, interval) as unknown as number;
  };

  const stop = () => {
    enabled.set(false);
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  };

  const refresh = () => {
    fetch();
  };

  return {
    data,
    loading,
    error,
    enabled,
    start,
    stop,
    refresh
  };
}

// Usage: Poll for new orders every 10 seconds
const ordersStore = createPollingStore(
  async () => {
    const response = await fetch('/api/orders/pending');
    return response.json();
  },
  { interval: 10000 }
);

function OrdersMonitor() {
  const { data, loading, start, stop } = ordersStore;

  // Start polling on mount
  effect(() => {
    start();
    return () => stop();
  });

  return (
    <div>
      {() => loading() ? (
        <p>Loading orders...</p>
      ) : (
        <ul>
          {data()?.map((order: any) => (
            <li key={order.id}>{order.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Cross-Tab Synchronization

```tsx
// stores/crossTabStore.ts
import { signal, effect } from '@philjs/core';

interface CrossTabState<T> {
  key: string;
  data: T;
}

function createCrossTabStore<T>(key: string, initialValue: T) {
  const data = signal<T>(initialValue);

  // Load initial value from localStorage
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      data.set(JSON.parse(stored));
    } catch {
      // Invalid data, use initial value
    }
  }

  // Save to localStorage on change
  effect(() => {
    localStorage.setItem(key, JSON.stringify(data()));
  });

  // Listen for changes from other tabs
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === key && event.newValue) {
      try {
        data.set(JSON.parse(event.newValue));
      } catch {
        // Invalid data
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // Cleanup
  effect(() => {
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  });

  return data;
}

// Usage: Synchronize cart across tabs
const cartItems = createCrossTabStore<CartItem[]>('cart', []);

function ShoppingCart() {
  const items = cartItems;

  const addItem = (item: CartItem) => {
    items.set([...items(), item]);
  };

  return (
    <div>
      <h2>Cart ({items().length} items)</h2>
      <ul>
        {() => items().map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### BroadcastChannel API

```tsx
// stores/broadcastStore.ts
import { signal } from '@philjs/core';

interface BroadcastMessage<T> {
  type: string;
  payload: T;
}

function createBroadcastStore<T>(channelName: string) {
  const data = signal<T | null>(null);
  const channel = new BroadcastChannel(channelName);

  channel.onmessage = (event: MessageEvent<BroadcastMessage<T>>) => {
    const { type, payload } = event.data;

    if (type === 'update') {
      data.set(payload);
    }
  };

  const broadcast = (payload: T) => {
    data.set(payload);
    channel.postMessage({ type: 'update', payload });
  };

  const close = () => {
    channel.close();
  };

  return {
    data,
    broadcast,
    close
  };
}

// Usage: Sync authentication across tabs
const authStore = createBroadcastStore<User | null>('auth');

function logout() {
  // This will log out all tabs
  authStore.broadcast(null);
}
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
import { batch } from '@philjs/core';

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

### Decision Tree: Choosing the Right Pattern

```
Is the state only needed in one component?
  └─ Yes → Use local component state (signal)

Is the state shared between parent and children?
  └─ Yes → Use lifted state (props) or custom hooks

Is the state needed across unrelated components?
  ├─ Few components → Use module-level shared state
  └─ Many components → Use Context API or global store

Does the state need to persist?
  ├─ Between sessions → Use localStorage persistence
  ├─ Within session → Use sessionStorage
  └─ Large data → Use IndexedDB

Does the state sync with external sources?
  ├─ Real-time → Use WebSocket synchronization
  ├─ Updates only → Use Server-Sent Events
  ├─ Periodic → Use polling pattern
  └─ Cross-tab → Use BroadcastChannel or storage events

Is the state complex with many transitions?
  └─ Yes → Consider state machines

Does the state need history?
  └─ Yes → Implement undo/redo pattern
```

### Best Practices Summary

**State Organization:**
- Keep state as local as possible
- Lift state only as high as necessary
- Use stores for truly global state
- Compose stores instead of creating monoliths
- Group related state together

**Performance:**
- Batch related updates with `batch()`
- Use `memo()` for expensive computations
- Avoid unnecessary object creation in updates
- Use `untrack()` to break unwanted dependencies
- Debounce persistence operations

**Patterns:**
- Implement async patterns correctly with loading/error states
- Use optimistic updates for better UX
- Consider state machines for complex flows
- Use context for dependency injection
- Create custom hooks for reusable state logic

**Persistence:**
- Persist state when needed (settings, preferences)
- Handle errors gracefully in storage operations
- Use appropriate storage mechanism (localStorage, sessionStorage, IndexedDB)
- Implement cross-tab synchronization for shared state

**Synchronization:**
- Use WebSockets for real-time bi-directional communication
- Use SSE for server-push updates
- Implement polling for periodic updates
- Handle connection failures and reconnection
- Clean up resources properly

**Common Pitfalls to Avoid:**

❌ Storing everything in global state
❌ Creating deeply nested state objects
❌ Forgetting to handle async errors
❌ Not batching related updates
❌ Mutating state directly instead of using `.set()`
❌ Overusing context (creates indirection)
❌ Not cleaning up effects and subscriptions
❌ Synchronous persistence operations without debouncing

**Key Takeaways:**

1. **Signals are your foundation** - Start with local signals and scale up as needed
2. **Memo for derived state** - Use `memo()` for computed values that depend on other signals
3. **Effects for side effects** - Use `effect()` for subscriptions, DOM manipulation, and persistence
4. **Context for dependency injection** - Use Context API when you need to avoid prop drilling
5. **Stores for application state** - Create stores for complex, shared application state
6. **Choose the right persistence** - Match persistence mechanism to your data size and requirements
7. **Handle async properly** - Always track loading and error states for async operations
8. **Clean up resources** - Return cleanup functions from effects

**Next Steps:**

- [Performance Optimization →](./performance.md)
- [Testing State Management →](./testing.md)
- [Async Patterns →](./async-patterns.md)

**Related Documentation:**

- [Signals API Reference](/api/signals)
- [Context API Reference](/api/context)
- [Effect API Reference](/api/effects)
- [Store Examples](/examples/stores)
