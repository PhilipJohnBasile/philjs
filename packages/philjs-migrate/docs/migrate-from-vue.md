# Migrating from Vue to PhilJS

This guide helps you migrate Vue 3 Composition API applications to PhilJS. Both frameworks use reactive primitives, making the migration relatively smooth.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Concept Mapping](#concept-mapping)
3. [Reactivity Comparison](#reactivity-comparison)
4. [Component Syntax](#component-syntax)
5. [Template to JSX](#template-to-jsx)
6. [Composition API](#composition-api)
7. [State Management](#state-management)
8. [Routing](#routing)
9. [Common Patterns](#common-patterns)
10. [Step-by-Step Migration](#step-by-step-migration)

---

## Quick Start

### Installation

```bash
# Remove Vue dependencies
npm uninstall vue @vue/compiler-sfc vue-router pinia

# Install PhilJS
npm install philjs-core philjs-router
```

### Update Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "philjs-core"
  }
}
```

### Basic Component Conversion

```vue
<!-- Before (Vue) -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const count = ref(0);
const doubled = computed(() => count.value * 2);

onMounted(() => {
  console.log('Component mounted');
});

function increment() {
  count.value++;
}
</script>

<template>
  <button @click="increment">
    Count: {{ count }} (Doubled: {{ doubled }})
  </button>
</template>
```

```tsx
// After (PhilJS)
import { signal, memo, onMount } from 'philjs-core';

function Counter() {
  const count = signal(0);
  const doubled = memo(() => count() * 2);

  onMount(() => {
    console.log('Component mounted');
  });

  const increment = () => count.set(c => c + 1);

  return (
    <button onClick={increment}>
      Count: {count()} (Doubled: {doubled()})
    </button>
  );
}

export default Counter;
```

---

## Concept Mapping

| Vue 3 | PhilJS | Notes |
|-------|--------|-------|
| `ref()` | `signal()` | Use `.get()` or `()` instead of `.value` |
| `reactive()` | `signal()` | PhilJS signals can hold objects |
| `computed()` | `memo()` | Auto-tracked, call to read |
| `watch()` | `effect()` | Auto-tracks all dependencies |
| `watchEffect()` | `effect()` | Same behavior |
| `onMounted()` | `onMount()` | Same |
| `onUnmounted()` | `onCleanup()` | Use inside effect or directly |
| `provide()`/`inject()` | `createContext()`/`useContext()` | Similar pattern |
| `v-if` | `{condition && <.../>}` | JSX conditional |
| `v-for` | `{items.map(...)}` | JSX iteration |
| `v-model` | `value` + `onInput` | Two-way binding |
| `@event` | `onEvent` | Event handlers |
| `:prop` | `prop={value}` | Prop binding |
| `<slot>` | `props.children` | Children pattern |

---

## Reactivity Comparison

### ref() to signal()

```typescript
// Vue
import { ref } from 'vue';

const count = ref(0);
console.log(count.value);  // Read with .value
count.value++;             // Write with .value

// PhilJS
import { signal } from 'philjs-core';

const count = signal(0);
console.log(count());      // Read by calling
count.set(c => c + 1);     // Write with .set()
```

### reactive() to signal()

```typescript
// Vue
import { reactive } from 'vue';

const state = reactive({
  name: 'John',
  age: 30,
});
state.name = 'Jane';  // Direct mutation

// PhilJS
import { signal } from 'philjs-core';

const state = signal({
  name: 'John',
  age: 30,
});
// Update whole object or use spread
state.set({ ...state(), name: 'Jane' });
// Or for deeply nested updates, consider separate signals
```

### computed() to memo()

```typescript
// Vue
import { ref, computed } from 'vue';

const firstName = ref('John');
const lastName = ref('Doe');
const fullName = computed(() => `${firstName.value} ${lastName.value}`);

console.log(fullName.value);  // "John Doe"

// PhilJS
import { signal, memo } from 'philjs-core';

const firstName = signal('John');
const lastName = signal('Doe');
const fullName = memo(() => `${firstName()} ${lastName()}`);

console.log(fullName());  // "John Doe"
```

### watch() to effect()

```typescript
// Vue - explicit dependencies
import { ref, watch } from 'vue';

const count = ref(0);

watch(count, (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`);
});

// With multiple sources
watch([firstName, lastName], ([first, last], [oldFirst, oldLast]) => {
  console.log('Name changed');
});

// PhilJS - auto-tracked dependencies
import { signal, effect } from 'philjs-core';

const count = signal(0);

effect(() => {
  // Dependencies are auto-tracked!
  console.log(`Count is now ${count()}`);
});

// No need to specify dependencies - they're detected automatically
effect(() => {
  console.log(`Name: ${firstName()} ${lastName()}`);
});
```

### watchEffect() to effect()

```typescript
// Vue
import { ref, watchEffect } from 'vue';

const count = ref(0);

watchEffect(() => {
  console.log(`Count: ${count.value}`);
});

// PhilJS - identical behavior
import { signal, effect } from 'philjs-core';

const count = signal(0);

effect(() => {
  console.log(`Count: ${count()}`);
});
```

---

## Component Syntax

### Options API to Function Components

```vue
<!-- Vue Options API -->
<script>
export default {
  data() {
    return {
      count: 0,
    };
  },
  computed: {
    doubled() {
      return this.count * 2;
    },
  },
  methods: {
    increment() {
      this.count++;
    },
  },
  mounted() {
    console.log('Mounted');
  },
};
</script>

<template>
  <button @click="increment">{{ count }}</button>
</template>
```

```tsx
// PhilJS
import { signal, memo, onMount } from 'philjs-core';

function Counter() {
  const count = signal(0);
  const doubled = memo(() => count() * 2);

  onMount(() => {
    console.log('Mounted');
  });

  const increment = () => count.set(c => c + 1);

  return <button onClick={increment}>{count()}</button>;
}

export default Counter;
```

### Composition API (script setup)

```vue
<!-- Vue Composition API -->
<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  initialValue: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'change', value: number): void;
}>();

const count = ref(props.initialValue);

function increment() {
  count.value++;
  emit('change', count.value);
}
</script>

<template>
  <button @click="increment">{{ count }}</button>
</template>
```

```tsx
// PhilJS
import { signal } from 'philjs-core';

interface Props {
  initialValue: number;
  onChange?: (value: number) => void;
}

function Counter(props: Props) {
  const count = signal(props.initialValue);

  const increment = () => {
    count.set(c => c + 1);
    props.onChange?.(count());
  };

  return <button onClick={increment}>{count()}</button>;
}

export default Counter;
```

---

## Template to JSX

### Directives Conversion

```vue
<!-- Vue Template -->
<template>
  <div>
    <!-- v-if -->
    <span v-if="isVisible">Visible</span>

    <!-- v-else -->
    <span v-if="type === 'a'">A</span>
    <span v-else-if="type === 'b'">B</span>
    <span v-else>C</span>

    <!-- v-for -->
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>

    <!-- v-model -->
    <input v-model="name" />

    <!-- v-show -->
    <div v-show="isVisible">Always in DOM</div>

    <!-- v-bind -->
    <img :src="imageUrl" :alt="imageAlt" />

    <!-- v-on -->
    <button @click="handleClick">Click</button>
    <input @input="handleInput" @keyup.enter="handleEnter" />
  </div>
</template>
```

```tsx
// PhilJS JSX
function Component() {
  const isVisible = signal(true);
  const type = signal('a');
  const items = signal([{ id: 1, name: 'Item 1' }]);
  const name = signal('');
  const imageUrl = signal('/image.jpg');
  const imageAlt = signal('Description');

  const handleClick = () => { /* ... */ };
  const handleInput = (e: Event) => { /* ... */ };
  const handleEnter = (e: KeyboardEvent) => { /* ... */ };

  return (
    <div>
      {/* v-if */}
      {isVisible() && <span>Visible</span>}

      {/* v-else chain */}
      {type() === 'a' ? (
        <span>A</span>
      ) : type() === 'b' ? (
        <span>B</span>
      ) : (
        <span>C</span>
      )}

      {/* v-for */}
      <ul>
        {items().map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>

      {/* v-model equivalent */}
      <input
        value={name()}
        onInput={(e) => name.set(e.target.value)}
      />

      {/* v-show equivalent */}
      <div style={{ display: isVisible() ? 'block' : 'none' }}>
        Always in DOM
      </div>

      {/* v-bind equivalent */}
      <img src={imageUrl()} alt={imageAlt()} />

      {/* v-on equivalent */}
      <button onClick={handleClick}>Click</button>
      <input
        onInput={handleInput}
        onKeyUp={(e) => e.key === 'Enter' && handleEnter(e)}
      />
    </div>
  );
}
```

### Slots to Children

```vue
<!-- Vue - Parent with slots -->
<template>
  <Card>
    <template #header>
      <h1>Title</h1>
    </template>
    <p>Content</p>
    <template #footer>
      <button>Submit</button>
    </template>
  </Card>
</template>

<!-- Vue - Card component -->
<template>
  <div class="card">
    <header><slot name="header" /></header>
    <main><slot /></main>
    <footer><slot name="footer" /></footer>
  </div>
</template>
```

```tsx
// PhilJS - Parent with children
function Parent() {
  return (
    <Card
      header={<h1>Title</h1>}
      footer={<button>Submit</button>}
    >
      <p>Content</p>
    </Card>
  );
}

// PhilJS - Card component
interface CardProps {
  header?: JSX.Element;
  footer?: JSX.Element;
  children: JSX.Element;
}

function Card(props: CardProps) {
  return (
    <div class="card">
      <header>{props.header}</header>
      <main>{props.children}</main>
      <footer>{props.footer}</footer>
    </div>
  );
}
```

---

## Composition API

### Composables to Custom Hooks

```typescript
// Vue Composable
// useCounter.ts
import { ref, computed } from 'vue';

export function useCounter(initial = 0) {
  const count = ref(initial);
  const doubled = computed(() => count.value * 2);

  function increment() {
    count.value++;
  }

  function decrement() {
    count.value--;
  }

  return {
    count,
    doubled,
    increment,
    decrement,
  };
}

// Usage in component
const { count, doubled, increment } = useCounter(10);
```

```typescript
// PhilJS Hook
// useCounter.ts
import { signal, memo } from 'philjs-core';

export function useCounter(initial = 0) {
  const count = signal(initial);
  const doubled = memo(() => count() * 2);

  const increment = () => count.set(c => c + 1);
  const decrement = () => count.set(c => c - 1);

  return {
    count: () => count(),      // Return getter
    doubled: () => doubled(),  // Return getter
    increment,
    decrement,
  };
}

// Usage in component
const { count, doubled, increment } = useCounter(10);
// In JSX: {count()}
```

### Provide/Inject to Context

```vue
<!-- Vue Provider -->
<script setup>
import { provide, ref } from 'vue';

const theme = ref('dark');
provide('theme', theme);
</script>

<!-- Vue Consumer -->
<script setup>
import { inject } from 'vue';

const theme = inject('theme');
</script>
```

```tsx
// PhilJS Provider
import { createContext, useContext } from 'philjs-core';

const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  );
}

// PhilJS Consumer
function Child() {
  const theme = useContext(ThemeContext);
  return <div>Theme: {theme}</div>;
}
```

---

## State Management

### Pinia to Signals

```typescript
// Pinia Store
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Counter',
  }),
  getters: {
    doubled: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++;
    },
  },
});

// Usage
const store = useCounterStore();
console.log(store.count);
console.log(store.doubled);
store.increment();
```

```typescript
// PhilJS Store with signals
import { signal, memo } from 'philjs-core';

// Simple approach - exported signals
export const count = signal(0);
export const name = signal('Counter');
export const doubled = memo(() => count() * 2);
export const increment = () => count.set(c => c + 1);

// Usage
console.log(count());
console.log(doubled());
increment();
```

```typescript
// PhilJS Store - module pattern
// stores/counter.ts
import { signal, memo } from 'philjs-core';

function createCounterStore() {
  const count = signal(0);
  const name = signal('Counter');

  return {
    // State (as getters)
    count: () => count(),
    name: () => name(),

    // Computed
    doubled: memo(() => count() * 2),

    // Actions
    increment: () => count.set(c => c + 1),
    decrement: () => count.set(c => c - 1),
    reset: () => count.set(0),
    setName: (n: string) => name.set(n),
  };
}

export const counterStore = createCounterStore();

// Usage
import { counterStore } from './stores/counter';

function Counter() {
  return (
    <div>
      <span>{counterStore.count()}</span>
      <span>{counterStore.doubled()}</span>
      <button onClick={counterStore.increment}>+</button>
    </div>
  );
}
```

### Vuex to Signals

```typescript
// Vuex Store
const store = createStore({
  state: {
    count: 0,
  },
  mutations: {
    increment(state) {
      state.count++;
    },
  },
  actions: {
    asyncIncrement({ commit }) {
      setTimeout(() => commit('increment'), 1000);
    },
  },
  getters: {
    doubled: (state) => state.count * 2,
  },
});

// Usage
store.commit('increment');
store.dispatch('asyncIncrement');
store.getters.doubled;
```

```typescript
// PhilJS equivalent
import { signal, memo } from 'philjs-core';

const count = signal(0);

export const store = {
  state: {
    count: () => count(),
  },
  getters: {
    doubled: memo(() => count() * 2),
  },
  mutations: {
    increment: () => count.set(c => c + 1),
  },
  actions: {
    asyncIncrement: () => {
      setTimeout(() => count.set(c => c + 1), 1000);
    },
  },
};

// Usage
store.mutations.increment();
store.actions.asyncIncrement();
store.getters.doubled();
```

---

## Routing

### Vue Router to philjs-router

```typescript
// Vue Router
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/users/:id', component: User },
  ],
});
```

```vue
<!-- Vue Router usage -->
<template>
  <nav>
    <router-link to="/">Home</router-link>
    <router-link to="/about">About</router-link>
  </nav>
  <router-view />
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// Access params
console.log(route.params.id);

// Navigate
router.push('/about');
</script>
```

```tsx
// PhilJS Router
import {
  createAppRouter,
  Link,
  RouterView,
  useRoute,
  useRouter,
} from 'philjs-router';

const router = createAppRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/users/:id', component: User },
  ],
});

// Usage
function App() {
  return (
    <router.Provider>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
      </nav>
      <RouterView />
    </router.Provider>
  );
}

function User() {
  const route = useRoute();
  const { navigate } = useRouter();

  // Access params
  console.log(route.params.id);

  // Navigate
  const goToAbout = () => navigate('/about');

  return <button onClick={goToAbout}>Go to About</button>;
}
```

---

## Common Patterns

### Async Component Loading

```vue
<!-- Vue -->
<script setup>
import { defineAsyncComponent } from 'vue';

const AsyncComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
);
</script>
```

```tsx
// PhilJS
import { lazy, Suspense } from 'philjs-core';

const AsyncComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AsyncComponent />
    </Suspense>
  );
}
```

### Teleport to Portal

```vue
<!-- Vue -->
<template>
  <teleport to="body">
    <div class="modal">Modal Content</div>
  </teleport>
</template>
```

```tsx
// PhilJS
import { Portal } from 'philjs-core';

function Modal() {
  return (
    <Portal target={document.body}>
      <div class="modal">Modal Content</div>
    </Portal>
  );
}
```

### Transition/Animation

```vue
<!-- Vue -->
<template>
  <Transition name="fade">
    <div v-if="show">Animated</div>
  </Transition>
</template>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
```

```tsx
// PhilJS with CSS transitions
function Animated() {
  const show = signal(true);

  return (
    <div
      class={show() ? 'fade-in' : 'fade-out'}
      style={{ transition: 'opacity 0.5s' }}
    >
      {show() && <div>Animated</div>}
    </div>
  );
}

// Or with PhilJS animation API
import { createAnimatedValue } from 'philjs-core';

function Animated() {
  const show = signal(true);
  const opacity = createAnimatedValue(1);

  effect(() => {
    opacity.animateTo(show() ? 1 : 0, { duration: 500 });
  });

  return <div style={{ opacity: opacity() }}>Animated</div>;
}
```

---

## Step-by-Step Migration

### 1. Install Dependencies

```bash
npm install philjs-core philjs-router
npm uninstall vue @vue/compiler-sfc vue-router pinia
```

### 2. Update Build Configuration

```javascript
// vite.config.js
export default {
  // Remove Vue plugin
  plugins: [],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'philjs-core',
  },
};
```

### 3. Update Entry Point

```typescript
// Before (Vue)
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');

// After (PhilJS)
import { render } from 'philjs-core';
import App from './App';

render(() => <App />, document.getElementById('app')!);
```

### 4. Convert Components

1. Rename `.vue` files to `.tsx`
2. Convert `<script setup>` to function component
3. Convert `ref()` to `signal()`
4. Convert `computed()` to `memo()`
5. Convert `watch()`/`watchEffect()` to `effect()`
6. Convert template to JSX
7. Update event handlers and bindings

### 5. Convert Stores

1. Replace Pinia/Vuex with signal-based stores
2. Export signals directly or create store objects
3. Update component imports

### 6. Update Routing

1. Replace vue-router with philjs-router
2. Update route definitions
3. Replace `<router-link>` with `<Link>`
4. Update navigation hooks

### 7. Test and Verify

```bash
npm test
npm run build
npm run dev
```

---

## Migration CLI

Use the automated migration tool:

```bash
# Analyze project
npx philjs-migrate --from vue --source ./src --analyze-only

# Preview changes
npx philjs-migrate --from vue --source ./src --dry-run

# Run migration
npx philjs-migrate --from vue --source ./src --output ./src-migrated
```

---

## Need Help?

- [PhilJS Documentation](https://philjs.dev)
- [Discord Community](https://discord.gg/philjs)
- [GitHub Issues](https://github.com/philjs/philjs/issues)
