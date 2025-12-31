/**
 * Test Generator - AI-powered test generation for PhilJS
 *
 * Features:
 * - Generate unit tests
 * - Generate integration tests
 * - Generate E2E tests
 * - Test coverage analysis
 */
import { extractCode, extractJSON } from '../utils/parser.js';
/**
 * Test Generator class
 */
export class TestGenerator {
    provider;
    defaultOptions;
    constructor(provider, options) {
        this.provider = provider;
        this.defaultOptions = {
            temperature: 0.2,
            maxTokens: 8192,
            ...options,
        };
    }
    /**
     * Generate tests for code
     */
    async generateTests(config) {
        const framework = config.framework || 'vitest';
        const prompt = this.buildTestPrompt(config, framework);
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: this.getSystemPrompt(config.type, framework),
        });
        return this.parseTestResult(response, config);
    }
    /**
     * Generate unit tests
     */
    async generateUnitTests(code, name, options) {
        const config = {
            code,
            type: 'unit',
            framework: 'vitest',
            coverage: ['functions', 'branches', 'edge-cases', 'error-handling'],
            ...options,
        };
        if (name !== undefined) {
            config.name = name;
        }
        return this.generateTests(config);
    }
    /**
     * Generate integration tests
     */
    async generateIntegrationTests(code, dependencies, options) {
        return this.generateTests({
            code,
            type: 'integration',
            framework: 'vitest',
            context: `Dependencies: ${dependencies.join(', ')}`,
            includeMocks: true,
            ...options,
        });
    }
    /**
     * Generate E2E tests
     */
    async generateE2ETests(config) {
        const framework = config.framework || 'playwright';
        const prompt = this.buildE2EPrompt(config, framework);
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: this.getE2ESystemPrompt(framework),
        });
        return this.parseE2EResult(response, config);
    }
    /**
     * Generate component tests
     */
    async generateComponentTests(componentCode, componentName, options) {
        const prompt = `Generate comprehensive component tests for:

\`\`\`typescript
${componentCode}
\`\`\`

Component: ${componentName}
${options?.props ? `Props: ${JSON.stringify(options.props)}` : ''}
${options?.states ? `States to test: ${options.states.join(', ')}` : ''}
${options?.interactions ? `Interactions: ${options.interactions.join(', ')}` : ''}

Generate tests for:
1. Component rendering
2. Props handling
3. State changes
4. User interactions
5. Accessibility
6. Edge cases
7. Error boundaries

Use Testing Library with Vitest.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: this.getComponentTestSystemPrompt(),
        });
        return this.parseTestResult(response, {
            code: componentCode,
            name: componentName,
            type: 'component',
            framework: 'vitest',
        });
    }
    /**
     * Generate API tests
     */
    async generateAPITests(apiCode, endpoints) {
        const prompt = `Generate API tests for:

\`\`\`typescript
${apiCode}
\`\`\`

Endpoints:
${endpoints.map(e => `- ${e.method} ${e.path}: ${e.description}`).join('\n')}

Generate tests for:
1. Successful responses
2. Error responses (400, 401, 404, 500)
3. Input validation
4. Authentication/Authorization
5. Edge cases
6. Rate limiting (if applicable)

Use Vitest with supertest or fetch mocking.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are an API testing expert. Generate comprehensive API tests.',
        });
        return this.parseTestResult(response, {
            code: apiCode,
            type: 'api',
            framework: 'vitest',
        });
    }
    /**
     * Analyze test coverage
     */
    async analyzeCoverage(code, existingTests) {
        const prompt = `Analyze test coverage for this code:

Source code:
\`\`\`typescript
${code}
\`\`\`

${existingTests ? `Existing tests:\n\`\`\`typescript\n${existingTests}\n\`\`\`` : 'No existing tests.'}

Analyze:
1. Overall coverage estimation
2. Missing coverage areas (functions, branches, edge cases)
3. Suggested tests to add
4. Risk areas that need testing

