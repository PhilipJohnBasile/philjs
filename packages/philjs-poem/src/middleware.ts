/**
 * PhilJS Poem Middleware
 *
 * Middleware components for Poem framework integration.
 * Poem uses a powerful middleware system based on tower-like layers.
 */

import type {
  PoemConfig,
  PoemSSRConfig,
  PoemCORSConfig,
  PoemSecurityConfig,
  ExtractorContext,
} from './types.js';

// ============================================================================
// Base Middleware
// ============================================================================

/**
 * Middleware response action
 */
export interface MiddlewareAction {
  /** Continue to next middleware */
  continue?: boolean;
  /** Modified headers */
  headers?: Record<string, string>;
  /** Modified status code */
  status?: number;
  /** Abort with response body */
  abort?: string;
  /** Redirect URL */
  redirect?: string;
}

/**
 * Middleware handler
 */
export type MiddlewareHandler = (
  ctx: ExtractorContext
) => MiddlewareAction | Promise<MiddlewareAction>;

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
  /** Routes to apply SSR to */
  routes?: string[];
  /** Routes to exclude from SSR */
  excludeRoutes?: string[];
}

/**
 * Create SSR middleware
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
    for (const pattern of this.config.excludeRoutes || []) {
      if (this.matchPath(path, pattern)) return false;
    }
    for (const pattern of this.config.routes || ['/**']) {
      if (this.matchPath(path, pattern)) return true;
    }
    return false;
  }

  private matchPath(path: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    return new RegExp(`^${regexPattern}$`).test(path);
  }

  /**
   * Generate Rust middleware code
   */
  toRustCode(): string {
    return `
use poem::{Endpoint, Middleware, Request, Response, Result, IntoResponse};
use std::sync::Arc;

/// SSR Middleware for PhilJS
pub struct SsrMiddleware {
    streaming: bool,
    hydration: bool,
    cache: bool,
    cache_ttl: u64,
}

impl SsrMiddleware {
    pub fn new() -> Self {
        Self {
            streaming: ${this.config.streaming},
            hydration: ${this.config.hydration},
            cache: ${this.config.cache},
            cache_ttl: ${this.config.cacheTTL},
        }
    }
}

impl<E: Endpoint> Middleware<E> for SsrMiddleware {
    type Output = SsrMiddlewareEndpoint<E>;

    fn transform(&self, ep: E) -> Self::Output {
        SsrMiddlewareEndpoint {
            inner: ep,
            streaming: self.streaming,
            hydration: self.hydration,
        }
    }
}

pub struct SsrMiddlewareEndpoint<E> {
    inner: E,
    streaming: bool,
    hydration: bool,
}

impl<E: Endpoint> Endpoint for SsrMiddlewareEndpoint<E> {
    type Output = Response;

    async fn call(&self, req: Request) -> Result<Self::Output> {
        // Add SSR context to request extensions
        let mut req = req;
        req.extensions_mut().insert(SsrContext {
            streaming: self.streaming,
            hydration: self.hydration,
        });

        let resp = self.inner.call(req).await?;
        Ok(resp.into_response())
    }
}

#[derive(Clone)]
pub struct SsrContext {
    pub streaming: bool,
    pub hydration: bool,
}
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
export interface CORSMiddlewareConfig extends PoemCORSConfig {}

/**
 * Create CORS middleware
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
    if (origins.includes('*')) return true;
    return origins.includes(origin);
  }

  /**
   * Get CORS headers
   */
  getCORSHeaders(origin: string): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.isOriginAllowed(origin)) {
      headers['Access-Control-Allow-Origin'] = this.config.origins?.includes('*') ? '*' : origin;
    }

    if (this.config.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    if (this.config.methods?.length) {
      headers['Access-Control-Allow-Methods'] = this.config.methods.join(', ');
    }

    if (this.config.headers?.length) {
      headers['Access-Control-Allow-Headers'] = this.config.headers.join(', ');
    }

    if (this.config.exposeHeaders?.length) {
      headers['Access-Control-Expose-Headers'] = this.config.exposeHeaders.join(', ');
    }

    if (this.config.maxAge) {
      headers['Access-Control-Max-Age'] = this.config.maxAge.toString();
    }

    return headers;
  }

  /**
   * Generate Rust middleware code
   */
  toRustCode(): string {
    const originsStr = (this.config.origins || []).map(o => `"${o}"`).join(', ');
    const methodsStr = (this.config.methods || []).map(m => `"${m}"`).join(', ');
    const headersStr = (this.config.headers || []).map(h => `"${h}"`).join(', ');

    return `
use poem::middleware::Cors;
use poem::http::Method;

let cors = Cors::new()
    .allow_origins([${originsStr}])
    .allow_methods([${this.config.methods?.map(m => `Method::${m}`).join(', ') || ''}])
    .allow_headers([${headersStr}])
    .allow_credentials(${this.config.credentials})
    .max_age(${this.config.maxAge});
`.trim();
  }

  getConfig(): CORSMiddlewareConfig {
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
    for (const header of this.config.redactHeaders || []) {
      if (redacted[header.toLowerCase()]) {
        redacted[header.toLowerCase()] = '[REDACTED]';
      }
    }
    return redacted;
  }

  /**
   * Generate Rust middleware code
   */
  toRustCode(): string {
    return `
use poem::middleware::Tracing;
use tracing::Level;

let tracing = Tracing::default();
`.trim();
  }

  getConfig(): TracingMiddlewareConfig {
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
  /** Enable deflate */
  deflate?: boolean;
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
      deflate: false,
      ...config,
    };
  }

  /**
   * Generate Rust middleware code
   */
  toRustCode(): string {
    return `
use poem::middleware::Compression;

let compression = Compression::new()
    .algorithms([
        ${this.config.brotli ? 'CompressionAlgo::BR,' : ''}
        ${this.config.gzip ? 'CompressionAlgo::GZIP,' : ''}
        ${this.config.deflate ? 'CompressionAlgo::DEFLATE,' : ''}
    ]);
`.trim();
  }

  getConfig(): CompressionMiddlewareConfig {
    return this.config;
  }
}

// ============================================================================
// Rate Limit Middleware
// ============================================================================

/**
 * Rate limit middleware configuration
 */
export interface RateLimitMiddlewareConfig {
  /** Enable rate limiting */
  enabled?: boolean;
  /** Requests per window */
  limit?: number;
  /** Window size in seconds */
  window?: number;
  /** Key extractor */
  keyBy?: 'ip' | 'user' | 'apiKey';
  /** Custom key header */
  keyHeader?: string;
}

/**
 * Create rate limit middleware
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
      ...config,
    };
  }

  /**
   * Generate Rust middleware code
   */
  toRustCode(): string {
    return `
use poem::{Endpoint, Middleware, Request, Response, Result, IntoResponse};
use poem::http::StatusCode;
use std::collections::HashMap;
use std::sync::Arc;
use parking_lot::RwLock;
use std::time::{Duration, Instant};

/// Rate limit middleware
pub struct RateLimitMiddleware {
    limit: usize,
    window: Duration,
    store: Arc<RwLock<HashMap<String, (usize, Instant)>>>,
}

impl RateLimitMiddleware {
    pub fn new(limit: usize, window_secs: u64) -> Self {
        Self {
            limit,
            window: Duration::from_secs(window_secs),
            store: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    fn get_key(&self, req: &Request) -> String {
        // Get IP from request
        req.remote_addr()
            .map(|addr| addr.to_string())
            .unwrap_or_else(|| "unknown".to_string())
    }

    fn is_rate_limited(&self, key: &str) -> bool {
        let mut store = self.store.write();
        let now = Instant::now();

        if let Some((count, started)) = store.get_mut(key) {
            if now.duration_since(*started) > self.window {
                *count = 1;
                *started = now;
                false
            } else if *count >= self.limit {
                true
            } else {
                *count += 1;
                false
            }
        } else {
            store.insert(key.to_string(), (1, now));
            false
        }
    }
}

impl<E: Endpoint> Middleware<E> for RateLimitMiddleware {
    type Output = RateLimitEndpoint<E>;

    fn transform(&self, ep: E) -> Self::Output {
        RateLimitEndpoint {
            inner: ep,
            rate_limiter: self.clone(),
        }
    }
}

impl Clone for RateLimitMiddleware {
    fn clone(&self) -> Self {
        Self {
            limit: self.limit,
            window: self.window,
            store: self.store.clone(),
        }
    }
}

pub struct RateLimitEndpoint<E> {
    inner: E,
    rate_limiter: RateLimitMiddleware,
}

impl<E: Endpoint> Endpoint for RateLimitEndpoint<E> {
    type Output = Response;

    async fn call(&self, req: Request) -> Result<Self::Output> {
        let key = self.rate_limiter.get_key(&req);

        if self.rate_limiter.is_rate_limited(&key) {
            return Ok(Response::builder()
                .status(StatusCode::TOO_MANY_REQUESTS)
                .header("Retry-After", "${this.config.window}")
                .body("Rate limit exceeded"));
        }

        let resp = self.inner.call(req).await?;
        Ok(resp.into_response())
    }
}
`.trim();
  }

  getConfig(): RateLimitMiddlewareConfig {
    return this.config;
  }
}

// ============================================================================
// Security Headers Middleware
// ============================================================================

/**
 * Security headers middleware configuration
 */
export interface SecurityMiddlewareConfig extends PoemSecurityConfig {}

/**
 * Create security headers middleware
 */
export function createSecurityMiddleware(config: SecurityMiddlewareConfig = {}): SecurityMiddleware {
  return new SecurityMiddleware(config);
}

/**
 * Security Middleware class
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

    if (this.config.csp) headers['Content-Security-Policy'] = this.config.csp;
    if (this.config.frameOptions) headers['X-Frame-Options'] = this.config.frameOptions;
    if (this.config.contentTypeOptions) headers['X-Content-Type-Options'] = this.config.contentTypeOptions;
    if (this.config.referrerPolicy) headers['Referrer-Policy'] = this.config.referrerPolicy;
    if (this.config.hsts) headers['Strict-Transport-Security'] = this.config.hsts;
    if (this.config.permissionsPolicy) headers['Permissions-Policy'] = this.config.permissionsPolicy;

    return headers;
  }

  /**
   * Generate Rust middleware code
   */
  toRustCode(): string {
    return `
use poem::{Endpoint, Middleware, Request, Response, Result, IntoResponse};

/// Security headers middleware
pub struct SecurityMiddleware {
    csp: Option<String>,
    frame_options: String,
    content_type_options: String,
    referrer_policy: String,
    hsts: Option<String>,
}

impl SecurityMiddleware {
    pub fn new() -> Self {
        Self {
            csp: Some("${this.config.csp}".to_string()),
            frame_options: "${this.config.frameOptions}".to_string(),
            content_type_options: "${this.config.contentTypeOptions}".to_string(),
            referrer_policy: "${this.config.referrerPolicy}".to_string(),
            hsts: Some("${this.config.hsts}".to_string()),
        }
    }
}

impl<E: Endpoint> Middleware<E> for SecurityMiddleware {
    type Output = SecurityEndpoint<E>;

    fn transform(&self, ep: E) -> Self::Output {
        SecurityEndpoint {
            inner: ep,
            headers: self.clone(),
        }
    }
}

impl Clone for SecurityMiddleware {
    fn clone(&self) -> Self {
        Self {
            csp: self.csp.clone(),
            frame_options: self.frame_options.clone(),
            content_type_options: self.content_type_options.clone(),
            referrer_policy: self.referrer_policy.clone(),
            hsts: self.hsts.clone(),
        }
    }
}

pub struct SecurityEndpoint<E> {
    inner: E,
    headers: SecurityMiddleware,
}

impl<E: Endpoint> Endpoint for SecurityEndpoint<E> {
    type Output = Response;

    async fn call(&self, req: Request) -> Result<Self::Output> {
        let mut resp = self.inner.call(req).await?.into_response();

        if let Some(csp) = &self.headers.csp {
            resp.headers_mut().insert("Content-Security-Policy", csp.parse().unwrap());
        }
        resp.headers_mut().insert("X-Frame-Options", self.headers.frame_options.parse().unwrap());
        resp.headers_mut().insert("X-Content-Type-Options", self.headers.content_type_options.parse().unwrap());
        resp.headers_mut().insert("Referrer-Policy", self.headers.referrer_policy.parse().unwrap());
        if let Some(hsts) = &self.headers.hsts {
            resp.headers_mut().insert("Strict-Transport-Security", hsts.parse().unwrap());
        }

        Ok(resp)
    }
}
`.trim();
  }

  getConfig(): SecurityMiddlewareConfig {
    return this.config;
  }
}

// ============================================================================
// Middleware Composer
// ============================================================================

/**
 * Compose multiple middleware together
 */
export class MiddlewareComposer {
  private middleware: Array<{ toRustCode: () => string }> = [];

  /**
   * Add SSR middleware
   */
  withSSR(config: SSRMiddlewareConfig = {}): this {
    this.middleware.push(new SSRMiddleware(config));
    return this;
  }

  /**
   * Add CORS middleware
   */
  withCORS(config: CORSMiddlewareConfig = {}): this {
    this.middleware.push(new CORSMiddleware(config));
    return this;
  }

  /**
   * Add tracing middleware
   */
  withTracing(config: TracingMiddlewareConfig = {}): this {
    this.middleware.push(new TracingMiddleware(config));
    return this;
  }

  /**
   * Add compression middleware
   */
  withCompression(config: CompressionMiddlewareConfig = {}): this {
    this.middleware.push(new CompressionMiddleware(config));
    return this;
  }

  /**
   * Add rate limiting middleware
   */
  withRateLimit(config: RateLimitMiddlewareConfig = {}): this {
    this.middleware.push(new RateLimitMiddleware(config));
    return this;
  }

  /**
   * Add security headers middleware
   */
  withSecurity(config: SecurityMiddlewareConfig = {}): this {
    this.middleware.push(new SecurityMiddleware(config));
    return this;
  }

  /**
   * Generate combined Rust code
   */
  toRustCode(): string {
    return this.middleware.map(m => m.toRustCode()).join('\n\n');
  }
}

/**
 * Create a middleware composer
 */
export function composeMiddleware(): MiddlewareComposer {
  return new MiddlewareComposer();
}
