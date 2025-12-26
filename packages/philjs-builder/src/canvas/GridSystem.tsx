// @ts-nocheck
/**
 * Grid and Snap System for precise layout
 * Provides visual guides, snap-to-grid, and alignment helpers
 */

import { signal, memo, effect } from 'philjs-core';
import type { BuilderStore } from '../state/store.js';
import type {
  NodeId,
  BoundingBox,
  ViewportState,
  GridSettings,
} from '../types.js';

// ============================================================================
// Types
// ============================================================================

export interface GridSystemProps {
  store: BuilderStore;
  canvasRef?: HTMLElement | null;
}

export interface SnapGuide {
  type: 'vertical' | 'horizontal';
  position: number;
  start: number;
  end: number;
  label?: string;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
  snappedX: boolean;
  snappedY: boolean;
}

export interface AlignmentLine {
  type: 'top' | 'middle' | 'bottom' | 'left' | 'center' | 'right';
  position: number;
  nodeId: NodeId;
}

export interface GridSystemOptions {
  gridSize?: number;
  subGridSize?: number;
  snapThreshold?: number;
  showGrid?: boolean;
  showSubGrid?: boolean;
  snapToGrid?: boolean;
  snapToElements?: boolean;
  showSmartGuides?: boolean;
  gridColor?: string;
  subGridColor?: string;
  guideColor?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPTIONS: Required<GridSystemOptions> = {
  gridSize: 8,
  subGridSize: 4,
  snapThreshold: 5,
  showGrid: true,
  showSubGrid: false,
  snapToGrid: true,
  snapToElements: true,
  showSmartGuides: true,
  gridColor: 'rgba(0, 0, 0, 0.1)',
  subGridColor: 'rgba(0, 0, 0, 0.05)',
  guideColor: '#ff00ff',
};

// ============================================================================
// Snap Utility Functions
// ============================================================================

/**
 * Snap a value to the nearest grid line
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Check if a value is close enough to snap
 */
export function shouldSnap(value: number, target: number, threshold: number): boolean {
  return Math.abs(value - target) <= threshold;
}

/**
 * Calculate snap position and guides for a moving element
 */
export function calculateSnap(
  bounds: BoundingBox,
  otherBounds: BoundingBox[],
  canvasSize: { width: number; height: number },
  options: GridSystemOptions = {}
): SnapResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const guides: SnapGuide[] = [];
  let snappedX = false;
  let snappedY = false;
  let finalX = bounds.x;
  let finalY = bounds.y;

