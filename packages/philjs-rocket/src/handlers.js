/**
 * PhilJS Rocket Handlers
 *
 * Request and response handler utilities for Rocket framework.
 * Provides type-safe request handling and response building.
 */
// ============================================================================
// Response Builder
// ============================================================================
/**
 * Response builder for constructing responses
 */
export class ResponseBuilder {
    _status = 200;
    _headers = new Map();
    _body = null;
    _cookies = [];
    /**
     * Set response status
     */
    status(code) {
        this._status = code;
        return this;
    }
    /**
     * Set response header
     */
    header(name, value) {
        this._headers.set(name, value);
        return this;
    }
    /**
     * Set multiple headers
     */
    headers(headers) {
        for (const [name, value] of Object.entries(headers)) {
            this._headers.set(name, value);
        }
        return this;
    }
    /**
     * Set Content-Type header
     */
    contentType(type) {
        return this.header('Content-Type', type);
    }
    /**
     * Set cache control header
     */
    cache(maxAge, options) {
        let value = `max-age=${maxAge}`;
        if (options?.public)
            value = `public, ${value}`;
        if (options?.immutable)
            value = `${value}, immutable`;
        return this.header('Cache-Control', value);
    }
    /**
     * Disable caching
     */
    noCache() {
        return this.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
    /**
     * Set a cookie
     */
    cookie(name, value, options) {
        let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
        if (options?.maxAge)
            cookie += `; Max-Age=${options.maxAge}`;
        if (options?.expires)
            cookie += `; Expires=${options.expires.toUTCString()}`;
        if (options?.path)
            cookie += `; Path=${options.path}`;
        if (options?.domain)
            cookie += `; Domain=${options.domain}`;
        if (options?.secure)
            cookie += '; Secure';
        if (options?.httpOnly)
            cookie += '; HttpOnly';
        if (options?.sameSite)
            cookie += `; SameSite=${options.sameSite}`;
        this._cookies.push(cookie);
        return this;
    }
    /**
     * Delete a cookie
     */
    deleteCookie(name) {
        return this.cookie(name, '', { maxAge: 0 });
    }
    /**
     * Build HTML response
     */
    html(content) {
        return this.contentType('text/html; charset=utf-8').body(content).build();
    }
    /**
     * Build JSON response
     */
    json(data) {
        return this.contentType('application/json').body(JSON.stringify(data)).build();
    }
    /**
     * Build text response
     */
    text(content) {
        return this.contentType('text/plain; charset=utf-8').body(content).build();
    }
    /**
     * Set response body
     */
    body(content) {
        this._body = content;
        return this;
    }
    /**
     * Build the response
     */
    build() {
        const headers = {};
        this._headers.forEach((value, key) => {
            headers[key] = value;
        });
        // Add cookies to headers
        if (this._cookies.length > 0) {
            headers['Set-Cookie'] = this._cookies.join(', ');
        }
        return {
            status: this._status,
            headers,
            body: this._body || '',
        };
    }
}
// ============================================================================
// Response Helpers
// ============================================================================
/**
 * Create an HTML response
 */
export function html(content, status = 200) {
    return new ResponseBuilder().status(status).html(content);
}
/**
 * Create a JSON response
 */
export function json(data, status = 200) {
    return new ResponseBuilder().status(status).json(data);
}
/**
 * Create a text response
 */
export function text(content, status = 200) {
    return new ResponseBuilder().status(status).text(content);
}
/**
 * Create a redirect response
 */
export function redirect(url, status = 302) {
    return new ResponseBuilder()
        .status(status)
        .header('Location', url)
        .body('')
        .build();
}
/**
 * Create a not found response
 */
export function notFound(message = 'Not Found') {
    return json({ error: message }, 404);
}
/**
 * Create a bad request response
 */
export function badRequest(message = 'Bad Request', errors) {
    return json({ error: message, errors }, 400);
}
/**
 * Create an unauthorized response
 */
export function unauthorized(message = 'Unauthorized') {
    return json({ error: message }, 401);
}
/**
 * Create a forbidden response
 */
export function forbidden(message = 'Forbidden') {
    return json({ error: message }, 403);
}
/**
 * Create a server error response
 */
export function serverError(message = 'Internal Server Error') {
    return json({ error: message }, 500);
}
/**
 * Create a no content response
 */
export function noContent() {
    return new ResponseBuilder().status(204).body('').build();
}
/**
 * Create a created response
 */
export function created(data, location) {
    const builder = new ResponseBuilder().status(201);
    if (location)
        builder.header('Location', location);
    return builder.json(data);
}
// ============================================================================
// Handler Composition
// ============================================================================
/**
 * Create a handler with middleware
 */
export function withMiddleware(handler, ...middleware) {
    return async (ctx) => {
        let index = 0;
        const next = async () => {
            if (index < middleware.length) {
                const mw = middleware[index++];
                return mw(ctx, next);
            }
            return handler(ctx);
        };
        return next();
    };
}
/**
 * Create a typed handler
 */
export function createHandler(handler) {
    return handler;
}
/**
 * Create an async handler
 */
export function createAsyncHandler(handler) {
    return handler;
}
// ============================================================================
// Route Definition Helpers
// ============================================================================
/**
 * Define a GET route handler
 */
export function get(handler) {
    return { method: 'GET', handler };
}
/**
 * Define a POST route handler
 */
export function post(handler) {
    return { method: 'POST', handler };
}
/**
 * Define a PUT route handler
 */
export function put(handler) {
    return { method: 'PUT', handler };
}
/**
 * Define a DELETE route handler
 */
export function del(handler) {
    return { method: 'DELETE', handler };
}
/**
 * Define a PATCH route handler
 */
export function patch(handler) {
    return { method: 'PATCH', handler };
}
// ============================================================================
// Request Parsing
// ============================================================================
/**
 * Parse JSON body
 */
export async function parseJson(request) {
    const text = await request.text();
    return JSON.parse(text);
}
/**
 * Parse form data
 */
export async function parseForm(request) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const result = {};
    params.forEach((value, key) => {
        result[key] = value;
    });
    return result;
}
/**
 * Parse multipart form data
 */
