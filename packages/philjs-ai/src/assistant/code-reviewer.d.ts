/**
 * AI Code Reviewer
 *
 * Comprehensive code review capabilities:
 * - Pull request review
 * - Security analysis
 * - Performance review
 * - Best practices
 * - Accessibility audit
 */
import type { AIProvider } from '../types.js';
export interface ReviewConfig {
    /** Review focus areas */
    focus?: ReviewFocus[];
    /** Severity threshold */
    minSeverity?: ReviewSeverity;
    /** Include suggestions */
    includeSuggestions?: boolean;
    /** Include code examples */
    includeExamples?: boolean;
    /** Language/framework context */
    context?: {
        language?: string;
        framework?: string;
        projectType?: string;
    };
    /** Custom review rules */
    customRules?: CustomRule[];
}
export type ReviewFocus = 'security' | 'performance' | 'readability' | 'maintainability' | 'accessibility' | 'testing' | 'error-handling' | 'typescript' | 'best-practices';
export type ReviewSeverity = 'info' | 'warning' | 'error' | 'critical';
export interface CustomRule {
    id: string;
    name: string;
    description: string;
    pattern?: string;
    check: (code: string) => boolean;
    message: string;
    severity: ReviewSeverity;
    fix?: string;
}
export interface ReviewResult {
    summary: ReviewSummary;
    issues: ReviewIssue[];
    suggestions: ReviewSuggestion[];
    metrics: CodeMetrics;
    securityFindings: SecurityFinding[];
    performanceNotes: PerformanceNote[];
    accessibilityIssues: AccessibilityIssue[];
    overallScore: number;
    passedChecks: string[];
    timestamp: string;
}
export interface ReviewSummary {
    totalIssues: number;
    bySeverity: Record<ReviewSeverity, number>;
    byCategory: Record<string, number>;
    highlights: string[];
    recommendation: 'approve' | 'request-changes' | 'needs-discussion';
}
export interface ReviewIssue {
    id: string;
    severity: ReviewSeverity;
    category: string;
    title: string;
    description: string;
    line?: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
    code?: string;
    suggestion?: string;
    suggestedFix?: string;
    documentation?: string;
    relatedIssues?: string[];
}
export interface ReviewSuggestion {
    id: string;
    type: 'improvement' | 'refactoring' | 'optimization' | 'pattern';
    title: string;
    description: string;
    before?: string;
    after?: string;
    benefit: string;
    effort: 'low' | 'medium' | 'high';
    priority: number;
}
export interface CodeMetrics {
    linesOfCode: number;
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    maintainabilityIndex: number;
    duplicateLines: number;
    testCoverage?: number;
    dependencyCount: number;
    unusedExports: number;
}
export interface SecurityFinding {
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: SecurityCategory;
    title: string;
    description: string;
    cweId?: string;
    owaspCategory?: string;
    line?: number;
    remediation: string;
    references: string[];
}
export type SecurityCategory = 'injection' | 'xss' | 'authentication' | 'authorization' | 'exposure' | 'misconfiguration' | 'cryptography' | 'dependencies';
export interface PerformanceNote {
    type: 'issue' | 'suggestion' | 'warning';
    category: PerformanceCategory;
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    line?: number;
    recommendation: string;
}
export type PerformanceCategory = 'rendering' | 'memory' | 'network' | 'computation' | 'bundle-size' | 'lazy-loading';
export interface AccessibilityIssue {
    level: 'A' | 'AA' | 'AAA';
    principle: 'perceivable' | 'operable' | 'understandable' | 'robust';
    guideline: string;
    title: string;
    description: string;
    line?: number;
    element?: string;
    fix: string;
}
export interface PRReviewResult extends ReviewResult {
    prSummary: {
        filesChanged: number;
        additions: number;
        deletions: number;
        changedFiles: FileReview[];
    };
    commitQuality: {
        messageQuality: number;
        atomicity: number;
        suggestions: string[];
    };
}
export interface FileReview {
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed';
    issues: ReviewIssue[];
    lineComments: LineComment[];
}
export interface LineComment {
    line: number;
    type: 'suggestion' | 'issue' | 'question' | 'praise';
    content: string;
    code?: string;
}
export declare class CodeReviewer {
    private provider;
    constructor(provider: AIProvider);
    /**
     * Review a code file
     */
    reviewCode(code: string, config?: ReviewConfig): Promise<ReviewResult>;
    /**
     * Review a pull request
     */
    reviewPR(files: Map<string, {
        before: string;
        after: string;
    }>, config?: ReviewConfig): Promise<PRReviewResult>;
    /**
     * Security-focused review
     */
    securityReview(code: string): Promise<SecurityFinding[]>;
    /**
     * Performance-focused review
     */
    performanceReview(code: string): Promise<PerformanceNote[]>;
    /**
     * Accessibility review
     */
    accessibilityReview(code: string): Promise<AccessibilityIssue[]>;
    /**
     * Generate review comment for a specific line
     */
    generateLineComment(code: string, lineNumber: number, context: string): Promise<LineComment>;
    /**
     * Suggest refactoring for code
     */
    suggestRefactoring(code: string): Promise<ReviewSuggestion[]>;
    private buildReviewPrompt;
    private parseReviewResponse;
    private createEmptyReview;
    private generateDiff;
    private getFileStatus;
    private reviewDiff;
    private generateLineComments;
    private aggregateReviews;
    private analyzeCommitQuality;
    private countAdditions;
    private countDeletions;
    private parseJSON;
}
/**
 * Create a code reviewer
 */
export declare function createCodeReviewer(provider: AIProvider): CodeReviewer;
//# sourceMappingURL=code-reviewer.d.ts.map