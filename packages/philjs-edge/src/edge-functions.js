/**
 * Edge Functions Utilities
 *
 * Helpers for building edge functions across providers:
 * - Request/Response helpers
 * - Context management
 * - Error handling
 * - Middleware composition
 * - Request validation
 */
/**
 * Create edge function handler
 */
export function createEdgeFunction(handler, config) {
    return async (ctx) => {
        // Method check
        if (config?.methods && !config.methods.includes(ctx.request.method)) {
            return new Response('Method Not Allowed', { status: 405 });
        }
        // Handle CORS preflight
        if (config?.cors && ctx.request.method === 'OPTIONS') {
            return handleCORS(ctx.request, config.cors);
        }
        // Validate request
        if (config?.validate) {
            const validationError = await validateRequest(ctx, config.validate);
            if (validationError) {
                return validationError;
            }
        }
        // Execute handler with timeout
        let response;
        if (config?.timeout) {
            response = await Promise.race([
                handler(ctx),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Function timeout')), config.timeout)),
            ]).catch(error => {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 504,
                    headers: { 'Content-Type': 'application/json' },
                });
            });
        }
        else {
            response = await handler(ctx);
        }
        // Add CORS headers
        if (config?.cors) {
            response = addCORSHeaders(response, ctx.request, config.cors);
        }
        // Add cache headers
        if (config?.cache) {
            response = addCacheHeaders(response, config.cache);
        }
        return response;
    };
}
/**
 * Compose middleware
 */
export function compose(...middlewares) {
    return async (ctx, next) => {
        let index = -1;
        const dispatch = async (i) => {
            if (i <= index) {
                throw new Error('next() called multiple times');
            }
            index = i;
            if (i === middlewares.length) {
                return next();
            }
            const middleware = middlewares[i];
            return middleware(ctx, () => dispatch(i + 1));
        };
        return dispatch(0);
    };
}
/**
 * Apply middleware to handler
 */
export function applyMiddleware(handler, ...middlewares) {
    const composed = compose(...middlewares);
    return (ctx) => composed(ctx, () => handler(ctx));
}
/**
 * Error handling middleware
 */
