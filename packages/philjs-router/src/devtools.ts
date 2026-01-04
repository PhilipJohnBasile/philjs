/**
 * TanStack-style Router DevTools for PhilJS.
 * Provides visual debugging tools for routes, state, and performance.
 *
 * @example
 * ```tsx
 * import { RouterDevTools } from '@philjs/router';
 *
 * function App() {
 *   return (
 *     <>
 *       <RouterView />
 *       <RouterDevTools />
 *     </>
 *   );
 * }
 * ```
 */

import { signal } from "@philjs/core";
import type { JSXElement, VNode } from "@philjs/core";
import type { MatchedRoute } from "./high-level.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Route tree node for visualization.
 */
export type RouteTreeNode = {
  /** Route ID */
  id: string;
  /** Route path pattern */
  path: string;
  /** Parent route ID */
  parentId?: string;
  /** Child routes */
  children: RouteTreeNode[];
  /** Whether this route is currently active */
  isActive: boolean;
  /** Whether this route has a loader */
  hasLoader: boolean;
  /** Whether this route has an action */
  hasAction: boolean;
  /** Whether this route has an error boundary */
  hasErrorBoundary: boolean;
  /** Route handle data */
  handle?: unknown;
};

/**
 * Navigation history entry.
 */
export type NavigationHistoryEntry = {
  /** Unique ID for this entry */
  id: string;
  /** Timestamp when navigation occurred */
  timestamp: number;
  /** Path navigated to */
  path: string;
  /** Route parameters */
  params: Record<string, string>;
  /** Search parameters */
  searchParams: URLSearchParams;
  /** Duration of navigation in ms */
  duration?: number;
  /** Whether this was a forward/back navigation */
  isHistoryNavigation: boolean;
  /** Performance metrics */
  metrics?: NavigationMetrics;
};

/**
 * Performance metrics for a navigation.
 */
export type NavigationMetrics = {
  /** Total navigation duration */
  total: number;
  /** Time spent matching routes */
  matching: number;
  /** Time spent loading data */
  dataLoading: number;
  /** Time spent rendering */
  rendering: number;
  /** Individual loader timings */
  loaders: Record<string, number>;
};

/**
 * Route performance data.
 */
export type RoutePerformance = {
  /** Route ID */
  routeId: string;
  /** Number of times this route was visited */
  visitCount: number;
  /** Average load time in ms */
  avgLoadTime: number;
  /** Min load time in ms */
  minLoadTime: number;
  /** Max load time in ms */
  maxLoadTime: number;
  /** Last visit timestamp */
  lastVisit: number;
  /** All recorded load times */
  loadTimes: number[];
};

/**
 * Route state snapshot.
 */
export type RouteStateSnapshot = {
  /** Current path */
  path: string;
  /** Route parameters */
  params: Record<string, string>;
  /** Search parameters as object */
  searchParams: Record<string, string>;
  /** Loader data for all routes */
  loaderData: Record<string, unknown>;
  /** Action data */
  actionData?: unknown;
  /** Error state */
  errors: Record<string, Error>;
  /** Loading state */
  loading: boolean;
  /** Matched routes in hierarchy */
  matches: Array<{
    id: string;
    path: string;
    params: Record<string, string>;
    data?: unknown;
  }>;
};

/**
 * DevTools configuration.
 */
export type DevToolsConfig = {
  /** Position of the DevTools panel */
  position?: "bottom" | "top" | "left" | "right";
  /** Initial height/width of the panel */
  size?: number;
  /** Whether to start minimized */
  minimized?: boolean;
  /** Maximum history entries to keep */
  maxHistoryEntries?: number;
  /** Whether to show performance metrics */
  showPerformance?: boolean;
  /** Whether to track route changes automatically */
  autoTrack?: boolean;
  /** Custom theme */
  theme?: "light" | "dark" | "system";
};

/**
 * Route matching debug info.
 */
