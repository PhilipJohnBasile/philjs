/**
 * PhilJS Rocket Middleware
 *
 * Middleware components for Rocket framework integration.
 * These are implemented as fairings in Rocket but exposed as
 * middleware-like abstractions for TypeScript configuration.
 */

import type {
  RocketConfig,
  RocketSSRConfig,
  RocketCORSConfig,
  RocketSecurityConfig,
  FairingContext,
  FairingResponse,
} from './types';

// ============================================================================
// SSR Middleware
// ============================================================================

/**
 * SSR middleware configuration
 */
export interface SSRMiddlewareConfig {
  /** Enable streaming SSR */
  streaming?: boolean;
  /** Inject hydration scripts */
  hydration?: boolean;
  /** Cache rendered pages */
  cache?: boolean;
  /** Cache TTL in seconds */
  cacheTTL?: number;
  /** Routes to apply SSR to (glob patterns) */
  routes?: string[];
  /** Routes to exclude from SSR */
  excludeRoutes?: string[];
}

/**
 * Create SSR middleware configuration
 */
export function createSSRMiddleware(config: SSRMiddlewareConfig = {}): SSRMiddleware {
  return new SSRMiddleware(config);
}

/**
 * SSR Middleware class
 */
export class SSRMiddleware {
  private config: SSRMiddlewareConfig;

  constructor(config: SSRMiddlewareConfig) {
    this.config = {
      streaming: false,
      hydration: true,
      cache: false,
      cacheTTL: 300,
      routes: ['/**'],
      excludeRoutes: ['/api/**', '/static/**'],
      ...config,
    };
  }

