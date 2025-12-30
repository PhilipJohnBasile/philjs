/**
 * PhilJS Poem Endpoints
 *
 * Endpoint helpers for the Poem framework integration.
 * Poem has excellent support for OpenAPI, which we leverage here.
 */

import type {
  EndpointOptions,
  EndpointContext,
  EndpointHandler,
  OpenAPIOperation,
  OpenAPISchema,
} from './types.js';

// ============================================================================
// Endpoint Builder
// ============================================================================

/**
 * HTTP method type
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Endpoint definition
 */
export interface EndpointDefinition<TInput = unknown, TOutput = unknown> {
  method: HttpMethod;
  path: string;
  options: EndpointOptions;
  handler: EndpointHandler<TInput, TOutput>;
  openapi?: OpenAPIOperation;
}

/**
 * Endpoint builder for type-safe route creation
 */
export class EndpointBuilder<TInput = void, TOutput = void> {
  private def: Partial<EndpointDefinition<TInput, TOutput>> = {};

  /**
   * Set HTTP method to GET
   */
  get(path: string): EndpointBuilder<TInput, TOutput> {
    return this.method('GET', path);
  }

  /**
   * Set HTTP method to POST
   */
  post(path: string): EndpointBuilder<TInput, TOutput> {
    return this.method('POST', path);
  }

  /**
   * Set HTTP method to PUT
   */
  put(path: string): EndpointBuilder<TInput, TOutput> {
    return this.method('PUT', path);
  }

  /**
   * Set HTTP method to PATCH
   */
  patch(path: string): EndpointBuilder<TInput, TOutput> {
    return this.method('PATCH', path);
  }

  /**
   * Set HTTP method to DELETE
   */
  delete(path: string): EndpointBuilder<TInput, TOutput> {
    return this.method('DELETE', path);
  }

  /**
   * Set HTTP method and path
   */
  method(method: HttpMethod, path: string): EndpointBuilder<TInput, TOutput> {
    this.def.method = method;
    this.def.path = path;
    this.def.options = { method, path };
    return this;
  }

  /**
   * Add OpenAPI tags
   */
  tags(...tags: string[]): this {
    this.def.options = { ...this.def.options!, tags };
    return this;
  }

  /**
   * Add OpenAPI summary
   */
  summary(summary: string): this {
    this.def.options = { ...this.def.options!, summary };
    return this;
  }

  /**
   * Add OpenAPI description
   */
  description(description: string): this {
    this.def.options = { ...this.def.options!, description };
    return this;
  }

  /**
   * Mark as deprecated
   */
  deprecated(): this {
    this.def.options = { ...this.def.options!, deprecated: true };
    return this;
  }

  /**
   * Require permissions
   */
  permissions(...permissions: string[]): this {
    this.def.options = { ...this.def.options!, permissions };
    return this;
  }

  /**
   * Set custom rate limit
   */
  rateLimit(limit: number, window: number): this {
    this.def.options = { ...this.def.options!, rateLimit: { limit, window } };
    return this;
  }

  /**
   * Set input type (for TypeScript inference)
   */
  input<T>(): EndpointBuilder<T, TOutput> {
    return this as unknown as EndpointBuilder<T, TOutput>;
  }

  /**
   * Set output type (for TypeScript inference)
   */
  output<T>(): EndpointBuilder<TInput, T> {
    return this as unknown as EndpointBuilder<TInput, T>;
  }

  /**
   * Set the handler function
   */
  handler(fn: EndpointHandler<TInput, TOutput>): EndpointDefinition<TInput, TOutput> {
    this.def.handler = fn;
    return this.def as EndpointDefinition<TInput, TOutput>;
  }

  /**
   * Add OpenAPI operation details
   */
  openapi(operation: OpenAPIOperation): this {
    this.def.openapi = operation;
    return this;
  }
}

/**
 * Create a new endpoint builder
 */
export function endpoint(): EndpointBuilder {
  return new EndpointBuilder();
}

// ============================================================================
// Route Group
// ============================================================================

/**
 * Route group for organizing related endpoints
 */
export class RouteGroup {
  private prefix: string;
  private endpoints: EndpointDefinition[] = [];
  private middleware: string[] = [];
  private tags: string[] = [];

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  /**
   * Add middleware to the group
   */
  use(middleware: string): this {
    this.middleware.push(middleware);
    return this;
  }

  /**
   * Add tags to all endpoints in the group
   */
  tag(...tags: string[]): this {
    this.tags.push(...tags);
    return this;
  }

