/**
 * Nested route resolution and parallel data loading for PhilJS Router.
 * Enables Remix-style nested routes with layout components.
 *
 * @example
 * ```tsx
 * // routes/users.tsx - parent layout
 * export async function loader() {
 *   return { users: await fetchUsers() };
 * }
 *
 * export default function UsersLayout({ children }) {
 *   const { users } = useLoaderData();
 *   return (
 *     <div>
 *       <Sidebar users={users} />
 *       <main>{children}</main>
 *     </div>
 *   );
 * }
 *
 * // routes/users/[id].tsx - child route
 * export async function loader({ params }) {
 *   return { user: await fetchUser(params.id) };
 * }
 *
 * export default function UserDetail() {
 *   const { user } = useLoaderData();
 *   return <UserProfile user={user} />;
 * }
 * ```
 */

import { signal } from "@philjs/core";
import type { JSXElement, VNode } from "@philjs/core";
import {
  executeNestedLoaders,
  setCurrentRouteData,
  type LoaderFunction,
  type LoaderFunctionContext,
  type RouteLoaderData,
} from "./loader.js";
import { executeAction, type ActionFunction, type ActionFunctionContext } from "./action.js";

// ============================================================================
// Types
// ============================================================================

/**
 * A nested route definition.
 */
export type NestedRouteDefinition = {
  /** Route path pattern (e.g., "/users/:id") */
  path: string;
  /** Route ID for loader data access */
  id?: string;
  /** Route component */
  component?: RouteComponent;
  /** Data loader function */
  loader?: LoaderFunction;
  /** Action function for mutations */
  action?: ActionFunction;
  /** Error boundary component */
  errorElement?: RouteComponent;
  /** Loading element while data loads */
  loadingElement?: RouteComponent;
  /** Child routes */
  children?: NestedRouteDefinition[];
  /** Route handle for useMatches */
  handle?: unknown;
  /** Index route flag */
  index?: boolean;
  /** Whether this route should catch-all */
  catchAll?: boolean;
};

/**
 * Component type for routes.
 */
export type RouteComponent<Props = RouteComponentProps> = (
  props: Props
) => VNode | JSXElement | string | null | undefined;

/**
 * Props passed to route components.
 */
export type RouteComponentProps = {
  /** Route parameters */
  params: Record<string, string>;
  /** URL search params */
  searchParams: URLSearchParams;
  /** Loader data */
  data?: unknown;
  /** Loader error */
  error?: Error;
  /** Child route element */
  children?: VNode | JSXElement | string | null;
  /** Outlet component for nested routes */
  outlet?: VNode | JSXElement | string | null;
};

/**
 * A matched route in the hierarchy.
 */
export type MatchedNestedRoute = {
  /** Route definition */
  route: NestedRouteDefinition;
  /** Extracted parameters */
  params: Record<string, string>;
  /** Full pathname matched */
  pathname: string;
  /** Route ID */
  id: string;
  /** Loader data */
  data?: unknown;
  /** Loader error */
  error?: Error;
};

/**
 * Result of matching nested routes.
 */
export type NestedRouteMatch = {
  /** All matched routes from root to leaf */
  matches: MatchedNestedRoute[];
  /** Combined params from all routes */
  params: Record<string, string>;
  /** The leaf (most specific) match */
  leaf: MatchedNestedRoute;
};

/**
 * Options for nested route resolution.
 */
export type NestedRouteOptions = {
  /** Base path for all routes */
  basePath?: string;
  /** Default error boundary */
  defaultErrorElement?: RouteComponent;
  /** Default loading element */
  defaultLoadingElement?: RouteComponent;
  /** Case sensitive matching */
  caseSensitive?: boolean;
};

// ============================================================================
// Route Matching
// ============================================================================

/**
 * Match a pathname against nested route definitions.
 * Returns all matching routes from root to leaf.
 */
export function matchNestedRoutes(
  pathname: string,
  routes: NestedRouteDefinition[],
  options: NestedRouteOptions = {}
): NestedRouteMatch | null {
  const basePath = options.basePath || "";
  const normalizedPath = normalizePath(pathname);

  const matches = matchRoutesRecursive(
    normalizedPath,
    routes,
    basePath,
    {},
    options.caseSensitive
  );

  if (matches.length === 0) {
    return null;
  }

  // Combine params from all matches
  const params: Record<string, string> = {};
  for (const match of matches) {
    Object.assign(params, match.params);
  }

  return {
    matches,
    params,
    leaf: matches[matches.length - 1]!,
  };
}

