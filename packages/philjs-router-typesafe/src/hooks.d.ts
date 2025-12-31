/**
 * Hooks for type-safe router access
 */
import type { z } from "zod";
import type { RouteDefinition, PathParams, NavigateFn, RouterLocation, MatchedRoute } from "./types.js";
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
export declare function useRouter(): {
    navigate: NavigateFn;
    location: RouterLocation;
    matches: MatchedRoute<string, undefined, unknown>[];
    currentMatch: MatchedRoute<string, undefined, unknown> | null;
    isNavigating: boolean;
};
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
export declare function useParams<TPath extends string>(route?: RouteDefinition<TPath, z.ZodType | undefined, unknown>): PathParams<TPath>;
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
export declare function useSearch<TPath extends string, TSearchSchema extends z.ZodType | undefined = undefined>(route?: RouteDefinition<TPath, TSearchSchema, unknown>): TSearchSchema extends z.ZodType ? z.infer<TSearchSchema> : Record<string, string>;
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
export declare function useLoaderData<TPath extends string, TSearchSchema extends z.ZodType | undefined, TLoaderData>(route?: RouteDefinition<TPath, TSearchSchema, TLoaderData>): TLoaderData;
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
export declare function useLocation(): RouterLocation;
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
export declare function useNavigate(): NavigateFn;
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
export declare function useNavigateTyped<TPath extends string, TSearchSchema extends z.ZodType | undefined>(route: RouteDefinition<TPath, TSearchSchema, unknown>): (options: {
    params: PathParams<TPath>;
    search?: TSearchSchema extends z.ZodType ? Partial<z.infer<TSearchSchema>> : never;
    hash?: string;
    replace?: boolean;
    state?: unknown;
}) => Promise<void>;
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
export declare function useMatchRoute<TPath extends string>(route: RouteDefinition<TPath, z.ZodType | undefined, unknown>, options?: {
    exact?: boolean;
}): boolean;
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
export declare function useMatches(): MatchedRoute[];
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
export declare function useBlocker(shouldBlock: boolean, message?: string): {
    isBlocked: boolean;
    proceed: () => void;
    reset: () => void;
};
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
export declare function usePreloadRoute<TPath extends string, TSearchSchema extends z.ZodType | undefined, TLoaderData>(route: RouteDefinition<TPath, TSearchSchema, TLoaderData>): (options: {
    params: PathParams<TPath>;
    search?: TSearchSchema extends z.ZodType ? Partial<z.infer<TSearchSchema>> : never;
}) => Promise<TLoaderData | undefined>;
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
export declare function useIsPending(): boolean;
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
export declare function useRouteError(): Error | undefined;
//# sourceMappingURL=hooks.d.ts.map