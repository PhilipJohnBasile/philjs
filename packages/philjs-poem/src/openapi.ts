/**
 * PhilJS Poem OpenAPI Integration
 *
 * OpenAPI/Swagger documentation support for Poem framework.
 * Poem has excellent OpenAPI support via poem-openapi crate.
 */

import type {
  OpenAPIOperation,
  OpenAPISchema,
  OpenAPIResponse,
  OpenAPISecurity,
  PoemOpenAPIConfig,
} from './types';

// ============================================================================
// OpenAPI Schema Types
// ============================================================================

/**
 * OpenAPI data types
 */
export type OpenAPIDataType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object';

/**
 * OpenAPI string formats
 */
export type OpenAPIStringFormat =
  | 'date'
  | 'date-time'
  | 'password'
  | 'byte'
  | 'binary'
  | 'email'
  | 'uuid'
  | 'uri'
  | 'hostname'
  | 'ipv4'
  | 'ipv6';

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
  content: Record<string, { schema: OpenAPISchema; example?: unknown }>;
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

// ============================================================================
// OpenAPI Spec Builder
// ============================================================================

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
  tags?: Array<{ name: string; description?: string }>;
}

/**
 * OpenAPI specification builder
 */
export class OpenAPIBuilder {
  private spec: OpenAPISpec;

  constructor(config: PoemOpenAPIConfig = {}) {
    this.spec = {
      openapi: '3.1.0',
      info: {
        title: config.title || 'PhilJS API',
        description: config.description,
        version: config.version || '1.0.0',
        termsOfService: config.termsOfService,
        contact: config.contact,
        license: config.license,
      },
      servers: config.servers,
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {},
      },
      tags: [],
    };
  }

  /**
   * Add a server
   */
  server(url: string, description?: string): this {
    if (!this.spec.servers) this.spec.servers = [];
    this.spec.servers.push({ url, description });
    return this;
  }

  /**
   * Add a tag
   */
  tag(name: string, description?: string): this {
    if (!this.spec.tags) this.spec.tags = [];
    this.spec.tags.push({ name, description });
    return this;
  }

  /**
   * Add a schema component
   */
  schema(name: string, schema: OpenAPISchema): this {
    if (!this.spec.components) this.spec.components = {};
    if (!this.spec.components.schemas) this.spec.components.schemas = {};
    this.spec.components.schemas[name] = schema;
    return this;
  }

  /**
   * Add a security scheme
   */
  securityScheme(name: string, scheme: OpenAPISecurityScheme): this {
    if (!this.spec.components) this.spec.components = {};
    if (!this.spec.components.securitySchemes) this.spec.components.securitySchemes = {};
    this.spec.components.securitySchemes[name] = scheme;
    return this;
  }

  /**
   * Add Bearer JWT authentication
   */
  bearerAuth(name: string = 'bearerAuth'): this {
    return this.securityScheme(name, {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT Bearer token authentication',
    });
  }

  /**
   * Add API key authentication
   */
  apiKeyAuth(name: string = 'apiKeyAuth', headerName: string = 'X-API-Key'): this {
    return this.securityScheme(name, {
      type: 'apiKey',
      in: 'header',
      name: headerName,
      description: 'API key authentication',
    });
  }

  /**
   * Add a path operation
   */
  path(
    path: string,
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    operation: OpenAPIOperation
  ): this {
    if (!this.spec.paths[path]) this.spec.paths[path] = {};
    this.spec.paths[path][method] = operation;
    return this;
  }

  /**
   * Build the specification
   */
  build(): OpenAPISpec {
    return this.spec;
  }

  /**
   * Export as JSON
   */
  toJSON(): string {
    return JSON.stringify(this.spec, null, 2);
  }

  /**
   * Export as YAML (basic conversion)
   */
  toYAML(): string {
    return this.jsonToYaml(this.spec);
  }

  private jsonToYaml(obj: unknown, indent: number = 0): string {
    const spaces = '  '.repeat(indent);

    if (obj === null || obj === undefined) {
      return 'null';
    }

    if (typeof obj === 'string') {
      if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) {
        return `"${obj.replace(/"/g, '\\"')}"`;
      }
      return obj;
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj);
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return obj.map(item => `${spaces}- ${this.jsonToYaml(item, indent + 1).trim()}`).join('\n');
    }

    if (typeof obj === 'object') {
      const entries = Object.entries(obj);
      if (entries.length === 0) return '{}';
      return entries
        .map(([key, value]) => {
          const yamlValue = this.jsonToYaml(value, indent + 1);
          if (typeof value === 'object' && value !== null) {
            return `${spaces}${key}:\n${yamlValue}`;
          }
          return `${spaces}${key}: ${yamlValue}`;
        })
        .join('\n');
    }

    return String(obj);
  }

  /**
   * Generate Rust code for poem-openapi
   */
  toRustCode(): string {
    return `
use poem_openapi::{OpenApi, OpenApiService, payload::Json, Object, Tags, ApiResponse};

/// API Tags
#[derive(Tags)]
enum ApiTag {
    ${(this.spec.tags || []).map(t => `/// ${t.description || t.name}\n    ${this.pascalCase(t.name)}`).join(',\n    ')}
}

