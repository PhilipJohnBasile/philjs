/**
 * AI-Powered Code Analysis Module
 *
 * Provides intelligent code analysis capabilities including:
 * - Component structure analysis
 * - Performance optimization suggestions
 * - Anti-pattern detection
 * - Code quality metrics
 */

import type { AIProvider, CompletionOptions } from './types.js';
import { extractJSON } from './utils/parser.js';

/**
 * Component analysis result
 */
export interface ComponentAnalysis {
  /** Component name */
  name: string;
  /** Component type */
  type: 'functional' | 'class' | 'higher-order' | 'render-prop';
  /** Props analysis */
  props: PropAnalysis[];
  /** State management */
  state: StateAnalysis;
  /** Effects and side effects */
  effects: EffectAnalysis[];
  /** Computed/derived values */
  computed: ComputedAnalysis[];
  /** Event handlers */
  eventHandlers: EventHandlerAnalysis[];
  /** Child components used */
  childComponents: string[];
  /** Accessibility assessment */
  accessibility: AccessibilityAnalysis;
  /** Complexity metrics */
  complexity: ComplexityMetrics;
  /** Rendering analysis */
  rendering: RenderingAnalysis;
  /** Dependencies */
  dependencies: DependencyAnalysis;
  /** Overall quality score */
  qualityScore: number;
  /** Improvement suggestions */
  suggestions: string[];
}

/**
 * Prop analysis
 */
export interface PropAnalysis {
  /** Prop name */
  name: string;
  /** Prop type */
  type: string;
  /** Is required */
  required: boolean;
  /** Has default value */
  hasDefault: boolean;
  /** Is used in component */
  isUsed: boolean;
  /** Usage count */
  usageCount: number;
  /** Is callback prop */
  isCallback: boolean;
  /** Is render prop */
  isRenderProp: boolean;
}

/**
 * State analysis
 */
export interface StateAnalysis {
  /** State variables */
  variables: StateVariable[];
  /** State management approach */
  approach: 'signals' | 'hooks' | 'class-state' | 'external' | 'none';
  /** Is properly typed */
  isTyped: boolean;
  /** Potential issues */
  issues: string[];
}

/**
 * State variable info
 */
export interface StateVariable {
  /** Variable name */
  name: string;
  /** Inferred type */
  type: string;
  /** Initial value */
  initialValue?: string;
  /** Update functions */
  updateFunctions: string[];
  /** Is derived/computed */
  isDerived: boolean;
}

/**
 * Effect analysis
 */
export interface EffectAnalysis {
  /** Effect type */
  type: 'effect' | 'useEffect' | 'useLayoutEffect' | 'lifecycle';
  /** Dependencies */
  dependencies: string[];
  /** Has cleanup */
  hasCleanup: boolean;
  /** Potential issues */
  issues: string[];
  /** Line number */
  line?: number;
}

/**
 * Computed value analysis
 */
export interface ComputedAnalysis {
  /** Computed name */
  name: string;
  /** Dependencies */
  dependencies: string[];
  /** Type */
  type: 'memo' | 'useMemo' | 'derived' | 'getter';
  /** Is properly memoized */
  isMemoized: boolean;
  /** Complexity */
  complexity: 'low' | 'medium' | 'high';
}

/**
 * Event handler analysis
 */
export interface EventHandlerAnalysis {
  /** Handler name */
  name: string;
  /** Event type */
  eventType: string;
  /** Is properly bound */
  isProperlyBound: boolean;
  /** Uses state */
  usesState: boolean;
  /** Is async */
  isAsync: boolean;
}

/**
 * Accessibility analysis
 */
export interface AccessibilityAnalysis {
  /** WCAG level estimation */
  wcagLevel: 'A' | 'AA' | 'AAA' | 'unknown' | 'non-compliant';
  /** Has ARIA labels */
  hasAriaLabels: boolean;
  /** Has keyboard navigation */
  hasKeyboardNav: boolean;
  /** Has focus management */
  hasFocusManagement: boolean;
  /** Issues found */
  issues: AccessibilityIssue[];
  /** Score out of 100 */
  score: number;
}

