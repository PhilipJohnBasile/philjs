/**
 * FlameGraph - Flame graph visualization for distributed traces
 *
 * Displays hierarchical span data as a flame graph with
 * interactive zoom and detailed tooltips.
 */

import { signal, memo } from 'philjs-core';
import type { Span } from '../index';

// ============================================================================
// Types
// ============================================================================

export interface FlameGraphNode {
  id: string;
  name: string;
  value: number; // duration in ms
  children: FlameGraphNode[];
  span?: Span;
  depth?: number;
}

export interface FlameGraphProps {
  root: FlameGraphNode;
  width?: number;
  height?: number;
  rowHeight?: number;
  onNodeClick?: (node: FlameGraphNode) => void;
  formatDuration?: (ms: number) => string;
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: `
    background: #1a1a2e;
    border-radius: 8px;
    padding: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow-x: auto;
  `,
  header: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  `,
  title: `
    color: #e0e0ff;
    font-size: 14px;
    font-weight: 600;
  `,
  controls: `
    display: flex;
    gap: 8px;
  `,
  button: `
    background: #2a2a4e;
    border: 1px solid #3a3a6e;
    border-radius: 4px;
    color: #a0a0c0;
    padding: 4px 12px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  `,
  buttonHover: `
    background: #3a3a6e;
    color: #e0e0ff;
  `,
  svg: `
    display: block;
  `,
  node: `
    cursor: pointer;
    transition: opacity 0.2s ease;
  `,
  nodeRect: `
    stroke: rgba(0, 0, 0, 0.3);
    stroke-width: 1;
  `,
  nodeText: `
    fill: #ffffff;
    font-size: 11px;
    font-weight: 500;
    pointer-events: none;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  `,
  tooltip: `
    position: fixed;
    background: #2a2a4e;
    border: 1px solid #3a3a6e;
    border-radius: 6px;
    padding: 12px 16px;
    font-size: 12px;
    color: #e0e0ff;
    pointer-events: none;
    z-index: 1000;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    max-width: 400px;
  `,
  tooltipTitle: `
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 8px;
    color: #ffffff;
    word-break: break-all;
  `,
  tooltipRow: `
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 4px;
  `,
  tooltipLabel: `
    color: #8a8aaa;
  `,
  tooltipValue: `
    font-weight: 500;
  `,
  breadcrumb: `
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 12px;
    color: #8a8aaa;
  `,
  breadcrumbItem: `
    cursor: pointer;
    color: #6366f1;
    transition: color 0.2s ease;
  `,
  breadcrumbSeparator: `
    color: #4a4a6a;
  `,
};

// ============================================================================
// Color Generation
// ============================================================================

function getNodeColor(name: string, depth: number): string {
  // Generate consistent color based on name hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash;
  }

  // Use different color ranges based on depth
  const hue = (Math.abs(hash) % 60) + (depth % 2 === 0 ? 0 : 180); // Orange or Blue range
  const saturation = 65 + (Math.abs(hash >> 8) % 20);
  const lightness = 45 + (Math.abs(hash >> 16) % 15);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// ============================================================================
// Helper Functions
// ============================================================================

function flattenNodes(
  node: FlameGraphNode,
  depth: number = 0,
  startX: number = 0,
  totalWidth: number = 1
): Array<{ node: FlameGraphNode; depth: number; x: number; width: number }> {
  const result: Array<{ node: FlameGraphNode; depth: number; x: number; width: number }> = [];
  const nodeWidth = (node.value / (node.value || 1)) * totalWidth;

  result.push({ node: { ...node, depth }, depth, x: startX, width: nodeWidth });

  let childX = startX;
  for (const child of node.children) {
    const childWidth = (child.value / node.value) * nodeWidth;
    result.push(...flattenNodes(child, depth + 1, childX, childWidth));
    childX += childWidth;
  }

  return result;
}

function formatDefaultDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms >= 1) return `${ms.toFixed(2)}ms`;
  return `${(ms * 1000).toFixed(0)}us`;
}

// ============================================================================
// Component
// ============================================================================

export function FlameGraph(props: FlameGraphProps) {
  const {
    root,
    width = 800,
    height = 400,
    rowHeight = 24,
    onNodeClick,
    formatDuration = formatDefaultDuration,
    className = '',
  } = props;

  const zoomStack = signal<FlameGraphNode[]>([root]);
  const hoveredNode = signal<{ node: FlameGraphNode; x: number; y: number } | null>(null);

  const currentRoot = memo(() => zoomStack()[zoomStack().length - 1]);

  // Flatten the tree for rendering
  const flatNodes = memo(() => {
    const nodes = flattenNodes(currentRoot());
    const maxDepth = Math.max(...nodes.map(n => n.depth));
    return { nodes, maxDepth };
  });

  const calculatedHeight = memo(() => (flatNodes().maxDepth + 1) * rowHeight + 40);
  const effectiveHeight = Math.min(height, calculatedHeight());

  const handleNodeClick = (node: FlameGraphNode) => {
    if (node.children.length > 0) {
      zoomStack.set([...zoomStack(), node]);
    }
    onNodeClick?.(node);
  };

  const handleZoomOut = () => {
    if (zoomStack().length > 1) {
      zoomStack.set(zoomStack().slice(0, -1));
    }
  };

  const handleReset = () => {
    zoomStack.set([root]);
  };

  const handleMouseEnter = (node: FlameGraphNode, e: MouseEvent) => {
    hoveredNode.set({ node, x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (hoveredNode()) {
      hoveredNode.set({ ...hoveredNode()!, x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    hoveredNode.set(null);
  };

  return (
    <div style={styles.container} class={className}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>Flame Graph</span>
        <div style={styles.controls}>
          <button
            style={styles.button}
            onClick={handleZoomOut}
            disabled={zoomStack().length <= 1}
          >
            Zoom Out
          </button>
          <button
            style={styles.button}
            onClick={handleReset}
            disabled={zoomStack().length <= 1}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      {zoomStack().length > 1 && (
        <div style={styles.breadcrumb}>
          {zoomStack().map((node, i) => (
            <>
              {i > 0 && <span style={styles.breadcrumbSeparator}>/</span>}
              <span
                style={styles.breadcrumbItem}
                onClick={() => zoomStack.set(zoomStack().slice(0, i + 1))}
              >
                {node.name}
              </span>
            </>
          ))}
        </div>
      )}

      {/* Flame Graph SVG */}
      <svg
        width={width}
        height={effectiveHeight}
        style={styles.svg}
        onMouseMove={handleMouseMove}
      >
        {flatNodes().nodes.map(({ node, depth, x, width: nodeWidth }) => {
          const rectWidth = Math.max(nodeWidth * width - 2, 0);
          const rectX = x * width;
          const rectY = depth * rowHeight;
          const color = getNodeColor(node.name, depth);
          const textVisible = rectWidth > 40;

          return (
            <g
              style={styles.node}
              onClick={() => handleNodeClick(node)}
              onMouseEnter={(e: MouseEvent) => handleMouseEnter(node, e)}
              onMouseLeave={handleMouseLeave}
            >
              <rect
                x={rectX}
                y={rectY}
                width={rectWidth}
                height={rowHeight - 2}
                fill={color}
                style={styles.nodeRect}
                rx={2}
              />
              {textVisible && (
                <text
                  x={rectX + 4}
                  y={rectY + rowHeight / 2 + 4}
                  style={styles.nodeText}
                >
                  {node.name.length > rectWidth / 7
                    ? node.name.slice(0, Math.floor(rectWidth / 7) - 2) + '...'
                    : node.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredNode() && (
        <div
          style={styles.tooltip + `left: ${hoveredNode()!.x + 10}px; top: ${hoveredNode()!.y + 10}px;`}
        >
          <div style={styles.tooltipTitle}>{hoveredNode()!.node.name}</div>
          <div style={styles.tooltipRow}>
            <span style={styles.tooltipLabel}>Duration:</span>
            <span style={styles.tooltipValue}>{formatDuration(hoveredNode()!.node.value)}</span>
          </div>
          {hoveredNode()!.node.span && (
            <>
              <div style={styles.tooltipRow}>
                <span style={styles.tooltipLabel}>Span ID:</span>
                <span style={styles.tooltipValue}>{hoveredNode()!.node.span!.spanId.slice(0, 8)}</span>
              </div>
              <div style={styles.tooltipRow}>
                <span style={styles.tooltipLabel}>Status:</span>
                <span style={styles.tooltipValue + `color: ${hoveredNode()!.node.span!.status === 'error' ? '#ef4444' : '#22c55e'};`}>
                  {hoveredNode()!.node.span!.status}
                </span>
              </div>
            </>
          )}
          {hoveredNode()!.node.children.length > 0 && (
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #3a3a6e; color: #6a6a8a; font-size: 11px;">
              Click to zoom into this span
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Utility: Convert spans to FlameGraphNode
// ============================================================================

export function spansToFlameGraph(spans: Span[]): FlameGraphNode | null {
  if (spans.length === 0) return null;

  // Find root span (no parent)
  const rootSpan = spans.find(s => !s.parentSpanId);
  if (!rootSpan) return null;

  function buildNode(span: Span): FlameGraphNode {
    const children = spans
      .filter(s => s.parentSpanId === span.spanId)
      .map(buildNode);

    return {
      id: span.spanId,
      name: span.name,
      value: (span.endTime || Date.now()) - span.startTime,
      children,
      span,
    };
  }

  return buildNode(rootSpan);
}

export default FlameGraph;
