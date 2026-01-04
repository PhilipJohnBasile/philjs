/**
 * PhilJS API Middleware
 *
 * Advanced middleware for API routes including:
 * - Geolocation
 * - A/B Testing
 * - Rate Limiting
 * - CORS
 * - Compression
 * - Security Headers
 * - Request ID tracking
 */
// ============================================================================
// Middleware Composers
// ============================================================================
/**
 * Compose multiple middlewares into a single middleware
 */
export function composeMiddleware(...middlewares) {
    return async (context, next) => {
        let index = 0;
        const dispatch = async () => {
            if (index >= middlewares.length) {
                return next();
            }
            const middleware = middlewares[index++];
            return middleware(context, dispatch);
        };
        return dispatch();
    };
}
/**
 * Conditional middleware - only runs if condition is met
 */
export function conditionalMiddleware(condition, middleware) {
    return async (context, next) => {
        if (condition(context)) {
            return middleware(context, next);
        }
        return next();
    };
}
/**
 * Geolocation middleware - adds geolocation data to context
 *
 * Works with Cloudflare Workers, Vercel Edge, Deno Deploy, and custom providers.
 *
 * @example
 * ```ts
 * const handler = defineAPIRoute({
 *   middleware: [geolocationMiddleware()],
 *   handler: async ({ request, geo }) => {
 *     return json({ country: geo.country });
 *   }
 * });
 * ```
 */
export function geolocationMiddleware(options = {}) {
    const { provider, fallback, addToHeaders = false } = options;
    return async (context, next) => {
        let geo = fallback || {};
        if (provider) {
            // Use custom provider
            geo = await provider(context.request.raw);
        }
        else {
            // Try to detect from platform
            const cf = context.request.raw.cf;
            if (cf) {
                // Cloudflare Workers
                geo = {
                    country: cf.country,
                    region: cf.region,
                    city: cf.city,
                    latitude: cf.latitude,
                    longitude: cf.longitude,
                    timezone: cf.timezone,
                    continent: cf.continent,
                    postalCode: cf.postalCode,
                };
            }
            else if (context.request.headers.has('x-vercel-ip-country')) {
                // Vercel Edge
                const country = context.request.headers.get('x-vercel-ip-country') || undefined;
                const region = context.request.headers.get('x-vercel-ip-country-region') || undefined;
                const city = context.request.headers.get('x-vercel-ip-city') || undefined;
                geo = {
                    latitude: parseFloat(context.request.headers.get('x-vercel-ip-latitude') || ''),
                    longitude: parseFloat(context.request.headers.get('x-vercel-ip-longitude') || ''),
                };
                if (country !== undefined)
                    geo.country = country;
                if (region !== undefined)
                    geo.region = region;
                if (city !== undefined)
                    geo.city = city;
            }
            else if (context.request.headers.has('cf-ipcountry')) {
                // Generic Cloudflare proxy
                const country = context.request.headers.get('cf-ipcountry') || undefined;
                geo = {};
                if (country !== undefined)
                    geo.country = country;
            }
        }
        // Add to context
        context.geo = geo;
        const response = await next();
        // Optionally add to response headers
        if (addToHeaders && geo.country) {
            response.headers.set('X-Geo-Country', geo.country);
            if (geo.region)
                response.headers.set('X-Geo-Region', geo.region);
            if (geo.city)
                response.headers.set('X-Geo-City', geo.city);
        }
        return response;
    };
}
/**
 * A/B Testing middleware - assigns users to test variants
 *
 * @example
 * ```ts
 * const handler = defineAPIRoute({
 *   middleware: [
 *     abTestMiddleware({
 *       tests: [{
 *         name: 'checkout-flow',
 *         variants: [
 *           { name: 'control', weight: 50 },
 *           { name: 'new-design', weight: 50 }
 *         ]
 *       }]
 *     })
 *   ],
 *   handler: async ({ request, abTests }) => {
 *     const variant = abTests['checkout-flow'];
 *     return json({ variant });
 *   }
 * });
 * ```
 */