/**
 * Recursively match routes.
 */
function matchRoutesRecursive(
  pathname: string,
  routes: NestedRouteDefinition[],
  parentPath: string,
  parentParams: Record<string, string>,
  caseSensitive?: boolean,
  matchedPrefix: string = ""
): MatchedNestedRoute[] {
  for (const route of routes) {
    const fullPath = joinPaths(parentPath, route.path);
    const matchPattern = getMatchPattern(parentPath, route.path, fullPath);
    const result = matchPathSegment(
      pathname,
      matchPattern,
      caseSensitive,
      route.catchAll
    );

    if (result) {
      const params = { ...parentParams, ...result.params };
      const id = route.id || fullPath;
      const fullMatchedPath = joinMatchedPaths(matchedPrefix, result.matchedPath);

      const match: MatchedNestedRoute = {
        route,
        params,
        pathname: fullMatchedPath,
        id,
      };

      // Check for index route
      if (route.index && result.remaining === "") {
        return [match];
      }

      // Check for child routes
      if (route.children && route.children.length > 0 && result.remaining) {
        const childMatches = matchRoutesRecursive(
          result.remaining,
          route.children,
          fullPath,
          params,
          caseSensitive,
          fullMatchedPath
        );

        if (childMatches.length > 0) {
          return [match, ...childMatches];
        }
      }

      // Exact match or catch-all
      if (result.remaining === "" || route.catchAll) {
        return [match];
      }
    }
  }

  return [];
}

/**
 * Match a single path segment.
 */
function matchPathSegment(
  pathname: string,
  pattern: string,
  caseSensitive?: boolean,
  catchAll?: boolean
): { params: Record<string, string>; matchedPath: string; remaining: string } | null {
  const patternSegments = pattern.split("/").filter(Boolean);
  const pathSegments = pathname.split("/").filter(Boolean);

  if (!catchAll && patternSegments.length > pathSegments.length) {
    return null;
  }

  const params: Record<string, string> = {};
  let matchedSegments = 0;

  for (let i = 0; i < patternSegments.length; i++) {
    const patternSeg = patternSegments[i]!;
    const pathSeg = pathSegments[i];

    if (pathSeg === undefined) {
      return null;
    }

    // Dynamic segment
    if (patternSeg.startsWith(":")) {
      const paramName = patternSeg.slice(1);
      params[paramName] = decodeURIComponent(pathSeg);
      matchedSegments++;
      continue;
    }

    // Catch-all segment
    if (patternSeg === "*" || patternSeg.startsWith("*")) {
      const paramName = patternSeg === "*" ? "*" : patternSeg.slice(1);
      params[paramName] = pathSegments.slice(i).map(decodeURIComponent).join("/");
      matchedSegments = pathSegments.length;
      break;
    }

    // Static segment
    const match = caseSensitive
      ? patternSeg === pathSeg
      : patternSeg.toLowerCase() === pathSeg.toLowerCase();

    if (!match) {
      return null;
    }

    matchedSegments++;
  }

  const matchedPath = "/" + pathSegments.slice(0, matchedSegments).join("/");
  const remaining = "/" + pathSegments.slice(matchedSegments).join("/");

  return {
    params,
    matchedPath: matchedPath === "/" ? "/" : matchedPath,
    remaining: remaining === "/" ? "" : remaining,
  };
}

// ============================================================================
// Parallel Data Loading
// ============================================================================

/**
 * Load data for all matched routes in parallel.
 * No waterfall - all loaders run simultaneously.
 */
export async function loadNestedRouteData(
  matches: MatchedNestedRoute[],
  request: Request,
  options: {
    signal?: AbortSignal;
    revalidate?: boolean;
  } = {}
): Promise<MatchedNestedRoute[]> {
  const routes = matches.map((match) => {
    const route: { routeId: string; loader?: LoaderFunction; params: Record<string, string> } = {
      routeId: match.id,
      params: match.params,
    };
    if (match.route.loader) {
      route.loader = match.route.loader;
    }
    return route;
  });

  const loaderOptions: { signal?: AbortSignal; revalidate?: boolean } = {};
  if (options.signal) {
    loaderOptions.signal = options.signal;
  }
  if (options.revalidate !== undefined) {
    loaderOptions.revalidate = options.revalidate;
  }
  const results = await executeNestedLoaders(routes, request, loaderOptions);

  // Merge results back into matches
  return matches.map((match, index) => {
    const result = results[index];
    const merged: MatchedNestedRoute = {
      ...match,
      data: result?.data,
    };
    if (result?.error) {
      merged.error = result.error;
    }
    return merged;
  });
}

