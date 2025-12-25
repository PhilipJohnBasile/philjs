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
import { extractCode, extractJSON } from '../utils/parser.js';

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
export type CoverageTarget =
  | 'functions'
  | 'branches'
  | 'statements'
  | 'edge-cases'
  | 'error-handling'
  | 'async-operations';

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
export class TestGenerator {
  private provider: AIProvider;
  private defaultOptions: Partial<CompletionOptions>;

  constructor(provider: AIProvider, options?: Partial<CompletionOptions>) {
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
  async generateTests(config: TestGenerationConfig): Promise<GeneratedTests> {
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
  async generateUnitTests(
    code: string,
    name?: string,
    options?: Partial<TestGenerationConfig>
  ): Promise<GeneratedTests> {
    return this.generateTests({
      code,
      name,
      type: 'unit',
      framework: 'vitest',
      coverage: ['functions', 'branches', 'edge-cases', 'error-handling'],
      ...options,
    });
  }

  /**
   * Generate integration tests
   */
  async generateIntegrationTests(
    code: string,
    dependencies: string[],
    options?: Partial<TestGenerationConfig>
  ): Promise<GeneratedTests> {
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
  async generateE2ETests(config: E2ETestConfig): Promise<GeneratedE2ETests> {
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
  async generateComponentTests(
    componentCode: string,
    componentName: string,
    options?: {
      props?: Record<string, string>;
      states?: string[];
      interactions?: string[];
    }
  ): Promise<GeneratedTests> {
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
  async generateAPITests(
    apiCode: string,
    endpoints: { method: string; path: string; description: string }[]
  ): Promise<GeneratedTests> {
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
  async analyzeCoverage(
    code: string,
    existingTests?: string
  ): Promise<CoverageAnalysis> {
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

    return extractJSON<CoverageAnalysis>(response) || {
      overallCoverage: 0,
      missingCoverage: [],
      suggestedTests: [],
      riskAreas: [],
    };
  }

  /**
   * Generate test data/fixtures
   */
  async generateTestData(
    schema: Record<string, string>,
    count: number = 5
  ): Promise<{ data: Record<string, unknown>[]; factory: string }> {
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

    return extractJSON<{ data: Record<string, unknown>[]; factory: string }>(response) || {
      data: [],
      factory: '',
    };
  }

  /**
   * Generate mock implementations
   */
  async generateMocks(
    dependencies: { name: string; interface?: string }[]
  ): Promise<string> {
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
  private buildTestPrompt(config: TestGenerationConfig, framework: TestFramework): string {
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
  private buildE2EPrompt(config: E2ETestConfig, framework: 'playwright' | 'cypress'): string {
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
  private getSystemPrompt(type: TestType, framework: TestFramework): string {
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
  private getE2ESystemPrompt(framework: 'playwright' | 'cypress'): string {
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
  private getComponentTestSystemPrompt(): string {
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
  private parseTestResult(response: string, config: TestGenerationConfig): GeneratedTests {
    const jsonResult = extractJSON<GeneratedTests>(response);
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
  private parseE2EResult(response: string, config: E2ETestConfig): GeneratedE2ETests {
    const jsonResult = extractJSON<GeneratedE2ETests>(response);
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
  private extractTestCases(code: string): TestCase[] {
    const testCases: TestCase[] = [];
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
  private inferTestPurpose(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('render')) return 'Component rendering';
    if (lower.includes('click') || lower.includes('interaction')) return 'User interaction';
    if (lower.includes('error')) return 'Error handling';
    if (lower.includes('edge') || lower.includes('boundary')) return 'Edge case';
    if (lower.includes('async') || lower.includes('loading')) return 'Async behavior';
    return 'Functionality';
  }

  /**
   * Categorize test
   */
  private categorizeTest(name: string): TestCase['category'] {
    const lower = name.toLowerCase();
    if (lower.includes('error') || lower.includes('throw') || lower.includes('fail')) return 'error-handling';
    if (lower.includes('edge') || lower.includes('boundary') || lower.includes('empty') || lower.includes('null')) return 'edge-case';
    if (lower.includes('integration') || lower.includes('together')) return 'integration';
    if (lower.includes('performance') || lower.includes('fast') || lower.includes('slow')) return 'performance';
    return 'happy-path';
  }

  /**
   * Extract imports from code
   */
  private extractImports(code: string): string[] {
    const imports: string[] = [];
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
  private extractExplanation(response: string): string {
    const beforeCode = response.split('```')[0].trim();
    return beforeCode || 'Tests generated successfully';
  }
}

/**
 * Create a test generator instance
 */
export function createTestGenerator(
  provider: AIProvider,
  options?: Partial<CompletionOptions>
): TestGenerator {
  return new TestGenerator(provider, options);
}

/**
 * Quick test generation helper
 */
export async function generateTests(
  provider: AIProvider,
  code: string,
  type: TestType = 'unit'
): Promise<GeneratedTests> {
  const generator = new TestGenerator(provider);
  return generator.generateTests({ code, type });
}

/**
 * Quick unit test helper
 */
export async function generateUnitTests(
  provider: AIProvider,
  code: string,
  name?: string
): Promise<GeneratedTests> {
  const generator = new TestGenerator(provider);
  return generator.generateUnitTests(code, name);
}

/**
 * Quick E2E test helper
 */
export async function generateE2ETests(
  provider: AIProvider,
  target: string,
  scenarios: E2EScenario[]
): Promise<GeneratedE2ETests> {
  const generator = new TestGenerator(provider);
  return generator.generateE2ETests({ target, scenarios });
}

// Re-export from index
export { TestGenerator as default };
