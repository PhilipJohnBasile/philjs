/**
 * AI-Powered Test Generator
 *
 * Generates comprehensive tests for PhilJS components and code:
 * - Unit tests with Jest/Vitest
 * - Integration tests
 * - E2E tests with Playwright/Cypress
 * - Snapshot tests
 * - Accessibility tests
 * - Performance tests
 */
import type { AIProvider, CompletionOptions } from '../types.js';
export interface TestGenerationConfig {
    /** Code to generate tests for */
    code: string;
    /** Test framework */
    framework: 'vitest' | 'jest' | 'playwright' | 'cypress';
    /** Testing library */
    testingLibrary?: 'testing-library' | 'enzyme' | 'none';
    /** Types of tests to generate */
    testTypes: TestType[];
    /** Coverage requirements */
    coverage?: CoverageConfig;
    /** Mock configuration */
    mocks?: MockConfig[];
    /** Test file path */
    outputPath?: string;
}
export type TestType = 'unit' | 'integration' | 'e2e' | 'snapshot' | 'accessibility' | 'performance' | 'visual';
export interface CoverageConfig {
    statements?: number;
    branches?: number;
    functions?: number;
    lines?: number;
}
export interface MockConfig {
    module: string;
    type: 'auto' | 'manual' | 'spy';
    implementation?: string;
}
export interface GeneratedTest {
    code: string;
    testCount: number;
    coveredScenarios: string[];
    setup?: string;
    teardown?: string;
    mocks?: string;
    fixtures?: string;
    helpers?: string;
}
export interface TestSuite {
    name: string;
    tests: GeneratedTest[];
    setupFile?: string;
    globalMocks?: string;
    config?: string;
}
/**
 * AI Test Generator
 */
export declare class TestGenerator {
    private provider;
    private defaultOptions;
    constructor(provider: AIProvider, options?: Partial<CompletionOptions>);
    /**
     * Generate tests for code
     */
    generateTests(config: TestGenerationConfig): Promise<GeneratedTest>;
    /**
     * Generate unit tests
     */
    generateUnitTests(code: string, framework?: 'vitest' | 'jest'): Promise<GeneratedTest>;
    /**
     * Generate integration tests
     */
    generateIntegrationTests(code: string, dependencies: string[]): Promise<GeneratedTest>;
    /**
     * Generate E2E tests
     */
    generateE2ETests(userFlows: UserFlow[], framework?: 'playwright' | 'cypress'): Promise<GeneratedTest>;
    /**
     * Generate accessibility tests
     */
    generateAccessibilityTests(componentCode: string, wcagLevel?: 'A' | 'AA' | 'AAA'): Promise<GeneratedTest>;
    /**
     * Generate performance tests
     */
    generatePerformanceTests(code: string, metrics: PerformanceMetric[]): Promise<GeneratedTest>;
    /**
     * Generate snapshot tests
     */
    generateSnapshotTests(componentCode: string, variants: string[]): Promise<GeneratedTest>;
    /**
     * Generate test suite for entire module
     */
    generateTestSuite(moduleCode: string, moduleName: string, options?: {
        includeSetup?: boolean;
        includeFixtures?: boolean;
        includeMocks?: boolean;
    }): Promise<TestSuite>;
    /**
     * Generate mock implementations
     */
    generateMocks(dependencies: string[], interfaces?: string): Promise<string>;
    /**
     * Generate test fixtures
     */
    generateFixtures(dataTypes: string[], schema?: string): Promise<string>;
    /**
     * Analyze test coverage gaps
     */
    analyzeCoverageGaps(code: string, existingTests: string): Promise<CoverageAnalysis>;
    /**
     * Build test generation prompt
     */
    private buildTestPrompt;
    /**
     * Get system prompt for test generation
     */
    private getTestSystemPrompt;
    /**
     * Parse test response
     */
    private parseTestResponse;
    /**
     * Parse test suite response
     */
    private parseTestSuiteResponse;
    /**
     * Extract code from response
     */
    private extractCode;
    /**
     * Extract test scenarios from response
     */
    private extractScenarios;
    /**
     * Count tests in code
     */
    private countTests;
    /**
     * Extract specific section from code
     */
    private extractSection;
    /**
     * Split code into individual test blocks
     */
    private splitIntoTests;
}
/**
 * User flow definition for E2E tests
 */
export interface UserFlow {
    name: string;
    steps: string[];
    expectedOutcome: string;
    prerequisites?: string[];
}
/**
 * Performance metric definition
 */
export interface PerformanceMetric {
    name: string;
    type: 'timing' | 'memory' | 'cpu' | 'network';
    threshold: number;
    unit: 'ms' | 'MB' | '%' | 'KB';
}
/**
 * Coverage analysis result
 */
export interface CoverageAnalysis {
    untestedFunctions: string[];
    untestedBranches: {
        function: string;
        condition: string;
    }[];
    missingEdgeCases: string[];
    missingErrorTests: string[];
    recommendations: string[];
}
/**
 * Create test generator instance
 */
export declare function createTestGenerator(provider: AIProvider, options?: Partial<CompletionOptions>): TestGenerator;
/**
 * Quick test generation helper
 */
export declare function generateTestsFor(provider: AIProvider, code: string, testTypes?: TestType[]): Promise<GeneratedTest>;
//# sourceMappingURL=test-generator.d.ts.map