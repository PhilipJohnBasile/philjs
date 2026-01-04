# @philjs/atoms

The `@philjs/atoms` package provides Jotai-style atomic state management for PhilJS, offering fine-grained reactive state with primitive atoms, derived atoms, async atoms, and atom families.

## Installation

```bash
npm install @philjs/atoms
```

## Features

- **Primitive Atoms** - Read/write state containers
- **Derived Atoms** - Computed values from other atoms
- **Async Atoms** - Promise-based data fetching
- **Atom Families** - Parameterized atom factories
- **Write-Only Atoms** - Actions for side effects
- **Persistence** - LocalStorage integration
- **Utilities** - Reset, freeze, select, focus, batch

## Quick Start

```typescript
import { atom, useAtom, useAtomValue, useSetAtom } from '@philjs/atoms';

// Create a primitive atom
const countAtom = atom(0);

// Create a derived atom
const doubledAtom = atom((get) => get(countAtom) * 2);

// Use in components
function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const doubled = useAtomValue(doubledAtom);

  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}
```

---

## Primitive Atoms

Basic read/write state containers:

```typescript
import { atom, useAtom, useAtomValue, useSetAtom } from '@philjs/atoms';
import type { PrimitiveAtom } from '@philjs/atoms';

// Create primitive atom with initial value
const countAtom: PrimitiveAtom<number> = atom(0);
const nameAtom = atom('John');
const userAtom = atom({ id: 1, name: 'John', email: 'john@example.com' });
const todosAtom = atom<string[]>([]);

// Read value
function DisplayCount() {
  const count = useAtomValue(countAtom);
  return <p>Count: {count}</p>;
}

// Write value
function IncrementButton() {
  const setCount = useSetAtom(countAtom);

  const handleClick = () => {
    // Direct value
    setCount(5);

    // Updater function
    setCount(prev => prev + 1);
  };

  return <button onClick={handleClick}>Increment</button>;
}

// Read and write
function Counter() {
  const [count, setCount] = useAtom(countAtom);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <button onClick={() => setCount(c => c - 1)}>-</button>
    </div>
  );
}
```

---

## Derived Atoms

Computed values that automatically update when dependencies change:

```typescript
import { atom, useAtomValue } from '@philjs/atoms';

// Source atoms
const priceAtom = atom(100);
const quantityAtom = atom(2);
const taxRateAtom = atom(0.1);

// Read-only derived atom
const subtotalAtom = atom((get) => {
  return get(priceAtom) * get(quantityAtom);
});

const taxAtom = atom((get) => {
  return get(subtotalAtom) * get(taxRateAtom);
});

const totalAtom = atom((get) => {
  return get(subtotalAtom) + get(taxAtom);
});

// Complex derived atom
const orderSummaryAtom = atom((get) => ({
  subtotal: get(subtotalAtom),
  tax: get(taxAtom),
  total: get(totalAtom),
  items: get(quantityAtom),
}));

// Use in component
function OrderTotal() {
  const summary = useAtomValue(orderSummaryAtom);

  return (
    <div>
      <p>Subtotal: ${summary.subtotal}</p>
      <p>Tax: ${summary.tax.toFixed(2)}</p>
      <p>Total: ${summary.total.toFixed(2)}</p>
    </div>
  );
}
```

### Writable Derived Atoms

Derived atoms with custom write logic:

```typescript
import { atom, useAtom } from '@philjs/atoms';
import type { Getter, Setter } from '@philjs/atoms';

const celsiusAtom = atom(0);

// Writable derived atom for Fahrenheit
const fahrenheitAtom = atom(
  // Read: convert from Celsius
  (get: Getter) => get(celsiusAtom) * (9 / 5) + 32,

  // Write: convert to Celsius and update source
  (get: Getter, set: Setter, fahrenheit: number) => {
    const celsius = (fahrenheit - 32) * (5 / 9);
    set(celsiusAtom, celsius);
  }
);

function TemperatureConverter() {
  const [celsius, setCelsius] = useAtom(celsiusAtom);
  const [fahrenheit, setFahrenheit] = useAtom(fahrenheitAtom);

  return (
    <div>
      <input
        type="number"
        value={celsius}
        onChange={(e) => setCelsius(Number(e.target.value))}
      />
      °C =
      <input
        type="number"
        value={fahrenheit}
        onChange={(e) => setFahrenheit(Number(e.target.value))}
      />
      °F
    </div>
  );
}
```

---

## Async Atoms

Fetch and cache async data:

