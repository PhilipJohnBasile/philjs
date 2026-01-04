# @philjs/openapi

Automatic OpenAPI specification generation for PhilJS APIs with Zod schema conversion, Swagger UI, and ReDoc support.

## Installation

```bash
npm install @philjs/openapi
```

## Features

- **OpenAPI 3.1** - Generate compliant specifications
- **Zod Integration** - Convert Zod schemas to JSON Schema
- **Swagger UI** - Interactive API documentation
- **ReDoc** - Beautiful API reference docs
- **Route Groups** - Organize endpoints by feature
- **Security Schemes** - OAuth2, Bearer, API Key, Basic
- **Type Generation** - Generate TypeScript types from spec

## Quick Start

```typescript
import { createAPI, openapi, swaggerUI } from '@philjs/openapi';
import { z } from 'zod';

// Define schemas
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
});

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// Create API definition
const api = createAPI({
  'GET /users': {
    response: z.array(UserSchema),
    summary: 'List all users',
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
    params: z.object({ id: z.string().uuid() }),
    response: UserSchema,
    summary: 'Get user by ID',
    tags: ['Users'],
    handler: async ({ params }) => fetchUser(params.id),
  },
});

// Generate OpenAPI spec
const spec = openapi(api, {
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'API for managing users',
  },
  servers: [{ url: 'https://api.example.com' }],
});

// Serve Swagger UI
app.get('/docs', swaggerUI({ spec }));
```

## createAPI

### Basic Usage

```typescript
import { createAPI } from '@philjs/openapi';
import { z } from 'zod';

const api = createAPI({
  // Format: "METHOD /path"
  'GET /health': {
    response: z.object({ status: z.string() }),
    summary: 'Health check',
    handler: async () => ({ status: 'ok' }),
  },

  // Path parameters use :param syntax
  'GET /users/:id': {
    params: z.object({ id: z.string() }),
    response: UserSchema,
    summary: 'Get user',
    handler: async ({ params }) => getUser(params.id),
  },

  // Request body for POST/PUT/PATCH
  'POST /users': {
    body: CreateUserSchema,
    response: UserSchema,
    summary: 'Create user',
    handler: async ({ body }) => createUser(body),
  },

  // Query parameters
  'GET /users': {
    query: z.object({
      page: z.number().optional(),
      limit: z.number().optional(),
      search: z.string().optional(),
    }),
    response: z.array(UserSchema),
    summary: 'List users',
    handler: async ({ query }) => listUsers(query),
  },
});
```

### Route Definition Options

```typescript
interface APIRouteDefinition {
  // Schemas
  params?: ZodSchema;           // Path parameters
  query?: ZodSchema;            // Query parameters
  headers?: ZodSchema;          // Request headers
  body?: ZodSchema;             // Request body
  response?: ZodSchema | Record<string, ZodSchema>;  // Response(s)

  // Documentation
  summary?: string;             // Short description
  description?: string;         // Long description
  tags?: string[];              // API tags
  operationId?: string;         // Unique operation ID
  deprecated?: boolean;         // Mark as deprecated

  // Security
  security?: SecurityRequirement[];

  // Examples
  examples?: {
    request?: unknown;
    response?: unknown;
  };

  // Handler
  handler: (ctx: RouteContext) => Promise<unknown>;
}
```

## openapi

### Generating Specification

```typescript
import { openapi } from '@philjs/openapi';

const spec = openapi(api, {
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'Complete API documentation',
    termsOfService: 'https://example.com/terms',
    contact: {
      name: 'API Support',
      url: 'https://example.com/support',
      email: 'support@example.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    { url: 'https://api.example.com', description: 'Production' },
    { url: 'https://staging-api.example.com', description: 'Staging' },
  ],
  basePath: '/api/v1',
  tags: [
    { name: 'Users', description: 'User management' },
    { name: 'Auth', description: 'Authentication' },
  ],
  includeExamples: true,
  externalDocs: {
    description: 'Full documentation',
    url: 'https://docs.example.com',
  },
});
```

