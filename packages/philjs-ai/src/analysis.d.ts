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
    location?: {
        line: number;
        column: number;
    };
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
export declare class CodeAnalyzer {
    private provider;
    private defaultOptions;
    constructor(provider: AIProvider, options?: Partial<CompletionOptions>);
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
    analyzeComponent(code: string): Promise<ComponentAnalysis>;
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
    suggestOptimizations(code: string): Promise<OptimizationSuggestion[]>;
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
    detectAntiPatterns(code: string): Promise<AntiPatternResult>;
    /**
     * Analyze code complexity
     *
     * @param code - Source code to analyze
     * @returns Complexity metrics
     */
    analyzeComplexity(code: string): Promise<ComplexityMetrics & {
        suggestions: string[];
    }>;
    /**
     * Analyze signal usage patterns
     *
     * @param code - Source code to analyze
     * @returns Signal analysis
     */
    analyzeSignalUsage(code: string): Promise<{
        signals: StateVariable[];
        memos: ComputedAnalysis[];
        effects: EffectAnalysis[];
        issues: string[];
        suggestions: string[];
        score: number;
    }>;
    /**
     * Analyze accessibility
     *
     * @param code - Component code to analyze
     * @param targetLevel - Target WCAG level
     * @returns Accessibility analysis
     */
    analyzeAccessibility(code: string, targetLevel?: 'A' | 'AA' | 'AAA'): Promise<AccessibilityAnalysis>;
    /**
     * Get a quick health check summary
     *
     * @param code - Code to analyze
     * @returns Quick health summary
     */
    getHealthCheck(code: string): Promise<{
        overall: number;
        categories: Record<string, number>;
        topIssues: string[];
        topStrengths: string[];
    }>;
    /**
     * Get default component analysis (fallback)
     */
    private getDefaultComponentAnalysis;
}
/**
 * Create a code analyzer instance
 *
 * @param provider - AI provider
 * @param options - Completion options
 * @returns CodeAnalyzer instance
 */
export declare function createCodeAnalyzer(provider: AIProvider, options?: Partial<CompletionOptions>): CodeAnalyzer;
/**
 * Quick component analysis helper
 *
 * @param provider - AI provider
 * @param code - Component code
 * @returns Component analysis
 */
export declare function analyzeComponent(provider: AIProvider, code: string): Promise<ComponentAnalysis>;
/**
 * Quick optimization suggestions helper
 *
 * @param provider - AI provider
 * @param code - Code to analyze
 * @returns Optimization suggestions
 */
export declare function suggestOptimizations(provider: AIProvider, code: string): Promise<OptimizationSuggestion[]>;
/**
 * Quick anti-pattern detection helper
 *
 * @param provider - AI provider
 * @param code - Code to analyze
 * @returns Anti-pattern result
 */
export declare function detectAntiPatterns(provider: AIProvider, code: string): Promise<AntiPatternResult>;
//# sourceMappingURL=analysis.d.ts.map