/**
 * AI-Powered Code Generation Module
 *
 * Unified interface for generating and transforming code using AI.
 *
 * Features:
 * - Generate components from descriptions
 * - Generate functions from descriptions
 * - Refactor existing code
 * - Explain code functionality
 * - Generate unit tests
 */
import type { AIProvider, CompletionOptions } from './types.js';
/**
 * Code generation options
 */
export interface CodeGenOptions extends Partial<CompletionOptions> {
    /** Include TypeScript types */
    includeTypes?: boolean;
    /** Include JSDoc comments */
    includeJSDoc?: boolean;
    /** Use PhilJS signals for state */
    useSignals?: boolean;
    /** Framework target */
    framework?: 'philjs' | 'react-compat';
    /** Style approach */
    styleApproach?: 'tailwind' | 'css-modules' | 'styled-components' | 'inline' | 'none';
}
/**
 * Generated code result
 */
export interface GeneratedCode {
    /** The generated code */
    code: string;
    /** Explanation of what was generated */
    explanation: string;
    /** Required imports */
    imports: string[];
    /** Usage examples */
    examples?: string[];
    /** Validation result */
    validation: {
        valid: boolean;
        errors: string[];
    };
}
/**
 * Component generation result
 */
export interface GeneratedComponentResult extends GeneratedCode {
    /** Component name */
    name: string;
    /** Props interface if generated */
    propsInterface?: string;
    /** Associated styles */
    styles?: string;
    /** Generated tests */
    tests?: string;
}
/**
 * Function generation result
 */
export interface GeneratedFunctionResult extends GeneratedCode {
    /** Function name */
    name: string;
    /** Function signature */
    signature: string;
    /** Parameter descriptions */
    parameters: Array<{
        name: string;
        type: string;
        description?: string;
    }>;
    /** Return type */
    returnType: string;
}
/**
 * Refactoring result
 */
export interface RefactorResult {
    /** Original code */
    original: string;
    /** Refactored code */
    refactored: string;
    /** Changes made */
    changes: RefactorChange[];
    /** Explanation of refactoring */
    explanation: string;
    /** Potential breaking changes */
    breakingChanges?: string[];
}
/**
 * Individual refactoring change
 */
export interface RefactorChange {
    /** Type of change */
    type: 'performance' | 'readability' | 'patterns' | 'signals' | 'types' | 'security' | 'style';
    /** Description of the change */
    description: string;
    /** Before code snippet */
    before: string;
    /** After code snippet */
    after: string;
    /** Line numbers affected */
    lines?: {
        start: number;
        end: number;
    };
}
/**
 * Code explanation result
 */
export interface CodeExplanation {
    /** High-level summary */
    summary: string;
    /** Detailed explanation */
    detailed: string;
    /** Code sections with explanations */
    sections: CodeSection[];
    /** Key concepts used */
    concepts: string[];
    /** Complexity assessment */
    complexity: {
        level: 'simple' | 'moderate' | 'complex';
        score: number;
        factors: string[];
    };
}
/**
 * Code section for explanation
 */
export interface CodeSection {
    /** Section name */
    name: string;
    /** Code snippet */
    code: string;
    /** Explanation */
    explanation: string;
    /** Line range */
    lines: {
        start: number;
        end: number;
    };
}
/**
 * Generated tests result
 */
export interface GeneratedTestsResult {
    /** Test code */
    code: string;
    /** Test framework used */
    framework: 'vitest' | 'jest';
    /** Number of test cases */
    testCount: number;
    /** Test cases */
    testCases: TestCase[];
    /** Coverage areas */
    coverage: string[];
    /** Setup code if needed */
    setup?: string;
    /** Mock code if needed */
    mocks?: string;
}
/**
 * Test case information
 */
export interface TestCase {
    /** Test name */
    name: string;
    /** What is being tested */
    description: string;
    /** Test category */
    category: 'happy-path' | 'edge-case' | 'error-handling' | 'integration' | 'performance';
}
/**
 * AI Code Generator class
 *
 * Provides a unified interface for AI-powered code generation tasks.
 */
