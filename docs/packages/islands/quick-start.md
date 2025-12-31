# Quick Start Guide - Multi-Framework Islands

Get started with PhilJS multi-framework islands in 5 minutes.

## Installation

```bash
# Install @philjs/islands
pnpm add @philjs/islands

# Install frameworks you want to use (pick one or more)
pnpm add react react-dom        # React
pnpm add vue                    # Vue
pnpm add svelte                 # Svelte
pnpm add preact                 # Preact
pnpm add solid-js               # Solid
```

## Step 1: Configure Vite

Create or update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { viteMultiFramework } from '@philjs/islands/vite-multi-framework';

export default defineConfig({
  plugins: [
    react(),                    // Add framework plugins
    vue(),
    viteMultiFramework({        // Add PhilJS plugin
      frameworks: ['react', 'vue'],
      splitByFramework: true,
      generateManifest: true
    })
  ]
});
```

## Step 2: Create Island Components

### React Component (`islands/Counter.tsx`)

```tsx
import { useState } from 'react';

export default function Counter({ initial = 0 }) {
  const [count, setCount] = useState(initial);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```

### Vue Component (`islands/TodoList.vue`)

```vue
<script setup lang="ts">
import { ref } from 'vue';

const todos = ref(['Learn PhilJS', 'Build Islands']);
const newTodo = ref('');

function addTodo() {
  if (newTodo.value) {
    todos.value.push(newTodo.value);
    newTodo.value = '';
  }
}
</script>

<template>
  <div>
    <input v-model="newTodo" @keyup.enter="addTodo" />
    <button @click="addTodo">Add</button>
    <ul>
      <li v-for="todo in todos" :key="todo">{{ todo }}</li>
    </ul>
  </div>
</template>
```

## Step 3: Register Islands

In your main app file:

```typescript
import { registerIslandComponent } from '@philjs/islands';

// Register components
registerIslandComponent('react', 'Counter', () => import('./islands/Counter.tsx'));
registerIslandComponent('vue', 'TodoList', () => import('./islands/TodoList.vue'));
```

## Step 4: Use Islands

```tsx
import { MultiFrameworkIsland } from '@philjs/islands';

export default function App() {
  return (
    <div>
      <h1>My App</h1>

      {/* React Island - Hydrate when visible */}
      <MultiFrameworkIsland
        framework="react"
        component="Counter"
        props={{ initial: 0 }}
        hydration={{ strategy: 'visible' }}
      />

      {/* Vue Island - Hydrate when idle */}
      <MultiFrameworkIsland
        framework="vue"
        component="TodoList"
        props={{ items: [] }}
        hydration={{ strategy: 'idle' }}
      />
    </div>
  );
}
```

## Done!

That's it! You now have a multi-framework application with:
- Automatic code splitting per framework
- Intelligent hydration strategies
- Type-safe component props

## Next Steps

### Share State Between Islands

```typescript
import { createSharedState } from '@philjs/islands';

const userState = createSharedState('user', {
  name: 'Guest',
  isLoggedIn: false
});

// Update from any island
userState.updateState({ name: 'John', isLoggedIn: true });
```

### Use Event Bus

```typescript
import { eventBus } from '@philjs/islands';

// Emit from one island
eventBus.emit('user-login', { userId: 123 });

// Listen in another island
eventBus.on('user-login', (data) => {
  console.log('User logged in:', data.userId);
});
```

### Framework-Specific Hooks

```tsx
// React
import { frameworkHooks } from '@philjs/islands';

function MyComponent() {
  const [state, setState] = frameworkHooks.react.useSharedState('app', {});
  const bus = frameworkHooks.react.useEventBus();
  // ...
}
```

## Hydration Strategies

Choose the right strategy for each island:

| Strategy | When to Use | Example |
|----------|-------------|---------|
| `immediate` | Critical, above-the-fold | Navigation, search |
| `visible` | Scroll-dependent content | Comments, feeds |
| `idle` | Non-critical features | Analytics, chat |
| `interaction` | On-demand features | Modals, dropdowns |
| `media` | Device-specific | Desktop-only widgets |

## Common Patterns

### Multiple Frameworks on Same Page

```tsx
<div>
  <MultiFrameworkIsland framework="react" component="Header" />
  <MultiFrameworkIsland framework="vue" component="Sidebar" />
  <MultiFrameworkIsland framework="svelte" component="Footer" />
</div>
```

### Sharing Data

```tsx
// Create shared state
const cartState = createSharedState('cart', { items: [], total: 0 });

// Island 1 (React) - Add to cart
function ProductCard() {
  const [cart, setCart] = frameworkHooks.react.useSharedState('cart', {});
  // ...
}

// Island 2 (Vue) - Display cart
const { state: cart } = frameworkHooks.vue.useSharedState('cart', {});
```

### Cross-Island Events

```tsx
// Island 1 - Emit event
eventBus.emit('product-added', { id: 123, price: 29.99 });

// Island 2 - Listen for event
eventBus.on('product-added', (product) => {
  showNotification(`Added ${product.id}`);
});
```

## Troubleshooting

### Island not hydrating?
- Check that component is registered
- Verify framework plugin is in vite.config.ts
- Check browser console for errors

### Props not working?
- Ensure props are JSON-serializable
- Check prop names match component expectations
- Verify data-props attribute in HTML

### Framework not detected?
- Add framework to `frameworks` array in vite config
- Check that component imports the framework
- Try explicit `framework="react"` instead of `"auto"`

## Learn More

- [Full Documentation](./MULTI-FRAMEWORK.md)
- [API Reference](./README.md#api)
- [Examples](./examples/multi-framework/)
