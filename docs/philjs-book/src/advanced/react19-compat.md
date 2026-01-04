# PhilJS and React 19 Compatibility

This document explores how PhilJS patterns compare to React 19's new features and ensures compatibility.

## React 19 Compiler Optimizations

React 19 introduces an automatic compiler that:
- Automatically memoizes components
- Optimizes re-renders
- Eliminates need for `useMemo`, `useCallback`, `React.memo`

### PhilJS Equivalent

PhilJS signals already provide fine-grained reactivity without re-renders:

```tsx
// React 19 (with compiler)
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// PhilJS (no compiler needed)
function Counter() {
  const count = signal(0);
  return <button onClick={() => count.update(c => c + 1)}>{count}</button>;
}
```

The key difference: React 19 still uses Virtual DOM reconciliation; PhilJS updates only the exact DOM nodes that changed.

## Server Components

React 19 Server Components run only on the server:

```tsx
// React 19
async function UserList() {
  const users = await db.users.findAll();
  return <ul>{users.map(u => <li>{u.name}</li>)}</ul>;
}
```

### PhilJS Equivalent

```tsx
// PhilJS with SSR
export async function loader() {
  return { users: await db.users.findAll() };
}

export default function UserList({ data }) {
  return <ul>{data.users.map(u => <li>{u.name}</li>)}</ul>;
}
```

## Actions

React 19 introduces Actions for form handling:

```tsx
// React 19
async function createUser(formData) {
  'use server';
  await db.users.create(formData);
}

function Form() {
  return (
    <form action={createUser}>
      <input name="name" />
      <button type="submit">Create</button>
    </form>
  );
}
```

### PhilJS Equivalent

```tsx
// PhilJS
function Form() {
  const submit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await api.users.create(Object.fromEntries(formData));
  };
  
  return (
    <form onSubmit={submit}>
      <input name="name" />
      <button type="submit">Create</button>
    </form>
  );
}
```

## Migration from React 19 to PhilJS

### 1. Replace useState with signals

```tsx
// Before (React 19)
const [count, setCount] = useState(0);

// After (PhilJS)
const count = signal(0);
```

### 2. Replace useContext with stores

```tsx
// Before (React 19)
const theme = useContext(ThemeContext);

// After (PhilJS)
const theme = useStore(themeStore);
```

### 3. Keep Server Components pattern

Both support async components that fetch data on the server.

## Performance Comparison

| Feature | React 19 | PhilJS |
|---------|----------|--------|
| Re-render optimization | Compiler auto-memo | Not needed (signals) |
| Bundle size | ~40KB | ~15KB |
| Server components | ✅ | ✅ |
| Streaming SSR | ✅ | ✅ |
| Fine-grained updates | ❌ (VDOM) | ✅ (Signals) |

## Conclusion

PhilJS provides React 19-like optimizations out of the box without needing a compiler. The Universal Component Protocol also allows using React 19 components directly within PhilJS applications.
