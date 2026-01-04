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
// =============================================================================
// Code Reviewer
// =============================================================================
export class CodeReviewer {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    /**
     * Review a code file
     */
    async reviewCode(code, config = {}) {
        const { focus = ['best-practices'], minSeverity = 'info' } = config;
        const prompt = this.buildReviewPrompt(code, config);
        try {
            const response = await this.provider.generateCompletion(prompt, {
                temperature: 0.3,
                maxTokens: 4000,
            });
            return this.parseReviewResponse(response, code, config);
        }
        catch (error) {
            return this.createEmptyReview();
        }
    }
    /**
     * Review a pull request
     */
    async reviewPR(files, config = {}) {
        const fileReviews = [];
        let totalIssues = [];
        let totalSuggestions = [];
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
    async securityReview(code) {
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
            return this.parseJSON(response, []);
        }
        catch {
            return [];
        }
    }
    /**
     * Performance-focused review
     */
    async performanceReview(code) {
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
            return this.parseJSON(response, []);
        }
        catch {
            return [];
        }
    }
    /**
     * Accessibility review
     */
    async accessibilityReview(code) {
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
            return this.parseJSON(response, []);
        }
        catch {
            return [];
        }
    }
    /**
     * Generate review comment for a specific line
     */
    async generateLineComment(code, lineNumber, context) {
        const lines = code.split('\n');
        const targetLine = lines[lineNumber - 1] || '';
        const surroundingCode = lines.slice(Math.max(0, lineNumber - 3), Math.min(lines.length, lineNumber + 3)).join('\n');
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
            const result = this.parseJSON(response, {
                type: 'suggestion',
                content: 'No issues found.',
            });
            const comment = {
                line: lineNumber,
                type: result.type,
                content: result.content,
            };
            if (result.code !== undefined) {
                comment.code = result.code;
            }
            return comment;
        }
        catch {
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
    async suggestRefactoring(code) {
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
            return this.parseJSON(response, []);
        }
        catch {
            return [];
        }
    }
    // ==========================================================================
    // Private Methods
    // ==========================================================================
    buildReviewPrompt(code, config) {
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
    parseReviewResponse(response, code, config) {
        try {
            const parsed = this.parseJSON(response, {});
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
        }
        catch {
            return this.createEmptyReview();
        }
    }
    createEmptyReview() {
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
    generateDiff(before, after) {
        const beforeLines = before.split('\n');
        const afterLines = after.split('\n');
        let diff = '';
        const maxLines = Math.max(beforeLines.length, afterLines.length);
        for (let i = 0; i < maxLines; i++) {
            const beforeLine = beforeLines[i];
            const afterLine = afterLines[i];
            if (beforeLine === afterLine) {
                diff += ` ${afterLine || ''}\n`;
            }
            else if (beforeLine === undefined) {
                diff += `+${afterLine}\n`;
            }
            else if (afterLine === undefined) {
                diff += `-${beforeLine}\n`;
            }
            else {
                diff += `-${beforeLine}\n+${afterLine}\n`;
            }
        }
        return diff;
    }
    getFileStatus(before, after) {
        if (!before)
            return 'added';
        if (!after)
            return 'deleted';
        return 'modified';
    }
    async reviewDiff(diff, path, config) {
        const prompt = `Review this diff for file: ${path}

\`\`\`diff
${diff}
\`\`\`

Focus on changes only. Return issues and suggestions as JSON.`;
        try {
            const response = await this.provider.generateCompletion(prompt, { temperature: 0.3 });
            return this.parseReviewResponse(response, diff, config);
        }
        catch {
            return this.createEmptyReview();
        }
    }
    generateLineComments(review) {
        return review.issues
            .filter(issue => issue.line)
            .map(issue => {
            const comment = {
                line: issue.line,
                type: issue.severity === 'error' || issue.severity === 'critical' ? 'issue' : 'suggestion',
                content: `**${issue.title}**: ${issue.description}`,
            };
            if (issue.suggestedFix !== undefined) {
                comment.code = issue.suggestedFix;
            }
            return comment;
        });
    }
    async aggregateReviews(fileReviews, config) {
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
                }, {}),
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
    async analyzeCommitQuality(files) {
        return {
            messageQuality: 80,
            atomicity: files.size <= 5 ? 90 : 60,
            suggestions: files.size > 10 ? ['Consider splitting this into smaller commits'] : [],
        };
    }
    countAdditions(files) {
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
    countDeletions(files) {
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
    parseJSON(text, fallback) {
        try {
            const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : text;
            return JSON.parse(jsonStr.trim());
        }
        catch {
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
            }
            catch {
                // ignore
            }
            return fallback;
        }
    }
}
/**
 * Create a code reviewer
 */
export function createCodeReviewer(provider) {
    return new CodeReviewer(provider);
}
//# sourceMappingURL=code-reviewer.js.map