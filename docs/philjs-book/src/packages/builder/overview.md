# @philjs/builder

A comprehensive visual component builder for creating PhilJS applications with drag-and-drop UI, property editing, and code generation.

## Introduction

The `@philjs/builder` package provides a complete visual design environment for building PhilJS components and layouts without writing code. It features a Figma-like interface with drag-and-drop component placement, real-time preview, and the ability to export designs as production-ready TSX, JSX, or PhilJS code.

```bash
npm install @philjs/builder
```

## Features

### Drag-and-Drop Visual Component Building

Build interfaces visually by dragging components from the palette onto the canvas. The builder supports:

- Intuitive drag-and-drop from component palette
- Nested component placement with visual drop indicators
- Multi-select with marquee selection
- Copy, paste, and duplicate operations
- Keyboard shortcuts for common operations

### Component Palette

Access all PhilJS UI components organized by category:

- **Layout**: Container, Frame, Flex, Grid, Stack, HStack, VStack
- **Typography**: Text, Heading, Paragraph, Code, Label
- **Forms**: Button, Input, Textarea, Checkbox, Radio, Select, Switch
- **Media**: Image, Video, Icon, Avatar
- **Data Display**: Card, Badge, Table, List, Accordion, Tabs
- **Navigation**: Link, Nav, Breadcrumb, Menu
- **Feedback**: Alert, Progress, Spinner, Skeleton, Tooltip
- **Overlay**: Modal, Drawer, Popover

### Property Inspector Panel

Edit component properties with specialized editors:

- Property editor for component-specific props
- Style editor for layout, typography, spacing, and effects
- Event editor for adding click handlers and other interactions
- Advanced editor for constraints and metadata

### Live Preview with Responsive Device Frames

Preview designs on different device sizes:

- Mobile devices (iPhone SE, iPhone 14, Pixel 7, Galaxy S23)
- Tablets (iPad Mini, iPad Air, iPad Pro, Surface Pro)
- Desktop resolutions (Laptop, HD, 2K, 4K)
- TV displays (1080p, 4K)
- Custom dimensions support
- Device rotation

### Code Export

Generate production-ready code in multiple formats:

- **TSX**: TypeScript with JSX
- **JSX**: JavaScript with JSX
- **PhilJS**: Native PhilJS format with signals
- Style formats: inline, object, className, Tailwind CSS

### Template System

Save and reuse common layouts:

- Built-in templates for hero sections, cards, forms
- Save custom templates
- Import/export template JSON
- Template categories and search

### Grid System with Smart Guides

Precise component placement with:

- Configurable grid size
- Snap-to-grid functionality
- Smart alignment guides
- Distance indicators
- Visual rulers

### History/Undo-Redo Support

Full undo/redo with:

- Up to 100 history entries
- Action debouncing for similar operations
- Transaction support for grouping changes
- Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)

## Installation

```bash
# npm
npm install @philjs/builder

# pnpm
pnpm add @philjs/builder

# yarn
yarn add @philjs/builder
```

## Quick Start

```typescript
import {
  createBuilderStore,
  VisualBuilder,
  registerPhilJSUIComponents,
} from '@philjs/builder';

// Create the builder store
const store = createBuilderStore();

// Register PhilJS UI components
registerPhilJSUIComponents((component) => {
  store.dispatch({ type: 'REGISTER_COMPONENT', payload: component });
});

// Create the visual builder
const builder = VisualBuilder({
  showPalette: true,
  showInspector: true,
  showLayers: true,
  theme: 'light',
  onNodesChange: (nodes) => {
    console.log('Nodes updated:', nodes);
  },
  onSelectionChange: (selectedIds) => {
    console.log('Selection:', selectedIds);
  },
});

// Mount to DOM
document.getElementById('app')?.appendChild(builder);
```

## Core Components

### VisualBuilder

The main visual builder component that combines all UI elements.

