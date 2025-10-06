# 🚀 Getting Started with PhilJS

Welcome to PhilJS - the framework that thinks ahead! This guide will get you up and running in minutes.

## Installation

### Option 1: Create New App (Recommended)

```bash
npx create-philjs my-app
cd my-app
pnpm install
pnpm dev
```

### Option 2: Manual Setup

```bash
mkdir my-app
cd my-app
pnpm init
pnpm add philjs-core philjs-router philjs-ssr
pnpm add -D philjs-cli vite typescript
```

## Your First PhilJS App

### 1. Create index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My PhilJS App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 2. Create src/main.tsx

```typescript
import { render } from "philjs-core";
import { App } from "./App";

render(<App />, document.getElementById("root")!);
```

### 3. Create src/App.tsx

```typescript
import { signal } from "philjs-core";

export function App() {
  const count = signal(0);

  return (
    <div>
      <h1>Welcome to PhilJS!</h1>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### 4. Create vite.config.ts

```typescript
import { defineConfig } from "vite";
import { philJSPlugin } from "philjs-cli";

export default defineConfig({
  plugins: [philJSPlugin()],
});
```

### 5. Create tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "jsxImportSource": "philjs-core",
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

### 6. Start Dev Server

```bash
pnpm dev
```

Visit `http://localhost:3000` - you should see your app running!

## Core Concepts

### Signals: Fine-Grained Reactivity

```typescript
import { signal, memo } from "philjs-core";

// Create a signal
const count = signal(0);

// Read the value
console.log(count()); // 0

// Update the value
count.set(5);
count.set(c => c + 1); // Updater function

// Create derived state
const doubled = memo(() => count() * 2);
console.log(doubled()); // 12
```

### Components

```typescript
// Function components
export function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(c => c + 1)}>+</button>
    </div>
  );
}

// Components with props
export function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}
```

### Routing

Create files in `src/routes/`:

```
src/routes/
  index.tsx          → /
  about.tsx          → /about
  products/
    index.tsx        → /products
    [id].tsx         → /products/:id
```

Example route component:

```typescript
// src/routes/products/[id].tsx
import { useParams } from "philjs-router";

export default function Product() {
  const { id } = useParams();

  return (
    <div>
      <h1>Product {id}</h1>
    </div>
  );
}
```

### Data Fetching

```typescript
import { createQuery } from "philjs-core";

export default function Products() {
  const products = createQuery("products", async () => {
    const res = await fetch("/api/products");
    return res.json();
  });

  return (
    <div>
      {products.loading() && <p>Loading...</p>}
      {products.error() && <p>Error: {products.error()}</p>}
      {products.data() && (
        <ul>
          {products.data().map(p => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Forms

```typescript
import { useForm, validators as v } from "philjs-core";

export function SignupForm() {
  const form = useForm({
    schema: {
      email: v.string().email().required(),
      password: v.string().min(8).required(),
      age: v.number().min(18),
    },
    onSubmit: async (values) => {
      await fetch("/api/signup", {
        method: "POST",
        body: JSON.stringify(values),
      });
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        type="email"
        value={form.values().email}
        onChange={e => form.setValue("email", e.target.value)}
      />
      {form.errors().email && <p>{form.errors().email}</p>}

      <input
        type="password"
        value={form.values().password}
        onChange={e => form.setValue("password", e.target.value)}
      />

      <button type="submit">Sign Up</button>
    </form>
  );
}
```

## Next Steps

### Essential Reading

1. [Signals & Reactivity](./packages/philjs-core/README.md)
2. [Routing Guide](./packages/philjs-router/README.md)
3. [Forms & Validation](./docs/forms.md)
4. [SSR/SSG/ISR](./packages/philjs-ssr/README.md)

### Examples

- [Todo App](./examples/todo-app) - Signals and state management
- [Blog](./examples/blog) - SSG with automatic regeneration
- [E-commerce](./examples/storefront) - Full-featured store

### Advanced Topics

- [Performance Optimization](./docs/performance.md)
- [Smart Preloading](./docs/smart-preloading.md)
- [Time-Travel Debugging](./docs/time-travel.md)
- [Cost Tracking](./docs/cost-tracking.md)
- [Production Analytics](./docs/usage-analytics.md)

## Common Patterns

### Conditional Rendering

```typescript
{condition() && <div>Rendered when true</div>}
{condition() ? <TrueComponent /> : <FalseComponent />}
```

### Lists

```typescript
{items().map(item => (
  <div key={item.id}>{item.name}</div>
))}
```

### Event Handling

```typescript
<button onClick={() => handleClick()}>Click</button>
<input onChange={e => handleChange(e.target.value)} />
<form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
```

### Effects

```typescript
import { createEffect } from "philjs-core";

createEffect(() => {
  console.log("Count changed:", count());
  // Cleanup
  return () => console.log("Cleanup");
});
```

### Context

```typescript
import { createContext, useContext } from "philjs-core";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const theme = signal("light");

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

## CLI Commands

```bash
# Development
philjs dev              # Start dev server
philjs build            # Production build
philjs preview          # Preview production build

# Tools
philjs analyze          # Bundle size analysis
philjs generate-types   # Generate route types
philjs test             # Run tests

# Configuration
philjs init             # Initialize philjs.config.ts
```

## Troubleshooting

### TypeScript errors with JSX

Make sure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "philjs-core"
  }
}
```

### Hot module replacement not working

Ensure Vite config includes the PhilJS plugin:

```typescript
import { philJSPlugin } from "philjs-cli";

export default defineConfig({
  plugins: [philJSPlugin()],
});
```

### Import errors

Use explicit file extensions in imports:

```typescript
import { App } from "./App.tsx";
```

## Getting Help

- [GitHub Issues](https://github.com/philjs/philjs/issues)
- [Discord Community](#)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/philjs)

## What's Next?

Now that you have the basics, explore:

1. **Novel Features**: Try [smart preloading](./docs/smart-preloading.md) and [time-travel debugging](./docs/time-travel.md)
2. **Build Something**: Check out our [examples](./examples/)
3. **Go Deep**: Read the [API documentation](./API.md)
4. **Share**: Deploy and show us what you built!

---

**Welcome to the future of web development!** 🚀
