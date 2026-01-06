# Migrating from Svelte to PhilJS

This guide helps Svelte developers transition to PhilJS, covering the conceptual shift from compiler-based to runtime reactivity.

## Quick Comparison

| Svelte | PhilJS | Notes |
|--------|--------|-------|
| `let x = 0` (reactive) | `signal(0)` | Explicit reactivity |
| `$:` reactive statement | `effect()` | Auto-tracking |
| `$: derived = x * 2` | `computed()` | Derived values |
| `{#if}` | `{condition && ...}` | JSX conditionals |
| `{#each}` | `<For>` or `.map()` | List rendering |
| `bind:value` | Manual binding | Two-way binding |
| `$store` | `store()` | Store subscription |

## Core Concepts

### Reactive Variables

**Svelte let → PhilJS signal**

```svelte
<!-- Svelte -->
<script>
  let count = 0;

  function increment() {
    count += 1;
  }
</script>

<button on:click={increment}>
  Count: {count}
</button>
```

```tsx
// PhilJS
import { signal } from '@philjs/core';

function Counter() {
  const count = signal(0);

  return (
    <button onClick={() => count.set(count() + 1)}>
      Count: {count()}
    </button>
  );
}
```

**Key Differences:**
- PhilJS reactivity is explicit via `signal()`
- Access value with `count()`, not just `count`
- Update with `count.set(x)`, not `count = x`

### Reactive Statements

**Svelte $: → PhilJS effect**

```svelte
<!-- Svelte -->
<script>
  let count = 0;

  $: console.log('Count changed:', count);
  $: doubled = count * 2;
</script>
```

```tsx
// PhilJS
import { signal, computed, effect } from '@philjs/core';

function Component() {
  const count = signal(0);

  // Side effect
  effect(() => {
    console.log('Count changed:', count());
  });

  // Derived value
  const doubled = computed(() => count() * 2);

  return <div>{count()} x 2 = {doubled()}</div>;
}
```

### Stores

**Svelte store → PhilJS signal/store**

```svelte
<!-- Svelte -->
<script>
  import { writable, derived } from 'svelte/store';

  const count = writable(0);
  const doubled = derived(count, $count => $count * 2);

  function increment() {
    count.update(n => n + 1);
  }
</script>

<button on:click={increment}>
  {$count} x 2 = {$doubled}
</button>
```

```tsx
// PhilJS
import { signal, computed } from '@philjs/core';

// Can be defined outside component
const count = signal(0);
const doubled = computed(() => count() * 2);

function Counter() {
  return (
    <button onClick={() => count.set(count() + 1)}>
      {count()} x 2 = {doubled()}
    </button>
  );
}
```

## Template → JSX

### Conditionals

