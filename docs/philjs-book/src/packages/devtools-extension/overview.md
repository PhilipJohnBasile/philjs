# @philjs/devtools-extension

Browser extension for debugging and inspecting PhilJS applications. Provides signal inspection, component tree visualization, performance profiling, and network request monitoring.

## Installation

### Chrome

1. Download the extension from the Chrome Web Store (coming soon) or build from source
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the built extension directory

### Firefox

1. Download the extension from Firefox Add-ons (coming soon) or build from source
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the built extension

### Building from Source

```bash
# Clone the repository
git clone https://github.com/philjs/philjs.git
cd philjs

# Install dependencies
pnpm install

# Build the extension
cd packages/philjs-devtools-extension
pnpm build

# The built extension will be in the dist/ directory
pnpm zip  # Creates a zip file for distribution
```

## Features

### Signal Inspection

Monitor all signals in your PhilJS application in real-time:

- View current signal values
- Track update counts and subscriber counts
- See signal update history with timestamps
- Edit signal values directly from DevTools
- Trace signal creation source

### Component Tree Visualization

Explore your component hierarchy:

- Navigate through the complete component tree
- View component props and state
- See which signals each component uses
- Track render counts per component
- Identify components with warnings
- Search and filter components

### Performance Profiling

Analyze your application's performance:

- Real-time FPS monitoring
- Memory usage tracking
- Core Web Vitals (TTFB, FCP, LCP, FID, CLS, INP)
- Render timing per component
- Hydration metrics and mismatch detection
- Record and analyze render sessions

### Network Inspector

Monitor all network activity:

- Track fetch and XHR requests
- View request/response headers
- See request timing and sizes
- Filter by request type (fetch, xhr, loader, action)
- Identify failed requests

## Panels

### DevToolsPanel

The main panel interface that coordinates all DevTools functionality.

```typescript
import { DevToolsPanel } from '@philjs/devtools-extension';

// Create the panel in a container element
const container = document.getElementById('devtools-container');
const panel = new DevToolsPanel(container);
```

The DevToolsPanel provides a tabbed interface with four main sections:
- **Components** - Component tree and inspector
- **Signals** - Signal list and details
- **Performance** - Performance metrics and profiler
- **Network** - Network request monitor

### SignalInspector

Dedicated panel for inspecting and modifying signals.

```typescript
import { SignalInspector } from '@philjs/devtools-extension';

const inspector = new SignalInspector();

// Update with current signals
inspector.update(signalsMap);

// Select a signal to view details
inspector.select('signal-id');

// Render the inspector UI
const html = inspector.render();
```

Features:
- Search signals by name
- View signal metadata (subscribers, update count, last updated)
- Edit signal values in real-time
- View signal update history (last 10 entries)
- See the source location where the signal was created

### ComponentTree

Hierarchical view of all components in your application.

```typescript
import { ComponentTree } from '@philjs/devtools-extension';

const tree = new ComponentTree();

// Update with component tree data
tree.update(rootComponent);

// Select a component
tree.select('component-id');

// Toggle node expansion
tree.toggle('component-id');

// Search components
tree.search('SearchTerm');

// Expand/collapse all nodes
tree.expandAll();
tree.collapseAll();

// Render the tree
const html = tree.render();
```

Node types and icons:
- Component (`type: 'component'`) - Displayed with a React-like icon
- Element (`type: 'element'`) - Shows the HTML tag name
- Fragment (`type: 'fragment'`) - Diamond icon
- Text (`type: 'text'`) - Quote icon

### PerformanceProfiler

Profile and analyze application performance.

```typescript
import { PerformanceProfiler } from '@philjs/devtools-extension';

const profiler = new PerformanceProfiler();

// Update with performance metrics
profiler.update(metrics);

// Start recording render sessions
profiler.startRecording();

// Stop recording
profiler.stopRecording();

// Clear recorded history
profiler.clearHistory();

// Render the profiler UI
const html = profiler.render();
```

Metrics tracked:
- **FPS** - Frames per second with visual gauge
- **Memory** - JavaScript heap usage
- **Total Renders** - Number of component renders
- **Avg Render** - Average render duration

