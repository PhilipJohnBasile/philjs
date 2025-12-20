/**
 * High-level router helpers built atop the low-level manifest system.
 * Provides declarative routes, navigation, and view helpers similar to
 * frameworks like Next.js or Remix, but backed by PhilJS signals and resumability.
 *
 * Enhanced with Remix-style nested routes with parallel data loading.
 */

import { render, signal, isResult, isOk, isErr } from "philjs-core";
import type { JSXElement, VNode } from "philjs-core";
import {
  SmartPreloader,
  initSmartPreloader,
  getSmartPreloader,
} from "./smart-preload.js";
import {
  ViewTransitionManager,
  initViewTransitions,
  getViewTransitionManager,
} from "./view-transitions.js";
import {
  setCurrentRouteData,
  clearLoaderData,
  type LoaderFunction,
  type LoaderFunctionContext,
} from "./loader.js";
import {
  setRouteError,
  clearAllRouteErrors,
  type RouteError,
  type ErrorBoundaryComponent,
} from "./error-boundary.js";

export type RouteComponent<Props = any> = (props: Props) => VNode | JSXElement | string | null | undefined;

export type RouteDefinition = {
  /** Route path pattern (e.g., "/users/:id") */
  path: string;
  /** Route component */
  component: RouteComponent<RouteComponentProps>;
  /** Data loader function */
  loader?: (context: LoaderContext) => Promise<any>;
  /** Action function for mutations */
  action?: (context: ActionContext) => Promise<Response | void>;
  /** Child routes for nesting */
  children?: RouteDefinition[];
  /** Layout component that wraps children */
  layout?: RouteComponent<LayoutComponentProps>;
  /** Error boundary component */
  errorBoundary?: ErrorBoundaryComponent;
  /** Route transition configuration */
  transition?: RouteTransitionOptions;
  /** Prefetch configuration */
  prefetch?: PrefetchOptions;
  /** Route ID for loader data access */
  id?: string;
  /** Handle object for useMatches */
  handle?: unknown;
  /** Additional route configuration */
  config?: Record<string, unknown>;
};

export type RouteComponentProps = {
  /** Route parameters extracted from the URL */
  params: Record<string, string>;
  /** Loader data */
  data?: any;
  /** Error from loader or action */
  error?: any;
  /** Current URL */
  url: URL;
  /** Navigation function */
  navigate: NavigateFunction;
  /** URL search params */
  searchParams?: URLSearchParams;
  /** Child outlet content (for nested routes) */
  outlet?: VNode | JSXElement | string | null;
};

export type LayoutComponentProps = RouteComponentProps & {
  /** Child content to render inside layout */
  children: VNode | JSXElement | string | null | undefined;
};

export type LoaderContext = {
  params: Record<string, string>;
  request: Request;
};

export type ActionContext = LoaderContext & { formData: FormData };

export type PrefetchOptions =
  | boolean
  | {
      strategy?: "hover" | "visible" | "intent" | "eager" | "manual";
      intentThreshold?: number;
      priority?: "high" | "low" | "auto";
    };

export type RouteTransitionOptions =
  | boolean
  | {
      type?: "fade" | "slide-left" | "slide-right" | "slide-up" | "slide-down" | "scale" | "custom";
      duration?: number;
      easing?: string;
      customCSS?: string;
    };

export type RouterOptions = {
  routes: RouteDefinition[];
  base?: string;
  transitions?: boolean | RouteTransitionOptions;
  prefetch?: boolean | PrefetchOptions;
  target?: string | HTMLElement;
};

export type RouteManifestOptions = {
  base?: string;
};

export type RouteTypeGenerationOptions = RouteManifestOptions & {
  moduleName?: string;
};

export type RouteMatcher = (pathname: string) => MatchedRoute | null;

export type NavigateFunction = (to: string, options?: { replace?: boolean; state?: any }) => Promise<void>;