**Svelte {#if} → JSX**

```svelte
<!-- Svelte -->
{#if loggedIn}
  <Dashboard />
{:else if pending}
  <Loading />
{:else}
  <Login />
{/if}
```

```tsx
// PhilJS
function Content(props) {
  if (props.loggedIn()) {
    return <Dashboard />;
  }
  if (props.pending()) {
    return <Loading />;
  }
  return <Login />;
}

// Or inline
{loggedIn() ? <Dashboard /> : pending() ? <Loading /> : <Login />}
```

### Lists

**Svelte {#each} → For component**

```svelte
<!-- Svelte -->
{#each items as item (item.id)}
  <li>{item.name}</li>
{:else}
  <li>No items</li>
{/each}
```

```tsx
// PhilJS
import { For, Show } from '@philjs/core';

function List(props) {
  return (
    <Show
      when={props.items().length > 0}
      fallback={<li>No items</li>}
    >
      <For each={props.items()}>
        {item => <li>{item.name}</li>}
      </For>
    </Show>
  );
}
```

### Await Blocks

**Svelte {#await} → Suspense/resource**

```svelte
<!-- Svelte -->
{#await fetchData()}
  <p>Loading...</p>
{:then data}
  <p>{data.message}</p>
{:catch error}
  <p>Error: {error.message}</p>
{/await}
```

```tsx
// PhilJS
import { Suspense, ErrorBoundary, createResource } from '@philjs/core';

function AsyncData() {
  const [data] = createResource(fetchData);

  return (
    <ErrorBoundary fallback={(error) => <p>Error: {error.message}</p>}>
      <Suspense fallback={<p>Loading...</p>}>
        <p>{data()?.message}</p>
      </Suspense>
    </ErrorBoundary>
  );
}
```

## Event Handling

**Svelte on: → JSX events**

```svelte
<!-- Svelte -->
<button on:click={handleClick}>Click</button>
<button on:click|preventDefault={handleClick}>Click</button>
<input on:input={handleInput} on:keydown|enter={submit} />
```

```tsx
// PhilJS
function Form() {
  const handleClick = (e) => {
    e.preventDefault(); // Manual if needed
    console.log('clicked');
  };

  return (
    <>
      <button onClick={handleClick}>Click</button>
      <input
        onInput={handleInput}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
    </>
  );
}
```

## Bindings

### Two-Way Binding

**Svelte bind: → Manual binding**

```svelte
<!-- Svelte -->
<script>
  let name = '';
  let checked = false;
</script>

<input bind:value={name} />
<input type="checkbox" bind:checked={checked} />
```

```tsx
// PhilJS
import { signal } from '@philjs/core';

function Form() {
  const name = signal('');
  const checked = signal(false);

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
    </>
  );
}
```

### Element Binding

**Svelte bind:this → ref callback**

```svelte
<!-- Svelte -->
<script>
  let inputElement;

  function focus() {
    inputElement.focus();
  }
</script>

<input bind:this={inputElement} />
```

```tsx
// PhilJS
function Form() {
  let inputElement;

  const focus = () => inputElement?.focus();

  return <input ref={(el) => inputElement = el} />;
}
```

## Component Communication

### Props

```svelte
<!-- Svelte -->
<script>
  export let name;
  export let count = 0;
</script>

<p>{name}: {count}</p>
```

```tsx
// PhilJS
interface Props {
  name: string;
  count?: number;
}

function Component(props: Props) {
  const count = props.count ?? 0;
  return <p>{props.name}: {count}</p>;
}
```

### Events/Callbacks

**Svelte createEventDispatcher → callback props**

```svelte
<!-- Svelte Child -->
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch('message', { text: 'Hello' });
  }
</script>

<!-- Parent -->
<Child on:message={handleMessage} />
```

```tsx
// PhilJS
function Child(props: { onMessage: (data: { text: string }) => void }) {
  return (
    <button onClick={() => props.onMessage({ text: 'Hello' })}>
      Send
    </button>
  );
}

// Parent
<Child onMessage={handleMessage} />
```

### Slots → Children

```svelte
<!-- Svelte -->
<div class="card">
  <slot name="header" />
  <slot />
  <slot name="footer" />
</div>
```

```tsx
// PhilJS
function Card(props) {
  return (
    <div class="card">
      {props.header}
      {props.children}
      {props.footer}
    </div>
  );
}

// Usage
<Card
  header={<h1>Title</h1>}
  footer={<button>Submit</button>}
>
  <p>Content</p>
</Card>
```

## Context

**Svelte setContext/getContext → createContext**

```svelte
<!-- Svelte -->
<script>
  // Parent
  import { setContext } from 'svelte';
  setContext('theme', { color: 'dark' });

  // Child
  import { getContext } from 'svelte';
  const { color } = getContext('theme');
</script>
```

```tsx
// PhilJS
import { createContext, useContext } from '@philjs/core';

const ThemeContext = createContext({ color: 'light' });

// Parent
function App() {
  return (
    <ThemeContext.Provider value={{ color: 'dark' }}>
      <Child />
    </ThemeContext.Provider>
  );
}

// Child
function Child() {
  const { color } = useContext(ThemeContext);
  return <div>Theme: {color}</div>;
}
```

## Lifecycle

**Svelte onMount/onDestroy → PhilJS lifecycle**

```svelte
<!-- Svelte -->
<script>
  import { onMount, onDestroy, beforeUpdate, afterUpdate } from 'svelte';

  onMount(() => {
    console.log('Mounted');
    return () => console.log('Cleanup');
  });

  onDestroy(() => console.log('Destroyed'));
</script>
```

```tsx
// PhilJS
import { onMount, onCleanup } from '@philjs/core';

function Component() {
  onMount(() => {
    console.log('Mounted');
  });

  onCleanup(() => {
    console.log('Destroyed');
  });

  return <div>Content</div>;
}
```

## Actions → Directives

**Svelte use: → Custom directive or ref**

```svelte
<!-- Svelte -->
<script>
  function clickOutside(node, callback) {
    const handleClick = (e) => {
      if (!node.contains(e.target)) callback();
    };
    document.addEventListener('click', handleClick);
    return {
      destroy() {
        document.removeEventListener('click', handleClick);
      }
    };
  }
</script>

<div use:clickOutside={handleOutsideClick}>Content</div>
```

```tsx
// PhilJS - as a hook
import { effect } from '@philjs/core';

function useClickOutside(ref: { current: HTMLElement | null }, callback: () => void) {
  effect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  });
}

// Usage
function Dropdown() {
  const ref = { current: null as HTMLElement | null };
  useClickOutside(ref, () => close());

  return <div ref={(el) => ref.current = el}>Content</div>;
}
```

## Transitions

**Svelte transitions → CSS or animation libraries**

```svelte
<!-- Svelte -->
<script>
  import { fade, slide } from 'svelte/transition';
</script>

{#if visible}
  <div transition:fade>Fading content</div>
{/if}
```

```tsx
// PhilJS - CSS-based
function FadeIn(props) {
  return (
    <div class={props.visible() ? 'fade-in' : 'fade-out'}>
      {props.children}
    </div>
  );
}

// Or use @philjs/motion
import { Motion } from '@philjs/motion';

<Motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: visible() ? 1 : 0 }}
>
  Content
</Motion.div>
```

## Routing

**SvelteKit → PhilJS Router**

```svelte
<!-- SvelteKit -->
<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
</script>

<p>Current: {$page.url.pathname}</p>
<button on:click={() => goto('/about')}>About</button>
```

```tsx
// PhilJS
import { useRoute, navigate, Link } from '@philjs/router';

function Nav() {
  const route = useRoute();

  return (
    <>
      <p>Current: {route.path}</p>
      <button onClick={() => navigate('/about')}>About</button>
      <Link to="/about">About</Link>
    </>
  );
}
```

## Common Gotchas

### 1. Explicit reactivity
```tsx
// Svelte: any `let` is reactive
// PhilJS: must use signal()
const count = signal(0);  // Not just `let count = 0`
```

### 2. Access values with ()
```tsx
// Svelte: {count}
// PhilJS: {count()}
<div>{count()}</div>
```

### 3. No compiler magic
```tsx
// Svelte: $: doubled = count * 2
// PhilJS: explicit computed
const doubled = computed(() => count() * 2);
```

### 4. Immutable updates
```tsx
// Svelte can mutate
items = [...items, newItem];  // Also works: items.push(newItem); items = items;

// PhilJS requires new reference
items.set([...items(), newItem]);
```

## Migration Strategy

1. **Understand the model**: Svelte compiles away reactivity; PhilJS is runtime
2. **Start with stores**: Global state is similar
3. **Convert components**: Bottom-up, leaf components first
4. **Update templates**: {#if} → JSX, {#each} → For/map
5. **Handle actions**: Convert to hooks or ref callbacks

## Benefits After Migration

- **No build step complexity**: Runtime reactivity vs compiler
- **Easier debugging**: Can inspect signals at runtime
- **More portable**: Standard JavaScript patterns
- **Fine-grained**: Updates at signal level, not component
- **Consistent model**: Same patterns for all state
