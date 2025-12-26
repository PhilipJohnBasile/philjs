// @ts-nocheck
// ============================================================================
// philjs-studio
// Visual component builder with drag-and-drop UI
// ============================================================================

// Editor Components
export { Canvas } from './editor/Canvas';
export type { CanvasProps } from './editor/Canvas';

export { ComponentPalette } from './editor/ComponentPalette';
export type {
  ComponentPaletteProps,
  ComponentDefinition,
  ComponentCategory,
} from './editor/ComponentPalette';

export { PropertyPanel } from './editor/PropertyPanel';
export type { PropertyPanelProps } from './editor/PropertyPanel';

export { LayerTree } from './editor/LayerTree';
export type { LayerTreeProps } from './editor/LayerTree';

export { CodePreview } from './editor/CodePreview';
export type { CodePreviewProps } from './editor/CodePreview';

// Draggable Components
export { DraggableComponent, DropZone } from './components/DraggableComponent';
export type { DraggableComponentProps, DropZoneProps } from './components/DraggableComponent';

export { ResizeHandles, RotationHandle } from './components/ResizeHandles';
export type {
  ResizeHandlesProps,
  RotationHandleProps,
  ResizeDirection,
} from './components/ResizeHandles';

export {
  SelectionBox,
  MultiSelectionBox,
  MarqueeSelection,
} from './components/SelectionBox';
export type {
  SelectionBoxProps,
  MultiSelectionBoxProps,
  MarqueeSelectionProps,
} from './components/SelectionBox';

// State Management
export {
  useEditorStore,
  useComponent,
  useSelectedComponents,
  useIsSelected,
  useIsHovered,
  useCanvas,
  useEditorActions,
  // Selectors
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
} from './state/EditorStore';

export type {
  Position,
  Size,
  Bounds,
  SpacingValue,
  TypographyStyle,
  ComponentStyle,
  ResponsiveStyles,
  EventHandler,
  ComponentNode,
  CanvasState,
  SelectionState,
  HistoryEntry,
  ClipboardData,
  Breakpoint,
  EditorState,
  EditorActions,
} from './state/EditorStore';

// Serialization - Export
export {
  exportToJSX,
  exportToJSON,
  exportToJSONString,
  exportToFigma,
  exportToFigmaJSON,
  exportDesign,
} from './serialization/export';

export type {
  ExportOptions,
  StudioSchema,
  SerializedComponent,
  FigmaNode,
} from './serialization/export';

// Serialization - Import
export {
  validateSchema,
  importFromJSON,
  importFromFigma,
  importFromFigmaJSON,
  importFromClipboard,
  importFromFile,
  importDesign,
} from './serialization/import';

export type {
  ImportOptions,
  ImportResult,
  ImportFormat,
} from './serialization/import';

// Templates
export {
  templates,
  getTemplateById,
  getTemplatesByCategory,
  cloneTemplateSchema,
} from './templates';

export type {
  Template,
  TemplateCategory,
} from './templates';

// ============================================================================
// Main Studio Component
// ============================================================================

import React from 'react';
import { Canvas } from './editor/Canvas';
import { ComponentPalette } from './editor/ComponentPalette';
import { PropertyPanel } from './editor/PropertyPanel';
import { LayerTree } from './editor/LayerTree';
import { CodePreview } from './editor/CodePreview';

export interface StudioProps {
  /** Initial canvas width */
  canvasWidth?: number;
  /** Initial canvas height */
  canvasHeight?: number;
  /** Show the component palette sidebar */
  showPalette?: boolean;
  /** Show the property panel */
  showPropertyPanel?: boolean;
  /** Show the layer tree */
  showLayerTree?: boolean;
  /** Show the code preview panel */
  showCodePreview?: boolean;
  /** Code preview language */
  codeLanguage?: 'jsx' | 'tsx';
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * Main Studio component that combines all editor panels
 */
export const Studio: React.FC<StudioProps> = ({
  canvasWidth = 1200,
  canvasHeight = 800,
  showPalette = true,
  showPropertyPanel = true,
  showLayerTree = true,
  showCodePreview = false,
  codeLanguage = 'tsx',
  className,
  style,
}) => {
  return (
    <div
      className={`philjs-studio ${className || ''}`}
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        ...style,
      }}
    >
      {/* Left sidebar: Component Palette */}
      {showPalette && <ComponentPalette />}

      {/* Left sidebar: Layer Tree */}
      {showLayerTree && <LayerTree />}

      {/* Main canvas area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Canvas width={canvasWidth} height={canvasHeight} />

        {/* Bottom: Code Preview */}
        {showCodePreview && (
          <div style={{ height: 300, borderTop: '1px solid #E5E7EB' }}>
            <CodePreview language={codeLanguage} />
          </div>
        )}
      </div>

      {/* Right sidebar: Property Panel */}
      {showPropertyPanel && <PropertyPanel />}
    </div>
  );
};

export default Studio;