```typescript
import { VisualBuilder, type VisualBuilderProps } from '@philjs/builder';

interface VisualBuilderProps {
  // Initial nodes to load
  nodes?: Record<NodeId, ComponentNode>;

  // Root node ID
  rootId?: NodeId;

  // Initial builder state
  initialState?: Partial<BuilderState>;

  // Callbacks
  onNodesChange?: (nodes: Record<NodeId, ComponentNode>) => void;
  onSelectionChange?: (selectedIds: NodeId[]) => void;
  onSave?: (state: BuilderState) => void;
  onLoad?: (state: BuilderState) => void;

  // Panel visibility
  showPalette?: boolean;    // default: true
  showInspector?: boolean;  // default: true
  showLayers?: boolean;     // default: true

  // Appearance
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
}

const builder = VisualBuilder({
  theme: 'dark',
  showPalette: true,
  showInspector: true,
  onSave: (state) => {
    localStorage.setItem('design', JSON.stringify(state));
  },
});
```

### Canvas

The main design surface with grid, rulers, and node rendering.

```typescript
import { Canvas, type CanvasProps } from '@philjs/builder/canvas';

interface CanvasProps {
  width?: number;
  height?: number;
  zoom?: number;
  pan?: { x: number; y: number };
  grid?: boolean;
  rulers?: boolean;
  onZoom?: (zoom: number) => void;
  onPan?: (pan: { x: number; y: number }) => void;
}

const canvas = Canvas({
  width: 1200,
  height: 800,
  zoom: 1,
  grid: true,
  rulers: true,
  onZoom: (zoom) => console.log('Zoom:', zoom),
});
```

### Palette

Component library panel with search and categories.

```typescript
import {
  Palette,
  builtInComponents,
  builtInCategories,
  type PaletteProps,
} from '@philjs/builder/components';

interface PaletteProps {
  components?: ComponentDefinition[];
  categories?: ComponentCategory[];
  onDragStart?: (component: ComponentDefinition) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  collapsedCategories?: Set<string>;
  onCategoryToggle?: (categoryId: string) => void;
}

const palette = Palette({
  components: builtInComponents,
  categories: builtInCategories,
  onDragStart: (component) => {
    console.log('Started dragging:', component.name);
  },
});
```

### PropertyPanel

Property editing panel for selected components.

```typescript
import { PropertyPanel, type PropertyPanelProps } from '@philjs/builder/components';

interface PropertyPanelProps {
  node?: ComponentNode;
  propDefinitions?: PropDefinition[];
  onPropsChange?: (props: Record<string, unknown>) => void;
  onStylesChange?: (styles: Partial<NodeStyles>) => void;
  collapsed?: boolean;
  onCollapseToggle?: () => void;
}

const panel = PropertyPanel({
  node: selectedNode,
  onPropsChange: (props) => {
    store.dispatch({
      type: 'UPDATE_NODE_PROPS',
      payload: { nodeId: selectedNode.id, props },
    });
  },
  onStylesChange: (styles) => {
    store.dispatch({
      type: 'UPDATE_NODE_STYLES',
      payload: { nodeId: selectedNode.id, styles },
    });
  },
});
```

### ComponentTree

Hierarchical view of the component structure.

```typescript
import { ComponentTree, type ComponentTreeProps } from '@philjs/builder/components';

interface ComponentTreeProps {
  nodes: Record<NodeId, ComponentNode>;
  rootId: NodeId;
  selectedIds?: NodeId[];
  expandedIds?: NodeId[];
  onSelect?: (nodeId: NodeId, addToSelection?: boolean) => void;
  onToggle?: (nodeId: NodeId) => void;
  onMove?: (nodeId: NodeId, newParentId: NodeId, index?: number) => void;
  onRename?: (nodeId: NodeId, newName: string) => void;
  onDelete?: (nodeId: NodeId) => void;
  onDuplicate?: (nodeId: NodeId) => void;
}

const tree = ComponentTree({
  nodes: store.nodes(),
  rootId: store.rootId(),
  selectedIds: store.selection().selectedIds,
  onSelect: (nodeId) => {
    store.dispatch({ type: 'SELECT_NODE', payload: { nodeId } });
  },
  onDelete: (nodeId) => {
    store.dispatch({ type: 'DELETE_NODE', payload: { nodeId } });
  },
});
```

### ResponsivePreview

Preview designs on different device sizes.

