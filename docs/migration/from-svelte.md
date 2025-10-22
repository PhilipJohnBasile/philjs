# Migrating from Svelte

Complete guide for migrating Svelte applications to PhilJS.


## Overview

Svelte and PhilJS share a similar philosophy of fine-grained reactivity and compile-time optimizations. This guide helps you migrate your Svelte applications to PhilJS.

## Key Differences

| Concept | Svelte | PhilJS |
|---------|--------|--------|
| Reactivity | Compiler magic | Explicit signals |
| State | `let` with `$:` | `signal()` |
| Derived State | `$:` statements | `memo()` |
| Side Effects | `$:` statements | `effect()` |
| Templates | Svelte syntax | JSX |
| Components | `.svelte` files | `.tsx` functions |

## State Management

### Reactive Variables → signal()

**Svelte:**
```svelte
<script>
  let count = 0;

  function increment() {
    count += 1;
  }
</script>

<div>
  <p>Count: {count}</p>
  <button on:click={increment}>Increment</button>
</div>
```

**PhilJS:**
```tsx
import { signal } from 'philjs-core';

function Counter() {
  const count = signal(0);

  const increment = () => {
    count.set(count() + 1);
  };

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

**Key differences:**
- Explicit `signal()` vs implicit reactivity
- `.set()` for updates vs direct assignment
- Function calls to read: `count()`

### Reactive Objects

**Svelte:**
```svelte
<script>
  let user = {
    name: 'Alice',
    age: 30
  };

  function updateName() {
    user.name = 'Bob';
    user = user; // Trigger reactivity
  }
</script>
```

**PhilJS:**
```tsx
const user = signal({
  name: 'Alice',
  age: 30
});

const updateName = () => {
  user.set({
    ...user(),
    name: 'Bob'
  });
};
```

## Derived State

### $: statements → memo()

**Svelte:**
```svelte
<script>
  let count = 0;
  $: doubled = count * 2;
  $: quadrupled = doubled * 2;
</script>

<p>Doubled: {doubled}</p>
<p>Quadrupled: {quadrupled}</p>
```

**PhilJS:**
```tsx
const count = signal(0);
const doubled = memo(() => count() * 2);
const quadrupled = memo(() => doubled() * 2);

return (
  <div>
    <p>Doubled: {doubled()}</p>
    <p>Quadrupled: {quadrupled()}</p>
  </div>
);
```

## Side Effects

### Reactive Statements → effect()

**Svelte:**
```svelte
<script>
  let count = 0;

  $: console.log('Count:', count);

  $: {
    if (count > 10) {
      console.log('Count exceeded 10!');
    }
  }
</script>
```

**PhilJS:**
```tsx
const count = signal(0);

effect(() => {
  console.log('Count:', count());
});

effect(() => {
  if (count() > 10) {
    console.log('Count exceeded 10!');
  }
});
```

### onMount / onDestroy → effect()

**Svelte:**
```svelte
<script>
  import { onMount, onDestroy } from 'svelte';

  let interval;

  onMount(() => {
    console.log('Component mounted');

    interval = setInterval(() => {
      console.log('Tick');
    }, 1000);
  });

  onDestroy(() => {
    console.log('Component destroyed');
    clearInterval(interval);
  });
