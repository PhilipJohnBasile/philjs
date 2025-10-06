# TypeScript with PhilJS

PhilJS is built from the ground up with TypeScript, providing exceptional type safety and developer experience. This guide covers everything you need to know about using TypeScript with PhilJS.

## Why TypeScript with PhilJS?

TypeScript with PhilJS gives you:

- **Automatic type inference**: Types are inferred without manual annotations
- **Full IDE support**: Autocomplete, refactoring, and error detection
- **Catch bugs early**: Type errors at compile time, not runtime
- **Self-documenting code**: Types serve as inline documentation
- **Safer refactoring**: Change code with confidence

```tsx
import { signal } from 'philjs-core';

function Counter() {
  // TypeScript knows count is Signal<number>
  const count = signal(0);

  // ✅ Type-safe
  count.set(5);

  // ❌ Type error: Argument of type 'string' is not assignable
  // count.set('hello');

  return <button onClick={() => count.set(count() + 1)}>
    Count: {count()}
  </button>;
}
```

## Component Types

### Basic Component Props

```tsx
// Define props interface
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      class={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
}

// TypeScript ensures correct usage
<Button label="Click me" onClick={() => console.log('clicked')} />

// ❌ Error: Property 'onClick' is missing
// <Button label="Click me" />
```

### Generic Components

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => JSX.Element;
  keyExtractor: (item: T) => string | number;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

// Usage with full type safety
interface User {
  id: number;
  name: string;
}

<List<User>
  items={users}
  renderItem={(user) => <span>{user.name}</span>}
  keyExtractor={(user) => user.id}
/>
```

### Component with Children

```tsx
import { JSX } from 'philjs-core';

interface CardProps {
  title: string;
  children: JSX.Element;
}

function Card({ title, children }: CardProps) {
  return (
    <div class="card">
      <h2>{title}</h2>
      <div class="card-body">
        {children}
      </div>
    </div>
  );
}

// Usage
<Card title="My Card">
  <p>This is the card content</p>
</Card>
```

## Signal Types

### Basic Signals

```tsx
import { signal, Signal } from 'philjs-core';

// Explicit type annotation
const count: Signal<number> = signal(0);

// Type inference (preferred)
const name = signal('Alice'); // Signal<string>
const isActive = signal(true); // Signal<boolean>

// Union types
const status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');

// Complex types
interface User {
  id: number;
  name: string;
  email: string;
}

const user = signal<User | null>(null);
```

### Readonly Signals

```tsx
import { signal, Signal, ReadonlySignal } from 'philjs-core';

function useCounter() {
  const count = signal(0);

  // Return readonly signal to prevent external modifications
  return {
    count: count as ReadonlySignal<number>,
    increment: () => count.set(count() + 1)
  };
}

// Usage
const { count, increment } = useCounter();
console.log(count()); // ✅ OK
// count.set(5); // ❌ Error: Property 'set' does not exist
increment(); // ✅ OK
```

### Array and Object Signals

```tsx
import { signal } from 'philjs-core';

// Array signal
const todos = signal<Array<{
  id: number;
  text: string;
  completed: boolean;
}>>([]);

// Add item with type safety
todos.set([
  ...todos(),
  { id: 1, text: 'Learn PhilJS', completed: false }
]);

// Object signal
interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

const appState = signal<AppState>({
  user: null,
  theme: 'light',
  notifications: []
});

// Update with type checking
appState.set({
  ...appState(),
  theme: 'dark'
});
```

## Memo Types

Memos automatically infer their return type from the computation:

```tsx
import { signal, memo } from 'philjs-core';

const count = signal(10);

// Type is Memo<number>
const doubled = memo(() => count() * 2);

// Type is Memo<string>
const message = memo(() => {
  const c = count();
  return c > 5 ? 'High' : 'Low';
});

// Complex derived state
interface User {
  firstName: string;
  lastName: string;
}

const user = signal<User>({ firstName: 'John', lastName: 'Doe' });

// Type is Memo<string>
const fullName = memo(() => {
  const u = user();
  return `${u.firstName} ${u.lastName}`;
});
```

## Effect Types

Effects don't return values, so type safety focuses on dependencies:

```tsx
import { signal, effect } from 'philjs-core';

