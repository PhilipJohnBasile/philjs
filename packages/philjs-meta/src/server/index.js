/**
 * PhilJS Meta - Server Module
 *
 * Server middleware and API route exports
 */
// Middleware
export { createMiddlewareContext, MiddlewareChain, NextResponse, cors, auth, rateLimit, securityHeaders, logger, compression, bodyParser, } from './middleware.js';
// API Routes
export { createAPIRoute, defineAPIHandler, parseBody, APIResponse, SSE, z, } from './api-routes.js';
//# sourceMappingURL=index.js.map