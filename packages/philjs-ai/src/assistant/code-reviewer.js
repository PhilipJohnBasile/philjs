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
     * Review a code file - comprehensive analysis including all focus areas
     */
    async reviewCode(code, config = {}) {
        const { focus = ['best-practices'], minSeverity = 'info', customRules } = config;
        const prompt = this.buildReviewPrompt(code, config);
        try {
            const { content: response } = await this.provider.generateCompletion(prompt, {
                temperature: 0.3,
                maxTokens: 4000,
            });
            const baseReview = this.parseReviewResponse(response, code, config);
            // Calculate real metrics
            baseReview.metrics = this.calculateMetrics(code);
            // Evaluate custom rules
            if (customRules?.length) {
                const customIssues = this.evaluateCustomRules(code, customRules);
                baseReview.issues = [...baseReview.issues, ...customIssues];
                baseReview.summary.totalIssues = baseReview.issues.length;
            }
            // Run specialized reviews based on focus areas
            const [securityFindings, performanceNotes, accessibilityIssues] = await Promise.all([
                focus.includes('security') ? this.securityReview(code) : Promise.resolve([]),
                focus.includes('performance') ? this.performanceReview(code) : Promise.resolve([]),
                focus.includes('accessibility') ? this.accessibilityReview(code) : Promise.resolve([]),
            ]);
            baseReview.securityFindings = securityFindings;
            baseReview.performanceNotes = performanceNotes;
            baseReview.accessibilityIssues = accessibilityIssues;
            // Filter by min severity
            baseReview.issues = this.filterBySeverity(baseReview.issues, minSeverity);
            // Recalculate summary and score
            baseReview.summary = this.calculateSummary(baseReview);
            baseReview.overallScore = this.calculateScore(baseReview);
            return baseReview;
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
            const { content: response } = await this.provider.generateCompletion(prompt, { temperature: 0.2 });
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
            const { content: response } = await this.provider.generateCompletion(prompt, { temperature: 0.2 });
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
            const { content: response } = await this.provider.generateCompletion(prompt, { temperature: 0.2 });
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
            const { content: response } = await this.provider.generateCompletion(prompt, { temperature: 0.3 });
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
            const { content: response } = await this.provider.generateCompletion(prompt, { temperature: 0.4 });
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
            const { content: response } = await this.provider.generateCompletion(prompt, { temperature: 0.3 });
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
    /**
     * Calculate real code metrics
     */
    calculateMetrics(code) {
        const lines = code.split('\n');
        const linesOfCode = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;
        return {
            linesOfCode,
            cyclomaticComplexity: this.calculateCyclomaticComplexity(code),
            cognitiveComplexity: this.calculateCognitiveComplexity(code),
            maintainabilityIndex: this.calculateMaintainabilityIndex(code),
            duplicateLines: this.countDuplicateLines(code),
            dependencyCount: this.countDependencies(code),
            unusedExports: 0, // Would require full project analysis
        };
    }
    /**
     * Calculate cyclomatic complexity
     * Counts decision points: if, else if, for, while, case, catch, &&, ||, ?:
     */
    calculateCyclomaticComplexity(code) {
        let complexity = 1; // Base complexity
        // Decision points
        const patterns = [
            /\bif\s*\(/g,
            /\belse\s+if\s*\(/g,
            /\bfor\s*\(/g,
            /\bwhile\s*\(/g,
            /\bcase\s+/g,
            /\bcatch\s*\(/g,
            /\?\s*[^:]+\s*:/g, // Ternary
            /&&/g,
            /\|\|/g,
            /\?\?/g, // Nullish coalescing
        ];
        for (const pattern of patterns) {
            const matches = code.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        }
        return complexity;
    }
    /**
     * Calculate cognitive complexity
     * Weighted measure considering nesting and control flow breaks
     */
    calculateCognitiveComplexity(code) {
        let complexity = 0;
        let nestingLevel = 0;
        const lines = code.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            // Increment for control structures at their nesting level
            if (/\b(if|else if|for|while|switch)\s*\(/.test(trimmed)) {
                complexity += 1 + nestingLevel;
            }
            // Increment for break/continue with labels
            if (/\b(break|continue)\s+\w+/.test(trimmed)) {
                complexity += 1;
            }
            // Increment for recursion (simple heuristic)
            if (/\bfunction\s+(\w+)[^{]*\{/.test(trimmed)) {
                const fnName = trimmed.match(/\bfunction\s+(\w+)/)?.[1];
                if (fnName && code.includes(`${fnName}(`)) {
                    // Check if function calls itself
                    const fnBody = this.extractFunctionBody(code, fnName);
                    if (fnBody && fnBody.includes(`${fnName}(`)) {
                        complexity += 1;
                    }
                }
            }
            // Track nesting
            const opens = (line.match(/\{/g) || []).length;
            const closes = (line.match(/\}/g) || []).length;
            nestingLevel = Math.max(0, nestingLevel + opens - closes);
        }
        return complexity;
    }
    extractFunctionBody(code, fnName) {
        const regex = new RegExp(`\\bfunction\\s+${fnName}\\s*\\([^)]*\\)\\s*\\{`, 'g');
        const match = regex.exec(code);
        if (!match)
            return null;
        let depth = 1;
        let start = match.index + match[0].length;
        let end = start;
        while (depth > 0 && end < code.length) {
            if (code[end] === '{')
                depth++;
            if (code[end] === '}')
                depth--;
            end++;
        }
        return code.slice(start, end - 1);
    }
    /**
     * Calculate maintainability index (0-100)
     * Based on Halstead volume, cyclomatic complexity, and lines of code
     */
    calculateMaintainabilityIndex(code) {
        const lines = code.split('\n').filter(l => l.trim()).length;
        const complexity = this.calculateCyclomaticComplexity(code);
        // Simplified formula: MI = 171 - 5.2 * ln(V) - 0.23 * G - 16.2 * ln(L)
        // We use approximations for Halstead volume
        const operators = (code.match(/[+\-*/%=<>!&|^~?:]/g) || []).length;
        const operands = (code.match(/\b[a-zA-Z_]\w*\b/g) || []).length;
        const volume = Math.max(1, (operators + operands) * Math.log2(operators + operands + 1));
        const mi = 171 - 5.2 * Math.log(volume) - 0.23 * complexity - 16.2 * Math.log(lines + 1);
        // Normalize to 0-100
        return Math.max(0, Math.min(100, mi * (100 / 171)));
    }
    /**
     * Count duplicate lines (simple heuristic)
     */
    countDuplicateLines(code) {
        const lines = code.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 10 && !l.startsWith('//') && !l.startsWith('*'));
        const seen = new Map();
        let duplicates = 0;
        for (const line of lines) {
            const count = seen.get(line) || 0;
            if (count > 0) {
                duplicates++;
            }
            seen.set(line, count + 1);
        }
        return duplicates;
    }
    /**
     * Count import/require statements
     */
    countDependencies(code) {
        const imports = code.match(/\bimport\s+.+\s+from\s+['"][^'"]+['"]/g) || [];
        const requires = code.match(/\brequire\s*\(\s*['"][^'"]+['"]\s*\)/g) || [];
        return imports.length + requires.length;
    }
    /**
     * Evaluate custom rules against code
     */
    evaluateCustomRules(code, rules) {
        const issues = [];
        for (const rule of rules) {
            if (rule.check(code)) {
                // Find line number if pattern provided
                let lineNumber;
                if (rule.pattern) {
                    const regex = new RegExp(rule.pattern, 'g');
                    const match = regex.exec(code);
                    if (match) {
                        const beforeMatch = code.slice(0, match.index);
                        lineNumber = beforeMatch.split('\n').length;
                    }
                }
                const issue = {
                    id: `CUSTOM-${rule.id}`,
                    severity: rule.severity,
                    category: 'custom-rule',
                    title: rule.name,
                    description: rule.description,
                    suggestion: rule.message,
                };
                if (lineNumber !== undefined) {
                    issue.line = lineNumber;
                }
                if (rule.fix !== undefined) {
                    issue.suggestedFix = rule.fix;
                }
                issues.push(issue);
            }
        }
        return issues;
    }
    /**
     * Filter issues by minimum severity
     */
    filterBySeverity(issues, minSeverity) {
        const severityOrder = ['info', 'warning', 'error', 'critical'];
        const minIndex = severityOrder.indexOf(minSeverity);
        return issues.filter(issue => {
            const issueIndex = severityOrder.indexOf(issue.severity);
            return issueIndex >= minIndex;
        });
    }
    /**
     * Calculate review summary from issues
     */
    calculateSummary(review) {
        const issues = review.issues;
        const bySeverity = {
            info: 0,
            warning: 0,
            error: 0,
            critical: 0,
        };
        const byCategory = {};
        for (const issue of issues) {
            bySeverity[issue.severity]++;
            byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
        }
        // Generate highlights
        const highlights = [];
        if (bySeverity.critical > 0) {
            highlights.push(`${bySeverity.critical} critical issue(s) found`);
        }
        if (review.securityFindings.length > 0) {
            highlights.push(`${review.securityFindings.length} security finding(s)`);
        }
        if (review.metrics.cyclomaticComplexity > 10) {
            highlights.push('High cyclomatic complexity detected');
        }
        if (review.metrics.maintainabilityIndex < 50) {
            highlights.push('Low maintainability index');
        }
        // Determine recommendation
        let recommendation;
        if (bySeverity.critical > 0 || review.securityFindings.some(f => f.severity === 'critical')) {
            recommendation = 'request-changes';
        }
        else if (bySeverity.error > 2 || review.securityFindings.some(f => f.severity === 'high')) {
            recommendation = 'request-changes';
        }
        else if (bySeverity.error > 0 || bySeverity.warning > 5) {
            recommendation = 'needs-discussion';
        }
        else {
            recommendation = 'approve';
        }
        return {
            totalIssues: issues.length,
            bySeverity,
            byCategory,
            highlights,
            recommendation,
        };
    }
    /**
     * Calculate overall review score (0-100)
     */
    calculateScore(review) {
        let score = 100;
        // Deduct for issues
        score -= review.summary.bySeverity.critical * 20;
        score -= review.summary.bySeverity.error * 10;
        score -= review.summary.bySeverity.warning * 3;
        score -= review.summary.bySeverity.info * 1;
        // Deduct for security findings
        for (const finding of review.securityFindings) {
            switch (finding.severity) {
                case 'critical':
                    score -= 15;
                    break;
                case 'high':
                    score -= 10;
                    break;
                case 'medium':
                    score -= 5;
                    break;
                case 'low':
                    score -= 2;
                    break;
            }
        }
        // Deduct for poor metrics
        if (review.metrics.cyclomaticComplexity > 20) {
            score -= 10;
        }
        else if (review.metrics.cyclomaticComplexity > 10) {
            score -= 5;
        }
        if (review.metrics.maintainabilityIndex < 30) {
            score -= 10;
        }
        else if (review.metrics.maintainabilityIndex < 50) {
            score -= 5;
        }
        if (review.metrics.duplicateLines > 20) {
            score -= 5;
        }
        return Math.max(0, Math.min(100, score));
    }
}
/**
 * Create a code reviewer
 */
export function createCodeReviewer(provider) {
    return new CodeReviewer(provider);
}
//# sourceMappingURL=code-reviewer.js.map