/**
 * Type Inference Helper
 *
 * Helps infer TypeScript types from usage patterns including:
 * - Inferring types from variable usage
 * - Suggesting type definitions
 * - Detecting type mismatches
 * - Generating type declarations
 * - Migration from untyped to typed code
 */

import type { AIProvider, CompletionOptions } from '../types.js';
import { extractCode, extractJSON } from '../utils/parser.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Type inference result
 */
export interface TypeInferenceResult {
  /** Original code */
  originalCode: string;
  /** Code with inferred types */
  typedCode: string;
  /** Inferred type definitions */
  typeDefinitions: InferredType[];
  /** Interface definitions */
  interfaces: InferredInterface[];
  /** Type aliases */
  typeAliases: InferredTypeAlias[];
  /** Confidence metrics */
  confidence: InferenceConfidence;
  /** Suggestions for improvement */
  suggestions: TypeSuggestion[];
}

/**
 * Inferred type
 */
export interface InferredType {
  /** Variable/parameter name */
  name: string;
  /** Inferred type */
  type: string;
  /** Where it was found */
  location: CodeLocation;
  /** How it was inferred */
  inferenceSource: InferenceSource;
  /** Confidence 0-1 */
  confidence: number;
  /** Alternative types considered */
  alternatives?: string[];
}

/**
 * Code location
 */
export interface CodeLocation {
  /** Line number */
  line: number;
  /** Column number */
  column: number;
  /** Context type */
  context: 'function-param' | 'variable' | 'return' | 'property' | 'generic';
}

/**
 * Inference source
 */
export type InferenceSource =
  | 'usage'
  | 'assignment'
  | 'function-call'
  | 'property-access'
  | 'comparison'
  | 'typeof'
  | 'api-response'
  | 'user-input'
  | 'explicit';

/**
 * Inferred interface
 */
export interface InferredInterface {
  /** Interface name */
  name: string;
  /** Properties */
  properties: InterfaceProperty[];
  /** Extends */
  extends?: string[];
  /** Source of inference */
  source: string;
  /** Generated TypeScript code */
  code: string;
}

/**
 * Interface property
 */
export interface InterfaceProperty {
  /** Property name */
  name: string;
  /** Property type */
  type: string;
  /** Is optional */
  optional: boolean;
  /** Is readonly */
  readonly: boolean;
  /** Description */
  description?: string;
}

/**
 * Inferred type alias
 */
export interface InferredTypeAlias {
  /** Type alias name */
  name: string;
  /** Type definition */
  definition: string;
  /** Is union type */
  isUnion: boolean;
  /** Is intersection type */
  isIntersection: boolean;
  /** Generated code */
  code: string;
}

/**
 * Inference confidence
 */
export interface InferenceConfidence {
  /** Overall confidence 0-1 */
  overall: number;
  /** Per-type confidence */
  byType: Record<string, number>;
  /** Low confidence items */
  lowConfidence: string[];
  /** Items that need manual review */
  needsReview: string[];
}

/**
 * Type suggestion
 */
export interface TypeSuggestion {
  /** Suggestion type */
  type: 'missing-type' | 'incorrect-type' | 'broader-type' | 'narrower-type' | 'generic' | 'union';
  /** Description */
  description: string;
  /** Affected code */
  affectedCode: string;
  /** Suggested change */
  suggestedChange: string;
  /** Location */
  location?: CodeLocation;
}

/**
 * Type inference options
 */
export interface TypeInferenceOptions extends Partial<CompletionOptions> {
  /** Strict mode (avoid any) */
  strict?: boolean;
  /** Prefer interfaces over types */
  preferInterfaces?: boolean;
  /** Include readonly where applicable */
  includeReadonly?: boolean;
  /** Generate JSDoc from types */
  generateJSDoc?: boolean;
  /** Infer generics when possible */
  inferGenerics?: boolean;
  /** Context from related files */
  relatedTypes?: string;
}

/**
 * API response type inference
 */
