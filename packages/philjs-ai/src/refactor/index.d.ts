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
import type { AIProvider, CompletionOptions, RefactorSuggestion, CodeReviewResult } from '../types.js';
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
export type RefactorFocusArea = 'signals' | 'performance' | 'accessibility' | 'patterns' | 'readability' | 'types' | 'memory' | 'security' | 'testing';
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
        complexity: {
            before: number;
            after: number;
        };
        signalUsage: {
            before: number;
            after: number;
        };
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
    location?: {
        line: number;
        column: number;
    };
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
export declare class RefactoringEngine {
    private provider;
    private defaultOptions;
    constructor(provider: AIProvider, options?: Partial<CompletionOptions>);
    /**
     * Refactor code with AI suggestions
     */
    refactor(config: RefactorConfig): Promise<RefactorResult>;
    /**
     * Analyze and improve performance
     */
    analyzePerformance(code: string): Promise<PerformanceAnalysis>;
    /**
     * Audit and fix accessibility issues
     */
    auditAccessibility(code: string, targetLevel?: 'A' | 'AA' | 'AAA'): Promise<AccessibilityAudit>;
    /**
     * Check and improve best practices
     */
    checkBestPractices(code: string, categories?: BestPracticeViolation['category'][]): Promise<BestPracticesResult>;
    /**
     * Convert signals usage to optimal patterns
     */
    optimizeSignals(code: string): Promise<{
        code: string;
        changes: string[];
        explanation: string;
    }>;
    /**
     * Code review with AI
     */
    reviewCode(code: string, filePath?: string, aspects?: ('bugs' | 'performance' | 'security' | 'style' | 'patterns')[]): Promise<CodeReviewResult>;
    /**
     * Extract and improve TypeScript types
     */
    improveTypes(code: string): Promise<{
        code: string;
        addedTypes: string[];
        improvedTypes: string[];
    }>;
    /**
     * Simplify complex code
     */
    simplify(code: string): Promise<{
        code: string;
        complexity: {
            before: number;
            after: number;
        };
        changes: string[];
    }>;
    /**
     * Build refactor prompt
     */
    private buildRefactorPrompt;
    /**
     * Get system prompt based on level
     */
    private getSystemPrompt;
    /**
     * Parse refactor result
     */
    private parseRefactorResult;
}
/**
 * Create a refactoring engine instance
 */
export declare function createRefactoringEngine(provider: AIProvider, options?: Partial<CompletionOptions>): RefactoringEngine;
/**
 * Quick refactor helper
 */
export declare function refactorCode(provider: AIProvider, code: string, focusAreas?: RefactorFocusArea[]): Promise<RefactorResult>;
/**
 * Quick performance analysis helper
 */
export declare function analyzePerformance(provider: AIProvider, code: string): Promise<PerformanceAnalysis>;
/**
 * Quick accessibility audit helper
 */
export declare function auditAccessibility(provider: AIProvider, code: string, level?: 'A' | 'AA' | 'AAA'): Promise<AccessibilityAudit>;
//# sourceMappingURL=index.d.ts.map