export type RouteModule = {
  loader?: RouteDefinition["loader"];
  action?: RouteDefinition["action"];
  default: RouteComponent<RouteComponentProps>;
  config?: Record<string, unknown>;
};

export type MatchedRoute = {
  path: string;
  params: Record<string, string>;
  data?: any;
  error?: any;
  component: RouteComponent<RouteComponentProps>;
  module: RouteModule;
};

type InternalRouteEntry = {
  definition: RouteDefinition;
  module: RouteModule;
  parent?: string | null;
  layouts: RouteComponent<LayoutComponentProps>[];
  /** Route ID for loader data access */
  id: string;
  /** Error boundary component */
  errorBoundary?: ErrorBoundaryComponent;
  /** Handle object for useMatches */
  handle?: unknown;
};

/**
 * Matched route in a hierarchy for nested routing.
 */
export type NestedMatchedRoute = MatchedRoute & {
  /** Route ID */
  id: string;
  /** Parent route ID */
  parentId?: string;
  /** Loader data */
  loaderData?: any;
  /** Action data */
  actionData?: any;
  /** Handle object */
  handle?: unknown;
};

type RouterState = {
  route: MatchedRoute | null;
  navigate: NavigateFunction;
  /** All matched routes in the hierarchy */
  matches: NestedMatchedRoute[];
};

const routerStateSignal = signal<RouterState>({
  route: null,
  navigate: async () => {},
  matches: [],
});

let activeRouter: HighLevelRouter | null = null;

export type HighLevelRouter = {
  manifest: Record<string, RouteModule>;
  navigate: NavigateFunction;
  dispose: () => void;
  getCurrentRoute: () => MatchedRoute | null;
  /** Get all matched routes in the current hierarchy */
  getMatches: () => NestedMatchedRoute[];
  /** Revalidate all loader data */
  revalidate: () => Promise<void>;
};

/**
 * Create a high-level router with declarative routes.
 * Supports Remix-style nested routes with parallel data loading.
 */
export function createAppRouter(options: RouterOptions): HighLevelRouter {
  const targetElement = resolveTarget(options.target ?? "#app");
  const preloader = ensureSmartPreloader(options.prefetch);
  const transitionManager = ensureTransitionManager(options.transitions);

  const { manifest, routeMap } = buildManifestGraph(
    options.routes,
    normalizeBase(options.base ?? "")
  );

  const historyListeners = new Set<() => void>();

  const navigate: NavigateFunction = async (to, navOptions) => {
    const url = new URL(to, window.location.origin);
    if (navOptions?.replace) {
      window.history.replaceState(navOptions.state ?? {}, "", url.toString());
    } else {
      window.history.pushState(navOptions?.state ?? {}, "", url.toString());
    }

    await renderCurrentRoute(routeMap, transitionManager, preloader, targetElement, url, navigate);
    historyListeners.forEach((listener) => listener());
  };

  const getCurrentRoute = () => routerStateSignal().route;
  const getMatches = () => routerStateSignal().matches;

  const revalidate = async () => {
    const url = new URL(window.location.href);
    // Clear cached data and re-run loaders
    clearLoaderData();
    await renderCurrentRoute(routeMap, transitionManager, preloader, targetElement, url, navigate, true);
  };

  const router: HighLevelRouter = {
    manifest,
    navigate,
    getCurrentRoute,
    getMatches,
    revalidate,
    dispose: () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("philjs:revalidate", handleRevalidate);
      historyListeners.clear();
      activeRouter = null;
      preloader?.clear();
      clearLoaderData();
      clearAllRouteErrors();
    },
  };

  activeRouter = router;
  routerStateSignal.set({ route: null, navigate, matches: [] });

  function handlePopState() {
    void renderCurrentRoute(routeMap, transitionManager, preloader, targetElement, new URL(window.location.href), navigate);
  }

  function handleRevalidate() {
    void revalidate();
  }

  window.addEventListener("popstate", handlePopState);
  window.addEventListener("philjs:revalidate", handleRevalidate);
  void renderCurrentRoute(routeMap, transitionManager, preloader, targetElement, new URL(window.location.href), navigate);

  return router;
}

