/**
 * PhilJS Poem OpenAPI Integration
 *
 * OpenAPI/Swagger documentation support for Poem framework.
 * Poem has excellent OpenAPI support via poem-openapi crate.
 */
import type { OpenAPIOperation, OpenAPISchema, OpenAPIResponse, OpenAPISecurity, PoemOpenAPIConfig } from './types.js';
/**
 * OpenAPI data types
 */
export type OpenAPIDataType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
/**
 * OpenAPI string formats
 */
export type OpenAPIStringFormat = 'date' | 'date-time' | 'password' | 'byte' | 'binary' | 'email' | 'uuid' | 'uri' | 'hostname' | 'ipv4' | 'ipv6';
/**
 * OpenAPI number formats
 */
export type OpenAPINumberFormat = 'float' | 'double' | 'int32' | 'int64';
/**
 * OpenAPI parameter location
 */
export type OpenAPIParameterIn = 'query' | 'path' | 'header' | 'cookie';
/**
 * OpenAPI parameter definition
 */
export interface OpenAPIParameter {
    name: string;
    in: OpenAPIParameterIn;
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    schema: OpenAPISchema;
    example?: unknown;
}
/**
 * OpenAPI request body
 */
export interface OpenAPIRequestBody {
    description?: string;
    required?: boolean;
    content: Record<string, {
        schema: OpenAPISchema;
        example?: unknown;
    }>;
}
/**
 * OpenAPI security scheme types
 */
export type SecuritySchemeType = 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
/**
 * OpenAPI security scheme
 */
export interface OpenAPISecurityScheme {
    type: SecuritySchemeType;
    description?: string;
    name?: string;
    in?: 'query' | 'header' | 'cookie';
    scheme?: string;
    bearerFormat?: string;
    flows?: {
        implicit?: OAuthFlow;
        password?: OAuthFlow;
        clientCredentials?: OAuthFlow;
        authorizationCode?: OAuthFlow;
    };
    openIdConnectUrl?: string;
}
/**
 * OAuth flow configuration
 */
export interface OAuthFlow {
    authorizationUrl?: string;
    tokenUrl?: string;
    refreshUrl?: string;
    scopes: Record<string, string>;
}
/**
 * OpenAPI specification
 */
export interface OpenAPISpec {
    openapi: '3.0.3' | '3.1.0';
    info: {
        title: string;
        description?: string;
        version: string;
        termsOfService?: string;
        contact?: {
            name?: string;
            url?: string;
            email?: string;
        };
        license?: {
            name: string;
            url?: string;
        };
    };
    servers?: Array<{
        url: string;
        description?: string;
        variables?: Record<string, {
            default: string;
            enum?: string[];
            description?: string;
        }>;
    }>;
    paths: Record<string, Record<string, OpenAPIOperation>>;
    components?: {
        schemas?: Record<string, OpenAPISchema>;
        responses?: Record<string, OpenAPIResponse>;
        parameters?: Record<string, OpenAPIParameter>;
        securitySchemes?: Record<string, OpenAPISecurityScheme>;
        requestBodies?: Record<string, OpenAPIRequestBody>;
    };
    security?: OpenAPISecurity[];
    tags?: Array<{
        name: string;
        description?: string;
    }>;
}
/**
 * OpenAPI specification builder
 */
export declare class OpenAPIBuilder {
    private spec;
    constructor(config?: PoemOpenAPIConfig);
    /**
     * Add a server
     */
    server(url: string, description?: string): this;
    /**
     * Add a tag
     */
    tag(name: string, description?: string): this;
    /**
     * Add a schema component
     */
    schema(name: string, schema: OpenAPISchema): this;
    /**
     * Add a security scheme
     */
    securityScheme(name: string, scheme: OpenAPISecurityScheme): this;
    /**
     * Add Bearer JWT authentication
     */
    bearerAuth(name?: string): this;
    /**
     * Add API key authentication
     */
    apiKeyAuth(name?: string, headerName?: string): this;
    /**
     * Add a path operation
     */
    path(path: string, method: 'get' | 'post' | 'put' | 'patch' | 'delete', operation: OpenAPIOperation): this;
    /**
     * Build the specification
     */
    build(): OpenAPISpec;
    /**
     * Export as JSON
     */
    toJSON(): string;
    /**
     * Export as YAML (basic conversion)
     */
    toYAML(): string;
    private jsonToYaml;
    /**
     * Generate Rust code for poem-openapi
     */
    toRustCode(): string;
    private pascalCase;
}
/**
 * OpenAPI operation builder
 */
