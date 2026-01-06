/**
 * @philjs/router - Route Visualization Tool
 *
 * Advanced visualization capabilities for route trees with SVG export,
 * Mermaid diagram generation, and interactive exploration.
 *
 * @example
 * ```tsx
 * import { RouteVisualizer, generateRouteDiagram, exportRoutesToSVG } from '@philjs/router/visualizer';
 *
 * // Component usage
 * function DevPage() {
 *   return <RouteVisualizer routes={routes} interactive />;
 * }
 *
 * // Export to Mermaid
 * const mermaid = generateRouteDiagram(routes, { format: 'mermaid' });
 *
 * // Export to SVG
 * const svg = await exportRoutesToSVG(routes);
 * ```
 */

import { signal, type Signal } from "@philjs/core";
import type { RouteTreeNode } from "./devtools.js";
import type { NestedRouteDefinition } from "./nested.js";
import type { RouteGroupMiddleware } from "./route-groups.js";

// ============================================================================
// Types
// ============================================================================

export interface VisualizerConfig {
  /** Theme for visualization */
  theme?: "light" | "dark" | "system";
  /** Show route metadata */
  showMetadata?: boolean;
  /** Show middleware chain */
  showMiddleware?: boolean;
  /** Show parameters */
  showParams?: boolean;
  /** Show query parameters */
  showQuery?: boolean;
  /** Enable interactive features */
  interactive?: boolean;
  /** Collapse level (number of levels to expand by default) */
  collapseLevel?: number;
  /** Node spacing */
  spacing?: { x: number; y: number };
  /** Node dimensions */
  nodeSize?: { width: number; height: number };
}

export interface RouteVisualization {
  /** Route ID */
  id: string;
  /** Display path */
  path: string;
  /** Full path from root */
  fullPath: string;
  /** Route metadata */
  metadata: RouteMetadata;
  /** Child routes */
  children: RouteVisualization[];
  /** Visual position */
  position: { x: number; y: number };
  /** Expansion state */
  expanded: boolean;
  /** Active state */
  isActive: boolean;
  /** Hover state */
  isHovered: boolean;
}

export interface RouteMetadata {
  /** Has loader function */
  hasLoader: boolean;
  /** Has action function */
  hasAction: boolean;
  /** Has error boundary */
  hasErrorBoundary: boolean;
  /** Has layout wrapper */
  hasLayout: boolean;
  /** Route parameters */
  params: string[];
  /** Query parameters */
  queryParams: string[];
  /** Middleware chain */
  middleware: MiddlewareInfo[];
  /** Guards */
  guards: string[];
  /** Custom metadata */
  custom: Record<string, unknown>;
}

export interface MiddlewareInfo {
  /** Middleware name */
  name: string;
  /** Middleware type */
  type: "auth" | "permission" | "rate-limit" | "logging" | "custom";
  /** Order in chain */
  order: number;
}

export interface DiagramOptions {
  /** Output format */
  format: "mermaid" | "dot" | "ascii" | "json";
  /** Include metadata */
  includeMetadata?: boolean;
  /** Direction for graph */
  direction?: "TB" | "BT" | "LR" | "RL";
  /** Title for diagram */
  title?: string;
}

export interface SVGExportOptions {
  /** Include styles */
  includeStyles?: boolean;
  /** Background color */
  background?: string;
  /** Padding around diagram */
  padding?: number;
  /** Scale factor */
  scale?: number;
  /** Font family */
  fontFamily?: string;
}

export interface PNGExportOptions extends SVGExportOptions {
  /** Image quality (0-1) */
  quality?: number;
}

// ============================================================================
// State
// ============================================================================

const visualizerState: Signal<{
  routes: RouteVisualization[];
  selectedRoute: string | null;
  hoveredRoute: string | null;
  config: Required<VisualizerConfig>;
}> = signal({
  routes: [],
  selectedRoute: null,
  hoveredRoute: null,
  config: {
    theme: "system",
    showMetadata: true,
    showMiddleware: true,
    showParams: true,
    showQuery: true,
    interactive: true,
    collapseLevel: 2,
    spacing: { x: 200, y: 80 },
    nodeSize: { width: 180, height: 60 },
  },
});

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Initialize the route visualizer with configuration
 */
