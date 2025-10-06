# Context API

Share data across component tree without prop drilling.

## createContext()

Creates a context object for dependency injection.

### Signature

```typescript
function createContext<T>(defaultValue?: T): Context<T>

interface Context<T> {
  Provider: Component<{ value: T; children: JSX.Element }>;
}
```

### Parameters

- **defaultValue**: `T` - Default value when no provider is found (optional)

### Returns

A context object with a `Provider` component

### Examples

#### Basic Context

```typescript
import { createContext } from 'philjs-core';

const ThemeContext = createContext<'light' | 'dark'>('light');

function App() {
  const theme = signal<'light' | 'dark'>('dark');

  return (
    <ThemeContext.Provider value={theme()}>
      <Layout />
    </ThemeContext.Provider>
  );
}
```

#### Without Default Value

```typescript
interface User {
  id: string;
  name: string;
}

const UserContext = createContext<User | null>(null);

function App() {
  const user = signal<User | null>(null);

  return (
    <UserContext.Provider value={user()}>
      <Dashboard />
    </UserContext.Provider>
  );
}
```

### Notes

- Contexts can hold any value type
- Default value used when no provider found
- Create contexts outside components
- One context can have multiple providers

---

## useContext()

Accesses the nearest context value from a provider.

### Signature

```typescript
function useContext<T>(context: Context<T>): T
```

### Parameters

- **context**: `Context<T>` - The context to read from

### Returns

The current context value from the nearest provider

### Examples

#### Basic Usage

```typescript
const ThemeContext = createContext<'light' | 'dark'>('light');

function ThemedButton() {
  const theme = useContext(ThemeContext);

  return (
    <button className={`btn-${theme}`}>
      Themed Button
    </button>
  );
}
```

#### With Type Safety

```typescript
interface AuthContext {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContext | null>(null);

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

// Usage
function Profile() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

#### Multiple Contexts

```typescript
function Component() {
  const theme = useContext(ThemeContext);
  const user = useContext(UserContext);
  const locale = useContext(LocaleContext);

  return (
    <div className={theme}>
      Welcome, {user.name} ({locale})
    </div>
  );
}
```

### Notes

- Must be called inside a component
- Returns value from nearest provider
- Throws if context not found (without default)
- Re-renders when context value changes

---

## Context Patterns

### Provider Component Pattern

```typescript
interface ThemeContextValue {
  theme: () => 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: JSX.Element }) {
  const theme = signal<'light' | 'dark'>('light');

  const value: ThemeContextValue = {
    theme,
    setTheme: theme.set
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}

// Usage
function App() {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
}

function Dashboard() {
  const { theme, setTheme } = useTheme();

  return (
    <div className={theme()}>
      <button onClick={() => setTheme('dark')}>
        Dark Mode
      </button>
    </div>
  );
}
```

### Nested Providers

```typescript
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <I18nProvider>
          <Router>
            <Routes />
          </Router>
        </I18nProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
```

### Conditional Providers

```typescript
function App() {
  const isAuthenticated = signal(false);

  return (
    <div>
      {isAuthenticated() ? (
        <AuthContext.Provider value={authenticatedUser()}>
          <Dashboard />
        </AuthContext.Provider>
      ) : (
        <Login />
      )}
    </div>
  );
}
```

### Context with Reducers

```typescript
interface State {
  count: number;
  user: User | null;
}

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setUser'; user: User };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 };
    case 'decrement':
      return { ...state, count: state.count - 1 };
    case 'setUser':
      return { ...state, user: action.user };
    default:
      return state;
  }
}

interface StoreContextValue {
  state: () => State;
  dispatch: (action: Action) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: JSX.Element }) {
  const state = signal<State>({ count: 0, user: null });

  const dispatch = (action: Action) => {
    state.set(reducer(state(), action));
  };

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }

  return context;
}

// Usage
function Counter() {
  const { state, dispatch } = useStore();

  return (
    <div>
      <p>Count: {state().count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>
        +
      </button>
      <button onClick={() => dispatch({ type: 'decrement' })}>
        -
      </button>
    </div>
  );
}
```

---

## Performance Optimization

### Memoize Context Values

```typescript
// ❌ Creates new object every render
function ThemeProvider({ children }: { children: JSX.Element }) {
  const theme = signal('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme: theme.set }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ✅ Stable object reference
function ThemeProvider({ children }: { children: JSX.Element }) {
  const theme = signal('light');

  const value = {
    theme,
    setTheme: theme.set
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Split Contexts

```typescript
// ❌ Single large context causes unnecessary re-renders
interface AppContext {
  theme: 'light' | 'dark';
  user: User;
  settings: Settings;
  notifications: Notification[];
}

// ✅ Separate contexts for independent data
const ThemeContext = createContext<'light' | 'dark'>('light');
const UserContext = createContext<User | null>(null);
const SettingsContext = createContext<Settings>({});
const NotificationsContext = createContext<Notification[]>([]);
```

### Selective Context Consumption

```typescript
// Only access what you need
function Component() {
  const { user } = useAuth(); // Only re-renders when user changes

  return <div>{user.name}</div>;
}
```

---

## Best Practices

### Type-Safe Contexts

```typescript
// ✅ Strong typing
interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
```

### Custom Hooks for Contexts

```typescript
// ✅ Encapsulate context logic
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
```

### Provide Default Values

```typescript
// ✅ Default prevents errors
const ThemeContext = createContext<'light' | 'dark'>('light');

// ❌ Requires null checks everywhere
const ThemeContext = createContext<'light' | 'dark' | null>(null);
```

### Keep Context Focused

```typescript
// ✅ Single responsibility
const ThemeContext = createContext<Theme>();
const AuthContext = createContext<Auth>();

// ❌ Too much in one context
const AppContext = createContext<{
  theme: Theme;
  auth: Auth;
  router: Router;
  // ...
}>();
```

---

## Common Patterns

### Auth Context

```typescript
interface AuthContextValue {
  user: () => User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: JSX.Element }) {
  const user = signal<User | null>(null);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    const userData = await response.json();
    user.set(userData);
  };

  const logout = () => {
    user.set(null);
  };

  const isAuthenticated = () => user() !== null;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Theme Context

```typescript
type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: () => Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: JSX.Element }) {
  const theme = signal<Theme>('light');

  const toggleTheme = () => {
    theme.set(theme() === 'light' ? 'dark' : 'light');
  };

  effect(() => {
    document.body.className = theme();
  });

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### I18n Context

```typescript
interface I18nContextValue {
  locale: () => string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: JSX.Element }) {
  const locale = signal('en');

  const t = (key: string): string => {
    return translations[locale()][key] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: locale.set, t }}>
      {children}
    </I18nContext.Provider>
  );
}
```

---

**Next:** [Router API →](./router.md) Client-side routing
