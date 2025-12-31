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
export type RefactoringCategory = 'performance' | 'signals' | 'accessibility' | 'patterns' | 'types' | 'security' | 'maintainability' | 'readability' | 'testing' | 'modern-js';
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
    skipped: Array<{
        id: string;
        reason: string;
    }>;
    /** Warnings about the fix */
    warnings: string[];
}
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
export declare class RefactoringEngine {
    private provider;
    private defaultOptions;
    constructor(provider: AIProvider, options?: Partial<CompletionOptions>);
    /**
     * Analyze code for refactoring opportunities
     *
     * @param code - Code to analyze
     * @param options - Analysis options
     * @returns Analysis result with suggestions
     */
    analyze(code: string, options?: RefactoringAnalysisOptions): Promise<RefactoringAnalysisResult>;
    /**
     * Create a refactoring plan from suggestions
     *
     * @param suggestions - Suggestions to include in plan
     * @param name - Plan name
     * @returns Ordered refactoring plan
     */
    createPlan(suggestions: RefactoringSuggestion[], name: string): Promise<RefactoringPlan>;
    /**
     * Apply auto-fixes to code
     *
     * @param code - Original code
     * @param suggestions - Suggestions to apply
     * @returns Fixed code with details
     */
    autoFix(code: string, suggestions: RefactoringSuggestion[]): Promise<AutoFixResult>;
    /**
     * Get detailed fix for a specific suggestion
     *
     * @param code - Original code
     * @param suggestion - Suggestion to get fix for
     * @returns Detailed fix with updated code
     */
    getDetailedFix(code: string, suggestion: RefactoringSuggestion): Promise<{
        before: string;
        after: string;
        diff: string;
        explanation: string;
    }>;
    /**
     * Suggest refactoring for specific code selection
     *
     * @param code - Full file code
     * @param selection - Selected code to refactor
     * @param instruction - What kind of refactoring
     * @returns Refactoring suggestions for selection
     */
    suggestForSelection(code: string, selection: string, instruction?: string): Promise<RefactoringSuggestion[]>;
    private detectPatterns;
    private analyzeWithAI;
    private mergeSuggestions;
    private filterSuggestions;
    private calculateQualityScore;
    private buildCategorySummary;
    private orderSteps;
    private getVerificationSteps;
    private calculateExpectedImprovements;
    private generateSummary;
}
/**
 * Create a refactoring engine instance
 */
export declare function createRefactoringEngine(provider: AIProvider, options?: Partial<CompletionOptions>): RefactoringEngine;
/**
 * Quick analysis helper
 */
export declare function analyzeForRefactoring(provider: AIProvider, code: string, options?: RefactoringAnalysisOptions): Promise<RefactoringAnalysisResult>;
/**
 * Quick auto-fix helper
 */
export declare function autoFixCode(provider: AIProvider, code: string, suggestions: RefactoringSuggestion[]): Promise<AutoFixResult>;
//# sourceMappingURL=refactoring-engine.d.ts.map