export function abTestMiddleware(options) {
    const { tests, selectVariant: customSelectVariant } = options;
    return async (context, next) => {
        const abTests = {};
        const cookiesToSet = [];
        for (const test of tests) {
            const cookieName = test.cookieName || `ab_${test.name}`;
            let variant;
            // Check if user already has a variant assigned (via cookie)
            const existingVariant = context.getCookie(cookieName);
            if (existingVariant && test.variants.some(v => v.name === existingVariant)) {
                variant = existingVariant;
            }
            else {
                // Assign new variant
                if (customSelectVariant) {
                    variant = customSelectVariant(test, context);
                }
                else {
                    variant = selectVariantByWeight(test.variants);
                }
                // Set cookie
                cookiesToSet.push({
                    name: cookieName,
                    value: variant,
                    maxAge: test.cookieMaxAge || 30 * 24 * 60 * 60, // 30 days default
                });
            }
            abTests[test.name] = variant;
        }
        // Add to context
        context.abTests = abTests;
        const response = await next();
        // Set cookies for new assignments
        for (const cookie of cookiesToSet) {
            const setCookie = `${cookie.name}=${cookie.value}; Max-Age=${cookie.maxAge}; Path=/; SameSite=Lax`;
            response.headers.append('Set-Cookie', setCookie);
        }
        // Add variant to response headers for analytics
        if (Object.keys(abTests).length > 0) {
            response.headers.set('X-AB-Tests', JSON.stringify(abTests));
        }
        return response;
    };
}
/**
 * Select a variant based on weight distribution
 */
function selectVariantByWeight(variants) {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    const random = Math.random() * totalWeight;
    let cumulative = 0;
    for (const variant of variants) {
        cumulative += variant.weight;
        if (random <= cumulative) {
            return variant.name;
        }
    }
    return variants[0]?.name ?? '';
}
/**
 * Rate limiting middleware
 *
 * @example
 * ```ts
 * const handler = defineAPIRoute({
 *   middleware: [
 *     rateLimitMiddleware({
 *       limit: 100,
 *       windowMs: 60 * 1000, // 1 minute
 *     })
 *   ],
 *   handler: async ({ request }) => {
 *     return json({ message: 'OK' });
 *   }
 * });
 * ```
 */