const userId = signal<number | null>(null);
const userData = signal<User | null>(null);

effect(() => {
  const id = userId();

  // TypeScript knows id is number | null
  if (id === null) return;

  // Type-safe API call
  fetchUser(id).then((user: User) => {
    userData.set(user);
  });
});
```

## Event Handler Types

PhilJS provides proper types for all DOM events:

```tsx
import { signal } from 'philjs-core';

function Form() {
  const email = signal('');

  // Typed event handlers
  const handleInput = (e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    email.set(target.value);
  };

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    console.log('Email:', email());
  };

  const handleClick = (e: MouseEvent) => {
    console.log('Clicked at', e.clientX, e.clientY);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email()}
        onInput={handleInput}
      />
      <button onClick={handleClick}>Submit</button>
    </form>
  );
}
```

### Inline Event Handlers

```tsx
function Counter() {
  const count = signal(0);

  return (
    <div>
      {/* TypeScript infers event type */}
      <button onClick={(e) => {
        // e is MouseEvent
        console.log(e.clientX);
        count.set(count() + 1);
      }}>
        Increment
      </button>
    </div>
  );
}
```

## Ref Types

Type refs based on the element they reference:

```tsx
import { signal } from 'philjs-core';

function VideoPlayer() {
  let videoRef: HTMLVideoElement | undefined;

  const play = () => {
    videoRef?.play();
  };

  const pause = () => {
    videoRef?.pause();
  };

  return (
    <div>
      <video ref={videoRef} src="video.mp4" />
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
    </div>
  );
}
```

### Generic Ref Helper

```tsx
function useRef<T>() {
  let ref: T | undefined;

  return {
    get: () => ref,
    set: (element: T) => { ref = element; }
  };
}

// Usage
const inputRef = useRef<HTMLInputElement>();

<input ref={(el) => inputRef.set(el)} />
```

## Context Types

Type-safe context with generic helpers:

```tsx
import { createContext, useContext } from 'philjs-core';

// Define context value type
interface ThemeContextValue {
  theme: Signal<'light' | 'dark'>;
  toggleTheme: () => void;
}

// Create typed context
const ThemeContext = createContext<ThemeContextValue>();

// Provider component
function ThemeProvider(props: { children: JSX.Element }) {
  const theme = signal<'light' | 'dark'>('light');

  const toggleTheme = () => {
    theme.set(theme() === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
}

// Consumer component
function ThemedButton() {
  // TypeScript knows the exact type
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      class={`btn-${theme()}`}
    >
      Toggle Theme
    </button>
  );
}
```

## Async Types

Handle async operations with proper typing:

```tsx
import { signal } from 'philjs-core';

// Async data fetching
async function fetchUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  return response.json();
}