/**
 * Accessibility issue
 */
export interface AccessibilityIssue {
  /** Issue type */
  type: 'missing-label' | 'no-keyboard' | 'contrast' | 'focus' | 'semantic' | 'aria' | 'other';
  /** Description */
  description: string;
  /** Element affected */
  element?: string;
  /** Severity */
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  /** WCAG criterion */
  wcagCriterion?: string;
  /** Suggestion */
  suggestion: string;
}

/**
 * Complexity metrics
 */
export interface ComplexityMetrics {
  /** Cyclomatic complexity */
  cyclomatic: number;
  /** Cognitive complexity */
  cognitive: number;
  /** Lines of code */
  loc: number;
  /** Number of dependencies */
  dependencies: number;
  /** Nesting depth */
  maxNestingDepth: number;
  /** Complexity level */
  level: 'low' | 'moderate' | 'high' | 'very-high';
}

/**
 * Rendering analysis
 */
export interface RenderingAnalysis {
  /** Render triggers */
  triggers: string[];
  /** Potential unnecessary rerenders */
  unnecessaryRerenders: string[];
  /** Expensive operations in render */
  expensiveOperations: string[];
  /** Is properly optimized */
  isOptimized: boolean;
  /** Optimization suggestions */
  optimizations: string[];
}

/**
 * Dependency analysis
 */
export interface DependencyAnalysis {
  /** External packages */
  external: string[];
  /** Internal imports */
  internal: string[];
  /** PhilJS imports */
  philjs: string[];
  /** Unused imports */
  unused: string[];
  /** Missing imports */
  missing: string[];
}

/**
 * Optimization suggestion
 */
export interface OptimizationSuggestion {
  /** Suggestion category */
  category: 'performance' | 'bundle-size' | 'memory' | 'render' | 'signals' | 'accessibility';
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Impact level */
  impact: 'low' | 'medium' | 'high';
  /** Effort required */
  effort: 'trivial' | 'easy' | 'moderate' | 'significant';
  /** Before code example */
  before?: string;
  /** After code example */
  after?: string;
  /** Priority score (0-100) */
  priority: number;
  /** Is auto-fixable */
  autoFixable: boolean;
}

/**
 * Anti-pattern detection result
 */
export interface AntiPatternResult {
  /** Detected anti-patterns */
  patterns: DetectedAntiPattern[];
  /** Overall code health score */
  healthScore: number;
  /** Summary */
  summary: string;
  /** Recommendations */
  recommendations: string[];
}

/**
 * Detected anti-pattern
 */
export interface DetectedAntiPattern {
  /** Pattern name */
  name: string;
  /** Pattern category */
  category: 'performance' | 'maintainability' | 'security' | 'accessibility' | 'reactivity' | 'state-management';
  /** Severity */
  severity: 'info' | 'warning' | 'error' | 'critical';
  /** Description */
  description: string;
  /** Why it's problematic */
  why: string;
  /** Code location */
  location?: { line: number; column: number };
  /** Code snippet */
  code?: string;
  /** Fix suggestion */
  fix: string;
  /** Fixed code example */
  fixedCode?: string;
}

/**
 * Code Analysis Engine
 *
 * Provides AI-powered code analysis capabilities for PhilJS applications.
 */
export class CodeAnalyzer {
  private provider: AIProvider;
  private defaultOptions: Partial<CompletionOptions>;

  constructor(provider: AIProvider, options?: Partial<CompletionOptions>) {
    this.provider = provider;
    this.defaultOptions = {
      temperature: 0.1,
      maxTokens: 8192,
      ...options,
    };
  }

