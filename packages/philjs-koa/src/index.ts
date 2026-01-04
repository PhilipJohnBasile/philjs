
import type { Context, Middleware } from 'koa';

export function philjsMiddleware(): Middleware {
    return async (ctx: Context, next: () => Promise<any>) => {
        // Basic stub for PhilJS SSR integration with Koa
        ctx.body = `<html><body><div id="root">PhilJS on Koa</div></body></html>`;
        await next();
    };
}