  const elementCenter = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };

  const elementRight = bounds.x + bounds.width;
  const elementBottom = bounds.y + bounds.height;

  // Snap to grid
  if (opts.snapToGrid) {
    const snappedGridX = snapToGrid(bounds.x, opts.gridSize);
    const snappedGridY = snapToGrid(bounds.y, opts.gridSize);

    if (shouldSnap(bounds.x, snappedGridX, opts.snapThreshold)) {
      finalX = snappedGridX;
      snappedX = true;
    }

    if (shouldSnap(bounds.y, snappedGridY, opts.snapThreshold)) {
      finalY = snappedGridY;
      snappedY = true;
    }
  }

  // Snap to canvas edges and center
  if (opts.snapToElements) {
    const canvasCenterX = canvasSize.width / 2;
    const canvasCenterY = canvasSize.height / 2;

    // Canvas left edge
    if (shouldSnap(bounds.x, 0, opts.snapThreshold)) {
      finalX = 0;
      snappedX = true;
      guides.push({
        type: 'vertical',
        position: 0,
        start: 0,
        end: canvasSize.height,
        label: '0',
      });
    }

    // Canvas right edge
    if (shouldSnap(elementRight, canvasSize.width, opts.snapThreshold)) {
      finalX = canvasSize.width - bounds.width;
      snappedX = true;
      guides.push({
        type: 'vertical',
        position: canvasSize.width,
        start: 0,
        end: canvasSize.height,
      });
    }

    // Canvas top edge
    if (shouldSnap(bounds.y, 0, opts.snapThreshold)) {
      finalY = 0;
      snappedY = true;
      guides.push({
        type: 'horizontal',
        position: 0,
        start: 0,
        end: canvasSize.width,
        label: '0',
      });
    }

    // Canvas bottom edge
    if (shouldSnap(elementBottom, canvasSize.height, opts.snapThreshold)) {
      finalY = canvasSize.height - bounds.height;
      snappedY = true;
      guides.push({
        type: 'horizontal',
        position: canvasSize.height,
        start: 0,
        end: canvasSize.width,
      });
    }

    // Canvas center horizontal
    if (shouldSnap(elementCenter.x, canvasCenterX, opts.snapThreshold)) {
      finalX = canvasCenterX - bounds.width / 2;
      snappedX = true;
      guides.push({
        type: 'vertical',
        position: canvasCenterX,
        start: 0,
        end: canvasSize.height,
        label: 'center',
      });
    }

    // Canvas center vertical
    if (shouldSnap(elementCenter.y, canvasCenterY, opts.snapThreshold)) {
      finalY = canvasCenterY - bounds.height / 2;
      snappedY = true;
      guides.push({
        type: 'horizontal',
        position: canvasCenterY,
        start: 0,
        end: canvasSize.width,
        label: 'center',
      });
    }
  }

  // Snap to other elements
  if (opts.snapToElements && otherBounds.length > 0) {
    for (const other of otherBounds) {
      const otherCenter = {
        x: other.x + other.width / 2,
        y: other.y + other.height / 2,
      };
      const otherRight = other.x + other.width;
      const otherBottom = other.y + other.height;

      // Left edge to left edge
      if (!snappedX && shouldSnap(bounds.x, other.x, opts.snapThreshold)) {
        finalX = other.x;
        snappedX = true;
        guides.push({
          type: 'vertical',
          position: other.x,
          start: Math.min(bounds.y, other.y),
          end: Math.max(elementBottom, otherBottom),
        });
      }

      // Right edge to right edge
      if (!snappedX && shouldSnap(elementRight, otherRight, opts.snapThreshold)) {
        finalX = otherRight - bounds.width;
        snappedX = true;
        guides.push({
          type: 'vertical',
          position: otherRight,
          start: Math.min(bounds.y, other.y),
          end: Math.max(elementBottom, otherBottom),
        });
      }

      // Left edge to right edge
      if (!snappedX && shouldSnap(bounds.x, otherRight, opts.snapThreshold)) {
        finalX = otherRight;
        snappedX = true;
        guides.push({
          type: 'vertical',
          position: otherRight,
          start: Math.min(bounds.y, other.y),
          end: Math.max(elementBottom, otherBottom),
        });
      }

      // Right edge to left edge
      if (!snappedX && shouldSnap(elementRight, other.x, opts.snapThreshold)) {
        finalX = other.x - bounds.width;
        snappedX = true;
        guides.push({
          type: 'vertical',
          position: other.x,
          start: Math.min(bounds.y, other.y),
          end: Math.max(elementBottom, otherBottom),
        });
      }

      // Center to center (horizontal)
      if (!snappedX && shouldSnap(elementCenter.x, otherCenter.x, opts.snapThreshold)) {
        finalX = otherCenter.x - bounds.width / 2;
        snappedX = true;
        guides.push({
          type: 'vertical',
          position: otherCenter.x,
          start: Math.min(bounds.y, other.y),
          end: Math.max(elementBottom, otherBottom),
        });
      }

      // Top edge to top edge
      if (!snappedY && shouldSnap(bounds.y, other.y, opts.snapThreshold)) {
        finalY = other.y;
        snappedY = true;
        guides.push({
          type: 'horizontal',
          position: other.y,
          start: Math.min(bounds.x, other.x),
          end: Math.max(elementRight, otherRight),
        });
      }

      // Bottom edge to bottom edge
      if (!snappedY && shouldSnap(elementBottom, otherBottom, opts.snapThreshold)) {
        finalY = otherBottom - bounds.height;
        snappedY = true;
        guides.push({
          type: 'horizontal',
          position: otherBottom,
          start: Math.min(bounds.x, other.x),
          end: Math.max(elementRight, otherRight),
        });
      }

      // Top edge to bottom edge
      if (!snappedY && shouldSnap(bounds.y, otherBottom, opts.snapThreshold)) {
        finalY = otherBottom;
        snappedY = true;
        guides.push({
          type: 'horizontal',
          position: otherBottom,
          start: Math.min(bounds.x, other.x),
          end: Math.max(elementRight, otherRight),
        });
      }

      // Bottom edge to top edge
      if (!snappedY && shouldSnap(elementBottom, other.y, opts.snapThreshold)) {
        finalY = other.y - bounds.height;
        snappedY = true;
        guides.push({
          type: 'horizontal',
          position: other.y,
          start: Math.min(bounds.x, other.x),
          end: Math.max(elementRight, otherRight),
        });
      }

      // Center to center (vertical)
      if (!snappedY && shouldSnap(elementCenter.y, otherCenter.y, opts.snapThreshold)) {
        finalY = otherCenter.y - bounds.height / 2;
        snappedY = true;
        guides.push({
          type: 'horizontal',
          position: otherCenter.y,
          start: Math.min(bounds.x, other.x),
          end: Math.max(elementRight, otherRight),
        });
      }
    }
  }

  return {
    x: finalX,
    y: finalY,
    guides,
    snappedX,
    snappedY,
  };
}

