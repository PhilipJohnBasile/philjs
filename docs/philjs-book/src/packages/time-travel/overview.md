# @philjs/time-travel

Visual time-travel debugging for PhilJS with state recording, playback, branching, and diff viewer.

## Installation

```bash
npm install @philjs/time-travel
```

## Features

- **State Recording** - Automatic or manual snapshots
- **Navigation** - Step through state changes
- **Branching** - Fork from any point in history
- **Playback** - Replay state changes with timing
- **Diffing** - Visual comparison between states
- **Labels & Tags** - Annotate snapshots
- **Network/Console Capture** - Track side effects
- **Export/Import** - Share debug sessions

## Quick Start

```typescript
import { initTimeTravel, useTimeTravel, useTimeTravelState } from '@philjs/time-travel';

// Initialize engine
initTimeTravel({
  autoRecord: true,
  persist: true,
  captureNetwork: true,
});

// Use in component
function Counter() {
  const [count, setCount] = useTimeTravelState('count', 0);
  const { stepBack, stepForward } = useTimeTravel();

  return (
    <div>
      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={stepBack}>Undo</button>
      <button onClick={stepForward}>Redo</button>
    </div>
  );
}
```

## TimeTravelEngine

### Configuration

```typescript
import { TimeTravelEngine, initTimeTravel } from '@philjs/time-travel';

const engine = new TimeTravelEngine({
  maxSnapshots: 1000,       // Max snapshots to keep
  autoRecord: true,         // Record state changes automatically
  persist: false,           // Persist to localStorage
  storageKey: 'debug',      // Storage key for persistence
  captureComponents: true,  // Capture component tree
  captureNetwork: true,     // Capture fetch requests
  captureConsole: true,     // Capture console logs
  compress: true,           // Compress exported sessions
});

// Or use the global initializer
const engine = initTimeTravel({ autoRecord: true });
```

### Registering State

```typescript
// Register state for tracking
const unregister = engine.registerState(
  'counter',           // Key
  () => counter.value, // Getter
  (v) => counter.value = v // Setter
);

// Later: unregister
unregister();
```

### Recording Snapshots

```typescript
// Manual recording
engine.record({
  type: 'INCREMENT',
  payload: { delta: 1 },
  source: 'Counter.tsx',
});

// Recording controls
engine.startRecording();
engine.stopRecording();

// Check recording state
const { isRecording } = engine.getState();
```

### Navigation

```typescript
// Step navigation
engine.stepBack();    // Go to previous snapshot
engine.stepForward(); // Go to next snapshot

// Jump to specific position
engine.goTo(5);                   // Go to index 5
engine.goToSnapshot('snap-123');  // Go to specific snapshot ID
engine.goToStart();               // Go to first snapshot
engine.goToEnd();                 // Go to last snapshot
```

### Playback

```typescript
// Play through history
await engine.play(
  2,  // Speed multiplier (2x)
  (snapshot) => {
    // Called for each snapshot
    updateUI(snapshot);
  }
);

// Pause playback
engine.pause();

// Resume playback
engine.resume();
```

### Branching

```typescript
// Create a branch from current position
const branchName = engine.createBranch('feature-test');

// Switch to a branch
engine.switchToBranch('feature-test');

// Get all branches
const branches = engine.getBranches();
```

### Labeling & Tagging

```typescript
// Label a snapshot
engine.labelSnapshot('snap-123', 'Before login');

// Tag a snapshot
engine.tagSnapshot('snap-123', 'important');
engine.tagSnapshot('snap-123', 'bug');

// Find by label/tag
const snapshot = engine.findByLabel('Before login');
const bugSnapshots = engine.findByTag('bug');
```

### Diffing

```typescript
import { diffStates } from '@philjs/time-travel';

// Get diff between two snapshots
const diffs = engine.getDiff(5, 10);

diffs.forEach(diff => {
  console.log({
    path: diff.path,        // 'user.name'
    type: diff.type,        // 'add' | 'remove' | 'change'
    oldValue: diff.oldValue,
    newValue: diff.newValue,
  });
});

// Diff from current to specific snapshot
const diffsFromCurrent = engine.getDiffFromCurrent('snap-123');

// Direct state diff
const stateDiffs = diffStates(
  { count: 1, user: { name: 'John' } },
  { count: 2, user: { name: 'Jane' } }
);
// [
//   { path: 'count', type: 'change', oldValue: 1, newValue: 2 },
//   { path: 'user.name', type: 'change', oldValue: 'John', newValue: 'Jane' }
// ]
```

### Export/Import

```typescript
// Export entire session
const sessionData = engine.exportSession();
localStorage.setItem('debug-session', sessionData);

// Import session
const loaded = localStorage.getItem('debug-session');
engine.importSession(loaded);

// Export single snapshot
const snapshotData = engine.exportSnapshot('snap-123');
```

### Subscription

```typescript
// Subscribe to state changes
const unsubscribe = engine.subscribe((state) => {
  console.log('Snapshots:', state.snapshots.length);
  console.log('Current index:', state.currentIndex);
  console.log('Recording:', state.isRecording);
  console.log('Branches:', state.branches.size);
});
```

### State Access

```typescript
// Get full state
const state = engine.getState();

// Get current snapshot
const current = engine.getCurrentSnapshot();

// Get snapshot count
const count = engine.getSnapshotCount();

// Clear all history
engine.clear();
```

