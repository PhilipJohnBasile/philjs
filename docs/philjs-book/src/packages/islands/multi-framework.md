# PhilJS Multi-Framework Islands

PhilJS-first island architecture with optional legacy-framework wrappers. Prefer PhilJS components; use React/Vue/Svelte/Preact/Solid islands only when migrating.

## Features

- **Legacy Framework Support**: Optional React, Vue, Svelte, Preact, and Solid wrappers
- **Selective Hydration**: Only hydrate interactive components when needed
- **Multiple Strategies**: Immediate, visible, idle, interaction, and media-based hydration
- **Framework Auto-Detection**: Automatically detect component frameworks
- **Code Splitting**: Automatic framework-specific code splitting
- **Shared State**: Cross-framework state management
- **Event Bus**: Inter-island communication
- **Props Normalization**: Automatic props conversion between frameworks
- **Vite Plugin**: Build-time optimization and manifest generation
- **TypeScript Support**: Full type safety across PhilJS components and wrappers

## Installation

```bash
pnpm add @philjs/islands
```

### Optional Framework Dependencies

Install only the legacy frameworks you need for migration:

```bash
# React
pnpm add react react-dom

# Vue
pnpm add vue

# Svelte
pnpm add svelte

# Preact
pnpm add preact

# Solid
pnpm add solid-js
```

## Quick Start

### 1. Configure Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteMultiFramework } from '@philjs/islands/vite-multi-framework';

export default defineConfig({
  plugins: [
    react(),
    vue(),
    svelte(),
    viteMultiFramework({
      frameworks: ['react', 'vue', 'svelte'],
      generateManifest: true,
      splitByFramework: true
    })
  ]
});
```

### 2. Register Island Components

```typescript
import { registerIslandComponent } from '@philjs/islands';

// Register components from different frameworks
registerIslandComponent('react', 'Counter', () => import('./islands/Counter.tsx'));
registerIslandComponent('vue', 'TodoList', () => import('./islands/TodoList.vue'));
registerIslandComponent('svelte', 'Timer', () => import('./islands/Timer.svelte'));
```

### 3. Use Islands in Your App

```tsx
import { MultiFrameworkIsland } from '@philjs/islands';

function App() {
  return (
    <div>
      <h1>Multi-Framework App</h1>

      {/* React Island */}
      <MultiFrameworkIsland
        framework="react"
        component="Counter"
        props={{ initial: 0 }}
        hydration={{ strategy: 'visible' }}
      />

      {/* Vue Island */}
      <MultiFrameworkIsland
        framework="vue"
        component="TodoList"
        props={{ items: [] }}
        hydration={{ strategy: 'idle' }}
      />

      {/* Svelte Island */}
      <MultiFrameworkIsland
        framework="svelte"
        component="Timer"
        props={{ autoStart: true }}
        hydration={{ strategy: 'immediate' }}
      />
    </div>
  );
}
```

## Hydration Strategies

### Immediate
Hydrate as soon as possible:

```tsx
<MultiFrameworkIsland
  framework="react"
  component="CriticalComponent"
  hydration={{ strategy: 'immediate' }}
/>
```

### Visible
Hydrate when scrolled into viewport:

```tsx
<MultiFrameworkIsland
  framework="vue"
  component="LazyComponent"
  hydration={{
    strategy: 'visible',
    rootMargin: '50px',
    threshold: 0.1
  }}
/>
```

### Idle
Hydrate when browser is idle:

```tsx
<MultiFrameworkIsland
  framework="svelte"
  component="NonCriticalComponent"
  hydration={{
    strategy: 'idle',
    timeout: 2000
  }}
/>
```

### Interaction
Hydrate on user interaction:

```tsx
<MultiFrameworkIsland
  framework="preact"
  component="InteractiveWidget"
  hydration={{
    strategy: 'interaction',
    events: ['click', 'mouseenter']
  }}
/>
```

### Media Query
Hydrate based on media query:

```tsx
<MultiFrameworkIsland
  framework="solid"
  component="DesktopOnlyComponent"
  hydration={{
    strategy: 'media',
    media: '(min-width: 768px)'
  }}
/>
```

## Shared State

Share state between islands from different frameworks:

```typescript
import { createSharedState } from '@philjs/islands';