Return JSON with:
- overallCoverage: Percentage 0-100
- missingCoverage: Array of { type, location, description, priority }
- suggestedTests: Array of { name, tests, code, priority }
- riskAreas: Array of { description, riskLevel, reason, mitigation }`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are a test coverage analysis expert.',
        });
        return extractJSON(response) || {
            overallCoverage: 0,
            missingCoverage: [],
            suggestedTests: [],
            riskAreas: [],
        };
    }
    /**
     * Generate test data/fixtures
     */
    async generateTestData(schema, count = 5) {
        const prompt = `Generate test data for this schema:

${JSON.stringify(schema, null, 2)}

Generate:
1. ${count} realistic test data objects
2. A factory function to generate more

Return JSON with:
- data: Array of ${count} test data objects
- factory: TypeScript factory function code`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'Generate realistic, varied test data.',
        });
        return extractJSON(response) || {
            data: [],
            factory: '',
        };
    }
    /**
     * Generate mock implementations
     */
    async generateMocks(dependencies) {
        const prompt = `Generate mock implementations for:

${dependencies.map(d => `- ${d.name}${d.interface ? `:\n${d.interface}` : ''}`).join('\n\n')}

Generate:
1. Mock implementations with vi.fn()
2. Configurable return values
3. Spy capabilities
4. Reset functions