export function createRouteManifest(
  routes: RouteDefinition[],
  options: RouteManifestOptions = {}
): Record<string, RouteModule> {
  return buildManifestGraph(routes, normalizeBase(options.base ?? "")).manifest;
}

export function createRouteMatcher(
  routes: RouteDefinition[],
  options: RouteManifestOptions = {}
): RouteMatcher {
  const { routeMap } = buildManifestGraph(routes, normalizeBase(options.base ?? ""));
  return (pathname: string) => matchCurrentRoute(routeMap, pathname);
}

export function generateRouteTypes(
  routes: RouteDefinition[],
  options: RouteTypeGenerationOptions = {}
): string {
  const base = normalizeBase(options.base ?? "");
  const entries = collectRouteEntries(routes, base);

  const inModule = Boolean(options.moduleName);
  const header = inModule
    ? [`declare module "${options.moduleName}" {`, "  export interface RouteParams {"]
    : ["export interface RouteParams {"];

  const entryIndent = inModule ? "    " : "  ";
  const body = entries.map((entry) => formatRouteEntry(entry, entryIndent));

  const footer = inModule
    ? ["  }", "  export type RoutePath = keyof RouteParams;", "}"]
    : ["}", "export type RoutePath = keyof RouteParams;"];

  return [...header, ...body, ...footer, ""].join("\n");
}

/**
 * Hook to access current router state (route + navigate).
 */
export function useRouter(): RouterState {
  return routerStateSignal();
}

/**
 * Hook to access the current matched route detail.
 */
export function useRoute(): MatchedRoute | null {
  return routerStateSignal().route ?? null;
}

/**
 * View component that renders the current route.
 */
export function RouterView(): VNode | JSXElement | string | null {
  const state = useRouter();
  if (!state.route) return null;
  const Component = state.route.component;
  return Component({
    params: state.route.params,
    data: state.route.data,
    error: state.route.error,
    url: new URL(window.location.href),
    navigate: state.navigate,
  });
}

type LinkProps = {
  to: string;
  replace?: boolean;
  prefetch?: PrefetchOptions;
  children?: VNode | JSXElement | string;
  [key: string]: any;
};

/**
 * Declarative navigation component.
 */
export function Link(props: LinkProps): VNode {
  const { to, replace, children, ...rest } = props;
  const state = useRouter();

  const handleClick = (event: MouseEvent) => {
    if (rest.onClick) rest.onClick(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }
    event.preventDefault();
    return state.navigate(to, { replace });
  };

  const linkProps: Record<string, any> = {
    href: to,
    "data-router-link": "",
    ...rest,
    onClick: handleClick,
    children,
  };

  return {
    type: "a",
    props: linkProps,
  };
}

// ----------------------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------------------

function ensureSmartPreloader(prefetch: RouterOptions["prefetch"]) {
  if (!prefetch) return null;
  const options = typeof prefetch === "boolean" ? {} : prefetch;
  const existing = getSmartPreloader();
  if (existing) return existing;
  return initSmartPreloader({
    strategy: options?.strategy ?? "intent",
    intentThreshold: options?.intentThreshold ?? 0.6,
    priority: options?.priority ?? "auto",
  });
}

function ensureTransitionManager(transitions: RouterOptions["transitions"]) {
  if (!transitions) return null;
  const existing = getViewTransitionManager();
  if (existing) return existing;
  return initViewTransitions();
}

type BuildManifestResult = {
  manifest: Record<string, RouteModule>;
  routeMap: Map<string, InternalRouteEntry>;
};

function buildManifestGraph(routes: RouteDefinition[], base: string): BuildManifestResult {
  const manifest: Record<string, RouteModule> = Object.create(null);
  const routeMap = new Map<string, InternalRouteEntry>();
  addRoutes(routes, base || "", [], null, manifest, routeMap);
  return { manifest, routeMap };
}