export function initVisualizer(config?: VisualizerConfig): void {
  const state = visualizerState();
  visualizerState.set({
    ...state,
    config: { ...state.config, ...config },
  });
}

/**
 * Convert route definitions to visualization format
 */
export function createVisualization(
  routes: NestedRouteDefinition[] | RouteTreeNode[],
  config?: VisualizerConfig
): RouteVisualization[] {
  const mergedConfig = { ...visualizerState().config, ...config };
  return buildVisualizationTree(routes, "", 0, 0, mergedConfig);
}

/**
 * Update route visualization state
 */
export function updateVisualization(routes: RouteVisualization[]): void {
  const state = visualizerState();
  visualizerState.set({ ...state, routes });
}

/**
 * Select a route in the visualizer
 */
export function selectRoute(routeId: string | null): void {
  const state = visualizerState();
  visualizerState.set({ ...state, selectedRoute: routeId });
}

/**
 * Hover over a route
 */
export function hoverRoute(routeId: string | null): void {
  const state = visualizerState();
  visualizerState.set({ ...state, hoveredRoute: routeId });
}

/**
 * Toggle route expansion
 */
export function toggleRouteExpansion(routeId: string): void {
  const state = visualizerState();
  const routes = toggleExpanded(state.routes, routeId);
  visualizerState.set({ ...state, routes });
}

/**
 * Expand all routes
 */
export function expandAll(): void {
  const state = visualizerState();
  const routes = setAllExpanded(state.routes, true);
  visualizerState.set({ ...state, routes });
}

/**
 * Collapse all routes
 */
export function collapseAll(): void {
  const state = visualizerState();
  const routes = setAllExpanded(state.routes, false);
  visualizerState.set({ ...state, routes });
}

// ============================================================================
// Diagram Generation
// ============================================================================

/**
 * Generate a route diagram in various formats
 */
export function generateRouteDiagram(
  routes: NestedRouteDefinition[] | RouteTreeNode[],
  options: DiagramOptions = { format: "mermaid" }
): string {
  const visualization = createVisualization(routes);

  switch (options.format) {
    case "mermaid":
      return generateMermaidDiagram(visualization, options);
    case "dot":
      return generateDotDiagram(visualization, options);
    case "ascii":
      return generateAsciiDiagram(visualization, options);
    case "json":
      return JSON.stringify(visualization, null, 2);
    default:
      return generateMermaidDiagram(visualization, options);
  }
}

/**
 * Generate Mermaid diagram
 */
function generateMermaidDiagram(
  routes: RouteVisualization[],
  options: DiagramOptions
): string {
  const direction = options.direction || "TB";
  const lines: string[] = [
    options.title ? `---\ntitle: ${options.title}\n---` : "",
    `flowchart ${direction}`,
  ];

  const nodes: string[] = [];
  const edges: string[] = [];

  function processRoute(route: RouteVisualization, parentId?: string) {
    const nodeId = sanitizeId(route.id);
    const label = route.path || "/";

    // Build node with metadata
    let nodeLabel = label;
    if (options.includeMetadata && route.metadata) {
      const badges: string[] = [];
      if (route.metadata.hasLoader) badges.push("L");
      if (route.metadata.hasAction) badges.push("A");
      if (route.metadata.hasErrorBoundary) badges.push("E");
      if (route.metadata.hasLayout) badges.push("W");
      if (badges.length > 0) {
        nodeLabel += ` [${badges.join(",")}]`;
      }
    }

    // Determine node shape based on type
    let shape = `${nodeId}["${nodeLabel}"]`;
    if (route.metadata.hasLayout) {
      shape = `${nodeId}[/"${nodeLabel}"/]`; // Parallelogram for layouts
    } else if (route.metadata.hasErrorBoundary) {
      shape = `${nodeId}(["${nodeLabel}"])`; // Stadium for error boundaries
    } else if (route.path.includes(":")) {
      shape = `${nodeId}{{"${nodeLabel}"}}`; // Hexagon for dynamic routes
    }

    nodes.push(`    ${shape}`);

    if (parentId) {
      edges.push(`    ${sanitizeId(parentId)} --> ${nodeId}`);
    }

    for (const child of route.children) {
      processRoute(child, route.id);
    }
  }

  for (const route of routes) {
    processRoute(route);
  }

  lines.push(...nodes);
  lines.push(...edges);

  // Add styling
  lines.push("");
  lines.push("    classDef loader fill:#4CAF50,color:white");
  lines.push("    classDef action fill:#2196F3,color:white");
  lines.push("    classDef error fill:#f44336,color:white");
  lines.push("    classDef layout fill:#9C27B0,color:white");
  lines.push("    classDef dynamic fill:#FF9800,color:white");

  return lines.filter(Boolean).join("\n");
}

