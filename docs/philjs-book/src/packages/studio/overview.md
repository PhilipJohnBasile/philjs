# @philjs/studio - Visual Component Builder

The `@philjs/studio` package provides a visual component builder with drag-and-drop capabilities for PhilJS applications. It includes a comprehensive state management system for editor operations, serialization/import utilities, and pre-built templates for rapid prototyping.

## Installation

```bash
npm install @philjs/studio
# or
pnpm add @philjs/studio
# or
bun add @philjs/studio
```

### Peer Dependencies

```bash
npm install @philjs/core @philjs/ui @philjs/dnd
```

## Features

- **Visual Editor Store** - Zustand-based state management for component tree manipulation
- **Component CRUD** - Add, update, delete, duplicate, and move components
- **Responsive Editing** - Breakpoint-aware styling (base, sm, md, lg, xl)
- **History Management** - Full undo/redo support with configurable history size
- **Clipboard Operations** - Cut, copy, and paste components
- **Canvas Controls** - Zoom, pan, grid snapping, and guide display
- **Component Locking** - Lock and visibility toggles for components
- **Event Handlers** - Attach actions (navigate, custom, setState, submit) to components
- **Figma Import** - Import designs directly from Figma JSON exports
- **JSON Serialization** - Import/export designs in a portable schema format
- **Pre-built Templates** - Landing pages, dashboards, forms, and blog layouts

## Quick Start

```tsx
import {
  useEditorStore,
  useEditorActions,
  useComponent,
  useSelectedComponents,
} from '@philjs/studio';

// Create a simple visual editor
function VisualEditor() {
  const { addComponent, select, deleteComponent } = useEditorActions();
  const rootIds = useEditorStore((state) => state.rootIds);

  const handleAddButton = () => {
    const id = addComponent('Button', null, { x: 100, y: 100 });
    select(id);
  };

  return (
    <div>
      <button onClick={handleAddButton}>Add Button</button>
      <ComponentTree rootIds={rootIds} />
    </div>
  );
}

function ComponentTree({ rootIds }: { rootIds: string[] }) {
  return (
    <div>
      {rootIds.map((id) => (
        <ComponentNode key={id} id={id} />
      ))}
    </div>
  );
}

function ComponentNode({ id }: { id: string }) {
  const component = useComponent(id);
  const isSelected = useEditorStore((state) =>
    state.selection.selectedIds.includes(id)
  );

  if (!component) return null;

  return (
    <div style={{ border: isSelected ? '2px solid blue' : '1px solid gray' }}>
      <span>{component.name}</span>
      {component.children.map((childId) => (
        <ComponentNode key={childId} id={childId} />
      ))}
    </div>
  );
}
```

## Editor Store

The `useEditorStore` hook provides access to the complete editor state and actions. It is built on Zustand with Immer for immutable updates.

### State Structure

```tsx
interface EditorState {
  // Component tree
  components: Record<string, ComponentNode>;
  rootIds: string[];

  // Canvas state
  canvas: {
    zoom: number;          // 0.1 to 4.0
    pan: { x: number; y: number };
    gridSize: number;      // Default: 8
    snapToGrid: boolean;
    showGrid: boolean;
    showGuides: boolean;
  };

  // Selection state
  selection: {
    selectedIds: string[];
    hoveredId: string | null;
    focusedId: string | null;
  };

  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;
  maxHistorySize: number;  // Default: 50

  // Clipboard
  clipboard: ClipboardData | null;

  // Responsive editing
  activeBreakpoint: 'base' | 'sm' | 'md' | 'lg' | 'xl';

  // Drag state
  isDragging: boolean;
  dragSource: { type: 'palette' | 'canvas'; componentType?: string; componentId?: string } | null;
}
```

### Basic Usage

```tsx
import { useEditorStore } from '@philjs/studio';

function EditorPanel() {
  // Access state
  const components = useEditorStore((state) => state.components);
  const zoom = useEditorStore((state) => state.canvas.zoom);
  const selectedIds = useEditorStore((state) => state.selection.selectedIds);

  // Access actions
  const addComponent = useEditorStore((state) => state.addComponent);
  const setZoom = useEditorStore((state) => state.setZoom);

  return (
    <div>
      <p>Zoom: {Math.round(zoom * 100)}%</p>
      <p>Selected: {selectedIds.length} components</p>
    </div>
  );
}
```

