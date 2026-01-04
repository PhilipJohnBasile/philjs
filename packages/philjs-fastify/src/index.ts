/**
 * PhilJS Fastify Plugin
 * 
 * Fastify integration for PhilJS SSR.
 */

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';

export interface PhilJSPluginOptions {
    /** Enable SSR */
    ssr?: boolean;
    /** SSR render function */
    render?: (url: string, context: RenderContext) => Promise<string>;
    /** Routes to exclude from SSR */
    excludeRoutes?: string[];
}

export interface RenderContext {
    url: string;
    headers: Record<string, string>;
    cookies: Record<string, string>;
    state: Record<string, any>;
}

/**
 * PhilJS Fastify plugin
 * 
 * @example
 * ```ts
 * import Fastify from 'fastify';
 * import { philjsPlugin } from '@philjs/fastify';
 * import { render } from './entry-server';
 * 
 * const app = Fastify();
 * 
 * app.register(philjsPlugin, {
 *   ssr: true,
 *   render: async (url, ctx) => render(url, ctx),
 * });
 * 
 * app.listen({ port: 3000 });
 * ```
 */
export const philjsPlugin: FastifyPluginAsync<PhilJSPluginOptions> = async (fastify, options) => {
    const { ssr = true, render, excludeRoutes = ['/api', '/health'] } = options;

    // Add decorators
    fastify.decorateRequest('philjsContext', null);
    fastify.decorateReply('renderPhilJS', null);

    // Pre-handler to build context
    fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
        (request as any).philjsContext = {
            url: request.url,
            headers: request.headers as Record<string, string>,
            cookies: request.cookies || {},
            state: {},
        };

        (reply as any).renderPhilJS = async () => {
            if (!render) {
                throw new Error('No render function provided');
            }
            const html = await render(request.url, (request as any).philjsContext);
            reply.type('text/html').send(html);
        };
    });

    // Catch-all route for SSR
    if (ssr && render) {
        fastify.get('*', async (request: FastifyRequest, reply: FastifyReply) => {
            // Skip excluded routes
            for (const route of excludeRoutes) {
                if (request.url.startsWith(route)) {
                    return reply.callNotFound();
                }
            }

            // Skip non-HTML requests
            const accept = request.headers.accept || '';
            if (!accept.includes('text/html')) {
                return reply.callNotFound();
            }

            try {
                const context: RenderContext = {
                    url: request.url,
                    headers: request.headers as Record<string, string>,
                    cookies: (request as any).cookies || {},
                    state: {},
                };

                const html = await render(request.url, context);
                reply.type('text/html').send(html);
            } catch (error) {
                fastify.log.error(error);
                reply.status(500).send('Internal Server Error');
            }
        });
    }
};

/**
 * API route decorator
 */
export function createApiRoute<T>(handler: (request: FastifyRequest, reply: FastifyReply) => Promise<T>) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const result = await handler(request, reply);
            return result;
        } catch (error) {
            request.log.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    };
}

/**
 * Stream SSR helper for Fastify
 */
export function streamSSR(reply: FastifyReply, stream: ReadableStream<string>) {
    reply.raw.writeHead(200, {
        'Content-Type': 'text/html',
        'Transfer-Encoding': 'chunked',
    });

    const reader = stream.getReader();

    async function pump() {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            reply.raw.write(value);
        }
        reply.raw.end();
    }

    pump();
}

export default philjsPlugin;
