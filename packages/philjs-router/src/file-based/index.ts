/**
 * File-based routing for PhilJS Router.
 *
 * Provides Next.js/Nuxt-style file-based routing as an alternative
 * to config-based routing.
 *
 * @example
 * ```typescript
 * import { createFileRouter } from '@philjs/router/file-based';
 *
 * const router = createFileRouter({
 *   dir: './src/routes',
 *   extensions: ['.tsx', '.ts'],
 *   layouts: true,
 *   parallel: true,
 * });
 *
 * // Use with your app
 * router.start();
 * ```
 *
 * @example File structure
 * ```
 * src/routes/
 *   page.tsx                    -> /
 *   about/page.tsx              -> /about
 *   blog/[slug]/page.tsx        -> /blog/:slug
 *   docs/[...path]/page.tsx     -> /docs/*path
 *   (marketing)/                -> Route group (no URL segment)
 *     pricing/page.tsx          -> /pricing
 *   @modal/                     -> Parallel route slot
 *     login/page.tsx            -> Renders in @modal slot
 *   _components/                -> Ignored (underscore prefix)
 *     Header.tsx
 * ```
 */

import { render, signal } from "@philjs/core";
import type { VNode, JSXElement } from "@philjs/core";
import type { NestedRouteDefinition, RouteComponent } from "../nested.js";
import type { LoaderFunction, LoaderFunctionContext } from "../loader.js";
import type { ActionFunction, ActionFunctionContext } from "../action.js";
import { setCurrentRouteData, clearLoaderData } from "../loader.js";
import { setRouteError, clearAllRouteErrors } from "../error-boundary.js";
import {
  scanDirectory,
  type ScanResult,
  type ScannedFile,
  type RouteNode,
  type ScannerConfig,
} from "./scanner.js";
import {
  generateFromScanResult,
  matchRouteFromManifest,
  extractRouteParams,
  type RouteManifest,
  type GeneratedRoute,
  type RouteModule,
  type GeneratorConfig,
} from "./generator.js";
import { RouteWatcher, type WatcherConfig } from "./watcher.js";
import {
  patternToRegex,
  type ParsedFilePath,
  type RouteConfig,
  type RouteMetadata,
} from "./conventions.js";

// ============================================================================
// Types
// ============================================================================

/**
 * File router configuration.
 */
export type FileRouterConfig = GeneratorConfig & {
  /** Target element or selector for rendering */
  target?: string | HTMLElement;
  /** Enable view transitions */
  transitions?: boolean;
  /** Enable prefetching */
  prefetch?: boolean | "hover" | "visible" | "intent";
  /** Development mode with hot reload */
  dev?: boolean;
  /** Module loader for dynamic imports */
  moduleLoader?: (path: string) => Promise<RouteModule>;
  /** Custom error handler */
  onError?: (error: Error, routeId: string) => void;
  /** Callback when routes are loaded */
  onRoutesLoaded?: (manifest: RouteManifest) => void;
  /** Callback on navigation */
  onNavigate?: (from: string, to: string) => void;
};

/**
 * File router instance.
 */
export type FileRouter = {
  /** Current route manifest */
  manifest: RouteManifest;
  /** Navigate to a route */
  navigate: (to: string, options?: NavigateOptions) => Promise<void>;
  /** Get current route */
  getCurrentRoute: () => MatchedFileRoute | null;
  /** Reload the current route */
  reload: () => Promise<void>;
  /** Prefetch a route */
  prefetch: (path: string) => Promise<void>;
  /** Start the router */
  start: () => void;
  /** Stop the router and clean up */
  dispose: () => void;
  /** Regenerate routes (dev mode) */
  regenerate: () => RouteManifest;
  /** Subscribe to route changes */
  subscribe: (callback: (route: MatchedFileRoute | null) => void) => () => void;
};

/**
 * Navigation options.
 */
export type NavigateOptions = {
  /** Replace current history entry */
  replace?: boolean;
  /** State to store in history */
  state?: any;
  /** Scroll to element after navigation */
  scrollTo?: string | { x: number; y: number } | false;
  /** Use view transitions */
  transition?: boolean;
};

/**
 * Matched route information.
 */
export type MatchedFileRoute = {
  /** Route definition */
  route: GeneratedRoute;
  /** Extracted parameters */
  params: Record<string, string>;
  /** Current URL */
  url: URL;
  /** Loaded module */
  module: RouteModule | null;
  /** Loader data */
  data: any;
  /** Error from loader */
  error: Error | null;
  /** Loading state */
  loading: boolean;
  /** Layout chain modules */
  layouts: RouteModule[];
};