/**
 * Generate Graphviz DOT diagram
 */
function generateDotDiagram(
  routes: RouteVisualization[],
  options: DiagramOptions
): string {
  const rankdir = options.direction === "LR" || options.direction === "RL" ? "LR" : "TB";
  const lines: string[] = [
    `digraph routes {`,
    `    rankdir=${rankdir};`,
    `    node [shape=box, style=rounded, fontname="Arial"];`,
    `    edge [fontname="Arial"];`,
    "",
  ];

  if (options.title) {
    lines.push(`    labelloc="t";`);
    lines.push(`    label="${options.title}";`);
    lines.push("");
  }

  function processRoute(route: RouteVisualization, parentId?: string) {
    const nodeId = sanitizeId(route.id);
    const label = route.path || "/";

    let attrs: string[] = [`label="${label}"`];

    if (route.metadata.hasLoader) {
      attrs.push('fillcolor="#4CAF50"', "style=filled", 'fontcolor="white"');
    } else if (route.metadata.hasErrorBoundary) {
      attrs.push('fillcolor="#f44336"', "style=filled", 'fontcolor="white"');
    } else if (route.path.includes(":")) {
      attrs.push('fillcolor="#FF9800"', "style=filled");
    }

    lines.push(`    ${nodeId} [${attrs.join(", ")}];`);

    if (parentId) {
      lines.push(`    ${sanitizeId(parentId)} -> ${nodeId};`);
    }

    for (const child of route.children) {
      processRoute(child, route.id);
    }
  }

  for (const route of routes) {
    processRoute(route);
  }

  lines.push("}");
  return lines.join("\n");
}

/**
 * Generate ASCII tree diagram
 */
function generateAsciiDiagram(
  routes: RouteVisualization[],
  options: DiagramOptions
): string {
  const lines: string[] = [];

  if (options.title) {
    lines.push(options.title);
    lines.push("=".repeat(options.title.length));
    lines.push("");
  }

  function processRoute(
    route: RouteVisualization,
    prefix: string = "",
    isLast: boolean = true
  ) {
    const connector = isLast ? "\\__ " : "|-- ";
    const label = route.path || "/";

    let badges = "";
    if (options.includeMetadata && route.metadata) {
      const parts: string[] = [];
      if (route.metadata.hasLoader) parts.push("loader");
      if (route.metadata.hasAction) parts.push("action");
      if (route.metadata.hasErrorBoundary) parts.push("error");
      if (route.metadata.hasLayout) parts.push("layout");
      if (parts.length > 0) {
        badges = ` (${parts.join(", ")})`;
      }
    }

    lines.push(`${prefix}${connector}${label}${badges}`);

    const newPrefix = prefix + (isLast ? "    " : "|   ");
    route.children.forEach((child, index) => {
      processRoute(child, newPrefix, index === route.children.length - 1);
    });
  }

  routes.forEach((route, index) => {
    processRoute(route, "", index === routes.length - 1);
  });

  return lines.join("\n");
}

