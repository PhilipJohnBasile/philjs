// @ts-nocheck
/**
 * PhilJS Meta - API Route Handlers
 *
 * Implements type-safe API route handlers with:
 * - GET, POST, PUT, PATCH, DELETE handlers
 * - Type-safe request/response
 * - Schema validation
 * - Error handling
 */
/**
 * API response helpers
 */
export const APIResponse = {
    /**
     * JSON response
     */
    json(data, init) {
        return new Response(JSON.stringify(data), {
            status: 200,
            ...init,
            headers: {
                'Content-Type': 'application/json',
                ...init?.headers,
            },
        });
    },
    /**
     * Success response
     */
    ok(data, init) {
        return APIResponse.json({ success: true, data }, init);
    },
    /**
     * Created response (201)
     */
    created(data, init) {
        return APIResponse.json(data, { status: 201, ...init });
    },
    /**
     * No content response (204)
     */
    noContent() {
        return new Response(null, { status: 204 });
    },
    /**
     * Bad request response (400)
     */
    badRequest(message = 'Bad Request', errors) {
        return APIResponse.json({ success: false, error: message, errors }, { status: 400 });
    },
    /**
     * Unauthorized response (401)
     */
    unauthorized(message = 'Unauthorized') {
        return APIResponse.json({ success: false, error: message }, { status: 401 });
    },
    /**
     * Forbidden response (403)
     */
    forbidden(message = 'Forbidden') {
        return APIResponse.json({ success: false, error: message }, { status: 403 });
    },
    /**
     * Not found response (404)
     */
    notFound(message = 'Not Found') {
        return APIResponse.json({ success: false, error: message }, { status: 404 });
    },
    /**
     * Method not allowed response (405)
     */
    methodNotAllowed(allowed) {
        return new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), {
            status: 405,
            headers: {
                'Content-Type': 'application/json',
                Allow: allowed.join(', '),
            },
        });
    },
    /**
     * Conflict response (409)
     */
    conflict(message = 'Conflict') {
        return APIResponse.json({ success: false, error: message }, { status: 409 });
    },
    /**
     * Unprocessable entity response (422)
     */
    unprocessableEntity(errors) {
        return APIResponse.json({ success: false, error: 'Validation Failed', errors }, { status: 422 });
    },
    /**
     * Too many requests response (429)
     */
    tooManyRequests(retryAfter) {
        return new Response(JSON.stringify({ success: false, error: 'Too Many Requests' }), {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': retryAfter.toString(),
            },
        });
    },
    /**
     * Internal server error response (500)
     */
    internalError(message = 'Internal Server Error') {
        return APIResponse.json({ success: false, error: message }, { status: 500 });
    },
    /**
     * Redirect response
     */
    redirect(url, status = 302) {
        return new Response(null, {
            status,
            headers: { Location: url },
        });
    },
    /**
     * Stream response
     */
    stream(stream, contentType = 'application/octet-stream', init) {
        return new Response(stream, {
            ...init,
            headers: {
                'Content-Type': contentType,
                ...init?.headers,
            },
        });
    },
    /**
     * SSE (Server-Sent Events) response
     */
    sse(stream) {
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        });
    },
};
/**
 * Create API route handler
 */