```typescript
import { asyncAtom, loadable, useAtomValue } from '@philjs/atoms';
import type { AsyncAtom } from '@philjs/atoms';

// User ID atom
const userIdAtom = atom(1);

// Async atom that fetches user data
const userAtom: AsyncAtom<User> = asyncAtom(async (get) => {
  const userId = get(userIdAtom);
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
});

// Using async atom directly
function UserProfile() {
  const user = useAtomValue(userAtom);

  // Check loading/error state
  if (userAtom.loading()) {
    return <Spinner />;
  }

  if (userAtom.error()) {
    return <Error error={userAtom.error()} />;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### Loadable Wrapper

Non-throwing async state:

```typescript
import { asyncAtom, loadable, useAtomValue } from '@philjs/atoms';

const userAsyncAtom = asyncAtom(async () => {
  const response = await fetch('/api/user');
  return response.json();
});

// Wrap with loadable for non-throwing access
const userLoadableAtom = loadable(userAsyncAtom);

function UserCard() {
  const userState = useAtomValue(userLoadableAtom);

  switch (userState.state) {
    case 'loading':
      return <Spinner />;

    case 'hasError':
      return <Error message={userState.error.message} />;

    case 'hasData':
      return (
        <div>
          <h2>{userState.data.name}</h2>
          <p>{userState.data.email}</p>
        </div>
      );
  }
}
```

---

## Atom Families

Create parameterized atom factories:

```typescript
import { atom, atomFamily, useAtomValue, useSetAtom } from '@philjs/atoms';
import type { AtomFamily } from '@philjs/atoms';

// Todo interface
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// Family of todo atoms by ID
const todoAtomFamily: AtomFamily<number, PrimitiveAtom<Todo>> = atomFamily(
  (id: number) => atom<Todo>({
    id,
    text: '',
    completed: false
  })
);

// Usage
function TodoItem({ id }: { id: number }) {
  const [todo, setTodo] = useAtom(todoAtomFamily(id));

  const toggle = () => {
    setTodo(prev => ({ ...prev, completed: !prev.completed }));
  };

  return (
    <li>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={toggle}
      />
      <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
        {todo.text}
      </span>
    </li>
  );
}

// Remove from family when deleted
function deleteTodo(id: number) {
  todoAtomFamily.remove(id);
}
```

### Derived Family

Parameterized derived atoms:

```typescript
const userAtomFamily = atomFamily((userId: string) =>
  asyncAtom(async () => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  })
);

const postsAtomFamily = atomFamily((userId: string) =>
  asyncAtom(async () => {
    const response = await fetch(`/api/users/${userId}/posts`);
    return response.json();
  })
);

// Derived family combining user and posts
const userWithPostsFamily = atomFamily((userId: string) =>
  atom((get) => ({
    user: get(userAtomFamily(userId)),
    posts: get(postsAtomFamily(userId))
  }))
);
```

---

## Write-Only Atoms (Actions)

Create action atoms for side effects:

```typescript
import { atom, atomAction, useSetAtom } from '@philjs/atoms';

const countAtom = atom(0);
const historyAtom = atom<number[]>([]);

// Simple action
const incrementAtom = atomAction((get, set) => {
  const current = get(countAtom);
  set(countAtom, current + 1);
});

// Action with parameters
const addToCountAtom = atomAction((get, set, amount: number) => {
  const current = get(countAtom);
  set(countAtom, current + amount);
});

// Action with multiple atom updates
const incrementWithHistoryAtom = atomAction((get, set) => {
  const current = get(countAtom);
  const history = get(historyAtom);

  set(countAtom, current + 1);
  set(historyAtom, [...history, current + 1]);
});

// Async action
const fetchAndSetAtom = atomAction(async (get, set, userId: string) => {
  const response = await fetch(`/api/users/${userId}`);
  const user = await response.json();
  set(userAtom, user);
});

// Usage
function Controls() {
  const increment = useSetAtom(incrementAtom);
  const addToCount = useSetAtom(addToCountAtom);
  const fetchUser = useSetAtom(fetchAndSetAtom);

  return (
    <div>
      <button onClick={() => increment()}>+1</button>
      <button onClick={() => addToCount(5)}>+5</button>
      <button onClick={() => fetchUser('123')}>Load User</button>
    </div>
  );
}
```

---

## Atom Utilities

### Reset Atom

```typescript
import { atomWithReset, useResetAtom, useAtom } from '@philjs/atoms';

// Create resettable atom
const formAtom = atomWithReset({
  name: '',
  email: '',
  message: ''
});

function ContactForm() {
  const [form, setForm] = useAtom(formAtom);
  const resetForm = useResetAtom(formAtom);

  return (
    <form>
      <input
        value={form.name}
        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
      />
      <input
        value={form.email}
        onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
      />
      <textarea
        value={form.message}
        onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
      />

      <button type="button" onClick={resetForm}>
        Reset Form
      </button>
    </form>
  );
}
```

### Storage Persistence

```typescript
import { atomWithStorage, useAtom } from '@philjs/atoms';

