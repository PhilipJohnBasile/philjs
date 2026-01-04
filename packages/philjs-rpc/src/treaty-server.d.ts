/**
 * Server-side utilities for treaty client support.
 * Provides route metadata extraction and type generation helpers.
 */
import type { Router, ProcedureType, APIDefinition } from './types.js';
/**
 * Metadata for a single route/procedure.
 */
export interface RouteMetadata {
    /** Full path to the procedure */
    path: string;
    /** Procedure type (query/mutation) */
    type: ProcedureType;
    /** Input schema information */
    input?: {
        /** Whether input is required */
        required: boolean;
        /** Schema type name */
        schemaType?: string;
    };
    /** Output type information */
    output?: {
        /** Output type name */
        typeName?: string;
    };
    /** Supported HTTP methods */
    methods: string[];
    /** Path parameters */
    pathParams?: string[];
    /** Middleware count */
    middlewareCount: number;
    /** Tags for categorization */
    tags?: string[];
    /** Description */
    description?: string;
}
/**
 * API metadata containing all routes.
 */
export interface APIMetadata {
    /** All routes in the API */
    routes: RouteMetadata[];
    /** API version */
    version?: string;
    /** API title */
    title?: string;
    /** API description */
    description?: string;
}
/**
 * Extract metadata from an API definition.
 *
 * @example
 * ```ts
 * import { extractAPIMetadata } from 'philjs-rpc/treaty-server';
 * import { api } from './api';
 *
 * const metadata = extractAPIMetadata(api);
 * console.log(metadata.routes);
 * ```
 */
export declare function extractAPIMetadata<TRouter extends Router>(api: APIDefinition<TRouter>, options?: {
    version?: string;
    title?: string;
    description?: string;
}): APIMetadata;
/**
 * OpenAPI schema information.
 */
export interface OpenAPISchema {
    type: string;
    properties?: Record<string, OpenAPISchema>;
    items?: OpenAPISchema;
    required?: string[];
    description?: string;
    enum?: unknown[];
    format?: string;
    [key: string]: unknown;
}
/**
 * OpenAPI operation.
 */
export interface OpenAPIOperation {
    operationId: string;
    summary?: string;
    description?: string;
    tags?: string[];
    parameters?: Array<{
        name: string;
        in: 'query' | 'path' | 'header' | 'cookie';
        required?: boolean;
        schema: OpenAPISchema;
    }>;
    requestBody?: {
        required?: boolean;
        content: {
            'application/json': {
                schema: OpenAPISchema;
            };
        };
    };
    responses: {
        [statusCode: string]: {
            description: string;
            content?: {
                'application/json': {
                    schema: OpenAPISchema;
                };
            };
        };
    };
}
/**
 * Generate OpenAPI specification from API metadata.
 *
 * @example
 * ```ts
 * import { extractAPIMetadata, generateOpenAPI } from 'philjs-rpc/treaty-server';
 * import { api } from './api';
 *
 * const metadata = extractAPIMetadata(api, {
 *   title: 'My API',
 *   version: '1.0.0',
 * });
 *
 * const openapi = generateOpenAPI(metadata);
 * ```
 */
export declare function generateOpenAPI(metadata: APIMetadata): {
    openapi: string;
    info: {
        title: string;
        version: string;
        description?: string;
    };
    paths: Record<string, Record<string, OpenAPIOperation>>;
};
/**
 * Options for type generation.
 */
export interface TypeGenerationOptions {
    /** Output file path */
    output?: string;
    /** Include comments */
    includeComments?: boolean;
    /** Export type name */
    exportName?: string;
    /** Include client helper types */
    includeHelpers?: boolean;
}
/**
 * Generate TypeScript type definitions from API metadata.
 *
 * @example
 * ```ts
 * import { extractAPIMetadata, generateTypeDefinitions } from 'philjs-rpc/treaty-server';
 * import { api } from './api';
 *
 * const metadata = extractAPIMetadata(api);
 * const types = generateTypeDefinitions(metadata, {
 *   exportName: 'AppAPI',
 *   includeHelpers: true,
 * });
 *
 * console.log(types);
 * ```
 */
export declare function generateTypeDefinitions(metadata: APIMetadata, options?: TypeGenerationOptions): string;
/**
 * Validate that a client request matches server API.
 */
export declare function validateRequest<TRouter extends Router>(api: APIDefinition<TRouter>, path: string, method: string): {
    valid: boolean;
    error?: string;
};
/**
 * Print API routes to console in a readable format.
 *
 * @example
 * ```ts
 * import { printAPIRoutes } from 'philjs-rpc/treaty-server';
 * import { api } from './api';
 *
 * printAPIRoutes(api);
 * ```
 */
export declare function printAPIRoutes<TRouter extends Router>(api: APIDefinition<TRouter>, options?: {
    /** Include middleware info */
    includeMiddleware?: boolean;
    /** Color output */
    colors?: boolean;
}): void;
/**
 * Export routes as JSON.
 */
export declare function exportRoutesJSON<TRouter extends Router>(api: APIDefinition<TRouter>, options?: {
    pretty?: boolean;
}): string;
/**
 * Type guard to check if a value is a Router.
 */
export declare function isRouter(value: unknown): value is Router;
/**
 * Get all procedure paths from a router.
 */
export declare function getAllPaths<TRouter extends Router>(router: TRouter): string[];
/**
 * Get procedure count.
 */
export declare function getProcedureCount<TRouter extends Router>(router: TRouter): {
    total: number;
    queries: number;
    mutations: number;
};
//# sourceMappingURL=treaty-server.d.ts.map