// Create shared state
const userState = createSharedState('user', {
  name: 'John Doe',
  isLoggedIn: true
});

// Read state
const currentUser = userState.getState();

// Update state
userState.setState({ name: 'Jane Doe', isLoggedIn: true });

// Partial update
userState.updateState({ isLoggedIn: false });

// Subscribe to changes
const unsubscribe = userState.subscribe((state) => {
  console.log('User changed:', state);
});
```

### Framework-Specific Hooks

#### React

```tsx
import { frameworkHooks } from '@philjs/islands';

function Counter() {
  const [count, setCount] = frameworkHooks.react.useSharedState('counter', 0);
  const eventBus = frameworkHooks.react.useEventBus();

  const increment = () => {
    setCount(c => c + 1);
    eventBus.emit('counter-changed', { value: count + 1 });
  };

  return <button onClick={increment}>Count: {count}</button>;
}
```

#### Vue

```vue
<script setup>
import { frameworkHooks } from '@philjs/islands';

const { state: count, setState: setCount } = frameworkHooks.vue.useSharedState('counter', 0);
const eventBus = frameworkHooks.vue.useEventBus();

function increment() {
  setCount(c => c + 1);
  eventBus.emit('counter-changed', { value: count.value + 1 });
}
</script>

<template>
  <button @click="increment">Count: {{ count }}</button>
</template>
```

#### Svelte

```svelte
<script>
import { frameworkHooks } from '@philjs/islands';

const count = frameworkHooks.svelte.createSharedStore('counter', 0);
const eventBus = frameworkHooks.svelte.useEventBus();

function increment() {
  count.update(c => c + 1);
  eventBus.emit('counter-changed', { value: $count + 1 });
}
</script>

<button on:click={increment}>Count: {$count}</button>
```

#### Solid

```tsx
import { frameworkHooks } from '@philjs/islands';

function Counter() {
  const [count, setCount] = frameworkHooks.solid.createSharedSignal('counter', 0);
  const eventBus = frameworkHooks.solid.useEventBus();

  const increment = () => {
    setCount(c => c + 1);
    eventBus.emit('counter-changed', { value: count() + 1 });
  };

  return <button onClick={increment}>Count: {count()}</button>;
}
```

## Event Bus

Communicate between islands:

```typescript
import { eventBus } from '@philjs/islands';

// Emit event
eventBus.emit('user-logged-in', { userId: 123 });

// Listen to event
const unsubscribe = eventBus.on('user-logged-in', (data) => {
  console.log('User logged in:', data.userId);
});

// Listen once
eventBus.once('app-initialized', () => {
  console.log('App ready!');
});

// Remove listener
eventBus.off('user-logged-in', handler);

// Add middleware
eventBus.use((event, data) => {
  console.log('Event:', event, data);
  return data; // Can transform data
});
```

## Island Bridges

Create typed communication channels between specific islands:

```typescript
import { createIslandBridge } from '@philjs/islands';

const bridge = createIslandBridge(
  { framework: 'react', id: 'island-1' },
  { framework: 'vue', id: 'island-2' }
);

// Send data from React island
bridge.send({ message: 'Hello from React!', count: 42 });

// Receive in Vue island
bridge.receive((data) => {
  console.log('Received:', data);
});
```

## Props Normalization

Automatically convert props between framework conventions:

```typescript
import { PropsNormalizer } from '@philjs/islands';

// React props
const reactProps = {
  className: 'btn',
  onClick: () => {},
  htmlFor: 'input-1'
};

// Normalize
const normalized = PropsNormalizer.normalize(reactProps, 'react');
// Result: { class: 'btn', 'on:click': Function, for: 'input-1' }

// Convert to Vue
const vueProps = PropsNormalizer.denormalize(normalized, 'vue');
// Result: { class: 'btn', '@click': Function, for: 'input-1' }
```

## Framework Adapters

### Custom Adapter

Create your own framework adapter:

```typescript
import { registerAdapter, type FrameworkAdapter } from '@philjs/islands';