/**
 * Execute actions for matched routes.
 */
export async function executeNestedAction(
  matches: MatchedNestedRoute[],
  request: Request
): Promise<{
  routeId: string;
  result: unknown;
  error?: Error;
} | null> {
  const url = new URL(request.url);

  // Find the leaf route with an action
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i]!;
    if (match.route.action) {
      const context: ActionFunctionContext = {
        params: match.params,
        request,
        url,
      };

      const result = await executeAction(match.route.action, context);

      const actionResult: { routeId: string; result: unknown; error?: Error } = {
        routeId: match.id,
        result: result.data,
      };
      if (result.error) {
        actionResult.error = result.error;
      }
      return actionResult;
    }
  }

  return null;
}

// ============================================================================
// Route Rendering
// ============================================================================

/**
 * Render matched routes with proper nesting.
 * Parent components receive children/outlet props.
 */
export function renderNestedRoutes(
  matches: MatchedNestedRoute[],
  searchParams: URLSearchParams
): VNode | JSXElement | string | null {
  if (matches.length === 0) {
    return null;
  }

  // Render from leaf to root
  let outlet: VNode | JSXElement | string | null = null;

  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i]!;
    const Component = match.route.component;

    if (!Component) {
      continue;
    }

    // Set current route data for useLoaderData
    setCurrentRouteData(match.id, match.data, match.error);

    const props: RouteComponentProps = {
      params: match.params,
      searchParams,
      data: match.data,
      children: outlet,
      outlet,
    };
    if (match.error) {
      props.error = match.error;
    }

    outlet = Component(props);
  }

  return outlet;
}

/**
 * Create an Outlet component for rendering child routes.
 */
export function createOutlet(
  matches: MatchedNestedRoute[],
  currentIndex: number,
  searchParams: URLSearchParams
): VNode | JSXElement | string | null {
  const remainingMatches = matches.slice(currentIndex + 1);

  if (remainingMatches.length === 0) {
    return null;
  }

  return renderNestedRoutes(remainingMatches, searchParams);
}

// ============================================================================
// Outlet Component
// ============================================================================

const outletContextSignal = signal<{
  matches: MatchedNestedRoute[];
  currentIndex: number;
  searchParams: URLSearchParams;
} | null>(null);

/**
 * Set the outlet context for nested rendering.
 */
export function setOutletContext(
  matches: MatchedNestedRoute[],
  currentIndex: number,
  searchParams: URLSearchParams
): void {
  outletContextSignal.set({ matches, currentIndex, searchParams });
}

/**
 * Outlet component for rendering nested routes.
 *
 * @example
 * ```tsx
 * export default function UsersLayout() {
 *   return (
 *     <div>
 *       <Sidebar />
 *       <main>
 *         <Outlet />
 *       </main>
 *     </div>
 *   );
 * }
 * ```
 */
export function Outlet(): VNode | JSXElement | string | null {
  const context = outletContextSignal();

  if (!context) {
    return null;
  }

  return createOutlet(context.matches, context.currentIndex, context.searchParams);
}

/**
 * Hook to access outlet context.
 */
export function useOutletContext<T>(): T | undefined {
  const context = outletContextSignal();
  return context as T | undefined;
}

// ============================================================================
// Route Hierarchy Utilities
// ============================================================================

/**
 * Get all route IDs in the hierarchy.
 */
export function getRouteIds(matches: MatchedNestedRoute[]): string[] {
  return matches.map((match) => match.id);
}

/**
 * Find a route by ID in the match hierarchy.
 */
export function findRouteById(
  matches: MatchedNestedRoute[],
  id: string
): MatchedNestedRoute | undefined {
  return matches.find((match) => match.id === id);
}

/**
 * Get the parent route of a matched route.
 */
