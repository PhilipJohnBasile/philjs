# PhilJS DevTools Browser Extension

Official browser extension for debugging and inspecting PhilJS applications.

## Features

### 1. Signal Inspector
- **Live Signal Monitoring**: View all signals in your application with real-time updates
- **Signal Details**: Inspect signal values, update counts, subscribers, and dependencies
- **Update History**: Track the complete history of signal changes with timestamps
- **Dependency Graph**: Visualize signal dependencies and relationships
- **Search & Filter**: Quickly find specific signals by name

### 2. Component Tree Viewer
- **Hierarchical View**: Browse your component tree in a collapsible tree structure
- **Component Details**: View props, state, and associated signals for each component
- **Highlight on Hover**: Hover over components to highlight them in the page
- **Island Detection**: Easily identify island components and their hydration status
- **Performance Metrics**: See render counts and average render times per component

### 3. Performance Profiler
- **FPS Monitoring**: Real-time FPS tracking with historical chart
- **Memory Usage**: Track JavaScript heap size over time
- **Render Timeline**: Visualize when and how long components take to render
- **Render Metrics**: Detailed breakdown of component render performance
- **Performance Warnings**: Automatic detection of slow renders and performance issues

### 4. Time Travel Debugging
- **State Snapshots**: Capture complete application state at any point
- **Timeline Navigation**: Navigate through state history with undo/redo
- **Visual Timeline**: See all snapshots on an interactive timeline
- **State Inspection**: Compare different states and see what changed
- **Manual Snapshots**: Capture state at specific points for debugging

### 5. Network Inspector
- **Request Tracking**: Monitor all network requests made by your application
- **Request Details**: View method, status, duration, and response data
- **Filter & Search**: Find specific requests quickly
- **Fetch/XHR Support**: Tracks both fetch and XMLHttpRequest calls

## Installation

### Chrome/Edge (Developer Mode)

1. Clone this repository or download the source
2. Open Chrome/Edge and navigate to `chrome://extensions` or `edge://extensions`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Navigate to `packages/philjs-devtools-extension/extension` and select the folder
6. The PhilJS DevTools extension is now installed!

### Firefox (Temporary Installation)

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Navigate to `packages/philjs-devtools-extension/extension/manifest.json` and select it
4. The extension will be loaded temporarily (until browser restart)

### Firefox (Permanent Installation)

