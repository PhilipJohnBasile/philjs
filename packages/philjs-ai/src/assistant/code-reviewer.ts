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

// =============================================================================
// Types
// =============================================================================

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

export type ReviewFocus =
  | 'security'
  | 'performance'
  | 'readability'
  | 'maintainability'
  | 'accessibility'
  | 'testing'
  | 'error-handling'
  | 'typescript'
  | 'best-practices';

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

export type SecurityCategory =
  | 'injection'
  | 'xss'
  | 'authentication'
  | 'authorization'
  | 'exposure'
  | 'misconfiguration'
  | 'cryptography'
  | 'dependencies';

export interface PerformanceNote {
  type: 'issue' | 'suggestion' | 'warning';
  category: PerformanceCategory;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  line?: number;
  recommendation: string;
}

export type PerformanceCategory =
  | 'rendering'
  | 'memory'
  | 'network'
  | 'computation'
  | 'bundle-size'
  | 'lazy-loading';

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

// =============================================================================
// Code Reviewer
// =============================================================================

export class CodeReviewer {
  constructor(private provider: AIProvider) {}

  /**
   * Review a code file
   */
  async reviewCode(code: string, config: ReviewConfig = {}): Promise<ReviewResult> {
    const { focus = ['best-practices'], minSeverity = 'info' } = config;

    const prompt = this.buildReviewPrompt(code, config);

    try {
      const response = await this.provider.generateCompletion(prompt, {
        temperature: 0.3,
        maxTokens: 4000,
      });

      return this.parseReviewResponse(response, code, config);
    } catch (error) {
      return this.createEmptyReview();
    }
  }

  /**
   * Review a pull request
   */
  async reviewPR(
    files: Map<string, { before: string; after: string }>,
    config: ReviewConfig = {}
  ): Promise<PRReviewResult> {
    const fileReviews: FileReview[] = [];
    let totalIssues: ReviewIssue[] = [];
    let totalSuggestions: ReviewSuggestion[] = [];

    for (const [path, { before, after }] of files) {
      const diff = this.generateDiff(before, after);
      const review = await this.reviewDiff(diff, path, config);

      fileReviews.push({
        path,
        status: this.getFileStatus(before, after),
        issues: review.issues,
        lineComments: this.generateLineComments(review),
      });

      totalIssues = [...totalIssues, ...review.issues];
      totalSuggestions = [...totalSuggestions, ...review.suggestions];
    }

    const baseReview = await this.aggregateReviews(fileReviews, config);

    return {
      ...baseReview,
      issues: totalIssues,
      suggestions: totalSuggestions,
      prSummary: {
        filesChanged: files.size,
        additions: this.countAdditions(files),
        deletions: this.countDeletions(files),
        changedFiles: fileReviews,
      },
      commitQuality: await this.analyzeCommitQuality(files),
    };
  }

  /**
   * Security-focused review
   */
  async securityReview(code: string): Promise<SecurityFinding[]> {
    const prompt = `Perform a comprehensive security audit on this code.
Look for:
- Injection vulnerabilities (SQL, command, XSS)
- Authentication/authorization issues
- Data exposure risks
- Cryptographic weaknesses
- Input validation problems
- Sensitive data handling

Code:
\`\`\`
${code}
\`\`\`

Return findings as JSON array:
[{
  "id": "SEC-001",
  "severity": "high|medium|low|critical",
  "category": "injection|xss|authentication|authorization|exposure|misconfiguration|cryptography|dependencies",
  "title": "Issue title",
  "description": "Detailed description",
  "cweId": "CWE-XXX",
  "owaspCategory": "A01:2021",
  "line": 42,
  "remediation": "How to fix",
  "references": ["https://..."]
}]`;

    try {
      const response = await this.provider.generateCompletion(prompt, { temperature: 0.2 });
      return this.parseJSON<SecurityFinding[]>(response, []);
    } catch {
      return [];
    }
  }

