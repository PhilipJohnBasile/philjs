# @philjs/devtools

The `@philjs/devtools` package provides comprehensive developer tools for PhilJS applications, including time-travel debugging, Redux DevTools integration, component inspection, and performance profiling.

## Installation

```bash
npm install @philjs/devtools
```

## Features

- **Time-Travel Debugging** - State history with undo/redo and timeline branching
- **Redux DevTools** - Full integration with Redux DevTools Extension
- **Component Inspector** - Visual component tree with props and state
- **Performance Profiler** - Render, memory, and network profiling
- **Flame Graphs** - Visualize render performance
- **State Diff** - Compare state snapshots

## Quick Start

```typescript
import {
  initTimeTravel,
  initReduxDevTools,
  showOverlay,
  startProfiling,
} from '@philjs/devtools';

// Initialize time-travel debugging
const timeTravel = initTimeTravel({
  maxSnapshots: 100,
  enableBranching: true,
});

// Connect to Redux DevTools
const devTools = initReduxDevTools(
  { count: 0, user: null },
  { name: 'MyApp' }
);

// Show developer overlay
showOverlay();

// Start performance profiling
startProfiling();
```

---

## Time-Travel Debugging

### Overview

The time-travel debugger captures state snapshots and allows you to navigate through history, including branching for "what if" scenarios.

### Initialization

```typescript
import { initTimeTravel, getTimeTravelDebugger } from '@philjs/devtools';
import type { TimeTravelConfig, StateSnapshot } from '@philjs/devtools';

const timeTravel = initTimeTravel<AppState>({
  maxSnapshots: 100,        // Max history size
  captureInterval: 0,       // Min ms between captures
  enableBranching: true,    // Allow timeline branching
  captureActions: true,     // Track action names
});

// Get existing instance
const existing = getTimeTravelDebugger<AppState>();
```

### Capturing State

```typescript
// Capture state with optional action name
timeTravel.capture({ count: 1 }, 'INCREMENT');

// Capture with metadata
timeTravel.capture(
  { count: 2 },
  'SET_COUNT',
  { source: 'user', timestamp: Date.now() }
);
```

### Navigation

```typescript
// Undo (go back)
const prevState = timeTravel.undo();
console.log(timeTravel.canUndo()); // true/false

// Redo (go forward)
const nextState = timeTravel.redo();
console.log(timeTravel.canRedo()); // true/false

// Jump to specific snapshot
const snapshot = timeTravel.jumpTo('snapshot-123-abc');

// Get current snapshot
const current = timeTravel.getCurrent();

// Stop time traveling (return to present)
timeTravel.stopTimeTraveling();
```

### Timeline Branching

```typescript
// When you undo to a past state and make changes,
// a new branch is created in the timeline

timeTravel.capture({ count: 0 }, 'INIT');
timeTravel.capture({ count: 1 }, 'INCREMENT');
timeTravel.capture({ count: 2 }, 'INCREMENT');

// Go back
timeTravel.undo(); // count: 1

// Make a different change - creates a branch
timeTravel.capture({ count: 10 }, 'SET_TO_TEN');

// Get timeline tree
const timeline = timeTravel.getTimeline();
console.log(timeline);
// {
//   snapshot: { id: '...', state: { count: 0 } },
//   children: [
//     {
//       snapshot: { id: '...', state: { count: 1 } },
//       children: [
//         { snapshot: { state: { count: 2 } } },  // Original path
//         { snapshot: { state: { count: 10 } } }, // Branch
//       ]
//     }
//   ]
// }
```

### State Diffing

```typescript
import { diffState } from '@philjs/devtools';
import type { StateDiff, DiffType } from '@philjs/devtools';

const oldState = { count: 0, user: { name: 'Alice' } };
const newState = { count: 1, user: { name: 'Bob' }, items: [] };

const diffs = diffState(oldState, newState);
console.log(diffs);
// [
//   { path: ['count'], type: 'modified', oldValue: 0, newValue: 1 },
//   { path: ['user', 'name'], type: 'modified', oldValue: 'Alice', newValue: 'Bob' },
//   { path: ['items'], type: 'added', newValue: [] },
// ]

// Get diff between two snapshots
const history = timeTravel.getHistory();
const snapshotDiffs = timeTravel.getDiff(
  history[0].id,
  history[history.length - 1].id
);
```

