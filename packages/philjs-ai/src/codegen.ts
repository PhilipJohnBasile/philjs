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
import { extractCode, extractJSON, validateCode } from './utils/parser.js';
import { SYSTEM_PROMPTS } from './utils/prompts.js';

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
  validation: { valid: boolean; errors: string[] };
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
  lines?: { start: number; end: number };
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
  lines: { start: number; end: number };
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
export class CodeGenerator {
  private provider: AIProvider;
  private defaultOptions: Partial<CompletionOptions>;

  constructor(provider: AIProvider, options?: Partial<CompletionOptions>) {
    this.provider = provider;
    this.defaultOptions = {
      temperature: 0.2,
      maxTokens: 4096,
      ...options,
    };
  }

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
  async generateComponent(
    description: string,
    options?: CodeGenOptions & { name?: string; props?: Array<{ name: string; type: string; required?: boolean }> }
  ): Promise<GeneratedComponentResult> {
    const name = options?.name || this.inferComponentName(description);
    const propsSection = options?.props
      ? `\nProps:\n${options.props.map(p => `- ${p.name}: ${p.type}${p.required ? ' (required)' : ''}`).join('\n')}`
      : '';

    const prompt = `Generate a PhilJS component based on this description:

${description}
${propsSection}

Component name: ${name}

Requirements:
- ${options?.useSignals !== false ? 'Use signals for reactive state' : 'Use standard state management'}
- ${options?.includeTypes !== false ? 'Include TypeScript types' : 'Minimal typing'}
- ${options?.includeJSDoc !== false ? 'Include JSDoc comments' : 'Minimal comments'}
- ${options?.styleApproach ? `Use ${options.styleApproach} for styling` : 'No specific styling required'}
- Follow PhilJS best practices
- Make the component accessible (ARIA labels, keyboard navigation)
- Export as a named export

Return the complete component code in a TypeScript code block.
Also provide a brief explanation of the component's functionality.`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      ...options,
      systemPrompt: this.getComponentSystemPrompt(options),
    });

    const code = extractCode(response) || '';
    const validation = validateCode(code);
    const propsInterface = this.extractPropsInterface(code);

    const result: GeneratedComponentResult = {
      code,
      name,
      explanation: this.extractExplanation(response),
      imports: this.extractImports(code),
      examples: this.extractExamples(response),
      validation,
    };
    if (propsInterface !== undefined) {
      result.propsInterface = propsInterface;
    }
    return result;
  }

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
  async generateFunction(
    description: string,
    options?: CodeGenOptions & { name?: string; async?: boolean }
  ): Promise<GeneratedFunctionResult> {
    const name = options?.name || this.inferFunctionName(description);

    const prompt = `Generate a TypeScript function based on this description:

${description}

Function name: ${name}
${options?.async ? 'Should be async.' : ''}

Requirements:
- ${options?.includeTypes !== false ? 'Include comprehensive TypeScript types' : 'Basic typing'}
- ${options?.includeJSDoc !== false ? 'Include JSDoc with @param and @returns' : 'Minimal comments'}
- Handle edge cases and errors gracefully
- Export the function
- Make it reusable and well-structured

Return the function code in a TypeScript code block.
Also provide:
1. The function signature
2. Parameter descriptions
3. Return type description
4. Usage example`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      ...options,
      systemPrompt: `${SYSTEM_PROMPTS.typescript}

Generate clean, well-typed TypeScript functions.
Follow functional programming principles where appropriate.
Handle errors properly with meaningful error messages.`,
    });

    const code = extractCode(response) || '';
    const validation = validateCode(code);
    const signature = this.extractFunctionSignature(code, name);
    const { parameters, returnType } = this.parseSignature(signature);

    return {
      code,
      name,
      signature,
      parameters,
      returnType,
      explanation: this.extractExplanation(response),
      imports: this.extractImports(code),
      examples: this.extractExamples(response),
      validation,
    };
  }

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
  async refactorCode(
    code: string,
    instruction: string,
    options?: CodeGenOptions & { preserveBehavior?: boolean; level?: 'conservative' | 'moderate' | 'aggressive' }
  ): Promise<RefactorResult> {
    const level = options?.level || 'moderate';
    const preserveBehavior = options?.preserveBehavior !== false;

    const prompt = `Refactor the following code according to this instruction:

Instruction: ${instruction}

Original code:
\`\`\`typescript
${code}
\`\`\`

Refactoring level: ${level}
Preserve behavior: ${preserveBehavior ? 'Yes' : 'No'}

Requirements:
- Apply the requested changes
- Maintain TypeScript types
- Follow PhilJS best practices
- Document significant changes

Return a JSON response with:
{
  "refactored": "the refactored code",
  "changes": [
    {
      "type": "performance|readability|patterns|signals|types|security|style",
      "description": "what changed",
      "before": "code before",
      "after": "code after"
    }
  ],
  "explanation": "overall explanation of refactoring",
  "breakingChanges": ["any breaking changes"]
}`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      ...options,
      maxTokens: 8192,
      systemPrompt: this.getRefactorSystemPrompt(level),
    });

    const result = extractJSON<{
      refactored: string;
      changes: RefactorChange[];
      explanation: string;
      breakingChanges?: string[];
    }>(response);

    if (result) {
      return {
        original: code,
        ...result,
      };
    }

    // Fallback: extract code and provide minimal result
    const refactored = extractCode(response) || code;
    return {
      original: code,
      refactored,
      changes: [],
      explanation: this.extractExplanation(response),
    };
  }

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
  async explainCode(
    code: string,
    options?: { detailLevel?: 'brief' | 'detailed' | 'comprehensive'; audience?: 'beginner' | 'intermediate' | 'expert' }
  ): Promise<CodeExplanation> {
    const detailLevel = options?.detailLevel || 'detailed';
    const audience = options?.audience || 'intermediate';

    const prompt = `Explain the following code for a ${audience} developer.
Detail level: ${detailLevel}

\`\`\`typescript
${code}
\`\`\`

Provide:
1. A high-level summary (1-2 sentences)
2. A detailed explanation of what the code does
3. Break down into logical sections with explanations
4. List key concepts and patterns used
5. Assess complexity (simple/moderate/complex with score 1-10)

Return JSON:
{
  "summary": "brief summary",
  "detailed": "detailed explanation",
  "sections": [
    {
      "name": "section name",
      "code": "code snippet",
      "explanation": "what this section does",
      "lines": { "start": 1, "end": 10 }
    }
  ],
  "concepts": ["concept1", "concept2"],
  "complexity": {
    "level": "simple|moderate|complex",
    "score": 5,
    "factors": ["factor1", "factor2"]
  }
}`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: `You are a code explanation expert.
Explain code clearly and accurately.
Tailor explanations to the target audience.
Identify patterns, concepts, and potential issues.`,
    });

    const result = extractJSON<CodeExplanation>(response);

    if (result) {
      return result;
    }

    // Fallback
    return {
      summary: 'Code explanation',
      detailed: response,
      sections: [],
      concepts: [],
      complexity: { level: 'moderate', score: 5, factors: [] },
    };
  }

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
  async generateTests(
    code: string,
    options?: {
      framework?: 'vitest' | 'jest';
      name?: string;
      coverage?: ('happy-path' | 'edge-cases' | 'error-handling' | 'async')[];
      includeMocks?: boolean;
    }
  ): Promise<GeneratedTestsResult> {
    const framework = options?.framework || 'vitest';
    const coverage = options?.coverage || ['happy-path', 'edge-cases', 'error-handling'];
    const name = options?.name || this.inferName(code);

    const prompt = `Generate comprehensive ${framework} tests for this code:

\`\`\`typescript
${code}
\`\`\`

${options?.name ? `Name: ${name}` : ''}

Requirements:
- Use ${framework} testing framework
- Cover: ${coverage.join(', ')}
- ${options?.includeMocks ? 'Include mock implementations' : 'Minimize mocking'}
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Test edge cases and error conditions

Return JSON:
{
  "code": "complete test file code",
  "framework": "${framework}",
  "testCount": number,
  "testCases": [
    {
      "name": "test name",
      "description": "what is tested",
      "category": "happy-path|edge-case|error-handling|integration|performance"
    }
  ],
  "coverage": ["covered areas"],
  "setup": "setup code if needed",
  "mocks": "mock code if needed"
}`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      maxTokens: 8192,
      systemPrompt: `${SYSTEM_PROMPTS.testing}

Generate comprehensive, well-structured tests using ${framework}.
Focus on meaningful test coverage over quantity.
Ensure tests are isolated and reproducible.`,
    });

    const result = extractJSON<GeneratedTestsResult>(response);

    if (result) {
      return result;
    }

    // Fallback
    const testCode = extractCode(response) || '';
    const testCases = this.extractTestCases(testCode);

    return {
      code: testCode,
      framework,
      testCount: testCases.length,
      testCases,
      coverage,
    };
  }

  /**
   * Generate code completion for a given context
   *
   * @param prefix - Code before the cursor
   * @param suffix - Code after the cursor
   * @param options - Completion options
   * @returns Suggested completion
   */
  async getCompletion(
    prefix: string,
    suffix: string,
    options?: { maxLength?: number; language?: string }
  ): Promise<string> {
    const prompt = `Complete the code at the cursor position.

Before cursor:
\`\`\`${options?.language || 'typescript'}
${prefix}
\`\`\`

After cursor:
\`\`\`${options?.language || 'typescript'}
${suffix}
\`\`\`

Requirements:
- Provide a natural continuation
- Match the code style
- Be syntactically correct
- Keep it concise (${options?.maxLength || 100} characters max)

Return ONLY the completion text, no explanation.`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      temperature: 0.1,
      maxTokens: options?.maxLength || 100,
      systemPrompt: 'Complete code naturally and concisely. Return only the completion, no markdown or explanation.',
    });

    // Clean up response
    let completion = response.trim();
    if (completion.startsWith('```')) {
      completion = extractCode(response) || completion;
    }

    return completion;
  }

  // ============ Private Helper Methods ============

  private getComponentSystemPrompt(options?: CodeGenOptions): string {
    return `${SYSTEM_PROMPTS.philjs}${SYSTEM_PROMPTS.typescript}

Generate production-quality PhilJS components.
${options?.useSignals !== false ? 'Use signal() for state, memo() for computed values, effect() for side effects.' : ''}

Component guidelines:
- Export as named export
- Include proper TypeScript types
- Add accessibility attributes (ARIA, keyboard nav)
- Handle loading and error states when applicable
- Use semantic HTML elements`;
  }

  private getRefactorSystemPrompt(level: 'conservative' | 'moderate' | 'aggressive'): string {
    const descriptions = {
      conservative: 'Make only safe, minimal changes. Preserve existing patterns.',
      moderate: 'Apply standard best practices. Balance improvement with stability.',
      aggressive: 'Make comprehensive improvements. Restructure if beneficial.',
    };

    return `You are a code refactoring expert for PhilJS applications.

Level: ${level}
${descriptions[level]}

PhilJS patterns:
- signal() for reactive state
- memo() for computed/derived values
- effect() for side effects with cleanup
- Fine-grained reactivity (no VDOM)

Always return valid JSON with the specified structure.`;
  }

  private inferComponentName(description: string): string {
    // Extract potential component name from description
    const words = description.split(/\s+/);
    const componentWords = words.filter(w =>
      w.length > 2 &&
      !['the', 'a', 'an', 'with', 'that', 'for', 'and', 'or'].includes(w.toLowerCase())
    );

    if (componentWords.length > 0) {
      const name = componentWords
        .slice(0, 2)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
      return name.replace(/[^a-zA-Z]/g, '') || 'Component';
    }

    return 'Component';
  }

  private inferFunctionName(description: string): string {
    const words = description.toLowerCase().split(/\s+/);
    const verbs = ['create', 'get', 'set', 'update', 'delete', 'fetch', 'handle', 'process', 'validate', 'format', 'parse', 'convert', 'calculate', 'check', 'find', 'filter', 'sort', 'transform'];

    let verb = 'handle';
    for (const word of words) {
      if (verbs.includes(word)) {
        verb = word;
        break;
      }
    }

    const nouns = words.filter(w =>
      w.length > 2 &&
      !verbs.includes(w) &&
      !['the', 'a', 'an', 'with', 'that', 'for', 'and', 'or', 'to', 'from'].includes(w)
    );

    if (nouns.length > 0) {
      const noun = nouns[0]!.charAt(0).toUpperCase() + nouns[0]!.slice(1);
      return `${verb}${noun}`;
    }

    return `${verb}Data`;
  }

  private inferName(code: string): string {
    // Try to find function/component name
    const funcMatch = code.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
    if (funcMatch?.[1]) return funcMatch[1];

    const constMatch = code.match(/(?:export\s+)?const\s+(\w+)\s*=/);
    if (constMatch?.[1]) return constMatch[1];

    return 'code';
  }

  private extractPropsInterface(code: string): string | undefined {
    const match = code.match(/interface\s+\w+Props\s*\{[\s\S]*?\}/);
    return match?.[0];
  }

  private extractFunctionSignature(code: string, name: string): string {
    const regex = new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${name}[^{]+`);
    const match = code.match(regex);
    return match?.[0].trim() || `function ${name}()`;
  }

  private parseSignature(signature: string): {
    parameters: Array<{ name: string; type: string; description?: string }>;
    returnType: string;
  } {
    const parameters: Array<{ name: string; type: string }> = [];

    // Extract parameters
    const paramsMatch = signature.match(/\(([^)]*)\)/);
    if (paramsMatch?.[1]?.trim()) {
      const params = paramsMatch[1].split(',');
      for (const param of params) {
        const parts = param.split(':').map(s => s.trim());
        const namePart = parts[0];
        const typePart = parts[1];
        if (namePart) {
          parameters.push({
            name: namePart.replace(/[?=].*/, ''),
            type: typePart || 'unknown',
          });
        }
      }
    }

    // Extract return type
    const returnMatch = signature.match(/\):\s*(.+)$/);
    const returnType = returnMatch?.[1]?.trim() || 'void';

    return { parameters, returnType };
  }

  private extractExplanation(response: string): string {
    const beforeCode = response.split('```')[0]?.trim();
    if (beforeCode) return beforeCode;

    const afterCode = response.split('```').slice(-1)[0]?.trim();
    if (afterCode && !afterCode.startsWith('{')) return afterCode;

    return 'Code generated successfully';
  }

  private extractImports(code: string): string[] {
    const imports: string[] = [];
    const regex = /import\s+(?:[\w{},\s*]+\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;

    while ((match = regex.exec(code)) !== null) {
      imports.push(match[1]!);
    }

    return imports;
  }

  private extractExamples(response: string): string[] {
    const examples: string[] = [];
    const exampleMatch = response.match(/(?:example|usage)[s]?[:\s]*\n?([\s\S]*?)(?=\n\n(?![^\n]*```)|$)/i);

    if (exampleMatch?.[1]) {
      const codeBlocks = exampleMatch[1].match(/```[\s\S]*?```/g);
      if (codeBlocks) {
        examples.push(...codeBlocks.map(b => b.replace(/```\w*\n?/g, '').trim()));
      }
    }

    return examples;
  }

  private extractTestCases(code: string): TestCase[] {
    const testCases: TestCase[] = [];
    const regex = /(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = regex.exec(code)) !== null) {
      const name = match[1]!;
      testCases.push({
        name,
        description: name,
        category: this.categorizeTest(name),
      });
    }

    return testCases;
  }

  private categorizeTest(name: string): TestCase['category'] {
    const lower = name.toLowerCase();
    if (lower.includes('error') || lower.includes('throw') || lower.includes('fail')) {
      return 'error-handling';
    }
    if (lower.includes('edge') || lower.includes('boundary') || lower.includes('empty') || lower.includes('null')) {
      return 'edge-case';
    }
    if (lower.includes('integration') || lower.includes('together')) {
      return 'integration';
    }
    if (lower.includes('performance') || lower.includes('fast') || lower.includes('slow')) {
      return 'performance';
    }
    return 'happy-path';
  }
}

