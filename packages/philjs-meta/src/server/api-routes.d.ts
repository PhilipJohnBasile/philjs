/**
 * PhilJS Meta - API Route Handlers
 *
 * Implements type-safe API route handlers with:
 * - GET, POST, PUT, PATCH, DELETE handlers
 * - Type-safe request/response
 * - Schema validation
 * - Error handling
 */
import type { MiddlewareContext, MiddlewareFunction } from './middleware';
/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
/**
 * API request context
 */
export interface APIContext<Params = Record<string, string | string[]>, Body = unknown, Query = Record<string, string | string[]>> {
    /** Request object */
    request: Request;
    /** Route parameters */
    params: Params;
    /** Query parameters */
    query: Query;
    /** Parsed request body */
    body: Body;
    /** Request headers */
    headers: Headers;
    /** Response headers to set */
    responseHeaders: Headers;
    /** Request cookies */
    cookies: Record<string, string>;
    /** Request ID */
    requestId: string;
    /** Client IP */
    ip: string;
    /** Local storage from middleware */
    locals: Map<string, unknown>;
}
/**
 * API response helpers
 */
export declare const APIResponse: {
    /**
     * JSON response
     */
    json<T>(data: T, init?: ResponseInit): Response;
    /**
     * Success response
     */
    ok<T>(data: T, init?: ResponseInit): Response;
    /**
     * Created response (201)
     */
    created<T>(data: T, init?: ResponseInit): Response;
    /**
     * No content response (204)
     */
    noContent(): Response;
    /**
     * Bad request response (400)
     */
    badRequest(message?: string, errors?: Record<string, string[]>): Response;
    /**
     * Unauthorized response (401)
     */
    unauthorized(message?: string): Response;
    /**
     * Forbidden response (403)
     */
    forbidden(message?: string): Response;
    /**
     * Not found response (404)
     */
    notFound(message?: string): Response;
    /**
     * Method not allowed response (405)
     */
    methodNotAllowed(allowed: HttpMethod[]): Response;
    /**
     * Conflict response (409)
     */
    conflict(message?: string): Response;
    /**
     * Unprocessable entity response (422)
     */
    unprocessableEntity(errors: Record<string, string[]>): Response;
    /**
     * Too many requests response (429)
     */
    tooManyRequests(retryAfter: number): Response;
    /**
     * Internal server error response (500)
     */
    internalError(message?: string): Response;
    /**
     * Redirect response
     */
    redirect(url: string, status?: 301 | 302 | 303 | 307 | 308): Response;
    /**
     * Stream response
     */
    stream(stream: ReadableStream, contentType?: string, init?: ResponseInit): Response;
    /**
     * SSE (Server-Sent Events) response
     */
    sse(stream: ReadableStream<string>): Response;
};
/**
 * API handler function type
 */
export type APIHandler<Params = Record<string, string | string[]>, Body = unknown, Query = Record<string, string | string[]>> = (context: APIContext<Params, Body, Query>) => Response | Promise<Response>;
/**
 * Route handler configuration
 */
export interface RouteHandlerConfig<Params = Record<string, string | string[]>, Body = unknown, Query = Record<string, string | string[]>> {
    /** Handler for GET requests */
    GET?: APIHandler<Params, Body, Query>;
    /** Handler for POST requests */
    POST?: APIHandler<Params, Body, Query>;
    /** Handler for PUT requests */
    PUT?: APIHandler<Params, Body, Query>;
    /** Handler for PATCH requests */
    PATCH?: APIHandler<Params, Body, Query>;
    /** Handler for DELETE requests */
    DELETE?: APIHandler<Params, Body, Query>;
    /** Handler for HEAD requests */
    HEAD?: APIHandler<Params, Body, Query>;
    /** Handler for OPTIONS requests */
    OPTIONS?: APIHandler<Params, Body, Query>;
    /** Middleware for this route */
    middleware?: MiddlewareFunction[];
    /** Request body schema for validation */
    bodySchema?: Schema<Body>;
    /** Query params schema for validation */
    querySchema?: Schema<Query>;
}
/**
 * Simple schema interface for validation
 */
export interface Schema<T> {
    parse(data: unknown): T;
    safeParse(data: unknown): {
        success: true;
        data: T;
    } | {
        success: false;
        error: SchemaError;
    };
}
/**
 * Schema error
 */
