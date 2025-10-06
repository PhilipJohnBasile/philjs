# PhilJS Todo App

A complete todo application demonstrating PhilJS's fine-grained reactivity with signals.

## Features Demonstrated

✅ **Signals & Reactivity**
- Fine-grained updates (only changed DOM nodes re-render)
- Direct signal manipulation with `signal()`
- Reactive computations for filtered lists

✅ **State Management**
- Local component state with signals
- Derived state (activeCount, completedCount)
- Efficient list updates

✅ **User Interactions**
- Add, toggle, delete todos
- Filter by status (all/active/completed)
- Clear completed todos

## Running the App

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build
```

## Code Highlights

### Fine-Grained Reactivity

```typescript
const todos = signal<Todo[]>([]);
const filter = signal<"all" | "active" | "completed">("all");

// Derived state - automatically updates when todos or filter changes
const filteredTodos = () => {
  const all = todos();
  const currentFilter = filter();

  if (currentFilter === "active") {
    return all.filter((t) => !t.completed);
  }
  return all;
};
```

### Efficient Updates

```typescript
// Only updates the specific todo that changed
const toggleTodo = (id: number) => {
  todos.set(
    todos().map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  );
};
```

## PhilJS Features Used

- `signal()` - Fine-grained reactive state
- JSX rendering with automatic updates
- Event handlers with proper binding
- Conditional rendering
- List rendering with keys

## Learn More

- [PhilJS Documentation](../../README.md)
- [Signals Guide](../../packages/philjs-core/README.md)
- [More Examples](../)
