/**
 * Server-side utilities for treaty client support.
 * Provides route metadata extraction and type generation helpers.
 */
// ============================================================================
// Metadata Extraction
// ============================================================================
/**
 * Extract metadata from an API definition.
 *
 * @example
 * ```ts
 * import { extractAPIMetadata } from 'philjs-rpc/treaty-server';
 * import { api } from './api';
 *
 * const metadata = extractAPIMetadata(api);
 * console.log(metadata.routes);
 * ```
 */
export function extractAPIMetadata(api, options) {
    const routes = [];
    function traverse(router, prefix = []) {
        for (const [key, value] of Object.entries(router)) {
            const currentPath = [...prefix, key];
            if (isProcedure(value)) {
                const procedure = value;
                const pathString = currentPath.join('.');
                const routeMetadata = {
                    path: pathString,
                    type: procedure._type,
                    methods: getHTTPMethods(procedure._type),
                    middlewareCount: procedure._def.middlewares.length,
                };
                if (procedure._def.inputSchema) {
                    const schemaType = getSchemaTypeName(procedure._def.inputSchema);
                    const inputInfo = { required: true };
                    if (schemaType !== undefined) {
                        inputInfo.schemaType = schemaType;
                    }
                    routeMetadata.input = inputInfo;
                }
                routes.push(routeMetadata);
            }
            else if (typeof value === 'object' && value !== null) {
                // It's a nested router
                traverse(value, currentPath);
            }
        }
    }
    traverse(api._def.router);
    const result = { routes };
    if (options?.version !== undefined) {
        result.version = options.version;
    }
    if (options?.title !== undefined) {
        result.title = options.title;
    }
    if (options?.description !== undefined) {
        result.description = options.description;
    }
    return result;
}
/**
 * Check if a value is a procedure.
 */
function isProcedure(value) {
    return (typeof value === 'object' &&
        value !== null &&
        '_type' in value &&
        '_def' in value &&
        typeof value._def === 'object' &&
        value._def !== null &&
        'handler' in value._def);
}
/**
 * Get HTTP methods for a procedure type.
 */
function getHTTPMethods(type) {
    switch (type) {
        case 'query':
            return ['GET', 'HEAD', 'OPTIONS'];
        case 'mutation':
            return ['POST', 'PUT', 'PATCH', 'DELETE'];
        default:
            return ['GET', 'POST'];
    }
}
/**
 * Get schema type name.
 */
function getSchemaTypeName(schema) {
    if (typeof schema === 'object' && schema !== null) {
        // Check for Zod schema
        if ('_def' in schema && typeof schema._def === 'object') {
            const typeName = schema._def?.typeName;
            if (typeof typeName === 'string') {
                return typeName;
            }
        }
    }
    return undefined;
}
/**
 * Generate OpenAPI specification from API metadata.
 *
 * @example
 * ```ts
 * import { extractAPIMetadata, generateOpenAPI } from 'philjs-rpc/treaty-server';
 * import { api } from './api';
 *
 * const metadata = extractAPIMetadata(api, {
 *   title: 'My API',
 *   version: '1.0.0',
 * });
 *
 * const openapi = generateOpenAPI(metadata);
 * ```
 */
export function generateOpenAPI(metadata) {
    const paths = {};
    for (const route of metadata.routes) {
        const path = `/${route.path.replace(/\./g, '/')}`;
        const methods = route.methods.map((m) => m.toLowerCase());
        if (!paths[path]) {
            paths[path] = {};
        }
        for (const method of methods) {
            const operation = {
                operationId: route.path.replace(/\./g, '_'),
                responses: {
                    '200': {
                        description: 'Successful response',
                        content: {
                            'application/json': {
                                schema: { type: 'object' },
                            },
                        },
                    },
                    '400': {
                        description: 'Bad request',
                    },
                    '401': {
                        description: 'Unauthorized',
                    },
                    '500': {
                        description: 'Internal server error',
                    },
                },
            };
            if (route.tags !== undefined) {
                operation.tags = route.tags;
            }
            if (route.description !== undefined) {
                operation.description = route.description;
            }
            paths[path][method] = operation;
            // Add request body for mutations
            if (route.type === 'mutation' && route.input?.required) {
                paths[path][method].requestBody = {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { type: 'object' },
                        },
                    },
                };
            }
        }
    }
    const info = {
        title: metadata.title ?? 'API',
        version: metadata.version ?? '1.0.0',
    };
    if (metadata.description !== undefined) {
        info.description = metadata.description;
    }
    return {
        openapi: '3.0.0',
        info,
        paths,
    };
}
/**
 * Generate TypeScript type definitions from API metadata.
 *
 * @example
 * ```ts
 * import { extractAPIMetadata, generateTypeDefinitions } from 'philjs-rpc/treaty-server';
 * import { api } from './api';
 *
 * const metadata = extractAPIMetadata(api);
 * const types = generateTypeDefinitions(metadata, {
 *   exportName: 'AppAPI',
 *   includeHelpers: true,
 * });
 *
 * console.log(types);
 * ```
 */