function UserList() {
  const users = signal<User[]>([]);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const loadUsers = async () => {
    loading.set(true);
    error.set(null);

    try {
      const data = await fetchUsers();
      users.set(data);
    } catch (err) {
      error.set(err as Error);
    } finally {
      loading.set(false);
    }
  };

  return (
    <div>
      <button onClick={loadUsers}>Load Users</button>
      {loading() && <p>Loading...</p>}
      {error() && <p>Error: {error()!.message}</p>}
      <ul>
        {users().map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Form Types

Type-safe form handling:

```tsx
import { signal } from 'philjs-core';

interface LoginForm {
  email: string;
  password: string;
}

function LoginForm() {
  const formData = signal<LoginForm>({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    const data = formData();

    // TypeScript knows data has email and password
    const result = await login(data.email, data.password);

    if (result.success) {
      console.log('Logged in!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData().email}
        onInput={(e) => formData.set({
          ...formData(),
          email: (e.target as HTMLInputElement).value
        })}
      />
      <input
        type="password"
        value={formData().password}
        onInput={(e) => formData.set({
          ...formData(),
          password: (e.target as HTMLInputElement).value
        })}
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

## Advanced Patterns

### Discriminated Unions

```tsx
import { signal } from 'philjs-core';

type LoadingState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function DataComponent() {
  const state = signal<LoadingState<User>>({ status: 'idle' });

  const loadData = async () => {
    state.set({ status: 'loading' });

    try {
      const data = await fetchUser();
      state.set({ status: 'success', data });
    } catch (error) {
      state.set({ status: 'error', error: error as Error });
    }
  };

  return (
    <div>
      <button onClick={loadData}>Load</button>

      {/* TypeScript ensures exhaustive checking */}
      {(() => {
        const s = state();
        switch (s.status) {
          case 'idle':
            return <p>Click to load</p>;
          case 'loading':
            return <p>Loading...</p>;
          case 'success':
            return <p>{s.data.name}</p>; // TypeScript knows data exists
          case 'error':
            return <p>Error: {s.error.message}</p>; // TypeScript knows error exists
        }
      })()}
    </div>
  );
}
```

### Type Guards

```tsx
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}

function UserProfile({ data }: { data: unknown }) {
  if (!isUser(data)) {
    return <div>Invalid user data</div>;
  }

  // TypeScript now knows data is User
  return <div>{data.name}</div>;
}
```

### Utility Types

```tsx
import { Signal, Memo } from 'philjs-core';

// Extract signal value type
type UnwrapSignal<T> = T extends Signal<infer U> ? U : never;

const count = signal(0);
type CountType = UnwrapSignal<typeof count>; // number

// Readonly props
type ReadonlyProps<T> = {
  readonly [K in keyof T]: T[K];
};

interface Props {
  name: string;
  age: number;
}

type ReadonlyUserProps = ReadonlyProps<Props>;
// { readonly name: string; readonly age: number; }
```

## Server Function Types

Type-safe server functions:

```tsx
import { serverFn } from 'philjs-ssr';

// Server function with full type safety
export const createUser = serverFn(
  async (data: { name: string; email: string }): Promise<User> => {
    // This runs on the server
    const user = await db.users.create(data);
    return user;
  }
);

// Client usage with inferred types
function CreateUserForm() {
  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    // TypeScript knows the parameter and return types
    const user = await createUser({
      name: 'Alice',
      email: 'alice@example.com'
    });

    console.log('Created user:', user.id);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## TypeScript Configuration

Optimal `tsconfig.json` for PhilJS:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "jsxImportSource": "philjs-core",

    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,

    "types": ["vite/client"],
    "paths": {
      "~/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

## Common Type Errors

### Error: Cannot find module 'philjs-core'

```json
// Add to tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

### Error: JSX element implicitly has type 'any'

```json
// Add to tsconfig.json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "philjs-core"
  }
}
```

### Error: Property 'children' does not exist

```tsx
// Add children to props type
interface Props {
  title: string;
  children?: JSX.Element;
}
```

## Best Practices

### ✅ Use Type Inference

Let TypeScript infer types when possible:

```tsx
// ✅ Good - type is inferred
const count = signal(0);

// ❌ Unnecessary - TypeScript already knows
const count: Signal<number> = signal(0);
```

### ✅ Define Reusable Types

```tsx
// types.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

export type UserRole = 'admin' | 'user' | 'guest';
```

### ✅ Use Strict Mode

Enable all strict checks:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### ❌ Avoid 'any'

```tsx
// ❌ Bad
const data = signal<any>({});

// ✅ Good
const data = signal<Record<string, unknown>>({});

// ✅ Better
interface UserData {
  name: string;
  email: string;
}
const data = signal<UserData>({ name: '', email: '' });
```

## Next Steps

- [Components](/docs/learn/components.md) - Type-safe components
- [Signals](/docs/learn/signals.md) - Reactive typing
- [Forms](/docs/learn/forms.md) - Type-safe forms
- [API Reference](/docs/api-reference/core.md) - Complete type definitions

---

💡 **Tip**: Use `as const` for literal types: `const themes = ['light', 'dark'] as const;`

⚠️ **Warning**: Avoid type assertions (`as Type`) when possible. They bypass type checking.

ℹ️ **Note**: PhilJS's TypeScript support is excellent. Trust the types and let IntelliSense guide you!
