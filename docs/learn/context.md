# Context for Sharing State

Context lets you pass data through the component tree without prop drilling. Perfect for themes, auth, i18n, and global state.

## What You'll Learn

- What context is and when to use it
- Creating and providing context
- Consuming context in components
- Context with signals for reactivity
- Best practices and patterns

## The Problem: Prop Drilling

Without context, passing data deep requires "prop drilling":

```typescript
function App() {
  const theme = signal('light');

  return <Layout theme={theme} />;
}

function Layout({ theme }: { theme: Signal<string> }) {
  return <Header theme={theme} />;
}

function Header({ theme }: { theme: Signal<string> }) {
  return <UserMenu theme={theme} />;
}

function UserMenu({ theme }: { theme: Signal<string> }) {
  return <Avatar theme={theme} />;
}

function Avatar({ theme }: { theme: Signal<string> }) {
  // Finally using it 4 levels deep!
  return <div style={{ background: theme() === 'dark' ? '#333' : '#fff' }}>...</div>;
}
```

**Problems:**
- Verbose - every component needs the prop
- Fragile - adding intermediate components is painful
- Unclear - hard to see what components actually use the data

## The Solution: Context

Context lets you provide data at the top and consume it anywhere below:

```typescript
import { createContext, useContext } from 'philjs-core';

// 1. Create context
const ThemeContext = createContext<Signal<string>>();

// 2. Provide value
function App() {
  const theme = signal('light');

  return (
    <ThemeContext.Provider value={theme}>
      <Layout />
    </ThemeContext.Provider>
  );
}

// 3. Consume anywhere
function Avatar() {
  const theme = useContext(ThemeContext);
  return <div style={{ background: theme() === 'dark' ? '#333' : '#fff' }}>...</div>;
}
```

No prop drilling! Intermediate components don't need to know about `theme`.

## Creating Context

Use `createContext()` to create a context:

```typescript
import { createContext } from 'philjs-core';

// Basic context
const ThemeContext = createContext<'light' | 'dark'>();

// Context with signal
const UserContext = createContext<Signal<User | null>>();

// Context with default value
const LanguageContext = createContext<string>('en');

// Context with complex type
interface AppState {
  user: Signal<User | null>;
  theme: Signal<'light' | 'dark'>;
  notifications: Signal<Notification[]>;
}

const AppContext = createContext<AppState>();
```

### TypeScript Types

Always type your context:

```typescript
interface Theme {
  mode: 'light' | 'dark';
  primary: string;
  secondary: string;
}

const ThemeContext = createContext<Signal<Theme>>();

// Or with helper type
type ThemeContextType = Signal<Theme>;
const ThemeContext = createContext<ThemeContextType>();
```

## Providing Context

Use `Provider` to make context available to children:

```typescript
function App() {
  const theme = signal<'light' | 'dark'>('light');

  return (
    <ThemeContext.Provider value={theme}>
      <Layout />
      <Content />
      <Footer />
    </ThemeContext.Provider>
  );
}
```

### Multiple Providers

```typescript
function App() {
  const user = signal<User | null>(null);
  const theme = signal<'light' | 'dark'>('light');
  const language = signal<string>('en');

  return (
    <UserContext.Provider value={user}>
      <ThemeContext.Provider value={theme}>
        <LanguageContext.Provider value={language}>
          <AppLayout />
        </LanguageContext.Provider>
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}
```

### Nested Providers

Providers can be nested, with inner values overriding outer:

```typescript
function App() {
  const theme = signal('light');

  return (
    <ThemeContext.Provider value={theme}>
      <MainContent />

      {/* This section has its own theme */}
      <ThemeContext.Provider value={signal('dark')}>
        <SidePanel />
      </ThemeContext.Provider>
    </ThemeContext.Provider>
  );
}
```

## Consuming Context

Use `useContext()` to read context values:

```typescript
import { useContext } from 'philjs-core';

function ThemedButton() {
  const theme = useContext(ThemeContext);

  return (
    <button
      style={{
        background: theme() === 'dark' ? '#444' : '#eee',
        color: theme() === 'dark' ? '#fff' : '#000'
      }}
    >
      Click me
    </button>
  );
}
```

### With TypeScript

```typescript
function UserProfile() {
  const user = useContext(UserContext);

  // TypeScript knows user is Signal<User | null>
  if (!user()) {
    return <Login />;
  }

  return <div>Welcome, {user()!.name}</div>;
}
```

### Error if No Provider

```typescript
// ❌ Error if context not provided
const theme = useContext(ThemeContext);

// ✅ Provide default or check
const ThemeContext = createContext<Signal<string> | null>(null);

function ThemedButton() {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error('ThemedButton must be used within ThemeProvider');
  }

  return <button style={{ color: theme() }}>Click</button>;
}
```

