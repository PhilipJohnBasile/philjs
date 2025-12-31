/**
 * Advanced Test Generator
 *
 * Generates comprehensive test suites for PhilJS components and code including:
 * - Unit tests
 * - Integration tests
 * - E2E test scenarios
 * - Accessibility tests
 * - Snapshot tests
 * - Performance tests
 */
import type { AIProvider, CompletionOptions } from '../types.js';
/**
 * Test framework
 */
export type TestFramework = 'vitest' | 'jest' | 'playwright' | 'cypress';
/**
 * Test type
 */
export type TestType = 'unit' | 'integration' | 'e2e' | 'accessibility' | 'snapshot' | 'performance' | 'visual';
/**
 * Test generation options
 */
export interface AdvancedTestGenOptions extends Partial<CompletionOptions> {
    /** Test framework to use */
    framework?: TestFramework;
    /** Types of tests to generate */
    types?: TestType[];
    /** Include mocks */
    includeMocks?: boolean;
    /** Include fixtures */
    includeFixtures?: boolean;
    /** Coverage requirements */
    coverageTarget?: number;
    /** Test style */
    style?: 'bdd' | 'tdd' | 'classic';
    /** Assertion library */
    assertionLibrary?: 'chai' | 'jest' | 'vitest';
    /** Include test utilities */
    includeUtils?: boolean;
    /** Component context for better tests */
    componentContext?: string;
}
/**
 * Generated test suite
 */
export interface GeneratedTestSuite {
    /** Main test file content */
    testFile: string;
    /** Test file name suggestion */
    fileName: string;
    /** Individual test cases */
    testCases: TestCaseInfo[];
    /** Mock files if generated */
    mocks?: MockFile[];
    /** Fixture files if generated */
    fixtures?: FixtureFile[];
    /** Test utilities if generated */
    utilities?: string;
    /** Setup file if needed */
    setupFile?: string;
    /** Coverage analysis */
    coverage: CoverageAnalysis;
    /** Suggestions for additional tests */
    suggestions: string[];
}
/**
 * Test case information
 */
export interface TestCaseInfo {
    /** Test name */
    name: string;
    /** Test description */
    description: string;
    /** Test type */
    type: TestType;
    /** Test category */
    category: TestCategory;
    /** Priority */
    priority: 'critical' | 'high' | 'medium' | 'low';
    /** Expected assertions count */
    assertionCount: number;
    /** Dependencies */
    dependencies?: string[];
}
/**
 * Test category
 */
export type TestCategory = 'rendering' | 'interaction' | 'state' | 'props' | 'events' | 'hooks' | 'signals' | 'api' | 'routing' | 'error-handling' | 'edge-cases' | 'accessibility' | 'performance';
/**
 * Mock file
 */
export interface MockFile {
    /** File name */
    name: string;
    /** File content */
    content: string;
    /** What it mocks */
    mocks: string[];
}
/**
 * Fixture file
 */
export interface FixtureFile {
    /** File name */
    name: string;
    /** File content */
    content: string;
    /** Fixture type */
    type: 'data' | 'component' | 'api-response' | 'state';
}
/**
 * Coverage analysis
 */
export interface CoverageAnalysis {
    /** Estimated statement coverage */
    statements: number;
    /** Estimated branch coverage */
    branches: number;
    /** Estimated function coverage */
    functions: number;
    /** Estimated line coverage */
    lines: number;
    /** Uncovered areas */
    uncovered: string[];
    /** Coverage suggestions */
    suggestions: string[];
}
/**
 * E2E test scenario
 */
export interface E2EScenario {
    /** Scenario name */
    name: string;
    /** User story/description */
    description: string;
    /** Steps */
    steps: E2EStep[];
    /** Setup requirements */
    setup?: string;
    /** Cleanup */
    cleanup?: string;
    /** Expected duration (ms) */
    estimatedDuration: number;
}
/**
 * E2E test step
 */
export interface E2EStep {
    /** Step description */
    description: string;
    /** Action type */
    action: 'navigate' | 'click' | 'type' | 'wait' | 'assert' | 'screenshot' | 'custom';
    /** Selector or target */
    target?: string;
    /** Value for action */
    value?: string;
    /** Expected result */
    expected?: string;
}
/**
 * Accessibility test result
 */
