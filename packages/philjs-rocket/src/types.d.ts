/**
 * PhilJS Rocket Types
 *
 * Type definitions for Rocket framework integration.
 */
/**
 * Main configuration for PhilJS Rocket integration
 */
export interface RocketConfig {
    /** SSR configuration */
    ssr?: RocketSSRConfig;
    /** LiveView configuration */
    liveview?: RocketLiveViewConfig;
    /** CORS configuration */
    cors?: RocketCORSConfig;
    /** Security headers configuration */
    security?: RocketSecurityConfig;
    /** Static files configuration */
    staticFiles?: RocketStaticConfig;
    /** Session configuration */
    session?: RocketSessionConfig;
}
/**
 * SSR configuration options
 */
export interface RocketSSRConfig {
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
    /** Preload data for SSR */
    preloadData?: boolean;
}
/**
 * LiveView configuration options
 */
export interface RocketLiveViewConfig {
    /** Enable LiveView */
    enabled?: boolean;
    /** WebSocket heartbeat interval in ms */
    heartbeatInterval?: number;
    /** Connection timeout in ms */
    timeout?: number;
    /** Maximum concurrent connections */
    maxConnections?: number;
    /** Enable compression */
    compression?: boolean;
}
/**
 * CORS configuration options
 */
export interface RocketCORSConfig {
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
export interface RocketSecurityConfig {
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
 * Static files configuration
 */
export interface RocketStaticConfig {
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
/**
 * Session configuration
 */
export interface RocketSessionConfig {
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
 * Context passed to fairings
 */
export interface FairingContext {
    /** Request method */
    method: string;
    /** Request path */
    path: string;
    /** Request headers */
    headers: Record<string, string>;
    /** Query parameters */
    query: Record<string, string>;
    /** Remote address */
    remoteAddr?: string;
    /** Request ID */
    requestId: string;
}
/**
 * Fairing response modification
 */
export interface FairingResponse {
    /** Modified headers */
    headers?: Record<string, string>;
    /** Modified status code */
    status?: number;
    /** Abort the request */
    abort?: boolean;
    /** Redirect URL */
    redirect?: string;
}
/**
 * Fairing lifecycle hooks
 */
export interface FairingHooks {
    /** Called on rocket ignite */
    onIgnite?: () => void | Promise<void>;
    /** Called on rocket liftoff */
    onLiftoff?: () => void | Promise<void>;
    /** Called on request */
    onRequest?: (ctx: FairingContext) => FairingResponse | void | Promise<FairingResponse | void>;
    /** Called on response */
    onResponse?: (ctx: FairingContext, status: number) => FairingResponse | void | Promise<FairingResponse | void>;
    /** Called on shutdown */
    onShutdown?: () => void | Promise<void>;
}
/**
 * Context passed to request guards
 */
export interface GuardContext {
    /** Request method */
    method: string;
    /** Request path */
    path: string;
    /** Request headers */
    headers: Record<string, string>;
    /** Cookies */
    cookies: Record<string, string>;
    /** Session data */
    session?: Record<string, unknown>;
    /** Query parameters */
    query: Record<string, string>;
    /** Path parameters */
    params: Record<string, string>;
}
/**
 * Guard outcome
 */
export type GuardOutcome<T> = {
    success: true;
    value: T;
} | {
    success: false;
    error: string;
    status?: number;
};
/**
 * Request guard definition
 */
export interface GuardDefinition<T> {
    /** Guard name */
    name: string;
    /** Validate the request */
    validate: (ctx: GuardContext) => GuardOutcome<T> | Promise<GuardOutcome<T>>;
}
/**
 * Options for custom responders
 */
export interface ResponderOptions {
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
export interface HtmlResponderOptions extends ResponderOptions {
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
export interface JsonResponderOptions extends ResponderOptions {
    /** Pretty print JSON */
    pretty?: boolean;
}
/**
 * Stream response options
 */
export interface StreamResponderOptions extends ResponderOptions {
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
/**
 * Template context data
 */
export interface TemplateContext {
    /** Page title */
    title?: string;
    /** Template data */
    data: Record<string, unknown>;
    /** Flash messages */
    flash?: FlashMessage[];
    /** Current user (if authenticated) */
    user?: Record<string, unknown>;
    /** CSRF token */
    csrfToken?: string;
    /** Request path */
    path?: string;
}
/**
 * Flash message
 */
export interface FlashMessage {
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
}
/**
 * Template engine options
 */
export interface TemplateEngineOptions {
    /** Template directory */
    templateDir?: string;
    /** Template extension */
    extension?: string;
    /** Enable caching */
    cache?: boolean;
    /** Custom helpers */
    helpers?: Record<string, TemplateHelper>;
}
/**
 * Template helper function
 */
export type TemplateHelper = (...args: unknown[]) => string;
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
 * LiveView WebSocket handler
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
//# sourceMappingURL=types.d.ts.map