```typescript
import {
  ResponsivePreview,
  DeviceSelector,
  devicePresets,
  createResponsiveController,
  type ResponsivePreviewProps,
} from '@philjs/builder/preview';

interface ResponsivePreviewProps {
  children?: unknown;
  deviceId?: string;
  customWidth?: number;
  customHeight?: number;
  onDeviceChange?: (device: DevicePreset) => void;
  showFrame?: boolean;
  showToolbar?: boolean;
  scale?: number;
  className?: string;
}

// Create controller for programmatic control
const controller = createResponsiveController();
controller.setDevice('iphone-14');

const preview = ResponsivePreview({
  deviceId: 'iphone-14',
  showFrame: true,
  showToolbar: true,
  onDeviceChange: (device) => {
    console.log('Device changed:', device.name);
  },
});
```

## Usage Examples

### Creating a Builder Store

The builder store manages all state using PhilJS signals.

```typescript
import { createBuilderStore, type BuilderStore } from '@philjs/builder';

// Create with default state
const store = createBuilderStore();

// Create with initial state
const store = createBuilderStore({
  document: {
    id: 'my-design',
    name: 'My Design',
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  canvas: {
    width: 1440,
    height: 900,
    backgroundColor: '#f8fafc',
    grid: {
      enabled: true,
      size: 8,
      snapToGrid: true,
      showGuides: true,
      color: '#e0e0e0',
    },
    rulers: true,
    zoom: { min: 0.1, max: 4, step: 0.1 },
  },
});

// Access state with signals
const nodes = store.nodes();           // Current nodes
const selection = store.selection();   // Selection state
const viewport = store.viewport();     // Zoom and pan

// Use computed values
const selectedNodes = store.selectedNodes();
const canUndo = store.canUndo();
const canRedo = store.canRedo();

// Dispatch actions
store.dispatch({
  type: 'ADD_NODE',
  payload: {
    node: {
      id: 'button-1',
      type: 'Button',
      name: 'Submit Button',
      props: { label: 'Submit' },
      styles: { padding: { value: 12, unit: 'px' } },
      children: [],
      parentId: 'root',
      events: [],
    },
    parentId: 'root',
  },
});
```

### Setting Up the VisualBuilder

Complete setup with all features enabled:

```typescript
import {
  createBuilderStore,
  VisualBuilder,
  Canvas,
  Palette,
  PropertyPanel,
  ComponentTree,
  ResponsivePreview,
  builtInComponents,
  builtInCategories,
  philjsUIComponents,
  philjsUICategories,
} from '@philjs/builder';

// Create store
const store = createBuilderStore();

// Register all components
[...builtInComponents, ...philjsUIComponents].forEach((component) => {
  store.dispatch({ type: 'REGISTER_COMPONENT', payload: component });
});

// Subscribe to events
store.on('node:added', ({ node }) => {
  console.log('Node added:', node.name);
});

store.on('selection:changed', ({ selectedIds }) => {
  console.log('Selected:', selectedIds);
});

store.on('history:changed', ({ canUndo, canRedo }) => {
  console.log('History:', { canUndo, canRedo });
});

// Create the builder UI
const builder = VisualBuilder({
  nodes: store.nodes(),
  rootId: store.rootId(),
  showPalette: true,
  showInspector: true,
  showLayers: true,
  theme: 'auto',
  onNodesChange: (nodes) => {
    // Auto-save to localStorage
    localStorage.setItem('builder-nodes', JSON.stringify(nodes));
  },
});

document.getElementById('builder-container')?.appendChild(builder);
```

### Registering Custom Components

Add your own components to the palette:

```typescript
import { type ComponentDefinition } from '@philjs/builder';

const customComponents: ComponentDefinition[] = [
  {
    type: 'CustomCard',
    name: 'Custom Card',
    description: 'A branded card component',
    category: 'custom',
    icon: 'credit-card',
    props: [
      { name: 'title', type: 'string', required: true },
      { name: 'subtitle', type: 'string' },
      { name: 'variant', type: 'enum', enumValues: ['default', 'featured', 'minimal'] },
      { name: 'elevation', type: 'enum', enumValues: ['none', 'sm', 'md', 'lg'] },
    ],
    defaultStyles: {
      backgroundColor: '#ffffff',
      borderRadius: { value: 12, unit: 'px' },
      padding: { value: 16, unit: 'px' },
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    isContainer: true,
    canHaveChildren: true,
  },
  {
    type: 'PricingTable',
    name: 'Pricing Table',
    description: 'A pricing comparison table',
    category: 'custom',
    icon: 'table',
    props: [
      { name: 'plans', type: 'array', required: true },
      { name: 'showAnnual', type: 'boolean', defaultValue: true },
      { name: 'highlightPlan', type: 'string' },
    ],
    canHaveChildren: false,
  },
];

// Register with the store
customComponents.forEach((component) => {
  store.dispatch({ type: 'REGISTER_COMPONENT', payload: component });
});

// Add a custom category
store.categories.set([
  ...store.categories(),
  { id: 'custom', name: 'Custom Components', icon: 'star', order: 100 },
]);
```

### Generating Code from Designs

Export your visual design as code:

```typescript
import {
  generateCode,
  generateJSXString,
  generateInlineCSS,
  generateCSSClass,
  exportAsJSON,
  type CodeGeneratorOptions,
} from '@philjs/builder/serialization';

// Get current design
const nodes = store.nodes();
const rootId = store.rootId();

// Generate TSX component
const tsxCode = generateCode(nodes, rootId, {
  format: 'tsx',
  indent: '  ',
  quotes: 'single',
  semicolons: true,
  componentImports: true,
  styleFormat: 'object',
  signalBindings: true,
  componentName: 'MyComponent',
  exportType: 'default',
});

console.log(tsxCode.code);
// Output:
// import { signal, memo } from '@philjs/core';
// import { Button, Card } from '@philjs/ui';
//
// interface MyComponentProps {
//   // Add your props here
// }
//
// export default function MyComponent(props: MyComponentProps) {
//   return (
//     <div style={{ display: 'flex', flexDirection: 'column' }}>
//       <Card style={{ padding: '16px' }}>
//         <Button variant="primary">Click me</Button>
//       </Card>
//     </div>
//   );
// }

// Generate with Tailwind classes
const tailwindCode = generateCode(nodes, rootId, {
  format: 'jsx',
  styleFormat: 'tailwind',
  componentName: 'LandingPage',
});

// Generate just the JSX without wrapper
const jsxString = generateJSXString(nodes, rootId, {
  styleFormat: 'inline',
});

// Generate CSS
const inlineCSS = generateInlineCSS(nodes[rootId].styles);
// "display: flex; flex-direction: column; padding: 16px;"

const cssClass = generateCSSClass('my-component', nodes[rootId].styles);
// ".my-component {
//   display: flex;
//   flex-direction: column;
//   padding: 16px;
// }"

// Export as JSON for saving
const jsonExport = exportAsJSON(nodes, rootId, {
  projectName: 'My Design',
  author: 'Developer',
});
```

### Using Templates

Work with design templates:

```typescript
import {
  createTemplateManager,
  applyTemplate,
  builtInTemplates,
  defaultCategories as templateCategories,
  type Template,
  type TemplateManager,
} from '@philjs/builder/serialization';

// Create template manager with localStorage persistence
const templateManager = createTemplateManager({
  storage: 'localStorage',
  storageKey: 'my-app-templates',
  onSave: (template) => {
    console.log('Template saved:', template.name);
  },
});

// Access templates via signals
const templates = templateManager.templates();
const categories = templateManager.categories();

// Get templates by category
const heroTemplates = templateManager.getTemplatesByCategory('hero');
const formTemplates = templateManager.getTemplatesByCategory('forms');

// Search templates
const results = templateManager.searchTemplates('login');

// Load a built-in template
const loginTemplate = templateManager.loadTemplate('template_form_login');

// Apply template to create nodes
if (loginTemplate) {
  const { nodes: templateNodes, rootId: templateRootId } = applyTemplate(loginTemplate);

  // Add to current document
  store.dispatch({
    type: 'ADD_NODE',
    payload: {
      node: templateNodes[templateRootId],
      parentId: store.rootId(),
    },
  });

  // Add all child nodes
  Object.values(templateNodes).forEach((node) => {
    if (node.id !== templateRootId) {
      store.dispatch({
        type: 'ADD_NODE',
        payload: { node, parentId: node.parentId! },
      });
    }
  });
}

// Save current design as template
async function saveAsTemplate(name: string, category: string) {
  const template = await templateManager.saveTemplate({
    name,
    category,
    description: 'Custom template',
    tags: ['custom'],
    nodes: store.nodes(),
    rootId: store.rootId(),
  });

  console.log('Saved template:', template.id);
  return template;
}

// Export/import templates
const exported = templateManager.exportTemplate('template_hero_centered');
const imported = templateManager.importTemplate(exported);

// Duplicate a template
const duplicate = templateManager.duplicateTemplate('template_card_basic', 'My Card Copy');
```

