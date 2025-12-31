/**
 * PhilJS Rocket Handlers
 *
 * Request and response handler utilities for Rocket framework.
 * Provides type-safe request handling and response building.
 */
import type { RouteResponse } from './server.js';
/**
 * HTTP method type
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
/**
 * Request data extracted from Rocket
 */
export interface RequestData {
    /** HTTP method */
    method: HttpMethod;
    /** Request URI */
    uri: string;
    /** Path parameters */
    params: Record<string, string>;
    /** Query parameters */
    query: Record<string, string>;
    /** Request headers */
    headers: Headers;
    /** Cookie values */
    cookies: Record<string, string>;
    /** Request body (parsed) */
    body?: unknown;
    /** Client IP address */
    clientIp?: string;
    /** Content type */
    contentType?: string;
    /** Accept header */
    accept?: string;
}
/**
 * Handler context with typed state
 */
export interface HandlerContext<TState = Record<string, unknown>> {
    /** Request data */
    request: RequestData;
    /** Application state */
    state: TState;
    /** Response builder */
    response: ResponseBuilder;
    /** Cookies */
    cookies: CookieJar;
    /** Session (if available) */
    session?: SessionData;
}
/**
 * Session data
 */
export interface SessionData {
    id: string;
    data: Record<string, unknown>;
    get<T>(key: string): T | undefined;
    set(key: string, value: unknown): void;
    delete(key: string): void;
    clear(): void;
}
/**
 * Cookie jar for managing cookies
 */
export interface CookieJar {
    get(name: string): string | undefined;
    set(name: string, value: string, options?: CookieOptions): void;
    delete(name: string): void;
    getAll(): Record<string, string>;
}
/**
 * Cookie options
 */
export interface CookieOptions {
    maxAge?: number;
    expires?: Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
}
/**
 * Route handler function
 */
export type Handler<TBody = unknown, TResponse = unknown, TState = Record<string, unknown>> = (ctx: HandlerContext<TState> & {
    request: RequestData & {
        body: TBody;
    };
}) => Promise<TResponse> | TResponse;
/**
 * Async handler function
 */
export type AsyncHandler<TBody = unknown, TResponse = unknown> = (ctx: HandlerContext & {
    request: RequestData & {
        body: TBody;
    };
}) => Promise<TResponse>;
/**
 * Middleware function
 */
export type Middleware<TState = Record<string, unknown>> = (ctx: HandlerContext<TState>, next: () => Promise<RouteResponse>) => Promise<RouteResponse>;
/**
 * Response builder for constructing responses
 */
export declare class ResponseBuilder {
    private _status;
    private _headers;
    private _body;
    private _cookies;
    /**
     * Set response status
     */
    status(code: number): this;
    /**
     * Set response header
     */
    header(name: string, value: string): this;
    /**
     * Set multiple headers
     */
    headers(headers: Record<string, string>): this;
    /**
     * Set Content-Type header
     */
    contentType(type: string): this;
    /**
     * Set cache control header
     */
    cache(maxAge: number, options?: {
        public?: boolean;
        immutable?: boolean;
    }): this;
    /**
     * Disable caching
     */
    noCache(): this;
    /**
     * Set a cookie
     */
    cookie(name: string, value: string, options?: CookieOptions): this;
    /**
     * Delete a cookie
     */
    deleteCookie(name: string): this;
    /**
     * Build HTML response
     */
    html(content: string): RouteResponse;
    /**
     * Build JSON response
     */
    json<T>(data: T): RouteResponse;
    /**
     * Build text response
     */
    text(content: string): RouteResponse;
    /**
     * Set response body
     */
    body(content: string | Uint8Array): this;
    /**
     * Build the response
     */
    build(): RouteResponse;
}
/**
 * Create an HTML response
 */
export declare function html(content: string, status?: number): RouteResponse;
/**
 * Create a JSON response
 */