export interface SchemaError {
    message: string;
    path: (string | number)[];
    issues: SchemaIssue[];
}
export interface SchemaIssue {
    message: string;
    path: (string | number)[];
    code: string;
}
/**
 * Create API route handler
 */
export declare function createAPIRoute<Params = Record<string, string | string[]>, Body = unknown, Query = Record<string, string | string[]>>(config: RouteHandlerConfig<Params, Body, Query>): APIRouteHandler;
/**
 * API route handler interface
 */
export interface APIRouteHandler {
    allowedMethods: HttpMethod[];
    config: RouteHandlerConfig;
    handle(context: MiddlewareContext): Promise<Response>;
}
/**
 * Type-safe route parameter extractor
 */
export type ExtractParams<T extends string> = T extends `${string}[...${infer Param}]${infer Rest}` ? {
    [K in Param]: string[];
} & ExtractParams<Rest> : T extends `${string}[${infer Param}]${infer Rest}` ? {
    [K in Param]: string;
} & ExtractParams<Rest> : Record<string, never>;
/**
 * Create type-safe API handler
 */
export declare function defineAPIHandler<Path extends string, Body = unknown, Query = Record<string, string>>(_path: Path, config: RouteHandlerConfig<ExtractParams<Path>, Body, Query>): APIRouteHandler;
/**
 * SSE (Server-Sent Events) utilities
 */
export declare const SSE: {
    /**
     * Create an SSE stream
     */
    createStream(): SSEStream;
    /**
     * Create an SSE response
     */
    response(handler: (stream: SSEStream) => void | Promise<void>): Response;
};
/**
 * SSE stream interface
 */
export interface SSEStream {
    stream: ReadableStream<string>;
    send(event: SSEEvent): void;
    close(): void;
}
/**
 * SSE event
 */
export interface SSEEvent {
    id?: string;
    event?: string;
    data: unknown;
    retry?: number;
}
/**
 * Request body types
 */
export type JSONBody<T> = T;
export type FormBody = Record<string, string>;
export type MultipartBody = Record<string, string | File>;
/**
 * Type-safe request body parser
 */
export declare function parseBody<T>(request: Request, schema?: Schema<T>): Promise<T>;
/**
 * Zod-like schema builder for simple validation
 */
export declare const z: {
    string(): StringSchema;
    number(): NumberSchema;
    boolean(): BooleanSchema;
    object<T extends Record<string, BaseSchema>>(shape: T): ObjectSchema<T>;
    array<T extends BaseSchema>(schema: T): ArraySchema<T>;
    enum<T extends string>(values: readonly T[]): EnumSchema<T>;
};
/**
 * Base schema class
 */
declare abstract class BaseSchema<T = unknown> implements Schema<T> {
    protected _optional: boolean;
    protected _nullable: boolean;
    abstract parse(data: unknown): T;
    safeParse(data: unknown): {
        success: true;
        data: T;
    } | {
        success: false;
        error: SchemaError;
    };
    optional(): this;
    nullable(): this;
}
declare class StringSchema extends BaseSchema<string> {
    private _minLength?;
    private _maxLength?;
    private _pattern?;
    private _email;
    parse(data: unknown): string;
    min(length: number): this;
    max(length: number): this;
    regex(pattern: RegExp): this;
    email(): this;
}
declare class NumberSchema extends BaseSchema<number> {
    private _min?;
    private _max?;
    private _int;
    parse(data: unknown): number;
    min(value: number): this;
    max(value: number): this;
    int(): this;
}
declare class BooleanSchema extends BaseSchema<boolean> {
    parse(data: unknown): boolean;
}
declare class ObjectSchema<T extends Record<string, BaseSchema>> extends BaseSchema<{
    [K in keyof T]: ReturnType<T[K]['parse']>;
}> {
    private shape;
    constructor(shape: T);
    parse(data: unknown): {
        [K in keyof T]: ReturnType<T[K]['parse']>;
    };
}
declare class ArraySchema<T extends BaseSchema> extends BaseSchema<Array<ReturnType<T['parse']>>> {
    private itemSchema;
    private _minLength?;
    private _maxLength?;
    constructor(itemSchema: T);
    parse(data: unknown): Array<ReturnType<T['parse']>>;
    min(length: number): this;
    max(length: number): this;
}
declare class EnumSchema<T extends string> extends BaseSchema<T> {
    private values;
    constructor(values: readonly T[]);
    parse(data: unknown): T;
}
export {};
//# sourceMappingURL=api-routes.d.ts.map