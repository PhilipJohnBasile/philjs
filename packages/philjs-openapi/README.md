# philjs-openapi

Automatic OpenAPI specification generation for PhilJS APIs. Inspired by [Elysia's](https://elysiajs.com/) elegant approach to API documentation.

## Features

- **Automatic OpenAPI spec generation** from route definitions
- **Zod schema integration** - automatic JSON Schema conversion
- **Swagger UI middleware** - serve interactive docs
- **ReDoc support** - alternative documentation viewer
- **Type generation CLI** - generate TypeScript types from OpenAPI specs
- **Security schemes** - built-in helpers for common auth patterns
- **Route groups** - organize routes with tags and shared config

## Installation

```bash
npm install philjs-openapi zod
```

## Quick Start

```typescript
import { createAPI, openapi, swaggerUI } from 'philjs-openapi';
import { z } from 'zod';

// Define your schemas
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'user']).default('user'),
  createdAt: z.string().datetime(),
});

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'user']).optional(),
});

// Create API with automatic documentation
const api = createAPI({
  'GET /users': {
    response: z.array(UserSchema),
    summary: 'List all users',
    description: 'Returns a paginated list of all users',
    tags: ['Users'],
    handler: async () => fetchUsers(),
  },

  'POST /users': {
    body: CreateUserSchema,
    response: UserSchema,
    summary: 'Create a new user',
    tags: ['Users'],
    handler: async ({ body }) => createUser(body),
  },

  'GET /users/:id': {
    params: z.object({
      id: z.string().uuid().describe('User ID'),
    }),
    response: UserSchema,
    summary: 'Get user by ID',
    tags: ['Users'],
    handler: async ({ params }) => fetchUser(params.id),
  },

  'PUT /users/:id': {
    params: z.object({ id: z.string().uuid() }),
    body: CreateUserSchema.partial(),
    response: UserSchema,
    summary: 'Update user',
    tags: ['Users'],
    handler: async ({ params, body }) => updateUser(params.id, body),
  },

  'DELETE /users/:id': {
    params: z.object({ id: z.string().uuid() }),
    response: z.object({ success: z.boolean() }),
    summary: 'Delete user',
    tags: ['Users'],
    handler: async ({ params }) => deleteUser(params.id),
  },
});

// Generate OpenAPI spec
const spec = openapi(api, {
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'A sample API with automatic OpenAPI documentation',
  },
  servers: [
    { url: 'https://api.example.com', description: 'Production' },
    { url: 'http://localhost:3000', description: 'Development' },
  ],
});

// Serve documentation
app.get('/docs', swaggerUI({ spec }));
app.get('/openapi.json', () => Response.json(spec));
```

## Route Definition

Routes are defined using a simple format: `"METHOD /path"`.

```typescript
const api = createAPI({
  // GET request
  'GET /posts': { ... },

  // POST request
  'POST /posts': { ... },

  // Path parameters (use :param syntax)
  'GET /posts/:id': { ... },

  // Multiple path parameters
  'GET /users/:userId/posts/:postId': { ... },

  // Default to GET if no method specified
  '/health': { ... },
});
```

### Route Options

```typescript
interface APIRouteDefinition {
  // Zod schemas for validation
  params?: ZodSchema;    // Path parameters
  query?: ZodSchema;     // Query parameters
  body?: ZodSchema;      // Request body
  headers?: ZodSchema;   // Request headers
  response?: ZodSchema;  // Response body

  // Documentation
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  operationId?: string;

  // Security
  security?: SecurityRequirement[];

  // Examples
  examples?: {
    request?: unknown;
    response?: unknown;
  };

  // Handler function
  handler: (context) => Promise<unknown>;
}
```

## Query Parameters

```typescript
const api = createAPI({
  'GET /users': {
    query: z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      search: z.string().optional(),
      role: z.enum(['admin', 'user']).optional(),
    }),
    response: z.object({
      users: z.array(UserSchema),
      total: z.number(),
      page: z.number(),
      limit: z.number(),
    }),
    handler: async ({ query }) => {
      return fetchUsers(query);
    },
  },
});
```

## Multiple Response Status Codes

```typescript
const api = createAPI({
  'POST /users': {
    body: CreateUserSchema,
    response: {
      201: UserSchema.describe('User created successfully'),
      400: z.object({
        error: z.string(),
        errors: z.record(z.array(z.string())).optional(),
      }).describe('Validation error'),
      409: z.object({
        error: z.string(),
      }).describe('User already exists'),
    },
    handler: async ({ body }) => createUser(body),
  },
});
```

## Route Groups

Organize related routes with shared configuration:

```typescript
import { group, openapi } from 'philjs-openapi';

const userRoutes = group({
  name: 'Users',
  description: 'User management endpoints',
  basePath: '/api/v1',
  security: [{ bearerAuth: [] }],
  routes: {
    'GET /users': { ... },
    'POST /users': { ... },
    'GET /users/:id': { ... },
  },
});

const postRoutes = group({
  name: 'Posts',
  description: 'Blog post endpoints',
  basePath: '/api/v1',
  routes: {
    'GET /posts': { ... },
    'POST /posts': { ... },
  },
});

// Generate spec from groups
const spec = openapi([userRoutes, postRoutes], {
  info: { title: 'My API', version: '1.0.0' },
});
```

## Security Schemes

Built-in helpers for common authentication patterns:

```typescript
import { openapi, securitySchemes } from 'philjs-openapi';

const spec = openapi(api, {
  info: { title: 'My API', version: '1.0.0' },
  securitySchemes: {
    bearerAuth: securitySchemes.bearer('JWT'),
    apiKey: securitySchemes.apiKey('X-API-Key', 'header'),
    basicAuth: securitySchemes.basic(),
    oauth2: securitySchemes.oauth2AuthorizationCode({
      authorizationUrl: 'https://auth.example.com/authorize',
      tokenUrl: 'https://auth.example.com/token',
      scopes: {
        'read:users': 'Read user data',
        'write:users': 'Create and update users',
      },
    }),
  },
  security: [{ bearerAuth: [] }], // Global security
});
```

Apply security to specific routes:

```typescript
const api = createAPI({
  'GET /public': {
    security: [], // No authentication required
    handler: async () => ({ status: 'ok' }),
  },

  'GET /admin': {
    security: [{ bearerAuth: [], apiKey: [] }],
    handler: async () => ({ admin: true }),
  },
});
```

## Swagger UI & ReDoc

Serve interactive documentation:

```typescript
import { swaggerUI, redoc, createDocsRoutes } from 'philjs-openapi';

// Swagger UI
app.get('/docs', swaggerUI({
  spec,
  title: 'API Documentation',
  config: {
    tryItOutEnabled: true,
    persistAuthorization: true,
    displayRequestDuration: true,
  },
}));

// ReDoc (alternative viewer)
app.get('/redoc', redoc({
  spec,
  title: 'API Reference',
  config: {
    expandResponses: '200,201',
    pathInMiddlePanel: true,
  },
}));

// Or create all routes at once
const docsRoutes = createDocsRoutes(spec, {
  title: 'My API',
  basePath: '/api',
});
// Creates:
// - /api/docs (Swagger UI)
// - /api/redoc (ReDoc)
// - /api/openapi.json (spec)
```

## CLI: Generate Types from OpenAPI

Generate TypeScript types from any OpenAPI specification:

```bash
# Basic usage
npx philjs-openapi generate --input openapi.json --output types.ts

# From URL
npx philjs-openapi generate --input https://api.example.com/openapi.json --output types.ts

# With API client generation
npx philjs-openapi generate --input openapi.json --output types.ts --client

# With Zod schemas
npx philjs-openapi generate --input openapi.json --output types.ts --zod

# All options
npx philjs-openapi generate \
  --input openapi.json \
  --output ./src/api/types.ts \
  --client \
  --zod \
  --prefix Api \
  --readonly \
  --enums-as-union
```

Generated output:

```typescript
// types.ts

/**
 * Generated from My API v1.0.0
 * Do not edit manually.
 */

// Schemas
export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
};

export type CreateUser = {
  name: string;
  email: string;
  role?: 'admin' | 'user';
};

// Operations
export interface GetUsersRequest {
  query?: { page?: number; limit?: number; search?: string };
}

export type GetUsersResponse = User[];

export interface CreateUserRequest {
  body: CreateUser;
}

export type CreateUserResponse = User;

// API Client
export interface APIClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

export function createClient(config: APIClientConfig) {
  // ... implementation
  return {
    getUsers: async (req: GetUsersRequest): Promise<GetUsersResponse> => { ... },
    createUser: async (req: CreateUserRequest): Promise<CreateUserResponse> => { ... },
    // ... more operations
  };
}
```

## Zod to JSON Schema

Convert Zod schemas to JSON Schema directly:

```typescript
import { zodToJsonSchema } from 'philjs-openapi';
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
});

const jsonSchema = zodToJsonSchema(UserSchema);
// {
//   type: 'object',
//   properties: {
//     id: { type: 'string', format: 'uuid' },
//     name: { type: 'string', minLength: 1, maxLength: 100 },
//     email: { type: 'string', format: 'email' },
//     age: { type: 'integer', exclusiveMinimum: 0 },
//     tags: { type: 'array', items: { type: 'string' }, default: [] },
//   },
//   required: ['id', 'name', 'email'],
// }
```

## Error Responses

Add standard error responses:

```typescript
import { openapi, errorResponses } from 'philjs-openapi';

const spec = openapi(api, {
  info: { title: 'My API', version: '1.0.0' },
  errorResponses: {
    400: errorResponses.badRequest(),
    401: errorResponses.unauthorized(),
    403: errorResponses.forbidden(),
    404: errorResponses.notFound(),
    500: errorResponses.serverError(),
  },
});
```

## Advanced Configuration

```typescript
const spec = openapi(api, {
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'Full API documentation',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
      url: 'https://example.com/support',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    { url: 'https://api.example.com', description: 'Production' },
    {
      url: 'https://{environment}.api.example.com',
      description: 'By environment',
      variables: {
        environment: {
          default: 'prod',
          enum: ['prod', 'staging', 'dev'],
          description: 'Environment name',
        },
      },
    },
  ],
  tags: [
    { name: 'Users', description: 'User management' },
    { name: 'Posts', description: 'Blog posts' },
  ],
  externalDocs: {
    description: 'Full documentation',
    url: 'https://docs.example.com',
  },
  basePath: '/api/v1',
  includeExamples: true,
  operationIdTransform: (method, path) => {
    // Custom operation ID generation
    return `${method}${path.replace(/\//g, '_')}`;
  },
});
```

## API Reference

### `createAPI(routes)`
Create an API definition from route handlers.

### `openapi(api, options)`
Generate OpenAPI specification from API definition.

### `group(config)`
Create a route group with shared configuration.

### `swaggerUI(options)`
Create Swagger UI middleware.

### `redoc(options)`
Create ReDoc middleware.

### `createDocsRoutes(spec, options)`
Create all documentation routes at once.

### `specHandler(spec)`
Create a handler that serves the OpenAPI spec as JSON.

### `zodToJsonSchema(schema)`
Convert a Zod schema to JSON Schema.

### `generateTypes(spec, options)`
Generate TypeScript types from OpenAPI spec.

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./swagger-ui, ./cli
- Source files: packages/philjs-openapi/src/index.ts, packages/philjs-openapi/src/swagger-ui.ts, packages/philjs-openapi/src/cli.ts

### Public API
- Direct exports: createDocsRoutes, createSwaggerRoutes, generateTypes, main, redoc, specHandler, swaggerUI
- Re-exported names: // JSON Schema types
  JSONSchema, // OpenAPI specification types
  OpenAPISpec, // PhilJS API types
  APIRouteDefinition, // Type generation types
  TypeGenerationOptions, APIDefinition, GeneratedTypes, OpenAPIComponents, OpenAPIEncoding, OpenAPIExample, OpenAPIExternalDocs, OpenAPIHeader, OpenAPIInfo, OpenAPILink, OpenAPIMediaType, OpenAPIOAuthFlow, OpenAPIOAuthFlows, OpenAPIOperation, OpenAPIOptions, OpenAPIParameter, OpenAPIPathItem, OpenAPIRequestBody, OpenAPIResponse, OpenAPISecurityRequirement, OpenAPISecurityScheme, OpenAPIServer, OpenAPITag, RouteContext, RouteGroup, SwaggerUIOptions, createAPI, createDocsRoutes, createSwaggerRoutes, errorResponses, extractExample, generateTypes, getSchemaDescription, group, isZodSchema, mergeAPIs, openapi, redoc, runCLI, securitySchemes, specHandler, swaggerUI, zodToJsonSchema
- Re-exported modules: ./cli.js, ./openapi.js, ./swagger-ui.js, ./types.js, ./zod-to-schema.js
<!-- API_SNAPSHOT_END -->

## License

MIT