/// OpenAPI service configuration
pub fn create_openapi_service<T: OpenApi>(api: T) -> OpenApiService<T, ()> {
    OpenApiService::new(api, "${this.spec.info.title}", "${this.spec.info.version}")
        .description("${this.spec.info.description || ''}")
        ${this.spec.servers?.map(s => `.server("${s.url}")`).join('\n        ') || ''}
}

/// Swagger UI endpoint
pub fn swagger_ui(path: &str, spec_path: &str) -> impl poem::Endpoint {
    poem_openapi::ui::SwaggerUi::new(spec_path).to_endpoint(path)
}

/// Redoc endpoint
pub fn redoc(path: &str, spec_path: &str) -> impl poem::Endpoint {
    poem_openapi::ui::Redoc::new(spec_path).to_endpoint(path)
}

/// RapiDoc endpoint
pub fn rapidoc(path: &str, spec_path: &str) -> impl poem::Endpoint {
    poem_openapi::ui::RapiDoc::new(spec_path).to_endpoint(path)
}
`.trim();
  }

  private pascalCase(str: string): string {
    return str
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}

// ============================================================================
// Operation Builder
// ============================================================================

/**
 * OpenAPI operation builder
 */
export class OperationBuilder {
  private op: OpenAPIOperation = {};
  private params: OpenAPIParameter[] = [];
  private responses: Record<string, OpenAPIResponse> = {};

  /**
   * Set operation ID
   */
  operationId(id: string): this {
    this.op.operationId = id;
    return this;
  }

  /**
   * Set summary
   */
  summary(summary: string): this {
    this.op.summary = summary;
    return this;
  }

  /**
   * Set description
   */
  description(description: string): this {
    this.op.description = description;
    return this;
  }

  /**
   * Add tags
   */
  tags(...tags: string[]): this {
    this.op.tags = tags;
    return this;
  }

  /**
   * Mark as deprecated
   */
  deprecated(): this {
    this.op.deprecated = true;
    return this;
  }

  /**
   * Add a parameter
   */
  parameter(param: OpenAPIParameter): this {
    this.params.push(param);
    return this;
  }

  /**
   * Add a query parameter
   */
  query(name: string, schema: OpenAPISchema, options?: Partial<OpenAPIParameter>): this {
    return this.parameter({
      name,
      in: 'query',
      schema,
      ...options,
    });
  }

  /**
   * Add a path parameter
   */
  pathParam(name: string, schema: OpenAPISchema, options?: Partial<OpenAPIParameter>): this {
    return this.parameter({
      name,
      in: 'path',
      required: true,
      schema,
      ...options,
    });
  }

  /**
   * Add a header parameter
   */
  header(name: string, schema: OpenAPISchema, options?: Partial<OpenAPIParameter>): this {
    return this.parameter({
      name,
      in: 'header',
      schema,
      ...options,
    });
  }

  /**
   * Set request body
   */
  requestBody(schema: OpenAPISchema, options?: { required?: boolean; description?: string }): this {
    this.op.requestBody = {
      ...schema,
      required: options?.required ?? true,
    };
    return this;
  }

  /**
   * Add a response
   */
  response(status: number | string, response: OpenAPIResponse): this {
    this.responses[String(status)] = response;
    return this;
  }

  /**
   * Add a success response
   */
  success(schema: OpenAPISchema, description: string = 'Success'): this {
    return this.response(200, {
      description,
      content: {
        'application/json': { schema },
      },
    });
  }

  /**
   * Add security requirement
   */
  security(...requirements: OpenAPISecurity[]): this {
    this.op.security = requirements;
    return this;
  }

  /**
   * Require bearer auth
   */
  requireAuth(schemeName: string = 'bearerAuth'): this {
    return this.security({ [schemeName]: [] });
  }

  /**
   * Build the operation
   */
  build(): OpenAPIOperation & { parameters?: OpenAPIParameter[]; responses?: Record<string, OpenAPIResponse> } {
    return {
      ...this.op,
      ...(this.params.length > 0 && { parameters: this.params }),
      ...(Object.keys(this.responses).length > 0 && { responses: this.responses }),
    };
  }
}

// ============================================================================
// Schema Builders
// ============================================================================

/**
 * Create a string schema
 */
export function stringSchema(options?: {
  format?: OpenAPIStringFormat;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: string[];
  default?: string;
  example?: string;
}): OpenAPISchema {
  return {
    type: 'string',
    ...options,
  };
}

/**
 * Create a number schema
 */
export function numberSchema(options?: {
  format?: OpenAPINumberFormat;
  minimum?: number;
  maximum?: number;
  default?: number;
  example?: number;
}): OpenAPISchema {
  return {
    type: 'number',
    ...options,
  };
}

/**
 * Create an integer schema
 */
export function integerSchema(options?: {
  format?: 'int32' | 'int64';
  minimum?: number;
  maximum?: number;
  default?: number;
  example?: number;
}): OpenAPISchema {
  return {
    type: 'integer',
    format: options?.format || 'int32',
    ...options,
  };
}

/**
 * Create a boolean schema
 */
export function booleanSchema(options?: {
  default?: boolean;
  example?: boolean;
}): OpenAPISchema {
  return {
    type: 'boolean',
    ...options,
  };
}

/**
 * Create an array schema
 */
export function arraySchema(items: OpenAPISchema, options?: {
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
}): OpenAPISchema {
  return {
    type: 'array',
    items,
    ...options,
  };
}

/**
 * Create an object schema
 */
export function objectSchema(
  properties: Record<string, OpenAPISchema>,
  options?: {
    required?: string[];
    additionalProperties?: boolean | OpenAPISchema;
    description?: string;
  }
): OpenAPISchema {
  return {
    type: 'object',
    properties,
    ...options,
  };
}

/**
 * Create a reference schema
 */
export function refSchema(name: string): OpenAPISchema {
  return {
    $ref: `#/components/schemas/${name}`,
  } as unknown as OpenAPISchema;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create an OpenAPI builder
 */