  /**
   * Check if a path should be SSR'd
   */
  shouldSSR(path: string): boolean {
    // Check exclude routes first
    for (const pattern of this.config.excludeRoutes || []) {
      if (this.matchPath(path, pattern)) {
        return false;
      }
    }

    // Check include routes
    for (const pattern of this.config.routes || ['/**']) {
      if (this.matchPath(path, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Simple glob pattern matching
   */
  private matchPath(path: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * Get cache key for a request
   */
  getCacheKey(ctx: FairingContext): string {
    return `ssr:${ctx.method}:${ctx.path}:${JSON.stringify(ctx.query)}`;
  }

  /**
   * Generate Rust fairing code
   */
  toRustCode(): string {
    return `
use philjs_rocket::middleware::SsrMiddleware;

let ssr_middleware = SsrMiddleware::new()
    .streaming(${this.config.streaming})
    .hydration(${this.config.hydration})
    .cache(${this.config.cache})
    .cache_ttl(${this.config.cacheTTL});
`.trim();
  }

  getConfig(): SSRMiddlewareConfig {
    return this.config;
  }
}

// ============================================================================
// CORS Middleware
// ============================================================================

/**
 * CORS middleware configuration
 */
export interface CORSMiddlewareConfig extends RocketCORSConfig {}

/**
 * Create CORS middleware configuration
 */
export function createCORSMiddleware(config: CORSMiddlewareConfig = {}): CORSMiddleware {
  return new CORSMiddleware(config);
}

/**
 * CORS Middleware class
 */
export class CORSMiddleware {
  private config: CORSMiddlewareConfig;

  constructor(config: CORSMiddlewareConfig) {
    this.config = {
      enabled: true,
      origins: ['*'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: false,
      maxAge: 3600,
      exposeHeaders: [],
      ...config,
    };
  }

  /**
   * Check if an origin is allowed
   */
  isOriginAllowed(origin: string): boolean {
    const origins = this.config.origins || ['*'];
    if (origins.includes('*')) {
      return true;
    }
    return origins.includes(origin);
  }

  /**
   * Get CORS headers for a request
   */
  getCORSHeaders(origin: string): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.isOriginAllowed(origin)) {
      headers['Access-Control-Allow-Origin'] = this.config.origins?.includes('*') ? '*' : origin;
    }

    if (this.config.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    if (this.config.methods && this.config.methods.length > 0) {
      headers['Access-Control-Allow-Methods'] = this.config.methods.join(', ');
    }

    if (this.config.headers && this.config.headers.length > 0) {
      headers['Access-Control-Allow-Headers'] = this.config.headers.join(', ');
    }

    if (this.config.exposeHeaders && this.config.exposeHeaders.length > 0) {
      headers['Access-Control-Expose-Headers'] = this.config.exposeHeaders.join(', ');
    }

    if (this.config.maxAge) {
      headers['Access-Control-Max-Age'] = this.config.maxAge.toString();
    }

    return headers;
  }

  /**
   * Handle preflight request
   */
  handlePreflight(ctx: FairingContext): FairingResponse {
    const origin = ctx.headers['origin'] || '*';
    return {
      status: 204,
      headers: this.getCORSHeaders(origin),
    };
  }

  /**
   * Generate Rust fairing code
   */
  toRustCode(): string {
    const originsStr = (this.config.origins || []).map(o => `"${o}"`).join(', ');
    const methodsStr = (this.config.methods || []).map(m => `"${m}"`).join(', ');
    const headersStr = (this.config.headers || []).map(h => `"${h}"`).join(', ');

    return `
use philjs_rocket::middleware::CorsMiddleware;

let cors = CorsMiddleware::new()
    .origins(&[${originsStr}])
    .methods(&[${methodsStr}])
    .headers(&[${headersStr}])
    .credentials(${this.config.credentials})
    .max_age(${this.config.maxAge});
`.trim();
  }

  getConfig(): CORSMiddlewareConfig {
    return this.config;
  }
}

// ============================================================================
// Security Headers Middleware
// ============================================================================

/**
 * Security headers middleware configuration
 */
export interface SecurityMiddlewareConfig extends RocketSecurityConfig {}

/**
 * Create security headers middleware
 */
export function createSecurityMiddleware(config: SecurityMiddlewareConfig = {}): SecurityMiddleware {
  return new SecurityMiddleware(config);
}

/**
 * Security Headers Middleware class
 */
export class SecurityMiddleware {
  private config: SecurityMiddlewareConfig;

  constructor(config: SecurityMiddlewareConfig) {
    this.config = {
      enabled: true,
      csp: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      frameOptions: 'DENY',
      contentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
      hsts: 'max-age=31536000; includeSubDomains',
      ...config,
    };
  }

  /**
   * Get security headers
   */
  getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.csp) {
      headers['Content-Security-Policy'] = this.config.csp;
    }

    if (this.config.frameOptions) {
      headers['X-Frame-Options'] = this.config.frameOptions;
    }

    if (this.config.contentTypeOptions) {
      headers['X-Content-Type-Options'] = this.config.contentTypeOptions;
    }

    if (this.config.referrerPolicy) {
      headers['Referrer-Policy'] = this.config.referrerPolicy;
    }

    if (this.config.hsts) {
      headers['Strict-Transport-Security'] = this.config.hsts;
    }

    if (this.config.permissionsPolicy) {
      headers['Permissions-Policy'] = this.config.permissionsPolicy;
    }

    return headers;
  }

  /**
   * Generate Rust fairing code
   */
  toRustCode(): string {
    return `
use philjs_rocket::middleware::SecurityMiddleware;

let security = SecurityMiddleware::new()
    .csp("${this.config.csp}")
    .frame_options("${this.config.frameOptions}")
    .content_type_options("${this.config.contentTypeOptions}")
    .referrer_policy("${this.config.referrerPolicy}")
    .hsts("${this.config.hsts}");
`.trim();
  }

  getConfig(): SecurityMiddlewareConfig {
    return this.config;
  }
}

// ============================================================================
// Compression Middleware
// ============================================================================

/**
 * Compression middleware configuration
 */
export interface CompressionMiddlewareConfig {
  /** Enable compression */
  enabled?: boolean;
  /** Minimum size to compress (bytes) */
  minSize?: number;
  /** Compression level (1-9) */
  level?: number;
  /** Enable gzip */
  gzip?: boolean;
  /** Enable brotli */
  brotli?: boolean;
  /** Content types to compress */
  contentTypes?: string[];
}

/**
 * Create compression middleware
 */
export function createCompressionMiddleware(config: CompressionMiddlewareConfig = {}): CompressionMiddleware {
  return new CompressionMiddleware(config);
}

/**
 * Compression Middleware class
 */
export class CompressionMiddleware {
  private config: CompressionMiddlewareConfig;

  constructor(config: CompressionMiddlewareConfig) {
    this.config = {
      enabled: true,
      minSize: 1024,
      level: 6,
      gzip: true,
      brotli: true,
      contentTypes: [
        'text/html',
        'text/css',
        'text/javascript',
        'application/javascript',
        'application/json',
        'image/svg+xml',
      ],
      ...config,
    };
  }

  /**
   * Check if content type should be compressed
   */
  shouldCompress(contentType: string): boolean {
    const types = this.config.contentTypes || [];
    return types.some(t => contentType.startsWith(t));
  }

  /**
   * Get best compression algorithm based on Accept-Encoding
   */
  getBestEncoding(acceptEncoding: string): 'br' | 'gzip' | null {
    if (this.config.brotli && acceptEncoding.includes('br')) {
      return 'br';
    }
    if (this.config.gzip && acceptEncoding.includes('gzip')) {
      return 'gzip';
    }
    return null;
  }

  /**
   * Generate Rust fairing code
   */
  toRustCode(): string {
    return `
use philjs_rocket::middleware::CompressionMiddleware;

let compression = CompressionMiddleware::new()
    .min_size(${this.config.minSize})
    .level(${this.config.level})
    .gzip(${this.config.gzip})
    .brotli(${this.config.brotli});
`.trim();
  }

  getConfig(): CompressionMiddlewareConfig {
    return this.config;
  }
}

// ============================================================================
// Rate Limiting Middleware
// ============================================================================

/**
 * Rate limiting middleware configuration
 */
export interface RateLimitMiddlewareConfig {
  /** Enable rate limiting */
  enabled?: boolean;
  /** Requests per window */
  limit?: number;
  /** Window size in seconds */
  window?: number;
  /** Key extractor: 'ip' | 'user' | 'apiKey' */
  keyBy?: 'ip' | 'user' | 'apiKey';
  /** Custom key header (for apiKey) */
  keyHeader?: string;
  /** Routes to apply rate limiting */
  routes?: string[];
  /** Routes to exclude */
  excludeRoutes?: string[];
}

/**
 * Create rate limiting middleware
 */
export function createRateLimitMiddleware(config: RateLimitMiddlewareConfig = {}): RateLimitMiddleware {
  return new RateLimitMiddleware(config);
}

/**
 * Rate Limit Middleware class
 */
export class RateLimitMiddleware {
  private config: RateLimitMiddlewareConfig;

  constructor(config: RateLimitMiddlewareConfig) {
    this.config = {
      enabled: true,
      limit: 100,
      window: 60,
      keyBy: 'ip',
      keyHeader: 'X-API-Key',
      routes: ['/api/**'],
      excludeRoutes: [],
      ...config,
    };
  }

  /**
   * Get rate limit key from context
   */
  getKey(ctx: FairingContext): string {
    switch (this.config.keyBy) {
      case 'ip':
        return ctx.remoteAddr || 'unknown';
      case 'user':
        return ctx.headers['authorization'] || 'anonymous';
      case 'apiKey':
        return ctx.headers[this.config.keyHeader?.toLowerCase() || 'x-api-key'] || 'no-key';
      default:
        return ctx.remoteAddr || 'unknown';
    }
  }

  /**
   * Generate Rust fairing code
   */
  toRustCode(): string {
    return `
use philjs_rocket::middleware::RateLimitMiddleware;

let rate_limit = RateLimitMiddleware::new()
    .limit(${this.config.limit})
    .window(${this.config.window})
    .key_by("${this.config.keyBy}");
`.trim();
  }

  getConfig(): RateLimitMiddlewareConfig {
    return this.config;
  }
}

// ============================================================================
// Tracing Middleware
// ============================================================================

/**
 * Tracing middleware configuration
 */
export interface TracingMiddlewareConfig {
  /** Enable tracing */
  enabled?: boolean;
  /** Log level */
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  /** Include request body */
  logBody?: boolean;
  /** Include response body */
  logResponseBody?: boolean;
  /** Include headers */
  logHeaders?: boolean;
  /** Redact sensitive headers */
  redactHeaders?: string[];
}

/**
 * Create tracing middleware
 */
export function createTracingMiddleware(config: TracingMiddlewareConfig = {}): TracingMiddleware {
  return new TracingMiddleware(config);
}

/**
 * Tracing Middleware class
 */
export class TracingMiddleware {
  private config: TracingMiddlewareConfig;

  constructor(config: TracingMiddlewareConfig) {
    this.config = {
      enabled: true,
      level: 'info',
      logBody: false,
      logResponseBody: false,
      logHeaders: true,
      redactHeaders: ['authorization', 'cookie', 'x-api-key'],
      ...config,
    };
  }

  /**
   * Redact sensitive headers
   */
  redactHeaders(headers: Record<string, string>): Record<string, string> {
    const redacted = { ...headers };
    const toRedact = this.config.redactHeaders || [];

    for (const header of toRedact) {
      if (redacted[header.toLowerCase()]) {
        redacted[header.toLowerCase()] = '[REDACTED]';
      }
    }

    return redacted;
  }

  /**
   * Generate Rust fairing code
   */
  toRustCode(): string {
    return `
use philjs_rocket::middleware::TracingMiddleware;
use tracing::Level;

let tracing = TracingMiddleware::new()
    .level(Level::${this.config.level?.toUpperCase()})
    .log_headers(${this.config.logHeaders})
    .log_body(${this.config.logBody});
`.trim();
  }

  getConfig(): TracingMiddlewareConfig {
    return this.config;
  }
}
