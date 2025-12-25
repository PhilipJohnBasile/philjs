/**
 * Resize handles for the visual builder
 * Provides interactive resizing of selected components
 */

import { signal, memo, effect, batch } from 'philjs-core';
import type { BuilderStore } from '../state/store.js';
import type {
  NodeId,
  ResizeHandle,
  BoundingBox,
  ResizeState,
  NodeStyles,
  StyleValue,
} from '../types.js';

// ============================================================================
// Types
// ============================================================================

export interface ResizeManagerProps {
  store: BuilderStore;
  canvasRef?: HTMLElement | null;
  snapToGrid?: boolean;
  gridSize?: number;
  maintainAspectRatio?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onResizeStart?: (nodeId: NodeId, handle: ResizeHandle) => void;
  onResize?: (nodeId: NodeId, bounds: BoundingBox) => void;
  onResizeEnd?: (nodeId: NodeId, bounds: BoundingBox) => void;
}

export interface ResizeHandlesProps {
  bounds: BoundingBox;
  onHandleMouseDown: (handle: ResizeHandle, event: MouseEvent) => void;
  handles?: ResizeHandle[];
}

interface LocalResizeState {
  isResizing: boolean;
  handle: ResizeHandle | null;
  initialBounds: BoundingBox | null;
  currentBounds: BoundingBox | null;
  startX: number;
  startY: number;
}

// ============================================================================
// Constants
// ============================================================================

const ALL_HANDLES: ResizeHandle[] = [
  'top',
  'right',
  'bottom',
  'left',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];

const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  'top': 'ns-resize',
  'right': 'ew-resize',
  'bottom': 'ns-resize',
  'left': 'ew-resize',
  'top-left': 'nwse-resize',
  'top-right': 'nesw-resize',
  'bottom-left': 'nesw-resize',
  'bottom-right': 'nwse-resize',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Snap a value to grid
 */
function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Calculate new bounds based on resize handle and delta
 */
function calculateNewBounds(
  initialBounds: BoundingBox,
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number,
  options: {
    maintainAspectRatio: boolean;
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
    snapToGrid: boolean;
    gridSize: number;
  }
): BoundingBox {
  let { x, y, width, height } = initialBounds;
  const aspectRatio = initialBounds.width / initialBounds.height;

  // Apply delta based on handle
  switch (handle) {
    case 'top':
      y += deltaY;
      height -= deltaY;
      break;
    case 'right':
      width += deltaX;
      break;
    case 'bottom':
      height += deltaY;
      break;
    case 'left':
      x += deltaX;
      width -= deltaX;
      break;
    case 'top-left':
      x += deltaX;
      y += deltaY;
      width -= deltaX;
      height -= deltaY;
      break;
    case 'top-right':
      y += deltaY;
      width += deltaX;
      height -= deltaY;
      break;
    case 'bottom-left':
      x += deltaX;
      width -= deltaX;
      height += deltaY;
      break;
    case 'bottom-right':
      width += deltaX;
      height += deltaY;
      break;
  }

  // Maintain aspect ratio if needed
  if (options.maintainAspectRatio) {
    const isHorizontalHandle = handle === 'left' || handle === 'right';
    const isVerticalHandle = handle === 'top' || handle === 'bottom';

    if (isHorizontalHandle) {
      const newHeight = width / aspectRatio;
      const heightDelta = newHeight - height;
      height = newHeight;
      // Adjust y for top handles
      if (handle.includes('top')) {
        y -= heightDelta;
      }
    } else if (isVerticalHandle) {
      const newWidth = height * aspectRatio;
      const widthDelta = newWidth - width;
      width = newWidth;
      // Adjust x for left handles
      if (handle.includes('left')) {
        x -= widthDelta;
      }
    } else {
      // Corner handles - use diagonal distance
      const diagonal = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const sign = deltaX + deltaY > 0 ? 1 : -1;

      width = initialBounds.width + sign * diagonal * (aspectRatio / Math.sqrt(1 + aspectRatio * aspectRatio));
      height = width / aspectRatio;

      if (handle.includes('left')) {
        x = initialBounds.x + initialBounds.width - width;
      }
      if (handle.includes('top')) {
        y = initialBounds.y + initialBounds.height - height;
      }
    }
  }

  // Snap to grid if enabled
  if (options.snapToGrid) {
    x = snapToGrid(x, options.gridSize);
    y = snapToGrid(y, options.gridSize);
    width = snapToGrid(width, options.gridSize);
    height = snapToGrid(height, options.gridSize);
  }

  // Apply min/max constraints
  width = Math.max(options.minWidth, Math.min(options.maxWidth, width));
  height = Math.max(options.minHeight, Math.min(options.maxHeight, height));

  // Prevent negative dimensions
  if (width < options.minWidth) {
    width = options.minWidth;
    if (handle.includes('left')) {
      x = initialBounds.x + initialBounds.width - width;
    }
  }
  if (height < options.minHeight) {
    height = options.minHeight;
    if (handle.includes('top')) {
      y = initialBounds.y + initialBounds.height - height;
    }
  }

  return { x, y, width, height };
}

