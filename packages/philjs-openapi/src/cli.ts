#!/usr/bin/env node

/**
 * PhilJS OpenAPI - CLI Tool
 *
 * Generate TypeScript types and API clients from OpenAPI specifications.
 *
 * Usage:
 *   philjs-openapi generate --input openapi.json --output types.ts
 *   philjs-openapi generate --input https://api.example.com/openapi.json --output types.ts
 *   philjs-openapi generate --input openapi.json --output types.ts --client --zod
 */

import type {
  OpenAPISpec,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPIRequestBody,
  OpenAPIResponse,
  JSONSchema,
  TypeGenerationOptions,
  GeneratedTypes,
} from './types';

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface CLIArgs {
  command: 'generate' | 'help' | 'version';
  input?: string;
  output?: string;
  generateClient?: boolean;
  generateZod?: boolean;
  typePrefix?: string;
  typeSuffix?: string;
  enumsAsUnion?: boolean;
  readonlyTypes?: boolean;
}

function parseArgs(args: string[]): CLIArgs {
  const result: CLIArgs = { command: 'help' };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case 'generate':
        result.command = 'generate';
        break;
      case 'help':
      case '--help':
      case '-h':
        result.command = 'help';
        break;
      case 'version':
      case '--version':
      case '-v':
        result.command = 'version';
        break;
      case '--input':
      case '-i':
        result.input = args[++i];
        break;
      case '--output':
      case '-o':
        result.output = args[++i];
        break;
      case '--client':
        result.generateClient = true;
        break;
      case '--zod':
        result.generateZod = true;
        break;
      case '--prefix':
        result.typePrefix = args[++i];
        break;
      case '--suffix':
        result.typeSuffix = args[++i];
        break;
      case '--enums-as-union':
        result.enumsAsUnion = true;
        break;
      case '--readonly':
        result.readonlyTypes = true;
        break;
    }
    i++;
  }

  return result;
}

function printHelp(): void {
  console.log(`
PhilJS OpenAPI CLI - Generate TypeScript types from OpenAPI specifications

Usage:
  philjs-openapi <command> [options]

Commands:
  generate     Generate TypeScript types from an OpenAPI spec
  help         Show this help message
  version      Show version number

Options for generate:
  --input, -i <path>     Input OpenAPI spec file or URL (required)
  --output, -o <path>    Output TypeScript file path (required)
  --client               Generate API client functions
  --zod                  Generate Zod schemas
  --prefix <prefix>      Prefix for type names
  --suffix <suffix>      Suffix for type names
  --enums-as-union       Generate enums as union types
  --readonly             Generate readonly types

Examples:
  philjs-openapi generate -i openapi.json -o types.ts
  philjs-openapi generate -i https://api.example.com/openapi.json -o ./src/api/types.ts
  philjs-openapi generate -i openapi.json -o types.ts --client --zod
`);
}

function printVersion(): void {
  console.log('philjs-openapi v2.0.0');
}

// ============================================================================
// Type Generation
// ============================================================================

/**
 * Convert JSON Schema type to TypeScript type
 */
function jsonSchemaToTS(schema: JSONSchema, options: TypeGenerationOptions): string {
  const { readonlyTypes, enumsAsUnion } = options;
  const readonly = readonlyTypes ? 'readonly ' : '';

  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop() || 'unknown';
    return formatTypeName(refName, options);
  }

  if (schema.oneOf) {
    return schema.oneOf.map((s) => jsonSchemaToTS(s, options)).join(' | ');
  }

  if (schema.anyOf) {
    return schema.anyOf.map((s) => jsonSchemaToTS(s, options)).join(' | ');
  }

  if (schema.allOf) {
    return schema.allOf.map((s) => jsonSchemaToTS(s, options)).join(' & ');
  }

  if (schema.enum) {
    if (enumsAsUnion || schema.type === 'string') {
      return schema.enum.map((v) => JSON.stringify(v)).join(' | ');
    }
    return 'unknown';
  }

  if (schema.const !== undefined) {
    return JSON.stringify(schema.const);
  }

  switch (schema.type) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    case 'array':
      if (schema.items) {
        if (Array.isArray(schema.items)) {
          const tupleTypes = schema.items.map((s) => jsonSchemaToTS(s, options));
          return `${readonly}[${tupleTypes.join(', ')}]`;
        }
        return `${readonly}${jsonSchemaToTS(schema.items, options)}[]`;
      }
      return `${readonly}unknown[]`;
    case 'object':
      if (schema.properties) {
        const props = Object.entries(schema.properties).map(([key, value]) => {
          const required = schema.required?.includes(key);
          const optionalMark = required ? '' : '?';
          return `${readonly}${key}${optionalMark}: ${jsonSchemaToTS(value, options)}`;
        });
        return `{ ${props.join('; ')} }`;
      }
      if (schema.additionalProperties) {
        const valueType =
          typeof schema.additionalProperties === 'boolean'
            ? 'unknown'
            : jsonSchemaToTS(schema.additionalProperties, options);
        return `${readonly}Record<string, ${valueType}>`;
      }
      return 'Record<string, unknown>';
    default:
      if (schema.nullable) {
        return 'null';
      }
      return 'unknown';
  }
}

