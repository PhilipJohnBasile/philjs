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
export type { NodeId, ComponentType, PropValue, BindingExpression, StyleValue, NodeStyles, EventHandler, ComponentNode, LayoutConstraints, NodeMetadata, PropDefinition, ComponentDefinition, ComponentCategory, BoundingBox, SelectionState, DragOperation, DragSource, DropTarget, DragState, ResizeHandle, ResizeState, ViewportState, GridSettings, CanvasSettings, HistoryActionType, HistoryEntry, HistoryState, DocumentMetadata, BuilderState, BuilderAction, SerializedDocument, CodegenOptions, ImportOptions, PreviewMessage, PreviewCallback, BuilderEvents, BuilderEventListener, ViewportMode, } from './types.js';
export { createBuilderStore, getBuilderStore, resetBuilderStore, generateId, type BuilderStore, } from './state/store.js';
export { createHistoryManager, type HistoryManager, type HistoryManagerOptions, } from './state/history.js';
export { Canvas, CanvasGrid, CanvasRulers, CanvasNode, type CanvasProps, type CanvasState, type CanvasGridProps, type CanvasRulersProps, type CanvasNodeProps, DragDropContext, Draggable, Droppable, DropIndicator, DragPreview, type DragDropContextProps, type DraggableProps, type DroppableProps, type DropIndicatorProps, type DragPreviewProps, SelectionBox, HoverHighlight, MarqueeSelection, SelectionOverlay, SelectionManager, type SelectionOverlayProps, type SelectionBoxProps, type MarqueeSelectionProps, type SelectionManagerProps, type HoverHighlightProps, ResizeHandles, ResizePreview, ResizeManager, useKeyboardResize, type ResizeManagerProps, type ResizeHandlesProps, type ResizePreviewProps, type KeyboardResizeOptions, GridSystem, GridPattern, SmartGuides, DistanceIndicator, createGridSystemController, snapToGrid, shouldSnap, calculateSnap, type GridSystemProps, type SnapGuide, type SnapResult, type AlignmentLine, type GridSystemOptions, type GridPatternProps, type SmartGuidesProps, type DistanceIndicatorProps, type GridSystemController, } from './canvas/index.js';
export { Palette, PaletteItem, PaletteCategory, builtInComponents, builtInCategories, type PaletteProps, type PaletteItemProps, type PaletteCategoryProps, Inspector, PropertyEditor, StyleEditor, EventEditor, type InspectorProps, type PropertyEditorProps, type StyleEditorProps, type EventEditorProps, allComponents, componentCategories, getComponentDefinition, getComponentsByCategory, registerBuiltInComponents, PropertyPanel, PropertyGroup, type PropertyPanelProps, type PropertyGroupProps, ComponentTree, type ComponentTreeProps, type TreeNodeProps, type TreeState, } from './components/index.js';
export { generateCode, generateJSXString, generateInlineCSS, generateCSSClass, exportAsJSON, type GeneratedCode, type CodeGeneratorOptions, createTemplateManager, applyTemplate, defaultCategories as defaultTemplateCategories, builtInTemplates, type Template, type TemplateCategory, type TemplateManager, type TemplateManagerOptions, } from './serialization/index.js';
export { ResponsivePreview, DeviceFrame, DeviceSelector, PreviewToolbar, createResponsiveController, devicePresets, getDevicesByCategory, getDeviceById, type DevicePreset, type ResponsivePreviewProps, type DeviceSelectorProps, type PreviewFrameProps, type ResponsiveController, type DeviceFrameProps, type PreviewToolbarProps, } from './preview/index.js';
export { VisualBuilder, type VisualBuilderProps, type BuilderUIState, } from './builder/index.js';
export { philjsUIComponents, philjsUICategories, getPhilJSUIComponent, getPhilJSUIComponentsByCategory, registerPhilJSUIComponents, } from './components/PhilJSUIComponents.js';
import { createBuilderStore } from './state/store.js';
import { Canvas } from './canvas/index.js';
import { Palette } from './components/index.js';
import { PropertyPanel } from './components/index.js';
import { ComponentTree } from './components/index.js';
import { ResponsivePreview } from './preview/index.js';
import { generateCode } from './serialization/index.js';
import { createTemplateManager } from './serialization/index.js';
import { VisualBuilder } from './builder/index.js';
declare const _default: {
    VisualBuilder: typeof VisualBuilder;
    createBuilderStore: typeof createBuilderStore;
    Canvas: typeof Canvas;
    Palette: typeof Palette;
    PropertyPanel: typeof PropertyPanel;
    ComponentTree: typeof ComponentTree;
    ResponsivePreview: typeof ResponsivePreview;
    generateCode: typeof generateCode;
    createTemplateManager: typeof createTemplateManager;
};
export default _default;
//# sourceMappingURL=index.d.ts.map