/**
 * Code Refactoring Suggestions Engine
 *
 * Analyzes code and provides intelligent refactoring suggestions including:
 * - Performance optimizations
 * - Code quality improvements
 * - Pattern modernization
 * - Signal migration
 * - Accessibility improvements
 */

import type { AIProvider, CompletionOptions } from '../types.js';
import { extractJSON, extractCode } from '../utils/parser.js';
import { SYSTEM_PROMPTS } from '../utils/prompts.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Refactoring suggestion
 */
export interface RefactoringSuggestion {
  /** Unique ID */
  id: string;
  /** Suggestion title */
  title: string;
  /** Detailed description */
  description: string;
  /** Category of refactoring */
  category: RefactoringCategory;
  /** Severity/priority */
  severity: 'info' | 'warning' | 'error' | 'critical';
  /** Impact level */
  impact: 'low' | 'medium' | 'high';
  /** Effort required */
  effort: 'trivial' | 'easy' | 'moderate' | 'significant';
  /** Code before refactoring */
  before: CodeSnippet;
  /** Code after refactoring */
  after: CodeSnippet;
  /** Explanation of why this refactoring helps */
  rationale: string;
  /** Potential breaking changes */
  breakingChanges?: string[];
  /** Related suggestions */
  relatedIds?: string[];
  /** Is auto-fixable */
  autoFixable: boolean;
  /** Confidence score 0-1 */
  confidence: number;
  /** Tags for filtering */
  tags: string[];
}

/**
 * Refactoring category
 */
export type RefactoringCategory =
  | 'performance'
  | 'signals'
  | 'accessibility'
  | 'patterns'
  | 'types'
  | 'security'
  | 'maintainability'
  | 'readability'
  | 'testing'
  | 'modern-js';

/**
 * Code snippet with location
 */
export interface CodeSnippet {
  /** Code content */
  code: string;
  /** Start line */
  startLine?: number;
  /** End line */
  endLine?: number;
  /** Language/syntax */
  language?: string;
}

/**
 * Refactoring analysis options
 */
export interface RefactoringAnalysisOptions extends Partial<CompletionOptions> {
  /** Categories to focus on */
  focusCategories?: RefactoringCategory[];
  /** Minimum severity to include */
  minSeverity?: 'info' | 'warning' | 'error' | 'critical';
  /** Include auto-fix code */
  includeAutoFix?: boolean;
  /** Maximum suggestions to return */
  maxSuggestions?: number;
  /** Context from other files */
  projectContext?: string;
  /** Prefer certain patterns */
  preferPatterns?: string[];
}

/**
 * Refactoring analysis result
 */
export interface RefactoringAnalysisResult {
  /** Suggestions found */
  suggestions: RefactoringSuggestion[];
  /** Code quality score 0-100 */
  qualityScore: number;
  /** Summary by category */
  categorySummary: Record<RefactoringCategory, CategorySummary>;
  /** Quick wins (low effort, high impact) */
  quickWins: RefactoringSuggestion[];
  /** Overall summary */
  summary: string;
  /** Analysis metadata */
  metadata: {
    linesAnalyzed: number;
    analysisTimeMs: number;
    suggestionsFound: number;
    autoFixable: number;
  };
}

/**
 * Category summary
 */
export interface CategorySummary {
  /** Number of suggestions */
  count: number;
  /** Highest severity in category */
  maxSeverity: 'info' | 'warning' | 'error' | 'critical';
  /** Category score 0-100 */
  score: number;
  /** Key issues */
  keyIssues: string[];
}

/**
 * Refactoring plan for staged application
 */
export interface RefactoringPlan {
  /** Plan ID */
  id: string;
  /** Plan name */
  name: string;
  /** Description */
  description: string;
  /** Ordered steps */
  steps: RefactoringStep[];
  /** Estimated total effort */
  totalEffort: 'trivial' | 'easy' | 'moderate' | 'significant' | 'major';
  /** Risk level */
  risk: 'low' | 'medium' | 'high';
  /** Expected improvements */
  expectedImprovements: string[];
}

