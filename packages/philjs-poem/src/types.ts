/**
 * PhilJS Poem Types
 *
 * Type definitions for Poem framework integration.
 */

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Main configuration for PhilJS Poem integration
 */
export interface PoemConfig {
  /** SSR configuration */
  ssr?: PoemSSRConfig;
  /** OpenAPI configuration */
  openapi?: PoemOpenAPIConfig;
  /** CORS configuration */
  cors?: PoemCORSConfig;
  /** Security headers configuration */
  security?: PoemSecurityConfig;
  /** Session configuration */
  session?: PoemSessionConfig;
  /** Rate limiting configuration */
  rateLimit?: PoemRateLimitConfig;
  /** Static files configuration */
  staticFiles?: PoemStaticConfig;
}

/**
 * SSR configuration options
 */
export interface PoemSSRConfig {
  /** Enable SSR */
  enabled?: boolean;
  /** Enable streaming SSR */
  streaming?: boolean;
  /** Inject hydration scripts */
  hydration?: boolean;
  /** Enable response caching */
  cacheEnabled?: boolean;
  /** Cache TTL in seconds */
  cacheTTL?: number;
}

/**
 * OpenAPI configuration options
 */
export interface PoemOpenAPIConfig {
  /** Enable OpenAPI */
  enabled?: boolean;
  /** API title */
  title?: string;
  /** API description */
  description?: string;
  /** API version */
  version?: string;
  /** Terms of service URL */
  termsOfService?: string;
  /** Contact information */
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
  /** License information */
  license?: {
    name: string;
    url?: string;
  };
  /** Server URLs */
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  /** Path to Swagger UI */
  swaggerPath?: string;
  /** Path to Redoc */
  redocPath?: string;
}

/**
 * CORS configuration options
 */
export interface PoemCORSConfig {
  /** Enable CORS */
  enabled?: boolean;
  /** Allowed origins */
  origins?: string[];
  /** Allowed methods */
  methods?: string[];
  /** Allowed headers */
  headers?: string[];
  /** Allow credentials */
  credentials?: boolean;
  /** Max age for preflight cache */
  maxAge?: number;
  /** Expose headers */
  exposeHeaders?: string[];
}

/**
 * Security headers configuration
 */
export interface PoemSecurityConfig {
  /** Enable security headers */
  enabled?: boolean;
  /** Content Security Policy */
  csp?: string;
  /** X-Frame-Options header */
  frameOptions?: string;
  /** X-Content-Type-Options header */
  contentTypeOptions?: string;
  /** Referrer-Policy header */
  referrerPolicy?: string;
  /** Strict-Transport-Security header */
  hsts?: string;
  /** Permissions-Policy header */
  permissionsPolicy?: string;
}

/**
 * Session configuration
 */
export interface PoemSessionConfig {
  /** Enable sessions */
  enabled?: boolean;
  /** Session cookie name */
  cookieName?: string;
  /** Session secret key */
  secret?: string;
  /** Session TTL in seconds */
  ttl?: number;
  /** Secure cookies only */
  secure?: boolean;
  /** HTTP-only cookies */
  httpOnly?: boolean;
  /** Same-site cookie policy */
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Rate limiting configuration
 */
export interface PoemRateLimitConfig {
  /** Enable rate limiting */
  enabled?: boolean;
  /** Requests per window */
  limit?: number;
  /** Window size in seconds */
  window?: number;
  /** Key extractor */
  keyBy?: 'ip' | 'user' | 'apiKey';
  /** Custom key header */
  keyHeader?: string;
}

/**
 * Static files configuration
 */
export interface PoemStaticConfig {
  /** Enable static file serving */
  enabled?: boolean;
  /** Path to static files directory */
  path?: string;
  /** URL prefix for static files */
  prefix?: string;
  /** Cache-Control max-age in seconds */
  maxAge?: number;
  /** Enable gzip compression */
  gzip?: boolean;
  /** Enable brotli compression */
  brotli?: boolean;
}

// ============================================================================
// Extractor Types
// ============================================================================

/**
 * Context passed to extractors
 */
export interface ExtractorContext {
  /** Request method */
  method: string;
  /** Request path */
  path: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Cookies */
  cookies: Record<string, string>;
  /** Query parameters */
  query: Record<string, string>;
  /** Path parameters */
  params: Record<string, string>;
  /** Request body */
  body?: unknown;
  /** Remote address */
  remoteAddr?: string;
  /** Request ID */
  requestId: string;
}

/**
 * Extractor result
 */
export type ExtractorResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; status?: number };

/**
 * Extractor definition
 */
export interface ExtractorDefinition<T> {
  /** Extractor name */
  name: string;
  /** Extract value from request */
  extract: (ctx: ExtractorContext) => ExtractorResult<T> | Promise<ExtractorResult<T>>;
}

// ============================================================================
// Endpoint Types
// ============================================================================

/**
 * Options for endpoint definition
 */
export interface EndpointOptions {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  /** Route path */
  path: string;
  /** Route tags for OpenAPI */
  tags?: string[];
  /** Route summary for OpenAPI */
  summary?: string;
  /** Route description for OpenAPI */
  description?: string;
  /** Deprecated flag */
  deprecated?: boolean;
  /** Required permissions */
  permissions?: string[];
  /** Rate limit override */
  rateLimit?: {
    limit: number;
    window: number;
  };
}

/**
 * Endpoint handler context
 */
export interface EndpointContext extends ExtractorContext {
  /** Application state */
  state: Record<string, unknown>;
  /** Session data */
  session?: Record<string, unknown>;
  /** Authenticated user */
  user?: Record<string, unknown>;
}

