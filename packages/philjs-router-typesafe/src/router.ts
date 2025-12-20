/**
 * Router component and context for type-safe routing
 */

import type { z } from "zod";
import { signal, effect, render } from "philjs-core";
import type { VNode, JSXElement } from "philjs-core";
import type {
  RouterOptions,
  RouterContextType,
  RouterLocation,
  MatchedRoute,
  RouteDefinition,
  NavigateFn,
  NavigateOptions,
  NavigationEvent,
} from "./types.js";
import {
  matchRoutes,
  parseSearchParams,
  flattenRouteTree,
} from "./route.js";
import { getRouterContext, setRouterContext } from "./context.js";

// Re-export getRouterContext for public API
export { getRouterContext } from "./context.js";

// =============================================================================
// Router Signals
// =============================================================================

/**
 * Create reactive router state.
 */
function createRouterState() {
  const location = signal<RouterLocation>(getCurrentLocation());
  const matches = signal<MatchedRoute[]>([]);
  const currentMatch = signal<MatchedRoute | null>(null);
  const isNavigating = signal(false);
  const error = signal<Error | null>(null);

  return {
    location,
    matches,
    currentMatch,
    isNavigating,
    error,
  };
}

/**
 * Get the current browser location.
 */
function getCurrentLocation(): RouterLocation {
  if (typeof window === "undefined") {
    return {
      pathname: "/",
      search: "",
      hash: "",
      state: null,
      href: "/",
    };
  }

  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    state: window.history.state,
    href: window.location.href,
  };
}

// =============================================================================
// Router Class
// =============================================================================

/**
 * Type-safe router class that manages navigation and route matching.
 */
export class TypeSafeRouter {
  private routes: RouteDefinition<string, z.ZodType | undefined, unknown>[];
  private flatRoutes: RouteDefinition<string, z.ZodType | undefined, unknown>[];
  private basePath: string;
  private state: ReturnType<typeof createRouterState>;
  private options: RouterOptions;
  private disposePopstate: (() => void) | null = null;
  private isInitialized = false;

  constructor(options: RouterOptions) {
    this.options = options;
    this.routes = options.routes;
    this.flatRoutes = flattenRouteTree(options.routes);
    this.basePath = options.basePath ?? "";
    this.state = createRouterState();
  }

  /**
   * Initialize the router and start listening to navigation events.
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    // Set up context
    const context: RouterContextType = {
      currentMatch: this.state.currentMatch(),
      navigate: this.navigate.bind(this),
      matches: this.state.matches(),
      location: this.state.location(),
      isNavigating: this.state.isNavigating(),
    };

    setRouterContext(context);

    // Listen to popstate events
    if (typeof window !== "undefined") {
      const handlePopstate = () => {
        void this.handleLocationChange("pop");
      };

      window.addEventListener("popstate", handlePopstate);
      this.disposePopstate = () => {
        window.removeEventListener("popstate", handlePopstate);
      };
    }

    // Set up effect to keep context in sync
    effect(() => {
      const ctx = getRouterContext();
      if (ctx) {
        ctx.location = this.state.location();
        ctx.matches = this.state.matches();
        ctx.currentMatch = this.state.currentMatch();
        ctx.isNavigating = this.state.isNavigating();
      }
    });

    // Handle initial location
    void this.handleLocationChange("enter");
  }

  /**
   * Dispose the router and clean up listeners.
   */
  dispose(): void {
    if (this.disposePopstate) {
      this.disposePopstate();
      this.disposePopstate = null;
    }
    setRouterContext(null);
    this.isInitialized = false;
  }

