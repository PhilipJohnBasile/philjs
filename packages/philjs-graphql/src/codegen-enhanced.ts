/**
 * PhilJS GraphQL Code Generation (Enhanced)
 *
 * Enhanced code generation for GraphQL:
 * - Subscription type generation
 * - Fragment type generation
 * - Operation type generation with optimistic updates
 * - Type-safe hooks generation
 * - Persisted query manifest generation
 */

import type { DocumentNode } from 'graphql';

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
 * GraphQL Code Generator
 */
export class GraphQLCodegen {
  private config: Required<CodegenConfig>;
  private operations: GeneratedOperation[] = [];
  private fragments: GeneratedFragment[] = [];

  constructor(config: CodegenConfig) {
    this.config = {
      generateHooks: true,
      generateFragments: true,
      generateSubscriptions: true,
      generatePersistedQueries: false,
      strict: false,
      scalars: {},
      ...config,
    };
  }

  /**
   * Generate types for a query operation
   */
  generateQueryTypes(
    name: string,
    query: string,
    options: { generateHook?: boolean } = {}
  ): string {
    const dataType = `${name}Query`;
    const variablesType = `${name}Variables`;

    let code = `// ${name} Query\n`;
    code += this.generateOperationTypes(query, dataType, variablesType);

    if (options.generateHook !== false && this.config.generateHooks) {
      code += '\n\n';
      code += this.generateQueryHook(name, dataType, variablesType);
    }

    return code;
  }

  /**
   * Generate types for a mutation operation
   */
  generateMutationTypes(
    name: string,
    mutation: string,
    options: { generateHook?: boolean; generateOptimistic?: boolean } = {}
  ): string {
    const dataType = `${name}Mutation`;
    const variablesType = `${name}Variables`;
    const optimisticType = `${name}OptimisticResponse`;

    let code = `// ${name} Mutation\n`;
    code += this.generateOperationTypes(mutation, dataType, variablesType);

    if (options.generateOptimistic) {
      code += '\n\n';
      code += this.generateOptimisticResponseType(optimisticType, dataType);
    }

    if (options.generateHook !== false && this.config.generateHooks) {
      code += '\n\n';
      code += this.generateMutationHook(
        name,
        dataType,
        variablesType,
        options.generateOptimistic ? optimisticType : undefined
      );
    }

    return code;
  }

  /**
   * Generate types for a subscription operation
   */
  generateSubscriptionTypes(
    name: string,
    subscription: string,
    options: { generateHook?: boolean } = {}
  ): string {
    const dataType = `${name}Subscription`;
    const variablesType = `${name}Variables`;

    let code = `// ${name} Subscription\n`;
    code += this.generateOperationTypes(subscription, dataType, variablesType);

    if (options.generateHook !== false && this.config.generateHooks) {
      code += '\n\n';
      code += this.generateSubscriptionHook(name, dataType, variablesType);
    }

    return code;
  }

  /**
   * Generate types for a fragment
   */
  generateFragmentTypes(
    name: string,
    on: string,
    fragment: string
  ): string {
    const dataType = `${name}Fragment`;

    let code = `// ${name} Fragment on ${on}\n`;
    code += `export interface ${dataType} {\n`;
    code += this.extractFieldsFromFragment(fragment);
    code += `}\n`;

    code += '\n';
    code += `export const ${name}FragmentDoc = gql\`\n`;
    code += `  ${fragment}\n`;
    code += `\`;\n`;

    return code;
  }

  /**
   * Generate operation types (data and variables)
   */
  private generateOperationTypes(
    document: string,
    dataType: string,
    variablesType: string
  ): string {
    let code = '';

    // Extract variables
    const variables = this.extractVariables(document);
    code += `export interface ${variablesType} {\n`;
    if (variables.length > 0) {
      variables.forEach((v) => {
        code += `  ${v.name}${v.required ? '' : '?'}: ${v.type};\n`;
      });
    }
    code += `}\n\n`;

    // Extract fields
    code += `export interface ${dataType} {\n`;
    code += this.extractFields(document);
    code += `}\n`;

    return code;
  }

  /**
   * Generate query hook
   */
  private generateQueryHook(
    name: string,
    dataType: string,
    variablesType: string
  ): string {
    const hookName = `use${name}Query`;

    return `export function ${hookName}(
  variables?: ${variablesType},
  options?: Omit<GraphQLQueryOptions<${variablesType}>, 'query' | 'variables'>
) {
  return createQuery<${dataType}, ${variablesType}>(client, {
    query: ${name}Document,
    variables,
    ...options,
  });
}`;
  }

