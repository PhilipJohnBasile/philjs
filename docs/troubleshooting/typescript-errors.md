# TypeScript Errors

Comprehensive guide to resolving TypeScript errors in PhilJS applications.

## Common TypeScript Errors

### 1. Signal Type Inference Issues

**Error:**
```typescript
Type 'null' is not assignable to type 'User'
Argument of type 'User | null' is not assignable to parameter of type 'User'
```

**Problem:** Signal initialized with null but typed incorrectly.

```tsx
// Problem: Type too narrow
interface User {
  id: string;
  name: string;
}

const user = signal(null); // Type: Signal<null>

user.set({ id: '1', name: 'Alice' }); // Error!
```

**Solution:** Use union types.

```tsx
// Solution: Correct typing
const user = signal<User | null>(null); // Type: Signal<User | null>

user.set({ id: '1', name: 'Alice' }); // Works!
user.set(null); // Also works!

// Usage with null checking
if (user()) {
  console.log(user()!.name); // Non-null assertion
}

// Or optional chaining
console.log(user()?.name); // Safe access
```

### 2. JSX Type Errors

**Error:**
```typescript
Property 'children' does not exist on type 'IntrinsicAttributes'
JSX element type 'Component' does not have any construct or call signatures
```

**Problem:** JSX configuration incorrect.

**Solution:** Configure TypeScript for JSX.

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "philjs-core",
    "types": ["vite/client"]
  }
}
```

```tsx
// Proper component typing
interface Props {
  children?: any; // Or JSXElement
  className?: string;
}

function Component({ children, className }: Props) {
  return <div className={className}>{children}</div>;
}
```

### 3. Props Type Errors

**Error:**
```typescript
Property 'xyz' is missing in type 'Props' but required in type 'RequiredProps'
Type 'string' is not assignable to type 'number'
```

**Problem:** Incorrect prop types.

```tsx
// Problem: Missing required prop
interface Props {
  count: number;
  name: string;
}

function Component({ count, name }: Props) {
  return <div>{name}: {count}</div>;
}

// Error: name is missing
<Component count={5} />
```

**Solution:** Fix prop types or make optional.

```tsx
// Solution 1: Provide all required props
<Component count={5} name="Alice" />

// Solution 2: Make props optional
interface Props {
  count: number;
  name?: string; // Optional
}

function Component({ count, name = 'Unknown' }: Props) {
  return <div>{name}: {count}</div>;
}

<Component count={5} /> // Works!

// Solution 3: Use Partial for all optional
interface Props {
  count: number;
  name: string;
}

function Component({ count = 0, name = 'Unknown' }: Partial<Props>) {
  return <div>{name}: {count}</div>;
}
```

### 4. Event Handler Type Errors

**Error:**
```typescript
Parameter 'e' implicitly has an 'any' type
Property 'value' does not exist on type 'EventTarget'
```

**Problem:** Event types not specified.

```tsx
// Problem: Untyped event
function Component() {
  const handleClick = (e) => { // Error: implicit any
    console.log(e.target.value); // Error: value doesn't exist
  };

  return <button onClick={handleClick}>Click</button>;
}
```

**Solution:** Type events correctly.

```tsx
// Solution: Proper event typing
function Component() {
  const handleClick = (e: MouseEvent) => {
    console.log('Clicked');
  };

  const handleInput = (e: InputEvent) => {
    const target = e.currentTarget as HTMLInputElement;
    console.log(target.value);
  };

  const handleChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    console.log(target.value);
  };

  return (
    <div>
      <button onClick={handleClick}>Click</button>
      <input onInput={handleInput} />
      <select onChange={handleChange}>
        <option>A</option>
      </select>
    </div>
  );
}

// Common event types
type MouseHandler = (e: MouseEvent) => void;
type InputHandler = (e: InputEvent) => void;
type ChangeHandler = (e: Event) => void;
type FormHandler = (e: SubmitEvent) => void;
type KeyHandler = (e: KeyboardEvent) => void;
```

### 5. Generic Type Errors

**Error:**
```typescript
Type 'T' is not assignable to type 'string'
Generic type 'Signal<T>' requires 1 type argument(s)
```

**Problem:** Generics not used correctly.

```tsx
// Problem: Generic not constrained
function getProperty<T>(obj: T, key: string) {
  return obj[key]; // Error: Element implicitly has 'any' type
}

