/**
 * PhilJS Hono Middleware
 */

import type { MiddlewareHandler, Context } from 'hono';

export interface PhilJSHonoOptions {
    ssr?: boolean;
    render?: (url: string, ctx: any) => Promise<string>;
}

export function philjs(options: PhilJSHonoOptions = {}): MiddlewareHandler {
    return async (c: Context, next) => {
        if (c.req.path.startsWith('/api')) return next();

        const accept = c.req.header('accept') || '';
        if (!accept.includes('text/html')) return next();

        if (options.ssr && options.render) {
            const html = await options.render(c.req.url, { headers: c.req.header() });
            return c.html(html);
        }
        return next();
    };
}

export default philjs;
