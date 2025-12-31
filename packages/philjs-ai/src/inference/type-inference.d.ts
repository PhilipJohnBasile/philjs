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
export type InferenceSource = 'usage' | 'assignment' | 'function-call' | 'property-access' | 'comparison' | 'typeof' | 'api-response' | 'user-input' | 'explicit';
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
export declare class TypeInferenceHelper {
    private provider;
    private defaultOptions;
    constructor(provider: AIProvider, options?: Partial<CompletionOptions>);
    /**
     * Infer types for untyped code
     *
     * @param code - Untyped or partially typed code
     * @param options - Inference options
     * @returns Type inference result
     */
    inferTypes(code: string, options?: TypeInferenceOptions): Promise<TypeInferenceResult>;
    /**
     * Infer type from variable usage patterns
     *
     * @param code - Code containing the variable
     * @param variableName - Name of variable to analyze
     * @returns Inferred type
     */
    inferFromUsage(code: string, variableName: string): Promise<InferredType>;
    /**
     * Generate TypeScript types from JSON
     *
     * @param json - JSON data to generate types from
     * @param typeName - Name for the generated type
     * @param options - Options
     * @returns Generated types
     */
    inferFromJSON(json: unknown, typeName: string, options?: {
        depth?: number;
        optionalFields?: boolean;
    }): Promise<JSONToTypeResult>;
    /**
     * Infer API response types from fetch/API calls
     *
     * @param code - Code with API calls
     * @param endpointName - Name for the endpoint types
     * @returns Inferred API types
     */
    inferAPITypes(code: string, endpointName: string): Promise<APITypeInference>;
    /**
     * Suggest type improvements for existing typed code
     *
     * @param code - Typed code to analyze
     * @returns Type suggestions
     */
    suggestTypeImprovements(code: string): Promise<TypeSuggestion[]>;
    /**
     * Generate type declarations file (.d.ts)
     *
     * @param code - Source code
     * @param options - Options
     * @returns Declaration file content
     */
    generateDeclarations(code: string, options?: {
        moduleName?: string;
        ambient?: boolean;
    }): Promise<string>;
    /**
     * Convert JavaScript to TypeScript with inferred types
     *
     * @param jsCode - JavaScript code
     * @param options - Options
     * @returns TypeScript code with types
     */
    convertJSToTS(jsCode: string, options?: TypeInferenceOptions): Promise<{
        tsCode: string;
        types: InferredInterface[];
        changes: Array<{
            before: string;
            after: string;
            reason: string;
        }>;
    }>;
    /**
     * Infer prop types for a PhilJS component
     *
     * @param componentCode - Component code
     * @returns Inferred props interface
     */
    inferComponentProps(componentCode: string): Promise<InferredInterface>;
    /**
     * Detect type mismatches in code
     *
     * @param code - Code to analyze
     * @returns Type mismatch warnings
     */
    detectTypeMismatches(code: string): Promise<Array<{
        location: CodeLocation;
        expected: string;
        actual: string;
        message: string;
        fix?: string;
    }>>;
    private getTypeInferenceSystemPrompt;
}
/**
 * Create a type inference helper instance
 */
export declare function createTypeInferenceHelper(provider: AIProvider, options?: Partial<CompletionOptions>): TypeInferenceHelper;
/**
 * Quick type inference helper
 */
export declare function inferTypesForCode(provider: AIProvider, code: string, options?: TypeInferenceOptions): Promise<TypeInferenceResult>;
/**
 * Quick JSON to type conversion helper
 */
export declare function jsonToTypeScript(provider: AIProvider, json: unknown, typeName: string): Promise<JSONToTypeResult>;
/**
 * Quick JS to TS conversion helper
 */
export declare function convertJavaScriptToTypeScript(provider: AIProvider, jsCode: string): Promise<{
    tsCode: string;
    types: InferredInterface[];
}>;
//# sourceMappingURL=type-inference.d.ts.map