// Problem: Generic not specified
const items = signal([]); // Type: Signal<never[]>
items.set([1, 2, 3]); // Error!
```

**Solution:** Use proper generic constraints.

```tsx
// Solution: Constrain generic
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]; // Type-safe!
}

interface User {
  name: string;
  age: number;
}

const user: User = { name: 'Alice', age: 30 };
const name = getProperty(user, 'name'); // Type: string
const age = getProperty(user, 'age'); // Type: number

// Solution: Specify generic type
const items = signal<number[]>([]); // Type: Signal<number[]>
items.set([1, 2, 3]); // Works!

// Infer from initial value
const items = signal([1, 2, 3]); // Type: Signal<number[]>
```

### 6. Async/Promise Type Errors

**Error:**
```typescript
Promise<void>' is not assignable to type 'void'
'await' expressions are only allowed within async functions
```

**Problem:** Async functions in non-async contexts.

```tsx
// Problem: effect() is sync, but body is async
function Component() {
  effect(() => {
    const data = await fetchData(); // Error!
    console.log(data);
  });
}

// Problem: event handler type mismatch
const handleClick = async (e: MouseEvent) => {
  await doSomething();
};

<button onClick={handleClick}>Click</button> // Error if strict typing
```

**Solution:** Handle async properly.

```tsx
// Solution 1: Async effect (PhilJS supports this)
function Component() {
  effect(async () => {
    const data = await fetchData();
    console.log(data);
  });
}

// Solution 2: Use .then()
function Component() {
  effect(() => {
    fetchData().then(data => {
      console.log(data);
    });
  });
}

// Solution 3: Async event handler
const handleClick = async (e: MouseEvent) => {
  await doSomething();
};

// Type is fine, but ensure error handling
<button onClick={(e) => {
  handleClick(e).catch(err => console.error(err));
}}>Click</button>

// Solution 4: Use resource for async data
import { resource } from 'philjs-core';

function Component() {
  const data = resource(() => fetchData());

  return (
    <div>
      {data.loading() && <div>Loading...</div>}
      {data.error() && <div>Error: {data.error()?.message}</div>}
      {data() && <div>Data: {JSON.stringify(data())}</div>}
    </div>
  );
}
```

### 7. Module Resolution Errors

**Error:**
```typescript
Cannot find module 'philjs-core' or its corresponding type declarations
Could not find a declaration file for module 'xyz'
```

**Problem:** TypeScript can't find module types.

**Solution:** Configure module resolution.

```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "module": "ESNext",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "types": ["vite/client", "node"]
  }
}
```

```typescript
// For packages without types, create declarations
// src/types/untyped-package.d.ts
declare module 'untyped-package' {
  export function doSomething(): void;
  export const value: number;
}

// Or use any
declare module 'untyped-package';

// Now you can import
import { doSomething } from 'untyped-package';
```

### 8. Ref Type Errors

**Error:**
```typescript
Type 'null' is not assignable to type 'HTMLDivElement'
Property 'current' does not exist on type 'Signal<HTMLElement | null>'
```

**Problem:** Ref types incorrect.

```tsx
// Problem: Wrong ref typing
function Component() {
  const divRef = signal<HTMLDivElement>(null); // Error!

  return <div ref={divRef}>Content</div>;
}
```

**Solution:** Use proper ref types.

```tsx
// Solution: Correct ref typing
function Component() {
  const divRef = signal<HTMLDivElement | null>(null);

  effect(() => {
    const element = divRef();
    if (element) {
      console.log('Div dimensions:', element.getBoundingClientRect());
    }
  });

  return <div ref={divRef}>Content</div>;
}

// Common ref types
type DivRef = Signal<HTMLDivElement | null>;
type InputRef = Signal<HTMLInputElement | null>;
type ButtonRef = Signal<HTMLButtonElement | null>;
type ElementRef = Signal<HTMLElement | null>;

