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
// State Management
// ============================================================================
export { 
// Store
createBuilderStore, getBuilderStore, resetBuilderStore, generateId, } from './state/store.js';
export { 
// History
createHistoryManager, } from './state/history.js';
// ============================================================================
// Canvas Components
// ============================================================================
export { 
// Main canvas
Canvas, CanvasGrid, CanvasRulers, CanvasNode, 
// Drag and drop
DragDropContext, Draggable, Droppable, DropIndicator, DragPreview, 
// Selection
SelectionBox, HoverHighlight, MarqueeSelection, SelectionOverlay, SelectionManager, 
// Resize
ResizeHandles, ResizePreview, ResizeManager, useKeyboardResize, 
// Grid system
GridSystem, GridPattern, SmartGuides, DistanceIndicator, createGridSystemController, snapToGrid, shouldSnap, calculateSnap, } from './canvas/index.js';
// ============================================================================
// UI Components
// ============================================================================
export { 
// Palette
Palette, PaletteItem, PaletteCategory, builtInComponents, builtInCategories, 
// Inspector
Inspector, PropertyEditor, StyleEditor, EventEditor, 
// Component library
allComponents, componentCategories, getComponentDefinition, getComponentsByCategory, registerBuiltInComponents, 
// Property panel
PropertyPanel, PropertyGroup, 
// Component tree
ComponentTree, } from './components/index.js';
// ============================================================================
// Serialization & Code Generation
// ============================================================================
export { 
// Code generator
generateCode, generateJSXString, generateInlineCSS, generateCSSClass, exportAsJSON, 
// Template system
createTemplateManager, applyTemplate, defaultCategories as defaultTemplateCategories, builtInTemplates, } from './serialization/index.js';
// ============================================================================
// Preview Components
// ============================================================================
export { ResponsivePreview, DeviceFrame, DeviceSelector, PreviewToolbar, createResponsiveController, devicePresets, getDevicesByCategory, getDeviceById, } from './preview/index.js';
// ============================================================================
// Visual Builder Application
// ============================================================================
export { VisualBuilder, } from './builder/index.js';
// ============================================================================
// PhilJS UI Components Integration
// ============================================================================
export { philjsUIComponents, philjsUICategories, getPhilJSUIComponent, getPhilJSUIComponentsByCategory, registerPhilJSUIComponents, } from './components/PhilJSUIComponents.js';
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
//# sourceMappingURL=index.js.map