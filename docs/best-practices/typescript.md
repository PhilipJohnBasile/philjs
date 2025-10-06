# TypeScript Best Practices

Write type-safe PhilJS applications.

## Component Types

```tsx
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
import { signal, Signal } from 'philjs-core';

const count = signal<number>(0);
const user = signal<User | null>(null);
```

## Best Practices

### ✅ Do: Use Type Inference

```tsx
// ✅ Good - inferred
const count = signal(0); // Signal<number>
```

### ✅ Do: Type Props

```tsx
// ✅ Good - typed props
interface Props {
  name: string;
}

function Component({ name }: Props) {}
```

## Next Steps

- [TypeScript Guide](/docs/learn/typescript.md) - TypeScript patterns

---

💡 **Tip**: Enable strict mode in tsconfig.json for better type safety.

ℹ️ **Note**: PhilJS has excellent TypeScript support out of the box.