Use Vitest mocking utilities.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'Generate comprehensive mocks for testing.',
        });
        return extractCode(response) || '';
    }
    /**
     * Build test generation prompt
     */
    buildTestPrompt(config, framework) {
        const coverageTargets = config.coverage || ['functions', 'branches', 'edge-cases'];
        return `Generate ${config.type} tests for:

\`\`\`typescript
${config.code}
\`\`\`

${config.name ? `Name: ${config.name}` : ''}
${config.context ? `Context: ${config.context}` : ''}

Framework: ${framework}
${config.testingLibrary ? `Testing Library: ${config.testingLibrary}` : ''}
Coverage targets: ${coverageTargets.join(', ')}
${config.includeMocks ? 'Include mock generation' : ''}
${config.snapshots ? 'Include snapshot tests' : ''}

Generate comprehensive tests covering:
- Happy path scenarios
- Edge cases
- Error handling
- Async operations (if applicable)
- State changes (if applicable)

Return structured test code with clear test descriptions.`;
    }
    /**
     * Build E2E test prompt
     */
    buildE2EPrompt(config, framework) {
        return `Generate ${framework} E2E tests for: ${config.target}

Scenarios:
${config.scenarios.map(s => `
- ${s.name}
  Steps: ${s.steps.join(' -> ')}
  Expected: ${s.expected.join(', ')}`).join('\n')}

Requirements:
- Browsers: ${config.browsers?.join(', ') || 'chromium'}
- Mobile testing: ${config.mobile ? 'Yes' : 'No'}
- Accessibility checks: ${config.accessibility ? 'Yes' : 'No'}

Generate:
1. Page objects for reusability
2. Test scenarios
3. Configuration file
4. Assertions for all expected outcomes`;
    }
    /**
     * Get system prompt for test generation
     */
    getSystemPrompt(type, framework) {
        return `You are an expert test engineer generating ${type} tests using ${framework}.

Testing best practices:
- Arrange-Act-Assert pattern
- Descriptive test names
- One assertion per test (when practical)
- Proper mocking and isolation
- Clean setup and teardown

${framework === 'vitest' ? `Vitest patterns:
- describe() for grouping
- it() or test() for cases
- expect() for assertions
- vi.fn() and vi.mock() for mocking
- beforeEach/afterEach for setup` : ''}

PhilJS testing patterns:
- Test signal reactivity
- Test memo computations
- Test effect side effects
- Use @testing-library/dom for component tests
- Mock AI providers for testing`;
    }
    /**
     * Get E2E system prompt
     */
    getE2ESystemPrompt(framework) {
        if (framework === 'playwright') {
            return `You are an expert Playwright E2E test engineer.

Playwright patterns:
- Page Object Model for maintainability
- Locators for reliable element selection
- expect() with web-first assertions
- test.describe() for organization
- Parallel test execution
- Cross-browser testing`;
        }
        return `You are an expert Cypress E2E test engineer.

Cypress patterns:
- Custom commands for reusability
- cy.get() with data-testid
- should() for assertions
- Fixtures for test data
- Intercept for API mocking`;
    }
    /**
     * Get component test system prompt
     */
    getComponentTestSystemPrompt() {
        return `You are an expert component test engineer for PhilJS.

Component testing patterns:
- @testing-library/dom for queries
- render() to mount components
- userEvent for interactions
- screen queries (getByRole, getByText, etc.)
- waitFor() for async updates
- Test accessibility with testing-library/jest-dom

PhilJS-specific:
- Test signal updates trigger re-renders
- Test memo recalculations
- Test effect cleanup`;
    }
    /**
     * Parse test result
     */
    parseTestResult(response, config) {
        const jsonResult = extractJSON(response);
        if (jsonResult) {
            return jsonResult;
        }
        const code = extractCode(response) || '';
        const testCases = this.extractTestCases(code);
        return {
            code,
            framework: config.framework || 'vitest',
            type: config.type,
            testCases,
            imports: this.extractImports(code),
            coverage: config.coverage || [],
            explanation: this.extractExplanation(response),
        };
    }
    /**
     * Parse E2E result
     */
    parseE2EResult(response, config) {
        const jsonResult = extractJSON(response);
        if (jsonResult) {
            return jsonResult;
        }
        const code = extractCode(response) || '';
        return {
            code,
            framework: config.framework || 'playwright',
            scenarios: config.scenarios.map(s => ({
                name: s.name,
                code: '',
                steps: s.steps,
            })),
            explanation: 'E2E tests generated',
        };
    }
    /**
     * Extract test cases from code
     */
    extractTestCases(code) {
        const testCases = [];
        const testRegex = /(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]/g;
        let match;
        while ((match = testRegex.exec(code)) !== null) {
            const name = match[1];
            testCases.push({
                name,
                description: name,
                tests: this.inferTestPurpose(name),
                category: this.categorizeTest(name),
            });
        }
        return testCases;
    }
    /**
     * Infer test purpose from name
     */
    inferTestPurpose(name) {
        const lower = name.toLowerCase();
        if (lower.includes('render'))
            return 'Component rendering';
        if (lower.includes('click') || lower.includes('interaction'))
            return 'User interaction';
        if (lower.includes('error'))
            return 'Error handling';
        if (lower.includes('edge') || lower.includes('boundary'))
            return 'Edge case';
        if (lower.includes('async') || lower.includes('loading'))
            return 'Async behavior';
        return 'Functionality';
    }
    /**
     * Categorize test
     */
    categorizeTest(name) {
        const lower = name.toLowerCase();
        if (lower.includes('error') || lower.includes('throw') || lower.includes('fail'))
            return 'error-handling';
        if (lower.includes('edge') || lower.includes('boundary') || lower.includes('empty') || lower.includes('null'))
            return 'edge-case';
        if (lower.includes('integration') || lower.includes('together'))
            return 'integration';
        if (lower.includes('performance') || lower.includes('fast') || lower.includes('slow'))
            return 'performance';
        return 'happy-path';
    }
    /**
     * Extract imports from code
     */
    extractImports(code) {
        const imports = [];
        const importRegex = /import\s+(?:[\w{},\s*]+\s+from\s+)?['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(code)) !== null) {
            imports.push(match[1]);
        }
        return imports;
    }
    /**
     * Extract explanation from response
     */
    extractExplanation(response) {
        const beforeCode = response.split('```')[0].trim();
        return beforeCode || 'Tests generated successfully';
    }
}
/**
 * Create a test generator instance
 */
export function createTestGenerator(provider, options) {
    return new TestGenerator(provider, options);
}
/**
 * Quick test generation helper
 */
export async function generateTests(provider, code, type = 'unit') {
    const generator = new TestGenerator(provider);
    return generator.generateTests({ code, type });
}
/**
 * Quick unit test helper
 */
export async function generateUnitTests(provider, code, name) {
    const generator = new TestGenerator(provider);
    return generator.generateUnitTests(code, name);
}
/**
 * Quick E2E test helper
 */
export async function generateE2ETests(provider, target, scenarios) {
    const generator = new TestGenerator(provider);
    return generator.generateE2ETests({ target, scenarios });
}
// Re-export from index
export { TestGenerator as default };
//# sourceMappingURL=test-generator.js.map