// ============================================================================
// Grid Pattern Component
// ============================================================================

export interface GridPatternProps {
  gridSize: number;
  subGridSize?: number;
  zoom: number;
  panX: number;
  panY: number;
  gridColor?: string;
  subGridColor?: string;
  showSubGrid?: boolean;
}

export function GridPattern({
  gridSize,
  subGridSize = 4,
  zoom,
  panX,
  panY,
  gridColor = 'rgba(0, 0, 0, 0.1)',
  subGridColor = 'rgba(0, 0, 0, 0.05)',
  showSubGrid = false,
}: GridPatternProps) {
  const scaledGridSize = gridSize * zoom;
  const scaledSubGridSize = subGridSize * zoom;
  const offsetX = (panX % scaledGridSize);
  const offsetY = (panY % scaledGridSize);
  const subOffsetX = (panX % scaledSubGridSize);
  const subOffsetY = (panY % scaledSubGridSize);

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <defs>
        {showSubGrid && (
          <pattern
            id="sub-grid"
            width={scaledSubGridSize}
            height={scaledSubGridSize}
            patternUnits="userSpaceOnUse"
            x={subOffsetX}
            y={subOffsetY}
          >
            <path
              d={`M ${scaledSubGridSize} 0 L 0 0 0 ${scaledSubGridSize}`}
              fill="none"
              stroke={subGridColor}
              strokeWidth="0.5"
            />
          </pattern>
        )}
        <pattern
          id="main-grid"
          width={scaledGridSize}
          height={scaledGridSize}
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d={`M ${scaledGridSize} 0 L 0 0 0 ${scaledGridSize}`}
            fill="none"
            stroke={gridColor}
            strokeWidth="1"
          />
        </pattern>
      </defs>
      {showSubGrid && <rect width="100%" height="100%" fill="url(#sub-grid)" />}
      <rect width="100%" height="100%" fill="url(#main-grid)" />
    </svg>
  );
}

// ============================================================================
// Smart Guides Component
// ============================================================================

export interface SmartGuidesProps {
  guides: SnapGuide[];
  zoom: number;
  panX: number;
  panY: number;
  color?: string;
}

