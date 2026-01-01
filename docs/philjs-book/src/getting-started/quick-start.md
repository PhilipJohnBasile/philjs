# Quick Start

Build your first PhilJS application in 5 minutes. By the end of this guide, you'll have a working counter app that demonstrates PhilJS's core concepts.

## What You'll Learn

- Creating a new PhilJS project
- Building your first component
- Using signals for reactive state
- Handling user interactions
- Running your app in the browser

## Step 1: Create a New Project

Open your terminal and run:

```bash
pnpm create philjs my-counter-app
cd my-counter-app
```

When prompted, choose these options:
- **TypeScript (required)** Yes
- **Tailwind CSS?** No (we'll use simple CSS)
- **Git repository?** Yes
- **Install dependencies?** Yes

This creates a new PhilJS project with the following structure:

```
my-counter-app/
├── src/
│   ├── routes/
│   │   └── index.tsx    # Homepage
│   ├── App.tsx          # Root component
│   └── index.tsx        # Entry point
├── public/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Step 2: Create Your First Component

Open `src/routes/index.tsx` and replace its contents with:

```typescript
import { signal } from '@philjs/core';

export default function Home() {
  // Create a reactive signal for our count
  const count = signal(0);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>My First PhilJS App</h1>
      <p>You've clicked {count()} times</p>
      <button onClick={() => count.set(c => c + 1)}>
        Click me!
      </button>
    </div>
  );
}
```

Let's break down what's happening here:

### Creating State with Signals

```typescript
const count = signal(0);
```

This creates a **signal** - PhilJS's reactive state primitive. Signals are like boxes that hold values and notify subscribers when the value changes.

- `signal(0)` creates a signal with initial value of 0
- Signals are reactive - when they change, the UI automatically updates

### Reading Signal Values

```typescript
<p>You've clicked {count()} times</p>
```

To read a signal's value, call it like a function: `count()`.

PhilJS tracks where you read the signal and automatically updates just that part of the DOM when the value changes. This is called **fine-grained reactivity**.

### Updating Signal Values

```typescript
onClick={() => count.set(c => c + 1)}
```

To update a signal, use `.set()`:
- `count.set(5)` - set to a specific value
- `count.set(c => c + 1)` - update based on current value (safer for concurrent updates)

When you click the button, the signal updates and the `<p>` tag automatically shows the new count. Nothing else re-renders!

## Step 3: Add Some Style

Let's make it look better. Update your component:

```typescript
import { signal } from '@philjs/core';

export default function Home() {
  const count = signal(0);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>My First PhilJS App</h1>

        <div style={styles.counter}>
          <button
            style={styles.button}
            onClick={() => count.set(c => c - 1)}
          >
            -
          </button>

          <span style={styles.count}>
            {count()}
          </span>

          <button
            style={styles.button}
            onClick={() => count.set(c => c + 1)}
          >
            +
          </button>
        </div>

        <p style={styles.text}>
          {count() === 0 && "Start counting!"}
          {count() > 0 && count() < 10 && "Keep going!"}
          {count() >= 10 && "You're on fire! 🔥"}
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '3rem',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    textAlign: 'center' as const,
  },
  title: {
    fontSize: '2rem',
    marginBottom: '2rem',
    color: '#333',
  },
  counter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2rem',
    marginBottom: '2rem',
  },
  button: {
    width: '60px',
    height: '60px',
    fontSize: '2rem',
    border: 'none',
    borderRadius: '50%',
    background: '#667eea',
    color: 'white',
    cursor: 'pointer',
    transition: 'transform 0.1s, background 0.2s',
  },
  count: {
    fontSize: '3rem',
    fontWeight: 'bold' as const,
    color: '#667eea',
    minWidth: '100px',
  },
  text: {
    fontSize: '1.2rem',
    color: '#666',
    minHeight: '1.5em',
  },
};
```

### What's New?

**Multiple Buttons**
```typescript
<button onClick={() => count.set(c => c - 1)}>-</button>
<button onClick={() => count.set(c => c + 1)}>+</button>
```

Now you can increment and decrement the counter.

**Conditional Rendering**
```typescript
{count() === 0 && "Start counting!"}
{count() > 0 && count() < 10 && "Keep going!"}
{count() >= 10 && "You're on fire! 🔥"}
```

This shows different messages based on the count value. The `&&` operator in JSX means "if the left side is true, show the right side."

💡 **Note**: Only the part that changes updates in the DOM. When you click +, only the count number and message update - the buttons, title, and container stay unchanged. This is fine-grained reactivity in action!

## Step 4: Run Your App

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see your counter app! Try clicking the buttons - notice how smooth and instant the updates are.

## Step 5: Add More Interactivity

Let's add a reset button and track total clicks:

```typescript
import { signal, memo } from '@philjs/core';

