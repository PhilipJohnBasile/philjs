# Migrating from Vue to PhilJS

This guide helps Vue developers transition to PhilJS, covering conceptual mappings and migration patterns.

## Quick Comparison

| Vue 3 | PhilJS | Notes |
|-------|--------|-------|
| `ref()` | `signal()` | Nearly identical |
| `computed()` | `computed()` | Same concept |
| `watch/watchEffect` | `effect()` | Auto-tracking |
| `reactive()` | `signal()` + object | Similar behavior |
| `v-if` | `{condition && ...}` | JSX conditionals |
| `v-for` | `<For>` or `.map()` | List rendering |
| `v-model` | Two-way binding | Manual setup |
| `<script setup>` | Function components | Similar ergonomics |

## Core Concepts

### Reactive State

**Vue ref → PhilJS signal**

```vue
<!-- Vue -->
<script setup>
import { ref } from 'vue';

const count = ref(0);
const increment = () => count.value++;
</script>

<template>
  <button @click="increment">{{ count }}</button>
</template>
```

```tsx
// PhilJS
import { signal } from '@philjs/core';

function Counter() {
  const count = signal(0);

  return (
    <button onClick={() => count.set(count() + 1)}>
      {count()}
    </button>
  );
}
```

**Key Differences:**
- PhilJS: `count()` instead of `count.value`
- PhilJS: `count.set(x)` instead of `count.value = x`
- No `.value` unwrapping in templates

### Computed Properties

**Vue computed → PhilJS computed**

```vue
<!-- Vue -->
<script setup>
import { ref, computed } from 'vue';

const firstName = ref('John');
const lastName = ref('Doe');
const fullName = computed(() => `${firstName.value} ${lastName.value}`);
</script>
```

```tsx
// PhilJS
import { signal, computed } from '@philjs/core';

function NameDisplay() {
  const firstName = signal('John');
  const lastName = signal('Doe');
  const fullName = computed(() => `${firstName()} ${lastName()}`);

  return <div>{fullName()}</div>;
}
```

### Watch & Effects

**Vue watchEffect → PhilJS effect**

```vue
<!-- Vue -->
<script setup>
import { ref, watchEffect } from 'vue';

const count = ref(0);

watchEffect(() => {
  console.log('Count changed:', count.value);
});
</script>
```

```tsx
// PhilJS
import { signal, effect } from '@philjs/core';

function Component() {
  const count = signal(0);

  effect(() => {
    console.log('Count changed:', count());
  });

  return <div>{count()}</div>;
}
```

**Vue watch → PhilJS effect with previous value**

```vue
<!-- Vue -->
<script setup>
import { ref, watch } from 'vue';

const count = ref(0);

watch(count, (newVal, oldVal) => {
  console.log(`Changed from ${oldVal} to ${newVal}`);
});
</script>
```

```tsx
// PhilJS
import { signal, effect } from '@philjs/core';

function Component() {
  const count = signal(0);
  let prevCount = count();

  effect(() => {
    const newCount = count();
    console.log(`Changed from ${prevCount} to ${newCount}`);
    prevCount = newCount;
  });

  return <div>{count()}</div>;
}
```

### Reactive Objects

**Vue reactive → PhilJS signal with object**

```vue
<!-- Vue -->
<script setup>
import { reactive } from 'vue';

const state = reactive({
  user: { name: 'John', age: 30 },
  loading: false
});

state.user.name = 'Jane'; // Triggers reactivity
</script>
```

```tsx
// PhilJS - immutable updates
import { signal } from '@philjs/core';

function Component() {
  const state = signal({
    user: { name: 'John', age: 30 },
    loading: false
  });

  // Update requires new object
  const updateName = (name) => {
    state.set({
      ...state(),
      user: { ...state().user, name }
    });
  };

  return <div>{state().user.name}</div>;
}
```

## Template → JSX

### Conditionals

**Vue v-if → JSX conditionals**

```vue
<!-- Vue -->
<template>
  <div v-if="isLoggedIn">Welcome!</div>
  <div v-else>Please log in</div>
</template>
```

