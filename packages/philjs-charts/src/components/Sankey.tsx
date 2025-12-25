/**
 * Sankey - Signal-based Sankey diagram component
 */

import type { SankeyProps, SankeyData, SankeyNode, SankeyLink } from '../types';
import { lightTheme, darkTheme, defaultPalette, hexToRgba } from '../utils/colors';
import { defaultAnimationConfig } from '../utils/animations';

// Check if value is a signal
function isSignal<T>(value: T | (() => T)): value is () => T {
  return typeof value === 'function';
}

// Get data from signal or direct value
function getData<T>(value: T | (() => T)): T {
  return isSignal(value) ? value() : value;
}

interface LayoutNode extends SankeyNode {
  x: number;
  y: number;
  height: number;
  sourceLinks: LayoutLink[];
  targetLinks: LayoutLink[];
  value: number;
  layer: number;
}

interface LayoutLink extends SankeyLink {
  sourceNode: LayoutNode;
  targetNode: LayoutNode;
  width: number;
  sourceY: number;
  targetY: number;
}

export function Sankey(props: SankeyProps) {
  const {
    data: dataOrSignal,
    width = '100%',
    height = 400,
    responsive = true,
    margin = { top: 20, right: 20, bottom: 20, left: 20 },
    theme = 'light',
    animation = defaultAnimationConfig,
    className = '',
    style = {},
    ariaLabel = 'Sankey diagram',
    title,
    nodeWidth = 20,
    nodePadding = 10,
    nodeAlign = 'justify',
    linkOpacity = 0.5,
    nodeBorderRadius = 2,
    showLabels = true,
    tooltip = { show: true },
    onNodeClick,
    onLinkClick,
  } = props;

  // Get reactive data
  const sankeyData = getData(dataOrSignal);

  // Resolve theme
  const resolvedTheme = typeof theme === 'string'
    ? (theme === 'dark' ? darkTheme : lightTheme)
    : theme;

  // Calculate dimensions
  const svgWidth = typeof width === 'number' ? width : 800;
  const svgHeight = typeof height === 'number' ? height : 400;
  const chartWidth = svgWidth - (margin.left || 0) - (margin.right || 0);
  const chartHeight = svgHeight - (margin.top || 0) - (margin.bottom || 0);

  // Build layout
  const { nodes, links } = computeLayout(
    sankeyData,
    chartWidth,
    chartHeight,
    nodeWidth,
    nodePadding,
    nodeAlign
  );

  // Animation attributes
  const animationDuration = animation === false ? 0 :
    (typeof animation === 'object' ? animation.duration : defaultAnimationConfig.duration);

  // Generate link path
  const generateLinkPath = (link: LayoutLink): string => {
    const sourceX = link.sourceNode.x + nodeWidth;
    const targetX = link.targetNode.x;
    const sourceY = link.sourceY + link.width / 2;
    const targetY = link.targetY + link.width / 2;

    const curvature = 0.5;
    const xi = (sourceX + targetX) * curvature;

    return `
      M ${sourceX} ${link.sourceY}
      C ${xi} ${link.sourceY}, ${xi} ${link.targetY}, ${targetX} ${link.targetY}
      L ${targetX} ${link.targetY + link.width}
      C ${xi} ${link.targetY + link.width}, ${xi} ${link.sourceY + link.width}, ${sourceX} ${link.sourceY + link.width}
      Z
    `;
  };

  return (
    <svg
      width={responsive ? '100%' : svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      class={`philjs-sankey ${className}`}
      style={{
        backgroundColor: resolvedTheme.background,
        ...style,
      }}
      role="img"
      aria-label={ariaLabel}
    >
      {title && <title>{title}</title>}

      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* Links */}
        <g class="links">
          {links.map((link, index) => {
            const color = link.color ||
              link.sourceNode.color ||
              resolvedTheme.colors[nodes.indexOf(link.sourceNode) % resolvedTheme.colors.length];

            return (
              <path
                key={`link-${index}`}
                d={generateLinkPath(link)}
                fill={hexToRgba(color, linkOpacity)}
                stroke="none"
                style={{ cursor: onLinkClick ? 'pointer' : 'default' }}
                onClick={() => onLinkClick?.(link)}
              >
                {animationDuration > 0 && (
                  <animate
                    attributeName="opacity"
                    from="0"
                    to={linkOpacity.toString()}
                    dur={`${animationDuration}ms`}
                    fill="freeze"
                    begin={`${index * 30}ms`}
                  />
                )}
              </path>
            );
          })}
        </g>

        {/* Nodes */}
        <g class="nodes">
          {nodes.map((node, index) => {
            const color = node.color ||
              resolvedTheme.colors[index % resolvedTheme.colors.length];

            return (
              <g
                key={`node-${index}`}
                class="sankey-node"
                style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
                onClick={() => onNodeClick?.(node)}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={nodeWidth}
                  height={node.height}
                  fill={color}
                  rx={nodeBorderRadius}
                  ry={nodeBorderRadius}
                >
                  {animationDuration > 0 && (
                    <animate
                      attributeName="height"
                      from="0"
                      to={node.height.toString()}
                      dur={`${animationDuration}ms`}
                      fill="freeze"
                    />
                  )}
                </rect>

                {showLabels && (
                  <text
                    x={node.layer === 0 ? node.x - 6 : node.x + nodeWidth + 6}
                    y={node.y + node.height / 2}
                    text-anchor={node.layer === 0 ? 'end' : 'start'}
                    dominant-baseline="middle"
                    fill={resolvedTheme.text}
                    font-size="12"
                  >
                    {node.name}
                  </text>
                )}

                {showLabels && node.height > 20 && (
                  <text
                    x={node.x + nodeWidth / 2}
                    y={node.y + node.height / 2}
                    text-anchor="middle"
                    dominant-baseline="middle"
                    fill={resolvedTheme.background}
                    font-size="10"
                    font-weight="bold"
                  >
                    {node.value.toLocaleString()}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </g>
    </svg>
  );
}

// Compute Sankey layout
function computeLayout(
  data: SankeyData,
  width: number,
  height: number,
  nodeWidth: number,
  nodePadding: number,
  nodeAlign: string
): { nodes: LayoutNode[]; links: LayoutLink[] } {
  // Initialize nodes
  const nodeMap = new Map<string | number, LayoutNode>();

  data.nodes.forEach((node, index) => {
    nodeMap.set(node.name, {
      ...node,
      x: 0,
      y: 0,
      height: 0,
      sourceLinks: [],
      targetLinks: [],
      value: 0,
      layer: 0,
    });
    nodeMap.set(index, nodeMap.get(node.name)!);
  });

  // Initialize links and compute node values
  const layoutLinks: LayoutLink[] = data.links.map(link => {
    const sourceNode = typeof link.source === 'number'
      ? nodeMap.get(link.source)!
      : nodeMap.get(link.source)!;
    const targetNode = typeof link.target === 'number'
      ? nodeMap.get(link.target)!
      : nodeMap.get(link.target)!;

    const layoutLink: LayoutLink = {
      ...link,
      sourceNode,
      targetNode,
      width: 0,
      sourceY: 0,
      targetY: 0,
    };

    sourceNode.sourceLinks.push(layoutLink);
    targetNode.targetLinks.push(layoutLink);

    return layoutLink;
  });

  const layoutNodes = Array.from(new Set(nodeMap.values()));

  // Compute node values (sum of link values)
  layoutNodes.forEach(node => {
    const sourceValue = node.sourceLinks.reduce((sum, l) => sum + l.value, 0);
    const targetValue = node.targetLinks.reduce((sum, l) => sum + l.value, 0);
    node.value = Math.max(sourceValue, targetValue);
  });

  // Compute layers using BFS
  const visited = new Set<LayoutNode>();
  const queue: LayoutNode[] = layoutNodes.filter(n => n.targetLinks.length === 0);
  queue.forEach(n => {
    n.layer = 0;
    visited.add(n);
  });

  while (queue.length > 0) {
    const node = queue.shift()!;
    node.sourceLinks.forEach(link => {
      if (!visited.has(link.targetNode)) {
        link.targetNode.layer = node.layer + 1;
        visited.add(link.targetNode);
        queue.push(link.targetNode);
      }
    });
  }

  // Find max layer
  const maxLayer = Math.max(...layoutNodes.map(n => n.layer));

  // Compute x positions
  const layerWidth = (width - nodeWidth) / Math.max(1, maxLayer);
  layoutNodes.forEach(node => {
    node.x = node.layer * layerWidth;
  });

  // Compute y positions and heights
  const layers: LayoutNode[][] = [];
  for (let i = 0; i <= maxLayer; i++) {
    layers[i] = layoutNodes.filter(n => n.layer === i);
  }

  layers.forEach(layer => {
    const totalValue = layer.reduce((sum, n) => sum + n.value, 0);
    const totalPadding = (layer.length - 1) * nodePadding;
    const availableHeight = height - totalPadding;
    const scale = totalValue > 0 ? availableHeight / totalValue : 1;

    let y = 0;
    layer.forEach(node => {
      node.y = y;
      node.height = Math.max(1, node.value * scale);
      y += node.height + nodePadding;
    });

    // Center vertically
    const totalHeight = y - nodePadding;
    const offset = (height - totalHeight) / 2;
    layer.forEach(node => {
      node.y += offset;
    });
  });

  // Compute link positions
  layoutNodes.forEach(node => {
    // Sort links by target y position
    node.sourceLinks.sort((a, b) => a.targetNode.y - b.targetNode.y);
    node.targetLinks.sort((a, b) => a.sourceNode.y - b.sourceNode.y);

    // Compute source Y positions
    let sourceY = node.y;
    node.sourceLinks.forEach(link => {
      const linkHeight = node.height * (link.value / node.value);
      link.sourceY = sourceY;
      link.width = linkHeight;
      sourceY += linkHeight;
    });

    // Compute target Y positions
    let targetY = node.y;
    node.targetLinks.forEach(link => {
      const linkHeight = node.height * (link.value / node.value);
      link.targetY = targetY;
      if (!link.width) link.width = linkHeight;
      targetY += linkHeight;
    });
  });

  return { nodes: layoutNodes, links: layoutLinks };
}

export default Sankey;