/**
 * Create a code generator instance
 *
 * @param provider - AI provider to use
 * @param options - Default options for generation
 * @returns CodeGenerator instance
 */
export function createCodeGenerator(
  provider: AIProvider,
  options?: Partial<CompletionOptions>
): CodeGenerator {
  return new CodeGenerator(provider, options);
}

/**
 * Quick component generation helper
 *
 * @param provider - AI provider
 * @param description - Component description
 * @returns Generated component
 */
export async function generateComponent(
  provider: AIProvider,
  description: string
): Promise<GeneratedComponentResult> {
  const generator = new CodeGenerator(provider);
  return generator.generateComponent(description);
}

/**
 * Quick function generation helper
 *
 * @param provider - AI provider
 * @param description - Function description
 * @returns Generated function
 */
export async function generateFunction(
  provider: AIProvider,
  description: string
): Promise<GeneratedFunctionResult> {
  const generator = new CodeGenerator(provider);
  return generator.generateFunction(description);
}

/**
 * Quick refactoring helper
 *
 * @param provider - AI provider
 * @param code - Code to refactor
 * @param instruction - Refactoring instruction
 * @returns Refactored code
 */
export async function refactorCode(
  provider: AIProvider,
  code: string,
  instruction: string
): Promise<RefactorResult> {
  const generator = new CodeGenerator(provider);
  return generator.refactorCode(code, instruction);
}

/**
 * Quick code explanation helper
 *
 * @param provider - AI provider
 * @param code - Code to explain
 * @returns Code explanation
 */
export async function explainCode(
  provider: AIProvider,
  code: string
): Promise<CodeExplanation> {
  const generator = new CodeGenerator(provider);
  return generator.explainCode(code);
}

/**
 * Quick test generation helper
 *
 * @param provider - AI provider
 * @param code - Code to generate tests for
 * @returns Generated tests
 */
export async function generateTests(
  provider: AIProvider,
  code: string
): Promise<GeneratedTestsResult> {
  const generator = new CodeGenerator(provider);
  return generator.generateTests(code);
}
