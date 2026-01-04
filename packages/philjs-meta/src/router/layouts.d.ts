/**
 * PhilJS Meta - Nested Layouts Support
 *
 * Implements layout system with support for:
 * - _layout.tsx files for nested layouts
 * - _error.tsx for error boundaries
 * - _loading.tsx for loading states
 * - Layout composition and data passing
 */
import type { RouteDefinition } from './file-based.js';
/**
 * Layout component props
 */
export interface LayoutProps {
    /** Child content to render */
    children: unknown;
    /** Route parameters */
    params: Record<string, string | string[]>;
    /** Search parameters */
    searchParams: Record<string, string | string[]>;
    /** Loader data for this layout */
    data?: unknown;
}
/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
    /** The error that was caught */
    error: Error;
    /** Function to reset the error boundary */
    reset: () => void;
    /** Route parameters */
    params: Record<string, string | string[]>;
}
/**
 * Loading component props
 */
export interface LoadingProps {
    /** Route parameters */
    params: Record<string, string | string[]>;
}
/**
 * Layout definition
 */
export interface LayoutDefinition {
    /** Path to the layout file */
    filePath: string;
    /** The segment this layout belongs to */
    segment: string;
    /** Depth in the layout tree (0 = root) */
    depth: number;
    /** Path to associated error boundary */
    errorBoundary?: string;
    /** Path to associated loading component */
    loading?: string;
    /** Loader function name for this layout */
    loaderName?: string;
}
/**
 * Layout tree node
 */
export interface LayoutTreeNode {
    /** Layout definition */
    layout?: LayoutDefinition;
    /** Children layouts */
    children: Map<string, LayoutTreeNode>;
    /** Associated routes */
    routes: RouteDefinition[];
}
/**
 * Layout context for runtime
 */
export interface LayoutContext {
    /** Current route being rendered */
    route: RouteDefinition;
    /** Route parameters */
    params: Record<string, string | string[]>;
    /** Search parameters */
    searchParams: Record<string, string | string[]>;
    /** Layout data from loaders */
    layoutData: Map<string, unknown>;
    /** Error state for each layout */
    errors: Map<string, Error>;
    /** Loading state for each layout */
    loading: Map<string, boolean>;
}
/**
 * Create a layout tree from route definitions
 */
export declare function createLayoutTree(routes: RouteDefinition[]): LayoutTreeNode;
/**
 * Get all layouts for a specific route (from root to leaf)
 */
export declare function getLayoutsForRoute(route: RouteDefinition): LayoutDefinition[];
/**
 * Layout render context manager
 */
export declare class LayoutContextManager {
    private contexts;
    /**
     * Create a new layout context for a route
     */
    createContext(route: RouteDefinition, params: Record<string, string | string[]>, searchParams: Record<string, string | string[]>): LayoutContext;
    /**
     * Get context for a route
     */
    getContext(route: RouteDefinition, params: Record<string, string | string[]>): LayoutContext | undefined;
    /**
     * Set layout data
     */
    setLayoutData(context: LayoutContext, layoutPath: string, data: unknown): void;
    /**
     * Get layout data
     */
    getLayoutData(context: LayoutContext, layoutPath: string): unknown;
    /**
     * Set error for a layout
     */
    setError(context: LayoutContext, layoutPath: string, error: Error): void;
    /**
     * Clear error for a layout
     */
    clearError(context: LayoutContext, layoutPath: string): void;
    /**
     * Set loading state for a layout
     */
    setLoading(context: LayoutContext, layoutPath: string, loading: boolean): void;
    /**
     * Check if any layout is loading
     */
    isLoading(context: LayoutContext): boolean;
    /**
     * Clean up context
     */
    destroyContext(route: RouteDefinition, params: Record<string, string | string[]>): void;
}
/**
 * Layout composition utilities
 */
export declare const LayoutUtils: {
    /**
     * Compose layouts into a nested structure
     */
    composeLayouts(layouts: LayoutDefinition[], pageContent: unknown, layoutData: Map<string, unknown>): LayoutComposition;
    /**
     * Find the nearest error boundary for a given depth
     */
    findErrorBoundary(layouts: LayoutDefinition[], depth: number): LayoutDefinition | undefined;
    /**
     * Find the nearest loading component for a given depth
     */
    findLoading(layouts: LayoutDefinition[], depth: number): LayoutDefinition | undefined;
    /**
     * Check if a layout path is an ancestor of another
     */
    isAncestor(ancestorPath: string, descendantPath: string): boolean;
    /**
     * Get the common ancestor layout between two routes
     */
    getCommonAncestor(layouts1: LayoutDefinition[], layouts2: LayoutDefinition[]): LayoutDefinition | undefined;
};
/**
 * Layout composition result
 */
export interface LayoutComposition {
    layouts: LayoutDefinition[];
    pageContent: unknown;
    layoutData: Map<string, unknown>;
    render: () => unknown;
}
/**
 * Error boundary wrapper configuration
 */
export interface ErrorBoundaryConfig {
    /** Fallback component to render on error */
    fallback?: (props: ErrorBoundaryProps) => unknown;
    /** Callback when error is caught */
    onError?: (error: Error, errorInfo: unknown) => void;
    /** Callback when error is reset */
    onReset?: () => void;
    /** Keys that trigger reset when changed */
    resetKeys?: unknown[];
}
/**
 * Create error boundary wrapper
 */
export declare function createErrorBoundary(config?: ErrorBoundaryConfig): ErrorBoundaryFactory;
export interface ErrorBoundaryFactory {
    config: ErrorBoundaryConfig;
    wrap: (content: unknown) => {
        content: unknown;
        config: ErrorBoundaryConfig;
    };
}
/**
 * Loading state wrapper configuration
 */
export interface LoadingConfig {
    /** Delay before showing loading state (ms) */
    delay?: number;
    /** Minimum time to show loading state (ms) */
    minDuration?: number;
    /** Fallback component while loading */
    fallback?: (props: LoadingProps) => unknown;
}
/**
 * Create loading wrapper
 */
export declare function createLoadingWrapper(config?: LoadingConfig): LoadingFactory;
export interface LoadingFactory {
    config: LoadingConfig;
    wrap: (content: unknown) => {
        content: unknown;
        config: LoadingConfig;
    };
}
/**
 * Parallel routes support
 */
export interface ParallelRouteSlot {
    /** Slot name (e.g., "modal", "sidebar") */
    name: string;
    /** Current route in this slot */
    route?: RouteDefinition;
    /** Default content for the slot */
    default?: string;
}
/**
 * Get parallel route slots for a route
 */
export declare function getParallelSlots(route: RouteDefinition, allRoutes: RouteDefinition[]): ParallelRouteSlot[];
/**
 * Intercepted routes support (for modals, etc.)
 */
export interface InterceptedRoute {
    /** Original route pattern */
    originalPattern: string;
    /** Intercepted route pattern (with (.) (..) (...) prefix) */
    interceptPattern: string;
    /** Interception type */
    type: 'same-level' | 'one-level-up' | 'two-levels-up' | 'root';
}
/**
 * Parse intercepted route pattern
 */
export declare function parseInterceptedRoute(pattern: string): InterceptedRoute | null;
//# sourceMappingURL=layouts.d.ts.map