export function getParentRoute(
  matches: MatchedNestedRoute[],
  id: string
): MatchedNestedRoute | undefined {
  const index = matches.findIndex((match) => match.id === id);
  return index > 0 ? matches[index - 1] : undefined;
}

/**
 * Get ancestor routes of a matched route.
 */
export function getAncestorRoutes(
  matches: MatchedNestedRoute[],
  id: string
): MatchedNestedRoute[] {
  const index = matches.findIndex((match) => match.id === id);
  return index > 0 ? matches.slice(0, index) : [];
}

// ============================================================================
// Route Configuration Builder
// ============================================================================

/**
 * Create a nested route definition.
 */
export function createRoute(
  config: NestedRouteDefinition
): NestedRouteDefinition {
  return {
    ...config,
    id: config.id || config.path,
  };
}

/**
 * Create a layout route (has children but may not have its own component).
 */
export function createLayoutRoute(
  path: string,
  children: NestedRouteDefinition[],
  options: Partial<NestedRouteDefinition> = {}
): NestedRouteDefinition {
  return {
    path,
    children,
    ...options,
    id: options.id || path,
  };
}

/**
 * Create an index route (matches when parent path is exact).
 */
export function createIndexRoute(
  options: Omit<NestedRouteDefinition, "path" | "children" | "index">
): NestedRouteDefinition {
  return {
    path: "",
    index: true,
    ...options,
    id: options.id || "_index",
  };
}

/**
 * Create a catch-all route.
 */
export function createCatchAllRoute(
  component: RouteComponent,
  options: Partial<NestedRouteDefinition> = {}
): NestedRouteDefinition {
  return {
    path: "*",
    catchAll: true,
    component,
    ...options,
    id: options.id || "_catchAll",
  };
}

// ============================================================================
// Path Utilities
// ============================================================================

/**
 * Normalize a pathname.
 */
function normalizePath(path: string): string {
  // Remove trailing slash (except for root)
  let normalized = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;

  // Ensure leading slash
  if (!normalized.startsWith("/")) {
    normalized = "/" + normalized;
  }

  return normalized;
}

/**
 * Join two path segments.
 */
function joinPaths(parent: string, child: string): string {
  if (!child || child === "/") {
    return parent || "/";
  }

  if (child.startsWith("/")) {
    return child;
  }

  if (!parent || parent === "/") {
    return child.startsWith("/") ? child : "/" + child;
  }

  const normalizedParent = parent.endsWith("/") ? parent.slice(0, -1) : parent;
  const normalizedChild = child.startsWith("/") ? child : "/" + child;

  return normalizedParent + normalizedChild;
}

function getMatchPattern(
  parentPath: string,
  childPath: string,
  fullPath: string
): string {
  if (!childPath || childPath === "/") {
    return fullPath;
  }

  if (!childPath.startsWith("/")) {
    return childPath;
  }

  if (!parentPath || parentPath === "/") {
    return childPath;
  }

  const normalizedParent = normalizePath(parentPath).replace(/\/$/, "");
  const normalizedChild = normalizePath(childPath).replace(/\/$/, "");

  if (normalizedChild === normalizedParent) {
    return "/";
  }

  if (normalizedChild.startsWith(normalizedParent + "/")) {
    const relative = normalizedChild.slice(normalizedParent.length);
    return relative || "/";
  }

  return childPath;
}

function joinMatchedPaths(prefix: string, matched: string): string {
  if (!prefix || prefix === "/") {
    return matched === "/" ? "/" : matched;
  }
  if (!matched || matched === "/") {
    return prefix;
  }
  const normalizedPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  const normalizedMatched = matched.startsWith("/") ? matched : `/${matched}`;
  return normalizedPrefix + normalizedMatched;
}

/**
 * Generate a path from a pattern and params.
 */
export function generatePath(
  pattern: string,
  params: Record<string, string> = {}
): string {
  return pattern
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":")) {
        const paramName = segment.slice(1);
        return encodeURIComponent(params[paramName] || "");
      }
      if (segment === "*") {
        const value = params["*"] || "";
        return value
          .split("/")
          .map((part) => encodeURIComponent(part))
          .join("/");
      }
      return segment;
    })
    .join("/");
}

/**
 * Parse params from a pathname using a pattern.
 */
export function parseParams(
  pathname: string,
  pattern: string
): Record<string, string> | null {
  const match = matchPathSegment(pathname, pattern);
  return match?.params || null;
}