/**
 * Format type name with prefix/suffix
 */
function formatTypeName(name: string, options: TypeGenerationOptions): string {
  const { typePrefix = '', typeSuffix = '' } = options;
  return `${typePrefix}${pascalCase(name)}${typeSuffix}`;
}

/**
 * Convert string to PascalCase
 */
function pascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Convert string to camelCase
 */
function camelCase(str: string): string {
  const pascal = pascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Generate operation ID from method and path
 */
function generateOperationId(method: string, path: string): string {
  const sanitizedPath = path
    .replace(/^\//, '')
    .replace(/\//g, '_')
    .replace(/[{}]/g, '')
    .replace(/-/g, '_');

  return camelCase(`${method}_${sanitizedPath}`);
}

/**
 * Generate TypeScript types from OpenAPI spec
 */
export function generateTypes(spec: OpenAPISpec, options: TypeGenerationOptions): GeneratedTypes {
  const lines: string[] = [];
  const zodLines: string[] = [];
  const clientLines: string[] = [];

  // Header
  lines.push('/**');
  lines.push(` * Generated from ${spec.info.title} v${spec.info.version}`);
  lines.push(' * Do not edit manually.');
  lines.push(' */');
  lines.push('');

  // Generate component schemas
  if (spec.components?.schemas) {
    lines.push('// ============================================================================');
    lines.push('// Schemas');
    lines.push('// ============================================================================');
    lines.push('');

    for (const [name, schema] of Object.entries(spec.components.schemas)) {
      const typeName = formatTypeName(name, options);
      const typeBody = jsonSchemaToTS(schema, options);
      lines.push(`export type ${typeName} = ${typeBody};`);
      lines.push('');

      // Generate Zod schema if requested
      if (options.generateZod) {
        zodLines.push(generateZodSchema(name, schema, options));
      }
    }
  }

  // Generate operation types
  lines.push('// ============================================================================');
  lines.push('// Operations');
  lines.push('// ============================================================================');
  lines.push('');

  const operations: Array<{
    operationId: string;
    method: string;
    path: string;
    operation: OpenAPIOperation;
  }> = [];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const) {
      const operation = pathItem[method];
      if (!operation) continue;

      const operationId = operation.operationId || generateOperationId(method, path);
      operations.push({ operationId, method, path, operation });

      // Generate request types
      const requestTypeName = formatTypeName(`${operationId}Request`, options);
      const requestProps: string[] = [];

      // Parameters
      if (operation.parameters) {
        const pathParams = operation.parameters.filter((p) => p.in === 'path');
        const queryParams = operation.parameters.filter((p) => p.in === 'query');
        const headerParams = operation.parameters.filter((p) => p.in === 'header');

        if (pathParams.length > 0) {
          const props = pathParams.map((p) => {
            const type = p.schema ? jsonSchemaToTS(p.schema, options) : 'string';
            return `${p.name}: ${type}`;
          });
          requestProps.push(`params: { ${props.join('; ')} }`);
        }

        if (queryParams.length > 0) {
          const props = queryParams.map((p) => {
            const type = p.schema ? jsonSchemaToTS(p.schema, options) : 'string';
            const optional = p.required ? '' : '?';
            return `${p.name}${optional}: ${type}`;
          });
          requestProps.push(`query?: { ${props.join('; ')} }`);
        }

        if (headerParams.length > 0) {
          const props = headerParams.map((p) => {
            const type = p.schema ? jsonSchemaToTS(p.schema, options) : 'string';
            const optional = p.required ? '' : '?';
            return `${p.name}${optional}: ${type}`;
          });
          requestProps.push(`headers?: { ${props.join('; ')} }`);
        }
      }

      // Request body
      if (operation.requestBody) {
        const body = operation.requestBody as OpenAPIRequestBody;
        const jsonContent = body.content?.['application/json'];
        if (jsonContent?.schema) {
          const bodyType = jsonSchemaToTS(jsonContent.schema, options);
          const optional = body.required ? '' : '?';
          requestProps.push(`body${optional}: ${bodyType}`);
        }
      }

      if (requestProps.length > 0) {
        lines.push(`export interface ${requestTypeName} {`);
        requestProps.forEach((prop) => lines.push(`  ${prop};`));
        lines.push('}');
        lines.push('');
      }

      // Generate response type
      const responseTypeName = formatTypeName(`${operationId}Response`, options);
      const successResponse = operation.responses['200'] || operation.responses['201'];
      if (successResponse) {
        const jsonContent = (successResponse as OpenAPIResponse).content?.['application/json'];
        if (jsonContent?.schema) {
          const responseType = jsonSchemaToTS(jsonContent.schema, options);
          lines.push(`export type ${responseTypeName} = ${responseType};`);
          lines.push('');
        }
      }
    }
  }

  // Generate client code if requested
  if (options.generateClient) {
    clientLines.push('// ============================================================================');
    clientLines.push('// API Client');
    clientLines.push('// ============================================================================');
    clientLines.push('');
    clientLines.push('export interface APIClientConfig {');
    clientLines.push('  baseUrl: string;');
    clientLines.push('  headers?: Record<string, string>;');
    clientLines.push('  fetch?: typeof fetch;');
    clientLines.push('}');
    clientLines.push('');
    clientLines.push('export function createClient(config: APIClientConfig) {');
    clientLines.push('  const { baseUrl, headers: defaultHeaders = {}, fetch: fetchFn = fetch } = config;');
    clientLines.push('');
    clientLines.push('  async function request<T>(');
    clientLines.push('    method: string,');
    clientLines.push('    path: string,');
    clientLines.push('    options: { params?: Record<string, string>; query?: Record<string, string>; body?: unknown; headers?: Record<string, string> } = {}');
    clientLines.push('  ): Promise<T> {');
    clientLines.push('    let url = `${baseUrl}${path}`;');
    clientLines.push('');
    clientLines.push('    // Replace path params');
    clientLines.push('    if (options.params) {');
    clientLines.push('      for (const [key, value] of Object.entries(options.params)) {');
    clientLines.push("        url = url.replace(`{${key}}`, encodeURIComponent(value));");
    clientLines.push('      }');
    clientLines.push('    }');
    clientLines.push('');
    clientLines.push('    // Add query params');
    clientLines.push('    if (options.query) {');
    clientLines.push('      const searchParams = new URLSearchParams();');
    clientLines.push('      for (const [key, value] of Object.entries(options.query)) {');
    clientLines.push('        if (value !== undefined) searchParams.append(key, value);');
    clientLines.push('      }');
    clientLines.push("      const queryString = searchParams.toString();");
    clientLines.push("      if (queryString) url += `?${queryString}`;");
    clientLines.push('    }');
    clientLines.push('');
    clientLines.push('    const response = await fetchFn(url, {');
    clientLines.push('      method,');
    clientLines.push('      headers: {');
    clientLines.push("        'Content-Type': 'application/json',");
    clientLines.push('        ...defaultHeaders,');
    clientLines.push('        ...options.headers,');
    clientLines.push('      },');
    clientLines.push('      body: options.body ? JSON.stringify(options.body) : undefined,');
    clientLines.push('    });');
    clientLines.push('');
    clientLines.push('    if (!response.ok) {');
    clientLines.push('      throw new Error(`HTTP ${response.status}: ${response.statusText}`);');
    clientLines.push('    }');
    clientLines.push('');
    clientLines.push('    return response.json();');
    clientLines.push('  }');
    clientLines.push('');
    clientLines.push('  return {');

    for (const { operationId, method, path, operation } of operations) {
      const hasParams = operation.parameters?.some((p) => p.in === 'path');
      const hasQuery = operation.parameters?.some((p) => p.in === 'query');
      const hasBody = !!operation.requestBody;
      const hasArgs = hasParams || hasQuery || hasBody;

      const requestTypeName = formatTypeName(`${operationId}Request`, options);
      const responseTypeName = formatTypeName(`${operationId}Response`, options);

      const argType = hasArgs ? `req: ${requestTypeName}` : '';
      const returnType = operation.responses['200'] || operation.responses['201']
        ? responseTypeName
        : 'void';

      clientLines.push(`    ${camelCase(operationId)}: async (${argType}): Promise<${returnType}> => {`);
      clientLines.push(`      return request('${method.toUpperCase()}', '${path}', ${hasArgs ? '{' : '{'}`);
      if (hasParams) clientLines.push('        params: req.params,');
      if (hasQuery) clientLines.push('        query: req.query,');
      if (hasBody) clientLines.push('        body: req.body,');
      clientLines.push('      });');
      clientLines.push('    },');
    }

    clientLines.push('  };');
    clientLines.push('}');
  }

  // Combine all generated code
  const allLines = [...lines];
  if (zodLines.length > 0) {
    allLines.push('');
    allLines.push("import { z } from 'zod';");
    allLines.push('');
    allLines.push('// ============================================================================');
    allLines.push('// Zod Schemas');
    allLines.push('// ============================================================================');
    allLines.push('');
    allLines.push(...zodLines);
  }
  if (clientLines.length > 0) {
    allLines.push('');
    allLines.push(...clientLines);
  }

  return {
    types: allLines.join('\n'),
    schemas: zodLines.length > 0 ? zodLines.join('\n') : undefined,
    client: clientLines.length > 0 ? clientLines.join('\n') : undefined,
  };
}

/**
 * Generate Zod schema from JSON Schema
 */
function generateZodSchema(name: string, schema: JSONSchema, options: TypeGenerationOptions): string {
  const schemaName = camelCase(`${name}Schema`);
  const zodType = jsonSchemaToZod(schema);
  return `export const ${schemaName} = ${zodType};`;
}

/**
 * Convert JSON Schema to Zod schema string
 */
function jsonSchemaToZod(schema: JSONSchema): string {
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop() || 'unknown';
    return camelCase(`${refName}Schema`);
  }

  if (schema.oneOf) {
    const variants = schema.oneOf.map(jsonSchemaToZod);
    return `z.union([${variants.join(', ')}])`;
  }

  if (schema.anyOf) {
    const variants = schema.anyOf.map(jsonSchemaToZod);
    return `z.union([${variants.join(', ')}])`;
  }

  if (schema.allOf) {
    const first = jsonSchemaToZod(schema.allOf[0]);
    const rest = schema.allOf.slice(1).map(jsonSchemaToZod);
    return rest.reduce((acc, s) => `${acc}.and(${s})`, first);
  }

  if (schema.enum) {
    if (schema.type === 'string') {
      const values = schema.enum.map((v) => JSON.stringify(v)).join(', ');
      return `z.enum([${values}])`;
    }
    const values = schema.enum.map((v) => `z.literal(${JSON.stringify(v)})`).join(', ');
    return `z.union([${values}])`;
  }

  if (schema.const !== undefined) {
    return `z.literal(${JSON.stringify(schema.const)})`;
  }

  switch (schema.type) {
    case 'string': {
      let result = 'z.string()';
      if (schema.minLength) result += `.min(${schema.minLength})`;
      if (schema.maxLength) result += `.max(${schema.maxLength})`;
      if (schema.pattern) result += `.regex(/${schema.pattern}/)`;
      if (schema.format === 'email') result += '.email()';
      if (schema.format === 'uri') result += '.url()';
      if (schema.format === 'uuid') result += '.uuid()';
      if (schema.format === 'date-time') result += '.datetime()';
      return result;
    }
    case 'number':
    case 'integer': {
      let result = schema.type === 'integer' ? 'z.number().int()' : 'z.number()';
      if (schema.minimum !== undefined) result += `.min(${schema.minimum})`;
      if (schema.maximum !== undefined) result += `.max(${schema.maximum})`;
      if (schema.multipleOf) result += `.multipleOf(${schema.multipleOf})`;
      return result;
    }
    case 'boolean':
      return 'z.boolean()';
    case 'null':
      return 'z.null()';
    case 'array': {
      const itemType = schema.items
        ? Array.isArray(schema.items)
          ? `z.tuple([${schema.items.map(jsonSchemaToZod).join(', ')}])`
          : `z.array(${jsonSchemaToZod(schema.items)})`
        : 'z.array(z.unknown())';
      let result = itemType;
      if (schema.minItems) result += `.min(${schema.minItems})`;
      if (schema.maxItems) result += `.max(${schema.maxItems})`;
      return result;
    }
    case 'object': {
      if (schema.properties) {
        const props = Object.entries(schema.properties).map(([key, value]) => {
          const propSchema = jsonSchemaToZod(value);
          const isRequired = schema.required?.includes(key);
          return `  ${key}: ${propSchema}${isRequired ? '' : '.optional()'}`;
        });
        return `z.object({\n${props.join(',\n')}\n})`;
      }
      if (schema.additionalProperties) {
        const valueType =
          typeof schema.additionalProperties === 'boolean'
            ? 'z.unknown()'
            : jsonSchemaToZod(schema.additionalProperties);
        return `z.record(z.string(), ${valueType})`;
      }
      return 'z.record(z.string(), z.unknown())';
    }
    default:
      return 'z.unknown()';
  }
}