// Persisted to localStorage
const themeAtom = atomWithStorage('theme', 'light');
const userPrefsAtom = atomWithStorage('prefs', {
  notifications: true,
  language: 'en'
});

// Custom storage (e.g., sessionStorage)
const sessionDataAtom = atomWithStorage(
  'session',
  { token: null },
  sessionStorage
);

function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom);

  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      Current: {theme}
    </button>
  );
}
```

### Select Atom

Extract a property from an atom:

```typescript
import { atom, selectAtom, useAtomValue } from '@philjs/atoms';

const userAtom = atom({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  settings: {
    theme: 'dark',
    notifications: true
  }
});

// Select specific properties
const userNameAtom = selectAtom(userAtom, (user) => user.name);
const themeAtom = selectAtom(userAtom, (user) => user.settings.theme);

// Complex selection
const userDisplayAtom = selectAtom(userAtom, (user) => ({
  displayName: user.name,
  initials: user.name.split(' ').map(n => n[0]).join('')
}));

function UserName() {
  const name = useAtomValue(userNameAtom);
  return <span>{name}</span>;
}
```

### Focus Atom

Read/write a specific property:

```typescript
import { atom, focusAtom, useAtom } from '@philjs/atoms';

const settingsAtom = atom({
  theme: 'light',
  fontSize: 14,
  language: 'en'
});

// Focus on theme property
const themeAtom = focusAtom(settingsAtom, (settings) => settings.theme);
const fontSizeAtom = focusAtom(settingsAtom, (settings) => settings.fontSize);

function ThemeSetting() {
  const [theme, setTheme] = useAtom(themeAtom);

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}

function FontSizeSetting() {
  const [fontSize, setFontSize] = useAtom(fontSizeAtom);

  return (
    <input
      type="range"
      min="10"
      max="24"
      value={fontSize}
      onChange={(e) => setFontSize(Number(e.target.value))}
    />
  );
}
```

### Freeze Atom

Make an atom read-only:

```typescript
import { atom, freezeAtom, useAtomValue } from '@philjs/atoms';

const configAtom = atom({
  apiUrl: 'https://api.example.com',
  version: '1.0.0'
});

// Create read-only version
const frozenConfigAtom = freezeAtom(configAtom);

function ApiInfo() {
  // Can only read, not write
  const config = useAtomValue(frozenConfigAtom);
  return <p>API: {config.apiUrl}</p>;
}
```

### Split Atom

Separate read and write concerns:

```typescript
import { atom, splitAtom, useAtomValue, useSetAtom } from '@philjs/atoms';

const counterAtom = atom(0);
const [readCounterAtom, writeCounterAtom] = splitAtom(counterAtom);

// Read-only component
function DisplayCounter() {
  const count = useAtomValue(readCounterAtom);
  return <p>{count}</p>;
}

// Write-only component
function CounterControls() {
  const setCount = useSetAtom(writeCounterAtom);
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <button onClick={() => setCount(c => c - 1)}>-</button>
    </div>
  );
}
```

### Batch Updates

Batch multiple atom updates for efficiency:

```typescript
import { atom, batchAtoms, useSetAtom } from '@philjs/atoms';

const firstNameAtom = atom('');
const lastNameAtom = atom('');
const emailAtom = atom('');

function UserForm() {
  const setFirstName = useSetAtom(firstNameAtom);
  const setLastName = useSetAtom(lastNameAtom);
  const setEmail = useSetAtom(emailAtom);

  const fillFromData = (data: User) => {
    // All updates batched - single re-render
    batchAtoms(() => {
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setEmail(data.email);
    });
  };

  return (
    <button onClick={() => fillFromData(prefillData)}>
      Fill Form
    </button>
  );
}
```

---

## Types Reference

### Core Types

```typescript
// Getter function type
type Getter = <Value>(atom: Atom<Value>) => Value;

// Setter function type
type Setter = <Value, Args extends unknown[], Result>(
  atom: WritableAtom<Value, Args, Result>,
  ...args: Args
) => Result;

// Read-only atom
interface Atom<Value> {
  read: (get: Getter) => Value;
  debugLabel?: string;
}

// Writable atom
interface WritableAtom<Value, Args extends unknown[], Result> extends Atom<Value> {
  write: (get: Getter, set: Setter, ...args: Args) => Result;
}

// Primitive atom (standard read/write)
type PrimitiveAtom<Value> = WritableAtom<Value, [SetStateAction<Value>], void>;

