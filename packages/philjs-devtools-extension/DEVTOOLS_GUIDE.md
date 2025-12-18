# PhilJS DevTools Extension - Developer Guide

## Overview

The PhilJS DevTools browser extension provides comprehensive debugging and inspection tools for PhilJS applications. This guide covers the architecture, integration, and advanced usage.

## Architecture

### Components

The extension consists of five main components:

```
┌─────────────────────────────────────────────┐
│           PhilJS Web Application            │
│  ┌───────────────────────────────────────┐  │
│  │  window.__PHILJS__                    │  │
│  │  window.__PHILJS_DEVTOOLS_HOOK__      │  │
│  └───────────────────────────────────────┘  │
└──────────────────┬──────────────────────────┘
                   │ window.postMessage
┌──────────────────▼──────────────────────────┐
│              inject.js                      │
│  • Hooks into PhilJS internals              │
│  • Tracks signals, components, performance  │
│  • Captures state snapshots                 │
└──────────────────┬──────────────────────────┘
                   │ window.postMessage
┌──────────────────▼──────────────────────────┐
│          content-script.js                  │
│  • Bridges page and extension              │
│  • Injects inject.js into page             │
└──────────────────┬──────────────────────────┘
                   │ chrome.runtime.sendMessage
┌──────────────────▼──────────────────────────┐
│          background.js                      │
│  • Service worker (Manifest V3)             │
│  • Routes messages                          │
│  • Manages extension lifecycle             │
└──────────────────┬──────────────────────────┘
                   │ chrome.runtime.sendMessage
┌──────────────────▼──────────────────────────┐
│           DevTools Panel                    │
│  • panel.html/css/js                        │
│  • Renders UI                               │
│  • Displays debugging information           │
└─────────────────────────────────────────────┘
```

### Message Flow

Messages flow bidirectionally:

**Page → Panel:**
```
PhilJS App → inject.js → content-script.js → background.js → panel.js
```

**Panel → Page:**
```
panel.js → background.js → content-script.js → inject.js → PhilJS App
```

### Message Types

#### From Page to Panel:

- `INIT`: Initial state when extension connects
- `SIGNAL_REGISTERED`: New signal created
- `SIGNAL_UPDATE`: Signal value changed
- `COMPONENT_TREE`: Component tree updated
- `COMPONENT_RENDER`: Component rendered
- `PERFORMANCE_UPDATE`: Performance metrics
- `SNAPSHOT_CAPTURED`: State snapshot saved
- `NETWORK_REQUEST`: Network request made

#### From Panel to Page:

- `GET_STATE`: Request current state
- `SELECT_COMPONENT`: Select a component
- `HIGHLIGHT_COMPONENT`: Highlight component on page
- `MODIFY_SIGNAL`: Change signal value
- `CAPTURE_SNAPSHOT`: Take state snapshot
- `RESTORE_SNAPSHOT`: Restore previous state
- `CLEAR_HISTORY`: Clear time travel history

## Integration with PhilJS

### Automatic Detection

The extension automatically detects PhilJS by looking for:

```javascript
window.__PHILJS__
```

When found, it installs hooks to monitor the application.

### Hooking Mechanism

#### Signal Tracking

```javascript
// In inject.js
window.__PHILJS_SIGNAL_HOOK__ = (signal, name, initialValue) => {
  // Register signal
  // Wrap signal.set() to track updates
  // Send to DevTools
};
```

PhilJS core would call this when creating signals:

```javascript
// In philjs-core
export function signal(initialValue, options) {
  const sig = createSignal(initialValue);

  // Hook for DevTools
  if (window.__PHILJS_SIGNAL_HOOK__) {
    window.__PHILJS_SIGNAL_HOOK__(sig, options?.name, initialValue);
  }

  return sig;
}
```

#### Component Tracking

```javascript
// In inject.js
window.__PHILJS_RENDER_HOOK__ = (component, startTime, endTime) => {
  // Track render performance
  // Update component registry
  // Send to DevTools
};
```

PhilJS would call this during rendering:

```javascript
// In philjs-core
function renderComponent(component) {
  const start = performance.now();

  // ... render logic ...

  const end = performance.now();

  // Hook for DevTools
  if (window.__PHILJS_RENDER_HOOK__) {
    window.__PHILJS_RENDER_HOOK__(component, start, end);
  }
}
```

## Features Implementation

### 1. Signal Inspector

**Data Structure:**
```javascript
{
  id: string,
  name: string,
  value: any,
  type: 'signal' | 'memo' | 'linkedSignal',
  subscribers: number,
  dependencies: string[],
  dependents: string[],
  updateCount: number,
  lastUpdated: number,
  createdAt: number,
  history: Array<{
    timestamp: number,
    value: any,
    trigger: string
  }>,
  source: string
}
```

**Key Features:**
- Real-time updates via `SIGNAL_UPDATE` messages
- Dependency tracking by wrapping signal.set()
- History limited to last 50 updates per signal
- Visual dependency graph using Canvas API

### 2. Component Tree Viewer

**Data Structure:**
```javascript
{
  id: string,
  name: string,
  type: 'component' | 'element' | 'text',
  props: Record<string, any>,
  state: Record<string, any>,
  signals: string[],
  children: ComponentNode[],
  element: HTMLElement,
  isIsland: boolean,
  isHydrated: boolean,
  renderCount: number,
  averageRenderTime: number
}
```

**Key Features:**
- DOM traversal to build tree structure
- Bidirectional mapping (component ↔ DOM element)
- Hover highlighting via injected overlay
- Expandable/collapsible tree view

### 3. Performance Profiler

**Metrics Tracked:**
- FPS (frames per second)
- Memory usage (JS heap)
- Component render times
- Effect execution times

**Visualization:**
- Canvas-based charts for FPS and memory
- Timeline view for render events
- Historical data (last 60 data points)

### 4. Time Travel Debugging

**Snapshot Structure:**
```javascript
{
  id: string,
  timestamp: number,
  action: string,
  metadata: object,
  signals: Array<{
    id: string,
    name: string,
    value: any
  }>,
  components: Array<{
    id: string,
    name: string,
    props: object,
    state: object
  }>
}
```

**Features:**
- Automatic snapshots on signal updates
- Manual snapshot capture
- Navigate history (undo/redo)
- Visual timeline with markers
- State restoration (sends new values to signals)

### 5. Network Inspector

**Request Tracking:**
- Wraps `window.fetch`
- Wraps `XMLHttpRequest`
- Tracks timing, status, headers, body

## Advanced Usage

### Custom Signal Names

Provide names for better debugging:

```javascript
const count = signal(0);
// DevTools will show "signal-123..."

// Better:
if (window.__PHILJS_SIGNAL_HOOK__) {
  window.__PHILJS_SIGNAL_HOOK__(count, 'userCount', 0);
}
```

### Component Metadata

Add debugging metadata to components:

```javascript
function MyComponent() {
  const node = h('div', ...);
  node.__devtools_id__ = 'my-component-123';
  return node;
}
```

### Performance Profiling

Wrap expensive operations:

```javascript
const start = performance.now();
// ... expensive operation ...
const end = performance.now();

if (window.__PHILJS_RENDER_HOOK__) {
  window.__PHILJS_RENDER_HOOK__(
    { name: 'ExpensiveOperation' },
    start,
    end
  );
}
```

### Snapshot Metadata

Add context to snapshots:

```javascript
function handleUserAction() {
  // ... action logic ...

  if (window.__PHILJS_DEVTOOLS_HOOK__) {
    window.__PHILJS_DEVTOOLS_HOOK__.captureSnapshot(
      'user_action',
      { action: 'button_click', userId: 123 }
    );
  }
}
```

## Performance Considerations

### Memory Usage

The extension maintains:
- Signal history (50 entries per signal)
- State snapshots (100 max)
- Performance metrics (100 data points)
- Network requests (100 max)

This can add ~5-10MB overhead in typical apps.

### Impact on App Performance