/**
 * Single refactoring step
 */
export interface RefactoringStep {
  /** Step order */
  order: number;
  /** Suggestion to apply */
  suggestion: RefactoringSuggestion;
  /** Dependencies (other step orders) */
  dependsOn: number[];
  /** Verification steps */
  verification: string[];
}

/**
 * Auto-fix result
 */
export interface AutoFixResult {
  /** Fixed code */
  code: string;
  /** Suggestions applied */
  applied: string[];
  /** Suggestions skipped */
  skipped: Array<{ id: string; reason: string }>;
  /** Warnings about the fix */
  warnings: string[];
}

// ============================================================================
// Refactoring Patterns Database
// ============================================================================

interface RefactoringPattern {
  id: string;
  name: string;
  category: RefactoringCategory;
  detect: RegExp | ((code: string) => boolean);
  severity: RefactoringSuggestion['severity'];
  message: string;
  transform?: (match: string) => string;
}

const REFACTORING_PATTERNS: RefactoringPattern[] = [
  // Signal patterns
  {
    id: 'useState-to-signal',
    name: 'Convert useState to signal',
    category: 'signals',
    detect: /useState\s*<[^>]+>\s*\([^)]*\)/g,
    severity: 'warning',
    message: 'Consider using signal() instead of useState for fine-grained reactivity',
  },
  {
    id: 'useMemo-to-memo',
    name: 'Convert useMemo to memo',
    category: 'signals',
    detect: /useMemo\s*\(\s*\(\)\s*=>/g,
    severity: 'info',
    message: 'Consider using memo() for computed values with automatic dependency tracking',
  },
  {
    id: 'useEffect-to-effect',
    name: 'Convert useEffect to effect',
    category: 'signals',
    detect: /useEffect\s*\(/g,
    severity: 'info',
    message: 'Consider using effect() for automatic dependency tracking',
  },

  // Performance patterns
  {
    id: 'inline-function-in-jsx',
    name: 'Inline function in JSX',
    category: 'performance',
    detect: /(?:onClick|onChange|onSubmit)\s*=\s*\{\s*\(\)\s*=>/g,
    severity: 'info',
    message: 'Consider extracting inline functions to avoid recreation on each render',
  },
  {
    id: 'object-literal-in-jsx',
    name: 'Object literal in JSX',
    category: 'performance',
    detect: /(?:style|className)\s*=\s*\{\s*\{/g,
    severity: 'info',
    message: 'Object literals in JSX are recreated every render',
  },
  {
    id: 'large-array-map',
    name: 'Large array without virtualization',
    category: 'performance',
    detect: (code) => {
      const hasMap = code.includes('.map(');
      const hasVirtualization = code.includes('VirtualList') || code.includes('virtualized');
      return hasMap && !hasVirtualization && code.split('\n').length > 100;
    },
    severity: 'warning',
    message: 'Consider using virtualization for large lists',
  },

  // Accessibility patterns
  {
    id: 'missing-alt',
    name: 'Image missing alt text',
    category: 'accessibility',
    detect: /<img\s+(?![^>]*alt=)[^>]*>/g,
    severity: 'error',
    message: 'Images must have alt text for accessibility',
  },
  {
    id: 'click-without-keyboard',
    name: 'onClick without keyboard handler',
    category: 'accessibility',
    detect: /<(?:div|span)\s+[^>]*onClick\s*=/g,
    severity: 'warning',
    message: 'Interactive elements should have keyboard handlers',
  },
  {
    id: 'missing-label',
    name: 'Form input missing label',
    category: 'accessibility',
    detect: /<input\s+(?![^>]*(?:aria-label|aria-labelledby|id))[^>]*>/g,
    severity: 'error',
    message: 'Form inputs need associated labels',
  },

  // Type safety patterns
  {
    id: 'any-type',
    name: 'Usage of any type',
    category: 'types',
    detect: /:\s*any\b/g,
    severity: 'warning',
    message: 'Avoid using any type; use specific types or unknown',
  },
  {
    id: 'type-assertion',
    name: 'Type assertion (as)',
    category: 'types',
    detect: /\)\s+as\s+\w+/g,
    severity: 'info',
    message: 'Type assertions bypass type checking; prefer type guards',
  },

  // Security patterns
  {
    id: 'dangerous-html',
    name: 'Dangerous HTML injection',
    category: 'security',
    detect: /dangerouslySetInnerHTML/g,
    severity: 'error',
    message: 'dangerouslySetInnerHTML can lead to XSS vulnerabilities',
  },
  {
    id: 'eval-usage',
    name: 'Usage of eval',
    category: 'security',
    detect: /\beval\s*\(/g,
    severity: 'critical',
    message: 'eval() is dangerous and should be avoided',
  },

  // Maintainability patterns
  {
    id: 'large-component',
    name: 'Component too large',
    category: 'maintainability',
    detect: (code) => code.split('\n').length > 200,
    severity: 'warning',
    message: 'Consider breaking down large components into smaller ones',
  },
  {
    id: 'deep-nesting',
    name: 'Deep nesting',
    category: 'readability',
    detect: (code) => {
      const maxNesting = code.split('\n').reduce((max, line) => {
        const indent = line.match(/^(\s*)/)?.[1]?.length ?? 0;
        return Math.max(max, indent);
      }, 0);
      return maxNesting > 20;
    },
    severity: 'warning',
    message: 'Deep nesting makes code hard to read; consider extracting logic',
  },
];

// ============================================================================
// Refactoring Engine
// ============================================================================

/**
 * Code Refactoring Engine
 *
 * Analyzes code and provides intelligent refactoring suggestions.
 *
 * @example
 * ```typescript
 * const engine = new RefactoringEngine(provider);
 *
 * const result = await engine.analyze(componentCode, {
 *   focusCategories: ['performance', 'signals'],
 *   minSeverity: 'warning',
 * });
 *
 * console.log(`Quality score: ${result.qualityScore}`);
 * result.quickWins.forEach(s => console.log(s.title));
 *
 * // Apply auto-fixes
 * const fixed = await engine.autoFix(code, result.suggestions);
 * console.log(fixed.code);
 * ```
 */
export class RefactoringEngine {
  private provider: AIProvider;
  private defaultOptions: Partial<CompletionOptions>;

  constructor(provider: AIProvider, options?: Partial<CompletionOptions>) {
    this.provider = provider;
    this.defaultOptions = {
      temperature: 0.1,
      maxTokens: 4096,
      ...options,
    };
  }

  /**
   * Analyze code for refactoring opportunities
   *
   * @param code - Code to analyze
   * @param options - Analysis options
   * @returns Analysis result with suggestions
   */
  async analyze(
    code: string,
    options?: RefactoringAnalysisOptions
  ): Promise<RefactoringAnalysisResult> {
    const startTime = Date.now();

    // 1. Static pattern detection
    const patternSuggestions = this.detectPatterns(code);

    // 2. AI-powered deep analysis
    const aiSuggestions = await this.analyzeWithAI(code, options);

    // Merge and deduplicate suggestions
    const allSuggestions = this.mergeSuggestions(patternSuggestions, aiSuggestions);

    // Filter by options
    const filteredSuggestions = this.filterSuggestions(allSuggestions, options);

    // Calculate scores
    const qualityScore = this.calculateQualityScore(filteredSuggestions);
    const categorySummary = this.buildCategorySummary(filteredSuggestions);

    // Identify quick wins
    const quickWins = filteredSuggestions.filter(
      s => s.effort === 'trivial' || s.effort === 'easy' && s.impact === 'high'
    );

    // Generate summary
    const summary = this.generateSummary(filteredSuggestions, qualityScore);

    return {
      suggestions: filteredSuggestions,
      qualityScore,
      categorySummary,
      quickWins,
      summary,
      metadata: {
        linesAnalyzed: code.split('\n').length,
        analysisTimeMs: Date.now() - startTime,
        suggestionsFound: filteredSuggestions.length,
        autoFixable: filteredSuggestions.filter(s => s.autoFixable).length,
      },
    };
  }

  /**
   * Create a refactoring plan from suggestions
   *
   * @param suggestions - Suggestions to include in plan
   * @param name - Plan name
   * @returns Ordered refactoring plan
   */
  async createPlan(
    suggestions: RefactoringSuggestion[],
    name: string
  ): Promise<RefactoringPlan> {
    // Order suggestions by dependencies and impact
    const orderedSteps = this.orderSteps(suggestions);

    // Calculate total effort
    const effortScores = { trivial: 1, easy: 2, moderate: 4, significant: 8 };
    const totalScore = suggestions.reduce(
      (sum, s) => sum + effortScores[s.effort],
      0
    );
    const totalEffort: RefactoringPlan['totalEffort'] =
      totalScore <= 3 ? 'trivial' :
        totalScore <= 8 ? 'easy' :
          totalScore <= 16 ? 'moderate' :
            totalScore <= 32 ? 'significant' : 'major';

    // Calculate risk
    const hasBreakingChanges = suggestions.some(s => s.breakingChanges?.length);
    const hasCritical = suggestions.some(s => s.severity === 'critical');
    const risk: RefactoringPlan['risk'] =
      hasCritical || hasBreakingChanges ? 'high' :
        suggestions.some(s => s.severity === 'error') ? 'medium' : 'low';

    // Expected improvements
    const improvements = this.calculateExpectedImprovements(suggestions);

    return {
      id: `plan_${Date.now()}`,
      name,
      description: `Refactoring plan with ${suggestions.length} steps`,
      steps: orderedSteps,
      totalEffort,
      risk,
      expectedImprovements: improvements,
    };
  }

  /**
   * Apply auto-fixes to code
   *
   * @param code - Original code
   * @param suggestions - Suggestions to apply
   * @returns Fixed code with details
   */
  async autoFix(
    code: string,
    suggestions: RefactoringSuggestion[]
  ): Promise<AutoFixResult> {
    const autoFixable = suggestions.filter(s => s.autoFixable);
    const skipped: Array<{ id: string; reason: string }> = [];
    const applied: string[] = [];
    const warnings: string[] = [];

    let fixedCode = code;

    // Apply fixes in order of line number (bottom to top to preserve positions)
    const sortedSuggestions = [...autoFixable].sort((a, b) => {
      const aLine = a.before.startLine || 0;
      const bLine = b.before.startLine || 0;
      return bLine - aLine;
    });

    for (const suggestion of sortedSuggestions) {
      try {
        // Try to apply the fix
        if (fixedCode.includes(suggestion.before.code)) {
          fixedCode = fixedCode.replace(
            suggestion.before.code,
            suggestion.after.code
          );
          applied.push(suggestion.id);

          if (suggestion.breakingChanges?.length) {
            warnings.push(
              `Applied ${suggestion.title} which may have breaking changes: ${suggestion.breakingChanges.join(', ')}`
            );
          }
        } else {
          skipped.push({
            id: suggestion.id,
            reason: 'Code pattern not found (may have changed)',
          });
        }
      } catch (error) {
        skipped.push({
          id: suggestion.id,
          reason: `Error applying fix: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    // Mark non-autoFixable as skipped
    for (const suggestion of suggestions) {
      if (!suggestion.autoFixable) {
        skipped.push({
          id: suggestion.id,
          reason: 'Requires manual refactoring',
        });
      }
    }

    return {
      code: fixedCode,
      applied,
      skipped,
      warnings,
    };
  }

  /**
   * Get detailed fix for a specific suggestion
   *
   * @param code - Original code
   * @param suggestion - Suggestion to get fix for
   * @returns Detailed fix with updated code
   */
  async getDetailedFix(
    code: string,
    suggestion: RefactoringSuggestion
  ): Promise<{
    before: string;
    after: string;
    diff: string;
    explanation: string;
  }> {
    const prompt = `Provide a detailed fix for this refactoring suggestion:

Suggestion: ${suggestion.title}
Description: ${suggestion.description}
Category: ${suggestion.category}

Code before:
\`\`\`typescript
${suggestion.before.code}
\`\`\`

Apply this refactoring and return:
1. The fixed code
2. A diff showing the changes
3. Detailed explanation of what changed and why

Full file context:
\`\`\`typescript
${code.slice(0, 2000)}
\`\`\`

Return JSON:
{
  "before": "original code",
  "after": "fixed code",
  "diff": "diff format showing changes",
  "explanation": "detailed explanation"
}`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a code refactoring expert. Provide precise, safe refactoring fixes.',
    });

    const result = extractJSON<{
      before: string;
      after: string;
      diff: string;
      explanation: string;
    }>(response);

    return result || {
      before: suggestion.before.code,
      after: suggestion.after.code,
      diff: '',
      explanation: suggestion.rationale,
    };
  }

  /**
   * Suggest refactoring for specific code selection
   *
   * @param code - Full file code
   * @param selection - Selected code to refactor
   * @param instruction - What kind of refactoring
   * @returns Refactoring suggestions for selection
   */
  async suggestForSelection(
    code: string,
    selection: string,
    instruction?: string
  ): Promise<RefactoringSuggestion[]> {
    const prompt = `Suggest refactoring for this selected code:

Selected code:
\`\`\`typescript
${selection}
\`\`\`

${instruction ? `Instruction: ${instruction}` : 'Suggest any applicable refactorings.'}

Full file context:
\`\`\`typescript
${code.slice(0, 2000)}
\`\`\`

For each suggestion, provide:
- id: Unique identifier
- title: Short title
- description: Detailed description
- category: performance, signals, accessibility, patterns, types, security, maintainability, readability
- severity: info, warning, error, critical
- impact: low, medium, high
- effort: trivial, easy, moderate, significant
- before: { code: "original", startLine: n, endLine: m }
- after: { code: "refactored" }
- rationale: Why this helps
- autoFixable: boolean
- confidence: 0-1
- tags: relevant tags

Return JSON array of RefactoringSuggestion objects.`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: `${SYSTEM_PROMPTS.philjs}\nYou are a refactoring expert. Provide safe, practical suggestions.`,
    });

    return extractJSON<RefactoringSuggestion[]>(response) || [];
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private detectPatterns(code: string): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = [];
    let idCounter = 0;

    for (const pattern of REFACTORING_PATTERNS) {
      const isMatch = typeof pattern.detect === 'function'
        ? pattern.detect(code)
        : pattern.detect.test(code);

      if (isMatch) {
        let matches: RegExpMatchArray[] = [];
        if (typeof pattern.detect !== 'function') {
          matches = [...code.matchAll(pattern.detect)];
        }

        const match = matches[0];
        const matchedCode = match?.[0] || '';
        const lineNumber = match ? code.slice(0, match.index).split('\n').length : undefined;

        suggestions.push({
          id: `pattern_${pattern.id}_${idCounter++}`,
          title: pattern.name,
          description: pattern.message,
          category: pattern.category,
          severity: pattern.severity,
          impact: pattern.severity === 'critical' ? 'high' :
            pattern.severity === 'error' ? 'high' :
              pattern.severity === 'warning' ? 'medium' : 'low',
          effort: 'easy',
          before: {
            code: matchedCode || '/* pattern detected */',
            language: 'typescript',
            ...(lineNumber !== undefined && { startLine: lineNumber }),
            ...(lineNumber !== undefined && { endLine: lineNumber }),
          },
          after: {
            code: pattern.transform ? pattern.transform(matchedCode) : '/* refactored */',
            language: 'typescript',
          },
          rationale: pattern.message,
          autoFixable: !!pattern.transform,
          confidence: 0.9,
          tags: [pattern.category, pattern.id],
        });
      }
    }

    return suggestions;
  }

  private async analyzeWithAI(
    code: string,
    options?: RefactoringAnalysisOptions
  ): Promise<RefactoringSuggestion[]> {
    const categories = options?.focusCategories?.join(', ') || 'all categories';

    const prompt = `Analyze this code for refactoring opportunities:

\`\`\`typescript
${code}
\`\`\`

Focus on: ${categories}
${options?.projectContext ? `\nProject context:\n${options.projectContext}` : ''}

Identify refactoring opportunities including:
1. **Performance**: Unnecessary rerenders, missing memoization, expensive operations
2. **Signals**: Convert React patterns to PhilJS signals
3. **Accessibility**: Missing ARIA, keyboard navigation, semantic HTML
4. **Patterns**: Anti-patterns, code smells, better alternatives
5. **Types**: Type safety improvements, better typing
6. **Security**: XSS risks, unsafe operations
7. **Maintainability**: Component size, complexity, coupling
8. **Readability**: Naming, structure, comments

For each suggestion provide:
- id: unique_id
- title: "Short title"
- description: "Detailed description"
- category: category name
- severity: info|warning|error|critical
- impact: low|medium|high
- effort: trivial|easy|moderate|significant
- before: { code: "original", startLine: n, endLine: m }
- after: { code: "refactored" }
- rationale: "Why this helps"
- breakingChanges: ["any breaking changes"] or null
- autoFixable: boolean
- confidence: 0-1
- tags: ["tag1", "tag2"]

Return JSON array of suggestions.`;

    const { content: response } = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      maxTokens: 8192,
      systemPrompt: `${SYSTEM_PROMPTS.philjs}
You are an expert code reviewer. Provide actionable refactoring suggestions.
Be specific with code examples.
Focus on practical improvements.`,
    });

    const suggestions = extractJSON<RefactoringSuggestion[]>(response);
    return suggestions || [];
  }

  private mergeSuggestions(
    pattern: RefactoringSuggestion[],
    ai: RefactoringSuggestion[]
  ): RefactoringSuggestion[] {
    const merged = [...pattern];
    const patternTitles = new Set(pattern.map(s => s.title.toLowerCase()));

    // Add AI suggestions that don't duplicate pattern suggestions
    for (const suggestion of ai) {
      if (!patternTitles.has(suggestion.title.toLowerCase())) {
        merged.push(suggestion);
      }
    }

    return merged;
  }

  private filterSuggestions(
    suggestions: RefactoringSuggestion[],
    options?: RefactoringAnalysisOptions
  ): RefactoringSuggestion[] {
    let filtered = suggestions;

    // Filter by category
    if (options?.focusCategories?.length) {
      filtered = filtered.filter(s =>
        options.focusCategories!.includes(s.category)
      );
    }

    // Filter by minimum severity
    if (options?.minSeverity) {
      const severityOrder = { info: 0, warning: 1, error: 2, critical: 3 };
      const minLevel = severityOrder[options.minSeverity];
      filtered = filtered.filter(s => severityOrder[s.severity] >= minLevel);
    }

    // Limit results
    if (options?.maxSuggestions) {
      // Sort by severity and impact first
      filtered.sort((a, b) => {
        const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
        const impactOrder = { high: 0, medium: 1, low: 2 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return impactOrder[a.impact] - impactOrder[b.impact];
      });
      filtered = filtered.slice(0, options.maxSuggestions);
    }

    return filtered;
  }

  private calculateQualityScore(suggestions: RefactoringSuggestion[]): number {
    if (suggestions.length === 0) return 100;

    // Deduct points based on severity
    const deductions = {
      critical: 25,
      error: 15,
      warning: 5,
      info: 1,
    };

    let totalDeduction = 0;
    for (const s of suggestions) {
      totalDeduction += deductions[s.severity];
    }

    return Math.max(0, 100 - totalDeduction);
  }

  private buildCategorySummary(
    suggestions: RefactoringSuggestion[]
  ): Record<RefactoringCategory, CategorySummary> {
    const categories: RefactoringCategory[] = [
      'performance', 'signals', 'accessibility', 'patterns',
      'types', 'security', 'maintainability', 'readability', 'testing', 'modern-js'
    ];

    const summary: Record<RefactoringCategory, CategorySummary> = {} as any;

    for (const category of categories) {
      const categorySuggestions = suggestions.filter(s => s.category === category);
      const severityOrder: Record<string, number> = { critical: 4, error: 3, warning: 2, info: 1 };

      const maxSeverity = categorySuggestions.reduce(
        (max, s) => (severityOrder[s.severity] ?? 0) > (severityOrder[max] ?? 0) ? s.severity : max,
        'info' as RefactoringSuggestion['severity']
      );

      const categoryScore = categorySuggestions.length === 0 ? 100 :
        Math.max(0, 100 - categorySuggestions.length * 10);

      summary[category] = {
        count: categorySuggestions.length,
        maxSeverity,
        score: categoryScore,
        keyIssues: categorySuggestions.slice(0, 3).map(s => s.title),
      };
    }

    return summary;
  }

  private orderSteps(suggestions: RefactoringSuggestion[]): RefactoringStep[] {
    // Simple ordering: critical first, then by effort (easy first)
    const sorted = [...suggestions].sort((a, b) => {
      const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
      const effortOrder = { trivial: 0, easy: 1, moderate: 2, significant: 3 };

      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return effortOrder[a.effort] - effortOrder[b.effort];
    });

    return sorted.map((suggestion, index) => ({
      order: index + 1,
      suggestion,
      dependsOn: [],
      verification: this.getVerificationSteps(suggestion),
    }));
  }

  private getVerificationSteps(suggestion: RefactoringSuggestion): string[] {
    const steps: string[] = ['Run TypeScript compiler to check for errors'];

    switch (suggestion.category) {
      case 'performance':
        steps.push('Run performance benchmarks');
        steps.push('Check bundle size impact');
        break;
      case 'accessibility':
        steps.push('Run accessibility audit');
        steps.push('Test with screen reader');
        break;
      case 'security':
        steps.push('Run security scan');
        steps.push('Review for XSS vulnerabilities');
        break;
      default:
        steps.push('Run tests');
    }

    return steps;
  }

  private calculateExpectedImprovements(
    suggestions: RefactoringSuggestion[]
  ): string[] {
    const improvements: string[] = [];
    const categories = new Set(suggestions.map(s => s.category));

    if (categories.has('performance')) {
      improvements.push('Improved render performance');
    }
    if (categories.has('accessibility')) {
      improvements.push('Better accessibility compliance');
    }
    if (categories.has('signals')) {
      improvements.push('Fine-grained reactivity');
    }
    if (categories.has('maintainability')) {
      improvements.push('Easier code maintenance');
    }
    if (categories.has('types')) {
      improvements.push('Better type safety');
    }
    if (categories.has('security')) {
      improvements.push('Reduced security vulnerabilities');
    }

    return improvements;
  }

  private generateSummary(
    suggestions: RefactoringSuggestion[],
    qualityScore: number
  ): string {
    const critical = suggestions.filter(s => s.severity === 'critical').length;
    const errors = suggestions.filter(s => s.severity === 'error').length;
    const warnings = suggestions.filter(s => s.severity === 'warning').length;

    let summary = `Code quality score: ${qualityScore}/100. `;
    summary += `Found ${suggestions.length} refactoring opportunities. `;

    if (critical > 0) {
      summary += `${critical} critical issues require immediate attention. `;
    }
    if (errors > 0) {
      summary += `${errors} errors should be addressed. `;
    }
    if (warnings > 0) {
      summary += `${warnings} warnings to review. `;
    }

    return summary;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

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
 * Quick analysis helper
 */
export async function analyzeForRefactoring(
  provider: AIProvider,
  code: string,
  options?: RefactoringAnalysisOptions
): Promise<RefactoringAnalysisResult> {
  const engine = new RefactoringEngine(provider);
  return engine.analyze(code, options);
}

/**
 * Quick auto-fix helper
 */
export async function autoFixCode(
  provider: AIProvider,
  code: string,
  suggestions: RefactoringSuggestion[]
): Promise<AutoFixResult> {
  const engine = new RefactoringEngine(provider);
  return engine.autoFix(code, suggestions);
}
