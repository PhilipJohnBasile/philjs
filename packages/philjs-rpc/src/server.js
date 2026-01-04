/**
 * Server-side request handler for philjs-rpc.
 * Processes RPC requests and executes procedures.
 */
import { RPCError } from './types.js';
import { getProcedureAtPath } from './createAPI.js';
import { executeProcedure } from './procedure.js';
import { executeMiddlewareChain } from './middleware.js';
// ============================================================================
// Handler Creation
// ============================================================================
/**
 * Create a request handler for the API.
 *
 * @example
 * ```ts
 * import { createHandler } from 'philjs-rpc/server';
 * import { api } from './api';
 *
 * export const handler = createHandler(api);
 *
 * // Use with Node.js http
 * http.createServer(async (req, res) => {
 *   await handler(adaptNodeRequest(req), adaptNodeResponse(res));
 * });
 *
 * // Use with Express
 * app.post('/api/rpc', async (req, res) => {
 *   await handler(adaptExpressRequest(req), adaptExpressResponse(res));
 * });
 * ```
 */
export function createHandler(api, options) {
    const { basePath = '', createContext = () => ({}), onError, batching = true, } = options ?? {};
    return async (req, res) => {
        try {
            // Create context from request
            const ctx = await createContext(req);
            // Parse request body
            const body = await req.json();
            // Check if this is a batch request
            if (batching && isBatchRequest(body)) {
                const responses = await handleBatchRequest(api, body, ctx, onError);
                res.status(200).json({ responses });
                return;
            }
            // Handle single request
            const response = await handleSingleRequest(api, body, ctx, onError);
            // Determine status code
            const statusCode = response.error
                ? getHttpStatusCode(response.error.code)
                : 200;
            res.status(statusCode).json(response);
        }
        catch (error) {
            // Handle unexpected errors
            const rpcError = error instanceof RPCError
                ? error
                : new RPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    cause: error,
                });
            if (onError) {
                onError(rpcError, {});
            }
            const response = {
                error: {
                    code: rpcError.code,
                    message: rpcError.message,
                },
            };
            res.status(getHttpStatusCode(rpcError.code)).json(response);
        }
    };
}
/**
 * Handle a single RPC request.
 */
async function handleSingleRequest(api, request, ctx, onError) {
    try {
        const { path, type, input } = request;
        // Get procedure at path
        const procedure = getProcedureAtPath(api._def.router, path);
        if (!procedure) {
            throw new RPCError({
                code: 'NOT_FOUND',
                message: `Procedure not found: ${path}`,
            });
        }
        // Verify procedure type matches request type
        if (procedure._type !== type) {
            throw new RPCError({
                code: 'METHOD_NOT_ALLOWED',
                message: `Procedure "${path}" is a ${procedure._type}, not a ${type}`,
            });
        }
        // Execute global middlewares first
        let result;
        if (api._def.middlewares.length > 0) {
            const middlewareResult = await executeMiddlewareChain(api._def.middlewares, {
                ctx,
                input,
                type,
                path,
                handler: async (ctxFromMiddleware) => executeProcedure(procedure, { input, ctx: ctxFromMiddleware, path }),
            });
            if (!middlewareResult.ok) {
                throw middlewareResult.error;
            }
            result = middlewareResult.data;
        }
        else {
            // No global middleware, execute procedure directly
            result = await executeProcedure(procedure, { input, ctx, path });
        }
        return {
            result: { data: result },
        };
    }
    catch (error) {
        const rpcError = error instanceof RPCError
            ? error
            : new RPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error',
                cause: error,
            });
        if (onError) {
            onError(rpcError, ctx);
        }
        return {
            error: {
                code: rpcError.code,
                message: rpcError.message,
            },
        };
    }
}
/**
 * Handle a batch of RPC requests.
 */
async function handleBatchRequest(api, batchRequest, ctx, onError) {
    const { requests } = batchRequest;
    // Execute all requests in parallel
    const responses = await Promise.all(requests.map((request) => handleSingleRequest(api, request, ctx, onError)));
    return responses;
}
/**
 * Check if a request is a batch request.
 */
