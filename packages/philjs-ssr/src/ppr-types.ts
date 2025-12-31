/**
 * Partial Prerendering (PPR) Types and Interfaces
 *
 * PPR combines the benefits of static site generation (fast) with
 * server-side rendering (fresh data) by prerendering static shells
 * at build time and streaming dynamic content at request time.
 */

import type { VNode } from "@philjs/core";

// ============================================================================
// Core PPR Types
// ============================================================================

/**
 * PPR route configuration
 */
export type PPRConfig = {
  /** Enable PPR for this route */
  ppr: boolean;
  /** Static shell cache TTL in seconds (default: 3600) */
  staticCacheTtl?: number;
  /** Edge caching strategy */
  edgeCaching?: EdgeCachingStrategy;
  /** Fallback content for dynamic boundaries during build */
  fallbackContent?: VNode;
  /** Custom placeholder ID prefix */
  placeholderPrefix?: string;
};

/**
 * Edge caching strategies for static shells
 */
export type EdgeCachingStrategy =
  | "stale-while-revalidate"
  | "cache-first"
  | "network-first"
  | "cache-only";

/**
 * Represents a dynamic boundary in the PPR render tree
 */
export type DynamicBoundary = {
  /** Unique identifier for this boundary */
  id: string;
  /** Type of boundary */
  type: "suspense" | "dynamic";
  /** Fallback content (rendered as placeholder) */
  fallback: VNode | null;
  /** The dynamic content to render at request time */
  content: VNode;
  /** Optional data dependencies for this boundary */
  dataDependencies?: string[];
  /** Priority for streaming (higher = sooner) */
  priority?: number;
};

/**
 * Static shell generated at build time
 */
export type StaticShell = {
  /** Route path */
  path: string;
  /** Pre-rendered HTML with placeholder comments */
  html: string;
  /** Map of dynamic boundary IDs to their metadata */
  boundaries: Map<string, DynamicBoundaryMetadata>;
  /** Build timestamp */
  buildTime: number;
  /** Hash of the shell content for cache invalidation */
  contentHash: string;
  /** Assets required for this shell */
  assets: ShellAssets;
};

/**
 * Metadata for a dynamic boundary stored in the static shell
 */
export type DynamicBoundaryMetadata = {
  /** Boundary ID */
  id: string;
  /** Type of boundary */
  type: "suspense" | "dynamic";
  /** Fallback HTML (already rendered) */
  fallbackHtml: string;
  /** Data dependencies for cache invalidation */
  dataDependencies: string[];
  /** Priority for streaming */
  priority: number;
  /** Start marker in the HTML */
  startMarker: string;
  /** End marker in the HTML */
  endMarker: string;
};

/**
 * Assets associated with a static shell
 */
export type ShellAssets = {
  /** CSS files to preload */
  css: string[];
  /** JavaScript files to preload */
  js: string[];
  /** Font files to preload */
  fonts: string[];
  /** Critical inline CSS */
  inlineCss?: string;
};

// ============================================================================
// PPR Rendering Context
// ============================================================================

/**
 * Context passed during PPR rendering
 */
export type PPRContext = {
  /** Current render mode */
  mode: "build" | "request";
  /** Collected dynamic boundaries */
  boundaries: Map<string, DynamicBoundary>;
  /** Unique ID counter for boundaries */
  boundaryId: number;
  /** Placeholder prefix */
  placeholderPrefix: string;
  /** Whether we're currently inside a dynamic boundary */
  insideDynamicBoundary: boolean;
  /** Request-time data (only available in "request" mode) */
  requestData?: RequestTimeData;
};

/**
 * Data available at request time
 */
export type RequestTimeData = {
  /** Original request */
  request: Request;
  /** Route parameters */
  params: Record<string, string>;
  /** Request headers */
  headers: Headers;
  /** Cookies */
  cookies: Map<string, string>;
  /** Request timestamp */
  timestamp: number;
};

// ============================================================================
// PPR Cache Types
// ============================================================================

/**
 * Cache interface for static shells
 */
export interface PPRCache {
  /** Get a static shell from cache */
  get(path: string): Promise<StaticShell | null>;
  /** Store a static shell in cache */
  set(path: string, shell: StaticShell): Promise<void>;
  /** Check if a shell exists in cache */
  has(path: string): Promise<boolean>;
  /** Invalidate a specific shell */
  invalidate(path: string): Promise<void>;
  /** Invalidate all shells */
  invalidateAll(): Promise<void>;
  /** Get cache statistics */
  stats(): Promise<CacheStats>;
}

/**
 * Cache statistics
 */
export type CacheStats = {
  /** Total number of cached shells */
  size: number;
  /** Total size in bytes */
  bytes: number;
  /** Cache hit ratio */
  hitRatio: number;
  /** Last cache clear time */
  lastCleared?: number;
};

// ============================================================================
// PPR Streaming Types
// ============================================================================

/**
 * Options for PPR streaming
 */
