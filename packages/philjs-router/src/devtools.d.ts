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
import type { VNode } from "@philjs/core";
import type { MatchedRoute } from "./high-level.js";
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
/**
 * Initialize router DevTools.
 */
export declare function initRouterDevTools(config?: DevToolsConfig): void;
/**
 * Track a navigation event.
 */
export declare function trackNavigation(path: string, params: Record<string, string>, searchParams: URLSearchParams, isHistoryNav?: boolean): void;
/**
 * Complete a navigation with metrics.
 */
export declare function completeNavigation(metrics?: Partial<NavigationMetrics>): void;
/**
 * Track loader execution for performance.
 */
export declare function trackLoader(routeId: string, duration: number): void;
/**
 * Update the route tree visualization.
 */
export declare function updateRouteTree(routes: RouteTreeNode[]): void;
/**
 * Update the current route state snapshot.
 */
export declare function updateRouteState(snapshot: RouteStateSnapshot): void;
/**
 * Record route matching debug info.
 */
export declare function recordRouteMatch(debugInfo: RouteMatchDebugInfo): void;
/**
 * Clear navigation history.
 */
export declare function clearHistory(): void;
/**
 * Clear performance data.
 */
export declare function clearPerformance(): void;
/**
 * Export DevTools state as JSON.
 */
export declare function exportState(): string;
/**
 * Import DevTools state from JSON.
 */
export declare function importState(json: string): void;
/**
 * Get current DevTools state.
 */
export declare function getDevToolsState(): {
    enabled: boolean;
    minimized: boolean;
    activeTab: "routes" | "state" | "history" | "performance" | "matching";
    routeTree: RouteTreeNode[];
    history: NavigationHistoryEntry[];
    performance: Map<string, RoutePerformance>;
    currentState: RouteStateSnapshot | null;
    matchDebugInfo: RouteMatchDebugInfo | null;
    config: Required<DevToolsConfig>;
};
/**
 * Toggle DevTools panel.
 */
export declare function toggleDevTools(): void;
/**
 * Minimize/maximize DevTools panel.
 */
export declare function toggleMinimize(): void;
/**
 * Set active DevTools tab.
 */
export declare function setActiveTab(tab: "routes" | "state" | "history" | "performance" | "matching"): void;
/**
 * Main Router DevTools component.
 */
export declare function RouterDevTools(props?: {
    config?: DevToolsConfig;
}): VNode | null;
//# sourceMappingURL=devtools.d.ts.map