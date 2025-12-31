# TypeScript Integration

PhilJS is built with TypeScript from the ground up. Learn how to leverage TypeScript for type-safe, maintainable applications.

## What You'll Learn

- Why TypeScript with PhilJS
- Typing components and props
- Typing signals, memos, and effects
- Generic components
- Type inference
- Advanced TypeScript patterns

## Why TypeScript?

PhilJS + TypeScript gives you:

- **Type safety** - Catch errors before runtime
- **Autocomplete** - IDE suggestions for everything
- **Refactoring** - Rename with confidence
- **Documentation** - Types are living documentation
- **Confidence** - Know your code works

```typescript
// JavaScript - errors at runtime
const count = signal(0);
count.set('hello'); // Whoops! Runtime error

// TypeScript - errors at compile time
const count = signal(0);
count.set('hello'); // TS error: Type 'string' is not assignable to type 'number'
```

## Component Props

### Basic Props

```typescript
// Define prop interface
interface ButtonProps {
  label: string;
  onClick: () => void;
}

// Component with typed props
function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

// Usage - TypeScript ensures correct props
<Button label="Click me" onClick={() => console.log('Clicked')} />

// ❌ TypeScript error - missing required prop
<Button label="Click me" /> // Error: Property 'onClick' is missing
```

### Optional Props

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean; // Optional
  variant?: 'primary' | 'secondary'; // Optional with union type
}

function Button({
  label,
  onClick,
  disabled = false, // Default value
  variant = 'primary'
}: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled} className={variant}>
      {label}
    </button>
  );
}
```

### Children Prop

```typescript
interface CardProps {
  children: any; // Can be JSX, string, number, etc.
  title?: string;
}

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      {title && <h2>{title}</h2>}
      <div>{children}</div>
    </div>
  );
}

// Better: Use JSXChild from @philjs/core
import type { JSXChild } from '@philjs/core';

interface CardProps {
  children: JSXChild;
  title?: string;
}
```

### Function Props

```typescript
interface FormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  onChange?: (field: string, value: string) => void;
}

interface FormData {
  email: string;
  password: string;
}

function LoginForm({ onSubmit, onCancel, onChange }: FormProps) {
  const email = signal('');
  const password = signal('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    onSubmit({ email: email(), password: password() });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={email()}
        onInput={(e) => {
          const value = e.target.value;
          email.set(value);
          onChange?.('email', value); // Optional chaining
        }}
      />
      {/* ... */}
      <button onClick={onCancel}>Cancel</button>
    </form>
  );
}
```

## Typing Signals

### Signal Type Inference

```typescript
import { signal } from '@philjs/core';

// TypeScript infers type from initial value
const count = signal(0); // Signal<number>
const name = signal('Alice'); // Signal<string>
const isActive = signal(true); // Signal<boolean>

// Array
const items = signal([1, 2, 3]); // Signal<number[]>

// Object
const user = signal({ name: 'Alice', age: 30 }); // Signal<{ name: string; age: number }>
```

### Explicit Signal Types

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Explicit type when starting with null/undefined
const user = signal<User | null>(null);

// Array with explicit type
const users = signal<User[]>([]);

// Union types
const status = signal<'idle' | 'loading' | 'success' | 'error'>('idle');

// Generic objects
const data = signal<Record<string, any>>({});
```

### Signal as Props

```typescript
import type { Signal } from '@philjs/core';

interface CounterProps {
  count: Signal<number>;
  onIncrement: () => void;
}

function Counter({ count, onIncrement }: CounterProps) {
  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={onIncrement}>+</button>
    </div>
  );
}

// Usage:
const count = signal(0);

<Counter
  count={count}
  onIncrement={() => count.set(c => c + 1)}
/>
```

## Typing Memos

```typescript
import { signal, memo } from '@philjs/core';

const firstName = signal('John');
const lastName = signal('Doe');

// Type inferred from return value
const fullName = memo(() => `${firstName()} ${lastName()}`); // Memo<string>

const count = signal(0);
const isEven = memo(() => count() % 2 === 0); // Memo<boolean>

// Complex types
interface Stats {
  total: number;
  average: number;
}

const numbers = signal([1, 2, 3, 4, 5]);

const stats = memo<Stats>(() => {
  const nums = numbers();
  return {
    total: nums.reduce((a, b) => a + b, 0),
    average: nums.reduce((a, b) => a + b, 0) / nums.length
  };
}); // Memo<Stats>
```