export interface APITypeInference {
  /** Request type */
  requestType?: InferredInterface;
  /** Response type */
  responseType: InferredInterface;
  /** Error type */
  errorType?: InferredInterface;
  /** Generated types code */
  code: string;
}

/**
 * JSON to type conversion result
 */
export interface JSONToTypeResult {
  /** Generated interface */
  interface: InferredInterface;
  /** Type code */
  code: string;
  /** Nested types */
  nestedTypes: InferredInterface[];
  /** Import statements if needed */
  imports?: string[];
}

// ============================================================================
// Type Inference Helper
// ============================================================================

/**
 * Type Inference Helper Engine
 *
 * Helps infer and suggest TypeScript types from code usage patterns.
 *
 * @example
 * ```typescript
 * const inferrer = new TypeInferenceHelper(provider);
 *
 * // Infer types for untyped code
 * const result = await inferrer.inferTypes(`
 *   function process(data) {
 *     return data.items.map(item => item.name);
 *   }
 * `);
 * console.log(result.typedCode);
 *
 * // Generate types from JSON
 * const types = await inferrer.inferFromJSON(apiResponse, 'UserResponse');
 * console.log(types.code);
 *
 * // Infer from usage patterns
 * const inferred = await inferrer.inferFromUsage(code, 'userData');
 * console.log(`Inferred type: ${inferred.type}`);
 * ```
 */
export class TypeInferenceHelper {
  private provider: AIProvider;
  private defaultOptions: Partial<CompletionOptions>;

  constructor(provider: AIProvider, options?: Partial<CompletionOptions>) {
    this.provider = provider;
    this.defaultOptions = {
      temperature: 0.1,
      maxTokens: 4096,
      ...options,
    };
  }