// ============================================================================
// SVG Export
// ============================================================================

/**
 * Export routes to SVG
 */
export async function exportRoutesToSVG(
  routes: NestedRouteDefinition[] | RouteTreeNode[],
  options: SVGExportOptions = {}
): Promise<string> {
  const {
    includeStyles = true,
    background = "#ffffff",
    padding = 40,
    scale = 1,
    fontFamily = "Arial, sans-serif",
  } = options;

  const visualization = createVisualization(routes);
  const { width, height } = calculateDimensions(visualization, padding);

  const svg: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width * scale} ${height * scale}" width="${width * scale}" height="${height * scale}">`,
  ];

  if (includeStyles) {
    svg.push(`<style>
      .route-node { fill: #e3f2fd; stroke: #1976d2; stroke-width: 2; rx: 8; }
      .route-node-active { fill: #1976d2; }
      .route-node-loader { fill: #e8f5e9; stroke: #388e3c; }
      .route-node-error { fill: #ffebee; stroke: #d32f2f; }
      .route-node-dynamic { fill: #fff3e0; stroke: #f57c00; }
      .route-label { font-family: ${fontFamily}; font-size: 12px; fill: #333; }
      .route-badge { font-family: ${fontFamily}; font-size: 10px; fill: #666; }
      .route-edge { stroke: #90a4ae; stroke-width: 2; fill: none; }
    </style>`);
  }

  svg.push(`<rect width="100%" height="100%" fill="${background}"/>`);
  svg.push(`<g transform="translate(${padding}, ${padding}) scale(${scale})">`);

  // Render edges first (so they're behind nodes)
  renderSVGEdges(visualization, svg);

  // Render nodes
  renderSVGNodes(visualization, svg);

  svg.push("</g>");
  svg.push("</svg>");

  return svg.join("\n");
}

/**
 * Export routes to PNG (requires canvas support)
 */
export async function exportRoutesToPNG(
  routes: NestedRouteDefinition[] | RouteTreeNode[],
  options: PNGExportOptions = {}
): Promise<Blob> {
  const svg = await exportRoutesToSVG(routes, options);

  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("PNG export requires DOM support"));
      return;
    }

    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas 2D context not available"));
      return;
    }

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create PNG blob"));
          }
        },
        "image/png",
        options.quality || 0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG"));
    };

    img.src = url;
  });
}

// ============================================================================
// Route Explorer Component
// ============================================================================

/**
 * Interactive Route Explorer component
 */
export function RouteVisualizer(props: {
  routes: NestedRouteDefinition[] | RouteTreeNode[];
  config?: VisualizerConfig;
  onRouteSelect?: (routeId: string) => void;
  onRouteHover?: (routeId: string | null) => void;
  class?: string;
  style?: string;
}) {
  const visualization = createVisualization(props.routes, props.config);
  const state = visualizerState();

  return {
    type: "div",
    props: {
      class: `route-visualizer ${props.class || ""}`,
      style: props.style,
      children: [
        VisualizerToolbar(),
        VisualizerCanvas(visualization, props),
        state.selectedRoute ? RouteDetails(state.selectedRoute, visualization) : null,
      ].filter(Boolean),
    },
  };
}

/**
 * Toolbar for visualizer controls
 */
function VisualizerToolbar() {
  return {
    type: "div",
    props: {
      class: "route-visualizer__toolbar",
      children: [
        {
          type: "button",
          props: {
            onClick: () => expandAll(),
            title: "Expand All",
            children: "Expand All",
          },
        },
        {
          type: "button",
          props: {
            onClick: () => collapseAll(),
            title: "Collapse All",
            children: "Collapse All",
          },
        },
        {
          type: "button",
          props: {
            onClick: async () => {
              const state = visualizerState();
              const svg = await exportRoutesToSVG(state.routes as any);
              downloadFile(svg, "routes.svg", "image/svg+xml");
            },
            title: "Export SVG",
            children: "Export SVG",
          },
        },
        {
          type: "button",
          props: {
            onClick: () => {
              const state = visualizerState();
              const mermaid = generateRouteDiagram(state.routes as any, { format: "mermaid" });
              navigator.clipboard.writeText(mermaid);
            },
            title: "Copy Mermaid",
            children: "Copy Mermaid",
          },
        },
      ],
    },
  };
}

