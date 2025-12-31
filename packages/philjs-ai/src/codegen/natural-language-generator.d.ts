/**
 * Natural Language Code Generation Engine
 *
 * Generates PhilJS components, functions, and code from natural language descriptions.
 * Provides intelligent parsing of user intent and context-aware code generation.
 */
import type { AIProvider, CompletionOptions } from '../types.js';
/**
 * Intent types recognized by the generator
 */
export type GenerationIntent = 'component' | 'function' | 'hook' | 'utility' | 'type' | 'page' | 'layout' | 'api-route' | 'form' | 'list' | 'table' | 'modal' | 'unknown';
/**
 * Parsed intent from natural language
 */
export interface ParsedIntent {
    /** Primary intent type */
    type: GenerationIntent;
    /** Confidence score 0-1 */
    confidence: number;
    /** Extracted entities/features */
    entities: IntentEntity[];
    /** Detected requirements */
    requirements: string[];
    /** Suggested name */
    suggestedName?: string;
    /** Detected props/parameters */
    parameters?: ParameterIntent[];
    /** Detected state variables */
    stateVariables?: StateIntent[];
    /** Detected styling requirements */
    styling?: StylingIntent;
    /** Detected accessibility requirements */
    accessibility?: string[];
}
/**
 * Entity extracted from intent
 */
export interface IntentEntity {
    /** Entity type */
    type: 'component' | 'action' | 'data' | 'style' | 'feature' | 'constraint';
    /** Entity value */
    value: string;
    /** Original text span */
    span?: string;
}
/**
 * Parameter intent
 */
export interface ParameterIntent {
    /** Parameter name */
    name: string;
    /** Inferred type */
    type: string;
    /** Is required */
    required: boolean;
    /** Description */
    description?: string;
}
/**
 * State intent
 */
export interface StateIntent {
    /** State name */
    name: string;
    /** Inferred type */
    type: string;
    /** Initial value */
    initialValue?: string;
    /** Is derived/computed */
    isDerived: boolean;
}
/**
 * Styling intent
 */
export interface StylingIntent {
    /** Preferred approach */
    approach: 'tailwind' | 'css-modules' | 'styled-components' | 'inline' | 'none';
    /** Detected styles */
    styles?: string[];
    /** Color scheme */
    colorScheme?: 'light' | 'dark' | 'both';
    /** Responsive requirements */
    responsive?: boolean;
}
/**
 * Natural language generation options
 */
export interface NLGenerationOptions extends Partial<CompletionOptions> {
    /** Prefer certain patterns */
    preferPatterns?: ('signals' | 'hooks' | 'functional')[];
    /** Include TypeScript types */
    includeTypes?: boolean;
    /** Include JSDoc comments */
    includeJSDoc?: boolean;
    /** Include tests */
    includeTests?: boolean;
    /** Styling approach */
    styleApproach?: 'tailwind' | 'css-modules' | 'styled-components' | 'inline' | 'none';
    /** Existing code context for better generation */
    codeContext?: string;
    /** Project-specific imports available */
    availableImports?: string[];
}
/**
 * Generated code result
 */
export interface NLGeneratedCode {
    /** Generated code */
    code: string;
    /** Parsed intent */
    intent: ParsedIntent;
    /** Explanation of generated code */
    explanation: string;
    /** Required imports */
    imports: string[];
    /** Generated tests if requested */
    tests?: string;
    /** Usage examples */
    examples: string[];
    /** Suggestions for improvements */
    suggestions: string[];
    /** Validation result */
    validation: {
        valid: boolean;
        errors: string[];
    };
}
/**
 * Conversation context for multi-turn generation
 */
export interface ConversationContext {
    /** Previous messages */
    messages: ConversationMessage[];
    /** Generated artifacts */
    artifacts: GeneratedArtifact[];
    /** Current working code */
    workingCode?: string;
}
/**
 * Conversation message
 */
export interface ConversationMessage {
    /** Role */
    role: 'user' | 'assistant';
    /** Content */
    content: string;
    /** Timestamp */
    timestamp: Date;
}
/**
 * Generated artifact
 */