  /**
   * Analyze a component's structure and quality
   *
   * @param code - Component source code
   * @returns Detailed component analysis
   *
   * @example
   * ```typescript
   * const analyzer = new CodeAnalyzer(provider);
   * const analysis = await analyzer.analyzeComponent(componentCode);
   * console.log(`Quality score: ${analysis.qualityScore}`);
   * console.log(`Complexity: ${analysis.complexity.level}`);
   * ```
   */
  async analyzeComponent(code: string): Promise<ComponentAnalysis> {
    const prompt = `Analyze this PhilJS component in detail:

\`\`\`typescript
${code}
\`\`\`

Provide a comprehensive analysis including:

1. **Component Info**: Name, type (functional/class/HOC/render-prop)

2. **Props Analysis**: For each prop - name, type, required, hasDefault, isUsed, usageCount, isCallback, isRenderProp

3. **State Analysis**:
   - State variables with name, type, initialValue, updateFunctions, isDerived
   - Approach (signals/hooks/class-state/external/none)
   - Is properly typed
   - Issues

4. **Effects Analysis**: Each effect with type, dependencies, hasCleanup, issues, line number

5. **Computed Values**: Each with name, dependencies, type (memo/useMemo/derived/getter), isMemoized, complexity

6. **Event Handlers**: Each with name, eventType, isProperlyBound, usesState, isAsync

7. **Child Components**: List of child component names used

8. **Accessibility**:
   - wcagLevel (A/AA/AAA/unknown/non-compliant)
   - hasAriaLabels, hasKeyboardNav, hasFocusManagement
   - Issues with type, description, element, severity, wcagCriterion, suggestion
   - Score (0-100)

9. **Complexity Metrics**: cyclomatic, cognitive, loc, dependencies, maxNestingDepth, level

10. **Rendering Analysis**: triggers, unnecessaryRerenders, expensiveOperations, isOptimized, optimizations

11. **Dependencies**: external, internal, philjs, unused, missing

12. **Quality Score**: Overall score 0-100

13. **Suggestions**: List of improvement suggestions

Return as JSON with the structure matching ComponentAnalysis interface.`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: `You are an expert code analyzer for PhilJS applications.
Analyze components thoroughly and accurately.
Identify patterns, anti-patterns, and optimization opportunities.
Focus on reactivity patterns, accessibility, and performance.`,
    });

    const result = extractJSON<ComponentAnalysis>(response);

    if (result) {
      return result;
    }

    // Return default analysis if parsing fails
    return this.getDefaultComponentAnalysis(code);
  }

  /**
   * Suggest performance optimizations for code
   *
   * @param code - Source code to analyze
   * @returns Array of optimization suggestions
   *
   * @example
   * ```typescript
   * const analyzer = new CodeAnalyzer(provider);
   * const optimizations = await analyzer.suggestOptimizations(code);
   * optimizations
   *   .filter(o => o.impact === 'high')
   *   .forEach(o => console.log(o.title));
   * ```
   */
  async suggestOptimizations(code: string): Promise<OptimizationSuggestion[]> {
    const prompt = `Analyze this code for optimization opportunities:

\`\`\`typescript
${code}
\`\`\`

Focus on:
1. **Performance**: Unnecessary rerenders, expensive computations, missing memoization
2. **Bundle Size**: Large imports, tree-shaking opportunities
3. **Memory**: Memory leaks, cleanup, caching
4. **Render**: Virtual DOM updates, fine-grained reactivity
5. **Signals**: Proper signal usage, derived state, effect optimization
6. **Accessibility**: ARIA improvements, keyboard navigation

For each optimization, provide:
- category: performance|bundle-size|memory|render|signals|accessibility
- title: Short descriptive title
- description: Detailed explanation
- impact: low|medium|high
- effort: trivial|easy|moderate|significant
- before: Current code snippet (if applicable)
- after: Optimized code snippet (if applicable)
- priority: 0-100 score
- autoFixable: Whether it can be auto-fixed

Return JSON array of OptimizationSuggestion objects.`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: `You are a performance optimization expert for reactive UI frameworks.
Focus on practical, impactful optimizations.
Prioritize based on real-world impact.
Consider PhilJS-specific patterns and fine-grained reactivity.`,
    });

    const result = extractJSON<OptimizationSuggestion[]>(response);
    return result || [];
  }

  /**
   * Detect anti-patterns in code
   *
   * @param code - Source code to analyze
   * @returns Anti-pattern detection result
   *
   * @example
   * ```typescript
   * const analyzer = new CodeAnalyzer(provider);
   * const result = await analyzer.detectAntiPatterns(code);
   * console.log(`Health score: ${result.healthScore}`);
   * result.patterns.forEach(p => console.log(`${p.severity}: ${p.name}`));
   * ```
   */
  async detectAntiPatterns(code: string): Promise<AntiPatternResult> {
    const prompt = `Detect anti-patterns in this PhilJS code:

\`\`\`typescript
${code}
\`\`\`

Look for these anti-patterns:

**Performance Anti-Patterns:**
- Creating objects/functions in render
- Missing memoization for expensive computations
- Unnecessary state that could be derived
- Over-fetching or waterfall requests
- Blocking operations in render path

**Reactivity Anti-Patterns:**
- Not using signals where appropriate
- Mutating state directly
- Missing dependencies in effects
- Effects without cleanup
- Derived state stored as regular state

**State Management Anti-Patterns:**
- Prop drilling excessively
- Global state overuse
- Inconsistent state updates
- Stale closures

**Security Anti-Patterns:**
- Unsafe innerHTML usage
- Missing input sanitization
- Exposing sensitive data
- Insecure API patterns

**Maintainability Anti-Patterns:**
- God components (too many responsibilities)
- Deep nesting
- Magic strings/numbers
- Poor naming conventions
- Tight coupling

**Accessibility Anti-Patterns:**
- Missing alt text
- Non-semantic HTML
- Missing ARIA labels
- Keyboard trap
- Focus management issues

For each detected pattern, provide:
- name: Pattern name
- category: performance|maintainability|security|accessibility|reactivity|state-management
- severity: info|warning|error|critical
- description: What was found
- why: Why it's problematic
- location: { line, column } if determinable
- code: The problematic code snippet
- fix: How to fix it
- fixedCode: Corrected code example

Return JSON with:
{
  "patterns": [...],
  "healthScore": 0-100,
  "summary": "overall assessment",
  "recommendations": ["top recommendations"]
}`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: `You are a code quality expert specializing in PhilJS and reactive frameworks.
Detect anti-patterns accurately with low false positives.
Provide actionable fixes for each issue.
Focus on patterns that have real impact.`,
    });

    const result = extractJSON<AntiPatternResult>(response);

    if (result) {
      return result;
    }

    return {
      patterns: [],
      healthScore: 50,
      summary: 'Analysis completed',
      recommendations: [],
    };
  }

  /**
   * Analyze code complexity
   *
   * @param code - Source code to analyze
   * @returns Complexity metrics
   */
  async analyzeComplexity(code: string): Promise<ComplexityMetrics & { suggestions: string[] }> {
    const prompt = `Analyze the complexity of this code:

\`\`\`typescript
${code}
\`\`\`

Calculate:
1. **Cyclomatic Complexity**: Number of independent paths
2. **Cognitive Complexity**: How hard it is to understand
3. **Lines of Code**: Total lines (excluding comments/blanks)
4. **Dependencies**: Number of imports/dependencies
5. **Max Nesting Depth**: Deepest nesting level
6. **Overall Level**: low|moderate|high|very-high

Also provide suggestions for reducing complexity.

Return JSON:
{
  "cyclomatic": number,
  "cognitive": number,
  "loc": number,
  "dependencies": number,
  "maxNestingDepth": number,
  "level": "low|moderate|high|very-high",
  "suggestions": ["suggestion1", "suggestion2"]
}`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a code complexity analysis expert. Provide accurate metrics.',
    });

    const result = extractJSON<ComplexityMetrics & { suggestions: string[] }>(response);

    if (result) {
      return result;
    }

    return {
      cyclomatic: 1,
      cognitive: 1,
      loc: code.split('\n').length,
      dependencies: 0,
      maxNestingDepth: 1,
      level: 'low',
      suggestions: [],
    };
  }

  /**
   * Analyze signal usage patterns
   *
   * @param code - Source code to analyze
   * @returns Signal analysis
   */
  async analyzeSignalUsage(code: string): Promise<{
    signals: StateVariable[];
    memos: ComputedAnalysis[];
    effects: EffectAnalysis[];
    issues: string[];
    suggestions: string[];
    score: number;
  }> {
    const prompt = `Analyze PhilJS signal usage in this code:

\`\`\`typescript
${code}
\`\`\`

Analyze:
1. **Signals**: All signal declarations with name, type, initialValue, updateFunctions
2. **Memos**: All memo/computed values with dependencies, complexity
3. **Effects**: All effects with dependencies, cleanup status, issues
4. **Issues**: Problems with signal usage (missing cleanup, stale closures, etc.)
5. **Suggestions**: How to improve signal patterns
6. **Score**: Overall signal usage score (0-100)

Return JSON with signals, memos, effects, issues, suggestions, and score.`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'You are a fine-grained reactivity expert. Analyze signal patterns thoroughly.',
    });

    const result = extractJSON<{
      signals: StateVariable[];
      memos: ComputedAnalysis[];
      effects: EffectAnalysis[];
      issues: string[];
      suggestions: string[];
      score: number;
    }>(response);

    return result || {
      signals: [],
      memos: [],
      effects: [],
      issues: [],
      suggestions: [],
      score: 50,
    };
  }

  /**
   * Analyze accessibility
   *
   * @param code - Component code to analyze
   * @param targetLevel - Target WCAG level
   * @returns Accessibility analysis
   */
  async analyzeAccessibility(
    code: string,
    targetLevel: 'A' | 'AA' | 'AAA' = 'AA'
  ): Promise<AccessibilityAnalysis> {
    const prompt = `Analyze accessibility of this component for WCAG ${targetLevel}:

\`\`\`typescript
${code}
\`\`\`

Check for:
1. ARIA labels and roles
2. Keyboard navigation support
3. Focus management
4. Semantic HTML usage
5. Color contrast considerations
6. Screen reader compatibility
7. Form accessibility
8. Interactive element requirements

Provide:
- wcagLevel: Current compliance level (A/AA/AAA/unknown/non-compliant)
- hasAriaLabels: boolean
- hasKeyboardNav: boolean
- hasFocusManagement: boolean
- issues: Array of accessibility issues
- score: 0-100

For each issue:
- type: missing-label|no-keyboard|contrast|focus|semantic|aria|other
- description: What's wrong
- element: Affected element
- severity: minor|moderate|serious|critical
- wcagCriterion: e.g., "1.1.1 Non-text Content"
- suggestion: How to fix

Return JSON matching AccessibilityAnalysis interface.`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: `You are a WCAG accessibility expert.
Target compliance level: ${targetLevel}
Identify all accessibility issues accurately.
Provide specific, actionable fixes.`,
    });

    const result = extractJSON<AccessibilityAnalysis>(response);

    if (result) {
      return result;
    }

    return {
      wcagLevel: 'unknown',
      hasAriaLabels: false,
      hasKeyboardNav: false,
      hasFocusManagement: false,
      issues: [],
      score: 50,
    };
  }

  /**
   * Get a quick health check summary
   *
   * @param code - Code to analyze
   * @returns Quick health summary
   */
  async getHealthCheck(code: string): Promise<{
    overall: number;
    categories: Record<string, number>;
    topIssues: string[];
    topStrengths: string[];
  }> {
    const prompt = `Provide a quick health check for this code:

\`\`\`typescript
${code}
\`\`\`

Return JSON:
{
  "overall": 0-100 overall health score,
  "categories": {
    "performance": 0-100,
    "accessibility": 0-100,
    "maintainability": 0-100,
    "security": 0-100,
    "reactivity": 0-100
  },
  "topIssues": ["top 3 issues to address"],
  "topStrengths": ["top 3 things done well"]
}`;

    const response = await this.provider.generateCompletion(prompt, {
      ...this.defaultOptions,
      systemPrompt: 'Provide a balanced, accurate health assessment.',
    });

    const result = extractJSON<{
      overall: number;
      categories: Record<string, number>;
      topIssues: string[];
      topStrengths: string[];
    }>(response);

    return result || {
      overall: 50,
      categories: {
        performance: 50,
        accessibility: 50,
        maintainability: 50,
        security: 50,
        reactivity: 50,
      },
      topIssues: [],
      topStrengths: [],
    };
  }

  /**
   * Get default component analysis (fallback)
   */
  private getDefaultComponentAnalysis(code: string): ComponentAnalysis {
    const lines = code.split('\n');
    const nameMatch = code.match(/(?:export\s+)?(?:function|const)\s+(\w+)/);

    return {
      name: nameMatch?.[1] || 'Unknown',
      type: 'functional',
      props: [],
      state: {
        variables: [],
        approach: 'none',
        isTyped: false,
        issues: [],
      },
      effects: [],
      computed: [],
      eventHandlers: [],
      childComponents: [],
      accessibility: {
        wcagLevel: 'unknown',
        hasAriaLabels: false,
        hasKeyboardNav: false,
        hasFocusManagement: false,
        issues: [],
        score: 50,
      },
      complexity: {
        cyclomatic: 1,
        cognitive: 1,
        loc: lines.length,
        dependencies: 0,
        maxNestingDepth: 1,
        level: 'low',
      },
      rendering: {
        triggers: [],
        unnecessaryRerenders: [],
        expensiveOperations: [],
        isOptimized: true,
        optimizations: [],
      },
      dependencies: {
        external: [],
        internal: [],
        philjs: [],
        unused: [],
        missing: [],
      },
      qualityScore: 50,
      suggestions: ['Unable to perform detailed analysis'],
    };
  }
}

