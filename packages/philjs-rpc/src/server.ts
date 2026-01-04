/**
 * Server-side request handler for philjs-rpc.
 * Processes RPC requests and executes procedures.
 */

import type {
  APIDefinition,
  Router,
  ProcedureContext,
  RPCRequest,
  RPCResponse,
  RPCBatchRequest,
  RPCBatchResponse,
  RPCErrorCode,
  RequestAdapter,
  ResponseAdapter,
  HandlerOptions,
  HandlerFn,
  RPC_ERROR_CODES_TO_HTTP,
} from './types.js';
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
export function createHandler<TRouter extends Router>(
  api: APIDefinition<TRouter>,
  options?: HandlerOptions
): HandlerFn {
  const {
    basePath = '',
    createContext = () => ({}),
    onError,
    batching = true,
  } = options ?? {};

  return async (req: RequestAdapter, res: ResponseAdapter): Promise<void> => {
    try {
      // Create context from request
      const ctx = await createContext(req);

      // Parse request body
      const body = await req.json();

      // Check if this is a batch request
      if (batching && isBatchRequest(body)) {
        const responses = await handleBatchRequest(api, body as RPCBatchRequest, ctx, onError);
        res.status(200).json({ responses });
        return;
      }

      // Handle single request
      const response = await handleSingleRequest(api, body as RPCRequest, ctx, onError);

      // Determine status code
      const statusCode = response.error
        ? getHttpStatusCode(response.error.code)
        : 200;

      res.status(statusCode).json(response);
    } catch (error) {
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

      const response: RPCResponse = {
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
async function handleSingleRequest<TRouter extends Router>(
  api: APIDefinition<TRouter>,
  request: RPCRequest,
  ctx: ProcedureContext,
  onError?: (error: unknown, ctx: ProcedureContext) => void
): Promise<RPCResponse> {
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
    let result: unknown;

    if (api._def.middlewares.length > 0) {
      const middlewareResult = await executeMiddlewareChain(api._def.middlewares, {
        ctx,
        input,
        type,
        path,
        handler: async (ctxFromMiddleware) =>
          executeProcedure(procedure, { input, ctx: ctxFromMiddleware, path }),
      });

      if (!middlewareResult.ok) {
        throw middlewareResult.error;
      }

      result = middlewareResult.data;
    } else {
      // No global middleware, execute procedure directly
      result = await executeProcedure(procedure, { input, ctx, path });
    }

    return {
      result: { data: result },
    };
  } catch (error) {
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
async function handleBatchRequest<TRouter extends Router>(
  api: APIDefinition<TRouter>,
  batchRequest: RPCBatchRequest,
  ctx: ProcedureContext,
  onError?: (error: unknown, ctx: ProcedureContext) => void
): Promise<RPCResponse[]> {
  const { requests } = batchRequest;

  // Execute all requests in parallel
  const responses = await Promise.all(
    requests.map((request) => handleSingleRequest(api, request, ctx, onError))
  );

  return responses;
}

/**
 * Check if a request is a batch request.
 */
function isBatchRequest(body: unknown): body is RPCBatchRequest {
  return (
    typeof body === 'object' &&
    body !== null &&
    'requests' in body &&
    Array.isArray((body as RPCBatchRequest).requests)
  );
}

/**
 * Get HTTP status code from RPC error code.
 */
function getHttpStatusCode(code: RPCErrorCode): number {
  const codes: Record<RPCErrorCode, number> = {
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
export function createNodeHandler<TRouter extends Router>(
  api: APIDefinition<TRouter>,
  options?: HandlerOptions
): (req: NodeRequest, res: NodeResponse) => Promise<void> {
  const handler = createHandler(api, options);

  return async (req: NodeRequest, res: NodeResponse) => {
    const adapted = adaptNodeRequest(req);
    const adaptedRes = adaptNodeResponse(res);
    await handler(adapted, adaptedRes);
  };
}

/**
 * Node.js request type.
 */
interface NodeRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  on(event: 'data', listener: (chunk: Buffer) => void): this;
  on(event: 'end', listener: () => void): this;
}

/**
 * Node.js response type.
 */
interface NodeResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(data?: string): void;
}

/**
 * Adapt Node.js request to RequestAdapter.
 */
function adaptNodeRequest(req: NodeRequest): RequestAdapter {
  let bodyPromise: Promise<unknown> | null = null;

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
            } catch (error) {
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
function adaptNodeResponse(res: NodeResponse): ResponseAdapter {
  const adapter: ResponseAdapter = {
    status: (code: number) => {
      res.statusCode = code;
      return adapter;
    },
    header: (name: string, value: string) => {
      res.setHeader(name, value);
      return adapter;
    },
    json: (data: unknown) => {
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
export function createFetchHandler<TRouter extends Router>(
  api: APIDefinition<TRouter>,
  options?: HandlerOptions
): (request: Request) => Promise<Response> {
  const handler = createHandler(api, options);

  return async (request: Request): Promise<Response> => {
    let status = 200;
    const responseHeaders: Record<string, string> = {};
    let responseBody: unknown;

    const adapted = adaptFetchRequest(request);
    const adaptedRes: ResponseAdapter = {
      status: (code: number) => {
        status = code;
        return adaptedRes;
      },
      header: (name: string, value: string) => {
        responseHeaders[name] = value;
        return adaptedRes;
      },
      json: (data: unknown) => {
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
function adaptFetchRequest(request: Request): RequestAdapter {
  const url = new URL(request.url);

  return {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries((request.headers as any).entries()),
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
export function createExpressHandler<TRouter extends Router>(
  api: APIDefinition<TRouter>,
  options?: HandlerOptions
): (req: ExpressRequest, res: ExpressResponse) => Promise<void> {
  const handler = createHandler(api, options);

  return async (req: ExpressRequest, res: ExpressResponse) => {
    const adapted = adaptExpressRequest(req);
    const adaptedRes = adaptExpressResponse(res);
    await handler(adapted, adaptedRes);
  };
}

/**
 * Express.js request type.
 */
interface ExpressRequest {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body: unknown;
}

/**
 * Express.js response type.
 */
interface ExpressResponse {
  status(code: number): ExpressResponse;
  setHeader(name: string, value: string): void;
  json(data: unknown): void;
}

/**
 * Adapt Express.js request to RequestAdapter.
 */
function adaptExpressRequest(req: ExpressRequest): RequestAdapter {
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
function adaptExpressResponse(res: ExpressResponse): ResponseAdapter {
  const adapter: ResponseAdapter = {
    status: (code: number) => {
      res.status(code);
      return adapter;
    },
    header: (name: string, value: string) => {
      res.setHeader(name, value);
      return adapter;
    },
    json: (data: unknown) => {
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
export function createVercelHandler<TRouter extends Router>(
  api: APIDefinition<TRouter>,
  options?: HandlerOptions
): (req: VercelRequest, res: VercelResponse) => Promise<void> {
  const handler = createHandler(api, options);

  return async (req: VercelRequest, res: VercelResponse) => {
    const adapted: RequestAdapter = {
      method: req.method ?? 'GET',
      url: req.url ?? '/',
      headers: req.headers as Record<string, string | string[] | undefined>,
      query: req.query as Record<string, string | string[] | undefined>,
      json: async () => req.body,
    };

    const adaptedRes: ResponseAdapter = {
      status: (code: number) => {
        res.status(code);
        return adaptedRes;
      },
      header: (name: string, value: string) => {
        res.setHeader(name, value);
        return adaptedRes;
      },
      json: (data: unknown) => {
        res.json(data);
      },
    };

    await handler(adapted, adaptedRes);
  };
}

/**
 * Vercel request type.
 */
interface VercelRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body: unknown;
}

/**
 * Vercel response type.
 */
interface VercelResponse {
  status(code: number): VercelResponse;
  setHeader(name: string, value: string): VercelResponse;
  json(data: unknown): void;
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
export function createNetlifyHandler<TRouter extends Router>(
  api: APIDefinition<TRouter>,
  options?: HandlerOptions
): (event: NetlifyEvent) => Promise<NetlifyResponse> {
  const rpcHandler = createHandler(api, options);

  return async (event: NetlifyEvent): Promise<NetlifyResponse> => {
    let status = 200;
    const headers: Record<string, string> = {};
    let body = '';

    const adapted: RequestAdapter = {
      method: event.httpMethod,
      url: event.path,
      headers: event.headers,
      query: event.queryStringParameters ?? {},
      json: async () => {
        try {
          return JSON.parse(event.body || '{}');
        } catch {
          throw new RPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid JSON body',
          });
        }
      },
    };

    const adaptedRes: ResponseAdapter = {
      status: (code: number) => {
        status = code;
        return adaptedRes;
      },
      header: (name: string, value: string) => {
        headers[name] = value;
        return adaptedRes;
      },
      json: (data: unknown) => {
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

/**
 * Netlify event type.
 */
interface NetlifyEvent {
  httpMethod: string;
  path: string;
  headers: Record<string, string | undefined>;
  queryStringParameters: Record<string, string | undefined> | null;
  body: string | null;
}

/**
 * Netlify response type.
 */
interface NetlifyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse query string from URL.
 */
function parseQueryString(url: string): Record<string, string | string[] | undefined> {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return {};

  const queryString = url.slice(queryIndex + 1);
  const params: Record<string, string | string[] | undefined> = {};

  for (const pair of queryString.split('&')) {
    const [key, value = ''] = pair.split('=').map(decodeURIComponent);
    if (key) {
      const existing = params[key];
      if (existing !== undefined) {
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          params[key] = [existing, value];
        }
      } else {
        params[key] = value;
      }
    }
  }

  return params;
}