export function errorHandler(onError) {
    return async (ctx, next) => {
        try {
            return await next();
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            if (onError) {
                return onError(err, ctx);
            }
            return new Response(JSON.stringify({
                error: 'Internal Server Error',
                message: err.message,
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    };
}
/**
 * Logging middleware
 */
export function logger(options) {
    const format = options?.format ?? defaultLogFormat;
    return async (ctx, next) => {
        const start = Date.now();
        const response = await next();
        const duration = Date.now() - start;
        const logMessage = format(ctx, duration, response.status);
        console.log(logMessage);
        return response;
    };
}
function defaultLogFormat(ctx, duration, status) {
    const url = new URL(ctx.request.url);
    return `${ctx.request.method} ${url.pathname} ${status} ${duration}ms`;
}
/**
 * Timing middleware
 */
export function timing() {
    return async (ctx, next) => {
        const start = Date.now();
        const response = await next();
        const duration = Date.now() - start;
        const newResponse = new Response(response.body, response);
        newResponse.headers.set('Server-Timing', `total;dur=${duration}`);
        return newResponse;
    };
}
/**
 * Request body parser middleware
 */
export function bodyParser() {
    return async (ctx, next) => {
        if (['POST', 'PUT', 'PATCH'].includes(ctx.request.method)) {
            const contentType = ctx.request.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                try {
                    const body = await ctx.request.json();
                    ctx.state = ctx.state || new Map();
                    ctx.state.set('body', body);
                }
                catch {
                    return new Response('Invalid JSON', { status: 400 });
                }
            }
            else if (contentType.includes('application/x-www-form-urlencoded')) {
                const formData = await ctx.request.formData();
                const body = {};
                formData.forEach((value, key) => {
                    body[key] = value;
                });
                ctx.state = ctx.state || new Map();
                ctx.state.set('body', body);
            }
        }
        return next();
    };
}
/**
 * Authentication middleware
 */
export function auth(authenticate) {
    return async (ctx, next) => {
        const result = await authenticate(ctx);
        if (!result.valid) {
            return new Response('Unauthorized', {
                status: 401,
                headers: { 'WWW-Authenticate': 'Bearer' },
            });
        }
        ctx.state = ctx.state || new Map();
        ctx.state.set('user', result.user);
        return next();
    };
}
/**
 * Bearer token authentication
 */
export function bearerAuth(validateToken) {
    return auth(async (ctx) => {
        const authHeader = ctx.request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return { valid: false };
        }
        const token = authHeader.slice(7);
        return validateToken(token);
    });
}
/**
 * API key authentication
 */
export function apiKeyAuth(validateKey, headerName = 'x-api-key') {
    return auth(async (ctx) => {
        const apiKey = ctx.request.headers.get(headerName);
        if (!apiKey) {
            return { valid: false };
        }
        return validateKey(apiKey);
    });
}
// ==========================================================================
// Helper Functions
// ==========================================================================
function handleCORS(request, config) {
    const headers = new Headers();
    const origin = request.headers.get('origin') || '*';
    if (config.origins === '*') {
        headers.set('Access-Control-Allow-Origin', '*');
    }
    else if (config.origins?.includes(origin)) {
        headers.set('Access-Control-Allow-Origin', origin);
        headers.set('Vary', 'Origin');
    }
    if (config.methods) {
        headers.set('Access-Control-Allow-Methods', config.methods.join(', '));
    }
    if (config.headers) {
        headers.set('Access-Control-Allow-Headers', config.headers.join(', '));
    }
    if (config.credentials) {
        headers.set('Access-Control-Allow-Credentials', 'true');
    }
    if (config.maxAge) {
        headers.set('Access-Control-Max-Age', String(config.maxAge));
    }
    return new Response(null, { status: 204, headers });
}
function addCORSHeaders(response, request, config) {
    const newResponse = new Response(response.body, response);
    const origin = request.headers.get('origin') || '*';
    if (config.origins === '*') {
        newResponse.headers.set('Access-Control-Allow-Origin', '*');
    }
    else if (config.origins?.includes(origin)) {
        newResponse.headers.set('Access-Control-Allow-Origin', origin);
        newResponse.headers.set('Vary', 'Origin');
    }
    if (config.credentials) {
        newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    return newResponse;
}
function addCacheHeaders(response, config) {
    const newResponse = new Response(response.body, response);
    if (config.ttl) {
        let cacheControl = `public, max-age=${config.ttl}`;
        if (config.staleWhileRevalidate) {
            cacheControl += `, stale-while-revalidate=${config.staleWhileRevalidate}`;
        }
        newResponse.headers.set('Cache-Control', cacheControl);
    }
    if (config.tags) {
        newResponse.headers.set('Cache-Tag', config.tags.join(','));
    }
    return newResponse;
}
async function validateRequest(ctx, schema) {
    const errors = [];
    // Validate query params
    if (schema.query) {
        const url = new URL(ctx.request.url);
        for (const [field, rules] of Object.entries(schema.query)) {
            const value = url.searchParams.get(field);
            const error = validateField(field, value, rules);
            if (error)
                errors.push(error);
        }
    }
    // Validate headers
    if (schema.headers) {
        for (const [field, rules] of Object.entries(schema.headers)) {
            const value = ctx.request.headers.get(field);
            const error = validateField(field, value, rules);
            if (error)
                errors.push(error);
        }
    }
    // Validate params
    if (schema.params && ctx.params) {
        const params = ctx.params;
        for (const [field, rules] of Object.entries(schema.params)) {
            const value = params[field];
            const error = validateField(field, value, rules);
            if (error)
                errors.push(error);
        }
    }
    // Validate body
    if (schema.body && ['POST', 'PUT', 'PATCH'].includes(ctx.request.method)) {
        try {
            const body = ctx.state?.get('body') || await ctx.request.clone().json();
            for (const [field, rules] of Object.entries(schema.body)) {
                const value = body[field];
                const error = validateField(field, value, rules);
                if (error)
                    errors.push(error);
            }
        }
        catch {
            errors.push('Invalid request body');
        }
    }
    if (errors.length > 0) {
        return new Response(JSON.stringify({ errors }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    return null;
}
function validateField(field, value, rules) {
    if (rules.required && (value === undefined || value === null || value === '')) {
        return `${field} is required`;
    }
    if (value === undefined || value === null) {
        return null;
    }
    switch (rules.type) {
        case 'string':
            if (typeof value !== 'string') {
                return `${field} must be a string`;
            }
            if (rules.min !== undefined && value.length < rules.min) {
                return `${field} must be at least ${rules.min} characters`;
            }
            if (rules.max !== undefined && value.length > rules.max) {
                return `${field} must be at most ${rules.max} characters`;
            }
            if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
                return `${field} has invalid format`;
            }
            if (rules.enum && !rules.enum.includes(value)) {
                return `${field} must be one of: ${rules.enum.join(', ')}`;
            }
            break;
        case 'number':
            const num = Number(value);
            if (isNaN(num)) {
                return `${field} must be a number`;
            }
            if (rules.min !== undefined && num < rules.min) {
                return `${field} must be at least ${rules.min}`;
            }
            if (rules.max !== undefined && num > rules.max) {
                return `${field} must be at most ${rules.max}`;
            }
            break;
        case 'boolean':
            if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
                return `${field} must be a boolean`;
            }
            break;
        case 'array':
            if (!Array.isArray(value)) {
                return `${field} must be an array`;
            }
            if (rules.min !== undefined && value.length < rules.min) {
                return `${field} must have at least ${rules.min} items`;
            }
            if (rules.max !== undefined && value.length > rules.max) {
                return `${field} must have at most ${rules.max} items`;
            }
            break;
        case 'object':
            if (typeof value !== 'object' || Array.isArray(value)) {
                return `${field} must be an object`;
            }
            break;
    }
    return null;
}
// ==========================================================================
// Response Helpers
// ==========================================================================
/**
 * JSON response helper
 */
export function json(data, init) {
    return new Response(JSON.stringify(data), {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...init?.headers,
        },
    });
}
/**
 * HTML response helper
 */
export function html(content, init) {
    return new Response(content, {
        ...init,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            ...init?.headers,
        },
    });
}
/**
 * Text response helper
 */
export function text(content, init) {
    return new Response(content, {
        ...init,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            ...init?.headers,
        },
    });
}
/**
 * Redirect response helper
 */
export function redirect(url, status = 302) {
    return new Response(null, {
        status,
        headers: { Location: url },
    });
}
/**
 * Stream response helper
 */
export function stream(generator, init) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            for await (const chunk of generator()) {
                const data = typeof chunk === 'string' ? encoder.encode(chunk) : chunk;
                controller.enqueue(data);
            }
            controller.close();
        },
    });
    return new Response(stream, init);
}
//# sourceMappingURL=edge-functions.js.map