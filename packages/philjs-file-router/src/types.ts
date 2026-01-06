/**
 * Type definitions for PhilJS File-based Router.
 *
 * Provides Next.js/Nuxt-style file-based routing conventions.
 */

import type { VNode, JSXElement } from "@philjs/core";
import type { RouteDefinition, NavigateFunction } from "@philjs/router";

// ============================================================================
// File Convention Types
// ============================================================================

/**
 * Special file types recognized by the router.
 */
export type SpecialFileType =
  | "page"       // Main page component (index.tsx or page.tsx)
  | "layout"     // Layout wrapper (_layout.tsx)
  | "loading"    // Loading state (_loading.tsx)
  | "error"      // Error boundary (_error.tsx)
  | "not-found"  // 404 page (_404.tsx)
  | "template"   // Template wrapper (_template.tsx)
  | "default"    // Default for parallel routes (_default.tsx)
  | "middleware" // Route middleware (_middleware.ts)
  | "route";     // API route handler (route.ts)

/**
 * Segment types in file-based routing.
 */
export type SegmentType =
  | "static"           // Regular path segment (users)
  | "dynamic"          // Dynamic param ([id])
  | "catch-all"        // Catch-all ([...slug])
  | "optional-catch-all" // Optional catch-all ([[...slug]])
  | "group"            // Route group ((group))
  | "parallel";        // Parallel route (@slot)

/**
 * Parsed segment information.
 */
export interface ParsedSegment {
  /** Raw segment text */
  raw: string;
  /** Segment type */
  type: SegmentType;
  /** Parameter name for dynamic segments */
  paramName?: string;
  /** Group name for route groups */
  groupName?: string;
  /** Slot name for parallel routes */
  slotName?: string;
  /** Whether segment appears in URL */
  inUrl: boolean;
}

/**
 * Parsed file path result.
 */
export interface ParsedFilePath {
  /** Original file path */
  filePath: string;
  /** Detected file type */
  fileType: SpecialFileType | "component";
  /** Parsed path segments */
  segments: ParsedSegment[];
  /** Generated URL pattern */
  urlPattern: string;
  /** Parameter names extracted from path */
  params: string[];
  /** Route groups the file belongs to */
  groups: string[];
  /** Parallel slots the file belongs to */
  slots: string[];
  /** Whether the file should be ignored */
  ignored: boolean;
}

// ============================================================================
// Route Configuration Types
// ============================================================================

/**
 * Route module exports.
 */
export interface RouteModule {
  /** Default export - page/layout component */
  default?: RouteComponent;
  /** Data loader function */
  loader?: LoaderFunction;
  /** Form action function */
  action?: ActionFunction;
  /** Error boundary component */
  ErrorBoundary?: ErrorComponent;
  /** Loading state component */
  Loading?: LoadingComponent;
  /** Not found component */
  NotFound?: RouteComponent;
  /** Route configuration */
  config?: RouteConfig;
  /** Middleware function */
  middleware?: MiddlewareFunction;
  /** Generate static params for SSG */
  generateStaticParams?: () => Promise<Record<string, string>[]>;
}

/**
 * Route component type.
 */
export type RouteComponent<P = RouteComponentProps> = (props: P) => VNode | JSXElement | string | null;

/**
 * Props passed to route components.
 */
export interface RouteComponentProps {
  /** Route parameters */
  params: Record<string, string>;
  /** URL search parameters */
  searchParams: URLSearchParams;
  /** Loader data */
  data?: unknown;
  /** Error from loader/action */
  error?: Error;
  /** Children for layouts */
  children?: VNode | JSXElement | string | null;
}

/**
 * Error component props.
 */
export interface ErrorComponentProps {
  /** The error that occurred */
  error: Error;
  /** Reset function to retry */
  reset: () => void;
  /** Route parameters */
  params: Record<string, string>;
}

/**
 * Error component type.
 */
export type ErrorComponent = (props: ErrorComponentProps) => VNode | JSXElement | string | null;

/**
 * Loading component type.
 */
export type LoadingComponent = () => VNode | JSXElement | string | null;

/**
 * Loader function context.
 */
export interface LoaderContext {
  /** Route parameters */
  params: Record<string, string>;
  /** Request object */
  request: Request;
  /** URL object */
  url: URL;
}

/**
 * Loader function type.
 */
export type LoaderFunction<T = unknown> = (context: LoaderContext) => T | Promise<T>;

/**
 * Action function context.
 */
export interface ActionContext extends LoaderContext {
  /** Form data from submission */
  formData: FormData;
}