```tsx
// PhilJS
function Welcome(props) {
  return props.isLoggedIn()
    ? <div>Welcome!</div>
    : <div>Please log in</div>;
}
```

**Vue v-show → style display**

```vue
<!-- Vue -->
<div v-show="visible">Content</div>
```

```tsx
// PhilJS
<div style={{ display: visible() ? 'block' : 'none' }}>Content</div>
```

### Lists

**Vue v-for → For component or map**

```vue
<!-- Vue -->
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
</template>
```

```tsx
// PhilJS - with For component (optimal)
import { For } from '@philjs/core';

function List(props) {
  return (
    <ul>
      <For each={props.items()}>
        {item => <li>{item.name}</li>}
      </For>
    </ul>
  );
}

// Or with map
function List(props) {
  return (
    <ul>
      {props.items().map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### Event Handling

**Vue @event → JSX onClick etc.**

```vue
<!-- Vue -->
<template>
  <button @click="handleClick">Click me</button>
  <input @input="handleInput" @keyup.enter="submit" />
</template>
```

```tsx
// PhilJS
function Form() {
  const handleClick = () => console.log('clicked');
  const handleInput = (e) => console.log(e.target.value);
  const submit = () => console.log('submitted');

  return (
    <>
      <button onClick={handleClick}>Click me</button>
      <input
        onInput={handleInput}
        onKeyUp={(e) => e.key === 'Enter' && submit()}
      />
    </>
  );
}
```

### Two-Way Binding

**Vue v-model → Manual binding**

```vue
<!-- Vue -->
<template>
  <input v-model="name" />
</template>

<script setup>
import { ref } from 'vue';
const name = ref('');
</script>
```

```tsx
// PhilJS
import { signal } from '@philjs/core';

function Form() {
  const name = signal('');

  return (
    <input
      value={name()}
      onInput={(e) => name.set(e.target.value)}
    />
  );
}
```

### Slots → Children

**Vue slots → props.children**

```vue
<!-- Vue Parent -->
<Card>
  <template #header>Header Content</template>
  <template #default>Main Content</template>
  <template #footer>Footer Content</template>
</Card>

<!-- Vue Card Component -->
<template>
  <div class="card">
    <header><slot name="header" /></header>
    <main><slot /></main>
    <footer><slot name="footer" /></footer>
  </div>
</template>
```

```tsx
// PhilJS
function Card(props) {
  return (
    <div class="card">
      <header>{props.header}</header>
      <main>{props.children}</main>
      <footer>{props.footer}</footer>
    </div>
  );
}

// Usage
<Card
  header={<span>Header Content</span>}
  footer={<span>Footer Content</span>}
>
  Main Content
</Card>
```

## Component Patterns

### Props with Defaults

```vue
<!-- Vue -->
<script setup>
const props = withDefaults(defineProps<{
  title: string;
  count?: number;
}>(), {
  count: 0
});
</script>
```

```tsx
// PhilJS
interface Props {
  title: string;
  count?: number;
}

function Component(props: Props) {
  const count = props.count ?? 0;
  return <div>{props.title}: {count}</div>;
}
```

### Emits → Callback Props

```vue
<!-- Vue Child -->
<script setup>
const emit = defineEmits(['update', 'delete']);
const handleClick = () => emit('update', { id: 1 });
</script>

<!-- Vue Parent -->
<Child @update="handleUpdate" @delete="handleDelete" />
```

```tsx
// PhilJS
function Child(props: {
  onUpdate: (data: { id: number }) => void;
  onDelete: () => void;
}) {
  return (
    <button onClick={() => props.onUpdate({ id: 1 })}>
      Update
    </button>
  );
}

// Parent
<Child
  onUpdate={handleUpdate}
  onDelete={handleDelete}
/>
```

### Provide/Inject → Context

```vue
<!-- Vue -->
<script setup>
// Parent
import { provide, ref } from 'vue';
const theme = ref('dark');
provide('theme', theme);

// Child
import { inject } from 'vue';
const theme = inject('theme');
</script>
```

```tsx
// PhilJS
import { createContext, useContext, signal } from '@philjs/core';

