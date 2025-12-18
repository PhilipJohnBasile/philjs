# philjs-devtools

Developer tools overlay for PhilJS with time-travel debugging, signal inspection, and performance monitoring.

## Features

- **Time-Travel Debugging** - Rewind and replay state changes
- **Signal Inspector** - Track signal values and dependencies
- **Component Tree Viewer** - Visualize component hierarchy
- **Performance Monitoring** - Track render times and performance budgets
- **Debug Logger** - Advanced logging with filtering and formatting
- **Hydration Map** - See which islands are hydrated
- **Route Inspector** - View current route, params, and errors
- **Development Overlay** - In-browser DevTools panel

## Installation

```bash
pnpm add philjs-devtools
```

## Quick Start

### Basic DevTools Overlay

Add the overlay to your app during development:

```typescript
import { showOverlay } from 'philjs-devtools';

if (import.meta.env.DEV) {
  showOverlay();
}
```

This displays a panel showing:
- Number of islands and hydrated components
- Current route and params
- Bundle size
- Real-time stats

### Time-Travel Debugging

Debug state changes by rewinding and replaying:

```typescript
import { initTimeTravel, debugSignal } from 'philjs-devtools';
import { signal } from 'philjs-core';

// Initialize time-travel
const timeTravelDebugger = initTimeTravel({
  maxHistory: 100,
  captureStackTraces: true
});

// Create a signal with debugging
const count = debugSignal(signal(0), 'count');

// Make changes
count.set(1);
count.set(2);
count.set(3);

// Rewind to previous state
timeTravelDebugger.jumpTo(1); // count is now 1
console.log(count()); // 1

// Fast-forward
timeTravelDebugger.jumpTo(2); // count is now 2

// View timeline
console.log(timeTravelDebugger.getTimeline());
// [
//   { index: 0, timestamp: ..., signalId: 'count', value: 0 },
//   { index: 1, timestamp: ..., signalId: 'count', value: 1 },
//   { index: 2, timestamp: ..., signalId: 'count', value: 2 },
//   { index: 3, timestamp: ..., signalId: 'count', value: 3 }
// ]
```

### Signal Inspector

Track signal dependencies and values:

```typescript
import { createSignalInspector } from 'philjs-devtools';
import { signal, memo } from 'philjs-core';

const inspector = createSignalInspector();

const count = signal(0);
const doubled = memo(() => count() * 2);

inspector.watch(count, 'count');
inspector.watch(doubled, 'doubled');

count.set(5);

// View all tracked signals
console.log(inspector.getSignals());
// [
//   { id: 'count', value: 5, type: 'signal', dependencies: [] },
//   { id: 'doubled', value: 10, type: 'memo', dependencies: ['count'] }
// ]

// Get signal history
console.log(inspector.getHistory('count'));
// [0, 5]
```

### Component Tree Viewer

Visualize your component hierarchy:

```typescript
import { createComponentTree, renderTree } from 'philjs-devtools';

const tree = createComponentTree();

// Track component mounts
tree.mount('App', null);
tree.mount('Header', 'App');
tree.mount('Nav', 'Header');
tree.mount('Main', 'App');
tree.mount('Footer', 'App');

// Print the tree
console.log(renderTree(tree));
// App
//   ├─ Header
//   │  └─ Nav
//   ├─ Main
//   └─ Footer

// Track unmounts
tree.unmount('Nav');

// Get component info
const appInfo = tree.getComponent('App');
console.log(appInfo);
// {
//   id: 'App',
//   parent: null,
//   children: ['Header', 'Main', 'Footer'],
//   mountTime: 1234567890,
//   renderCount: 1
// }
```

### Performance Monitoring

Track render performance and set budgets:

```typescript
import { createPerformanceMonitor } from 'philjs-devtools';

const monitor = createPerformanceMonitor({
  budgets: {
    'App': 16, // 16ms budget for 60fps
    'Dashboard': 50
  },
  warningThreshold: 0.8 // Warn at 80% of budget
});

// Track render
monitor.startRender('App');
// ... render logic ...
monitor.endRender('App');

// Check if over budget
if (monitor.isOverBudget('App')) {
  console.warn('App exceeded performance budget!');
}

// Get metrics
const metrics = monitor.getMetrics('App');
console.log(metrics);
// {
//   averageTime: 12.5,
//   maxTime: 18,
//   minTime: 8,
//   renderCount: 10,
//   overBudgetCount: 2
// }

// Get all slow components
const slowComponents = monitor.getSlowComponents();
console.log(slowComponents);
// [{ component: 'Dashboard', avgTime: 52, budget: 50 }]
```

### Debug Logger

