/**
 * Edge Functions Utilities
 *
 * Helpers for building edge functions across providers:
 * - Request/Response helpers
 * - Context management
 * - Error handling
 * - Middleware composition
 * - Request validation
 */
export interface EdgeContext {
    request: Request;
    env: Record<string, unknown>;
    waitUntil: (promise: Promise<unknown>) => void;
    passThroughOnException: () => void;
    params?: Record<string, string>;
    state?: Map<string, unknown>;
}
export type EdgeHandler = (ctx: EdgeContext) => Promise<Response>;
export type EdgeMiddleware = (ctx: EdgeContext, next: () => Promise<Response>) => Promise<Response>;
export interface EdgeFunctionConfig {
    /** Allowed HTTP methods */
    methods?: string[];
    /** CORS configuration */
    cors?: CORSConfig;
    /** Timeout in milliseconds */
    timeout?: number;
    /** Cache configuration */
    cache?: EdgeCacheConfig;
    /** Request validation schema */
    validate?: ValidationSchema;
}
export interface CORSConfig {
    origins?: string[] | '*';
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
    maxAge?: number;
}
export interface EdgeCacheConfig {
    /** Cache TTL in seconds */
    ttl?: number;
    /** Cache key function */
    key?: (request: Request) => string;
    /** Stale-while-revalidate */
    staleWhileRevalidate?: number;
    /** Cache tags */
    tags?: string[];
}
export interface ValidationSchema {
    body?: Record<string, FieldValidation>;
    query?: Record<string, FieldValidation>;
    headers?: Record<string, FieldValidation>;
    params?: Record<string, FieldValidation>;
}
export interface FieldValidation {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
}
/**
 * Create edge function handler
 */
export declare function createEdgeFunction(handler: EdgeHandler, config?: EdgeFunctionConfig): EdgeHandler;
/**
 * Compose middleware
 */
export declare function compose(...middlewares: EdgeMiddleware[]): EdgeMiddleware;
/**
 * Apply middleware to handler
 */
export declare function applyMiddleware(handler: EdgeHandler, ...middlewares: EdgeMiddleware[]): EdgeHandler;
/**
 * Error handling middleware
 */
export declare function errorHandler(onError?: (error: Error, ctx: EdgeContext) => Response | Promise<Response>): EdgeMiddleware;
/**
 * Logging middleware
 */
export declare function logger(options?: {
    level?: 'debug' | 'info' | 'warn' | 'error';
    format?: (ctx: EdgeContext, duration: number, status: number) => string;
}): EdgeMiddleware;
/**
 * Timing middleware
 */
export declare function timing(): EdgeMiddleware;
/**
 * Request body parser middleware
 */
export declare function bodyParser(): EdgeMiddleware;
/**
 * Authentication middleware
 */
export declare function auth(authenticate: (ctx: EdgeContext) => Promise<{
    valid: boolean;
    user?: unknown;
}>): EdgeMiddleware;
/**
 * Bearer token authentication
 */
export declare function bearerAuth(validateToken: (token: string) => Promise<{
    valid: boolean;
    user?: unknown;
}>): EdgeMiddleware;
/**
 * API key authentication
 */
export declare function apiKeyAuth(validateKey: (key: string) => Promise<{
    valid: boolean;
    user?: unknown;
}>, headerName?: string): EdgeMiddleware;
/**
 * JSON response helper
 */
export declare function json<T>(data: T, init?: ResponseInit): Response;
/**
 * HTML response helper
 */
export declare function html(content: string, init?: ResponseInit): Response;
/**
 * Text response helper
 */
export declare function text(content: string, init?: ResponseInit): Response;
/**
 * Redirect response helper
 */
export declare function redirect(url: string, status?: 301 | 302 | 303 | 307 | 308): Response;
/**
 * Stream response helper
 */
export declare function stream(generator: () => AsyncGenerator<Uint8Array | string>, init?: ResponseInit): Response;
//# sourceMappingURL=edge-functions.d.ts.map