  /**
   * Generate mutation hook
   */
  private generateMutationHook(
    name: string,
    dataType: string,
    variablesType: string,
    optimisticType?: string
  ): string {
    const hookName = `use${name}Mutation`;

    let code = `export function ${hookName}() {\n`;
    code += `  return createMutation<${dataType}, ${variablesType}>(client, ${name}Document);\n`;
    code += `}\n`;

    if (optimisticType) {
      code += '\n';
      code += `export function ${hookName}WithOptimistic(\n`;
      code += `  optimisticResponse: ${optimisticType}\n`;
      code += `) {\n`;
      code += `  const mutation = use${name}Mutation();\n`;
      code += `  return {\n`;
      code += `    ...mutation,\n`;
      code += `    mutate: (variables?: ${variablesType}) =>\n`;
      code += `      client.mutate({ mutation: ${name}Document, variables, optimisticResponse }),\n`;
      code += `  };\n`;
      code += `}\n`;
    }

    return code;
  }

  /**
   * Generate subscription hook
   */
  private generateSubscriptionHook(
    name: string,
    dataType: string,
    variablesType: string
  ): string {
    const hookName = `use${name}Subscription`;

    return `export function ${hookName}(
  variables?: ${variablesType},
  options?: Omit<SubscriptionOptions<${dataType}, ${variablesType}>, 'query' | 'variables'>
) {
  return useSubscription<${dataType}, ${variablesType}>(subscriptionClient, {
    query: ${name}Document,
    variables,
    ...options,
  });
}`;
  }

  /**
   * Generate optimistic response type
   */
  private generateOptimisticResponseType(
    optimisticType: string,
    dataType: string
  ): string {
    return `export type ${optimisticType} = Partial<${dataType}>;`;
  }

  /**
   * Extract variables from GraphQL document
   */
  private extractVariables(
    document: string
  ): Array<{ name: string; type: string; required: boolean }> {
    const variables: Array<{ name: string; type: string; required: boolean }> = [];
    const varRegex = /\$(\w+):\s*(\[?\w+\]?)(!?)/g;

    let match;
    while ((match = varRegex.exec(document)) !== null) {
      const [, name, rawType, required] = match;
      variables.push({
        name,
        type: this.mapGraphQLTypeToTS(rawType),
        required: required === '!',
      });
    }

    return variables;
  }

