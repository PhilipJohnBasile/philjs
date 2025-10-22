/**
 * High-level router helpers built atop the low-level manifest system.
 * Provides declarative routes, navigation, and view helpers similar to
 * frameworks like Next.js or Remix, but backed by PhilJS signals and resumability.
 */

import { render, signal } from "philjs-core";
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

export type RouteComponent<Props = any> = (props: Props) => VNode | JSXElement | string | null | undefined;

export type RouteDefinition = {
  path: string;
  component: RouteComponent<RouteComponentProps>;
  loader?: (context: LoaderContext) => Promise<any>;
  action?: (context: ActionContext) => Promise<Response | void>;
  children?: RouteDefinition[];
  layout?: RouteComponent<LayoutComponentProps>;
  transition?: RouteTransitionOptions;
  prefetch?: PrefetchOptions;
  config?: Record<string, unknown>;
};

export type RouteComponentProps = {
  params: Record<string, string>;
  data?: any;
  url: URL;
  navigate: NavigateFunction;
};

export type LayoutComponentProps = RouteComponentProps & {
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
  component: RouteComponent<RouteComponentProps>;
  module: RouteModule;
};

type InternalRouteEntry = {
  definition: RouteDefinition;
  module: RouteModule;
  parent?: string | null;
  layouts: RouteComponent<LayoutComponentProps>[];
};

type RouterState = {
  route: MatchedRoute | null;
  navigate: NavigateFunction;
};

const routerStateSignal = signal<RouterState>({
  route: null,
  navigate: async () => {},
});

let activeRouter: HighLevelRouter | null = null;

export type HighLevelRouter = {
  manifest: Record<string, RouteModule>;
  navigate: NavigateFunction;
  dispose: () => void;
  getCurrentRoute: () => MatchedRoute | null;
};

/**
 * Create a high-level router with declarative routes.
 */
export function createAppRouter(options: RouterOptions): HighLevelRouter {
  const targetElement = resolveTarget(options.target ?? "#app");
  const preloader = ensureSmartPreloader(options.prefetch);
  const transitionManager = ensureTransitionManager(options.transitions);

  const manifestEntries: Record<string, RouteModule> = Object.create(null);
  const routeMap = new Map<string, InternalRouteEntry>();

  buildManifest(options.routes, manifestEntries, routeMap, normalizeBase(options.base ?? ""), []);

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

  const router: HighLevelRouter = {
    manifest: manifestEntries,
    navigate,
    getCurrentRoute,
    dispose: () => {
      window.removeEventListener("popstate", handlePopState);
      historyListeners.clear();
      activeRouter = null;
      preloader?.clear();
    },
  };

  activeRouter = router;
  routerStateSignal.set({ route: null, navigate });
  routerStateSignal.set({ route: null, navigate });

  function handlePopState() {
    void renderCurrentRoute(routeMap, transitionManager, preloader, targetElement, new URL(window.location.href), navigate);
  }

  window.addEventListener("popstate", handlePopState);
  void renderCurrentRoute(routeMap, transitionManager, preloader, targetElement, new URL(window.location.href), navigate);

  return router;
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

function buildManifest(
  routes: RouteDefinition[],
  manifest: Record<string, RouteModule>,
  routeMap: Map<string, InternalRouteEntry>,
  base: string,
  parentLayouts: RouteComponent<LayoutComponentProps>[],
  parentPath: string | null = null
) {
  for (const route of routes) {
    const path = resolvePath(base, route.path);
    const layouts = [...parentLayouts];
    if (route.layout) {
      layouts.push(route.layout);
    }

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
    });

    if (route.children?.length) {
      buildManifest(
        route.children,
        manifest,
        routeMap,
        path,
        layouts,
        path
      );
    }
  }
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
  navigate: NavigateFunction
) {
  const match = matchCurrentRoute(routeMap, url.pathname);
  if (!match) {
    routerStateSignal.set({ route: null, navigate });
    target.innerHTML = "";
    return;
  }

  if (preloader) {
    preloader.recordNavigation?.(url.pathname);
  }

  const loader = match.module.loader;
  let data: any;
  if (loader) {
    data = await loader({
      params: match.params,
      request: new Request(url.toString()),
    });
  }

  const routeInfo: MatchedRoute = { ...match, data };
  routerStateSignal.set({ route: routeInfo, navigate });

  const renderFn = () => {
    const vnode = match.component({
      params: match.params,
      data,
      url,
      navigate,
    });

    render(vnode as VNode, target);
  };

  if (transitionManager) {
    await transitionManager.transition(renderFn);
  } else {
    renderFn();
  }
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
