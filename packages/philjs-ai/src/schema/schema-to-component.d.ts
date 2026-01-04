/**
 * Schema-to-Component Generator
 *
 * Generates PhilJS components from various schema formats:
 * - JSON Schema
 * - GraphQL Schema
 * - OpenAPI/Swagger
 * - Prisma Schema
 * - Database Schema (SQL)
 * - TypeScript Interfaces
 */
import type { AIProvider, CompletionOptions } from '../types.js';
/**
 * Schema type
 */
export type SchemaType = 'json-schema' | 'graphql' | 'openapi' | 'prisma' | 'sql' | 'typescript';
/**
 * Generated component type
 */
export type GeneratedComponentType = 'form' | 'table' | 'list' | 'detail' | 'card' | 'crud' | 'filter' | 'search' | 'stats' | 'chart';
/**
 * Schema to component options
 */
export interface SchemaToComponentOptions extends Partial<CompletionOptions> {
    /** Schema format */
    schemaType: SchemaType;
    /** Component types to generate */
    componentTypes?: GeneratedComponentType[];
    /** Include validation */
    includeValidation?: boolean;
    /** Include loading states */
    includeLoadingStates?: boolean;
    /** Include error handling */
    includeErrorHandling?: boolean;
    /** Styling approach */
    styleApproach?: 'tailwind' | 'css-modules' | 'styled-components' | 'none';
    /** Generate API hooks */
    generateAPIHooks?: boolean;
    /** Generate types alongside components */
    generateTypes?: boolean;
    /** Entity name override */
    entityName?: string;
}
/**
 * Schema field definition
 */
export interface SchemaField {
    /** Field name */
    name: string;
    /** Field type */
    type: string;
    /** Is required */
    required: boolean;
    /** Is array */
    isArray: boolean;
    /** Is primary key */
    isPrimaryKey?: boolean;
    /** Is foreign key */
    isForeignKey?: boolean;
    /** Referenced entity */
    referencedEntity?: string;
    /** Default value */
    default?: unknown;
    /** Description */
    description?: string;
    /** Validation rules */
    validation?: FieldValidation;
    /** UI hints */
    uiHints?: UIHints;
}
/**
 * Field validation
 */
export interface FieldValidation {
    /** Minimum value/length */
    min?: number;
    /** Maximum value/length */
    max?: number;
    /** Pattern (regex) */
    pattern?: string;
    /** Enum values */
    enum?: string[];
    /** Custom validation message */
    message?: string;
}
/**
 * UI hints for rendering
 */
export interface UIHints {
    /** Display label */
    label?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Input type */
    inputType?: 'text' | 'number' | 'email' | 'password' | 'date' | 'select' | 'checkbox' | 'textarea' | 'file';
    /** Is hidden */
    hidden?: boolean;
    /** Is readonly */
    readonly?: boolean;
    /** Display order */
    order?: number;
    /** Field group */
    group?: string;
}
/**
 * Parsed schema
 */
export interface ParsedSchema {
    /** Entity name */
    name: string;
    /** Entity description */
    description?: string;
    /** Fields */
    fields: SchemaField[];
    /** Relations */
    relations: SchemaRelation[];
    /** Original schema type */
    sourceType: SchemaType;
}
/**
 * Schema relation
 */
export interface SchemaRelation {
    /** Relation name */
    name: string;
    /** Relation type */
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
    /** Related entity */
    entity: string;
    /** Foreign key field */
    foreignKey?: string;
}
/**
 * Generated component result
 */
export interface GeneratedSchemaComponent {
    /** Component name */
    name: string;
    /** Component type */
    type: GeneratedComponentType;
    /** Component code */
    code: string;
    /** TypeScript types */
    types?: string;
    /** Validation schema (Zod/Yup) */
    validationSchema?: string;
    /** API hooks if generated */
    apiHooks?: string;
    /** Styles if generated */
    styles?: string;
    /** Usage example */
    example: string;
    /** Props interface */
    propsInterface: string;
}
/**
 * Schema to component result
 */
export interface SchemaToComponentResult {
    /** Parsed schema */
    schema: ParsedSchema;
    /** Generated components */
    components: GeneratedSchemaComponent[];
    /** Shared types */
    types: string;
    /** Index file for exports */
    indexFile: string;
    /** Usage documentation */
    documentation: string;
}
/**
 * CRUD generation result
 */