export type RouteMatchDebugInfo = {
  /** Path being matched */
  pathname: string;
  /** All attempted matches */
  attempts: Array<{
    pattern: string;
    matched: boolean;
    params?: Record<string, string>;
    reason?: string;
  }>;
  /** Final matched route */
  finalMatch?: MatchedRoute;
  /** Time taken to match */
  matchTime: number;
};

// ============================================================================ 
// State Management
// ============================================================================ 

const DEFAULT_DEVTOOLS_CONFIG: Required<DevToolsConfig> = {
  position: "bottom",
  size: 400,
  minimized: false,
  maxHistoryEntries: 100,
  showPerformance: true,
  autoTrack: true,
  theme: "system",
};

/**
 * Global DevTools state.
 */
const devToolsState = signal<{
  enabled: boolean;
  minimized: boolean;
  activeTab: "routes" | "state" | "history" | "performance" | "matching";       
  routeTree: RouteTreeNode[];
  history: NavigationHistoryEntry[];
  performance: Map<string, RoutePerformance>;
  currentState: RouteStateSnapshot | null;
  matchDebugInfo: RouteMatchDebugInfo | null;
  config: Required<DevToolsConfig>;
}>({
  enabled: true,
  minimized: false,
  activeTab: "routes",
  routeTree: [],
  history: [],
  performance: new Map(),
  currentState: null,
  matchDebugInfo: null,
  config: { ...DEFAULT_DEVTOOLS_CONFIG },
});

/**
 * Current navigation tracking.
 */
let currentNavigationStart: number | null = null;
let currentNavigationMetrics: Partial<NavigationMetrics> = {};

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialize router DevTools.
 */
export function initRouterDevTools(config?: DevToolsConfig): void {
  const state = devToolsState();
  const mergedConfig = { ...DEFAULT_DEVTOOLS_CONFIG, ...config };
  devToolsState.set({
    ...state,
    enabled: true,
    minimized: mergedConfig.minimized,
    config: mergedConfig,
  });

  if (typeof window !== "undefined") {
    // Expose DevTools API on window for debugging
    (window as any).__PHILJS_DEVTOOLS__ = {
      getState: () => devToolsState(),
      getHistory: () => devToolsState().history,
      getPerformance: () => devToolsState().performance,
      clearHistory: () => clearHistory(),
      exportState: () => exportState(),
    };
  }
}

/**
 * Track a navigation event.
 */
export function trackNavigation(
  path: string,
  params: Record<string, string>,
  searchParams: URLSearchParams,
  isHistoryNav: boolean = false
): void {
  const state = devToolsState();
  if (!state.enabled || !state.config.autoTrack) return;

  currentNavigationStart = performance.now();
  currentNavigationMetrics = {
    loaders: {},
  };

  const entry: NavigationHistoryEntry = {
    id: generateId(),
    timestamp: Date.now(),
    path,
    params,
    searchParams,
    isHistoryNavigation: isHistoryNav,
  };

  const history = [...state.history, entry];
  if (history.length > state.config.maxHistoryEntries) {
    history.shift();
  }

  devToolsState.set({ ...state, history });
}

/**
 * Complete a navigation with metrics.
 */
export function completeNavigation(metrics?: Partial<NavigationMetrics>): void {
  const state = devToolsState();
  if (!state.enabled || !currentNavigationStart) return;

  const duration = performance.now() - currentNavigationStart;
  const total = metrics?.total ?? duration;
  const history = [...state.history];
  const lastEntry = history[history.length - 1];

  if (lastEntry) {
    const loaders = {
      ...(currentNavigationMetrics.loaders || {}),
      ...(metrics?.loaders || {}),
    };

    lastEntry.duration = total;
    lastEntry.metrics = {
      total,
      matching: metrics?.matching ?? currentNavigationMetrics.matching ?? 0,
      dataLoading: metrics?.dataLoading ?? currentNavigationMetrics.dataLoading ?? 0,
      rendering: metrics?.rendering ?? currentNavigationMetrics.rendering ?? 0,
      loaders,
    };

    devToolsState.set({ ...state, history });

    // Update route performance
    updateRoutePerformance(lastEntry.path, total);
  }

  currentNavigationStart = null;
  currentNavigationMetrics = {};
}