export function SmartGuides({
  guides,
  zoom,
  panX,
  panY,
  color = '#ff00ff',
}: SmartGuidesProps) {
  if (guides.length === 0) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
        overflow: 'visible',
      }}
    >
      {guides.map((guide, index) => {
        const scaledPosition = guide.position * zoom + (guide.type === 'vertical' ? panX : panY);
        const scaledStart = guide.start * zoom + (guide.type === 'vertical' ? panY : panX);
        const scaledEnd = guide.end * zoom + (guide.type === 'vertical' ? panY : panX);

        if (guide.type === 'vertical') {
          return (
            <g key={index}>
              <line
                x1={scaledPosition}
                y1={scaledStart}
                x2={scaledPosition}
                y2={scaledEnd}
                stroke={color}
                strokeWidth="1"
                strokeDasharray="4 2"
              />
              {guide.label && (
                <text
                  x={scaledPosition + 4}
                  y={scaledStart + 12}
                  fill={color}
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {guide.label}
                </text>
              )}
            </g>
          );
        } else {
          return (
            <g key={index}>
              <line
                x1={scaledStart}
                y1={scaledPosition}
                x2={scaledEnd}
                y2={scaledPosition}
                stroke={color}
                strokeWidth="1"
                strokeDasharray="4 2"
              />
              {guide.label && (
                <text
                  x={scaledStart + 4}
                  y={scaledPosition - 4}
                  fill={color}
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {guide.label}
                </text>
              )}
            </g>
          );
        }
      })}
    </svg>
  );
}

// ============================================================================
// Distance Indicators Component
// ============================================================================

export interface DistanceIndicatorProps {
  from: BoundingBox;
  to: BoundingBox;
  zoom: number;
  panX: number;
  panY: number;
}

export function DistanceIndicator({
  from,
  to,
  zoom,
  panX,
  panY,
}: DistanceIndicatorProps) {
  const fromCenter = {
    x: from.x + from.width / 2,
    y: from.y + from.height / 2,
  };

  const toCenter = {
    x: to.x + to.width / 2,
    y: to.y + to.height / 2,
  };

  const dx = Math.abs(toCenter.x - fromCenter.x);
  const dy = Math.abs(toCenter.y - fromCenter.y);

  const scaledFromCenter = {
    x: fromCenter.x * zoom + panX,
    y: fromCenter.y * zoom + panY,
  };

  const scaledToCenter = {
    x: toCenter.x * zoom + panX,
    y: toCenter.y * zoom + panY,
  };

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 999,
      }}
    >
      {/* Horizontal distance */}
      {dx > 0 && (
        <g>
          <line
            x1={scaledFromCenter.x}
            y1={scaledFromCenter.y}
            x2={scaledToCenter.x}
            y2={scaledFromCenter.y}
            stroke="#0066ff"
            strokeWidth="1"
            strokeDasharray="3 2"
          />
          <text
            x={(scaledFromCenter.x + scaledToCenter.x) / 2}
            y={scaledFromCenter.y - 4}
            fill="#0066ff"
            fontSize="10"
            textAnchor="middle"
            fontFamily="monospace"
          >
            {Math.round(dx)}px
          </text>
        </g>
      )}

      {/* Vertical distance */}
      {dy > 0 && (
        <g>
          <line
            x1={scaledToCenter.x}
            y1={scaledFromCenter.y}
            x2={scaledToCenter.x}
            y2={scaledToCenter.y}
            stroke="#0066ff"
            strokeWidth="1"
            strokeDasharray="3 2"
          />
          <text
            x={scaledToCenter.x + 4}
            y={(scaledFromCenter.y + scaledToCenter.y) / 2}
            fill="#0066ff"
            fontSize="10"
            fontFamily="monospace"
          >
            {Math.round(dy)}px
          </text>
        </g>
      )}
    </svg>
  );
}

// ============================================================================
// Grid System Controller
// ============================================================================

export interface GridSystemController {
  options: ReturnType<typeof signal<GridSystemOptions>>;
  guides: ReturnType<typeof signal<SnapGuide[]>>;
  setGridSize: (size: number) => void;
  setSnapThreshold: (threshold: number) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleSmartGuides: () => void;
  calculateSnapPosition: (bounds: BoundingBox, excludeNodeIds?: NodeId[]) => SnapResult;
  clearGuides: () => void;
  showGuides: (newGuides: SnapGuide[]) => void;
}

/**
 * Create a grid system controller
 */
