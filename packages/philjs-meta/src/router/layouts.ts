/**
 * PhilJS Meta - Nested Layouts Support
 *
 * Implements layout system with support for:
 * - _layout.tsx files for nested layouts
 * - _error.tsx for error boundaries
 * - _loading.tsx for loading states
 * - Layout composition and data passing
 */

import type { RouteDefinition } from './file-based';

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
export function createLayoutTree(routes: RouteDefinition[]): LayoutTreeNode {
  const root: LayoutTreeNode = {
    children: new Map(),
    routes: [],
  };

  for (const route of routes) {
    let currentNode = root;
    const segments = route.pattern.split('/').filter(Boolean);

    // Walk through segments, creating nodes as needed
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (!currentNode.children.has(segment)) {
        currentNode.children.set(segment, {
          children: new Map(),
          routes: [],
        });
      }

      currentNode = currentNode.children.get(segment)!;
    }

    // Add route to the final node
    currentNode.routes.push(route);

    // Process layouts for this route
    for (let i = 0; i < route.layouts.length; i++) {
      const layoutPath = route.layouts[i];
      const depth = i;

      // Find or create the node for this layout depth
      let layoutNode = root;
      for (let j = 0; j < depth; j++) {
        const seg = segments[j];
        if (layoutNode.children.has(seg)) {
          layoutNode = layoutNode.children.get(seg)!;
        }
      }

      // Set layout if not already set
      if (!layoutNode.layout) {
        layoutNode.layout = {
          filePath: layoutPath,
          segment: segments[depth - 1] || '',
          depth,
          errorBoundary: route.error,
          loading: route.loading,
        };
      }
    }
  }

  return root;
}

/**
 * Get all layouts for a specific route (from root to leaf)
 */
export function getLayoutsForRoute(route: RouteDefinition): LayoutDefinition[] {
  return route.layouts.map((filePath, index) => ({
    filePath,
    segment: route.pattern.split('/').filter(Boolean)[index - 1] || '',
    depth: index,
    errorBoundary: route.error,
    loading: route.loading,
  }));
}

/**
 * Layout render context manager
 */
export class LayoutContextManager {
  private contexts: Map<string, LayoutContext> = new Map();

  /**
   * Create a new layout context for a route
   */
  createContext(
    route: RouteDefinition,
    params: Record<string, string | string[]>,
    searchParams: Record<string, string | string[]>
  ): LayoutContext {
    const context: LayoutContext = {
      route,
      params,
      searchParams,
      layoutData: new Map(),
      errors: new Map(),
      loading: new Map(),
    };

    const contextId = route.pattern + JSON.stringify(params);
    this.contexts.set(contextId, context);

    return context;
  }

  /**
   * Get context for a route
   */
  getContext(route: RouteDefinition, params: Record<string, string | string[]>): LayoutContext | undefined {
    const contextId = route.pattern + JSON.stringify(params);
    return this.contexts.get(contextId);
  }

  /**
   * Set layout data
   */
  setLayoutData(context: LayoutContext, layoutPath: string, data: unknown): void {
    context.layoutData.set(layoutPath, data);
  }

  /**
   * Get layout data
   */
  getLayoutData(context: LayoutContext, layoutPath: string): unknown {
    return context.layoutData.get(layoutPath);
  }

  /**
   * Set error for a layout
   */
  setError(context: LayoutContext, layoutPath: string, error: Error): void {
    context.errors.set(layoutPath, error);
  }

  /**
   * Clear error for a layout
   */
  clearError(context: LayoutContext, layoutPath: string): void {
    context.errors.delete(layoutPath);
  }

  /**
   * Set loading state for a layout
   */
  setLoading(context: LayoutContext, layoutPath: string, loading: boolean): void {
    context.loading.set(layoutPath, loading);
  }

  /**
   * Check if any layout is loading
   */
  isLoading(context: LayoutContext): boolean {
    for (const loading of context.loading.values()) {
      if (loading) return true;
    }
    return false;
  }

  /**
   * Clean up context
   */
  destroyContext(route: RouteDefinition, params: Record<string, string | string[]>): void {
    const contextId = route.pattern + JSON.stringify(params);
    this.contexts.delete(contextId);
  }
}

/**
 * Layout composition utilities
 */