</script>
```

**PhilJS:**
```tsx
effect(() => {
  console.log('Component mounted');

  const interval = setInterval(() => {
    console.log('Tick');
  }, 1000);

  return () => {
    console.log('Component destroyed');
    clearInterval(interval);
  };
});
```

## Templates vs JSX

### Template Syntax Conversion

**Svelte:**
```svelte
<div>
  <!-- Interpolation -->
  <p>{message}</p>

  <!-- Attributes -->
  <input value={text} on:input={handleInput} />

  <!-- Conditional -->
  {#if show}
    <div>Visible</div>
  {:else}
    <div>Hidden</div>
  {/if}

  <!-- List -->
  <ul>
    {#each items as item (item.id)}
      <li>{item.name}</li>
    {/each}
  </ul>

  <!-- Class binding -->
  <div class:active={isActive}>Content</div>

  <!-- Style binding -->
  <div style="color: {textColor}">Styled</div>
</div>
```

**PhilJS JSX:**
```tsx
return (
  <div>
    {/* Interpolation */}
    <p>{message()}</p>

    {/* Attributes */}
    <input value={text()} onInput={handleInput} />

    {/* Conditional */}
    {show() ? (
      <div>Visible</div>
    ) : (
      <div>Hidden</div>
    )}

    {/* List */}
    <ul>
      {items().map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>

    {/* Class binding */}
    <div className={isActive() ? 'active' : ''}>Content</div>

    {/* Style binding */}
    <div style={{ color: textColor() }}>Styled</div>
  </div>
);
```

### Svelte Directives → JSX Patterns

**bind:value:**

**Svelte:**
```svelte
<input bind:value={text} />
```

**PhilJS:**
```tsx
<input
  value={text()}
  onInput={(e) => text.set(e.target.value)}
/>
```

**bind:checked:**

**Svelte:**
```svelte
<input type="checkbox" bind:checked={isChecked} />
```

**PhilJS:**
```tsx
<input
  type="checkbox"
  checked={isChecked()}
  onChange={(e) => isChecked.set(e.target.checked)}
/>
```

**on:event:**

**Svelte:**
```svelte
<button on:click={handleClick}>Click</button>
<input on:input={handleInput} />
<div on:mouseenter={handleHover}></div>
```

**PhilJS:**
```tsx
<button onClick={handleClick}>Click</button>
<input onInput={handleInput} />
<div onMouseEnter={handleHover}></div>
```

## Component Communication

### Props

**Svelte:**
```svelte
<!-- Parent.svelte -->
<Child message={greeting} {count} />

<!-- Child.svelte -->
<script>
  export let message;
  export let count;
</script>

<div>{message} - {count}</div>
```

**PhilJS:**
```tsx
// Parent
<Child message={greeting()} count={count()} />

// Child
interface ChildProps {
  message: string;
  count: number;
}

function Child({ message, count }: ChildProps) {
  return <div>{message} - {count}</div>;
}
```

### Events

**Svelte:**
```svelte
<!-- Child.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch('update', { value: 'new value' });
  }
</script>

<button on:click={handleClick}>Update</button>

<!-- Parent.svelte -->
<Child on:update={handleUpdate} />
```

**PhilJS:**
```tsx
// Child
interface ChildProps {
  onUpdate: (value: { value: string }) => void;
}

function Child({ onUpdate }: ChildProps) {
  const handleClick = () => {
    onUpdate({ value: 'new value' });
  };

  return <button onClick={handleClick}>Update</button>;
}

// Parent
<Child onUpdate={handleUpdate} />
```

### Slots → children

**Svelte:**
```svelte
<!-- Card.svelte -->
<div class="card">
  <slot name="header" />
  <slot />
  <slot name="footer" />
</div>

<!-- Usage -->
<Card>
  <h1 slot="header">Title</h1>
  <p>Content</p>
  <div slot="footer">Footer</div>
</Card>
```

**PhilJS:**
```tsx
// Card
interface CardProps {
  header?: JSX.Element;
  children: JSX.Element;
  footer?: JSX.Element;
}

function Card({ header, children, footer }: CardProps) {
  return (
    <div className="card">
      {header}
      {children}
      {footer}
    </div>
  );
}

// Usage
<Card
  header={<h1>Title</h1>}
  footer={<div>Footer</div>}
>
  <p>Content</p>
</Card>
```

## Stores → Signals

### Writable Stores

**Svelte:**
```typescript
import { writable } from 'svelte/store';

export const count = writable(0);

// Component
<script>
  import { count } from './stores';

  function increment() {
    $count += 1;
  }
</script>

<p>Count: {$count}</p>
```

**PhilJS:**
```typescript
import { signal } from 'philjs-core';

export const count = signal(0);

// Component
import { count } from './stores';

function Counter() {
  const increment = () => {
    count.set(count() + 1);
  };

  return <p>Count: {count()}</p>;
}
```

### Derived Stores

**Svelte:**
```typescript
import { writable, derived } from 'svelte/store';

const count = writable(0);
const doubled = derived(count, $count => $count * 2);
```

**PhilJS:**
```typescript
import { signal, memo } from 'philjs-core';

const count = signal(0);
const doubled = memo(() => count() * 2);
```

### Readable Stores

**Svelte:**
```typescript
import { readable } from 'svelte/store';

const time = readable(new Date(), (set) => {
  const interval = setInterval(() => {
    set(new Date());
  }, 1000);

  return () => clearInterval(interval);
});
```

**PhilJS:**
```typescript
import { signal, effect } from 'philjs-core';

const time = signal(new Date());

effect(() => {
  const interval = setInterval(() => {
    time.set(new Date());
  }, 1000);

  return () => clearInterval(interval);
});
```

## Context

**Svelte:**
```svelte
<!-- Parent.svelte -->
<script>
  import { setContext } from 'svelte';

  setContext('theme', 'dark');
</script>

<!-- Child.svelte -->
<script>
  import { getContext } from 'svelte';

  const theme = getContext('theme');
</script>
```

**PhilJS:**
```tsx
import { createContext, useContext } from 'philjs-core';

const ThemeContext = createContext('light');

// Parent
function Parent() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  );
}

