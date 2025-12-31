/**
 * PhilJS GraphQL Code Generation (Enhanced)
 *
 * Enhanced code generation for GraphQL:
 * - Proper GraphQL AST parsing using graphql-js
 * - Full TypeScript type generation from schema
 * - Subscription type generation
 * - Fragment type generation
 * - Operation type generation with optimistic updates
 * - Type-safe hooks generation
 * - Persisted query manifest generation
 */
import { type DocumentNode, type GraphQLSchema } from 'graphql';
export interface CodegenConfig {
    /** GraphQL schema URL or file path */
    schema: string;
    /** Documents glob pattern */
    documents: string[];
    /** Output directory */
    outputDir: string;
    /** Generate React/PhilJS hooks (default: true) */
    generateHooks?: boolean;
    /** Generate fragment types (default: true) */
    generateFragments?: boolean;
    /** Generate subscription types (default: true) */
    generateSubscriptions?: boolean;
    /** Generate persisted query manifest (default: false) */
    generatePersistedQueries?: boolean;
    /** Strict mode - fail on unknown types (default: false) */
    strict?: boolean;
    /** Custom scalar type mappings */
    scalars?: Record<string, string>;
    /** Use enums as union types instead of TypeScript enums (default: false) */
    enumsAsUnionTypes?: boolean;
    /** Add readonly modifiers to generated types (default: false) */
    immutableTypes?: boolean;
    /** Generate __typename for all object types (default: true) */
    addTypename?: boolean;
}
export interface GeneratedOperation {
    /** Operation name */
    name: string;
    /** Operation type */
    type: 'query' | 'mutation' | 'subscription';
    /** Generated TypeScript code */
    code: string;
    /** Variables type name */
    variablesType?: string;
    /** Data type name */
    dataType?: string;
    /** Query hash (for persisted queries) */
    hash?: string;
}
export interface GeneratedFragment {
    /** Fragment name */
    name: string;
    /** Type condition */
    on: string;
    /** Generated TypeScript code */
    code: string;
    /** Data type name */
    dataType: string;
}
/**
 * GraphQL Code Generator with proper AST parsing
 */
