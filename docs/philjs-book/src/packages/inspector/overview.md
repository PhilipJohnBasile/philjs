# @philjs/inspector

Visual in-page component inspector for PhilJS applications, providing React DevTools-like functionality directly in the browser.

## Introduction

`@philjs/inspector` is a powerful visual debugging tool that allows you to inspect PhilJS components directly in your browser. It provides an overlay-based interface similar to React DevTools, but runs entirely within the page without requiring any browser extensions.

The inspector helps you:
- Visualize component boundaries with hover highlighting
- View component props and signal values in real-time
- Track performance metrics like render counts and timing
- Navigate the component tree with keyboard shortcuts
- Jump to source code locations in your editor

## Installation

```bash
npm install @philjs/inspector
# or
pnpm add @philjs/inspector
```

## Quick Start

```typescript
import { initInspector } from '@philjs/inspector';

// Initialize the inspector (automatically attaches to window)
initInspector();

// Enable the inspector programmatically
window.__PHILJS_INSPECTOR__.enable();

// Or toggle with keyboard shortcut: Ctrl+Shift+I
```

The inspector auto-initializes in development environments (localhost, 127.0.0.1) but can be manually controlled in any environment.

## Features

### Hover Highlighting with Bounding Box

When the inspector is enabled, hovering over any element displays a visual bounding box around it. The highlight uses a purple color for hover state and blue for selected elements.

```typescript
import { highlightElementHover, removeHoverHighlight } from '@philjs/inspector';

// Highlight an element on hover
highlightElementHover(element, componentInfo);

// Remove hover highlight
removeHoverHighlight();
```

### Component Name Overlay

Selected components display a floating label showing the component name, with additional badges for special component types like Islands and hydrated components.

```typescript
import { highlightElement, removeHighlight } from '@philjs/inspector';

// Highlight with component label
highlightElement(element, componentInfo, {
  showLabel: true,
  showMetrics: true,
  color: '#3b82f6'
});

// Remove selection highlight
removeHighlight();
```

### Props and Signal Values Display

The tooltip displays component props and reactive signal values in a structured format:

- **Props**: Shows all component attributes with formatted values
- **Signals**: Displays signal names, current values, and types (signal, memo, linkedSignal)

### Click to Select and Pin Details

Click on any element to select it and pin a detailed tooltip showing:
- Component name with Island/Hydrated badges
- Props list with formatted values
- Signal values
- Performance metrics
- Source location link
- Component hierarchy path

The tooltip is draggable and stays visible until dismissed.

### Component Hierarchy Breadcrumb

A breadcrumb trail appears at the top of the screen showing the full component path from the root to the selected component. Click on any breadcrumb item to navigate to that ancestor.

### Performance Metrics

Track component performance with built-in metrics:

| Metric | Description |
|--------|-------------|
| Render Count | Number of times the component has rendered |
| Last Render | Duration of the most recent render in milliseconds |
| Updates | Total number of state updates |

```typescript
import { updateComponentMetrics } from '@philjs/inspector';

// Update metrics after a render
updateComponentMetrics(element, renderTimeMs);
```

### Source Location Links

Components with source location metadata display clickable links that open the source file in your editor (VS Code supported by default).

Source locations can be embedded via:
- `data-source` attribute with JSON: `{"file": "...", "line": 1, "column": 0}`
- Comment nodes: `<!-- source:path/to/file.tsx:42:0 -->`

### Keyboard Navigation

Navigate the component tree without using the mouse:

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+I` | Toggle inspector on/off |
| `Ctrl+F` | Open component search |
| `Arrow Down` | Select next component |
| `Arrow Up` | Select previous component |
| `Arrow Left` | Navigate to parent component |
| `Arrow Right` | Navigate to first child |
| `Escape` | Close tooltip/search or disable inspector |

### Component Search

Press `Ctrl+F` to open the search box and find components by name:

```typescript
import { showSearchBox, hideSearchBox, filterComponents } from '@philjs/inspector';

// Show search with selection callback
showSearchBox((component) => {
  console.log('Selected:', component.name);
});

// Hide search box
hideSearchBox();

// Filter components programmatically
const filtered = filterComponents(components, {
  name: 'Button',
  isIsland: true,
  isHydrated: false,
  hasProp: 'onClick',
  hasSignal: 'count'
});
```

## Core API

### initInspector()

Initialize the inspector and attach it to the window object.

```typescript
import { initInspector } from '@philjs/inspector';

initInspector();

// Access via window object
window.__PHILJS_INSPECTOR__.enable();   // Enable inspector
window.__PHILJS_INSPECTOR__.disable();  // Disable inspector
window.__PHILJS_INSPECTOR__.toggle();   // Toggle state
window.__PHILJS_INSPECTOR__.isEnabled(); // Check if enabled
window.__PHILJS_INSPECTOR__.getState(); // Get current state
window.__PHILJS_INSPECTOR__.getComponents(); // Get all components
```

### getInspector()

Get the singleton inspector instance for programmatic control.

```typescript
import { getInspector } from '@philjs/inspector';

