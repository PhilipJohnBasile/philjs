/**
 * Main Canvas component for the visual builder
 * Provides the drawing surface with zoom, pan, and grid support
 */

import { signal, memo, effect } from 'philjs-core';
import type { BuilderStore } from '../state/store.js';
import type {
  ComponentNode,
  NodeId,
  ViewportState,
  CanvasSettings,
  NodeStyles,
  StyleValue,
} from '../types.js';

// ============================================================================
// Types
// ============================================================================

export interface CanvasProps {
  store: BuilderStore;
  width?: number;
  height?: number;
  className?: string;
  style?: Record<string, string | number>;
  onNodeClick?: (nodeId: NodeId, event: MouseEvent) => void;
  onNodeDoubleClick?: (nodeId: NodeId, event: MouseEvent) => void;
  onCanvasClick?: (event: MouseEvent) => void;
  onContextMenu?: (nodeId: NodeId | null, event: MouseEvent) => void;
  renderNode?: (node: ComponentNode, children: any[]) => any;
}

export interface CanvasState {
  isPanning: boolean;
  panStart: { x: number; y: number };
  lastPan: { x: number; y: number };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert StyleValue to CSS string
 */
function styleValueToCSS(value: StyleValue | string | number | undefined): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return `${value}px`;
  if (typeof value === 'object' && 'value' in value) {
    const unit = value.unit || 'px';
    if (unit === 'none' || unit === 'auto') return unit;
    return `${value.value}${unit}`;
  }
  return '';
}

/**
 * Convert NodeStyles to CSS object
 */
function nodeStylesToCSS(styles: NodeStyles): Record<string, string> {
  const css: Record<string, string> = {};

  for (const [key, value] of Object.entries(styles)) {
    if (value === undefined || value === null) continue;

    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    const cssValue = styleValueToCSS(value);

    if (cssValue) {
      css[cssKey] = cssValue;
    }
  }

  return css;
}

/**
 * Convert CSS object to inline style string
 */
function cssObjectToString(css: Record<string, string>): string {
  return Object.entries(css)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}

// ============================================================================
// Canvas Grid Component
// ============================================================================

export interface CanvasGridProps {
  settings: CanvasSettings;
  viewport: ViewportState;
}

export function CanvasGrid({ settings, viewport }: CanvasGridProps) {
  if (!settings.grid.enabled) return null;

  const gridSize = settings.grid.size * viewport.zoom;
  const offsetX = (viewport.panX % gridSize);
  const offsetY = (viewport.panY % gridSize);

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
        <pattern
          id="canvas-grid"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke={settings.grid.color}
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#canvas-grid)" />
    </svg>
  );
}

// ============================================================================
// Canvas Rulers Component
// ============================================================================

export interface CanvasRulersProps {
  settings: CanvasSettings;
  viewport: ViewportState;
}