### Export/Import Sessions

```typescript
// Export for bug reports
const session = timeTravel.exportSession();
localStorage.setItem('debug-session', session);

// Import session
const savedSession = localStorage.getItem('debug-session');
timeTravel.importSession(savedSession);

// Get statistics
const stats = timeTravel.getStats();
console.log(stats);
// {
//   totalSnapshots: 50,
//   currentIndex: 25,
//   timeRange: { start: Date, end: Date },
//   branches: 3,
// }
```

### Debug Signals

```typescript
import { debugSignal } from '@philjs/devtools';
import { signal } from '@philjs/core';

const count = signal(0);

// Wrap signal for automatic tracking
const trackedCount = debugSignal(count, 'count');

// Now all changes are captured
trackedCount.set(1); // Captured: 'set count'
trackedCount.set(2); // Captured: 'set count'
```

---

## Redux DevTools Integration

### Initialization

```typescript
import {
  initReduxDevTools,
  getReduxDevTools,
  disconnectReduxDevTools,
} from '@philjs/devtools';
import type { ReduxDevToolsConfig, ReduxAction } from '@philjs/devtools';

const devTools = initReduxDevTools<AppState>(
  { count: 0, user: null }, // Initial state
  {
    name: 'MyApp',              // DevTools instance name
    maxAge: 50,                 // Max actions to keep
    trace: true,                // Include stack traces
    traceLimit: 10,             // Stack trace depth
    actionsBlacklist: ['TICK'], // Actions to ignore
    actionsWhitelist: [],       // Only these actions (if set)
    actionSanitizer: (action) => action,
    stateSanitizer: (state) => state,
  }
);
```

### Sending Actions

```typescript
// Track state changes
function increment() {
  const newState = { ...state, count: state.count + 1 };
  devTools.send({ type: 'INCREMENT' }, newState);
  return newState;
}

function setUser(user: User) {
  const newState = { ...state, user };
  devTools.send(
    { type: 'SET_USER', payload: user },
    newState
  );
  return newState;
}
```

### Handling State Changes

```typescript
// React to time travel / state imports
devTools.onStateChange = (state) => {
  console.log('State changed from DevTools:', state);
  // Update your application state
};

// Handle custom actions dispatched from DevTools
devTools.onCustomAction = (action) => {
  console.log('Custom action:', action);
  // Process the action
};
```

### State Persistence

```typescript
import { StatePersistence } from '@philjs/devtools';
import type { PersistenceConfig } from '@philjs/devtools';

const persistence = new StatePersistence<AppState>({
  key: 'my-app-state',
  storage: localStorage,
  version: 2,
  migrate: (state, version) => {
    if (version === 1) {
      return { ...state, newField: 'default' };
    }
    return state;
  },
});

// Save state
persistence.save({ count: 5, user: null });

// Load state
const savedState = persistence.load();

// Clear persisted state
persistence.clear();
```

### Action Replay

```typescript
import { ActionReplayer } from '@philjs/devtools';

const replayer = new ActionReplayer<AppState>();

// Record actions during development
replayer.record({ type: 'INCREMENT' }, { count: 1 });
replayer.record({ type: 'INCREMENT' }, { count: 2 });
replayer.record({ type: 'SET_USER', payload: user }, { count: 2, user });

// Replay actions
await replayer.replay(
  (action, state) => {
    console.log('Replaying:', action.type, state);
    // Apply action to your store
  },
  500 // Delay between actions (ms)
);

// Control playback
replayer.stop();
replayer.clear();
console.log(replayer.isPlaying());
```

---

## Component Inspector

