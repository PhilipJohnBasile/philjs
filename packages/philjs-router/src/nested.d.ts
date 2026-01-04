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
import type { JSXElement, VNode } from "@philjs/core";
import { type LoaderFunction } from "./loader.js";
import { type ActionFunction } from "./action.js";
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
export type RouteComponent<Props = RouteComponentProps> = (props: Props) => VNode | JSXElement | string | null | undefined;
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
/**
 * Match a pathname against nested route definitions.
 * Returns all matching routes from root to leaf.
 */
export declare function matchNestedRoutes(pathname: string, routes: NestedRouteDefinition[], options?: NestedRouteOptions): NestedRouteMatch | null;
/**
 * Load data for all matched routes in parallel.
 * No waterfall - all loaders run simultaneously.
 */
export declare function loadNestedRouteData(matches: MatchedNestedRoute[], request: Request, options?: {
    signal?: AbortSignal;
    revalidate?: boolean;
}): Promise<MatchedNestedRoute[]>;
/**
 * Execute actions for matched routes.
 */
export declare function executeNestedAction(matches: MatchedNestedRoute[], request: Request): Promise<{
    routeId: string;
    result: unknown;
    error?: Error;
} | null>;
/**
 * Render matched routes with proper nesting.
 * Parent components receive children/outlet props.
 */
export declare function renderNestedRoutes(matches: MatchedNestedRoute[], searchParams: URLSearchParams): VNode | JSXElement | string | null;
/**
 * Create an Outlet component for rendering child routes.
 */
export declare function createOutlet(matches: MatchedNestedRoute[], currentIndex: number, searchParams: URLSearchParams): VNode | JSXElement | string | null;
/**
 * Set the outlet context for nested rendering.
 */
export declare function setOutletContext(matches: MatchedNestedRoute[], currentIndex: number, searchParams: URLSearchParams): void;
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
export declare function Outlet(): VNode | JSXElement | string | null;
/**
 * Hook to access outlet context.
 */
export declare function useOutletContext<T>(): T | undefined;
/**
 * Get all route IDs in the hierarchy.
 */
export declare function getRouteIds(matches: MatchedNestedRoute[]): string[];
/**
 * Find a route by ID in the match hierarchy.
 */
export declare function findRouteById(matches: MatchedNestedRoute[], id: string): MatchedNestedRoute | undefined;
/**
 * Get the parent route of a matched route.
 */
export declare function getParentRoute(matches: MatchedNestedRoute[], id: string): MatchedNestedRoute | undefined;
/**
 * Get ancestor routes of a matched route.
 */
export declare function getAncestorRoutes(matches: MatchedNestedRoute[], id: string): MatchedNestedRoute[];
/**
 * Create a nested route definition.
 */
export declare function createRoute(config: NestedRouteDefinition): NestedRouteDefinition;
/**
 * Create a layout route (has children but may not have its own component).
 */
export declare function createLayoutRoute(path: string, children: NestedRouteDefinition[], options?: Partial<NestedRouteDefinition>): NestedRouteDefinition;
/**
 * Create an index route (matches when parent path is exact).
 */
export declare function createIndexRoute(options: Omit<NestedRouteDefinition, "path" | "children" | "index">): NestedRouteDefinition;
/**
 * Create a catch-all route.
 */
export declare function createCatchAllRoute(component: RouteComponent, options?: Partial<NestedRouteDefinition>): NestedRouteDefinition;
/**
 * Generate a path from a pattern and params.
 */
export declare function generatePath(pattern: string, params?: Record<string, string>): string;
/**
 * Parse params from a pathname using a pattern.
 */
export declare function parseParams(pathname: string, pattern: string): Record<string, string> | null;
//# sourceMappingURL=nested.d.ts.map