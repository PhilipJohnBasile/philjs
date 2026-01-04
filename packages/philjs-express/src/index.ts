/**
 * PhilJS Express Middleware
 * 
 * Express.js integration for PhilJS SSR.
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';

export interface PhilJSMiddlewareOptions {
    /** Path to the PhilJS app entry */
    appEntry?: string;
    /** Enable SSR */
    ssr?: boolean;
    /** SSR render function */
    render?: (url: string, context: RenderContext) => Promise<string>;
    /** Static file serving path */
    staticPath?: string;
}

export interface RenderContext {
    url: string;
    headers: Record<string, string>;
    cookies: Record<string, string>;
    state: Record<string, any>;
}

/**
 * Create PhilJS middleware for Express
 * 
 * @example
 * ```ts
 * import express from 'express';
 * import { createPhilJSMiddleware } from '@philjs/express';
 * import { render } from './entry-server';
 * 
 * const app = express();
 * 
 * app.use(createPhilJSMiddleware({
 *   ssr: true,
 *   render: async (url, ctx) => render(url, ctx),
 * }));
 * 
 * app.listen(3000);
 * ```
 */
export function createPhilJSMiddleware(options: PhilJSMiddlewareOptions = {}): RequestHandler {
    const { ssr = true, render, staticPath = '/assets' } = options;

    return async (req: Request, res: Response, next: NextFunction) => {
        // Skip API routes
        if (req.path.startsWith('/api')) {
            return next();
        }

        // Skip static assets
        if (req.path.startsWith(staticPath)) {
            return next();
        }

        // Skip non-HTML requests
        const accept = req.headers.accept || '';
        if (!accept.includes('text/html')) {
            return next();
        }

        try {
            if (ssr && render) {
                const context: RenderContext = {
                    url: req.originalUrl,
                    headers: req.headers as Record<string, string>,
                    cookies: req.cookies || {},
                    state: {},
                };

                const html = await render(req.originalUrl, context);
                res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
            } else {
                // SPA mode - serve index.html
                next();
            }
        } catch (error) {
            console.error('[PhilJS Express] SSR Error:', error);
            next(error);
        }
    };
}

/**
 * Static file middleware with caching
 */
export function staticMiddleware(path: string, options: { maxAge?: number } = {}): RequestHandler {
    const { maxAge = 86400 } = options;

    return (req: Request, res: Response, next: NextFunction) => {
        res.set('Cache-Control', `public, max-age=${maxAge}`);
        next();
    };
}

/**
 * Error handler for PhilJS apps
 */
export function errorHandler() {
    return (err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error('[PhilJS Express] Error:', err);

        res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Server Error</title></head>
        <body>
          <h1>500 - Server Error</h1>
          <p>${process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'}</p>
        </body>
      </html>
    `);
    };
}

/**
 * API route helper
 */
export function createApiHandler(handler: (req: Request, res: Response) => Promise<any>): RequestHandler {
    return async (req, res, next) => {
        try {
            const result = await handler(req, res);
            if (result !== undefined) {
                res.json(result);
            }
        } catch (error) {
            next(error);
        }
    };
}

export default { createPhilJSMiddleware, staticMiddleware, errorHandler, createApiHandler };
