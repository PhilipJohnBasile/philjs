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
export * from './types';

// Core exports
export * from './middleware';
export * from './extractors';
export * from './endpoints';
export * from './responses';
export * from './websocket';
export * from './openapi';
export * from './ssr';

// Re-export common types
export type {
  PoemConfig,
  PoemSSRConfig,
  PoemOpenAPIConfig,
  PoemCORSConfig,
  PoemSecurityConfig,
  ExtractorContext,
  EndpointOptions,
  ResponseOptions,
  WebSocketOptions,
  OpenAPISchema,
  OpenAPIOperation,
  OpenAPIResponse,
  OpenAPISecurity,
} from './types';

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
} from './openapi';

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

/**
 * Configuration interface for PhilJS Poem integration
 */
export interface PoemConfig {
  ssr?: PoemSSRConfig;
  openapi?: PoemOpenAPIConfig;
  cors?: PoemCORSConfig;
  security?: PoemSecurityConfig;
  session?: PoemSessionConfig;
  rateLimit?: PoemRateLimitConfig;
}

export interface PoemSSRConfig {
  enabled?: boolean;
  streaming?: boolean;
  hydration?: boolean;
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

export interface PoemOpenAPIConfig {
  enabled?: boolean;
  title?: string;
  description?: string;
  version?: string;
  termsOfService?: string;
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
}

export interface PoemCORSConfig {
  enabled?: boolean;
  origins?: string[];
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
  maxAge?: number;
  exposeHeaders?: string[];
}

export interface PoemSecurityConfig {
  enabled?: boolean;
  csp?: string;
  frameOptions?: string;
  contentTypeOptions?: string;
  referrerPolicy?: string;
  hsts?: string;
}

export interface PoemSessionConfig {
  enabled?: boolean;
  cookieName?: string;
  secret?: string;
  ttl?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export interface PoemRateLimitConfig {
  enabled?: boolean;
  limit?: number;
  window?: number;
  keyBy?: 'ip' | 'user' | 'apiKey';
}