/**
 * Canvas for route tree visualization
 */
function VisualizerCanvas(
  routes: RouteVisualization[],
  props: { onRouteSelect?: (id: string) => void; onRouteHover?: (id: string | null) => void }
) {
  return {
    type: "div",
    props: {
      class: "route-visualizer__canvas",
      children: {
        type: "svg",
        props: {
          class: "route-visualizer__svg",
          children: routes.map((route) => RouteNode(route, props)),
        },
      },
    },
  };
}

/**
 * Individual route node in visualization
 */
function RouteNode(
  route: RouteVisualization,
  props: { onRouteSelect?: (id: string) => void; onRouteHover?: (id: string | null) => void }
) {
  const state = visualizerState();
  const isSelected = state.selectedRoute === route.id;
  const isHovered = state.hoveredRoute === route.id;

  const nodeClass = [
    "route-visualizer__node",
    route.metadata.hasLoader && "route-visualizer__node--loader",
    route.metadata.hasAction && "route-visualizer__node--action",
    route.metadata.hasErrorBoundary && "route-visualizer__node--error",
    route.path.includes(":") && "route-visualizer__node--dynamic",
    isSelected && "route-visualizer__node--selected",
    isHovered && "route-visualizer__node--hovered",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    type: "g",
    props: {
      class: nodeClass,
      transform: `translate(${route.position.x}, ${route.position.y})`,
      onClick: () => {
        selectRoute(route.id);
        props.onRouteSelect?.(route.id);
      },
      onMouseEnter: () => {
        hoverRoute(route.id);
        props.onRouteHover?.(route.id);
      },
      onMouseLeave: () => {
        hoverRoute(null);
        props.onRouteHover?.(null);
      },
      children: [
        {
          type: "rect",
          props: {
            width: 180,
            height: 60,
            rx: 8,
            class: "route-node",
          },
        },
        {
          type: "text",
          props: {
            x: 90,
            y: 25,
            textAnchor: "middle",
            class: "route-label",
            children: route.path || "/",
          },
        },
        {
          type: "text",
          props: {
            x: 90,
            y: 45,
            textAnchor: "middle",
            class: "route-badge",
            children: getRouteBadges(route.metadata),
          },
        },
        route.children.length > 0 && {
          type: "text",
          props: {
            x: 170,
            y: 12,
            class: "route-expand",
            onClick: (e: Event) => {
              e.stopPropagation();
              toggleRouteExpansion(route.id);
            },
            children: route.expanded ? "-" : "+",
          },
        },
      ].filter(Boolean),
    },
  };
}

/**
 * Route details panel
 */
function RouteDetails(routeId: string, routes: RouteVisualization[]) {
  const route = findRoute(routes, routeId);
  if (!route) return null;

  return {
    type: "div",
    props: {
      class: "route-visualizer__details",
      children: [
        {
          type: "h3",
          props: { children: `Route: ${route.path || "/"}` },
        },
        {
          type: "dl",
          props: {
            children: [
              DetailItem("Full Path", route.fullPath),
              DetailItem("Has Loader", route.metadata.hasLoader ? "Yes" : "No"),
              DetailItem("Has Action", route.metadata.hasAction ? "Yes" : "No"),
              DetailItem("Has Error Boundary", route.metadata.hasErrorBoundary ? "Yes" : "No"),
              DetailItem("Has Layout", route.metadata.hasLayout ? "Yes" : "No"),
              route.metadata.params.length > 0 &&
                DetailItem("Parameters", route.metadata.params.join(", ")),
              route.metadata.middleware.length > 0 &&
                DetailItem(
                  "Middleware",
                  route.metadata.middleware.map((m) => m.name).join(" -> ")
                ),
            ].filter(Boolean),
          },
        },
      ],
    },
  };
}

