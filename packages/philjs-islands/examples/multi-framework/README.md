# Multi-Framework Islands Example

This example demonstrates PhilJS Islands' multi-framework architecture, showing how React, Vue, and Svelte components can coexist on the same page.

## Features Demonstrated

1. **Multiple Frameworks**: React, Vue, and Svelte components on one page
2. **Hydration Strategies**: Different strategies (immediate, visible, idle, interaction)
3. **Shared State**: Cross-framework state management
4. **Event Communication**: Event bus for inter-island communication
5. **Code Splitting**: Automatic framework-specific code splitting
6. **Auto-Detection**: Framework detection for components

## Components

### React Counter (`react-counter.tsx`)
- Interactive counter with increment/decrement
- Demonstrates React hooks and state management
- Hydration: Immediate or interaction-based

### Vue Todo List (`vue-todo.vue`)
- Full-featured todo list with Vue 3 Composition API
- Add, complete, and remove todos
- Hydration: Visible (intersection observer)

### Svelte Timer (`svelte-timer.svelte`)
- Start/pause/reset timer
- Real-time updates with Svelte reactivity
- Hydration: Idle (requestIdleCallback)

## Running the Example

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
multi-framework/
├── react-counter.tsx      # React island component
├── vue-todo.vue          # Vue island component
├── svelte-timer.svelte   # Svelte island component
├── mixed-app.tsx         # Main application
├── vite.config.ts        # Vite configuration
└── README.md             # This file
```

## How It Works

### 1. Component Registration

```typescript
import { registerIslandComponent } from 'philjs-islands';

registerIslandComponent('react', 'Counter', () => import('./react-counter.js'));
registerIslandComponent('vue', 'TodoList', () => import('./vue-todo.vue'));
registerIslandComponent('svelte', 'Timer', () => import('./svelte-timer.svelte'));
```

### 2. Island Declaration

```tsx
<Island
  framework="react"
  component="Counter"
  props={{ initial: 0, step: 1 }}
  hydration={{ strategy: 'visible' }}
/>
```

### 3. Shared State

```typescript
import { createSharedState } from 'philjs-islands';

const globalState = createSharedState('app', {
  theme: 'light',
  user: { name: 'Guest' }
});

// Access in any framework
const state = globalState.getState();
globalState.updateState({ theme: 'dark' });
```

### 4. Event Communication

```typescript
import { eventBus } from 'philjs-islands';

// Emit from one island
eventBus.emit('counter-changed', { value: 42 });

// Listen in another island
eventBus.on('counter-changed', (data) => {
  console.log('Counter:', data.value);
});
```

## Hydration Strategies

### Immediate
Hydrate as soon as possible:
```tsx
<Island hydration={{ strategy: 'immediate' }} />
```

### Visible
Hydrate when scrolled into view:
```tsx
<Island hydration={{
  strategy: 'visible',
  rootMargin: '50px',
  threshold: 0.1
}} />
```

### Idle
Hydrate when browser is idle:
```tsx
<Island hydration={{
  strategy: 'idle',
  timeout: 2000
}} />
```

### Interaction
Hydrate on user interaction:
```tsx
<Island hydration={{
  strategy: 'interaction',
  events: ['click', 'mouseenter']
}} />
```

### Media
Hydrate based on media query:
```tsx
<Island hydration={{
  strategy: 'media',
  media: '(min-width: 768px)'
}} />
```

## Performance

The Vite plugin automatically:
- Detects which frameworks are used
- Creates separate chunks for each framework
- Only loads framework code when needed
- Generates an islands manifest for optimization

## Production Build

```bash
npm run build
```

Build output includes:
- `islands-manifest.json` - Metadata about all islands
- `framework-react.js` - React framework chunk
- `framework-vue.js` - Vue framework chunk
- `framework-svelte.js` - Svelte framework chunk
- Individual island component chunks

## Browser Support

- Modern browsers with ES modules support
- IntersectionObserver for visible strategy
- requestIdleCallback for idle strategy (with fallback)
- matchMedia for media strategy (with fallback)

## Learn More

- [PhilJS Islands Documentation](../../README.md)
- [Framework Adapters](../../src/adapters/README.md)
- [Vite Plugin](../../src/vite-multi-framework.ts)
