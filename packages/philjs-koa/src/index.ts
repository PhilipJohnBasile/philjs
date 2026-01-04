import type { Context, Middleware, Next } from 'koa';

export interface PhilJSOptions {
    render: (url: string, context?: any) => Promise<string>;
}

export function philjsMiddleware(options: PhilJSOptions): Middleware {
    return async (ctx: Context, next: Next) => {
        // Skip static assets or API routes if not handled
        if (ctx.path.startsWith('/assets') || ctx.path.startsWith('/api')) {
            return next();
        }

        try {
            const html = await options.render(ctx.url, ctx);
            ctx.body = html;
            ctx.type = 'text/html';
        } catch (err) {
            console.error('PhilJS SSR Error:', err);
            // Fallback or next() depending on error type
            ctx.status = 500;
            ctx.body = 'Internal Server Error';
        }
    };
}