export async function parseMultipart(request) {
    return request.formData();
}
/**
 * Get a path parameter
 */
export function getParam(ctx, name) {
    return ctx.request.params[name];
}
/**
 * Get a required path parameter (throws if missing)
 */
export function requireParam(ctx, name) {
    const value = ctx.request.params[name];
    if (!value) {
        throw new Error(`Missing required parameter: ${name}`);
    }
    return value;
}
/**
 * Get a query parameter
 */
export function getQuery(ctx, name) {
    return ctx.request.query[name];
}
/**
 * Get a header value
 */
export function getHeader(ctx, name) {
    return ctx.request.headers.get(name) || undefined;
}
// ============================================================================
// Rust Code Generation
// ============================================================================
/**
 * Generate Rust handler code
 */
export function generateRustHandler(name, method, path) {
    const methodLower = method.toLowerCase();
    return `
use rocket::{${methodLower}, get, post, put, delete, patch};
use rocket::serde::json::Json;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ${name}Response {
    pub success: bool,
    pub message: String,
}

#[${methodLower}("${path}")]
pub async fn ${name.toLowerCase()}() -> Json<${name}Response> {
    Json(${name}Response {
        success: true,
        message: "OK".to_string(),
    })
}
`.trim();
}
/**
 * Generate Rust handler with body
 */
export function generateRustHandlerWithBody(name, method, path, bodyType) {
    const methodLower = method.toLowerCase();
    return `
use rocket::{${methodLower}};
use rocket::serde::json::Json;
use serde::{Serialize, Deserialize};

#[derive(Debug, Deserialize)]
pub struct ${bodyType} {
    // Add fields here
}

#[derive(Debug, Serialize)]
pub struct ${name}Response {
    pub success: bool,
    pub message: String,
}

#[${methodLower}("${path}", format = "json", data = "<body>")]
pub async fn ${name.toLowerCase()}(body: Json<${bodyType}>) -> Json<${name}Response> {
    Json(${name}Response {
        success: true,
        message: "OK".to_string(),
    })
}
`.trim();
}
//# sourceMappingURL=handlers.js.map