## Component Management

### Adding Components

```tsx
import { useEditorStore } from '@philjs/studio';

function ComponentPalette() {
  const addComponent = useEditorStore((state) => state.addComponent);

  const componentTypes = ['Button', 'Text', 'Input', 'Container', 'Card', 'Image'];

  return (
    <div className="palette">
      {componentTypes.map((type) => (
        <button
          key={type}
          onClick={() => {
            // Add to root with default position
            const id = addComponent(type, null);
            console.log(`Created component: ${id}`);
          }}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
```

### Updating Components

```tsx
import { useEditorStore } from '@philjs/studio';

function PropsPanel() {
  const selectedIds = useEditorStore((state) => state.selection.selectedIds);
  const components = useEditorStore((state) => state.components);
  const updateProps = useEditorStore((state) => state.updateProps);
  const updateStyles = useEditorStore((state) => state.updateStyles);
  const activeBreakpoint = useEditorStore((state) => state.activeBreakpoint);

  const selectedComponent = selectedIds[0] ? components[selectedIds[0]] : null;

  if (!selectedComponent) {
    return <div>No component selected</div>;
  }

  return (
    <div className="props-panel">
      <h3>{selectedComponent.name}</h3>

      {/* Update props */}
      <label>
        Text Content:
        <input
          value={selectedComponent.props.children as string || ''}
          onChange={(e) =>
            updateProps(selectedComponent.id, { children: e.target.value })
          }
        />
      </label>

      {/* Update styles for current breakpoint */}
      <label>
        Background Color:
        <input
          type="color"
          value={selectedComponent.styles[activeBreakpoint]?.backgroundColor || '#ffffff'}
          onChange={(e) =>
            updateStyles(
              selectedComponent.id,
              { backgroundColor: e.target.value },
              activeBreakpoint
            )
          }
        />
      </label>
    </div>
  );
}
```

### Deleting and Duplicating

```tsx
import { useEditorStore } from '@philjs/studio';

function ComponentActions() {
  const selectedIds = useEditorStore((state) => state.selection.selectedIds);
  const deleteComponent = useEditorStore((state) => state.deleteComponent);
  const duplicateComponent = useEditorStore((state) => state.duplicateComponent);

  const handleDelete = () => {
    selectedIds.forEach((id) => deleteComponent(id));
  };

  const handleDuplicate = () => {
    selectedIds.forEach((id) => {
      const newId = duplicateComponent(id);
      console.log(`Duplicated to: ${newId}`);
    });
  };

  return (
    <div>
      <button onClick={handleDelete} disabled={selectedIds.length === 0}>
        Delete
      </button>
      <button onClick={handleDuplicate} disabled={selectedIds.length === 0}>
        Duplicate
      </button>
    </div>
  );
}
```

### Moving Components

```tsx
import { useEditorStore } from '@philjs/studio';

function TreeView() {
  const moveComponent = useEditorStore((state) => state.moveComponent);

  const handleDrop = (componentId: string, newParentId: string | null, index?: number) => {
    // Move component to new parent at specific index
    moveComponent(componentId, newParentId, index);
  };

  // Implement drag-and-drop tree UI...
}
```

## Selection and Interaction

### Selection Management

```tsx
import { useEditorStore, useIsSelected, useIsHovered } from '@philjs/studio';

function SelectableComponent({ id }: { id: string }) {
  const select = useEditorStore((state) => state.select);
  const setHovered = useEditorStore((state) => state.setHovered);
  const clearSelection = useEditorStore((state) => state.clearSelection);

  const isSelected = useIsSelected(id);
  const isHovered = useIsHovered(id);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        // Hold Shift/Ctrl to add to selection
        select(id, e.shiftKey || e.ctrlKey);
      }}
      onMouseEnter={() => setHovered(id)}
      onMouseLeave={() => setHovered(null)}
      style={{
        outline: isSelected ? '2px solid #3B82F6' : isHovered ? '1px dashed #94A3B8' : 'none',
      }}
    >
      {/* Component content */}
    </div>
  );
}

// Select multiple components
function MultiSelect() {
  const selectMultiple = useEditorStore((state) => state.selectMultiple);
  const components = useEditorStore((state) => state.components);

  const selectAllContainers = () => {
    const containerIds = Object.values(components)
      .filter((c) => c.type === 'Container')
      .map((c) => c.id);
    selectMultiple(containerIds);
  };

  return <button onClick={selectAllContainers}>Select All Containers</button>;
}
```

