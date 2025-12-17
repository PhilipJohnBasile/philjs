# Introduction to PhilJS

PhilJS is a modern, high-performance JavaScript framework that brings the best features from React, Solid, Qwik, and Svelte into a single, cohesive package. It offers fine-grained reactivity, zero-hydration resumability, and built-in intelligence features that no other framework provides.

## Why PhilJS?

### Fine-Grained Reactivity
Unlike React's virtual DOM diffing, PhilJS uses **signals** - reactive primitives that update only what's necessary. When a signal changes, only the specific DOM nodes that depend on it are updated.

```typescript playground
import { signal, effect } from 'philjs-core';

// Create a reactive signal
const count = signal(0);

// This effect only runs when count changes
effect(() => {
  console.log('Count is now:', count());
});

// Update the signal
count.set(1);  // Logs: "Count is now: 1"
count.set(2);  // Logs: "Count is now: 2"
```

### Zero-Hydration Resumability
PhilJS can resume server-rendered applications instantly without re-executing components. This means:
- **Instant interactivity** - No waiting for JavaScript to hydrate
- **Smaller JavaScript bundles** - Only load what's needed
- **Better Core Web Vitals** - Superior LCP, FID, and TTI scores

### Built-in Intelligence
PhilJS includes unique features no other framework offers:
- **Cost Tracking** - Track cloud costs per component
- **Usage Analytics** - Identify dead code automatically
- **Performance Budgets** - Automated performance regression detection
- **Auto-Accessibility** - ARIA attributes applied automatically
- **A/B Testing** - Built-in experiment management

## Key Features

| Feature | PhilJS | React | Vue | Svelte |
|---------|--------|-------|-----|--------|
| Fine-grained Reactivity | Yes | No | Yes | Yes |
| Zero Hydration | Yes | No | No | No |
| Auto-Compiler | Yes | Yes | No | Yes |
| PPR (Partial Pre-rendering) | Yes | Yes | No | No |
| Server Islands | Yes | No | No | No |
| Activity Component | Yes | Yes | No | No |
| Built-in A/B Testing | Yes | No | No | No |
| Auto-Accessibility | Yes | No | No | No |
| Cost Tracking | Yes | No | No | No |

## Framework Philosophy

### 1. Developer Experience First
PhilJS is designed to be intuitive. If you know React, you'll feel at home:

```tsx
function Counter() {
  const count = signal(0);

  return (
    <button onClick={() => count.set(c => c + 1)}>
      Clicked {count()} times
    </button>
  );
}
```

### 2. Performance by Default
The compiler automatically optimizes your code:
- Auto-memoization of expensive computations
- Auto-batching of signal updates
- Dead code elimination
- Effect optimization

### 3. Production Ready
Built for real-world applications:
- TypeScript-first with excellent type inference
- Comprehensive error boundaries
- Built-in form handling with validation
- Internationalization support

## Getting Started

Ready to build something? Here's how to get started:

1. **[Installation](/docs/getting-started/installation)** - Set up a new project
2. **[Quick Start](/docs/getting-started/quick-start)** - Build your first app
3. **[Tutorial](/docs/getting-started/tutorial-tic-tac-toe)** - Learn by building

## Community

- **GitHub**: [github.com/philjs/philjs](https://github.com/philjs/philjs)
- **Discord**: Join our community
- **Twitter**: Follow [@philjs](https://twitter.com/philjs) for updates

---

Ready to dive in? Let's start with [installation](/docs/getting-started/installation).