export interface A11yTest {
    /** Test name */
    name: string;
    /** WCAG criterion */
    wcagCriterion: string;
    /** Test code */
    code: string;
    /** What it checks */
    checks: string[];
}
/**
 * Advanced Test Generator Engine
 *
 * Generates comprehensive test suites with various test types.
 *
 * @example
 * ```typescript
 * const generator = new AdvancedTestGenerator(provider);
 *
 * // Generate full test suite
 * const suite = await generator.generateTestSuite(componentCode, {
 *   framework: 'vitest',
 *   types: ['unit', 'integration', 'accessibility'],
 *   includeMocks: true,
 * });
 *
 * console.log(suite.testFile);
 * console.log(`Generated ${suite.testCases.length} test cases`);
 *
 * // Generate E2E scenarios
 * const e2e = await generator.generateE2EScenarios(appDescription);
 * e2e.forEach(s => console.log(s.name));
 * ```
 */
export declare class AdvancedTestGenerator {
    private provider;
    private defaultOptions;
    constructor(provider: AIProvider, options?: Partial<CompletionOptions>);
    /**
     * Generate a complete test suite for code
     *
     * @param code - Code to test
     * @param options - Generation options
     * @returns Generated test suite
     */
    generateTestSuite(code: string, options?: AdvancedTestGenOptions): Promise<GeneratedTestSuite>;
    /**
     * Generate unit tests specifically
     *
     * @param code - Code to test
     * @param options - Options
     * @returns Unit test code
     */
    generateUnitTests(code: string, options?: AdvancedTestGenOptions): Promise<string>;
    /**
     * Generate integration tests
     *
     * @param code - Code to test
     * @param relatedCode - Related components/code
     * @param options - Options
     * @returns Integration test code
     */
    generateIntegrationTests(code: string, relatedCode?: string, options?: AdvancedTestGenOptions): Promise<string>;
    /**
     * Generate E2E test scenarios
     *
     * @param appDescription - Description of the app/feature
     * @param options - Options
     * @returns E2E scenarios
     */
    generateE2EScenarios(appDescription: string, options?: {
        framework?: 'playwright' | 'cypress';
    }): Promise<E2EScenario[]>;
    /**
     * Generate E2E test code from scenarios
     *
     * @param scenarios - E2E scenarios
     * @param framework - Test framework
     * @returns E2E test code
     */
    generateE2ECode(scenarios: E2EScenario[], framework?: 'playwright' | 'cypress'): Promise<string>;
    /**
     * Generate accessibility tests
     *
     * @param componentCode - Component to test
     * @param options - Options
     * @returns Accessibility tests
     */
    generateA11yTests(componentCode: string, options?: {
        wcagLevel?: 'A' | 'AA' | 'AAA';
    }): Promise<A11yTest[]>;
    /**
     * Generate snapshot tests
     *
     * @param componentCode - Component code
     * @param states - Different states to snapshot
     * @returns Snapshot test code
     */
    generateSnapshotTests(componentCode: string, states?: string[]): Promise<string>;
    /**
     * Generate performance tests
     *
     * @param componentCode - Component code
     * @param options - Options
     * @returns Performance test code
     */
    generatePerformanceTests(componentCode: string, options?: {
        framework?: 'vitest' | 'jest';
        thresholds?: Record<string, number>;
    }): Promise<string>;
    /**
     * Analyze test coverage and suggest improvements
     *
     * @param code - Original code
     * @param tests - Existing tests
     * @returns Coverage analysis and suggestions
     */
    analyzeTestCoverage(code: string, tests: string): Promise<{
        coverage: CoverageAnalysis;
        missingTests: TestCaseInfo[];
        improvements: string[];
    }>;
    private generateMainTestFile;
    private getTypeDescription;
    private getTestSystemPrompt;
    private extractTestCases;
    private inferCategory;
    private inferPriority;
    private inferTestType;
    private generateMocks;
    private generateFixtures;
    private generateTestUtils;
    private analyzeCoverage;
    private getSuggestions;
    private generateFileName;
}
/**
 * Create an advanced test generator instance
 */
export declare function createAdvancedTestGenerator(provider: AIProvider, options?: Partial<CompletionOptions>): AdvancedTestGenerator;
/**
 * Quick test suite generation helper
 */
export declare function generateTestSuite(provider: AIProvider, code: string, options?: AdvancedTestGenOptions): Promise<GeneratedTestSuite>;
/**
 * Quick unit test generation helper
 */
export declare function generateUnitTestsForCode(provider: AIProvider, code: string, framework?: TestFramework): Promise<string>;
/**
 * Quick E2E scenario generation helper
 */
export declare function generateE2ETestScenarios(provider: AIProvider, appDescription: string): Promise<E2EScenario[]>;
//# sourceMappingURL=advanced-test-generator.d.ts.map