const ThemeContext = createContext<Signal<string>>();

// Parent
function App() {
  const theme = signal('dark');
  return (
    <ThemeContext.Provider value={theme}>
      <Child />
    </ThemeContext.Provider>
  );
}

// Child
function Child() {
  const theme = useContext(ThemeContext);
  return <div>{theme()}</div>;
}
```

## Composables → Functions

```vue
<!-- Vue Composable -->
<script setup>
// useCounter.ts
import { ref, computed } from 'vue';

export function useCounter(initial = 0) {
  const count = ref(initial);
  const double = computed(() => count.value * 2);
  const increment = () => count.value++;
  return { count, double, increment };
}

// Component
import { useCounter } from './useCounter';
const { count, double, increment } = useCounter(10);
</script>
```

```tsx
// PhilJS
import { signal, computed } from '@philjs/core';

function createCounter(initial = 0) {
  const count = signal(initial);
  const double = computed(() => count() * 2);
  const increment = () => count.set(count() + 1);
  return { count, double, increment };
}

// Component
function Counter() {
  const { count, double, increment } = createCounter(10);
  return (
    <button onClick={increment}>
      {count()} (double: {double()})
    </button>
  );
}
```

## Lifecycle

```vue
<!-- Vue -->
<script setup>
import { onMounted, onUnmounted, onUpdated } from 'vue';

onMounted(() => console.log('Mounted'));
onUnmounted(() => console.log('Unmounted'));
onUpdated(() => console.log('Updated'));
</script>
```

```tsx
// PhilJS
import { onMount, onCleanup, effect } from '@philjs/core';

function Component() {
  onMount(() => {
    console.log('Mounted');
  });

  onCleanup(() => {
    console.log('Unmounted');
  });

  // For update tracking, use effect
  effect(() => {
    // This runs on every tracked dependency change
    console.log('Dependencies changed');
  });

  return <div>Content</div>;
}
```

## Vue Router → PhilJS Router

```vue
<!-- Vue Router -->
<script setup>
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// Access params
const userId = route.params.id;

// Navigate
router.push('/home');
</script>
```

```tsx
// PhilJS Router
import { useRoute, navigate } from '@philjs/router';

function Component() {
  const route = useRoute();

  // Access params
  const userId = route.params.id;

  // Navigate
  const goHome = () => navigate('/home');

  return <button onClick={goHome}>Go Home</button>;
}
```

## Pinia → PhilJS Store

```ts
// Pinia Store
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++;
    },
  },
});
```

```ts
// PhilJS Store
import { createStore } from '@philjs/store';

export const counterStore = createStore({
  count: 0,

  get double() {
    return this.count * 2;
  },

  increment() {
    this.count++;
  },
});

// Usage in component
function Counter() {
  return (
    <button onClick={counterStore.increment}>
      {counterStore.count} (double: {counterStore.double})
    </button>
  );
}
```

## Common Gotchas

### 1. No automatic unwrapping
```tsx
// Vue auto-unwraps in template
// PhilJS requires explicit call
const count = signal(0);
<div>{count()}</div>  // Must call as function
```

### 2. Immutable updates
```tsx
// Vue reactive allows mutation
state.user.name = 'Jane';

// PhilJS requires new reference
state.set({ ...state(), user: { ...state().user, name: 'Jane' } });
```

### 3. No template syntax
```tsx
// Vue: v-if, v-for, v-model
// PhilJS: JSX expressions
{condition && <Component />}
{items.map(item => <Item {...item} />)}
<input value={value()} onInput={e => value.set(e.target.value)} />
```

## Migration Strategy

1. **Start with utilities** - Migrate composables to functions
2. **Leaf components first** - Components without children
3. **Use adapter at boundaries** - Mount Vue/PhilJS together
4. **Replace routing last** - Most impactful change

## Benefits After Migration

- **Smaller bundle**: ~3KB vs Vue's ~35KB
- **Faster updates**: Fine-grained without virtual DOM diffing
- **Simpler model**: No `.value` unwrapping confusion
- **TypeScript-first**: Better type inference
- **No compilation step**: No SFC compiler needed