function DetailItem(label: string, value: string) {
  return [
    { type: "dt", props: { children: label } },
    { type: "dd", props: { children: value } },
  ];
}

// ============================================================================
// Middleware Chain Visualization
// ============================================================================

/**
 * Visualize middleware chain for a route
 */
export function visualizeMiddlewareChain(
  middleware: RouteGroupMiddleware[],
  format: "mermaid" | "ascii" = "ascii"
): string {
  if (middleware.length === 0) {
    return "No middleware configured";
  }

  if (format === "mermaid") {
    const lines = ["flowchart LR"];
    middleware.forEach((mw, index) => {
      const nodeId = `mw${index}`;
      const nextId = index < middleware.length - 1 ? `mw${index + 1}` : "handler";
      lines.push(`    ${nodeId}["${mw.name || `Middleware ${index + 1}`}"]`);
      if (index < middleware.length - 1) {
        lines.push(`    ${nodeId} --> ${nextId}`);
      }
    });
    lines.push(`    mw${middleware.length - 1} --> handler["Route Handler"]`);
    return lines.join("\n");
  }

  // ASCII format
  const chain = middleware.map((mw) => mw.name || "anonymous").join(" -> ");
  return `Request -> ${chain} -> Route Handler`;
}

/**
 * Component for middleware chain visualization
 */
export function MiddlewareChainVisualizer(props: {
  middleware: RouteGroupMiddleware[];
  showTiming?: boolean;
}) {
  return {
    type: "div",
    props: {
      class: "middleware-chain",
      children: [
        {
          type: "div",
          props: {
            class: "middleware-chain__label",
            children: "Request",
          },
        },
        ...props.middleware.map((mw, index) => ({
          type: "div",
          props: {
            class: "middleware-chain__item",
            children: [
              { type: "span", props: { class: "middleware-chain__arrow", children: "->" } },
              { type: "span", props: { class: "middleware-chain__name", children: mw.name || `Middleware ${index + 1}` } },
            ],
          },
        })),
        {
          type: "div",
          props: {
            class: "middleware-chain__item",
            children: [
              { type: "span", props: { class: "middleware-chain__arrow", children: "->" } },
              { type: "span", props: { class: "middleware-chain__name middleware-chain__handler", children: "Handler" } },
            ],
          },
        },
      ],
    },
  };
}

// ============================================================================
// Parameter Visualization
// ============================================================================

/**
 * Extract and visualize route parameters
 */
export function visualizeRouteParams(
  path: string,
  currentParams?: Record<string, string>
): {
  segments: Array<{ type: "static" | "param" | "catch-all"; value: string; current?: string }>;
  summary: string;
} {
  const segments = path.split("/").filter(Boolean).map((segment) => {
    if (segment.startsWith(":")) {
      const paramName = segment.slice(1);
      return {
        type: "param" as const,
        value: paramName,
        current: currentParams?.[paramName],
      };
    } else if (segment === "*" || segment.startsWith("*")) {
      return {
        type: "catch-all" as const,
        value: segment,
        current: currentParams?.["*"],
      };
    }
    return {
      type: "static" as const,
      value: segment,
    };
  });

  const params = segments.filter((s) => s.type !== "static");
  const summary =
    params.length === 0
      ? "No parameters"
      : params.map((p) => `:${p.value}${p.current ? `="${p.current}"` : ""}`).join(", ");

  return { segments, summary };
}

/**
 * Component for route parameter visualization
 */
export function RouteParamsVisualizer(props: {
  path: string;
  params?: Record<string, string>;
  showTypes?: boolean;
}) {
  const { segments } = visualizeRouteParams(props.path, props.params);

  return {
    type: "div",
    props: {
      class: "route-params",
      children: [
        { type: "span", props: { class: "route-params__slash", children: "/" } },
        ...segments.map((segment, index) => ({
          type: "span",
          props: {
            class: `route-params__segment route-params__segment--${segment.type}`,
            children: [
              segment.type === "param" && { type: "span", props: { children: ":" } },
              { type: "span", props: { children: segment.value } },
              segment.current && {
                type: "span",
                props: { class: "route-params__current", children: `="${segment.current}"` },
              },
              index < segments.length - 1 && { type: "span", props: { children: "/" } },
            ].filter(Boolean),
          },
        })),
      ],
    },
  };
}

