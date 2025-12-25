# Migrating from Svelte to PhilJS

This guide helps you migrate Svelte applications to PhilJS. Both frameworks share a compile-time optimization philosophy and fine-grained reactivity, making them conceptually similar.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Concept Mapping](#concept-mapping)
3. [Reactivity Comparison](#reactivity-comparison)
4. [Component Syntax](#component-syntax)
5. [Template to JSX](#template-to-jsx)
6. [Stores](#stores)
7. [SvelteKit to PhilJS Full-Stack](#sveltekit-to-philjs-full-stack)
8. [Svelte 5 Runes Comparison](#svelte-5-runes-comparison)
9. [Common Patterns](#common-patterns)
10. [Step-by-Step Migration](#step-by-step-migration)

---

## Quick Start

### Installation

```bash
# Remove Svelte dependencies
npm uninstall svelte @sveltejs/kit svelte-check

# Install PhilJS
npm install philjs-core philjs-router
```

### Basic Component Conversion

```svelte
<!-- Before (Svelte) -->
<script lang="ts">
  let count = 0;
  $: doubled = count * 2;

  function increment() {
    count += 1;
  }
</script>

<button on:click={increment}>
  Count: {count} (Doubled: {doubled})
</button>

<style>
  button { background: blue; color: white; }
</style>
```

```tsx
// After (PhilJS)
import { signal, memo } from 'philjs-core';

function Counter() {
  const count = signal(0);
  const doubled = memo(() => count() * 2);

  const increment = () => count.set(c => c + 1);

  return (
    <button onClick={increment} style={{ background: 'blue', color: 'white' }}>
      Count: {count()} (Doubled: {doubled()})
    </button>
  );
}

export default Counter;
```

---

## Concept Mapping

| Svelte | PhilJS | Notes |
|--------|--------|-------|
| `let x = value` (reactive) | `signal(value)` | Svelte `let` is implicitly reactive |
| `$: x = expr` (derived) | `memo(() => expr)` | Reactive declarations |
| `$: { statements }` | `effect(() => { })` | Reactive statements (side effects) |
| `onMount()` | `onMount()` | Same |
| `onDestroy()` | `onCleanup()` | Cleanup function |
| `beforeUpdate`/`afterUpdate` | `effect()` | Use effects instead |
| `writable()` store | `signal()` | PhilJS signals are global-ready |
| `readable()` store | `signal()` (read-only) | Expose only getter |
| `derived()` store | `memo()` | Derived values |
| `{#if}...{/if}` | `{condition && <.../>}` | JSX conditional |
| `{#each}...{/each}` | `{items.map(...)}` | JSX iteration |
| `{#await}...{/await}` | `resource()` | Async data |
| `bind:value` | `value` + `onInput` | Two-way binding |
| `on:event` | `onEvent` | Event handlers |
| `<slot>` | `props.children` | Children pattern |
| `$$props` | `props` | All props object |

---

## Reactivity Comparison

### Reactive Variables

```svelte
<!-- Svelte -->
<script>
  let count = 0;        // Reactive by default
  let name = 'World';

  function increment() {
    count += 1;         // Direct mutation triggers updates
  }
</script>
```

```tsx
// PhilJS
import { signal } from 'philjs-core';

function Component() {
  const count = signal(0);
  const name = signal('World');

  const increment = () => count.set(c => c + 1);

  // Read with ()
  console.log(count());
  console.log(name());
}
```

### Reactive Declarations ($:)

```svelte
<!-- Svelte - Derived values -->
<script>
  let count = 0;
  $: doubled = count * 2;           // Recomputes when count changes
  $: quadrupled = doubled * 2;      // Chain of derivations
  $: isEven = count % 2 === 0;
</script>
```

```tsx
// PhilJS
import { signal, memo } from 'philjs-core';

function Component() {
  const count = signal(0);
  const doubled = memo(() => count() * 2);
  const quadrupled = memo(() => doubled() * 2);
  const isEven = memo(() => count() % 2 === 0);
}
```

### Reactive Statements (Side Effects)

```svelte
<!-- Svelte - Side effects -->
<script>
  let count = 0;

  // Runs whenever count changes
  $: console.log('Count is', count);

  // Block form
  $: {
    console.log('Count changed');
    localStorage.setItem('count', count);
  }

  // Conditional
  $: if (count > 10) {
    alert('Count is greater than 10!');
  }
</script>
```

```tsx
// PhilJS
import { signal, effect } from 'philjs-core';

function Component() {
  const count = signal(0);

  // Runs whenever count() is accessed
  effect(() => {
    console.log('Count is', count());
  });

  effect(() => {
    console.log('Count changed');
    localStorage.setItem('count', String(count()));
  });

  effect(() => {
    if (count() > 10) {
      alert('Count is greater than 10!');
    }
  });
}
```

### Lifecycle

```svelte
<!-- Svelte -->
<script>
  import { onMount, onDestroy, beforeUpdate, afterUpdate } from 'svelte';

  onMount(() => {
    console.log('Mounted');
    return () => console.log('Cleanup on unmount');
  });

  onDestroy(() => {
    console.log('Destroyed');
  });

  beforeUpdate(() => {
    console.log('About to update');
  });

  afterUpdate(() => {
    console.log('Updated');
  });
</script>
```

```tsx
// PhilJS
import { onMount, onCleanup, effect } from 'philjs-core';

function Component() {
  onMount(() => {
    console.log('Mounted');
  });

  onCleanup(() => {
    console.log('Destroyed');
  });

  // For update-like behavior, use effects
  effect(() => {
    // This runs on every reactive update
    console.log('Updated');
  });
}
```

---

## Component Syntax

### Props

```svelte
<!-- Svelte -->
<script>
  export let name: string;
  export let count = 0;  // With default
  export let items: string[] = [];
</script>

<div>{name}: {count}</div>
```

```tsx
// PhilJS
interface Props {
  name: string;
  count?: number;
  items?: string[];
}

function Component(props: Props) {
  const { name, count = 0, items = [] } = props;

  return <div>{name}: {count}</div>;
}
```

### Events (Custom Events)

```svelte
<!-- Svelte Child -->
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch('message', { text: 'Hello!' });
  }
</script>

<button on:click={handleClick}>Send</button>

<!-- Svelte Parent -->
<Child on:message={(e) => console.log(e.detail.text)} />
```

```tsx
// PhilJS Child
interface Props {
  onMessage?: (data: { text: string }) => void;
}

function Child(props: Props) {
  const handleClick = () => {
    props.onMessage?.({ text: 'Hello!' });
  };

  return <button onClick={handleClick}>Send</button>;
}

// PhilJS Parent
function Parent() {
  return <Child onMessage={(data) => console.log(data.text)} />;
}
```

### Two-Way Binding

```svelte
<!-- Svelte -->
<script>
  let name = '';
  let checked = false;
  let selected = 'a';
</script>

<input bind:value={name} />
<input type="checkbox" bind:checked={checked} />
<select bind:value={selected}>
  <option value="a">A</option>
  <option value="b">B</option>
</select>
```

```tsx
// PhilJS
import { signal } from 'philjs-core';

function Form() {
  const name = signal('');
  const checked = signal(false);
  const selected = signal('a');

  return (
    <>
      <input
        value={name()}
        onInput={(e) => name.set(e.target.value)}
      />
      <input
        type="checkbox"
        checked={checked()}
        onChange={(e) => checked.set(e.target.checked)}
      />
      <select
        value={selected()}
        onChange={(e) => selected.set(e.target.value)}
      >
        <option value="a">A</option>
        <option value="b">B</option>
      </select>
    </>
  );
}
```

---

## Template to JSX

### Control Flow

```svelte
<!-- Svelte -->
<script>
  let show = true;
  let items = ['a', 'b', 'c'];
  let promise = fetch('/api/data');
</script>

{#if show}
  <p>Visible</p>
{:else}
  <p>Hidden</p>
{/if}

{#each items as item, index (item)}
  <li>{index}: {item}</li>
{/each}

{#await promise}
  <p>Loading...</p>
{:then data}
  <p>{data}</p>
{:catch error}
  <p>Error: {error.message}</p>
{/await}
```

```tsx
// PhilJS
import { signal, resource } from 'philjs-core';

function Component() {
  const show = signal(true);
  const items = signal(['a', 'b', 'c']);
  const data = resource(() => fetch('/api/data').then(r => r.json()));

  return (
    <>
      {/* if/else */}
      {show() ? <p>Visible</p> : <p>Hidden</p>}

      {/* each */}
      {items().map((item, index) => (
        <li key={item}>{index}: {item}</li>
      ))}

      {/* await */}
      {data.loading() ? (
        <p>Loading...</p>
      ) : data.error() ? (
        <p>Error: {data.error().message}</p>
      ) : (
        <p>{JSON.stringify(data())}</p>
      )}
    </>
  );
}
```

### Class and Style Directives

```svelte
<!-- Svelte -->
<script>
  let active = true;
  let big = false;
  let color = 'red';
</script>

<div class:active class:big class="base">Content</div>
<div style:color style:font-size="20px">Styled</div>
```

```tsx
// PhilJS
import { signal } from 'philjs-core';

function Component() {
  const active = signal(true);
  const big = signal(false);
  const color = signal('red');

  return (
    <>
      <div className={`base ${active() ? 'active' : ''} ${big() ? 'big' : ''}`}>
        Content
      </div>
      <div style={{ color: color(), fontSize: '20px' }}>
        Styled
      </div>
    </>
  );
}
```

### Slots to Children

```svelte
<!-- Svelte - Card.svelte -->
<div class="card">
  <header><slot name="header" /></header>
  <main><slot /></main>
  <footer><slot name="footer" /></footer>
</div>

<!-- Usage -->
<Card>
  <h1 slot="header">Title</h1>
  <p>Content</p>
  <button slot="footer">Submit</button>
</Card>
```

```tsx
// PhilJS - Card.tsx
interface CardProps {
  header?: JSX.Element;
  footer?: JSX.Element;
  children: JSX.Element;
}

function Card(props: CardProps) {
  return (
    <div className="card">
      <header>{props.header}</header>
      <main>{props.children}</main>
      <footer>{props.footer}</footer>
    </div>
  );
}

// Usage
function Page() {
  return (
    <Card
      header={<h1>Title</h1>}
      footer={<button>Submit</button>}
    >
      <p>Content</p>
    </Card>
  );
}
```

---

## Stores

### Writable Store to Signal

```typescript
// Svelte
import { writable } from 'svelte/store';

export const count = writable(0);

// Usage in component
$count  // Auto-subscribe with $
count.set(5)
count.update(n => n + 1)

// PhilJS
import { signal } from 'philjs-core';

export const count = signal(0);

// Usage in component
count()  // Read
count.set(5)  // Write
count.set(n => n + 1)  // Update
```

### Readable Store

```typescript
// Svelte
import { readable } from 'svelte/store';

export const time = readable(new Date(), (set) => {
  const interval = setInterval(() => set(new Date()), 1000);
  return () => clearInterval(interval);
});

// PhilJS
import { signal, effect } from 'philjs-core';

const _time = signal(new Date());

// Start the timer
effect(() => {
  const interval = setInterval(() => _time.set(new Date()), 1000);
  return () => clearInterval(interval);
});

// Export read-only getter
export const time = () => _time();
```

### Derived Store

```typescript
// Svelte
import { derived } from 'svelte/store';
import { count } from './stores';

export const doubled = derived(count, $count => $count * 2);

// PhilJS
import { memo } from 'philjs-core';
import { count } from './stores';

export const doubled = memo(() => count() * 2);
```

### Custom Store

```typescript
// Svelte
import { writable } from 'svelte/store';

function createCounter() {
  const { subscribe, set, update } = writable(0);

  return {
    subscribe,
    increment: () => update(n => n + 1),
    decrement: () => update(n => n - 1),
    reset: () => set(0),
  };
}

export const counter = createCounter();

// PhilJS
import { signal } from 'philjs-core';

function createCounter() {
  const count = signal(0);

  return {
    // Getter for reading
    value: () => count(),
    // Or expose subscribe for compatibility
    subscribe: count.subscribe,
    increment: () => count.set(n => n + 1),
    decrement: () => count.set(n => n - 1),
    reset: () => count.set(0),
  };
}

export const counter = createCounter();
```

---

## SvelteKit to PhilJS Full-Stack

### Route Structure

```
# SvelteKit
src/routes/
  +page.svelte
  +page.ts (load function)
  +layout.svelte
  users/
    +page.svelte
    [id]/
      +page.svelte

# PhilJS (file-based routing)
src/routes/
  index.tsx
  index.loader.ts
  layout.tsx
  users/
    index.tsx
    [id].tsx
```

### Load Functions

```typescript
// SvelteKit - +page.ts
export const load = async ({ params, fetch }) => {
  const user = await fetch(`/api/users/${params.id}`);
  return { user: await user.json() };
};

// SvelteKit - +page.svelte
<script>
  export let data;
</script>
<h1>{data.user.name}</h1>

// PhilJS - [id].tsx
import { useLoaderData } from 'philjs-router';

export const loader = async ({ params }) => {
  const res = await fetch(`/api/users/${params.id}`);
  return res.json();
};

function UserPage() {
  const user = useLoaderData<User>();
  return <h1>{user.name}</h1>;
}

export default UserPage;
```

### Form Actions

```typescript
// SvelteKit - +page.server.ts
export const actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    // Handle form...
    return { success: true };
  },
};

// SvelteKit - +page.svelte
<form method="POST" action="?/create">
  <input name="title" />
  <button>Create</button>
</form>

// PhilJS
import { Form, useActionData } from 'philjs-router';

export const action = async ({ request }) => {
  const data = await request.formData();
  // Handle form...
  return { success: true };
};

function CreatePage() {
  const actionData = useActionData();

  return (
    <Form method="post">
      <input name="title" />
      <button>Create</button>
      {actionData?.success && <p>Created!</p>}
    </Form>
  );
}
```

---

## Svelte 5 Runes Comparison

Svelte 5 introduces "runes" which are very similar to PhilJS signals:

### $state vs signal

```svelte
<!-- Svelte 5 -->
<script>
  let count = $state(0);
</script>

<button onclick={() => count++}>
  {count}
</button>
```

```tsx
// PhilJS
import { signal } from 'philjs-core';

function Counter() {
  const count = signal(0);

  return (
    <button onClick={() => count.set(c => c + 1)}>
      {count()}
    </button>
  );
}
```

### $derived vs memo

```svelte
<!-- Svelte 5 -->
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
```

```tsx
// PhilJS
const count = signal(0);
const doubled = memo(() => count() * 2);
```

### $effect vs effect

```svelte
<!-- Svelte 5 -->
<script>
  let count = $state(0);

  $effect(() => {
    console.log('Count:', count);
  });
</script>
```

```tsx
// PhilJS
const count = signal(0);

effect(() => {
  console.log('Count:', count());
});
```

### $props vs props

```svelte
<!-- Svelte 5 -->
<script>
  let { name, count = 0 } = $props();
</script>
```

```tsx
// PhilJS
function Component(props: { name: string; count?: number }) {
  const { name, count = 0 } = props;
}
```

---

## Common Patterns

### Context API

```svelte
<!-- Svelte -->
<script>
  import { setContext, getContext } from 'svelte';

  // Provider
  setContext('user', { name: 'John' });

  // Consumer
  const user = getContext('user');
</script>
```

```tsx
// PhilJS
import { createContext, useContext } from 'philjs-core';

const UserContext = createContext({ name: 'Guest' });

// Provider
function App() {
  return (
    <UserContext.Provider value={{ name: 'John' }}>
      <Child />
    </UserContext.Provider>
  );
}

// Consumer
function Child() {
  const user = useContext(UserContext);
  return <div>{user.name}</div>;
}
```

### Actions (use:directive)

```svelte
<!-- Svelte - Action -->
<script>
  function tooltip(node, text) {
    const handleMouseEnter = () => { /* show tooltip */ };
    const handleMouseLeave = () => { /* hide tooltip */ };

    node.addEventListener('mouseenter', handleMouseEnter);
    node.addEventListener('mouseleave', handleMouseLeave);

    return {
      destroy() {
        node.removeEventListener('mouseenter', handleMouseEnter);
        node.removeEventListener('mouseleave', handleMouseLeave);
      },
    };
  }
</script>

<div use:tooltip={'Hello!'}>Hover me</div>
```

```tsx
// PhilJS - Custom hook approach
import { effect, onCleanup } from 'philjs-core';

function useTooltip(text: string) {
  let ref: HTMLElement | null = null;

  effect(() => {
    if (!ref) return;

    const handleMouseEnter = () => { /* show tooltip */ };
    const handleMouseLeave = () => { /* hide tooltip */ };

    ref.addEventListener('mouseenter', handleMouseEnter);
    ref.addEventListener('mouseleave', handleMouseLeave);

    onCleanup(() => {
      ref?.removeEventListener('mouseenter', handleMouseEnter);
      ref?.removeEventListener('mouseleave', handleMouseLeave);
    });
  });

  return (el: HTMLElement) => { ref = el; };
}

// Usage
function Component() {
  const tooltipRef = useTooltip('Hello!');

  return <div ref={tooltipRef}>Hover me</div>;
}
```

### Transitions

```svelte
<!-- Svelte -->
<script>
  import { fade, slide } from 'svelte/transition';
  let visible = true;
</script>

{#if visible}
  <div transition:fade>Fades in/out</div>
  <div in:slide out:fade>Different in/out</div>
{/if}
```

```tsx
// PhilJS - CSS-based approach
import { signal } from 'philjs-core';

function Component() {
  const visible = signal(true);

  return (
    <>
      {visible() && (
        <div className="fade-in-out">Fades in/out</div>
      )}
    </>
  );
}

// CSS
// .fade-in-out {
//   animation: fadeIn 0.3s ease-in;
// }
// @keyframes fadeIn {
//   from { opacity: 0; }
//   to { opacity: 1; }
// }

// Or with PhilJS animation API
import { createAnimatedValue } from 'philjs-core';

function AnimatedComponent() {
  const visible = signal(true);
  const opacity = createAnimatedValue(1);

  effect(() => {
    opacity.animateTo(visible() ? 1 : 0, { duration: 300 });
  });

  return (
    <div style={{ opacity: opacity() }}>
      {visible() && 'Content'}
    </div>
  );
}
```

---

## Step-by-Step Migration

### 1. Install Dependencies

```bash
npm install philjs-core philjs-router
npm uninstall svelte @sveltejs/kit
```

### 2. Update Configuration

```javascript
// vite.config.js
export default {
  plugins: [], // Remove Svelte plugin
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'philjs-core',
  },
};
```

### 3. Update Entry Point

```typescript
// Before (SvelteKit)
// Handled by SvelteKit

// After (PhilJS)
import { render } from 'philjs-core';
import App from './App';

render(() => <App />, document.getElementById('app')!);
```

### 4. Convert Components

1. Rename `.svelte` to `.tsx`
2. Convert reactive `let` to `signal()`
3. Convert `$:` declarations to `memo()` or `effect()`
4. Convert template to JSX
5. Update event handlers (`on:click` to `onClick`)
6. Update bindings (`bind:value` to `value` + `onInput`)

### 5. Convert Stores

1. Replace `writable()` with `signal()`
2. Replace `derived()` with `memo()`
3. Update store subscriptions to signal reads

### 6. Update Routes (if using SvelteKit)

1. Convert route structure to PhilJS patterns
2. Convert load functions to loaders
3. Convert actions to PhilJS actions

---

## Migration CLI

```bash
# Analyze project
npx philjs-migrate --from svelte --source ./src --analyze-only

# Preview changes
npx philjs-migrate --from svelte --source ./src --dry-run

# Run migration
npx philjs-migrate --from svelte --source ./src --output ./src-migrated
```

---

## Need Help?

- [PhilJS Documentation](https://philjs.dev)
- [Discord Community](https://discord.gg/philjs)
- [GitHub Issues](https://github.com/philjs/philjs/issues)