### Multiple Response Codes

```typescript
const api = createAPI({
  'POST /users': {
    body: CreateUserSchema,
    response: {
      201: UserSchema,
      400: z.object({ error: z.string(), errors: z.record(z.array(z.string())) }),
      409: z.object({ error: z.string() }),
    },
    summary: 'Create user',
    handler: async ({ body }) => createUser(body),
  },
});
```

## Route Groups

### Organizing by Feature

```typescript
import { group, openapi } from '@philjs/openapi';

const usersGroup = group({
  name: 'Users',
  description: 'User management endpoints',
  basePath: '/users',
  routes: {
    'GET /': {
      response: z.array(UserSchema),
      summary: 'List users',
      handler: listUsers,
    },
    'GET /:id': {
      params: z.object({ id: z.string() }),
      response: UserSchema,
      summary: 'Get user',
      handler: getUser,
    },
    'POST /': {
      body: CreateUserSchema,
      response: UserSchema,
      summary: 'Create user',
      handler: createUser,
    },
  },
});

const authGroup = group({
  name: 'Auth',
  description: 'Authentication endpoints',
  basePath: '/auth',
  routes: {
    'POST /login': {
      body: LoginSchema,
      response: TokenSchema,
      summary: 'Login',
      handler: login,
    },
    'POST /logout': {
      response: z.object({ success: z.boolean() }),
      summary: 'Logout',
      handler: logout,
    },
  },
});

// Generate spec from groups
const spec = openapi([usersGroup, authGroup], {
  info: { title: 'My API', version: '1.0.0' },
});
```

### Merging APIs

```typescript
import { mergeAPIs, openapi } from '@philjs/openapi';

const usersAPI = createAPI({ /* ... */ });
const productsAPI = createAPI({ /* ... */ });
const ordersAPI = createAPI({ /* ... */ });

const fullAPI = mergeAPIs(usersAPI, productsAPI, ordersAPI);

const spec = openapi(fullAPI, { /* ... */ });
```

## Security Schemes

### Built-in Schemes

```typescript
import { securitySchemes, openapi } from '@philjs/openapi';

const spec = openapi(api, {
  info: { title: 'My API', version: '1.0.0' },
  securitySchemes: {
    // Bearer token (JWT)
    bearerAuth: securitySchemes.bearer('JWT'),

    // API key in header
    apiKey: securitySchemes.apiKey('X-API-Key', 'header'),

    // API key in query
    apiKeyQuery: securitySchemes.apiKey('api_key', 'query'),

    // Basic auth
    basicAuth: securitySchemes.basic(),

    // OAuth2 authorization code
    oauth2: securitySchemes.oauth2AuthorizationCode({
      authorizationUrl: 'https://auth.example.com/authorize',
      tokenUrl: 'https://auth.example.com/token',
      refreshUrl: 'https://auth.example.com/refresh',
      scopes: {
        'read:users': 'Read user data',
        'write:users': 'Create and update users',
      },
    }),

    // OAuth2 client credentials
    oauth2Client: securitySchemes.oauth2ClientCredentials({
      tokenUrl: 'https://auth.example.com/token',
      scopes: {
        'admin': 'Admin access',
      },
    }),

    // OpenID Connect
    oidc: securitySchemes.openIdConnect(
      'https://auth.example.com/.well-known/openid-configuration'
    ),
  },
  // Global security requirement
  security: [{ bearerAuth: [] }],
});
```

### Per-Route Security

```typescript
const api = createAPI({
  'GET /public': {
    response: DataSchema,
    security: [], // No auth required
    handler: getPublicData,
  },
  'GET /protected': {
    response: DataSchema,
    security: [{ bearerAuth: [] }],
    handler: getProtectedData,
  },
  'POST /admin': {
    body: AdminActionSchema,
    response: ResultSchema,
    security: [{ oauth2: ['admin'] }],
    handler: adminAction,
  },
});
```