### Visual Inspection

```typescript
import {
  createInspector,
  getInspector,
  ComponentInspector,
} from '@philjs/devtools';

const inspector = createInspector({
  highlightColor: 'rgba(0, 136, 255, 0.3)',
  showProps: true,
  showState: true,
  showPerformance: true,
});

// Toggle visibility
inspector.toggle();

// Select a component
inspector.select(componentElement);

// Get component info
const info = inspector.getComponentInfo(componentElement);
console.log(info);
// {
//   name: 'Button',
//   props: { label: 'Click', variant: 'primary' },
//   state: { isHovered: false },
//   performance: { renderTime: 1.5, rerenderCount: 3 },
// }
```

### Inspector Panels

```typescript
import {
  PropsPanel,
  StatePanel,
  StylePanel,
  PerformancePanel,
} from '@philjs/devtools';

// Each panel provides specific component info
<PropsPanel component={selectedComponent} />
<StatePanel component={selectedComponent} />
<StylePanel component={selectedComponent} />
<PerformancePanel component={selectedComponent} />
```

### Element Highlighter

```typescript
import { ElementHighlighter } from '@philjs/devtools';

const highlighter = new ElementHighlighter({
  color: 'rgba(255, 0, 0, 0.2)',
  borderColor: 'red',
  labelBackground: '#333',
});

// Highlight an element
highlighter.highlight(element, 'Button');

// Clear highlight
highlighter.clear();
```

---

## Performance Profiler

### Render Profiling

```typescript
import {
  startProfiling,
  stopProfiling,
  recordRenderStart,
  recordRenderEnd,
  recordMemo,
} from '@philjs/devtools';
import type { RenderProfile } from '@philjs/devtools';

// Start profiling
startProfiling({
  includeProps: true,
  trackMemory: true,
});

// In your components (automatic with dev build)
recordRenderStart('Button', { label: 'Click' });
recordMemo(true);  // Cache hit
recordMemo(false); // Cache miss
recordRenderEnd();

// Stop and get results
const profiles: RenderProfile[] = stopProfiling();
```

### Memory Profiling

```typescript
import {
  startMemoryProfiling,
  stopMemoryProfiling,
  captureMemorySnapshot,
} from '@philjs/devtools';
import type { MemoryProfile } from '@philjs/devtools';

// Start sampling every second
startMemoryProfiling(1000);

// ... run your application ...

// Stop and get results
const memoryProfiles: MemoryProfile[] = stopMemoryProfiling();

// Or capture a single snapshot
const snapshot = captureMemorySnapshot();
console.log(snapshot);
// {
//   timestamp: 1234567890,
//   heapUsed: 50000000,
//   heapTotal: 100000000,
//   signals: 150,
//   effects: 50,
//   components: 75,
// }
```

### Network Profiling

```typescript
import {
  startNetworkProfiling,
  stopNetworkProfiling,
} from '@philjs/devtools';
import type { NetworkProfile } from '@philjs/devtools';

// Start intercepting fetch requests
startNetworkProfiling();

// ... make network requests ...

// Stop and get results
const networkProfiles: NetworkProfile[] = stopNetworkProfiling();

console.log(networkProfiles[0]);
// {
//   url: '/api/users',
//   method: 'GET',
//   status: 200,
//   duration: 150,
//   size: 1024,
//   type: 'fetch',
//   timestamp: 1234567890,
//   initiator: 'at fetchUsers (...)',
//   cached: false,
// }
```

### Flame Graphs

```typescript
import { generateFlameGraph } from '@philjs/devtools';
import type { FlameNode } from '@philjs/devtools';

const profiles = stopProfiling();
const flameGraph = generateFlameGraph(profiles);

console.log(flameGraph);
// {
//   name: 'root',
//   value: 100,
//   children: [
//     {
//       name: 'App',
//       value: 50,
//       self: 5,
//       color: '#4ade80', // green (fast)
//       children: [
//         { name: 'Header', value: 10, ... },
//         { name: 'Content', value: 35, color: '#fbbf24', ... }, // yellow
//       ]
//     }
//   ]
// }
```