export function createGridSystemController(
  store: BuilderStore,
  initialOptions: GridSystemOptions = {}
): GridSystemController {
  const options = signal<GridSystemOptions>({ ...DEFAULT_OPTIONS, ...initialOptions });
  const guides = signal<SnapGuide[]>([]);

  const setGridSize = (size: number) => {
    options.set({ ...options(), gridSize: size });
    store.dispatch({
      type: 'UPDATE_CANVAS_SETTINGS',
      payload: {
        grid: { ...store.canvas().grid, size },
      },
    });
  };

  const setSnapThreshold = (threshold: number) => {
    options.set({ ...options(), snapThreshold: threshold });
  };

  const toggleGrid = () => {
    const current = options();
    options.set({ ...current, showGrid: !current.showGrid });
    store.dispatch({
      type: 'UPDATE_CANVAS_SETTINGS',
      payload: {
        grid: { ...store.canvas().grid, enabled: !current.showGrid },
      },
    });
  };

  const toggleSnap = () => {
    const current = options();
    options.set({ ...current, snapToGrid: !current.snapToGrid });
    store.dispatch({
      type: 'UPDATE_CANVAS_SETTINGS',
      payload: {
        grid: { ...store.canvas().grid, snapToGrid: !current.snapToGrid },
      },
    });
  };

  const toggleSmartGuides = () => {
    const current = options();
    options.set({ ...current, showSmartGuides: !current.showSmartGuides });
  };

  const calculateSnapPosition = (bounds: BoundingBox, excludeNodeIds: NodeId[] = []): SnapResult => {
    const nodes = store.nodes();
    const selection = store.selection();
    const canvas = store.canvas();

    // Get bounds of all other nodes
    const otherBounds: BoundingBox[] = [];
    const selectedIds = new Set([...selection.selectedIds, ...excludeNodeIds]);

    // In a real implementation, you would get actual DOM bounds
    // For now, we'll use a simplified approach
    for (const [nodeId, node] of Object.entries(nodes)) {
      if (selectedIds.has(nodeId) || nodeId === store.rootId()) continue;

      // Get width/height from styles
      const getSize = (style: any): number => {
        if (typeof style === 'number') return style;
        if (typeof style === 'object' && 'value' in style) return style.value;
        return 100; // Default size
      };

      otherBounds.push({
        x: 0, // Would need actual position
        y: 0,
        width: getSize(node.styles.width),
        height: getSize(node.styles.height),
      });
    }

    return calculateSnap(
      bounds,
      otherBounds,
      { width: canvas.width, height: canvas.height },
      options()
    );
  };

  const clearGuides = () => {
    guides.set([]);
  };

  const showGuides = (newGuides: SnapGuide[]) => {
    guides.set(newGuides);
  };

  return {
    options,
    guides,
    setGridSize,
    setSnapThreshold,
    toggleGrid,
    toggleSnap,
    toggleSmartGuides,
    calculateSnapPosition,
    clearGuides,
    showGuides,
  };
}

// ============================================================================
// Main Grid System Component
// ============================================================================

export function GridSystem({ store, canvasRef }: GridSystemProps) {
  const viewport = store.viewport;
  const canvas = store.canvas;
  const drag = store.drag;

  const guides = signal<SnapGuide[]>([]);

  // Clear guides when drag ends
  effect(() => {
    if (!drag().isDragging) {
      guides.set([]);
    }
  });

  const canvasSettings = canvas();
  const viewportState = viewport();

  if (!canvasSettings.grid.enabled) {
    return null;
  }

  return (
    <>
      <GridPattern
        gridSize={canvasSettings.grid.size}
        zoom={viewportState.zoom}
        panX={viewportState.panX}
        panY={viewportState.panY}
        gridColor={canvasSettings.grid.color}
        showSubGrid={false}
      />
      {canvasSettings.grid.showGuides && (
        <SmartGuides
          guides={guides()}
          zoom={viewportState.zoom}
          panX={viewportState.panX}
          panY={viewportState.panY}
        />
      )}
    </>
  );
}

export default GridSystem;
