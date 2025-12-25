/**
 * Selection handling for the visual builder
 * Provides selection overlay, multi-select, and keyboard navigation
 */

import { signal, memo, effect, batch } from 'philjs-core';
import type { BuilderStore } from '../state/store.js';
import type {
  NodeId,
  ComponentNode,
  SelectionState,
  BoundingBox,
} from '../types.js';

// ============================================================================
// Types
// ============================================================================

export interface SelectionOverlayProps {
  store: BuilderStore;
  canvasRef?: HTMLElement | null;
}

export interface SelectionBoxProps {
  bounds: BoundingBox;
  isMultiple?: boolean;
  showLabel?: boolean;
  label?: string;
}

export interface MarqueeSelectionProps {
  store: BuilderStore;
  canvasRef?: HTMLElement | null;
  enabled?: boolean;
  onSelectionChange?: (nodeIds: NodeId[]) => void;
}

export interface SelectionManagerProps {
  store: BuilderStore;
  canvasRef?: HTMLElement | null;
  enableMarquee?: boolean;
  enableKeyboard?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get bounding box for a DOM element
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

/**
 * Get combined bounding box for multiple elements
 */
function getCombinedBounds(bounds: BoundingBox[]): BoundingBox | null {
  if (bounds.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const b of bounds) {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Check if two bounding boxes intersect
 */
function boundsIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * Find all node elements within a container
 */
function findNodeElements(container: HTMLElement): Map<NodeId, HTMLElement> {
  const nodeMap = new Map<NodeId, HTMLElement>();
  const elements = container.querySelectorAll('[data-builder-node]');

  elements.forEach((el) => {
    const nodeId = el.getAttribute('data-builder-node');
    if (nodeId) {
      nodeMap.set(nodeId, el as HTMLElement);
    }
  });

  return nodeMap;
}

// ============================================================================
// Selection Box Component
// ============================================================================

export function SelectionBox({
  bounds,
  isMultiple = false,
  showLabel = true,
  label,
}: SelectionBoxProps) {
  const handleStyle = {
    position: 'absolute' as const,
    width: '8px',
    height: '8px',
    backgroundColor: 'white',
    border: '1px solid #0066ff',
    borderRadius: '1px',
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        pointerEvents: 'none',
        zIndex: 999,
      }}
    >
      {/* Selection border */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: `2px solid ${isMultiple ? '#00cc66' : '#0066ff'}`,
          borderRadius: '2px',
        }}
      />

      {/* Label */}
      {showLabel && label && (
        <div
          style={{
            position: 'absolute',
            top: '-22px',
            left: '-1px',
            padding: '2px 6px',
            backgroundColor: isMultiple ? '#00cc66' : '#0066ff',
            color: 'white',
            fontSize: '11px',
            fontWeight: 500,
            borderRadius: '2px',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      )}

      {/* Resize handles - only show for single selection */}
      {!isMultiple && (
        <>
          {/* Top-left */}
          <div
            data-resize-handle="top-left"
            style={{
              ...handleStyle,
              top: '-4px',
              left: '-4px',
              cursor: 'nwse-resize',
              pointerEvents: 'auto',
            }}
          />
          {/* Top */}
          <div
            data-resize-handle="top"
            style={{
              ...handleStyle,
              top: '-4px',
              left: '50%',
              marginLeft: '-4px',
              cursor: 'ns-resize',
              pointerEvents: 'auto',
            }}
          />
          {/* Top-right */}
          <div
            data-resize-handle="top-right"
            style={{
              ...handleStyle,
              top: '-4px',
              right: '-4px',
              cursor: 'nesw-resize',
              pointerEvents: 'auto',
            }}
          />
          {/* Right */}
          <div
            data-resize-handle="right"
            style={{
              ...handleStyle,
              top: '50%',
              right: '-4px',
              marginTop: '-4px',
              cursor: 'ew-resize',
              pointerEvents: 'auto',
            }}
          />
          {/* Bottom-right */}
          <div
            data-resize-handle="bottom-right"
            style={{
              ...handleStyle,
              bottom: '-4px',
              right: '-4px',
              cursor: 'nwse-resize',
              pointerEvents: 'auto',
            }}
          />
          {/* Bottom */}
          <div
            data-resize-handle="bottom"
            style={{
              ...handleStyle,
              bottom: '-4px',
              left: '50%',
              marginLeft: '-4px',
              cursor: 'ns-resize',
              pointerEvents: 'auto',
            }}
          />
          {/* Bottom-left */}
          <div
            data-resize-handle="bottom-left"
            style={{
              ...handleStyle,
              bottom: '-4px',
              left: '-4px',
              cursor: 'nesw-resize',
              pointerEvents: 'auto',
            }}
          />
          {/* Left */}
          <div
            data-resize-handle="left"
            style={{
              ...handleStyle,
              top: '50%',
              left: '-4px',
              marginTop: '-4px',
              cursor: 'ew-resize',
              pointerEvents: 'auto',
            }}
          />
        </>
      )}
    </div>
  );
}

// ============================================================================
// Hover Highlight Component
// ============================================================================

export interface HoverHighlightProps {
  bounds: BoundingBox | null;
  label?: string;
}

export function HoverHighlight({ bounds, label }: HoverHighlightProps) {
  if (!bounds) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        pointerEvents: 'none',
        zIndex: 998,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: '1px dashed #0066ff',
          borderRadius: '2px',
        }}
      />
      {label && (
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            left: '-1px',
            padding: '1px 4px',
            backgroundColor: 'rgba(0, 102, 255, 0.8)',
            color: 'white',
            fontSize: '10px',
            borderRadius: '2px',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Marquee Selection Component
// ============================================================================

interface MarqueeState {
  isSelecting: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function MarqueeSelection({
  store,
  canvasRef,
  enabled = true,
  onSelectionChange,
}: MarqueeSelectionProps) {
  const marqueeState = signal<MarqueeState>({
    isSelecting: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });

  const marqueeBounds = memo(() => {
    const state = marqueeState();
    if (!state.isSelecting) return null;

    const x = Math.min(state.startX, state.endX);
    const y = Math.min(state.startY, state.endY);
    const width = Math.abs(state.endX - state.startX);
    const height = Math.abs(state.endY - state.startY);

    return { x, y, width, height };
  });

  // Set up event listeners
  effect(() => {
    if (!enabled || !canvasRef) return;

    const handleMouseDown = (event: MouseEvent) => {
      // Only start marquee on empty canvas area with left mouse button
      if (event.button !== 0) return;
      const target = event.target as HTMLElement;
      if (!target.hasAttribute('data-builder-canvas')) return;

      const rect = canvasRef.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      marqueeState.set({
        isSelecting: true,
        startX: x,
        startY: y,
        endX: x,
        endY: y,
      });
    };

    const handleMouseMove = (event: MouseEvent) => {
      const state = marqueeState();
      if (!state.isSelecting) return;

      const rect = canvasRef.getBoundingClientRect();
      marqueeState.set({
        ...state,
        endX: event.clientX - rect.left,
        endY: event.clientY - rect.top,
      });
    };

    const handleMouseUp = () => {
      const state = marqueeState();
      if (!state.isSelecting) return;

      const bounds = marqueeBounds();
      if (bounds && bounds.width > 5 && bounds.height > 5) {
        // Find all nodes within the marquee
        const nodeElements = findNodeElements(canvasRef);
        const selectedIds: NodeId[] = [];

        nodeElements.forEach((element, nodeId) => {
          const nodeBounds = getElementBounds(element, canvasRef);
          if (nodeBounds && boundsIntersect(bounds, nodeBounds)) {
            selectedIds.push(nodeId);
          }
        });

        if (selectedIds.length > 0) {
          store.dispatch({ type: 'SELECT_NODES', payload: { nodeIds: selectedIds } });
          onSelectionChange?.(selectedIds);
        }
      }

      marqueeState.set({
        isSelecting: false,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
      });
    };

    canvasRef.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvasRef.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  });

  const bounds = marqueeBounds();
  if (!bounds) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        backgroundColor: 'rgba(0, 102, 255, 0.1)',
        border: '1px solid #0066ff',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    />
  );
}

// ============================================================================
// Selection Overlay Component
// ============================================================================

export function SelectionOverlay({ store, canvasRef }: SelectionOverlayProps) {
  const selection = store.selection;
  const nodes = store.nodes;

  // Compute selection bounds
  const selectionBounds = memo(() => {
    if (!canvasRef) return null;

    const sel = selection();
    if (sel.selectedIds.length === 0) return null;

    const bounds: BoundingBox[] = [];
    const nodeElements = findNodeElements(canvasRef);

    for (const nodeId of sel.selectedIds) {
      const element = nodeElements.get(nodeId);
      if (element) {
        const b = getElementBounds(element, canvasRef);
        if (b) bounds.push(b);
      }
    }

    return getCombinedBounds(bounds);
  });

  // Compute hover bounds
  const hoverBounds = memo(() => {
    if (!canvasRef) return null;

    const sel = selection();
    if (!sel.hoveredId || sel.selectedIds.includes(sel.hoveredId)) return null;

    const nodeElements = findNodeElements(canvasRef);
    const element = nodeElements.get(sel.hoveredId);
    if (!element) return null;

    return getElementBounds(element, canvasRef);
  });

  // Get label for selection
  const selectionLabel = memo(() => {
    const sel = selection();
    if (sel.selectedIds.length === 0) return '';
    if (sel.selectedIds.length > 1) return `${sel.selectedIds.length} selected`;

    const node = nodes()[sel.selectedIds[0]];
    return node?.name || node?.type || '';
  });

  // Get label for hover
  const hoverLabel = memo(() => {
    const sel = selection();
    if (!sel.hoveredId) return '';

    const node = nodes()[sel.hoveredId];
    return node?.name || node?.type || '';
  });

  const bounds = selectionBounds();
  const hover = hoverBounds();
  const isMultiple = selection().selectedIds.length > 1;

  return (
    <>
      <HoverHighlight bounds={hover} label={hoverLabel()} />
      {bounds && (
        <SelectionBox
          bounds={bounds}
          isMultiple={isMultiple}
          label={selectionLabel()}
        />
      )}
    </>
  );
}

// ============================================================================
// Selection Manager Component
// ============================================================================

export function SelectionManager({
  store,
  canvasRef,
  enableMarquee = true,
  enableKeyboard = true,
}: SelectionManagerProps) {
  // Keyboard navigation
  effect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const sel = store.selection();
      const nodeMap = store.nodes();

      // Arrow key navigation
      if (event.key.startsWith('Arrow') && sel.selectedIds.length === 1) {
        event.preventDefault();
        const currentId = sel.selectedIds[0];
        const currentNode = nodeMap[currentId];

        if (!currentNode) return;

        let nextId: NodeId | null = null;

        switch (event.key) {
          case 'ArrowUp': {
            // Move to parent
            if (currentNode.parentId && currentNode.parentId !== store.rootId()) {
              nextId = currentNode.parentId;
            }
            break;
          }
          case 'ArrowDown': {
            // Move to first child
            if (currentNode.children.length > 0) {
              nextId = currentNode.children[0];
            }
            break;
          }
          case 'ArrowLeft': {
            // Move to previous sibling
            if (currentNode.parentId) {
              const parent = nodeMap[currentNode.parentId];
              if (parent) {
                const index = parent.children.indexOf(currentId);
                if (index > 0) {
                  nextId = parent.children[index - 1];
                }
              }
            }
            break;
          }
          case 'ArrowRight': {
            // Move to next sibling
            if (currentNode.parentId) {
              const parent = nodeMap[currentNode.parentId];
              if (parent) {
                const index = parent.children.indexOf(currentId);
                if (index < parent.children.length - 1) {
                  nextId = parent.children[index + 1];
                }
              }
            }
            break;
          }
        }

        if (nextId) {
          store.dispatch({ type: 'SELECT_NODE', payload: { nodeId: nextId } });
        }
      }

      // Escape to deselect
      if (event.key === 'Escape') {
        store.dispatch({ type: 'DESELECT_ALL' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <>
      <SelectionOverlay store={store} canvasRef={canvasRef} />
      {enableMarquee && <MarqueeSelection store={store} canvasRef={canvasRef} />}
    </>
  );
}

export default {
  SelectionBox,
  HoverHighlight,
  MarqueeSelection,
  SelectionOverlay,
  SelectionManager,
};
