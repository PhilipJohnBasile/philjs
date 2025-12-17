/**
 * PhilJS API Server Utilities
 *
 * Create and handle API routes with type safety.
 */
/**
 * Create an API handler from route handlers
 */
export function createAPIHandler(handlers) {
    return async (context) => {
        const method = context.request.method.toUpperCase();
        const handler = handlers[method];
        if (!handler) {
            return new Response(JSON.stringify({ error: `Method ${method} not allowed` }), {
                status: 405,
                headers: {
                    'Content-Type': 'application/json',
                    Allow: Object.keys(handlers).join(', '),
                },
            });
        }
        return handler(context);
    };
}
/**
 * Define an API route with type safety
 */
export function defineAPIRoute(config) {
    const { method, handler, middleware = [] } = config;
    const methods = method
        ? Array.isArray(method)
            ? method.map((m) => m.toUpperCase())
            : [method.toUpperCase()]
        : null;
    return async (context) => {
        // Check method
        if (methods && !methods.includes(context.request.method.toUpperCase())) {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        // Run middleware chain
        let index = 0;
        const next = async () => {
            if (index < middleware.length) {
                const mw = middleware[index++];
                return mw(context, next);
            }
            return handler(context);
        };
        return next();
    };
}
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
 * Text response helper
 */
export function text(data, init) {
    return new Response(data, {
        ...init,
        headers: {
            'Content-Type': 'text/plain',
            ...init?.headers,
        },
    });
}
/**
 * HTML response helper
 */
export function html(data, init) {
    return new Response(data, {
        ...init,
        headers: {
            'Content-Type': 'text/html',
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
 * Not found response helper
 */
export function notFound(message = 'Not Found') {
    return json({ error: message }, { status: 404 });
}
/**
 * Bad request response helper
 */
export function badRequest(message = 'Bad Request', errors) {
    return json({ error: message, errors }, { status: 400 });
}
/**
 * Unauthorized response helper
 */
export function unauthorized(message = 'Unauthorized') {
    return json({ error: message }, { status: 401 });
}
/**
 * Forbidden response helper
 */
export function forbidden(message = 'Forbidden') {
    return json({ error: message }, { status: 403 });
}
/**
 * Server error response helper
 */
export function serverError(message = 'Internal Server Error') {
    return json({ error: message }, { status: 500 });
}
/**
 * Parse request body based on content type
 */
export async function parseBody(request) {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return request.json();
    }
    if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await request.text();
        return Object.fromEntries(new URLSearchParams(text));
    }
    if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        return data;
    }
    return request.text();
}
/**
 * Create API context from request
 */
export async function createAPIContext(request, params = {}, platform) {
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams);
    const body = await parseBody(request);
    const rawBody = request.body ? await request.text() : null;
    const cookies = new Map();
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
        cookieHeader.split(';').forEach((cookie) => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                cookies.set(name, decodeURIComponent(value));
            }
        });
    }
    const responseHeaders = new Headers();
    const responseCookies = [];
    let responseStatus = 200;
    return {
        request: {
            url,
            method: request.method,
            headers: request.headers,
            params,
            query,
            body,
            rawBody,
            raw: request,
        },
        response: {
            setHeader(name, value) {
                responseHeaders.set(name, value);
            },
            setStatus(status) {
                responseStatus = status;
            },
            appendHeader(name, value) {
                responseHeaders.append(name, value);
            },
        },
        getCookie(name) {
            return cookies.get(name);
        },
        setCookie(name, value, options = {}) {
            const cookie = serializeCookie(name, value, options);
            responseCookies.push(cookie);
        },
        deleteCookie(name) {
            const cookie = serializeCookie(name, '', { maxAge: 0 });
            responseCookies.push(cookie);
        },
        getSession: async () => {
            // Session implementation
            return {
                id: 'session-id',
                data: {},
                get: () => undefined,
                set: () => { },
                delete: () => { },
                clear: () => { },
            };
        },
        platform,
        env: process.env,
    };
}
function serializeCookie(name, value, options = {}) {
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    if (options.maxAge) {
        cookie += `; Max-Age=${options.maxAge}`;
    }
    if (options.expires) {
        cookie += `; Expires=${options.expires.toUTCString()}`;
    }
    if (options.path) {
        cookie += `; Path=${options.path}`;
    }
    if (options.domain) {
        cookie += `; Domain=${options.domain}`;
    }
    if (options.secure) {
        cookie += '; Secure';
    }
    if (options.httpOnly) {
        cookie += '; HttpOnly';
    }
    if (options.sameSite) {
        cookie += `; SameSite=${options.sameSite}`;
    }
    return cookie;
}
//# sourceMappingURL=server.js.map