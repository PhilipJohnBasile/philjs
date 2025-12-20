/**
 * Type-safe router types for PhilJS
 * Inspired by TanStack Router for fully typed routing
 */

import type { z } from "zod";
import type { VNode, JSXElement } from "philjs-core";

// =============================================================================
// Path Parameter Extraction Types
// =============================================================================

/**
 * Extract parameter names from a path string.
 * e.g., '/users/$userId/posts/$postId' -> 'userId' | 'postId'
 */
export type ExtractPathParams<Path extends string> =
  Path extends `${string}$${infer Param}/${infer Rest}`
    ? Param | ExtractPathParams<`/${Rest}`>
    : Path extends `${string}$${infer Param}`
      ? Param
      : never;

/**
 * Convert extracted parameter names to a params object type.
 * e.g., 'userId' | 'postId' -> { userId: string; postId: string }
 */
export type PathParams<Path extends string> = [ExtractPathParams<Path>] extends [never]
  ? Record<string, unknown>
  : { [K in ExtractPathParams<Path>]: string };

/**
 * Check if a path has any parameters
 */
export type HasParams<Path extends string> = [ExtractPathParams<Path>] extends [never]
  ? false
  : true;

// =============================================================================
// Search Parameter Types
// =============================================================================

/**
 * Infer the output type from a Zod schema
 */
export type InferSearchParams<T> = T extends z.ZodType<infer O> ? O : Record<string, unknown>;

/**
 * Search params can be undefined if no validation schema is provided
 */
export type SearchParamsOrEmpty<T> = T extends z.ZodType ? InferSearchParams<T> : Record<string, unknown>;

// =============================================================================
// Loader Types
// =============================================================================

/**
 * Context provided to route loaders
 */
export type LoaderContext<
  TPath extends string,
  TSearchSchema extends z.ZodType | undefined = undefined
> = {
  params: PathParams<TPath>;
  search: TSearchSchema extends z.ZodType ? z.infer<TSearchSchema> : Record<string, unknown>;
  request: Request;
  abortController: AbortController;
};

/**
 * Loader function type
 */
export type LoaderFn<
  TPath extends string,
  TSearchSchema extends z.ZodType | undefined = undefined,
  TLoaderData = unknown
> = (context: LoaderContext<TPath, TSearchSchema>) => Promise<TLoaderData> | TLoaderData;

/**
 * Infer loader data type from a route definition
 */
export type InferLoaderData<T> = T extends RouteDefinition<
  infer _Path,
  infer _Search,
  infer LoaderData
>
  ? LoaderData
  : never;

// =============================================================================
// Route Definition Types
// =============================================================================

/**
 * Options for creating a route
 */
export type RouteOptions<
  TPath extends string,
  TSearchSchema extends z.ZodType | undefined = undefined,
  TLoaderData = unknown
> = {
  path: TPath;
  validateSearch?: TSearchSchema;
  loader?: LoaderFn<TPath, TSearchSchema, TLoaderData>;
  component?: RouteComponent<TPath, TSearchSchema, TLoaderData>;
  errorComponent?: ErrorComponent;
  pendingComponent?: PendingComponent;
  beforeLoad?: (context: BeforeLoadContext<TPath, TSearchSchema>) => Promise<void> | void;
  meta?: RouteMeta;
};

/**
 * Before load context (for guards, redirects, etc.)
 */
export type BeforeLoadContext<
  TPath extends string,
  TSearchSchema extends z.ZodType | undefined = undefined
> = {
  params: PathParams<TPath>;
  search: TSearchSchema extends z.ZodType ? z.infer<TSearchSchema> : Record<string, unknown>;
  location: Location;
  cause: "enter" | "stay";
  abortController: AbortController;
};

/**
 * Route metadata
 */
export type RouteMeta = {
  title?: string;
  description?: string;
  [key: string]: unknown;
};

/**
 * Complete route definition with all type information
 */
export type RouteDefinition<
  TPath extends string = string,
  TSearchSchema extends z.ZodType | undefined = undefined,
  TLoaderData = unknown
> = {
  readonly id: string;
  readonly path: TPath;
  readonly fullPath: string;
  readonly validateSearch: TSearchSchema;
  readonly loader?: LoaderFn<TPath, TSearchSchema, TLoaderData>;
  readonly component?: RouteComponent<TPath, TSearchSchema, TLoaderData>;
  readonly errorComponent?: ErrorComponent;
  readonly pendingComponent?: PendingComponent;
  readonly beforeLoad?: (context: BeforeLoadContext<TPath, TSearchSchema>) => Promise<void> | void;
  readonly meta?: RouteMeta;
  readonly parent?: RouteDefinition<string, z.ZodType | undefined, unknown>;
  readonly children: RouteDefinition<string, z.ZodType | undefined, unknown>[];

  // Methods attached to route for use in components
  useParams: () => PathParams<TPath>;
  useSearch: () => TSearchSchema extends z.ZodType ? z.infer<TSearchSchema> : Record<string, unknown>;
  useLoaderData: () => TLoaderData;
};

// =============================================================================
// Component Types
// =============================================================================

/**
 * Props passed to route components
 */
export type RouteComponentProps<
  TPath extends string,
  TSearchSchema extends z.ZodType | undefined = undefined,
  TLoaderData = unknown
> = {
  params: PathParams<TPath>;
  search: TSearchSchema extends z.ZodType ? z.infer<TSearchSchema> : Record<string, unknown>;
  loaderData: TLoaderData;
  navigate: NavigateFn;
};

/**
 * Route component type
 */
export type RouteComponent<
  TPath extends string,
  TSearchSchema extends z.ZodType | undefined = undefined,
  TLoaderData = unknown
