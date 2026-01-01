# Conditional and Lists

Use normal TypeScript control flow. JSX stays a pure expression.

## Conditional rendering

```tsx
import { signal } from "@philjs/core";

type User = { name: string };
const user = signal<User | null>(null);

export function Welcome() {
  return (
    <section>
      {user() ? <p>Welcome, {user()!.name}</p> : <p>Sign in to continue.</p>}
    </section>
  );
}
```

## Rendering lists

```tsx
type Task = { id: string; title: string };
const tasks = signal<Task[]>([]);

export function TaskList() {
  return (
    <ul>
      {tasks().map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
```

## Guards and fallbacks

Use early returns and small helpers for clarity:

```tsx
function EmptyState() {
  return <p>No tasks yet. Add one?</p>;
}

export function TaskList() {
  const data = tasks();
  if (!data.length) return <EmptyState />;
  return (
    <ul>
      {data.map(task => <li key={task.id}>{task.title}</li>)}
    </ul>
  );
}
```

## Async-friendly rendering

Pair with resources for loading and error states:

```tsx
const stats = resource(fetchStats);

export function StatsPanel() {
  return (
    <section>
      {stats.loading && <p>Loading…</p>}
      {stats.error && <p role="alert">Failed to load stats</p>}
      {stats() && <pre>{JSON.stringify(stats(), null, 2)}</pre>}
    </section>
  );
}
```

## Keys and stability

- Always use stable `key` values (ids) for lists.
- Avoid using array indexes except for static lists.
- For large lists, consider windowing/virtualization (community libs) to cut DOM cost.

## Conditional classes/styles

```tsx
const active = signal(false);

<button
  class={() => `tab ${active() ? 'tab-active' : ''}`}
  aria-pressed={() => active() ? 'true' : 'false'}
>
  Tab
</button>
```

## Checklist

- [ ] Stable keys for dynamic lists.
- [ ] Loading/error/empty states for async data.
- [ ] Accessible states (aria-pressed/aria-busy/role="alert").
- [ ] Avoid heavy computation inline; precompute with memos.

## Try it now: filtered list

```tsx
const filter = signal('');
const todos = signal([{ id: '1', title: 'Docs' }, { id: '2', title: 'Ship' }]);
const filtered = memo(() =>
  todos().filter(t => t.title.toLowerCase().includes(filter().toLowerCase()))
);
```

Render `filtered()` with stable keys; type into the filter input and watch recompute only once per change.
