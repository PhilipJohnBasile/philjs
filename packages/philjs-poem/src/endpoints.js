/**
 * PhilJS Poem Endpoints
 *
 * Endpoint helpers for the Poem framework integration.
 * Poem has excellent support for OpenAPI, which we leverage here.
 */
/**
 * Endpoint builder for type-safe route creation
 */
export class EndpointBuilder {
    def = {};
    /**
     * Set HTTP method to GET
     */
    get(path) {
        return this.method('GET', path);
    }
    /**
     * Set HTTP method to POST
     */
    post(path) {
        return this.method('POST', path);
    }
    /**
     * Set HTTP method to PUT
     */
    put(path) {
        return this.method('PUT', path);
    }
    /**
     * Set HTTP method to PATCH
     */
    patch(path) {
        return this.method('PATCH', path);
    }
    /**
     * Set HTTP method to DELETE
     */
    delete(path) {
        return this.method('DELETE', path);
    }
    /**
     * Set HTTP method and path
     */
    method(method, path) {
        this.def.method = method;
        this.def.path = path;
        this.def.options = { method, path };
        return this;
    }
    /**
     * Add OpenAPI tags
     */
    tags(...tags) {
        this.def.options = { ...this.def.options, tags };
        return this;
    }
    /**
     * Add OpenAPI summary
     */
    summary(summary) {
        this.def.options = { ...this.def.options, summary };
        return this;
    }
    /**
     * Add OpenAPI description
     */
    description(description) {
        this.def.options = { ...this.def.options, description };
        return this;
    }
    /**
     * Mark as deprecated
     */
    deprecated() {
        this.def.options = { ...this.def.options, deprecated: true };
        return this;
    }
    /**
     * Require permissions
     */
    permissions(...permissions) {
        this.def.options = { ...this.def.options, permissions };
        return this;
    }
    /**
     * Set custom rate limit
     */
    rateLimit(limit, window) {
        this.def.options = { ...this.def.options, rateLimit: { limit, window } };
        return this;
    }
    /**
     * Set input type (for TypeScript inference)
     */
    input() {
        return this;
    }
    /**
     * Set output type (for TypeScript inference)
     */
    output() {
        return this;
    }
    /**
     * Set the handler function
     */
    handler(fn) {
        this.def.handler = fn;
        return this.def;
    }
    /**
     * Add OpenAPI operation details
     */
    openapi(operation) {
        this.def.openapi = operation;
        return this;
    }
}
/**
 * Create a new endpoint builder
 */
export function endpoint() {
    return new EndpointBuilder();
}
// ============================================================================
// Route Group
// ============================================================================
/**
 * Route group for organizing related endpoints
 */
