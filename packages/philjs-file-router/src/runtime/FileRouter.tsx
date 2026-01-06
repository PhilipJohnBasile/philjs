/**
 * Runtime File Router component for PhilJS.
 *
 * Renders the current route based on the file-based routing manifest.
 * Integrates with @philjs/router for navigation.
 *
 * @example
 * ```tsx
 * import { FileRouter } from '@philjs/file-router/runtime';
 * import { routes } from 'virtual:philjs-file-routes';
 *
 * function App() {
 *   return <FileRouter routes={routes} />;
 * }
 * ```
 */

import { render, signal } from "@philjs/core";
import type { VNode, JSXElement } from "@philjs/core";
import type {
  FileRouterConfig,
  RouteManifest,
  GeneratedRoute,
  MatchedRoute,
  RouterState,
  RouteModule,
  RouteComponentProps,
} from "../types.js";
import { patternToRegex, extractParamsFromUrl } from "../parser.js";

// ============================================================================
// Router State
// ============================================================================

/**
 * Global router state signal.
 */
const routerStateSignal = signal<RouterState>({
  currentRoute: null,
  loading: false,
  history: [],
  prefetched: new Set(),
});

/**
 * Module cache.
 */
const moduleCache = new Map<string, RouteModule>();

/**
 * Active router instance.
 */
let activeRouter: FileRouterInstance | null = null;

// ============================================================================
// Types
// ============================================================================

interface FileRouterInstance {
  navigate: (to: string, options?: NavigateOptions) => Promise<void>;
  getCurrentRoute: () => MatchedRoute | null;
  reload: () => Promise<void>;
  prefetch: (path: string) => Promise<void>;
  dispose: () => void;
}

interface NavigateOptions {
  replace?: boolean;
  state?: unknown;
  scroll?: boolean | { x: number; y: number };
}

interface FileRouterProps {
  /** Route definitions from manifest */
  routes: GeneratedRoute[];
  /** Target element for rendering */
  target?: string | HTMLElement;
  /** Enable view transitions */
  transitions?: boolean;
  /** Prefetch strategy */
  prefetch?: boolean | "hover" | "visible" | "intent";
  /** Custom module loader */
  moduleLoader?: (path: string) => Promise<RouteModule>;
  /** Error handler */
  onError?: (error: Error, routeId: string) => void;
  /** Navigation callback */
  onNavigate?: (from: string, to: string) => void;
  /** Fallback component for loading */
  fallback?: () => VNode | JSXElement | string | null;
  /** Not found component */
  notFound?: () => VNode | JSXElement | string | null;
}

// ============================================================================
// Route Matching
// ============================================================================

/**
 * Match a pathname to a route.
 */
function matchRoute(
  pathname: string,
  routes: GeneratedRoute[]
): { route: GeneratedRoute; params: Record<string, string> } | null {
  for (const route of routes) {
    const regex = patternToRegex(route.path);
    const match = pathname.match(regex);

    if (match) {
      const params: Record<string, string> = {};
      route.params.forEach((param, index) => {
        const value = match[index + 1];
        if (value !== undefined) {
          const paramName = param.startsWith("...") ? param.slice(3) : param;
          params[paramName] = decodeURIComponent(value);
        }
      });
      return { route, params };
    }
  }

  return null;
}

// ============================================================================
// Module Loading
// ============================================================================

/**
 * Load a route module.
 */
async function loadRouteModule(
  route: GeneratedRoute,
  moduleLoader?: (path: string) => Promise<RouteModule>
): Promise<RouteModule | null> {
  // Check cache
  if (moduleCache.has(route.id)) {
    return moduleCache.get(route.id)!;
  }

  try {
    let module: RouteModule;

    if (route.lazy) {
      module = await route.lazy();
    } else if (moduleLoader) {
      module = await moduleLoader(route.absolutePath);
    } else {
      console.error(`No loader available for route: ${route.id}`);
      return null;
    }

    moduleCache.set(route.id, module);
    return module;
  } catch (error) {
    console.error(`Failed to load route module: ${route.id}`, error);
    return null;
  }
}

/**
 * Execute a route's loader function.
 */
async function executeLoader(
  module: RouteModule,
  params: Record<string, string>,
  url: URL
): Promise<{ data: unknown; error: Error | null }> {
  if (!module.loader) {
    return { data: undefined, error: null };
  }

  try {
    const data = await module.loader({
      params,
      request: new Request(url.toString()),
      url,
    });
    return { data, error: null };
  } catch (error) {
    return { data: undefined, error: error as Error };
  }
}