## API Reference

### State Management

#### `createBuilderStore(initialState?)`

Creates a new builder store with reactive signals.

```typescript
function createBuilderStore(initialState?: Partial<BuilderState>): BuilderStore;

interface BuilderStore {
  // State signals
  document: Signal<DocumentMetadata>;
  nodes: Signal<Record<NodeId, ComponentNode>>;
  rootId: Signal<NodeId>;
  selection: Signal<SelectionState>;
  drag: Signal<DragState>;
  resize: Signal<ResizeState>;
  viewport: Signal<ViewportState>;
  canvas: Signal<CanvasSettings>;
  components: Signal<Record<string, ComponentDefinition>>;
  categories: Signal<ComponentCategory[]>;
  ui: Signal<UIState>;
  preview: Signal<PreviewState>;
  clipboard: Signal<ComponentNode[]>;

  // History
  history: HistoryManager;

  // Computed
  selectedNodes: Memo<ComponentNode[]>;
  canUndo: Memo<boolean>;
  canRedo: Memo<boolean>;

  // Actions
  dispatch: (action: BuilderAction) => void;
  getState: () => BuilderState;

  // Node operations
  getNode: (id: NodeId) => ComponentNode | undefined;
  getChildren: (id: NodeId) => ComponentNode[];
  getParent: (id: NodeId) => ComponentNode | undefined;
  getAncestors: (id: NodeId) => ComponentNode[];
  getDescendants: (id: NodeId) => ComponentNode[];

  // Events
  on: <K extends keyof BuilderEvents>(
    event: K,
    listener: BuilderEventListener<K>
  ) => () => void;
  emit: <K extends keyof BuilderEvents>(event: K, payload: BuilderEvents[K]) => void;

  // Cleanup
  dispose: () => void;
}
```

#### Builder Actions

```typescript
type BuilderAction =
  // Node operations
  | { type: 'ADD_NODE'; payload: { node: ComponentNode; parentId: NodeId; index?: number } }
  | { type: 'DELETE_NODE'; payload: { nodeId: NodeId } }
  | { type: 'DELETE_NODES'; payload: { nodeIds: NodeId[] } }
  | { type: 'MOVE_NODE'; payload: { nodeId: NodeId; newParentId: NodeId; index?: number } }
  | { type: 'UPDATE_NODE_PROPS'; payload: { nodeId: NodeId; props: Partial<Record<string, PropValue>> } }
  | { type: 'UPDATE_NODE_STYLES'; payload: { nodeId: NodeId; styles: Partial<NodeStyles> } }
  | { type: 'UPDATE_NODE_NAME'; payload: { nodeId: NodeId; name: string } }
  | { type: 'DUPLICATE_NODE'; payload: { nodeId: NodeId } }
  | { type: 'DUPLICATE_NODES'; payload: { nodeIds: NodeId[] } }
  | { type: 'COPY_NODES'; payload: { nodeIds: NodeId[] } }
  | { type: 'PASTE_NODES'; payload: { parentId: NodeId; index?: number } }

  // Selection
  | { type: 'SELECT_NODE'; payload: { nodeId: NodeId; addToSelection?: boolean } }
  | { type: 'SELECT_NODES'; payload: { nodeIds: NodeId[] } }
  | { type: 'DESELECT_NODE'; payload: { nodeId: NodeId } }
  | { type: 'DESELECT_ALL' }
  | { type: 'HOVER_NODE'; payload: { nodeId: NodeId | null } }
  | { type: 'FOCUS_NODE'; payload: { nodeId: NodeId | null } }

  // Drag and drop
  | { type: 'START_DRAG'; payload: DragSource }
  | { type: 'UPDATE_DRAG'; payload: { position: { x: number; y: number }; target?: DropTarget } }
  | { type: 'END_DRAG' }
  | { type: 'CANCEL_DRAG' }

  // Resize
  | { type: 'START_RESIZE'; payload: { handle: ResizeHandle; bounds: BoundingBox } }
  | { type: 'UPDATE_RESIZE'; payload: { bounds: BoundingBox } }
  | { type: 'END_RESIZE' }
  | { type: 'CANCEL_RESIZE' }

  // Viewport
  | { type: 'SET_ZOOM'; payload: { zoom: number } }
  | { type: 'SET_PAN'; payload: { x: number; y: number } }
  | { type: 'FIT_TO_SCREEN' }
  | { type: 'UPDATE_CANVAS_SETTINGS'; payload: Partial<CanvasSettings> }
  | { type: 'SET_VIEWPORT_MODE'; payload: ViewportMode }

  // Components
  | { type: 'REGISTER_COMPONENT'; payload: ComponentDefinition }
  | { type: 'UNREGISTER_COMPONENT'; payload: { type: ComponentType } }

  // UI
  | { type: 'UPDATE_UI'; payload: Partial<UIState> }
  | { type: 'UPDATE_PREVIEW'; payload: Partial<PreviewState> }

  // Document
  | { type: 'LOAD_DOCUMENT'; payload: { document: DocumentMetadata; nodes: Record<NodeId, ComponentNode>; rootId: NodeId } }
  | { type: 'NEW_DOCUMENT'; payload?: { name?: string } }

  // History
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'BATCH'; payload: { actions: BuilderAction[] } };
```