/**
 * Action function type.
 */
export type ActionFunction<T = unknown> = (context: ActionContext) => T | Promise<T>;

/**
 * Middleware function type.
 */
export type MiddlewareFunction = (
  request: Request,
  next: () => Promise<Response>
) => Response | Promise<Response>;

/**
 * Route configuration that can be exported from route files.
 */
export interface RouteConfig {
  /** Override the route path */
  path?: string;
  /** Revalidation time in seconds (ISR) */
  revalidate?: number | false;
  /** Dynamic rendering mode */
  dynamic?: "auto" | "force-dynamic" | "force-static" | "error";
  /** Runtime environment */
  runtime?: "nodejs" | "edge";
  /** Max execution duration */
  maxDuration?: number;
  /** Preferred region */
  preferredRegion?: string | string[];
  /** Custom metadata */
  [key: string]: unknown;
}

// ============================================================================
// Generated Route Types
// ============================================================================

/**
 * Generated route from file system.
 */
export interface GeneratedRoute {
  /** Unique route ID */
  id: string;
  /** URL path pattern */
  path: string;
  /** File path relative to routes directory */
  filePath: string;
  /** Absolute file path */
  absolutePath: string;
  /** Parameter names */
  params: string[];
  /** Route groups this route belongs to */
  groups: string[];
  /** Parallel slot if applicable */
  slot?: string;
  /** Parent route ID */
  parentId?: string;
  /** Child route IDs */
  childIds: string[];
  /** Layout chain (file paths) */
  layoutChain: string[];
  /** Loading state file path */
  loadingPath?: string;
  /** Error boundary file path */
  errorPath?: string;
  /** Not found file path */
  notFoundPath?: string;
  /** Whether this is an index route */
  isIndex: boolean;
  /** Whether this is a catch-all route */
  isCatchAll: boolean;
  /** Priority for route matching */
  priority: number;
  /** Lazy loader function */
  lazy?: () => Promise<RouteModule>;
}

/**
 * Route tree node for nested routing.
 */
export interface RouteTreeNode {
  /** Route segment */
  segment: string;
  /** Parsed segment info */
  parsedSegment: ParsedSegment;
  /** Full URL pattern to this node */
  urlPattern: string;
  /** Page file for this route */
  page?: ScannedFile;
  /** Layout file for this route */
  layout?: ScannedFile;
  /** Loading file for this route */
  loading?: ScannedFile;
  /** Error file for this route */
  error?: ScannedFile;
  /** Not found file for this route */
  notFound?: ScannedFile;
  /** Child nodes */
  children: Map<string, RouteTreeNode>;
  /** Parallel slots */
  slots: Map<string, RouteTreeNode>;
  /** Route groups at this level */
  groups: string[];
}

/**
 * Scanned file from file system.
 */
export interface ScannedFile {
  /** Absolute file path */
  absolutePath: string;
  /** Relative path from routes directory */
  relativePath: string;
  /** Parsed file information */
  parsed: ParsedFilePath;
  /** Route ID */
  id: string;
  /** Route priority */
  priority: number;
}

/**
 * Route manifest containing all generated routes.
 */
export interface RouteManifest {
  /** All routes */
  routes: GeneratedRoute[];
  /** Route tree for nested rendering */
  tree: RouteTreeNode;
  /** Type definitions string */
  types: string;
  /** Import statements */
  imports: string[];
}

// ============================================================================
// Scanner Types
// ============================================================================

/**
 * Scanner configuration.
 */
export interface ScannerConfig {
  /** Root directory to scan */
  routesDir: string;
  /** File extensions to scan */
  extensions?: string[];
  /** Patterns to ignore */
  ignore?: (string | RegExp)[];
  /** Whether to process layouts */
  layouts?: boolean;
  /** Whether to process loading states */
  loading?: boolean;
  /** Whether to process error boundaries */
  errors?: boolean;
  /** Whether to process route groups */
  groups?: boolean;
  /** Whether to process parallel routes */
  parallel?: boolean;
}

/**
 * Scan result.
 */
export interface ScanResult {
  /** All scanned files */
  files: ScannedFile[];
  /** Route tree */
  tree: RouteTreeNode;
  /** Page routes */
  pages: ScannedFile[];
  /** Layout files */
  layouts: ScannedFile[];
  /** Loading files */
  loadings: ScannedFile[];
  /** Error files */
  errors: ScannedFile[];
  /** Not found files */
  notFounds: ScannedFile[];
  /** Scan duration in ms */
  duration: number;
  /** Warnings during scan */
  warnings: string[];
}