### Performance Analysis

```typescript
import {
  analyzeRenderPerformance,
  analyzeMemoryUsage,
  analyzeNetworkRequests,
} from '@philjs/devtools';

// Analyze renders
const renderAnalysis = analyzeRenderPerformance(renderProfiles);
console.log(renderAnalysis);
// {
//   totalRenderTime: 150,
//   averageRenderTime: 3.5,
//   slowestComponents: [{ name: 'DataGrid', time: 45 }],
//   memoEfficiency: 0.85,
//   recommendations: [
//     'DataGrid is taking 45ms. Consider lazy loading.',
//   ]
// }

// Analyze memory
const memoryAnalysis = analyzeMemoryUsage(memoryProfiles);
console.log(memoryAnalysis);
// {
//   peakHeapUsed: 75000000,
//   averageHeapUsed: 50000000,
//   memoryGrowth: 15,
//   leakSuspects: ['Signals appear to be leaking'],
//   recommendations: ['Check for signals created in loops'],
// }

// Analyze network
const networkAnalysis = analyzeNetworkRequests(networkProfiles);
console.log(networkAnalysis);
// {
//   totalRequests: 25,
//   totalSize: 500000,
//   averageDuration: 200,
//   slowestRequests: [...],
//   failedRequests: [...],
//   recommendations: ['Low cache hit rate. Review caching strategy.'],
// }
```

### Export/Import Profiles

```typescript
import { exportProfileData, importProfileData } from '@philjs/devtools';

// Export profiles
const exported = exportProfileData({
  renders: renderProfiles,
  memory: memoryProfiles,
  network: networkProfiles,
});

// Save to file or localStorage
localStorage.setItem('profile-data', exported);

// Import profiles
const imported = importProfileData(localStorage.getItem('profile-data'));
console.log(imported.renders, imported.memory, imported.network);
```

---

## Developer Overlay

### Show Overlay

```typescript
import { showOverlay } from '@philjs/devtools';

// Show the floating dev panel
showOverlay();
```

The overlay displays:
- Island count and hydration status
- Bundle size
- AI calls and cost (if using @philjs/ai)
- Current route and parameters
- Route errors

---

## Types Reference

```typescript
// State snapshot
interface StateSnapshot<T = any> {
  id: string;
  timestamp: number;
  state: T;
  action?: string;
  metadata?: Record<string, any>;
  parentId?: string;
}

// Timeline node for branching
interface TimelineNode<T = any> {
  snapshot: StateSnapshot<T>;
  children: TimelineNode<T>[];
  parent?: TimelineNode<T>;
}

// Time travel config
interface TimeTravelConfig {
  maxSnapshots?: number;
  captureInterval?: number;
  enableBranching?: boolean;
  captureActions?: boolean;
}

// State diff
interface StateDiff {
  path: string[];
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  oldValue?: any;
  newValue?: any;
}

// Redux action
interface ReduxAction {
  type: string;
  payload?: any;
  meta?: any;
}

// Redux DevTools config
interface ReduxDevToolsConfig {
  name?: string;
  maxAge?: number;
  actionSanitizer?: (action: ReduxAction, id: number) => ReduxAction;
  stateSanitizer?: (state: any, index: number) => any;
  actionsBlacklist?: string[];
  actionsWhitelist?: string[];
  trace?: boolean;
  traceLimit?: number;
}

// Render profile
interface RenderProfile {
  componentName: string;
  renderTime: number;
  commitTime: number;
  effectTime: number;
  memoHits: number;
  memoMisses: number;
  rerenderCount: number;
  props: Record<string, unknown>;
  children: RenderProfile[];
}

// Memory profile
interface MemoryProfile {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  signals: number;
  effects: number;
  components: number;
}

// Network profile
interface NetworkProfile {
  url: string;
  method: string;
  status: number;
  duration: number;
  size: number;
  type: 'fetch' | 'xhr' | 'websocket';
  timestamp: number;
  initiator: string;
  cached: boolean;
}

// Flame graph node
interface FlameNode {
  name: string;
  value: number;
  children: FlameNode[];
  self: number;
  color?: string;
}

// Profiler config
interface ProfilerConfig {
  sampleRate?: number;
  maxSamples?: number;
  includeProps?: boolean;
  trackMemory?: boolean;
  trackNetwork?: boolean;
}
```