function isBatchRequest(body) {
    return (typeof body === 'object' &&
        body !== null &&
        'requests' in body &&
        Array.isArray(body.requests));
}
/**
 * Get HTTP status code from RPC error code.
 */
function getHttpStatusCode(code) {
    const codes = {
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        METHOD_NOT_ALLOWED: 405,
        TIMEOUT: 408,
        CONFLICT: 409,
        PRECONDITION_FAILED: 412,
        PAYLOAD_TOO_LARGE: 413,
        UNPROCESSABLE_ENTITY: 422,
        TOO_MANY_REQUESTS: 429,
        CLIENT_CLOSED_REQUEST: 499,
        INTERNAL_SERVER_ERROR: 500,
    };
    return codes[code] ?? 500;
}
// ============================================================================
// Runtime Adapters
// ============================================================================
/**
 * Create a handler for Node.js http.IncomingMessage and http.ServerResponse.
 *
 * @example
 * ```ts
 * import http from 'http';
 * import { createNodeHandler } from 'philjs-rpc/server';
 * import { api } from './api';
 *
 * const handler = createNodeHandler(api);
 *
 * http.createServer(handler).listen(3000);
 * ```
 */
export function createNodeHandler(api, options) {
    const handler = createHandler(api, options);
    return async (req, res) => {
        const adapted = adaptNodeRequest(req);
        const adaptedRes = adaptNodeResponse(res);
        await handler(adapted, adaptedRes);
    };
}
/**
 * Adapt Node.js request to RequestAdapter.
 */
function adaptNodeRequest(req) {
    let bodyPromise = null;
    return {
        method: req.method ?? 'GET',
        url: req.url ?? '/',
        headers: req.headers,
        query: parseQueryString(req.url ?? ''),
        json: () => {
            if (!bodyPromise) {
                bodyPromise = new Promise((resolve, reject) => {
                    let body = '';
                    req.on('data', (chunk) => {
                        body += chunk.toString();
                    });
                    req.on('end', () => {
                        try {
                            resolve(JSON.parse(body || '{}'));
                        }
                        catch (error) {
                            reject(new RPCError({
                                code: 'BAD_REQUEST',
                                message: 'Invalid JSON body',
                                cause: error,
                            }));
                        }
                    });
                });
            }
            return bodyPromise;
        },
    };
}
/**
 * Adapt Node.js response to ResponseAdapter.
 */
function adaptNodeResponse(res) {
    const adapter = {
        status: (code) => {
            res.statusCode = code;
            return adapter;
        },
        header: (name, value) => {
            res.setHeader(name, value);
            return adapter;
        },
        json: (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
        },
    };
    return adapter;
}
/**
 * Create a handler for Fetch API Request/Response.
 *
 * @example
 * ```ts
 * import { createFetchHandler } from 'philjs-rpc/server';
 * import { api } from './api';
 *
 * const handler = createFetchHandler(api);
 *
 * // Use with Cloudflare Workers, Deno, Bun, etc.
 * export default {
 *   fetch: handler,
 * };
 * ```
 */
export function createFetchHandler(api, options) {
    const handler = createHandler(api, options);
    return async (request) => {
        let status = 200;
        const responseHeaders = {};
        let responseBody;
        const adapted = adaptFetchRequest(request);
        const adaptedRes = {
            status: (code) => {
                status = code;
                return adaptedRes;
            },
            header: (name, value) => {
                responseHeaders[name] = value;
                return adaptedRes;
            },
            json: (data) => {
                responseBody = data;
            },
        };
        await handler(adapted, adaptedRes);
        return new Response(JSON.stringify(responseBody), {
            status,
            headers: {
                'Content-Type': 'application/json',
                ...responseHeaders,
            },
        });
    };
}
/**
 * Adapt Fetch API Request to RequestAdapter.
 */