## Context with Signals

Signals in context enable reactive updates:

```typescript
// Create context with signal
const CountContext = createContext<Signal<number>>();

function CountProvider({ children }: { children: any }) {
  const count = signal(0);

  return (
    <CountContext.Provider value={count}>
      {children}
    </CountContext.Provider>
  );
}

// All these components react to count changes!
function Display() {
  const count = useContext(CountContext);
  return <div>Count: {count()}</div>;
}

function Controls() {
  const count = useContext(CountContext);
  return (
    <div>
      <button onClick={() => count.set(c => c + 1)}>+</button>
      <button onClick={() => count.set(c => c - 1)}>-</button>
    </div>
  );
}
```

## Common Patterns

### Theme Context

```typescript
interface Theme {
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
}

const ThemeContext = createContext<{
  theme: Signal<Theme>;
  toggleTheme: () => void;
}>();

function ThemeProvider({ children }: { children: any }) {
  const theme = signal<Theme>({
    mode: 'light',
    colors: {
      primary: '#667eea',
      secondary: '#764ba2',
      background: '#ffffff',
      text: '#000000'
    }
  });

  const toggleTheme = () => {
    theme.set(current => ({
      ...current,
      mode: current.mode === 'light' ? 'dark' : 'light',
      colors: current.mode === 'light'
        ? { primary: '#667eea', secondary: '#764ba2', background: '#1a1a1a', text: '#ffffff' }
        : { primary: '#667eea', secondary: '#764ba2', background: '#ffffff', text: '#000000' }
    }));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Usage
function Header() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <header style={{ background: theme().colors.background, color: theme().colors.text }}>
      <button onClick={toggleTheme}>
        Switch to {theme().mode === 'light' ? 'dark' : 'light'} mode
      </button>
    </header>
  );
}
```

### Auth Context

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: Signal<User | null>;
  isAuthenticated: Memo<boolean>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>();

