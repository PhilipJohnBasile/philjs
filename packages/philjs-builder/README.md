# @philjs/builder

A visual UI component builder and editor for React applications. Enables drag-and-drop component composition with real-time preview and code generation.

## Installation

```bash
npm install @philjs/builder
# or
yarn add @philjs/builder
# or
pnpm add @philjs/builder
```

## Basic Usage

```tsx
import { Builder, ComponentPalette, Canvas } from '@philjs/builder';

function App() {
  const handleSave = (components) => {
    console.log('Saved components:', components);
  };

  return (
    <Builder onSave={handleSave}>
      <ComponentPalette />
      <Canvas />
    </Builder>
  );
}
```

## Features

- **Visual Editor** - Drag-and-drop interface for building UI components
- **Component Palette** - Pre-built component library with customizable elements
- **Real-time Preview** - Instant visual feedback as you build
- **Code Generation** - Export to React/TypeScript code
- **Serialization** - Save and load component configurations
- **Template System** - Built-in templates for common UI patterns
- **Undo/Redo** - Full history management for editing operations
- **Responsive Design** - Preview components at different breakpoints
- **Custom Components** - Register your own components in the palette
- **Props Editor** - Visual interface for editing component properties

## API Reference

### Builder

Main container component that provides context for the editor.

### Canvas

The editable area where components are placed and arranged.

### ComponentPalette

Sidebar displaying available components for drag-and-drop.

### useBuilder

Hook for accessing builder state and actions programmatically.

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./builder, ./canvas, ./components, ./serialization, ./state, ./preview
- Source files: packages/philjs-builder/src/index.ts, packages/philjs-builder/src/builder/index.ts, packages/philjs-builder/src/canvas/index.ts, packages/philjs-builder/src/components/index.ts, packages/philjs-builder/src/serialization/index.ts, packages/philjs-builder/src/state/index.ts, packages/philjs-builder/src/preview/index.ts

### Public API
- Direct exports: (none detected)
- Re-exported names: // Builder state types
  DocumentMetadata, // Canvas types
  ViewportState, // Code generator
  generateCode, // Component definition types
  PropDefinition, // Component library
  allComponents, // Component tree
  ComponentTree, // Drag and drop
  DragDropContext, // Drag and drop types
  DragOperation, // Event types
  BuilderEvents, // Grid system
  GridSystem, // History
  createHistoryManager, // History types
  HistoryActionType, // Inspector
  Inspector, // Main canvas
  Canvas, // Node types
  NodeId, // Palette
  Palette, // Preview types
  PreviewMessage, // Property panel
  PropertyPanel, // Resize
  ResizeHandles, // Resize types
  ResizeHandle, // Selection
  SelectionBox, // Selection types
  BoundingBox, // Serialization types
  SerializedDocument, // Store
  createBuilderStore, // Template system
  createTemplateManager, // Viewport mode
  ViewportMode, AlignmentLine, BindingExpression, BuilderAction, BuilderEventListener, BuilderState, BuilderStore, BuilderUIState, Canvas, CanvasGrid, CanvasGridProps, CanvasNode, CanvasNodeProps, CanvasProps, CanvasRulers, CanvasRulersProps, CanvasSettings, CanvasState, CodeGeneratorOptions, CodegenOptions, ComponentCategory, ComponentDefinition, ComponentNode, ComponentTree, ComponentTreeProps, ComponentType, DeviceFrame, DeviceFrameProps, DevicePreset, DeviceSelector, DeviceSelectorProps, DistanceIndicator, DistanceIndicatorProps, DragDropContext, DragDropContextProps, DragPreview, DragPreviewProps, DragSource, DragState, Draggable, DraggableProps, DropIndicator, DropIndicatorProps, DropTarget, Droppable, DroppableProps, EventEditor, EventEditorProps, EventHandler, GeneratedCode, GridPattern, GridPatternProps, GridSettings, GridSystem, GridSystemController, GridSystemOptions, GridSystemProps, HistoryEntry, HistoryManager, HistoryManagerOptions, HistoryState, HoverHighlight, HoverHighlightProps, ImportOptions, Inspector, InspectorProps, KeyboardResizeOptions, LayoutConstraints, MarqueeSelection, MarqueeSelectionProps, NodeMetadata, NodeStyles, Palette, PaletteCategory, PaletteCategoryProps, PaletteItem, PaletteItemProps, PaletteProps, PreviewCallback, PreviewFrameProps, PreviewToolbar, PreviewToolbarProps, PropValue, PropertyEditor, PropertyEditorProps, PropertyGroup, PropertyGroupProps, PropertyPanel, PropertyPanelProps, ResizeHandles, ResizeHandlesProps, ResizeManager, ResizeManagerProps, ResizePreview, ResizePreviewProps, ResizeState, ResponsiveController, ResponsivePreview, ResponsivePreviewProps, SelectionBox, SelectionBoxProps, SelectionManager, SelectionManagerProps, SelectionOverlay, SelectionOverlayProps, SelectionState, SmartGuides, SmartGuidesProps, SnapGuide, SnapResult, StyleEditor, StyleEditorProps, StyleValue, Template, TemplateCategory, TemplateManager, TemplateManagerOptions, TreeNodeProps, TreeState, VisualBuilder, VisualBuilderProps, additionalBuiltInTemplates, allComponents, applyTemplate, blogArticle, builtInCategories, builtInComponents, builtInTemplates, calculateSnap, componentCategories, createBuilderStore, createGridSystemController, createHistoryKeyboardHandler, createHistoryManager, createResponsiveController, createTemplateManager, dashboardSidebar, defaultCategories, defaultTemplateCategories, devicePresets, exportAsJSON, faqSection, generateCSSClass, generateCode, generateId, generateInlineCSS, generateJSXString, getBuilderStore, getComponentDefinition, getComponentsByCategory, getDeviceById, getDevicesByCategory, getPhilJSUIComponent, getPhilJSUIComponentsByCategory, landingPageSimple, loginForm, navigationHeader, philjsUICategories, philjsUIComponents, pricingTable, productGrid, registerBuiltInComponents, registerPhilJSUIComponents, resetBuilderStore, shouldSnap, snapToGrid, testimonials, useKeyboardResize, withHistory
- Re-exported modules: ./BuiltInTemplates.js, ./Canvas.js, ./CodeGenerator.js, ./ComponentLibrary.js, ./ComponentTree.js, ./DragDrop.js, ./GridSystem.js, ./Inspector.js, ./Palette.js, ./PhilJSUIComponents.js, ./PropertyPanel.js, ./Resize.js, ./ResponsivePreview.js, ./Selection.js, ./TemplateSystem.js, ./VisualBuilder.js, ./builder/index.js, ./canvas/index.js, ./components/PhilJSUIComponents.js, ./components/index.js, ./history.js, ./preview/index.js, ./serialization/index.js, ./state/history.js, ./state/store.js, ./store.js, ./types.js
<!-- API_SNAPSHOT_END -->

## License

MIT
