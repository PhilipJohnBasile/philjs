# Core API Reference

Complete API reference for philjs-core package.

## signal()

Create reactive state.

```tsx
import { signal } from 'philjs-core';

const count = signal(0);

// Read value
console.log(count()); // 0

// Set value
count.set(5);

// Update based on current
count.set(c => c + 1);
```

**Type**: `<T>(initialValue: T) => Signal<T>`

## memo()

Create computed value.

```tsx
import { memo } from 'philjs-core';

const doubled = memo(() => count() * 2);
```

**Type**: `<T>(fn: () => T) => Memo<T>`

## effect()

Run side effects.

```tsx
import { effect } from 'philjs-core';

effect(() => {
  console.log(count());
});
```

**Type**: `(fn: () => void | (() => void)) => void`

## batch()

Batch multiple updates.

```tsx
import { batch } from 'philjs-core';

batch(() => {
  count.set(5);
  name.set('Alice');
}); // Single render
```

**Type**: `(fn: () => void) => void`

## createContext()

Create context.

```tsx
import { createContext } from 'philjs-core';

const ThemeContext = createContext<Theme>();
```

**Type**: `<T>() => Context<T>`

## useContext()

Use context value.

```tsx
import { useContext } from 'philjs-core';

const theme = useContext(ThemeContext);
```

**Type**: `<T>(context: Context<T>) => T`

## onCleanup()

Register cleanup function.

```tsx
import { onCleanup } from 'philjs-core';

effect(() => {
  const id = setInterval(() => {}, 1000);

  onCleanup(() => clearInterval(id));
});
```

**Type**: `(fn: () => void) => void`

## Next Steps

- [Router API](/docs/api-reference/router.md) - Router APIs
- [Data API](/docs/api-reference/data.md) - Data fetching APIs

---

ℹ️ **Note**: All APIs are fully typed with TypeScript.