export function CanvasRulers({ settings, viewport }: CanvasRulersProps) {
  if (!settings.rulers) return null;

  const rulerSize = 20;
  const tickInterval = 50 * viewport.zoom;
  const majorTickInterval = 100 * viewport.zoom;

  const horizontalTicks: number[] = [];
  const verticalTicks: number[] = [];

  // Calculate tick positions
  const startX = Math.floor(-viewport.panX / tickInterval) * tickInterval;
  const endX = startX + viewport.canvasWidth + tickInterval;
  for (let x = startX; x <= endX; x += tickInterval) {
    horizontalTicks.push(x);
  }

  const startY = Math.floor(-viewport.panY / tickInterval) * tickInterval;
  const endY = startY + viewport.canvasHeight + tickInterval;
  for (let y = startY; y <= endY; y += tickInterval) {
    verticalTicks.push(y);
  }

  return (
    <>
      {/* Horizontal ruler */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: rulerSize,
          right: 0,
          height: rulerSize,
          backgroundColor: '#f0f0f0',
          borderBottom: '1px solid #ccc',
          overflow: 'hidden',
          zIndex: 100,
        }}
      >
        <svg width="100%" height={rulerSize}>
          {horizontalTicks.map((x) => {
            const screenX = x + viewport.panX;
            const isMajor = Math.abs(x % majorTickInterval) < 1;
            const value = Math.round(x / viewport.zoom);

            return (
              <g key={x}>
                <line
                  x1={screenX}
                  y1={isMajor ? 0 : rulerSize / 2}
                  x2={screenX}
                  y2={rulerSize}
                  stroke="#999"
                  strokeWidth="1"
                />
                {isMajor && (
                  <text
                    x={screenX + 2}
                    y={rulerSize / 2}
                    fontSize="9"
                    fill="#666"
                  >
                    {value}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Vertical ruler */}
      <div
        style={{
          position: 'absolute',
          top: rulerSize,
          left: 0,
          width: rulerSize,
          bottom: 0,
          backgroundColor: '#f0f0f0',
          borderRight: '1px solid #ccc',
          overflow: 'hidden',
          zIndex: 100,
        }}
      >
        <svg width={rulerSize} height="100%">
          {verticalTicks.map((y) => {
            const screenY = y + viewport.panY;
            const isMajor = Math.abs(y % majorTickInterval) < 1;
            const value = Math.round(y / viewport.zoom);

            return (
              <g key={y}>
                <line
                  x1={isMajor ? 0 : rulerSize / 2}
                  y1={screenY}
                  x2={rulerSize}
                  y2={screenY}
                  stroke="#999"
                  strokeWidth="1"
                />
                {isMajor && (
                  <text
                    x={2}
                    y={screenY - 2}
                    fontSize="9"
                    fill="#666"
                    transform={`rotate(-90, 2, ${screenY - 2})`}
                  >
                    {value}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Corner */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: rulerSize,
          height: rulerSize,
          backgroundColor: '#e0e0e0',
          borderRight: '1px solid #ccc',
          borderBottom: '1px solid #ccc',
          zIndex: 101,
        }}
      />
    </>
  );
}

// ============================================================================
// Canvas Node Renderer
// ============================================================================

export interface CanvasNodeProps {
  store: BuilderStore;
  nodeId: NodeId;
  onNodeClick?: (nodeId: NodeId, event: MouseEvent) => void;
  onNodeDoubleClick?: (nodeId: NodeId, event: MouseEvent) => void;
  onContextMenu?: (nodeId: NodeId, event: MouseEvent) => void;
  renderNode?: (node: ComponentNode, children: any[]) => any;
}

export function CanvasNode({
  store,
  nodeId,
  onNodeClick,
  onNodeDoubleClick,
  onContextMenu,
  renderNode,
}: CanvasNodeProps) {
  const nodes = store.nodes;
  const selection = store.selection;
  const components = store.components;

  // Create memos for reactive updates
  const node = memo(() => nodes()[nodeId]);
  const isSelected = memo(() => selection().selectedIds.includes(nodeId));
  const isHovered = memo(() => selection().hoveredId === nodeId);
  const componentDef = memo(() => {
    const n = node();
    return n ? components()[n.type] : undefined;
  });

  const handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    onNodeClick?.(nodeId, event);
  };

  const handleDoubleClick = (event: MouseEvent) => {
    event.stopPropagation();
    onNodeDoubleClick?.(nodeId, event);
  };

  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onContextMenu?.(nodeId, event);
  };

  const handleMouseEnter = () => {
    store.dispatch({ type: 'HOVER_NODE', payload: { nodeId } });
  };

  const handleMouseLeave = () => {
    store.dispatch({ type: 'HOVER_NODE', payload: { nodeId: null } });
  };

  // Render nothing if node doesn't exist
  const currentNode = node();
  if (!currentNode) return null;

  // Get CSS styles
  const cssStyles = nodeStylesToCSS(currentNode.styles);
  const styleString = cssObjectToString(cssStyles);

  // Build selection overlay styles
  const selectionStyle = isSelected()
    ? 'outline: 2px solid #0066ff; outline-offset: -2px;'
    : isHovered()
    ? 'outline: 1px dashed #0066ff; outline-offset: -1px;'
    : '';

  // Render children recursively
  const children = currentNode.children.map((childId) => (
    <CanvasNode
      key={childId}
      store={store}
      nodeId={childId}
      onNodeClick={onNodeClick}
      onNodeDoubleClick={onNodeDoubleClick}
      onContextMenu={onContextMenu}
      renderNode={renderNode}
    />
  ));

  // Use custom renderer if provided
  if (renderNode) {
    return renderNode(currentNode, children);
  }

  // Use component definition renderer if available
  const def = componentDef();
  if (def?.render) {
    return (
      <div
        data-builder-node={nodeId}
        style={`${styleString}; ${selectionStyle}; position: relative;`}
        onClick={handleClick}
        onDblClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {def.render(currentNode.props, children)}
      </div>
    );
  }

  // Default rendering based on node type
  const Tag = getElementTag(currentNode.type);

  return (
    <Tag
      data-builder-node={nodeId}
      style={`${styleString}; ${selectionStyle}; position: relative;`}
      onClick={handleClick}
      onDblClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...getNodeAttributes(currentNode)}
    >
      {currentNode.type === 'Text' ? currentNode.props.content : children}
    </Tag>
  );
}

/**
 * Get the HTML tag for a node type
 */
function getElementTag(type: string): string {
  const tagMap: Record<string, string> = {
    Frame: 'div',
    Box: 'div',
    Flex: 'div',
    Grid: 'div',
    Text: 'span',
    Heading: 'h2',
    Paragraph: 'p',
    Button: 'button',
    Input: 'input',
    Image: 'img',
    Link: 'a',
    List: 'ul',
    ListItem: 'li',
    Section: 'section',
    Article: 'article',
    Header: 'header',
    Footer: 'footer',
    Nav: 'nav',
    Aside: 'aside',
    Main: 'main',
  };

  return tagMap[type] || 'div';
}

/**
 * Get HTML attributes from node props
 */
function getNodeAttributes(node: ComponentNode): Record<string, any> {
  const attrs: Record<string, any> = {};

  if (node.props.id) attrs.id = node.props.id;
  if (node.props.className) attrs.class = node.props.className;
  if (node.props.href) attrs.href = node.props.href;
  if (node.props.src) attrs.src = node.props.src;
  if (node.props.alt) attrs.alt = node.props.alt;
  if (node.props.placeholder) attrs.placeholder = node.props.placeholder;
  if (node.props.type) attrs.type = node.props.type;
  if (node.props.disabled) attrs.disabled = node.props.disabled;

  return attrs;
}

// ============================================================================
// Main Canvas Component
// ============================================================================

export function Canvas({
  store,
  width,
  height,
  className,
  style,
  onNodeClick,
  onNodeDoubleClick,
  onCanvasClick,
  onContextMenu,
  renderNode,
}: CanvasProps) {
  // Local state for panning
  const canvasState = signal<CanvasState>({
    isPanning: false,
    panStart: { x: 0, y: 0 },
    lastPan: { x: 0, y: 0 },
  });

  const viewport = store.viewport;
  const canvas = store.canvas;
  const rootId = store.rootId;

  // Memos for computed values
  const containerStyle = memo(() => {
    const vp = viewport();
    const canvasSettings = canvas();
    const rulerOffset = canvasSettings.rulers ? 20 : 0;

    return {
      position: 'relative' as const,
      width: width ?? '100%',
      height: height ?? '100%',
      overflow: 'hidden',
      backgroundColor: '#2a2a2a',
      ...style,
    };
  });

  const canvasStyle = memo(() => {
    const vp = viewport();
    const canvasSettings = canvas();
    const rulerOffset = canvasSettings.rulers ? 20 : 0;

    return {
      position: 'absolute' as const,
      top: rulerOffset,
      left: rulerOffset,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      cursor: canvasState().isPanning ? 'grabbing' : 'default',
    };
  });

  const artboardStyle = memo(() => {
    const vp = viewport();
    const canvasSettings = canvas();

    return {
      position: 'absolute' as const,
      width: canvasSettings.width,
      height: canvasSettings.height,
      backgroundColor: canvasSettings.backgroundColor,
      boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      transform: `translate(${vp.panX}px, ${vp.panY}px) scale(${vp.zoom})`,
      transformOrigin: '0 0',
    };
  });

  // Event handlers
  const handleCanvasClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.hasAttribute('data-builder-canvas')) {
      store.dispatch({ type: 'DESELECT_ALL' });
      onCanvasClick?.(event);
    }
  };

  const handleNodeClick = (nodeId: NodeId, event: MouseEvent) => {
    const addToSelection = event.shiftKey || event.ctrlKey || event.metaKey;
    store.dispatch({ type: 'SELECT_NODE', payload: { nodeId, addToSelection } });
    onNodeClick?.(nodeId, event);
  };

  const handleNodeDoubleClick = (nodeId: NodeId, event: MouseEvent) => {
    onNodeDoubleClick?.(nodeId, event);
  };

  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const nodeElement = target.closest('[data-builder-node]') as HTMLElement;
    const nodeId = nodeElement?.getAttribute('data-builder-node') || null;
    onContextMenu?.(nodeId, event);
  };

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      // Zoom
      const delta = -event.deltaY * 0.001;
      const currentZoom = viewport().zoom;
      const newZoom = Math.max(
        canvas().zoom.min,
        Math.min(canvas().zoom.max, currentZoom + delta)
      );

      // Zoom towards mouse position
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const vp = viewport();
      const zoomFactor = newZoom / currentZoom;
      const newPanX = mouseX - (mouseX - vp.panX) * zoomFactor;
      const newPanY = mouseY - (mouseY - vp.panY) * zoomFactor;

      store.dispatch({ type: 'SET_ZOOM', payload: { zoom: newZoom } });
      store.dispatch({ type: 'SET_PAN', payload: { x: newPanX, y: newPanY } });
    } else {
      // Pan
      const vp = viewport();
      store.dispatch({
        type: 'SET_PAN',
        payload: {
          x: vp.panX - event.deltaX,
          y: vp.panY - event.deltaY,
        },
      });
    }
  };

  const handleMouseDown = (event: MouseEvent) => {
    // Middle mouse button or space + left click for panning
    if (event.button === 1 || (event.button === 0 && event.altKey)) {
      event.preventDefault();
      const vp = viewport();
      canvasState.set({
        isPanning: true,
        panStart: { x: event.clientX, y: event.clientY },
        lastPan: { x: vp.panX, y: vp.panY },
      });
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    const state = canvasState();
    if (state.isPanning) {
      const dx = event.clientX - state.panStart.x;
      const dy = event.clientY - state.panStart.y;
      store.dispatch({
        type: 'SET_PAN',
        payload: {
          x: state.lastPan.x + dx,
          y: state.lastPan.y + dy,
        },
      });
    }
  };

  const handleMouseUp = () => {
    if (canvasState().isPanning) {
      canvasState.set({
        ...canvasState(),
        isPanning: false,
      });
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = (event: KeyboardEvent) => {
    // Delete selected nodes
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const selectedIds = store.selection().selectedIds;
      if (selectedIds.length > 0) {
        event.preventDefault();
        store.dispatch({ type: 'DELETE_NODES', payload: { nodeIds: selectedIds } });
      }
    }

    // Duplicate
    if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
      event.preventDefault();
      const selectedIds = store.selection().selectedIds;
      if (selectedIds.length > 0) {
        store.dispatch({ type: 'DUPLICATE_NODES', payload: { nodeIds: selectedIds } });
      }
    }

    // Copy
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      const selectedIds = store.selection().selectedIds;
      if (selectedIds.length > 0) {
        store.dispatch({ type: 'COPY_NODES', payload: { nodeIds: selectedIds } });
      }
    }

    // Paste
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      const root = rootId();
      store.dispatch({ type: 'PASTE_NODES', payload: { parentId: root } });
    }

    // Undo
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      store.dispatch({ type: 'UNDO' });
    }

    // Redo
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) {
      event.preventDefault();
      store.dispatch({ type: 'REDO' });
    }

    // Select all
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault();
      const allIds = Object.keys(store.nodes()).filter((id) => id !== rootId());
      store.dispatch({ type: 'SELECT_NODES', payload: { nodeIds: allIds } });
    }

    // Fit to screen
    if ((event.ctrlKey || event.metaKey) && event.key === '0') {
      event.preventDefault();
      store.dispatch({ type: 'FIT_TO_SCREEN' });
    }
  };

  return (
    <div
      class={className}
      style={containerStyle()}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <CanvasRulers settings={canvas()} viewport={viewport()} />

      <div
        data-builder-canvas
        style={canvasStyle()}
        onClick={handleCanvasClick}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <CanvasGrid settings={canvas()} viewport={viewport()} />

        <div style={artboardStyle()}>
          <CanvasNode
            store={store}
            nodeId={rootId()}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onContextMenu={(nodeId, event) => onContextMenu?.(nodeId, event)}
            renderNode={renderNode}
          />
        </div>
      </div>
    </div>
  );
}

export default Canvas;
