/**
 * Route creation and management for type-safe router
 */
import type { z } from "zod";
import type { RouteOptions, RouteDefinition, PathParams, RootRouteOptions } from "./types.js";
/**
 * Create a type-safe route definition.
 *
 * @example
 * ```typescript
 * const userRoute = createRoute({
 *   path: '/users/$userId',
 *   validateSearch: z.object({ tab: z.enum(['posts', 'comments']) }),
 *   loader: async ({ params, search }) => {
 *     return fetchUser(params.userId);
 *   }
 * });
 * ```
 */
export declare function createRoute<TPath extends string, TSearchSchema extends z.ZodType | undefined = undefined, TLoaderData = unknown>(options: RouteOptions<TPath, TSearchSchema, TLoaderData>): RouteDefinition<TPath, TSearchSchema, TLoaderData>;
/**
 * Create a root route that wraps all other routes.
 *
 * @example
 * ```typescript
 * const rootRoute = createRootRoute({
 *   component: ({ children }) => (
 *     <div class="app-layout">
 *       <Header />
 *       {children}
 *       <Footer />
 *     </div>
 *   )
 * });
 * ```
 */
export declare function createRootRoute(options?: RootRouteOptions): RouteDefinition<"/", undefined, never>;
/**
 * Add child routes to a parent route.
 *
 * @example
 * ```typescript
 * const rootRoute = createRootRoute({ ... });
 * const indexRoute = createRoute({ path: '/', ... });
 * const aboutRoute = createRoute({ path: '/about', ... });
 *
 * const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);
 * ```
 */
export declare function addChildren<TParent extends RouteDefinition<string, z.ZodType | undefined, unknown>, TChildren extends RouteDefinition<string, z.ZodType | undefined, unknown>[]>(parent: TParent, children: TChildren): TParent & {
    children: TChildren;
};
/**
 * Create a route with children in one call.
 *
 * @example
 * ```typescript
 * const usersRoute = createRouteWithChildren({
 *   path: '/users',
 *   component: UsersLayout,
 * }, [
 *   createRoute({ path: '/', component: UsersList }),
 *   createRoute({ path: '/$userId', component: UserProfile }),
 * ]);
 * ```
 */
export declare function createRouteWithChildren<TPath extends string, TSearchSchema extends z.ZodType | undefined = undefined, TLoaderData = unknown, TChildren extends RouteDefinition<string, z.ZodType | undefined, unknown>[] = []>(options: RouteOptions<TPath, TSearchSchema, TLoaderData>, children: TChildren): RouteDefinition<TPath, TSearchSchema, TLoaderData> & {
    children: TChildren;
};
/**
 * Flatten a route tree into an array of routes for the router.
 */
export declare function flattenRouteTree(routes: RouteDefinition<string, z.ZodType | undefined, unknown>[], parentPath?: string): RouteDefinition<string, z.ZodType | undefined, unknown>[];
/**
 * Parse path parameters from a path pattern.
 *
 * @example
 * ```typescript
 * parsePathParams('/users/$userId/posts/$postId', '/users/123/posts/456')
 * // => { userId: '123', postId: '456' }
 * ```
 */
export declare function parsePathParams<TPath extends string>(pattern: TPath, pathname: string): PathParams<TPath> | null;
/**
 * Build a path from a pattern and params.
 *
 * @example
 * ```typescript
 * buildPath('/users/$userId/posts/$postId', { userId: '123', postId: '456' })
 * // => '/users/123/posts/456'
 * ```
 */
export declare function buildPath<TPath extends string>(pattern: TPath, params: PathParams<TPath>): string;
/**
 * Parse and validate search params using a Zod schema.
 */
export declare function parseSearchParams<TSchema extends z.ZodType>(searchString: string, schema: TSchema): z.infer<TSchema>;
/**
 * Serialize search params to a query string.
 */
export declare function serializeSearchParams<TSchema extends z.ZodType>(params: z.infer<TSchema>, _schema?: TSchema): string;
/**
 * Match a pathname against a list of routes.
 */
export declare function matchRoutes(routes: RouteDefinition<string, z.ZodType | undefined, unknown>[], pathname: string): {
    route: RouteDefinition<string, z.ZodType | undefined, unknown>;
    params: Record<string, string>;
} | null;
/**
 * Check if a pathname matches a route pattern.
 */
export declare function matchesRoute<TPath extends string>(route: RouteDefinition<TPath, z.ZodType | undefined, unknown>, pathname: string): boolean;
/**
 * Get the active route from a list of routes.
 */
export declare function getActiveRoute(routes: RouteDefinition<string, z.ZodType | undefined, unknown>[], pathname: string): RouteDefinition<string, z.ZodType | undefined, unknown> | null;
//# sourceMappingURL=route.d.ts.map