export declare class OperationBuilder {
    private op;
    private params;
    private responses;
    /**
     * Set operation ID
     */
    operationId(id: string): this;
    /**
     * Set summary
     */
    summary(summary: string): this;
    /**
     * Set description
     */
    description(description: string): this;
    /**
     * Add tags
     */
    tags(...tags: string[]): this;
    /**
     * Mark as deprecated
     */
    deprecated(): this;
    /**
     * Add a parameter
     */
    parameter(param: OpenAPIParameter): this;
    /**
     * Add a query parameter
     */
    query(name: string, schema: OpenAPISchema, options?: Partial<OpenAPIParameter>): this;
    /**
     * Add a path parameter
     */
    pathParam(name: string, schema: OpenAPISchema, options?: Partial<OpenAPIParameter>): this;
    /**
     * Add a header parameter
     */
    header(name: string, schema: OpenAPISchema, options?: Partial<OpenAPIParameter>): this;
    /**
     * Set request body
     */
    requestBody(schema: OpenAPISchema, options?: {
        required?: boolean;
        description?: string;
    }): this;
    /**
     * Add a response
     */
    response(status: number | string, response: OpenAPIResponse): this;
    /**
     * Add a success response
     */
    success(schema: OpenAPISchema, description?: string): this;
    /**
     * Add security requirement
     */
    security(...requirements: OpenAPISecurity[]): this;
    /**
     * Require bearer auth
     */
    requireAuth(schemeName?: string): this;
    /**
     * Build the operation
     */
    build(): OpenAPIOperation & {
        parameters?: OpenAPIParameter[];
        responses?: Record<string, OpenAPIResponse>;
    };
}
/**
 * Create a string schema
 */
export declare function stringSchema(options?: {
    format?: OpenAPIStringFormat;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enum?: string[];
    default?: string;
    example?: string;
}): OpenAPISchema;
/**
 * Create a number schema
 */
export declare function numberSchema(options?: {
    format?: OpenAPINumberFormat;
    minimum?: number;
    maximum?: number;
    default?: number;
    example?: number;
}): OpenAPISchema;
/**
 * Create an integer schema
 */
export declare function integerSchema(options?: {
    format?: 'int32' | 'int64';
    minimum?: number;
    maximum?: number;
    default?: number;
    example?: number;
}): OpenAPISchema;
/**
 * Create a boolean schema
 */
export declare function booleanSchema(options?: {
    default?: boolean;
    example?: boolean;
}): OpenAPISchema;
/**
 * Create an array schema
 */
export declare function arraySchema(items: OpenAPISchema, options?: {
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;
}): OpenAPISchema;
/**
 * Create an object schema
 */
export declare function objectSchema(properties: Record<string, OpenAPISchema>, options?: {
    required?: string[];
    additionalProperties?: boolean | OpenAPISchema;
    description?: string;
}): OpenAPISchema;
/**
 * Create a reference schema
 */
export declare function refSchema(name: string): OpenAPISchema;
/**
 * Create an OpenAPI builder
 */
export declare function openapi(config?: PoemOpenAPIConfig): OpenAPIBuilder;
/**
 * Create an operation builder
 */
export declare function operation(): OperationBuilder;
/**
 * TypeScript to Rust type mapping
 */
export interface RustTypeMapping {
    rustType: string;
    imports: string[];
    validationMacro?: string;
}
/**
 * Map TypeScript/OpenAPI types to Rust types
 */
export declare function mapToRustType(schema: OpenAPISchema, isOptional?: boolean): RustTypeMapping;
/**
 * Options for generating Rust handlers
 */
