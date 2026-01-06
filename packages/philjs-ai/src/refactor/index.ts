/**
 * AI Refactoring Module
 *
 * AI-powered code refactoring for PhilJS
 *
 * Features:
 * - Code optimization
 * - Performance improvements
 * - Accessibility fixes
 * - Best practices enforcement
 */

import type { AIProvider, CompletionOptions, RefactorSuggestion, CodeReviewResult, CodeIssue } from '../types.js';
import { extractCode, extractJSON, validateCode } from '../utils/parser.js';

/**
 * Refactoring configuration
 */
export interface RefactorConfig {
  /** Code to refactor */
  code: string;
  /** File path for context */
  filePath?: string;
  /** Focus areas for refactoring */
  focusAreas?: RefactorFocusArea[];
  /** Aggressiveness level */
  level?: 'conservative' | 'moderate' | 'aggressive';
  /** Include explanations */
  includeExplanations?: boolean;
  /** Preserve behavior exactly */
  preserveBehavior?: boolean;
  /** Maximum number of suggestions */
  maxSuggestions?: number;
}

/**
 * Refactoring focus areas
 */
export type RefactorFocusArea =
  | 'signals'
  | 'performance'
  | 'accessibility'
  | 'patterns'
  | 'readability'
  | 'types'
  | 'memory'
  | 'security'
  | 'testing';

/**
 * Refactoring result
 */
export interface RefactorResult {
  /** Original code */
  original: string;
  /** Refactored code */
  refactored: string;
  /** List of suggestions applied */
  suggestions: RefactorSuggestion[];
  /** Overall improvement summary */
  summary: string;
  /** Potential breaking changes */
  breakingChanges?: string[];
  /** Testing recommendations */
  testingRecommendations?: string[];
}

/**
 * Performance analysis result
 */
export interface PerformanceAnalysis {
  /** Performance issues found */
  issues: PerformanceIssue[];
  /** Optimization suggestions */
  optimizations: PerformanceOptimization[];
  /** Estimated improvement */
  estimatedImprovement: {
    renderTime?: string;
    memoryUsage?: string;
    bundleSize?: string;
  };
  /** Metrics before/after */
  metrics?: {
    complexity: { before: number; after: number };
    signalUsage: { before: number; after: number };
  };
}

/**
 * Performance issue
 */
export interface PerformanceIssue {
  /** Issue type */
  type: 'unnecessary-rerender' | 'missing-memo' | 'expensive-computation' | 'memory-leak' | 'large-bundle' | 'blocking-operation';
  /** Issue description */
  description: string;
  /** Code location */
  location?: { line: number; column: number };
  /** Severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Suggested fix */
  fix?: string;
}

/**
 * Performance optimization
 */
export interface PerformanceOptimization {
  /** Optimization name */
  name: string;
  /** Description */
  description: string;
  /** Before code */
  before: string;
  /** After code */
  after: string;
  /** Impact level */
  impact: 'low' | 'medium' | 'high';
  /** Implementation effort */
  effort: 'trivial' | 'easy' | 'moderate' | 'significant';
}

/**
 * Accessibility audit result
 */
export interface AccessibilityAudit {
  /** Accessibility issues */
  issues: AccessibilityIssue[];
  /** Fixes applied */
  fixes: AccessibilityFix[];
  /** WCAG compliance summary */
  compliance: {
    level: 'A' | 'AA' | 'AAA' | 'non-compliant';
    passedCriteria: string[];
    failedCriteria: string[];
  };
  /** Improved code */
  improvedCode?: string;
}

/**
 * Accessibility issue
 */
export interface AccessibilityIssue {
  /** WCAG criterion */
  criterion: string;
  /** Issue description */
  description: string;
  /** Element/code affected */
  element: string;
  /** Severity */
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  /** How to fix */
  howToFix: string;
}

/**
 * Accessibility fix
 */
