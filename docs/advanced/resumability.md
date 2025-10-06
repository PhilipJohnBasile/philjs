# Resumability

Resumability enables instant interactivity without hydration overhead.

## How Resumability Works

Traditional frameworks re-execute all component code on the client (hydration). PhilJS uses resumability—the client picks up exactly where the server left off.

### No Hydration Needed

```tsx
export default function Counter() {
  const count = signal(0);

  return (
    <button onClick={() => count.set(count() + 1)}>
      Count: {count()}
    </button>
  );
}

// Traditional framework:
// 1. Server renders HTML
// 2. Client downloads JS
// 3. Client re-runs Counter() to attach listeners (hydration)
// 4. Interactive

// PhilJS with resumability:
// 1. Server renders HTML with serialized state
// 2. Client resumes from state
// 3. Interactive immediately
```

## Serialization

PhilJS automatically serializes reactive state:

```tsx
const user = signal({ name: 'Alice', age: 25 });

// Server serializes to HTML:
// <div data-signal="user">{"name":"Alice","age":25}</div>

// Client deserializes and resumes
// No re-execution needed!
```

## Best Practices

### ✅ Do: Keep State Serializable

```tsx
// ✅ Good - serializable
const user = signal({ name: 'Alice', id: 123 });

// ❌ Bad - functions don't serialize
const state = signal({ fn: () => {} });
```

## Next Steps

- [Islands](/docs/advanced/islands.md) - Islands architecture
- [SSR](/docs/advanced/ssr.md) - Server rendering

---

💡 **Tip**: Resumability eliminates hydration overhead entirely.

ℹ️ **Note**: PhilJS apps are interactive instantly, even on slow devices.
