/**
 * Route creation and management for type-safe router
 */

import type { z } from "zod";
import type {
  RouteOptions,
  RouteDefinition,
  PathParams,
  LoaderFn,
  BeforeLoadContext,
  RouteComponent,
  ErrorComponent,
  PendingComponent,
  RouteMeta,
  RootRouteOptions,
} from "./types.js";
import { getRouterContext } from "./context.js";

// Counter for generating unique route IDs
let routeIdCounter = 0;

/**
 * Generate a unique route ID
 */
function generateRouteId(path: string): string {
  return `route_${path.replace(/[^a-zA-Z0-9]/g, "_")}_${routeIdCounter++}`;
}

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
export function createRoute<
  TPath extends string,
  TSearchSchema extends z.ZodType | undefined = undefined,
  TLoaderData = unknown
>(
  options: RouteOptions<TPath, TSearchSchema, TLoaderData>
): RouteDefinition<TPath, TSearchSchema, TLoaderData> {
  const routeId = generateRouteId(options.path);

  const route: RouteDefinition<TPath, TSearchSchema, TLoaderData> = {
    id: routeId,
    path: options.path,
    fullPath: options.path,
    validateSearch: options.validateSearch as TSearchSchema,
    loader: options.loader,
    component: options.component,
    errorComponent: options.errorComponent,
    pendingComponent: options.pendingComponent,
    beforeLoad: options.beforeLoad,
    meta: options.meta,
    parent: undefined,
    children: [],

    // Attached hooks for convenient usage in components
    useParams: () => useRouteParams<TPath>(route),
    useSearch: () => useRouteSearch<TPath, TSearchSchema>(route),
    useLoaderData: () => useRouteLoaderData<TPath, TSearchSchema, TLoaderData>(route),
  };

  return route;
}

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
export function createRootRoute(options: RootRouteOptions = {}): RouteDefinition<"/", undefined, never> {
  const routeId = generateRouteId("root");

  const route: RouteDefinition<"/", undefined, never> = {
    id: routeId,
    path: "/" as const,
    fullPath: "/",
    validateSearch: undefined,
    loader: undefined,
    component: options.component as RouteComponent<"/", undefined, never> | undefined,
    errorComponent: options.errorComponent,
    pendingComponent: options.pendingComponent,
    meta: undefined,
    parent: undefined,
    children: [],

    useParams: () => ({}) as PathParams<"/">,
    useSearch: () => ({}) as Record<string, never>,
    useLoaderData: () => undefined as never,
  };

  return route;
}

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
export function addChildren<
  TParent extends RouteDefinition<string, z.ZodType | undefined, unknown>,
  TChildren extends RouteDefinition<string, z.ZodType | undefined, unknown>[]
>(
  parent: TParent,
  children: TChildren
): TParent & { children: TChildren } {
  // Update children with parent reference and full paths
  const updatedChildren = children.map((child) => {
    const fullPath = joinPaths(parent.fullPath, child.path);
    return {
      ...child,
      fullPath,
      parent: parent as RouteDefinition<string, z.ZodType | undefined, unknown>,
    };
  });

  return {
    ...parent,
    children: updatedChildren as unknown as TChildren,
  };
}

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
export function createRouteWithChildren<
  TPath extends string,
  TSearchSchema extends z.ZodType | undefined = undefined,
  TLoaderData = unknown,
  TChildren extends RouteDefinition<string, z.ZodType | undefined, unknown>[] = []
>(
  options: RouteOptions<TPath, TSearchSchema, TLoaderData>,
  children: TChildren
): RouteDefinition<TPath, TSearchSchema, TLoaderData> & { children: TChildren } {
  const route = createRoute(options);
  return addChildren(route, children) as RouteDefinition<TPath, TSearchSchema, TLoaderData> & { children: TChildren };
}

/**
 * Flatten a route tree into an array of routes for the router.
 */
export function flattenRouteTree(
  routes: RouteDefinition<string, z.ZodType | undefined, unknown>[],
  parentPath = ""
): RouteDefinition<string, z.ZodType | undefined, unknown>[] {
  const result: RouteDefinition<string, z.ZodType | undefined, unknown>[] = [];

  for (const route of routes) {
    const fullPath = joinPaths(parentPath, route.path);
    const updatedRoute = { ...route, fullPath };
    result.push(updatedRoute);

    if (route.children.length > 0) {
      result.push(...flattenRouteTree(route.children, fullPath));
    }
  }

  return result;
}

/**
 * Join path segments, handling leading/trailing slashes.
 */
function joinPaths(base: string, segment: string): string {
  // Handle root path
  if (segment === "/" || segment === "") {
    return base || "/";
  }

  // Normalize base
  const normalizedBase = base === "/" ? "" : base.replace(/\/$/, "");

  // Normalize segment
  const normalizedSegment = segment.startsWith("/") ? segment : `/${segment}`;

  return normalizedBase + normalizedSegment || "/";
}

/**
 * Parse path parameters from a path pattern.
 *
 * @example
 * ```typescript
 * parsePathParams('/users/$userId/posts/$postId', '/users/123/posts/456')
 * // => { userId: '123', postId: '456' }
 * ```
 */
export function parsePathParams<TPath extends string>(
  pattern: TPath,
  pathname: string
): PathParams<TPath> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  // Check for wildcard at the end
  const hasWildcard = patternParts[patternParts.length - 1] === "*";

  if (!hasWildcard && patternParts.length !== pathParts.length) {
    return null;
  }

  if (hasWildcard && pathParts.length < patternParts.length - 1) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart === undefined) {
      break;
    }

    if (patternPart === "*") {
      // Capture rest of path
      params["*"] = pathParts.slice(i).join("/");
      break;
    }

    if (patternPart.startsWith("$")) {
      // This is a parameter
      const paramName = patternPart.slice(1);
      if (pathPart === undefined) {
        return null;
      }
      params[paramName] = decodeURIComponent(pathPart);
    } else {
      // Static segment - must match exactly
      if (patternPart !== pathPart) {
        return null;
      }
    }
  }

  return params as PathParams<TPath>;
}

