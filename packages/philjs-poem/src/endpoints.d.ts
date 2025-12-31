/**
 * PhilJS Poem Endpoints
 *
 * Endpoint helpers for the Poem framework integration.
 * Poem has excellent support for OpenAPI, which we leverage here.
 */
import type { EndpointOptions, EndpointHandler, OpenAPIOperation } from './types.js';
/**
 * HTTP method type
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
/**
 * Endpoint definition
 */
export interface EndpointDefinition<TInput = unknown, TOutput = unknown> {
    method: HttpMethod;
    path: string;
    options: EndpointOptions;
    handler: EndpointHandler<TInput, TOutput>;
    openapi?: OpenAPIOperation;
}
/**
 * Endpoint builder for type-safe route creation
 */
export declare class EndpointBuilder<TInput = void, TOutput = void> {
    private def;
    /**
     * Set HTTP method to GET
     */
    get(path: string): EndpointBuilder<TInput, TOutput>;
    /**
     * Set HTTP method to POST
     */
    post(path: string): EndpointBuilder<TInput, TOutput>;
    /**
     * Set HTTP method to PUT
     */
    put(path: string): EndpointBuilder<TInput, TOutput>;
    /**
     * Set HTTP method to PATCH
     */
    patch(path: string): EndpointBuilder<TInput, TOutput>;
    /**
     * Set HTTP method to DELETE
     */
    delete(path: string): EndpointBuilder<TInput, TOutput>;
    /**
     * Set HTTP method and path
     */
    method(method: HttpMethod, path: string): EndpointBuilder<TInput, TOutput>;
    /**
     * Add OpenAPI tags
     */
    tags(...tags: string[]): this;
    /**
     * Add OpenAPI summary
     */
    summary(summary: string): this;
    /**
     * Add OpenAPI description
     */
    description(description: string): this;
    /**
     * Mark as deprecated
     */
    deprecated(): this;
    /**
     * Require permissions
     */
    permissions(...permissions: string[]): this;
    /**
     * Set custom rate limit
     */
    rateLimit(limit: number, window: number): this;
    /**
     * Set input type (for TypeScript inference)
     */
    input<T>(): EndpointBuilder<T, TOutput>;
    /**
     * Set output type (for TypeScript inference)
     */
    output<T>(): EndpointBuilder<TInput, T>;
    /**
     * Set the handler function
     */
    handler(fn: EndpointHandler<TInput, TOutput>): EndpointDefinition<TInput, TOutput>;
    /**
     * Add OpenAPI operation details
     */
    openapi(operation: OpenAPIOperation): this;
}
/**
 * Create a new endpoint builder
 */
export declare function endpoint(): EndpointBuilder;
/**
 * Route group for organizing related endpoints
 */
export declare class RouteGroup {
    private prefix;
    private endpoints;
    private middleware;
    private tags;
    constructor(prefix: string);
    /**
     * Add middleware to the group
     */
    use(middleware: string): this;
    /**
     * Add tags to all endpoints in the group
     */
    tag(...tags: string[]): this;
    /**
     * Add an endpoint to the group
     */
    add<TInput, TOutput>(endpoint: EndpointDefinition<TInput, TOutput>): this;
    /**
     * Create a nested group
     */
    group(prefix: string): RouteGroup;
    /**
     * Get all endpoints
     */
    getEndpoints(): EndpointDefinition[];
    /**
     * Generate Rust router code
     */
    toRustCode(): string;
    private routerName;
    private handlerName;
}
/**
 * Create a route group
 */
export declare function group(prefix: string): RouteGroup;
/**
 * OpenAPI endpoint builder for Poem OpenAPI
 */
export declare class OpenAPIEndpointBuilder {
    private operations;
    /**
     * Define a GET operation
     */
    get(path: string, operation: OpenAPIOperation): this;
    /**
     * Define a POST operation
     */
    post(path: string, operation: OpenAPIOperation): this;
    /**
     * Define a PUT operation
     */
    put(path: string, operation: OpenAPIOperation): this;
    /**
     * Define a DELETE operation
     */
    delete(path: string, operation: OpenAPIOperation): this;
    /**
     * Generate Rust OpenAPI code
     */
    toRustCode(): string;
}
/**
 * Create an OpenAPI endpoint builder
 */
export declare function openapi(): OpenAPIEndpointBuilder;
/**
 * CRUD endpoint options
 */
export interface CRUDOptions {
    /** Resource name */
    resource: string;
    /** Path prefix */
    path?: string;
    /** OpenAPI tags */
    tags?: string[];
    /** Enable list endpoint */
    list?: boolean;
    /** Enable get endpoint */
    get?: boolean;
    /** Enable create endpoint */
    create?: boolean;
    /** Enable update endpoint */
    update?: boolean;
    /** Enable delete endpoint */
    delete?: boolean;
}
/**
 * Generate CRUD endpoints for a resource
 */
export declare function crud(options: CRUDOptions): RouteGroup;
/**
 * SSR page endpoint options
 */
export interface SSRPageOptions {
    /** Page path */
    path: string;
    /** Page title */
    title?: string;
    /** Page component */
    component: string;
    /** Data loader */
    loader?: () => Promise<unknown>;
}
/**
 * Create an SSR page endpoint
 */
export declare function ssrPage(options: SSRPageOptions): EndpointDefinition<unknown, {
    component: string;
    title: string | undefined;
    data: unknown;
    path: string;
}>;
/**
 * Create SSR page group
 */
export declare function ssrPages(pages: SSRPageOptions[]): RouteGroup;
/**
 * Create a JSON API endpoint
 */
export declare function apiEndpoint<TInput, TOutput>(method: HttpMethod, path: string, handler: EndpointHandler<TInput, TOutput>): EndpointDefinition<TInput, TOutput>;
/**
 * Create a health check endpoint
 */
export declare function healthCheck(path?: string): EndpointDefinition<unknown, {
    status: string;
    timestamp: string;
}>;
/**
 * Create a readiness probe endpoint
 */
export declare function readinessProbe(path?: string, checks?: Array<{
    name: string;
    check: () => Promise<boolean>;
}>): EndpointDefinition<unknown, {
    ready: boolean;
    checks: Record<string, boolean>;
    timestamp: string;
}>;
//# sourceMappingURL=endpoints.d.ts.map