## React-style Hooks

### useTimeTravel

```typescript
import { useTimeTravel } from '@philjs/time-travel';

function DebugControls() {
  const {
    record,              // Record snapshot
    stepBack,            // Go back one step
    stepForward,         // Go forward one step
    goTo,                // Go to specific index
    getCurrentSnapshot,  // Get current snapshot
    getSnapshotCount,    // Get total count
    isRecording,         // Recording state
    currentIndex,        // Current position
  } = useTimeTravel();

  return (
    <div class="debug-panel">
      <span>{currentIndex + 1} / {getSnapshotCount()}</span>
      <button onClick={stepBack} disabled={currentIndex === 0}>
        ← Back
      </button>
      <button onClick={stepForward} disabled={currentIndex === getSnapshotCount() - 1}>
        Forward →
      </button>
      <button onClick={() => record({ type: 'MANUAL_SNAPSHOT', source: 'user' })}>
        Take Snapshot
      </button>
    </div>
  );
}
```

### useTimeTravelState

```typescript
import { useTimeTravelState } from '@philjs/time-travel';

function Counter() {
  // State is automatically tracked for time travel
  const [count, setCount] = useTimeTravelState('count', 0);
  const [name, setName] = useTimeTravelState('name', '');

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
```

### useStateDiff

```typescript
import { useStateDiff } from '@philjs/time-travel';

function DiffViewer({ fromIndex, toIndex }) {
  const diffs = useStateDiff(fromIndex, toIndex);

  return (
    <div class="diff-viewer">
      {diffs.map((diff, i) => (
        <div key={i} class={`diff-${diff.type}`}>
          <span class="path">{diff.path}</span>
          {diff.type === 'change' && (
            <>
              <span class="old">{JSON.stringify(diff.oldValue)}</span>
              <span class="arrow">→</span>
              <span class="new">{JSON.stringify(diff.newValue)}</span>
            </>
          )}
          {diff.type === 'add' && (
            <span class="new">+ {JSON.stringify(diff.newValue)}</span>
          )}
          {diff.type === 'remove' && (
            <span class="old">- {JSON.stringify(diff.oldValue)}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Types Reference

```typescript
// Configuration
interface TimeTravelConfig {
  maxSnapshots?: number;
  autoRecord?: boolean;
  persist?: boolean;
  storageKey?: string;
  captureComponents?: boolean;
  captureNetwork?: boolean;
  captureConsole?: boolean;
  compress?: boolean;
}

// State snapshot
interface StateSnapshot {
  id: string;
  timestamp: number;
  state: Record<string, unknown>;
  action?: ActionInfo;
  componentTree?: ComponentSnapshot[];
  networkRequests?: NetworkRequest[];
  consoleLogs?: ConsoleLog[];
  metadata: SnapshotMetadata;
}

// Action info
interface ActionInfo {
  type: string;
  payload?: unknown;
  source: string;
  stackTrace?: string;
}

// State diff
interface StateDiff {
  path: string;
  oldValue: unknown;
  newValue: unknown;
  type: 'add' | 'remove' | 'change';
}

// Time travel state
interface TimeTravelState {
  snapshots: StateSnapshot[];
  currentIndex: number;
  branches: Map<string, StateSnapshot[]>;
  isRecording: boolean;
  isPaused: boolean;
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `TimeTravelEngine` | Core time travel functionality |

### Functions

| Function | Description |
|----------|-------------|
| `initTimeTravel(config?)` | Initialize global engine |
| `getTimeTravelEngine()` | Get global engine instance |
| `diffStates(a, b)` | Diff two state objects |

### Hooks

| Hook | Description |
|------|-------------|
| `useTimeTravel()` | Time travel controls |
| `useTimeTravelState(key, initial)` | Tracked state |
| `useStateDiff(from, to)` | State comparison |

## Example: Debug Panel

```typescript
import {
  initTimeTravel,
  useTimeTravel,
  useTimeTravelState,
  useStateDiff,
} from '@philjs/time-travel';

// Initialize
initTimeTravel({
  autoRecord: true,
  persist: true,
  captureNetwork: true,
  captureConsole: true,
});

// Debug panel component
function DebugPanel() {
  const {
    stepBack,
    stepForward,
    goTo,
    getCurrentSnapshot,
    getSnapshotCount,
    currentIndex,
    isRecording,
  } = useTimeTravel();

  const snapshot = getCurrentSnapshot();
  const count = getSnapshotCount();

  return (
    <div class="debug-panel">
      <div class="timeline">
        <input
          type="range"
          min={0}
          max={count - 1}
          value={currentIndex}
          onChange={(e) => goTo(Number(e.target.value))}
        />
        <span>{currentIndex + 1} / {count}</span>
      </div>

      <div class="controls">
        <button onClick={stepBack}>⏮ Back</button>
        <button onClick={stepForward}>Forward ⏭</button>
      </div>

      {snapshot && (
        <div class="snapshot-info">
          <div>Time: {new Date(snapshot.timestamp).toLocaleString()}</div>
          {snapshot.action && (
            <div>Action: {snapshot.action.type}</div>
          )}
          <pre>{JSON.stringify(snapshot.state, null, 2)}</pre>
        </div>
      )}

      <DiffViewer fromIndex={currentIndex - 1} toIndex={currentIndex} />
    </div>
  );
}
```
