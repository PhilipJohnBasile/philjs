# PhilJS DevTools - Quick Reference

## Installation (TL;DR)

1. Generate PNG icons: Open `extension/generate-icons.html`
2. Chrome: `chrome://extensions` → Developer mode → Load unpacked → Select `extension/` folder
3. Firefox: `about:debugging` → Load Temporary Add-on → Select `extension/manifest-firefox.json`

## Features at a Glance

| Panel | Key Features | Shortcuts |
|-------|-------------|-----------|
| **Signals** | View signals, history, dependencies | Search: Type to filter |
| **Components** | Tree view, props, state, highlighting | Expand all: Toolbar button |
| **Performance** | FPS, memory, render timeline | Record: Start/stop button |
| **Time Travel** | Snapshots, undo/redo, timeline | Prev/Next: Arrow buttons |
| **Network** | Requests, timing, status | Filter: Type to search |

## Keyboard Shortcuts

Currently no keyboard shortcuts implemented. Navigate using mouse/trackpad.

## Message API

### From Page to Extension

```javascript
// Send signal update
window.postMessage({
  source: 'philjs-devtools-client',
  type: 'SIGNAL_UPDATE',
  payload: { id, name, value, ... }
}, '*');
```

### From Extension to Page

```javascript
// Select component
window.postMessage({
  source: 'philjs-devtools-panel',
  type: 'SELECT_COMPONENT',
  payload: componentId
}, '*');
```

## PhilJS Integration Hooks

```javascript
// Signal tracking
window.__PHILJS_SIGNAL_HOOK__ = (signal, name, initialValue) => {
  // Your tracking code
};

// Render tracking
window.__PHILJS_RENDER_HOOK__ = (component, startTime, endTime) => {
  // Your tracking code
};

// Effect tracking
window.__PHILJS_EFFECT_HOOK__ = (effect, duration) => {
  // Your tracking code
};

// DevTools API
window.__PHILJS_DEVTOOLS_HOOK__ = {
  connect: () => {},
  captureSnapshot: (action, metadata) => {},
  restoreSnapshot: (snapshotId) => {},
  getSignals: () => [],
  getComponents: () => []
};
```

## Common Tasks

### View a Signal
1. Open Signals tab
2. Click signal in list
3. View details on right

### Inspect a Component
1. Open Components tab
2. Expand tree to find component
3. Click to select
4. Hover to highlight on page

### Capture State Snapshot
1. Open Time Travel tab
2. Click "Capture Snapshot"
3. View in timeline

### Restore Previous State
1. Open Time Travel tab
2. Click "Previous" or select snapshot
3. State will be restored

### Check Performance
1. Open Performance tab
2. View FPS and Memory charts
3. Check render timeline
4. Review component metrics

### Filter Network Requests
1. Open Network tab
2. Type in search box
3. View filtered results

## Data Structures

### Signal Data
```typescript
{
  id: string;
  name: string;
  value: any;
  subscribers: number;
  dependencies: string[];
  updateCount: number;
  lastUpdated: number;
  createdAt: number;
  history: Array<{
    timestamp: number;
    value: any;
    trigger: string;
  }>;
}
```

### Component Data
```typescript
{
  id: string;
  name: string;
  type: 'component' | 'element' | 'text';
  props: Record<string, any>;
  state: Record<string, any>;
  signals: string[];
  children: ComponentNode[];
  isIsland: boolean;
  isHydrated: boolean;
  renderCount: number;
  averageRenderTime: number;
}
```

### Snapshot Data
```typescript
{
  id: string;
  timestamp: number;
  action: string;
  metadata: object;
  signals: Array<{ id, name, value }>;
  components: Array<{ id, name, props, state }>;
}
```

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Extension not visible | Enable Developer mode in `chrome://extensions` |
| Shows "Disconnected" | Make sure page has PhilJS loaded |
| Signals not appearing | Check `window.__PHILJS__` exists |
| Icons not loading | Generate PNGs using `generate-icons.html` |
| Performance slow | Clear metrics, reduce history size |
| Network requests missing | Check if fetch/XHR hooks loaded |