/**
 * Endpoint handler
 */
export type EndpointHandler<TInput, TOutput> = (
  input: TInput,
  ctx: EndpointContext
) => TOutput | Promise<TOutput>;

// ============================================================================
// Response Types
// ============================================================================

/**
 * Options for responses
 */
export interface ResponseOptions {
  /** Content type */
  contentType?: string;
  /** Response headers */
  headers?: Record<string, string>;
  /** HTTP status code */
  status?: number;
  /** Enable caching */
  cache?: boolean;
  /** Cache TTL in seconds */
  cacheTTL?: number;
}

/**
 * HTML response options
 */
export interface HtmlResponseOptions extends ResponseOptions {
  /** Document title */
  title?: string;
  /** Meta tags */
  meta?: MetaTag[];
  /** Scripts to include */
  scripts?: Script[];
  /** Stylesheets to include */
  styles?: string[];
  /** Inject hydration data */
  hydrationData?: unknown;
}

/**
 * JSON response options
 */
export interface JsonResponseOptions extends ResponseOptions {
  /** Pretty print JSON */
  pretty?: boolean;
}

/**
 * Stream response options
 */
export interface StreamResponseOptions extends ResponseOptions {
  /** Chunk size in bytes */
  chunkSize?: number;
  /** Flush interval in ms */
  flushInterval?: number;
}

/**
 * Meta tag definition
 */
export interface MetaTag {
  name?: string;
  property?: string;
  content: string;
  httpEquiv?: string;
}

/**
 * Script definition
 */
export interface Script {
  src?: string;
  content?: string;
  type?: string;
  async?: boolean;
  defer?: boolean;
  module?: boolean;
}

// ============================================================================
// WebSocket Types
// ============================================================================

/**
 * WebSocket connection options
 */
export interface WebSocketOptions {
  /** Maximum message size in bytes */
  maxMessageSize?: number;
  /** Maximum frame size in bytes */
  maxFrameSize?: number;
  /** Enable compression */
  compression?: boolean;
  /** Heartbeat interval in ms */
  heartbeatInterval?: number;
  /** Connection timeout in ms */
  timeout?: number;
}

/**
 * WebSocket message
 */
export interface WebSocketMessage {
  /** Message type */
  type: 'text' | 'binary' | 'ping' | 'pong' | 'close';
  /** Message data */
  data: string | Uint8Array;
}

/**
 * WebSocket connection
 */
export interface WebSocketConnection {
  /** Connection ID */
  id: string;
  /** Send a text message */
  send: (data: string) => Promise<void>;
  /** Send binary data */
  sendBinary: (data: Uint8Array) => Promise<void>;
  /** Close the connection */
  close: (code?: number, reason?: string) => Promise<void>;
  /** Check if connected */
  isConnected: () => boolean;
}

/**
 * LiveView handler
 */
export interface LiveViewHandler<S> {
  /** Called when connection is established */
  onConnect?: (socket: WebSocketConnection) => S | Promise<S>;
  /** Called when a message is received */
  onMessage?: (message: LiveViewMessage, state: S, socket: WebSocketConnection) => S | Promise<S>;
  /** Called when connection is closed */
  onClose?: (state: S) => void | Promise<void>;
  /** Render state to HTML */
  render: (state: S) => string;
}

/**
 * LiveView message from client
 */
export interface LiveViewMessage {
  /** Event type */
  event: string;
  /** Target element */
  target?: string;
  /** Event payload */
  payload: unknown;
}

/**
 * LiveView patch to send to client
 */
export interface LiveViewPatch {
  /** Patch operation */
  op: 'replace' | 'append' | 'prepend' | 'remove' | 'setAttribute' | 'removeAttribute';
  /** Target selector */
  target: string;
  /** HTML content (for replace/append/prepend) */
  html?: string;
  /** Attribute name (for setAttribute/removeAttribute) */
  attr?: string;
  /** Attribute value (for setAttribute) */
  value?: string;
}

// ============================================================================
// OpenAPI Types
// ============================================================================

/**
 * OpenAPI operation info
 */
export interface OpenAPIOperation {
  /** Operation ID */
  operationId?: string;
  /** Summary */
  summary?: string;
  /** Description */
  description?: string;
  /** Tags */
  tags?: string[];
  /** Deprecated flag */
  deprecated?: boolean;
  /** Request body schema */
  requestBody?: OpenAPISchema;
  /** Response schemas */
  responses?: Record<string, OpenAPIResponse>;
  /** Security requirements */
  security?: OpenAPISecurity[];
}

/**
 * OpenAPI schema
 */
export interface OpenAPISchema {
  type?: string;
  format?: string;
  description?: string;
  required?: boolean | string[];
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  enum?: unknown[];
  default?: unknown;
  example?: unknown;
  /** Minimum string length */
  minLength?: number;
  /** Maximum string length */
  maxLength?: number;
  /** String pattern (regex) */
  pattern?: string;
  /** Minimum value for numbers */
  minimum?: number;
  /** Maximum value for numbers */
  maximum?: number;
  /** Minimum array items */
  minItems?: number;
  /** Maximum array items */
  maxItems?: number;
  /** Whether items must be unique */
  uniqueItems?: boolean;
  /** Additional properties allowed */
  additionalProperties?: boolean | OpenAPISchema;
  /** Reference to another schema */
  $ref?: string;
}

/**
 * OpenAPI response
 */
export interface OpenAPIResponse {
  description: string;
  content?: Record<string, { schema: OpenAPISchema }>;
}

/**
 * OpenAPI security requirement
 */
export interface OpenAPISecurity {
  [key: string]: string[];
}
