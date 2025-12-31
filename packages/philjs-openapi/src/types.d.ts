/**
 * PhilJS OpenAPI - Type Definitions
 *
 * OpenAPI 3.1 specification types and PhilJS API route types.
 */
export interface JSONSchema {
    type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
    format?: string;
    description?: string | undefined;
    default?: unknown;
    const?: unknown;
    enum?: unknown[];
    nullable?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: number;
    exclusiveMaximum?: number;
    multipleOf?: number;
    items?: JSONSchema | JSONSchema[];
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;
    properties?: Record<string, JSONSchema>;
    required?: string[];
    additionalProperties?: boolean | JSONSchema;
    allOf?: JSONSchema[];
    anyOf?: JSONSchema[];
    oneOf?: JSONSchema[];
    not?: JSONSchema;
    discriminator?: {
        propertyName: string;
        mapping?: Record<string, string>;
    };
    $ref?: string;
    example?: unknown;
    examples?: unknown[];
}
export interface OpenAPISpec {
    openapi: '3.1.0';
    info: OpenAPIInfo;
    servers?: OpenAPIServer[];
    paths: Record<string, OpenAPIPathItem>;
    components?: OpenAPIComponents;
    security?: OpenAPISecurityRequirement[];
    tags?: OpenAPITag[];
    externalDocs?: OpenAPIExternalDocs;
}
export interface OpenAPIInfo {
    title: string;
    version: string;
    description?: string;
    termsOfService?: string;
    contact?: {
        name?: string;
        url?: string;
        email?: string;
    };
    license?: {
        name: string;
        identifier?: string;
        url?: string;
    };
    summary?: string;
}
export interface OpenAPIServer {
    url: string;
    description?: string;
    variables?: Record<string, {
        default: string;
        enum?: string[];
        description?: string;
    }>;
}
export interface OpenAPIPathItem {
    summary?: string;
    description?: string;
    get?: OpenAPIOperation;
    put?: OpenAPIOperation;
    post?: OpenAPIOperation;
    delete?: OpenAPIOperation;
    options?: OpenAPIOperation;
    head?: OpenAPIOperation;
    patch?: OpenAPIOperation;
    trace?: OpenAPIOperation;
    parameters?: OpenAPIParameter[];
}
export interface OpenAPIOperation {
    operationId?: string;
    summary?: string;
    description?: string;
    tags?: string[];
    parameters?: OpenAPIParameter[];
    requestBody?: OpenAPIRequestBody;
    responses: Record<string, OpenAPIResponse>;
    security?: OpenAPISecurityRequirement[];
    deprecated?: boolean;
    externalDocs?: OpenAPIExternalDocs;
}
export interface OpenAPIParameter {
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
    schema?: JSONSchema;
    example?: unknown;
    examples?: Record<string, OpenAPIExample>;
    style?: 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject';
    explode?: boolean;
}
export interface OpenAPIRequestBody {
    description?: string;
    required?: boolean;
    content: Record<string, OpenAPIMediaType>;
}
export interface OpenAPIResponse {
    description: string;
    headers?: Record<string, OpenAPIHeader>;
    content?: Record<string, OpenAPIMediaType>;
    links?: Record<string, OpenAPILink>;
}
export interface OpenAPIMediaType {
    schema?: JSONSchema;
    example?: unknown;
    examples?: Record<string, OpenAPIExample>;
    encoding?: Record<string, OpenAPIEncoding>;
}
export interface OpenAPIHeader {
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    schema?: JSONSchema;
}
export interface OpenAPILink {
    operationRef?: string;
    operationId?: string;
    parameters?: Record<string, unknown>;
    requestBody?: unknown;
    description?: string;
}
export interface OpenAPIEncoding {
    contentType?: string;
    headers?: Record<string, OpenAPIHeader>;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
}
export interface OpenAPIExample {
    summary?: string;
    description?: string;
    value?: unknown;
    externalValue?: string;
}
export interface OpenAPIComponents {
    schemas?: Record<string, JSONSchema>;
    responses?: Record<string, OpenAPIResponse>;
    parameters?: Record<string, OpenAPIParameter>;
    examples?: Record<string, OpenAPIExample>;
    requestBodies?: Record<string, OpenAPIRequestBody>;
    headers?: Record<string, OpenAPIHeader>;
    securitySchemes?: Record<string, OpenAPISecurityScheme>;
    links?: Record<string, OpenAPILink>;
    callbacks?: Record<string, Record<string, OpenAPIPathItem>>;
}
export interface OpenAPISecurityScheme {
    type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect' | 'mutualTLS';
    description?: string;
    name?: string;
    in?: 'query' | 'header' | 'cookie';
    scheme?: string;
    bearerFormat?: string;
    flows?: OpenAPIOAuthFlows;
    openIdConnectUrl?: string;
}
export interface OpenAPIOAuthFlows {
    implicit?: OpenAPIOAuthFlow;
    password?: OpenAPIOAuthFlow;
    clientCredentials?: OpenAPIOAuthFlow;
    authorizationCode?: OpenAPIOAuthFlow;
}
export interface OpenAPIOAuthFlow {
    authorizationUrl?: string;
    tokenUrl?: string;
    refreshUrl?: string;
    scopes: Record<string, string>;
}
export interface OpenAPISecurityRequirement {
    [name: string]: string[];
}
export interface OpenAPITag {
    name: string;
    description?: string;
    externalDocs?: OpenAPIExternalDocs;
}
export interface OpenAPIExternalDocs {
    url: string;
    description?: string;
}
/**
 * PhilJS API route definition with full type information
 */
