/**
 * Server-side utilities for treaty client support.
 * Provides route metadata extraction and type generation helpers.
 */

import type {
  Router,
  ProcedureDefinition,
  ProcedureType,
  APIDefinition,
} from './types.js';

// ============================================================================
// Route Metadata
// ============================================================================

/**
 * Metadata for a single route/procedure.
 */
export interface RouteMetadata {
  /** Full path to the procedure */
  path: string;
  /** Procedure type (query/mutation) */
  type: ProcedureType;
  /** Input schema information */
  input?: {
    /** Whether input is required */
    required: boolean;
    /** Schema type name */
    schemaType?: string;
  };
  /** Output type information */
  output?: {
    /** Output type name */
    typeName?: string;
  };
  /** Supported HTTP methods */
  methods: string[];
  /** Path parameters */
  pathParams?: string[];
  /** Middleware count */
  middlewareCount: number;
  /** Tags for categorization */
  tags?: string[];
  /** Description */
  description?: string;
}

/**
 * API metadata containing all routes.
 */
export interface APIMetadata {
  /** All routes in the API */
  routes: RouteMetadata[];
  /** API version */
  version?: string;
  /** API title */
  title?: string;
  /** API description */
  description?: string;
}

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
export function extractAPIMetadata<TRouter extends Router>(
  api: APIDefinition<TRouter>,
  options?: {
    version?: string;
    title?: string;
    description?: string;
  }
): APIMetadata {
  const routes: RouteMetadata[] = [];

  function traverse(router: Router, prefix: string[] = []): void {
    for (const [key, value] of Object.entries(router)) {
      const currentPath = [...prefix, key];

      if (isProcedure(value)) {
        const procedure = value as ProcedureDefinition;
        const pathString = currentPath.join('.');

        const routeMetadata: RouteMetadata = {
          path: pathString,
          type: procedure._type,
          methods: getHTTPMethods(procedure._type),
          middlewareCount: procedure._def.middlewares.length,
        };

        if (procedure._def.inputSchema) {
          const schemaType = getSchemaTypeName(procedure._def.inputSchema);
          const inputInfo: { required: boolean; schemaType?: string } = { required: true };
          if (schemaType !== undefined) {
            inputInfo.schemaType = schemaType;
          }
          routeMetadata.input = inputInfo;
        }

        routes.push(routeMetadata);
      } else if (typeof value === 'object' && value !== null) {
        // It's a nested router
        traverse(value as Router, currentPath);
      }
    }
  }

  traverse(api._def.router);

  const result: APIMetadata = { routes };
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
function isProcedure(value: unknown): value is ProcedureDefinition {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_type' in value &&
    '_def' in value &&
    typeof (value as ProcedureDefinition)._def === 'object' &&
    (value as ProcedureDefinition)._def !== null &&
    'handler' in (value as ProcedureDefinition)._def
  );
}

/**
 * Get HTTP methods for a procedure type.
 */