export function createAPIRoute(config) {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    const allowedMethods = methods.filter((m) => config[m]);
    return {
        allowedMethods,
        config,
        async handle(middlewareContext) {
            const method = middlewareContext.request.method;
            const handler = config[method];
            if (!handler) {
                return APIResponse.methodNotAllowed(allowedMethods);
            }
            try {
                // Parse query parameters
                const query = parseQueryParams(middlewareContext.url.searchParams);
                // Validate query if schema provided
                if (config.querySchema) {
                    const result = config.querySchema.safeParse(query);
                    if (!result.success) {
                        return APIResponse.badRequest('Invalid query parameters', formatSchemaErrors(result.error));
                    }
                }
                // Parse and validate body if needed
                let body = undefined;
                if (['POST', 'PUT', 'PATCH'].includes(method)) {
                    try {
                        const contentType = middlewareContext.request.headers.get('content-type') || '';
                        if (contentType.includes('application/json')) {
                            body = await middlewareContext.request.json();
                        }
                        else if (contentType.includes('application/x-www-form-urlencoded')) {
                            const text = await middlewareContext.request.text();
                            const params = new URLSearchParams(text);
                            const formBody = {};
                            params.forEach((value, key) => {
                                formBody[key] = value;
                            });
                            body = formBody;
                        }
                        else if (contentType.includes('multipart/form-data')) {
                            const formData = await middlewareContext.request.formData();
                            const formBody = {};
                            formData.forEach((value, key) => {
                                formBody[key] = value;
                            });
                            body = formBody;
                        }
                    }
                    catch {
                        return APIResponse.badRequest('Invalid request body');
                    }
                    // Validate body if schema provided
                    if (config.bodySchema) {
                        const result = config.bodySchema.safeParse(body);
                        if (!result.success) {
                            return APIResponse.unprocessableEntity(formatSchemaErrors(result.error));
                        }
                        body = result.data;
                    }
                }
                // Create API context
                const context = {
                    request: middlewareContext.request,
                    params: middlewareContext.params,
                    query: query,
                    body,
                    headers: middlewareContext.request.headers,
                    responseHeaders: middlewareContext.responseHeaders,
                    cookies: parseCookies(middlewareContext.request.headers.get('cookie') || ''),
                    requestId: middlewareContext.requestId,
                    ip: middlewareContext.ip,
                    locals: middlewareContext.locals,
                };
                // Execute handler
                return await handler(context);
            }
            catch (error) {
                console.error('API route error:', error);
                if (error instanceof Response) {
                    return error;
                }
                return APIResponse.internalError(process.env.NODE_ENV === 'development'
                    ? error instanceof Error
                        ? error.message
                        : String(error)
                    : 'Internal Server Error');
            }
        },
    };
}
/**
 * Parse query parameters
 */
function parseQueryParams(searchParams) {
    const params = {};
    searchParams.forEach((value, key) => {
        const existing = params[key];
        if (existing) {
            if (Array.isArray(existing)) {
                existing.push(value);
            }
            else {
                params[key] = [existing, value];
            }
        }
        else {
            params[key] = value;
        }
    });
    return params;
}
/**
 * Parse cookies
 */
function parseCookies(cookieHeader) {
    const cookies = {};
    cookieHeader.split(';').forEach((cookie) => {
        const [name, ...rest] = cookie.trim().split('=');
        if (name) {
            cookies[name] = rest.join('=');
        }
    });
    return cookies;
}
/**
 * Format schema errors for response
 */
function formatSchemaErrors(error) {
    const errors = {};
    for (const issue of error.issues) {
        const path = issue.path.join('.') || '_root';
        if (!errors[path]) {
            errors[path] = [];
        }
        errors[path].push(issue.message);
    }
    return errors;
}
/**
 * Create type-safe API handler
 */
export function defineAPIHandler(_path, config) {
    return createAPIRoute(config);
}
/**
 * SSE (Server-Sent Events) utilities
 */
export const SSE = {
    /**
     * Create an SSE stream
     */
    createStream() {
        let controller = null;
        const stream = new ReadableStream({
            start(c) {
                controller = c;
            },
        });
        return {
            stream,
            send(event) {
                if (!controller)
                    return;
                let message = '';
                if (event.id)
                    message += `id: ${event.id}\n`;
                if (event.event)
                    message += `event: ${event.event}\n`;
                if (event.retry)
                    message += `retry: ${event.retry}\n`;
                const data = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
                message += `data: ${data}\n\n`;
                controller.enqueue(message);
            },
            close() {
                if (controller) {
                    controller.close();
                }
            },
        };
    },
    /**
     * Create an SSE response
     */
    response(handler) {
        const sseStream = SSE.createStream();
        // Run handler asynchronously
        Promise.resolve(handler(sseStream)).catch((error) => {
            console.error('SSE handler error:', error);
            sseStream.close();
        });
        return APIResponse.sse(sseStream.stream.pipeThrough(new TextEncoderStream()));
    },
};
/**
 * Type-safe request body parser
 */