## Canvas Controls

### Zoom and Pan

```tsx
import { useEditorStore, useCanvas } from '@philjs/studio';

function CanvasControls() {
  const canvas = useCanvas();
  const setZoom = useEditorStore((state) => state.setZoom);
  const setPan = useEditorStore((state) => state.setPan);
  const zoomIn = useEditorStore((state) => state.zoomIn);
  const zoomOut = useEditorStore((state) => state.zoomOut);
  const resetZoom = useEditorStore((state) => state.resetZoom);
  const fitToScreen = useEditorStore((state) => state.fitToScreen);

  return (
    <div className="canvas-controls">
      <button onClick={zoomOut}>-</button>
      <span>{Math.round(canvas.zoom * 100)}%</span>
      <button onClick={zoomIn}>+</button>
      <button onClick={resetZoom}>Reset</button>
      <button onClick={fitToScreen}>Fit</button>

      {/* Direct zoom control */}
      <input
        type="range"
        min="10"
        max="400"
        value={canvas.zoom * 100}
        onChange={(e) => setZoom(Number(e.target.value) / 100)}
      />
    </div>
  );
}
```

### Grid and Guides

```tsx
import { useEditorStore, useCanvas } from '@philjs/studio';

function GridSettings() {
  const canvas = useCanvas();
  const setGridSize = useEditorStore((state) => state.setGridSize);
  const toggleSnapToGrid = useEditorStore((state) => state.toggleSnapToGrid);
  const toggleShowGrid = useEditorStore((state) => state.toggleShowGrid);
  const toggleShowGuides = useEditorStore((state) => state.toggleShowGuides);

  return (
    <div className="grid-settings">
      <label>
        <input
          type="checkbox"
          checked={canvas.showGrid}
          onChange={toggleShowGrid}
        />
        Show Grid
      </label>

      <label>
        <input
          type="checkbox"
          checked={canvas.snapToGrid}
          onChange={toggleSnapToGrid}
        />
        Snap to Grid
      </label>

      <label>
        Grid Size:
        <input
          type="number"
          value={canvas.gridSize}
          onChange={(e) => setGridSize(Number(e.target.value))}
          min={1}
          max={100}
        />
      </label>

      <label>
        <input
          type="checkbox"
          checked={canvas.showGuides}
          onChange={toggleShowGuides}
        />
        Show Guides
      </label>
    </div>
  );
}
```

## History (Undo/Redo)

```tsx
import { useEditorStore, selectCanUndo, selectCanRedo } from '@philjs/studio';

function HistoryControls() {
  const canUndo = useEditorStore(selectCanUndo);
  const canRedo = useEditorStore(selectCanRedo);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const clearHistory = useEditorStore((state) => state.clearHistory);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="history-controls">
      <button onClick={undo} disabled={!canUndo}>
        Undo
      </button>
      <button onClick={redo} disabled={!canRedo}>
        Redo
      </button>
      <button onClick={clearHistory}>Clear History</button>
    </div>
  );
}
```

## Clipboard Operations

```tsx
import { useEditorStore, selectClipboard } from '@philjs/studio';

function ClipboardControls() {
  const clipboard = useEditorStore(selectClipboard);
  const selectedIds = useEditorStore((state) => state.selection.selectedIds);
  const cut = useEditorStore((state) => state.cut);
  const copy = useEditorStore((state) => state.copy);
  const paste = useEditorStore((state) => state.paste);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'x') {
          e.preventDefault();
          cut();
        } else if (e.key === 'c') {
          e.preventDefault();
          copy();
        } else if (e.key === 'v') {
          e.preventDefault();
          paste();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cut, copy, paste]);

  return (
    <div className="clipboard-controls">
      <button onClick={cut} disabled={selectedIds.length === 0}>
        Cut
      </button>
      <button onClick={copy} disabled={selectedIds.length === 0}>
        Copy
      </button>
      <button onClick={() => paste()} disabled={!clipboard}>
        Paste {clipboard ? `(${clipboard.components.length})` : ''}
      </button>
    </div>
  );
}
```