export function rateLimitMiddleware(options) {
    const { limit, windowMs, keyGenerator = defaultKeyGenerator, store = createMemoryStore(), onLimitExceeded, skip, } = options;
    return async (context, next) => {
        if (skip?.(context)) {
            return next();
        }
        const key = keyGenerator(context);
        const count = await store.increment(key, windowMs);
        // Add rate limit headers
        const remaining = Math.max(0, limit - count);
        const resetTime = Date.now() + windowMs;
        const response = count > limit
            ? (onLimitExceeded?.(context) || new Response(JSON.stringify({ error: 'Too many requests' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' },
            }))
            : await next();
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', limit.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set('X-RateLimit-Reset', resetTime.toString());
        if (count > limit) {
            response.headers.set('Retry-After', Math.ceil(windowMs / 1000).toString());
        }
        return response;
    };
}
function defaultKeyGenerator(context) {
    return (context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        context.request.headers.get('x-real-ip') ||
        'anonymous');
}
function createMemoryStore() {
    const store = new Map();
    return {
        async get(key) {
            const entry = store.get(key);
            if (!entry || Date.now() > entry.resetAt) {
                store.delete(key);
                return undefined;
            }
            return entry.count;
        },
        async increment(key, windowMs) {
            const entry = store.get(key);
            const now = Date.now();
            if (!entry || now > entry.resetAt) {
                store.set(key, { count: 1, resetAt: now + windowMs });
                return 1;
            }
            entry.count++;
            return entry.count;
        },
        async reset(key) {
            store.delete(key);
        },
    };
}
/**
 * CORS middleware
 *
 * @example
 * ```ts
 * const handler = defineAPIRoute({
 *   middleware: [
 *     corsMiddleware({
 *       origin: '*',
 *       methods: ['GET', 'POST'],
 *       credentials: true
 *     })
 *   ],
 *   handler: async ({ request }) => {
 *     return json({ message: 'OK' });
 *   }
 * });
 * ```
 */
export function corsMiddleware(options = {}) {
    const { origin = '*', methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], allowedHeaders = ['Content-Type', 'Authorization'], exposedHeaders = [], credentials = false, maxAge = 86400, // 24 hours
     } = options;
    return async (context, next) => {
        const requestOrigin = context.request.headers.get('origin') || '';
        // Handle preflight
        if (context.request.method === 'OPTIONS') {
            const headers = new Headers();
            // Set origin
            if (origin === '*') {
                headers.set('Access-Control-Allow-Origin', '*');
            }
            else if (typeof origin === 'string') {
                headers.set('Access-Control-Allow-Origin', origin);
            }
            else if (Array.isArray(origin)) {
                if (origin.includes(requestOrigin)) {
                    headers.set('Access-Control-Allow-Origin', requestOrigin);
                }
            }
            else if (typeof origin === 'function') {
                if (origin(requestOrigin)) {
                    headers.set('Access-Control-Allow-Origin', requestOrigin);
                }
            }
            headers.set('Access-Control-Allow-Methods', methods.join(', '));
            headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
            headers.set('Access-Control-Max-Age', maxAge.toString());
            if (credentials) {
                headers.set('Access-Control-Allow-Credentials', 'true');
            }
            return new Response(null, { status: 204, headers });
        }
        const response = await next();
        // Set origin
        if (origin === '*') {
            response.headers.set('Access-Control-Allow-Origin', '*');
        }
        else if (typeof origin === 'string') {
            response.headers.set('Access-Control-Allow-Origin', origin);
        }
        else if (Array.isArray(origin)) {
            if (origin.includes(requestOrigin)) {
                response.headers.set('Access-Control-Allow-Origin', requestOrigin);
            }
        }
        else if (typeof origin === 'function') {
            if (origin(requestOrigin)) {
                response.headers.set('Access-Control-Allow-Origin', requestOrigin);
            }
        }
        if (credentials) {
            response.headers.set('Access-Control-Allow-Credentials', 'true');
        }
        if (exposedHeaders.length > 0) {
            response.headers.set('Access-Control-Expose-Headers', exposedHeaders.join(', '));
        }
        return response;
    };
}
/**
 * Security headers middleware
 *
 * @example
 * ```ts
 * const handler = defineAPIRoute({
 *   middleware: [
 *     securityHeadersMiddleware({
 *       xFrameOptions: 'DENY',
 *       strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true }
 *     })
 *   ],
 *   handler: async ({ request }) => {
 *     return json({ message: 'OK' });
 *   }
 * });
 * ```
 */
