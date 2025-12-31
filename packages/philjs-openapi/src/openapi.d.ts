/**
 * PhilJS OpenAPI - Spec Generator
 *
 * Automatic OpenAPI specification generation from PhilJS API definitions.
 * Inspired by Elysia's elegant API documentation.
 */
import type { APIDefinition, OpenAPISpec, OpenAPIOptions, OpenAPIResponse, RouteGroup } from './types.js';
/**
 * Create typed API definition helper
 */
export declare function createAPI<T extends APIDefinition>(routes: T): T;
/**
 * Create route group
 */
export declare function group(config: RouteGroup): RouteGroup;
/**
 * Generate OpenAPI specification from API definition
 */
export declare function openapi(api: APIDefinition | RouteGroup | RouteGroup[], options: OpenAPIOptions): OpenAPISpec;
/**
 * Merge multiple API definitions
 */
export declare function mergeAPIs(...apis: APIDefinition[]): APIDefinition;
/**
 * Create common security schemes
 */
export declare const securitySchemes: {
    /**
     * Bearer token authentication
     */
    bearer: (format?: string) => {
        type: "http";
        scheme: string;
        bearerFormat: string;
    };
    /**
     * API key authentication
     */
    apiKey: (name: string, location?: "header" | "query" | "cookie") => {
        type: "apiKey";
        name: string;
        in: "header" | "cookie" | "query";
    };
    /**
     * Basic authentication
     */
    basic: () => {
        type: "http";
        scheme: string;
    };
    /**
     * OAuth2 with authorization code flow
     */
    oauth2AuthorizationCode: (config: {
        authorizationUrl: string;
        tokenUrl: string;
        scopes: Record<string, string>;
        refreshUrl?: string;
    }) => {
        type: "oauth2";
        flows: {
            authorizationCode: {
                authorizationUrl: string;
                tokenUrl: string;
                refreshUrl: string | undefined;
                scopes: Record<string, string>;
            };
        };
    };
    /**
     * OAuth2 with client credentials flow
     */
    oauth2ClientCredentials: (config: {
        tokenUrl: string;
        scopes: Record<string, string>;
        refreshUrl?: string;
    }) => {
        type: "oauth2";
        flows: {
            clientCredentials: {
                tokenUrl: string;
                refreshUrl: string | undefined;
                scopes: Record<string, string>;
            };
        };
    };
    /**
     * OpenID Connect
     */
    openIdConnect: (openIdConnectUrl: string) => {
        type: "openIdConnect";
        openIdConnectUrl: string;
    };
};
/**
 * Create common error responses
 */
export declare const errorResponses: {
    badRequest: (description?: string) => OpenAPIResponse;
    unauthorized: (description?: string) => OpenAPIResponse;
    forbidden: (description?: string) => OpenAPIResponse;
    notFound: (description?: string) => OpenAPIResponse;
    serverError: (description?: string) => OpenAPIResponse;
};
//# sourceMappingURL=openapi.d.ts.map