Advanced logging with categories and filtering:

```typescript
import { createDebugLogger } from 'philjs-devtools';

const logger = createDebugLogger({
  enabled: import.meta.env.DEV,
  categories: {
    render: true,
    state: true,
    router: false
  }
});

// Log with categories
logger.log('render', 'Rendering App component');
logger.warn('state', 'Signal updated:', { count: 5 });
logger.error('router', 'Navigation failed'); // Won't log (disabled)

// Group logs
logger.group('User Login');
logger.log('auth', 'Validating credentials...');
logger.log('auth', 'Fetching user data...');
logger.groupEnd();

// Time operations
logger.time('fetchData');
await fetchData();
logger.timeEnd('fetchData'); // Logs: "fetchData: 245ms"

// Enable/disable categories at runtime
logger.setCategory('router', true);
logger.log('router', 'Now logging router events');
```

### State Diffing

Compare state snapshots:

```typescript
import { diffState } from 'philjs-devtools';

const prevState = {
  user: { name: 'Alice', age: 30 },
  todos: [{ id: 1, done: false }]
};

const nextState = {
  user: { name: 'Alice', age: 31 },
  todos: [{ id: 1, done: true }, { id: 2, done: false }]
};

const diff = diffState(prevState, nextState);
console.log(diff);
// [
//   { type: 'updated', path: 'user.age', oldValue: 30, newValue: 31 },
//   { type: 'updated', path: 'todos[0].done', oldValue: false, newValue: true },
//   { type: 'added', path: 'todos[1]', newValue: { id: 2, done: false } }
// ]
```

## API Reference

### DevTools Overlay

- `showOverlay()` - Display the DevTools overlay panel

### Time-Travel Debugging

- `initTimeTravel(config?)` - Initialize time-travel debugger
- `getTimeTravelDebugger()` - Get the global time-travel debugger instance
- `debugSignal(signal, id)` - Wrap a signal with time-travel debugging
- `diffState(prev, next)` - Compare two state objects

**TimeTravelDebugger methods:**
- `jumpTo(index)` - Jump to a specific point in history
- `stepBack()` - Go back one step
- `stepForward()` - Go forward one step
- `getTimeline()` - Get full history timeline
- `getSnapshot(index)` - Get state snapshot at index
- `reset()` - Clear all history

### Signal Inspector

- `createSignalInspector()` - Create a signal inspector instance

**SignalInspector methods:**
- `watch(signal, id)` - Start tracking a signal
- `unwatch(id)` - Stop tracking a signal
- `getSignals()` - Get all tracked signals
- `getHistory(id)` - Get value history for a signal
- `getDependencies(id)` - Get signal dependencies

### Component Tree

- `createComponentTree()` - Create a component tree tracker
- `renderTree(tree)` - Render tree as a string

**ComponentTree methods:**
- `mount(id, parent?)` - Track component mount
- `unmount(id)` - Track component unmount
- `getComponent(id)` - Get component info
- `getChildren(id)` - Get component children
- `getTree()` - Get full component tree

### Performance Monitoring

- `createPerformanceMonitor(config?)` - Create a performance monitor

**PerformanceMonitor methods:**
- `startRender(component)` - Start timing a render
- `endRender(component)` - End timing a render
- `getMetrics(component)` - Get performance metrics
- `isOverBudget(component)` - Check if component exceeded budget
- `getSlowComponents()` - Get list of slow components
- `reset()` - Clear all metrics

### Debug Logger

- `createDebugLogger(config?)` - Create a debug logger

**DebugLogger methods:**
- `log(category, ...args)` - Log a message
- `warn(category, ...args)` - Log a warning
- `error(category, ...args)` - Log an error
- `group(label)` - Start a log group
- `groupEnd()` - End a log group
- `time(label)` - Start a timer
- `timeEnd(label)` - End a timer and log duration
- `setCategory(category, enabled)` - Enable/disable a category

## Browser Extension

PhilJS also has a browser extension for DevTools integration. See [philjs-devtools-extension](../philjs-devtools-extension) for more information.

## Best Practices

1. **Only use in development** - DevTools add overhead, disable in production
2. **Track meaningful signals** - Don't debug every signal, focus on problematic ones
3. **Set performance budgets** - Know your targets and monitor them
4. **Use categories for logging** - Organize logs by feature/module
5. **Clean up inspectors** - Unwatch signals when no longer needed
6. **Limit history size** - Set reasonable `maxHistory` to avoid memory issues

## Examples

See the [demo app](../../examples/demo-app) for a working example with DevTools enabled.

## Documentation

For more information, see the [PhilJS documentation](../../docs).

## License

MIT
