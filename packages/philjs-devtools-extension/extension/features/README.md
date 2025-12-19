# PhilJS DevTools Advanced Features

This directory contains advanced debugging and profiling features for the PhilJS DevTools browser extension.

## Features Overview

### 1. Dependency Graph (`dependency-graph.js`)

Interactive visualization showing signal dependencies and relationships.

**Features:**
- D3.js-based force-directed graph layout
- Visual representation of signal dependencies
- Zoom and pan support
- Click nodes to select signals
- Filter to show only related signals
- Subscriber count badges

**Usage:**
```javascript
import { DependencyGraph } from './features/dependency-graph.js';

const container = document.getElementById('graph-container');
const graph = new DependencyGraph(container);

// Update with signal data
graph.updateGraph(signals, selectedSignalId);

// Listen for node clicks
container.addEventListener('nodeClick', (e) => {
  console.log('Clicked signal:', e.detail);
});
```

### 2. Performance Flamegraph (`flamegraph.js`)

Flame chart visualization showing where time is spent in signal updates and component renders.

**Features:**
- Hierarchical visualization of performance traces
- Color-coded frames by function name
- Hover to see timing details
- Click frames to inspect
- Automatically calculates total duration

**Usage:**
```javascript
import { Flamegraph } from './features/flamegraph.js';

const container = document.getElementById('flamegraph-container');
const flamegraph = new Flamegraph(container);

// Update with performance data
flamegraph.updateData(performanceData);

// Listen for frame clicks
container.addEventListener('frameClick', (e) => {
  console.log('Clicked frame:', e.detail);
});
```

### 3. Memory Profiler (`memory-profiler.js`)

Track signal memory usage and detect potential memory leaks.

**Features:**
- Real-time memory usage tracking
- Estimated signal memory consumption
- Memory usage charts over time
- Leak detection heuristics
- Heap snapshots
- Force GC button (UI only)

**Leak Detection:**
- High update count with retained history
- Growing memory without cleanup
- Stale signals with many subscribers

**Usage:**
```javascript
import { MemoryProfiler } from './features/memory-profiler.js';

const container = document.getElementById('memory-container');
const profiler = new MemoryProfiler(container);

// Update with memory and signal data
profiler.updateMemory(memoryInfo, signals);

// Listen for snapshot events
container.addEventListener('snapshotTaken', (e) => {
  console.log('Snapshot:', e.detail);
});
```

### 4. Network Timeline (`network-timeline.js`)

Correlate network requests with signal state changes to understand data flow.

**Features:**
- Timeline view of network requests and signal updates
- Automatic correlation detection
- Visual connection between related events
- Export to HAR format
- Detailed request/response information

**Usage:**
```javascript
import { NetworkTimeline } from './features/network-timeline.js';

const container = document.getElementById('timeline-container');
const timeline = new NetworkTimeline(container);

// Add network request
timeline.addRequest({
  url: 'https://api.example.com/data',
  method: 'GET',
  status: 200,
  statusText: 'OK',
  duration: 150
});

// Add signal update
timeline.addSignalUpdate(signal);

// Listen for item selection
container.addEventListener('itemSelected', (e) => {
  console.log('Selected:', e.detail);
});
```

### 5. State Export/Import (`state-export.js`)

Save and restore application state for debugging and testing.

**Features:**
- Export current state to JSON
- Import state from JSON file
- Save states locally in browser
- Configure what to include (signals, components, performance)
- Pretty print option
- State preview

**Export Format:**
```json
{
  "version": "1.0.0",
  "timestamp": 1234567890000,
  "date": "2024-01-01T00:00:00.000Z",
  "userAgent": "...",
  "url": "https://example.com",
  "state": {
    "signals": [...],
    "components": [...],
    "componentTree": {...},
    "performance": {...},
    "history": [...]
  }
}
```

**Usage:**
```javascript
import { StateExporter } from './features/state-export.js';

const container = document.getElementById('exporter-container');
const exporter = new StateExporter(container);

// Listen for state requests
container.addEventListener('requestState', () => {
  const state = getCurrentState();
  const event = new CustomEvent('stateResponse', {
    detail: { type: 'stateResponse', state }
  });
  container.dispatchEvent(event);
});

// Listen for state restore
container.addEventListener('restoreState', (e) => {
  restoreApplicationState(e.detail.state);
});
```

### 6. Signal Diff (`signal-diff.js`)

Show what changed between signal updates with unified or split diff view.

**Features:**
- Track signal value history (last 50 versions)
- Compare any two versions
- Unified or split diff view
- Syntax highlighting for changes
- Added/removed/modified statistics
- Version timeline