function adaptFetchRequest(request) {
    const url = new URL(request.url);
    return {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        query: Object.fromEntries(url.searchParams.entries()),
        json: () => request.json(),
    };
}
/**
 * Create a handler for Express.js.
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { createExpressHandler } from 'philjs-rpc/server';
 * import { api } from './api';
 *
 * const app = express();
 * app.use(express.json());
 * app.post('/api/rpc', createExpressHandler(api));
 * ```
 */
export function createExpressHandler(api, options) {
    const handler = createHandler(api, options);
    return async (req, res) => {
        const adapted = adaptExpressRequest(req);
        const adaptedRes = adaptExpressResponse(res);
        await handler(adapted, adaptedRes);
    };
}
/**
 * Adapt Express.js request to RequestAdapter.
 */
function adaptExpressRequest(req) {
    return {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        json: async () => req.body,
    };
}
/**
 * Adapt Express.js response to ResponseAdapter.
 */
function adaptExpressResponse(res) {
    const adapter = {
        status: (code) => {
            res.status(code);
            return adapter;
        },
        header: (name, value) => {
            res.setHeader(name, value);
            return adapter;
        },
        json: (data) => {
            res.json(data);
        },
    };
    return adapter;
}
/**
 * Create a handler for Vercel Serverless Functions.
 *
 * @example
 * ```ts
 * // api/rpc.ts
 * import { createVercelHandler } from 'philjs-rpc/server';
 * import { api } from '../src/api';
 *
 * export default createVercelHandler(api);
 * ```
 */
export function createVercelHandler(api, options) {
    const handler = createHandler(api, options);
    return async (req, res) => {
        const adapted = {
            method: req.method ?? 'GET',
            url: req.url ?? '/',
            headers: req.headers,
            query: req.query,
            json: async () => req.body,
        };
        const adaptedRes = {
            status: (code) => {
                res.status(code);
                return adaptedRes;
            },
            header: (name, value) => {
                res.setHeader(name, value);
                return adaptedRes;
            },
            json: (data) => {
                res.json(data);
            },
        };
        await handler(adapted, adaptedRes);
    };
}
/**
 * Create a handler for Netlify Functions.
 *
 * @example
 * ```ts
 * // netlify/functions/rpc.ts
 * import { createNetlifyHandler } from 'philjs-rpc/server';
 * import { api } from '../../src/api';
 *
 * export const handler = createNetlifyHandler(api);
 * ```
 */
export function createNetlifyHandler(api, options) {
    const rpcHandler = createHandler(api, options);
    return async (event) => {
        let status = 200;
        const headers = {};
        let body = '';
        const adapted = {
            method: event.httpMethod,
            url: event.path,
            headers: event.headers,
            query: event.queryStringParameters ?? {},
            json: async () => {
                try {
                    return JSON.parse(event.body || '{}');
                }
                catch {
                    throw new RPCError({
                        code: 'BAD_REQUEST',
                        message: 'Invalid JSON body',
                    });
                }
            },
        };
        const adaptedRes = {
            status: (code) => {
                status = code;
                return adaptedRes;
            },
            header: (name, value) => {
                headers[name] = value;
                return adaptedRes;
            },
            json: (data) => {
                body = JSON.stringify(data);
                headers['Content-Type'] = 'application/json';
            },
        };
        await rpcHandler(adapted, adaptedRes);
        return {
            statusCode: status,
            headers,
            body,
        };
    };
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Parse query string from URL.
 */
function parseQueryString(url) {
    const queryIndex = url.indexOf('?');
    if (queryIndex === -1)
        return {};
    const queryString = url.slice(queryIndex + 1);
    const params = {};
    for (const pair of queryString.split('&')) {
        const [key, value = ''] = pair.split('=').map(decodeURIComponent);
        if (key) {
            const existing = params[key];
            if (existing !== undefined) {
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
        }
    }
    return params;
}
//# sourceMappingURL=server.js.map