// ============================================================================
// Visualizer Styles
// ============================================================================

/**
 * Get CSS styles for the visualizer
 */
export function getVisualizerStyles(): string {
  return `
.route-visualizer {
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border-radius: 8px;
  overflow: hidden;
}

.route-visualizer__toolbar {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
}

.route-visualizer__toolbar button {
  background: #0e639c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.route-visualizer__toolbar button:hover {
  background: #1177bb;
}

.route-visualizer__canvas {
  flex: 1;
  padding: 20px;
  overflow: auto;
  min-height: 400px;
}

.route-visualizer__svg {
  width: 100%;
  height: 100%;
}

.route-visualizer__node {
  cursor: pointer;
  transition: all 0.2s ease;
}

.route-visualizer__node:hover rect {
  filter: brightness(1.1);
}

.route-visualizer__node--selected rect {
  stroke-width: 3;
}

.route-visualizer__node--loader rect {
  fill: #e8f5e9;
  stroke: #388e3c;
}

.route-visualizer__node--action rect {
  fill: #e3f2fd;
  stroke: #1976d2;
}

.route-visualizer__node--error rect {
  fill: #ffebee;
  stroke: #d32f2f;
}

.route-visualizer__node--dynamic rect {
  fill: #fff3e0;
  stroke: #f57c00;
}

.route-visualizer__details {
  padding: 16px;
  background: #252526;
  border-top: 1px solid #3e3e42;
}

.route-visualizer__details h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #4fc1ff;
}

.route-visualizer__details dl {
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
}

.route-visualizer__details dt {
  color: #969696;
}

.route-visualizer__details dd {
  margin: 0;
  font-family: 'Courier New', monospace;
  color: #ce9178;
}

.middleware-chain {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #252526;
  border-radius: 4px;
  overflow-x: auto;
}

.middleware-chain__label {
  background: #4CAF50;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.middleware-chain__item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.middleware-chain__arrow {
  color: #969696;
}

.middleware-chain__name {
  background: #264f78;
  color: #4fc1ff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.middleware-chain__handler {
  background: #1976d2;
  color: white;
}

.route-params {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.route-params__slash {
  color: #969696;
}

.route-params__segment--static {
  color: #d4d4d4;
}

.route-params__segment--param {
  color: #dcdcaa;
}

.route-params__segment--catch-all {
  color: #f48771;
}

.route-params__current {
  color: #ce9178;
  font-size: 12px;
}
`;
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildVisualizationTree(
  routes: any[],
  parentPath: string,
  depth: number,
  index: number,
  config: Required<VisualizerConfig>
): RouteVisualization[] {
  return routes.map((route, i) => {
    const path = route.path || route.id || "";
    const fullPath = joinPath(parentPath, path);
    const x = index * config.spacing.x;
    const y = depth * config.spacing.y;

    const visualization: RouteVisualization = {
      id: route.id || fullPath || `route-${depth}-${i}`,
      path,
      fullPath,
      metadata: extractMetadata(route),
      children: [],
      position: { x, y },
      expanded: depth < config.collapseLevel,
      isActive: false,
      isHovered: false,
    };

    if (route.children?.length > 0) {
      visualization.children = buildVisualizationTree(
        route.children,
        fullPath,
        depth + 1,
        i,
        config
      );
    }

    return visualization;
  });
}

function extractMetadata(route: any): RouteMetadata {
  return {
    hasLoader: !!route.loader || route.hasLoader,
    hasAction: !!route.action || route.hasAction,
    hasErrorBoundary: !!route.errorBoundary || route.hasErrorBoundary,
    hasLayout: !!route.element || route.hasLayout,
    params: extractParams(route.path || ""),
    queryParams: route.queryParams || [],
    middleware: route.middleware || [],
    guards: route.guards || [],
    custom: route.handle || route.meta || {},
  };
}

function extractParams(path: string): string[] {
  const matches = path.match(/:[^/]+/g) || [];
  return matches.map((m) => m.slice(1));
}

function joinPath(parent: string, child: string): string {
  if (!parent) return child.startsWith("/") ? child : `/${child}`;
  if (!child) return parent;
  return `${parent}/${child}`.replace(/\/+/g, "/");
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, "_");
}

