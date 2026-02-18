/**
 * @philjs/test - AI-Driven Test Generation
 *
 * Generate comprehensive test suites using AI analysis of your code.
 * Supports multiple AI providers and generates tests for various frameworks.
 */
export interface AITestSuite {
    name: string;
    description: string;
    generatedTests: GeneratedTest[];
    sourceFile?: string;
    timestamp: number;
    model?: string;
}
export interface GeneratedTest {
    id: string;
    name: string;
    description: string;
    code: string;
    category: TestCategory;
    confidence: number;
    assertions: string[];
}
export type TestCategory = 'unit' | 'integration' | 'edge-case' | 'error-handling' | 'performance' | 'security' | 'accessibility';
export interface AITestConfig {
    provider: AIProvider;
    apiKey?: string;
    model?: string;
    testFramework?: 'vitest' | 'jest' | 'mocha' | 'playwright' | 'cypress';
    maxTests?: number;
    categories?: TestCategory[];
    includeEdgeCases?: boolean;
    includeErrorHandling?: boolean;
    includePerformance?: boolean;
    customPrompt?: string;
}
export type AIProvider = 'openai' | 'anthropic' | 'local' | 'ollama';
export interface SourceAnalysis {
    functions: FunctionInfo[];
    classes: ClassInfo[];
    exports: string[];
    imports: string[];
    dependencies: string[];
    complexity: number;
}
export interface FunctionInfo {
    name: string;
    params: ParameterInfo[];
    returnType?: string;
    async: boolean;
    exported: boolean;
    docstring?: string;
    body: string;
    startLine: number;
    endLine: number;
}
export interface ClassInfo {
    name: string;
    methods: FunctionInfo[];
    properties: PropertyInfo[];
    exported: boolean;
    extends?: string;
    implements?: string[];
}
export interface ParameterInfo {
    name: string;
    type?: string;
    optional: boolean;
    defaultValue?: string;
}
export interface PropertyInfo {
    name: string;
    type?: string;
    visibility: 'public' | 'private' | 'protected';
}
declare function analyzeSource(source: string): SourceAnalysis;
/**
 * Generate tests for source code using AI
 */
declare function generateTests(source: string, config?: AITestConfig): Promise<AITestSuite>;
/**
 * AI-Driven Testing: Describe what to test in English, and let the AI generate assertions.
 *
 * @example
 * ```typescript
 * const suite = await describeAI("User Login", "should allow valid credentials and reject invalid ones", {
 *   sourceCode: userLoginCode,
 *   provider: 'anthropic',
 *   apiKey: process.env.ANTHROPIC_API_KEY
 * });
 * ```
 */
declare function describeAI(suiteName: string, behaviorDescription: string, context?: {
    sourceCode?: string;
    provider?: AIProvider;
    apiKey?: string;
    model?: string;
    testFramework?: AITestConfig['testFramework'];
}): Promise<AITestSuite>;
/**
 * Generate test file content from a test suite
 */
declare function generateTestFile(suite: AITestSuite, framework?: 'vitest' | 'jest'): string;
/**
 * Run generated tests (outputs to console)
 */
declare function runGeneratedTests(suite: AITestSuite): Promise<{
    passed: number;
    failed: number;
    skipped: number;
}>;
/**
 * Simple expect implementation for standalone use
 */
declare function expect(actual: any): {
    toBe(expected: any): void;
    toEqual(expected: any): void;
    toBeDefined(): void;
    toBeNull(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toThrow(expectedError?: string | RegExp): void;
    toBeInstanceOf(expected: any): void;
    toContain(expected: any): void;
    toHaveLength(expected: number): void;
};
export { generateTests as aiGenerateTests, describeAI as aiDescribeTests, generateTestFile as aiGenerateTestFile, runGeneratedTests as aiRunGeneratedTests, analyzeSource as aiAnalyzeSource, expect as aiExpect, };
export { generateTests, describeAI, generateTestFile, runGeneratedTests, analyzeSource, expect, };