**Usage:**
```javascript
import { SignalDiff } from './features/signal-diff.js';

const container = document.getElementById('diff-container');
const diff = new SignalDiff(container);

// Track signal updates
diff.trackSignalUpdate(signal);

// Updates automatically when signal changes
```

### 7. Breakpoints (`breakpoints.js`)

Set breakpoints on signal value changes with conditional expressions.

**Features:**
- Multiple breakpoint types:
  - Any change
  - Equals value
  - Not equals
  - Greater than / Less than
  - Contains text
  - Matches regex
  - Custom JavaScript expression
- Log-only mode (don't pause execution)
- Breakpoint hit history
- Stack traces
- Enable/disable individual breakpoints

**Condition Types:**
```javascript
// Any change
signal => oldValue !== newValue

// Equals
signal.value === 42

// Custom expression
signal => signal.updateCount > 10 && signal.value.includes('error')
```

**Usage:**
```javascript
import { Breakpoints } from './features/breakpoints.js';

const container = document.getElementById('breakpoints-container');
const breakpoints = new Breakpoints(container);

// Check breakpoints on signal update
const triggered = breakpoints.checkBreakpoint(signal, oldValue, newValue);

// Listen for events
container.addEventListener('paused', (e) => {
  console.log('Paused on breakpoint:', e.detail);
});

container.addEventListener('resumed', () => {
  console.log('Execution resumed');
});
```

### 8. Search & Filter (`search-filter.js`)

Advanced filtering of signals by multiple criteria.

**Filter Options:**
- Text search (name, id, value)
- Type (string, number, boolean, object, array)
- Relationships (has subscribers, has dependencies)
- Computed signals
- Isolated signals
- Update count range
- Activity (recently updated, never updated)
- Value matching (equals, contains, regex, truthy/falsy)
- Custom JavaScript expression

**Saved Filters:**
- Save frequently used filter combinations
- Load saved filters with one click
- Manage saved filter library

**Usage:**
```javascript
import { SearchFilter } from './features/search-filter.js';

const container = document.getElementById('filter-container');
const filter = new SearchFilter(container);

// Listen for filter changes
container.addEventListener('filterChange', (e) => {
  const filtered = filter.applyFilters(signals);
  console.log(`Filtered: ${filtered.length} signals`);
});

// Apply filters manually
const filtered = filter.applyFilters(signals);
```

## Integration

To use these features in your DevTools panel:

1. Import the feature classes
2. Initialize them with a container element
3. Update them with data from the inspected page
4. Listen for events they emit

Example:

```javascript
import { DependencyGraph } from './features/dependency-graph.js';
import { Flamegraph } from './features/flamegraph.js';
import { MemoryProfiler } from './features/memory-profiler.js';
// ... import other features

// Initialize
const graph = new DependencyGraph(graphContainer);
const flamegraph = new Flamegraph(flamegraphContainer);
const profiler = new MemoryProfiler(memoryContainer);

// Update with data
function handleSignalUpdate(signal) {
  graph.updateGraph(signals);
  profiler.updateMemory(memoryInfo, signals);
}

function handlePerformanceUpdate(perfData) {
  flamegraph.updateData(perfData);
}
```

## File Structure

```
features/
├── dependency-graph.js    # Signal dependency visualization
├── flamegraph.js          # Performance flamegraph
├── memory-profiler.js     # Memory profiling and leak detection
├── network-timeline.js    # Network/signal correlation timeline
├── state-export.js        # State export/import
├── signal-diff.js         # Signal value diffing
├── breakpoints.js         # Conditional breakpoints
├── search-filter.js       # Advanced signal filtering
└── README.md             # This file
```

## Browser Compatibility

All features use standard web APIs and should work in:
- Chrome 90+
- Edge 90+
- Firefox 88+ (with some limitations)

## Performance Considerations

- Dependency graph: Limited to 100 nodes for performance
- Flamegraph: Displays last 1000 frames
- Memory profiler: Keeps last 100 snapshots
- Network timeline: Retains last 100 requests
- Signal diff: Tracks last 50 versions per signal
- Breakpoints: No limit, but many breakpoints may slow execution

## Development

Each feature is a standalone ES6 module with:
- Constructor accepting a container element
- Public methods for updating data
- Event dispatching for user interactions
- Cleanup via `destroy()` method

To add a new feature:

1. Create a new file in `features/`
2. Export a class with standard interface
3. Import and initialize in `panel-advanced.js`
4. Add a tab in `panel-advanced.html`

## License

MIT License - see LICENSE file for details