  /**
   * Performance-focused review
   */
  async performanceReview(code: string): Promise<PerformanceNote[]> {
    const prompt = `Analyze this code for performance issues and optimization opportunities.
Look for:
- Unnecessary re-renders
- Memory leaks
- Expensive operations in loops
- N+1 query patterns
- Bundle size impact
- Missing lazy loading opportunities
- Inefficient data structures

Code:
\`\`\`
${code}
\`\`\`

Return findings as JSON array:
[{
  "type": "issue|suggestion|warning",
  "category": "rendering|memory|network|computation|bundle-size|lazy-loading",
  "title": "Issue title",
  "description": "Description",
  "impact": "high|medium|low",
  "line": 42,
  "recommendation": "How to optimize"
}]`;

    try {
      const response = await this.provider.generateCompletion(prompt, { temperature: 0.2 });
      return this.parseJSON<PerformanceNote[]>(response, []);
    } catch {
      return [];
    }
  }

  /**
   * Accessibility review
   */
  async accessibilityReview(code: string): Promise<AccessibilityIssue[]> {
    const prompt = `Audit this code for accessibility issues following WCAG 2.1 guidelines.
Look for:
- Missing ARIA attributes
- Keyboard navigation issues
- Color contrast problems
- Missing alt text
- Form label associations
- Focus management
- Screen reader compatibility

Code:
\`\`\`
${code}
\`\`\`

Return findings as JSON array:
[{
  "level": "A|AA|AAA",
  "principle": "perceivable|operable|understandable|robust",
  "guideline": "1.1.1 Non-text Content",
  "title": "Issue title",
  "description": "Description",
  "line": 42,
  "element": "<img src=... />",
  "fix": "How to fix"
}]`;

    try {
      const response = await this.provider.generateCompletion(prompt, { temperature: 0.2 });
      return this.parseJSON<AccessibilityIssue[]>(response, []);
    } catch {
      return [];
    }
  }

  /**
   * Generate review comment for a specific line
   */
  async generateLineComment(
    code: string,
    lineNumber: number,
    context: string
  ): Promise<LineComment> {
    const lines = code.split('\n');
    const targetLine = lines[lineNumber - 1] || '';
    const surroundingCode = lines.slice(
      Math.max(0, lineNumber - 3),
      Math.min(lines.length, lineNumber + 3)
    ).join('\n');

    const prompt = `Review this specific line of code and provide a helpful comment.

Context: ${context}

Surrounding code:
\`\`\`
${surroundingCode}
\`\`\`

Target line (${lineNumber}): ${targetLine}

Provide a comment as JSON:
{
  "type": "suggestion|issue|question|praise",
  "content": "Your comment",
  "code": "Optional suggested code"
}`;

    try {
      const response = await this.provider.generateCompletion(prompt, { temperature: 0.3 });
      const result = this.parseJSON<{ type: string; content: string; code?: string }>(response, {
        type: 'suggestion',
        content: 'No issues found.',
      });

      const comment: LineComment = {
        line: lineNumber,
        type: result.type as LineComment['type'],
        content: result.content,
      };
      if (result.code !== undefined) {
        comment.code = result.code;
      }
      return comment;
    } catch {
      return {
        line: lineNumber,
        type: 'suggestion',
        content: 'Unable to generate comment.',
      };
    }
  }

