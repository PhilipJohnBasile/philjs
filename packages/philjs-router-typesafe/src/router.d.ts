/**
 * Router component and context for type-safe routing
 */
import type { z } from "zod";
import type { VNode, JSXElement } from "@philjs/core";
import type { RouterOptions, RouterContextType, RouterLocation, MatchedRoute, RouteDefinition, NavigateFn, NavigationEvent } from "./types.js";
export { getRouterContext } from "./context.js";
/**
 * Type-safe router class that manages navigation and route matching.
 */
export declare class TypeSafeRouter {
    private routes;
    private flatRoutes;
    private basePath;
    private state;
    private options;
    private disposePopstate;
    private isInitialized;
    constructor(options: RouterOptions);
    /**
     * Initialize the router and start listening to navigation events.
     */
    initialize(): void;
    /**
     * Dispose the router and clean up listeners.
     */
    dispose(): void;
    /**
     * Navigate to a new URL.
     */
    navigate: NavigateFn;
    /**
     * Handle a location change (from navigation or popstate).
     */
    private handleLocationChange;
    /**
     * Update the router context with current state.
     */
    private updateContext;
    /**
     * Create a synthetic "not found" route.
     */
    private createNotFoundRoute;
    /**
     * Get the current match.
     */
    getCurrentMatch(): MatchedRoute | null;
    /**
     * Get all current matches.
     */
    getMatches(): MatchedRoute[];
    /**
     * Get the current location.
     */
    getLocation(): RouterLocation;
    /**
     * Check if the router is currently navigating.
     */
    getIsNavigating(): boolean;
}
/**
 * Error thrown to trigger a redirect during beforeLoad.
 */
export declare class NavigationRedirect extends Error {
    readonly to: string;
    readonly replace: boolean;
    constructor(to: string, replace?: boolean);
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
export declare function redirect(to: string, options?: {
    replace?: boolean;
}): never;
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
export declare function Router(props: {
    routes: RouteDefinition<string, z.ZodType | undefined, unknown>[];
    basePath?: string;
    defaultPendingComponent?: () => VNode | JSXElement | string | null;
    defaultErrorComponent?: (props: {
        error: Error;
        reset: () => void;
    }) => VNode | JSXElement | string | null;
    notFoundComponent?: () => VNode | JSXElement | string | null;
    onNavigate?: (event: NavigationEvent) => void;
    scrollRestoration?: "auto" | "manual" | false;
    children?: VNode | JSXElement | string;
}): VNode;
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
export declare function RouterOutlet(): VNode | JSXElement | string | null;
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
export declare function createRouter(options: RouterOptions): TypeSafeRouter;
/**
 * Create a router context for server-side rendering.
 */
export declare function createSSRRouter(options: RouterOptions & {
    url: string;
}): {
    router: TypeSafeRouter;
    context: RouterContextType;
};
/**
 * Load route data for SSR.
 */
export declare function loadRouteData(routes: RouteDefinition<string, z.ZodType | undefined, unknown>[], url: string): Promise<{
    match: MatchedRoute | null;
    data: unknown;
    error: Error | null;
}>;
//# sourceMappingURL=router.d.ts.map