/**
 * Hooks for type-safe router access
 */
import { getRouterContext } from "./context.js";
import { buildPath, serializeSearchParams, matchRoutes } from "./route.js";
/**
 * Hook to get the current router context.
 * Provides access to navigation, location, and matched routes.
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { navigate, location, isNavigating } = useRouter();
 *
 *   return (
 *     <div>
 *       <p>Current path: {location.pathname}</p>
 *       <button onClick={() => navigate('/about')}>Go to About</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRouter() {
    const context = getRouterContext();
    if (!context) {
        throw new Error("[philjs-router-typesafe] useRouter must be used within a Router");
    }
    return {
        navigate: context.navigate,
        location: context.location,
        matches: context.matches,
        currentMatch: context.currentMatch,
        isNavigating: context.isNavigating,
    };
}
/**
 * Hook to get typed route params.
 * When used without a route argument, returns params from the current matched route.
 *
 * @example
 * ```typescript
 * // Get params from current route (untyped)
 * const params = useParams();
 *
 * // Get typed params from a specific route
 * const { userId } = useParams(userRoute);
 * ```
 */
export function useParams(route) {
    const context = getRouterContext();
    if (!context) {
        throw new Error("[philjs-router-typesafe] useParams must be used within a Router");
    }
    if (!context.currentMatch) {
        throw new Error("[philjs-router-typesafe] No route matched");
    }
    // If a specific route is provided, verify it matches
    if (route && context.currentMatch.route.id !== route.id) {
        // Find the matching route in the matches chain
        const matchingRoute = context.matches.find((m) => m.route.id === route.id);
        if (!matchingRoute) {
            throw new Error(`[philjs-router-typesafe] Route "${route.path}" is not in the current matches`);
        }
        return matchingRoute.params;
    }
    return context.currentMatch.params;
}
/**
 * Hook to get typed search params.
 * When used with a route that has validateSearch, returns validated and typed params.
 *
 * @example
 * ```typescript
 * // Get search params from current route (untyped)
 * const search = useSearch();
 *
 * // Get typed and validated search params from a specific route
 * const { tab, page } = useSearch(userRoute);
 * ```
 */
export function useSearch(route) {
    const context = getRouterContext();
    if (!context) {
        throw new Error("[philjs-router-typesafe] useSearch must be used within a Router");
    }
    if (!context.currentMatch) {
        throw new Error("[philjs-router-typesafe] No route matched");
    }
    // If a specific route is provided, verify it matches
    if (route && context.currentMatch.route.id !== route.id) {
        const matchingRoute = context.matches.find((m) => m.route.id === route.id);
        if (!matchingRoute) {
            throw new Error(`[philjs-router-typesafe] Route "${route.path}" is not in the current matches`);
        }
        return matchingRoute.search;
    }
    return context.currentMatch.search;
}
/**
 * Hook to get loader data from a route.
 *
 * @example
 * ```typescript
 * // Get loader data from current route
 * const data = useLoaderData();
 *
 * // Get typed loader data from a specific route
 * const user = useLoaderData(userRoute);
 * ```
 */
export function useLoaderData(route) {
    const context = getRouterContext();
    if (!context) {
        throw new Error("[philjs-router-typesafe] useLoaderData must be used within a Router");
    }
    if (!context.currentMatch) {
        throw new Error("[philjs-router-typesafe] No route matched");
    }
    // If a specific route is provided, verify it matches
    if (route && context.currentMatch.route.id !== route.id) {
        const matchingRoute = context.matches.find((m) => m.route.id === route.id);
        if (!matchingRoute) {
            throw new Error(`[philjs-router-typesafe] Route "${route.path}" is not in the current matches`);
        }
        return matchingRoute.loaderData;
    }
    return context.currentMatch.loaderData;
}
/**
 * Hook to get the current location.
 *
 * @example
 * ```typescript
 * function BreadCrumb() {
 *   const location = useLocation();
 *   return <span>Current: {location.pathname}</span>;
 * }
 * ```
 */
export function useLocation() {
    const context = getRouterContext();
    if (!context) {
        throw new Error("[philjs-router-typesafe] useLocation must be used within a Router");
    }
    return context.location;
}
/**
 * Hook to get the navigate function.
 *
 * @example
 * ```typescript
 * function NavigateButton() {
 *   const navigate = useNavigate();
 *   return <button onClick={() => navigate('/about')}>About</button>;
 * }
 * ```
 */
export function useNavigate() {
    const context = getRouterContext();
    if (!context) {
        throw new Error("[philjs-router-typesafe] useNavigate must be used within a Router");
    }
    return context.navigate;
}
/**
 * Hook to create a type-safe navigate function for a specific route.
 *
 * @example
 * ```typescript
 * function UserButton({ userId }: { userId: string }) {
 *   const navigateToUser = useNavigateTyped(userRoute);
 *
 *   return (
 *     <button onClick={() => navigateToUser({ params: { userId }, search: { tab: 'posts' } })}>
 *       View User
 *     </button>
 *   );
 * }
 * ```
 */
