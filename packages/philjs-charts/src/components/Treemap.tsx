/**
 * Treemap - Signal-based treemap visualization component
 */

import type { TreemapProps, TreemapNode } from '../types';
import { lightTheme, darkTheme, defaultPalette, getContrastColor, hexToRgba } from '../utils/colors';
import { defaultAnimationConfig } from '../utils/animations';

// Check if value is a signal
function isSignal<T>(value: T | (() => T)): value is () => T {
  return typeof value === 'function';
}

// Get data from signal or direct value
function getData<T>(value: T | (() => T)): T {
  return isSignal(value) ? value() : value;
}

interface LayoutNode extends TreemapNode {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  colorIndex: number;
}

export function Treemap(props: TreemapProps) {
  const {
    data: dataOrSignal,
    width = '100%',
    height = 300,
    responsive = true,
    margin = { top: 10, right: 10, bottom: 10, left: 10 },
    theme = 'light',
    animation = defaultAnimationConfig,
    className = '',
    style = {},
    ariaLabel = 'Treemap',
    title,
    dataKey = 'value',
    aspectRatio = 1,
    colorBy = 'category',
    showLabels = true,
    nestedAnimation = true,
    tooltip = { show: true },
    onNodeClick,
  } = props;

  // Get reactive data
  const data = getData(dataOrSignal);

  // Resolve theme
  const resolvedTheme = typeof theme === 'string'
    ? (theme === 'dark' ? darkTheme : lightTheme)
    : theme;

  // Calculate dimensions
  const svgWidth = typeof width === 'number' ? width : 600;
  const svgHeight = typeof height === 'number' ? height : 300;
  const chartWidth = svgWidth - (margin.left || 0) - (margin.right || 0);
  const chartHeight = svgHeight - (margin.top || 0) - (margin.bottom || 0);

  // Calculate node value recursively
  const getNodeValue = (node: TreemapNode): number => {
    if (node.children && node.children.length > 0) {
      return node.children.reduce((sum, child) => sum + getNodeValue(child), 0);
    }
    return (node[dataKey] as number) || node.value || 0;
  };

  // Squarified treemap layout algorithm
  const squarify = (
    nodes: TreemapNode[],
    x: number,
    y: number,
    w: number,
    h: number,
    depth: number,
    colorIndex: number
  ): LayoutNode[] => {
    if (!nodes.length) return [];

    const totalValue = nodes.reduce((sum, n) => sum + getNodeValue(n), 0);
    if (totalValue === 0) return [];

    const result: LayoutNode[] = [];
    let remaining = [...nodes];
    let currentX = x;
    let currentY = y;
    let remainingW = w;
    let remainingH = h;

    while (remaining.length > 0) {
      // Sort by value descending
      remaining.sort((a, b) => getNodeValue(b) - getNodeValue(a));

      const isWide = remainingW >= remainingH;
      const side = isWide ? remainingH : remainingW;

      // Find the best row
      let row: TreemapNode[] = [];
      let rowValue = 0;
      let worstRatio = Infinity;

      for (const node of remaining) {
        const testRow = [...row, node];
        const testValue = rowValue + getNodeValue(node);
        const testRatio = calculateWorstRatio(testRow, side, totalValue, remainingW, remainingH);

        if (testRatio <= worstRatio) {
          row = testRow;
          rowValue = testValue;
          worstRatio = testRatio;
        } else {
          break;
        }
      }

      // Layout the row
      const rowRatio = rowValue / (nodes.reduce((sum, n) => sum + getNodeValue(n), 0) || 1);
      const rowSize = isWide ? remainingW * rowRatio : remainingH * rowRatio;

      let offset = 0;
      row.forEach((node, i) => {
        const nodeValue = getNodeValue(node);
        const nodeRatio = nodeValue / rowValue;
        const nodeSize = isWide ? remainingH * nodeRatio : remainingW * nodeRatio;

        const nodeX = isWide ? currentX : currentX + offset;
        const nodeY = isWide ? currentY + offset : currentY;
        const nodeW = isWide ? rowSize : nodeSize;
        const nodeH = isWide ? nodeSize : rowSize;

        const nodeColorIndex = colorBy === 'depth' ? depth : colorIndex + i;

        const layoutNode: LayoutNode = {
          ...node,
          x: nodeX,
          y: nodeY,
          width: nodeW,
          height: nodeH,
          depth,
          colorIndex: nodeColorIndex,
        };

        result.push(layoutNode);

        // Recursively layout children
        if (node.children && node.children.length > 0) {
          const childPadding = 2;
          const childNodes = squarify(
            node.children,
            nodeX + childPadding,
            nodeY + childPadding,
            nodeW - childPadding * 2,
            nodeH - childPadding * 2,
            depth + 1,
            nodeColorIndex
          );
          result.push(...childNodes);
        }

        offset += nodeSize;
      });

      // Update remaining area
      if (isWide) {
        currentX += rowSize;
        remainingW -= rowSize;
      } else {
        currentY += rowSize;
        remainingH -= rowSize;
      }

      remaining = remaining.filter(n => !row.includes(n));
    }

    return result;
  };

  const calculateWorstRatio = (
    row: TreemapNode[],
    side: number,
    totalValue: number,
    w: number,
    h: number
  ): number => {
    if (!row.length) return Infinity;

    const rowValue = row.reduce((sum, n) => sum + getNodeValue(n), 0);
    const area = (rowValue / totalValue) * w * h;
    const rowLength = area / side;

    let worst = 0;
    for (const node of row) {
      const nodeValue = getNodeValue(node);
      const nodeArea = (nodeValue / totalValue) * w * h;
      const nodeLength = nodeArea / rowLength;
      const ratio = Math.max(nodeLength / rowLength, rowLength / nodeLength);
      worst = Math.max(worst, ratio);
    }

    return worst;
  };

  // Generate layout
  const layoutNodes = squarify(data, 0, 0, chartWidth, chartHeight, 0, 0);

  // Get color for node
  const getNodeColor = (node: LayoutNode): string => {
    if (node.color) return node.color;

    switch (colorBy) {
      case 'depth':
        return hexToRgba(resolvedTheme.colors[0], 1 - node.depth * 0.2);
      case 'value':
        const values = layoutNodes.map(n => getNodeValue(n));
        const maxVal = Math.max(...values);
        const normalized = getNodeValue(node) / maxVal;
        const colorIdx = Math.floor(normalized * (resolvedTheme.colors.length - 1));
        return resolvedTheme.colors[colorIdx];
      default:
        return resolvedTheme.colors[node.colorIndex % resolvedTheme.colors.length];
    }
  };

  // Animation attributes
  const animationDuration = animation === false ? 0 :
    (typeof animation === 'object' ? animation.duration : defaultAnimationConfig.duration);

  return (
    <svg
      width={responsive ? '100%' : svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      class={`philjs-treemap ${className}`}
      style={{
        backgroundColor: resolvedTheme.background,
        ...style,
      }}
      role="img"
      aria-label={ariaLabel}
    >
      {title && <title>{title}</title>}

      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {layoutNodes
          .filter(node => node.width > 2 && node.height > 2)
          .map((node, index) => {
            const color = getNodeColor(node);
            const textColor = getContrastColor(color);
            const showLabel = showLabels && node.width > 40 && node.height > 20;

            return (
              <g
                key={`node-${index}`}
                class={`treemap-node depth-${node.depth}`}
                style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
                onClick={() => onNodeClick?.(node)}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  fill={color}
                  stroke={resolvedTheme.background}
                  stroke-width={1}
                >
                  {animationDuration > 0 && nestedAnimation && (
                    <animate
                      attributeName="opacity"
                      from="0"
                      to="1"
                      dur={`${animationDuration}ms`}
                      fill="freeze"
                      begin={`${node.depth * 100 + index * 10}ms`}
                    />
                  )}
                </rect>

                {showLabel && (
                  <text
                    x={node.x + node.width / 2}
                    y={node.y + node.height / 2}
                    text-anchor="middle"
                    dominant-baseline="middle"
                    fill={textColor}
                    font-size={Math.min(12, node.width / 6)}
                    font-weight={node.depth === 0 ? 'bold' : 'normal'}
                  >
                    {node.name}
                  </text>
                )}

                {showLabel && node.height > 35 && (
                  <text
                    x={node.x + node.width / 2}
                    y={node.y + node.height / 2 + 12}
                    text-anchor="middle"
                    dominant-baseline="middle"
                    fill={textColor}
                    font-size={Math.min(10, node.width / 8)}
                    opacity={0.8}
                  >
                    {getNodeValue(node).toLocaleString()}
                  </text>
                )}
              </g>
            );
          })}
      </g>
    </svg>
  );
}

export default Treemap;
