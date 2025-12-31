# TypeScript 6 Best Practices

Write type-safe PhilJS applications with TypeScript 6+.

## Requirements

- **TypeScript 6.0+** - Required for all features documented here
- **Node.js 24+** - Required for native ESM support

## Recommended tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "preserve",
    "jsxImportSource": "@philjs/core",
    "strict": true,
    "isolatedDeclarations": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Component Types

```tsx
import { signal } from '@philjs/core';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} class={`btn-${variant}`}>
      {label}
    </button>
  );
}
```

## Signal Types

```tsx
import { signal, Signal } from '@philjs/core';

const count = signal<number>(0);
const user = signal<User | null>(null);
```

## TypeScript 6 Features

### Use the satisfies Operator

```tsx
// Type-safe configuration with full inference
const config = {
  theme: 'dark',
  fontSize: 16,
  features: ['search', 'analytics'],
} as const satisfies AppConfig;

// config.theme is narrowed to 'dark', not string
```

### Use NoInfer for Better Generic Control

```tsx
import { signal } from '@philjs/core';

// Prevent unwanted inference from default values
function createSignalWithDefault<T>(
  initialValue: T,
  defaultValue: NoInfer<T>
): Signal<T> {
  return signal(initialValue ?? defaultValue);
}

// T is inferred from initialValue, not defaultValue
const count = createSignalWithDefault(0, 100);
```

### Use Const Type Parameters

```tsx
// Preserve literal types in generics
function createStore<const T extends Record<string, unknown>>(
  initial: T
): Store<T> {
  return new Store(initial);
}

// Keys are preserved as literal types
const store = createStore({
  count: 0,
  name: 'app',
});
```

### Isolated Declarations

Enable faster builds with isolated declarations:

```json
{
  "compilerOptions": {
    "isolatedDeclarations": true,
    "declaration": true
  }
}
```

This requires explicit return types on exported functions:

```tsx
// Required with isolatedDeclarations
export function createCounter(): { count: Signal<number>; increment: () => void } {
  const count = signal(0);
  return {
    count,
    increment: () => count.set(c => c + 1),
  };
}
```

## Best Practices

### Use Type Inference When Possible

```tsx
// Good - inferred as Signal<number>
const count = signal(0);

// Explicit type only when needed
const user = signal<User | null>(null);
```

### Type Props Explicitly

```tsx
// Good - typed props with TypeScript 6 features
interface Props {
  name: string;
  config?: AppConfig;
}

function Component({ name, config }: Props) {
  // ...
}
```

### Use Strict Optional Properties

```tsx
// With exactOptionalPropertyTypes enabled
interface UserSettings {
  theme?: 'light' | 'dark';  // Can be 'light', 'dark', or missing
  notifications?: boolean;   // Can be true, false, or missing
}

// undefined must be explicit if allowed
interface UserSettingsExplicit {
  theme: 'light' | 'dark' | undefined;  // Can also be undefined
}
```

### Safe Index Access

```tsx
// With noUncheckedIndexedAccess enabled
const items: string[] = ['a', 'b', 'c'];

// item is string | undefined, not string
const item = items[0];

// Must handle undefined
if (item !== undefined) {
  console.log(item.toUpperCase());
}

// Or use at() with nullish coalescing
const safeItem = items.at(0) ?? 'default';
```

## ES2024 Type Support

TypeScript 6 includes types for ES2024 features:

```tsx
// Object.groupBy() returns Partial<Record<K, T[]>>
const grouped: Partial<Record<string, User[]>> = Object.groupBy(
  users,
  user => user.role
);

// Map.groupBy() returns Map<K, T[]>
const mappedGroups: Map<string, User[]> = Map.groupBy(
  users,
  user => user.department
);

// Promise.withResolvers() is fully typed
const { promise, resolve, reject } = Promise.withResolvers<User>();

// Array immutable methods preserve types
const sorted: readonly User[] = users.toSorted((a, b) =>
  a.name.localeCompare(b.name)
);
```

## Next Steps

- [Performance Best Practices](./performance.md) - Optimize your TypeScript code
- [API Reference](/docs/api-reference/overview.md) - Full API documentation

---

**Tip**: Enable all strict mode options in tsconfig.json for maximum type safety.

**Note**: PhilJS is built with TypeScript 6 and provides excellent type inference out of the box.