function toggleExpanded(routes: RouteVisualization[], targetId: string): RouteVisualization[] {
  return routes.map((route) => {
    if (route.id === targetId) {
      return { ...route, expanded: !route.expanded };
    }
    if (route.children.length > 0) {
      return { ...route, children: toggleExpanded(route.children, targetId) };
    }
    return route;
  });
}

function setAllExpanded(routes: RouteVisualization[], expanded: boolean): RouteVisualization[] {
  return routes.map((route) => ({
    ...route,
    expanded,
    children: setAllExpanded(route.children, expanded),
  }));
}

function findRoute(routes: RouteVisualization[], id: string): RouteVisualization | null {
  for (const route of routes) {
    if (route.id === id) return route;
    const found = findRoute(route.children, id);
    if (found) return found;
  }
  return null;
}

function getRouteBadges(metadata: RouteMetadata): string {
  const badges: string[] = [];
  if (metadata.hasLoader) badges.push("L");
  if (metadata.hasAction) badges.push("A");
  if (metadata.hasErrorBoundary) badges.push("E");
  if (metadata.hasLayout) badges.push("W");
  return badges.join(" ");
}

function calculateDimensions(
  routes: RouteVisualization[],
  padding: number
): { width: number; height: number } {
  let maxX = 0;
  let maxY = 0;

  function traverse(route: RouteVisualization) {
    maxX = Math.max(maxX, route.position.x + 180);
    maxY = Math.max(maxY, route.position.y + 60);
    route.children.forEach(traverse);
  }

  routes.forEach(traverse);

  return {
    width: maxX + padding * 2,
    height: maxY + padding * 2,
  };
}

function renderSVGEdges(routes: RouteVisualization[], svg: string[]): void {
  function processRoute(route: RouteVisualization, parentPos?: { x: number; y: number }) {
    if (parentPos) {
      const x1 = parentPos.x + 90;
      const y1 = parentPos.y + 60;
      const x2 = route.position.x + 90;
      const y2 = route.position.y;
      svg.push(`<path d="M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}" class="route-edge"/>`);
    }
    route.children.forEach((child) =>
      processRoute(child, { x: route.position.x, y: route.position.y })
    );
  }
  routes.forEach((route) => processRoute(route));
}

function renderSVGNodes(routes: RouteVisualization[], svg: string[]): void {
  function processRoute(route: RouteVisualization) {
    const { x, y } = route.position;
    let nodeClass = "route-node";
    if (route.metadata.hasLoader) nodeClass += " route-node-loader";
    if (route.metadata.hasErrorBoundary) nodeClass += " route-node-error";
    if (route.path.includes(":")) nodeClass += " route-node-dynamic";

    svg.push(`<g transform="translate(${x}, ${y})">`);
    svg.push(`<rect width="180" height="60" class="${nodeClass}"/>`);
    svg.push(`<text x="90" y="30" text-anchor="middle" class="route-label">${route.path || "/"}</text>`);
    svg.push(`<text x="90" y="48" text-anchor="middle" class="route-badge">${getRouteBadges(route.metadata)}</text>`);
    svg.push("</g>");

    route.children.forEach(processRoute);
  }
  routes.forEach(processRoute);
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// Exports
// ============================================================================

export type {
  VisualizerConfig,
  RouteVisualization,
  RouteMetadata,
  MiddlewareInfo,
  DiagramOptions,
  SVGExportOptions,
  PNGExportOptions,
};
