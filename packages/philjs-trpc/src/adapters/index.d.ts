/**
 * @philjs/trpc - Platform adapters
 * Adapters for various server frameworks - no external dependencies
 */
import type { AdapterConfig } from '../types.js';
/**
 * Create Express adapter
 */
export declare function createExpressAdapter(config: AdapterConfig): (req: {
    body: unknown;
    headers: Record<string, string>;
}, res: {
    json: (data: unknown) => void;
    status: (code: number) => {
        json: (data: unknown) => void;
    };
}) => Promise<void>;
/**
 * Create Fastify adapter
 */
export declare function createFastifyAdapter(config: AdapterConfig): (request: {
    body: unknown;
}, reply: {
    send: (data: unknown) => void;
    code: (code: number) => {
        send: (data: unknown) => void;
    };
}) => Promise<void>;
/**
 * Create Hono adapter
 */
export declare function createHonoAdapter(config: AdapterConfig): (c: {
    req: {
        json: () => Promise<unknown>;
    };
    json: (data: unknown, status?: number) => Response;
}) => Promise<Response>;
/**
 * Create Cloudflare Workers adapter
 */
export declare function createCloudflareAdapter(config: AdapterConfig): {
    fetch(request: Request): Promise<Response>;
};
/**
 * Create AWS Lambda adapter
 */
export declare function createLambdaAdapter(config: AdapterConfig): (event: {
    body: string;
    headers: Record<string, string>;
}) => Promise<{
    statusCode: number;
    body: string;
    headers: Record<string, string>;
}>;
/**
 * Create standalone HTTP server (Node.js)
 */
export declare function createStandaloneServer(config: AdapterConfig & {
    port?: number;
}): {
    listen(port?: number): Promise<void>;
    close(): Promise<void>;
};
//# sourceMappingURL=index.d.ts.map