  /**
   * Infer types for untyped code
   *
   * @param code - Untyped or partially typed code
   * @param options - Inference options
   * @returns Type inference result
   */
  async inferTypes(
    code: string,
    options?: TypeInferenceOptions
  ): Promise<TypeInferenceResult> {
    const prompt = `Infer TypeScript types for this code:

\`\`\`typescript
${code}
\`\`\`

Options:
- Strict mode (avoid any): ${options?.strict !== false}
- Prefer interfaces: ${options?.preferInterfaces !== false}
- Include readonly: ${options?.includeReadonly}
- Infer generics: ${options?.inferGenerics}

${options?.relatedTypes ? `Related types:\n\`\`\`typescript\n${options.relatedTypes}\n\`\`\`` : ''}

Analyze the code and:
1. Infer types for all untyped variables and parameters
2. Create interfaces for object shapes
3. Create type aliases for unions/intersections
4. Add return types to functions
5. Add generic parameters where beneficial

For each inferred type, note:
- Where it was found (line, context)
- How it was inferred (usage, assignment, etc.)
- Confidence level (0-1)
- Alternative types considered

Return JSON:
{
  "typedCode": "code with types added",
  "typeDefinitions": [
    {
      "name": "variableName",
      "type": "string",
      "location": { "line": 1, "column": 5, "context": "function-param" },
      "inferenceSource": "usage",
      "confidence": 0.9,
      "alternatives": ["unknown", "any"]
    }
  ],
  "interfaces": [
    {
      "name": "DataType",
      "properties": [
        { "name": "id", "type": "string", "optional": false, "readonly": false }
      ],
      "code": "interface DataType { ... }"
    }
  ],
  "typeAliases": [
    {
      "name": "Status",
      "definition": "'pending' | 'active' | 'completed'",
      "isUnion": true,
      "code": "type Status = ..."
    }
  ],
  "confidence": {
    "overall": 0.85,
    "byType": { "DataType": 0.9 },
    "lowConfidence": ["items parameter"],
    "needsReview": ["callback return type"]
  },
  "suggestions": [
    {
      "type": "generic",
      "description": "Consider adding generic parameter",
      "affectedCode": "function process(data)",
      "suggestedChange": "function process<T>(data: T[])"
    }
  ]
}`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      ...options,
      maxTokens: 8192,
      systemPrompt: this.getTypeInferenceSystemPrompt(options),
    });

    const result = extractJSON<TypeInferenceResult>(response);

    if (result) {
      return {
        ...result,
        originalCode: code,
      };
    }

    // Fallback: just add any types
    return {
      originalCode: code,
      typedCode: code,
      typeDefinitions: [],
      interfaces: [],
      typeAliases: [],
      confidence: { overall: 0, byType: {}, lowConfidence: [], needsReview: [] },
      suggestions: [{ type: 'missing-type', description: 'Could not infer types', affectedCode: code, suggestedChange: '' }],
    };
  }

  /**
   * Infer type from variable usage patterns
   *
   * @param code - Code containing the variable
   * @param variableName - Name of variable to analyze
   * @returns Inferred type
   */
  async inferFromUsage(
    code: string,
    variableName: string
  ): Promise<InferredType> {
    const prompt = `Infer the type of "${variableName}" from its usage in this code:

\`\`\`typescript
${code}
\`\`\`

Analyze:
1. How the variable is assigned
2. What methods are called on it
3. What properties are accessed
4. How it's used in comparisons
5. How it's passed to functions
6. How it's returned

Return JSON:
{
  "name": "${variableName}",
  "type": "inferred type",
  "location": { "line": n, "column": n, "context": "variable" },
  "inferenceSource": "usage",
  "confidence": 0-1,
  "alternatives": ["other possible types"]
}`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a TypeScript type inference expert. Analyze code usage patterns to infer accurate types.',
    });

    const result = extractJSON<InferredType>(response);

    return result || {
      name: variableName,
      type: 'unknown',
      location: { line: 0, column: 0, context: 'variable' },
      inferenceSource: 'usage',
      confidence: 0,
    };
  }

  /**
   * Generate TypeScript types from JSON
   *
   * @param json - JSON data to generate types from
   * @param typeName - Name for the generated type
   * @param options - Options
   * @returns Generated types
   */
  async inferFromJSON(
    json: unknown,
    typeName: string,
    options?: { depth?: number; optionalFields?: boolean }
  ): Promise<JSONToTypeResult> {
    const jsonString = JSON.stringify(json, null, 2);

    const prompt = `Generate TypeScript types from this JSON:

\`\`\`json
${jsonString}
\`\`\`

Type name: ${typeName}

Options:
- Max depth: ${options?.depth || 'unlimited'}
- Optional fields: ${options?.optionalFields}

Generate:
1. Main interface for the data
2. Nested interfaces for complex objects
3. Type aliases for arrays of objects
4. Proper optional markers based on null values
5. Union types for mixed arrays

Return JSON:
{
  "interface": {
    "name": "${typeName}",
    "properties": [...],
    "code": "interface ${typeName} { ... }"
  },
  "nestedTypes": [...],
  "code": "complete type definitions",
  "imports": ["any needed imports"]
}`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a TypeScript expert. Generate accurate, complete types from JSON.',
    });

    const result = extractJSON<JSONToTypeResult>(response);

    return result || {
      interface: {
        name: typeName,
        properties: [],
        source: 'json',
        code: `interface ${typeName} {}`,
      },
      code: `interface ${typeName} {}`,
      nestedTypes: [],
    };
  }

  /**
   * Infer API response types from fetch/API calls
   *
   * @param code - Code with API calls
   * @param endpointName - Name for the endpoint types
   * @returns Inferred API types
   */
  async inferAPITypes(
    code: string,
    endpointName: string
  ): Promise<APITypeInference> {
    const prompt = `Infer API types from this code:

\`\`\`typescript
${code}
\`\`\`

Endpoint name: ${endpointName}

Analyze:
1. Request body structure
2. Response data structure
3. Error response structure
4. Query parameters
5. Path parameters

Generate interfaces for:
- ${endpointName}Request (if applicable)
- ${endpointName}Response
- ${endpointName}Error (if error handling exists)

Return JSON:
{
  "requestType": { interface definition or null },
  "responseType": { interface definition },
  "errorType": { interface definition or null },
  "code": "all type definitions"
}`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are an API typing expert. Generate accurate types for API interactions.',
    });

    const result = extractJSON<APITypeInference>(response);

    return result || {
      responseType: {
        name: `${endpointName}Response`,
        properties: [],
        source: 'inference',
        code: `interface ${endpointName}Response {}`,
      },
      code: `interface ${endpointName}Response {}`,
    };
  }

  /**
   * Suggest type improvements for existing typed code
   *
   * @param code - Typed code to analyze
   * @returns Type suggestions
   */
  async suggestTypeImprovements(code: string): Promise<TypeSuggestion[]> {
    const prompt = `Analyze this TypeScript code and suggest type improvements:

\`\`\`typescript
${code}
\`\`\`

Look for:
1. Uses of 'any' that could be specific
2. Too-broad types (e.g., 'object' instead of interface)
3. Missing union types for multiple possibilities
4. Opportunities for generics
5. Missing readonly modifiers
6. Type assertions that could be type guards
7. Missing discriminated unions
8. Opportunities for branded types

For each suggestion:
- type: missing-type, incorrect-type, broader-type, narrower-type, generic, union
- description: What to improve
- affectedCode: The code snippet
- suggestedChange: The suggested improvement

Return JSON array of TypeSuggestion objects.`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a TypeScript expert. Suggest type safety improvements.',
    });

    return extractJSON<TypeSuggestion[]>(response) || [];
  }

  /**
   * Generate type declarations file (.d.ts)
   *
   * @param code - Source code
   * @param options - Options
   * @returns Declaration file content
   */
  async generateDeclarations(
    code: string,
    options?: { moduleName?: string; ambient?: boolean }
  ): Promise<string> {
    const prompt = `Generate a TypeScript declaration file (.d.ts) for this code:

\`\`\`typescript
${code}
\`\`\`

${options?.moduleName ? `Module name: ${options.moduleName}` : ''}
${options?.ambient ? 'Generate ambient declarations (declare module)' : ''}

Include:
- All exported functions with signatures
- All exported types and interfaces
- All exported classes
- All exported constants with types
- Proper JSDoc comments

Return the complete .d.ts file.`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a TypeScript expert. Generate accurate type declarations.',
    });

    return extractCode(response) || '';
  }

  /**
   * Convert JavaScript to TypeScript with inferred types
   *
   * @param jsCode - JavaScript code
   * @param options - Options
   * @returns TypeScript code with types
   */
  async convertJSToTS(
    jsCode: string,
    options?: TypeInferenceOptions
  ): Promise<{
    tsCode: string;
    types: InferredInterface[];
    changes: Array<{ before: string; after: string; reason: string }>;
  }> {
    const prompt = `Convert this JavaScript to TypeScript with proper types:

\`\`\`javascript
${jsCode}
\`\`\`

Requirements:
- Add types to all function parameters
- Add return types to all functions
- Create interfaces for object shapes
- Use generics where appropriate
- Avoid 'any' - use specific types
${options?.strict ? '- Enable strict mode (no implicit any)' : ''}

Return JSON:
{
  "tsCode": "converted TypeScript code",
  "types": [generated interfaces],
  "changes": [
    {
      "before": "function foo(data)",
      "after": "function foo(data: UserData): Result",
      "reason": "Added parameter and return types"
    }
  ]
}`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      ...options,
      maxTokens: 8192,
      systemPrompt: this.getTypeInferenceSystemPrompt(options),
    });

    const result = extractJSON<{
      tsCode: string;
      types: InferredInterface[];
      changes: Array<{ before: string; after: string; reason: string }>;
    }>(response);

    return result || {
      tsCode: jsCode,
      types: [],
      changes: [],
    };
  }

  /**
   * Infer prop types for a PhilJS component
   *
   * @param componentCode - Component code
   * @returns Inferred props interface
   */
  async inferComponentProps(componentCode: string): Promise<InferredInterface> {
    const prompt = `Infer the props interface for this PhilJS component:

\`\`\`typescript
${componentCode}
\`\`\`

Analyze:
1. How props are destructured
2. How props are used in the component
3. Props passed to child components
4. Default values
5. Optional vs required props

Generate a complete Props interface with:
- All prop names and types
- Optional markers
- Default values in comments
- JSDoc descriptions

Return JSON matching InferredInterface:
{
  "name": "ComponentNameProps",
  "properties": [...],
  "code": "interface ComponentNameProps { ... }"
}`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a PhilJS and TypeScript expert. Generate accurate component prop types.',
    });

    const result = extractJSON<InferredInterface>(response);

    return result || {
      name: 'Props',
      properties: [],
      source: 'inference',
      code: 'interface Props {}',
    };
  }

  /**
   * Detect type mismatches in code
   *
   * @param code - Code to analyze
   * @returns Type mismatch warnings
   */
  async detectTypeMismatches(code: string): Promise<Array<{
    location: CodeLocation;
    expected: string;
    actual: string;
    message: string;
    fix?: string;
  }>> {
    const prompt = `Detect type mismatches in this code:

\`\`\`typescript
${code}
\`\`\`

Look for:
1. Passing wrong types to functions
2. Assigning incompatible values
3. Missing properties on objects
4. Incorrect return types
5. Array type mismatches
6. Null/undefined handling issues
7. Type narrowing issues

For each mismatch:
- location: { line, column, context }
- expected: Expected type
- actual: Actual type
- message: Error description
- fix: Suggested fix (optional)

Return JSON array.`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a TypeScript type checker. Detect type errors accurately.',
    });

    return extractJSON<Array<{
      location: CodeLocation;
      expected: string;
      actual: string;
      message: string;
      fix?: string;
    }>>(response) || [];
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private getTypeInferenceSystemPrompt(options?: TypeInferenceOptions): string {
    return `You are a TypeScript type inference expert.

Guidelines:
- ${options?.strict !== false ? 'Avoid using any - prefer unknown or specific types' : 'Use any only when necessary'}
- ${options?.preferInterfaces !== false ? 'Prefer interfaces over type aliases for objects' : 'Use type aliases when appropriate'}
- ${options?.inferGenerics ? 'Use generics when they add type safety' : 'Keep types simple'}
- ${options?.includeReadonly ? 'Add readonly to immutable properties' : ''}

Inference rules:
1. Analyze all usage patterns before deciding on a type
2. Consider null/undefined possibilities
3. Use literal types for constants
4. Use union types for multiple possibilities
5. Create interfaces for repeated object shapes
6. Use generics for reusable functions`;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a type inference helper instance
 */
export function createTypeInferenceHelper(
  provider: AIProvider,
  options?: Partial<CompletionOptions>
): TypeInferenceHelper {
  return new TypeInferenceHelper(provider, options);
}

/**
 * Quick type inference helper
 */
export async function inferTypesForCode(
  provider: AIProvider,
  code: string,
  options?: TypeInferenceOptions
): Promise<TypeInferenceResult> {
  const helper = new TypeInferenceHelper(provider);
  return helper.inferTypes(code, options);
}

/**
 * Quick JSON to type conversion helper
 */
export async function jsonToTypeScript(
  provider: AIProvider,
  json: unknown,
  typeName: string
): Promise<JSONToTypeResult> {
  const helper = new TypeInferenceHelper(provider);
  return helper.inferFromJSON(json, typeName);
}

/**
 * Quick JS to TS conversion helper
 */
export async function convertJavaScriptToTypeScript(
  provider: AIProvider,
  jsCode: string
): Promise<{ tsCode: string; types: InferredInterface[] }> {
  const helper = new TypeInferenceHelper(provider);
  const result = await helper.convertJSToTS(jsCode);
  return { tsCode: result.tsCode, types: result.types };
}
