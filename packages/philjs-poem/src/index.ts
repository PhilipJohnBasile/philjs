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

// Types
export * from './types.js';

// Core exports
export * from './middleware.js';
export {
  // from extractors - excluding json to avoid conflict
  Extractor,
  SSRContextExtractor,
  JsonExtractor,
  QueryExtractor,
  PathExtractor,
  AuthExtractor,
  FormExtractor,
  MultipartExtractor,
  CookieExtractor,
  HeaderExtractor,
  DataExtractor,
  createExtractor,
  ssrContext,
  query,
  auth,
  optionalAuth,
  json as extractorJson,
  type SSRContextData,
  type JsonExtractorConfig,
  type QueryExtractorConfig,
  type AuthUser,
  type AuthExtractorConfig,
  type MultipartFile,
} from './extractors.js';
export {
  // from endpoints - excluding openapi to avoid conflict
  EndpointBuilder,
  RouteGroup,
  OpenAPIEndpointBuilder,
  endpoint,
  group,
  crud,
  ssrPage,
  ssrPages,
  apiEndpoint,
  healthCheck,
  readinessProbe,
  openapi as endpointsOpenapi,
  type HttpMethod,
  type EndpointDefinition,
  type CRUDOptions,
  type SSRPageOptions,
} from './endpoints.js';
export * from './responses.js';
export * from './websocket.js';
export * from './openapi.js';
export * from './ssr.js';

// Re-export Rust code generation utilities
export {
  rustCodeGenerators,
  generateRustHandler,
  generateRustRequestStruct,
  generateRustResponseEnum,
  generateRustErrorTypes,
  generateRustDbService,
  generateRustValidationHelpers,
  generateRustAPI,
  generateFullRustAPI,
  generateCrudAPI,
  mapToRustType,
  type RustHandlerOptions,
  type RustTypeMapping,
  type GeneratedRustCode,
} from './openapi.js';

/**
 * Create a PhilJS-enabled Poem application configuration
 */
export function createPoemApp(config: PoemConfig = {}): PoemAppBuilder {
  return new PoemAppBuilder(config);
}

/**
 * Poem application builder for PhilJS integration
 */
export class PoemAppBuilder {
  private config: PoemConfig;

  constructor(config: PoemConfig) {
    this.config = {
      ssr: { enabled: true, streaming: false, hydration: true, ...config.ssr },
      openapi: { enabled: false, ...config.openapi },
      cors: { enabled: false, ...config.cors },
      security: { enabled: true, ...config.security },
      ...config,
    };
  }

  /**
   * Enable SSR with optional configuration
   */
  withSSR(options: Partial<PoemSSRConfig> = {}): this {
    this.config.ssr = { ...this.config.ssr, ...options, enabled: true };
    return this;
  }

  /**
   * Enable OpenAPI documentation
   */
  withOpenAPI(options: Partial<PoemOpenAPIConfig> = {}): this {
    this.config.openapi = { ...this.config.openapi, ...options, enabled: true };
    return this;
  }

  /**
   * Enable CORS with optional configuration
   */
  withCORS(options: Partial<PoemCORSConfig> = {}): this {
    this.config.cors = { ...this.config.cors, ...options, enabled: true };
    return this;
  }

  /**
   * Configure security
   */
  withSecurity(options: Partial<PoemSecurityConfig> = {}): this {
    this.config.security = { ...this.config.security, ...options, enabled: true };
    return this;
  }

  /**
   * Build the final configuration
   */
  build(): PoemConfig {
    return this.config;
  }

  /**
   * Generate Rust configuration code
   */
  toRustConfig(): string {
    return `
use philjs_poem::prelude::*;

let config = PhilJsConfig::builder()
    .ssr(SsrConfig {
        enabled: ${this.config.ssr?.enabled ?? true},
        streaming: ${this.config.ssr?.streaming ?? false},
        hydration: ${this.config.ssr?.hydration ?? true},
    })
    .openapi(OpenApiConfig {
        enabled: ${this.config.openapi?.enabled ?? false},
        title: "${this.config.openapi?.title ?? 'PhilJS API'}".to_string(),
    })
    .build();
`.trim();
  }
}

// Types re-exported from './types.js'
import type {
  PoemConfig,
  PoemSSRConfig,
  PoemOpenAPIConfig,
  PoemCORSConfig,
  PoemSecurityConfig,
} from './types.js';