## Event Handlers

Components can have event handlers attached for interactivity:

```tsx
import { useEditorStore, type EventHandler } from '@philjs/studio';

function EventPanel() {
  const selectedIds = useEditorStore((state) => state.selection.selectedIds);
  const components = useEditorStore((state) => state.components);
  const addEventHandler = useEditorStore((state) => state.addEventHandler);
  const updateEventHandler = useEditorStore((state) => state.updateEventHandler);
  const removeEventHandler = useEditorStore((state) => state.removeEventHandler);

  const selectedComponent = selectedIds[0] ? components[selectedIds[0]] : null;

  if (!selectedComponent) return null;

  const handleAddClick = () => {
    const handler: EventHandler = {
      event: 'onClick',
      action: 'navigate',
      config: { path: '/dashboard' },
    };
    addEventHandler(selectedComponent.id, handler);
  };

  return (
    <div className="event-panel">
      <h3>Events</h3>
      {selectedComponent.events.map((handler, index) => (
        <div key={index} className="event-item">
          <span>{handler.event} - {handler.action}</span>
          <button onClick={() => removeEventHandler(selectedComponent.id, index)}>
            Remove
          </button>
        </div>
      ))}
      <button onClick={handleAddClick}>Add Click Handler</button>
    </div>
  );
}
```

## Responsive Editing

Edit styles for different breakpoints:

```tsx
import { useEditorStore, type Breakpoint } from '@philjs/studio';

function BreakpointSelector() {
  const activeBreakpoint = useEditorStore((state) => state.activeBreakpoint);
  const setActiveBreakpoint = useEditorStore((state) => state.setActiveBreakpoint);

  const breakpoints: { key: Breakpoint; label: string; width: string }[] = [
    { key: 'base', label: 'Base', width: 'All' },
    { key: 'sm', label: 'SM', width: '640px' },
    { key: 'md', label: 'MD', width: '768px' },
    { key: 'lg', label: 'LG', width: '1024px' },
    { key: 'xl', label: 'XL', width: '1280px' },
  ];

  return (
    <div className="breakpoint-selector">
      {breakpoints.map(({ key, label, width }) => (
        <button
          key={key}
          onClick={() => setActiveBreakpoint(key)}
          className={activeBreakpoint === key ? 'active' : ''}
        >
          {label} ({width})
        </button>
      ))}
    </div>
  );
}
```

## Import and Export

### JSON Schema Format

The studio uses a portable JSON schema for designs:

```typescript
interface StudioSchema {
  version: string;
  name: string;
  description?: string;
  components: SerializedComponent[];
  rootIds: string[];
  canvas?: { width: number; height: number };
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
  };
}
```

### Importing Designs

```tsx
import {
  importFromJSON,
  importFromFigma,
  importFromFile,
  importFromClipboard,
  importDesign,
  validateSchema,
  type ImportOptions,
} from '@philjs/studio';

// Import from JSON string
const jsonResult = importFromJSON(jsonString, {
  preserveIds: false,  // Generate new IDs
  offsetX: 100,        // Offset position
  offsetY: 100,
  scale: 1.5,          // Scale components
});

if (jsonResult.errors) {
  console.error('Import errors:', jsonResult.errors);
} else {
  // Load into editor
  useEditorStore.getState().loadState({
    components: jsonResult.components,
    rootIds: jsonResult.rootIds,
  });
}

// Import from Figma JSON export
const figmaResult = importFromFigma(figmaData);

// Import from file
const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
const file = fileInput?.files?.[0];
if (file) {
  const fileResult = await importFromFile(file);
  // Process result...
}

// Import from clipboard
const clipboardResult = await importFromClipboard();

// Auto-detect format
const autoResult = await importDesign(source, 'auto');
```

