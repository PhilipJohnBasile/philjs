/**
 * PhilJS Poem OpenAPI Integration
 *
 * OpenAPI/Swagger documentation support for Poem framework.
 * Poem has excellent OpenAPI support via poem-openapi crate.
 */
/**
 * OpenAPI specification builder
 */
export class OpenAPIBuilder {
    spec;
    constructor(config = {}) {
        const info = {
            title: config.title || 'PhilJS API',
            version: config.version || '1.0.0',
        };
        if (config.description !== undefined)
            info.description = config.description;
        if (config.termsOfService !== undefined)
            info.termsOfService = config.termsOfService;
        if (config.contact !== undefined)
            info.contact = config.contact;
        if (config.license !== undefined)
            info.license = config.license;
        const spec = {
            openapi: '3.1.0',
            info,
            paths: {},
            components: {
                schemas: {},
                securitySchemes: {},
            },
            tags: [],
        };
        if (config.servers !== undefined)
            spec.servers = config.servers;
        this.spec = spec;
    }
    /**
     * Add a server
     */
    server(url, description) {
        if (!this.spec.servers)
            this.spec.servers = [];
        const server = { url };
        if (description !== undefined)
            server.description = description;
        this.spec.servers.push(server);
        return this;
    }
    /**
     * Add a tag
     */
    tag(name, description) {
        if (!this.spec.tags)
            this.spec.tags = [];
        const tag = { name };
        if (description !== undefined)
            tag.description = description;
        this.spec.tags.push(tag);
        return this;
    }
    /**
     * Add a schema component
     */
    schema(name, schema) {
        if (!this.spec.components)
            this.spec.components = {};
        if (!this.spec.components.schemas)
            this.spec.components.schemas = {};
        this.spec.components.schemas[name] = schema;
        return this;
    }
    /**
     * Add a security scheme
     */
    securityScheme(name, scheme) {
        if (!this.spec.components)
            this.spec.components = {};
        if (!this.spec.components.securitySchemes)
            this.spec.components.securitySchemes = {};
        this.spec.components.securitySchemes[name] = scheme;
        return this;
    }
    /**
     * Add Bearer JWT authentication
     */
    bearerAuth(name = 'bearerAuth') {
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
    apiKeyAuth(name = 'apiKeyAuth', headerName = 'X-API-Key') {
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
    path(path, method, operation) {
        if (!this.spec.paths[path])
            this.spec.paths[path] = {};
        this.spec.paths[path][method] = operation;
        return this;
    }
    /**
     * Build the specification
     */
    build() {
        return this.spec;
    }
    /**
     * Export as JSON
     */
    toJSON() {
        return JSON.stringify(this.spec, null, 2);
    }
    /**
     * Export as YAML (basic conversion)
     */
    toYAML() {
        return this.jsonToYaml(this.spec);
    }
    jsonToYaml(obj, indent = 0) {
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
            if (obj.length === 0)
                return '[]';
            return obj.map(item => `${spaces}- ${this.jsonToYaml(item, indent + 1).trim()}`).join('\n');
        }
        if (typeof obj === 'object') {
            const entries = Object.entries(obj);
            if (entries.length === 0)
                return '{}';
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
    toRustCode() {
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
    pascalCase(str) {
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
    op = {};
    params = [];
    responses = {};
    /**
     * Set operation ID
     */
    operationId(id) {
        this.op.operationId = id;
        return this;
    }
    /**
     * Set summary
     */
    summary(summary) {
        this.op.summary = summary;
        return this;
    }
    /**
     * Set description
     */
    description(description) {
        this.op.description = description;
        return this;
    }
    /**
     * Add tags
     */
    tags(...tags) {
        this.op.tags = tags;
        return this;
    }
    /**
     * Mark as deprecated
     */
    deprecated() {
        this.op.deprecated = true;
        return this;
    }
    /**
     * Add a parameter
     */
    parameter(param) {
        this.params.push(param);
        return this;
    }
    /**
     * Add a query parameter
     */
    query(name, schema, options) {
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
    pathParam(name, schema, options) {
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
    header(name, schema, options) {
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
    requestBody(schema, options) {
        this.op.requestBody = {
            ...schema,
            required: options?.required ?? true,
        };
        return this;
    }
    /**
     * Add a response
     */
    response(status, response) {
        this.responses[String(status)] = response;
        return this;
    }
    /**
     * Add a success response
     */
    success(schema, description = 'Success') {
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
    security(...requirements) {
        this.op.security = requirements;
        return this;
    }
    /**
     * Require bearer auth
     */
    requireAuth(schemeName = 'bearerAuth') {
        return this.security({ [schemeName]: [] });
    }
    /**
     * Build the operation
     */
    build() {
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
export function stringSchema(options) {
    return {
        type: 'string',
        ...options,
    };
}
/**
 * Create a number schema
 */
export function numberSchema(options) {
    return {
        type: 'number',
        ...options,
    };
}
/**
 * Create an integer schema
 */
export function integerSchema(options) {
    return {
        type: 'integer',
        format: options?.format || 'int32',
        ...options,
    };
}
/**
 * Create a boolean schema
 */
export function booleanSchema(options) {
    return {
        type: 'boolean',
        ...options,
    };
}
/**
 * Create an array schema
 */
export function arraySchema(items, options) {
    return {
        type: 'array',
        items,
        ...options,
    };
}
/**
 * Create an object schema
 */
export function objectSchema(properties, options) {
    return {
        type: 'object',
        properties,
        ...options,
    };
}
/**
 * Create a reference schema
 */
export function refSchema(name) {
    return {
        $ref: `#/components/schemas/${name}`,
    };
}
// ============================================================================
// Convenience Functions
// ============================================================================
/**
 * Create an OpenAPI builder
 */
export function openapi(config) {
    return new OpenAPIBuilder(config);
}
/**
 * Create an operation builder
 */
export function operation() {
    return new OperationBuilder();
}
/**
 * Map TypeScript/OpenAPI types to Rust types
 */
export function mapToRustType(schema, isOptional = false) {
    let result = { rustType: 'String', imports: [] };
    if (schema.type === 'string') {
        if (schema.format === 'date-time') {
            result = {
                rustType: 'DateTime<Utc>',
                imports: ['chrono::{DateTime, Utc}'],
            };
        }
        else if (schema.format === 'date') {
            result = {
                rustType: 'NaiveDate',
                imports: ['chrono::NaiveDate'],
            };
        }
        else if (schema.format === 'uuid') {
            result = {
                rustType: 'Uuid',
                imports: ['uuid::Uuid'],
            };
        }
        else if (schema.format === 'email') {
            result = {
                rustType: 'String',
                imports: [],
                validationMacro: '#[oai(validator(email))]',
            };
        }
        else if (schema.format === 'uri') {
            result = {
                rustType: 'String',
                imports: [],
                validationMacro: '#[oai(validator(pattern = r"^https?://"))]',
            };
        }
        else {
            result = { rustType: 'String', imports: [] };
            if (schema.minLength !== undefined || schema.maxLength !== undefined) {
                const validators = [];
                if (schema.minLength !== undefined)
                    validators.push(`min_length = ${schema.minLength}`);
                if (schema.maxLength !== undefined)
                    validators.push(`max_length = ${schema.maxLength}`);
                result.validationMacro = `#[oai(validator(${validators.join(', ')}))]`;
            }
            if (schema.pattern) {
                result.validationMacro = `#[oai(validator(pattern = r"${schema.pattern}"))]`;
            }
        }
    }
    else if (schema.type === 'number') {
        if (schema.format === 'float') {
            result = { rustType: 'f32', imports: [] };
        }
        else {
            result = { rustType: 'f64', imports: [] };
        }
        if (schema.minimum !== undefined || schema.maximum !== undefined) {
            const validators = [];
            if (schema.minimum !== undefined)
                validators.push(`minimum(value = ${schema.minimum})`);
            if (schema.maximum !== undefined)
                validators.push(`maximum(value = ${schema.maximum})`);
            result.validationMacro = `#[oai(validator(${validators.join(', ')}))]`;
        }
    }
    else if (schema.type === 'integer') {
        if (schema.format === 'int64') {
            result = { rustType: 'i64', imports: [] };
        }
        else {
            result = { rustType: 'i32', imports: [] };
        }
        if (schema.minimum !== undefined || schema.maximum !== undefined) {
            const validators = [];
            if (schema.minimum !== undefined)
                validators.push(`minimum(value = ${schema.minimum})`);
            if (schema.maximum !== undefined)
                validators.push(`maximum(value = ${schema.maximum})`);
            result.validationMacro = `#[oai(validator(${validators.join(', ')}))]`;
        }
    }
    else if (schema.type === 'boolean') {
        result = { rustType: 'bool', imports: [] };
    }
    else if (schema.type === 'array' && schema.items) {
        const itemType = mapToRustType(schema.items, false);
        result = {
            rustType: `Vec<${itemType.rustType}>`,
            imports: itemType.imports,
        };
        if (schema.minItems !== undefined || schema.maxItems !== undefined) {
            const validators = [];
            if (schema.minItems !== undefined)
                validators.push(`min_items = ${schema.minItems}`);
            if (schema.maxItems !== undefined)
                validators.push(`max_items = ${schema.maxItems}`);
            result.validationMacro = `#[oai(validator(${validators.join(', ')}))]`;
        }
    }
    else if (schema.type === 'object') {
        // For nested objects, we'd need to generate a separate struct
        result = { rustType: 'serde_json::Value', imports: ['serde_json'] };
    }
    if (isOptional) {
        result.rustType = `Option<${result.rustType}>`;
    }
    return result;
}
/**
 * Convert string to Rust-style snake_case
 */
function toSnakeCase(str) {
    return str
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '')
        .replace(/[\s-]+/g, '_')
        .replace(/_+/g, '_');
}
/**
 * Convert string to PascalCase
 */
function toPascalCase(str) {
    return str
        .split(/[\s_-]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}
// ============================================================================
// Rust Handler Generation
// ============================================================================
/**
 * Generate a complete Rust request struct with poem-openapi derives
 */
export function generateRustRequestStruct(name, schema, description) {
    const structName = `${toPascalCase(name)}Request`;
    const imports = new Set();
    imports.add('poem_openapi::Object');
    imports.add('serde::{Deserialize, Serialize}');
    const fields = [];
    const properties = schema.properties || {};
    const requiredFields = Array.isArray(schema.required) ? schema.required : [];
    for (const [fieldName, fieldSchema] of Object.entries(properties)) {
        const isRequired = requiredFields.includes(fieldName);
        const typeMapping = mapToRustType(fieldSchema, !isRequired);
        typeMapping.imports.forEach(imp => imports.add(imp));
        const rustFieldName = toSnakeCase(fieldName);
        const fieldDesc = fieldSchema.description ? `    /// ${fieldSchema.description}\n` : '';
        const validationAttr = typeMapping.validationMacro ? `    ${typeMapping.validationMacro}\n` : '';
        const renameAttr = rustFieldName !== fieldName ? `    #[serde(rename = "${fieldName}")]\n    #[oai(rename = "${fieldName}")]\n` : '';
        const skipIfNone = !isRequired ? '    #[serde(skip_serializing_if = "Option::is_none")]\n' : '';
        fields.push(`${fieldDesc}${validationAttr}${renameAttr}${skipIfNone}    pub ${rustFieldName}: ${typeMapping.rustType},`);
    }
    const docComment = description ? `/// ${description}\n` : '';
    const code = `${docComment}#[derive(Debug, Clone, Object, Serialize, Deserialize)]
pub struct ${structName} {
${fields.join('\n')}
}

impl ${structName} {
    /// Validate the request data
    pub fn validate(&self) -> Result<(), ValidationError> {
        // Add custom validation logic here
        Ok(())
    }
}`;
    return { code, imports };
}
/**
 * Generate a Rust response enum with all status codes
 */
export function generateRustResponseEnum(name, outputSchema, additionalResponses) {
    const enumName = `${toPascalCase(name)}Response`;
    const imports = new Set();
    imports.add('poem_openapi::ApiResponse');
    imports.add('poem_openapi::payload::Json');
    const outputType = outputSchema
        ? mapToRustType(outputSchema, false)
        : { rustType: 'serde_json::Value', imports: ['serde_json'] };
    outputType.imports.forEach(imp => imports.add(imp));
    const variants = [];
    // Success response (200)
    variants.push(`    /// Successful response
    #[oai(status = 200)]
    Success(Json<${outputType.rustType}>),`);
    // Created response (201) for POST
    variants.push(`    /// Resource created successfully
    #[oai(status = 201)]
    Created(Json<${outputType.rustType}>),`);
    // No content (204) for DELETE
    variants.push(`    /// No content
    #[oai(status = 204)]
    NoContent,`);
    // Bad request (400)
    variants.push(`    /// Bad request - validation failed
    #[oai(status = 400)]
    BadRequest(Json<ErrorResponse>),`);
    // Unauthorized (401)
    variants.push(`    /// Unauthorized - authentication required
    #[oai(status = 401)]
    Unauthorized(Json<ErrorResponse>),`);
    // Forbidden (403)
    variants.push(`    /// Forbidden - insufficient permissions
    #[oai(status = 403)]
    Forbidden(Json<ErrorResponse>),`);
    // Not found (404)
    variants.push(`    /// Resource not found
    #[oai(status = 404)]
    NotFound(Json<ErrorResponse>),`);
    // Conflict (409)
    variants.push(`    /// Conflict - resource already exists
    #[oai(status = 409)]
    Conflict(Json<ErrorResponse>),`);
    // Unprocessable entity (422)
    variants.push(`    /// Unprocessable entity - semantic validation failed
    #[oai(status = 422)]
    UnprocessableEntity(Json<ValidationErrorResponse>),`);
    // Internal server error (500)
    variants.push(`    /// Internal server error
    #[oai(status = 500)]
    InternalError(Json<ErrorResponse>),`);
    // Add any additional custom responses
    if (additionalResponses) {
        for (const [status, response] of Object.entries(additionalResponses)) {
            const variantName = `Status${status}`;
            const responseType = response.schema
                ? mapToRustType(response.schema, false).rustType
                : 'ErrorResponse';
            variants.push(`    /// ${response.description}
    #[oai(status = ${status})]
    ${variantName}(Json<${responseType}>),`);
        }
    }
    const code = `/// Response enum for ${name} endpoint
#[derive(ApiResponse)]
pub enum ${enumName} {
${variants.join('\n\n')}
}

impl ${enumName} {
    /// Create a success response
    pub fn success(data: ${outputType.rustType}) -> Self {
        Self::Success(Json(data))
    }

    /// Create a created response
    pub fn created(data: ${outputType.rustType}) -> Self {
        Self::Created(Json(data))
    }

    /// Create an error response
    pub fn error(status: u16, message: impl Into<String>) -> Self {
        let error = ErrorResponse::new(message);
        match status {
            400 => Self::BadRequest(Json(error)),
            401 => Self::Unauthorized(Json(error)),
            403 => Self::Forbidden(Json(error)),
            404 => Self::NotFound(Json(error)),
            409 => Self::Conflict(Json(error)),
            _ => Self::InternalError(Json(error)),
        }
    }
}`;
    return { code, imports };
}
/**
 * Implementation
 */
export function generateRustHandler(nameOrOptions, method, path, inputType, outputType) {
    // Handle legacy signature
    if (typeof nameOrOptions === 'string') {
        const options = {
            name: nameOrOptions,
            method: method,
            path: path,
        };
        if (inputType)
            options.inputSchema = { type: 'object', description: inputType };
        if (outputType)
            options.outputSchema = { type: 'object', description: outputType };
        const result = generateFullRustHandler(options);
        return `${result.requestStruct || ''}\n\n${result.responseEnum}\n\n${result.handler}`.trim();
    }
    return generateFullRustHandler(nameOrOptions);
}
/**
 * Internal function to generate full Rust handler
 */
function generateFullRustHandler(options) {
    const { name, method, path, description, inputSchema, outputSchema, pathParams = [], queryParams = [], security = [], tags = [], isList = false, entityName, } = options;
    const imports = new Set();
    const errorTypes = new Set();
    imports.add('poem_openapi::{OpenApi, payload::Json}');
    imports.add('poem::Result');
    imports.add('tracing::{info, warn, error, instrument}');
    errorTypes.add('ErrorResponse');
    errorTypes.add('ValidationError');
    errorTypes.add('ValidationErrorResponse');
    // Generate request struct if needed
    let requestStruct;
    const requestStructName = inputSchema ? `${toPascalCase(name)}Request` : undefined;
    if (inputSchema && inputSchema.type === 'object' && inputSchema.properties) {
        const reqResult = generateRustRequestStruct(name, inputSchema, description);
        requestStruct = reqResult.code;
        reqResult.imports.forEach(imp => imports.add(imp));
    }
    // Generate response enum
    const responseResult = generateRustResponseEnum(name, outputSchema);
    const responseEnum = responseResult.code;
    responseResult.imports.forEach(imp => imports.add(imp));
    const responseName = `${toPascalCase(name)}Response`;
    const handlerName = toSnakeCase(name);
    const entityNamePascal = entityName ? toPascalCase(entityName) : toPascalCase(name);
    const entityNameSnake = entityName ? toSnakeCase(entityName) : toSnakeCase(name);
    // Build handler parameters
    const params = ['&self'];
    // Add path parameters
    for (const param of pathParams) {
        const typeMapping = mapToRustType(param.schema, false);
        typeMapping.imports.forEach(imp => imports.add(imp));
        params.push(`#[oai(name = "${param.name}", in = "path")] ${toSnakeCase(param.name)}: Path<${typeMapping.rustType}>`);
        imports.add('poem_openapi::param::Path');
    }
    // Add query parameters
    for (const param of queryParams) {
        const typeMapping = mapToRustType(param.schema, !param.required);
        typeMapping.imports.forEach(imp => imports.add(imp));
        const queryType = param.required ? typeMapping.rustType : `Option<${typeMapping.rustType}>`;
        params.push(`#[oai(name = "${param.name}", in = "query")] ${toSnakeCase(param.name)}: Query<${queryType}>`);
        imports.add('poem_openapi::param::Query');
    }
    // Add request body if present
    if (requestStructName) {
        params.push(`body: Json<${requestStructName}>`);
    }
    // Build security attributes
    const securityAttrs = security.length > 0
        ? security.map(sec => {
            const [schemeName] = Object.keys(sec);
            return `security("${schemeName}")`;
        }).join(', ')
        : '';
    // Build tag attributes
    const tagAttrs = tags.length > 0
        ? tags.map(tag => `tag = "${tag}"`).join(', ')
        : '';
    // Build OAI attributes
    const oaiAttrs = [`path = "${path}"`, `method = "${method.toLowerCase()}"`];
    if (securityAttrs)
        oaiAttrs.push(securityAttrs);
    if (tagAttrs)
        oaiAttrs.push(tagAttrs);
    // Determine handler implementation based on method type
    let handlerBody;
    if (method.toUpperCase() === 'GET' && isList) {
        // List endpoint
        imports.add('sea_orm::{EntityTrait, QueryFilter, QueryOrder, PaginatorTrait}');
        handlerBody = generateListHandlerBody(entityNamePascal, entityNameSnake, queryParams, responseName);
    }
    else if (method.toUpperCase() === 'GET' && pathParams.length > 0) {
        // Get by ID endpoint
        imports.add('sea_orm::EntityTrait');
        const idParam = pathParams.find(p => p.name === 'id' || p.name.endsWith('_id'));
        handlerBody = generateGetByIdHandlerBody(entityNamePascal, entityNameSnake, idParam?.name || 'id', responseName);
    }
    else if (method.toUpperCase() === 'POST') {
        // Create endpoint
        imports.add('sea_orm::{ActiveModelTrait, Set}');
        handlerBody = generateCreateHandlerBody(entityNamePascal, entityNameSnake, requestStructName, responseName);
    }
    else if (method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH') {
        // Update endpoint
        imports.add('sea_orm::{ActiveModelTrait, EntityTrait, Set}');
        const idParam = pathParams.find(p => p.name === 'id' || p.name.endsWith('_id'));
        handlerBody = generateUpdateHandlerBody(entityNamePascal, entityNameSnake, idParam?.name || 'id', requestStructName, responseName, method.toUpperCase() === 'PATCH');
    }
    else if (method.toUpperCase() === 'DELETE') {
        // Delete endpoint
        imports.add('sea_orm::EntityTrait');
        const idParam = pathParams.find(p => p.name === 'id' || p.name.endsWith('_id'));
        handlerBody = generateDeleteHandlerBody(entityNamePascal, entityNameSnake, idParam?.name || 'id', responseName);
    }
    else {
        // Generic handler
        handlerBody = generateGenericHandlerBody(responseName);
    }
    const docComment = description ? `/// ${description}` : `/// ${name} handler`;
    const handler = `${docComment}
#[oai(${oaiAttrs.join(', ')})]
#[instrument(skip(self), err)]
async fn ${handlerName}(${params.join(', ')}) -> ${responseName} {
${handlerBody}
}`;
    const result = {
        responseEnum,
        handler,
        imports,
        errorTypes,
    };
    if (requestStruct !== undefined)
        result.requestStruct = requestStruct;
    return result;
}
/**
 * Generate handler body for list endpoints
 */
function generateListHandlerBody(entityName, _entitySnake, queryParams, responseName) {
    const hasPage = queryParams.some(p => p.name === 'page');
    const hasLimit = queryParams.some(p => p.name === 'limit' || p.name === 'per_page');
    const hasSortBy = queryParams.some(p => p.name === 'sort_by' || p.name === 'order_by');
    let paginationCode = '';
    if (hasPage && hasLimit) {
        paginationCode = `
    let page = page.0.unwrap_or(1).max(1) as u64;
    let limit = limit.0.unwrap_or(20).min(100) as u64;
    let offset = (page - 1) * limit;`;
    }
    let sortCode = '';
    if (hasSortBy) {
        sortCode = `
    let order = sort_by.0.as_deref().unwrap_or("created_at");`;
    }
    return `    info!("Fetching ${entityName} list");

    let db = self.db_service.get_connection();
    ${paginationCode}${sortCode}

    // Build query with filters
    let query = ${entityName}::Entity::find();

    // Apply filters from query parameters
    // query = query.filter(${entityName}::Column::Status.eq(status));

    ${hasSortBy ? `// Apply sorting
    let query = match order {
        "created_at" => query.order_by_desc(${entityName}::Column::CreatedAt),
        "updated_at" => query.order_by_desc(${entityName}::Column::UpdatedAt),
        "name" => query.order_by_asc(${entityName}::Column::Name),
        _ => query.order_by_desc(${entityName}::Column::Id),
    };` : ''}

    ${hasPage && hasLimit ? `// Apply pagination
    let paginator = query.paginate(db, limit);
    let total = paginator.num_items().await.map_err(|e| {
        error!("Failed to count items: {}", e);
        ${responseName}::InternalError(Json(ErrorResponse::new("Database error")))
    })?;

    let items = paginator.fetch_page(page - 1).await.map_err(|e| {
        error!("Failed to fetch page: {}", e);
        ${responseName}::InternalError(Json(ErrorResponse::new("Database error")))
    })?;

    let response = PaginatedResponse {
        items,
        total,
        page,
        per_page: limit,
        total_pages: (total + limit - 1) / limit,
    };

    ${responseName}::success(response)` : `// Fetch all items
    let items = query.all(db).await.map_err(|e| {
        error!("Failed to fetch items: {}", e);
        ${responseName}::InternalError(Json(ErrorResponse::new("Database error")))
    })?;

    ${responseName}::success(items)`}`;
}
/**
 * Generate handler body for get-by-id endpoints
 */
function generateGetByIdHandlerBody(entityName, entitySnake, idParam, responseName) {
    const idVar = toSnakeCase(idParam);
    return `    info!("Fetching ${entitySnake} with id: {}", ${idVar}.0);

    let db = self.db_service.get_connection();

    // Find entity by ID
    let ${entitySnake} = ${entityName}::Entity::find_by_id(${idVar}.0)
        .one(db)
        .await
        .map_err(|e| {
            error!("Database error while fetching ${entitySnake}: {}", e);
            ${responseName}::InternalError(Json(ErrorResponse::new("Database error")))
        })?;

    match ${entitySnake} {
        Some(entity) => {
            info!("Found ${entitySnake} with id: {}", ${idVar}.0);
            ${responseName}::success(entity.into())
        }
        None => {
            warn!("${entityName} not found with id: {}", ${idVar}.0);
            ${responseName}::NotFound(Json(ErrorResponse::new(format!(
                "${entityName} with id {} not found",
                ${idVar}.0
            ))))
        }
    }`;
}
/**
 * Generate handler body for create endpoints
 */
function generateCreateHandlerBody(entityName, entitySnake, requestStructName, responseName) {
    const inputVar = requestStructName ? 'body.0' : 'body';
    return `    info!("Creating new ${entitySnake}");

    // Validate request data
    ${requestStructName ? `if let Err(e) = ${inputVar}.validate() {
        warn!("Validation failed: {}", e);
        return ${responseName}::UnprocessableEntity(Json(ValidationErrorResponse::from(e)));
    }` : ''}

    let db = self.db_service.get_connection();

    // Create active model from request
    let ${entitySnake} = ${entityName}::ActiveModel {
        // Map request fields to entity fields
        // id: Set(Uuid::new_v4()),
        // name: Set(${inputVar}.name.clone()),
        // description: Set(${inputVar}.description.clone()),
        created_at: Set(Utc::now()),
        updated_at: Set(Utc::now()),
        ..Default::default()
    };

    // Insert into database
    let result = ${entitySnake}
        .insert(db)
        .await
        .map_err(|e| {
            error!("Failed to create ${entitySnake}: {}", e);

            // Check for unique constraint violation
            if e.to_string().contains("UNIQUE constraint failed")
                || e.to_string().contains("duplicate key") {
                return ${responseName}::Conflict(Json(ErrorResponse::new(
                    "${entityName} already exists"
                )));
            }

            ${responseName}::InternalError(Json(ErrorResponse::new("Database error")))
        })?;

    info!("Created ${entitySnake} with id: {:?}", result.id);
    ${responseName}::created(result.into())`;
}
/**
 * Generate handler body for update endpoints
 */
function generateUpdateHandlerBody(entityName, entitySnake, idParam, requestStructName, responseName, isPartial) {
    const idVar = toSnakeCase(idParam);
    const inputVar = requestStructName ? 'body.0' : 'body';
    const updateType = isPartial ? 'Partially updating' : 'Updating';
    return `    info!("${updateType} ${entitySnake} with id: {}", ${idVar}.0);

    // Validate request data
    ${requestStructName ? `if let Err(e) = ${inputVar}.validate() {
        warn!("Validation failed: {}", e);
        return ${responseName}::UnprocessableEntity(Json(ValidationErrorResponse::from(e)));
    }` : ''}

    let db = self.db_service.get_connection();

    // Find existing entity
    let existing = ${entityName}::Entity::find_by_id(${idVar}.0)
        .one(db)
        .await
        .map_err(|e| {
            error!("Database error while fetching ${entitySnake}: {}", e);
            ${responseName}::InternalError(Json(ErrorResponse::new("Database error")))
        })?;

    let existing = match existing {
        Some(e) => e,
        None => {
            warn!("${entityName} not found with id: {}", ${idVar}.0);
            return ${responseName}::NotFound(Json(ErrorResponse::new(format!(
                "${entityName} with id {} not found",
                ${idVar}.0
            ))));
        }
    };

    // Convert to active model and apply updates
    let mut ${entitySnake}: ${entityName}::ActiveModel = existing.into();

    ${isPartial ? `// Partial update - only set provided fields
    // if let Some(name) = &${inputVar}.name {
    //     ${entitySnake}.name = Set(name.clone());
    // }
    // if let Some(description) = &${inputVar}.description {
    //     ${entitySnake}.description = Set(description.clone());
    // }` : `// Full update - set all fields
    // ${entitySnake}.name = Set(${inputVar}.name.clone());
    // ${entitySnake}.description = Set(${inputVar}.description.clone());`}
    ${entitySnake}.updated_at = Set(Utc::now());

    // Save changes
    let result = ${entitySnake}
        .update(db)
        .await
        .map_err(|e| {
            error!("Failed to update ${entitySnake}: {}", e);
            ${responseName}::InternalError(Json(ErrorResponse::new("Database error")))
        })?;

    info!("Updated ${entitySnake} with id: {}", ${idVar}.0);
    ${responseName}::success(result.into())`;
}
/**
 * Generate handler body for delete endpoints
 */
function generateDeleteHandlerBody(entityName, entitySnake, idParam, responseName) {
    const idVar = toSnakeCase(idParam);
    return `    info!("Deleting ${entitySnake} with id: {}", ${idVar}.0);

    let db = self.db_service.get_connection();

    // Check if entity exists
    let existing = ${entityName}::Entity::find_by_id(${idVar}.0)
        .one(db)
        .await
        .map_err(|e| {
            error!("Database error while fetching ${entitySnake}: {}", e);
            ${responseName}::InternalError(Json(ErrorResponse::new("Database error")))
        })?;

    if existing.is_none() {
        warn!("${entityName} not found with id: {}", ${idVar}.0);
        return ${responseName}::NotFound(Json(ErrorResponse::new(format!(
            "${entityName} with id {} not found",
            ${idVar}.0
        ))));
    }

    // Delete entity
    let result = ${entityName}::Entity::delete_by_id(${idVar}.0)
        .exec(db)
        .await
        .map_err(|e| {
            error!("Failed to delete ${entitySnake}: {}", e);
            ${responseName}::InternalError(Json(ErrorResponse::new("Database error")))
        })?;

    if result.rows_affected == 0 {
        warn!("No rows affected when deleting ${entitySnake} with id: {}", ${idVar}.0);
        return ${responseName}::NotFound(Json(ErrorResponse::new(format!(
            "${entityName} with id {} not found",
            ${idVar}.0
        ))));
    }

    info!("Deleted ${entitySnake} with id: {}", ${idVar}.0);
    ${responseName}::NoContent`;
}
/**
 * Generate generic handler body
 */
function generateGenericHandlerBody(responseName) {
    return `    info!("Processing request");

    // Implement your business logic here
    let result = serde_json::json!({
        "status": "ok",
        "message": "Request processed successfully"
    });

    ${responseName}::success(result)`;
}
// ============================================================================
// Supporting Code Generation
// ============================================================================
/**
 * Generate error types for poem-openapi
 */
export function generateRustErrorTypes() {
    return `
use poem_openapi::Object;
use serde::{Deserialize, Serialize};
use std::fmt;
use thiserror::Error;

/// Standard error response
#[derive(Debug, Clone, Object, Serialize, Deserialize)]
pub struct ErrorResponse {
    /// Error message
    pub message: String,
    /// Error code for programmatic handling
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
    /// Additional error details
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl ErrorResponse {
    /// Create a new error response
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            code: None,
            details: None,
        }
    }

    /// Create an error response with a code
    pub fn with_code(message: impl Into<String>, code: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            code: Some(code.into()),
            details: None,
        }
    }

    /// Add details to the error response
    pub fn with_details(mut self, details: serde_json::Value) -> Self {
        self.details = Some(details);
        self
    }
}

impl fmt::Display for ErrorResponse {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

/// Validation error with field-level details
#[derive(Debug, Clone, Object, Serialize, Deserialize)]
pub struct ValidationErrorResponse {
    /// Error message
    pub message: String,
    /// Field-level validation errors
    pub errors: Vec<FieldError>,
}

impl ValidationErrorResponse {
    /// Create a new validation error response
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            errors: Vec::new(),
        }
    }

    /// Add a field error
    pub fn add_error(&mut self, field: impl Into<String>, message: impl Into<String>) {
        self.errors.push(FieldError {
            field: field.into(),
            message: message.into(),
            code: None,
        });
    }
}

impl From<ValidationError> for ValidationErrorResponse {
    fn from(err: ValidationError) -> Self {
        Self {
            message: err.to_string(),
            errors: err.field_errors,
        }
    }
}

/// Individual field validation error
#[derive(Debug, Clone, Object, Serialize, Deserialize)]
pub struct FieldError {
    /// Field name
    pub field: String,
    /// Error message
    pub message: String,
    /// Optional error code
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
}

/// Custom validation error type
#[derive(Debug, Clone, Error)]
pub struct ValidationError {
    message: String,
    field_errors: Vec<FieldError>,
}

impl ValidationError {
    /// Create a new validation error
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            field_errors: Vec::new(),
        }
    }

    /// Add a field error
    pub fn field(mut self, field: impl Into<String>, message: impl Into<String>) -> Self {
        self.field_errors.push(FieldError {
            field: field.into(),
            message: message.into(),
            code: None,
        });
        self
    }

    /// Check if there are any field errors
    pub fn has_errors(&self) -> bool {
        !self.field_errors.is_empty()
    }
}

impl fmt::Display for ValidationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

/// Application-level error type
#[derive(Debug, Error)]
pub enum AppError {
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(#[from] ValidationError),

    #[error("Database error: {0}")]
    Database(#[from] sea_orm::DbErr),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

impl poem::error::ResponseError for AppError {
    fn status(&self) -> poem::http::StatusCode {
        match self {
            AppError::NotFound(_) => poem::http::StatusCode::NOT_FOUND,
            AppError::Validation(_) => poem::http::StatusCode::UNPROCESSABLE_ENTITY,
            AppError::Database(_) => poem::http::StatusCode::INTERNAL_SERVER_ERROR,
            AppError::Unauthorized(_) => poem::http::StatusCode::UNAUTHORIZED,
            AppError::Forbidden(_) => poem::http::StatusCode::FORBIDDEN,
            AppError::Conflict(_) => poem::http::StatusCode::CONFLICT,
            AppError::Internal(_) => poem::http::StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}
`.trim();
}
/**
 * Generate database service trait and implementation
 */
export function generateRustDbService() {
    return `
use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};
use std::sync::Arc;

/// Database service trait for dependency injection
#[async_trait]
pub trait DbService: Send + Sync {
    /// Get a reference to the database connection
    fn get_connection(&self) -> &DatabaseConnection;

    /// Execute a transaction
    async fn transaction<F, T, E>(&self, f: F) -> Result<T, E>
    where
        F: FnOnce(&DatabaseConnection) -> futures::future::BoxFuture<'_, Result<T, E>> + Send,
        T: Send,
        E: From<DbErr> + Send;
}

/// Default database service implementation using sea-orm
pub struct SeaOrmDbService {
    db: Arc<DatabaseConnection>,
}

impl SeaOrmDbService {
    /// Create a new database service
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db: Arc::new(db) }
    }

    /// Create from an existing Arc<DatabaseConnection>
    pub fn from_arc(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl DbService for SeaOrmDbService {
    fn get_connection(&self) -> &DatabaseConnection {
        &self.db
    }

    async fn transaction<F, T, E>(&self, f: F) -> Result<T, E>
    where
        F: FnOnce(&DatabaseConnection) -> futures::future::BoxFuture<'_, Result<T, E>> + Send,
        T: Send,
        E: From<DbErr> + Send,
    {
        use sea_orm::TransactionTrait;

        self.db
            .transaction::<_, T, E>(|txn| {
                Box::pin(async move {
                    // Create a temporary connection wrapper for the transaction
                    let db_ref = unsafe {
                        // SAFETY: The transaction connection is valid for the duration of the closure
                        &*(txn as *const sea_orm::DatabaseTransaction as *const DatabaseConnection)
                    };
                    f(db_ref).await
                })
            })
            .await
    }
}

/// Paginated response wrapper
#[derive(Debug, Clone, poem_openapi::Object, serde::Serialize, serde::Deserialize)]
pub struct PaginatedResponse<T: poem_openapi::types::Type + Send + Sync> {
    /// The items in this page
    pub items: Vec<T>,
    /// Total number of items across all pages
    pub total: u64,
    /// Current page number (1-indexed)
    pub page: u64,
    /// Items per page
    pub per_page: u64,
    /// Total number of pages
    pub total_pages: u64,
}

impl<T: poem_openapi::types::Type + Send + Sync> PaginatedResponse<T> {
    /// Create a new paginated response
    pub fn new(items: Vec<T>, total: u64, page: u64, per_page: u64) -> Self {
        Self {
            items,
            total,
            page,
            per_page,
            total_pages: (total + per_page - 1) / per_page,
        }
    }

    /// Check if there is a next page
    pub fn has_next(&self) -> bool {
        self.page < self.total_pages
    }

    /// Check if there is a previous page
    pub fn has_prev(&self) -> bool {
        self.page > 1
    }
}
`.trim();
}
/**
 * Generate validation helpers
 */
export function generateRustValidationHelpers() {
    return `
use lazy_static::lazy_static;
use regex::Regex;

lazy_static! {
    static ref EMAIL_REGEX: Regex = Regex::new(
        r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    ).unwrap();

    static ref UUID_REGEX: Regex = Regex::new(
        r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    ).unwrap();

    static ref SLUG_REGEX: Regex = Regex::new(
        r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
    ).unwrap();

    static ref PHONE_REGEX: Regex = Regex::new(
        r"^\\+?[1-9]\\d{1,14}$"
    ).unwrap();
}

/// Validation helper functions
pub mod validate {
    use super::*;
    use crate::error::ValidationError;

    /// Validate email format
    pub fn email(value: &str) -> Result<(), ValidationError> {
        if EMAIL_REGEX.is_match(value) {
            Ok(())
        } else {
            Err(ValidationError::new("Invalid email format"))
        }
    }

    /// Validate UUID format
    pub fn uuid(value: &str) -> Result<(), ValidationError> {
        if UUID_REGEX.is_match(value) {
            Ok(())
        } else {
            Err(ValidationError::new("Invalid UUID format"))
        }
    }

    /// Validate slug format
    pub fn slug(value: &str) -> Result<(), ValidationError> {
        if SLUG_REGEX.is_match(value) {
            Ok(())
        } else {
            Err(ValidationError::new("Invalid slug format"))
        }
    }

    /// Validate phone number format (E.164)
    pub fn phone(value: &str) -> Result<(), ValidationError> {
        if PHONE_REGEX.is_match(value) {
            Ok(())
        } else {
            Err(ValidationError::new("Invalid phone number format"))
        }
    }

    /// Validate string length
    pub fn length(value: &str, min: Option<usize>, max: Option<usize>) -> Result<(), ValidationError> {
        let len = value.len();

        if let Some(min_len) = min {
            if len < min_len {
                return Err(ValidationError::new(format!(
                    "Value must be at least {} characters",
                    min_len
                )));
            }
        }

        if let Some(max_len) = max {
            if len > max_len {
                return Err(ValidationError::new(format!(
                    "Value must be at most {} characters",
                    max_len
                )));
            }
        }

        Ok(())
    }

    /// Validate numeric range
    pub fn range<T: PartialOrd + std::fmt::Display>(
        value: T,
        min: Option<T>,
        max: Option<T>,
    ) -> Result<(), ValidationError> {
        if let Some(min_val) = min {
            if value < min_val {
                return Err(ValidationError::new(format!(
                    "Value must be at least {}",
                    min_val
                )));
            }
        }

        if let Some(max_val) = max {
            if value > max_val {
                return Err(ValidationError::new(format!(
                    "Value must be at most {}",
                    max_val
                )));
            }
        }

        Ok(())
    }

    /// Validate that a value is not empty
    pub fn not_empty(value: &str) -> Result<(), ValidationError> {
        if value.trim().is_empty() {
            Err(ValidationError::new("Value cannot be empty"))
        } else {
            Ok(())
        }
    }

    /// Validate that a collection is not empty
    pub fn not_empty_vec<T>(value: &[T]) -> Result<(), ValidationError> {
        if value.is_empty() {
            Err(ValidationError::new("Collection cannot be empty"))
        } else {
            Ok(())
        }
    }

    /// Validate URL format
    pub fn url(value: &str) -> Result<(), ValidationError> {
        if value.starts_with("http://") || value.starts_with("https://") {
            Ok(())
        } else {
            Err(ValidationError::new("Invalid URL format"))
        }
    }
}

/// Builder for composing validations
pub struct Validator<T> {
    value: T,
    errors: Vec<crate::error::FieldError>,
}

impl<T> Validator<T> {
    /// Create a new validator
    pub fn new(value: T) -> Self {
        Self {
            value,
            errors: Vec::new(),
        }
    }

    /// Add a field error
    pub fn error(mut self, field: impl Into<String>, message: impl Into<String>) -> Self {
        self.errors.push(crate::error::FieldError {
            field: field.into(),
            message: message.into(),
            code: None,
        });
        self
    }

    /// Run a validation check
    pub fn check<F>(mut self, field: &str, f: F) -> Self
    where
        F: FnOnce(&T) -> Result<(), crate::error::ValidationError>,
    {
        if let Err(e) = f(&self.value) {
            self.errors.push(crate::error::FieldError {
                field: field.to_string(),
                message: e.to_string(),
                code: None,
            });
        }
        self
    }

    /// Finish validation and return result
    pub fn finish(self) -> Result<T, crate::error::ValidationError> {
        if self.errors.is_empty() {
            Ok(self.value)
        } else {
            let mut err = crate::error::ValidationError::new("Validation failed");
            for field_err in self.errors {
                err = err.field(field_err.field, field_err.message);
            }
            Err(err)
        }
    }
}
`.trim();
}
/**
 * Generate complete Rust API implementation
 */
export function generateRustAPI(apiName, operations) {
    // Check if using new or legacy format
    const isNewFormat = operations.length > 0 && operations[0] !== undefined && 'inputSchema' in operations[0];
    if (isNewFormat) {
        return generateFullRustAPI(apiName, operations);
    }
    // Legacy format - convert to new format
    const legacyOps = operations;
    const handlers = legacyOps
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
/**
 * Generate a complete Rust API with full implementations
 */
export function generateFullRustAPI(apiName, operations) {
    const allImports = new Set();
    const allErrorTypes = new Set();
    const requestStructs = [];
    const responseEnums = [];
    const handlers = [];
    // Process each operation
    for (const op of operations) {
        const result = generateRustHandler(op);
        result.imports.forEach(imp => allImports.add(imp));
        result.errorTypes.forEach(err => allErrorTypes.add(err));
        if (result.requestStruct) {
            requestStructs.push(result.requestStruct);
        }
        responseEnums.push(result.responseEnum);
        handlers.push(result.handler);
    }
    // Generate imports
    const imports = Array.from(allImports)
        .sort()
        .map(imp => `use ${imp};`)
        .join('\n');
    // Generate the complete API structure
    return `
//! Generated API handlers for ${apiName}
//!
//! This file was auto-generated by philjs-poem.
//! Do not edit this file directly.

${imports}

mod error;
mod db;
mod validation;

use error::{ErrorResponse, ValidationError, ValidationErrorResponse};
use db::{DbService, PaginatedResponse};

// ============================================================================
// Request Structs
// ============================================================================

${requestStructs.join('\n\n')}

// ============================================================================
// Response Enums
// ============================================================================

${responseEnums.join('\n\n')}

// ============================================================================
// API Implementation
// ============================================================================

/// ${apiName} API handler
pub struct ${apiName}<D: DbService> {
    db_service: std::sync::Arc<D>,
}

impl<D: DbService> ${apiName}<D> {
    /// Create a new API handler instance
    pub fn new(db_service: std::sync::Arc<D>) -> Self {
        Self { db_service }
    }
}

#[OpenApi]
impl<D: DbService + 'static> ${apiName}<D> {
    ${handlers.join('\n\n    ')}
}
`.trim();
}
/**
 * Generate CRUD API for an entity
 */
export function generateCrudAPI(entityName, schema, options) {
    const { basePath = `/${toSnakeCase(entityName)}s`, tags = [entityName], security = [], includeList = true, includePagination = true, } = options || {};
    const operations = [];
    // List endpoint
    if (includeList) {
        const queryParams = [];
        if (includePagination) {
            queryParams.push({ name: 'page', schema: { type: 'integer', format: 'int32' }, required: false }, { name: 'limit', schema: { type: 'integer', format: 'int32' }, required: false }, { name: 'sort_by', schema: { type: 'string' }, required: false });
        }
        operations.push({
            name: `list_${toSnakeCase(entityName)}s`,
            method: 'GET',
            path: basePath,
            description: `List all ${entityName}s`,
            outputSchema: { type: 'array', items: schema },
            queryParams,
            tags,
            security,
            isList: true,
            entityName,
        });
    }
    // Get by ID endpoint
    operations.push({
        name: `get_${toSnakeCase(entityName)}`,
        method: 'GET',
        path: `${basePath}/:id`,
        description: `Get a ${entityName} by ID`,
        outputSchema: schema,
        pathParams: [{ name: 'id', schema: { type: 'string', format: 'uuid' } }],
        tags,
        security,
        entityName,
    });
    // Create endpoint
    operations.push({
        name: `create_${toSnakeCase(entityName)}`,
        method: 'POST',
        path: basePath,
        description: `Create a new ${entityName}`,
        inputSchema: schema,
        outputSchema: schema,
        tags,
        security,
        entityName,
    });
    // Update endpoint (PUT)
    operations.push({
        name: `update_${toSnakeCase(entityName)}`,
        method: 'PUT',
        path: `${basePath}/:id`,
        description: `Update a ${entityName}`,
        inputSchema: schema,
        outputSchema: schema,
        pathParams: [{ name: 'id', schema: { type: 'string', format: 'uuid' } }],
        tags,
        security,
        entityName,
    });
    // Partial update endpoint (PATCH)
    operations.push({
        name: `patch_${toSnakeCase(entityName)}`,
        method: 'PATCH',
        path: `${basePath}/:id`,
        description: `Partially update a ${entityName}`,
        inputSchema: makeOptional(schema),
        outputSchema: schema,
        pathParams: [{ name: 'id', schema: { type: 'string', format: 'uuid' } }],
        tags,
        security,
        entityName,
    });
    // Delete endpoint
    operations.push({
        name: `delete_${toSnakeCase(entityName)}`,
        method: 'DELETE',
        path: `${basePath}/:id`,
        description: `Delete a ${entityName}`,
        pathParams: [{ name: 'id', schema: { type: 'string', format: 'uuid' } }],
        tags,
        security,
        entityName,
    });
    return generateFullRustAPI(`${toPascalCase(entityName)}Api`, operations);
}
/**
 * Make all properties in a schema optional
 */
function makeOptional(schema) {
    if (schema.type !== 'object' || !schema.properties) {
        return schema;
    }
    const optionalProperties = {};
    for (const [key, value] of Object.entries(schema.properties)) {
        optionalProperties[key] = { ...value, required: false };
    }
    return {
        ...schema,
        properties: optionalProperties,
        required: [], // No required fields
    };
}
/**
 * Export all code generators for external Rust project integration
 */
export const rustCodeGenerators = {
    /** Generate error types */
    errorTypes: generateRustErrorTypes,
    /** Generate database service */
    dbService: generateRustDbService,
    /** Generate validation helpers */
    validationHelpers: generateRustValidationHelpers,
    /** Generate a single handler */
    handler: generateRustHandler,
    /** Generate a request struct */
    requestStruct: generateRustRequestStruct,
    /** Generate a response enum */
    responseEnum: generateRustResponseEnum,
    /** Generate a complete API */
    api: generateRustAPI,
    /** Generate a full API with all supporting code */
    fullApi: generateFullRustAPI,
    /** Generate CRUD API for an entity */
    crudApi: generateCrudAPI,
    /** Map TypeScript/OpenAPI type to Rust type */
    mapType: mapToRustType,
};
//# sourceMappingURL=openapi.js.map