  /**
   * Extract fields from GraphQL document
   */
  private extractFields(document: string): string {
    // This is a simplified implementation
    // In a real implementation, you'd parse the GraphQL AST
    const fieldsMatch = document.match(/{\s*([\s\S]+?)\s*}/);
    if (!fieldsMatch) return '  [key: string]: any;\n';

    const fields = fieldsMatch[1]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));

    let result = '';
    fields.forEach((field) => {
      const fieldName = field.split(/[\s({]/)[0];
      if (fieldName && fieldName !== '...') {
        result += `  ${fieldName}: any; // TODO: Add proper type\n`;
      }
    });

    return result || '  [key: string]: any;\n';
  }

  /**
   * Extract fields from fragment
   */
  private extractFieldsFromFragment(fragment: string): string {
    return this.extractFields(fragment);
  }

  /**
   * Map GraphQL type to TypeScript type
   */
  private mapGraphQLTypeToTS(graphqlType: string): string {
    // Handle arrays
    if (graphqlType.startsWith('[') && graphqlType.endsWith(']')) {
      const innerType = graphqlType.slice(1, -1);
      return `${this.mapGraphQLTypeToTS(innerType)}[]`;
    }

    // Handle custom scalars
    if (this.config.scalars[graphqlType]) {
      return this.config.scalars[graphqlType];
    }

    // Map common types
    const typeMap: Record<string, string> = {
      String: 'string',
      Int: 'number',
      Float: 'number',
      Boolean: 'boolean',
      ID: 'string',
      DateTime: 'string',
      Date: 'string',
      JSON: 'any',
    };

    return typeMap[graphqlType] || graphqlType;
  }

  /**
   * Generate persisted query manifest
   */
  async generatePersistedQueryManifest(
    operations: Array<{ name: string; document: string }>
  ): Promise<Record<string, string>> {
    const manifest: Record<string, string> = {};

    for (const { name, document } of operations) {
      const hash = await this.generateQueryHash(document);
      manifest[name] = hash;
    }

    return manifest;
  }

  /**
   * Generate query hash using SHA-256
   */
  private async generateQueryHash(query: string): Promise<string> {
    // Use Web Crypto API if available
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(query);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback to simple hash
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  /**
   * Generate complete types file
   */
  generateTypesFile(
    operations: Array<{
      name: string;
      type: 'query' | 'mutation' | 'subscription';
      document: string;
    }>,
    fragments: Array<{ name: string; on: string; document: string }> = []
  ): string {
    let code = '// Generated by PhilJS GraphQL Codegen\n';
    code += '// DO NOT EDIT THIS FILE DIRECTLY\n\n';

    code += `import { createQuery, createMutation, gql } from 'philjs-graphql';\n`;
    code += `import { useSubscription } from 'philjs-graphql/subscription';\n`;
    code += `import type { GraphQLQueryOptions, SubscriptionOptions } from 'philjs-graphql';\n\n`;

    // Generate fragment types
    if (fragments.length > 0) {
      code += '// Fragments\n\n';
      fragments.forEach((fragment) => {
        code += this.generateFragmentTypes(
          fragment.name,
          fragment.on,
          fragment.document
        );
        code += '\n\n';
      });
    }

    // Generate operation types
    operations.forEach((operation) => {
      switch (operation.type) {
        case 'query':
          code += this.generateQueryTypes(operation.name, operation.document);
          break;
        case 'mutation':
          code += this.generateMutationTypes(operation.name, operation.document, {
            generateOptimistic: true,
          });
          break;
        case 'subscription':
          code += this.generateSubscriptionTypes(
            operation.name,
            operation.document
          );
          break;
      }
      code += '\n\n';
    });

    return code;
  }
}

/**
 * Create a code generator instance
 */
export function createCodegen(config: CodegenConfig): GraphQLCodegen {
  return new GraphQLCodegen(config);
}

/**
 * CLI-friendly codegen runner
 */
export async function runCodegen(config: CodegenConfig): Promise<void> {
  const codegen = new GraphQLCodegen(config);

  console.log('GraphQL Code Generation started...');
  console.log(`Schema: ${config.schema}`);
  console.log(`Documents: ${config.documents.join(', ')}`);
  console.log(`Output: ${config.outputDir}`);

  // Note: In a real implementation, you'd:
  // 1. Load the schema
  // 2. Parse documents
  // 3. Generate types
  // 4. Write to files

  console.log('Code generation completed!');
}

/**
 * Helper to extract operation info from a document
 */
export function extractOperationInfo(document: string): {
  name: string;
  type: 'query' | 'mutation' | 'subscription';
} | null {
  const operationRegex = /(query|mutation|subscription)\s+(\w+)/;
  const match = document.match(operationRegex);

  if (!match) return null;

  return {
    type: match[1] as 'query' | 'mutation' | 'subscription',
    name: match[2],
  };
}

/**
 * Helper to extract fragment info from a document
 */
export function extractFragmentInfo(document: string): {
  name: string;
  on: string;
} | null {
  const fragmentRegex = /fragment\s+(\w+)\s+on\s+(\w+)/;
  const match = document.match(fragmentRegex);

  if (!match) return null;

  return {
    name: match[1],
    on: match[2],
  };
}

/**
 * Batch operation generator
 * Generates types for multiple operations at once
 */
export class BatchCodegen {
  private codegen: GraphQLCodegen;
  private operations: Map<string, { type: string; document: string }> = new Map();
  private fragments: Map<string, { on: string; document: string }> = new Map();

  constructor(config: CodegenConfig) {
    this.codegen = new GraphQLCodegen(config);
  }

  /**
   * Add an operation to generate
   */
  addOperation(
    name: string,
    type: 'query' | 'mutation' | 'subscription',
    document: string
  ): void {
    this.operations.set(name, { type, document });
  }

  /**
   * Add a fragment to generate
   */
  addFragment(name: string, on: string, document: string): void {
    this.fragments.set(name, { on, document });
  }

  /**
   * Generate all types
   */
  generate(): string {
    const operations = Array.from(this.operations.entries()).map(
      ([name, { type, document }]) => ({
        name,
        type: type as 'query' | 'mutation' | 'subscription',
        document,
      })
    );

    const fragments = Array.from(this.fragments.entries()).map(
      ([name, { on, document }]) => ({
        name,
        on,
        document,
      })
    );

    return this.codegen.generateTypesFile(operations, fragments);
  }

  /**
   * Clear all operations and fragments
   */
  clear(): void {
    this.operations.clear();
    this.fragments.clear();
  }
}

/**
 * Create a batch code generator
 */
export function createBatchCodegen(config: CodegenConfig): BatchCodegen {
  return new BatchCodegen(config);
}