### Figma Import Details

The Figma importer converts Figma node types to PhilJS components:

| Figma Type | PhilJS Component |
|------------|------------------|
| TEXT | Text |
| RECTANGLE | Container |
| ELLIPSE | Container |
| FRAME | Container (or inferred from name) |
| GROUP | Container |
| COMPONENT | Container (or inferred from name) |
| INSTANCE | Container (or inferred from name) |

Name-based inference:
- Names containing "button" become `Button`
- Names containing "input" or "text field" become `Input`
- Names containing "card" become `Card`
- Names containing "image" or "photo" become `Image`

Extracted styles include:
- Background colors from fills
- Border colors and styles from strokes
- Corner radius
- Box shadows from effects
- Typography (font family, size, weight)

## Templates

Pre-built templates for rapid prototyping:

```tsx
import {
  templates,
  getTemplateById,
  getTemplatesByCategory,
  cloneTemplateSchema,
  type Template,
  type TemplateCategory,
} from '@philjs/studio';

function TemplateGallery() {
  const loadState = useEditorStore((state) => state.loadState);
  const clear = useEditorStore((state) => state.clear);

  const handleLoadTemplate = (template: Template) => {
    // Clear existing content
    clear();

    // Clone template with new IDs
    const schema = cloneTemplateSchema(template);

    // Convert to editor format and load
    const components: Record<string, ComponentNode> = {};
    for (const comp of schema.components) {
      components[comp.id] = {
        ...comp,
        styles: comp.styles as ResponsiveStyles,
        events: comp.events as EventHandler[],
      };
    }

    loadState({
      components,
      rootIds: schema.rootIds,
    });
  };

  return (
    <div className="template-gallery">
      {templates.map((template) => (
        <div key={template.id} className="template-card">
          <h3>{template.name}</h3>
          <p>{template.description}</p>
          <span className="category">{template.category}</span>
          <button onClick={() => handleLoadTemplate(template)}>
            Use Template
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Available Templates

| Template | Category | Description |
|----------|----------|-------------|
| Landing Page | landing | Hero section, features grid, CTA |
| Dashboard | dashboard | Sidebar, stats cards, chart area |
| Sign Up Form | form | Card with input fields and submit |
| Blog Post | blog | Header, featured image, article |

### Template Categories

```tsx
type TemplateCategory = 'landing' | 'dashboard' | 'form' | 'blog' | 'ecommerce' | 'custom';

// Filter by category
const dashboards = getTemplatesByCategory('dashboard');
const forms = getTemplatesByCategory('form');
```

## Selectors

Pre-built selectors for common state access patterns:

```tsx
import {
  selectComponents,
  selectRootIds,
  selectCanvas,
  selectSelection,
  selectSelectedIds,
  selectZoom,
  selectPan,
  selectActiveBreakpoint,
  selectIsDragging,
  selectClipboard,
  selectCanUndo,
  selectCanRedo,
} from '@philjs/studio';

function StatusBar() {
  const zoom = useEditorStore(selectZoom);
  const selectedIds = useEditorStore(selectSelectedIds);
  const canUndo = useEditorStore(selectCanUndo);
  const canRedo = useEditorStore(selectCanRedo);
  const breakpoint = useEditorStore(selectActiveBreakpoint);

  return (
    <div className="status-bar">
      <span>Zoom: {Math.round(zoom * 100)}%</span>
      <span>Selected: {selectedIds.length}</span>
      <span>Breakpoint: {breakpoint}</span>
      <span>Undo: {canUndo ? 'Yes' : 'No'}</span>
      <span>Redo: {canRedo ? 'Yes' : 'No'}</span>
    </div>
  );
}
```

## Convenience Hooks

```tsx
import {
  useComponent,
  useSelectedComponents,
  useIsSelected,
  useIsHovered,
  useCanvas,
  useEditorActions,
} from '@philjs/studio';

// Get a single component by ID
const component = useComponent('comp_123');

// Get all selected components
const selectedComponents = useSelectedComponents();