/**
 * Track loader execution for performance.
 */
export function trackLoader(routeId: string, duration: number): void {
  const state = devToolsState();
  if (!state.enabled) return;

  if (currentNavigationMetrics.loaders) {
    currentNavigationMetrics.loaders[routeId] = duration;
  }
}

/**
 * Update the route tree visualization.
 */
export function updateRouteTree(routes: RouteTreeNode[]): void {
  const state = devToolsState();
  if (!state.enabled) return;

  devToolsState.set({ ...state, routeTree: routes });
}

/**
 * Update the current route state snapshot.
 */
export function updateRouteState(snapshot: RouteStateSnapshot): void {
  const state = devToolsState();
  if (!state.enabled) return;

  devToolsState.set({ ...state, currentState: snapshot });
}

/**
 * Record route matching debug info.
 */
export function recordRouteMatch(debugInfo: RouteMatchDebugInfo): void {
  const state = devToolsState();
  if (!state.enabled) return;

  devToolsState.set({ ...state, matchDebugInfo: debugInfo });
}

/**
 * Clear navigation history.
 */
export function clearHistory(): void {
  const state = devToolsState();
  devToolsState.set({ ...state, history: [] });
}

/**
 * Clear performance data.
 */
export function clearPerformance(): void {
  const state = devToolsState();
  devToolsState.set({ ...state, performance: new Map() });
}

/**
 * Export DevTools state as JSON.
 */
export function exportState(): string {
  const state = devToolsState();
  return JSON.stringify(
    {
      history: state.history,
      performance: Array.from(state.performance.entries()),
      currentState: state.currentState,
      routeTree: state.routeTree,
    },
    null,
    2
  );
}

/**
 * Import DevTools state from JSON.
 */
export function importState(json: string): void {
  try {
    const data = JSON.parse(json);
    const state = devToolsState();

    devToolsState.set({
      ...state,
      history: data.history || [],
      performance: new Map(data.performance || []),
      currentState: data.currentState || null,
      routeTree: data.routeTree || [],
    });
  } catch (error) {
    console.error("[DevTools] Failed to import state:", error);
  }
}

/**
 * Get current DevTools state.
 */
export function getDevToolsState() {
  return devToolsState();
}

/**
 * Toggle DevTools panel.
 */
export function toggleDevTools(): void {
  const state = devToolsState();
  devToolsState.set({ ...state, enabled: !state.enabled });
}

/**
 * Minimize/maximize DevTools panel.
 */
export function toggleMinimize(): void {
  const state = devToolsState();
  devToolsState.set({ ...state, minimized: !state.minimized });
}

/**
 * Set active DevTools tab.
 */
export function setActiveTab(
  tab: "routes" | "state" | "history" | "performance" | "matching"
): void {
  const state = devToolsState();
  devToolsState.set({ ...state, activeTab: tab });
}

// ============================================================================
// React/JSX Components
// ============================================================================

/**
 * Main Router DevTools component.
 */
export function RouterDevTools(props?: { config?: DevToolsConfig }): VNode | null {
  if (props?.config) {
    initRouterDevTools(props.config);
  }

  const state = devToolsState();

  if (!state.enabled) {
    return null;
  }

  return {
    type: "div",
    props: {
      id: "philjs-devtools",
      class: `philjs-devtools philjs-devtools--${state.config.position} ${
        state.minimized ? "philjs-devtools--minimized" : ""
      } philjs-devtools--${state.config.theme}`,
      style: getDevToolsStyle(state.config),
      children: [
        state.minimized ? DevToolsMinimized() : DevToolsExpanded(state),
        DevToolsStyles(),
      ],
    },
  };
}

/**
 * Minimized DevTools bar.
 */
function DevToolsMinimized(): VNode {
  return {
    type: "div",
    props: {
      class: "philjs-devtools__minimized",
      onClick: () => toggleMinimize(),
      children: {
        type: "span",
        props: {
          children: "PhilJS Router DevTools (Click to expand)",
        },
      },
    },
  };
}

