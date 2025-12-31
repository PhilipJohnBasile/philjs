/**
 * Server-side request handler for philjs-rpc.
 * Processes RPC requests and executes procedures.
 */
import type { APIDefinition, Router, HandlerOptions, HandlerFn } from './types.js';
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
export declare function createHandler<TRouter extends Router>(api: APIDefinition<TRouter>, options?: HandlerOptions): HandlerFn;
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
export declare function createNodeHandler<TRouter extends Router>(api: APIDefinition<TRouter>, options?: HandlerOptions): (req: NodeRequest, res: NodeResponse) => Promise<void>;
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
export declare function createFetchHandler<TRouter extends Router>(api: APIDefinition<TRouter>, options?: HandlerOptions): (request: Request) => Promise<Response>;
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
export declare function createExpressHandler<TRouter extends Router>(api: APIDefinition<TRouter>, options?: HandlerOptions): (req: ExpressRequest, res: ExpressResponse) => Promise<void>;
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
export declare function createVercelHandler<TRouter extends Router>(api: APIDefinition<TRouter>, options?: HandlerOptions): (req: VercelRequest, res: VercelResponse) => Promise<void>;
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
export declare function createNetlifyHandler<TRouter extends Router>(api: APIDefinition<TRouter>, options?: HandlerOptions): (event: NetlifyEvent) => Promise<NetlifyResponse>;
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
export {};
//# sourceMappingURL=server.d.ts.map