// Generic ref type
function useRef<T extends HTMLElement>() {
  return signal<T | null>(null);
}

const divRef = useRef<HTMLDivElement>();
const inputRef = useRef<HTMLInputElement>();
```

### 9. Union Type Narrowing

**Error:**
```typescript
Object is possibly 'null'
Object is possibly 'undefined'
Type 'string | number' is not assignable to type 'string'
```

**Problem:** TypeScript can't narrow union types.

```tsx
// Problem: Not narrowing null
interface User {
  name: string;
}

const user = signal<User | null>(null);

console.log(user().name); // Error: Object is possibly 'null'
```

**Solution:** Use type guards and narrowing.

```tsx
// Solution 1: Type guard
if (user()) {
  console.log(user()!.name); // Non-null assertion
}

// Solution 2: Optional chaining
console.log(user()?.name); // Returns string | undefined

// Solution 3: Nullish coalescing
const name = user()?.name ?? 'Unknown';

// Solution 4: Type guard function
function isUser(value: User | null): value is User {
  return value !== null;
}

if (isUser(user())) {
  console.log(user().name); // Type narrowed to User
}

// Solution 5: Discriminated unions
type LoadingState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: T };

const state = signal<LoadingState<User>>({ status: 'loading' });

// TypeScript narrows based on status
const currentState = state();
if (currentState.status === 'success') {
  console.log(currentState.data.name); // Type-safe!
}
```

### 10. Computed Type Errors

**Error:**
```typescript
Type 'Memo<number>' is not assignable to type 'number'
Cannot invoke an object which is possibly 'undefined'
```

**Problem:** Forgetting to call memo.

```tsx
// Problem: Not calling memo
const doubled = memo(() => count() * 2);

const result = doubled + 5; // Error: Can't add to Memo<number>
```

**Solution:** Call memo like signals.

```tsx
// Solution: Call memo
const doubled = memo(() => count() * 2);

const result = doubled() + 5; // Works!

// Type inference
const doubled = memo(() => count() * 2); // Type: Memo<number>
const text = memo(() => `Count: ${count()}`); // Type: Memo<string>

// Complex types
interface Stats {
  total: number;
  average: number;
}

const stats = memo<Stats>(() => ({
  total: items().reduce((sum, i) => sum + i, 0),
  average: items().reduce((sum, i) => sum + i, 0) / items().length
}));

// Type: Memo<Stats>
console.log(stats().total, stats().average);
```

## Advanced TypeScript Patterns

### 1. Component Typing

```tsx
// Functional component type
type Component<P = {}> = (props: P) => JSXElement;

// With children
interface PropsWithChildren<P = unknown> {
  children?: any;
}

type ParentComponent<P = {}> = Component<P & PropsWithChildren<P>>;

// Usage
const Button: Component<{ label: string }> = ({ label }) => {
  return <button>{label}</button>;
};

const Container: ParentComponent<{ title: string }> = ({ title, children }) => {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  );
};
```

### 2. Signal Helper Types

```tsx
// Extract signal value type
type SignalValue<S> = S extends Signal<infer T> ? T : never;

const count = signal(0);
type CountType = SignalValue<typeof count>; // number

// Signal record
type SignalRecord<T> = {
  [K in keyof T]: Signal<T[K]>;
};

interface User {
  name: string;
  age: number;
}

const userSignals: SignalRecord<User> = {
  name: signal(''),
  age: signal(0)
};

// Get all values
function getValues<T>(signals: SignalRecord<T>): T {
  return Object.fromEntries(
    Object.entries(signals).map(([key, sig]) => [key, (sig as any)()])
  ) as T;
}

const user = getValues(userSignals);
// Type: { name: string; age: number }
```

### 3. Generic Components

```tsx
// Generic list component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => JSXElement;
  keyFn: (item: T) => string | number;
}

