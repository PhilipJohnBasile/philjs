/**
 * Test Generator - AI-powered test generation for PhilJS
 *
 * Features:
 * - Generate unit tests
 * - Generate integration tests
 * - Generate E2E tests
 * - Test coverage analysis
 */
import type { AIProvider, CompletionOptions } from '../types.js';
/**
 * Test generation configuration
 */
export interface TestGenerationConfig {
    /** Code to generate tests for */
    code: string;
    /** Component or function name */
    name?: string;
    /** Test type to generate */
    type: TestType;
    /** Test framework */
    framework?: TestFramework;
    /** Testing library for components */
    testingLibrary?: 'testing-library' | 'enzyme' | 'native';
    /** Include mock generation */
    includeMocks?: boolean;
    /** Test coverage targets */
    coverage?: CoverageTarget[];
    /** Additional context */
    context?: string;
    /** Generate snapshot tests */
    snapshots?: boolean;
}
/**
 * Test types
 */
export type TestType = 'unit' | 'integration' | 'e2e' | 'component' | 'api';
/**
 * Test frameworks
 */
export type TestFramework = 'vitest' | 'jest' | 'playwright' | 'cypress';
/**
 * Coverage targets
 */
export type CoverageTarget = 'functions' | 'branches' | 'statements' | 'edge-cases' | 'error-handling' | 'async-operations';
/**
 * Generated test result
 */
export interface GeneratedTests {
    /** Test code */
    code: string;
    /** Test framework used */
    framework: TestFramework;
    /** Test type */
    type: TestType;
    /** Test cases generated */
    testCases: TestCase[];
    /** Mock code */
    mocks?: string;
    /** Setup code */
    setup?: string;
    /** Required imports */
    imports: string[];
    /** Coverage areas */
    coverage: string[];
    /** Explanation */
    explanation: string;
}
/**
 * Test case information
 */
export interface TestCase {
    /** Test name */
    name: string;
    /** Test description */
    description: string;
    /** What is being tested */
    tests: string;
    /** Test category */
    category: 'happy-path' | 'edge-case' | 'error-handling' | 'integration' | 'performance';
}
/**
 * E2E test configuration
 */
export interface E2ETestConfig {
    /** Page or flow to test */
    target: string;
    /** User stories/scenarios */
    scenarios: E2EScenario[];
    /** Framework */
    framework?: 'playwright' | 'cypress';
    /** Browser targets */
    browsers?: ('chromium' | 'firefox' | 'webkit')[];
    /** Mobile testing */
    mobile?: boolean;
    /** Accessibility testing */
    accessibility?: boolean;
}
/**
 * E2E test scenario
 */
export interface E2EScenario {
    /** Scenario name */
    name: string;
    /** Steps to perform */
    steps: string[];
    /** Expected outcomes */
    expected: string[];
}
/**
 * Generated E2E tests
 */
export interface GeneratedE2ETests {
    /** Test code */
    code: string;
    /** Framework */
    framework: 'playwright' | 'cypress';
    /** Page objects */
    pageObjects?: string;
    /** Test scenarios */
    scenarios: E2ETestScenario[];
    /** Configuration */
    config?: string;
    /** Explanation */
    explanation: string;
}
/**
 * E2E test scenario result
 */
export interface E2ETestScenario {
    /** Scenario name */
    name: string;
    /** Test code */
    code: string;
    /** Steps covered */
    steps: string[];
}
/**
 * Test coverage analysis
 */
export interface CoverageAnalysis {
    /** Overall coverage percentage */
    overallCoverage: number;
    /** Missing test areas */
    missingCoverage: MissingCoverage[];
    /** Suggested tests */
    suggestedTests: SuggestedTest[];
    /** Risk areas */
    riskAreas: RiskArea[];
}
/**
 * Missing coverage area
 */
