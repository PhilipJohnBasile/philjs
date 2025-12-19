# PhilJS Inspector

Visual component inspector for PhilJS applications - an in-page DevTools overlay similar to React DevTools.

## Features

- **Hover Highlighting** - Highlight components on hover with bounding box
- **Component Names** - Show component name overlay on hover
- **Props Display** - View component props in detailed tooltip
- **Signal Values** - Display signal values used by components
- **Click to Select** - Click to pin component details
- **Hierarchy Breadcrumb** - Show component ancestry path
- **Performance Metrics** - Track render count and timing per component
- **Source Location** - Link to source file:line in your IDE
- **Keyboard Navigation** - Use arrow keys to traverse the component tree
- **Search Components** - Ctrl+F to find components by name

## Installation

```bash
npm install philjs-inspector
# or
pnpm add philjs-inspector
# or
yarn add philjs-inspector
```

## Usage

### Basic Setup

The inspector auto-initializes in development environments and attaches to `window.__PHILJS_INSPECTOR__`:

```typescript
import { initInspector } from 'philjs-inspector';

// Initialize inspector (done automatically in dev)
initInspector();

// Enable the inspector
window.__PHILJS_INSPECTOR__.enable();

// Or use the keyboard shortcut: Ctrl+Shift+I
```

### Programmatic Control

```typescript
// Enable with options
window.__PHILJS_INSPECTOR__.enable({
  showMetrics: true,
  enableKeyboard: true,
});

// Disable inspector
window.__PHILJS_INSPECTOR__.disable();

// Toggle inspector
window.__PHILJS_INSPECTOR__.toggle();

// Check if enabled
const enabled = window.__PHILJS_INSPECTOR__.isEnabled();

// Get inspector state
const state = window.__PHILJS_INSPECTOR__.getState();

// Get all components
const components = window.__PHILJS_INSPECTOR__.getComponents();
```

### Keyboard Shortcuts

When the inspector is enabled, use these keyboard shortcuts:

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+I` | Toggle inspector on/off |
| `Ctrl+F` | Open component search |
| `Arrow Down` | Navigate to next component |
| `Arrow Up` | Navigate to previous component |
| `Arrow Left` | Navigate to parent component |
| `Arrow Right` | Navigate to first child component |
| `Escape` | Close tooltip/search or disable inspector |

### Component Search

Press `Ctrl+F` to open the search box and find components by name:

```typescript
import { showSearchBox } from 'philjs-inspector';

// Show search programmatically
showSearchBox((component) => {
  console.log('Selected component:', component);
});
```

### Manual Component Tracking

For better debugging, you can manually register components and signals:

```typescript
import { extractComponentInfo, registerSignal } from 'philjs-inspector';

// Extract component info
const element = document.getElementById('my-component');
const info = extractComponentInfo(element);

// Register signals
const count = signal(0);
registerSignal(count, 'count', 'signal');
```

### IDE Integration

The inspector can open source files in your IDE. Set up the integration:

```typescript
// Add to your app initialization
if (typeof window !== 'undefined') {
  window.__PHILJS_OPEN_IN_IDE__ = (url: string) => {
    // Parse vscode://file/path:line:column URL
    // Send to your dev server to open in IDE
    fetch(`/__open-in-editor?file=${encodeURIComponent(url)}`);
  };
}
```

### Custom Styling

The inspector uses inline styles to avoid conflicts, but you can override them:

```typescript
import { INSPECTOR_STYLES } from 'philjs-inspector';

// Customize highlight color
const customOverlay = document.getElementById('philjs-inspector-overlay');
if (customOverlay) {
  customOverlay.style.setProperty('--highlight-color', '#ff0000');
}
```

## API Reference

### Inspector API

Attached to `window.__PHILJS_INSPECTOR__`:

```typescript
interface InspectorAPI {
  enable(config?: Partial<InspectorConfig>): void;
  disable(): void;
  toggle(): void;
  isEnabled(): boolean;
  getState(): InspectorState;
  getComponents(): ComponentInfo[];
}
```

### Component Info

```typescript
interface ComponentInfo {
  id: string;
  name: string;
  element: Element;
  props: Record<string, any>;
  signals: SignalInfo[];
  isIsland: boolean;
  isHydrated: boolean;
  renderCount: number;
  renderTime: number;
  updateCount: number;
  path: string[];
  source?: SourceLocation;
}
```

### Inspector Config

```typescript
interface InspectorConfig {
  enabled?: boolean;
  showMetrics?: boolean;
  enableKeyboard?: boolean;
  shortcuts?: Partial<InspectorShortcuts>;
}
```

## Integration with Build Tools

### Vite Plugin

Add source location metadata during development:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    {
      name: 'philjs-inspector-plugin',
      transform(code, id) {
        if (id.endsWith('.tsx') || id.endsWith('.jsx')) {
          // Add data-source attributes to components
          // This is a simplified example
          return code.replace(
            /<([A-Z]\w+)/g,
            `<$1 data-source="${id}:1:1"`
          );
        }
      },
    },
  ],
});
```

## Browser Support

The inspector works in all modern browsers:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Performance Considerations

The inspector adds minimal overhead when disabled. When enabled:

- ~1-2ms per interaction (hover/click)
- ~50KB memory for component registry
- No impact on app performance when disabled

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test

# Type check
pnpm typecheck
```

## Examples

### Inspecting Islands

The inspector automatically detects and highlights PhilJS islands:

```tsx
// Your component with islands
function App() {
  return (
    <div>
      <StaticContent />
      <InteractiveWidget island /> {/* Will show [island] badge */}
    </div>
  );
}
```

### Tracking Performance

The inspector shows render metrics for each component:

```tsx
import { updateComponentMetrics } from 'philjs-inspector';

function MyComponent() {
  const start = performance.now();

  // Your render logic

  const renderTime = performance.now() - start;
  updateComponentMetrics(element, renderTime);

  return <div>...</div>;
}
```

### Custom Component Names

Set custom names for better debugging:

```tsx
function MyWidget(props) {
  return (
    <div data-component-name="MyWidget">
      {/* Component content */}
    </div>
  );
}
```

## Troubleshooting

### Inspector not showing

1. Check that you're in development mode
2. Ensure the inspector is enabled: `window.__PHILJS_INSPECTOR__.enable()`
3. Check browser console for errors

### Components not detected

1. Make sure elements have proper attributes
2. Try manually extracting component info
3. Check that the component is in the DOM

### Source links not working

1. Set up `window.__PHILJS_OPEN_IN_IDE__` handler
2. Configure your dev server to handle file opening
3. Ensure source maps are enabled

## License

MIT

## Contributing

Contributions are welcome! Please read the contributing guidelines first.

## Related Packages

- [philjs-devtools](../philjs-devtools) - Development tools overlay
- [philjs-core](../philjs-core) - Core PhilJS framework