function List<T>(props: ListProps<T>) {
  return (
    <ul>
      {props.items.map((item, index) => (
        <li key={props.keyFn(item)}>
          {props.renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
}

// Usage - TypeScript infers T
interface Todo {
  id: number;
  text: string;
}

const todos: Todo[] = [
  { id: 1, text: 'Buy milk' },
  { id: 2, text: 'Walk dog' }
];

<List
  items={todos}
  renderItem={(todo) => <span>{todo.text}</span>}
  keyFn={(todo) => todo.id}
/>
```

### 4. Store Typing

```tsx
// Type-safe store
interface StoreState {
  user: User | null;
  count: number;
  items: string[];
}

interface Store {
  state: SignalRecord<StoreState>;
  actions: {
    setUser: (user: User | null) => void;
    increment: () => void;
    addItem: (item: string) => void;
  };
}

function createStore(): Store {
  const state: SignalRecord<StoreState> = {
    user: signal<User | null>(null),
    count: signal(0),
    items: signal<string[]>([])
  };

  const actions = {
    setUser: (user: User | null) => state.user.set(user),
    increment: () => state.count.set(state.count() + 1),
    addItem: (item: string) => state.items.set([...state.items(), item])
  };

  return { state, actions };
}

// Usage
const store = createStore();
store.actions.setUser({ id: '1', name: 'Alice' });
console.log(store.state.user()?.name);
```

### 5. Form Typing

```tsx
// Type-safe form
interface FormValues {
  email: string;
  password: string;
  remember: boolean;
}

interface FormErrors {
  [K in keyof FormValues]?: string;
}

interface Form<T> {
  values: SignalRecord<T>;
  errors: Signal<Partial<FormErrors>>;
  handleSubmit: (e: Event) => void;
  reset: () => void;
}

function useForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => void | Promise<void>
): Form<T> {
  const values = Object.fromEntries(
    Object.entries(initialValues).map(([key, value]) => [key, signal(value)])
  ) as SignalRecord<T>;

  const errors = signal<Partial<FormErrors>>({});

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const formValues = Object.fromEntries(
      Object.entries(values).map(([key, sig]) => [key, (sig as any)()])
    ) as T;

    await onSubmit(formValues);
  };

  const reset = () => {
    Object.entries(initialValues).forEach(([key, value]) => {
      (values as any)[key].set(value);
    });
    errors.set({});
  };

  return { values, errors, handleSubmit, reset };
}

// Usage
function LoginForm() {
  const form = useForm<FormValues>(
    {
      email: '',
      password: '',
      remember: false
    },
    async (values) => {
      console.log('Submit:', values);
    }
  );

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        type="email"
        value={form.values.email()}
        onInput={(e) => form.values.email.set(e.currentTarget.value)}
      />
      <input
        type="password"
        value={form.values.password()}
        onInput={(e) => form.values.password.set(e.currentTarget.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

## TypeScript Configuration Best Practices

```json
// tsconfig.json - Strict configuration
{
  "compilerOptions": {
    // Language
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "jsxImportSource": "philjs-core",

    // Module Resolution
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,

    // Strict Type Checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    // Additional Checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,

    // Emit
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,
    "importHelpers": true,

    // Skip checking
    "skipLibCheck": true,

    // Path Mapping
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },

    // Types
    "types": ["vite/client", "node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

## Summary

**Common TypeScript Errors:**
- Signal type inference issues
- JSX configuration problems
- Props type mismatches
- Event handler typing
- Generic type errors
- Async/Promise typing
- Module resolution
- Ref typing
- Union type narrowing
- Computed value types

**Solutions:**
- Use proper type annotations
- Configure JSX correctly
- Type all props explicitly
- Use correct event types
- Constrain generics properly
- Handle async correctly
- Configure module resolution
- Type refs with null
- Use type guards
- Remember to call signals/memos

**Best Practices:**
- Enable strict mode
- Use type inference when possible
- Create type helpers for common patterns
- Document complex types
- Use discriminated unions for state
- Leverage generic components
- Create type-safe utilities

**Next:**
- [Build Errors](./build-errors.md) - Build-time issues
- [Signal Issues](./signal-issues.md) - Signal reactivity problems
- [Common Issues](./common-issues.md) - General problems
