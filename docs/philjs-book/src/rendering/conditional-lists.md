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