#### `createHistoryManager(options?)`

Creates a history manager for undo/redo functionality.

```typescript
function createHistoryManager(options?: HistoryManagerOptions): HistoryManager;

interface HistoryManagerOptions {
  maxEntries?: number;        // default: 100
  onUndo?: (entry: HistoryEntry) => void;
  onRedo?: (entry: HistoryEntry) => void;
  onChange?: (state: HistoryState) => void;
  debounceTime?: number;      // default: 300ms
}

interface HistoryManager {
  push: (entry: HistoryEntry) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getState: () => HistoryState;
  getEntries: () => HistoryEntry[];
  getCurrentIndex: () => number;
  goTo: (index: number) => void;
  clear: () => void;
  startTransaction: (description: string) => void;
  endTransaction: () => void;
  cancelTransaction: () => void;
  isInTransaction: () => boolean;
  getSummary: () => string[];
}
```

### Canvas Components

#### Grid System

```typescript
import {
  GridSystem,
  GridPattern,
  SmartGuides,
  DistanceIndicator,
  createGridSystemController,
  snapToGrid,
  shouldSnap,
  calculateSnap,
} from '@philjs/builder/canvas';

// Create controller
const gridController = createGridSystemController({
  gridSize: 8,
  snapThreshold: 4,
  enabled: true,
});

gridController.setGridSize(16);
gridController.setSnapThreshold(8);
gridController.enable();
gridController.disable();

const result = gridController.snapToGrid(105, 203);
// { x: 104, y: 200, snapped: true, guides: [...] }

// Direct utility functions
const snapped = snapToGrid(105, 203, 8);
// { x: 104, y: 200 }

const willSnap = shouldSnap(105, 8, 4);
// true (105 is within 4px of 104)
```

#### Drag and Drop

```typescript
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropIndicator,
  DragPreview,
} from '@philjs/builder/canvas';

const context = DragDropContext({
  onDragStart: (id) => console.log('Started:', id),
  onDragEnd: (id) => console.log('Ended:', id),
  onDrop: (source, target) => console.log('Dropped:', source, 'onto', target),
});

const draggable = Draggable({
  id: 'component-1',
  disabled: false,
});

const droppable = Droppable({
  id: 'container-1',
  accept: ['Button', 'Input', 'Text'],
});
```

#### Selection

```typescript
import {
  SelectionBox,
  HoverHighlight,
  MarqueeSelection,
  SelectionOverlay,
  SelectionManager,
} from '@philjs/builder/canvas';

const selectionManager = SelectionManager({
  multiSelect: true,
  onSelectionChange: (ids) => {
    console.log('Selected IDs:', ids);
  },
});
```

