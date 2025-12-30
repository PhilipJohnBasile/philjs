/**
 * PhilJS OpenAPI - Swagger UI Middleware
 *
 * Serve Swagger UI for API documentation.
 */

import type { OpenAPISpec, SwaggerUIOptions } from './types.js';

// Swagger UI CDN URLs
const SWAGGER_UI_VERSION = '5.10.3';
const SWAGGER_UI_CSS = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css`;
const SWAGGER_UI_BUNDLE = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js`;
const SWAGGER_UI_PRESET = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-standalone-preset.js`;

/**
 * Default Swagger UI configuration
 */
const defaultConfig: SwaggerUIOptions['config'] = {
  deepLinking: true,
  displayOperationId: false,
  defaultModelsExpandDepth: 1,
  defaultModelExpandDepth: 1,
  displayRequestDuration: true,
  filter: true,
  showExtensions: false,
  showCommonExtensions: true,
  tryItOutEnabled: true,
  persistAuthorization: true,
};

/**
 * Generate Swagger UI HTML page
 */
function generateSwaggerHTML(options: SwaggerUIOptions): string {
  const {
    spec,
    specUrl,
    title = 'API Documentation',
    favicon = 'https://unpkg.com/swagger-ui-dist@5.10.3/favicon-32x32.png',
    customCss = '',
    customJs = '',
    config = {},
  } = options;

  const mergedConfig = { ...defaultConfig, ...config };

  // Determine spec source
  const specSource = spec
    ? typeof spec === 'string'
      ? `url: "${spec}"`
      : `spec: ${JSON.stringify(spec)}`
    : specUrl
    ? `url: "${specUrl}"`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="icon" type="image/png" href="${favicon}">
  <link rel="stylesheet" type="text/css" href="${SWAGGER_UI_CSS}">
  <style>
    html {
      box-sizing: border-box;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin: 0;
      background: #fafafa;
    }
    .swagger-ui .topbar {
      display: none;
    }
    .swagger-ui .info {
      margin: 20px 0;
    }
    .swagger-ui .info .title {
      font-size: 2em;
    }
    ${customCss}
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_UI_BUNDLE}"></script>
  <script src="${SWAGGER_UI_PRESET}"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        ${specSource},
        dom_id: '#swagger-ui',
        deepLinking: ${mergedConfig.deepLinking},
        displayOperationId: ${mergedConfig.displayOperationId},
        defaultModelsExpandDepth: ${mergedConfig.defaultModelsExpandDepth},
        defaultModelExpandDepth: ${mergedConfig.defaultModelExpandDepth},
        displayRequestDuration: ${mergedConfig.displayRequestDuration},
        filter: ${typeof mergedConfig.filter === 'string' ? `"${mergedConfig.filter}"` : mergedConfig.filter},
        showExtensions: ${mergedConfig.showExtensions},
        showCommonExtensions: ${mergedConfig.showCommonExtensions},
        tryItOutEnabled: ${mergedConfig.tryItOutEnabled},
        persistAuthorization: ${mergedConfig.persistAuthorization},
        ${mergedConfig.validatorUrl !== undefined ? `validatorUrl: ${mergedConfig.validatorUrl === null ? 'null' : `"${mergedConfig.validatorUrl}"`},` : ''}
        ${mergedConfig.withCredentials ? 'withCredentials: true,' : ''}
        ${mergedConfig.supportedSubmitMethods ? `supportedSubmitMethods: ${JSON.stringify(mergedConfig.supportedSubmitMethods)},` : ''}
        ${mergedConfig.maxDisplayedTags ? `maxDisplayedTags: ${mergedConfig.maxDisplayedTags},` : ''}
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
    ${customJs}
  </script>
</body>
</html>`;
}

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
export function swaggerUI(options: SwaggerUIOptions): () => Response {
  const html = generateSwaggerHTML(options);

  return () => {
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  };
}

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
export function createSwaggerRoutes(
  spec: OpenAPISpec,
  options: Omit<SwaggerUIOptions, 'spec' | 'specUrl'> = {}
): {
  docs: () => Response;
  spec: () => Response;
} {
  return {
    docs: swaggerUI({ ...options, spec }),
    spec: () =>
      new Response(JSON.stringify(spec, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }),
  };
}

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
export function specHandler(spec: OpenAPISpec): () => Response {
  const json = JSON.stringify(spec, null, 2);

  return () => {
    return new Response(json, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  };
}

/**
 * Generate ReDoc HTML page
 */
function generateReDocHTML(options: {
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
}): string {
  const {
    spec,
    specUrl,
    title = 'API Documentation',
    favicon = 'https://redocly.github.io/redoc/favicon.png',
    customCss = '',
    config = {},
  } = options;

  const specSource = spec
    ? typeof spec === 'string'
      ? `spec-url="${spec}"`
      : `spec='${JSON.stringify(spec)}'`
    : specUrl
    ? `spec-url="${specUrl}"`
    : '';

  const configAttrs = Object.entries(config)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      if (typeof value === 'boolean') {
        return value ? kebabKey : '';
      }
      if (typeof value === 'object') {
        return `${kebabKey}='${JSON.stringify(value)}'`;
      }
      return `${kebabKey}="${value}"`;
    })
    .filter(Boolean)
    .join(' ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="icon" type="image/png" href="${favicon}">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    ${customCss}
  </style>
</head>
<body>
  <redoc ${specSource} ${configAttrs}></redoc>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>`;
}

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
export function redoc(options: {
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
}): () => Response {
  const html = generateReDocHTML(options);

  return () => {
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  };
}

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
export function createDocsRoutes(
  spec: OpenAPISpec,
  options: {
    title?: string;
    basePath?: string;
    swaggerConfig?: SwaggerUIOptions['config'];
    redocConfig?: Parameters<typeof redoc>[0]['config'];
  } = {}
): Record<string, () => Response> {
  const { title, basePath = '', swaggerConfig, redocConfig } = options;

  return {
    [`${basePath}/docs`]: swaggerUI({
      spec,
      ...(title !== undefined ? { title } : {}),
      ...(swaggerConfig !== undefined ? { config: swaggerConfig } : {}),
    }),
    [`${basePath}/redoc`]: redoc({
      spec,
      ...(title !== undefined ? { title } : {}),
      ...(redocConfig !== undefined ? { config: redocConfig } : {}),
    }),
    [`${basePath}/openapi.json`]: specHandler(spec),
  };
}