/**
 * Expanded DevTools panel.
 */
function DevToolsExpanded(state: ReturnType<typeof devToolsState>): VNode {
  return {
    type: "div",
    props: {
      class: "philjs-devtools__panel",
      children: [
        DevToolsHeader(state),
        DevToolsTabs(state),
        DevToolsContent(state),
      ],
    },
  };
}

/**
 * DevTools header with controls.
 */
function DevToolsHeader(state: ReturnType<typeof devToolsState>): VNode {
  return {
    type: "div",
    props: {
      class: "philjs-devtools__header",
      children: [
        {
          type: "h3",
          props: { children: "PhilJS Router DevTools" },
        },
        {
          type: "div",
          props: {
            class: "philjs-devtools__actions",
            children: [
              {
                type: "button",
                props: {
                  onClick: () => exportStateToClipboard(),
                  title: "Export state",
                  children: "Export",
                },
              },
              {
                type: "button",
                props: {
                  onClick: () => clearHistory(),
                  title: "Clear history",
                  children: "Clear",
                },
              },
              {
                type: "button",
                props: {
                  onClick: () => toggleMinimize(),
                  title: "Minimize",
                  children: "_",
                },
              },
              {
                type: "button",
                props: {
                  onClick: () => toggleDevTools(),
                  title: "Close",
                  children: "×",
                },
              },
            ],
          },
        },
      ],
    },
  };
}

/**
 * DevTools tabs.
 */
function DevToolsTabs(state: ReturnType<typeof devToolsState>): VNode {
  const tabs: Array<{ id: string; label: string }> = [
    { id: "routes", label: "Route Tree" },
    { id: "state", label: "State" },
    { id: "history", label: `History (${state.history.length})` },
    { id: "performance", label: "Performance" },
    { id: "matching", label: "Matching" },
  ];

  return {
    type: "div",
    props: {
      class: "philjs-devtools__tabs",
      children: tabs.map((tab) => ({
        type: "button",
        props: {
          class: `philjs-devtools__tab ${
            state.activeTab === tab.id ? "philjs-devtools__tab--active" : ""
          }`,
          onClick: () => setActiveTab(tab.id as any),
          children: tab.label,
        },
      })),
    },
  };
}

/**
 * DevTools content area.
 */
function DevToolsContent(state: ReturnType<typeof devToolsState>): VNode {
  let content: VNode;

  switch (state.activeTab) {
    case "routes":
      content = RouteTreeView(state.routeTree);
      break;
    case "state":
      content = StateInspectorView(state.currentState);
      break;
    case "history":
      content = HistoryView(state.history);
      break;
    case "performance":
      content = PerformanceView(state.performance);
      break;
    case "matching":
      content = MatchingView(state.matchDebugInfo);
      break;
    default:
      content = { type: "div", props: {} };
  }

  return {
    type: "div",
    props: {
      class: "philjs-devtools__content",
      children: content,
    },
  };
}

/**
 * Route tree visualization.
 */
function RouteTreeView(tree: RouteTreeNode[]): VNode {
  if (tree.length === 0) {
    return {
      type: "div",
      props: {
        class: "philjs-devtools__empty",
        children: "No routes registered",
      },
    };
  }

  return {
    type: "div",
    props: {
      class: "philjs-devtools__tree",
      children: tree.map((node) => RouteTreeNodeView(node, 0)),
    },
  };
}

/**
 * Single route tree node.
 */
function RouteTreeNodeView(node: RouteTreeNode, depth: number): VNode {
  return {
    type: "div",
    props: {
      class: `philjs-devtools__tree-node ${
        node.isActive ? "philjs-devtools__tree-node--active" : ""
      }`,
      style: `padding-left: ${depth * 20}px`,
      children: [
        {
          type: "div",
          props: {
            class: "philjs-devtools__tree-node-header",
            children: [
              {
                type: "span",
                props: {
                  class: "philjs-devtools__tree-node-path",
                  children: node.path,
                },
              },
              {
                type: "div",
                props: {
                  class: "philjs-devtools__tree-node-badges",
                  children: [
                    node.hasLoader && Badge("Loader"),
                    node.hasAction && Badge("Action"),
                    node.hasErrorBoundary && Badge("ErrorBoundary"),
                  ].filter(Boolean),
                },
              },
            ],
          },
        },
        ...(node.children || []).map((child) =>
          RouteTreeNodeView(child, depth + 1)
        ),
      ],
    },
  };
}

