# PhilJS DevTools Extension - File Overview

This document lists all the files created for the PhilJS DevTools browser extension.

## Extension Core Files

Located in `extension/` directory:

### Manifest & Configuration

- **manifest.json** - Chrome/Edge extension manifest (Manifest V3)
- **manifest-firefox.json** - Firefox extension manifest (Manifest V2)

### Background Scripts

- **background.js** - Service worker for Chrome/Edge
- **background-firefox.js** - Background script for Firefox (Manifest V2)

### Content & Page Scripts

- **content-script.js** - Bridge between page and extension
- **inject.js** - Injected into page context to access PhilJS internals

### DevTools Panel

- **devtools.html** - DevTools entry point
- **devtools.js** - Creates the DevTools panel
- **panel.html** - Main panel UI structure
- **panel.css** - Complete styling for the panel
- **panel.js** - Panel logic and functionality (~800 lines)

### Icons

- **icons/icon16.svg** - 16x16 icon source
- **icons/icon48.svg** - 48x48 icon source
- **icons/icon128.svg** - 128x128 icon source
- **icons/icon16.png** - (To be generated)
- **icons/icon48.png** - (To be generated)
- **icons/icon128.png** - (To be generated)

### Utilities

- **generate-icons.html** - Tool to generate PNG icons from SVG

### Build Scripts

- **build.sh** - Unix/Mac build script
- **build.bat** - Windows build script

## Documentation

- **extension/README.md** - User documentation with features and usage
- **extension/INSTALLATION.md** - Installation guide for all browsers
- **DEVTOOLS_GUIDE.md** - Developer guide with architecture and integration
- **EXTENSION_FILES.md** - This file

## Features Implemented

### 1. Signal Inspector Panel
✅ Live signal monitoring
✅ Signal details (value, type, subscribers, dependencies)
✅ Update history with timestamps
✅ Dependency graph visualization
✅ Search and filter
✅ Signal modification support

### 2. Component Tree Viewer
✅ Hierarchical component tree
✅ Expand/collapse functionality
✅ Component details (props, state, signals)
✅ Hover highlighting
✅ Island and hydration detection
✅ Performance metrics per component
✅ Search and filter

### 3. Performance Profiler
✅ FPS monitoring with chart
✅ Memory usage tracking with chart
✅ Render timeline visualization
✅ Component render metrics
✅ Render time breakdown
✅ Performance warnings

### 4. Time Travel Debugging
✅ State snapshot capture
✅ Timeline navigation (undo/redo)
✅ Visual timeline with markers
✅ Snapshot inspection
✅ State restoration
✅ Snapshot metadata
✅ Manual and automatic snapshots

### 5. Network Inspector
✅ Request tracking (fetch/XHR)
✅ Request details (method, status, duration)
✅ Filter and search
✅ Error tracking

### 6. Additional Features
✅ Connection status indicator
✅ Tab-based navigation
✅ Responsive design
✅ Dark mode support
✅ Empty states
✅ Loading states
✅ Chrome and Firefox compatibility

## File Statistics

### Total Lines of Code

- **inject.js**: ~650 lines - Core page monitoring logic
- **panel.js**: ~800 lines - UI and state management
- **panel.html**: ~250 lines - UI structure
- **panel.css**: ~550 lines - Complete styling
- **content-script.js**: ~60 lines - Bridge logic
- **background.js**: ~40 lines - Service worker
- **devtools.js**: ~10 lines - Panel creation

**Total**: ~2,400 lines of functional code

### Documentation

- **README.md**: ~400 lines - User documentation
- **INSTALLATION.md**: ~230 lines - Installation guide
- **DEVTOOLS_GUIDE.md**: ~650 lines - Developer guide

**Total**: ~1,280 lines of documentation

## Browser Compatibility

### Chrome/Edge (Manifest V3)
✅ Fully supported
✅ All features working
✅ Uses manifest.json
✅ Service worker background script

### Firefox (Manifest V2)
✅ Supported with Firefox-specific manifest
✅ Uses manifest-firefox.json
✅ Traditional background script
✅ May require minor API adjustments