Web Vitals thresholds:
| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| TTFB | < 800ms | 800-1800ms | > 1800ms |
| FCP | < 1800ms | 1800-3000ms | > 3000ms |
| LCP | < 2500ms | 2500-4000ms | > 4000ms |
| FID | < 100ms | 100-300ms | > 300ms |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |
| INP | < 200ms | 200-500ms | > 500ms |

### NetworkInspector

Monitor and analyze network requests.

```typescript
import { NetworkInspector } from '@philjs/devtools-extension';

const inspector = new NetworkInspector();

// Update with all requests
inspector.update(requests);

// Add a single request
inspector.addRequest(request);

// Select a request to view details
inspector.select('request-id');

// Filter requests
inspector.setFilter('api');
inspector.setTypeFilter('fetch');

// Clear all requests
inspector.clear();

// Render the inspector
const html = inspector.render();
```

Request types:
- `fetch` - Standard fetch API requests
- `xhr` - XMLHttpRequest calls
- `loader` - PhilJS data loader requests
- `action` - PhilJS action mutations

## Client Connection

Connect your PhilJS application to the DevTools extension.

### connectDevTools()

Initialize the connection between your app and DevTools.

```typescript
import { connectDevTools } from '@philjs/devtools-extension';

// Connect to DevTools (typically in your app's entry point)
connectDevTools();
```

This function:
1. Checks if DevTools is available
2. Sets up a hook for the extension to detect your app
3. Initializes message passing between the app and DevTools
4. Hooks into PhilJS internals to track signals, components, and performance

### disconnectDevTools()

Disconnect from DevTools and clean up listeners.

```typescript
import { disconnectDevTools } from '@philjs/devtools-extension';

// Disconnect when needed (e.g., during cleanup)
disconnectDevTools();
```

### isDevToolsConnected()

Check the current connection status.

```typescript
import { isDevToolsConnected } from '@philjs/devtools-extension';

if (isDevToolsConnected()) {
  console.log('DevTools is connected');
}
```

## Types

### DevToolsState

The complete state of the DevTools panel.

```typescript
interface DevToolsState {
  connected: boolean;
  signals: Map<string, SignalData>;
  componentTree: ComponentNode | null;
  selectedNode: string | null;
  performance: PerformanceMetrics;
  networkRequests: NetworkRequest[];
  consoleMessages: ConsoleMessage[];
}
```

### SignalData

Information about a tracked signal.

```typescript
interface SignalData {
  id: string;
  name: string;
  value: unknown;
  subscribers: number;
  lastUpdated: number;
  updateCount: number;
  source: string;
  history: SignalHistoryEntry[];
}

interface SignalHistoryEntry {
  timestamp: number;
  value: unknown;
  trigger: string;
}
```

### ComponentNode

A node in the component tree.

```typescript
interface ComponentNode {
  id: string;
  name: string;
  type: 'component' | 'element' | 'fragment' | 'text';
  props: Record<string, unknown>;
  state: Record<string, unknown>;
  signals: string[];
  children: ComponentNode[];
  element?: HTMLElement;
  renderTime?: number;
  renderCount: number;
  warnings: string[];
}
```

### PerformanceMetrics

Performance data collected by the profiler.

```typescript
interface PerformanceMetrics {
  fps: number;
  memory: MemoryMetrics;
  timing: TimingMetrics;
  renders: RenderMetrics[];
  hydration: HydrationMetrics | null;
}

interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface TimingMetrics {
  ttfb: number;  // Time to First Byte
  fcp: number;   // First Contentful Paint
  lcp: number;   // Largest Contentful Paint
  fid: number;   // First Input Delay
  cls: number;   // Cumulative Layout Shift
  inp: number;   // Interaction to Next Paint
}

interface RenderMetrics {
  componentId: string;
  componentName: string;
  duration: number;
  timestamp: number;
  cause: string;
}

interface HydrationMetrics {
  totalTime: number;
  componentCount: number;
  mismatchCount: number;
  mismatches: HydrationMismatch[];
}

interface HydrationMismatch {
  componentId: string;
  componentName: string;
  type: 'text' | 'attribute' | 'missing' | 'extra';
  expected: string;
  actual: string;
}
```

### NetworkRequest