// ============================================================================
// Generator Types
// ============================================================================

/**
 * Generator configuration.
 */
export interface GeneratorConfig extends ScannerConfig {
  /** Base path for all routes */
  basePath?: string;
  /** Whether to use lazy imports */
  lazy?: boolean;
  /** Generate TypeScript types */
  generateTypes?: boolean;
  /** Custom import path transformer */
  importTransformer?: (absolutePath: string, relativePath: string) => string;
}

// ============================================================================
// Plugin Types
// ============================================================================

/**
 * Vite plugin options.
 */
export interface VitePluginOptions extends GeneratorConfig {
  /** Output directory for generated files */
  outDir?: string;
  /** Virtual module name */
  virtualModuleName?: string;
  /** Enable HMR for routes */
  hmr?: boolean;
  /** Log level */
  logLevel?: "verbose" | "info" | "warn" | "error" | "silent";
}

/**
 * Webpack plugin options.
 */
export interface WebpackPluginOptions extends GeneratorConfig {
  /** Output directory for generated files */
  outDir?: string;
  /** Watch for file changes */
  watch?: boolean;
  /** Log level */
  logLevel?: "verbose" | "info" | "warn" | "error" | "silent";
}

// ============================================================================
// Runtime Types
// ============================================================================

/**
 * File router configuration.
 */
export interface FileRouterConfig {
  /** Route manifest */
  manifest: RouteManifest;
  /** Target element for rendering */
  target?: string | HTMLElement;
  /** Enable view transitions */
  transitions?: boolean;
  /** Prefetch strategy */
  prefetch?: boolean | "hover" | "visible" | "intent";
  /** Custom module loader */
  moduleLoader?: (path: string) => Promise<RouteModule>;
  /** Error handler */
  onError?: (error: Error, routeId: string) => void;
  /** Navigation callback */
  onNavigate?: (from: string, to: string) => void;
}

/**
 * Matched route with loaded data.
 */
export interface MatchedRoute {
  /** Route definition */
  route: GeneratedRoute;
  /** Extracted parameters */
  params: Record<string, string>;
  /** Current URL */
  url: URL;
  /** Loaded module */
  module: RouteModule | null;
  /** Loader data */
  data: unknown;
  /** Error from loader */
  error: Error | null;
  /** Loading state */
  loading: boolean;
  /** Layout chain */
  layouts: RouteModule[];
}

/**
 * Router state.
 */
export interface RouterState {
  /** Current matched route */
  currentRoute: MatchedRoute | null;
  /** Is currently loading */
  loading: boolean;
  /** Navigation history */
  history: string[];
  /** Prefetched routes */
  prefetched: Set<string>;
}

/**
 * File router instance.
 */
export interface FileRouter {
  /** Route manifest */
  manifest: RouteManifest;
  /** Navigate to a route */
  navigate: NavigateFunction;
  /** Get current route */
  getCurrentRoute: () => MatchedRoute | null;
  /** Reload current route */
  reload: () => Promise<void>;
  /** Prefetch a route */
  prefetch: (path: string) => Promise<void>;
  /** Start the router */
  start: () => void;
  /** Dispose the router */
  dispose: () => void;
  /** Subscribe to route changes */
  subscribe: (callback: (route: MatchedRoute | null) => void) => () => void;
}

// ============================================================================
// Link Component Types
// ============================================================================

/**
 * Type-safe link props.
 */
export interface TypeSafeLinkProps<Path extends string = string> {
  /** Target path */
  to: Path;
  /** Route parameters */
  params?: Path extends `${string}:${infer Param}${infer Rest}`
    ? { [K in ExtractParams<Path>]: string }
    : never;
  /** Replace history instead of push */
  replace?: boolean;
  /** Prefetch mode */
  prefetch?: boolean | "hover" | "visible" | "intent" | "render";
  /** Active class name */
  activeClassName?: string;
  /** Exact match for active state */
  exact?: boolean;
  /** Children */
  children?: VNode | JSXElement | string;
  /** Additional props */
  [key: string]: unknown;
}

/**
 * Extract parameter names from a path pattern.
 */
export type ExtractParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<`/${Rest}`>
    : Path extends `${string}:${infer Param}`
      ? Param
      : Path extends `${string}*${infer Param}/${infer Rest}`
        ? Param | ExtractParams<`/${Rest}`>
        : Path extends `${string}*${infer Param}`
          ? Param
          : never;

/**
 * Route params for a specific path.
 */
export type RouteParams<Path extends string> = {
  [K in ExtractParams<Path>]: string;
};
