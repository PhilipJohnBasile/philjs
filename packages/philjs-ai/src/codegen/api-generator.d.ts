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
export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'uuid' | 'email' | 'url' | 'json' | 'array' | 'enum';
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
export declare class APIGenerator {
    private provider;
    private defaultOptions;
    constructor(provider: AIProvider, options?: Partial<CompletionOptions>);
    /**
     * Generate complete CRUD API for a resource
     */
    generateCRUD(config: APIGenerationConfig): Promise<GeneratedAPI>;
    /**
     * Infer database schema from description or example data
     */
    inferSchema(resourceDescription: string, exampleData?: Record<string, unknown>[]): Promise<InferredSchema>;
    /**
     * Generate validation schema for a resource
     */
    generateValidation(schema: SchemaDefinition, library?: 'zod' | 'yup' | 'joi' | 'native'): Promise<string>;
    /**
     * Generate database model/schema for ORM
     */
    generateDatabaseModel(schema: SchemaDefinition, database: DatabaseType): Promise<string>;
    /**
     * Generate OpenAPI specification
     */
    generateOpenAPISpec(config: APIGenerationConfig): Promise<string>;
    /**
     * Generate individual API endpoint
     */
    generateEndpoint(resource: string, operation: CRUDOperation, config: Partial<APIGenerationConfig>): Promise<GeneratedRoute>;
    /**
     * Generate API middleware
     */
    generateMiddleware(type: 'auth' | 'validation' | 'rate-limit' | 'logging' | 'cors', config?: Record<string, unknown>): Promise<string>;
    /**
     * Build the CRUD generation prompt
     */
    private buildCRUDPrompt;
    /**
     * Get system prompt for API generation
     */
    private getSystemPrompt;
    /**
     * Parse the AI response into structured API
     */
    private parseAPIResponse;
    /**
     * Extract labeled code blocks
     */
    private extractLabeledCodeBlocks;
    /**
     * Extract routes from code blocks
     */
    private extractRoutes;
    /**
     * Get operation details
     */
    private getOperationDetails;
    /**
     * Extract explanation from response
     */
    private extractExplanation;
    /**
     * Infer dependencies from configuration
     */
    private inferDependencies;
}
/**
 * Create an API generator instance
 */
export declare function createAPIGenerator(provider: AIProvider, options?: Partial<CompletionOptions>): APIGenerator;
/**
 * Quick CRUD generation helper
 */
export declare function generateCRUD(provider: AIProvider, resource: string, schema?: SchemaDefinition, options?: Partial<APIGenerationConfig>): Promise<GeneratedAPI>;
//# sourceMappingURL=api-generator.d.ts.map