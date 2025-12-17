# Quick Start

Let's build a simple counter app to understand the basics of PhilJS. This guide assumes you've already [installed PhilJS](/docs/getting-started/installation).

## Your First App

### Step 1: Create the Entry Point

Create `src/main.tsx`:

```tsx
import { render } from 'philjs-core';
import { App } from './App';

render(<App />, document.getElementById('root')!);
```

### Step 2: Build the App Component

Create `src/App.tsx`:

```tsx playground
import { signal } from 'philjs-core';

export function App() {
  // Create a reactive signal
  const count = signal(0);

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Hello, PhilJS!</h1>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Step 3: Run the App

```bash
npm run dev
```

Open http://localhost:5173 and you'll see your counter app!

## Understanding the Code

### Signals

Signals are PhilJS's reactive primitive. They hold a value that can change over time.

```tsx playground
import { signal } from 'philjs-core';

// Create a signal with initial value
const name = signal('World');

// Read the value by calling the signal
console.log(name());  // "World"

// Update the value
name.set('PhilJS');
console.log(name());  // "PhilJS"

// Update based on previous value
name.set(prev => prev + '!');
console.log(name());  // "PhilJS!"
```

### Automatic Updates

When you use a signal in JSX, PhilJS automatically subscribes to changes:

```tsx
function Greeting() {
  const name = signal('World');

  return (
    <div>
      {/* This text updates when name changes */}
      <p>Hello, {name()}!</p>

      <input
        value={name()}
        onInput={(e) => name.set(e.target.value)}
      />
    </div>
  );
}
```

### Memos (Computed Values)

Use `memo` for derived values that should be cached:

```tsx playground
import { signal, memo } from 'philjs-core';

const firstName = signal('John');
const lastName = signal('Doe');

// Memo automatically recomputes when dependencies change
const fullName = memo(() => `${firstName()} ${lastName()}`);

console.log(fullName());  // "John Doe"

firstName.set('Jane');
console.log(fullName());  // "Jane Doe"
```

### Effects (Side Effects)

Use `effect` for operations that should run when signals change:

```tsx playground
import { signal, effect } from 'philjs-core';

const count = signal(0);

// This runs whenever count changes
effect(() => {
  console.log('Count changed to:', count());
  document.title = `Count: ${count()}`;
});

count.set(1);  // Effect runs, logs "Count changed to: 1"
count.set(2);  // Effect runs, logs "Count changed to: 2"
```

## Building a Todo App

Let's build something more practical:

```tsx
import { signal, memo } from 'philjs-core';

function TodoApp() {
  const todos = signal([
    { id: 1, text: 'Learn PhilJS', done: false },
    { id: 2, text: 'Build something awesome', done: false },
  ]);
  const newTodo = signal('');

  // Computed value
  const remaining = memo(() =>
    todos().filter(t => !t.done).length
  );

  const addTodo = () => {
    if (newTodo().trim()) {
      todos.set([
        ...todos(),
        { id: Date.now(), text: newTodo(), done: false }
      ]);
      newTodo.set('');
    }
  };

  const toggleTodo = (id: number) => {
    todos.set(todos().map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    ));
  };

  return (
    <div>
      <h1>Todos ({remaining()} remaining)</h1>

      <form onSubmit={(e) => { e.preventDefault(); addTodo(); }}>
        <input
          value={newTodo()}
          onInput={(e) => newTodo.set(e.target.value)}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add</button>
      </form>

      <ul>
        {todos().map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{
              textDecoration: todo.done ? 'line-through' : 'none'
            }}>
              {todo.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Key Concepts Summary

| Concept | Purpose | Example |
|---------|---------|---------|
| `signal(value)` | Reactive state | `const count = signal(0)` |
| `signal()` | Read value | `count()` returns `0` |
| `signal.set(value)` | Update value | `count.set(1)` |
| `memo(fn)` | Computed value | `memo(() => count() * 2)` |
| `effect(fn)` | Side effects | `effect(() => console.log(count()))` |

## Next Steps

Now that you understand the basics, explore more:

- [Your First Component](/docs/getting-started/your-first-component) - Component patterns
- [Signals Deep Dive](/docs/learn/signals) - Advanced signal usage
- [Tutorial: Tic-Tac-Toe](/docs/getting-started/tutorial-tic-tac-toe) - Build a game
