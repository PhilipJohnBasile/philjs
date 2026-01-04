/**
 * API Generator - AI-powered API route generation for PhilJS
 *
 * Features:
 * - Generate CRUD endpoints
 * - Database schema inference
 * - Validation generation
 * - OpenAPI/Swagger documentation
 */
import { extractCode, extractJSON, validateCode } from '../utils/parser.js';
/**
 * API Generator class
 */
export class APIGenerator {
    provider;
    defaultOptions;
    constructor(provider, options) {
        this.provider = provider;
        this.defaultOptions = {
            temperature: 0.2,
            maxTokens: 8192,
            ...options,
        };
    }
    /**
     * Generate complete CRUD API for a resource
     */
    async generateCRUD(config) {
        const operations = config.operations || ['create', 'read', 'update', 'delete', 'list'];
        const prompt = this.buildCRUDPrompt(config, operations);
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: this.getSystemPrompt(config),
        });
        return this.parseAPIResponse(response, config);
    }
    /**
     * Infer database schema from description or example data
     */
    async inferSchema(resourceDescription, exampleData) {
        const prompt = `Infer a database schema for this resource:

Description: ${resourceDescription}
${exampleData ? `\nExample data:\n${JSON.stringify(exampleData, null, 2)}` : ''}

Analyze and infer:
1. Field names and types
2. Required vs optional fields
3. Validation requirements
4. Potential indexes
5. Relations to other resources

Return JSON with:
- fields: Array of field definitions with name, type, required, validation rules
- confidence: Confidence score 0-100
- suggestions: Array of schema improvement suggestions
- potentialRelations: Array of potential relations to other resources`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are a database schema design expert.',
        });
        return extractJSON(response) || {
            fields: [],
            confidence: 0,
            suggestions: [],
            potentialRelations: [],
        };
    }
    /**
     * Generate validation schema for a resource
     */
    async generateValidation(schema, library = 'zod') {
        const prompt = `Generate ${library} validation schema for:

${JSON.stringify(schema, null, 2)}

Requirements:
- Validate all fields according to their types
- Apply all validation rules
- Generate schemas for create and update operations
- Include helpful error messages
- Export named schemas

Return only the validation code.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: `You are a validation expert using ${library}.`,
        });
        return extractCode(response) || '';
    }
    /**
     * Generate database model/schema for ORM
     */
    async generateDatabaseModel(schema, database) {
        const prompt = `Generate ${database} model/schema for:

${JSON.stringify(schema, null, 2)}

Requirements:
- Define all fields with proper types
- Set up indexes and constraints
- Define relations
- Include timestamps (createdAt, updatedAt)
- Follow ${database} best practices

Return only the model code.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: `You are a ${database} database expert.`,
        });
        return extractCode(response) || '';
    }
    /**
     * Generate OpenAPI specification
     */
    async generateOpenAPISpec(config) {
        const prompt = `Generate OpenAPI 3.0 specification for:

Resource: ${config.resource}
Description: ${config.description || 'CRUD API'}
Schema: ${JSON.stringify(config.schema, null, 2)}
Operations: ${config.operations?.join(', ') || 'CRUD'}
Auth: ${config.auth ? JSON.stringify(config.auth) : 'None'}
Pagination: ${config.pagination ? 'Yes' : 'No'}
Filtering: ${config.filtering ? 'Yes' : 'No'}

Generate complete OpenAPI specification in YAML format.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are an API documentation expert.',
        });
        // Extract YAML from response
        const yamlMatch = response.match(/```(?:yaml|yml)\n([\s\S]*?)```/);
        return yamlMatch?.[1].trim() || response;
    }
    /**
     * Generate individual API endpoint
     */
    async generateEndpoint(resource, operation, config) {
        const operationDetails = this.getOperationDetails(operation);
        const prompt = `Generate a PhilJS API endpoint:

Resource: ${resource}
Operation: ${operation}
Method: ${operationDetails.method}
Path: ${operationDetails.path.replace(':resource', resource)}
${config.auth?.protected?.includes(operation) ? 'Requires authentication' : 'Public endpoint'}
${config.validation ? `Validation: ${config.validation}` : ''}
${config.database ? `Database: ${config.database}` : ''}

Generate the route handler with:
- Request validation
- Business logic
- Error handling
- Proper response format

Return the handler code.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are a PhilJS API development expert.',
        });
        const route = {
            method: operationDetails.method,
            path: operationDetails.path.replace(':resource', resource),
            code: extractCode(response) || '',
            description: operationDetails.description,
        };
        if (config.auth?.protected?.includes(operation) !== undefined) {
            route.auth = config.auth?.protected?.includes(operation);
        }
        return route;
    }
    /**
     * Generate API middleware
     */
    async generateMiddleware(type, config) {
        const prompt = `Generate PhilJS middleware for: ${type}

Configuration: ${JSON.stringify(config || {}, null, 2)}

Requirements:
- Follow PhilJS middleware conventions
- Handle errors gracefully
- Include TypeScript types
- Add JSDoc comments

Return the middleware code.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are a middleware development expert.',
        });
        return extractCode(response) || '';
    }
    /**
     * Build the CRUD generation prompt
     */
    buildCRUDPrompt(config, operations) {
        const schemaSection = config.schema
            ? `\nSchema:\n${JSON.stringify(config.schema, null, 2)}`
            : '';
        const authSection = config.auth
            ? `\nAuthentication:
- Type: ${config.auth.type}
- Protected: ${config.auth.protected?.join(', ') || 'All'}
- Roles: ${JSON.stringify(config.auth.roles || {})}`
            : '';
        const featuresSection = `
Features:
- Pagination: ${config.pagination ? 'Yes' : 'No'}
- Filtering: ${config.filtering ? 'Yes' : 'No'}
- Sorting: ${config.sorting ? 'Yes' : 'No'}
- Validation: ${config.validation || 'zod'}
- Database: ${config.database || 'Auto-detect'}`;
        return `Generate a complete CRUD API for the "${config.resource}" resource.

Description: ${config.description || `CRUD operations for ${config.resource}`}
${schemaSection}

Operations to generate: ${operations.join(', ')}
${authSection}
${featuresSection}

Generate:
1. Route handlers for each operation
2. Validation schemas
3. TypeScript types/interfaces
4. Database model (if applicable)
${config.openapi ? '5. OpenAPI specification' : ''}

Follow RESTful conventions and PhilJS patterns.`;
    }
    /**
     * Get system prompt for API generation
     */
    getSystemPrompt(config) {
        return `You are an expert API developer creating production-quality PhilJS APIs.

PhilJS API conventions:
- Route handlers are async functions
- Use Zod for validation by default
- Return consistent response formats
- Handle errors with proper status codes
- Use TypeScript for type safety

Response format:
\`\`\`typescript
// Success
return json({ data: result, success: true });

// Error
return json({ error: message, success: false }, { status: 400 });

// List with pagination
return json({
  data: items,
  pagination: { page, limit, total },
  success: true
});
\`\`\`

${config.database ? `Use ${config.database} for database operations.` : ''}
${config.auth ? `Implement ${config.auth.type} authentication.` : ''}`;
    }
    /**
     * Parse the AI response into structured API
     */
    parseAPIResponse(response, config) {
        const jsonResult = extractJSON(response);
        if (jsonResult) {
            return jsonResult;
        }
        const codeBlocks = this.extractLabeledCodeBlocks(response);
        const result = {
            routes: this.extractRoutes(codeBlocks, config),
            validationSchema: codeBlocks.find(b => b.label?.includes('validation'))?.code || '',
            types: codeBlocks.find(b => b.label?.includes('type'))?.code || '',
            explanation: this.extractExplanation(response),
            dependencies: this.inferDependencies(config),
        };
        const databaseSchemaBlock = codeBlocks.find(b => b.label?.includes('database') ||
            b.label?.includes('model') ||
            b.label?.includes('schema'))?.code;
        if (databaseSchemaBlock !== undefined) {
            result.databaseSchema = databaseSchemaBlock;
        }
        if (config.openapi) {
            const openapiBlock = codeBlocks.find(b => b.label?.includes('openapi'))?.code;
            if (openapiBlock !== undefined) {
                result.openapi = openapiBlock;
            }
        }
        const middlewareBlock = codeBlocks.find(b => b.label?.includes('middleware'))?.code;
        if (middlewareBlock !== undefined) {
            result.middleware = middlewareBlock;
        }
        return result;
    }
    /**
     * Extract labeled code blocks
     */
    extractLabeledCodeBlocks(response) {
        const blocks = [];
        const regex = /(?:^|\n)(?:#+\s*)?(\w[\w\s]*)?(?:\n)?```(?:typescript|ts|javascript|js|yaml|yml)?\n([\s\S]*?)```/g;
        let match;
        while ((match = regex.exec(response)) !== null) {
            const block = {
                code: match[2].trim(),
            };
            const labelValue = match[1]?.trim().toLowerCase();
            if (labelValue !== undefined) {
                block.label = labelValue;
            }
            blocks.push(block);
        }
        return blocks;
    }
    /**
     * Extract routes from code blocks
     */
    extractRoutes(blocks, config) {
        const routes = [];
        const operations = config.operations || ['create', 'read', 'update', 'delete', 'list'];
        for (const op of operations) {
            const details = this.getOperationDetails(op);
            const block = blocks.find(b => b.label?.includes(op) ||
                b.label?.includes(details.method.toLowerCase()));
            if (block) {
                const route = {
                    method: details.method,
                    path: details.path.replace(':resource', config.resource),
                    code: block.code,
                    description: details.description,
                };
                const authValue = config.auth?.protected?.includes(op);
                if (authValue !== undefined) {
                    route.auth = authValue;
                }
                routes.push(route);
            }
        }
        // If no routes found in blocks, use first block's code as main code
        if (routes.length === 0 && blocks.length > 0) {
            const mainCode = blocks[0].code;
            if (mainCode) {
                for (const op of operations) {
                    const details = this.getOperationDetails(op);
                    const route = {
                        method: details.method,
                        path: details.path.replace(':resource', config.resource),
                        code: mainCode,
                        description: details.description,
                    };
                    const authValue = config.auth?.protected?.includes(op);
                    if (authValue !== undefined) {
                        route.auth = authValue;
                    }
                    routes.push(route);
                }
            }
        }
        return routes;
    }
    /**
     * Get operation details
     */
    getOperationDetails(operation) {
        const details = {
            create: { method: 'POST', path: '/:resource', description: 'Create a new resource' },
            read: { method: 'GET', path: '/:resource/:id', description: 'Get a single resource by ID' },
            update: { method: 'PUT', path: '/:resource/:id', description: 'Update a resource' },
            delete: { method: 'DELETE', path: '/:resource/:id', description: 'Delete a resource' },
            list: { method: 'GET', path: '/:resource', description: 'List all resources' },
        };
        return details[operation];
    }
    /**
     * Extract explanation from response
     */
    extractExplanation(response) {
        const beforeCode = response.split('```')[0].trim();
        return beforeCode || 'API generated successfully';
    }
    /**
     * Infer dependencies from configuration
     */
    inferDependencies(config) {
        const deps = [];
        if (config.validation === 'zod')
            deps.push('zod');
        if (config.validation === 'yup')
            deps.push('yup');
        if (config.validation === 'joi')
            deps.push('joi');
        if (config.database === 'prisma')
            deps.push('@prisma/client');
        if (config.database === 'drizzle')
            deps.push('drizzle-orm');
        if (config.auth?.type === 'jwt')
            deps.push('jsonwebtoken');
        return deps;
    }
}
/**
 * Create an API generator instance
 */
export function createAPIGenerator(provider, options) {
    return new APIGenerator(provider, options);
}
/**
 * Quick CRUD generation helper
 */
export async function generateCRUD(provider, resource, schema, options) {
    const generator = new APIGenerator(provider);
    const config = {
        resource,
        validation: 'zod',
        ...options,
    };
    if (schema !== undefined) {
        config.schema = schema;
    }
    return generator.generateCRUD(config);
}
//# sourceMappingURL=api-generator.js.map