Information about a captured network request.

```typescript
interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  type: 'fetch' | 'xhr' | 'loader' | 'action';
  startTime: number;
  endTime: number;
  duration: number;
  size: number;
  headers: Record<string, string>;
  body?: unknown;
  response?: unknown;
  error?: string;
}
```

## Integration Example

Here is a complete example of integrating PhilJS DevTools with your application:

```typescript
// main.ts - Application entry point
import { mount } from '@philjs/core';
import { connectDevTools, isDevToolsConnected } from '@philjs/devtools-extension';
import App from './App';

// Connect to DevTools in development mode
if (import.meta.env.DEV) {
  connectDevTools();

  // Optional: Log connection status
  setTimeout(() => {
    if (isDevToolsConnected()) {
      console.log('PhilJS DevTools connected successfully');
    } else {
      console.log('PhilJS DevTools not detected - install the browser extension');
    }
  }, 1000);
}

// Mount your application
mount(App, document.getElementById('root'));
```

### Conditional Loading

For production builds, you may want to completely exclude DevTools:

```typescript
// main.ts
import { mount } from '@philjs/core';
import App from './App';

// Only load DevTools in development
if (import.meta.env.DEV) {
  import('@philjs/devtools-extension').then(({ connectDevTools }) => {
    connectDevTools();
  });
}

mount(App, document.getElementById('root'));
```

### With Signal Debugging

Name your signals for better debugging:

```typescript
import { signal } from '@philjs/core';

// Named signals appear with descriptive names in DevTools
const count = signal(0, { name: 'count' });
const user = signal(null, { name: 'currentUser', id: 'user-session' });
const theme = signal('light', { name: 'themePreference' });
```

### Cleanup on Unmount

```typescript
import { mount, unmount } from '@philjs/core';
import { connectDevTools, disconnectDevTools } from '@philjs/devtools-extension';
import App from './App';

const root = document.getElementById('root');

if (import.meta.env.DEV) {
  connectDevTools();
}

mount(App, root);

// On cleanup (e.g., HMR)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disconnectDevTools();
    unmount(root);
  });
}
```

## DevTools Messages

The extension uses a message-based protocol for communication:

```typescript
type DevToolsMessage =
  | { type: 'INIT'; payload: DevToolsState }
  | { type: 'SIGNAL_UPDATE'; payload: SignalData }
  | { type: 'COMPONENT_TREE_UPDATE'; payload: ComponentNode }
  | { type: 'PERFORMANCE_UPDATE'; payload: PerformanceMetrics }
  | { type: 'NETWORK_REQUEST'; payload: NetworkRequest }
  | { type: 'CONSOLE_MESSAGE'; payload: ConsoleMessage }
  | { type: 'SELECT_COMPONENT'; payload: string }
  | { type: 'HIGHLIGHT_COMPONENT'; payload: string | null }
  | { type: 'INSPECT_SIGNAL'; payload: string }
  | { type: 'MODIFY_SIGNAL'; payload: { id: string; value: unknown } };
```

## Troubleshooting

### Extension Not Detecting App

1. Ensure `connectDevTools()` is called before any components mount
2. Check that PhilJS is loaded (look for `window.__PHILJS__`)
3. Refresh the page after installing the extension
4. Check the browser console for any errors

### Component Tree Not Updating

1. Verify the app is using the PhilJS component system
2. Check that components are mounting correctly
3. Look for console errors from the DevTools connector

### Performance Data Missing

1. Some metrics require HTTPS in production
2. Memory metrics are only available in Chromium browsers
3. Web Vitals require the page to be visible and interacted with

### Network Requests Not Captured

1. Requests made before `connectDevTools()` are not captured
2. Some requests may be blocked by CORS or browser security
3. WebSocket connections are not yet supported

## Browser Support

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 88+ | Full support |
| Firefox | 78+ | Full support |
| Edge | 88+ | Full support (Chromium-based) |
| Safari | - | Not yet supported |

## Related Packages

- [@philjs/devtools](../devtools/overview.md) - In-browser DevTools overlay
- [@philjs/core](../core/overview.md) - Core PhilJS framework
- [@philjs/testing](../testing/overview.md) - Testing utilities