## Performance Tips

```javascript
// Reduce memory usage
const config = {
  maxHistorySize: 20,      // Default: 50
  maxSnapshots: 20,        // Default: 100
  captureStackTraces: false // Default: false
};

// Selective tracking
if (isDevelopment && isImportantSignal) {
  window.__PHILJS_SIGNAL_HOOK__(...);
}

// Disable in production
if (process.env.NODE_ENV !== 'development') {
  delete window.__PHILJS_DEVTOOLS_HOOK__;
}
```

## Build Commands

```bash
# Unix/Mac
chmod +x extension/build.sh
./extension/build.sh

# Windows
extension\build.bat
```

## File Locations

```
extension/
├── manifest.json           # Chrome manifest
├── manifest-firefox.json   # Firefox manifest
├── background.js           # Chrome background
├── content-script.js       # Bridge
├── inject.js              # Page hooks
├── panel.html/css/js      # UI
└── icons/                 # Icons
```

## URLs

- Chrome Extensions: `chrome://extensions`
- Firefox Add-ons: `about:debugging`
- Extension Console: Right-click extension → Inspect
- DevTools Console: Undock DevTools → F12

## Useful Console Commands

```javascript
// Check if PhilJS is loaded
window.__PHILJS__

// Check if DevTools hook is installed
window.__PHILJS_DEVTOOLS_HOOK__

// Get all signals
window.__PHILJS_DEVTOOLS_HOOK__?.getSignals()

// Get all components
window.__PHILJS_DEVTOOLS_HOOK__?.getComponents()

// Capture snapshot
window.__PHILJS_DEVTOOLS_HOOK__?.captureSnapshot('manual')
```

## Status Indicators

| Indicator | Meaning |
|-----------|---------|
| 🟢 Green dot | Connected to PhilJS app |
| 🔴 Red dot | Not connected / No PhilJS detected |
| Blue border | Component highlighted on page |
| Yellow background | Selected item |
| Red text | Performance warning |

## Limits & Defaults

| Setting | Default | Max |
|---------|---------|-----|
| Signal history per signal | 50 | Configurable |
| State snapshots | 100 | Configurable |
| Performance data points | 100 | Fixed |
| Network requests | 100 | Fixed |
| FPS history | 60 | Fixed |
| Memory history | 60 | Fixed |

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 88+ | ✅ Full support |
| Edge | 88+ | ✅ Full support |
| Firefox | 57+ | ✅ Supported (V2 manifest) |
| Safari | Any | ⚠️ Not yet supported |

## Getting Help

1. Check [README.md](extension/README.md) for detailed docs
2. Check [INSTALLATION.md](extension/INSTALLATION.md) for setup issues
3. Check [DEVTOOLS_GUIDE.md](DEVTOOLS_GUIDE.md) for architecture
4. Open issue on PhilJS GitHub
5. Ask in PhilJS community

## Updates

To update the extension after making changes:

1. Go to `chrome://extensions`
2. Find PhilJS DevTools
3. Click refresh icon (⟳)
4. Reload your test page

## Common Workflows

### Debugging a Signal Issue
1. Open Signals tab
2. Find the signal
3. Check update history
4. View dependency graph
5. Modify value to test

### Debugging a Render Issue
1. Open Components tab
2. Find the component
3. Check render count and time
4. Open Performance tab
5. Check render timeline

### Debugging State Changes
1. Open Time Travel tab
2. Click through snapshots
3. Compare different states
4. Restore to previous state
5. Test the difference

### Debugging Network Issue
1. Open Network tab
2. Find the request
3. Check status and timing
4. View headers/body
5. Check for errors

---

For complete documentation, see README.md and DEVTOOLS_GUIDE.md
