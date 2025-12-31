# Introduction to PhilJS

Welcome to PhilJS - a TypeScript-first framework that thinks ahead so you don't have to.

## What is PhilJS?

PhilJS is a modern web framework that combines the best ideas from React, Solid, and Qwik while introducing groundbreaking concepts like **zero-hydration resumability**, **cost-aware rendering**, and **AI-powered optimization**. Built from the ground up with performance and developer experience in mind, PhilJS makes it effortless to build lightning-fast web applications.

Unlike traditional frameworks that force you to choose between server rendering and client interactivity, PhilJS gives you both without compromise. Applications built with PhilJS load instantly, stay responsive, and cost less to run - automatically.

At its core, PhilJS uses **fine-grained reactivity** with signals, meaning your UI updates surgically when data changes. No virtual DOM diffing. No unnecessary re-renders. Just direct, efficient updates to exactly what changed.

## Try It Yourself

Here's a simple PhilJS example you can edit and run right in your browser:

```typescript live
const count = signal(0);

const increment = () => {
  count.set(count() + 1);
};

console.log('Initial count:', count());

// Simulate clicking the button 3 times
increment();
console.log('After increment:', count());

increment();
console.log('After second increment:', count());

increment();
console.log('After third increment:', count());
```

Try modifying the code above! Change the initial value, add more increments, or experiment with the signal API.

## Why PhilJS?

### 1. **Instant First Load with Resumability**

Traditional frameworks hydrate your entire application on the client, re-executing all your component code just to attach event listeners. PhilJS uses **resumability** - your app picks up exactly where the server left off with zero wasted work.

**What this means for you:**
- **0ms hydration time** (vs 500-2000ms for typical React apps)
- **Interactive immediately** - no "loading" phase
- **Better user experience** - especially on slow devices/networks

**Real-world impact:**
```
React App:     Server HTML → Download 200KB JS → Parse → Hydrate 500ms → Interactive
PhilJS App:    Server HTML → Interactive immediately
```

### 2. **Fine-Grained Reactivity = Maximum Performance**

PhilJS uses **signals** instead of virtual DOM. When your data changes, only the specific DOM nodes that depend on that data update - nothing else.

**Example:**
```typescript
// A counter that updates without re-rendering anything else
const count = signal(0);

<div>
  <h1>My App</h1>
  <p>Count: {count()}</p>  {/* Only this text node updates */}
  <button onClick={() => count.set(c => c + 1)}>+</button>
</div>
```

When you click the button, **only the text node** showing the count updates. The h1, the div, the button - all unchanged. This is true for apps of any size.

**Performance benefits:**
- 10x faster updates than Virtual DOM frameworks
- No diffing algorithm overhead
- Predictable, consistent performance
- Better battery life on mobile

### 3. **Cost Tracking Built-In**

PhilJS is the first framework with **built-in cost tracking**. See exactly how much your components cost to run in production - down to the penny.

```typescript
import { useCosts } from '@philjs/core';

export function Dashboard() {
  const costs = useCosts({ component: 'Dashboard' });

  return (
    <div>
      <p>This component costs: ${costs.total}/month</p>
      <p>Renders: {costs.renders} @ {costs.renderCost}</p>
      <p>Data: {costs.dataTransfer} @ {costs.dataCost}</p>
    </div>
  );
}
```

**Why this matters:**
- Identify expensive components before they hit production
- Set performance budgets in dollars, not milliseconds
- Optimize where it actually matters
- Make business-driven technical decisions

### 4. **TypeScript 6 First**

PhilJS is written in TypeScript and designed for TypeScript 6+. Every API is fully typed with excellent inference and leverages the latest TypeScript features.

```typescript
// Props are automatically inferred with TypeScript 6 features
function UserProfile({ user, onSave }: {
  user: { name: string; email: string };
  onSave: (user: User) => Promise<void>;
}) {
  const editing = signal(false);

  // TypeScript 6 knows editing is Signal<boolean>
  // Full autocomplete and type checking everywhere
}

// Using TypeScript 6 satisfies operator for config
const config = {
  theme: 'dark',
  version: 2,
} as const satisfies AppConfig;

// Using NoInfer for better generic inference
function createStore<T>(initial: NoInfer<T>): Store<T> {
  return new Store(initial);
}
```

**TypeScript 6 Benefits:**
- Isolated declarations for faster builds
- Enhanced `satisfies` operator
- `NoInfer<T>` utility type for better generics
- Improved const type parameters
- Better auto-imports and go-to-definition

### 5. **Server Functions = Zero Boilerplate APIs**

Call server code from your components like regular functions - PhilJS handles everything.

```typescript
// server.ts
export const getUser = serverFn(async (id: number) => {
  // This runs ONLY on the server
  const user = await db.users.findById(id);
  return user;
});

// client.tsx
import { getUser } from './server';

export function UserProfile({ userId }: { userId: number }) {
  const user = await getUser(userId);

  return <div>{user.name}</div>;
}
```

**No need for:**
- Separate API routes
- REST endpoint definitions
- GraphQL schemas
- API client code
- Manual serialization

Just call the function. PhilJS handles the network request, serialization, error handling, and type safety automatically.

### 6. **Islands Architecture for Maximum Performance**

Use **islands** to ship minimal JavaScript. Only interactive components get hydrated - the rest is pure HTML.

```typescript
// This button is interactive (small JS bundle)
<Counter client:load />

// This content is static HTML (0 JS)
<BlogPost post={post} />

// This loads only when visible (lazy loaded)
<Comments client:visible />
```

**Results:**
- 90% less JavaScript shipped
- Faster page loads
- Better Core Web Vitals
- Lower bounce rates