/**
 * Get element bounds relative to container
 */
function getElementBounds(element: HTMLElement, container?: HTMLElement | null): BoundingBox | null {
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const containerRect = container?.getBoundingClientRect() || { left: 0, top: 0 };

  return {
    x: rect.left - containerRect.left,
    y: rect.top - containerRect.top,
    width: rect.width,
    height: rect.height,
  };
}

// ============================================================================
// Resize Handles Component
// ============================================================================

export function ResizeHandles({
  bounds,
  onHandleMouseDown,
  handles = ALL_HANDLES,
}: ResizeHandlesProps) {
  const handleSize = 8;
  const handleOffset = -handleSize / 2;

  const getHandleStyle = (handle: ResizeHandle): Record<string, string | number> => {
    const base: Record<string, string | number> = {
      position: 'absolute',
      width: handleSize,
      height: handleSize,
      backgroundColor: 'white',
      border: '1px solid #0066ff',
      borderRadius: '1px',
      cursor: HANDLE_CURSORS[handle],
      zIndex: 1001,
    };

    switch (handle) {
      case 'top':
        return { ...base, top: handleOffset, left: '50%', marginLeft: handleOffset };
      case 'right':
        return { ...base, top: '50%', right: handleOffset, marginTop: handleOffset };
      case 'bottom':
        return { ...base, bottom: handleOffset, left: '50%', marginLeft: handleOffset };
      case 'left':
        return { ...base, top: '50%', left: handleOffset, marginTop: handleOffset };
      case 'top-left':
        return { ...base, top: handleOffset, left: handleOffset };
      case 'top-right':
        return { ...base, top: handleOffset, right: handleOffset };
      case 'bottom-left':
        return { ...base, bottom: handleOffset, left: handleOffset };
      case 'bottom-right':
        return { ...base, bottom: handleOffset, right: handleOffset };
    }
  };

  return (
    <>
      {handles.map((handle) => (
        <div
          key={handle}
          data-resize-handle={handle}
          style={getHandleStyle(handle)}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onHandleMouseDown(handle, e);
          }}
        />
      ))}
    </>
  );
}

// ============================================================================
// Resize Preview Component
// ============================================================================

export interface ResizePreviewProps {
  bounds: BoundingBox | null;
  visible: boolean;
}

