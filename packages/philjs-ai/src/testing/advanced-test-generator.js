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
import { extractCode, extractJSON } from '../utils/parser.js';
import { SYSTEM_PROMPTS } from '../utils/prompts.js';
// ============================================================================
// Advanced Test Generator
// ============================================================================
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
export class AdvancedTestGenerator {
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
     * Generate a complete test suite for code
     *
     * @param code - Code to test
     * @param options - Generation options
     * @returns Generated test suite
     */
    async generateTestSuite(code, options) {
        const framework = options?.framework || 'vitest';
        const types = options?.types || ['unit'];
        const style = options?.style || 'bdd';
        // Generate main test file
        const testFile = await this.generateMainTestFile(code, framework, types, style, options);
        // Extract test case info
        const testCases = this.extractTestCases(testFile, types);
        // Generate mocks if requested
        let mocks;
        if (options?.includeMocks) {
            mocks = await this.generateMocks(code, framework);
        }
        // Generate fixtures if requested
        let fixtures;
        if (options?.includeFixtures) {
            fixtures = await this.generateFixtures(code);
        }
        // Generate utilities if requested
        let utilities;
        if (options?.includeUtils) {
            utilities = await this.generateTestUtils(code, framework);
        }
        // Analyze coverage
        const coverage = await this.analyzeCoverage(code, testFile, options?.coverageTarget);
        // Get suggestions for additional tests
        const suggestions = await this.getSuggestions(code, testCases);
        // Generate file name
        const fileName = this.generateFileName(code, framework);
        const result = {
            testFile,
            fileName,
            testCases,
            coverage,
            suggestions,
        };
        if (mocks !== undefined)
            result.mocks = mocks;
        if (fixtures !== undefined)
            result.fixtures = fixtures;
        if (utilities !== undefined)
            result.utilities = utilities;
        return result;
    }
    /**
     * Generate unit tests specifically
     *
     * @param code - Code to test
     * @param options - Options
     * @returns Unit test code
     */
    async generateUnitTests(code, options) {
        const framework = options?.framework || 'vitest';
        const prompt = `Generate comprehensive unit tests for this code:

\`\`\`typescript
${code}
\`\`\`

Framework: ${framework}
Style: ${options?.style || 'bdd'}

Generate tests covering:
1. All exported functions and components
2. All props and their variations
3. All state changes
4. Signal reactivity
5. Event handlers
6. Edge cases (null, undefined, empty, max values)
7. Error conditions
8. Loading/async states

Requirements:
- Use describe/it blocks (${options?.style === 'tdd' ? 'test blocks' : 'describe/it'})
- Use proper ${framework} assertions
- Mock external dependencies
- Use meaningful test descriptions
- Follow Arrange-Act-Assert pattern
- Include both positive and negative tests

Return only the test code.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            ...options,
            systemPrompt: this.getTestSystemPrompt(framework),
        });
        return extractCode(response) || '';
    }
    /**
     * Generate integration tests
     *
     * @param code - Code to test
     * @param relatedCode - Related components/code
     * @param options - Options
     * @returns Integration test code
     */
    async generateIntegrationTests(code, relatedCode, options) {
        const framework = options?.framework || 'vitest';
        const prompt = `Generate integration tests for this code:

Main code:
\`\`\`typescript
${code}
\`\`\`

${relatedCode ? `Related code:\n\`\`\`typescript\n${relatedCode}\n\`\`\`` : ''}

Generate integration tests that:
1. Test component composition
2. Test data flow between components
3. Test context/state sharing
4. Test navigation/routing if applicable
5. Test form submissions
6. Test API interactions (mocked)
7. Test user workflows

Framework: ${framework}

Return the integration test code.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            ...options,
            systemPrompt: this.getTestSystemPrompt(framework),
        });
        return extractCode(response) || '';
    }
    /**
     * Generate E2E test scenarios
     *
     * @param appDescription - Description of the app/feature
     * @param options - Options
     * @returns E2E scenarios
     */
    async generateE2EScenarios(appDescription, options) {
        const framework = options?.framework || 'playwright';
        const prompt = `Generate E2E test scenarios for:

${appDescription}

Create comprehensive user journey scenarios including:
1. Happy path flows
2. Error scenarios
3. Edge cases
4. Authentication flows (if applicable)
5. Form submissions
6. Navigation flows
7. Data CRUD operations

For each scenario provide:
- name: Descriptive name
- description: User story format
- steps: Array of test steps
- setup: Any required setup
- cleanup: Cleanup steps
- estimatedDuration: Estimated time in ms

Each step should have:
- description: What the user does
- action: navigate, click, type, wait, assert, screenshot, custom
- target: CSS selector or URL
- value: Input value if applicable
- expected: Expected result

Return JSON array of E2EScenario objects.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: `You are an E2E testing expert. Generate comprehensive ${framework} test scenarios.`,
        });
        return extractJSON(response) || [];
    }
    /**
     * Generate E2E test code from scenarios
     *
     * @param scenarios - E2E scenarios
     * @param framework - Test framework
     * @returns E2E test code
     */
    async generateE2ECode(scenarios, framework = 'playwright') {
        const prompt = `Convert these E2E scenarios to ${framework} test code:

${JSON.stringify(scenarios, null, 2)}

Generate complete ${framework} test file with:
- Proper imports
- Page object pattern (if beneficial)
- Setup/teardown hooks
- All test cases from scenarios
- Proper assertions
- Wait strategies
- Screenshot on failure

Return the complete test file.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: `You are a ${framework} testing expert. Generate production-ready E2E tests.`,
        });
        return extractCode(response) || '';
    }
    /**
     * Generate accessibility tests
     *
     * @param componentCode - Component to test
     * @param options - Options
     * @returns Accessibility tests
     */
    async generateA11yTests(componentCode, options) {
        const level = options?.wcagLevel || 'AA';
        const prompt = `Generate accessibility tests for this component:

\`\`\`typescript
${componentCode}
\`\`\`

Target WCAG Level: ${level}

Generate tests for:
1. Keyboard navigation
2. Screen reader accessibility
3. Color contrast
4. Focus management
5. ARIA attributes
6. Semantic HTML
7. Form accessibility
8. Image alt text
9. Heading hierarchy
10. Link text

For each test provide:
- name: Test name
- wcagCriterion: WCAG criterion (e.g., "1.1.1 Non-text Content")
- code: vitest test code
- checks: What the test verifies

Return JSON array of A11yTest objects.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are an accessibility testing expert. Generate comprehensive a11y tests.',
        });
        return extractJSON(response) || [];
    }
    /**
     * Generate snapshot tests
     *
     * @param componentCode - Component code
     * @param states - Different states to snapshot
     * @returns Snapshot test code
     */
    async generateSnapshotTests(componentCode, states) {
        const defaultStates = [
            'default',
            'loading',
            'error',
            'empty',
            'with data',
            'disabled',
        ];
        const testStates = states || defaultStates;
        const prompt = `Generate snapshot tests for this component:

\`\`\`typescript
${componentCode}
\`\`\`

States to snapshot:
${testStates.map(s => `- ${s}`).join('\n')}

Generate vitest snapshot tests that:
1. Render component in each state
2. Create a snapshot for each
3. Include prop variations
4. Test responsive layouts if applicable

Return the snapshot test code.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: SYSTEM_PROMPTS.testing,
        });
        return extractCode(response) || '';
    }
    /**
     * Generate performance tests
     *
     * @param componentCode - Component code
     * @param options - Options
     * @returns Performance test code
     */
    async generatePerformanceTests(componentCode, options) {
        const framework = options?.framework || 'vitest';
        const thresholds = options?.thresholds || {
            renderTime: 16, // 60fps
            updateTime: 8,
            memoryMB: 10,
        };
        const prompt = `Generate performance tests for this component:

\`\`\`typescript
${componentCode}
\`\`\`

Framework: ${framework}
Thresholds: ${JSON.stringify(thresholds)}

Generate tests for:
1. Initial render time
2. Re-render time
3. State update performance
4. Memory usage
5. Large list rendering (if applicable)
6. Signal update efficiency

Include:
- Performance measurement utilities
- Multiple iterations for accuracy
- Statistical analysis (mean, std dev)
- Threshold assertions
- Memory leak detection

Return the performance test code.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are a performance testing expert. Generate comprehensive perf tests.',
        });
        return extractCode(response) || '';
    }
    /**
     * Analyze test coverage and suggest improvements
     *
     * @param code - Original code
     * @param tests - Existing tests
     * @returns Coverage analysis and suggestions
     */
    async analyzeTestCoverage(code, tests) {
        const prompt = `Analyze test coverage for this code and tests:

Code:
\`\`\`typescript
${code}
\`\`\`

Tests:
\`\`\`typescript
${tests}
\`\`\`

Analyze:
1. What's tested and what's not
2. Branch coverage gaps
3. Edge cases missing
4. Error handling coverage
5. State transition coverage

Return JSON:
{
  "coverage": {
    "statements": 0-100,
    "branches": 0-100,
    "functions": 0-100,
    "lines": 0-100,
    "uncovered": ["list of uncovered areas"],
    "suggestions": ["coverage improvement suggestions"]
  },
  "missingTests": [
    {
      "name": "test name",
      "description": "what to test",
      "type": "unit|integration|...",
      "category": "rendering|interaction|...",
      "priority": "critical|high|medium|low",
      "assertionCount": 3
    }
  ],
  "improvements": ["general improvements"]
}`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are a test coverage analyst. Provide accurate coverage analysis.',
        });
        const result = extractJSON(response);
        return result || {
            coverage: {
                statements: 0,
                branches: 0,
                functions: 0,
                lines: 0,
                uncovered: [],
                suggestions: [],
            },
            missingTests: [],
            improvements: [],
        };
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    async generateMainTestFile(code, framework, types, style, options) {
        const typeDescriptions = types.map(t => this.getTypeDescription(t)).join('\n');
        const prompt = `Generate a comprehensive test file for this code:

\`\`\`typescript
${code}
\`\`\`

Framework: ${framework}
Test Types: ${types.join(', ')}
Style: ${style}

Include the following types of tests:
${typeDescriptions}

Requirements:
- Import testing utilities from ${framework}
- Import @testing-library/react for component tests
- Use ${style === 'bdd' ? 'describe/it' : 'test'} blocks
- Mock external dependencies
- Use meaningful, descriptive test names
- Cover happy paths and edge cases
- Test error handling
- Include async/await for async code
- Add comments explaining complex tests
${options?.includeMocks ? '- Include mock implementations' : ''}

Return the complete test file.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            ...options,
            maxTokens: 8192,
            systemPrompt: this.getTestSystemPrompt(framework),
        });
        return extractCode(response) || '';
    }
    getTypeDescription(type) {
        const descriptions = {
            unit: '- Unit tests: Test individual functions and components in isolation',
            integration: '- Integration tests: Test component composition and data flow',
            e2e: '- E2E tests: Test full user workflows',
            accessibility: '- Accessibility tests: Test keyboard navigation, ARIA, screen readers',
            snapshot: '- Snapshot tests: Test visual consistency',
            performance: '- Performance tests: Test render times and memory',
            visual: '- Visual tests: Test visual appearance',
        };
        return descriptions[type];
    }
    getTestSystemPrompt(framework) {
        return `${SYSTEM_PROMPTS.testing}

You are an expert in ${framework} testing.
Generate comprehensive, maintainable tests.
Follow best practices for ${framework}.
Use proper assertions and matchers.
Include setup and teardown when needed.`;
    }
    extractTestCases(testFile, types) {
        const testCases = [];
        const testMatches = testFile.matchAll(/(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]/g);
        for (const match of testMatches) {
            const name = match[1];
            const category = this.inferCategory(name);
            const priority = this.inferPriority(name, category);
            testCases.push({
                name,
                description: name,
                type: this.inferTestType(name, types),
                category,
                priority,
                assertionCount: 1,
            });
        }
        return testCases;
    }
    inferCategory(testName) {
        const lower = testName.toLowerCase();
        if (lower.includes('render'))
            return 'rendering';
        if (lower.includes('click') || lower.includes('interact'))
            return 'interaction';
        if (lower.includes('state'))
            return 'state';
        if (lower.includes('prop'))
            return 'props';
        if (lower.includes('event') || lower.includes('emit'))
            return 'events';
        if (lower.includes('hook') || lower.includes('use'))
            return 'hooks';
        if (lower.includes('signal'))
            return 'signals';
        if (lower.includes('api') || lower.includes('fetch'))
            return 'api';
        if (lower.includes('route') || lower.includes('navigate'))
            return 'routing';
        if (lower.includes('error') || lower.includes('fail'))
            return 'error-handling';
        if (lower.includes('edge') || lower.includes('empty') || lower.includes('null'))
            return 'edge-cases';
        if (lower.includes('accessible') || lower.includes('a11y'))
            return 'accessibility';
        if (lower.includes('performance') || lower.includes('fast'))
            return 'performance';
        return 'rendering';
    }
    inferPriority(testName, category) {
        if (category === 'error-handling')
            return 'critical';
        if (category === 'accessibility')
            return 'high';
        if (category === 'edge-cases')
            return 'high';
        if (testName.toLowerCase().includes('should'))
            return 'high';
        if (category === 'performance')
            return 'medium';
        return 'medium';
    }
    inferTestType(testName, availableTypes) {
        const lower = testName.toLowerCase();
        if (lower.includes('e2e') || lower.includes('workflow'))
            return 'e2e';
        if (lower.includes('accessibility') || lower.includes('a11y'))
            return 'accessibility';
        if (lower.includes('snapshot'))
            return 'snapshot';
        if (lower.includes('performance'))
            return 'performance';
        if (lower.includes('integration') || lower.includes('together'))
            return 'integration';
        return availableTypes[0] || 'unit';
    }
    async generateMocks(code, framework) {
        const prompt = `Generate mock files for testing this code:

\`\`\`typescript
${code}
\`\`\`

Framework: ${framework}

Identify and mock:
- External API calls
- Context providers
- External libraries
- Browser APIs
- File system operations

For each mock provide:
- name: File name
- content: Mock implementation
- mocks: What it mocks

Return JSON array of MockFile objects.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
        });
        return extractJSON(response) || [];
    }
    async generateFixtures(code) {
        const prompt = `Generate test fixtures for this code:

\`\`\`typescript
${code}
\`\`\`

Generate fixtures for:
- Sample data
- API responses
- Initial states
- Component props

For each fixture provide:
- name: File name
- content: Fixture data (TypeScript)
- type: data, component, api-response, state

Return JSON array of FixtureFile objects.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
        });
        return extractJSON(response) || [];
    }
    async generateTestUtils(code, framework) {
        const prompt = `Generate test utilities for testing this code:

\`\`\`typescript
${code}
\`\`\`

Framework: ${framework}

Generate utilities for:
- Custom render function with providers
- Wait utilities
- User event helpers
- Mock factories
- Assertion helpers
- Cleanup utilities

Return the test utilities code.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
        });
        return extractCode(response) || '';
    }
    async analyzeCoverage(code, tests, target) {
        // Simple static analysis
        const codeLines = code.split('\n').length;
        const testLines = tests.split('\n').length;
        const testCount = (tests.match(/(?:it|test)\s*\(/g) || []).length;
        // Estimate coverage based on test count and code size
        const estimatedCoverage = Math.min(100, Math.round((testCount * 10 / Math.log(codeLines)) * 10));
        // Find uncovered areas
        const uncovered = [];
        const functionNames = code.match(/(?:function|const)\s+(\w+)/g)?.map((m) => m.split(/\s+/)[1]) || [];
        for (const name of functionNames) {
            if (!tests.includes(name)) {
                uncovered.push(name);
            }
        }
        const suggestions = [];
        if (estimatedCoverage < (target || 80)) {
            suggestions.push(`Coverage is below target (${target || 80}%). Add more tests.`);
        }
        if (uncovered.length > 0) {
            suggestions.push(`Add tests for: ${uncovered.slice(0, 3).join(', ')}`);
        }
        return {
            statements: estimatedCoverage,
            branches: estimatedCoverage - 10,
            functions: estimatedCoverage + 5,
            lines: estimatedCoverage,
            uncovered,
            suggestions,
        };
    }
    async getSuggestions(code, testCases) {
        const suggestions = [];
        // Check for missing categories
        const categories = new Set(testCases.map(t => t.category));
        if (!categories.has('error-handling')) {
            suggestions.push('Add error handling tests');
        }
        if (!categories.has('edge-cases')) {
            suggestions.push('Add edge case tests');
        }
        if (!categories.has('accessibility') && code.includes('<')) {
            suggestions.push('Add accessibility tests for component');
        }
        // Check for balance
        const criticalCount = testCases.filter(t => t.priority === 'critical').length;
        if (criticalCount === 0) {
            suggestions.push('Consider adding critical path tests');
        }
        return suggestions;
    }
    generateFileName(code, framework) {
        const nameMatch = code.match(/(?:export\s+)?(?:function|const|class)\s+(\w+)/);
        const name = nameMatch?.[1] || 'component';
        const ext = framework === 'vitest' ? 'test.ts' : 'spec.ts';
        return `${name}.${ext}`;
    }
}
// ============================================================================
// Factory Functions
// ============================================================================
/**
 * Create an advanced test generator instance
 */
export function createAdvancedTestGenerator(provider, options) {
    return new AdvancedTestGenerator(provider, options);
}
/**
 * Quick test suite generation helper
 */
export async function generateTestSuite(provider, code, options) {
    const generator = new AdvancedTestGenerator(provider);
    return generator.generateTestSuite(code, options);
}
/**
 * Quick unit test generation helper
 */
export async function generateUnitTestsForCode(provider, code, framework = 'vitest') {
    const generator = new AdvancedTestGenerator(provider);
    return generator.generateUnitTests(code, { framework });
}
/**
 * Quick E2E scenario generation helper
 */
export async function generateE2ETestScenarios(provider, appDescription) {
    const generator = new AdvancedTestGenerator(provider);
    return generator.generateE2EScenarios(appDescription);
}
//# sourceMappingURL=advanced-test-generator.js.map