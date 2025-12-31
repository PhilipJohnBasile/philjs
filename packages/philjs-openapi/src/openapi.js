/**
 * PhilJS OpenAPI - Spec Generator
 *
 * Automatic OpenAPI specification generation from PhilJS API definitions.
 * Inspired by Elysia's elegant API documentation.
 */
import { zodToJsonSchema, extractExample, getSchemaDescription, isZodSchema, } from './zod-to-schema.js';
/**
 * Parse route string into method and path
 * Format: "METHOD /path" or "/path" (defaults to GET)
 */
function parseRoute(route) {
    const parts = route.trim().split(/\s+/);
    if (parts.length === 1) {
        return { method: 'get', path: parts[0] };
    }
    const method = parts[0].toLowerCase();
    const path = parts.slice(1).join(' ');
    return { method, path };
}
/**
 * Convert PhilJS path params to OpenAPI format
 * ":id" -> "{id}"
 */
function convertPathParams(path) {
    return path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '{$1}');
}
/**
 * Extract path parameter names from path
 */
function extractPathParams(path) {
    const matches = path.match(/:([a-zA-Z_][a-zA-Z0-9_]*)/g);
    return matches ? matches.map((m) => m.slice(1)) : [];
}
/**
 * Generate operation ID from method and path
 */
function generateOperationId(method, path) {
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
function generateParameters(route, pathParams) {
    const parameters = [];
    // Path parameters
    if (route.params && isZodSchema(route.params)) {
        const schema = zodToJsonSchema(route.params);
        if (schema.properties) {
            for (const [name, propSchema] of Object.entries(schema.properties)) {
                if (pathParams.includes(name)) {
                    const param = {
                        name,
                        in: 'path',
                        required: true,
                        schema: propSchema,
                    };
                    const description = getSchemaDescription(route.params?.[name]);
                    if (description)
                        param.description = description;
                    const example = extractExample(route.params?.[name]);
                    if (example !== undefined)
                        param.example = example;
                    parameters.push(param);
                }
            }
        }
    }
    else {
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
                const param = {
                    name,
                    in: 'query',
                    required: required.includes(name),
                    schema: propSchema,
                };
                const description = getSchemaDescription(route.query?.[name]);
                if (description)
                    param.description = description;
                const example = extractExample(route.query?.[name]);
                if (example !== undefined)
                    param.example = example;
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
                    schema: propSchema,
                });
            }
        }
    }
    return parameters;
}
/**
 * Generate request body from route definition
 */
function generateRequestBody(route, includeExamples) {
    if (!route.body || !isZodSchema(route.body)) {
        return undefined;
    }
    const schema = zodToJsonSchema(route.body);
    const description = getSchemaDescription(route.body);
    const mediaType = { schema };
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
function generateResponses(route, includeExamples, errorResponses) {
    const responses = {};
    // Success response
    if (route.response) {
        if (isZodSchema(route.response)) {
            // Single response schema (200)
            const schema = zodToJsonSchema(route.response);
            const description = getSchemaDescription(route.response) || 'Successful response';
            const mediaType = { schema };
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
        }
        else if (typeof route.response === 'object') {
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
    }
    else {
        // Default response
        responses['200'] = {
            description: 'Successful response',
        };
    }
    // Add common error responses
    if (errorResponses) {
        if (errorResponses[400])
            responses['400'] = errorResponses[400];
        if (errorResponses[401])
            responses['401'] = errorResponses[401];
        if (errorResponses[403])
            responses['403'] = errorResponses[403];
        if (errorResponses[404])
            responses['404'] = errorResponses[404];
        if (errorResponses[500])
            responses['500'] = errorResponses[500];
    }
    return responses;
}
/**
 * Generate OpenAPI operation from route definition
 */
function generateOperation(route, method, path, options) {
    const pathParams = extractPathParams(path);
    const operationId = route.operationId ||
        options.operationIdTransform?.(method, path) ||
        generateOperationId(method, path);
    const operation = {
        operationId,
        responses: generateResponses(route, options.includeExamples ?? true, options.errorResponses),
    };
    // Add metadata
    if (route.summary)
        operation.summary = route.summary;
    if (route.description)
        operation.description = route.description;
    if (route.tags && route.tags.length > 0)
        operation.tags = route.tags;
    if (route.deprecated)
        operation.deprecated = true;
    if (route.security)
        operation.security = route.security;
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
export function createAPI(routes) {
    return routes;
}
/**
 * Create route group
 */
export function group(config) {
    return config;
}
/**
 * Generate OpenAPI specification from API definition
 */
export function openapi(api, options) {
    const paths = {};
    const components = {};
    const allTags = new Set();
    // Handle route groups
    const processRoutes = (routes, basePath = '', groupTags = []) => {
        for (const [routeKey, route] of Object.entries(routes)) {
            const { method, path: routePath } = parseRoute(routeKey);
            const fullPath = convertPathParams((options.basePath || '') + basePath + routePath);
            // Initialize path item if needed
            if (!paths[fullPath]) {
                paths[fullPath] = {};
            }
            // Generate operation with merged tags
            const routeWithTags = {
                ...route,
                tags: [...groupTags, ...(route.tags || [])],
            };
            const operation = generateOperation(routeWithTags, method, routePath, options);
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
    }
    else if ('routes' in api && 'name' in api) {
        // Single route group
        const group = api;
        processRoutes(group.routes, group.basePath || '', [group.name]);
    }
    else {
        // Plain API definition
        processRoutes(api);
    }
    // Add security schemes to components
    if (options.securitySchemes) {
        components.securitySchemes = options.securitySchemes;
    }
    // Build tags from groups and options
    const tags = options.tags || [];
    const groupTags = Array.isArray(api)
        ? api.map((g) => {
            const tag = { name: g.name };
            if (g.description)
                tag.description = g.description;
            return tag;
        })
        : 'routes' in api && 'name' in api
            ? (() => {
                const g = api;
                const tag = { name: g.name };
                if (g.description)
                    tag.description = g.description;
                return [tag];
            })()
            : [];
    // Merge and deduplicate tags
    const mergedTags = [...tags, ...groupTags].filter((tag, index, self) => self.findIndex((t) => t.name === tag.name) === index);
    // Build final spec
    const spec = {
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
export function mergeAPIs(...apis) {
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
        type: 'http',
        scheme: 'bearer',
        bearerFormat: format,
    }),
    /**
     * API key authentication
     */
    apiKey: (name, location = 'header') => ({
        type: 'apiKey',
        name,
        in: location,
    }),
    /**
     * Basic authentication
     */
    basic: () => ({
        type: 'http',
        scheme: 'basic',
    }),
    /**
     * OAuth2 with authorization code flow
     */
    oauth2AuthorizationCode: (config) => ({
        type: 'oauth2',
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
    oauth2ClientCredentials: (config) => ({
        type: 'oauth2',
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
    openIdConnect: (openIdConnectUrl) => ({
        type: 'openIdConnect',
        openIdConnectUrl,
    }),
};
/**
 * Create common error responses
 */
export const errorResponses = {
    badRequest: (description = 'Bad Request') => ({
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
    unauthorized: (description = 'Unauthorized') => ({
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
    forbidden: (description = 'Forbidden') => ({
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
    notFound: (description = 'Not Found') => ({
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
    serverError: (description = 'Internal Server Error') => ({
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
//# sourceMappingURL=openapi.js.map