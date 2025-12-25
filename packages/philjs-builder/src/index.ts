/**
 * PhilJS Visual Builder
 *
 * A comprehensive visual component builder for creating PhilJS applications
 * with drag-and-drop UI, property editing, and code generation.
 *
 * Features:
 * - Complete drag-and-drop visual component builder
 * - Component palette with all philjs-ui components
 * - Property inspector panel with layout, typography, and effects editors
 * - Live preview pane with responsive device frames
 * - Code export to TSX, JSX, and PhilJS formats
 * - Template system for common layouts
 *
 * @packageDocumentation
 */

// ============================================================================
// Types
// ============================================================================

export type {
  // Node types
  NodeId,
  ComponentType,
  PropValue,
  BindingExpression,
  StyleValue,
  NodeStyles,
  EventHandler,
  ComponentNode,
  LayoutConstraints,
  NodeMetadata,

  // Component definition types
  PropDefinition,
  ComponentDefinition,
  ComponentCategory,

  // Selection types
  BoundingBox,
  SelectionState,

  // Drag and drop types
  DragOperation,
  DragSource,
  DropTarget,
  DragState,

  // Resize types
  ResizeHandle,
  ResizeState,

  // Canvas types
  ViewportState,
  GridSettings,
  CanvasSettings,

  // History types
  HistoryActionType,
  HistoryEntry,
  HistoryState,

  // Builder state types
  DocumentMetadata,
  BuilderState,
  BuilderAction,

  // Serialization types
  SerializedDocument,
  CodegenOptions,
  ImportOptions,

  // Preview types
  PreviewMessage,
  PreviewCallback,

  // Event types
  BuilderEvents,
  BuilderEventListener,

  // Viewport mode
  ViewportMode,
} from './types.js';

// ============================================================================
// State Management
// ============================================================================

export {
  // Store
  createBuilderStore,
  getBuilderStore,
  resetBuilderStore,
  generateId,
  type BuilderStore,
} from './state/store.js';

export {
  // History
  createHistoryManager,
  type HistoryManager,
  type HistoryManagerOptions,
} from './state/history.js';

// ============================================================================
// Canvas Components
// ============================================================================

export {
  // Main canvas
  Canvas,
  CanvasGrid,
  CanvasRulers,
  CanvasNode,
  type CanvasProps,
  type CanvasState,
  type CanvasGridProps,
  type CanvasRulersProps,
  type CanvasNodeProps,

  // Drag and drop
  DragDropContext,
  Draggable,
  Droppable,
  DropIndicator,
  DragPreview,
  type DragDropContextProps,
  type DraggableProps,
  type DroppableProps,
  type DropIndicatorProps,
  type DragPreviewProps,

  // Selection
  SelectionBox,
  HoverHighlight,
  MarqueeSelection,
  SelectionOverlay,
  SelectionManager,
  type SelectionOverlayProps,
  type SelectionBoxProps,
  type MarqueeSelectionProps,
  type SelectionManagerProps,
  type HoverHighlightProps,

  // Resize
  ResizeHandles,
  ResizePreview,
  ResizeManager,
  useKeyboardResize,
  type ResizeManagerProps,
  type ResizeHandlesProps,
  type ResizePreviewProps,
  type KeyboardResizeOptions,

  // Grid system
  GridSystem,
  GridPattern,
  SmartGuides,
  DistanceIndicator,
  createGridSystemController,
  snapToGrid,
  shouldSnap,
  calculateSnap,
  type GridSystemProps,
  type SnapGuide,
  type SnapResult,
  type AlignmentLine,
  type GridSystemOptions,
  type GridPatternProps,
  type SmartGuidesProps,
  type DistanceIndicatorProps,
  type GridSystemController,
} from './canvas/index.js';

// ============================================================================
// UI Components
// ============================================================================

export {
  // Palette
  Palette,
  PaletteItem,
  PaletteCategory,
  builtInComponents,
  builtInCategories,
  type PaletteProps,
  type PaletteItemProps,
  type PaletteCategoryProps,

  // Inspector
  Inspector,
  PropertyEditor,
  StyleEditor,
  EventEditor,
  type InspectorProps,
  type PropertyEditorProps,
  type StyleEditorProps,
  type EventEditorProps,

  // Component library
  allComponents,
  componentCategories,
  getComponentDefinition,
  getComponentsByCategory,
  registerBuiltInComponents,

  // Property panel
  PropertyPanel,
  PropertyGroup,
  type PropertyPanelProps,
  type PropertyGroupProps,

  // Component tree
  ComponentTree,
  type ComponentTreeProps,
  type TreeNodeProps,
  type TreeState,
} from './components/index.js';

// ============================================================================
// Serialization & Code Generation
// ============================================================================

export {
  // Code generator
  generateCode,
  generateJSXString,
  generateInlineCSS,
  generateCSSClass,
  exportAsJSON,
  type GeneratedCode,
  type CodeGeneratorOptions,

  // Template system
  createTemplateManager,
  applyTemplate,
  defaultCategories as defaultTemplateCategories,
  builtInTemplates,
  type Template,
  type TemplateCategory,
  type TemplateManager,
  type TemplateManagerOptions,
} from './serialization/index.js';

// ============================================================================
// Preview Components
// ============================================================================

export {
  ResponsivePreview,
  DeviceFrame,
  DeviceSelector,
  PreviewToolbar,
  createResponsiveController,
  devicePresets,
  getDevicesByCategory,
  getDeviceById,
  type DevicePreset,
  type ResponsivePreviewProps,
  type DeviceSelectorProps,
  type PreviewFrameProps,
  type ResponsiveController,
  type DeviceFrameProps,
  type PreviewToolbarProps,
} from './preview/index.js';

// ============================================================================
// Visual Builder Application
// ============================================================================

export {
  VisualBuilder,
  type VisualBuilderProps,
  type BuilderUIState,
} from './builder/index.js';

// ============================================================================
// PhilJS UI Components Integration
// ============================================================================

export {
  philjsUIComponents,
  philjsUICategories,
  getPhilJSUIComponent,
  getPhilJSUIComponentsByCategory,
  registerPhilJSUIComponents,
} from './components/PhilJSUIComponents.js';

// ============================================================================
// Default Export
// ============================================================================

import { createBuilderStore } from './state/store.js';
import { Canvas } from './canvas/index.js';
import { Palette } from './components/index.js';
import { PropertyPanel } from './components/index.js';
import { ComponentTree } from './components/index.js';
import { ResponsivePreview } from './preview/index.js';
import { generateCode } from './serialization/index.js';
import { createTemplateManager } from './serialization/index.js';
import { VisualBuilder } from './builder/index.js';

export default {
  // Main application component
  VisualBuilder,

  // Core components
  createBuilderStore,
  Canvas,
  Palette,
  PropertyPanel,
  ComponentTree,
  ResponsivePreview,

  // Utilities
  generateCode,
  createTemplateManager,
};