## Typing Effects

```typescript
import { signal, effect } from '@philjs/core';

const count = signal(0);

// Effect doesn't return a value (or returns cleanup function)
effect(() => {
  console.log('Count:', count());
  // No return value needed
});

// Effect with cleanup
effect(() => {
  const timer = setInterval(() => {
    console.log('Tick');
  }, 1000);

  // Cleanup function
  return () => clearInterval(timer);
});

// Effect with async (wrap in IIFE)
const data = signal<Data | null>(null);

effect(() => {
  (async () => {
    const response = await fetch('/api/data');
    data.set(await response.json());
  })();
});
```

## Generic Components

Create reusable components that work with any type:

```typescript
// Generic List component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => any;
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

// Usage with specific types
interface User {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
];

<List<User>
  items={users}
  renderItem={(user) => <div>{user.name}</div>}
  keyExtractor={(user) => user.id}
/>

// TypeScript infers generics when possible
<List
  items={users} // TypeScript knows this is User[]
  renderItem={(user) => <div>{user.name}</div>} // user is User
  keyExtractor={(user) => user.id}
/>
```

### Generic Form Component

```typescript
interface FormProps<T> {
  initialValues: T;
  onSubmit: (values: T) => void;
  validate?: (values: T) => Record<string, string>;
  children: (props: {
    values: Signal<T>;
    errors: Signal<Record<string, string>>;
    handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
    handleSubmit: (e: Event) => void;
  }) => any;
}

function Form<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
  children
}: FormProps<T>) {
  const values = signal<T>(initialValues);
  const errors = signal<Record<string, string>>({});

  const handleChange = <K extends keyof T>(field: K, value: T[K]) => {
    values.set({ ...values(), [field]: value });
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    if (validate) {
      const validationErrors = validate(values());
      errors.set(validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }

    onSubmit(values());
  };

  return children({ values, errors, handleChange, handleSubmit });
}

// Usage:
interface LoginData {
  email: string;
  password: string;
}

<Form<LoginData>
  initialValues={{ email: '', password: '' }}
  onSubmit={(data) => console.log(data)}
  validate={(data) => {
    const errors: Record<string, string> = {};
    if (!data.email.includes('@')) errors.email = 'Invalid email';
    if (data.password.length < 8) errors.password = 'Too short';
    return errors;
  }}
>
  {({ values, errors, handleChange, handleSubmit }) => (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={values().email}
        onInput={(e) => handleChange('email', e.target.value)}
      />
      {errors().email && <span>{errors().email}</span>}

      <input
        type="password"
        value={values().password}
        onInput={(e) => handleChange('password', e.target.value)}
      />
      {errors().password && <span>{errors().password}</span>}

      <button type="submit">Login</button>
    </form>
  )}
</Form>
```

## Event Handlers

```typescript
// Mouse events
const handleClick = (e: MouseEvent) => {
  console.log(e.clientX, e.clientY);
};

// Keyboard events
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    console.log('Enter pressed');
  }
};

// Form events
const handleSubmit = (e: SubmitEvent) => {
  e.preventDefault();
  // Handle submit
};

// Input events
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  console.log(target.value);
};

// Generic event handler type
type EventHandler<T = Event> = (event: T) => void;

const onClick: EventHandler<MouseEvent> = (e) => {
  console.log(e.button);
};
```

## Utility Types

### Partial Props

```typescript
interface UserProfile {
  name: string;
  email: string;
  bio: string;
  avatar: string;
}

// Update function accepts partial user data
function updateUser(id: number, updates: Partial<UserProfile>) {
  // updates can have some or all fields
}

updateUser(1, { name: 'New Name' }); // OK
updateUser(1, { name: 'Name', email: 'email@example.com' }); // OK
```

### Pick and Omit

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary';
  size: 'small' | 'large';
  disabled: boolean;
}

// Pick only certain props
type ButtonLabelProps = Pick<ButtonProps, 'label' | 'onClick'>;

