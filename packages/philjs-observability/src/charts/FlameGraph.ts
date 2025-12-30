/**
 * FlameGraph - Visualization for performance profiling and tracing
 */

import type { Span } from '../index.js';

export interface FlameGraphNode {
  name: string;
  value: number;
  children: FlameGraphNode[];
  color?: string;
  depth?: number;
}

export interface FlameGraphProps {
  root: FlameGraphNode;
  width?: number;
  height?: number;
  cellHeight?: number;
  colorScheme?: 'warm' | 'cool' | 'gradient';
  showLabels?: boolean;
  minWidth?: number;
  className?: string;
  onClick?: (node: FlameGraphNode) => void;
}

/**
 * Convert spans to a flame graph structure
 */
export function spansToFlameGraph(spans: Span[]): FlameGraphNode {
  const spanMap = new Map<string, FlameGraphNode>();
  const rootSpans: FlameGraphNode[] = [];

  // Create nodes for all spans
  for (const span of spans) {
    const node: FlameGraphNode = {
      name: span.name,
      value: (span.endTime || Date.now()) - span.startTime,
      children: [],
      depth: 0,
    };
    spanMap.set(span.spanId, node);
  }

  // Build tree structure
  for (const span of spans) {
    const node = spanMap.get(span.spanId)!;
    if (span.parentSpanId) {
      const parent = spanMap.get(span.parentSpanId);
      if (parent) {
        parent.children.push(node);
        node.depth = (parent.depth || 0) + 1;
      } else {
        rootSpans.push(node);
      }
    } else {
      rootSpans.push(node);
    }
  }

  // If multiple root spans, wrap them
  if (rootSpans.length === 1) {
    return rootSpans[0]!;
  }

  return {
    name: 'root',
    value: rootSpans.reduce((sum, s) => sum + s.value, 0),
    children: rootSpans,
  };
}

function getColor(depth: number, scheme: 'warm' | 'cool' | 'gradient'): string {
  switch (scheme) {
    case 'warm':
      return `hsl(${30 + depth * 10}, 80%, ${60 - depth * 5}%)`;
    case 'cool':
      return `hsl(${200 + depth * 15}, 70%, ${50 - depth * 3}%)`;
    case 'gradient':
    default:
      return `hsl(${depth * 30}, 70%, 55%)`;
  }
}

export function FlameGraph(props: FlameGraphProps): string {
  const {
    root,
    width = 800,
    height = 400,
    cellHeight = 20,
    colorScheme = 'warm',
    showLabels = true,
    minWidth = 5,
    className = '',
  } = props;

  const rects: string[] = [];

  function renderNode(node: FlameGraphNode, x: number, y: number, nodeWidth: number, depth: number): void {
    if (nodeWidth < minWidth) return;

    const color = node.color || getColor(depth, colorScheme);
    const textFits = nodeWidth > 50;

    rects.push(`
      <g>
        <rect x="${x}" y="${y}" width="${nodeWidth - 1}" height="${cellHeight - 1}" fill="${color}" stroke="#fff" stroke-width="0.5" />
        ${showLabels && textFits ? `<text x="${x + 3}" y="${y + cellHeight - 5}" font-size="11" fill="#000" clip-path="url(#clip-${x}-${y})">${node.name}</text>` : ''}
      </g>
    `);

    // Render children
    let childX = x;
    const totalChildValue = node.children.reduce((sum, c) => sum + c.value, 0);

    for (const child of node.children) {
      const childWidth = (child.value / (totalChildValue || 1)) * nodeWidth;
      renderNode(child, childX, y + cellHeight, childWidth, depth + 1);
      childX += childWidth;
    }
  }

  renderNode(root, 0, 0, width, 0);

  return `
    <svg width="${width}" height="${height}" class="${className}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="flame-clip">
          <rect x="0" y="0" width="${width}" height="${height}" />
        </clipPath>
      </defs>
      <g clip-path="url(#flame-clip)">
        ${rects.join('')}
      </g>
    </svg>
  `;
}
