/**
 * PhilJS API Server Utilities
 *
 * Create and handle API routes with type safety.
 */
export interface APIRequest {
    /** Request URL */
    url: URL;
    /** HTTP method */
    method: string;
    /** Request headers */
    headers: Headers;
    /** URL parameters */
    params: Record<string, string>;
    /** Query parameters */
    query: Record<string, string>;
    /** Request body (parsed) */
    body: unknown;
    /** Raw request body */
    rawBody: string | null;
    /** Original Request object */
    raw: Request;
}
export interface APIContext {
    /** The request */
    request: APIRequest;
    /** Response helpers */
    response: ResponseHelpers;
    /** Get a cookie */
    getCookie: (name: string) => string | undefined;
    /** Set a cookie */
    setCookie: (name: string, value: string, options?: CookieOptions) => void;
    /** Delete a cookie */
    deleteCookie: (name: string) => void;
    /** Get session */
    getSession: () => Promise<Session>;
    /** Platform-specific context */
    platform?: unknown;
    /** Environment variables */
    env: Record<string, string | undefined>;
}
export interface ResponseHelpers {
    /** Set response header */
    setHeader: (name: string, value: string) => void;
    /** Set response status */
    setStatus: (status: number) => void;
    /** Append to response headers */
    appendHeader: (name: string, value: string) => void;
}
export interface CookieOptions {
    maxAge?: number;
    expires?: Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
}
export interface Session {
    id: string;
    data: Record<string, unknown>;
    get: <T>(key: string) => T | undefined;
    set: (key: string, value: unknown) => void;
    delete: (key: string) => void;
    clear: () => void;
}
export type APIHandler = (context: APIContext) => Response | Promise<Response>;
export type RouteHandler = {
    GET?: APIHandler;
    POST?: APIHandler;
    PUT?: APIHandler;
    PATCH?: APIHandler;
    DELETE?: APIHandler;
    HEAD?: APIHandler;
    OPTIONS?: APIHandler;
};
export interface APIResponse {
    status: number;
    headers: Headers;
    body: unknown;
}
/**
 * Create an API handler from route handlers
 */
export declare function createAPIHandler(handlers: RouteHandler): APIHandler;
/**
 * Define an API route with type safety
 */
export declare function defineAPIRoute<TBody = unknown, TResponse = unknown>(config: {
    method?: string | string[];
    handler: (context: APIContext & {
        request: APIRequest & {
            body: TBody;
        };
    }) => Response | Promise<Response>;
    middleware?: Array<(context: APIContext, next: () => Promise<Response>) => Promise<Response>>;
}): APIHandler;
/**
 * JSON response helper
 */
export declare function json<T>(data: T, init?: ResponseInit): Response;
/**
 * Text response helper
 */
export declare function text(data: string, init?: ResponseInit): Response;
/**
 * HTML response helper
 */
export declare function html(data: string, init?: ResponseInit): Response;
/**
 * Redirect response helper
 */
export declare function redirect(url: string, status?: 301 | 302 | 303 | 307 | 308): Response;
/**
 * Not found response helper
 */
export declare function notFound(message?: string): Response;
/**
 * Bad request response helper
 */
export declare function badRequest(message?: string, errors?: Record<string, string[]>): Response;
/**
 * Unauthorized response helper
 */
export declare function unauthorized(message?: string): Response;
/**
 * Forbidden response helper
 */
export declare function forbidden(message?: string): Response;
/**
 * Server error response helper
 */
export declare function serverError(message?: string): Response;
/**
 * Parse request body based on content type
 */
export declare function parseBody(request: Request): Promise<unknown>;
/**
 * Create API context from request
 */
export declare function createAPIContext(request: Request, params?: Record<string, string>, platform?: unknown): Promise<APIContext>;
//# sourceMappingURL=server.d.ts.map