/**
 * State inspector view.
 */
function StateInspectorView(state: RouteStateSnapshot | null): VNode {
  if (!state) {
    return {
      type: "div",
      props: {
        class: "philjs-devtools__empty",
        children: "No route state available",
      },
    };
  }

  return {
    type: "div",
    props: {
      class: "philjs-devtools__inspector",
      children: [
        InspectorSection("Current Path", state.path),
        InspectorSection("Params", state.params),
        InspectorSection("Search Params", state.searchParams),
        InspectorSection("Loader Data", state.loaderData),
        state.actionData && InspectorSection("Action Data", state.actionData),
        Object.keys(state.errors).length > 0 &&
          InspectorSection("Errors", state.errors),
      ].filter(Boolean),
    },
  };
}

/**
 * Navigation history view.
 */
function HistoryView(history: NavigationHistoryEntry[]): VNode {
  if (history.length === 0) {
    return {
      type: "div",
      props: {
        class: "philjs-devtools__empty",
        children: "No navigation history",
      },
    };
  }

  return {
    type: "div",
    props: {
      class: "philjs-devtools__history",
      children: history
        .slice()
        .reverse()
        .map((entry) => HistoryEntryView(entry)),
    },
  };
}

/**
 * Single history entry.
 */
function HistoryEntryView(entry: NavigationHistoryEntry): VNode {
  return {
    type: "div",
    props: {
      class: "philjs-devtools__history-entry",
      children: [
        {
          type: "div",
          props: {
            class: "philjs-devtools__history-header",
            children: [
              {
                type: "span",
                props: {
                  class: "philjs-devtools__history-path",
                  children: entry.path,
                },
              },
              entry.duration && {
                type: "span",
                props: {
                  class: "philjs-devtools__history-duration",
                  children: `${entry.duration.toFixed(2)}ms`,
                },
              },
            ].filter(Boolean),
          },
        },
        {
          type: "div",
          props: {
            class: "philjs-devtools__history-details",
            children: new Date(entry.timestamp).toLocaleTimeString(),
          },
        },
      ],
    },
  };
}

/**
 * Performance metrics view.
 */
function PerformanceView(performance: Map<string, RoutePerformance>): VNode {
  const entries = Array.from(performance.values());

  if (entries.length === 0) {
    return {
      type: "div",
      props: {
        class: "philjs-devtools__empty",
        children: "No performance data collected",
      },
    };
  }

  return {
    type: "div",
    props: {
      class: "philjs-devtools__performance",
      children: [
        {
          type: "table",
          props: {
            children: [
              {
                type: "thead",
                props: {
                  children: {
                    type: "tr",
                    props: {
                      children: [
                        { type: "th", props: { children: "Route" } },
                        { type: "th", props: { children: "Visits" } },
                        { type: "th", props: { children: "Avg" } },
                        { type: "th", props: { children: "Min" } },
                        { type: "th", props: { children: "Max" } },
                      ],
                    },
                  },
                },
              },
              {
                type: "tbody",
                props: {
                  children: entries.map((perf) => ({
                    type: "tr",
                    props: {
                      children: [
                        { type: "td", props: { children: perf.routeId } },
                        { type: "td", props: { children: String(perf.visitCount) } },
                        {
                          type: "td",
                          props: { children: `${perf.avgLoadTime.toFixed(2)}ms` },
                        },
                        {
                          type: "td",
                          props: { children: `${perf.minLoadTime.toFixed(2)}ms` },
                        },
                        {
                          type: "td",
                          props: { children: `${perf.maxLoadTime.toFixed(2)}ms` },
                        },
                      ],
                    },
                  })),
                },
              },
            ],
          },
        },
      ],
    },
  };
}