export declare class CodeGenerator {
    private provider;
    private defaultOptions;
    constructor(provider: AIProvider, options?: Partial<CompletionOptions>);
    /**
     * Generate a component from a natural language description
     *
     * @param description - Description of the component to generate
     * @param options - Generation options
     * @returns Generated component with code, explanation, and metadata
     *
     * @example
     * ```typescript
     * const generator = new CodeGenerator(provider);
     * const result = await generator.generateComponent(
     *   'A button component with primary and secondary variants, loading state, and click handler'
     * );
     * console.log(result.code);
     * ```
     */
    generateComponent(description: string, options?: CodeGenOptions & {
        name?: string;
        props?: Array<{
            name: string;
            type: string;
            required?: boolean;
        }>;
    }): Promise<GeneratedComponentResult>;
    /**
     * Generate a function from a natural language description
     *
     * @param description - Description of the function to generate
     * @param options - Generation options
     * @returns Generated function with code, signature, and metadata
     *
     * @example
     * ```typescript
     * const generator = new CodeGenerator(provider);
     * const result = await generator.generateFunction(
     *   'A function that debounces another function with configurable delay'
     * );
     * console.log(result.code);
     * ```
     */
    generateFunction(description: string, options?: CodeGenOptions & {
        name?: string;
        async?: boolean;
    }): Promise<GeneratedFunctionResult>;
    /**
     * Refactor existing code with AI-powered suggestions
     *
     * @param code - The code to refactor
     * @param instruction - Specific refactoring instruction (e.g., "improve performance", "use signals")
     * @param options - Refactoring options
     * @returns Refactored code with changes and explanations
     *
     * @example
     * ```typescript
     * const generator = new CodeGenerator(provider);
     * const result = await generator.refactorCode(
     *   existingCode,
     *   'Convert to use PhilJS signals and improve performance'
     * );
     * console.log(result.refactored);
     * console.log(result.changes);
     * ```
     */
    refactorCode(code: string, instruction: string, options?: CodeGenOptions & {
        preserveBehavior?: boolean;
        level?: 'conservative' | 'moderate' | 'aggressive';
    }): Promise<RefactorResult>;
    /**
     * Explain what a piece of code does
     *
     * @param code - The code to explain
     * @param options - Explanation options
     * @returns Detailed explanation of the code
     *
     * @example
     * ```typescript
     * const generator = new CodeGenerator(provider);
     * const explanation = await generator.explainCode(complexCode);
     * console.log(explanation.summary);
     * explanation.sections.forEach(s => console.log(s.explanation));
     * ```
     */
    explainCode(code: string, options?: {
        detailLevel?: 'brief' | 'detailed' | 'comprehensive';
        audience?: 'beginner' | 'intermediate' | 'expert';
    }): Promise<CodeExplanation>;
    /**
     * Generate unit tests for code
     *
     * @param code - The code to generate tests for
     * @param options - Test generation options
     * @returns Generated tests with metadata
     *
     * @example
     * ```typescript
     * const generator = new CodeGenerator(provider);
     * const tests = await generator.generateTests(myFunction);
     * console.log(tests.code);
     * console.log(`Generated ${tests.testCount} tests`);
     * ```
     */
    generateTests(code: string, options?: {
        framework?: 'vitest' | 'jest';
        name?: string;
        coverage?: ('happy-path' | 'edge-cases' | 'error-handling' | 'async')[];
        includeMocks?: boolean;
    }): Promise<GeneratedTestsResult>;
    /**
     * Generate code completion for a given context
     *
     * @param prefix - Code before the cursor
     * @param suffix - Code after the cursor
     * @param options - Completion options
     * @returns Suggested completion
     */
    getCompletion(prefix: string, suffix: string, options?: {
        maxLength?: number;
        language?: string;
    }): Promise<string>;
    private getComponentSystemPrompt;
    private getRefactorSystemPrompt;
    private inferComponentName;
    private inferFunctionName;
    private inferName;
    private extractPropsInterface;
    private extractFunctionSignature;
    private parseSignature;
    private extractExplanation;
    private extractImports;
    private extractExamples;
    private extractTestCases;
    private categorizeTest;
}
/**
 * Create a code generator instance
 *
 * @param provider - AI provider to use
 * @param options - Default options for generation
 * @returns CodeGenerator instance
 */
export declare function createCodeGenerator(provider: AIProvider, options?: Partial<CompletionOptions>): CodeGenerator;
/**
 * Quick component generation helper
 *
 * @param provider - AI provider
 * @param description - Component description
 * @returns Generated component
 */
export declare function generateComponent(provider: AIProvider, description: string): Promise<GeneratedComponentResult>;
/**
 * Quick function generation helper
 *
 * @param provider - AI provider
 * @param description - Function description
 * @returns Generated function
 */
export declare function generateFunction(provider: AIProvider, description: string): Promise<GeneratedFunctionResult>;
/**
 * Quick refactoring helper
 *
 * @param provider - AI provider
 * @param code - Code to refactor
 * @param instruction - Refactoring instruction
 * @returns Refactored code
 */
export declare function refactorCode(provider: AIProvider, code: string, instruction: string): Promise<RefactorResult>;
/**
 * Quick code explanation helper
 *
 * @param provider - AI provider
 * @param code - Code to explain
 * @returns Code explanation
 */
export declare function explainCode(provider: AIProvider, code: string): Promise<CodeExplanation>;
/**
 * Quick test generation helper
 *
 * @param provider - AI provider
 * @param code - Code to generate tests for
 * @returns Generated tests
 */
export declare function generateTests(provider: AIProvider, code: string): Promise<GeneratedTestsResult>;
//# sourceMappingURL=codegen.d.ts.map