// Child
function Child() {
  const theme = useContext(ThemeContext);
  return <div>{theme}</div>;
}
```

## Routing

### SvelteKit → PhilJS Router

**SvelteKit:**
```svelte
<!-- src/routes/+layout.svelte -->
<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
</nav>

<slot />

<!-- src/routes/+page.svelte -->
<h1>Home</h1>

<!-- src/routes/about/+page.svelte -->
<h1>About</h1>

<!-- src/routes/users/[id]/+page.svelte -->
<script>
  import { page } from '$app/stores';
  $: userId = $page.params.id;
</script>
```

**PhilJS:**
```tsx
import { Router, Route, Link, useParams } from 'philjs-router';

function App() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>

      <Router>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/users/:id" component={User} />
      </Router>
    </>
  );
}

function User() {
  const { id } = useParams();
  return <div>User ID: {id}</div>;
}
```

## Transitions → CSS/JS Animations

**Svelte:**
```svelte
<script>
  import { fade, fly } from 'svelte/transition';

  let visible = true;
</script>

{#if visible}
  <div transition:fade>Fading</div>
  <div in:fly={{ y: 200 }} out:fade>Flying</div>
{/if}
```

**PhilJS:**
```tsx
const visible = signal(true);

// Use CSS transitions
<div
  className={visible() ? 'fade-in' : 'fade-out'}
  style={{
    transition: 'opacity 0.3s',
    opacity: visible() ? 1 : 0
  }}
>
  Fading
</div>

// Or use animation libraries like Framer Motion
```

## Actions → Directives

**Svelte:**
```svelte
<script>
  function clickOutside(node) {
    const handleClick = (event) => {
      if (!node.contains(event.target)) {
        node.dispatchEvent(new CustomEvent('outclick'));
      }
    };

    document.addEventListener('click', handleClick, true);

    return {
      destroy() {
        document.removeEventListener('click', handleClick, true);
      }
    };
  }
</script>

<div use:clickOutside on:outclick={handleOutsideClick}>
  Content
</div>
```

**PhilJS:**
```tsx
function useClickOutside(onOutsideClick: () => void) {
  let ref: HTMLElement | undefined;

  effect(() => {
    if (!ref) return;

    const handleClick = (event: MouseEvent) => {
      if (!ref.contains(event.target as Node)) {
        onOutsideClick();
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  });

  return ref;
}

// Usage
function Component() {
  const ref = useClickOutside(() => console.log('Clicked outside'));

  return <div ref={ref}>Content</div>;
}
```

## Migration Strategy

### 1. File-by-File Conversion

1. Convert `.svelte` files to `.tsx`
2. Replace `<script>` with function body
3. Convert template to JSX
4. Update reactivity

### 2. Conversion Checklist

- [ ] Replace `let` with `signal()`
- [ ] Replace `$:` derived with `memo()`
- [ ] Replace `$:` effects with `effect()`
- [ ] Convert template to JSX
- [ ] Replace `bind:value` with controlled inputs
- [ ] Update event handlers (`on:click` → `onClick`)
- [ ] Convert lifecycle hooks to effects
- [ ] Replace stores with signals
- [ ] Update routing

### 3. Automated Patterns

```bash
# Reactive variables
s/let (\w+) = /const \1 = signal(/g

# Auto-subscriptions
s/\$(\w+)/\1()/g

# Events
s/on:(\w+)/on${capitalize(\1)}/g
```

## Common Pitfalls

### Remember Function Calls

```tsx
// ❌ Svelte habit (auto-subscription)
<p>Count: {count}</p>

// ✅ PhilJS (explicit call)
<p>Count: {count()}</p>
```

### Immutable Updates

```tsx
// ❌ Svelte habit (direct mutation)
count += 1;
user.name = 'Bob';

// ✅ PhilJS (immutable updates)
count.set(count() + 1);
user.set({ ...user(), name: 'Bob' });
```

### Event Handler Syntax

```tsx
// ❌ Svelte habit
<button on:click={handleClick}>

// ✅ PhilJS
<button onClick={handleClick}>
```

### Conditional Rendering

```tsx
// ❌ Svelte habit
{#if condition}
  <div>Content</div>
{/if}

// ✅ PhilJS
{condition() && <div>Content</div>}
```

## Summary

PhilJS migration from Svelte:

✅ Similar fine-grained reactivity
✅ Explicit instead of magical
✅ JSX instead of templates
✅ Stronger type safety
✅ Simpler mental model
✅ Better debugging

Svelte developers will appreciate PhilJS's explicit reactivity and TypeScript-first approach!

---

**Complete!** You now have comprehensive migration guides for React, Vue, and Svelte.

Return to [Documentation Home](../README.md) to explore more.