---

## Best Practices

### 1. Development Only

```typescript
if (import.meta.env.DEV) {
  initTimeTravel();
  initReduxDevTools(initialState, { name: 'MyApp' });
  showOverlay();
}
```

### 2. Named Actions

```typescript
// Good - descriptive action names
devTools.send({ type: 'user/login', payload: user }, state);
devTools.send({ type: 'cart/addItem', payload: item }, state);

// Avoid - generic names
// devTools.send({ type: 'UPDATE' }, state);
```

### 3. State Sanitization

```typescript
const devTools = initReduxDevTools(state, {
  stateSanitizer: (state) => ({
    ...state,
    // Remove sensitive data
    user: state.user ? { ...state.user, password: '[REDACTED]' } : null,
  }),
});
```

### 4. Profile Sparingly

```typescript
// Profile specific interactions
function handleHeavyOperation() {
  startProfiling();

  // ... operation ...

  const profiles = stopProfiling();
  const analysis = analyzeRenderPerformance(profiles);
  console.log(analysis.recommendations);
}
```

---

## API Reference

### Time Travel

| Export | Description |
|--------|-------------|
| `TimeTravelDebugger` | Time travel class |
| `initTimeTravel` | Initialize global instance |
| `getTimeTravelDebugger` | Get global instance |
| `debugSignal` | Wrap signal for tracking |
| `diffState` | Compare two states |

### Redux DevTools

| Export | Description |
|--------|-------------|
| `ReduxDevTools` | Redux DevTools class |
| `initReduxDevTools` | Initialize integration |
| `getReduxDevTools` | Get global instance |
| `disconnectReduxDevTools` | Disconnect and cleanup |
| `ActionReplayer` | Record and replay actions |
| `StatePersistence` | Persist state to storage |

### Component Inspector

| Export | Description |
|--------|-------------|
| `ComponentInspector` | Inspector class |
| `createInspector` | Create inspector instance |
| `getInspector` | Get global instance |
| `PropsPanel` | Props display panel |
| `StatePanel` | State display panel |
| `StylePanel` | Styles display panel |
| `PerformancePanel` | Performance display panel |
| `ElementHighlighter` | DOM element highlighter |
| `SearchBar` | Component search |

### Profiler

| Export | Description |
|--------|-------------|
| `startProfiling` | Start render profiling |
| `stopProfiling` | Stop and get profiles |
| `recordRenderStart` | Record component render start |
| `recordRenderEnd` | Record component render end |
| `recordMemo` | Record memo hit/miss |
| `startMemoryProfiling` | Start memory sampling |
| `stopMemoryProfiling` | Stop and get samples |
| `captureMemorySnapshot` | Capture single snapshot |
| `startNetworkProfiling` | Start network interception |
| `stopNetworkProfiling` | Stop and get profiles |
| `generateFlameGraph` | Create flame graph data |
| `analyzeRenderPerformance` | Analyze render profiles |
| `analyzeMemoryUsage` | Analyze memory profiles |
| `analyzeNetworkRequests` | Analyze network profiles |
| `exportProfileData` | Export as JSON |
| `importProfileData` | Import from JSON |

### Overlay

| Export | Description |
|--------|-------------|
| `showOverlay` | Show developer overlay |

---

## Next Steps

- [@philjs/storybook for Component Development](../storybook/overview.md)
- [@philjs/testing for Unit Tests](../testing/overview.md)
- [@philjs/zustand with DevTools](../zustand/overview.md)