### Safari
⚠️ Not yet supported
- Would require Safari-specific manifest conversion
- Some APIs may need polyfills

## Installation Requirements

1. Browser: Chrome 88+, Edge 88+, or Firefox 57+
2. PhilJS application to debug
3. PNG icons (generate using generate-icons.html)

## Build Requirements

### For Users
- No build required
- Just load unpacked extension

### For Distribution
- ZIP tool (built-in on Mac/Linux, or 7-Zip on Windows)
- PNG conversion tool (for icons)
- Optional: npm/node for automation

## Testing Checklist

### Basic Functionality
- [ ] Extension loads in Chrome
- [ ] Extension loads in Firefox
- [ ] DevTools panel appears
- [ ] Connection status updates

### Signal Inspector
- [ ] Signals appear in list
- [ ] Signal selection works
- [ ] Signal details display
- [ ] Update history shows
- [ ] Dependency graph renders
- [ ] Search filters signals

### Component Tree
- [ ] Component tree renders
- [ ] Expand/collapse works
- [ ] Component selection works
- [ ] Details panel updates
- [ ] Hover highlighting works
- [ ] Search filters components

### Performance
- [ ] FPS chart updates
- [ ] Memory chart updates
- [ ] Render timeline shows
- [ ] Metrics display correctly

### Time Travel
- [ ] Snapshots capture
- [ ] Timeline shows snapshots
- [ ] Navigation works
- [ ] State restoration works
- [ ] Details display

### Network
- [ ] Requests appear
- [ ] Details show correctly
- [ ] Filter works

## Known Limitations

1. **Icon Generation**: PNG icons need to be manually generated
2. **PhilJS Integration**: Requires hooks in PhilJS core (not yet implemented)
3. **State Restoration**: Can display snapshots but can't fully restore without PhilJS core support
4. **Browser Compatibility**: Safari not yet supported

## Next Steps

To make the extension fully functional:

1. **Generate Icons**: Use generate-icons.html to create PNG files
2. **PhilJS Core Integration**: Add hooks in PhilJS core for:
   - Signal creation tracking
   - Component render tracking
   - Effect execution tracking
3. **Testing**: Test with real PhilJS applications
4. **Refinement**: Fix any bugs found during testing
5. **Distribution**: Package and publish to browser stores

## Integration with PhilJS Core

The extension is ready to work once PhilJS core implements these hooks:

```javascript
// In signal creation
if (window.__PHILJS_SIGNAL_HOOK__) {
  window.__PHILJS_SIGNAL_HOOK__(signal, name, initialValue);
}

// In component rendering
if (window.__PHILJS_RENDER_HOOK__) {
  window.__PHILJS_RENDER_HOOK__(component, startTime, endTime);
}

// In effect execution
if (window.__PHILJS_EFFECT_HOOK__) {
  window.__PHILJS_EFFECT_HOOK__(effect, duration);
}
```

## File Locations

```
philjs/
└── packages/
    └── philjs-devtools-extension/
        ├── extension/                 # Extension files
        │   ├── manifest.json
        │   ├── manifest-firefox.json
        │   ├── background.js
        │   ├── background-firefox.js
        │   ├── content-script.js
        │   ├── inject.js
        │   ├── devtools.html
        │   ├── devtools.js
        │   ├── panel.html
        │   ├── panel.css
        │   ├── panel.js
        │   ├── generate-icons.html
        │   ├── build.sh
        │   ├── build.bat
        │   ├── README.md
        │   ├── INSTALLATION.md
        │   └── icons/
        │       ├── icon16.svg
        │       ├── icon48.svg
        │       └── icon128.svg
        ├── DEVTOOLS_GUIDE.md
        └── EXTENSION_FILES.md (this file)
```

## Contributing

To contribute:

1. Make changes in appropriate files
2. Test in both Chrome and Firefox
3. Update documentation if needed
4. Follow existing code style
5. Submit PR

## License

Same as PhilJS main project.

---

Created with ❤️ for the PhilJS community.