  /**
   * Add an endpoint to the group
   */
  add<TInput, TOutput>(endpoint: EndpointDefinition<TInput, TOutput>): this {
    // Prepend prefix to path
    const prefixedEndpoint: EndpointDefinition = {
      method: endpoint.method,
      path: this.prefix + endpoint.path,
      options: {
        ...endpoint.options,
        path: this.prefix + endpoint.path,
        tags: [...this.tags, ...(endpoint.options.tags || [])],
      },
      handler: endpoint.handler as EndpointHandler<unknown, unknown>,
    };
    if (endpoint.openapi !== undefined) prefixedEndpoint.openapi = endpoint.openapi;
    this.endpoints.push(prefixedEndpoint);
    return this;
  }

  /**
   * Create a nested group
   */
  group(prefix: string): RouteGroup {
    const nested = new RouteGroup(this.prefix + prefix);
    nested.tags.push(...this.tags);
    nested.middleware.push(...this.middleware);
    return nested;
  }

  /**
   * Get all endpoints
   */
  getEndpoints(): EndpointDefinition[] {
    return this.endpoints;
  }

  /**
   * Generate Rust router code
   */
  toRustCode(): string {
    const routes = this.endpoints.map(ep => {
      const method = ep.method.toLowerCase();
      return `    Route::new("${ep.path}").${method}(${this.handlerName(ep)})`;
    }).join(',\n');

    return `
use poem::{Route, get, post, put, patch, delete};

fn ${this.routerName()}() -> Route {
    Route::new()
${routes}
}
`.trim();
  }

  private routerName(): string {
    return this.prefix.replace(/\//g, '_').replace(/^_/, '') + '_routes';
  }

  private handlerName(ep: EndpointDefinition): string {
    const parts = ep.path.split('/').filter(Boolean);
    return `${ep.method.toLowerCase()}_${parts.join('_')}`;
  }
}

/**
 * Create a route group
 */
export function group(prefix: string): RouteGroup {
  return new RouteGroup(prefix);
}

// ============================================================================
// OpenAPI Endpoint
// ============================================================================

/**
 * OpenAPI endpoint builder for Poem OpenAPI
 */
export class OpenAPIEndpointBuilder {
  private operations: Map<string, OpenAPIOperation> = new Map();

  /**
   * Define a GET operation
   */
  get(
    path: string,
    operation: OpenAPIOperation
  ): this {
    this.operations.set(`GET ${path}`, operation);
    return this;
  }

  /**
   * Define a POST operation
   */
  post(
    path: string,
    operation: OpenAPIOperation
  ): this {
    this.operations.set(`POST ${path}`, operation);
    return this;
  }

  /**
   * Define a PUT operation
   */
  put(
    path: string,
    operation: OpenAPIOperation
  ): this {
    this.operations.set(`PUT ${path}`, operation);
    return this;
  }

  /**
   * Define a DELETE operation
   */
  delete(
    path: string,
    operation: OpenAPIOperation
  ): this {
    this.operations.set(`DELETE ${path}`, operation);
    return this;
  }