// Set state action (value or updater function)
type SetStateAction<Value> = Value | ((prev: Value) => Value);

// Atom family factory
interface AtomFamily<Param, AtomType> {
  (param: Param): AtomType;
  remove: (param: Param) => void;
}

// Async atom with loading/error state
interface AsyncAtom<Value> extends Atom<Value> {
  loading: Signal<boolean>;
  error: Signal<Error | null>;
}
```

---

## Patterns

### Todo List Example

```typescript
import { atom, atomFamily, atomAction, useAtom, useAtomValue, useSetAtom } from '@philjs/atoms';

// Types
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

// Atoms
const todoIdsAtom = atom<string[]>([]);

const todoAtomFamily = atomFamily((id: string) =>
  atom<Todo>({ id, text: '', completed: false })
);

// Derived atoms
const completedTodosAtom = atom((get) => {
  const ids = get(todoIdsAtom);
  return ids.filter(id => get(todoAtomFamily(id)).completed);
});

const remainingCountAtom = atom((get) => {
  const ids = get(todoIdsAtom);
  const completed = get(completedTodosAtom);
  return ids.length - completed.length;
});

// Actions
const addTodoAtom = atomAction((get, set, text: string) => {
  const id = crypto.randomUUID();
  const ids = get(todoIdsAtom);

  set(todoIdsAtom, [...ids, id]);
  set(todoAtomFamily(id), { id, text, completed: false });
});

const removeTodoAtom = atomAction((get, set, id: string) => {
  const ids = get(todoIdsAtom);
  set(todoIdsAtom, ids.filter(i => i !== id));
  todoAtomFamily.remove(id);
});

const toggleTodoAtom = atomAction((get, set, id: string) => {
  const todo = get(todoAtomFamily(id));
  set(todoAtomFamily(id), { ...todo, completed: !todo.completed });
});

// Components
function TodoApp() {
  const ids = useAtomValue(todoIdsAtom);
  const remaining = useAtomValue(remainingCountAtom);
  const addTodo = useSetAtom(addTodoAtom);

  return (
    <div>
      <h1>Todos ({remaining} remaining)</h1>
      <AddTodoForm onAdd={addTodo} />
      <ul>
        {ids.map(id => (
          <TodoItem key={id} id={id} />
        ))}
      </ul>
    </div>
  );
}
```

---

## Best Practices

### 1. Keep Atoms Small and Focused

```typescript
// Good - small, focused atoms
const userNameAtom = atom('');
const userEmailAtom = atom('');
const userAgeAtom = atom(0);

// Avoid - large monolithic atoms
// const userAtom = atom({ name: '', email: '', age: 0, ... });
```

### 2. Use Derived Atoms for Computed State

```typescript
// Good - derived atom for computed value
const totalAtom = atom((get) => {
  const items = get(cartItemsAtom);
  return items.reduce((sum, item) => sum + item.price, 0);
});

// Avoid - computing in component
// const items = useAtomValue(cartItemsAtom);
// const total = items.reduce((sum, item) => sum + item.price, 0);
```

### 3. Use Atom Families for Collections

```typescript
// Good - atom family for entities
const todoFamily = atomFamily((id: string) => atom({ id, text: '', done: false }));

// Avoid - array of objects
// const todosAtom = atom([{ id: '1', text: '', done: false }, ...]);
```

### 4. Batch Related Updates

```typescript
// Good - batch updates
batchAtoms(() => {
  setA(1);
  setB(2);
  setC(3);
});

// Avoid - separate updates cause multiple renders
// setA(1);
// setB(2);
// setC(3);
```

---

## API Reference

| Export | Description |
|--------|-------------|
| `atom` | Create primitive or derived atom |
| `useAtom` | Read and write atom |
| `useAtomValue` | Read atom value |
| `useSetAtom` | Get atom setter |
| `asyncAtom` | Create async data atom |
| `loadable` | Wrap async atom for non-throwing access |
| `atomFamily` | Create parameterized atom factory |
| `atomAction` | Create write-only action atom |
| `atomWithReset` | Create resettable atom |
| `useResetAtom` | Get reset function |
| `atomWithStorage` | Create localStorage-persisted atom |
| `freezeAtom` | Make atom read-only |
| `selectAtom` | Select property from atom |
| `focusAtom` | Focus on property (read/write) |
| `splitAtom` | Split into read/write atoms |
| `batchAtoms` | Batch multiple updates |

---

## Next Steps

- [@philjs/core Signals](../core/signals.md)
- [@philjs/cells](../cells/overview.md)
- [@philjs/zustand Integration](../zustand/overview.md)
