/**
 * API Generator - AI-powered API route generation for PhilJS
 *
 * Features:
 * - Generate CRUD endpoints
 * - Database schema inference
 * - Validation generation
 * - OpenAPI/Swagger documentation
 */

import type { AIProvider, CompletionOptions } from '../types.js';
import { extractCode, extractJSON, validateCode } from '../utils/parser.js';

/**
 * API generation configuration
 */
export interface APIGenerationConfig {
  /** Resource name (e.g., 'users', 'posts') */
  resource: string;
  /** Resource description */
  description?: string;
  /** Schema definition */
  schema?: SchemaDefinition;
  /** Operations to generate */
  operations?: CRUDOperation[];
  /** Database type */
  database?: DatabaseType;
  /** Authentication requirements */
  auth?: AuthConfig;
  /** Validation library */
  validation?: 'zod' | 'yup' | 'joi' | 'native';
  /** Generate OpenAPI spec */
  openapi?: boolean;
  /** Include pagination */
  pagination?: boolean;
  /** Include filtering */
  filtering?: boolean;
  /** Include sorting */
  sorting?: boolean;
}

/**
 * Schema definition for resource
 */
export interface SchemaDefinition {
  /** Field definitions */
  fields: FieldDefinition[];
  /** Unique constraints */
  unique?: string[];
  /** Indexes */
  indexes?: string[];
  /** Relations to other resources */
  relations?: RelationDefinition[];
}

/**
 * Field definition
 */
export interface FieldDefinition {
  /** Field name */
  name: string;
  /** Field type */
  type: FieldType;
  /** Is field required */
  required?: boolean;
  /** Default value */
  default?: unknown;
  /** Field description */
  description?: string;
  /** Validation rules */
  validation?: ValidationRule[];
  /** Is primary key */
  primaryKey?: boolean;
  /** Is auto-generated (e.g., UUID, timestamp) */
  auto?: boolean;
}

/**
 * Field types
 */
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'uuid'
  | 'email'
  | 'url'
  | 'json'
  | 'array'
  | 'enum';

/**
 * Validation rule
 */
export interface ValidationRule {
  /** Rule type */
  type: 'min' | 'max' | 'pattern' | 'enum' | 'email' | 'url' | 'uuid' | 'custom';
  /** Rule value */
  value?: unknown;
  /** Error message */
  message?: string;
}

/**
 * Relation definition
 */
export interface RelationDefinition {
  /** Relation type */
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  /** Related resource */
  resource: string;
  /** Foreign key field */
  foreignKey?: string;
  /** Include in responses */
  include?: boolean;
}

/**
 * CRUD operation type
 */
export type CRUDOperation = 'create' | 'read' | 'update' | 'delete' | 'list';

/**
 * Database type
 */
export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'prisma' | 'drizzle';

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /** Auth type */
  type: 'jwt' | 'session' | 'api-key' | 'oauth';
  /** Protected operations */
  protected?: CRUDOperation[];
  /** Role-based access */
  roles?: Record<string, CRUDOperation[]>;
}

/**
 * Generated API result
 */
export interface GeneratedAPI {
  /** Route handler code */
  routes: GeneratedRoute[];
  /** Validation schema code */
  validationSchema: string;
  /** Database schema/model code */
  databaseSchema?: string;
  /** TypeScript types */
  types: string;
  /** OpenAPI specification */
  openapi?: string;
  /** Middleware code */
  middleware?: string;
  /** Explanation */
  explanation: string;
  /** Required dependencies */
  dependencies: string[];
}

/**
 * Generated route
 */
export interface GeneratedRoute {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Route path */
  path: string;
  /** Route handler code */
  code: string;
  /** Operation description */
  description: string;
  /** Required auth */
  auth?: boolean;
}

/**
 * Schema inference result
 */
export interface InferredSchema {
  /** Inferred fields */
  fields: FieldDefinition[];
  /** Confidence score */
  confidence: number;
  /** Suggestions */
  suggestions: string[];
  /** Potential relations */
  potentialRelations: RelationDefinition[];
}

/**
 * API Generator class
 */
export class APIGenerator {
  private provider: AIProvider;
  private defaultOptions: Partial<CompletionOptions>;