export type PPRStreamOptions = {
  /** Static shell to use as base */
  shell: StaticShell;
  /** Request-time context */
  requestData: RequestTimeData;
  /** Callback when static shell is sent */
  onShellSent?: () => void;
  /** Callback when a boundary is resolved */
  onBoundaryResolved?: (id: string, html: string) => void;
  /** Callback when all boundaries are resolved */
  onComplete?: () => void;
  /** Callback on error */
  onError?: (error: Error, boundaryId?: string) => void;
  /** Timeout for dynamic content in ms (default: 10000) */
  timeout?: number;
  /** Whether to abort on first error */
  abortOnError?: boolean;
};

/**
 * Result of resolving a dynamic boundary
 */
export type BoundaryResolution = {
  /** Boundary ID */
  id: string;
  /** Resolved HTML content */
  html: string;
  /** Time to resolve in ms */
  resolveTime: number;
  /** Whether resolution was from cache */
  cached: boolean;
  /** Any error that occurred */
  error?: Error;
};

// ============================================================================
// PPR Build Types
// ============================================================================

/**
 * Configuration for PPR build process
 */
export type PPRBuildConfig = {
  /** Output directory for static shells */
  outDir: string;
  /** Routes to prerender */
  routes: PPRRouteEntry[];
  /** Render function for components */
  renderFn: (path: string, ctx: PPRContext) => Promise<string>;
  /** Cache implementation */
  cache?: PPRCache;
  /** Whether to generate source maps */
  sourceMaps?: boolean;
  /** Base URL for asset paths */
  baseUrl?: string;
  /** Concurrent builds */
  concurrency?: number;
};

/**
 * Entry for a PPR-enabled route
 */
export type PPRRouteEntry = {
  /** Route path */
  path: string;
  /** Route component */
  component: (props: any) => VNode;
  /** PPR configuration */
  config: PPRConfig;
  /** Static paths to generate (for dynamic routes) */
  getStaticPaths?: () => Promise<string[]> | string[];
};

/**
 * Result of PPR build
 */
export type PPRBuildResult = {
  /** Generated static shells */
  shells: Map<string, StaticShell>;
  /** Build duration in ms */
  duration: number;
  /** Any errors encountered */
  errors: PPRBuildError[];
  /** Manifest of generated files */
  manifest: PPRManifest;
};

/**
 * Error during PPR build
 */
export type PPRBuildError = {
  /** Route that failed */
  path: string;
  /** Error message */
  message: string;
  /** Error stack */
  stack?: string;
};

/**
 * Manifest of PPR build output
 */
export type PPRManifest = {
  /** Build timestamp */
  buildTime: number;
  /** Version of PPR implementation */
  version: string;
  /** Routes and their shells */
  routes: Record<
    string,
    {
      shellFile: string;
      boundaryCount: number;
      contentHash: string;
    }
  >;
};

// ============================================================================
// Dynamic Component Props
// ============================================================================

/**
 * Props for the dynamic boundary component
 */
export type DynamicProps = {
  /** Content to render dynamically */
  children: VNode;
  /** Fallback content during loading */
  fallback?: VNode;
  /** Priority for streaming (0-10, higher = sooner) */
  priority?: number;
  /** Data dependencies for cache invalidation */
  dataDependencies?: string[];
  /** Custom boundary ID */
  id?: string;
};

/**
 * Props for PPR-enhanced Suspense
 */
export type PPRSuspenseProps = {
  /** Content to render */
  children: VNode;
  /** Fallback during loading */
  fallback?: VNode;
  /** Whether this suspense boundary is dynamic (not prerendered) */
  dynamic?: boolean;
  /** Priority for streaming */
  priority?: number;
};

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Check if a component is marked as dynamic
 */
export type IsDynamicComponent = (component: unknown) => boolean;

/**
 * PPR placeholder comment format
 */
export const PPR_PLACEHOLDER_START = (id: string) =>
  `<!--ppr:start:${id}-->`;
export const PPR_PLACEHOLDER_END = (id: string) =>
  `<!--ppr:end:${id}-->`;
export const PPR_FALLBACK_START = (id: string) =>
  `<!--ppr:fallback:${id}-->`;
export const PPR_FALLBACK_END = (id: string) =>
  `<!--ppr:fallback-end:${id}-->`;

/**
 * Extract boundary ID from placeholder comment
 */
export function extractBoundaryId(
  comment: string
): { type: "start" | "end" | "fallback"; id: string } | null {
  const startMatch = comment.match(/^ppr:start:(.+)$/);
  if (startMatch && startMatch[1]) return { type: "start", id: startMatch[1] };

  const endMatch = comment.match(/^ppr:end:(.+)$/);
  if (endMatch && endMatch[1]) return { type: "end", id: endMatch[1] };

  const fallbackMatch = comment.match(/^ppr:fallback:(.+)$/);
  if (fallbackMatch && fallbackMatch[1]) return { type: "fallback", id: fallbackMatch[1] };

  return null;
}

/**
 * Hash content for cache invalidation
 */
export async function hashContent(content: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback for environments without crypto.subtle
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