export interface RustHandlerOptions {
    /** Operation name */
    name: string;
    /** HTTP method */
    method: string;
    /** Route path */
    path: string;
    /** Operation description */
    description?: string;
    /** Input schema (request body) */
    inputSchema?: OpenAPISchema;
    /** Output schema (response body) */
    outputSchema?: OpenAPISchema;
    /** Path parameters */
    pathParams?: Array<{
        name: string;
        schema: OpenAPISchema;
    }>;
    /** Query parameters */
    queryParams?: Array<{
        name: string;
        schema: OpenAPISchema;
        required?: boolean;
    }>;
    /** Security requirements */
    security?: OpenAPISecurity[];
    /** Tags for the endpoint */
    tags?: string[];
    /** Whether this is a list/collection endpoint */
    isList?: boolean;
    /** Entity name (for CRUD operations) */
    entityName?: string;
}
/**
 * Generated Rust code result
 */
export interface GeneratedRustCode {
    /** Request struct code */
    requestStruct?: string;
    /** Response enum code */
    responseEnum: string;
    /** Handler method code */
    handler: string;
    /** Required imports */
    imports: Set<string>;
    /** Error types needed */
    errorTypes: Set<string>;
}
/**
 * Generate a complete Rust request struct with poem-openapi derives
 */
export declare function generateRustRequestStruct(name: string, schema: OpenAPISchema, description?: string): {
    code: string;
    imports: Set<string>;
};
/**
 * Generate a Rust response enum with all status codes
 */
export declare function generateRustResponseEnum(name: string, outputSchema?: OpenAPISchema, additionalResponses?: Record<string, {
    description: string;
    schema?: OpenAPISchema;
}>): {
    code: string;
    imports: Set<string>;
};
/**
 * Generate a complete Rust handler implementation
 */
export declare function generateRustHandler(options: RustHandlerOptions): GeneratedRustCode;
/**
 * Generate Rust poem-openapi handler code (legacy signature)
 */
export declare function generateRustHandler(name: string, method: string, path: string, inputType?: string, outputType?: string): string;
/**
 * Generate error types for poem-openapi
 */
export declare function generateRustErrorTypes(): string;
/**
 * Generate database service trait and implementation
 */
export declare function generateRustDbService(): string;
/**
 * Generate validation helpers
 */
export declare function generateRustValidationHelpers(): string;
/**
 * Generate complete Rust API implementation
 */
export declare function generateRustAPI(apiName: string, operations: Array<{
    name: string;
    method: string;
    path: string;
    inputType?: string;
    outputType?: string;
}> | RustHandlerOptions[]): string;
/**
 * Generate a complete Rust API with full implementations
 */
export declare function generateFullRustAPI(apiName: string, operations: RustHandlerOptions[]): string;
/**
 * Generate CRUD API for an entity
 */
export declare function generateCrudAPI(entityName: string, schema: OpenAPISchema, options?: {
    basePath?: string;
    tags?: string[];
    security?: OpenAPISecurity[];
    includeList?: boolean;
    includePagination?: boolean;
}): string;
/**
 * Export all code generators for external Rust project integration
 */
export declare const rustCodeGenerators: {
    /** Generate error types */
    errorTypes: typeof generateRustErrorTypes;
    /** Generate database service */
    dbService: typeof generateRustDbService;
    /** Generate validation helpers */
    validationHelpers: typeof generateRustValidationHelpers;
    /** Generate a single handler */
    handler: typeof generateRustHandler;
    /** Generate a request struct */
    requestStruct: typeof generateRustRequestStruct;
    /** Generate a response enum */
    responseEnum: typeof generateRustResponseEnum;
    /** Generate a complete API */
    api: typeof generateRustAPI;
    /** Generate a full API with all supporting code */
    fullApi: typeof generateFullRustAPI;
    /** Generate CRUD API for an entity */
    crudApi: typeof generateCrudAPI;
    /** Map TypeScript/OpenAPI type to Rust type */
    mapType: typeof mapToRustType;
};
//# sourceMappingURL=openapi.d.ts.map