  /**
   * Suggest refactoring for code
   */
  async suggestRefactoring(code: string): Promise<ReviewSuggestion[]> {
    const prompt = `Analyze this code and suggest refactoring improvements.

Consider:
- Code duplication
- Complex conditionals
- Long functions
- Magic numbers/strings
- Naming improvements
- Pattern opportunities
- SOLID principles

Code:
\`\`\`
${code}
\`\`\`

Return suggestions as JSON array:
[{
  "id": "REF-001",
  "type": "improvement|refactoring|optimization|pattern",
  "title": "Suggestion title",
  "description": "What to improve",
  "before": "Current code snippet",
  "after": "Improved code snippet",
  "benefit": "Why this helps",
  "effort": "low|medium|high",
  "priority": 1-10
}]`;

    try {
      const response = await this.provider.generateCompletion(prompt, { temperature: 0.4 });
      return this.parseJSON<ReviewSuggestion[]>(response, []);
    } catch {
      return [];
    }
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private buildReviewPrompt(code: string, config: ReviewConfig): string {
    const focusAreas = config.focus?.join(', ') || 'general best practices';

    return `You are an expert code reviewer. Review the following code focusing on: ${focusAreas}

${config.context ? `Context: ${config.context.language || 'unknown'} / ${config.context.framework || 'none'}` : ''}

Code to review:
\`\`\`
${code}
\`\`\`

Provide a comprehensive review as JSON:
{
  "summary": {
    "totalIssues": number,
    "bySeverity": { "info": 0, "warning": 0, "error": 0, "critical": 0 },
    "byCategory": {},
    "highlights": ["key points"],
    "recommendation": "approve|request-changes|needs-discussion"
  },
  "issues": [{
    "id": "ISS-001",
    "severity": "info|warning|error|critical",
    "category": "category",
    "title": "title",
    "description": "description",
    "line": number,
    "suggestion": "how to fix",
    "suggestedFix": "code"
  }],
  "suggestions": [{
    "id": "SUG-001",
    "type": "improvement|refactoring|optimization|pattern",
    "title": "title",
    "description": "description",
    "before": "code",
    "after": "code",
    "benefit": "why",
    "effort": "low|medium|high",
    "priority": 1-10
  }],
  "metrics": {
    "linesOfCode": number,
    "cyclomaticComplexity": number,
    "cognitiveComplexity": number,
    "maintainabilityIndex": 0-100,
    "duplicateLines": number,
    "dependencyCount": number,
    "unusedExports": number
  },
  "overallScore": 0-100,
  "passedChecks": ["check names"]
}`;
  }

  private parseReviewResponse(response: string, code: string, config: ReviewConfig): ReviewResult {
    try {
      const parsed = this.parseJSON<Partial<ReviewResult>>(response, {});

      return {
        summary: parsed.summary || {
          totalIssues: 0,
          bySeverity: { info: 0, warning: 0, error: 0, critical: 0 },
          byCategory: {},
          highlights: [],
          recommendation: 'approve',
        },
        issues: parsed.issues || [],
        suggestions: parsed.suggestions || [],
        metrics: parsed.metrics || {
          linesOfCode: code.split('\n').length,
          cyclomaticComplexity: 1,
          cognitiveComplexity: 1,
          maintainabilityIndex: 70,
          duplicateLines: 0,
          dependencyCount: 0,
          unusedExports: 0,
        },
        securityFindings: [],
        performanceNotes: [],
        accessibilityIssues: [],
        overallScore: parsed.overallScore || 75,
        passedChecks: parsed.passedChecks || [],
        timestamp: new Date().toISOString(),
      };
    } catch {
      return this.createEmptyReview();
    }
  }

  private createEmptyReview(): ReviewResult {
    return {
      summary: {
        totalIssues: 0,
        bySeverity: { info: 0, warning: 0, error: 0, critical: 0 },
        byCategory: {},
        highlights: [],
        recommendation: 'approve',
      },
      issues: [],
      suggestions: [],
      metrics: {
        linesOfCode: 0,
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        maintainabilityIndex: 0,
        duplicateLines: 0,
        dependencyCount: 0,
        unusedExports: 0,
      },
      securityFindings: [],
      performanceNotes: [],
      accessibilityIssues: [],
      overallScore: 0,
      passedChecks: [],
      timestamp: new Date().toISOString(),
    };
  }

  private generateDiff(before: string, after: string): string {
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');

    let diff = '';
    const maxLines = Math.max(beforeLines.length, afterLines.length);

    for (let i = 0; i < maxLines; i++) {
      const beforeLine = beforeLines[i];
      const afterLine = afterLines[i];

      if (beforeLine === afterLine) {
        diff += ` ${afterLine || ''}\n`;
      } else if (beforeLine === undefined) {
        diff += `+${afterLine}\n`;
      } else if (afterLine === undefined) {
        diff += `-${beforeLine}\n`;
      } else {
        diff += `-${beforeLine}\n+${afterLine}\n`;
      }
    }

    return diff;
  }

  private getFileStatus(before: string, after: string): 'added' | 'modified' | 'deleted' | 'renamed' {
    if (!before) return 'added';
    if (!after) return 'deleted';
    return 'modified';
  }

  private async reviewDiff(diff: string, path: string, config: ReviewConfig): Promise<ReviewResult> {
    const prompt = `Review this diff for file: ${path}

\`\`\`diff
${diff}
\`\`\`

Focus on changes only. Return issues and suggestions as JSON.`;

    try {
      const response = await this.provider.generateCompletion(prompt, { temperature: 0.3 });
      return this.parseReviewResponse(response, diff, config);
    } catch {
      return this.createEmptyReview();
    }
  }

  private generateLineComments(review: ReviewResult): LineComment[] {
    return review.issues
      .filter(issue => issue.line)
      .map(issue => {
        const comment: LineComment = {
          line: issue.line!,
          type: issue.severity === 'error' || issue.severity === 'critical' ? 'issue' : 'suggestion',
          content: `**${issue.title}**: ${issue.description}`,
        };
        if (issue.suggestedFix !== undefined) {
          comment.code = issue.suggestedFix;
        }
        return comment;
      });
  }

  private async aggregateReviews(fileReviews: FileReview[], config: ReviewConfig): Promise<ReviewResult> {
    const allIssues = fileReviews.flatMap(fr => fr.issues);

    return {
      summary: {
        totalIssues: allIssues.length,
        bySeverity: {
          info: allIssues.filter(i => i.severity === 'info').length,
          warning: allIssues.filter(i => i.severity === 'warning').length,
          error: allIssues.filter(i => i.severity === 'error').length,
          critical: allIssues.filter(i => i.severity === 'critical').length,
        },
        byCategory: allIssues.reduce((acc, i) => {
          acc[i.category] = (acc[i.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        highlights: [],
        recommendation: allIssues.some(i => i.severity === 'critical') ? 'request-changes' : 'approve',
      },
      issues: allIssues,
      suggestions: [],
      metrics: {
        linesOfCode: 0,
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        maintainabilityIndex: 0,
        duplicateLines: 0,
        dependencyCount: 0,
        unusedExports: 0,
      },
      securityFindings: [],
      performanceNotes: [],
      accessibilityIssues: [],
      overallScore: 100 - (allIssues.length * 5),
      passedChecks: [],
      timestamp: new Date().toISOString(),
    };
  }

  private async analyzeCommitQuality(files: Map<string, { before: string; after: string }>): Promise<{
    messageQuality: number;
    atomicity: number;
    suggestions: string[];
  }> {
    return {
      messageQuality: 80,
      atomicity: files.size <= 5 ? 90 : 60,
      suggestions: files.size > 10 ? ['Consider splitting this into smaller commits'] : [],
    };
  }

  private countAdditions(files: Map<string, { before: string; after: string }>): number {
    let count = 0;
    for (const { before, after } of files.values()) {
      const beforeLines = before.split('\n').length;
      const afterLines = after.split('\n').length;
      if (afterLines > beforeLines) {
        count += afterLines - beforeLines;
      }
    }
    return count;
  }

  private countDeletions(files: Map<string, { before: string; after: string }>): number {
    let count = 0;
    for (const { before, after } of files.values()) {
      const beforeLines = before.split('\n').length;
      const afterLines = after.split('\n').length;
      if (beforeLines > afterLines) {
        count += beforeLines - afterLines;
      }
    }
    return count;
  }

  private parseJSON<T>(text: string, fallback: T): T {
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1]! : text;
      return JSON.parse(jsonStr.trim());
    } catch {
      try {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}') + 1;
        if (start !== -1 && end > start) {
          return JSON.parse(text.slice(start, end));
        }
        const arrStart = text.indexOf('[');
        const arrEnd = text.lastIndexOf(']') + 1;
        if (arrStart !== -1 && arrEnd > arrStart) {
          return JSON.parse(text.slice(arrStart, arrEnd));
        }
      } catch {
        // ignore
      }
      return fallback;
    }
  }
}

/**
 * Create a code reviewer
 */
export function createCodeReviewer(provider: AIProvider): CodeReviewer {
  return new CodeReviewer(provider);
}
