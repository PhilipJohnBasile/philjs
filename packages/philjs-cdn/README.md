# @philjs/cdn

CDN Bundle for PhilJS - Zero Build Step Required

[![Node.js 24+](https://img.shields.io/badge/Node.js-24%2B-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Single-file bundle for Alpine.js-style usage. No build step required - just include via CDN.

**Features:**
- Fine-grained reactivity with signals
- Tagged template literals (`html\`...\``)
- Alpine.js-style directives (x-data, x-text, x-bind, etc.)
- Zero dependencies
- Automatic DOM binding
- Store creation with subscriptions
- Works in any browser with ES2020+ support

## Installation

### Via CDN

```html
<script src="https://unpkg.com/@philjs/cdn"></script>
```

### Via npm

```bash
npm install @philjs/cdn
```

## Quick Start

### Programmatic API

```html
<script src="https://unpkg.com/@philjs/cdn"></script>
<script>
  const { signal, effect, html, render } = PhilJS;

  const count = signal(0);

  effect(() => console.log('Count:', count()));

  render(
    html`<button onclick=${() => count.set(count() + 1)}>
      Clicked ${count} times
    </button>`,
    document.body
  );
</script>
```

### Alpine.js-Style Directives

```html
<div x-data="{ count: 0, name: 'World' }">
  <h1>Hello, <span x-text="name"></span>!</h1>
  <p>Count: <span x-text="count"></span></p>
  <button @click="count++">Increment</button>
  <input x-model="name" placeholder="Enter name">
</div>

<script src="https://unpkg.com/@philjs/cdn"></script>
<script>PhilJS.init();</script>
```

## Usage

### Signals (Reactive State)

```javascript
const { signal, memo, effect, batch } = PhilJS;

// Create a signal
const count = signal(0);

// Read value
console.log(count()); // 0

// Set value
count.set(5);
count.set(prev => prev + 1);

// Update (shorthand for set with function)
count.update(n => n * 2);

// Peek without tracking
const value = count.peek();
```

### Computed Values (Memos)

```javascript
const firstName = signal('John');
const lastName = signal('Doe');

const fullName = memo(() => `${firstName()} ${lastName()}`);

console.log(fullName()); // "John Doe"
```

### Effects

```javascript
const count = signal(0);

const cleanup = effect(() => {
  console.log('Count changed:', count());

  // Optional cleanup function
  return () => {
    console.log('Cleaning up...');
  };
});

// Stop the effect
cleanup();
```

### Batching Updates

```javascript
const a = signal(1);
const b = signal(2);

batch(() => {
  a.set(10);
  b.set(20);
  // Effects run once after batch completes
});
```

### Template Rendering

```javascript
const { html, render, signal } = PhilJS;

const items = signal(['Apple', 'Banana', 'Cherry']);

render(
  html`
    <ul>
      ${() => items().map(item => html`<li>${item}</li>`)}
    </ul>
  `,
  '#app'
);
```

### Directives Reference

| Directive | Description |
|-----------|-------------|
| `x-data` | Define reactive data for a component |
| `x-text` | Set element text content |
| `x-html` | Set element innerHTML |
| `x-show` | Toggle element visibility |
| `x-if` | Toggle element hidden attribute |
| `x-bind:*` or `:*` | Bind attributes |
| `x-on:*` or `@*` | Add event listeners |
| `x-model` | Two-way data binding |
| `x-for` | Loop over arrays (in templates) |
| `x-ref` | Reference elements |
| `{{ }}` | Text interpolation |

### Event Modifiers

```html
<button @click.prevent="handleClick">Prevent Default</button>
<button @click.stop="handleClick">Stop Propagation</button>
<button @click.once="handleClick">Run Once</button>
<button @click.self="handleClick">Only Self</button>
```

### Store Creation

```javascript
const { createStore } = PhilJS;

const store = createStore({
  count: 0,
  increment() {
    this.count++;
  },
  decrement() {
    this.count--;
  }
});

store.$subscribe(() => {
  console.log('Store updated:', store.count);
});

store.increment();
```

### Lifecycle

```javascript
const { onMount, nextTick } = PhilJS;

onMount(() => {
  console.log('DOM is ready');

  return () => {
    console.log('Cleanup on unmount');
  };
});

// Wait for next microtask
await nextTick();
```

## API Reference

### Reactivity

- `signal<T>(initial)` - Create a reactive signal
- `memo<T>(fn)` - Create a computed/derived value
- `effect(fn)` - Create a side effect
- `batch<T>(fn)` - Batch multiple updates
- `untrack<T>(fn)` - Run without tracking dependencies

### Templates

- `html\`...\`` - Tagged template for HTML
- `render(template, container)` - Render template to DOM

### Alpine-style

- `init(root?)` - Initialize directives on DOM
- `createStore(state)` - Create reactive store

### Utilities

- `nextTick()` - Wait for next microtask
- `onMount(fn)` - Run on DOM ready

### Global Object

```javascript
// All exports available on window.PhilJS
const {
  signal, memo, effect, batch, untrack,
  html, render,
  init, createStore,
  nextTick, onMount,
  version
} = PhilJS;
```

## Types

```typescript
interface Signal<T> {
  (): T;
  set: (value: T | ((prev: T) => T)) => void;
  update: (fn: (prev: T) => T) => void;
  peek: () => T;
}
```

## Browser Support

- Chrome 80+
- Firefox 74+
- Safari 13.1+
- Edge 80+

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./global, ./esm, ./mini
- Source files: packages/philjs-cdn/src/index.ts

### Public API
- Direct exports: PhilJS, Signal, batch, createStore, effect, html, init, memo, nextTick, onMount, render, signal, untrack
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
