# Universal Component Protocol

PhilJS introduces the **Universal Component Protocol (UCP)**, a breakthrough technology that allows you to use components from **React**, **Vue**, **Svelte**, and **Solid** directly inside your PhilJS application.

This is not just a wrapper; it's a deep runtime integration that bridges state, context, and events between frameworks.

## Why Universal?

1.  **Incremental Migration**: Move to PhilJS one component at a time. Keep your complex React data grids or Vue dashboards while migrating the shell.
2.  **Ecosystem Access**: Need a specific library that only exists for React? Use it.
3.  **Team Flexibility**: Let different teams ship features in their preferred framework while deploying a unified app.

## Usage

### Using React Components

First, install the adapter:

```bash
npm install @philjs/universal-react react react-dom
```

Then, wrap your React component:

```tsx
import { fromReact } from '@philjs/universal-react';
import { ReactButton } from './legacy/ReactButton';

// Convert to PhilJS component
const PhilButton = fromReact(ReactButton);

export function App() {
  const count = signal(0);

  return (
    <div>
      <h1>PhilJS App</h1>
      {/* Pass signals directly to props! */}
      <PhilButton 
        onClick={() => count.update(c => c + 1)} 
        label={`Count is ${count()}`} 
      />
    </div>
  );
}
```

### Using Vue Components

```tsx
import { fromVue } from '@philjs/universal-vue';
import UserCard from './UserCard.vue';

const Card = fromVue(UserCard);

export function App() {
  return <Card user={{ name: 'Phil' }} />;
}
```

## How It Works

The UCP creates a lightweight "Micro-Root" for the alien framework.

1.  **State Bridging**: When you pass a PhilJS Signal to a React component, UCP automatically wraps it in a hook (`useEffect`) that triggers a React re-render when the signal changes.
2.  **Event Tunneling**: Native DOM events from the alien component bubble up correctly to PhilJS.
3.  **Context Sharing**: (Advanced) You can even share Dependency Injection context between frameworks using the `UniversalContext` bridge.

## Performance Considerations

*   **Overhead**: There is a small memory overhead for booting the alien runtime (e.g., `react-dom`).
*   **Optimization**: PhilJS automatically **isolates** alien components. If a React component re-renders, it does *not* trigger the parent PhilJS component to update, and vice-versa.
*   **Islands**: You can combine this with Islands Architecture. `<ReactComponents client:visible />` will only load React when the user scrolls to it.

## Best Practices

*   **Prefer Native**: For core UI primitives (buttons, inputs), rewrite in PhilJS for 0kb overhead.
*   **Wrap Large Blocks**: Use UCP for complex, heavy widgets (Calendars, Rich Text Editors, Maps).
*   **Avoid layout thrashing**: Don't nest frameworks deeply (e.g., PhilJS -> React -> PhilJS -> React). Keep the boundaries clean.
