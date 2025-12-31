/**
 * PhilJS Type-Safe Router
 *
 * A fully type-safe router for PhilJS inspired by TanStack Router.
 * Features:
 * - Fully typed route params extracted from path patterns
 * - Zod-validated search params with type inference
 * - Type-safe Link component
 * - Route-attached hooks for convenient data access
 * - SSR support
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { createRoute, Router, RouterOutlet, Link } from 'philjs-router-typesafe';
 *
 * // Define a route with typed params and search
 * const userRoute = createRoute({
 *   path: '/users/$userId',
 *   validateSearch: z.object({
 *     tab: z.enum(['posts', 'comments']).default('posts'),
 *   }),
 *   loader: async ({ params, search }) => {
 *     // params.userId is string, search.tab is 'posts' | 'comments'
 *     return fetchUser(params.userId);
 *   },
 *   component: ({ params, search, loaderData }) => (
 *     <div>
 *       <h1>User: {params.userId}</h1>
 *       <Tabs active={search.tab} />
 *       <UserProfile user={loaderData} />
 *     </div>
 *   ),
 * });
 *
 * // Use route-attached hooks in child components
 * function UserDetails() {
 *   const { userId } = userRoute.useParams();
 *   const { tab } = userRoute.useSearch();
 *   const user = userRoute.useLoaderData();
 *   return <div>{user.name}</div>;
 * }
 *
 * // Type-safe links
 * <Link to={userRoute} params={{ userId: '123' }} search={{ tab: 'posts' }}>
 *   View User
 * </Link>
 * ```
 *
 * @packageDocumentation
 */
export type { ExtractPathParams, PathParams, HasParams, InferSearchParams, SearchParamsOrEmpty, LoaderContext, LoaderFn, InferLoaderData, RouteOptions, RouteDefinition, BeforeLoadContext, RouteMeta, RouteComponentProps, RouteComponent, ErrorComponentProps, ErrorComponent, PendingComponent, NavigateOptions, NavigateFn, TypedNavigateOptions, LinkPropsWithRoute, LinkPropsWithPath, LinkProps, RouterOptions, NavigationEvent, MatchedRoute, RouterContextType, RouterLocation, RootRouteOptions, RouteTree, RequireKeys, DeepPartial, Prettify, UnionToIntersection, ExtractRoute, RegisteredRoutes, AllRoutePaths, } from "./types.js";
export { createRoute, createRootRoute, addChildren, createRouteWithChildren, flattenRouteTree, parsePathParams, buildPath, parseSearchParams, serializeSearchParams, matchRoutes, matchesRoute, getActiveRoute, } from "./route.js";
export { useRouter, useParams, useSearch, useLoaderData, useLocation, useNavigate, useNavigateTyped, useMatchRoute, useMatches, useBlocker, usePreloadRoute, useIsPending, useRouteError, } from "./hooks.js";
export { Link, ActiveLink, NavLink, Redirect, createNavigateLink, } from "./link.js";
export { Router, RouterOutlet, TypeSafeRouter, createRouter, NavigationRedirect, redirect, createSSRRouter, loadRouteData, } from "./router.js";
export { getRouterContext } from "./context.js";
//# sourceMappingURL=index.d.ts.map