export function ResizePreview({ bounds, visible }: ResizePreviewProps) {
  if (!visible || !bounds) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        border: '2px solid #0066ff',
        backgroundColor: 'rgba(0, 102, 255, 0.1)',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {/* Size indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '-24px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '2px 6px',
          backgroundColor: '#0066ff',
          color: 'white',
          fontSize: '11px',
          fontWeight: 500,
          borderRadius: '2px',
          whiteSpace: 'nowrap',
        }}
      >
        {Math.round(bounds.width)} x {Math.round(bounds.height)}
      </div>
    </div>
  );
}

// ============================================================================
// Resize Manager Component
// ============================================================================

export function ResizeManager({
  store,
  canvasRef,
  snapToGrid: enableSnapToGrid = true,
  gridSize = 8,
  maintainAspectRatio = false,
  minWidth = 20,
  minHeight = 20,
  maxWidth = Infinity,
  maxHeight = Infinity,
  onResizeStart,
  onResize,
  onResizeEnd,
}: ResizeManagerProps) {
  const localState = signal<LocalResizeState>({
    isResizing: false,
    handle: null,
    initialBounds: null,
    currentBounds: null,
    startX: 0,
    startY: 0,
  });

  const selection = store.selection;
  const resize = store.resize;

  // Get the currently selected node ID
  const selectedNodeId = memo(() => {
    const sel = selection();
    return sel.selectedIds.length === 1 ? sel.selectedIds[0] : null;
  });

  // Handle resize start
  const handleResizeStart = (handle: ResizeHandle, event: MouseEvent) => {
    const nodeId = selectedNodeId();
    if (!nodeId || !canvasRef) return;

    const element = canvasRef.querySelector(`[data-builder-node="${nodeId}"]`) as HTMLElement;
    if (!element) return;

    const bounds = getElementBounds(element, canvasRef);
    if (!bounds) return;

    localState.set({
      isResizing: true,
      handle,
      initialBounds: bounds,
      currentBounds: bounds,
      startX: event.clientX,
      startY: event.clientY,
    });

    store.dispatch({
      type: 'START_RESIZE',
      payload: { handle, bounds },
    });

    onResizeStart?.(nodeId, handle);
  };

  // Set up mouse move and mouse up handlers
  effect(() => {
    if (!canvasRef) return;

    const handleMouseMove = (event: MouseEvent) => {
      const state = localState();
      if (!state.isResizing || !state.handle || !state.initialBounds) return;

      const deltaX = event.clientX - state.startX;
      const deltaY = event.clientY - state.startY;

      const shiftPressed = event.shiftKey;
      const aspectRatio = shiftPressed || maintainAspectRatio;

      const newBounds = calculateNewBounds(
        state.initialBounds,
        state.handle,
        deltaX,
        deltaY,
        {
          maintainAspectRatio: aspectRatio,
          minWidth,
          minHeight,
          maxWidth,
          maxHeight,
          snapToGrid: enableSnapToGrid,
          gridSize,
        }
      );

      localState.set({
        ...state,
        currentBounds: newBounds,
      });

      store.dispatch({
        type: 'UPDATE_RESIZE',
        payload: { bounds: newBounds },
      });

      const nodeId = selectedNodeId();
      if (nodeId) {
        onResize?.(nodeId, newBounds);
      }
    };

    const handleMouseUp = () => {
      const state = localState();
      if (!state.isResizing) return;

      const nodeId = selectedNodeId();
      if (nodeId && state.currentBounds) {
        // Apply the resize to the node styles
        store.dispatch({
          type: 'UPDATE_NODE_STYLES',
          payload: {
            nodeId,
            styles: {
              width: { value: state.currentBounds.width, unit: 'px' },
              height: { value: state.currentBounds.height, unit: 'px' },
            },
          },
        });

        onResizeEnd?.(nodeId, state.currentBounds);
      }

      localState.set({
        isResizing: false,
        handle: null,
        initialBounds: null,
        currentBounds: null,
        startX: 0,
        startY: 0,
      });

      store.dispatch({ type: 'END_RESIZE' });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && localState().isResizing) {
        localState.set({
          isResizing: false,
          handle: null,
          initialBounds: null,
          currentBounds: null,
          startX: 0,
          startY: 0,
        });
        store.dispatch({ type: 'CANCEL_RESIZE' });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  });

  // Set up click handlers on resize handles in the canvas
  effect(() => {
    if (!canvasRef) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const handleAttr = target.getAttribute('data-resize-handle');

      if (handleAttr) {
        handleResizeStart(handleAttr as ResizeHandle, event);
      }
    };

    canvasRef.addEventListener('mousedown', handleMouseDown);
    return () => canvasRef.removeEventListener('mousedown', handleMouseDown);
  });

  // Show resize preview during resize
  const previewBounds = memo(() => {
    const state = localState();
    return state.isResizing ? state.currentBounds : null;
  });

  return (
    <ResizePreview
      bounds={previewBounds()}
      visible={localState().isResizing}
    />
  );
}

// ============================================================================
// Keyboard Resize Support
// ============================================================================

export interface KeyboardResizeOptions {
  store: BuilderStore;
  canvasRef?: HTMLElement | null;
  step?: number;
  largeStep?: number;
}

/**
 * Enable keyboard-based resizing of selected elements
 */
export function useKeyboardResize({
  store,
  canvasRef,
  step = 1,
  largeStep = 10,
}: KeyboardResizeOptions) {
  effect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys with Alt modifier
      if (!event.altKey || !event.key.startsWith('Arrow')) return;

      const selection = store.selection();
      if (selection.selectedIds.length !== 1) return;

      const nodeId = selection.selectedIds[0];
      const node = store.getNode(nodeId);
      if (!node) return;

      event.preventDefault();

      const currentStep = event.shiftKey ? largeStep : step;
      const styles = { ...node.styles };

      // Get current dimensions
      let width = 100;
      let height = 100;

      if (styles.width && typeof styles.width === 'object' && 'value' in styles.width) {
        width = styles.width.value;
      } else if (typeof styles.width === 'number') {
        width = styles.width;
      }

      if (styles.height && typeof styles.height === 'object' && 'value' in styles.height) {
        height = styles.height.value;
      } else if (typeof styles.height === 'number') {
        height = styles.height;
      }

      switch (event.key) {
        case 'ArrowRight':
          width += currentStep;
          break;
        case 'ArrowLeft':
          width = Math.max(20, width - currentStep);
          break;
        case 'ArrowDown':
          height += currentStep;
          break;
        case 'ArrowUp':
          height = Math.max(20, height - currentStep);
          break;
      }

      store.dispatch({
        type: 'UPDATE_NODE_STYLES',
        payload: {
          nodeId,
          styles: {
            width: { value: width, unit: 'px' },
            height: { value: height, unit: 'px' },
          },
        },
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });
}

export default {
  ResizeHandles,
  ResizePreview,
  ResizeManager,
  useKeyboardResize,
};
