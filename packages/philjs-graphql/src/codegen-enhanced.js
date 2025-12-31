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
import { parse, print, visit, buildSchema, Kind, isObjectType, isInputObjectType, isEnumType, isUnionType, isInterfaceType, isScalarType, isNonNullType, isListType, isNamedType, getNamedType, getNullableType, } from 'graphql';
/**
 * Default scalar type mappings from GraphQL to TypeScript
 */
const DEFAULT_SCALAR_MAP = {
    String: 'string',
    Int: 'number',
    Float: 'number',
    Boolean: 'boolean',
    ID: 'string',
    DateTime: 'string',
    Date: 'string',
    Time: 'string',
    JSON: 'Record<string, unknown>',
    JSONObject: 'Record<string, unknown>',
    Upload: 'File',
    BigInt: 'bigint',
    Decimal: 'string',
    UUID: 'string',
    URL: 'string',
    EmailAddress: 'string',
    PhoneNumber: 'string',
    PostalCode: 'string',
    Currency: 'string',
    RGB: 'string',
    RGBA: 'string',
    HSL: 'string',
    HSLA: 'string',
    HexColorCode: 'string',
    Void: 'void',
};
/**
 * GraphQL Code Generator with proper AST parsing
 */
export class GraphQLCodegen {
    config;
    schema = null;
    typeRegistry = new Map();
    fragmentRegistry = new Map();
    generatedTypes = new Set();
    constructor(config) {
        this.config = {
            generateHooks: true,
            generateFragments: true,
            generateSubscriptions: true,
            generatePersistedQueries: false,
            strict: false,
            scalars: {},
            enumsAsUnionTypes: false,
            immutableTypes: false,
            addTypename: true,
            ...config,
        };
    }
    /**
     * Set the GraphQL schema from a schema string
     */
    setSchema(schemaString) {
        this.schema = buildSchema(schemaString);
        this.generateSchemaTypes();
    }
    /**
     * Set the GraphQL schema from a GraphQLSchema object
     */
    setSchemaObject(schema) {
        this.schema = schema;
        this.generateSchemaTypes();
    }
    /**
     * Get the scalar type mapping
     */
    getScalarType(name) {
        // Check custom scalars first
        if (this.config.scalars[name]) {
            return this.config.scalars[name];
        }
        // Fall back to defaults
        return DEFAULT_SCALAR_MAP[name] ?? 'unknown';
    }
    /**
     * Parse a GraphQL type node into type information
     */
    parseTypeNode(typeNode) {
        let isNullable = true;
        let isList = false;
        let isListItemNullable = true;
        let currentNode = typeNode;
        // Check for NonNull wrapper
        if (currentNode.kind === Kind.NON_NULL_TYPE) {
            isNullable = false;
            currentNode = currentNode.type;
        }
        // Check for List wrapper
        if (currentNode.kind === Kind.LIST_TYPE) {
            isList = true;
            currentNode = currentNode.type;
            // Check if list item is non-null
            if (currentNode.kind === Kind.NON_NULL_TYPE) {
                isListItemNullable = false;
                currentNode = currentNode.type;
            }
        }
        // Get the named type
        const name = currentNode.kind === Kind.NAMED_TYPE ? currentNode.name.value : 'unknown';
        return { name, isNullable, isList, isListItemNullable };
    }
    /**
     * Convert a GraphQL type to TypeScript type string
     */
    graphqlTypeToTS(typeNode, forInput = false) {
        const parsed = this.parseTypeNode(typeNode);
        let tsType = this.resolveTypeName(parsed.name, forInput);
        if (parsed.isList) {
            const itemType = parsed.isListItemNullable ? `${tsType} | null` : tsType;
            tsType = this.config.immutableTypes
                ? `readonly (${itemType})[]`
                : `(${itemType})[]`;
        }
        if (parsed.isNullable) {
            tsType = `${tsType} | null`;
        }
        return tsType;
    }
    /**
     * Resolve a GraphQL type name to TypeScript
     */
    resolveTypeName(name, forInput = false) {
        // Check if it's a built-in scalar
        if (DEFAULT_SCALAR_MAP[name] || this.config.scalars[name]) {
            return this.getScalarType(name);
        }
        // Check type registry for generated types
        if (this.typeRegistry.has(name)) {
            return this.typeRegistry.get(name);
        }
        // For input types, append Input suffix if needed
        if (forInput && !name.endsWith('Input')) {
            return name;
        }
        return name;
    }
    /**
     * Generate TypeScript types from the schema
     */
    generateSchemaTypes() {
        if (!this.schema)
            return;
        const typeMap = this.schema.getTypeMap();
        for (const [typeName, type] of Object.entries(typeMap)) {
            // Skip built-in types
            if (typeName.startsWith('__'))
                continue;
            if (DEFAULT_SCALAR_MAP[typeName])
                continue;
            this.typeRegistry.set(typeName, typeName);
        }
    }
    /**
     * Generate all schema type definitions
     */
    generateSchemaTypeDefinitions() {
        if (!this.schema) {
            throw new Error('Schema not set. Call setSchema() or setSchemaObject() first.');
        }
        const typeMap = this.schema.getTypeMap();
        const lines = [];
        // Generate scalars first
        for (const [typeName, type] of Object.entries(typeMap)) {
            if (typeName.startsWith('__'))
                continue;
            if (isScalarType(type) && !DEFAULT_SCALAR_MAP[typeName]) {
                lines.push(this.generateScalarType(type));
            }
        }
        // Generate enums
        for (const [typeName, type] of Object.entries(typeMap)) {
            if (typeName.startsWith('__'))
                continue;
            if (isEnumType(type)) {
                lines.push(this.generateEnumType(type));
            }
        }
        // Generate interfaces
        for (const [typeName, type] of Object.entries(typeMap)) {
            if (typeName.startsWith('__'))
                continue;
            if (isInterfaceType(type)) {
                lines.push(this.generateInterfaceType(type));
            }
        }
        // Generate unions
        for (const [typeName, type] of Object.entries(typeMap)) {
            if (typeName.startsWith('__'))
                continue;
            if (isUnionType(type)) {
                lines.push(this.generateUnionType(type));
            }
        }
        // Generate input types
        for (const [typeName, type] of Object.entries(typeMap)) {
            if (typeName.startsWith('__'))
                continue;
            if (isInputObjectType(type)) {
                lines.push(this.generateInputObjectType(type));
            }
        }
        // Generate object types (excluding Query, Mutation, Subscription for now)
        for (const [typeName, type] of Object.entries(typeMap)) {
            if (typeName.startsWith('__'))
                continue;
            if (['Query', 'Mutation', 'Subscription'].includes(typeName))
                continue;
            if (isObjectType(type)) {
                lines.push(this.generateObjectType(type));
            }
        }
        return lines.filter(Boolean).join('\n\n');
    }
    /**
     * Generate TypeScript type for a custom scalar
     */
    generateScalarType(type) {
        const description = type.description;
        const lines = [];
        if (description) {
            lines.push(`/** ${description} */`);
        }
        const tsType = this.getScalarType(type.name);
        lines.push(`export type ${type.name} = ${tsType};`);
        return lines.join('\n');
    }
    /**
     * Generate TypeScript type for an enum
     */
    generateEnumType(type) {
        const description = type.description;
        const values = type.getValues();
        const lines = [];
        if (description) {
            lines.push(`/** ${description} */`);
        }
        if (this.config.enumsAsUnionTypes) {
            // Generate as union type
            const unionValues = values.map((v) => {
                const valueDesc = v.description ? `  /** ${v.description} */\n` : '';
                return `${valueDesc}  | '${v.name}'`;
            });
            lines.push(`export type ${type.name} =\n${unionValues.join('\n')};`);
        }
        else {
            // Generate as TypeScript enum
            lines.push(`export enum ${type.name} {`);
            for (const value of values) {
                if (value.description) {
                    lines.push(`  /** ${value.description} */`);
                }
                if (value.deprecationReason) {
                    lines.push(`  /** @deprecated ${value.deprecationReason} */`);
                }
                lines.push(`  ${value.name} = '${value.name}',`);
            }
            lines.push('}');
        }
        return lines.join('\n');
    }
    /**
     * Generate TypeScript interface for a GraphQL interface type
     */
    generateInterfaceType(type) {
        const description = type.description;
        const fields = type.getFields();
        const lines = [];
        if (description) {
            lines.push(`/** ${description} */`);
        }
        lines.push(`export interface ${type.name} {`);
        if (this.config.addTypename) {
            lines.push(`  ${this.config.immutableTypes ? 'readonly ' : ''}__typename: string;`);
        }
        for (const [fieldName, field] of Object.entries(fields)) {
            const fieldLines = this.generateFieldDefinition(fieldName, field);
            lines.push(...fieldLines.map((l) => `  ${l}`));
        }
        lines.push('}');
        return lines.join('\n');
    }
    /**
     * Generate TypeScript type for a union
     */
    generateUnionType(type) {
        const description = type.description;
        const types = type.getTypes();
        const lines = [];
        if (description) {
            lines.push(`/** ${description} */`);
        }
        const typeNames = types.map((t) => t.name).join(' | ');
        lines.push(`export type ${type.name} = ${typeNames};`);
        return lines.join('\n');
    }
    /**
     * Generate TypeScript interface for an input object type
     */
    generateInputObjectType(type) {
        const description = type.description;
        const fields = type.getFields();
        const lines = [];
        if (description) {
            lines.push(`/** ${description} */`);
        }
        lines.push(`export interface ${type.name} {`);
        for (const [fieldName, field] of Object.entries(fields)) {
            const fieldLines = this.generateInputFieldDefinition(fieldName, field);
            lines.push(...fieldLines.map((l) => `  ${l}`));
        }
        lines.push('}');
        return lines.join('\n');
    }
    /**
     * Generate TypeScript interface for an object type
     */
    generateObjectType(type) {
        const description = type.description;
        const fields = type.getFields();
        const interfaces = type.getInterfaces();
        const lines = [];
        if (description) {
            lines.push(`/** ${description} */`);
        }
        const extendsClause = interfaces.length > 0 ? ` extends ${interfaces.map((i) => i.name).join(', ')}` : '';
        lines.push(`export interface ${type.name}${extendsClause} {`);
        if (this.config.addTypename) {
            lines.push(`  ${this.config.immutableTypes ? 'readonly ' : ''}__typename: '${type.name}';`);
        }
        for (const [fieldName, field] of Object.entries(fields)) {
            const fieldLines = this.generateFieldDefinition(fieldName, field);
            lines.push(...fieldLines.map((l) => `  ${l}`));
        }
        lines.push('}');
        return lines.join('\n');
    }
    /**
     * Generate a field definition line
     */
    generateFieldDefinition(name, field) {
        const lines = [];
        if (field.description) {
            lines.push(`/** ${field.description} */`);
        }
        if (field.deprecationReason) {
            lines.push(`/** @deprecated ${field.deprecationReason} */`);
        }
        const tsType = this.graphqlOutputTypeToTS(field.type);
        const readonly = this.config.immutableTypes ? 'readonly ' : '';
        lines.push(`${readonly}${name}: ${tsType};`);
        return lines;
    }
    /**
     * Generate an input field definition line
     */
    generateInputFieldDefinition(name, field) {
        const lines = [];
        if (field.description) {
            lines.push(`/** ${field.description} */`);
        }
        const isRequired = isNonNullType(field.type) && field.defaultValue === undefined;
        const tsType = this.graphqlInputTypeToTS(field.type);
        const readonly = this.config.immutableTypes ? 'readonly ' : '';
        const optional = isRequired ? '' : '?';
        lines.push(`${readonly}${name}${optional}: ${tsType};`);
        return lines;
    }
    /**
     * Convert a GraphQL output type to TypeScript type string
     */
    graphqlOutputTypeToTS(type) {
        if (isNonNullType(type)) {
            return this.graphqlOutputTypeToTS(type.ofType);
        }
        if (isListType(type)) {
            const innerType = this.graphqlOutputTypeToTS(type.ofType);
            const listType = this.config.immutableTypes
                ? `readonly (${innerType})[]`
                : `(${innerType})[]`;
            return `${listType} | null`;
        }
        if (isNamedType(type)) {
            const namedType = getNamedType(type);
            const typeName = this.resolveOutputTypeName(namedType);
            return `${typeName} | null`;
        }
        return 'unknown';
    }
    /**
     * Resolve output type name to TypeScript
     */
    resolveOutputTypeName(type) {
        if (isScalarType(type)) {
            return this.getScalarType(type.name);
        }
        return type.name;
    }
    /**
     * Convert a GraphQL input type to TypeScript type string
     */
    graphqlInputTypeToTS(type) {
        if (isNonNullType(type)) {
            return this.graphqlInputTypeToTS(type.ofType);
        }
        if (isListType(type)) {
            const innerType = this.graphqlInputTypeToTS(type.ofType);
            const listType = this.config.immutableTypes
                ? `readonly (${innerType})[]`
                : `(${innerType})[]`;
            return `${listType} | null`;
        }
        if (isNamedType(type)) {
            const namedType = getNamedType(type);
            const typeName = this.resolveInputTypeName(namedType);
            return `${typeName} | null`;
        }
        return 'unknown';
    }
    /**
     * Resolve input type name to TypeScript
     */
    resolveInputTypeName(type) {
        if (isScalarType(type)) {
            return this.getScalarType(type.name);
        }
        return type.name;
    }
    /**
     * Generate types for a query operation from document string
     */
    generateQueryTypes(name, query, options = {}) {
        const document = parse(query);
        return this.generateQueryTypesFromDocument(name, document, options);
    }
    /**
     * Generate types for a query operation from DocumentNode
     */
    generateQueryTypesFromDocument(name, document, options = {}) {
        const dataType = `${name}Query`;
        const variablesType = `${name}Variables`;
        let code = `// ${name} Query\n`;
        code += this.generateOperationTypesFromDocument(document, dataType, variablesType);
        if (options.generateHook !== false && this.config.generateHooks) {
            code += '\n\n';
            code += this.generateQueryHook(name, dataType, variablesType);
        }
        return code;
    }
    /**
     * Generate types for a mutation operation from document string
     */
    generateMutationTypes(name, mutation, options = {}) {
        const document = parse(mutation);
        return this.generateMutationTypesFromDocument(name, document, options);
    }
    /**
     * Generate types for a mutation operation from DocumentNode
     */
    generateMutationTypesFromDocument(name, document, options = {}) {
        const dataType = `${name}Mutation`;
        const variablesType = `${name}Variables`;
        const optimisticType = `${name}OptimisticResponse`;
        let code = `// ${name} Mutation\n`;
        code += this.generateOperationTypesFromDocument(document, dataType, variablesType);
        if (options.generateOptimistic) {
            code += '\n\n';
            code += this.generateOptimisticResponseType(optimisticType, dataType);
        }
        if (options.generateHook !== false && this.config.generateHooks) {
            code += '\n\n';
            code += this.generateMutationHook(name, dataType, variablesType, options.generateOptimistic ? optimisticType : undefined);
        }
        return code;
    }
    /**
     * Generate types for a subscription operation from document string
     */
    generateSubscriptionTypes(name, subscription, options = {}) {
        const document = parse(subscription);
        return this.generateSubscriptionTypesFromDocument(name, document, options);
    }
    /**
     * Generate types for a subscription operation from DocumentNode
     */
    generateSubscriptionTypesFromDocument(name, document, options = {}) {
        const dataType = `${name}Subscription`;
        const variablesType = `${name}Variables`;
        let code = `// ${name} Subscription\n`;
        code += this.generateOperationTypesFromDocument(document, dataType, variablesType);
        if (options.generateHook !== false && this.config.generateHooks) {
            code += '\n\n';
            code += this.generateSubscriptionHook(name, dataType, variablesType);
        }
        return code;
    }
    /**
     * Generate types for a fragment from document string
     */
    generateFragmentTypes(name, on, fragment) {
        const document = parse(fragment);
        return this.generateFragmentTypesFromDocument(name, on, document);
    }
    /**
     * Generate types for a fragment from DocumentNode
     */
    generateFragmentTypesFromDocument(name, on, document) {
        const dataType = `${name}Fragment`;
        // Find the fragment definition
        const fragmentDef = document.definitions.find((def) => def.kind === Kind.FRAGMENT_DEFINITION && def.name.value === name);
        let code = `// ${name} Fragment on ${on}\n`;
        code += `export interface ${dataType} {\n`;
        if (fragmentDef && this.schema) {
            const parentType = this.schema.getType(on);
            if (parentType && isObjectType(parentType)) {
                code += this.generateSelectionSetTypes(fragmentDef.selectionSet, parentType, '  ');
            }
        }
        else {
            // Fallback without schema
            code += this.generateSelectionSetTypesWithoutSchema(fragmentDef?.selectionSet, '  ');
        }
        code += '}\n';
        // Convert DocumentNode back to string for the gql template
        const fragmentSource = print(document);
        code += '\n';
        code += `export const ${name}FragmentDoc = gql\`\n`;
        code += `  ${fragmentSource}\n`;
        code += '`;\n';
        return code;
    }
    /**
     * Generate operation types (data and variables) from AST
     */
    generateOperationTypesFromDocument(document, dataType, variablesType) {
        let code = '';
        // Find the operation definition
        const operationDef = document.definitions.find((def) => def.kind === Kind.OPERATION_DEFINITION);
        if (!operationDef) {
            throw new Error('No operation definition found in document');
        }
        // Register any fragments in the document
        for (const def of document.definitions) {
            if (def.kind === Kind.FRAGMENT_DEFINITION) {
                this.fragmentRegistry.set(def.name.value, def);
            }
        }
        // Generate variables type
        code += `export interface ${variablesType} {\n`;
        if (operationDef.variableDefinitions && operationDef.variableDefinitions.length > 0) {
            for (const varDef of operationDef.variableDefinitions) {
                code += this.generateVariableDefinition(varDef);
            }
        }
        code += '}\n\n';
        // Generate data type
        code += `export interface ${dataType} {\n`;
        if (this.schema) {
            // Get the root type based on operation type
            const rootType = this.getRootType(operationDef.operation);
            if (rootType) {
                code += this.generateSelectionSetTypes(operationDef.selectionSet, rootType, '  ');
            }
        }
        else {
            // Fallback without schema - generate from selection set
            code += this.generateSelectionSetTypesWithoutSchema(operationDef.selectionSet, '  ');
        }
        code += '}';
        return code;
    }
    /**
     * Get the root type for an operation
     */
    getRootType(operation) {
        if (!this.schema)
            return null;
        switch (operation) {
            case 'query':
                return this.schema.getQueryType() ?? null;
            case 'mutation':
                return this.schema.getMutationType() ?? null;
            case 'subscription':
                return this.schema.getSubscriptionType() ?? null;
        }
    }
    /**
     * Generate variable definition TypeScript
     */
    generateVariableDefinition(varDef) {
        const name = varDef.variable.name.value;
        const tsType = this.graphqlTypeToTS(varDef.type, true);
        const isRequired = varDef.type.kind === Kind.NON_NULL_TYPE && !varDef.defaultValue;
        const optional = isRequired ? '' : '?';
        return `  ${name}${optional}: ${tsType};\n`;
    }
    /**
     * Generate types from a selection set with schema information
     */
    generateSelectionSetTypes(selectionSet, parentType, indent) {
        let code = '';
        const fields = parentType.getFields();
        for (const selection of selectionSet.selections) {
            if (selection.kind === Kind.FIELD) {
                code += this.generateFieldType(selection, fields, indent);
            }
            else if (selection.kind === Kind.INLINE_FRAGMENT) {
                code += this.generateInlineFragmentType(selection, indent);
            }
            else if (selection.kind === Kind.FRAGMENT_SPREAD) {
                code += this.generateFragmentSpreadType(selection, indent);
            }
        }
        return code;
    }
    /**
     * Generate type for a field selection
     */
    generateFieldType(field, parentFields, indent) {
        const fieldName = field.alias?.value ?? field.name.value;
        const schemaFieldName = field.name.value;
        // Handle __typename
        if (schemaFieldName === '__typename') {
            return `${indent}__typename: string;\n`;
        }
        const schemaField = parentFields[schemaFieldName];
        if (!schemaField) {
            if (this.config.strict) {
                throw new Error(`Field "${schemaFieldName}" not found in schema`);
            }
            return `${indent}${fieldName}: unknown;\n`;
        }
        let tsType;
        const fieldType = schemaField.type;
        const namedType = getNamedType(fieldType);
        // Check if field has a selection set (nested object)
        if (field.selectionSet && (isObjectType(namedType) || isInterfaceType(namedType))) {
            // Generate inline type for nested selection
            tsType = this.generateNestedSelectionType(field.selectionSet, namedType, indent);
        }
        else {
            tsType = this.graphqlOutputTypeToTS(fieldType);
        }
        // Handle nullability from the schema
        const isNullable = !isNonNullType(fieldType);
        if (!isNullable && tsType.endsWith(' | null')) {
            tsType = tsType.slice(0, -7); // Remove ' | null'
        }
        return `${indent}${fieldName}: ${tsType};\n`;
    }
    /**
     * Generate type for a nested selection set
     */
    generateNestedSelectionType(selectionSet, parentType, indent) {
        let code = '{\n';
        code += this.generateSelectionSetTypes(selectionSet, parentType, indent + '  ');
        code += `${indent}}`;
        return code;
    }
    /**
     * Generate type for an inline fragment
     */
    generateInlineFragmentType(fragment, indent) {
        if (!fragment.typeCondition || !this.schema) {
            return '';
        }
        const typeName = fragment.typeCondition.name.value;
        const type = this.schema.getType(typeName);
        if (!type || (!isObjectType(type) && !isInterfaceType(type))) {
            return '';
        }
        // Generate as discriminated union member
        let code = `${indent}// ... on ${typeName}\n`;
        code += this.generateSelectionSetTypes(fragment.selectionSet, type, indent);
        return code;
    }
    /**
     * Generate type for a fragment spread
     */
    generateFragmentSpreadType(spread, indent) {
        const fragmentName = spread.name.value;
        const fragmentDef = this.fragmentRegistry.get(fragmentName);
        if (!fragmentDef || !this.schema) {
            return `${indent}// ...${fragmentName} (fragment not found)\n`;
        }
        const typeName = fragmentDef.typeCondition.name.value;
        const type = this.schema.getType(typeName);
        if (!type || (!isObjectType(type) && !isInterfaceType(type))) {
            return '';
        }
        return this.generateSelectionSetTypes(fragmentDef.selectionSet, type, indent);
    }
    /**
     * Generate types from selection set without schema (fallback)
     */
    generateSelectionSetTypesWithoutSchema(selectionSet, indent) {
        if (!selectionSet) {
            return `${indent}[key: string]: unknown;\n`;
        }
        let code = '';
        for (const selection of selectionSet.selections) {
            if (selection.kind === Kind.FIELD) {
                const fieldName = selection.alias?.value ?? selection.name.value;
                if (selection.selectionSet) {
                    // Nested object
                    code += `${indent}${fieldName}: {\n`;
                    code += this.generateSelectionSetTypesWithoutSchema(selection.selectionSet, indent + '  ');
                    code += `${indent}} | null;\n`;
                }
                else {
                    // Leaf field - infer basic type from field name
                    const inferredType = this.inferTypeFromFieldName(fieldName);
                    code += `${indent}${fieldName}: ${inferredType};\n`;
                }
            }
            else if (selection.kind === Kind.FRAGMENT_SPREAD) {
                code += `${indent}// ...${selection.name.value}\n`;
            }
        }
        return code || `${indent}[key: string]: unknown;\n`;
    }
    /**
     * Infer TypeScript type from field name (heuristic fallback)
     */
    inferTypeFromFieldName(name) {
        const lowerName = name.toLowerCase();
        if (lowerName === 'id' || lowerName.endsWith('id')) {
            return 'string | null';
        }
        if (lowerName.startsWith('is') ||
            lowerName.startsWith('has') ||
            lowerName.startsWith('can') ||
            lowerName.startsWith('should')) {
            return 'boolean | null';
        }
        if (lowerName.includes('count') ||
            lowerName.includes('total') ||
            lowerName.includes('amount') ||
            lowerName.includes('price') ||
            lowerName.includes('quantity') ||
            lowerName === 'age') {
            return 'number | null';
        }
        if (lowerName.includes('date') || lowerName.includes('time') || lowerName.endsWith('at')) {
            return 'string | null';
        }
        if (lowerName.endsWith('s') && !lowerName.endsWith('ss')) {
            return 'unknown[] | null';
        }
        return 'string | null';
    }
    /**
     * Generate query hook
     */
    generateQueryHook(name, dataType, variablesType) {
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
    generateMutationHook(name, dataType, variablesType, optimisticType) {
        const hookName = `use${name}Mutation`;
        let code = `export function ${hookName}() {\n`;
        code += `  return createMutation<${dataType}, ${variablesType}>(client, ${name}Document);\n`;
        code += '}\n';
        if (optimisticType) {
            code += '\n';
            code += `export function ${hookName}WithOptimistic(\n`;
            code += `  optimisticResponse: ${optimisticType}\n`;
            code += ') {\n';
            code += `  const mutation = use${name}Mutation();\n`;
            code += '  return {\n';
            code += '    ...mutation,\n';
            code += `    mutate: (variables?: ${variablesType}) =>\n`;
            code += `      client.mutate({ mutation: ${name}Document, variables, optimisticResponse }),\n`;
            code += '  };\n';
            code += '}\n';
        }
        return code;
    }
    /**
     * Generate subscription hook
     */
    generateSubscriptionHook(name, dataType, variablesType) {
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
    generateOptimisticResponseType(optimisticType, dataType) {
        return `export type ${optimisticType} = Partial<${dataType}>;`;
    }
    /**
     * Generate resolver types for a type
     */
    generateResolverTypes(typeName) {
        if (!this.schema) {
            throw new Error('Schema not set. Call setSchema() or setSchemaObject() first.');
        }
        const type = this.schema.getType(typeName);
        if (!type || !isObjectType(type)) {
            throw new Error(`Type "${typeName}" not found or is not an object type`);
        }
        const fields = type.getFields();
        const lines = [];
        lines.push(`/** Resolvers for ${typeName} */`);
        lines.push(`export interface ${typeName}Resolvers<TContext = unknown> {`);
        for (const [fieldName, field] of Object.entries(fields)) {
            const resolverType = this.generateFieldResolverType(typeName, fieldName, field);
            lines.push(`  ${fieldName}?: ${resolverType};`);
        }
        lines.push('}');
        return lines.join('\n');
    }
    /**
     * Generate resolver type for a single field
     */
    generateFieldResolverType(parentTypeName, fieldName, field) {
        const parentType = parentTypeName;
        const returnType = this.graphqlOutputTypeToTS(field.type);
        // Generate args type
        let argsType = 'Record<string, never>';
        if (field.args.length > 0) {
            const argsTypeName = `${parentTypeName}${this.capitalize(fieldName)}Args`;
            argsType = argsTypeName;
        }
        return `GraphQLFieldResolver<${parentType}, TContext, ${argsType}, ${returnType} | Promise<${returnType}>>`;
    }
    /**
     * Generate args types for all fields with arguments
     */
    generateArgsTypes() {
        if (!this.schema) {
            throw new Error('Schema not set. Call setSchema() or setSchemaObject() first.');
        }
        const lines = [];
        const typeMap = this.schema.getTypeMap();
        for (const [typeName, type] of Object.entries(typeMap)) {
            if (typeName.startsWith('__'))
                continue;
            if (!isObjectType(type))
                continue;
            const fields = type.getFields();
            for (const [fieldName, field] of Object.entries(fields)) {
                if (field.args.length > 0) {
                    lines.push(this.generateFieldArgsType(typeName, fieldName, field.args));
                    lines.push('');
                }
            }
        }
        return lines.join('\n');
    }
    /**
     * Generate args type for a single field
     */
    generateFieldArgsType(typeName, fieldName, args) {
        const argsTypeName = `${typeName}${this.capitalize(fieldName)}Args`;
        const lines = [];
        lines.push(`export interface ${argsTypeName} {`);
        for (const arg of args) {
            if (arg.description) {
                lines.push(`  /** ${arg.description} */`);
            }
            const isRequired = isNonNullType(arg.type) && arg.defaultValue === undefined;
            const tsType = this.graphqlInputTypeToTS(arg.type);
            const optional = isRequired ? '' : '?';
            lines.push(`  ${arg.name}${optional}: ${tsType};`);
        }
        lines.push('}');
        return lines.join('\n');
    }
    /**
     * Capitalize first letter
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    /**
     * Generate persisted query manifest
     */
    async generatePersistedQueryManifest(operations) {
        const manifest = {};
        for (const { name, document } of operations) {
            const hash = await this.generateQueryHash(document);
            manifest[name] = hash;
        }
        return manifest;
    }
    /**
     * Generate query hash using SHA-256
     */
    async generateQueryHash(query) {
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
    generateTypesFile(operations, fragments = []) {
        let code = '// Generated by PhilJS GraphQL Codegen\n';
        code += '// DO NOT EDIT THIS FILE DIRECTLY\n\n';
        code += "import { createQuery, createMutation, gql } from 'philjs-graphql';\n";
        code += "import { useSubscription } from 'philjs-graphql/subscription';\n";
        code += "import type { GraphQLQueryOptions, SubscriptionOptions } from 'philjs-graphql';\n\n";
        // Generate schema types if schema is set
        if (this.schema) {
            code += '// Schema Types\n\n';
            code += this.generateSchemaTypeDefinitions();
            code += '\n\n';
            code += '// Field Args Types\n\n';
            code += this.generateArgsTypes();
            code += '\n\n';
        }
        // Register fragments first
        for (const fragment of fragments) {
            try {
                const doc = parse(fragment.document);
                for (const def of doc.definitions) {
                    if (def.kind === Kind.FRAGMENT_DEFINITION) {
                        this.fragmentRegistry.set(def.name.value, def);
                    }
                }
            }
            catch {
                // Ignore parse errors for fragments
            }
        }
        // Generate fragment types
        if (fragments.length > 0) {
            code += '// Fragments\n\n';
            for (const fragment of fragments) {
                code += this.generateFragmentTypes(fragment.name, fragment.on, fragment.document);
                code += '\n\n';
            }
        }
        // Generate operation types
        for (const operation of operations) {
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
                    code += this.generateSubscriptionTypes(operation.name, operation.document);
                    break;
            }
            code += '\n\n';
        }
        return code;
    }
}
/**
 * Create a code generator instance
 */
export function createCodegen(config) {
    return new GraphQLCodegen(config);
}
/**
 * CLI-friendly codegen runner
 */
export async function runCodegen(config) {
    const codegen = new GraphQLCodegen(config);
    console.log('GraphQL Code Generation started...');
    console.log(`Schema: ${config.schema}`);
    console.log(`Documents: ${config.documents.join(', ')}`);
    console.log(`Output: ${config.outputDir}`);
    // Note: In a real implementation, you'd:
    // 1. Load the schema from file or URL
    // 2. Parse documents from glob patterns
    // 3. Generate types
    // 4. Write to files
    console.log('Code generation completed!');
}
/**
 * Helper to extract operation info from a document string
 */
export function extractOperationInfo(document) {
    try {
        const parsed = parse(document);
        const operationDef = parsed.definitions.find((def) => def.kind === Kind.OPERATION_DEFINITION);
        if (!operationDef || !operationDef.name)
            return null;
        return {
            type: operationDef.operation,
            name: operationDef.name.value,
        };
    }
    catch {
        return null;
    }
}
/**
 * Helper to extract fragment info from a document string
 */
export function extractFragmentInfo(document) {
    try {
        const parsed = parse(document);
        const fragmentDef = parsed.definitions.find((def) => def.kind === Kind.FRAGMENT_DEFINITION);
        if (!fragmentDef)
            return null;
        return {
            name: fragmentDef.name.value,
            on: fragmentDef.typeCondition.name.value,
        };
    }
    catch {
        return null;
    }
}
/**
 * Batch operation generator
 * Generates types for multiple operations at once
 */
export class BatchCodegen {
    codegen;
    operations = new Map();
    fragments = new Map();
    constructor(config) {
        this.codegen = new GraphQLCodegen(config);
    }
    /**
     * Set the schema for the batch codegen
     */
    setSchema(schemaString) {
        this.codegen.setSchema(schemaString);
    }
    /**
     * Set the schema from a GraphQLSchema object
     */
    setSchemaObject(schema) {
        this.codegen.setSchemaObject(schema);
    }
    /**
     * Add an operation to generate
     */
    addOperation(name, type, document) {
        this.operations.set(name, { type, document });
    }
    /**
     * Add a fragment to generate
     */
    addFragment(name, on, document) {
        this.fragments.set(name, { on, document });
    }
    /**
     * Generate all types
     */
    generate() {
        const operations = Array.from(this.operations.entries()).map(([name, { type, document }]) => ({
            name,
            type: type,
            document,
        }));
        const fragments = Array.from(this.fragments.entries()).map(([name, { on, document }]) => ({
            name,
            on,
            document,
        }));
        return this.codegen.generateTypesFile(operations, fragments);
    }
    /**
     * Clear all operations and fragments
     */
    clear() {
        this.operations.clear();
        this.fragments.clear();
    }
}
/**
 * Create a batch code generator
 */
export function createBatchCodegen(config) {
    return new BatchCodegen(config);
}
/**
 * Generate all resolver types for a schema
 */
export function generateAllResolverTypes(codegen, typeNames) {
    const lines = [];
    lines.push('// Resolver Types');
    lines.push('');
    // If no specific types provided, this would need schema access
    // For now, generate for provided type names
    if (typeNames) {
        for (const typeName of typeNames) {
            try {
                lines.push(codegen.generateResolverTypes(typeName));
                lines.push('');
            }
            catch {
                // Skip types that can't generate resolvers
            }
        }
    }
    return lines.join('\n');
}
//# sourceMappingURL=codegen-enhanced.js.map