export declare class GraphQLCodegen {
    private config;
    private schema;
    private typeRegistry;
    private fragmentRegistry;
    private generatedTypes;
    constructor(config: CodegenConfig);
    /**
     * Set the GraphQL schema from a schema string
     */
    setSchema(schemaString: string): void;
    /**
     * Set the GraphQL schema from a GraphQLSchema object
     */
    setSchemaObject(schema: GraphQLSchema): void;
    /**
     * Get the scalar type mapping
     */
    private getScalarType;
    /**
     * Parse a GraphQL type node into type information
     */
    private parseTypeNode;
    /**
     * Convert a GraphQL type to TypeScript type string
     */
    private graphqlTypeToTS;
    /**
     * Resolve a GraphQL type name to TypeScript
     */
    private resolveTypeName;
    /**
     * Generate TypeScript types from the schema
     */
    private generateSchemaTypes;
    /**
     * Generate all schema type definitions
     */
    generateSchemaTypeDefinitions(): string;
    /**
     * Generate TypeScript type for a custom scalar
     */
    private generateScalarType;
    /**
     * Generate TypeScript type for an enum
     */
    private generateEnumType;
    /**
     * Generate TypeScript interface for a GraphQL interface type
     */
    private generateInterfaceType;
    /**
     * Generate TypeScript type for a union
     */
    private generateUnionType;
    /**
     * Generate TypeScript interface for an input object type
     */
    private generateInputObjectType;
    /**
     * Generate TypeScript interface for an object type
     */
    private generateObjectType;
    /**
     * Generate a field definition line
     */
    private generateFieldDefinition;
    /**
     * Generate an input field definition line
     */
    private generateInputFieldDefinition;
    /**
     * Convert a GraphQL output type to TypeScript type string
     */
    private graphqlOutputTypeToTS;
    /**
     * Resolve output type name to TypeScript
     */
    private resolveOutputTypeName;
    /**
     * Convert a GraphQL input type to TypeScript type string
     */
    private graphqlInputTypeToTS;
    /**
     * Resolve input type name to TypeScript
     */
    private resolveInputTypeName;
    /**
     * Generate types for a query operation from document string
     */
    generateQueryTypes(name: string, query: string, options?: {
        generateHook?: boolean;
    }): string;
    /**
     * Generate types for a query operation from DocumentNode
     */
    generateQueryTypesFromDocument(name: string, document: DocumentNode, options?: {
        generateHook?: boolean;
    }): string;
    /**
     * Generate types for a mutation operation from document string
     */
    generateMutationTypes(name: string, mutation: string, options?: {
        generateHook?: boolean;
        generateOptimistic?: boolean;
    }): string;
    /**
     * Generate types for a mutation operation from DocumentNode
     */
    generateMutationTypesFromDocument(name: string, document: DocumentNode, options?: {
        generateHook?: boolean;
        generateOptimistic?: boolean;
    }): string;
    /**
     * Generate types for a subscription operation from document string
     */
    generateSubscriptionTypes(name: string, subscription: string, options?: {
        generateHook?: boolean;
    }): string;
    /**
     * Generate types for a subscription operation from DocumentNode
     */
    generateSubscriptionTypesFromDocument(name: string, document: DocumentNode, options?: {
        generateHook?: boolean;
    }): string;
    /**
     * Generate types for a fragment from document string
     */
    generateFragmentTypes(name: string, on: string, fragment: string): string;
    /**
     * Generate types for a fragment from DocumentNode
     */
    generateFragmentTypesFromDocument(name: string, on: string, document: DocumentNode): string;
    /**
     * Generate operation types (data and variables) from AST
     */
    private generateOperationTypesFromDocument;
    /**
     * Get the root type for an operation
     */
    private getRootType;
    /**
     * Generate variable definition TypeScript
     */
    private generateVariableDefinition;
    /**
     * Generate types from a selection set with schema information
     */
    private generateSelectionSetTypes;
    /**
     * Generate type for a field selection
     */
    private generateFieldType;
    /**
     * Generate type for a nested selection set
     */
    private generateNestedSelectionType;
    /**
     * Generate type for an inline fragment
     */
    private generateInlineFragmentType;
    /**
     * Generate type for a fragment spread
     */
    private generateFragmentSpreadType;
    /**
     * Generate types from selection set without schema (fallback)
     */
    private generateSelectionSetTypesWithoutSchema;
    /**
     * Infer TypeScript type from field name (heuristic fallback)
     */
    private inferTypeFromFieldName;
    /**
     * Generate query hook
     */
    private generateQueryHook;
    /**
     * Generate mutation hook
     */
    private generateMutationHook;
    /**
     * Generate subscription hook
     */
    private generateSubscriptionHook;
    /**
     * Generate optimistic response type
     */
    private generateOptimisticResponseType;
    /**
     * Generate resolver types for a type
     */
    generateResolverTypes(typeName: string): string;
    /**
     * Generate resolver type for a single field
     */
    private generateFieldResolverType;
    /**
     * Generate args types for all fields with arguments
     */
    generateArgsTypes(): string;
    /**
     * Generate args type for a single field
     */
    private generateFieldArgsType;
    /**
     * Capitalize first letter
     */
    private capitalize;
    /**
     * Generate persisted query manifest
     */
    generatePersistedQueryManifest(operations: Array<{
        name: string;
        document: string;
    }>): Promise<Record<string, string>>;
    /**
     * Generate query hash using SHA-256
     */
    private generateQueryHash;
    /**
     * Generate complete types file
     */
    generateTypesFile(operations: Array<{
        name: string;
        type: 'query' | 'mutation' | 'subscription';
        document: string;
    }>, fragments?: Array<{
        name: string;
        on: string;
        document: string;
    }>): string;
}
/**
 * Create a code generator instance
 */
export declare function createCodegen(config: CodegenConfig): GraphQLCodegen;
/**
 * CLI-friendly codegen runner
 */
export declare function runCodegen(config: CodegenConfig): Promise<void>;
/**
 * Helper to extract operation info from a document string
 */
export declare function extractOperationInfo(document: string): {
    name: string;
    type: 'query' | 'mutation' | 'subscription';
} | null;
/**
 * Helper to extract fragment info from a document string
 */
export declare function extractFragmentInfo(document: string): {
    name: string;
    on: string;
} | null;
/**
 * Batch operation generator
 * Generates types for multiple operations at once
 */
export declare class BatchCodegen {
    private codegen;
    private operations;
    private fragments;
    constructor(config: CodegenConfig);
    /**
     * Set the schema for the batch codegen
     */
    setSchema(schemaString: string): void;
    /**
     * Set the schema from a GraphQLSchema object
     */
    setSchemaObject(schema: GraphQLSchema): void;
    /**
     * Add an operation to generate
     */
    addOperation(name: string, type: 'query' | 'mutation' | 'subscription', document: string): void;
    /**
     * Add a fragment to generate
     */
    addFragment(name: string, on: string, document: string): void;
    /**
     * Generate all types
     */
    generate(): string;
    /**
     * Clear all operations and fragments
     */
    clear(): void;
}
/**
 * Create a batch code generator
 */
export declare function createBatchCodegen(config: CodegenConfig): BatchCodegen;
/**
 * Type helper for resolver functions
 */
export type GraphQLFieldResolver<TParent, TContext, TArgs, TResult> = (parent: TParent, args: TArgs, context: TContext, info: unknown) => TResult;
/**
 * Generate all resolver types for a schema
 */
export declare function generateAllResolverTypes(codegen: GraphQLCodegen, typeNames?: string[]): string;
//# sourceMappingURL=codegen-enhanced.d.ts.map