export interface APIRouteDefinition<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown, THeaders = unknown> {
    /** Zod schema for path parameters */
    params?: TParams;
    /** Zod schema for query parameters */
    query?: TQuery;
    /** Zod schema for request body */
    body?: TBody;
    /** Zod schema for response body */
    response?: TResponse | Record<number, TResponse>;
    /** Zod schema for request headers */
    headers?: THeaders;
    /** Route handler function */
    handler: (context: RouteContext<TParams, TQuery, TBody, THeaders>) => Promise<unknown> | unknown;
    /** Route description */
    description?: string;
    /** Route summary */
    summary?: string;
    /** Route tags for grouping */
    tags?: string[];
    /** Mark route as deprecated */
    deprecated?: boolean;
    /** Security requirements */
    security?: OpenAPISecurityRequirement[];
    /** Operation ID */
    operationId?: string;
    /** Additional examples */
    examples?: {
        request?: unknown;
        response?: unknown;
    };
}
/**
 * Route context passed to handler
 */
export interface RouteContext<TParams, TQuery, TBody, THeaders> {
    params: TParams;
    query: TQuery;
    body: TBody;
    headers: THeaders;
    request: Request;
}
/**
 * API definition - collection of routes
 */
export type APIDefinition = Record<string, APIRouteDefinition>;
/**
 * OpenAPI generation options
 */
export interface OpenAPIOptions {
    /** OpenAPI info object */
    info: OpenAPIInfo;
    /** Server definitions */
    servers?: OpenAPIServer[];
    /** Global tags */
    tags?: OpenAPITag[];
    /** Security schemes */
    securitySchemes?: Record<string, OpenAPISecurityScheme>;
    /** Global security requirements */
    security?: OpenAPISecurityRequirement[];
    /** External documentation */
    externalDocs?: OpenAPIExternalDocs;
    /** Base path for all routes */
    basePath?: string;
    /** Custom response for errors */
    errorResponses?: {
        400?: OpenAPIResponse;
        401?: OpenAPIResponse;
        403?: OpenAPIResponse;
        404?: OpenAPIResponse;
        500?: OpenAPIResponse;
    };
    /** Include examples from Zod defaults */
    includeExamples?: boolean;
    /** Transform operation IDs */
    operationIdTransform?: (method: string, path: string) => string;
}
/**
 * Swagger UI options
 */
export interface SwaggerUIOptions {
    /** OpenAPI spec or URL to spec */
    spec?: OpenAPISpec | string;
    /** URL to OpenAPI spec JSON */
    specUrl?: string;
    /** Title for the page */
    title?: string;
    /** Custom favicon URL */
    favicon?: string;
    /** Custom CSS */
    customCss?: string;
    /** Custom JavaScript */
    customJs?: string;
    /** Swagger UI configuration */
    config?: {
        deepLinking?: boolean;
        displayOperationId?: boolean;
        defaultModelsExpandDepth?: number;
        defaultModelExpandDepth?: number;
        displayRequestDuration?: boolean;
        filter?: boolean | string;
        maxDisplayedTags?: number;
        showExtensions?: boolean;
        showCommonExtensions?: boolean;
        supportedSubmitMethods?: string[];
        tryItOutEnabled?: boolean;
        validatorUrl?: string | null;
        persistAuthorization?: boolean;
        withCredentials?: boolean;
    };
}
/**
 * Route group for organizing routes
 */
export interface RouteGroup {
    /** Group name (used as tag) */
    name: string;
    /** Group description */
    description?: string;
    /** Base path for group */
    basePath?: string;
    /** Routes in this group */
    routes: APIDefinition;
    /** Security for all routes in group */
    security?: OpenAPISecurityRequirement[];
}
/**
 * Options for TypeScript type generation from OpenAPI spec
 */
export interface TypeGenerationOptions {
    /** Input OpenAPI spec file or URL */
    input: string;
    /** Output TypeScript file path */
    output: string;
    /** Generate client functions */
    generateClient?: boolean;
    /** Generate Zod schemas */
    generateZod?: boolean;
    /** Prefix for type names */
    typePrefix?: string;
    /** Suffix for type names */
    typeSuffix?: string;
    /** Generate enums as unions */
    enumsAsUnion?: boolean;
    /** Generate readonly types */
    readonlyTypes?: boolean;
}
/**
 * Generated TypeScript output
 */
export interface GeneratedTypes {
    /** TypeScript type definitions */
    types: string;
    /** Zod schema definitions */
    schemas?: string;
    /** API client code */
    client?: string;
}
//# sourceMappingURL=types.d.ts.map