// ============================================================================
// Router Implementation
// ============================================================================

/**
 * Create a file router instance.
 */
export function createFileRouter(config: FileRouterProps): FileRouterInstance {
  const {
    routes,
    target = "#app",
    transitions = false,
    prefetch = "hover",
    moduleLoader,
    onError,
    onNavigate,
    fallback,
    notFound,
  } = config;

  // Sort routes by priority
  const sortedRoutes = [...routes].sort((a, b) => b.priority - a.priority);

  // Resolve target element
  function getTargetElement(): HTMLElement | null {
    if (typeof target === "string") {
      return document.querySelector(target);
    }
    return target;
  }

  /**
   * Match and load a route.
   */
  async function matchAndLoadRoute(pathname: string): Promise<MatchedRoute | null> {
    const url = new URL(pathname, window.location.origin);
    const match = matchRoute(url.pathname, sortedRoutes);

    if (!match) {
      return null;
    }

    const { route, params } = match;

    // Load module
    const module = await loadRouteModule(route, moduleLoader);

    // Load layout modules
    const layouts: RouteModule[] = [];
    for (const layoutPath of route.layoutChain) {
      const layoutRoute = sortedRoutes.find((r) => r.filePath === layoutPath);
      if (layoutRoute) {
        const layoutModule = await loadRouteModule(layoutRoute, moduleLoader);
        if (layoutModule) {
          layouts.push(layoutModule);
        }
      }
    }

    // Execute loader
    const { data, error } = module
      ? await executeLoader(module, params, url)
      : { data: undefined, error: null };

    return {
      route,
      params,
      url,
      module,
      data,
      error,
      loading: false,
      layouts,
    };
  }

  /**
   * Render the matched route.
   */
  function renderRoute(matchedRoute: MatchedRoute | null): void {
    const targetEl = getTargetElement();
    if (!targetEl) return;

    // No route matched - show 404
    if (!matchedRoute) {
      if (notFound) {
        render(notFound() as VNode, targetEl);
      } else {
        targetEl.innerHTML = "<h1>404 - Not Found</h1>";
      }
      return;
    }

    const { route, params, url, module, data, error, layouts } = matchedRoute;

    if (!module?.default) {
      if (notFound) {
        render(notFound() as VNode, targetEl);
      }
      return;
    }

    // Build props
    const props: RouteComponentProps = {
      params,
      searchParams: url.searchParams,
      data,
      error: error || undefined,
    };

    // Render component
    let content = module.default(props);

    // Wrap with layouts (innermost to outermost)
    for (let i = layouts.length - 1; i >= 0; i--) {
      const layout = layouts[i]!;
      if (layout.default) {
        content = layout.default({
          ...props,
          children: content,
        });
      }
    }

    render(content as VNode, targetEl);
  }

  /**
   * Navigate to a path.
   */
  async function navigate(to: string, options: NavigateOptions = {}): Promise<void> {
    const currentPath = window.location.pathname;
    const url = new URL(to, window.location.origin);

    // Update state to loading
    routerStateSignal.set({
      ...routerStateSignal(),
      loading: true,
    });

    // Show loading state
    const targetEl = getTargetElement();
    if (targetEl && fallback) {
      render(fallback() as VNode, targetEl);
    }

    // Match and load route
    const matchedRoute = await matchAndLoadRoute(url.pathname);

    // Update history
    if (options.replace) {
      window.history.replaceState(options.state ?? {}, "", to);
    } else {
      window.history.pushState(options.state ?? {}, "", to);
    }

    // Update state
    routerStateSignal.set({
      currentRoute: matchedRoute,
      loading: false,
      history: [...routerStateSignal().history, url.pathname],
      prefetched: routerStateSignal().prefetched,
    });

    // Callback
    if (onNavigate) {
      onNavigate(currentPath, url.pathname);
    }

    // Render
    if (transitions && "startViewTransition" in document) {
      (document as any).startViewTransition(() => {
        renderRoute(matchedRoute);
      });
    } else {
      renderRoute(matchedRoute);
    }

    // Handle scrolling
    if (options.scroll !== false) {
      if (typeof options.scroll === "object") {
        window.scrollTo(options.scroll.x, options.scroll.y);
      } else {
        window.scrollTo(0, 0);
      }
    }
  }

  /**
   * Handle popstate events.
   */
  function handlePopState(): void {
    navigate(window.location.pathname + window.location.search, {
      replace: true,
      scroll: false,
    });
  }

  /**
   * Prefetch a route.
   */
  async function prefetchRoute(path: string): Promise<void> {
    const state = routerStateSignal();
    if (state.prefetched.has(path)) {
      return;
    }

    const url = new URL(path, window.location.origin);
    const match = matchRoute(url.pathname, sortedRoutes);

    if (match) {
      await loadRouteModule(match.route, moduleLoader);

      // Prefetch layouts too
      for (const layoutPath of match.route.layoutChain) {
        const layoutRoute = sortedRoutes.find((r) => r.filePath === layoutPath);
        if (layoutRoute) {
          await loadRouteModule(layoutRoute, moduleLoader);
        }
      }

      routerStateSignal.set({
        ...state,
        prefetched: new Set([...state.prefetched, path]),
      });
    }
  }

  /**
   * Setup prefetching based on strategy.
   */
  function setupPrefetching(): void {
    if (!prefetch) return;

    const strategy = prefetch === true ? "hover" : prefetch;

    if (strategy === "hover") {
      document.addEventListener("mouseover", (event) => {
        const link = (event.target as HTMLElement).closest("a[href]");
        if (link) {
          const href = link.getAttribute("href");
          if (href?.startsWith("/")) {
            prefetchRoute(href);
          }
        }
      });
    }

    if (strategy === "visible") {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const link = entry.target as HTMLAnchorElement;
              const href = link.getAttribute("href");
              if (href?.startsWith("/")) {
                prefetchRoute(href);
                observer.unobserve(link);
              }
            }
          }
        },
        { rootMargin: "50px" }
      );

      // Observe links after each render
      const observeLinks = () => {
        document.querySelectorAll('a[href^="/"]').forEach((link) => {
          observer.observe(link);
        });
      };

      observeLinks();
      new MutationObserver(observeLinks).observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    if (strategy === "intent") {
      let hoverTimer: ReturnType<typeof setTimeout> | null = null;

      document.addEventListener("mouseover", (event) => {
        const link = (event.target as HTMLElement).closest("a[href]");
        if (link) {
          const href = link.getAttribute("href");
          if (href?.startsWith("/")) {
            hoverTimer = setTimeout(() => {
              prefetchRoute(href);
            }, 65);
          }
        }
      });

      document.addEventListener("mouseout", () => {
        if (hoverTimer) {
          clearTimeout(hoverTimer);
          hoverTimer = null;
        }
      });
    }
  }

  /**
   * Start the router.
   */
  function start(): void {
    // Listen for popstate
    window.addEventListener("popstate", handlePopState);

    // Setup prefetching
    setupPrefetching();

    // Initial navigation
    navigate(window.location.pathname + window.location.search, {
      replace: true,
    });
  }

  /**
   * Dispose the router.
   */
  function dispose(): void {
    window.removeEventListener("popstate", handlePopState);
    moduleCache.clear();
    routerStateSignal.set({
      currentRoute: null,
      loading: false,
      history: [],
      prefetched: new Set(),
    });
    activeRouter = null;
  }

  const router: FileRouterInstance = {
    navigate,
    getCurrentRoute: () => routerStateSignal().currentRoute,
    reload: () => navigate(window.location.pathname, { replace: true }),
    prefetch: prefetchRoute,
    dispose,
  };

  activeRouter = router;

  // Start immediately
  start();

  return router;
}