- Signal wrapping: ~0.1ms overhead per update
- Component tracking: ~0.5ms overhead per render
- Performance monitoring: ~60 FPS tracking overhead
- Network tracking: ~1ms overhead per request

**Recommendation**: Use in development only.

### Optimization Tips

1. **Disable in Production:**
```javascript
if (process.env.NODE_ENV === 'development') {
  // DevTools hooks
}
```

2. **Selective Signal Tracking:**
```javascript
// Only track important signals
if (isDevelopment && isImportantSignal) {
  window.__PHILJS_SIGNAL_HOOK__(...);
}
```

3. **Limit History Size:**
```javascript
// In your PhilJS integration
const devtools = window.__PHILJS_DEVTOOLS_HOOK__;
if (devtools) {
  devtools.config = {
    maxHistorySize: 20,  // Reduce from 50
    maxSnapshots: 20,    // Reduce from 100
  };
}
```

## Security Considerations

### Content Security Policy (CSP)

The extension injects scripts into pages. If your app has strict CSP:

1. The extension uses `chrome.scripting` API which bypasses CSP
2. For `window.postMessage`, ensure your CSP allows `'unsafe-inline'` or whitelist the extension

### Data Privacy

- All data stays in browser (no external transmission)
- Extension only activates on pages with PhilJS
- No persistent storage of application data
- Snapshots are temporary (cleared on page reload)

### Permissions

Required permissions explained:

- `activeTab`: Access page when DevTools open
- `scripting`: Inject monitoring scripts
- `storage`: Save extension settings
- `<all_urls>`: Work on any PhilJS app

## Debugging the Extension

### Enable Extension Debugging

1. Open `chrome://extensions`
2. Enable Developer mode
3. Find PhilJS DevTools
4. Click "Inspect views: background page"

### Console Logs

The extension logs to different consoles:

- `inject.js`: Page console (F12 → Console)
- `content-script.js`: Page console
- `background.js`: Extension background console
- `panel.js`: DevTools console (Undock DevTools → F12 on DevTools)

### Common Issues

**Extension not detecting PhilJS:**
- Check `window.__PHILJS__` exists
- Verify inject.js loaded (check page console)
- Check for CSP blocking script injection

**Messages not flowing:**
- Check message source/target fields
- Verify chrome.runtime is available
- Check for errors in background console

**Performance issues:**
- Reduce history sizes
- Disable capture stack traces
- Clear metrics regularly

## Contributing

To contribute to the extension:

1. Make changes in `extension/` folder
2. Test in both Chrome and Firefox
3. Update documentation
4. Submit PR to main PhilJS repository

### File Structure

```
extension/
├── manifest.json           # Chrome/Edge manifest (V3)
├── manifest-firefox.json   # Firefox manifest (V2)
├── background.js          # Chrome background script
├── background-firefox.js  # Firefox background script
├── content-script.js      # Page bridge
├── inject.js             # Page context hooks
├── devtools.html         # DevTools entry point
├── devtools.js           # Creates panel
├── panel.html            # Main UI
├── panel.css             # Styles
├── panel.js              # UI logic
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md             # User documentation
├── INSTALLATION.md       # Installation guide
├── build.sh             # Build script (Unix)
└── build.bat            # Build script (Windows)
```

## Future Enhancements

Potential improvements:

1. **Persistence:**
   - Save/load debugging sessions
   - Export snapshots as JSON
   - Import snapshots for replay

2. **Advanced Filtering:**
   - Filter signals by type
   - Filter components by name/props
   - Search across all data

3. **Performance:**
   - Flamegraph visualization
   - Render waterfall chart
   - Component update profiler

4. **Collaboration:**
   - Share snapshots via URL
   - Export bug reports
   - Record debugging sessions

5. **Integration:**
   - TypeScript type inspection
   - Source map support
   - Jump to definition in editor

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Firefox Extension Documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [DevTools API](https://developer.chrome.com/docs/extensions/mv3/devtools/)
- [PhilJS Documentation](https://philjs.dev)

---

For questions or support, open an issue on the PhilJS GitHub repository.