const inspector = getInspector();

// Enable with custom configuration
inspector.enable({
  showMetrics: true,
  enableKeyboard: true,
  shortcuts: {
    toggle: { key: 'i', ctrl: true, shift: true, handler: () => {}, description: 'Toggle' }
  }
});

// Check state
console.log(inspector.isEnabled());
console.log(inspector.getState());
// { enabled: true, hoveredElement: null, selectedElement: Element, mode: 'inspect' }
```

## Component Info API

### extractComponentInfo()

Extract component metadata from a DOM element.

```typescript
import { extractComponentInfo } from '@philjs/inspector';

const info = extractComponentInfo(element);
// Returns: ComponentInfo
// {
//   id: 'component-0',
//   name: 'MyButton',
//   element: Element,
//   props: { onClick: [Function], disabled: false },
//   signals: [{ name: 'count', value: 5, type: 'signal' }],
//   isIsland: false,
//   isHydrated: true,
//   renderCount: 3,
//   renderTime: 1.25,
//   updateCount: 5,
//   path: ['App', 'Layout', 'MyButton'],
//   source: { file: 'src/MyButton.tsx', line: 10, column: 0 }
// }
```

### getComponentById() / getComponentByElement()

Retrieve registered component information.

```typescript
import { getComponentById, getComponentByElement } from '@philjs/inspector';

// Get by ID
const byId = getComponentById('component-0');

// Get by DOM element
const byElement = getComponentByElement(document.querySelector('.my-button'));
```

### searchComponents()

Search registered components by name.

```typescript
import { searchComponents } from '@philjs/inspector';

const buttons = searchComponents('Button');
// Returns array of ComponentInfo matching the query
```

### registerSignal() / getSignalInfo()

Register and retrieve signal metadata.

```typescript
import { registerSignal, getSignalInfo } from '@philjs/inspector';

// Register a signal for tracking
registerSignal(mySignal, 'count', 'signal');

// Get signal info
const info = getSignalInfo(mySignal);
// { name: 'count', value: undefined, type: 'signal' }
```

### Helper Functions

```typescript
import {
  formatPropValue,
  getComponentAncestors,
  getComponentChildren,
  getAllComponents,
  clearComponentRegistry
} from '@philjs/inspector';

// Format a value for display
formatPropValue({ nested: 'object' }); // "{nested...}"
formatPropValue([1, 2, 3, 4, 5]); // "[Array(5)]"
formatPropValue('hello'); // "\"hello\""

// Get component ancestors
const ancestors = getComponentAncestors(element);

// Get component children
const children = getComponentChildren(element);

// Get all registered components
const all = getAllComponents();

// Clear registry
clearComponentRegistry();
```

## Overlay API

### highlightElement() / removeHighlight()

Control the selection highlight overlay.

```typescript
import { highlightElement, removeHighlight, HighlightOptions } from '@philjs/inspector';

const options: HighlightOptions = {
  color: '#3b82f6',     // Border color
  showLabel: true,      // Show component name label
  showMetrics: true     // Show performance metrics in label
};

highlightElement(element, componentInfo, options);

// Remove highlight
removeHighlight();
```

### showElementMeasurements()

Display box model measurements (margin, padding, border).

```typescript
import { showElementMeasurements } from '@philjs/inspector';

// Creates overlay showing margin (orange) and padding (green) areas
const measurementOverlay = showElementMeasurements(element);
document.body.appendChild(measurementOverlay);
```

### Additional Overlay Functions

```typescript
import {
  initOverlay,
  destroyOverlay,
  getOverlayRoot,
  highlightElementHover,
  removeHoverHighlight,
  updateHighlightPosition,
  getCurrentHighlightedElement,
  flashHighlight
} from '@philjs/inspector';

// Initialize overlay container
const overlayRoot = initOverlay();

// Flash animation on selection
flashHighlight(element, '#10b981');

// Update position on scroll/resize
updateHighlightPosition();

// Get currently highlighted element
const current = getCurrentHighlightedElement();

// Cleanup
destroyOverlay();
```

## Keyboard API

### registerShortcut() / getAllShortcuts()

Register and manage keyboard shortcuts.

```typescript
import {
  registerShortcut,
  unregisterShortcut,
  getAllShortcuts,
  formatShortcut,
  matchesShortcut,
  KeyboardShortcut
} from '@philjs/inspector';

// Register a custom shortcut
registerShortcut({
  key: 'p',
  ctrl: true,
  shift: false,
  alt: false,
  meta: false,
  handler: (event) => {
    console.log('Ctrl+P pressed');
  },
  description: 'Print component info'
});

// Get all registered shortcuts
const shortcuts = getAllShortcuts();

// Format for display (platform-aware)
const formatted = formatShortcut(shortcuts[0]);
// Windows: "Ctrl+Shift+I"
// Mac: "^+Shift+I" (using symbols)

// Check if event matches shortcut
if (matchesShortcut(event, myShortcut)) {
  // Handle match
}