export interface CRUDGenerationResult {
    /** Create form component */
    createForm: GeneratedSchemaComponent;
    /** Edit form component */
    editForm: GeneratedSchemaComponent;
    /** List/table component */
    list: GeneratedSchemaComponent;
    /** Detail view component */
    detail: GeneratedSchemaComponent;
    /** Delete confirmation component */
    deleteConfirm: GeneratedSchemaComponent;
    /** API hooks */
    apiHooks: string;
    /** Types */
    types: string;
    /** Page component combining all */
    page: GeneratedSchemaComponent;
}
/**
 * Schema to Component Generator Engine
 *
 * Generates PhilJS components from schema definitions.
 *
 * @example
 * ```typescript
 * const generator = new SchemaToComponentGenerator(provider);
 *
 * // Generate from JSON Schema
 * const result = await generator.generate(jsonSchema, {
 *   schemaType: 'json-schema',
 *   componentTypes: ['form', 'table', 'detail'],
 * });
 *
 * // Generate CRUD from Prisma schema
 * const crud = await generator.generateCRUD(prismaModel, {
 *   schemaType: 'prisma',
 *   generateAPIHooks: true,
 * });
 *
 * // Generate from GraphQL
 * const graphqlComponents = await generator.generate(graphqlType, {
 *   schemaType: 'graphql',
 *   componentTypes: ['form', 'list'],
 * });
 * ```
 */
export declare class SchemaToComponentGenerator {
    private provider;
    private defaultOptions;
    constructor(provider: AIProvider, options?: Partial<CompletionOptions>);
    /**
     * Generate components from schema
     *
     * @param schema - Schema string
     * @param options - Generation options
     * @returns Generated components
     */
    generate(schema: string, options: SchemaToComponentOptions): Promise<SchemaToComponentResult>;
    /**
     * Generate full CRUD components
     *
     * @param schema - Schema string
     * @param options - Generation options
     * @returns CRUD generation result
     */
    generateCRUD(schema: string, options: SchemaToComponentOptions): Promise<CRUDGenerationResult>;
    /**
     * Generate a single component from schema
     */
    private generateComponent;
    /**
     * Build prompt for component generation
     */
    private buildComponentPrompt;
    /**
     * Get system prompt for component type
     */
    private getSystemPrompt;
    /**
     * Get component name suffix
     */
    private getComponentSuffix;
    /**
     * Generate TypeScript types from schema
     */
    private generateTypes;
    /**
     * Generate props interface
     */
    private generatePropsInterface;
    /**
     * Generate validation schema (Zod)
     */
    private generateValidationSchema;
    /**
     * Map TypeScript type to Zod type
     */
    private mapToZodType;
    /**
     * Generate API hooks
     */
    private generateAPIHooks;
    /**
     * Generate delete confirmation component
     */
    private generateDeleteConfirm;
    /**
     * Generate CRUD page component
     */
    private generateCRUDPage;
    /**
     * Generate index file
     */
    private generateIndexFile;
    /**
     * Generate documentation
     */
    private generateDocumentation;
    /**
     * Generate usage example
     */
    private generateExample;
}
/**
 * Create a schema to component generator instance
 */
export declare function createSchemaToComponentGenerator(provider: AIProvider, options?: Partial<CompletionOptions>): SchemaToComponentGenerator;
/**
 * Quick schema to component helper
 */
export declare function generateComponentsFromSchema(provider: AIProvider, schema: string, options: SchemaToComponentOptions): Promise<SchemaToComponentResult>;
/**
 * Quick CRUD generation helper
 */
export declare function generateCRUDFromSchema(provider: AIProvider, schema: string, options: SchemaToComponentOptions): Promise<CRUDGenerationResult>;
/**
 * Quick JSON Schema to component helper
 */
export declare function generateFromJSONSchema(provider: AIProvider, jsonSchema: object, componentTypes?: GeneratedComponentType[]): Promise<SchemaToComponentResult>;
/**
 * Quick GraphQL to component helper
 */
export declare function generateFromGraphQL(provider: AIProvider, graphqlSchema: string, componentTypes?: GeneratedComponentType[]): Promise<SchemaToComponentResult>;
//# sourceMappingURL=schema-to-component.d.ts.map