### 7. **Batteries Included**

PhilJS comes with everything you need:

- ✅ **File-based routing** with layouts and nested routes
- ✅ **Data fetching** with caching and invalidation
- ✅ **Form handling** with validation and server actions
- ✅ **Authentication** patterns built-in
- ✅ **Real-time updates** via WebSockets/SSE
- ✅ **i18n** with locale routing
- ✅ **Testing utilities** for components and integration
- ✅ **DevTools** with time-travel debugging
- ✅ **Static generation** with ISR
- ✅ **Image optimization**
- ✅ **Code splitting** automatic and manual

No decision fatigue. No hunting for packages. Everything works together perfectly.

## Who Should Use PhilJS?

### Perfect For:

**Startups and MVPs**
- Ship fast with minimal code
- Scale without rewriting
- Built-in cost tracking helps manage budgets
- TypeScript catches bugs before users do

**E-commerce Sites**
- Fast page loads = higher conversion
- Resumability = instant interactivity
- Islands = minimal JavaScript
- Great Core Web Vitals = better SEO

**Content Sites and Blogs**
- Static generation for speed
- Dynamic data when needed
- Excellent SEO out of the box
- Great authoring experience

**Enterprise Applications**
- TypeScript-first for large teams
- Predictable performance at scale
- Cost tracking for accountability
- Excellent tooling and DevTools

**Mobile-First Applications**
- Minimal JavaScript = better mobile experience
- Fine-grained reactivity = smooth animations
- Works great on slow networks
- Battery-friendly

### Consider Alternatives If:

**You Need React's Ecosystem**
- PhilJS is new - fewer third-party libraries
- Some React libraries won't work in PhilJS
- Consider Next.js if you need the React ecosystem

**You're Building a Desktop App**
- Use Electron with React or Vue
- PhilJS is optimized for web

**You Need a JavaScript-Only Stack**
- PhilJS is TypeScript-first and requires TypeScript 6+
- Consider Vue or Svelte if your team needs JavaScript-only projects

## How Is PhilJS Different?

### vs React

**What's Better:**
- ⚡ 10x faster updates (signals vs virtual DOM)
- 📦 Smaller bundle sizes (no runtime overhead)
- 🚀 Zero hydration (resumability vs hydration)
- 💰 Built-in cost tracking
- 🎯 Server functions (vs REST/GraphQL)

**Trade-offs:**
- 📚 Smaller ecosystem (newer framework)
- 🔄 Different mental model (signals vs hooks)
- 🛠️ Fewer third-party components

**When to choose React:**
- You need specific React libraries
- Your team already knows React well
- You're building a React Native app

### vs Vue

**What's Better:**
- ⚡ Faster (fine-grained reactivity)
- 🚀 Resumability (vs hydration)
- 📝 TypeScript-first (better inference)
- 🎯 Server functions built-in

**Trade-offs:**
- 📚 Newer with less documentation
- 🎨 No template syntax (JSX only)

**When to choose Vue:**
- You prefer template syntax
- You need Vue's ecosystem
- Your team knows Vue well

### vs Svelte

**What's Better:**
- 🚀 Resumability (instant interactivity)
- 💰 Cost tracking
- 🌊 Better streaming SSR
- 🏝️ Islands architecture built-in

**Trade-offs:**
- 🎨 No template syntax (JSX vs Svelte syntax)
- 📚 Smaller community

**When to choose Svelte:**
- You love the Svelte syntax
- You don't need SSR/streaming
- You're building a SPA

### vs Next.js

PhilJS includes everything Next.js does plus:
- ⚡ Fine-grained reactivity (faster updates)
- 🚀 Resumability (zero hydration)
- 🏝️ Islands architecture
- 💰 Cost tracking

**When to choose Next.js:**
- You need the React ecosystem
- You're migrating an existing React app
- Your team is React-focused

## Quick Feature Overview

### Requirements
- **Node.js 24+** (Node 25 supported) - Required for native ESM, Promise.withResolvers(), Object.groupBy()
- **TypeScript 6+** - Required for isolated declarations and enhanced inference

### Reactivity
```typescript
import { signal, memo, effect } from '@philjs/core';

const count = signal(0);           // Reactive state
const doubled = memo(() => count() * 2);  // Computed value
effect(() => console.log(count()));       // Side effect
```

### Components
```typescript
export function Welcome({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}
```

### Server Functions
```typescript
const saveUser = serverFn(async (user: User) => {
  await db.users.save(user);
});
```

### Routing
```
src/routes/
  index.tsx        → /
  about.tsx        → /about
  users/
    [id].tsx       → /users/123
```

### Data Fetching
```typescript
const user = createQuery(() => fetchUser(userId()));
```

### Forms
```typescript
<form action={createUser}>
  <input name="name" required />
  <button>Create</button>
</form>
```

## Getting Started

Ready to build something amazing? Let's go:

1. **[Installation](./installation.md)** - Get PhilJS installed in 30 seconds
2. **[Quick Start](./quick-start.md)** - Build your first app in 5 minutes
3. **[Tutorial](./tutorial-tic-tac-toe.md)** - Learn by building a game

## Community and Support

- **GitHub**: [github.com/philjs/philjs](https://github.com/philjs/philjs)
- **Discord**: [discord.gg/philjs](https://discord.gg/philjs)
- **Twitter**: [@philjs](https://twitter.com/philjs)
- **Stack Overflow**: Tag with `philjs`

## License

PhilJS is MIT licensed. Free for personal and commercial use.

---

**Next:** [Installation →](./installation.md)
