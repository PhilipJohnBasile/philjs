/**
 * PhilJS OpenAPI - Swagger UI Middleware
 *
 * Serve Swagger UI for API documentation.
 */
import type { OpenAPISpec, SwaggerUIOptions } from './types.js';
/**
 * Create Swagger UI middleware handler
 *
 * @example
 * ```ts
 * import { swaggerUI } from 'philjs-openapi';
 *
 * // Serve Swagger UI at /docs
 * app.get('/docs', swaggerUI({ spec }));
 *
 * // Or with custom options
 * app.get('/docs', swaggerUI({
 *   specUrl: '/openapi.json',
 *   title: 'My API Docs',
 *   config: {
 *     tryItOutEnabled: true,
 *     persistAuthorization: true,
 *   }
 * }));
 * ```
 */
export declare function swaggerUI(options: SwaggerUIOptions): () => Response;
/**
 * Create routes for Swagger UI and OpenAPI spec
 *
 * @example
 * ```ts
 * import { createSwaggerRoutes } from 'philjs-openapi';
 *
 * const { docs, spec: specRoute } = createSwaggerRoutes(spec, {
 *   title: 'My API',
 * });
 *
 * app.get('/docs', docs);
 * app.get('/openapi.json', specRoute);
 * ```
 */
export declare function createSwaggerRoutes(spec: OpenAPISpec, options?: Omit<SwaggerUIOptions, 'spec' | 'specUrl'>): {
    docs: () => Response;
    spec: () => Response;
};
/**
 * Create a handler that serves the OpenAPI spec as JSON
 *
 * @example
 * ```ts
 * import { specHandler } from 'philjs-openapi';
 *
 * app.get('/openapi.json', specHandler(spec));
 * ```
 */
export declare function specHandler(spec: OpenAPISpec): () => Response;
/**
 * Create ReDoc middleware handler
 *
 * @example
 * ```ts
 * import { redoc } from 'philjs-openapi';
 *
 * // Serve ReDoc at /docs
 * app.get('/docs', redoc({ spec }));
 * ```
 */
export declare function redoc(options: {
    spec?: OpenAPISpec | string;
    specUrl?: string;
    title?: string;
    favicon?: string;
    customCss?: string;
    config?: {
        disableSearch?: boolean;
        expandDefaultServerVariables?: boolean;
        expandResponses?: string;
        hideDownloadButton?: boolean;
        hideHostname?: boolean;
        hideLoading?: boolean;
        hideSingleRequestSampleTab?: boolean;
        jsonSampleExpandLevel?: number | 'all';
        lazyRendering?: boolean;
        menuToggle?: boolean;
        nativeScrollbars?: boolean;
        pathInMiddlePanel?: boolean;
        requiredPropsFirst?: boolean;
        scrollYOffset?: number | string;
        showExtensions?: boolean;
        sortPropsAlphabetically?: boolean;
        suppressWarnings?: boolean;
        theme?: Record<string, unknown>;
        untrustedSpec?: boolean;
    };
}): () => Response;
/**
 * Create complete API documentation routes
 *
 * @example
 * ```ts
 * import { createDocsRoutes } from 'philjs-openapi';
 *
 * const docsRoutes = createDocsRoutes(spec, {
 *   title: 'My API',
 *   basePath: '/api',
 * });
 *
 * // This creates:
 * // GET /api/docs - Swagger UI
 * // GET /api/redoc - ReDoc
 * // GET /api/openapi.json - OpenAPI spec
 *
 * for (const [path, handler] of Object.entries(docsRoutes)) {
 *   app.get(path, handler);
 * }
 * ```
 */
export declare function createDocsRoutes(spec: OpenAPISpec, options?: {
    title?: string;
    basePath?: string;
    swaggerConfig?: SwaggerUIOptions['config'];
    redocConfig?: Parameters<typeof redoc>[0]['config'];
}): Record<string, () => Response>;
//# sourceMappingURL=swagger-ui.d.ts.map