// ============================================================================
// Component
// ============================================================================

/**
 * FileRouter component props.
 */
export interface FileRouterComponentProps extends FileRouterProps {
  /** Children to render inside (optional) */
  children?: VNode | JSXElement | string | null;
}

/**
 * FileRouter component.
 *
 * Creates and manages a file-based router instance.
 */
export function FileRouter(props: FileRouterComponentProps): VNode | JSXElement | null {
  // Create router on mount
  if (!activeRouter) {
    createFileRouter(props);
  }

  // The router manages rendering itself via the target element
  // This component doesn't render anything directly
  return null;
}

// ============================================================================
// Exports
// ============================================================================

/**
 * Get the active router instance.
 */
export function getActiveRouter(): FileRouterInstance | null {
  return activeRouter;
}

/**
 * Get current router state.
 */
export function getRouterState(): RouterState {
  return routerStateSignal();
}

/**
 * Subscribe to router state changes.
 */
export function subscribeToRouter(
  callback: (state: RouterState) => void
): () => void {
  // Simple subscription by polling (in production, use proper signals)
  let lastState = routerStateSignal();

  const interval = setInterval(() => {
    const currentState = routerStateSignal();
    if (currentState !== lastState) {
      lastState = currentState;
      callback(currentState);
    }
  }, 50);

  return () => clearInterval(interval);
}