/**
 * Route matching debugger view.
 */
function MatchingView(debugInfo: RouteMatchDebugInfo | null): VNode {
  if (!debugInfo) {
    return {
      type: "div",
      props: {
        class: "philjs-devtools__empty",
        children: "No matching debug info available",
      },
    };
  }

  return {
    type: "div",
    props: {
      class: "philjs-devtools__matching",
      children: [
        {
          type: "div",
          props: {
            class: "philjs-devtools__matching-path",
            children: `Matching: ${debugInfo.pathname}`,
          },
        },
        {
          type: "div",
          props: {
            class: "philjs-devtools__matching-time",
            children: `Time: ${debugInfo.matchTime.toFixed(2)}ms`,
          },
        },
        {
          type: "div",
          props: {
            class: "philjs-devtools__matching-attempts",
            children: debugInfo.attempts.map((attempt) => ({
              type: "div",
              props: {
                class: `philjs-devtools__matching-attempt ${
                  attempt.matched
                    ? "philjs-devtools__matching-attempt--success"
                    : "philjs-devtools__matching-attempt--failed"
                }`,
                children: [
                  {
                    type: "span",
                    props: { children: attempt.pattern },
                  },
                  {
                    type: "span",
                    props: {
                      children: attempt.matched ? "✓" : `✗ ${attempt.reason || ""}`,
                    },
                  },
                ],
              },
            })),
          },
        },
      ],
    },
  };
}

// ============================================================================
// Helper Components
// ============================================================================

function Badge(text: string): VNode {
  return {
    type: "span",
    props: {
      class: "philjs-devtools__badge",
      children: text,
    },
  };
}

function InspectorSection(title: string, data: unknown): VNode {
  return {
    type: "div",
    props: {
      class: "philjs-devtools__section",
      children: [
        {
          type: "h4",
          props: {
            class: "philjs-devtools__section-title",
            children: title,
          },
        },
        {
          type: "pre",
          props: {
            class: "philjs-devtools__section-content",
            children: JSON.stringify(data, null, 2),
          },
        },
      ],
    },
  };
}

// ============================================================================
// Styles
// ============================================================================

