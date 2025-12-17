# Context

Context provides a way to share data across the component tree without passing props through every level. It's perfect for themes, user data, localization, and other "global" state.

## Creating Context

```tsx
import { createContext, useContext } from 'philjs-core';

// Create a context with a default value
const ThemeContext = createContext<'light' | 'dark'>('light');

// Provider component sets the value
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Header />
      <Main />
      <Footer />
    </ThemeContext.Provider>
  );
}

// Consumer components access the value
function Header() {
  const theme = useContext(ThemeContext);
  return (
    <header class={`theme-${theme}`}>
      Header - Theme is {theme}
    </header>
  );
}
```

## Signal Context

For reactive context values, use `createSignalContext`:

```tsx playground
import { signal, createSignalContext, useContext } from 'philjs-core';

// Create context with a signal value
const CountContext = createSignalContext(0);

function Counter() {
  const count = useContext(CountContext);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}

function App() {
  const count = signal(10);

  return (
    <CountContext.Provider value={count}>
      <Counter />
      <Counter /> {/* Both share the same count */}
    </CountContext.Provider>
  );
}
```

## Theme Context Example

A complete theme system with context:

```tsx
import { signal, createContext, useContext, effect } from 'philjs-core';

// Type definitions
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: () => Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: () => 'light' | 'dark';
}

// Create context
const ThemeContext = createContext<ThemeContextType | null>(null);

// Provider component
function ThemeProvider({ children }: { children: any }) {
  const theme = signal<Theme>('system');

  // Resolve 'system' to actual theme
  const resolvedTheme = memo(() => {
    const t = theme();
    if (t !== 'system') return t;

    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  // Apply theme to document
  effect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme());
  });

  // Persist preference
  effect(() => {
    localStorage.setItem('theme', theme());
  });

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme: theme.set,
      resolvedTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Usage
function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <select value={theme()} onChange={e => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
```

## Authentication Context Example

```tsx
import { signal, createContext, useContext, effect } from 'philjs-core';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: () => User | null;
  isAuthenticated: () => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: { children: any }) {
  const user = signal<User | null>(null);
  const loading = signal(true);

  // Check for existing session on mount
  effect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => user.set(data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => loading.set(false));
    } else {
      loading.set(false);
    }
  });

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    localStorage.setItem('token', data.token);
    user.set(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    user.set(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: memo(() => user() !== null),
      login,
      logout,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## Combining Multiple Providers

Use `combineProviders` for cleaner nesting:

```tsx
import { combineProviders } from 'philjs-core';

// Without combineProviders - deeply nested
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <I18nProvider>
          <RouterProvider>
            <Content />
          </RouterProvider>
        </I18nProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// With combineProviders - flat
const Providers = combineProviders(
  ThemeProvider,
  AuthProvider,
  I18nProvider,
  RouterProvider
);

function App() {
  return (
    <Providers>
      <Content />
    </Providers>
  );
}
```

## Built-in Theme Context

PhilJS provides a ready-to-use theme context:

```tsx
import { createThemeContext } from 'philjs-core';

const { ThemeProvider, useTheme, ThemeToggle } = createThemeContext({
  defaultTheme: 'system',
  storageKey: 'app-theme',
});

function App() {
  return (
    <ThemeProvider>
      <Header>
        <ThemeToggle />
      </Header>
      <Main />
    </ThemeProvider>
  );
}
```

## Context Best Practices

### 1. Provide Default Values

```tsx
// Good - has sensible default
const ThemeContext = createContext('light');

// Better - makes it clear context is required
const AuthContext = createContext<AuthContextType | null>(null);

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is required');
  return context;
}
```

### 2. Split Contexts by Update Frequency

```tsx
// Bad - everything updates together
const AppContext = createContext({
  user: { /* ... */ },
  theme: 'light',
  notifications: [],
});

// Good - separate concerns
const UserContext = createContext(null);
const ThemeContext = createContext('light');
const NotificationContext = createContext([]);
```

### 3. Co-locate Context with Domain

```tsx
// auth/AuthContext.tsx
export const AuthContext = createContext(null);
export const AuthProvider = /* ... */;
export const useAuth = /* ... */;

// theme/ThemeContext.tsx
export const ThemeContext = createContext('light');
export const ThemeProvider = /* ... */;
export const useTheme = /* ... */;
```

### 4. Use Memos for Derived Context Values

```tsx
function AuthProvider({ children }) {
  const user = signal(null);

  // Memoize derived values
  const isAdmin = memo(() => user()?.role === 'admin');
  const permissions = memo(() => user()?.permissions ?? []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, permissions }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## Next Steps

- [Forms](/docs/learn/forms) - Form handling
- [Error Boundaries](/docs/learn/error-boundaries) - Error handling
- [Lifecycle](/docs/learn/lifecycle) - Component lifecycle
