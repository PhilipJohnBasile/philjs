# philjs-atoms

Jotai-style atomic state management for PhilJS with signal-based reactivity.

## Features

- Primitive atoms (read/write state)
- Derived atoms (computed values)
- Async atoms (promises)
- Atom families (parameterized atoms)
- Write-only atoms (actions)
- Storage persistence
- Fine-grained reactivity
- TypeScript support
- Minimal bundle size

## Installation

```bash
npm install philjs-atoms philjs-core
```

## Basic Usage

### Primitive Atoms

```typescript
import { atom, useAtom, useAtomValue, useSetAtom } from 'philjs-atoms';

// Create an atom
const countAtom = atom(0);

// Read and write
function Counter() {
  const [count, setCount] = useAtom(countAtom);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}

// Read-only
function Display() {
  const count = useAtomValue(countAtom);
  return <p>{count}</p>;
}

// Write-only
function Controls() {
  const setCount = useSetAtom(countAtom);
  return <button onClick={() => setCount(0)}>Reset</button>;
}
```

## Derived Atoms (Computed)

### Read-Only Derived Atoms

```typescript
const countAtom = atom(0);
const doubledAtom = atom((get) => get(countAtom) * 2);

function Display() {
  const doubled = useAtomValue(doubledAtom);
  return <p>Doubled: {doubled}</p>;
}
```

### Writable Derived Atoms

```typescript
const celsiusAtom = atom(0);

const fahrenheitAtom = atom(
  (get) => get(celsiusAtom) * 1.8 + 32,
  (get, set, newValue: number) => {
    set(celsiusAtom, (newValue - 32) / 1.8);
  }
);

function Temperature() {
  const [fahrenheit, setFahrenheit] = useAtom(fahrenheitAtom);

  return (
    <div>
      <input
        type="number"
        value={fahrenheit}
        onChange={(e) => setFahrenheit(Number(e.target.value))}
      />
      <span>F</span>
    </div>
  );
}
```

### Combining Multiple Atoms

```typescript
const firstNameAtom = atom('John');
const lastNameAtom = atom('Doe');

const fullNameAtom = atom(
  (get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`
);

function FullName() {
  const fullName = useAtomValue(fullNameAtom);
  return <p>{fullName}</p>;
}
```

## Async Atoms

```typescript
import { asyncAtom } from 'philjs-atoms';

const userIdAtom = atom(1);

const userAtom = asyncAtom(async (get) => {
  const id = get(userIdAtom);
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

function UserProfile() {
  if (userAtom.loading()) {
    return <div>Loading...</div>;
  }

  if (userAtom.error()) {
    return <div>Error: {userAtom.error()?.message}</div>;
  }

  const user = useAtomValue(userAtom);
  return <div>User: {user.name}</div>;
}
```

### Loadable Pattern (Doesn't Throw)

```typescript
import { loadable } from 'philjs-atoms';

const loadableUserAtom = loadable(userAtom);

function UserProfile() {
  const loadableUser = useAtomValue(loadableUserAtom);

  if (loadableUser.state === 'loading') {
    return <div>Loading...</div>;
  }

  if (loadableUser.state === 'hasError') {
    return <div>Error: {loadableUser.error.message}</div>;
  }

  return <div>User: {loadableUser.data.name}</div>;
}
```

## Atom Families

Create parameterized atoms for collections:

```typescript
import { atomFamily } from 'philjs-atoms';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const todoAtomFamily = atomFamily((id: number) =>
  atom<Todo>({
    id,
    text: '',
    completed: false,
  })
);

function TodoItem({ id }: { id: number }) {
  const [todo, setTodo] = useAtom(todoAtomFamily(id));

  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => setTodo({ ...todo, completed: !todo.completed })}
      />
      <span>{todo.text}</span>
    </div>
  );
}

// Clean up when no longer needed
todoAtomFamily.remove(id);
```

## Write-Only Atoms (Actions)

```typescript
import { atomAction } from 'philjs-atoms';

const countAtom = atom(0);

const incrementAtom = atomAction((get, set) => {
  const current = get(countAtom);
  set(countAtom, current + 1);
});

const decrementAtom = atomAction((get, set) => {
  const current = get(countAtom);
  set(countAtom, current - 1);
});

const resetAtom = atomAction((get, set) => {
  set(countAtom, 0);
});

function Controls() {
  const increment = useSetAtom(incrementAtom);
  const decrement = useSetAtom(decrementAtom);
  const reset = useSetAtom(resetAtom);

  return (
    <div>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

## Utilities

### atomWithReset

```typescript
import { atomWithReset, useResetAtom } from 'philjs-atoms';

const countAtom = atomWithReset(0);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const reset = useResetAtom(countAtom);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### atomWithStorage (Persistence)

```typescript
import { atomWithStorage } from 'philjs-atoms';

const themeAtom = atomWithStorage('theme', 'light');
const settingsAtom = atomWithStorage('settings', {
  notifications: true,
  sound: false,
});

function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom);

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  );
}
```

### selectAtom (Property Selection)

```typescript
import { selectAtom } from 'philjs-atoms';

