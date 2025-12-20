/**
 * PhilJS OpenAPI - Spec Generator
 *
 * Automatic OpenAPI specification generation from PhilJS API definitions.
 * Inspired by Elysia's elegant API documentation.
 */

import {
  zodToJsonSchema,
  extractExample,
  getSchemaDescription,
  isZodSchema,
} from './zod-to-schema';
import type {
  APIDefinition,
  APIRouteDefinition,
  OpenAPISpec,
  OpenAPIOptions,
  OpenAPIPathItem,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPIRequestBody,
  OpenAPIResponse,
  OpenAPIComponents,
  JSONSchema,
  RouteGroup,
} from './types';

// HTTP methods
type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';

/**
 * Parse route string into method and path
 * Format: "METHOD /path" or "/path" (defaults to GET)
 */
function parseRoute(route: string): { method: HTTPMethod; path: string } {
  const parts = route.trim().split(/\s+/);

  if (parts.length === 1) {
    return { method: 'get', path: parts[0] };
  }

  const method = parts[0].toLowerCase() as HTTPMethod;
  const path = parts.slice(1).join(' ');

  return { method, path };
}

/**
 * Convert PhilJS path params to OpenAPI format
 * ":id" -> "{id}"
 */
function convertPathParams(path: string): string {
  return path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '{$1}');
}

/**
 * Extract path parameter names from path
 */