export function generateTypeDefinitions(metadata, options) {
    const lines = [];
    const exportName = options?.exportName ?? 'API';
    const includeComments = options?.includeComments ?? true;
    if (includeComments) {
        lines.push('/**');
        lines.push(` * Generated type definitions for ${metadata.title ?? 'API'}`);
        if (metadata.version) {
            lines.push(` * Version: ${metadata.version}`);
        }
        lines.push(` * Generated at: ${new Date().toISOString()}`);
        lines.push(' */');
        lines.push('');
    }
    // Generate route type map
    lines.push(`export interface ${exportName}Routes {`);
    // Group routes by path segments
    const routeTree = {};
    for (const route of metadata.routes) {
        const segments = route.path.split('.');
        let current = routeTree;
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            if (i === segments.length - 1) {
                // Leaf node
                current[segment] = {
                    type: route.type,
                    methods: route.methods,
                };
            }
            else {
                // Branch node
                if (!current[segment]) {
                    current[segment] = {};
                }
                current = current[segment];
            }
        }
    }
    function printRouteTree(tree, indent = 1) {
        const indentStr = '  '.repeat(indent);
        for (const [key, value] of Object.entries(tree)) {
            if (value && typeof value === 'object' && 'type' in value && 'methods' in value) {
                // Leaf node - procedure
                const proc = value;
                lines.push(`${indentStr}${key}: {`);
                lines.push(`${indentStr}  type: '${proc.type}';`);
                lines.push(`${indentStr}  methods: ${JSON.stringify(proc.methods)};`);
                lines.push(`${indentStr}};`);
            }
            else {
                // Branch node - nested router
                lines.push(`${indentStr}${key}: {`);
                printRouteTree(value, indent + 1);
                lines.push(`${indentStr}};`);
            }
        }
    }
    printRouteTree(routeTree);
    lines.push('}');
    lines.push('');
    // Generate helper types if requested
    if (options?.includeHelpers) {
        lines.push('// Helper types for type-safe client usage');
        lines.push('');
        lines.push(`export type ${exportName}Paths = {`);
        for (const route of metadata.routes) {
            lines.push(`  '${route.path}': '${route.type}';`);
        }
        lines.push('};');
        lines.push('');
        lines.push(`export type ${exportName}Methods<TPath extends keyof ${exportName}Paths> = {`);
        for (const route of metadata.routes) {
            lines.push(`  '${route.path}': ${JSON.stringify(route.methods)};`);
        }
        lines.push('}[TPath];');
        lines.push('');
    }
    return lines.join('\n');
}
// ============================================================================
// Runtime Validation
// ============================================================================
/**
 * Validate that a client request matches server API.
 */
export function validateRequest(api, path, method) {
    const metadata = extractAPIMetadata(api);
    const route = metadata.routes.find((r) => r.path === path);
    if (!route) {
        return {
            valid: false,
            error: `Route not found: ${path}`,
        };
    }
    const upperMethod = method.toUpperCase();
    if (!route.methods.includes(upperMethod)) {
        return {
            valid: false,
            error: `Method ${method} not allowed for route ${path}. Allowed methods: ${route.methods.join(', ')}`,
        };
    }
    return { valid: true };
}
// ============================================================================
// Development Utilities
// ============================================================================
/**
 * Print API routes to console in a readable format.
 *
 * @example
 * ```ts
 * import { printAPIRoutes } from 'philjs-rpc/treaty-server';
 * import { api } from './api';
 *
 * printAPIRoutes(api);
 * ```
 */
export function printAPIRoutes(api, options) {
    const metadata = extractAPIMetadata(api);
    for (const route of metadata.routes) {
        const typeColor = route.type === 'query' ? '\x1b[36m' : '\x1b[33m'; // cyan for query, yellow for mutation
        const reset = '\x1b[0m';
        if (options?.colors) {
            console.log(`${typeColor}${route.type.toUpperCase()}${reset} ${route.path}`);
        }
        else {
            console.log(`${route.type.toUpperCase()} ${route.path}`);
        }
        console.log(`  Methods: ${route.methods.join(', ')}`);
        if (route.input?.required) {
            console.log(`  Input: Required (${route.input.schemaType ?? 'unknown'})`);
        }
        if (options?.includeMiddleware && route.middlewareCount > 0) {
            console.log(`  Middleware: ${route.middlewareCount} handler(s)`);
        }
    }
    console.log(`Total routes: ${metadata.routes.length}\n`);
}
/**
 * Export routes as JSON.
 */
export function exportRoutesJSON(api, options) {
    const metadata = extractAPIMetadata(api);
    if (options?.pretty) {
        return JSON.stringify(metadata, null, 2);
    }
    return JSON.stringify(metadata);
}
// ============================================================================
// Type Guard Utilities
// ============================================================================
/**
 * Type guard to check if a value is a Router.
 */
export function isRouter(value) {
    return typeof value === 'object' && value !== null && !isProcedure(value);
}
/**
 * Get all procedure paths from a router.
 */
export function getAllPaths(router) {
    const paths = [];
    function traverse(obj, prefix = []) {
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = [...prefix, key];
            if (isProcedure(value)) {
                paths.push(currentPath.join('.'));
            }
            else if (isRouter(value)) {
                traverse(value, currentPath);
            }
        }
    }
    traverse(router);
    return paths;
}
/**
 * Get procedure count.
 */
export function getProcedureCount(router) {
    let total = 0;
    let queries = 0;
    let mutations = 0;
    function traverse(obj) {
        for (const value of Object.values(obj)) {
            if (isProcedure(value)) {
                total++;
                if (value._type === 'query') {
                    queries++;
                }
                else if (value._type === 'mutation') {
                    mutations++;
                }
            }
            else if (isRouter(value)) {
                traverse(value);
            }
        }
    }
    traverse(router);
    return { total, queries, mutations };
}
//# sourceMappingURL=treaty-server.js.map