function getHTTPMethods(type: ProcedureType): string[] {
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
function getSchemaTypeName(schema: unknown): string | undefined {
  if (typeof schema === 'object' && schema !== null) {
    // Check for Zod schema
    if ('_def' in schema && typeof (schema as any)._def === 'object') {
      const typeName = (schema as any)._def?.typeName;
      if (typeof typeName === 'string') {
        return typeName;
      }
    }
  }
  return undefined;
}

// ============================================================================
// OpenAPI Generation Support
// ============================================================================

/**
 * OpenAPI schema information.
 */
export interface OpenAPISchema {
  type: string;
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  required?: string[];
  description?: string;
  enum?: unknown[];
  format?: string;
  [key: string]: unknown;
}

/**
 * OpenAPI operation.
 */
export interface OpenAPIOperation {
  operationId: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Array<{
    name: string;
    in: 'query' | 'path' | 'header' | 'cookie';
    required?: boolean;
    schema: OpenAPISchema;
  }>;
  requestBody?: {
    required?: boolean;
    content: {
      'application/json': {
        schema: OpenAPISchema;
      };
    };
  };
  responses: {
    [statusCode: string]: {
      description: string;
      content?: {
        'application/json': {
          schema: OpenAPISchema;
        };
      };
    };
  };
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
export function generateOpenAPI(metadata: APIMetadata): {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, Record<string, OpenAPIOperation>>;
} {
  const paths: Record<string, Record<string, OpenAPIOperation>> = {};

  for (const route of metadata.routes) {
    const path = `/${route.path.replace(/\./g, '/')}`;
    const methods = route.methods.map((m) => m.toLowerCase());

    if (!paths[path]) {
      paths[path] = {};
    }

    for (const method of methods) {
      const operation: OpenAPIOperation = {
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
      paths[path]![method] = operation;

      // Add request body for mutations
      if (route.type === 'mutation' && route.input?.required) {
        paths[path]![method]!.requestBody = {
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

  const info: { title: string; version: string; description?: string } = {
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

// ============================================================================
// Type Generation
// ============================================================================

/**
 * Options for type generation.
 */
export interface TypeGenerationOptions {
  /** Output file path */
  output?: string;
  /** Include comments */
  includeComments?: boolean;
  /** Export type name */
  exportName?: string;
  /** Include client helper types */
  includeHelpers?: boolean;
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
export function generateTypeDefinitions(
  metadata: APIMetadata,
  options?: TypeGenerationOptions
): string {
  const lines: string[] = [];
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
  const routeTree: Record<string, unknown> = {};

  for (const route of metadata.routes) {
    const segments = route.path.split('.');
    let current = routeTree;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]!;
      if (i === segments.length - 1) {
        // Leaf node
        current[segment] = {
          type: route.type,
          methods: route.methods,
        };
      } else {
        // Branch node
        if (!current[segment]) {
          current[segment] = {};
        }
        current = current[segment] as Record<string, unknown>;
      }
    }
  }

  function printRouteTree(tree: Record<string, unknown>, indent: number = 1): void {
    const indentStr = '  '.repeat(indent);

    for (const [key, value] of Object.entries(tree)) {
      if (value && typeof value === 'object' && 'type' in value && 'methods' in value) {
        // Leaf node - procedure
        const proc = value as { type: ProcedureType; methods: string[] };
        lines.push(`${indentStr}${key}: {`);
        lines.push(`${indentStr}  type: '${proc.type}';`);
        lines.push(`${indentStr}  methods: ${JSON.stringify(proc.methods)};`);
        lines.push(`${indentStr}};`);
      } else {
        // Branch node - nested router
        lines.push(`${indentStr}${key}: {`);
        printRouteTree(value as Record<string, unknown>, indent + 1);
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
export function validateRequest<TRouter extends Router>(
  api: APIDefinition<TRouter>,
  path: string,
  method: string
): {
  valid: boolean;
  error?: string;
} {
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
export function printAPIRoutes<TRouter extends Router>(
  api: APIDefinition<TRouter>,
  options?: {
    /** Include middleware info */
    includeMiddleware?: boolean;
    /** Color output */
    colors?: boolean;
  }
): void {
  const metadata = extractAPIMetadata(api);


  for (const route of metadata.routes) {
    const typeColor = route.type === 'query' ? '\x1b[36m' : '\x1b[33m'; // cyan for query, yellow for mutation
    const reset = '\x1b[0m';

    if (options?.colors) {
      console.log(`${typeColor}${route.type.toUpperCase()}${reset} ${route.path}`);
    } else {
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
export function exportRoutesJSON<TRouter extends Router>(
  api: APIDefinition<TRouter>,
  options?: {
    pretty?: boolean;
  }
): string {
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
export function isRouter(value: unknown): value is Router {
  return typeof value === 'object' && value !== null && !isProcedure(value);
}

/**
 * Get all procedure paths from a router.
 */
export function getAllPaths<TRouter extends Router>(router: TRouter): string[] {
  const paths: string[] = [];

  function traverse(obj: Router, prefix: string[] = []): void {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...prefix, key];

      if (isProcedure(value)) {
        paths.push(currentPath.join('.'));
      } else if (isRouter(value)) {
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
export function getProcedureCount<TRouter extends Router>(router: TRouter): {
  total: number;
  queries: number;
  mutations: number;
} {
  let total = 0;
  let queries = 0;
  let mutations = 0;

  function traverse(obj: Router): void {
    for (const value of Object.values(obj)) {
      if (isProcedure(value)) {
        total++;
        if (value._type === 'query') {
          queries++;
        } else if (value._type === 'mutation') {
          mutations++;
        }
      } else if (isRouter(value)) {
        traverse(value);
      }
    }
  }

  traverse(router);
  return { total, queries, mutations };
}