## Error Responses

### Built-in Error Schemas

```typescript
import { errorResponses, openapi } from '@philjs/openapi';

const spec = openapi(api, {
  info: { title: 'My API', version: '1.0.0' },
  errorResponses: {
    400: errorResponses.badRequest('Validation failed'),
    401: errorResponses.unauthorized('Authentication required'),
    403: errorResponses.forbidden('Insufficient permissions'),
    404: errorResponses.notFound('Resource not found'),
    500: errorResponses.serverError('Internal server error'),
  },
});
```

## Swagger UI

### Basic Setup

```typescript
import { swaggerUI } from '@philjs/openapi';

// Serve Swagger UI with inline spec
app.get('/docs', swaggerUI({ spec }));

// Or with spec URL
app.get('/docs', swaggerUI({ specUrl: '/openapi.json' }));
```

### Configuration Options

```typescript
app.get('/docs', swaggerUI({
  spec,
  title: 'My API Documentation',
  favicon: '/favicon.png',
  customCss: `
    .swagger-ui .topbar { background-color: #1a1a2e; }
    .swagger-ui .info .title { color: #e94560; }
  `,
  customJs: `
    console.log('Swagger UI loaded');
  `,
  config: {
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
    validatorUrl: null,
    withCredentials: false,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    maxDisplayedTags: 10,
  },
}));
```

### Complete Routes Setup

```typescript
import { createSwaggerRoutes } from '@philjs/openapi';

const { docs, spec: specRoute } = createSwaggerRoutes(spec, {
  title: 'My API',
});

app.get('/docs', docs);
app.get('/openapi.json', specRoute);
```

## ReDoc

### Basic Setup

```typescript
import { redoc } from '@philjs/openapi';

app.get('/redoc', redoc({ spec }));
```

### Configuration Options

```typescript
app.get('/redoc', redoc({
  spec,
  title: 'API Reference',
  favicon: '/favicon.png',
  customCss: `
    body { font-family: 'Inter', sans-serif; }
  `,
  config: {
    disableSearch: false,
    expandDefaultServerVariables: false,
    expandResponses: '200,201',
    hideDownloadButton: false,
    hideHostname: false,
    hideLoading: false,
    hideSingleRequestSampleTab: false,
    jsonSampleExpandLevel: 2,
    lazyRendering: true,
    menuToggle: true,
    nativeScrollbars: false,
    pathInMiddlePanel: false,
    requiredPropsFirst: true,
    scrollYOffset: 0,
    showExtensions: false,
    sortPropsAlphabetically: false,
    suppressWarnings: false,
    theme: {
      colors: {
        primary: { main: '#e94560' },
      },
    },
    untrustedSpec: false,
  },
}));
```

## Complete Docs Routes

```typescript
import { createDocsRoutes } from '@philjs/openapi';

const docsRoutes = createDocsRoutes(spec, {
  title: 'My API',
  basePath: '/api',
  swaggerConfig: {
    tryItOutEnabled: true,
    persistAuthorization: true,
  },
  redocConfig: {
    expandResponses: '200',
  },
});

// Creates:
// GET /api/docs - Swagger UI
// GET /api/redoc - ReDoc
// GET /api/openapi.json - OpenAPI spec

for (const [path, handler] of Object.entries(docsRoutes)) {
  app.get(path, handler);
}
```

## Zod to JSON Schema

### Converting Schemas

```typescript
import { zodToJsonSchema, isZodSchema } from '@philjs/openapi';
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
  role: z.enum(['admin', 'user', 'guest']),
  createdAt: z.date(),
});

const jsonSchema = zodToJsonSchema(UserSchema);

// Result:
// {
//   type: 'object',
//   properties: {
//     id: { type: 'string', format: 'uuid' },
//     name: { type: 'string', minLength: 1, maxLength: 100 },
//     email: { type: 'string', format: 'email' },
//     age: { type: 'integer', minimum: 0, maximum: 150 },
//     role: { type: 'string', enum: ['admin', 'user', 'guest'] },
//     createdAt: { type: 'string', format: 'date-time' },
//   },
//   required: ['id', 'name', 'email', 'role', 'createdAt'],
// }
```

### Supported Zod Types

```typescript
// Primitives
z.string()                    // { type: 'string' }
z.number()                    // { type: 'number' }
z.boolean()                   // { type: 'boolean' }
z.bigint()                    // { type: 'integer', format: 'int64' }
z.date()                      // { type: 'string', format: 'date-time' }

// String validations
z.string().email()            // { type: 'string', format: 'email' }
z.string().url()              // { type: 'string', format: 'uri' }
z.string().uuid()             // { type: 'string', format: 'uuid' }
z.string().min(5)             // { type: 'string', minLength: 5 }
z.string().max(100)           // { type: 'string', maxLength: 100 }
z.string().regex(/^[A-Z]+$/)  // { type: 'string', pattern: '^[A-Z]+$' }
z.string().datetime()         // { type: 'string', format: 'date-time' }
z.string().ip()               // { type: 'string', format: 'ipv4' }

// Number validations
z.number().int()              // { type: 'integer' }
z.number().min(0)             // { type: 'number', minimum: 0 }
z.number().max(100)           // { type: 'number', maximum: 100 }
z.number().positive()         // { type: 'number', exclusiveMinimum: 0 }
z.number().negative()         // { type: 'number', exclusiveMaximum: 0 }
z.number().multipleOf(5)      // { type: 'number', multipleOf: 5 }

// Arrays
z.array(z.string())           // { type: 'array', items: { type: 'string' } }
z.array(z.number()).min(1)    // { type: 'array', items: {...}, minItems: 1 }
z.array(z.string()).max(10)   // { type: 'array', items: {...}, maxItems: 10 }

// Objects
z.object({ name: z.string() })  // { type: 'object', properties: {...} }
z.record(z.number())          // { type: 'object', additionalProperties: {...} }

// Enums and literals
z.enum(['a', 'b', 'c'])       // { type: 'string', enum: ['a', 'b', 'c'] }
z.literal('value')            // { type: 'string', const: 'value' }

// Unions and intersections
z.union([z.string(), z.number()])  // { oneOf: [...] }
z.intersection(A, B)               // { allOf: [...] }
z.discriminatedUnion('type', [...])  // { oneOf: [...], discriminator: {...} }

// Modifiers
z.string().optional()         // Optional (not in required array)
z.string().nullable()         // { ..., nullable: true }
z.string().default('value')   // { ..., default: 'value' }
```

## CLI

### Generate Types

```bash
# Generate TypeScript types from OpenAPI spec
npx philjs-openapi generate-types ./openapi.json -o ./types.ts
```

### Programmatic Usage

```typescript
import { generateTypes, runCLI } from '@philjs/openapi';

// Generate types
const types = await generateTypes('./openapi.json', {
  output: './generated/api-types.ts',
  includeOperations: true,
});

// Run CLI programmatically
await runCLI(['generate-types', './spec.json', '-o', './types.ts']);
```

## Types Reference

```typescript
// OpenAPI specification
interface OpenAPISpec {
  openapi: string;
  info: OpenAPIInfo;
  paths: Record<string, OpenAPIPathItem>;
  servers?: OpenAPIServer[];
  tags?: OpenAPITag[];
  components?: OpenAPIComponents;
  security?: OpenAPISecurityRequirement[];
  externalDocs?: OpenAPIExternalDocs;
}

// API route definition
interface APIRouteDefinition {
  params?: ZodSchema;
  query?: ZodSchema;
  headers?: ZodSchema;
  body?: ZodSchema;
  response?: ZodSchema | Record<string, ZodSchema>;
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  deprecated?: boolean;
  security?: SecurityRequirement[];
  examples?: { request?: unknown; response?: unknown };
  handler: (ctx: RouteContext) => Promise<unknown>;
}

// Route context
interface RouteContext {
  params: Record<string, string>;
  query: Record<string, unknown>;
  headers: Record<string, string>;
  body: unknown;
}

// Swagger UI options
interface SwaggerUIOptions {
  spec?: OpenAPISpec | string;
  specUrl?: string;
  title?: string;
  favicon?: string;
  customCss?: string;
  customJs?: string;
  config?: SwaggerUIConfig;
}
```

## API Reference

### Functions

| Function | Description |
|----------|-------------|
| `createAPI(routes)` | Create typed API definition |
| `openapi(api, options)` | Generate OpenAPI spec |
| `group(config)` | Create route group |
| `mergeAPIs(...apis)` | Merge multiple APIs |
| `swaggerUI(options)` | Create Swagger UI handler |
| `redoc(options)` | Create ReDoc handler |
| `createSwaggerRoutes(spec, options)` | Create docs and spec routes |
| `createDocsRoutes(spec, options)` | Create complete docs routes |
| `specHandler(spec)` | Create spec JSON handler |
| `zodToJsonSchema(schema)` | Convert Zod to JSON Schema |

### Security Scheme Helpers

| Helper | Description |
|--------|-------------|
| `securitySchemes.bearer(format?)` | Bearer token auth |
| `securitySchemes.apiKey(name, location?)` | API key auth |
| `securitySchemes.basic()` | Basic auth |
| `securitySchemes.oauth2AuthorizationCode(config)` | OAuth2 auth code |
| `securitySchemes.oauth2ClientCredentials(config)` | OAuth2 client credentials |
| `securitySchemes.openIdConnect(url)` | OpenID Connect |

### Error Response Helpers

| Helper | Description |
|--------|-------------|
| `errorResponses.badRequest(description?)` | 400 Bad Request |
| `errorResponses.unauthorized(description?)` | 401 Unauthorized |
| `errorResponses.forbidden(description?)` | 403 Forbidden |
| `errorResponses.notFound(description?)` | 404 Not Found |
| `errorResponses.serverError(description?)` | 500 Internal Error |

## Example: Complete API Documentation

```typescript
import {
  createAPI,
  openapi,
  group,
  securitySchemes,
  errorResponses,
  createDocsRoutes,
} from '@philjs/openapi';
import { z } from 'zod';

// Schemas
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
});

const CreateUserSchema = UserSchema.omit({ id: true });

// API groups
const usersGroup = group({
  name: 'Users',
  basePath: '/users',
  routes: {
    'GET /': {
      query: z.object({
        page: z.coerce.number().default(1),
        limit: z.coerce.number().default(10),
      }),
      response: z.object({
        users: z.array(UserSchema),
        total: z.number(),
      }),
      summary: 'List users',
      handler: listUsers,
    },
    'POST /': {
      body: CreateUserSchema,
      response: { 201: UserSchema },
      summary: 'Create user',
      security: [{ bearerAuth: [] }],
      handler: createUser,
    },
    'GET /:id': {
      params: z.object({ id: z.string().uuid() }),
      response: UserSchema,
      summary: 'Get user by ID',
      handler: getUser,
    },
  },
});

// Generate spec
const spec = openapi([usersGroup], {
  info: {
    title: 'User Management API',
    version: '1.0.0',
    description: 'API for managing users',
  },
  servers: [
    { url: 'https://api.example.com', description: 'Production' },
  ],
  securitySchemes: {
    bearerAuth: securitySchemes.bearer('JWT'),
  },
  errorResponses: {
    400: errorResponses.badRequest(),
    401: errorResponses.unauthorized(),
    404: errorResponses.notFound(),
    500: errorResponses.serverError(),
  },
});

// Serve documentation
const docs = createDocsRoutes(spec, {
  title: 'User API Docs',
  basePath: '/api',
});

// Register routes
app.get('/api/docs', docs['/api/docs']);
app.get('/api/redoc', docs['/api/redoc']);
app.get('/api/openapi.json', docs['/api/openapi.json']);
```