const userAtom = atom({
  name: 'John',
  age: 30,
  email: 'john@example.com',
});

const nameAtom = selectAtom(userAtom, (user) => user.name);
const ageAtom = selectAtom(userAtom, (user) => user.age);

function UserName() {
  const name = useAtomValue(nameAtom);
  return <span>{name}</span>;
}
```

### focusAtom (Property Focus)

```typescript
import { focusAtom } from 'philjs-atoms';

const userAtom = atom({
  name: 'John',
  age: 30,
});

const nameAtom = focusAtom(userAtom, (user) => user.name);

function NameEditor() {
  const [name, setName] = useAtom(nameAtom);

  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  );
}
```

### splitAtom (Separate Read/Write)

```typescript
import { splitAtom } from 'philjs-atoms';

const userAtom = atom({ name: 'John', age: 30 });
const [readUserAtom, writeUserAtom] = splitAtom(userAtom);

function Display() {
  const user = useAtomValue(readUserAtom);
  return <div>{user.name}</div>;
}

function Editor() {
  const setUser = useSetAtom(writeUserAtom);
  return <button onClick={() => setUser({ name: 'Jane', age: 25 })}>Update</button>;
}
```

### batchAtoms (Batch Updates)

```typescript
import { batchAtoms } from 'philjs-atoms';

const countAtom = atom(0);
const nameAtom = atom('');
const ageAtom = atom(0);

function updateAll() {
  batchAtoms(() => {
    useSetAtom(countAtom)(10);
    useSetAtom(nameAtom)('John');
    useSetAtom(ageAtom)(30);
  }); // Only triggers one render
}
```

## Advanced Patterns

### Shopping Cart Example

```typescript
const cartItemsAtom = atom<CartItem[]>([]);

const cartTotalAtom = atom((get) => {
  const items = get(cartItemsAtom);
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

const addToCartAtom = atomAction((get, set, item: CartItem) => {
  const items = get(cartItemsAtom);
  const existingItem = items.find((i) => i.id === item.id);

  if (existingItem) {
    set(
      cartItemsAtom,
      items.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  } else {
    set(cartItemsAtom, [...items, { ...item, quantity: 1 }]);
  }
});

const removeFromCartAtom = atomAction((get, set, itemId: number) => {
  const items = get(cartItemsAtom);
  set(cartItemsAtom, items.filter((i) => i.id !== itemId));
});
```

### Form State Example

```typescript
const formAtom = atom({
  email: '',
  password: '',
  rememberMe: false,
});

const emailAtom = focusAtom(formAtom, (form) => form.email);
const passwordAtom = focusAtom(formAtom, (form) => form.password);

const isValidAtom = atom((get) => {
  const form = get(formAtom);
  return form.email.includes('@') && form.password.length >= 8;
});

const submitFormAtom = atomAction(async (get, set) => {
  const form = get(formAtom);
  const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify(form),
  });
  const data = await response.json();
  // Handle response...
});
```

## TypeScript

Full TypeScript support with type inference:

```typescript
import { atom, Atom, WritableAtom } from 'philjs-atoms';

interface User {
  id: number;
  name: string;
  email: string;
}

const userAtom: Atom<User> = atom({
  id: 1,
  name: 'John',
  email: 'john@example.com',
});

const userNameAtom: Atom<string> = atom((get) => get(userAtom).name);
```

## API Reference

### `atom(initialValue)`

Create a primitive atom.

### `atom(read)`

Create a read-only derived atom.

### `atom(read, write)`

Create a writable derived atom.

### `useAtomValue(atom)`

Read atom value.

### `useSetAtom(atom)`

Get setter function.

### `useAtom(atom)`

Read and write atom.

### `asyncAtom(read)`

Create async atom.

### `loadable(atom)`

Wrap async atom (doesn't throw).

### `atomFamily(initialize)`

Create parameterized atoms.

### `atomAction(write)`

Create write-only atom.

### `atomWithReset(initialValue)`

Create atom with reset capability.

### `atomWithStorage(key, initialValue, storage?)`

Create atom with localStorage persistence.

### `selectAtom(atom, selector)`

Select property from atom.

### `focusAtom(atom, focus)`

Focus on atom property (read/write).

### `splitAtom(atom)`

Split into read and write atoms.

### `batchAtoms(fn)`

Batch multiple updates.

## Performance Tips

1. Use derived atoms for computed values
2. Use atom families for collections
3. Use selectAtom to prevent unnecessary re-renders
4. Batch updates with batchAtoms
5. Use write-only atoms for actions
6. Keep atoms small and focused

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-atoms/src/index.ts

### Public API
- Direct exports: AsyncAtom, Atom, AtomFamily, Getter, PrimitiveAtom, SetStateAction, Setter, WritableAtom, asyncAtom, atom, atomAction, atomFamily, atomWithReset, atomWithStorage, batchAtoms, focusAtom, freezeAtom, loadable, selectAtom, splitAtom, useAtom, useAtomValue, useResetAtom, useSetAtom
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