export interface GeneratedArtifact {
    /** Artifact type */
    type: 'component' | 'function' | 'type' | 'test' | 'style';
    /** Artifact name */
    name: string;
    /** Artifact code */
    code: string;
    /** Version number */
    version: number;
}
/**
 * Natural Language Code Generator
 *
 * Converts natural language descriptions into PhilJS code.
 *
 * @example
 * ```typescript
 * const generator = new NaturalLanguageGenerator(provider);
 *
 * // Generate a component from description
 * const result = await generator.generate(
 *   'Create a todo list component with add, remove, and toggle functionality'
 * );
 * console.log(result.code);
 *
 * // Parse intent first for more control
 * const intent = await generator.parseIntent(
 *   'A button that shows a loading spinner when clicked'
 * );
 * console.log(intent.type); // 'component'
 * console.log(intent.entities); // [{ type: 'feature', value: 'loading spinner' }]
 * ```
 */
export declare class NaturalLanguageGenerator {
    private provider;
    private defaultOptions;
    private conversationContext;
    constructor(provider: AIProvider, options?: Partial<CompletionOptions>);
    /**
     * Generate code from natural language description
     *
     * @param description - Natural language description
     * @param options - Generation options
     * @returns Generated code with metadata
     */
    generate(description: string, options?: NLGenerationOptions): Promise<NLGeneratedCode>;
    /**
     * Parse natural language to extract intent and entities
     *
     * @param description - Natural language description
     * @returns Parsed intent
     */
    parseIntent(description: string): Promise<ParsedIntent>;
    /**
     * Refine generation with additional instructions
     *
     * @param previousResult - Previous generation result
     * @param refinement - Refinement instructions
     * @param options - Generation options
     * @returns Refined code
     */
    refine(previousResult: NLGeneratedCode, refinement: string, options?: NLGenerationOptions): Promise<NLGeneratedCode>;
    /**
     * Start a conversation for iterative generation
     *
     * @param initialDescription - Initial description
     * @param options - Generation options
     * @returns Initial result with conversation context
     */
    startConversation(initialDescription: string, options?: NLGenerationOptions): Promise<{
        result: NLGeneratedCode;
        contextId: string;
    }>;
    /**
     * Continue conversation with follow-up
     *
     * @param followUp - Follow-up message
     * @param options - Generation options
     * @returns Updated result
     */
    continueConversation(followUp: string, options?: NLGenerationOptions): Promise<NLGeneratedCode>;
    /**
     * End the conversation and return all artifacts
     */
    endConversation(): GeneratedArtifact[];
    /**
     * Generate component variants
     *
     * @param description - Base component description
     * @param variants - Variant names/descriptions
     * @param options - Generation options
     * @returns Map of variant name to generated code
     */
    generateVariants(description: string, variants: string[], options?: NLGenerationOptions): Promise<Map<string, NLGeneratedCode>>;
    /**
     * Generate from example
     *
     * @param example - Example code to learn from
     * @param description - What to generate based on the example
     * @param options - Generation options
     * @returns Generated code following the example pattern
     */
    generateFromExample(example: string, description: string, options?: NLGenerationOptions): Promise<NLGeneratedCode>;
    private buildGenerationPrompt;
    private getTypeInstructions;
    private getSystemPrompt;
    private getConversationSystemPrompt;
    private buildConversationPrompt;
    private updateConversationContext;
    private fallbackIntentParsing;
    private extractImports;
    private extractExamples;
    private extractExplanation;
    private generateTests;
    private generateSuggestions;
    private generateContextId;
}
/**
 * Create a natural language generator instance
 */
export declare function createNaturalLanguageGenerator(provider: AIProvider, options?: Partial<CompletionOptions>): NaturalLanguageGenerator;
/**
 * Quick generation helper
 */
export declare function generateFromNaturalLanguage(provider: AIProvider, description: string, options?: NLGenerationOptions): Promise<NLGeneratedCode>;
/**
 * Quick intent parsing helper
 */
export declare function parseCodeIntent(provider: AIProvider, description: string): Promise<ParsedIntent>;
//# sourceMappingURL=natural-language-generator.d.ts.map