export async function parseBody(request, schema) {
    const contentType = request.headers.get('content-type') || '';
    let body;
    if (contentType.includes('application/json')) {
        body = await request.json();
    }
    else if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await request.text();
        const params = new URLSearchParams(text);
        const formBody = {};
        params.forEach((value, key) => {
            formBody[key] = value;
        });
        body = formBody;
    }
    else if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const formBody = {};
        formData.forEach((value, key) => {
            formBody[key] = value;
        });
        body = formBody;
    }
    else {
        body = await request.text();
    }
    if (schema) {
        return schema.parse(body);
    }
    return body;
}
/**
 * Zod-like schema builder for simple validation
 */
export const z = {
    string() {
        return new StringSchema();
    },
    number() {
        return new NumberSchema();
    },
    boolean() {
        return new BooleanSchema();
    },
    object(shape) {
        return new ObjectSchema(shape);
    },
    array(schema) {
        return new ArraySchema(schema);
    },
    enum(values) {
        return new EnumSchema(values);
    },
};
/**
 * Base schema class
 */
class BaseSchema {
    _optional = false;
    _nullable = false;
    safeParse(data) {
        try {
            return { success: true, data: this.parse(data) };
        }
        catch (error) {
            if (error instanceof ValidationError) {
                return {
                    success: false,
                    error: {
                        message: error.message,
                        path: error.path,
                        issues: error.issues,
                    },
                };
            }
            return {
                success: false,
                error: {
                    message: String(error),
                    path: [],
                    issues: [{ message: String(error), path: [], code: 'unknown' }],
                },
            };
        }
    }
    optional() {
        this._optional = true;
        return this;
    }
    nullable() {
        this._nullable = true;
        return this;
    }
}
class ValidationError extends Error {
    path;
    issues;
    constructor(message, path, issues) {
        super(message);
        this.path = path;
        this.issues = issues;
    }
}
class StringSchema extends BaseSchema {
    _minLength;
    _maxLength;
    _pattern;
    _email = false;
    parse(data) {
        if (this._optional && data === undefined)
            return undefined;
        if (this._nullable && data === null)
            return null;
        if (typeof data !== 'string') {
            throw new ValidationError('Expected string', [], [{ message: 'Expected string', path: [], code: 'invalid_type' }]);
        }
        if (this._minLength !== undefined && data.length < this._minLength) {
            throw new ValidationError(`String must be at least ${this._minLength} characters`, [], [{ message: `String must be at least ${this._minLength} characters`, path: [], code: 'too_small' }]);
        }
        if (this._maxLength !== undefined && data.length > this._maxLength) {
            throw new ValidationError(`String must be at most ${this._maxLength} characters`, [], [{ message: `String must be at most ${this._maxLength} characters`, path: [], code: 'too_big' }]);
        }
        if (this._pattern && !this._pattern.test(data)) {
            throw new ValidationError('String does not match pattern', [], [{ message: 'String does not match pattern', path: [], code: 'invalid_string' }]);
        }
        if (this._email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
            throw new ValidationError('Invalid email address', [], [{ message: 'Invalid email address', path: [], code: 'invalid_string' }]);
        }
        return data;
    }
    min(length) {
        this._minLength = length;
        return this;
    }
    max(length) {
        this._maxLength = length;
        return this;
    }
    regex(pattern) {
        this._pattern = pattern;
        return this;
    }
    email() {
        this._email = true;
        return this;
    }
}
class NumberSchema extends BaseSchema {
    _min;
    _max;
    _int = false;
    parse(data) {
        if (this._optional && data === undefined)
            return undefined;
        if (this._nullable && data === null)
            return null;
        const num = typeof data === 'string' ? parseFloat(data) : data;
        if (typeof num !== 'number' || isNaN(num)) {
            throw new ValidationError('Expected number', [], [{ message: 'Expected number', path: [], code: 'invalid_type' }]);
        }
        if (this._int && !Number.isInteger(num)) {
            throw new ValidationError('Expected integer', [], [{ message: 'Expected integer', path: [], code: 'invalid_type' }]);
        }
        if (this._min !== undefined && num < this._min) {
            throw new ValidationError(`Number must be at least ${this._min}`, [], [{ message: `Number must be at least ${this._min}`, path: [], code: 'too_small' }]);
        }
        if (this._max !== undefined && num > this._max) {
            throw new ValidationError(`Number must be at most ${this._max}`, [], [{ message: `Number must be at most ${this._max}`, path: [], code: 'too_big' }]);
        }
        return num;
    }
    min(value) {
        this._min = value;
        return this;
    }
    max(value) {
        this._max = value;
        return this;
    }
    int() {
        this._int = true;
        return this;
    }
}
class BooleanSchema extends BaseSchema {
    parse(data) {
        if (this._optional && data === undefined)
            return undefined;
        if (this._nullable && data === null)
            return null;
        if (typeof data === 'boolean')
            return data;
        if (data === 'true')
            return true;
        if (data === 'false')
            return false;
        throw new ValidationError('Expected boolean', [], [{ message: 'Expected boolean', path: [], code: 'invalid_type' }]);
    }
}
class ObjectSchema extends BaseSchema {
    shape;
    constructor(shape) {
        super();
        this.shape = shape;
    }
    parse(data) {
        if (this._optional && data === undefined)
            return undefined;
        if (this._nullable && data === null)
            return null;
        if (typeof data !== 'object' || data === null) {
            throw new ValidationError('Expected object', [], [{ message: 'Expected object', path: [], code: 'invalid_type' }]);
        }
        const result = {};
        const issues = [];
        for (const [key, schema] of Object.entries(this.shape)) {
            try {
                result[key] = schema.parse(data[key]);
            }
            catch (error) {
                if (error instanceof ValidationError) {
                    issues.push(...error.issues.map((issue) => ({
                        ...issue,
                        path: [key, ...issue.path],
                    })));
                }
            }
        }
        if (issues.length > 0) {
            throw new ValidationError('Validation failed', [], issues);
        }
        return result;
    }
}
class ArraySchema extends BaseSchema {
    itemSchema;
    _minLength;
    _maxLength;
    constructor(itemSchema) {
        super();
        this.itemSchema = itemSchema;
    }
    parse(data) {
        if (this._optional && data === undefined)
            return undefined;
        if (this._nullable && data === null)
            return null;
        if (!Array.isArray(data)) {
            throw new ValidationError('Expected array', [], [{ message: 'Expected array', path: [], code: 'invalid_type' }]);
        }
        if (this._minLength !== undefined && data.length < this._minLength) {
            throw new ValidationError(`Array must have at least ${this._minLength} items`, [], [{ message: `Array must have at least ${this._minLength} items`, path: [], code: 'too_small' }]);
        }
        if (this._maxLength !== undefined && data.length > this._maxLength) {
            throw new ValidationError(`Array must have at most ${this._maxLength} items`, [], [{ message: `Array must have at most ${this._maxLength} items`, path: [], code: 'too_big' }]);
        }
        const issues = [];
        const result = [];
        for (let i = 0; i < data.length; i++) {
            try {
                result.push(this.itemSchema.parse(data[i]));
            }
            catch (error) {
                if (error instanceof ValidationError) {
                    issues.push(...error.issues.map((issue) => ({
                        ...issue,
                        path: [i, ...issue.path],
                    })));
                }
            }
        }
        if (issues.length > 0) {
            throw new ValidationError('Validation failed', [], issues);
        }
        return result;
    }
    min(length) {
        this._minLength = length;
        return this;
    }
    max(length) {
        this._maxLength = length;
        return this;
    }
}
class EnumSchema extends BaseSchema {
    values;
    constructor(values) {
        super();
        this.values = values;
    }
    parse(data) {
        if (this._optional && data === undefined)
            return undefined;
        if (this._nullable && data === null)
            return null;
        if (!this.values.includes(data)) {
            throw new ValidationError(`Expected one of: ${this.values.join(', ')}`, [], [{ message: `Expected one of: ${this.values.join(', ')}`, path: [], code: 'invalid_enum_value' }]);
        }
        return data;
    }
}
//# sourceMappingURL=api-routes.js.map