  /**
   * Generate Rust OpenAPI code
   */
  toRustCode(): string {
    return `
use poem_openapi::{OpenApi, payload::{Json, PlainText}, Object, ApiResponse};

// Define request/response schemas
#[derive(Object)]
struct ExampleRequest {
    /// Field description
    field: String,
}

#[derive(Object)]
struct ExampleResponse {
    /// Response message
    message: String,
}

// Define API responses
#[derive(ApiResponse)]
enum ApiResult {
    #[oai(status = 200)]
    Ok(Json<ExampleResponse>),
    #[oai(status = 400)]
    BadRequest(PlainText<String>),
    #[oai(status = 500)]
    InternalError(PlainText<String>),
}

// Define the API struct
struct Api;

#[OpenApi]
impl Api {
    /// Example endpoint
    #[oai(path = "/example", method = "get")]
    async fn example(&self) -> ApiResult {
        ApiResult::Ok(Json(ExampleResponse {
            message: "Hello from PhilJS!".to_string(),
        }))
    }
}
`.trim();
  }
}

/**
 * Create an OpenAPI endpoint builder
 */
export function openapi(): OpenAPIEndpointBuilder {
  return new OpenAPIEndpointBuilder();
}

// ============================================================================
// CRUD Endpoints
// ============================================================================

/**
 * CRUD endpoint options
 */
export interface CRUDOptions {
  /** Resource name */
  resource: string;
  /** Path prefix */
  path?: string;
  /** OpenAPI tags */
  tags?: string[];
  /** Enable list endpoint */
  list?: boolean;
  /** Enable get endpoint */
  get?: boolean;
  /** Enable create endpoint */
  create?: boolean;
  /** Enable update endpoint */
  update?: boolean;
  /** Enable delete endpoint */
  delete?: boolean;
}

/**
 * Generate CRUD endpoints for a resource
 */
export function crud(options: CRUDOptions): RouteGroup {
  const {
    resource,
    path = `/${resource.toLowerCase()}s`,
    tags = [resource],
    list = true,
    get = true,
    create = true,
    update = true,
    delete: del = true,
  } = options;

  const group = new RouteGroup(path).tag(...tags);

  if (list) {
    group.add(
      endpoint()
        .get('/')
        .summary(`List ${resource}s`)
        .input<unknown>()
        .output<{ items: unknown[]; total: number }>()
        .handler(async () => ({ items: [], total: 0 }))
    );
  }

  if (get) {
    group.add(
      endpoint()
        .get('/:id')
        .summary(`Get ${resource} by ID`)
        .input<unknown>()
        .output<{ id: string | undefined }>()
        .handler(async (_, ctx) => ({ id: ctx.params['id'] }))
    );
  }

  if (create) {
    group.add(
      endpoint()
        .post('/')
        .summary(`Create ${resource}`)
        .input<Record<string, unknown>>()
        .output<Record<string, unknown>>()
        .handler(async (input) => ({ id: 'new', ...(input as Record<string, unknown>) }))
    );
  }

  if (update) {
    group.add(
      endpoint()
        .put('/:id')
        .summary(`Update ${resource}`)
        .input<Record<string, unknown>>()
        .output<Record<string, unknown>>()
        .handler(async (input, ctx) => ({ id: ctx.params['id'], ...(input as Record<string, unknown>) }))
    );
  }

  if (del) {
    group.add(
      endpoint()
        .delete('/:id')
        .summary(`Delete ${resource}`)
        .input<unknown>()
        .output<{ deleted: boolean }>()
        .handler(async () => ({ deleted: true }))
    );
  }

  return group;
}

// ============================================================================
// SSR Endpoints
// ============================================================================

/**
 * SSR page endpoint options
 */
export interface SSRPageOptions {
  /** Page path */
  path: string;
  /** Page title */
  title?: string;
  /** Page component */
  component: string;
  /** Data loader */
  loader?: () => Promise<unknown>;
}

/**
 * Create an SSR page endpoint
 */
export function ssrPage(options: SSRPageOptions): EndpointDefinition<unknown, { component: string; title: string | undefined; data: unknown; path: string }> {
  return endpoint()
    .get(options.path)
    .summary(`SSR Page: ${options.title || options.path}`)
    .tags('pages')
    .input<unknown>()
    .output<{ component: string; title: string | undefined; data: unknown; path: string }>()
    .handler(async (_, ctx) => {
      const data = options.loader ? await options.loader() : {};
      return {
        component: options.component,
        title: options.title,
        data,
        path: ctx.path,
      };
    });
}

/**
 * Create SSR page group
 */
export function ssrPages(
  pages: SSRPageOptions[]
): RouteGroup {
  const pageGroup = group('').tag('pages');

  for (const page of pages) {
    pageGroup.add(ssrPage(page));
  }

  return pageGroup;
}

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * Create a JSON API endpoint
 */
export function apiEndpoint<TInput, TOutput>(
  method: HttpMethod,
  path: string,
  handler: EndpointHandler<TInput, TOutput>
): EndpointDefinition<TInput, TOutput> {
  const builder = new EndpointBuilder<TInput, TOutput>();
  return builder
    .method(method, path)
    .tags('api')
    .handler(handler);
}

/**
 * Create a health check endpoint
 */
export function healthCheck(path: string = '/health'): EndpointDefinition<unknown, { status: string; timestamp: string }> {
  return endpoint()
    .get(path)
    .summary('Health check')
    .tags('health')
    .input<unknown>()
    .output<{ status: string; timestamp: string }>()
    .handler(async () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }));
}

/**
 * Create a readiness probe endpoint
 */
export function readinessProbe(
  path: string = '/ready',
  checks?: Array<{ name: string; check: () => Promise<boolean> }>
): EndpointDefinition<unknown, { ready: boolean; checks: Record<string, boolean>; timestamp: string }> {
  return endpoint()
    .get(path)
    .summary('Readiness probe')
    .tags('health')
    .input<unknown>()
    .output<{ ready: boolean; checks: Record<string, boolean>; timestamp: string }>()
    .handler(async () => {
      const results: Record<string, boolean> = {};
      let allReady = true;

      for (const { name, check } of checks || []) {
        try {
          results[name] = await check();
          if (!results[name]) allReady = false;
        } catch {
          results[name] = false;
          allReady = false;
        }
      }

      return {
        ready: allReady,
        checks: results,
        timestamp: new Date().toISOString(),
      };
    });
}