/**
 * Build a path from a pattern and params.
 *
 * @example
 * ```typescript
 * buildPath('/users/$userId/posts/$postId', { userId: '123', postId: '456' })
 * // => '/users/123/posts/456'
 * ```
 */
export function buildPath<TPath extends string>(
  pattern: TPath,
  params: PathParams<TPath>
): string {
  let result = pattern;

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      result = result.replace(`$${key}`, encodeURIComponent(String(value))) as typeof result;
    }
  }

  return result;
}

/**
 * Parse and validate search params using a Zod schema.
 */
export function parseSearchParams<TSchema extends z.ZodType>(
  searchString: string,
  schema: TSchema
): z.infer<TSchema> {
  const urlSearchParams = new URLSearchParams(searchString);
  const rawParams: Record<string, unknown> = {};

  for (const [key, value] of urlSearchParams.entries()) {
    // Try to parse as JSON for complex values
    try {
      rawParams[key] = JSON.parse(value);
    } catch {
      rawParams[key] = value;
    }
  }

  return schema.parse(rawParams);
}

/**
 * Serialize search params to a query string.
 */
export function serializeSearchParams<TSchema extends z.ZodType>(
  params: z.infer<TSchema>,
  _schema?: TSchema
): string {
  const urlSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === "object") {
      urlSearchParams.set(key, JSON.stringify(value));
    } else {
      urlSearchParams.set(key, String(value));
    }
  }

  const result = urlSearchParams.toString();
  return result ? `?${result}` : "";
}

// =============================================================================
// Internal hooks used by route instances
// =============================================================================

/**
 * Get params for a specific route from the current router context.
 */
function useRouteParams<TPath extends string>(
  _route: RouteDefinition<TPath, z.ZodType | undefined, unknown>
): PathParams<TPath> {
  const context = getRouterContext();
  if (!context) {
    throw new Error("[philjs-router-typesafe] useParams must be used within a Router");
  }

  if (!context.currentMatch) {
    throw new Error("[philjs-router-typesafe] No route matched");
  }

  return context.currentMatch.params as PathParams<TPath>;
}

/**
 * Get search params for a specific route from the current router context.
 */
function useRouteSearch<
  TPath extends string,
  TSearchSchema extends z.ZodType | undefined
>(
  _route: RouteDefinition<TPath, TSearchSchema, unknown>
): TSearchSchema extends z.ZodType ? z.infer<TSearchSchema> : Record<string, never> {
  const context = getRouterContext();
  if (!context) {
    throw new Error("[philjs-router-typesafe] useSearch must be used within a Router");
  }

  if (!context.currentMatch) {
    throw new Error("[philjs-router-typesafe] No route matched");
  }

  return context.currentMatch.search as TSearchSchema extends z.ZodType
    ? z.infer<TSearchSchema>
    : Record<string, never>;
}

/**
 * Get loader data for a specific route from the current router context.
 */
function useRouteLoaderData<
  TPath extends string,
  TSearchSchema extends z.ZodType | undefined,
  TLoaderData
>(
  _route: RouteDefinition<TPath, TSearchSchema, TLoaderData>
): TLoaderData {
  const context = getRouterContext();
  if (!context) {
    throw new Error("[philjs-router-typesafe] useLoaderData must be used within a Router");
  }

  if (!context.currentMatch) {
    throw new Error("[philjs-router-typesafe] No route matched");
  }

  return context.currentMatch.loaderData as TLoaderData;
}

// =============================================================================
// Route Matching Utilities
// =============================================================================

/**
 * Match a pathname against a list of routes.
 */
export function matchRoutes(
  routes: RouteDefinition<string, z.ZodType | undefined, unknown>[],
  pathname: string
): { route: RouteDefinition<string, z.ZodType | undefined, unknown>; params: Record<string, string> } | null {
  // Flatten routes for matching
  const flatRoutes = flattenRouteTree(routes);

  // Sort routes by specificity (more specific routes first)
  const sortedRoutes = [...flatRoutes].sort((a, b) => {
    // Count static segments (more static = more specific)
    const aStatic = a.fullPath.split("/").filter((s) => s && !s.startsWith("$")).length;
    const bStatic = b.fullPath.split("/").filter((s) => s && !s.startsWith("$")).length;

    if (aStatic !== bStatic) {
      return bStatic - aStatic;
    }

    // Prefer longer paths
    return b.fullPath.length - a.fullPath.length;
  });

  for (const route of sortedRoutes) {
    const params = parsePathParams(route.fullPath, pathname);
    if (params !== null) {
      return { route, params };
    }
  }

  return null;
}

/**
 * Check if a pathname matches a route pattern.
 */
export function matchesRoute<TPath extends string>(
  route: RouteDefinition<TPath, z.ZodType | undefined, unknown>,
  pathname: string
): boolean {
  return parsePathParams(route.fullPath as TPath, pathname) !== null;
}

/**
 * Get the active route from a list of routes.
 */
export function getActiveRoute(
  routes: RouteDefinition<string, z.ZodType | undefined, unknown>[],
  pathname: string
): RouteDefinition<string, z.ZodType | undefined, unknown> | null {
  const match = matchRoutes(routes, pathname);
  return match?.route ?? null;
}