  /**
   * Navigate to a new URL.
   */
  navigate: NavigateFn = async (to: string, options?: NavigateOptions) => {
    if (typeof window === "undefined") {
      return;
    }

    const { replace = false, state, resetScroll = true } = options ?? {};

    // Resolve the full URL
    const url = new URL(to, window.location.origin);
    const fullPath = url.pathname + url.search + url.hash;

    // Update browser history
    if (replace) {
      window.history.replaceState(state ?? null, "", fullPath);
    } else {
      window.history.pushState(state ?? null, "", fullPath);
    }

    // Handle the location change
    await this.handleLocationChange(replace ? "replace" : "push");

    // Reset scroll position if needed
    if (resetScroll && typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  };

  /**
   * Handle a location change (from navigation or popstate).
   */
  private async handleLocationChange(
    type: "push" | "replace" | "pop" | "enter"
  ): Promise<void> {
    const previousMatch = this.state.currentMatch();

    // Update location
    const newLocation = getCurrentLocation();
    this.state.location.set(newLocation);

    // Mark as navigating
    this.state.isNavigating.set(true);

    try {
      // Match the route
      const pathname = newLocation.pathname.replace(
        new RegExp(`^${this.basePath}`),
        ""
      ) || "/";

      const matchResult = matchRoutes(this.flatRoutes, pathname);

      if (!matchResult) {
        // No route matched - show 404
        const notFoundMatch: MatchedRoute = {
          route: this.createNotFoundRoute(),
          params: {},
          search: {},
          status: "success",
        };
        this.state.matches.set([notFoundMatch]);
        this.state.currentMatch.set(notFoundMatch);
        this.state.isNavigating.set(false);
        this.updateContext();
        return;
      }

      const { route, params } = matchResult;

      // Parse and validate search params
      let search: Record<string, unknown> = {};
      if (route.validateSearch) {
        try {
          search = parseSearchParams(newLocation.search, route.validateSearch);
        } catch (error) {
          console.error("[philjs-router-typesafe] Search validation error:", error);
          // Use empty search on validation error
          search = {};
        }
      }

      // Create pending match
      const pendingMatch: MatchedRoute = {
        route: route as any,
        params,
        search,
        status: "pending",
      };

      this.state.matches.set([pendingMatch]);
      this.state.currentMatch.set(pendingMatch);
      this.updateContext();

      // Run beforeLoad if present
      if (route.beforeLoad) {
        try {
          const cause = previousMatch?.route.id === route.id ? "stay" : "enter";
          await route.beforeLoad({
            params: params as never,
            search: search as never,
            location: newLocation as unknown as Location,
            cause,
            abortController: new AbortController(),
          });
        } catch (error) {
          // beforeLoad threw - could be a redirect or error
          if (error instanceof NavigationRedirect) {
            await this.navigate(error.to, { replace: error.replace });
            return;
          }
          throw error;
        }
      }

      // Run loader if present
      let loaderData: unknown;
      let loaderError: Error | undefined;

      if (route.loader) {
        try {
          loaderData = await route.loader({
            params: params as never,
            search: search as never,
            request: new Request(newLocation.href),
            abortController: new AbortController(),
          });
        } catch (error) {
          loaderError = error instanceof Error ? error : new Error(String(error));
        }
      }

      // Create final match
      const finalMatch: MatchedRoute = {
        route: route as any,
        params,
        search,
        loaderData,
        error: loaderError,
        status: loaderError ? "error" : "success",
      };

      this.state.matches.set([finalMatch]);
      this.state.currentMatch.set(finalMatch);

      // Emit navigation event
      if (this.options.onNavigate && type !== "enter") {
        const event: NavigationEvent = {
          from: previousMatch,
          to: finalMatch,
          type: type as "push" | "replace" | "pop",
        };
        this.options.onNavigate(event);
      }
    } catch (error) {
      console.error("[philjs-router-typesafe] Navigation error:", error);
      this.state.error.set(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.state.isNavigating.set(false);
      this.updateContext();
    }
  }

  /**
   * Update the router context with current state.
   */
  private updateContext(): void {
    const ctx = getRouterContext();
    if (ctx) {
      ctx.location = this.state.location();
      ctx.matches = this.state.matches();
      ctx.currentMatch = this.state.currentMatch();
      ctx.isNavigating = this.state.isNavigating();
    }
  }

  /**
   * Create a synthetic "not found" route.
   */
  private createNotFoundRoute(): RouteDefinition<string, undefined, never> {
    return {
      id: "__not_found__",
      path: "*",
      fullPath: "*",
      validateSearch: undefined,
      loader: undefined,
      component: this.options.notFoundComponent as never,
      errorComponent: undefined,
      pendingComponent: undefined,
      meta: { title: "Not Found" },
      parent: undefined,
      children: [],
      useParams: () => ({}) as never,
      useSearch: () => ({}) as never,
      useLoaderData: () => undefined as never,
    };
  }

  /**
   * Get the current match.
   */
  getCurrentMatch(): MatchedRoute | null {
    return this.state.currentMatch();
  }

  /**
   * Get all current matches.
   */
  getMatches(): MatchedRoute[] {
    return this.state.matches();
  }

  /**
   * Get the current location.
   */
  getLocation(): RouterLocation {
    return this.state.location();
  }

  /**
   * Check if the router is currently navigating.
   */
  getIsNavigating(): boolean {
    return this.state.isNavigating();
  }
}

// =============================================================================
// Navigation Redirect Error
// =============================================================================

/**
 * Error thrown to trigger a redirect during beforeLoad.
 */
export class NavigationRedirect extends Error {
  constructor(
    public readonly to: string,
    public readonly replace: boolean = false
  ) {
    super(`Redirect to ${to}`);
    this.name = "NavigationRedirect";
  }
}

/**
 * Throw a redirect from beforeLoad.
 *
 * @example
 * ```typescript
 * const protectedRoute = createRoute({
 *   path: '/dashboard',
 *   beforeLoad: ({ context }) => {
 *     if (!context.auth.isLoggedIn) {
 *       throw redirect('/login');
 *     }
 *   }
 * });
 * ```
 */
export function redirect(to: string, options?: { replace?: boolean }): never {
  throw new NavigationRedirect(to, options?.replace);
}

// =============================================================================
// Router Component
// =============================================================================

/**
 * Router component that provides routing context.
 *
 * @example
 * ```typescript
 * function App() {
 *   return (
 *     <Router routes={[homeRoute, aboutRoute, userRoute]}>
 *       <RouterOutlet />
 *     </Router>
 *   );
 * }
 * ```
 */
export function Router(props: {
  routes: RouteDefinition<string, z.ZodType | undefined, unknown>[];
  basePath?: string;
  defaultPendingComponent?: () => VNode | JSXElement | string | null;
  defaultErrorComponent?: (props: { error: Error; reset: () => void }) => VNode | JSXElement | string | null;
  notFoundComponent?: () => VNode | JSXElement | string | null;
  onNavigate?: (event: NavigationEvent) => void;
  scrollRestoration?: "auto" | "manual" | false;
  children?: VNode | JSXElement | string;
}): VNode {
  const {
    routes,
    basePath,
    defaultPendingComponent,
    defaultErrorComponent,
    notFoundComponent,
    onNavigate,
    scrollRestoration,
    children,
  } = props;

  // Create router instance
  const router = new TypeSafeRouter({
    routes,
    basePath,
    defaultPendingComponent,
    defaultErrorComponent,
    notFoundComponent,
    onNavigate,
    scrollRestoration,
  });

  // Initialize router
  router.initialize();

  // The Router component just provides context and renders children
  return {
    type: "div",
    props: {
      "data-router": "",
      children,
    },
  };
}

/**
 * RouterOutlet component that renders the matched route.
 *
 * @example
 * ```typescript
 * function App() {
 *   return (
 *     <Router routes={routes}>
 *       <Header />
 *       <RouterOutlet />
 *       <Footer />
 *     </Router>
 *   );
 * }
 * ```
 */
export function RouterOutlet(): VNode | JSXElement | string | null {
  const context = getRouterContext();

  if (!context) {
    console.error("[philjs-router-typesafe] RouterOutlet must be used within a Router");
    return null;
  }

  const { currentMatch, isNavigating } = context;

  // Show pending component while navigating
  if (isNavigating && currentMatch?.status === "pending") {
    const PendingComponent =
      currentMatch.route.pendingComponent ??
      (getRouterContext() as unknown as { defaultPendingComponent?: () => VNode })?.defaultPendingComponent;

    if (PendingComponent) {
      return PendingComponent();
    }
  }

  // No match - nothing to render
  if (!currentMatch) {
    return null;
  }

  // Show error component if there's an error
  if (currentMatch.status === "error" && currentMatch.error) {
    const ErrorComponent =
      currentMatch.route.errorComponent ??
      (getRouterContext() as unknown as { defaultErrorComponent?: (props: { error: Error; reset: () => void }) => VNode })?.defaultErrorComponent;

    if (ErrorComponent) {
      return ErrorComponent({
        error: currentMatch.error,
        reset: () => {
          // Re-navigate to the current URL to retry
          void context.navigate(context.location.href, { replace: true });
        },
      });
    }

    // Default error display
    return {
      type: "div",
      props: {
        className: "router-error",
        children: [
          { type: "h1", props: { children: "Error" } },
          { type: "p", props: { children: currentMatch.error.message } },
        ],
      },
    };
  }

  // Render the matched component
  const Component = currentMatch.route.component;
  if (!Component) {
    return null;
  }

  return Component({
    params: currentMatch.params as never,
    search: currentMatch.search as never,
    loaderData: currentMatch.loaderData as never,
    navigate: context.navigate,
  });
}

/**
 * Create a router instance without rendering.
 * Useful for testing or programmatic navigation.
 *
 * @example
 * ```typescript
 * const router = createRouter({
 *   routes: [homeRoute, aboutRoute],
 * });
 *
 * router.initialize();
 * await router.navigate('/about');
 * ```
 */
export function createRouter(options: RouterOptions): TypeSafeRouter {
  return new TypeSafeRouter(options);
}

// =============================================================================
// SSR Support
// =============================================================================

/**
 * Create a router context for server-side rendering.
 */
export function createSSRRouter(options: RouterOptions & { url: string }): {
  router: TypeSafeRouter;
  context: RouterContextType;
} {
  const router = new TypeSafeRouter(options);

  // Create a mock location from the URL
  const url = new URL(options.url, "http://localhost");
  const mockLocation: RouterLocation = {
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    state: null,
    href: url.href,
  };

  // Match the route
  const flatRoutes = flattenRouteTree(options.routes);
  const matchResult = matchRoutes(flatRoutes, url.pathname);

  let currentMatch: MatchedRoute | null = null;

  if (matchResult) {
    const { route, params } = matchResult;
    let search: Record<string, unknown> = {};

    if (route.validateSearch) {
      try {
        search = parseSearchParams(url.search, route.validateSearch);
      } catch {
        search = {};
      }
    }

    currentMatch = {
      route: route as any,
      params,
      search,
      status: "pending",
    };
  }

  const context: RouterContextType = {
    currentMatch,
    navigate: async () => {
      // SSR doesn't support navigation
      console.warn("[philjs-router-typesafe] Navigation not supported during SSR");
    },
    matches: currentMatch ? [currentMatch] : [],
    location: mockLocation,
    isNavigating: false,
  };

  setRouterContext(context);

  return { router, context };
}

/**
 * Load route data for SSR.
 */
export async function loadRouteData(
  routes: RouteDefinition<string, z.ZodType | undefined, unknown>[],
  url: string
): Promise<{
  match: MatchedRoute | null;
  data: unknown;
  error: Error | null;
}> {
  const parsedUrl = new URL(url, "http://localhost");
  const flatRoutes = flattenRouteTree(routes);
  const matchResult = matchRoutes(flatRoutes, parsedUrl.pathname);

  if (!matchResult) {
    return { match: null, data: null, error: null };
  }

  const { route, params } = matchResult;
  let search: Record<string, unknown> = {};

  if (route.validateSearch) {
    try {
      search = parseSearchParams(parsedUrl.search, route.validateSearch);
    } catch {
      search = {};
    }
  }

  let data: unknown = null;
  let error: Error | null = null;

  if (route.loader) {
    try {
      data = await route.loader({
        params: params as never,
        search: search as never,
        request: new Request(url),
        abortController: new AbortController(),
      });
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));
    }
  }

  const match: MatchedRoute = {
    route: route as any,
    params,
    search,
    loaderData: data,
    error: error ?? undefined,
    status: error ? "error" : "success",
  };

  return { match, data, error };
}