For permanent installation, the extension needs to be signed by Mozilla:
1. Package the extension as a ZIP file
2. Submit to [addons.mozilla.org](https://addons.mozilla.org)
3. Wait for review and signing

## Usage

### Getting Started

1. Install the extension using the instructions above
2. Open a PhilJS application in your browser
3. Open Chrome DevTools (F12 or Right-click → Inspect)
4. Click on the "PhilJS" tab in DevTools
5. The extension will automatically connect to your PhilJS app

### Signal Inspector

**View All Signals:**
- All signals in your application appear in the left panel
- Click on any signal to see detailed information

**Signal Details:**
- Current value and type
- Number of updates and subscribers
- Complete update history with timestamps
- Source code location where signal was created
- Dependency relationships

**Dependency Graph:**
- Visualize how signals depend on each other
- Central node shows selected signal
- Connected nodes show dependencies

### Component Tree

**Navigate the Tree:**
- Click the arrow icons to expand/collapse components
- Use "Expand All" / "Collapse All" buttons for quick navigation
- Search for specific components using the search box

**Component Details:**
- View all props and their current values
- See component state (if any)
- View associated signals
- Check render performance metrics
- Identify islands and hydration status

**Highlight Components:**
- Hover over any component in the tree to highlight it on the page
- Click to select and view details
- The component will be highlighted with a blue border

### Performance Profiling

**Monitor Performance:**
- FPS chart shows frame rate over last 60 seconds
- Memory chart tracks heap usage
- Render timeline shows component render activity

**Identify Issues:**
- Slow renders are highlighted in red
- Performance metrics help identify bottlenecks
- View detailed render times for each component

**Recording:**
- Click "Start Recording" to begin capturing performance data
- Click "Clear" to reset all metrics

### Time Travel Debugging

**Capture Snapshots:**
- Click "Capture Snapshot" to save current state
- Snapshots are automatically captured on signal updates
- Each snapshot includes all signal values and component states

**Navigate Time:**
- Use Previous/Next buttons to step through history
- Click on timeline markers to jump to specific points
- Double-click snapshots in the list to restore that state

**Inspect State:**
- Select any snapshot to view its contents
- Compare different snapshots to see what changed
- Export snapshots for bug reports

### Network Inspector

**Monitor Requests:**
- All fetch and XHR requests appear automatically
- View request method, URL, status, and duration
- Filter requests using the search box

**Request Details:**
- Click on any request to see full details
- View headers, body, and response data
- Check for errors and failures

## Integration with PhilJS

### Automatic Detection

The extension automatically detects PhilJS applications by looking for the `window.__PHILJS__` object. No manual setup required!

### Manual Integration (Optional)

For advanced features, you can manually initialize the devtools hooks:

```javascript
import { connectDevTools } from 'philjs-devtools-extension';

// Connect to DevTools
if (process.env.NODE_ENV === 'development') {
  connectDevTools();
}
```

### Signal Registration

Signals are automatically tracked, but you can provide better debugging info:

```javascript
const count = signal(0, { name: 'counter' });
```

### Component Names

Provide meaningful component names for better debugging:

```javascript
function MyComponent() {
  // Component logic
}
MyComponent.displayName = 'MyComponent';
```

## Architecture

The extension consists of several parts:

1. **manifest.json**: Extension configuration and permissions
2. **background.js**: Service worker that manages extension lifecycle
3. **content-script.js**: Bridge between page and extension
4. **inject.js**: Injected into page context to access PhilJS internals
5. **devtools.js**: Creates the DevTools panel
6. **panel.html/css/js**: Main UI for the DevTools panel

### Message Flow

```
Page (PhilJS App)
  ↕ window.postMessage
inject.js
  ↕ window.postMessage
content-script.js
  ↕ chrome.runtime.sendMessage
background.js
  ↕ chrome.runtime.sendMessage
panel.js (DevTools UI)
```

## Development

### Building the Extension

The extension files are in `extension/` directory and are ready to use without a build step.

### Testing Locally

1. Make changes to extension files
2. Go to `chrome://extensions`
3. Click the refresh icon on the PhilJS DevTools extension
4. Reload your PhilJS app and open DevTools

### Icons

To generate PNG icons from the SVG sources:

1. Open `extension/generate-icons.html` in your browser
2. Right-click on each canvas and save as PNG
3. Save as `icon16.png`, `icon48.png`, and `icon128.png` in `extension/icons/`

Alternatively, use any SVG to PNG converter tool.

## Troubleshooting

### Extension Not Appearing

- Make sure you've opened DevTools (F12)
- Check that the extension is enabled in `chrome://extensions`
- Reload the page and try again

### Not Detecting PhilJS App

- Verify that your app is using PhilJS
- Check browser console for any PhilJS errors
- Make sure `window.__PHILJS__` is defined (open console and type `window.__PHILJS__`)

### Signals Not Appearing

- Ensure signals are created after the extension loads
- Check that signal creation is happening in the page context
- Verify that the PhilJS version supports DevTools hooks

### Performance Issues

- Disable "Capture Stack Traces" for better performance
- Limit history size for signals with many updates
- Clear performance data regularly

## Browser Compatibility

### Chrome/Edge
- ✅ Fully supported (Manifest V3)
- All features working

### Firefox
- ✅ Supported (with Manifest V3)
- May require minor adjustments for certain APIs

### Safari
- ⚠️ Partial support
- Requires manifest conversion and Safari-specific APIs

## Privacy & Permissions

The extension requires the following permissions:

- **activeTab**: To inspect the current tab's page
- **scripting**: To inject scripts into pages
- **storage**: To save extension settings
- **host_permissions (<all_urls>)**: To work on any website

**Privacy Note**: The extension only runs on pages with PhilJS applications and does not collect or transmit any data outside your browser.

## Contributing

Contributions are welcome! Please see the main PhilJS repository for contribution guidelines.

## License

Same as PhilJS main project.

## Support

For issues and questions:
- Open an issue on the PhilJS GitHub repository
- Check the documentation at [philjs.dev](https://philjs.dev)
- Join the PhilJS community discussions

## Credits

Built with ❤️ for the PhilJS community.