  constructor(provider: AIProvider, options?: Partial<CompletionOptions>) {
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
  async generateCRUD(config: APIGenerationConfig): Promise<GeneratedAPI> {
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
  async inferSchema(
    resourceDescription: string,
    exampleData?: Record<string, unknown>[]
  ): Promise<InferredSchema> {
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

    return extractJSON<InferredSchema>(response) || {
      fields: [],
      confidence: 0,
      suggestions: [],
      potentialRelations: [],
    };
  }

  /**
   * Generate validation schema for a resource
   */
  async generateValidation(
    schema: SchemaDefinition,
    library: 'zod' | 'yup' | 'joi' | 'native' = 'zod'
  ): Promise<string> {
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
  async generateDatabaseModel(
    schema: SchemaDefinition,
    database: DatabaseType
  ): Promise<string> {
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
  async generateOpenAPISpec(config: APIGenerationConfig): Promise<string> {
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
  async generateEndpoint(
    resource: string,
    operation: CRUDOperation,
    config: Partial<APIGenerationConfig>
  ): Promise<GeneratedRoute> {
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

    return {
      method: operationDetails.method,
      path: operationDetails.path.replace(':resource', resource),
      code: extractCode(response) || '',
      description: operationDetails.description,
      auth: config.auth?.protected?.includes(operation),
    };
  }

  /**
   * Generate API middleware
   */
  async generateMiddleware(
    type: 'auth' | 'validation' | 'rate-limit' | 'logging' | 'cors',
    config?: Record<string, unknown>
  ): Promise<string> {
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
  private buildCRUDPrompt(
    config: APIGenerationConfig,
    operations: CRUDOperation[]
  ): string {
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
  private getSystemPrompt(config: APIGenerationConfig): string {
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
  private parseAPIResponse(
    response: string,
    config: APIGenerationConfig
  ): GeneratedAPI {
    const jsonResult = extractJSON<GeneratedAPI>(response);
    if (jsonResult) {
      return jsonResult;
    }

    const codeBlocks = this.extractLabeledCodeBlocks(response);

    return {
      routes: this.extractRoutes(codeBlocks, config),
      validationSchema: codeBlocks.find(b => b.label?.includes('validation'))?.code || '',
      databaseSchema: codeBlocks.find(b =>
        b.label?.includes('database') ||
        b.label?.includes('model') ||
        b.label?.includes('schema')
      )?.code,
      types: codeBlocks.find(b => b.label?.includes('type'))?.code || '',
      openapi: config.openapi
        ? codeBlocks.find(b => b.label?.includes('openapi'))?.code
        : undefined,
      middleware: codeBlocks.find(b => b.label?.includes('middleware'))?.code,
      explanation: this.extractExplanation(response),
      dependencies: this.inferDependencies(config),
    };
  }

  /**
   * Extract labeled code blocks
   */
  private extractLabeledCodeBlocks(response: string): Array<{ label?: string; code: string }> {
    const blocks: Array<{ label?: string; code: string }> = [];
    const regex = /(?:^|\n)(?:#+\s*)?(\w[\w\s]*)?(?:\n)?```(?:typescript|ts|javascript|js|yaml|yml)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(response)) !== null) {
      blocks.push({
        label: match[1]?.trim().toLowerCase(),
        code: match[2].trim(),
      });
    }

    return blocks;
  }

  /**
   * Extract routes from code blocks
   */
  private extractRoutes(
    blocks: Array<{ label?: string; code: string }>,
    config: APIGenerationConfig
  ): GeneratedRoute[] {
    const routes: GeneratedRoute[] = [];
    const operations = config.operations || ['create', 'read', 'update', 'delete', 'list'];

    for (const op of operations) {
      const details = this.getOperationDetails(op);
      const block = blocks.find(b =>
        b.label?.includes(op) ||
        b.label?.includes(details.method.toLowerCase())
      );

      if (block) {
        routes.push({
          method: details.method,
          path: details.path.replace(':resource', config.resource),
          code: block.code,
          description: details.description,
          auth: config.auth?.protected?.includes(op),
        });
      }
    }

    // If no routes found in blocks, try to parse from main code
    if (routes.length === 0) {
      const mainCode = extractCode(response => response);
      if (mainCode) {
        for (const op of operations) {
          const details = this.getOperationDetails(op);
          routes.push({
            method: details.method,
            path: details.path.replace(':resource', config.resource),
            code: mainCode,
            description: details.description,
            auth: config.auth?.protected?.includes(op),
          });
        }
      }
    }

    return routes;
  }

  /**
   * Get operation details
   */
  private getOperationDetails(operation: CRUDOperation): {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    description: string;
  } {
    const details: Record<CRUDOperation, { method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; path: string; description: string }> = {
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
  private extractExplanation(response: string): string {
    const beforeCode = response.split('```')[0].trim();
    return beforeCode || 'API generated successfully';
  }

  /**
   * Infer dependencies from configuration
   */
  private inferDependencies(config: APIGenerationConfig): string[] {
    const deps: string[] = [];

    if (config.validation === 'zod') deps.push('zod');
    if (config.validation === 'yup') deps.push('yup');
    if (config.validation === 'joi') deps.push('joi');

    if (config.database === 'prisma') deps.push('@prisma/client');
    if (config.database === 'drizzle') deps.push('drizzle-orm');

    if (config.auth?.type === 'jwt') deps.push('jsonwebtoken');

    return deps;
  }
}

/**
 * Create an API generator instance
 */
export function createAPIGenerator(
  provider: AIProvider,
  options?: Partial<CompletionOptions>
): APIGenerator {
  return new APIGenerator(provider, options);
}

/**
 * Quick CRUD generation helper
 */
export async function generateCRUD(
  provider: AIProvider,
  resource: string,
  schema?: SchemaDefinition,
  options?: Partial<APIGenerationConfig>
): Promise<GeneratedAPI> {
  const generator = new APIGenerator(provider);
  return generator.generateCRUD({
    resource,
    schema,
    validation: 'zod',
    ...options,
  });
}