### Code Generation

```typescript
import {
  generateCode,
  generateJSXString,
  generateInlineCSS,
  generateCSSClass,
  exportAsJSON,
  type GeneratedCode,
  type CodeGeneratorOptions,
} from '@philjs/builder/serialization';

interface CodeGeneratorOptions {
  format: 'jsx' | 'tsx' | 'philjs';
  indent: string;                              // default: '  '
  quotes: 'single' | 'double';                 // default: 'single'
  semicolons: boolean;                         // default: true
  componentImports: boolean;                   // default: true
  styleFormat: 'inline' | 'object' | 'className' | 'tailwind';
  signalBindings: boolean;                     // default: true
  includeComments: boolean;                    // default: false
  minify: boolean;                             // default: false
  componentName?: string;                      // default: 'GeneratedComponent'
  exportType?: 'default' | 'named' | 'none';   // default: 'default'
  wrapInFunction?: boolean;                    // default: true
  addPropsInterface?: boolean;                 // default: true
}

interface GeneratedCode {
  code: string;
  imports: string[];
  filename?: string;
  language: 'jsx' | 'tsx' | 'philjs';
}
```

### Template System

```typescript
import {
  createTemplateManager,
  applyTemplate,
  builtInTemplates,
  defaultCategories,
  type Template,
  type TemplateCategory,
  type TemplateManager,
} from '@philjs/builder/serialization';

interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  thumbnail?: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  author?: string;
  tags: string[];
  nodes: Record<NodeId, ComponentNode>;
  rootId: NodeId;
  metadata?: Record<string, any>;
}

interface TemplateManager {
  templates: Signal<Template[]>;
  categories: Signal<TemplateCategory[]>;
  saveTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => Promise<Template>;
  loadTemplate: (templateId: string) => Template | undefined;
  deleteTemplate: (templateId: string) => void;
  updateTemplate: (templateId: string, updates: Partial<Template>) => Template | undefined;
  duplicateTemplate: (templateId: string, newName?: string) => Template | undefined;
  exportTemplate: (templateId: string) => string;
  importTemplate: (json: string) => Template | undefined;
  getTemplatesByCategory: (categoryId: string) => Template[];
  searchTemplates: (query: string) => Template[];
  addCategory: (category: TemplateCategory) => void;
  removeCategory: (categoryId: string) => void;
  clearAllTemplates: () => void;
}
```

### Preview Components

```typescript
import {
  ResponsivePreview,
  DeviceFrame,
  DeviceSelector,
  PreviewToolbar,
  createResponsiveController,
  devicePresets,
  getDevicesByCategory,
  getDeviceById,
  type DevicePreset,
} from '@philjs/builder/preview';

interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  category: 'mobile' | 'tablet' | 'desktop' | 'tv';
  userAgent?: string;
  pixelRatio?: number;
}

// Available device presets
const mobileDevices = getDevicesByCategory('mobile');
// [iPhone SE, iPhone 14, iPhone 14 Pro Max, Pixel 7, Galaxy S23]

const tabletDevices = getDevicesByCategory('tablet');
// [iPad Mini, iPad Air, iPad Pro 11", iPad Pro 12.9", Surface Pro]

const desktopDevices = getDevicesByCategory('desktop');
// [Laptop, Desktop HD, Desktop 2K, Desktop 4K]
```

## Integration with PhilJS UI

The builder seamlessly integrates with `@philjs/ui` components:

```typescript
import {
  philjsUIComponents,
  philjsUICategories,
  getPhilJSUIComponent,
  getPhilJSUIComponentsByCategory,
  registerPhilJSUIComponents,
} from '@philjs/builder';

// Get PhilJS UI components for the palette
const layoutComponents = getPhilJSUIComponentsByCategory('philjs-layout');
// [PhilJS.Box, PhilJS.Flex, PhilJS.Grid]

const formComponents = getPhilJSUIComponentsByCategory('philjs-forms');
// [PhilJS.Button, PhilJS.Input]

// Get a specific component definition
const buttonDef = getPhilJSUIComponent('PhilJS.Button');
// {
//   type: 'PhilJS.Button',
//   name: 'Button',
//   category: 'philjs-forms',
//   props: [{ name: 'variant', type: 'enum', ... }],
//   ...
// }

// Register all PhilJS UI components with a store
registerPhilJSUIComponents((component) => {
  store.dispatch({ type: 'REGISTER_COMPONENT', payload: component });
});
```

