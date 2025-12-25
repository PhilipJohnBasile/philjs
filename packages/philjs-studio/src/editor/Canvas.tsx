import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { useEditorStore, useCanvas } from '../state/EditorStore';
import { DraggableComponent } from '../components/DraggableComponent';
import { MarqueeSelection, MultiSelectionBox } from '../components/SelectionBox';
import type { ComponentNode, Position, Bounds } from '../state/EditorStore';

// ============================================================================
// Types
// ============================================================================

export interface CanvasProps {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  renderComponent?: (component: ComponentNode) => React.ReactNode;
  onComponentDoubleClick?: (component: ComponentNode) => void;
}

interface MarqueeState {
  isActive: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// ============================================================================
// Component Registry for Rendering
// ============================================================================

const defaultComponentRenderer = (component: ComponentNode): React.ReactNode => {
  const { type, props, styles } = component;
  const baseStyles = styles.base || {};

  const commonStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: (baseStyles.backgroundColor as string) || undefined,
    color: (baseStyles.color as string) || undefined,
    borderRadius: baseStyles.borderRadius as string | number | undefined,
    border: baseStyles.borderWidth
      ? `${baseStyles.borderWidth}px ${baseStyles.borderStyle || 'solid'} ${baseStyles.borderColor || '#ccc'}`
      : undefined,
    padding: typeof baseStyles.padding === 'number' ? baseStyles.padding : undefined,
    fontSize: baseStyles.typography?.fontSize,
    fontWeight: baseStyles.typography?.fontWeight,
    fontFamily: baseStyles.typography?.fontFamily,
    boxShadow: baseStyles.boxShadow as string | undefined,
  };

