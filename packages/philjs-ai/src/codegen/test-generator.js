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
/**
 * AI Test Generator
 */
export class TestGenerator {
    provider;
    defaultOptions;
    constructor(provider, options) {
        this.provider = provider;
        this.defaultOptions = {
            temperature: 0.2,
            maxTokens: 4096,
            ...options,
        };
    }
    /**
     * Generate tests for code
     */
    async generateTests(config) {
        const prompt = this.buildTestPrompt(config);
        const systemPrompt = this.getTestSystemPrompt(config);
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt,
        });
        return this.parseTestResponse(response, config);
    }
    /**
     * Generate unit tests
     */
    async generateUnitTests(code, framework = 'vitest') {
        return this.generateTests({
            code,
            framework,
            testingLibrary: 'testing-library',
            testTypes: ['unit'],
        });
    }
    /**
     * Generate integration tests
     */
    async generateIntegrationTests(code, dependencies) {
        const prompt = `Generate integration tests for this code that tests interactions with:
${dependencies.map(d => `- ${d}`).join('\n')}

Code:
\`\`\`typescript
${code}
\`\`\`

Requirements:
- Test real interactions between components/modules
- Verify correct data flow
- Test error handling across boundaries
- Include setup and teardown for integration context
- Use Vitest with Testing Library`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: this.getTestSystemPrompt({
                code,
                framework: 'vitest',
                testTypes: ['integration'],
            }),
        });
        return this.parseTestResponse(response, {
            code,
            framework: 'vitest',
            testTypes: ['integration'],
        });
    }
    /**
     * Generate E2E tests
     */
    async generateE2ETests(userFlows, framework = 'playwright') {
        const flowDescriptions = userFlows.map((flow, i) => `Flow ${i + 1}: ${flow.name}\n  Steps: ${flow.steps.join(' -> ')}\n  Expected: ${flow.expectedOutcome}`).join('\n\n');
        const prompt = `Generate E2E tests for these user flows using ${framework}:

${flowDescriptions}

Requirements:
- Test complete user journeys
- Include proper waiting strategies
- Handle network requests
- Test responsive behavior
- Include error recovery scenarios
- Generate page objects if beneficial`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: `You are an E2E testing expert using ${framework}.
Generate production-quality E2E tests that are:
- Reliable (no flaky tests)
- Fast (efficient selectors, minimal waits)
- Maintainable (page objects, reusable helpers)
- Comprehensive (edge cases, error handling)`,
        });
        return this.parseTestResponse(response, {
            code: flowDescriptions,
            framework,
            testTypes: ['e2e'],
        });
    }
    /**
     * Generate accessibility tests
     */
    async generateAccessibilityTests(componentCode, wcagLevel = 'AA') {
        const prompt = `Generate accessibility tests for this component to verify WCAG ${wcagLevel} compliance:

\`\`\`typescript
${componentCode}
\`\`\`

Test for:
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus management
- ARIA attributes
- Semantic HTML
- Form labels and errors
- Interactive element accessibility

Use axe-core for automated checks and manual test cases for interactive behavior.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: `You are an accessibility testing expert.
Generate comprehensive a11y tests using:
- @testing-library/react
- jest-axe for axe-core integration
- Manual interaction tests
Follow WCAG ${wcagLevel} guidelines strictly.`,
        });
        return this.parseTestResponse(response, {
            code: componentCode,
            framework: 'vitest',
            testTypes: ['accessibility'],
        });
    }
    /**
     * Generate performance tests
     */
    async generatePerformanceTests(code, metrics) {
        const metricsDescription = metrics.map(m => `- ${m.name}: ${m.threshold}${m.unit} (${m.type})`).join('\n');
        const prompt = `Generate performance tests for this code:

\`\`\`typescript
${code}
\`\`\`

Performance metrics to test:
${metricsDescription}

Requirements:
- Measure render time
- Test memory usage
- Check for memory leaks
- Profile expensive operations
- Test under load
- Generate benchmark reports`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: `You are a performance testing expert.
Generate tests that accurately measure and validate performance metrics.
Use:
- Performance API for timing
- Memory profiling tools
- React Profiler for component metrics
- Benchmark.js for micro-benchmarks`,
        });
        return this.parseTestResponse(response, {
            code,
            framework: 'vitest',
            testTypes: ['performance'],
        });
    }
    /**
     * Generate snapshot tests
     */
    async generateSnapshotTests(componentCode, variants) {
        const prompt = `Generate snapshot tests for this component across these variants:
${variants.map(v => `- ${v}`).join('\n')}

\`\`\`typescript
${componentCode}
\`\`\`

Requirements:
- Test default rendering
- Test all prop combinations
- Test all variants listed
- Test responsive breakpoints
- Test loading/error states
- Use inline snapshots where appropriate`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: `You are a snapshot testing expert.
Generate maintainable snapshot tests that:
- Capture meaningful UI state
- Avoid brittle snapshots
- Document expected output
- Cover edge cases`,
        });
        return this.parseTestResponse(response, {
            code: componentCode,
            framework: 'vitest',
            testTypes: ['snapshot'],
        });
    }
    /**
     * Generate test suite for entire module
     */
    async generateTestSuite(moduleCode, moduleName, options) {
        const prompt = `Generate a complete test suite for this module:

Module: ${moduleName}

\`\`\`typescript
${moduleCode}
\`\`\`

Generate:
1. Unit tests for all exported functions/classes
2. Integration tests for module interactions
3. Edge case tests
${options?.includeSetup ? '4. Test setup/teardown' : ''}
${options?.includeFixtures ? '5. Test fixtures' : ''}
${options?.includeMocks ? '6. Mock implementations' : ''}

Organize tests logically with describe blocks.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            maxTokens: 8000,
            systemPrompt: `You are a testing expert generating comprehensive test suites.
Create well-organized, maintainable tests with:
- Clear test descriptions
- Proper setup/teardown
- Isolated tests
- Good coverage`,
        });
        return this.parseTestSuiteResponse(response, moduleName);
    }
    /**
     * Generate mock implementations
     */
    async generateMocks(dependencies, interfaces) {
        const prompt = `Generate mock implementations for these dependencies:
${dependencies.map(d => `- ${d}`).join('\n')}

${interfaces ? `Interfaces:\n\`\`\`typescript\n${interfaces}\n\`\`\`` : ''}

Requirements:
- Type-safe mocks
- Configurable behavior
- Spy capabilities
- Reset functionality
- Reasonable defaults`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: `You are a mocking expert.
Generate flexible, type-safe mock implementations using vi.fn() and vi.mock().`,
        });
        return this.extractCode(response);
    }
    /**
     * Generate test fixtures
     */
    async generateFixtures(dataTypes, schema) {
        const prompt = `Generate test fixtures for these data types:
${dataTypes.map(d => `- ${d}`).join('\n')}

${schema ? `Schema:\n\`\`\`typescript\n${schema}\n\`\`\`` : ''}

Requirements:
- Realistic sample data
- Factory functions for customization
- Edge case data (empty, large, special characters)
- Related data sets
- Type-safe fixtures`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: `You are a test data expert.
Generate comprehensive, realistic test fixtures.`,
        });
        return this.extractCode(response);
    }
    /**
     * Analyze test coverage gaps
     */
    async analyzeCoverageGaps(code, existingTests) {
        const prompt = `Analyze coverage gaps between this code and its tests:

Code:
\`\`\`typescript
${code}
\`\`\`

Existing Tests:
\`\`\`typescript
${existingTests}
\`\`\`

Identify:
1. Untested functions/methods
2. Untested branches
3. Missing edge cases
4. Untested error scenarios
5. Missing integration scenarios

Return JSON with:
- untestedFunctions: string[]
- untestedBranches: { function: string, condition: string }[]
- missingEdgeCases: string[]
- missingErrorTests: string[]
- recommendations: string[]`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are a test coverage analysis expert.',
        });
        try {
            const jsonMatch = response.match(/```json\n([\s\S]*?)```/);
            return JSON.parse(jsonMatch?.[1] || response);
        }
        catch {
            return {
                untestedFunctions: [],
                untestedBranches: [],
                missingEdgeCases: [],
                missingErrorTests: [],
                recommendations: ['Unable to parse coverage analysis'],
            };
        }
    }
    /**
     * Build test generation prompt
     */
    buildTestPrompt(config) {
        const testTypeDescriptions = {
            unit: 'isolated unit tests for individual functions/components',
            integration: 'integration tests for module interactions',
            e2e: 'end-to-end tests for user flows',
            snapshot: 'snapshot tests for UI consistency',
            accessibility: 'accessibility compliance tests',
            performance: 'performance and benchmark tests',
            visual: 'visual regression tests',
        };
        const requestedTests = config.testTypes
            .map(t => `- ${testTypeDescriptions[t]}`)
            .join('\n');
        return `Generate comprehensive tests for this code:

\`\`\`typescript
${config.code}
\`\`\`

Test types to generate:
${requestedTests}

Framework: ${config.framework}
Testing Library: ${config.testingLibrary || 'testing-library'}
${config.coverage ? `Coverage targets: ${JSON.stringify(config.coverage)}` : ''}
${config.mocks?.length ? `Required mocks: ${config.mocks.map(m => m.module).join(', ')}` : ''}

Requirements:
- Complete test coverage
- Clear test descriptions
- Proper assertions
- Edge case handling
- Error scenario testing
- TypeScript types`;
    }
    /**
     * Get system prompt for test generation
     */
    getTestSystemPrompt(config) {
        const frameworkGuide = {
            vitest: `Use Vitest with:
- describe/it/expect syntax
- vi.fn() for mocks
- vi.mock() for module mocks
- beforeEach/afterEach for setup`,
            jest: `Use Jest with:
- describe/it/expect syntax
- jest.fn() for mocks
- jest.mock() for module mocks
- beforeEach/afterEach for setup`,
            playwright: `Use Playwright with:
- test/expect from @playwright/test
- page object pattern
- proper locators (getByRole, getByTestId)
- network interception`,
            cypress: `Use Cypress with:
- describe/it/cy syntax
- cy.intercept for network
- proper selectors
- cypress-testing-library`,
        };
        return `You are an expert test engineer generating production-quality tests.

${frameworkGuide[config.framework]}

Best practices:
- Arrange-Act-Assert pattern
- One assertion per test when possible
- Descriptive test names
- Avoid test interdependence
- Mock external dependencies
- Test behavior, not implementation`;
    }
    /**
     * Parse test response
     */
    parseTestResponse(response, config) {
        const code = this.extractCode(response);
        const scenarios = this.extractScenarios(response);
        const setup = this.extractSection(code, 'beforeEach|beforeAll');
        const teardown = this.extractSection(code, 'afterEach|afterAll');
        const mocks = this.extractSection(code, 'vi\\.mock|jest\\.mock');
        return {
            code,
            testCount: this.countTests(code),
            coveredScenarios: scenarios,
            ...(setup !== undefined && { setup }),
            ...(teardown !== undefined && { teardown }),
            ...(mocks !== undefined && { mocks }),
        };
    }
    /**
     * Parse test suite response
     */
    parseTestSuiteResponse(response, name) {
        const code = this.extractCode(response);
        const tests = this.splitIntoTests(code);
        return {
            name,
            tests: tests.map(t => ({
                code: t,
                testCount: this.countTests(t),
                coveredScenarios: this.extractScenarios(t),
            })),
        };
    }
    /**
     * Extract code from response
     */
    extractCode(response) {
        const codeMatch = response.match(/```(?:typescript|ts|javascript|js)\n([\s\S]*?)```/);
        return codeMatch?.[1]?.trim() || response;
    }
    /**
     * Extract test scenarios from response
     */
    extractScenarios(response) {
        const scenarios = [];
        const itMatches = response.matchAll(/(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]/g);
        for (const match of itMatches) {
            if (match[1] !== undefined) {
                scenarios.push(match[1]);
            }
        }
        return scenarios;
    }
    /**
     * Count tests in code
     */
    countTests(code) {
        const itCount = (code.match(/\b(?:it|test)\s*\(/g) || []).length;
        return itCount;
    }
    /**
     * Extract specific section from code
     */
    extractSection(code, pattern) {
        const regex = new RegExp(`(${pattern})[\\s\\S]*?(?=\\n\\s*(?:describe|it|test|$))`, 'g');
        const matches = code.match(regex);
        return matches?.join('\n');
    }
    /**
     * Split code into individual test blocks
     */
    splitIntoTests(code) {
        const tests = [];
        const describeMatches = code.matchAll(/describe\s*\([^)]+,\s*\(\)\s*=>\s*\{[\s\S]*?\n\}\s*\)/g);
        for (const match of describeMatches) {
            tests.push(match[0]);
        }
        return tests.length ? tests : [code];
    }
}
/**
 * Create test generator instance
 */
export function createTestGenerator(provider, options) {
    return new TestGenerator(provider, options);
}
/**
 * Quick test generation helper
 */
export async function generateTestsFor(provider, code, testTypes = ['unit']) {
    const generator = new TestGenerator(provider);
    return generator.generateTests({
        code,
        framework: 'vitest',
        testingLibrary: 'testing-library',
        testTypes,
    });
}
//# sourceMappingURL=test-generator.js.map