/**
 * Load OpenAPI spec from file or URL
 */
async function loadSpec(input: string): Promise<OpenAPISpec> {
  if (input.startsWith('http://') || input.startsWith('https://')) {
    const response = await fetch(input);
    if (!response.ok) {
      throw new Error(`Failed to fetch spec: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  // File system import for Node.js
  const fs = await import('fs').catch(() => null);
  const path = await import('path').catch(() => null);

  if (!fs || !path) {
    throw new Error('File system access not available');
  }

  const absolutePath = path.resolve(process.cwd(), input);
  const content = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Write generated code to file
 */
async function writeOutput(output: string, content: string): Promise<void> {
  const fs = await import('fs').catch(() => null);
  const path = await import('path').catch(() => null);

  if (!fs || !path) {
    throw new Error('File system access not available');
  }

  const absolutePath = path.resolve(process.cwd(), output);
  const dir = path.dirname(absolutePath);

  // Create directory if needed
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf-8');
}

/**
 * Main CLI entry point
 */
export async function main(args: string[]): Promise<void> {
  const parsed = parseArgs(args);

  switch (parsed.command) {
    case 'help':
      printHelp();
      break;

    case 'version':
      printVersion();
      break;

    case 'generate':
      if (!parsed.input) {
        console.error('Error: --input is required');
        process.exit(1);
      }
      if (!parsed.output) {
        console.error('Error: --output is required');
        process.exit(1);
      }

      try {
        console.log(`Loading spec from ${parsed.input}...`);
        const spec = await loadSpec(parsed.input);

        console.log('Generating types...');
        const result = generateTypes(spec, {
          input: parsed.input,
          output: parsed.output,
          generateClient: parsed.generateClient,
          generateZod: parsed.generateZod,
          typePrefix: parsed.typePrefix,
          typeSuffix: parsed.typeSuffix,
          enumsAsUnion: parsed.enumsAsUnion,
          readonlyTypes: parsed.readonlyTypes,
        });

        console.log(`Writing output to ${parsed.output}...`);
        await writeOutput(parsed.output, result.types);

        console.log('Done!');
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
      break;
  }
}

// Run CLI if this is the main module
if (typeof process !== 'undefined' && process.argv) {
  const args = process.argv.slice(2);
  if (args.length > 0 || process.argv[1]?.includes('philjs-openapi')) {
    main(args).catch(console.error);
  }
}