// Check selection/hover state
const isSelected = useIsSelected('comp_123');
const isHovered = useIsHovered('comp_123');

// Get canvas state
const canvas = useCanvas();

// Get common actions
const {
  addComponent,
  updateComponent,
  deleteComponent,
  duplicateComponent,
  moveComponent,
  updateProps,
  updateStyles,
  updateBounds,
  select,
  selectMultiple,
  clearSelection,
  setHovered,
  setZoom,
  setPan,
  toggleSnapToGrid,
  toggleShowGrid,
  undo,
  redo,
  cut,
  copy,
  paste,
} = useEditorActions();
```

## Types Reference

### Core Types

```typescript
interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SpacingValue {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
```

### Typography

```typescript
interface TypographyStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  lineHeight?: number | string;
  letterSpacing?: number | string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textDecoration?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}
```

### Component Style

```typescript
interface ComponentStyle {
  // Layout
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: number | string;

  // Spacing
  padding?: SpacingValue | number | string;
  margin?: SpacingValue | number | string;

  // Size
  width?: number | string;
  height?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;

  // Colors
  backgroundColor?: string;
  color?: string;
  borderColor?: string;

  // Border
  borderWidth?: number | string;
  borderRadius?: number | string;
  borderStyle?: string;

  // Typography
  typography?: TypographyStyle;

  // Effects
  opacity?: number;
  boxShadow?: string;

  // Custom CSS
  custom?: Record<string, string | number>;
}

interface ResponsiveStyles {
  base: ComponentStyle;
  sm?: ComponentStyle;
  md?: ComponentStyle;
  lg?: ComponentStyle;
  xl?: ComponentStyle;
}
```

### Component Node

```typescript
interface ComponentNode {
  id: string;
  type: string;
  name: string;
  props: Record<string, unknown>;
  styles: ResponsiveStyles;
  events: EventHandler[];
  children: string[];
  parentId: string | null;
  isLocked: boolean;
  isVisible: boolean;
  bounds: Bounds;
}
```

### Event Handler

```typescript
interface EventHandler {
  event: string;
  action: 'navigate' | 'custom' | 'setState' | 'submit';
  config: Record<string, unknown>;
}
```

### Import Types

```typescript
interface ImportOptions {
  preserveIds?: boolean;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
}

interface ImportResult {
  components: Record<string, ComponentNode>;
  rootIds: string[];
  errors?: string[];
}

type ImportFormat = 'json' | 'figma' | 'auto';
```

### Template Types

```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail?: string;
  schema: StudioSchema;
}