// Unregister
unregisterShortcut('ctrl+p');
```

### ComponentNavigator

Navigate the component tree programmatically.

```typescript
import { ComponentNavigator } from '@philjs/inspector';

const navigator = new ComponentNavigator();

// Set elements to navigate
navigator.setElements(Array.from(document.querySelectorAll('[data-component]')));

// Navigate
const next = navigator.next();
const prev = navigator.previous();
const parent = navigator.parent(currentElement);
const child = navigator.firstChild(currentElement);
const nextSib = navigator.nextSibling(currentElement);
const prevSib = navigator.previousSibling(currentElement);

// Get current state
const current = navigator.getCurrent();
const index = navigator.getCurrentIndex();
const total = navigator.getCount();

// Set current element
navigator.setCurrent(element);
```

## Search API

### showSearchBox() / hideSearchBox()

Control the search UI.

```typescript
import { showSearchBox, hideSearchBox, isSearchBoxVisible } from '@philjs/inspector';

// Show search with selection callback
showSearchBox((selectedComponent) => {
  // Navigate to or highlight the selected component
  highlightElement(selectedComponent.element, selectedComponent);
});

// Check visibility
if (isSearchBoxVisible()) {
  hideSearchBox();
}
```

### filterComponents()

Filter components by various criteria.

```typescript
import { filterComponents } from '@philjs/inspector';

const results = filterComponents(allComponents, {
  name: 'Card',         // Filter by name (partial match)
  isIsland: true,       // Only Island components
  isHydrated: true,     // Only hydrated components
  hasProp: 'onClick',   // Must have this prop
  hasSignal: 'state'    // Must have a signal containing this string
});
```

### getSearchStats()

Get statistics about a component collection.

```typescript
import { getSearchStats } from '@philjs/inspector';

const stats = getSearchStats(components);
// {
//   total: 42,
//   islands: 5,
//   hydrated: 12,
//   withSignals: 8
// }
```

## Tooltip API

```typescript
import {
  showTooltip,
  hideTooltip,
  updateTooltip,
  isTooltipVisible,
  getCurrentTooltipComponent
} from '@philjs/inspector';

// Show tooltip for a component
showTooltip(componentInfo, { x: 100, y: 200 });

// Update content
updateTooltip(newComponentInfo);

// Check state
if (isTooltipVisible()) {
  const component = getCurrentTooltipComponent();
  console.log('Showing:', component.name);
}

// Hide
hideTooltip();
```

## Keyboard Shortcuts Reference

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Shift+I` | Toggle Inspector | Enable or disable the inspector |
| `Ctrl+F` | Search | Open component search box |
| `Arrow Down` | Next | Select the next component in the tree |
| `Arrow Up` | Previous | Select the previous component in the tree |
| `Arrow Left` | Parent | Navigate to the parent component |
| `Arrow Right` | Child | Navigate to the first child component |
| `Escape` | Close/Exit | Close tooltip, search, or disable inspector |

## Types

```typescript
interface InspectorConfig {
  enabled?: boolean;
  showMetrics?: boolean;
  enableKeyboard?: boolean;
  shortcuts?: Partial<InspectorShortcuts>;
}

interface InspectorState {
  enabled: boolean;
  hoveredElement: Element | null;
  selectedElement: Element | null;
  mode: 'inspect' | 'select';
}

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

interface SignalInfo {
  name: string;
  value: any;
  type: 'signal' | 'memo' | 'linkedSignal';
}

interface SourceLocation {
  file: string;
  line: number;
  column: number;
}

interface HighlightOptions {
  color?: string;
  showLabel?: boolean;
  showMetrics?: boolean;
}

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void | boolean;
  description: string;
}
```

## Styling

The inspector uses scoped inline styles to avoid conflicts with your application. All styles are defined in `INSPECTOR_STYLES` and can be accessed if needed:

```typescript
import { INSPECTOR_STYLES, styleToCss, applyStyles } from '@philjs/inspector';

// Convert styles to CSS string
const css = styleToCss(INSPECTOR_STYLES.tooltip);

// Apply styles to an element
applyStyles(myElement, INSPECTOR_STYLES.highlightBox);
```

## Best Practices

1. **Development Only**: The inspector is designed for development. It auto-disables in production unless explicitly enabled.

2. **Component Naming**: Use `data-component-name` attributes for clear component identification:
   ```html
   <div data-component-name="ProductCard">...</div>
   ```

3. **Source Mapping**: Enable source location tracking in your build for "click to source" functionality.

4. **Signal Registration**: Register signals with meaningful names for better debugging:
   ```typescript
   import { registerSignal } from '@philjs/inspector';
   registerSignal(countSignal, 'itemCount', 'signal');
   ```

5. **Performance Tracking**: Use `updateComponentMetrics()` in your render functions to track performance.

## See Also

- [@philjs/devtools](../devtools/overview.md) - Browser extension devtools
- [@philjs/core](../core/overview.md) - Core signal primitives
- [@philjs/testing](../testing/overview.md) - Testing utilities