function addRoutes(
  routes: RouteDefinition[],
  base: string,
  parentLayouts: RouteComponent<LayoutComponentProps>[],
  parentPath: string | null,
  manifest: Record<string, RouteModule>,
  routeMap: Map<string, InternalRouteEntry>
) {
  for (const route of routes) {
    const path = resolvePath(base, route.path);
    const layouts = [...parentLayouts];
    if (route.layout) {
      layouts.push(route.layout);
    }

    // Generate route ID (use explicit id or path)
    const routeId = route.id || path;

    const module: RouteModule = {
      loader: route.loader,
      action: route.action,
      default: composeComponent(layouts, route.component),
      config: route.config,
    };

    manifest[path] = module;
    routeMap.set(path, {
      definition: route,
      module,
      parent: parentPath,
      layouts,
      id: routeId,
      errorBoundary: route.errorBoundary,
      handle: route.handle,
    });

    if (route.children?.length) {
      addRoutes(route.children, path, layouts, path, manifest, routeMap);
    }
  }
}

type RouteTypeEntry = {
  path: string;
  params: Array<{ name: string; type: string }>;
};

function collectRouteEntries(routes: RouteDefinition[], base: string): RouteTypeEntry[] {
  const entries: RouteTypeEntry[] = [];
  addRouteEntries(routes, base || "", entries);
  return entries;
}

function addRouteEntries(routes: RouteDefinition[], base: string, entries: RouteTypeEntry[]) {
  for (const route of routes) {
    const path = resolvePath(base, route.path);
    entries.push({ path, params: extractParamsFromPath(path) });

    if (route.children?.length) {
      addRouteEntries(route.children, path, entries);
    }
  }
}

function extractParamsFromPath(path: string): Array<{ name: string; type: string }> {
  const parts = path.split("/").filter(Boolean);
  const params: Array<{ name: string; type: string }> = [];

  for (const part of parts) {
    if (part.startsWith(":")) {
      params.push({ name: part.slice(1), type: "string" });
    } else if (part === "*") {
      params.push({ name: "*", type: "string" });
    }
  }

  return params;
}

function formatRouteEntry(entry: RouteTypeEntry, indent: string): string {
  if (!entry.params.length) {
    return `${indent}${JSON.stringify(entry.path)}: {};`;
  }

  const paramLines = entry.params
    .map((param) => `${indent}  ${JSON.stringify(param.name)}: ${param.type};`)
    .join("\n");

  return `${indent}${JSON.stringify(entry.path)}: {\n${paramLines}\n${indent}};`;
}

function composeComponent(
  layouts: RouteComponent<LayoutComponentProps>[],
  component: RouteComponent<RouteComponentProps>
): RouteComponent<RouteComponentProps> {
  if (!layouts.length) {
    return component;
  }

  return (props: RouteComponentProps) => {
    let output = component(props);
    for (let i = layouts.length - 1; i >= 0; i--) {
      const layout = layouts[i];
      output = layout({ ...props, children: output });
    }
    return output;
  };
}

function resolvePath(base: string, segment: string): string {
  const normalizedBase = base === "/" ? "" : base;
  const normalizedSegment = segment === "/" ? "" : segment;
  const full = `${normalizedBase}/${normalizedSegment}`.replace(/\/+/g, "/");
  return full || "/";
}