function extractPathParams(path: string): string[] {
  const matches = path.match(/:([a-zA-Z_][a-zA-Z0-9_]*)/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
}

/**
 * Generate operation ID from method and path
 */
function generateOperationId(method: string, path: string): string {
  const sanitizedPath = path
    .replace(/^\//, '')
    .replace(/\//g, '_')
    .replace(/[{}:]/g, '')
    .replace(/-/g, '_');

  return `${method}${sanitizedPath.charAt(0).toUpperCase()}${sanitizedPath.slice(1)}`;
}

/**
 * Generate OpenAPI parameters from route definition
 */
function generateParameters(
  route: APIRouteDefinition,
  pathParams: string[]
): OpenAPIParameter[] {
  const parameters: OpenAPIParameter[] = [];

  // Path parameters
  if (route.params && isZodSchema(route.params)) {
    const schema = zodToJsonSchema(route.params);
    if (schema.properties) {
      for (const [name, propSchema] of Object.entries(schema.properties)) {
        if (pathParams.includes(name)) {
          const param: OpenAPIParameter = {
            name,
            in: 'path',
            required: true,
            schema: propSchema as JSONSchema,
          };

          const description = getSchemaDescription(
            (route.params as unknown as Record<string, unknown>)?.[name]
          );
          if (description) param.description = description;

          const example = extractExample(
            (route.params as unknown as Record<string, unknown>)?.[name]
          );
          if (example !== undefined) param.example = example;

          parameters.push(param);
        }
      }
    }
  } else {
    // Add path params even without schema
    for (const name of pathParams) {
      parameters.push({
        name,
        in: 'path',
        required: true,
        schema: { type: 'string' },
      });
    }
  }

  // Query parameters
  if (route.query && isZodSchema(route.query)) {
    const schema = zodToJsonSchema(route.query);
    if (schema.properties) {
      const required = schema.required || [];
      for (const [name, propSchema] of Object.entries(schema.properties)) {
        const param: OpenAPIParameter = {
          name,
          in: 'query',
          required: required.includes(name),
          schema: propSchema as JSONSchema,
        };

        const description = getSchemaDescription(
          (route.query as unknown as Record<string, unknown>)?.[name]
        );
        if (description) param.description = description;

        const example = extractExample(
          (route.query as unknown as Record<string, unknown>)?.[name]
        );
        if (example !== undefined) param.example = example;

        parameters.push(param);
      }
    }
  }

  // Header parameters
  if (route.headers && isZodSchema(route.headers)) {
    const schema = zodToJsonSchema(route.headers);
    if (schema.properties) {
      const required = schema.required || [];
      for (const [name, propSchema] of Object.entries(schema.properties)) {
        parameters.push({
          name,
          in: 'header',
          required: required.includes(name),
          schema: propSchema as JSONSchema,
        });
      }
    }
  }

  return parameters;
}

/**
 * Generate request body from route definition
 */
function generateRequestBody(
  route: APIRouteDefinition,
  includeExamples: boolean
): OpenAPIRequestBody | undefined {
  if (!route.body || !isZodSchema(route.body)) {
    return undefined;
  }

  const schema = zodToJsonSchema(route.body);
  const description = getSchemaDescription(route.body);

  const mediaType: { schema: JSONSchema; example?: unknown } = { schema };

  if (includeExamples) {
    const example = extractExample(route.body);
    if (example !== undefined) {
      mediaType.example = example;
    }
  }

  if (route.examples?.request !== undefined) {
    mediaType.example = route.examples.request;
  }

  return {
    required: true,
    ...(description ? { description } : {}),
    content: {
      'application/json': mediaType,
    },
  };
}

/**
 * Generate responses from route definition
 */
function generateResponses(
  route: APIRouteDefinition,
  includeExamples: boolean,
  errorResponses?: OpenAPIOptions['errorResponses']
): Record<string, OpenAPIResponse> {
  const responses: Record<string, OpenAPIResponse> = {};

  // Success response
  if (route.response) {
    if (isZodSchema(route.response)) {
      // Single response schema (200)
      const schema = zodToJsonSchema(route.response);
      const description = getSchemaDescription(route.response) || 'Successful response';

      const mediaType: { schema: JSONSchema; example?: unknown } = { schema };

      if (includeExamples) {
        const example = extractExample(route.response);
        if (example !== undefined) {
          mediaType.example = example;
        }
      }

      if (route.examples?.response !== undefined) {
        mediaType.example = route.examples.response;
      }

      responses['200'] = {
        description,
        content: {
          'application/json': mediaType,
        },
      };
    } else if (typeof route.response === 'object') {
      // Multiple response schemas by status code
      for (const [statusCode, responseSchema] of Object.entries(route.response)) {
        if (isZodSchema(responseSchema)) {
          const schema = zodToJsonSchema(responseSchema);
          const description = getSchemaDescription(responseSchema) || `Response ${statusCode}`;

          responses[statusCode] = {
            description,
            content: {
              'application/json': { schema },
            },
          };
        }
      }
    }
  } else {
    // Default response
    responses['200'] = {
      description: 'Successful response',
    };
  }

  // Add common error responses
  if (errorResponses) {
    if (errorResponses[400]) responses['400'] = errorResponses[400];
    if (errorResponses[401]) responses['401'] = errorResponses[401];
    if (errorResponses[403]) responses['403'] = errorResponses[403];
    if (errorResponses[404]) responses['404'] = errorResponses[404];
    if (errorResponses[500]) responses['500'] = errorResponses[500];
  }

  return responses;
}

/**
 * Generate OpenAPI operation from route definition
 */
function generateOperation(
  route: APIRouteDefinition,
  method: HTTPMethod,
  path: string,
  options: OpenAPIOptions
): OpenAPIOperation {
  const pathParams = extractPathParams(path);
  const operationId =
    route.operationId ||
    options.operationIdTransform?.(method, path) ||
    generateOperationId(method, path);

  const operation: OpenAPIOperation = {
    operationId,
    responses: generateResponses(
      route,
      options.includeExamples ?? true,
      options.errorResponses
    ),
  };

  // Add metadata
  if (route.summary) operation.summary = route.summary;
  if (route.description) operation.description = route.description;
  if (route.tags && route.tags.length > 0) operation.tags = route.tags;
  if (route.deprecated) operation.deprecated = true;
  if (route.security) operation.security = route.security;

  // Add parameters
  const parameters = generateParameters(route, pathParams);
  if (parameters.length > 0) {
    operation.parameters = parameters;
  }

  // Add request body for methods that support it
  if (['post', 'put', 'patch'].includes(method)) {
    const requestBody = generateRequestBody(route, options.includeExamples ?? true);
    if (requestBody) {
      operation.requestBody = requestBody;
    }
  }

  return operation;
}

/**
 * Create typed API definition helper
 */
export function createAPI<T extends APIDefinition>(routes: T): T {
  return routes;
}

/**
 * Create route group
 */
export function group(config: RouteGroup): RouteGroup {
  return config;
}

/**
 * Generate OpenAPI specification from API definition
 */
export function openapi(
  api: APIDefinition | RouteGroup | RouteGroup[],
  options: OpenAPIOptions
): OpenAPISpec {
  const paths: Record<string, OpenAPIPathItem> = {};
  const components: OpenAPIComponents = {};
  const allTags = new Set<string>();

  // Handle route groups
  const processRoutes = (routes: APIDefinition, basePath = '', groupTags: string[] = []) => {
    for (const [routeKey, route] of Object.entries(routes)) {
      const { method, path: routePath } = parseRoute(routeKey);
      const fullPath = convertPathParams(
        (options.basePath || '') + basePath + routePath
      );

      // Initialize path item if needed
      if (!paths[fullPath]) {
        paths[fullPath] = {};
      }

      // Generate operation with merged tags
      const routeWithTags = {
        ...route,
        tags: [...groupTags, ...(route.tags || [])],
      };

      const operation = generateOperation(
        routeWithTags,
        method,
        routePath,
        options
      );

      // Track tags
      if (operation.tags) {
        operation.tags.forEach((tag) => allTags.add(tag));
      }

      // Add operation to path item
      paths[fullPath][method] = operation;
    }
  };

  // Process input
  if (Array.isArray(api)) {
    // Array of route groups
    for (const group of api) {
      processRoutes(group.routes, group.basePath || '', [group.name]);
    }
  } else if ('routes' in api && 'name' in api) {
    // Single route group
    const group = api as RouteGroup;
    processRoutes(group.routes, group.basePath || '', [group.name]);
  } else {
    // Plain API definition
    processRoutes(api as APIDefinition);
  }

  // Add security schemes to components
  if (options.securitySchemes) {
    components.securitySchemes = options.securitySchemes;
  }

  // Build tags from groups and options
  const tags = options.tags || [];
  const groupTags = Array.isArray(api)
    ? api.map((g) => ({ name: g.name, description: g.description }))
    : 'routes' in api && 'name' in api
    ? [{ name: (api as RouteGroup).name, description: (api as RouteGroup).description }]
    : [];

  // Merge and deduplicate tags
  const mergedTags = [...tags, ...groupTags].filter(
    (tag, index, self) => self.findIndex((t) => t.name === tag.name) === index
  );

  // Build final spec
  const spec: OpenAPISpec = {
    openapi: '3.1.0',
    info: options.info,
    paths,
  };

  if (options.servers && options.servers.length > 0) {
    spec.servers = options.servers;
  }

  if (mergedTags.length > 0) {
    spec.tags = mergedTags;
  }

  if (Object.keys(components).length > 0) {
    spec.components = components;
  }

  if (options.security) {
    spec.security = options.security;
  }

  if (options.externalDocs) {
    spec.externalDocs = options.externalDocs;
  }

  return spec;
}

/**
 * Merge multiple API definitions
 */
export function mergeAPIs(...apis: APIDefinition[]): APIDefinition {
  return Object.assign({}, ...apis);
}

/**
 * Create common security schemes
 */
export const securitySchemes = {
  /**
   * Bearer token authentication
   */
  bearer: (format = 'JWT') => ({
    type: 'http' as const,
    scheme: 'bearer',
    bearerFormat: format,
  }),

  /**
   * API key authentication
   */
  apiKey: (name: string, location: 'header' | 'query' | 'cookie' = 'header') => ({
    type: 'apiKey' as const,
    name,
    in: location,
  }),

  /**
   * Basic authentication
   */
  basic: () => ({
    type: 'http' as const,
    scheme: 'basic',
  }),

  /**
   * OAuth2 with authorization code flow
   */
  oauth2AuthorizationCode: (config: {
    authorizationUrl: string;
    tokenUrl: string;
    scopes: Record<string, string>;
    refreshUrl?: string;
  }) => ({
    type: 'oauth2' as const,
    flows: {
      authorizationCode: {
        authorizationUrl: config.authorizationUrl,
        tokenUrl: config.tokenUrl,
        refreshUrl: config.refreshUrl,
        scopes: config.scopes,
      },
    },
  }),

  /**
   * OAuth2 with client credentials flow
   */
  oauth2ClientCredentials: (config: {
    tokenUrl: string;
    scopes: Record<string, string>;
    refreshUrl?: string;
  }) => ({
    type: 'oauth2' as const,
    flows: {
      clientCredentials: {
        tokenUrl: config.tokenUrl,
        refreshUrl: config.refreshUrl,
        scopes: config.scopes,
      },
    },
  }),

  /**
   * OpenID Connect
   */
  openIdConnect: (openIdConnectUrl: string) => ({
    type: 'openIdConnect' as const,
    openIdConnectUrl,
  }),
};

/**
 * Create common error responses
 */
export const errorResponses = {
  badRequest: (description = 'Bad Request'): OpenAPIResponse => ({
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            errors: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
          required: ['error'],
        },
      },
    },
  }),

  unauthorized: (description = 'Unauthorized'): OpenAPIResponse => ({
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
          required: ['error'],
        },
      },
    },
  }),

  forbidden: (description = 'Forbidden'): OpenAPIResponse => ({
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
          required: ['error'],
        },
      },
    },
  }),

  notFound: (description = 'Not Found'): OpenAPIResponse => ({
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
          required: ['error'],
        },
      },
    },
  }),

  serverError: (description = 'Internal Server Error'): OpenAPIResponse => ({
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
          required: ['error'],
        },
      },
    },
  }),
};
