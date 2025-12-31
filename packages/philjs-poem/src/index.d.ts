/**
 * PhilJS Poem Integration
 *
 * Poem web framework bindings for PhilJS applications.
 * Provides middleware, extractors, endpoints, and WebSocket support
 * for server-side rendering with PhilJS.
 *
 * Poem is a full-featured, easy-to-use web framework with async Rust.
 * It has excellent OpenAPI support and is designed for both simplicity
 * and performance.
 *
 * @example
 * ```typescript
 * import { PoemConfig, createPoemApp } from 'philjs-poem';
 *
 * const config: PoemConfig = {
 *   ssr: { streaming: true },
 *   openapi: { enabled: true, title: 'My API' },
 * };
 *
 * const app = createPoemApp(config);
 * ```
 *
 * @packageDocumentation
 */
export * from './types.js';
export * from './middleware.js';
export { Extractor, SSRContextExtractor, JsonExtractor, QueryExtractor, PathExtractor, AuthExtractor, FormExtractor, MultipartExtractor, CookieExtractor, HeaderExtractor, DataExtractor, createExtractor, ssrContext, query, auth, optionalAuth, json as extractorJson, type SSRContextData, type JsonExtractorConfig, type QueryExtractorConfig, type AuthUser, type AuthExtractorConfig, type MultipartFile, } from './extractors.js';
export { EndpointBuilder, RouteGroup, OpenAPIEndpointBuilder, endpoint, group, crud, ssrPage, ssrPages, apiEndpoint, healthCheck, readinessProbe, openapi as endpointsOpenapi, type HttpMethod, type EndpointDefinition, type CRUDOptions, type SSRPageOptions, } from './endpoints.js';
export * from './responses.js';
export * from './websocket.js';
export * from './openapi.js';
export * from './ssr.js';
export { rustCodeGenerators, generateRustHandler, generateRustRequestStruct, generateRustResponseEnum, generateRustErrorTypes, generateRustDbService, generateRustValidationHelpers, generateRustAPI, generateFullRustAPI, generateCrudAPI, mapToRustType, type RustHandlerOptions, type RustTypeMapping, type GeneratedRustCode, } from './openapi.js';
/**
 * Create a PhilJS-enabled Poem application configuration
 */
export declare function createPoemApp(config?: PoemConfig): PoemAppBuilder;
/**
 * Poem application builder for PhilJS integration
 */
export declare class PoemAppBuilder {
    private config;
    constructor(config: PoemConfig);
    /**
     * Enable SSR with optional configuration
     */
    withSSR(options?: Partial<PoemSSRConfig>): this;
    /**
     * Enable OpenAPI documentation
     */
    withOpenAPI(options?: Partial<PoemOpenAPIConfig>): this;
    /**
     * Enable CORS with optional configuration
     */
    withCORS(options?: Partial<PoemCORSConfig>): this;
    /**
     * Configure security
     */
    withSecurity(options?: Partial<PoemSecurityConfig>): this;
    /**
     * Build the final configuration
     */
    build(): PoemConfig;
    /**
     * Generate Rust configuration code
     */
    toRustConfig(): string;
}
import type { PoemConfig, PoemSSRConfig, PoemOpenAPIConfig, PoemCORSConfig, PoemSecurityConfig } from './types.js';
//# sourceMappingURL=index.d.ts.map