export function openapi(config?: PoemOpenAPIConfig): OpenAPIBuilder {
  return new OpenAPIBuilder(config);
}

/**
 * Create an operation builder
 */
export function operation(): OperationBuilder {
  return new OperationBuilder();
}

/**
 * Generate Rust poem-openapi handler code
 */
export function generateRustHandler(
  name: string,
  method: string,
  path: string,
  inputType?: string,
  outputType?: string
): string {
  const inputParam = inputType ? `body: Json<${inputType}>` : '';
  const outputReturnType = outputType ? `Json<${outputType}>` : 'Json<serde_json::Value>';

  return `
/// ${name} handler
#[oai(path = "${path}", method = "${method}")]
async fn ${name.toLowerCase().replace(/\s+/g, '_')}(&self${inputParam ? ', ' + inputParam : ''}) -> Result<${outputReturnType}, poem::Error> {
    // TODO: Implement handler
    Ok(Json(serde_json::json!({"status": "ok"})))
}
`.trim();
}

/**
 * Generate complete Rust API implementation
 */
export function generateRustAPI(
  apiName: string,
  operations: Array<{
    name: string;
    method: string;
    path: string;
    inputType?: string;
    outputType?: string;
  }>
): string {
  const handlers = operations
    .map(op => generateRustHandler(op.name, op.method, op.path, op.inputType, op.outputType))
    .join('\n\n    ');

  return `
use poem_openapi::{OpenApi, payload::Json, Object};
use poem::Result;

/// ${apiName}
struct ${apiName};

#[OpenApi]
impl ${apiName} {
    ${handlers}
}
`.trim();
}