// Omit certain props
type ButtonWithoutSize = Omit<ButtonProps, 'size'>;

function PrimaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="primary" />;
}
```

### Record Type

```typescript
// Object with string keys and specific value type
const translations: Record<string, string> = {
  hello: 'Hello',
  goodbye: 'Goodbye'
};

// Specific keys with specific value
type Theme = 'light' | 'dark';
type ThemeColors = Record<Theme, { bg: string; text: string }>;

const colors: ThemeColors = {
  light: { bg: '#fff', text: '#000' },
  dark: { bg: '#000', text: '#fff' }
};
```

## Type Assertions

Use type assertions when you know more than TypeScript:

```typescript
const handleInput = (e: Event) => {
  // TypeScript doesn't know e.target is an input
  const target = e.target as HTMLInputElement;
  console.log(target.value); // OK now
};

// For JSX elements
const inputRef = signal<HTMLInputElement | null>(null);

effect(() => {
  const input = inputRef();
  if (input) {
    input.focus();
  }
});

<input ref={(el) => inputRef.set(el)} />
```

## Type Guards

```typescript
interface User {
  id: number;
  name: string;
}

interface AdminUser extends User {
  permissions: string[];
}

// Type guard function
function isAdmin(user: User): user is AdminUser {
  return 'permissions' in user;
}

// Usage:
function UserBadge({ user }: { user: User }) {
  if (isAdmin(user)) {
    // TypeScript knows user is AdminUser here
    return <div>Admin: {user.permissions.join(', ')}</div>;
  }

  return <div>User: {user.name}</div>;
}
```

## Discriminated Unions

```typescript
type ApiResponse<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: T };

function DataView<T>({ response }: { response: ApiResponse<T> }) {
  // TypeScript narrows the type based on status
  switch (response.status) {
    case 'loading':
      return <Spinner />;

    case 'error':
      // TypeScript knows response.error exists
      return <ErrorMessage error={response.error} />;

    case 'success':
      // TypeScript knows response.data exists
      return <div>{JSON.stringify(response.data)}</div>;
  }
}
```

## Type-safe Context

```typescript
import { createContext, useContext } from '@philjs/core';
import type { Signal } from '@philjs/core';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: Signal<User | null>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

// Create context with type
const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook with type safety
function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

// Usage - fully type-safe
function UserMenu() {
  const { user, logout } = useAuth(); // All types inferred!

  if (!user()) return null;

  return (
    <div>
      <span>{user()!.name}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Best Practices

### Prefer Type Inference

```typescript
// ✅ Let TypeScript infer when obvious
const count = signal(0); // Infers Signal<number>
const doubled = memo(() => count() * 2); // Infers Memo<number>

// ❌ Unnecessary explicit type
const count: Signal<number> = signal(0);
```

### Be Explicit for Public APIs

```typescript
// ✅ Explicit types for component props
export interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

### Use Const Assertions

```typescript
// Makes object/array readonly and literal typed
const COLORS = {
  primary: '#667eea',
  secondary: '#764ba2'
} as const;

// Type is: { readonly primary: "#667eea"; readonly secondary: "#764ba2" }

const SIZES = ['small', 'medium', 'large'] as const;
// Type is: readonly ["small", "medium", "large"]

type Size = typeof SIZES[number]; // "small" | "medium" | "large"
```

### Avoid `any`

```typescript
// ❌ Loses all type safety
const data = signal<any>(null);

// ✅ Use unknown if type truly unknown
const data = signal<unknown>(null);

// Must narrow type before use
if (typeof data() === 'string') {
  console.log(data().toUpperCase());
}

// ✅ Or use proper types
interface Data {
  name: string;
  age: number;
}

const data = signal<Data | null>(null);
```

## Summary

You've learned:

✅ Typing component props with interfaces
✅ Signal, memo, and effect types
✅ Generic components for reusability
✅ Event handler types
✅ Utility types (Partial, Pick, Omit, Record)
✅ Type guards and discriminated unions
✅ Type-safe context
✅ TypeScript best practices

TypeScript makes PhilJS development safer and more productive!

---

**Next:** [Styling and CSS →](./styling.md) Learn how to style your PhilJS components