export function useNavigateTyped(route) {
    const navigate = useNavigate();
    return async (options) => {
        const path = buildPath(route.fullPath, options.params);
        const search = options.search
            ? serializeSearchParams(options.search, route.validateSearch)
            : "";
        const hash = options.hash ? `#${options.hash}` : "";
        const fullPath = `${path}${search}${hash}`;
        await navigate(fullPath, {
            ...(options.replace !== undefined ? { replace: options.replace } : {}),
            state: options.state,
        });
    };
}
/**
 * Hook to check if a route matches the current location.
 *
 * @example
 * ```typescript
 * function NavLink({ route, children }) {
 *   const isActive = useMatchRoute(route);
 *   return <a class={isActive ? 'active' : ''}>{children}</a>;
 * }
 * ```
 */
export function useMatchRoute(route, options) {
    const context = getRouterContext();
    if (!context) {
        throw new Error("[philjs-router-typesafe] useMatchRoute must be used within a Router");
    }
    const { pathname } = context.location;
    const exact = options?.exact ?? true;
    if (exact) {
        return context.matches.some((m) => m.route.id === route.id);
    }
    // For non-exact matching, check if the current path starts with the route path
    const routePattern = route.fullPath.replace(/\$[^/]+/g, "[^/]+");
    const regex = new RegExp(`^${routePattern}`);
    return regex.test(pathname);
}
/**
 * Hook to get all matched routes in the current route hierarchy.
 *
 * @example
 * ```typescript
 * function Breadcrumbs() {
 *   const matches = useMatches();
 *   return (
 *     <nav>
 *       {matches.map((match) => (
 *         <span key={match.route.id}>{match.route.meta?.title}</span>
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 */
export function useMatches() {
    const context = getRouterContext();
    if (!context) {
        throw new Error("[philjs-router-typesafe] useMatches must be used within a Router");
    }
    return context.matches;
}
/**
 * Hook to block navigation (for unsaved changes warnings, etc.)
 *
 * @example
 * ```typescript
 * function FormWithUnsavedChanges() {
 *   const [isDirty, setIsDirty] = useState(false);
 *
 *   useBlocker(
 *     isDirty,
 *     'You have unsaved changes. Are you sure you want to leave?'
 *   );
 *
 *   return <form>...</form>;
 * }
 * ```
 */
export function useBlocker(shouldBlock, message) {
    const context = getRouterContext();
    if (!context) {
        throw new Error("[philjs-router-typesafe] useBlocker must be used within a Router");
    }
    // This is a simplified implementation
    // A full implementation would integrate with the router's navigation system
    let isBlocked = false;
    if (typeof window !== "undefined" && shouldBlock) {
        const handleBeforeUnload = (event) => {
            if (shouldBlock) {
                event.preventDefault();
                event.returnValue = message ?? "Are you sure you want to leave?";
                isBlocked = true;
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        // Cleanup would be handled by the component lifecycle
    }
    return {
        isBlocked,
        proceed: () => {
            isBlocked = false;
        },
        reset: () => {
            isBlocked = false;
        },
    };
}
/**
 * Hook to preload a route's data.
 *
 * @example
 * ```typescript
 * function UserCard({ userId }) {
 *   const preload = usePreloadRoute(userRoute);
 *
 *   return (
 *     <div
 *       onMouseEnter={() => preload({ params: { userId } })}
 *     >
 *       {userId}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePreloadRoute(route) {
    return async (options) => {
        if (!route.loader) {
            return undefined;
        }
        const abortController = new AbortController();
        const search = options.search ?? {};
        const path = buildPath(route.fullPath, options.params);
        try {
            const result = await route.loader({
                params: options.params,
                search: search,
                request: new Request(path),
                abortController,
            });
            return result;
        }
        catch (error) {
            console.error("[philjs-router-typesafe] Preload failed:", error);
            return undefined;
        }
    };
}
/**
 * Hook to get loading/pending state of the router.
 *
 * @example
 * ```typescript
 * function LoadingIndicator() {
 *   const isPending = useIsPending();
 *   return isPending ? <Spinner /> : null;
 * }
 * ```
 */
export function useIsPending() {
    const context = getRouterContext();
    if (!context) {
        throw new Error("[philjs-router-typesafe] useIsPending must be used within a Router");
    }
    return context.isNavigating;
}
/**
 * Hook to get the route error if one occurred.
 *
 * @example
 * ```typescript
 * function RouteError() {
 *   const error = useRouteError();
 *   if (!error) return null;
 *   return <div>Error: {error.message}</div>;
 * }
 * ```
 */
export function useRouteError() {
    const context = getRouterContext();
    if (!context) {
        throw new Error("[philjs-router-typesafe] useRouteError must be used within a Router");
    }
    return context.currentMatch?.error;
}
//# sourceMappingURL=hooks.js.map