function AuthProvider({ children }: { children: any }) {
  const user = signal<User | null>(null);
  const isAuthenticated = memo(() => user() !== null);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    user.set(data.user);
  };

  const logout = () => {
    user.set(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Usage
function UserMenu() {
  const { user, logout } = useContext(AuthContext);

  if (!user()) return <LoginButton />;

  return (
    <div>
      <span>Welcome, {user()!.name}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### I18n Context

```typescript
type Language = 'en' | 'es' | 'fr';

interface Translations {
  [key: string]: string;
}

interface I18nContextType {
  language: Signal<Language>;
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType>();

const translations: Record<Language, Translations> = {
  en: {
    'welcome': 'Welcome',
    'logout': 'Logout'
  },
  es: {
    'welcome': 'Bienvenido',
    'logout': 'Cerrar sesión'
  },
  fr: {
    'welcome': 'Bienvenue',
    'logout': 'Se déconnecter'
  }
};

function I18nProvider({ children }: { children: any }) {
  const language = signal<Language>('en');

  const t = (key: string) => {
    return translations[language()][key] || key;
  };

  const setLanguage = (lang: Language) => {
    language.set(lang);
  };

  return (
    <I18nContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

// Usage
function Greeting() {
  const { t } = useContext(I18nContext);
  return <h1>{t('welcome')}</h1>;
}
```

### App State Context

```typescript
interface AppState {
  user: User | null;
  notifications: Notification[];
  settings: Settings;
}

interface AppContextType {
  state: Signal<AppState>;
  updateUser: (user: User) => void;
  addNotification: (notification: Notification) => void;
  updateSettings: (settings: Partial<Settings>) => void;
}

const AppContext = createContext<AppContextType>();

function AppProvider({ children }: { children: any }) {
  const state = signal<AppState>({
    user: null,
    notifications: [],
    settings: { theme: 'light', language: 'en' }
  });

  const updateUser = (user: User) => {
    state.set(s => ({ ...s, user }));
  };

  const addNotification = (notification: Notification) => {
    state.set(s => ({
      ...s,
      notifications: [...s.notifications, notification]
    }));
  };

  const updateSettings = (updates: Partial<Settings>) => {
    state.set(s => ({
      ...s,
      settings: { ...s.settings, ...updates }
    }));
  };

  return (
    <AppContext.Provider value={{ state, updateUser, addNotification, updateSettings }}>
      {children}
    </AppContext.Provider>
  );
}
```

## Custom Context Hooks

Create custom hooks for cleaner consumption:

```typescript
// Define context
const ThemeContext = createContext<Signal<'light' | 'dark'> | null>(null);

// Custom hook
export function useTheme() {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return theme;
}

// Usage - cleaner!
function Button() {
  const theme = useTheme(); // No null check needed
  return <button style={{ color: theme() }}>Click</button>;
}
```

### With Additional Logic

```typescript
export function useAuth() {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  // Add derived values
  const isAdmin = memo(() =>
    auth.user()?.role === 'admin'
  );

  return {
    ...auth,
    isAdmin
  };
}

// Usage
function AdminPanel() {
  const { isAdmin } = useAuth();

  if (!isAdmin()) {
    return <AccessDenied />;
  }

  return <AdminDashboard />;
}
```

## Best Practices

### Keep Context Focused

```typescript
// ❌ Too broad - everything in one context
const MegaContext = createContext<{
  user: Signal<User>;
  theme: Signal<Theme>;
  language: Signal<string>;
  cart: Signal<Cart>;
  notifications: Signal<Notification[]>;
  // ... 20 more things
}>();

// ✅ Focused contexts
const UserContext = createContext<Signal<User>>();
const ThemeContext = createContext<Signal<Theme>>();
const CartContext = createContext<Signal<Cart>>();
```

### Combine Related State

```typescript
// ✅ Good - related state together
interface ThemeContextType {
  theme: Signal<Theme>;
  toggleTheme: () => void;
  isDark: Memo<boolean>;
}
```

### Provide Near Where Used

```typescript
// ❌ Unnecessary - modal context at app root
function App() {
  return (
    <ModalContext.Provider>
      {/* Modal only used in Settings */}
      <Layout />
    </ModalContext.Provider>
  );
}

// ✅ Better - provide where needed
function Settings() {
  return (
    <ModalContext.Provider>
      <SettingsContent />
    </ModalContext.Provider>
  );
}
```

## Performance Tips

### Signals Prevent Re-renders

```typescript
// ✅ Only components reading specific values update
const AppContext = createContext<{
  user: Signal<User>;
  theme: Signal<Theme>;
}>();

// This component only updates when theme changes
function ThemeToggle() {
  const { theme } = useContext(AppContext);
  return <button>{theme().mode}</button>;
}

// This component only updates when user changes
function UserName() {
  const { user } = useContext(AppContext);
  return <span>{user().name}</span>;
}
```

### Memoize Context Values

```typescript
// ❌ Creates new object on every render
function ThemeProvider({ children }) {
  const theme = signal('light');

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ✅ Stable values
function ThemeProvider({ children }) {
  const theme = signal('light');

  const toggle = () => theme.set(t => t === 'light' ? 'dark' : 'light');

  const value = { theme, toggle }; // Stable object

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
```

## Common Mistakes

### Not Providing Context

```typescript
// ❌ No provider - useContext will fail
function App() {
  return <ThemeToggle />;
}

function ThemeToggle() {
  const theme = useContext(ThemeContext); // Error!
  return <button>{theme()}</button>;
}

// ✅ With provider
function App() {
  const theme = signal('light');
  return (
    <ThemeContext.Provider value={theme}>
      <ThemeToggle />
    </ThemeContext.Provider>
  );
}
```

### Overusing Context

```typescript
// ❌ Context for everything - overkill
const ButtonVariantContext = createContext();
const ButtonSizeContext = createContext();

// ✅ Just use props
<Button variant="primary" size="large">Click</Button>
```

### Creating New Context Values on Render

```typescript
// ❌ New object every render
function Provider({ children }) {
  return (
    <Ctx.Provider value={{ count: signal(0) }}>
      {children}
    </Ctx.Provider>
  );
}

// ✅ Stable value
function Provider({ children }) {
  const count = signal(0);
  return (
    <Ctx.Provider value={{ count }}>
      {children}
    </Ctx.Provider>
  );
}
```

## When to Use Context

### ✅ Use Context For:

- Theme (light/dark mode)
- Authentication and user info
- Internationalization (i18n)
- Global app state
- Router state
- Feature flags
- Configuration

### ❌ Don't Use Context For:

- Passing props one level down
- Frequently changing values (use signals)
- Component-specific state
- Everything (avoid context soup)

## Summary

You've learned:

✅ Context shares data without prop drilling
✅ Create with `createContext<Type>()`
✅ Provide with `<Context.Provider value={value}>`
✅ Consume with `useContext(Context)`
✅ Combine context with signals for reactivity
✅ Keep contexts focused and near where used
✅ Create custom hooks for cleaner consumption

Context is perfect for global state that many components need!

---

**Next:** [Event Handling →](./event-handling.md) Learn how to handle user interactions