/**
 * Router state.
 */
type RouterState = {
  /** Current matched route */
  currentRoute: MatchedFileRoute | null;
  /** Is loading */
  loading: boolean;
  /** Navigation history */
  history: string[];
  /** Prefetched routes */
  prefetched: Set<string>;
};

// ============================================================================
// Router State
// ============================================================================

const routerState = signal<RouterState>({
  currentRoute: null,
  loading: false,
  history: [],
  prefetched: new Set(),
});

// ============================================================================
// createFileRouter Implementation
// ============================================================================

/**
 * Create a file-based router.
 */
export function createFileRouter(config: FileRouterConfig): FileRouter {
  // Resolve configuration
  const resolvedConfig: Required<FileRouterConfig> = {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
    ignore: [],
    layouts: true,
    loading: true,
    errors: true,
    parallel: true,
    groups: true,
    lazy: true,
    generateTypes: false,
    basePath: "",
    target: "#app",
    transitions: false,
    prefetch: "hover",
    dev: false,
    ...config,
    moduleLoader: config.moduleLoader || defaultModuleLoader,
    onError: config.onError || defaultErrorHandler,
    onRoutesLoaded: config.onRoutesLoaded || (() => {}),
    onNavigate: config.onNavigate || (() => {}),
  };

  // Scan and generate routes
  let scanResult = scanDirectory(resolvedConfig);
  let manifest = generateFromScanResult(scanResult, resolvedConfig);

  // Module cache
  const moduleCache = new Map<string, RouteModule>();

  // Route watcher for dev mode
  let watcher: RouteWatcher | null = null;

  // Subscribers
  const subscribers = new Set<(route: MatchedFileRoute | null) => void>();

  /**
   * Load a route module.
   */
  async function loadModule(route: GeneratedRoute): Promise<RouteModule | null> {
    // Check cache
    if (moduleCache.has(route.id)) {
      return moduleCache.get(route.id)!;
    }

    try {
      const module = await resolvedConfig.moduleLoader(route.absolutePath);
      moduleCache.set(route.id, module);
      return module;
    } catch (error) {
      resolvedConfig.onError(error as Error, route.id);
      return null;
    }
  }

  /**
   * Load layout modules for a route.
   */
  async function loadLayouts(route: GeneratedRoute): Promise<RouteModule[]> {
    const layouts: RouteModule[] = [];

    for (const layoutPath of route.layoutChain) {
      const layoutRoute = manifest.routes.find((r) =>
        r.filePath === layoutPath
      );
      if (layoutRoute) {
        const module = await loadModule(layoutRoute);
        if (module) {
          layouts.push(module);
        }
      }
    }

    return layouts;
  }

  /**
   * Execute loader for a route.
   */
  async function executeLoader(
    route: GeneratedRoute,
    module: RouteModule,
    url: URL,
    params: Record<string, string>
  ): Promise<{ data: any; error: Error | null }> {
    if (!module.loader) {
      return { data: undefined, error: null };
    }

    try {
      const context: LoaderFunctionContext = {
        params,
        request: new Request(url.toString()),
        url,
      };
      const data = await module.loader(context);
      return { data, error: null };
    } catch (error) {
      return { data: undefined, error: error as Error };
    }
  }

  /**
   * Match and load a route.
   */
  async function matchAndLoadRoute(pathname: string): Promise<MatchedFileRoute | null> {
    const url = new URL(pathname, window.location.origin);

    // Find matching route
    const match = matchRouteFromManifest(url.toString(), manifest);
    if (!match) {
      return null;
    }

    // Extract params
    const params = extractRouteParams(url.toString(), match) || {};

    // Load module
    const module = await loadModule(match);

    // Load layouts
    const layouts = await loadLayouts(match);

    // Execute loader
    const { data, error } = module
      ? await executeLoader(match, module, url, params)
      : { data: undefined, error: null };

    // Store data for hooks
    if (module) {
      setCurrentRouteData(match.id, data, error || undefined);
    }

    return {
      route: match,
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
   * Render the current route.
   */
  function renderRoute(matchedRoute: MatchedFileRoute): void {
    const target = resolveTarget(resolvedConfig.target);
    if (!target || !matchedRoute.module?.default) {
      return;
    }

    const Component = matchedRoute.module.default;

    // Build layout chain
    let content: VNode | JSXElement | string | null = Component({
      params: matchedRoute.params,
      searchParams: matchedRoute.url.searchParams,
      data: matchedRoute.data,
      error: matchedRoute.error || undefined,
    });

    // Apply layouts from innermost to outermost
    for (let i = matchedRoute.layouts.length - 1; i >= 0; i--) {
      const layout = matchedRoute.layouts[i]!;
      if (layout.default) {
        content = layout.default({
          params: matchedRoute.params,
          searchParams: matchedRoute.url.searchParams,
          children: content,
        });
      }
    }

    render(content as VNode, target);
  }

  /**
   * Navigate to a path.
   */
  async function navigate(to: string, options: NavigateOptions = {}): Promise<void> {
    const currentPath = window.location.pathname;
    const url = new URL(to, window.location.origin);

    // Update state to loading
    routerState.set({
      ...routerState(),
      loading: true,
    });

    // Match and load route
    const matchedRoute = await matchAndLoadRoute(url.pathname);

    if (!matchedRoute) {
      // 404 - no matching route
      routerState.set({
        ...routerState(),
        loading: false,
      });
      return;
    }

    // Update history
    if (options.replace) {
      window.history.replaceState(options.state ?? {}, "", to);
    } else {
      window.history.pushState(options.state ?? {}, "", to);
    }

    // Update state
    const newState = {
      currentRoute: matchedRoute,
      loading: false,
      history: [...routerState().history, url.pathname],
      prefetched: routerState().prefetched,
    };
    routerState.set(newState);

    // Notify subscribers
    for (const callback of subscribers) {
      callback(matchedRoute);
    }

    // Callback
    resolvedConfig.onNavigate(currentPath, url.pathname);

    // Render
    if (resolvedConfig.transitions && "startViewTransition" in document) {
      (document as any).startViewTransition(() => {
        renderRoute(matchedRoute);
      });
    } else {
      renderRoute(matchedRoute);
    }

    // Handle scrolling
    if (options.scrollTo !== false) {
      if (typeof options.scrollTo === "string") {
        const element = document.querySelector(options.scrollTo);
        element?.scrollIntoView({ behavior: "smooth" });
      } else if (options.scrollTo) {
        window.scrollTo(options.scrollTo.x, options.scrollTo.y);
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
      scrollTo: false,
    });
  }

  /**
   * Prefetch a route.
   */
  async function prefetch(path: string): Promise<void> {
    const state = routerState();
    if (state.prefetched.has(path)) {
      return;
    }

    const url = new URL(path, window.location.origin);
    const match = matchRouteFromManifest(url.toString(), manifest);

    if (match) {
      await loadModule(match);
      await loadLayouts(match);

      routerState.set({
        ...state,
        prefetched: new Set([...state.prefetched, path]),
      });
    }
  }

  /**
   * Start the router.
   */
  function start(): void {
    // Initial route
    navigate(window.location.pathname + window.location.search, {
      replace: true,
    });

    // Listen for popstate
    window.addEventListener("popstate", handlePopState);

    // Setup prefetching
    if (resolvedConfig.prefetch) {
      setupPrefetching(resolvedConfig.prefetch, prefetch);
    }

    // Start watcher in dev mode
    if (resolvedConfig.dev) {
      watcher = new RouteWatcher({
        ...resolvedConfig,
        onRoutesUpdate: (newManifest) => {
          manifest = newManifest;
          moduleCache.clear();
          resolvedConfig.onRoutesLoaded(newManifest);

          // Reload current route
          navigate(window.location.pathname, { replace: true });
        },
      });
      watcher.start();
    }

    // Callback
    resolvedConfig.onRoutesLoaded(manifest);
  }

  /**
   * Stop the router.
   */
  function dispose(): void {
    window.removeEventListener("popstate", handlePopState);

    if (watcher) {
      watcher.stop();
      watcher = null;
    }

    moduleCache.clear();
    subscribers.clear();
    clearLoaderData();
    clearAllRouteErrors();

    routerState.set({
      currentRoute: null,
      loading: false,
      history: [],
      prefetched: new Set(),
    });
  }

  /**
   * Regenerate routes.
   */
  function regenerate(): RouteManifest {
    scanResult = scanDirectory(resolvedConfig);
    manifest = generateFromScanResult(scanResult, resolvedConfig);
    moduleCache.clear();
    return manifest;
  }

  /**
   * Subscribe to route changes.
   */
  function subscribe(
    callback: (route: MatchedFileRoute | null) => void
  ): () => void {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  }

  return {
    manifest,
    navigate,
    getCurrentRoute: () => routerState().currentRoute,
    reload: () => navigate(window.location.pathname, { replace: true }),
    prefetch,
    start,
    dispose,
    regenerate,
    subscribe,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Default module loader using dynamic imports.
 */
async function defaultModuleLoader(path: string): Promise<RouteModule> {
  // This will be replaced by the bundler
  return import(/* @vite-ignore */ path);
}

/**
 * Default error handler.
 */
function defaultErrorHandler(error: Error, routeId: string): void {
  console.error(`[PhilJS Router] Error loading route "${routeId}":`, error);
}

/**
 * Resolve target element.
 */
function resolveTarget(target: string | HTMLElement): HTMLElement | null {
  if (typeof target === "string") {
    return document.querySelector(target);
  }
  return target;
}

/**
 * Setup prefetching based on strategy.
 */
function setupPrefetching(
  strategy: boolean | "hover" | "visible" | "intent",
  prefetch: (path: string) => Promise<void>
): void {
  if (strategy === false) {
    return;
  }

  const actualStrategy = strategy === true ? "hover" : strategy;

  // Setup hover prefetching
  if (actualStrategy === "hover") {
    document.addEventListener("mouseover", (event) => {
      const link = (event.target as HTMLElement).closest("a[href]");
      if (link && link.getAttribute("href")?.startsWith("/")) {
        prefetch(link.getAttribute("href")!);
      }
    });
  }

  // Setup visible prefetching with IntersectionObserver
  if (actualStrategy === "visible") {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute("href");
            if (href?.startsWith("/")) {
              prefetch(href);
              observer.unobserve(link);
            }
          }
        }
      },
      { rootMargin: "50px" }
    );

    // Observe all internal links
    const observeLinks = () => {
      document.querySelectorAll('a[href^="/"]').forEach((link) => {
        observer.observe(link);
      });
    };

    observeLinks();

    // Re-observe after navigation
    const mutationObserver = new MutationObserver(observeLinks);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Intent-based prefetching
  if (actualStrategy === "intent") {
    let hoverTimer: ReturnType<typeof setTimeout> | null = null;

    document.addEventListener("mouseover", (event) => {
      const link = (event.target as HTMLElement).closest("a[href]");
      if (link && link.getAttribute("href")?.startsWith("/")) {
        hoverTimer = setTimeout(() => {
          prefetch(link.getAttribute("href")!);
        }, 65); // Small delay to filter out accidental hovers
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

// ============================================================================
// Hooks
// ============================================================================

/**
 * Get the current file router state.
 */
export function useFileRouterState(): RouterState {
  return routerState();
}

/**
 * Get the current matched route.
 */
export function useCurrentRoute(): MatchedFileRoute | null {
  return routerState().currentRoute;
}

/**
 * Check if the router is loading.
 */
export function useRouteLoading(): boolean {
  return routerState().loading;
}

// ============================================================================
// Re-exports
// ============================================================================

// Conventions
export {
  parseFilePath,
  parseSegment,
  patternToRegex,
  extractParams,
  calculateRoutePriority,
  generatePath,
  getRoutePathFromFile,
  isRouteFile,
  getRouteId,
  shouldIgnoreFile,
  shouldIgnoreSegment,
  mergeRouteConfig,
  validateRouteConfig,
  RESERVED_FILE_NAMES,
  ROUTE_FILE_EXTENSIONS,
  IGNORE_PATTERNS,
  type RouteFileType,
  type SegmentType,
  type ParsedSegment,
  type ParsedFilePath,
  type RouteConfig,
  type RouteMetadata,
} from "./conventions.js";

// Scanner
export {
  scanDirectory,
  flattenRouteTree,
  findNodeByPath,
  getLayoutChain,
  printRouteTree,
  isRouteFileChange,
  getAffectedRoutes,
  type ScannerConfig,
  type ScannedFile,
  type RouteNode,
  type ScanResult,
} from "./scanner.js";

// Generator
export {
  generateRoutes,
  generateFromScanResult,
  generateRouteTypes,
  generateManifestCode,
  createRouteLoader,
  matchRouteFromManifest,
  extractRouteParams,
  type RouteModule,
  type GeneratedRoute,
  type RouteManifest,
  type GeneratorConfig,
} from "./generator.js";

// Watcher
export {
  RouteWatcher,
  createWatcher,
  watchRoutes,
  createHMRHandler,
  applyHMRUpdate,
  createDevHandler,
  invalidateModuleCache,
  getModuleTimestamp,
  createCacheBustingImport,
  type WatcherConfig,
  type FileChangeEvent,
  type WatcherState,
  type HMRPayload,
  type DevServerOptions,
} from "./watcher.js";

// Vite Plugin
export {
  philjsRouter,
  philjsRouterTypes,
  hmrRuntimeCode,
  generateRoutesAtBuildTime,
  type VitePluginOptions,
} from "./vite-plugin.js";