export interface AccessibilityFix {
  /** Fix description */
  description: string;
  /** Before code */
  before: string;
  /** After code */
  after: string;
  /** WCAG criterion addressed */
  criterion: string;
}

/**
 * Best practices check result
 */
export interface BestPracticesResult {
  /** Violations found */
  violations: BestPracticeViolation[];
  /** Improvements made */
  improvements: BestPracticeImprovement[];
  /** Score out of 100 */
  score: number;
  /** Improved code */
  improvedCode?: string;
}

/**
 * Best practice violation
 */
export interface BestPracticeViolation {
  /** Rule name */
  rule: string;
  /** Description */
  description: string;
  /** Code affected */
  code: string;
  /** Suggestion */
  suggestion: string;
  /** Category */
  category: 'code-style' | 'architecture' | 'security' | 'performance' | 'maintainability';
}

/**
 * Best practice improvement
 */
export interface BestPracticeImprovement {
  /** Rule name */
  rule: string;
  /** Before code */
  before: string;
  /** After code */
  after: string;
  /** Explanation */
  explanation: string;
}

/**
 * AI Refactoring Engine
 */
export class RefactoringEngine {
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
   * Refactor code with AI suggestions
   */
  async refactor(config: RefactorConfig): Promise<RefactorResult> {
    const focusAreas = config.focusAreas || ['performance', 'patterns', 'readability'];
    const prompt = this.buildRefactorPrompt(config, focusAreas);

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: this.getSystemPrompt(config.level || 'moderate'),
    });

    return this.parseRefactorResult(response, config.code);
  }

  /**
   * Analyze and improve performance
   */
  async analyzePerformance(code: string): Promise<PerformanceAnalysis> {
    const prompt = `Analyze performance of this PhilJS code:

\`\`\`typescript
${code}
\`\`\`

Identify:
1. Performance issues (unnecessary rerenders, missing memos, expensive computations, memory leaks)
2. Optimization opportunities
3. Signal usage patterns that could be improved
4. Bundle size considerations

For each issue and optimization, provide severity, description, and fix.
Estimate potential improvements.

Return JSON with:
- issues: Array of performance issues
- optimizations: Array of optimization suggestions with before/after code
- estimatedImprovement: { renderTime, memoryUsage, bundleSize }
- metrics: { complexity, signalUsage } before and after`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a performance optimization expert for reactive UI frameworks.',
    });

    return extractJSON<PerformanceAnalysis>(response) || {
      issues: [],
      optimizations: [],
      estimatedImprovement: {},
    };
  }

  /**
   * Audit and fix accessibility issues
   */
  async auditAccessibility(
    code: string,
    targetLevel: 'A' | 'AA' | 'AAA' = 'AA'
  ): Promise<AccessibilityAudit> {
    const prompt = `Audit this PhilJS component for WCAG ${targetLevel} accessibility:

\`\`\`typescript
${code}
\`\`\`

Check for:
1. Missing ARIA labels and roles
2. Keyboard navigation issues
3. Color contrast problems
4. Screen reader compatibility
5. Focus management
6. Form accessibility
7. Interactive element requirements

Provide:
- issues: Array of accessibility issues with WCAG criterion, description, severity, howToFix
- fixes: Array of fixes with before/after code
- compliance: { level, passedCriteria, failedCriteria }
- improvedCode: The code with all fixes applied`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: `You are a WCAG accessibility expert targeting Level ${targetLevel} compliance.`,
    });

    return extractJSON<AccessibilityAudit>(response) || {
      issues: [],
      fixes: [],
      compliance: { level: 'non-compliant', passedCriteria: [], failedCriteria: [] },
    };
  }

  /**
   * Check and improve best practices
   */
  async checkBestPractices(
    code: string,
    categories?: BestPracticeViolation['category'][]
  ): Promise<BestPracticesResult> {
    const cats = categories || ['code-style', 'architecture', 'performance', 'maintainability'];

    const prompt = `Check this PhilJS code for best practices in: ${cats.join(', ')}

\`\`\`typescript
${code}
\`\`\`

Check:
- PhilJS patterns (signal usage, memo optimization, effect cleanup)
- TypeScript best practices
- Component structure and organization
- Error handling
- Code clarity and maintainability
- Security considerations

Return JSON with:
- violations: Array of violations with rule, description, code, suggestion, category
- improvements: Array of improvements with rule, before, after, explanation
- score: Overall score 0-100
- improvedCode: Code with all improvements applied`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a code quality expert for PhilJS applications.',
    });

    return extractJSON<BestPracticesResult>(response) || {
      violations: [],
      improvements: [],
      score: 0,
    };
  }

  /**
   * Convert signals usage to optimal patterns
   */
  async optimizeSignals(code: string): Promise<{
    code: string;
    changes: string[];
    explanation: string;
  }> {
    const prompt = `Optimize signal usage in this PhilJS code:

\`\`\`typescript
${code}
\`\`\`

Optimize:
1. Replace useState patterns with signal()
2. Add memo() for computed values
3. Consolidate related signals
4. Add proper effect() cleanup
5. Optimize signal granularity

Return JSON with:
- code: Optimized code
- changes: Array of changes made
- explanation: Overall explanation of optimizations`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are an expert in fine-grained reactivity patterns.',
    });

    const result = extractJSON<{ code: string; changes: string[]; explanation: string }>(response);
    return result || {
      code: extractCode(response) || code,
      changes: [],
      explanation: 'Code analyzed',
    };
  }

  /**
   * Code review with AI
   */
  async reviewCode(
    code: string,
    filePath?: string,
    aspects?: ('bugs' | 'performance' | 'security' | 'style' | 'patterns')[]
  ): Promise<CodeReviewResult> {
    const reviewAspects = aspects || ['bugs', 'performance', 'security', 'style', 'patterns'];

    const prompt = `Review this PhilJS code focusing on: ${reviewAspects.join(', ')}

${filePath ? `File: ${filePath}` : ''}

\`\`\`typescript
${code}
\`\`\`

Provide a thorough review with:
- issues: Array of issues found { type, severity, message, line, suggestion }
- suggestions: Array of improvement suggestions
- overallScore: Quality score 0-100
- summary: Brief summary of findings`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a senior code reviewer for PhilJS applications.',
    });

    return extractJSON<CodeReviewResult>(response) || {
      issues: [],
      suggestions: [],
      overallScore: 0,
      summary: 'Review completed',
    };
  }

  /**
   * Extract and improve TypeScript types
   */
  async improveTypes(code: string): Promise<{
    code: string;
    addedTypes: string[];
    improvedTypes: string[];
  }> {
    const prompt = `Improve TypeScript types in this code:

\`\`\`typescript
${code}
\`\`\`

Improvements:
1. Add explicit types where missing
2. Replace 'any' with proper types
3. Add generic constraints
4. Improve interface/type definitions
5. Add JSDoc type annotations

Return JSON with:
- code: Improved code with better types
- addedTypes: Array of new types added
- improvedTypes: Array of types that were improved`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a TypeScript type expert.',
    });

    const result = extractJSON<{ code: string; addedTypes: string[]; improvedTypes: string[] }>(response);
    return result || {
      code: extractCode(response) || code,
      addedTypes: [],
      improvedTypes: [],
    };
  }

  /**
   * Simplify complex code
   */
  async simplify(code: string): Promise<{
    code: string;
    complexity: { before: number; after: number };
    changes: string[];
  }> {
    const prompt = `Simplify this code while preserving functionality:

\`\`\`typescript
${code}
\`\`\`

Simplifications:
1. Reduce nesting
2. Extract reusable functions
3. Simplify conditionals
4. Remove redundant code
5. Improve variable names
6. Break down large functions

Return JSON with:
- code: Simplified code
- complexity: { before, after } cyclomatic complexity scores
- changes: Array of simplifications made`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You simplify code while maintaining readability and functionality.',
    });

    const result = extractJSON<{ code: string; complexity: { before: number; after: number }; changes: string[] }>(response);
    return result || {
      code: extractCode(response) || code,
      complexity: { before: 0, after: 0 },
      changes: [],
    };
  }

  /**
   * Build refactor prompt
   */
  private buildRefactorPrompt(
    config: RefactorConfig,
    focusAreas: RefactorFocusArea[]
  ): string {
    return `Refactor this PhilJS code focusing on: ${focusAreas.join(', ')}

${config.filePath ? `File: ${config.filePath}` : ''}

\`\`\`typescript
${config.code}
\`\`\`

Refactoring level: ${config.level || 'moderate'}
Preserve behavior: ${config.preserveBehavior !== false ? 'Yes' : 'No'}
Max suggestions: ${config.maxSuggestions || 10}

For each suggestion, provide:
1. Type (${focusAreas.join('/')})
2. Description of the issue
3. Before code (specific section)
4. After code (refactored version)
5. Explanation of the improvement
6. Impact level (high/medium/low)

Return JSON with:
- refactored: Complete refactored code
- suggestions: Array of refactoring suggestions
- summary: Overall improvement summary
- breakingChanges: Any potential breaking changes
- testingRecommendations: What to test after refactoring`;
  }

  /**
   * Get system prompt based on level
   */
  private getSystemPrompt(level: 'conservative' | 'moderate' | 'aggressive'): string {
    const levelDescriptions = {
      conservative: 'Make only safe, minimal changes that clearly improve the code.',
      moderate: 'Balance between safety and improvement. Apply standard best practices.',
      aggressive: 'Make comprehensive improvements even if they require significant changes.',
    };

    return `You are an expert PhilJS code refactoring assistant.

Level: ${level}
${levelDescriptions[level]}

PhilJS patterns to apply:
- signal() for reactive state
- memo() for computed/derived values
- effect() with proper cleanup
- Fine-grained updates (avoid unnecessary rerenders)
- Proper TypeScript types

Always:
- Maintain existing functionality
- Improve code quality
- Follow PhilJS best practices
- Provide clear explanations`;
  }

  /**
   * Parse refactor result
   */
  private parseRefactorResult(response: string, originalCode: string): RefactorResult {
    const result = extractJSON<RefactorResult>(response);

    if (result) {
      return {
        ...result,
        original: originalCode,
      };
    }

    // Fallback parsing
    const refactoredCode = extractCode(response) || originalCode;
    const validation = validateCode(refactoredCode);

    return {
      original: originalCode,
      refactored: validation.valid ? refactoredCode : originalCode,
      suggestions: [],
      summary: validation.valid
        ? 'Code refactored successfully'
        : `Refactoring had issues: ${validation.errors.join(', ')}`,
    };
  }
}

/**
 * Create a refactoring engine instance
 */
export function createRefactoringEngine(
  provider: AIProvider,
  options?: Partial<CompletionOptions>
): RefactoringEngine {
  return new RefactoringEngine(provider, options);
}

/**
 * Quick refactor helper
 */
export async function refactorCode(
  provider: AIProvider,
  code: string,
  focusAreas?: RefactorFocusArea[]
): Promise<RefactorResult> {
  const engine = new RefactoringEngine(provider);
  return engine.refactor({ code, ...(focusAreas !== undefined ? { focusAreas } : {}) });
}

/**
 * Quick performance analysis helper
 */
export async function analyzePerformance(
  provider: AIProvider,
  code: string
): Promise<PerformanceAnalysis> {
  const engine = new RefactoringEngine(provider);
  return engine.analyzePerformance(code);
}

/**
 * Quick accessibility audit helper
 */
export async function auditAccessibility(
  provider: AIProvider,
  code: string,
  level?: 'A' | 'AA' | 'AAA'
): Promise<AccessibilityAudit> {
  const engine = new RefactoringEngine(provider);
  return engine.auditAccessibility(code, level);
}
