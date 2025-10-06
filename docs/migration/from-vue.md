# Migrating from Vue

Complete guide for migrating Vue applications to PhilJS.

## Overview

Vue 3's Composition API and PhilJS have similar reactive primitives. This guide helps you understand the differences and migrate your Vue applications to PhilJS.

## Key Differences

| Concept | Vue 3 | PhilJS |
|---------|-------|--------|
| Reactivity | Proxy-based | Signal-based |
| State | `ref()` / `reactive()` | `signal()` |
| Computed | `computed()` | `memo()` |
| Side Effects | `watchEffect()` / `watch()` | `effect()` |
| Templates | SFC templates | JSX |
| Lifecycle | Composition API hooks | `effect()` |

## State Management

### ref() → signal()

**Vue:**
```vue
<script setup>
import { ref } from 'vue';

const count = ref(0);

function increment() {
  count.value++;
}
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>
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
- `.value` in Vue → `()` call in PhilJS
- `.value =` → `.set()` in PhilJS
- Template syntax → JSX

### reactive() → signal() with Objects

**Vue:**
```vue
<script setup>
import { reactive } from 'vue';

const user = reactive({
  name: 'Alice',
  age: 30
});

function updateName() {
  user.name = 'Bob';
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

**Key difference:** PhilJS uses immutable updates

## Computed Values

### computed() → memo()

**Vue:**
```vue
<script setup>
import { ref, computed } from 'vue';

const count = ref(0);
const doubled = computed(() => count.value * 2);
const quadrupled = computed(() => doubled.value * 2);
</script>

<template>
  <p>Doubled: {{ doubled }}</p>
  <p>Quadrupled: {{ quadrupled }}</p>
</template>
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

### watchEffect() → effect()

**Vue:**
```vue
<script setup>
import { ref, watchEffect } from 'vue';

const count = ref(0);

watchEffect(() => {
  console.log('Count:', count.value);
});

watchEffect((onCleanup) => {
  const id = setInterval(() => {
    console.log('Tick');
  }, 1000);

  onCleanup(() => {
    clearInterval(id);
  });
});
</script>
```

**PhilJS:**
```tsx
const count = signal(0);

effect(() => {
  console.log('Count:', count());
});

effect(() => {
  const id = setInterval(() => {
    console.log('Tick');
  }, 1000);

  return () => {
    clearInterval(id);
  };
});
```

### watch() → effect()

**Vue:**
```vue
<script setup>
import { ref, watch } from 'vue';

const userId = ref('123');

watch(userId, async (newId) => {
  const user = await fetchUser(newId);
  console.log('User:', user);
});
</script>
```

**PhilJS:**
```tsx
const userId = signal('123');

effect(async () => {
  const user = await fetchUser(userId());
  console.log('User:', user);
});
```

## Lifecycle Hooks

### Vue Lifecycle → effect()

**Vue:**
```vue
<script setup>
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  console.log('Component mounted');
});

onUnmounted(() => {
  console.log('Component unmounted');
});
</script>
```

**PhilJS:**
```tsx
effect(() => {
  console.log('Component mounted');

  return () => {
    console.log('Component unmounted');
  };
});
```

## Templates vs JSX

### Template Syntax Conversion

**Vue Template:**
```vue
<template>
  <div>
    <!-- Interpolation -->
    <p>{{ message }}</p>

    <!-- Attributes -->
    <input :value="text" @input="handleInput" />

    <!-- Conditional -->
    <div v-if="show">Visible</div>
    <div v-else>Hidden</div>

    <!-- List -->
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>

    <!-- Class binding -->
    <div :class="{ active: isActive }">Content</div>

    <!-- Style binding -->
    <div :style="{ color: textColor }">Styled</div>
  </div>
</template>
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
    {show() ? <div>Visible</div> : <div>Hidden</div>}

    {/* List */}
    <ul>
      {items().map(item => (
        <li key={item.id}>
          {item.name}
        </li>
      ))}
    </ul>

    {/* Class binding */}
    <div className={isActive() ? 'active' : ''}>Content</div>

    {/* Style binding */}
    <div style={{ color: textColor() }}>Styled</div>
  </div>
);
```

### Directives → JSX Patterns

**v-model:**

**Vue:**
```vue
<input v-model="text" />
```

**PhilJS:**
```tsx
<input
  value={text()}
  onInput={(e) => text.set(e.target.value)}
/>
```

**v-show:**

**Vue:**
```vue
<div v-show="visible">Content</div>
```

**PhilJS:**
```tsx
<div style={{ display: visible() ? 'block' : 'none' }}>
  Content
</div>
```

**v-for:**

**Vue:**
```vue
<li v-for="(item, index) in items" :key="item.id">
  {{ index }}: {{ item.name }}
</li>
```

**PhilJS:**
```tsx
{items().map((item, index) => (
  <li key={item.id}>
    {index}: {item.name}
  </li>
))}
```

## Component Communication

### Props

**Vue:**
```vue
<!-- Parent.vue -->
<template>
  <ChildComponent :message="greeting" :count="count" />
</template>

<!-- Child.vue -->
<script setup>
defineProps<{
  message: string;
  count: number;
}>();
</script>
```

**PhilJS:**
```tsx
// Parent
<ChildComponent message={greeting()} count={count()} />