export const LayoutUtils = {
  /**
   * Compose layouts into a nested structure
   */
  composeLayouts(
    layouts: LayoutDefinition[],
    pageContent: unknown,
    layoutData: Map<string, unknown>
  ): LayoutComposition {
    return {
      layouts,
      pageContent,
      layoutData,
      render: () => {
        // This will be implemented by the runtime renderer
        return null;
      },
    };
  },

  /**
   * Find the nearest error boundary for a given depth
   */
  findErrorBoundary(layouts: LayoutDefinition[], depth: number): LayoutDefinition | undefined {
    // Search from current depth upwards
    for (let i = depth; i >= 0; i--) {
      if (layouts[i]?.errorBoundary) {
        return layouts[i];
      }
    }
    return undefined;
  },

  /**
   * Find the nearest loading component for a given depth
   */
  findLoading(layouts: LayoutDefinition[], depth: number): LayoutDefinition | undefined {
    // Search from current depth upwards
    for (let i = depth; i >= 0; i--) {
      if (layouts[i]?.loading) {
        return layouts[i];
      }
    }
    return undefined;
  },

  /**
   * Check if a layout path is an ancestor of another
   */
  isAncestor(ancestorPath: string, descendantPath: string): boolean {
    return descendantPath.startsWith(ancestorPath);
  },

  /**
   * Get the common ancestor layout between two routes
   */
  getCommonAncestor(
    layouts1: LayoutDefinition[],
    layouts2: LayoutDefinition[]
  ): LayoutDefinition | undefined {
    const minLength = Math.min(layouts1.length, layouts2.length);

    let commonAncestor: LayoutDefinition | undefined;

    for (let i = 0; i < minLength; i++) {
      if (layouts1[i].filePath === layouts2[i].filePath) {
        commonAncestor = layouts1[i];
      } else {
        break;
      }
    }

    return commonAncestor;
  },
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
export function createErrorBoundary(config: ErrorBoundaryConfig = {}): ErrorBoundaryFactory {
  return {
    config,
    wrap: (content: unknown) => ({
      content,
      config,
    }),
  };
}

export interface ErrorBoundaryFactory {
  config: ErrorBoundaryConfig;
  wrap: (content: unknown) => { content: unknown; config: ErrorBoundaryConfig };
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
export function createLoadingWrapper(config: LoadingConfig = {}): LoadingFactory {
  return {
    config,
    wrap: (content: unknown) => ({
      content,
      config,
    }),
  };
}

export interface LoadingFactory {
  config: LoadingConfig;
  wrap: (content: unknown) => { content: unknown; config: LoadingConfig };
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
export function getParallelSlots(
  route: RouteDefinition,
  allRoutes: RouteDefinition[]
): ParallelRouteSlot[] {
  const slots: ParallelRouteSlot[] = [];

  // Find sibling routes that are in parallel route directories
  const routeDir = route.filePath.substring(0, route.filePath.lastIndexOf('/'));

  for (const otherRoute of allRoutes) {
    const otherDir = otherRoute.filePath.substring(0, otherRoute.filePath.lastIndexOf('/'));

    // Check if it's in a parallel route directory (starts with @)
    const dirName = otherDir.split('/').pop();
    if (dirName?.startsWith('@')) {
      const slotName = dirName.substring(1);

      // Check if it's a sibling
      const otherParent = otherDir.substring(0, otherDir.lastIndexOf('/'));
      const routeParent = routeDir.substring(0, routeDir.lastIndexOf('/'));

      if (otherParent === routeParent) {
        slots.push({
          name: slotName,
          route: otherRoute,
        });
      }
    }
  }

  return slots;
}

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
export function parseInterceptedRoute(pattern: string): InterceptedRoute | null {
  const interceptPatterns = [
    { prefix: '(...)', type: 'root' as const },
    { prefix: '(..)(..)', type: 'two-levels-up' as const },
    { prefix: '(..)', type: 'one-level-up' as const },
    { prefix: '(.)', type: 'same-level' as const },
  ];

  for (const { prefix, type } of interceptPatterns) {
    if (pattern.includes(prefix)) {
      const originalPattern = pattern.replace(prefix, '');
      return {
        originalPattern,
        interceptPattern: pattern,
        type,
      };
    }
  }

  return null;
}