export default function Home() {
  const count = signal(0);
  const totalClicks = signal(0);

  // Computed value that updates automatically
  const isEven = memo(() => count() % 2 === 0);

  const increment = () => {
    count.set(c => c + 1);
    totalClicks.set(t => t + 1);
  };

  const decrement = () => {
    count.set(c => c - 1);
    totalClicks.set(t => t + 1);
  };

  const reset = () => {
    count.set(0);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Counter App</h1>

        <div style={styles.stats}>
          <div>
            Count: <strong>{count()}</strong>
          </div>
          <div>
            Total clicks: <strong>{totalClicks()}</strong>
          </div>
          <div>
            Status: <strong>{isEven() ? 'Even' : 'Odd'}</strong>
          </div>
        </div>

        <div style={styles.counter}>
          <button style={styles.button} onClick={decrement}>
            -
          </button>

          <span style={styles.count}>{count()}</span>

          <button style={styles.button} onClick={increment}>
            +
          </button>
        </div>

        <button style={styles.resetButton} onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '3rem',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    textAlign: 'center' as const,
    minWidth: '400px',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '2rem',
    color: '#333',
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '2rem',
    padding: '1rem',
    background: '#f5f5f5',
    borderRadius: '10px',
    fontSize: '0.9rem',
    color: '#666',
  },
  counter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2rem',
    marginBottom: '2rem',
  },
  button: {
    width: '60px',
    height: '60px',
    fontSize: '2rem',
    border: 'none',
    borderRadius: '50%',
    background: '#667eea',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  count: {
    fontSize: '3rem',
    fontWeight: 'bold' as const,
    color: '#667eea',
    minWidth: '100px',
  },
  resetButton: {
    padding: '0.75rem 2rem',
    fontSize: '1rem',
    border: 'none',
    borderRadius: '10px',
    background: '#e0e0e0',
    color: '#666',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
```

### What's New?

**Computed Values with memo()**
```typescript
const isEven = memo(() => count() % 2 === 0);
```

`memo()` creates a **computed value** that automatically updates when its dependencies change. Here, `isEven` recalculates whenever `count` changes.

Memos are cached - they only recalculate when their dependencies change, making them efficient for expensive computations.

**Multiple State Values**
```typescript
const count = signal(0);
const totalClicks = signal(0);
```

You can have as many signals as you need. Each tracks its own value independently.

**Event Handlers**
```typescript
const increment = () => {
  count.set(c => c + 1);
  totalClicks.set(t => t + 1);
};
```

You can update multiple signals in one handler. PhilJS batches the updates and only re-renders once.

## Understanding What You Built

Congratulations! You've built a fully reactive counter app with PhilJS. Here's what makes it special:

### 1. **Fine-Grained Reactivity**

When you click a button, PhilJS doesn't re-render the entire component. It only updates the specific text nodes that show `count()` and `totalClicks()`.

Try this: Open DevTools → Elements and watch the DOM as you click. You'll see only the numbers flash, not the buttons or container.

### 2. **Minimal Code**

You wrote about 80 lines of code (including styles) to create a fully functional app. No boilerplate, no setup, just your logic.

### 3. **TypeScript Safety**

Even though you didn't write type annotations, TypeScript knows:
- `count` is a `Signal<number>`
- `isEven` is a `Memo<boolean>`
- Your event handlers have the correct signatures

Try calling `count.set("hello")` - TypeScript will error because count expects a number.

### 4. **Performance**

This app is incredibly fast:
- Initial bundle: ~12KB (gzipped)
- Updates: < 1ms
- Memory: Minimal (just two numbers)
- No virtual DOM diffing
- No unnecessary re-renders

## Next Steps

Now that you've built your first app, you're ready to learn more:

### Continue Learning

1. **[Components](../core/components.md)** - Learn about component composition and props
2. **[Signals Deep Dive](../core/signals.md)** - Master reactive state
3. **[Tutorial: Tic-Tac-Toe](./tutorial-tic-tac-toe.md)** - Build a game and learn advanced concepts

### Build Something Real

Try building:
- **Todo List** - Add items, mark complete, filter (practice lists and state)
- **Weather App** - Fetch data from an API (practice data fetching)
- **Blog** - Multiple pages with routing (practice routing and SSG)

### Explore Features

- **[Routing](../routing/basics.md)** - File-based routing with layouts
- **[Data Fetching](../data/overview.md)** - Queries, mutations, caching
- **[Forms](../data/forms.md)** - Form handling and validation
- **[Server Functions](../data/server-functions.md)** - Call server code like functions

## Common Questions

**Q: Why call signals like functions: `count()` instead of `count`?**

A: Calling signals as functions lets PhilJS track where they're used. When you write `count()` in JSX, PhilJS subscribes that specific DOM node to updates. This enables fine-grained reactivity.

**Q: Can I use classes instead of functions?**

A: PhilJS uses function components only. They're simpler, more performant, and work better with TypeScript inference.

**Q: Do I need to call `.set()` or can I mutate directly?**

A: Always use `.set()`. Signals are immutable from the outside - the only way to change them is through `.set()`. This makes updates predictable and trackable.

**Q: How do I use this in a real app?**

A: This same pattern scales to apps of any size. You might organize signals into stores, use context for global state, and break components into smaller pieces, but the fundamentals are the same.

**Q: What about async data?**

A: Use `createResource()` for async data fetching. We'll cover this in the data fetching guide.

## Troubleshooting

**Nothing shows up**

Check the browser console for errors. Common issues:
- Missing `export default` on your component
- Syntax error in JSX
- Signal read without calling it: `{count}` instead of `{count()}`

**Updates don't work**

Make sure you're calling `.set()` to update signals:
```typescript
// ❌ Wrong
count.value = 5;

// ✅ Correct
count.set(5);
```

**TypeScript errors**

Make sure your `tsconfig.json` has (TypeScript 6+):
```json
{
  "compilerOptions": {
    "target": "ES2024",
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "preserve",
    "jsxImportSource": "@philjs/core",
    "isolatedDeclarations": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## Summary

You've learned:

✅ Creating a PhilJS project
✅ Building components with JSX
✅ Managing state with signals
✅ Creating computed values with memo
✅ Handling events
✅ Conditional rendering
✅ Styling components

With these fundamentals, you're ready to build real applications with PhilJS!

---

**Next:** [Your First Component →](./your-first-component.md)


