/**
 * PhilJS Rocket Middleware
 *
 * Middleware components for Rocket framework integration.
 * These are implemented as fairings in Rocket but exposed as
 * middleware-like abstractions for TypeScript configuration.
 */
/**
 * Create SSR middleware configuration
 */
export function createSSRMiddleware(config = {}) {
    return new SSRMiddleware(config);
}
/**
 * SSR Middleware class
 */
export class SSRMiddleware {
    config;
    constructor(config) {
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
    shouldSSR(path) {
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
    matchPath(path, pattern) {
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
    getCacheKey(ctx) {
        return `ssr:${ctx.method}:${ctx.path}:${JSON.stringify(ctx.query)}`;
    }
    /**
     * Generate Rust fairing code
     */
    toRustCode() {
        return `
use philjs_rocket::middleware::SsrMiddleware;

let ssr_middleware = SsrMiddleware::new()
    .streaming(${this.config.streaming})
    .hydration(${this.config.hydration})
    .cache(${this.config.cache})
    .cache_ttl(${this.config.cacheTTL});
`.trim();
    }
    getConfig() {
        return this.config;
    }
}
/**
 * Create CORS middleware configuration
 */
export function createCORSMiddleware(config = {}) {
    return new CORSMiddleware(config);
}
/**
 * CORS Middleware class
 */
export class CORSMiddleware {
    config;
    constructor(config) {
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
    isOriginAllowed(origin) {
        const origins = this.config.origins || ['*'];
        if (origins.includes('*')) {
            return true;
        }
        return origins.includes(origin);
    }
    /**
     * Get CORS headers for a request
     */
    getCORSHeaders(origin) {
        const headers = {};
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
    handlePreflight(ctx) {
        const origin = ctx['headers']['origin'] ?? '*';
        return {
            status: 204,
            headers: this.getCORSHeaders(origin),
        };
    }
    /**
     * Generate Rust fairing code
     */
    toRustCode() {
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
    getConfig() {
        return this.config;
    }
}
/**
 * Create security headers middleware
 */
export function createSecurityMiddleware(config = {}) {
    return new SecurityMiddleware(config);
}
/**
 * Security Headers Middleware class
 */
export class SecurityMiddleware {
    config;
    constructor(config) {
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
    getSecurityHeaders() {
        const headers = {};
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
    toRustCode() {
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
    getConfig() {
        return this.config;
    }
}
/**
 * Create compression middleware
 */
export function createCompressionMiddleware(config = {}) {
    return new CompressionMiddleware(config);
}
/**
 * Compression Middleware class
 */
export class CompressionMiddleware {
    config;
    constructor(config) {
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
    shouldCompress(contentType) {
        const types = this.config.contentTypes || [];
        return types.some(t => contentType.startsWith(t));
    }
    /**
     * Get best compression algorithm based on Accept-Encoding
     */
    getBestEncoding(acceptEncoding) {
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
    toRustCode() {
        return `
use philjs_rocket::middleware::CompressionMiddleware;

let compression = CompressionMiddleware::new()
    .min_size(${this.config.minSize})
    .level(${this.config.level})
    .gzip(${this.config.gzip})
    .brotli(${this.config.brotli});
`.trim();
    }
    getConfig() {
        return this.config;
    }
}
/**
 * Create rate limiting middleware
 */
export function createRateLimitMiddleware(config = {}) {
    return new RateLimitMiddleware(config);
}
/**
 * Rate Limit Middleware class
 */
export class RateLimitMiddleware {
    config;
    constructor(config) {
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
    getKey(ctx) {
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
    toRustCode() {
        return `
use philjs_rocket::middleware::RateLimitMiddleware;

let rate_limit = RateLimitMiddleware::new()
    .limit(${this.config.limit})
    .window(${this.config.window})
    .key_by("${this.config.keyBy}");
`.trim();
    }
    getConfig() {
        return this.config;
    }
}
/**
 * Create tracing middleware
 */
export function createTracingMiddleware(config = {}) {
    return new TracingMiddleware(config);
}
/**
 * Tracing Middleware class
 */
export class TracingMiddleware {
    config;
    constructor(config) {
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
    redactHeaders(headers) {
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
    toRustCode() {
        return `
use philjs_rocket::middleware::TracingMiddleware;
use tracing::Level;

let tracing = TracingMiddleware::new()
    .level(Level::${this.config.level?.toUpperCase()})
    .log_headers(${this.config.logHeaders})
    .log_body(${this.config.logBody});
`.trim();
    }
    getConfig() {
        return this.config;
    }
}
//# sourceMappingURL=middleware.js.map