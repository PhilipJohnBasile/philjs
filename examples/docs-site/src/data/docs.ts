export interface DocPage {
  title: string;
  slug: string;
  content: string;
  category: string;
}

export const docs: DocPage[] = [
  {
    title: 'Installation',
    slug: 'getting-started/installation',
    category: 'Getting Started',
    content: `
# Installation

Get started with PhilJS in seconds.

## Prerequisites

- Node.js 24+ or Bun
- npm, pnpm, yarn, or bun

## Quick Start

The fastest way to create a new PhilJS app:

\`\`\`bash
pnpm create philjs my-app
cd my-app
pnpm install
pnpm dev
\`\`\`

Your app will be running at \`http://localhost:3000\`!

## Manual Installation

Add PhilJS to an existing project:

\`\`\`bash
pnpm add @philjs/core @philjs/router
\`\`\`

Configure your bundler to support JSX:

\`\`\`ts
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@philjs/core',
  },
});
\`\`\`

## Next Steps

- [Quick Start Tutorial](/docs/getting-started/quick-start)
- [Your First Component](/docs/getting-started/first-component)
- [Core Concepts](/docs/learn/signals)
    `,
  },
  {
    title: 'Quick Start',
    slug: 'getting-started/quick-start',
    category: 'Getting Started',
    content: `
# Quick Start

Build your first PhilJS app in 5 minutes.

## Step 1: Create Your App

\`\`\`bash
pnpm create philjs my-app
cd my-app
\`\`\`

## Step 2: Your First Component

Create \`src/Counter.tsx\`:

\`\`\`tsx
import { signal } from '@philjs/core';

export function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`

## Step 3: Use It

Update \`src/App.tsx\`:

\`\`\`tsx
import { Counter } from './Counter';

export function App() {
  return (
    <div>
      <h1>Hello PhilJS!</h1>
      <Counter />
    </div>
  );
}
\`\`\`

## Step 4: Run It

\`\`\`bash
pnpm dev
\`\`\`

Visit \`http://localhost:3000\` and click the button!

## What's Happening?

- \`signal(0)\` creates reactive state
- \`count()\` reads the value
- \`count.set()\` updates the value
- The UI automatically updates - no \`useState\` or dependency arrays!

## Next Steps

- [Learn about Signals](/docs/learn/signals)
- [Build a Todo App](/docs/tutorials/todo-app)
- [Explore Examples](/examples)
    `,
  },
  {
    title: 'Signals & Reactivity',
    slug: 'learn/signals',
    category: 'Learn',
    content: `
# Signals & Reactivity

PhilJS uses fine-grained reactivity with automatic dependency tracking.

## What are Signals?

Signals are reactive primitives that hold a value. When the value changes, any computation that depends on it automatically updates.

\`\`\`tsx
import { signal } from '@philjs/core';

const count = signal(0);

// Read value
console.log(count()); // 0

// Update value
count.set(5);

// Update with function
count.set(c => c + 1);
\`\`\`

## Computed Values (Memos)

Memos are derived values that automatically track dependencies:

\`\`\`tsx
import { signal, memo } from '@philjs/core';

const count = signal(0);
const doubled = memo(() => count() * 2);

console.log(doubled()); // 0
count.set(5);
console.log(doubled()); // 10
\`\`\`

## Effects

Effects run side effects and re-run when dependencies change:

\`\`\`tsx
import { signal, effect } from '@philjs/core';

const count = signal(0);

effect(() => {
  console.log('Count is:', count());
  
  // Optional cleanup
  return () => console.log('Cleanup!');
});

count.set(5); // Logs: "Cleanup!" then "Count is: 5"
\`\`\`

## Batching Updates

Batch multiple updates for better performance:

\`\`\`tsx
import { signal, batch } from '@philjs/core';

const firstName = signal('John');
const lastName = signal('Doe');

batch(() => {
  firstName.set('Jane');
  lastName.set('Smith');
}); // Only triggers one update
\`\`\`

## Untracking

Read signals without creating dependencies:

\`\`\`tsx
import { signal, memo, untrack } from '@philjs/core';

const a = signal(1);
const b = signal(2);

const sum = memo(() => {
  const aVal = a(); // Tracked
  const bVal = untrack(() => b()); // NOT tracked
  return aVal + bVal;
});

b.set(100); // Won't trigger sum to recompute
a.set(5); // Will trigger sum to recompute
\`\`\`

## Key Differences from React

| Feature | React | PhilJS |
|---------|-------|--------|
| State | \`useState\` | \`signal()\` |
| Computed | \`useMemo\` + deps | \`memo()\` (auto) |
| Effects | \`useEffect\` + deps | \`effect()\` (auto) |
| Updates | Re-render entire component | Only changed values |
| Dependencies | Manual arrays | Automatic tracking |

## Best Practices

✅ **Do:**
- Call signals as functions: \`count()\`
- Use memos for expensive computations
- Batch related updates
- Return cleanup functions from effects

❌ **Don't:**
- Mutate signal values directly
- Create infinite loops (signal updating itself)
- Use signals in conditions without memos
    `,
  },
  {
    title: 'Components',
    slug: 'learn/components',
    category: 'Learn',
    content: `
# Components

Learn how to build components in PhilJS.

## Basic Components

Components are just functions that return JSX:

\`\`\`tsx
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}
\`\`\`

## Props

Props are passed as the first argument:

\`\`\`tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

function Button(props: ButtonProps) {
  return (
    <button onClick={props.onClick}>
      {props.label}
    </button>
  );
}
\`\`\`

## Children

Access children via \`props.children\`:

\`\`\`tsx
function Card({ children }: { children: any }) {
  return (
    <div className="card">
      {children}
    </div>
  );
}

// Usage
<Card>
  <h2>Title</h2>
  <p>Content</p>
</Card>
\`\`\`

## Local State

Use signals for component-local state:

\`\`\`tsx
function Counter() {
  const count = signal(0);
  
  return (
    <div>
      <p>{count()}</p>
      <button onClick={() => count.set(count() + 1)}>
        +1
      </button>
    </div>
  );
}
\`\`\`

## Conditional Rendering

Use JavaScript expressions:

\`\`\`tsx
function UserGreeting({ user }: { user: User | null }) {
  return (
    <div>
      {user ? (
        <p>Welcome, {user.name}!</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
\`\`\`

## Lists

Map over arrays:

\`\`\`tsx
function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
\`\`\`

## Composition

Build complex UIs by composing components:

\`\`\`tsx
function App() {
  return (
    <div>
      <Header />
      <main>
        <Sidebar />
        <Content />
      </main>
      <Footer />
    </div>
  );
}
\`\`\`
    `,
  },
  {
    title: 'Routing',
    slug: 'learn/routing',
    category: 'Learn',
    content: `
# Routing

PhilJS uses file-based routing similar to Next.js.

## File Structure

\`\`\`
src/routes/
  index.tsx              → /
  about.tsx              → /about
  products/
    index.tsx            → /products
    [id].tsx             → /products/:id
    [id]/reviews.tsx     → /products/:id/reviews
\`\`\`

## Dynamic Routes

Use \`[param]\` for dynamic segments:

\`\`\`tsx
// src/routes/products/[id].tsx
export async function loader({ params }) {
  const product = await fetchProduct(params.id);
  return { product };
}

export default function ProductPage({ data }) {
  return (
    <div>
      <h1>{data.product.name}</h1>
      <p>\${data.product.price}</p>
    </div>
  );
}
\`\`\`

## Navigation

Use the Link component:

\`\`\`tsx
import { Link } from '@philjs/router';

function Nav() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/products">Products</Link>
    </nav>
  );
}
\`\`\`

## Programmatic Navigation

\`\`\`tsx
import { useNavigate } from '@philjs/router';

function LoginButton() {
  const navigate = useNavigate();
  
  const handleLogin = async () => {
    await login();
    navigate('/dashboard');
  };
  
  return <button onClick={handleLogin}>Login</button>;
}
\`\`\`

## Nested Layouts

Create \`_layout.tsx\` for nested layouts:

\`\`\`tsx
// src/routes/dashboard/_layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div>
      <DashboardNav />
      <main>{children}</main>
    </div>
  );
}
\`\`\`

## Smart Preloading

PhilJS predicts navigation with 60-80% accuracy:

\`\`\`tsx
export const config = {
  preload: 'intent', // Preload when user hovers
};
\`\`\`
    `,
  },
];
