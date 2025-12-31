/**
 * PhilJS OpenAPI
 *
 * Automatic OpenAPI specification generation for PhilJS APIs.
 * Inspired by Elysia's elegant API documentation.
 *
 * @example
 * ```typescript
 * import { createAPI, openapi } from 'philjs-openapi';
 * import { z } from 'zod';
 *
 * // Define schemas
 * const UserSchema = z.object({
 *   id: z.string().uuid(),
 *   name: z.string().min(1),
 *   email: z.string().email(),
 * });
 *
 * const CreateUserSchema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 * });
 *
 * // Create API with automatic documentation
 * const api = createAPI({
 *   'GET /users': {
 *     response: z.array(UserSchema),
 *     summary: 'List all users',
 *     tags: ['Users'],
 *     handler: async () => fetchUsers(),
 *   },
 *   'POST /users': {
 *     body: CreateUserSchema,
 *     response: UserSchema,
 *     summary: 'Create a new user',
 *     tags: ['Users'],
 *     handler: async ({ body }) => createUser(body),
 *   },
 *   'GET /users/:id': {
 *     params: z.object({ id: z.string().uuid() }),
 *     response: UserSchema,
 *     summary: 'Get user by ID',
 *     tags: ['Users'],
 *     handler: async ({ params }) => fetchUser(params.id),
 *   },
 * });
 *
 * // Generate OpenAPI spec
 * const spec = openapi(api, {
 *   info: {
 *     title: 'My API',
 *     version: '1.0.0',
 *   },
 *   servers: [{ url: 'https://api.example.com' }],
 * });
 * ```
 *
 * @packageDocumentation
 */
// Core API creation and OpenAPI generation
export { createAPI, openapi, group, mergeAPIs, securitySchemes, errorResponses, } from './openapi.js';
// Swagger UI and documentation endpoints
export { swaggerUI, createSwaggerRoutes, specHandler, redoc, createDocsRoutes, } from './swagger-ui.js';
// Zod to JSON Schema conversion
export { zodToJsonSchema, isZodSchema, extractExample, getSchemaDescription, } from './zod-to-schema.js';
// CLI utilities (for programmatic use)
export { generateTypes, main as runCLI } from './cli.js';
//# sourceMappingURL=index.js.map