// Child
interface ChildProps {
  message: string;
  count: number;
}

function ChildComponent({ message, count }: ChildProps) {
  return <div>{message} - {count}</div>;
}
```

### Emits

**Vue:**
```vue
<!-- Child.vue -->
<script setup>
const emit = defineEmits<{
  update: [value: string];
}>();

function handleClick() {
  emit('update', 'new value');
}
</script>

<!-- Parent.vue -->
<template>
  <ChildComponent @update="handleUpdate" />
</template>
```

**PhilJS:**
```tsx
// Child
interface ChildProps {
  onUpdate: (value: string) => void;
}

function ChildComponent({ onUpdate }: ChildProps) {
  const handleClick = () => {
    onUpdate('new value');
  };

  return <button onClick={handleClick}>Update</button>;
}

// Parent
<ChildComponent onUpdate={handleUpdate} />
```

## Provide/Inject → Context

**Vue:**
```vue
<!-- Parent.vue -->
<script setup>
import { provide, ref } from 'vue';

const theme = ref('light');
provide('theme', theme);
</script>

<!-- Child.vue -->
<script setup>
import { inject } from 'vue';

const theme = inject('theme');
</script>
```

**PhilJS:**
```tsx
import { createContext, useContext } from 'philjs-core';

const ThemeContext = createContext('light');

// Parent
function Parent() {
  const theme = signal('light');

  return (
    <ThemeContext.Provider value={theme()}>
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

### Vue Router → PhilJS Router

**Vue Router:**
```vue
<!-- App.vue -->
<template>
  <nav>
    <router-link to="/">Home</router-link>
    <router-link to="/about">About</router-link>
  </nav>

  <router-view />
</template>

<!-- router/index.ts -->
import { createRouter } from 'vue-router';

const router = createRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/users/:id', component: User }
  ]
});
```

**PhilJS Router:**
```tsx
import { Router, Route, Link } from 'philjs-router';

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
```

### Route Params

**Vue:**
```vue
<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
const userId = route.params.id;
</script>
```

**PhilJS:**
```tsx
import { useParams } from 'philjs-router';

function User() {
  const { id } = useParams();
  return <div>User ID: {id}</div>;
}
```

## Composables → Custom Hooks

**Vue Composable:**
```typescript
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
    decrement
  };
}
```

**PhilJS Hook:**
```typescript
// useCounter.ts
import { signal, memo } from 'philjs-core';

export function useCounter(initial = 0) {
  const count = signal(initial);
  const doubled = memo(() => count() * 2);

  const increment = () => {
    count.set(count() + 1);
  };

  const decrement = () => {
    count.set(count() - 1);
  };

  return {
    count,
    doubled,
    increment,
    decrement
  };
}
```

## State Management

### Pinia → PhilJS Patterns

**Pinia Store:**
```typescript
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const isAuthenticated = computed(() => user.value !== null);

  async function login(email, password) {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    user.value = await response.json();
  }

  function logout() {
    user.value = null;
  }

  return {
    user,
    isAuthenticated,
    login,
    logout
  };
});
```

**PhilJS:**
```typescript
import { signal, memo } from 'philjs-core';

function createUserStore() {
  const user = signal(null);
  const isAuthenticated = memo(() => user() !== null);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    user.set(await response.json());
  };

  const logout = () => {
    user.set(null);
  };

  return {
    user,
    isAuthenticated,
    login,
    logout
  };
}

export const userStore = createUserStore();
```

## Migration Strategy

### 1. Component-by-Component

1. Start with leaf components
2. Move to parent components
3. Update routing last

### 2. Conversion Checklist

- [ ] Replace `ref()` with `signal()`
- [ ] Replace `computed()` with `memo()`
- [ ] Replace `watchEffect()` with `effect()`
- [ ] Convert templates to JSX
- [ ] Replace `v-model` with controlled inputs
- [ ] Update event handlers (`@click` → `onClick`)
- [ ] Convert lifecycle hooks to effects
- [ ] Update router imports

### 3. Automated Patterns

```bash
# ref → signal
s/const (\w+) = ref\(/const $1 = signal(/g

# .value reads
s/(\w+)\.value/\1()/g

# .value writes
s/(\w+)\.value = /\1.set(/g
```

## Common Pitfalls

### Remember Function Calls

```tsx
// ❌ Vue habit
<p>Count: {count}</p>

// ✅ PhilJS
<p>Count: {count()}</p>
```

### Immutable Updates

```tsx
// ❌ Vue habit (mutating reactive object)
user().name = 'Bob';

// ✅ PhilJS (immutable update)
user.set({ ...user(), name: 'Bob' });
```

### Event Handler Syntax

```tsx
// ❌ Vue habit
<button @click="increment">

// ✅ PhilJS
<button onClick={increment}>
```

## Summary

PhilJS migration from Vue:

✅ Similar reactivity model
✅ Composition API maps well
✅ JSX instead of templates
✅ Simpler mental model
✅ No `.value` confusion
✅ Better TypeScript support

Vue developers will find PhilJS familiar and powerful!

---

**Next:** [Migrating from Svelte →](./from-svelte.md)