## Type Definitions

### Core Types

```typescript
// Node identifier
type NodeId = string;

// Component type identifier
type ComponentType = string;

// Property value types
type PropValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | PropValue[]
  | { [key: string]: PropValue }
  | BindingExpression;

// Expression for data binding
interface BindingExpression {
  type: 'binding';
  expression: string;
  mode: 'one-way' | 'two-way';
}

// Style value with unit
interface StyleValue {
  value: string | number;
  unit?: 'px' | 'em' | 'rem' | '%' | 'vh' | 'vw' | 'auto' | 'none';
}

// Complete node styles
interface NodeStyles {
  // Layout
  display?: string;
  position?: string;
  top?: StyleValue;
  right?: StyleValue;
  bottom?: StyleValue;
  left?: StyleValue;
  width?: StyleValue;
  height?: StyleValue;

  // Flexbox
  flexDirection?: string;
  flexWrap?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: StyleValue;

  // Grid
  gridTemplateColumns?: string;
  gridTemplateRows?: string;

  // Spacing
  margin?: StyleValue;
  padding?: StyleValue;

  // Typography
  fontFamily?: string;
  fontSize?: StyleValue;
  fontWeight?: string | number;
  color?: string;
  textAlign?: string;

  // Background
  backgroundColor?: string;
  backgroundImage?: string;

  // Border
  border?: string;
  borderRadius?: StyleValue;

  // Effects
  opacity?: number;
  boxShadow?: string;
  transform?: string;

  // Custom
  [key: string]: StyleValue | string | number | undefined;
}

// Component node in the tree
interface ComponentNode {
  id: NodeId;
  type: ComponentType;
  name?: string;
  props: Record<string, PropValue>;
  styles: NodeStyles;
  children: NodeId[];
  parentId: NodeId | null;
  events: EventHandler[];
  isLocked?: boolean;
  isHidden?: boolean;
  constraints?: LayoutConstraints;
  metadata?: NodeMetadata;
}

// Component definition for the palette
interface ComponentDefinition {
  type: ComponentType;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  props: PropDefinition[];
  defaultStyles?: NodeStyles;
  defaultChildren?: ComponentNode[];
  canHaveChildren?: boolean;
  allowedChildren?: ComponentType[];
  allowedParents?: ComponentType[];
  isContainer?: boolean;
}
```

## Best Practices

1. **Use transactions for complex operations**: Group related changes to enable single undo/redo.

```typescript
store.history.startTransaction('Rearrange layout');
try {
  store.dispatch({ type: 'MOVE_NODE', payload: { nodeId: 'a', newParentId: 'container' } });
  store.dispatch({ type: 'MOVE_NODE', payload: { nodeId: 'b', newParentId: 'container' } });
  store.dispatch({ type: 'UPDATE_NODE_STYLES', payload: { nodeId: 'container', styles: { gap: { value: 16, unit: 'px' } } } });
  store.history.endTransaction();
} catch (e) {
  store.history.cancelTransaction();
}
```

2. **Subscribe to events for reactivity**: Use the event system instead of polling.

```typescript
const unsubscribe = store.on('selection:changed', ({ selectedIds }) => {
  updatePropertyPanel(selectedIds);
});

// Cleanup when done
unsubscribe();
```

3. **Use batch actions for performance**: Combine multiple actions when possible.

```typescript
store.dispatch({
  type: 'BATCH',
  payload: {
    actions: [
      { type: 'DELETE_NODE', payload: { nodeId: 'old-1' } },
      { type: 'DELETE_NODE', payload: { nodeId: 'old-2' } },
      { type: 'ADD_NODE', payload: { node: newNode, parentId: 'root' } },
    ],
  },
});
```

4. **Clean up resources**: Call `dispose()` when unmounting the builder.

```typescript
// When done with the builder
store.dispose();
```

## License

MIT