export declare function json<T>(data: T, status?: number): RouteResponse;
/**
 * Create a text response
 */
export declare function text(content: string, status?: number): RouteResponse;
/**
 * Create a redirect response
 */
export declare function redirect(url: string, status?: 301 | 302 | 303 | 307 | 308): RouteResponse;
/**
 * Create a not found response
 */
export declare function notFound(message?: string): RouteResponse;
/**
 * Create a bad request response
 */
export declare function badRequest(message?: string, errors?: Record<string, string[]>): RouteResponse;
/**
 * Create an unauthorized response
 */
export declare function unauthorized(message?: string): RouteResponse;
/**
 * Create a forbidden response
 */
export declare function forbidden(message?: string): RouteResponse;
/**
 * Create a server error response
 */
export declare function serverError(message?: string): RouteResponse;
/**
 * Create a no content response
 */
export declare function noContent(): RouteResponse;
/**
 * Create a created response
 */
export declare function created<T>(data: T, location?: string): RouteResponse;
/**
 * Create a handler with middleware
 */
export declare function withMiddleware<TState = Record<string, unknown>>(handler: Handler<unknown, RouteResponse, TState>, ...middleware: Middleware<TState>[]): Handler<unknown, RouteResponse, TState>;
/**
 * Create a typed handler
 */
export declare function createHandler<TBody = unknown, TResponse = RouteResponse>(handler: Handler<TBody, TResponse>): Handler<TBody, TResponse>;
/**
 * Create an async handler
 */
export declare function createAsyncHandler<TBody = unknown, TResponse = RouteResponse>(handler: AsyncHandler<TBody, TResponse>): AsyncHandler<TBody, TResponse>;
/**
 * Define a GET route handler
 */
export declare function get<TResponse = RouteResponse>(handler: Handler<never, TResponse>): {
    method: 'GET';
    handler: Handler<never, TResponse>;
};
/**
 * Define a POST route handler
 */
export declare function post<TBody = unknown, TResponse = RouteResponse>(handler: Handler<TBody, TResponse>): {
    method: 'POST';
    handler: Handler<TBody, TResponse>;
};
/**
 * Define a PUT route handler
 */
export declare function put<TBody = unknown, TResponse = RouteResponse>(handler: Handler<TBody, TResponse>): {
    method: 'PUT';
    handler: Handler<TBody, TResponse>;
};
/**
 * Define a DELETE route handler
 */
export declare function del<TResponse = RouteResponse>(handler: Handler<never, TResponse>): {
    method: 'DELETE';
    handler: Handler<never, TResponse>;
};
/**
 * Define a PATCH route handler
 */
export declare function patch<TBody = unknown, TResponse = RouteResponse>(handler: Handler<TBody, TResponse>): {
    method: 'PATCH';
    handler: Handler<TBody, TResponse>;
};
/**
 * Parse JSON body
 */
export declare function parseJson<T>(request: Request): Promise<T>;
/**
 * Parse form data
 */
export declare function parseForm(request: Request): Promise<Record<string, string>>;
/**
 * Parse multipart form data
 */
export declare function parseMultipart(request: Request): Promise<FormData>;
/**
 * Get a path parameter
 */
export declare function getParam(ctx: HandlerContext, name: string): string | undefined;
/**
 * Get a required path parameter (throws if missing)
 */
export declare function requireParam(ctx: HandlerContext, name: string): string;
/**
 * Get a query parameter
 */
export declare function getQuery(ctx: HandlerContext, name: string): string | undefined;
/**
 * Get a header value
 */
export declare function getHeader(ctx: HandlerContext, name: string): string | undefined;
/**
 * Generate Rust handler code
 */
export declare function generateRustHandler(name: string, method: HttpMethod, path: string): string;
/**
 * Generate Rust handler with body
 */
export declare function generateRustHandlerWithBody(name: string, method: HttpMethod, path: string, bodyType: string): string;
//# sourceMappingURL=handlers.d.ts.map