export function securityHeadersMiddleware(options = {}) {
    const { contentSecurityPolicy, xFrameOptions = 'DENY', xContentTypeOptions = true, strictTransportSecurity, referrerPolicy = 'strict-origin-when-cross-origin', permissionsPolicy, } = options;
    return async (context, next) => {
        const response = await next();
        // X-Frame-Options
        if (xFrameOptions) {
            response.headers.set('X-Frame-Options', xFrameOptions);
        }
        // X-Content-Type-Options
        if (xContentTypeOptions) {
            response.headers.set('X-Content-Type-Options', 'nosniff');
        }
        // Strict-Transport-Security
        if (strictTransportSecurity) {
            const hsts = typeof strictTransportSecurity === 'string'
                ? strictTransportSecurity
                : `max-age=${strictTransportSecurity.maxAge}${strictTransportSecurity.includeSubDomains ? '; includeSubDomains' : ''}${strictTransportSecurity.preload ? '; preload' : ''}`;
            response.headers.set('Strict-Transport-Security', hsts);
        }
        // Content-Security-Policy
        if (contentSecurityPolicy) {
            const csp = typeof contentSecurityPolicy === 'string'
                ? contentSecurityPolicy
                : Object.entries(contentSecurityPolicy)
                    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
                    .join('; ');
            response.headers.set('Content-Security-Policy', csp);
        }
        // Referrer-Policy
        if (referrerPolicy) {
            response.headers.set('Referrer-Policy', referrerPolicy);
        }
        // Permissions-Policy
        if (permissionsPolicy) {
            const policy = Object.entries(permissionsPolicy)
                .map(([feature, allowlist]) => `${feature}=(${allowlist.join(' ')})`)
                .join(', ');
            response.headers.set('Permissions-Policy', policy);
        }
        return response;
    };
}
/**
 * Request ID middleware - tracks requests with unique IDs
 *
 * @example
 * ```ts
 * const handler = defineAPIRoute({
 *   middleware: [requestIDMiddleware()],
 *   handler: async ({ request, requestId }) => {
 *     console.log('Request ID:', requestId);
 *     return json({ requestId });
 *   }
 * });
 * ```
 */
export function requestIDMiddleware(options = {}) {
    const { headerName = 'X-Request-ID', generator = generateUUID, addToResponse = true, } = options;
    return async (context, next) => {
        // Check if request already has an ID
        let requestId = context.request.headers.get(headerName);
        // Generate new ID if not present
        if (!requestId) {
            requestId = generator();
        }
        // Add to context
        context.requestId = requestId;
        const response = await next();
        // Add to response headers
        if (addToResponse) {
            response.headers.set(headerName, requestId);
        }
        return response;
    };
}
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
/**
 * Compression middleware - compresses responses
 *
 * @example
 * ```ts
 * const handler = defineAPIRoute({
 *   middleware: [compressionMiddleware({ threshold: 1024 })],
 *   handler: async ({ request }) => {
 *     return json({ message: 'Large response data...' });
 *   }
 * });
 * ```
 */
export function compressionMiddleware(options = {}) {
    const { threshold = 1024, algorithms = ['br', 'gzip', 'deflate'], skip, } = options;
    return async (context, next) => {
        const response = await next();
        // Skip if requested
        if (skip?.(response)) {
            return response;
        }
        // Skip if already compressed
        if (response.headers.has('Content-Encoding')) {
            return response;
        }
        // Get accept-encoding header
        const acceptEncoding = context.request.headers.get('accept-encoding') || '';
        // Select compression algorithm
        let encoding = null;
        for (const algo of algorithms) {
            if (acceptEncoding.includes(algo)) {
                encoding = algo;
                break;
            }
        }
        if (!encoding) {
            return response;
        }
        // Get response body
        const body = await response.arrayBuffer();
        // Skip if below threshold
        if (body.byteLength < threshold) {
            return new Response(body, response);
        }
        // Compress based on algorithm
        let compressed;
        if (encoding === 'gzip' || encoding === 'deflate') {
            // Use CompressionStream if available (edge runtimes)
            if (typeof CompressionStream !== 'undefined') {
                const stream = new CompressionStream(encoding);
                const writer = stream.writable.getWriter();
                writer.write(new Uint8Array(body));
                writer.close();
                const chunks = [];
                const reader = stream.readable.getReader();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    chunks.push(value);
                }
                const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
                const compressedArray = new Uint8Array(totalLength);
                let offset = 0;
                for (const chunk of chunks) {
                    compressedArray.set(chunk, offset);
                    offset += chunk.length;
                }
                compressed = compressedArray.buffer;
            }
            else {
                // Fallback: return uncompressed
                return response;
            }
        }
        else {
            // brotli not supported in standard Web APIs
            return response;
        }
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Content-Encoding', encoding);
        newHeaders.set('Content-Length', compressed.byteLength.toString());
        newHeaders.delete('Content-Length'); // Let runtime set it
        return new Response(compressed, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
        });
    };
}
//# sourceMappingURL=middleware.js.map