type TemplateCategory = 'landing' | 'dashboard' | 'form' | 'blog' | 'ecommerce' | 'custom';
```

## API Reference

### Store Hook

| Export | Description |
|--------|-------------|
| `useEditorStore` | Main Zustand store hook |

### State Selectors

| Selector | Returns |
|----------|---------|
| `selectComponents` | `Record<string, ComponentNode>` |
| `selectRootIds` | `string[]` |
| `selectCanvas` | `CanvasState` |
| `selectSelection` | `SelectionState` |
| `selectSelectedIds` | `string[]` |
| `selectZoom` | `number` |
| `selectPan` | `Position` |
| `selectActiveBreakpoint` | `Breakpoint` |
| `selectIsDragging` | `boolean` |
| `selectClipboard` | `ClipboardData \| null` |
| `selectCanUndo` | `boolean` |
| `selectCanRedo` | `boolean` |

### Convenience Hooks

| Hook | Returns |
|------|---------|
| `useComponent(id)` | `ComponentNode \| undefined` |
| `useSelectedComponents()` | `ComponentNode[]` |
| `useIsSelected(id)` | `boolean` |
| `useIsHovered(id)` | `boolean` |
| `useCanvas()` | `CanvasState` |
| `useEditorActions()` | Common action methods |

### Store Actions

| Action | Signature |
|--------|-----------|
| `addComponent` | `(type: string, parentId: string \| null, position?: Position) => string` |
| `updateComponent` | `(id: string, updates: Partial<ComponentNode>) => void` |
| `deleteComponent` | `(id: string) => void` |
| `duplicateComponent` | `(id: string) => string` |
| `moveComponent` | `(id: string, newParentId: string \| null, index?: number) => void` |
| `updateProps` | `(id: string, props: Record<string, unknown>) => void` |
| `updateStyles` | `(id: string, styles: Partial<ComponentStyle>, breakpoint?: Breakpoint) => void` |
| `updateBounds` | `(id: string, bounds: Partial<Bounds>) => void` |
| `addEventHandler` | `(id: string, handler: EventHandler) => void` |
| `updateEventHandler` | `(id: string, index: number, handler: EventHandler) => void` |
| `removeEventHandler` | `(id: string, index: number) => void` |
| `select` | `(id: string, addToSelection?: boolean) => void` |
| `selectMultiple` | `(ids: string[]) => void` |
| `clearSelection` | `() => void` |
| `setHovered` | `(id: string \| null) => void` |
| `setFocused` | `(id: string \| null) => void` |
| `setZoom` | `(zoom: number) => void` |
| `setPan` | `(pan: Position) => void` |
| `setGridSize` | `(size: number) => void` |
| `toggleSnapToGrid` | `() => void` |
| `toggleShowGrid` | `() => void` |
| `toggleShowGuides` | `() => void` |
| `zoomIn` | `() => void` |
| `zoomOut` | `() => void` |
| `resetZoom` | `() => void` |
| `fitToScreen` | `() => void` |
| `toggleVisibility` | `(id: string) => void` |
| `toggleLock` | `(id: string) => void` |
| `undo` | `() => void` |
| `redo` | `() => void` |
| `pushHistory` | `(description: string) => void` |
| `clearHistory` | `() => void` |
| `cut` | `() => void` |
| `copy` | `() => void` |
| `paste` | `(parentId?: string \| null) => void` |
| `setDragging` | `(isDragging: boolean) => void` |
| `setDragSource` | `(source: DragSource \| null) => void` |
| `setActiveBreakpoint` | `(breakpoint: Breakpoint) => void` |
| `clear` | `() => void` |
| `loadState` | `(state: Partial<EditorState>) => void` |
| `getComponent` | `(id: string) => ComponentNode \| undefined` |
| `getSelectedComponents` | `() => ComponentNode[]` |
| `getChildren` | `(id: string) => ComponentNode[]` |
| `getAncestors` | `(id: string) => ComponentNode[]` |

### Import Functions

| Function | Signature |
|----------|-----------|
| `importFromJSON` | `(jsonString: string, options?: ImportOptions) => ImportResult` |
| `importFromFigma` | `(figmaData: unknown, options?: ImportOptions) => ImportResult` |
| `importFromFigmaJSON` | `(jsonString: string, options?: ImportOptions) => ImportResult` |
| `importFromClipboard` | `(options?: ImportOptions) => Promise<ImportResult>` |
| `importFromFile` | `(file: File, options?: ImportOptions) => Promise<ImportResult>` |
| `importDesign` | `(source: string \| File, format?: ImportFormat, options?: ImportOptions) => Promise<ImportResult>` |
| `validateSchema` | `(data: unknown) => data is StudioSchema` |

### Template Functions

| Function | Signature |
|----------|-----------|
| `templates` | `Template[]` (array of all templates) |
| `getTemplateById` | `(id: string) => Template \| undefined` |
| `getTemplatesByCategory` | `(category: TemplateCategory) => Template[]` |
| `cloneTemplateSchema` | `(template: Template) => StudioSchema` |

## Best Practices

1. **Use selectors for performance** - Create specific selectors to avoid unnecessary re-renders
2. **Batch updates** - Multiple state changes in a single action are automatically batched by Immer
3. **Clone templates before use** - Use `cloneTemplateSchema` to get unique IDs
4. **Validate imports** - Always check `ImportResult.errors` after importing
5. **Save history descriptions** - Provide meaningful descriptions when calling `pushHistory`

## See Also

- [@philjs/dnd](../dnd/overview.md) - Drag and drop primitives
- [@philjs/ui](../ui/overview.md) - UI component library
- [@philjs/core](../core/overview.md) - Core reactivity system