> = (props: RouteComponentProps<TPath, TSearchSchema, TLoaderData>) => VNode | JSXElement | string | null;

/**
 * Error component props
 */
export type ErrorComponentProps = {
  error: Error;
  reset: () => void;
};

/**
 * Error component type
 */
export type ErrorComponent = (props: ErrorComponentProps) => VNode | JSXElement | string | null;

/**
 * Pending/loading component type
 */
export type PendingComponent = () => VNode | JSXElement | string | null;

// =============================================================================
// Navigation Types
// =============================================================================

/**
 * Navigation options
 */
export type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
  resetScroll?: boolean;
};

/**
 * Navigate function type
 */
export type NavigateFn = (to: string, options?: NavigateOptions) => Promise<void>;

/**
 * Typed navigate options for a specific route
 */
export type TypedNavigateOptions<
  TPath extends string,
  TSearchSchema extends z.ZodType | undefined = undefined
> = NavigateOptions & {
  params: HasParams<TPath> extends true ? PathParams<TPath> : PathParams<TPath> | undefined;
  search?: TSearchSchema extends z.ZodType ? Partial<z.infer<TSearchSchema>> : never;
};

// =============================================================================
// Link Types
// =============================================================================

/**
 * Props for type-safe Link component when using a route object
 */
export type LinkPropsWithRoute<
  TPath extends string,
  TSearchSchema extends z.ZodType | undefined = undefined
> = {
  to: RouteDefinition<TPath, TSearchSchema, unknown>;
  params: HasParams<TPath> extends true ? PathParams<TPath> : PathParams<TPath> | undefined;
  search?: TSearchSchema extends z.ZodType ? Partial<z.infer<TSearchSchema>> : never;
  hash?: string;
  replace?: boolean;
  prefetch?: boolean | "intent" | "viewport" | "render";
  children?: VNode | JSXElement | string;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  style?: Record<string, string | number>;
  activeStyle?: Record<string, string | number>;
  inactiveStyle?: Record<string, string | number>;
  disabled?: boolean;
  target?: string;
  [key: string]: unknown;
};

/**
 * Props for Link component when using a string path
 */
export type LinkPropsWithPath = {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
  hash?: string;
  replace?: boolean;
  prefetch?: boolean | "intent" | "viewport" | "render";
  children?: VNode | JSXElement | string;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  style?: Record<string, string | number>;
  activeStyle?: Record<string, string | number>;
  inactiveStyle?: Record<string, string | number>;
  disabled?: boolean;
  target?: string;
  [key: string]: unknown;
};

/**
 * Combined Link props type
 */
export type LinkProps<
  TPath extends string = string,
  TSearchSchema extends z.ZodType | undefined = undefined
> = LinkPropsWithRoute<TPath, TSearchSchema> | LinkPropsWithPath;

// =============================================================================
// Router Types
// =============================================================================

/**
 * Router configuration options
 */
export type RouterOptions = {
  routes: RouteDefinition<string, z.ZodType | undefined, unknown>[];
  basePath?: string;
  defaultPendingComponent?: PendingComponent;
  defaultErrorComponent?: ErrorComponent;
  notFoundComponent?: () => VNode | JSXElement | string | null;
  onNavigate?: (event: NavigationEvent) => void;
  scrollRestoration?: "auto" | "manual" | false;
};

/**
 * Navigation event
 */
export type NavigationEvent = {
  from: MatchedRoute | null;
  to: MatchedRoute;
  type: "push" | "replace" | "pop";
};

/**
 * Matched route with runtime data
 */
export type MatchedRoute<
  TPath extends string = string,
  TSearchSchema extends z.ZodType | undefined = undefined,
  TLoaderData = unknown
> = {
  route: RouteDefinition<TPath, TSearchSchema, TLoaderData>;
  params: PathParams<TPath>;
  search: TSearchSchema extends z.ZodType ? z.infer<TSearchSchema> : Record<string, unknown>;
  loaderData?: TLoaderData;
  error?: Error;
  status: "pending" | "success" | "error";
};

/**
 * Router context type
 */
export type RouterContextType = {
  currentMatch: MatchedRoute | null;
  navigate: NavigateFn;
  matches: MatchedRoute[];
  location: RouterLocation;
  isNavigating: boolean;
};

/**
 * Router location type
 */
export type RouterLocation = {
  pathname: string;
  search: string;
  hash: string;
  state: unknown;
  href: string;
};

// =============================================================================
// Route Tree Types (for nested routes)
// =============================================================================

/**
 * Root route configuration
 */
export type RootRouteOptions = {
  component?: (props: { children: VNode | JSXElement | string | null }) => VNode | JSXElement | string | null;
  errorComponent?: ErrorComponent;
  pendingComponent?: PendingComponent;
  notFoundComponent?: () => VNode | JSXElement | string | null;
};

/**
 * Create route tree type (for organizing routes)
 */
export type RouteTree = RouteDefinition<string, z.ZodType | undefined, unknown>[];

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Make certain properties required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Deep partial type
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

/**
 * Prettify type for better IDE display
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Union to intersection type
 */
export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

/**
 * Extract route type from a route definition
 */
export type ExtractRoute<T> = T extends RouteDefinition<
  infer Path,
  infer Search,
  infer LoaderData
>
  ? { path: Path; search: Search; loaderData: LoaderData }
  : never;

/**
 * All registered routes type (for global type inference)
 */
export interface RegisteredRoutes {
  // Routes are registered here via module augmentation
}

/**
 * Get all route paths from registered routes
 */
export type AllRoutePaths = keyof RegisteredRoutes extends never
  ? string
  : keyof RegisteredRoutes;