  switch (type) {
    case 'Button':
      return (
        <button
          style={{
            ...commonStyles,
            backgroundColor: baseStyles.backgroundColor as string || '#3B82F6',
            color: baseStyles.color as string || '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          {(props.children as string) || 'Button'}
        </button>
      );

    case 'Text':
      return (
        <p
          style={{
            ...commonStyles,
            backgroundColor: 'transparent',
            justifyContent: 'flex-start',
          }}
        >
          {(props.children as string) || 'Text'}
        </p>
      );

    case 'Input':
      return (
        <input
          type="text"
          placeholder={(props.placeholder as string) || 'Enter text...'}
          style={{
            ...commonStyles,
            padding: '8px 12px',
            border: '1px solid #D1D5DB',
            borderRadius: 6,
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
          }}
          readOnly
        />
      );

    case 'Container':
      return (
        <div
          style={{
            ...commonStyles,
            backgroundColor: baseStyles.backgroundColor as string || '#F3F4F6',
            border: '1px dashed #D1D5DB',
            borderRadius: 8,
          }}
        >
          {component.children.length === 0 && (
            <span style={{ color: '#9CA3AF', fontSize: 12 }}>Drop components here</span>
          )}
        </div>
      );

    case 'Card':
      return (
        <div
          style={{
            ...commonStyles,
            flexDirection: 'column',
            alignItems: 'stretch',
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: 16,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {(props.title as string) || 'Card Title'}
          </h3>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6B7280' }}>
            Card content goes here
          </p>
        </div>
      );

    case 'Image':
      return (
        <div
          style={{
            ...commonStyles,
            backgroundColor: '#F3F4F6',
            border: '1px dashed #D1D5DB',
            borderRadius: 8,
          }}
        >
          {(props.src as string) ? (
            <img
              src={props.src as string}
              alt={(props.alt as string) || 'Image'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          )}
        </div>
      );

    case 'Heading':
      const level = (props.level as number) || 1;
      const fontSizes: Record<number, number> = { 1: 32, 2: 28, 3: 24, 4: 20, 5: 18, 6: 16 };
      return (
        <div
          style={{
            ...commonStyles,
            justifyContent: 'flex-start',
            fontSize: fontSizes[level] || 24,
            fontWeight: 700,
          }}
        >
          {(props.children as string) || `Heading ${level}`}
        </div>
      );

    case 'Divider':
      return (
        <hr
          style={{
            width: '100%',
            border: 'none',
            borderTop: '1px solid #E5E7EB',
            margin: 0,
          }}
        />
      );

    case 'Spacer':
      return <div style={{ width: '100%', height: '100%' }} />;

    default:
      return (
        <div
          style={{
            ...commonStyles,
            backgroundColor: '#F9FAFB',
            border: '1px dashed #D1D5DB',
            borderRadius: 4,
          }}
        >
          <span style={{ color: '#6B7280', fontSize: 12 }}>{type}</span>
        </div>
      );
  }
};

// ============================================================================
// Canvas Grid
// ============================================================================

interface CanvasGridProps {
  gridSize: number;
  zoom: number;
  showGrid: boolean;
}

const CanvasGrid: React.FC<CanvasGridProps> = ({ gridSize, zoom, showGrid }) => {
  if (!showGrid) return null;

  const scaledGridSize = gridSize * zoom;
  const smallGridOpacity = zoom > 0.5 ? 0.1 : 0;
  const largeGridOpacity = 0.2;
  const largeGridSize = scaledGridSize * 8;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <defs>
        <pattern
          id="smallGrid"
          width={scaledGridSize}
          height={scaledGridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${scaledGridSize} 0 L 0 0 0 ${scaledGridSize}`}
            fill="none"
            stroke="#94A3B8"
            strokeWidth={0.5}
            opacity={smallGridOpacity}
          />
        </pattern>
        <pattern
          id="largeGrid"
          width={largeGridSize}
          height={largeGridSize}
          patternUnits="userSpaceOnUse"
        >
          <rect width={largeGridSize} height={largeGridSize} fill="url(#smallGrid)" />
          <path
            d={`M ${largeGridSize} 0 L 0 0 0 ${largeGridSize}`}
            fill="none"
            stroke="#94A3B8"
            strokeWidth={1}
            opacity={largeGridOpacity}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#largeGrid)" />
    </svg>
  );
};

// ============================================================================
// Zoom Controls
// ============================================================================

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomChange: (zoom: number) => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomChange,
}) => {
  const presets = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

  return (
    <div
      className="zoom-controls"
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: 4,
        backgroundColor: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #E5E7EB',
        zIndex: 100,
      }}
    >
      <button
        onClick={onZoomOut}
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          borderRadius: 4,
        }}
        title="Zoom out"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="#374151">
          <path d="M3 8h10" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <select
        value={zoom}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        style={{
          padding: '4px 8px',
          border: '1px solid #E5E7EB',
          borderRadius: 4,
          fontSize: 12,
          backgroundColor: '#fff',
          cursor: 'pointer',
          minWidth: 70,
        }}
      >
        {presets.map((preset) => (
          <option key={preset} value={preset}>
            {Math.round(preset * 100)}%
          </option>
        ))}
      </select>

      <button
        onClick={onZoomIn}
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          borderRadius: 4,
        }}
        title="Zoom in"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="#374151">
          <path d="M8 3v10M3 8h10" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <div style={{ width: 1, height: 20, backgroundColor: '#E5E7EB', margin: '0 4px' }} />

      <button
        onClick={onZoomReset}
        style={{
          padding: '4px 8px',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          borderRadius: 4,
          fontSize: 12,
          color: '#374151',
        }}
        title="Reset zoom"
      >
        Reset
      </button>
    </div>
  );
};

// ============================================================================
// Main Canvas Component
// ============================================================================

export const Canvas: React.FC<CanvasProps> = ({
  width = 1200,
  height = 800,
  className,
  style,
  renderComponent = defaultComponentRenderer,
  onComponentDoubleClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const canvas = useCanvas();
  const { zoom, pan, gridSize, snapToGrid, showGrid } = canvas;

  const components = useEditorStore((state) => state.components);
  const rootIds = useEditorStore((state) => state.rootIds);
  const selectedIds = useEditorStore((state) => state.selection.selectedIds);
  const isDragging = useEditorStore((state) => state.isDragging);
  const dragSource = useEditorStore((state) => state.dragSource);

  const {
    select,
    selectMultiple,
    clearSelection,
    setZoom,
    setPan,
    zoomIn,
    zoomOut,
    resetZoom,
    addComponent,
    setDragging,
    setDragSource,
  } = useEditorStore();

  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position | null>(null);
  const [initialPan, setInitialPan] = useState<Position | null>(null);

  // Marquee selection state
  const [marquee, setMarquee] = useState<MarqueeState>({
    isActive: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });

  // Get selected bounds for multi-selection box
  const selectedBounds = useMemo(() => {
    return selectedIds
      .map((id) => components[id]?.bounds)
      .filter((bounds): bounds is Bounds => bounds !== undefined);
  }, [selectedIds, components]);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): Position => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };

      const rect = container.getBoundingClientRect();
      return {
        x: (screenX - rect.left - pan.x) / zoom,
        y: (screenY - rect.top - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  // Handle canvas click (deselect)
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || e.target === containerRef.current) {
        clearSelection();
      }
    },
    [clearSelection]
  );

  // Handle mouse down for pan and marquee
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle mouse button or space + left click for pan
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        setInitialPan({ ...pan });
        return;
      }

      // Left click on empty canvas for marquee selection
      if (e.button === 0 && e.target === canvasRef.current) {
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        setMarquee({
          isActive: true,
          startX: canvasPos.x,
          startY: canvasPos.y,
          endX: canvasPos.x,
          endY: canvasPos.y,
        });
      }
    },
    [pan, screenToCanvas]
  );

  // Handle mouse move for pan and marquee
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPanning && panStart && initialPan) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        setPan({ x: initialPan.x + dx, y: initialPan.y + dy });
      }

      if (marquee.isActive) {
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        setMarquee((prev) => ({
          ...prev,
          endX: canvasPos.x,
          endY: canvasPos.y,
        }));
      }
    },
    [isPanning, panStart, initialPan, marquee.isActive, screenToCanvas, setPan]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      setInitialPan(null);
    }

    if (marquee.isActive) {
      // Select all components within marquee
      const minX = Math.min(marquee.startX, marquee.endX);
      const maxX = Math.max(marquee.startX, marquee.endX);
      const minY = Math.min(marquee.startY, marquee.endY);
      const maxY = Math.max(marquee.startY, marquee.endY);

      const selectedInMarquee = Object.values(components).filter((comp) => {
        const { bounds } = comp;
        return (
          bounds.x >= minX &&
          bounds.x + bounds.width <= maxX &&
          bounds.y >= minY &&
          bounds.y + bounds.height <= maxY
        );
      });

      if (selectedInMarquee.length > 0) {
        selectMultiple(selectedInMarquee.map((c) => c.id));
      }

      setMarquee({
        isActive: false,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
      });
    }
  }, [isPanning, marquee, components, selectMultiple]);

  // Handle wheel for zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(4, zoom * delta));

        // Zoom toward cursor position
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          const newPanX = mouseX - ((mouseX - pan.x) / zoom) * newZoom;
          const newPanY = mouseY - ((mouseY - pan.y) / zoom) * newZoom;

          setZoom(newZoom);
          setPan({ x: newPanX, y: newPanY });
        }
      }
    },
    [zoom, pan, setZoom, setPan]
  );

  // Handle drag over for component drops
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle drop for new components
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const componentType = e.dataTransfer.getData('component/type');
      if (componentType) {
        const canvasPos = screenToCanvas(e.clientX, e.clientY);

        // Snap to grid if enabled
        const x = snapToGrid ? Math.round(canvasPos.x / gridSize) * gridSize : canvasPos.x;
        const y = snapToGrid ? Math.round(canvasPos.y / gridSize) * gridSize : canvasPos.y;

        addComponent(componentType, null, { x, y });
      }

      setDragging(false);
      setDragSource(null);
    },
    [screenToCanvas, snapToGrid, gridSize, addComponent, setDragging, setDragSource]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        const deleteComponent = useEditorStore.getState().deleteComponent;
        selectedIds.forEach((id) => deleteComponent(id));
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        clearSelection();
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useEditorStore.getState().redo();
        } else {
          useEditorStore.getState().undo();
        }
      }

      // Copy/Cut/Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        useEditorStore.getState().copy();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        useEditorStore.getState().cut();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        useEditorStore.getState().paste();
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const duplicateComponent = useEditorStore.getState().duplicateComponent;
        selectedIds.forEach((id) => duplicateComponent(id));
      }

      // Zoom shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        zoomOut();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, clearSelection, zoomIn, zoomOut, resetZoom]);

  // Mouse event listeners
  useEffect(() => {
    if (isPanning || marquee.isActive) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, marquee.isActive, handleMouseMove, handleMouseUp]);

  // Wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Render component tree recursively
  const renderComponentTree = (componentId: string): React.ReactNode => {
    const component = components[componentId];
    if (!component) return null;

    return (
      <DraggableComponent
        key={component.id}
        component={component}
        zoom={zoom}
        gridSize={gridSize}
        snapToGrid={snapToGrid}
        onDoubleClick={onComponentDoubleClick}
      >
        {renderComponent(component)}
      </DraggableComponent>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`canvas-container ${className || ''}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#F8FAFC',
        cursor: isPanning ? 'grabbing' : 'default',
        ...style,
      }}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Canvas viewport */}
      <div
        ref={canvasRef}
        className="canvas-viewport"
        style={{
          position: 'absolute',
          width: width,
          height: height,
          backgroundColor: '#fff',
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          borderRadius: 4,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Grid */}
        <CanvasGrid gridSize={gridSize} zoom={zoom} showGrid={showGrid} />

        {/* Components */}
        {rootIds.map((id) => renderComponentTree(id))}

        {/* Multi-selection box */}
        <MultiSelectionBox selectedBounds={selectedBounds} zoom={zoom} />

        {/* Marquee selection */}
        {marquee.isActive && (
          <MarqueeSelection
            startX={marquee.startX}
            startY={marquee.startY}
            endX={marquee.endX}
            endY={marquee.endY}
            zoom={zoom}
          />
        )}
      </div>

      {/* Zoom controls */}
      <ZoomControls
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={resetZoom}
        onZoomChange={setZoom}
      />

      {/* Canvas info */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          padding: '6px 10px',
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: 6,
          fontSize: 11,
          color: '#64748B',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}
      >
        {width} x {height} px
        {selectedIds.length > 0 && ` | ${selectedIds.length} selected`}
      </div>
    </div>
  );
};

export default Canvas;