export class RouteGroup {
    prefix;
    endpoints = [];
    middleware = [];
    tags = [];
    constructor(prefix) {
        this.prefix = prefix;
    }
    /**
     * Add middleware to the group
     */
    use(middleware) {
        this.middleware.push(middleware);
        return this;
    }
    /**
     * Add tags to all endpoints in the group
     */
    tag(...tags) {
        this.tags.push(...tags);
        return this;
    }
    /**
     * Add an endpoint to the group
     */
    add(endpoint) {
        // Prepend prefix to path
        const prefixedEndpoint = {
            method: endpoint.method,
            path: this.prefix + endpoint.path,
            options: {
                ...endpoint.options,
                path: this.prefix + endpoint.path,
                tags: [...this.tags, ...(endpoint.options.tags || [])],
            },
            handler: endpoint.handler,
        };
        if (endpoint.openapi !== undefined)
            prefixedEndpoint.openapi = endpoint.openapi;
        this.endpoints.push(prefixedEndpoint);
        return this;
    }
    /**
     * Create a nested group
     */
    group(prefix) {
        const nested = new RouteGroup(this.prefix + prefix);
        nested.tags.push(...this.tags);
        nested.middleware.push(...this.middleware);
        return nested;
    }
    /**
     * Get all endpoints
     */
    getEndpoints() {
        return this.endpoints;
    }
    /**
     * Generate Rust router code
     */
    toRustCode() {
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
    routerName() {
        return this.prefix.replace(/\//g, '_').replace(/^_/, '') + '_routes';
    }
    handlerName(ep) {
        const parts = ep.path.split('/').filter(Boolean);
        return `${ep.method.toLowerCase()}_${parts.join('_')}`;
    }
}
/**
 * Create a route group
 */
export function group(prefix) {
    return new RouteGroup(prefix);
}
// ============================================================================
// OpenAPI Endpoint
// ============================================================================
/**
 * OpenAPI endpoint builder for Poem OpenAPI
 */
export class OpenAPIEndpointBuilder {
    operations = new Map();
    /**
     * Define a GET operation
     */
    get(path, operation) {
        this.operations.set(`GET ${path}`, operation);
        return this;
    }
    /**
     * Define a POST operation
     */
    post(path, operation) {
        this.operations.set(`POST ${path}`, operation);
        return this;
    }
    /**
     * Define a PUT operation
     */
    put(path, operation) {
        this.operations.set(`PUT ${path}`, operation);
        return this;
    }
    /**
     * Define a DELETE operation
     */
    delete(path, operation) {
        this.operations.set(`DELETE ${path}`, operation);
        return this;
    }
    /**
     * Generate Rust OpenAPI code
     */
    toRustCode() {
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
export function openapi() {
    return new OpenAPIEndpointBuilder();
}
/**
 * Generate CRUD endpoints for a resource
 */
export function crud(options) {
    const { resource, path = `/${resource.toLowerCase()}s`, tags = [resource], list = true, get = true, create = true, update = true, delete: del = true, } = options;
    const group = new RouteGroup(path).tag(...tags);
    if (list) {
        group.add(endpoint()
            .get('/')
            .summary(`List ${resource}s`)
            .input()
            .output()
            .handler(async () => ({ items: [], total: 0 })));
    }
    if (get) {
        group.add(endpoint()
            .get('/:id')
            .summary(`Get ${resource} by ID`)
            .input()
            .output()
            .handler(async (_, ctx) => ({ id: ctx.params['id'] })));
    }
    if (create) {
        group.add(endpoint()
            .post('/')
            .summary(`Create ${resource}`)
            .input()
            .output()
            .handler(async (input) => ({ id: 'new', ...input })));
    }
    if (update) {
        group.add(endpoint()
            .put('/:id')
            .summary(`Update ${resource}`)
            .input()
            .output()
            .handler(async (input, ctx) => ({ id: ctx.params['id'], ...input })));
    }
    if (del) {
        group.add(endpoint()
            .delete('/:id')
            .summary(`Delete ${resource}`)
            .input()
            .output()
            .handler(async () => ({ deleted: true })));
    }
    return group;
}
/**
 * Create an SSR page endpoint
 */
export function ssrPage(options) {
    return endpoint()
        .get(options.path)
        .summary(`SSR Page: ${options.title || options.path}`)
        .tags('pages')
        .input()
        .output()
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
export function ssrPages(pages) {
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
export function apiEndpoint(method, path, handler) {
    const builder = new EndpointBuilder();
    return builder
        .method(method, path)
        .tags('api')
        .handler(handler);
}
/**
 * Create a health check endpoint
 */
export function healthCheck(path = '/health') {
    return endpoint()
        .get(path)
        .summary('Health check')
        .tags('health')
        .input()
        .output()
        .handler(async () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
    }));
}
/**
 * Create a readiness probe endpoint
 */
export function readinessProbe(path = '/ready', checks) {
    return endpoint()
        .get(path)
        .summary('Readiness probe')
        .tags('health')
        .input()
        .output()
        .handler(async () => {
        const results = {};
        let allReady = true;
        for (const { name, check } of checks || []) {
            try {
                results[name] = await check();
                if (!results[name])
                    allReady = false;
            }
            catch {
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
//# sourceMappingURL=endpoints.js.map