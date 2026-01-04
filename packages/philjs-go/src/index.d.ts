/**
 * @philjs/go - Go Server Adapter for PhilJS
 *
 * High-performance Go server for PhilJS applications with:
 * - SSR (Server-Side Rendering)
 * - Edge function support
 * - API routes
 * - Static file serving
 * - WebSocket support
 *
 * @example
 * ```ts
 * import { createGoServer, GoServerConfig } from '@philjs/go';
 *
 * const config: GoServerConfig = {
 *   port: 3000,
 *   ssr: true,
 *   static: './dist',
 * };
 *
 * await createGoServer(config);
 * ```
 */
export * from './server.js';
export * from './codegen.js';
export * from './types.js';
//# sourceMappingURL=index.d.ts.map