function normalizeBase(base: string): string {
  if (!base) return "";
  if (base === "/") return "";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

async function renderCurrentRoute(
  routeMap: Map<string, InternalRouteEntry>,
  transitionManager: ViewTransitionManager | null,
  preloader: SmartPreloader | null,
  target: HTMLElement,
  url: URL,
  navigate: NavigateFunction,
  forceRevalidate: boolean = false
) {
  // Find all matching routes in the hierarchy
  const matchResult = matchNestedRoutes(routeMap, url.pathname);
  if (!matchResult) {
    routerStateSignal.set({ route: null, navigate, matches: [] });
    target.innerHTML = "";
    return;
  }

  const { leafMatch, matches } = matchResult;

  if (preloader) {
    preloader.recordNavigation?.(url.pathname);
  }

  const cacheKey = url.pathname;
  const ssrDataCache = typeof window !== "undefined" ? ((window as any).__PHILJS_ROUTE_DATA__ ||= {}) : undefined;
  const ssrErrorCache = typeof window !== "undefined" ? ((window as any).__PHILJS_ROUTE_ERROR__ ||= {}) : undefined;

  // Load all route data in parallel (no waterfall!)
  const loadedMatches = await loadAllRouteData(
    matches,
    url,
    ssrDataCache,
    ssrErrorCache,
    forceRevalidate
  );

  // Get leaf route data
  const leafData = loadedMatches[loadedMatches.length - 1];
  const data = leafData?.loaderData;
  const error = leafData?.error;

  const routeInfo: MatchedRoute = { ...leafMatch, data, error };

  // Create nested matched routes
  const nestedMatches: NestedMatchedRoute[] = loadedMatches.map((m, i) => ({
    ...m.match,
    id: m.entry.id,
    parentId: i > 0 ? loadedMatches[i - 1].entry.id : undefined,
    loaderData: m.loaderData,
    error: m.error,
    handle: m.entry.handle,
  }));

  routerStateSignal.set({ route: routeInfo, navigate, matches: nestedMatches });

  // Store data for useLoaderData hook
  for (const loaded of loadedMatches) {
    setCurrentRouteData(loaded.entry.id, loaded.loaderData, loaded.error);
  }

  if (typeof window !== "undefined") {
    const routeInfoStore = ((window as any).__PHILJS_ROUTE_INFO__ ||= {});
    routeInfoStore.current = {
      path: url.pathname,
      params: leafMatch.params,
      error,
    };
    const dataStore = ((window as any).__PHILJS_ROUTE_DATA__ ||= {});
    dataStore[cacheKey] = data;
    const errorStore = ((window as any).__PHILJS_ROUTE_ERROR__ ||= {});
    errorStore[cacheKey] = error;

    // Store matches for useMatches hook
    (window as any).__PHILJS_ROUTE_MATCHES__ = nestedMatches.map((m) => ({
      id: m.id,
      pathname: m.path,
      params: m.params,
      data: m.loaderData,
      handle: m.handle,
    }));
  }

  const renderFn = () => {
    const vnode = leafMatch.component({
      params: leafMatch.params,
      data,
      error,
      url,
      navigate,
      searchParams: url.searchParams,
    });

    render(vnode as VNode, target);
  };

  if (transitionManager) {
    await transitionManager.transition(renderFn);
  } else {
    renderFn();
  }
}

/**
 * Load data for all routes in parallel.
 * This is the key to avoiding waterfalls - all loaders run simultaneously.
 */
async function loadAllRouteData(
  matches: Array<{ match: MatchedRoute; entry: InternalRouteEntry }>,
  url: URL,
  ssrDataCache: Record<string, any> | undefined,
  ssrErrorCache: Record<string, any> | undefined,
  forceRevalidate: boolean
): Promise<Array<{
  match: MatchedRoute;
  entry: InternalRouteEntry;
  loaderData?: any;
  error?: any;
}>> {
  const cacheKey = url.pathname;

  // Check SSR cache first
  if (!forceRevalidate && ssrDataCache && cacheKey in ssrDataCache) {
    const ssrData = ssrDataCache[cacheKey];
    delete ssrDataCache[cacheKey];
    const ssrError = ssrErrorCache?.[cacheKey];
    if (ssrErrorCache) delete ssrErrorCache[cacheKey];

    // For SSR hydration, use cached data for all matches
    return matches.map((m, i) => ({
      match: m.match,
      entry: m.entry,
      loaderData: i === matches.length - 1 ? ssrData : undefined,
      error: i === matches.length - 1 ? ssrError : undefined,
    }));
  }

  // Execute all loaders in parallel
  const loaderPromises = matches.map(async (m) => {
    const { match, entry } = m;

    if (!entry.module.loader) {
      return { match, entry, loaderData: undefined, error: undefined };
    }

    try {
      const result = await entry.module.loader({
        params: match.params,
        request: new Request(url.toString()),
      });

      let loaderData: any;
      let error: any;

      if (isResult(result)) {
        if (isOk(result)) {
          loaderData = result.value;
        } else if (isErr(result)) {
          error = result.error;
        }
      } else {
        loaderData = result;
      }

      return { match, entry, loaderData, error };
    } catch (err) {
      // Handle error - check for error boundary
      if (entry.errorBoundary) {
        setRouteError(entry.id, err as Error);
      }
      return { match, entry, loaderData: undefined, error: err };
    }
  });

  return Promise.all(loaderPromises);
}

/**
 * Match nested routes and return the full hierarchy.
 */
function matchNestedRoutes(
  routeMap: Map<string, InternalRouteEntry>,
  pathname: string
): {
  leafMatch: MatchedRoute;
  matches: Array<{ match: MatchedRoute; entry: InternalRouteEntry }>;
} | null {
  // Find the leaf match
  let leafMatch: MatchedRoute | null = null;
  let leafEntry: InternalRouteEntry | null = null;

  for (const [path, entry] of routeMap.entries()) {
    const params = matchPath(path, pathname);
    if (params) {
      leafMatch = {
        path,
        params,
        component: entry.module.default,
        module: entry.module,
      };
      leafEntry = entry;
      break;
    }
  }

  if (!leafMatch || !leafEntry) {
    return null;
  }

  // Build the full match hierarchy (from root to leaf)
  const matches: Array<{ match: MatchedRoute; entry: InternalRouteEntry }> = [];

  // Walk up the tree to collect all parent routes
  const collectParents = (entry: InternalRouteEntry, match: MatchedRoute) => {
    if (entry.parent) {
      const parentEntry = routeMap.get(entry.parent);
      if (parentEntry) {
        const parentMatch: MatchedRoute = {
          path: entry.parent,
          params: match.params,
          component: parentEntry.module.default,
          module: parentEntry.module,
        };
        collectParents(parentEntry, parentMatch);
        matches.push({ match: parentMatch, entry: parentEntry });
      }
    }
  };

  collectParents(leafEntry, leafMatch);
  matches.push({ match: leafMatch, entry: leafEntry });

  return { leafMatch, matches };
}

function matchCurrentRoute(routeMap: Map<string, InternalRouteEntry>, pathname: string): MatchedRoute | null {
  for (const [path, entry] of routeMap.entries()) {
    const params = matchPath(path, pathname);
    if (params) {
      return {
        path,
        params,
        component: entry.module.default,
        module: entry.module,
      };
    }
  }
  return null;
}

function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const segment = patternParts[i];
    const value = pathParts[i];

    if (segment.startsWith(":")) {
      params[segment.slice(1)] = decodeURIComponent(value);
    } else if (segment === "*") {
      params["*"] = pathParts.slice(i).join("/");
      return params;
    } else if (segment !== value) {
      return null;
    }
  }

  return params;
}

function resolveTarget(target: RouterOptions["target"]): HTMLElement {
  if (typeof target === "string") {
    const el = document.querySelector<HTMLElement>(target);
    if (!el) {
      throw new Error(`[PhilJS Router] Could not find target element "${target}"`);
    }
    return el;
  }
  if (target && target instanceof HTMLElement) {
    return target;
  }
  const fallback = document.getElementById("app");
  if (!fallback) {
    throw new Error('[PhilJS Router] Could not find router target. Provide options.target or add an element with id="app".');
  }
  return fallback;
}
