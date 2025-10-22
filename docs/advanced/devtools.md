# PhilJS DevTools

PhilJS provides powerful developer tools including time-travel debugging, state inspection, and performance visualization. The DevTools system helps you debug complex state interactions and replay user sessions.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Time-Travel Debugging](#time-travel-debugging)
- [API Reference](#api-reference)
- [Complete Examples](#complete-examples)
- [DevTools Overlay](#devtools-overlay)
- [State Inspection](#state-inspection)
- [Session Export/Import](#session-exportimport)
- [Best Practices](#best-practices)
- [Advanced Usage](#advanced-usage)

## Overview

PhilJS DevTools includes:

- **Time-Travel Debugging**: Step backward/forward through state changes
- **Timeline Branching**: Explore "what if" scenarios without losing history
- **State Diffing**: See exactly what changed between snapshots
- **Session Export**: Save debug sessions for bug reports
- **Signal Debugging**: Track individual signal changes
- **Visual Overlay**: Real-time metrics display
- **Performance Tracking**: Identify slow state updates

### Why Time-Travel Debugging?

Traditional debugging is destructive - once you step forward, you can't go back. Time-travel debugging lets you:

- **Replay bugs** - See exactly what happened
- **Explore alternatives** - Branch timeline to test fixes
- **Share bugs** - Export sessions for teammates
- **Understand complex state** - Visualize state evolution

## Installation

DevTools are included in `philjs-devtools`:

```bash
npm install philjs-devtools
# or
pnpm add philjs-devtools
# or
yarn add philjs-devtools
```

## Time-Travel Debugging

### Quick Start

```typescript
import { initTimeTravel } from 'philjs-devtools';
import { signal } from 'philjs-core';

// Initialize time-travel debugger
const timeTravelDebugger = initTimeTravel({
  maxSnapshots: 100,
  captureInterval: 0,
  enableBranching: true
});

// Create a signal
const count = signal(0);

// Capture state snapshots
function increment() {
  count.set(count() + 1);
  timeTravelDebugger.capture(
    { count: count() },
    'increment'
  );
}

// Time travel!
timeTravelDebugger.undo(); // Go back
timeTravelDebugger.redo(); // Go forward
```

### Basic Time Travel

```typescript
import { TimeTravelDebugger } from 'philjs-devtools';

const debugger = new TimeTravelDebugger({
  maxSnapshots: 100,         // Keep last 100 snapshots
  captureInterval: 100,      // Min 100ms between snapshots
  enableBranching: true,     // Allow timeline branches
  captureActions: true       // Track action names
});

// Capture state
debugger.capture(
  { user: { name: 'Alice', age: 30 } },
  'updateUser'
);

// Navigate time
const previous = debugger.undo();
const next = debugger.redo();

// Jump to specific snapshot
debugger.jumpTo(snapshotId);

// Get current state
const current = debugger.getCurrent();
```

## API Reference

### `TimeTravelDebugger` Class

The main time-travel debugging manager.

#### Constructor

```typescript
new TimeTravelDebugger<T>(config?: TimeTravelConfig)
```

**TimeTravelConfig:**
```typescript
type TimeTravelConfig = {
  maxSnapshots?: number;      // Max history size (default: 100)
  captureInterval?: number;   // Min ms between snapshots (default: 0)
  enableBranching?: boolean;  // Allow timeline branching (default: true)
  captureActions?: boolean;   // Track action names (default: true)
};
```

#### Methods

##### `capture(state: T, action?: string, metadata?: object): void`

Capture a state snapshot.

**Parameters:**
- `state: T`: The state to capture
- `action?: string`: Optional action name (e.g., 'increment')
- `metadata?: object`: Optional metadata (e.g., user info, timestamp)

**Example:**
```typescript
debugger.capture(
  { todos: ['Buy milk', 'Learn PhilJS'] },
  'addTodo',
  { userId: '123', timestamp: Date.now() }
);
```

##### `undo(): StateSnapshot<T> | null`

Go back one step in history.

**Returns:** Previous snapshot or null if at beginning

**Example:**
```typescript
const previous = debugger.undo();
if (previous) {
  console.log('Went back to:', previous.state);
  console.log('Action was:', previous.action);
}
```

##### `redo(): StateSnapshot<T> | null`

Go forward one step in history.

**Returns:** Next snapshot or null if at end

**Example:**
```typescript
const next = debugger.redo();
if (next) {
  console.log('Went forward to:', next.state);
}
```

##### `jumpTo(snapshotId: string): StateSnapshot<T> | null`

Jump to a specific snapshot.

**Parameters:**
- `snapshotId: string`: ID of snapshot to jump to

**Returns:** Snapshot or null if not found

**Example:**
```typescript
const snapshot = debugger.jumpTo('snapshot-1234-abc');
```

##### `getCurrent(): StateSnapshot<T> | null`

Get current snapshot.

**Example:**
```typescript
const current = debugger.getCurrent();
console.log('Current state:', current?.state);
```

##### `getHistory(): StateSnapshot<T>[]`

Get all snapshots.

**Example:**
```typescript
const history = debugger.getHistory();
console.log(`${history.length} snapshots in history`);
```

##### `getTimeline(): TimelineNode<T> | null`

Get timeline tree (for visualizing branches).

**Example:**
```typescript
const timeline = debugger.getTimeline();
// Render as tree visualization
```

##### `getDiff(fromId: string, toId: string): StateDiff[]`

Get diff between two snapshots.

**Returns:** Array of `StateDiff` objects

**Example:**
```typescript
const diff = debugger.getDiff(
  'snapshot-1',
  'snapshot-2'
);

diff.forEach(change => {
  console.log(`${change.path.join('.')}: ${change.type}`);
  console.log(`  Old: ${change.oldValue}`);
  console.log(`  New: ${change.newValue}`);
});
```

##### `stopTimeTraveling(): void`

Return to present (stop time-traveling).

**Example:**
```typescript
debugger.stopTimeTraveling();
```

##### `clear(): void`

Clear all history.

**Example:**
```typescript
debugger.clear();
```

##### `exportSession(): string`

Export session as JSON for bug reports.

**Example:**
```typescript
const sessionData = debugger.exportSession();
await navigator.clipboard.writeText(sessionData);
console.log('Session copied to clipboard!');
```

##### `importSession(json: string): void`

Import session from JSON.

**Example:**
```typescript
const sessionData = await navigator.clipboard.readText();
debugger.importSession(sessionData);
console.log('Session imported!');
```

##### `getStats(): object`

Get debugger statistics.

**Example:**
```typescript
const stats = debugger.getStats();
console.log(`Total snapshots: ${stats.totalSnapshots}`);
console.log(`Current index: ${stats.currentIndex}`);
console.log(`Branches: ${stats.branches}`);
```

### Signals Integration

##### `debugSignal<T>(signal: Signal<T>, name: string): Signal<T>`

Debug a specific signal with automatic history tracking.

**Example:**
```typescript
import { signal } from 'philjs-core';
import { debugSignal } from 'philjs-devtools';

let count = signal(0);
count = debugSignal(count, 'count');

// Now count changes are automatically captured
count.set(1); // Captured as "set count"
count.set(2); // Captured as "set count"
```

### State Diffing

##### `diffState(oldState: any, newState: any, path?: string[]): StateDiff[]`

Calculate difference between two states.

**Returns:** Array of changes

**StateDiff Type:**
```typescript
type StateDiff = {
  path: string[];                                    // Path to changed value
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  oldValue?: any;
  newValue?: any;
};
```

**Example:**
```typescript
import { diffState } from 'philjs-devtools';

const oldState = {
  user: { name: 'Alice', age: 30 },
  todos: ['Buy milk']
};

const newState = {
  user: { name: 'Alice', age: 31 },  // Modified
  todos: ['Buy milk', 'Learn PhilJS'], // Added item
  theme: 'dark'                       // Added field
};

const diff = diffState(oldState, newState);
// [
//   { path: ['user', 'age'], type: 'modified', oldValue: 30, newValue: 31 },
//   { path: ['todos', '1'], type: 'added', newValue: 'Learn PhilJS' },
//   { path: ['theme'], type: 'added', newValue: 'dark' }
// ]
```

### Helper Functions

##### `initTimeTravel<T>(config?: TimeTravelConfig): TimeTravelDebugger<T>`

Initialize global time-travel debugger.

**Example:**
```typescript
const ttd = initTimeTravel({
  maxSnapshots: 200
});
```

##### `getTimeTravelDebugger<T>(): TimeTravelDebugger<T> | null`

Get global debugger instance.

**Example:**
```typescript
const ttd = getTimeTravelDebugger();
if (ttd) {
  ttd.undo();
}
```

## Complete Examples

### Example 1: Todo App with Time Travel

```typescript
import { signal } from 'philjs-core';
import { initTimeTravel, debugSignal } from 'philjs-devtools';

// Initialize debugger
const ttd = initTimeTravel();

// Create debuggable signals
let todos = signal<string[]>([]);
todos = debugSignal(todos, 'todos');

function TodoApp() {
  const input = signal('');

  const addTodo = () => {
    const newTodos = [...todos(), input()];
    todos.set(newTodos);
    ttd.capture({ todos: newTodos }, 'addTodo');
    input.set('');
  };

  const removeTodo = (index: number) => {
    const newTodos = todos().filter((_, i) => i !== index);
    todos.set(newTodos);
    ttd.capture({ todos: newTodos }, 'removeTodo');
  };

  return (
    <div>
      <h1>Todos</h1>

      <div>
        <input
          value={input()}
          onInput={(e) => input.set(e.target.value)}
          placeholder="Add todo..."
        />
        <button onClick={addTodo}>Add</button>
      </div>

      <ul>
        {todos().map((todo, i) => (
          <li>
            {todo}
            <button onClick={() => removeTodo(i)}>✕</button>
          </li>
        ))}
      </ul>

      {/* Time-travel controls */}
      <div class="time-travel-controls">
        <button
          onClick={() => {
            const prev = ttd.undo();
            if (prev) todos.set(prev.state.todos);
          }}
          disabled={!ttd.canUndo()}
        >
          ← Undo
        </button>
        <button
          onClick={() => {
            const next = ttd.redo();
            if (next) todos.set(next.state.todos);
          }}
          disabled={!ttd.canRedo()}
        >
          Redo →
        </button>
        <button onClick={() => ttd.clear()}>
          Clear History
        </button>
      </div>
    </div>
  );
}
```

### Example 2: Visual Timeline

```typescript
import { signal, effect } from 'philjs-core';
import { initTimeTravel } from 'philjs-devtools';

function Timeline() {
  const ttd = initTimeTravel();
  const history = signal<any[]>([]);
  const currentIndex = signal(0);

  effect(() => {
    const interval = setInterval(() => {
      history.set(ttd.getHistory());
      const current = ttd.getCurrent();
      const allHistory = ttd.getHistory();
      currentIndex.set(
        allHistory.findIndex(s => s.id === current?.id)
      );
    }, 100);

    return () => clearInterval(interval);
  });

  const jumpTo = (index: number) => {
    const snapshot = history()[index];
    ttd.jumpTo(snapshot.id);
  };

  return (
    <div class="timeline">
      <h3>Timeline</h3>
      <div class="timeline-track">
        {history().map((snapshot, i) => (
          <div
            class={`timeline-item ${i === currentIndex() ? 'current' : ''}`}
            onClick={() => jumpTo(i)}
            title={snapshot.action || 'Snapshot'}
          >
            <div class="timeline-dot" />
            <div class="timeline-label">
              {snapshot.action || `#${i}`}
            </div>
            <div class="timeline-timestamp">
              {new Date(snapshot.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 3: State Diff Viewer

```typescript
import { signal } from 'philjs-core';
import { diffState } from 'philjs-devtools';

function DiffViewer({ oldState, newState }: any) {
  const diff = diffState(oldState, newState);

  const getColor = (type: string) => {
    switch (type) {
      case 'added': return 'green';
      case 'removed': return 'red';
      case 'modified': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <div class="diff-viewer">
      <h3>State Changes</h3>
      {diff.length === 0 ? (
        <p>No changes</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Path</th>
              <th>Type</th>
              <th>Old Value</th>
              <th>New Value</th>
            </tr>
          </thead>
          <tbody>
            {diff.map(change => (
              <tr style={{ color: getColor(change.type) }}>
                <td>{change.path.join('.')}</td>
                <td>{change.type}</td>
                <td>
                  {change.oldValue !== undefined
                    ? JSON.stringify(change.oldValue)
                    : '-'}
                </td>
                <td>
                  {change.newValue !== undefined
                    ? JSON.stringify(change.newValue)
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

### Example 4: Session Export/Import

```typescript
import { initTimeTravel } from 'philjs-devtools';

function DebugControls() {
  const ttd = initTimeTravel();

  const exportSession = async () => {
    const sessionData = ttd.exportSession();

    // Download as file
    const blob = new Blob([sessionData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `philjs-session-${Date.now()}.json`;
    a.click();

    console.log('Session exported!');
  };

  const importSession = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      const text = await file.text();

      ttd.importSession(text);
      console.log('Session imported!');

      // Optionally restore state
      const current = ttd.getCurrent();
      if (current) {
        restoreState(current.state);
      }
    };

    input.click();
  };

  const copyToClipboard = async () => {
    const sessionData = ttd.exportSession();
    await navigator.clipboard.writeText(sessionData);
    alert('Session copied to clipboard!');
  };

  return (
    <div class="debug-controls">
      <button onClick={exportSession}>
        📥 Export Session
      </button>
      <button onClick={importSession}>
        📤 Import Session
      </button>
      <button onClick={copyToClipboard}>
        📋 Copy to Clipboard
      </button>
    </div>
  );
}
```

### Example 5: Timeline Branching

```typescript
import { initTimeTravel } from 'philjs-devtools';
import { signal } from 'philjs-core';

function BranchingDemo() {
  const ttd = initTimeTravel({ enableBranching: true });
  const value = signal(0);

  const increment = () => {
    value.set(value() + 1);
    ttd.capture({ value: value() }, 'increment');
  };

  const decrement = () => {
    value.set(value() - 1);
    ttd.capture({ value: value() }, 'decrement');
  };

  const createBranch = () => {
    // Go back in time
    const prev = ttd.undo();
    if (prev) {
      value.set(prev.state.value);

      // Make a different change (creates branch)
      value.set(value() * 2);
      ttd.capture({ value: value() }, 'double');

      console.log('Created new timeline branch!');
    }
  };

  return (
    <div>
      <h2>Value: {value()}</h2>

      <button onClick={increment}>+1</button>
      <button onClick={decrement}>-1</button>
      <button onClick={createBranch}>
        🌿 Create Branch
      </button>

      <TimelineVisualization ttd={ttd} />
    </div>
  );
}

function TimelineVisualization({ ttd }: any) {
  const timeline = ttd.getTimeline();

  function renderNode(node: any, depth = 0) {
    return (
      <div style={{ marginLeft: `${depth * 20}px` }}>
        <div class="timeline-node">
          {node.snapshot.action || 'Root'}
          {node.children.length > 1 && ' 🌿'}
        </div>
        {node.children.map((child: any) => renderNode(child, depth + 1))}
      </div>
    );
  }

  return timeline ? renderNode(timeline) : <div>No timeline</div>;
}
```

## DevTools Overlay

### Visual Metrics Display

```typescript
import { showOverlay } from 'philjs-devtools';

// Show DevTools overlay
showOverlay();

// Updates automatically with:
// - Island count & hydration status
// - Bundle size
// - AI calls and costs
// - Current route path, params, and loader error (from createAppRouter)
```

### Custom Overlay

```typescript
function CustomDevTools() {
  const ttd = getTimeTravelDebugger();
  const stats = signal({
    snapshots: 0,
    currentIndex: 0,
    branches: 0
  });

  effect(() => {
    const interval = setInterval(() => {
      if (ttd) {
        stats.set(ttd.getStats());
      }
    }, 1000);

    return () => clearInterval(interval);
  });

  return (
    <div class="custom-devtools">
      <h3>PhilJS DevTools</h3>
      <div>Snapshots: {stats().snapshots}</div>
      <div>Current: {stats().currentIndex}</div>
      <div>Branches: {stats().branches}</div>
    </div>
  );
}
```

## State Inspection

### Inspect Signal Values

```typescript
import { signal, effect } from 'philjs-core';
import { debugSignal } from 'philjs-devtools';

// Create and debug signal
let count = signal(0);
count = debugSignal(count, 'count');

// Inspect changes
effect(() => {
  console.log('Count changed to:', count());

  const ttd = getTimeTravelDebugger();
  const current = ttd?.getCurrent();
  if (current) {
    console.log('Full state:', current.state);
    console.log('Action:', current.action);
  }
});
```

### Deep State Inspection

```typescript
function StateInspector() {
  const ttd = getTimeTravelDebugger();
  const currentState = signal<any>(null);

  effect(() => {
    const interval = setInterval(() => {
      const current = ttd?.getCurrent();
      currentState.set(current?.state);
    }, 100);

    return () => clearInterval(interval);
  });

  function renderValue(value: any, path: string = ''): any {
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return (
          <details open>
            <summary>Array[{value.length}] {path}</summary>
            {value.map((item, i) => renderValue(item, `${path}[${i}]`))}
          </details>
        );
      } else {
        return (
          <details open>
            <summary>Object {path}</summary>
            {Object.entries(value).map(([key, val]) =>
              renderValue(val, path ? `${path}.${key}` : key)
            )}
          </details>
        );
      }
    }

    return (
      <div>
        <strong>{path}:</strong> {JSON.stringify(value)}
      </div>
    );
  }

  return (
    <div class="state-inspector">
      <h3>State Inspector</h3>
      {currentState() ? renderValue(currentState()) : <p>No state</p>}
    </div>
  );
}
```

## Session Export/Import

### Bug Report Generation

```typescript
async function generateBugReport() {
  const ttd = getTimeTravelDebugger();
  if (!ttd) return;

  const report = {
    session: ttd.exportSession(),
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    description: 'Bug description here'
  };

  // Download bug report
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bug-report-${Date.now()}.json`;
  a.click();
}
```

### Replay Bug Reports

```typescript
async function replayBugReport(reportFile: File) {
  const text = await reportFile.text();
  const report = JSON.parse(text);

  const ttd = initTimeTravel();
  ttd.importSession(report.session);

  console.log('Bug report loaded:');
  console.log('  User Agent:', report.userAgent);
  console.log('  Timestamp:', report.timestamp);
  console.log('  URL:', report.url);

  // Replay actions
  const history = ttd.getHistory();
  for (const snapshot of history) {
    console.log(`Action: ${snapshot.action}`, snapshot.state);
    await new Promise(resolve => setTimeout(resolve, 500));
    ttd.redo();
  }
}
```

## Best Practices

### 1. Capture Meaningful Actions

```typescript
// ❌ Bad - no action name
ttd.capture(state);

// ✅ Good - descriptive action
ttd.capture(state, 'addTodoItem');

// ✅ Better - with metadata
ttd.capture(state, 'addTodoItem', {
  userId: currentUser.id,
  itemText: newTodo
});
```

### 2. Limit Snapshot Size

```typescript
// ❌ Bad - capturing entire app state
ttd.capture({
  todos: allTodos,
  users: allUsers,
  products: allProducts,
  // ... massive state
});

// ✅ Good - capture only relevant state
ttd.capture({
  todos: allTodos
}, 'addTodo');
```

### 3. Use Capture Interval in Production

```typescript
// Production: limit snapshots
const ttd = initTimeTravel({
  maxSnapshots: 50,
  captureInterval: 1000  // Max 1 snapshot per second
});
```

### 4. Conditional Debugging

```typescript
// Only enable in development or with flag
if (import.meta.env.DEV || window.location.search.includes('debug=true')) {
  const ttd = initTimeTravel();
  (window as any).__TTD__ = ttd; // Expose for console access
}
```

### 5. Clean Up on Unmount

```typescript
effect(() => {
  const ttd = initTimeTravel();

  return () => {
    ttd.clear(); // Clean up history
  };
});
```

## Advanced Usage

### Custom Serialization

```typescript
class CustomTimeTravelDebugger extends TimeTravelDebugger {
  protected cloneState(state: any): any {
    // Custom serialization for complex objects
    return structuredClone(state);
  }
}
```

### Integration with Redux DevTools

```typescript
import { initTimeTravel } from 'philjs-devtools';

const ttd = initTimeTravel();

// Forward to Redux DevTools
window.__REDUX_DEVTOOLS_EXTENSION__?.connect();

ttd['capture'] = new Proxy(ttd.capture, {
  apply(target, thisArg, args) {
    const result = target.apply(thisArg, args);

    // Send to Redux DevTools
    window.__REDUX_DEVTOOLS_EXTENSION__?.send(
      args[1] || 'Action',
      args[0]
    );

    return result;
  }
});
```

### Performance Monitoring

```typescript
const ttd = initTimeTravel();
let totalCaptureTime = 0;
let captureCount = 0;

ttd['capture'] = new Proxy(ttd.capture, {
  apply(target, thisArg, args) {
    const start = performance.now();
    const result = target.apply(thisArg, args);
    const duration = performance.now() - start;

    totalCaptureTime += duration;
    captureCount++;

    if (captureCount % 100 === 0) {
      console.log(
        `Avg capture time: ${(totalCaptureTime / captureCount).toFixed(2)}ms`
      );
    }

    return result;
  }
});
```

## Related Documentation

- [Signals](/docs/learn/signals.md) - Reactive state management
- [Error Boundaries](/docs/learn/error-boundaries.md) - Error handling
- [Performance](/docs/performance/runtime.md) - Performance optimization
- [Testing](/docs/testing/unit-testing.md) - Test with time-travel

## Troubleshooting

### Issue: Large Memory Usage

**Solution:** Reduce max snapshots or increase capture interval:
```typescript
initTimeTravel({
  maxSnapshots: 25,          // Reduce from 100
  captureInterval: 500       // Min 500ms between captures
});
```

### Issue: Snapshot Size Too Large

**Solution:** Capture only changed data:
```typescript
let lastState = {};

function captureSmartly(state: any, action: string) {
  const diff = diffState(lastState, state);
  ttd.capture(diff, action);
  lastState = state;
}
```

### Issue: Can't Export Session

**Solution:** Check for non-serializable data:
```typescript
// Remove functions, DOM nodes, etc.
function sanitizeState(state: any): any {
  return JSON.parse(JSON.stringify(state));
}
```

---

**Next Steps:**
- Explore [Cost Tracking](/docs/advanced/cost-tracking.md)
- Learn about [Usage Analytics](/docs/advanced/usage-analytics.md)
- Set up [Performance Budgets](/docs/performance/performance-budgets.md)