/**
 * Create a code analyzer instance
 *
 * @param provider - AI provider
 * @param options - Completion options
 * @returns CodeAnalyzer instance
 */
export function createCodeAnalyzer(
  provider: AIProvider,
  options?: Partial<CompletionOptions>
): CodeAnalyzer {
  return new CodeAnalyzer(provider, options);
}

/**
 * Quick component analysis helper
 *
 * @param provider - AI provider
 * @param code - Component code
 * @returns Component analysis
 */
export async function analyzeComponent(
  provider: AIProvider,
  code: string
): Promise<ComponentAnalysis> {
  const analyzer = new CodeAnalyzer(provider);
  return analyzer.analyzeComponent(code);
}

/**
 * Quick optimization suggestions helper
 *
 * @param provider - AI provider
 * @param code - Code to analyze
 * @returns Optimization suggestions
 */
export async function suggestOptimizations(
  provider: AIProvider,
  code: string
): Promise<OptimizationSuggestion[]> {
  const analyzer = new CodeAnalyzer(provider);
  return analyzer.suggestOptimizations(code);
}

/**
 * Quick anti-pattern detection helper
 *
 * @param provider - AI provider
 * @param code - Code to analyze
 * @returns Anti-pattern result
 */
export async function detectAntiPatterns(
  provider: AIProvider,
  code: string
): Promise<AntiPatternResult> {
  const analyzer = new CodeAnalyzer(provider);
  return analyzer.detectAntiPatterns(code);
}