function DevToolsStyles(): VNode {
  return {
    type: "style",
    props: {
      children: `
.philjs-devtools {
  position: fixed;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;
  z-index: 999999;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.philjs-devtools--bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--devtools-size, 400px);
}

.philjs-devtools--top {
  top: 0;
  left: 0;
  right: 0;
  height: var(--devtools-size, 400px);
}

.philjs-devtools--left {
  left: 0;
  top: 0;
  bottom: 0;
  width: var(--devtools-size, 400px);
}

.philjs-devtools--right {
  right: 0;
  top: 0;
  bottom: 0;
  width: var(--devtools-size, 400px);
}

.philjs-devtools--minimized {
  height: 40px !important;
  width: auto !important;
}

.philjs-devtools--light {
  background: #f5f5f5;
  color: #333;
}

.philjs-devtools__minimized {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  cursor: pointer;
  background: #2d2d30;
  border-top: 1px solid #3e3e42;
}

.philjs-devtools__minimized:hover {
  background: #3e3e42;
}

.philjs-devtools__panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.philjs-devtools__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
}

.philjs-devtools__header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.philjs-devtools__actions {
  display: flex;
  gap: 8px;
}

.philjs-devtools__actions button {
  background: transparent;
  border: 1px solid #3e3e42;
  color: #d4d4d4;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.philjs-devtools__actions button:hover {
  background: #3e3e42;
}

.philjs-devtools__tabs {
  display: flex;
  background: #252526;
  border-bottom: 1px solid #3e3e42;
}

.philjs-devtools__tab {
  background: transparent;
  border: none;
  color: #969696;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 12px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.philjs-devtools__tab:hover {
  color: #d4d4d4;
}

.philjs-devtools__tab--active {
  color: #d4d4d4;
  border-bottom-color: #007acc;
}

.philjs-devtools__content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.philjs-devtools__empty {
  text-align: center;
  padding: 40px;
  color: #969696;
}

.philjs-devtools__tree-node {
  padding: 4px 0;
}

.philjs-devtools__tree-node--active {
  background: #37373d;
}

.philjs-devtools__tree-node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
}

.philjs-devtools__tree-node-path {
  font-family: 'Courier New', monospace;
  color: #ce9178;
}

.philjs-devtools__tree-node-badges {
  display: flex;
  gap: 4px;
}

.philjs-devtools__badge {
  background: #264f78;
  color: #4fc1ff;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
}

.philjs-devtools__inspector {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.philjs-devtools__section {
  background: #252526;
  padding: 12px;
  border-radius: 4px;
}

.philjs-devtools__section-title {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: #4fc1ff;
}

.philjs-devtools__section-content {
  margin: 0;
  padding: 8px;
  background: #1e1e1e;
  border-radius: 3px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #ce9178;
}

.philjs-devtools__history {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.philjs-devtools__history-entry {
  background: #252526;
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid #007acc;
}

.philjs-devtools__history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.philjs-devtools__history-path {
  font-family: 'Courier New', monospace;
  color: #ce9178;
  font-weight: 500;
}

.philjs-devtools__history-duration {
  color: #4ec9b0;
  font-size: 11px;
}

.philjs-devtools__history-details {
  font-size: 11px;
  color: #969696;
}

.philjs-devtools__performance table {
  width: 100%;
  border-collapse: collapse;
  background: #252526;
  border-radius: 4px;
  overflow: hidden;
}

.philjs-devtools__performance th,
.philjs-devtools__performance td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #3e3e42;
}

.philjs-devtools__performance th {
  background: #2d2d30;
  font-weight: 600;
  color: #4fc1ff;
}

.philjs-devtools__performance tr:last-child td {
  border-bottom: none;
}

.philjs-devtools__matching {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.philjs-devtools__matching-path {
  font-family: 'Courier New', monospace;
  color: #ce9178;
  font-size: 14px;
  font-weight: 500;
  padding: 12px;
  background: #252526;
  border-radius: 4px;
}

.philjs-devtools__matching-time {
  color: #4ec9b0;
  padding: 8px 12px;
}

.philjs-devtools__matching-attempts {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.philjs-devtools__matching-attempt {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #252526;
  border-radius: 3px;
  border-left: 3px solid #858585;
}

.philjs-devtools__matching-attempt--success {
  border-left-color: #4ec9b0;
}

.philjs-devtools__matching-attempt--failed {
  border-left-color: #f48771;
}
      `,
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function getDevToolsStyle(config: Required<DevToolsConfig>): string {
  return `--devtools-size: ${config.size}px`;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function updateRoutePerformance(routeId: string, duration: number): void {
  const state = devToolsState();
  const performance = new Map(state.performance);

  const existing = performance.get(routeId);

  if (existing) {
    const loadTimes = [...existing.loadTimes, duration];
    const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;

    performance.set(routeId, {
      routeId,
      visitCount: existing.visitCount + 1,
      avgLoadTime,
      minLoadTime: Math.min(existing.minLoadTime, duration),
      maxLoadTime: Math.max(existing.maxLoadTime, duration),
      lastVisit: Date.now(),
      loadTimes,
    });
  } else {
    performance.set(routeId, {
      routeId,
      visitCount: 1,
      avgLoadTime: duration,
      minLoadTime: duration,
      maxLoadTime: duration,
      lastVisit: Date.now(),
      loadTimes: [duration],
    });
  }

  devToolsState.set({ ...state, performance });
}

async function exportStateToClipboard(): Promise<void> {
  try {
    const state = exportState();
    await navigator.clipboard.writeText(state);
    console.log("[DevTools] State exported to clipboard");
  } catch (error) {
    console.error("[DevTools] Failed to export state:", error);
  }
}