const customAdapter: FrameworkAdapter = {
  name: 'custom-framework',

  detect(component) {
    // Detect if component belongs to this framework
    return component.__customFramework === true;
  },

  async hydrate(element, component, props, strategy) {
    // Hydrate the component
    const instance = new CustomFramework.Component(component, props);
    instance.mount(element);
  },

  async unmount(element) {
    // Clean up
    const instance = element.__customInstance;
    if (instance) instance.destroy();
  },

  serializeProps(props) {
    return JSON.stringify(props);
  },

  deserializeProps(serialized) {
    return JSON.parse(serialized);
  },

  getPeerDependencies() {
    return ['custom-framework'];
  }
};

registerAdapter(customAdapter);
```

## Vite Plugin Options

```typescript
import { viteMultiFramework } from '@philjs/islands/vite-multi-framework';

viteMultiFramework({
  // Frameworks to support
  frameworks: ['react', 'vue', 'svelte', 'preact', 'solid'],

  // Islands directory
  islandsDir: 'src/islands',

  // File patterns to scan
  include: ['**/*.tsx', '**/*.jsx', '**/*.vue', '**/*.svelte'],

  // Files to exclude
  exclude: ['node_modules/**', 'dist/**'],

  // Generate manifest.json
  generateManifest: true,

  // Island detection pattern
  islandPattern: /<Island\s+framework=["'](\w+)["']/g,

  // Code splitting per framework
  splitByFramework: true,

  // Auto-inject directives
  autoInjectDirectives: true,

  // Debug mode
  debug: true
})
```

## API Reference

### Multi-Framework Islands

```typescript
// Island component (SSR)
Island(config: MultiFrameworkIslandConfig): string

// Hydrate single island
hydrateMultiFrameworkIsland(element: HTMLElement): Promise<void>

// Hydrate all islands
hydrateAllMultiFrameworkIslands(root?: HTMLElement): void

// Unmount island
unmountIsland(id: string): Promise<void>

// Get island instance
getIsland(id: string): IslandInstance | undefined

// Get all islands
getAllIslands(): IslandInstance[]

// Register component
registerIslandComponent(framework: string, name: string, loader: () => Promise<any>): void

// Initialize islands
initMultiFrameworkIslands(root?: HTMLElement): void
```

### Framework Adapters

```typescript
// Get adapter by name
getAdapter(framework: string): FrameworkAdapter | undefined

// Auto-detect framework
detectFramework(component: any): FrameworkAdapter | undefined

// Register custom adapter
registerAdapter(adapter: FrameworkAdapter): void

// Check support
isFrameworkSupported(framework: string): boolean

// List frameworks
getSupportedFrameworks(): string[]
```

### Shared State

```typescript
// Create shared state
createSharedState<T>(name: string, initial: T): SharedStateStore<T>

// Get existing state
getSharedState<T>(name: string): SharedStateStore<T> | undefined

// Remove state
removeSharedState(name: string): void

// State store methods
store.getState(): T
store.setState(newState: T | (prev: T) => T): void
store.updateState(partial: Partial<T>): void
store.subscribe(callback: (state: T) => void): () => void
store.use(middleware: (state: T, next: T) => T): void
```

### Event Bus

```typescript
// Emit event
eventBus.emit<T>(event: string, data?: T): void

// Listen to event
eventBus.on<T>(event: string, callback: (data: T) => void): () => void

// Listen once
eventBus.once<T>(event: string, callback: (data: T) => void): void

// Remove listener
eventBus.off(event: string, callback?: Function): void

// Add middleware
eventBus.use(middleware: (event: string, data: any) => any): void
```

## Performance Tips

1. **Use Lazy Hydration**: Default to `visible` or `idle` strategies
2. **Minimize Immediate Islands**: Only critical components should use `immediate`
3. **Code Split by Framework**: Enable `splitByFramework` in Vite plugin
4. **Share State Sparingly**: Only for truly global state
5. **Batch Updates**: Group state changes together
6. **Use Media Queries**: Load components only on appropriate devices
7. **Monitor Bundle Size**: Check framework chunks in build output

## Examples

For full examples, see:

- [Islands](../../ssr/islands.md)
- [SSR Overview](../../ssr/overview.md)
- [WebAssembly](../../platforms/wasm.md)

## Browser Support

- Modern browsers with ES Modules support
- IntersectionObserver (with fallback)
- requestIdleCallback (with fallback)
- matchMedia (with fallback)

## License

MIT