export interface MissingCoverage {
    /** Area type */
    type: 'function' | 'branch' | 'statement' | 'edge-case';
    /** Location */
    location: string;
    /** Description */
    description: string;
    /** Priority */
    priority: 'low' | 'medium' | 'high';
}
/**
 * Suggested test
 */
export interface SuggestedTest {
    /** Test name */
    name: string;
    /** What it would test */
    tests: string;
    /** Test code */
    code: string;
    /** Priority */
    priority: 'low' | 'medium' | 'high';
}
/**
 * Risk area
 */
export interface RiskArea {
    /** Area description */
    description: string;
    /** Risk level */
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    /** Why it's risky */
    reason: string;
    /** Mitigation */
    mitigation: string;
}
/**
 * Test Generator class
 */
export declare class TestGenerator {
    private provider;
    private defaultOptions;
    constructor(provider: AIProvider, options?: Partial<CompletionOptions>);
    /**
     * Generate tests for code
     */
    generateTests(config: TestGenerationConfig): Promise<GeneratedTests>;
    /**
     * Generate unit tests
     */
    generateUnitTests(code: string, name?: string, options?: Partial<TestGenerationConfig>): Promise<GeneratedTests>;
    /**
     * Generate integration tests
     */
    generateIntegrationTests(code: string, dependencies: string[], options?: Partial<TestGenerationConfig>): Promise<GeneratedTests>;
    /**
     * Generate E2E tests
     */
    generateE2ETests(config: E2ETestConfig): Promise<GeneratedE2ETests>;
    /**
     * Generate component tests
     */
    generateComponentTests(componentCode: string, componentName: string, options?: {
        props?: Record<string, string>;
        states?: string[];
        interactions?: string[];
    }): Promise<GeneratedTests>;
    /**
     * Generate API tests
     */
    generateAPITests(apiCode: string, endpoints: {
        method: string;
        path: string;
        description: string;
    }[]): Promise<GeneratedTests>;
    /**
     * Analyze test coverage
     */
    analyzeCoverage(code: string, existingTests?: string): Promise<CoverageAnalysis>;
    /**
     * Generate test data/fixtures
     */
    generateTestData(schema: Record<string, string>, count?: number): Promise<{
        data: Record<string, unknown>[];
        factory: string;
    }>;
    /**
     * Generate mock implementations
     */
    generateMocks(dependencies: {
        name: string;
        interface?: string;
    }[]): Promise<string>;
    /**
     * Build test generation prompt
     */
    private buildTestPrompt;
    /**
     * Build E2E test prompt
     */
    private buildE2EPrompt;
    /**
     * Get system prompt for test generation
     */
    private getSystemPrompt;
    /**
     * Get E2E system prompt
     */
    private getE2ESystemPrompt;
    /**
     * Get component test system prompt
     */
    private getComponentTestSystemPrompt;
    /**
     * Parse test result
     */
    private parseTestResult;
    /**
     * Parse E2E result
     */
    private parseE2EResult;
    /**
     * Extract test cases from code
     */
    private extractTestCases;
    /**
     * Infer test purpose from name
     */
    private inferTestPurpose;
    /**
     * Categorize test
     */
    private categorizeTest;
    /**
     * Extract imports from code
     */
    private extractImports;
    /**
     * Extract explanation from response
     */
    private extractExplanation;
}
/**
 * Create a test generator instance
 */
export declare function createTestGenerator(provider: AIProvider, options?: Partial<CompletionOptions>): TestGenerator;
/**
 * Quick test generation helper
 */
export declare function generateTests(provider: AIProvider, code: string, type?: TestType): Promise<GeneratedTests>;
/**
 * Quick unit test helper
 */
export declare function generateUnitTests(provider: AIProvider, code: string, name?: string): Promise<GeneratedTests>;
/**
 * Quick E2E test helper
 */
export declare function generateE2ETests(provider: AIProvider, target: string, scenarios: E2EScenario[]): Promise<GeneratedE2ETests>;
export { TestGenerator as default };
//# sourceMappingURL=test-generator.d.ts.map