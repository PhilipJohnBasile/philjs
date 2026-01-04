/**
 * PhilJS Serverless Types
 *
 * Core types for the serverless abstraction layer.
 */

/**
 * Supported serverless platforms
 */
export type Platform =
  | 'vercel'
  | 'netlify'
  | 'lambda'
  | 'cloudflare'
  | 'bun'
  | 'deno'
  | 'node'
  | 'edge'
  | 'unknown';

/**
 * Platform-specific context information
 */
export interface PlatformContext {
  /** Detected platform */
  platform: Platform;
  /** Platform version if available */
  version?: string;
  /** Region where the function is running */
  region?: string;
  /** Request ID for tracing */
  requestId?: string;
  /** Whether this is a cold start */
  isColdStart: boolean;
  /** Cold start duration in milliseconds (if applicable) */
  coldStartDuration?: number;
  /** Remaining execution time in milliseconds (if available) */
  remainingTimeMs?: number;
  /** Platform-specific environment bindings (e.g., KV, D1) */
  bindings?: Record<string, unknown>;
  /** Platform-specific execution context */
  executionContext?: ExecutionContext;
}

/**
 * Execution context for background tasks
 */
export interface ExecutionContext {
  /** Register a promise that should complete before the response is finalized */
  waitUntil(promise: Promise<unknown>): void;
  /** Pass through to next middleware/handler on exception */
  passThroughOnException?(): void;
}

/**
 * Serverless request context
 */
export interface ServerlessContext<State = Record<string, unknown>> {
  /** The incoming request */
  request: Request;
  /** Platform context information */
  platform: PlatformContext;
  /** URL object for convenience */
  url: URL;
  /** Request method */
  method: string;
  /** Request path */
  path: string;
  /** Query parameters */
  query: URLSearchParams;
  /** Route parameters (populated by router) */
  params: Record<string, string>;
  /** Headers helper */
  headers: Headers;
  /** State object for middleware to share data */
  state: State;
  /** Response headers to be set */
  responseHeaders: Headers;
  /** Set a response header */
  setHeader(name: string, value: string): void;
  /** Get a request header */
  getHeader(name: string): string | null;
  /** Register a background task */
  waitUntil(promise: Promise<unknown>): void;
  /** Start time for timing */
  startTime: number;
  /** Get elapsed time in milliseconds */
  getElapsedTime(): number;
}

/**
 * Handler function type
 */
export type Handler<State = Record<string, unknown>> = (
  ctx: ServerlessContext<State>
) => Response | Promise<Response>;

/**
 * Next function for middleware chain
 */
export type Next = () => Promise<Response>;

/**
 * Middleware function type (Koa/Hono style)
 */
export type Middleware<State = Record<string, unknown>> = (
  ctx: ServerlessContext<State>,
  next: Next
) => Response | Promise<Response>;

/**
 * Handler options
 */
export interface HandlerOptions<State = Record<string, unknown>> {
  /** Middleware to apply */
  middleware?: Middleware<State>[];
  /** Initial state */
  initialState?: State;
  /** Custom error handler */
  onError?: (error: Error, ctx: ServerlessContext<State>) => Response | Promise<Response>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable cold start tracking */
  trackColdStart?: boolean;
  /** Custom platform detection */
  detectPlatform?: () => Platform;
}

/**
 * CORS options
 */
export interface CorsOptions {
  /** Allowed origins */
  origin?: string | string[] | ((origin: string) => boolean | string);
  /** Allowed methods */
  methods?: string[];
  /** Allowed headers */
  allowHeaders?: string[];
  /** Exposed headers */
  exposeHeaders?: string[];
  /** Allow credentials */
  credentials?: boolean;
  /** Max age for preflight cache */
  maxAge?: number;
}

/**
 * Logger options
 */
export interface LoggerOptions {
  /** Log format */
  format?: 'json' | 'combined' | 'common' | 'short' | 'dev';
  /** Skip logging for certain paths */
  skip?: (ctx: ServerlessContext) => boolean;
  /** Custom log function */
  log?: (message: string) => void;
}

/**
 * Router configuration
 */
export interface RouterConfig<State = Record<string, unknown>> {
  /** Base path for all routes */
  basePath?: string;
  /** Middleware to apply to all routes */
  middleware?: Middleware<State>[];
  /** 404 handler */
  notFound?: Handler<State>;
  /** Error handler */
  onError?: (error: Error, ctx: ServerlessContext<State>) => Response | Promise<Response>;
}

/**
 * Route definition
 */
export interface RouteDefinition<State = Record<string, unknown>> {
  /** HTTP method(s) */
  method: string | string[];
  /** Path pattern (supports :param and * wildcard) */
  path: string;
  /** Route handler */
  handler: Handler<State>;
  /** Route-specific middleware */
  middleware?: Middleware<State>[];
}

/**
 * Matched route result
 */
export interface MatchedRoute<State = Record<string, unknown>> {
  /** The matched route definition */
  route: RouteDefinition<State>;
  /** Extracted route parameters */
  params: Record<string, string>;
}

/**
 * SSE message
 */
export interface SSEMessage {
  /** Event type */
  event?: string;
  /** Message data */
  data: string | object;
  /** Event ID */
  id?: string;
  /** Retry interval in milliseconds */
  retry?: number;
}

/**
 * SSE options
 */
export interface SSEOptions {
  /** Keep-alive interval in milliseconds */
  keepAliveInterval?: number;
  /** Keep-alive comment message */
  keepAliveMessage?: string;
  /** Initial retry interval */
  retry?: number;
}

/**
 * Cookie options
 */
export interface CookieOptions {
  /** Max age in seconds */
  maxAge?: number;
  /** Expiration date */
  expires?: Date;
  /** Cookie path */
  path?: string;
  /** Cookie domain */
  domain?: string;
  /** HTTPS only */
  secure?: boolean;
  /** HTTP only (no JS access) */
  httpOnly?: boolean;
  /** Same-site policy */
  sameSite?: 'strict' | 'lax' | 'none';
}
