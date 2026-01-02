# @philjs/core - Complete Reference

The `@philjs/core` package is the heart of PhilJS, providing fine-grained reactive primitives, JSX runtime, rendering, and essential utilities for building modern web applications.

## Installation

```bash
npm install @philjs/core
# or
pnpm add @philjs/core
# or
bun add @philjs/core
```

## Package Exports

The core package provides 30+ submodule exports for tree-shaking optimization:

| Export | Description |
|--------|-------------|
| `@philjs/core` | Main entry point with all exports |
| `@philjs/core/signals` | Reactive signals, memos, effects |
| `@philjs/core/jsx-runtime` | JSX transformation runtime |
| `@philjs/core/jsx-dev-runtime` | Development JSX runtime |
| `@philjs/core/render-to-string` | Server-side rendering |
| `@philjs/core/hydrate` | Client-side hydration |
| `@philjs/core/context` | Context API for dependency injection |
| `@philjs/core/error-boundary` | Error boundaries and recovery |
| `@philjs/core/forms` | Form handling and validation |
| `@philjs/core/i18n` | Internationalization |
| `@philjs/core/animation` | Animation and motion |
| `@philjs/core/accessibility` | A11y utilities |
| `@philjs/core/ab-testing` | A/B testing engine |
| `@philjs/core/result` | Rust-style Result type |
| `@philjs/core/resumability` | Resumable state (Qwik-style) |
| `@philjs/core/data-layer` | Queries, mutations, caching |
| `@philjs/core/service-worker` | PWA service worker utilities |
| `@philjs/core/performance-budgets` | Performance budget tracking |
| `@philjs/core/cost-tracking` | Cloud cost estimation |
| `@philjs/core/usage-analytics` | Component usage analytics |
| `@philjs/core/testing` | Testing utilities |
| `@philjs/core/superjson` | Enhanced JSON serialization |
| `@philjs/core/plugin-system` | Plugin architecture |
| `@philjs/core/store` | Deep reactive stores |
| `@philjs/core/async` | Advanced async primitives |
| `@philjs/core/disposable` | TypeScript 6 disposables |
| `@philjs/core/tc39-signals` | TC39 Signals proposal |
| `@philjs/core/view-transitions` | View Transitions API |
| `@philjs/core/navigation` | Navigation API |

## Quick Start

```tsx
import { signal, memo, effect, render } from '@philjs/core';

// Create reactive state
const count = signal(0);

// Create derived state
const doubled = memo(() => count() * 2);

// React to changes
effect(() => {
  console.log(`Count: ${count()}, Doubled: ${doubled()}`);
});

// Update state
count.set(5); // Logs: "Count: 5, Doubled: 10"

// Render a component
function Counter() {
  return (
    <div>
      <p>Count: {count()}</p>
      <p>Doubled: {doubled()}</p>
      <button onClick={() => count.set(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}

render(() => <Counter />, document.getElementById('app')!);
```

## Architecture

```
@philjs/core
├── Reactivity Layer
│   ├── signal()      - Reactive state containers
│   ├── memo()        - Computed/derived values
│   ├── effect()      - Side effects with auto-tracking
│   ├── linkedSignal() - Writable computed signals
│   ├── resource()    - Async data with loading states
│   ├── batch()       - Batched updates
│   └── untrack()     - Escape dependency tracking
│
├── Rendering Layer
│   ├── jsx/jsxs      - JSX transformation
│   ├── render()      - Client-side rendering
│   ├── hydrate()     - Server-side hydration
│   └── renderToString() - SSR
│
├── Data Layer
│   ├── createQuery() - Data fetching
│   ├── createMutation() - Data mutations
│   ├── queryCache    - Response caching
│   └── prefetchQuery() - Prefetching
│
├── Context Layer
│   ├── createContext() - Dependency injection
│   ├── useContext()  - Context consumption
│   └── combineProviders() - Provider composition
│
├── Error Handling
│   ├── ErrorBoundary - Error containment
│   ├── Result type   - Rust-style error handling
│   └── Error tracking - Production error capture
│
└── Utilities
    ├── Forms & Validation
    ├── Animation & Motion
    ├── Accessibility
    ├── Internationalization
    ├── A/B Testing
    ├── Performance Monitoring
    └── Security Utilities
```

## Comparison with Other Frameworks

| Feature | PhilJS | React | Solid | Svelte | Vue |
|---------|--------|-------|-------|--------|-----|
| Reactivity | Fine-grained signals | Virtual DOM | Fine-grained signals | Compiler-based | Proxy-based |
| Bundle Size | ~4KB | ~40KB | ~7KB | ~2KB | ~33KB |
| SSR | Built-in streaming | React Server Components | Built-in | SvelteKit | Nuxt |
| TypeScript | First-class | Add-on | First-class | Add-on | First-class |
| Learning Curve | Low | Medium | Low | Low | Medium |

## Next Steps

- [Signals and Reactivity](./signals.md) - Deep dive into the reactive system
- [JSX and Rendering](./jsx-rendering.md) - Component rendering
- [Data Layer](./data-layer.md) - Data fetching and mutations
- [Forms and Validation](./forms.md) - Form handling
- [Server-Side Rendering](./ssr.md) - SSR and hydration
