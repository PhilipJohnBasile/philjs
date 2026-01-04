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
import { extractCode, extractJSON, validateCode } from '../utils/parser.js';
/**
 * AI Refactoring Engine
 */
export class RefactoringEngine {
    provider;
    defaultOptions;
    constructor(provider, options) {
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
    async refactor(config) {
        const focusAreas = config.focusAreas || ['performance', 'patterns', 'readability'];
        const prompt = this.buildRefactorPrompt(config, focusAreas);
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: this.getSystemPrompt(config.level || 'moderate'),
        });
        return this.parseRefactorResult(response, config.code);
    }
    /**
     * Analyze and improve performance
     */
    async analyzePerformance(code) {
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
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are a performance optimization expert for reactive UI frameworks.',
        });
        return extractJSON(response) || {
            issues: [],
            optimizations: [],
            estimatedImprovement: {},
        };
    }
    /**
     * Audit and fix accessibility issues
     */
    async auditAccessibility(code, targetLevel = 'AA') {
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
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: `You are a WCAG accessibility expert targeting Level ${targetLevel} compliance.`,
        });
        return extractJSON(response) || {
            issues: [],
            fixes: [],
            compliance: { level: 'non-compliant', passedCriteria: [], failedCriteria: [] },
        };
    }
    /**
     * Check and improve best practices
     */
    async checkBestPractices(code, categories) {
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
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are a code quality expert for PhilJS applications.',
        });
        return extractJSON(response) || {
            violations: [],
            improvements: [],
            score: 0,
        };
    }
    /**
     * Convert signals usage to optimal patterns
     */
    async optimizeSignals(code) {
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
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are an expert in fine-grained reactivity patterns.',
        });
        const result = extractJSON(response);
        return result || {
            code: extractCode(response) || code,
            changes: [],
            explanation: 'Code analyzed',
        };
    }
    /**
     * Code review with AI
     */
    async reviewCode(code, filePath, aspects) {
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
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are a senior code reviewer for PhilJS applications.',
        });
        return extractJSON(response) || {
            issues: [],
            suggestions: [],
            overallScore: 0,
            summary: 'Review completed',
        };
    }
    /**
     * Extract and improve TypeScript types
     */
    async improveTypes(code) {
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
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are a TypeScript type expert.',
        });
        const result = extractJSON(response);
        return result || {
            code: extractCode(response) || code,
            addedTypes: [],
            improvedTypes: [],
        };
    }
    /**
     * Simplify complex code
     */
    async simplify(code) {
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
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You simplify code while maintaining readability and functionality.',
        });
        const result = extractJSON(response);
        return result || {
            code: extractCode(response) || code,
            complexity: { before: 0, after: 0 },
            changes: [],
        };
    }
    /**
     * Build refactor prompt
     */
    buildRefactorPrompt(config, focusAreas) {
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
    getSystemPrompt(level) {
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
    parseRefactorResult(response, originalCode) {
        const result = extractJSON(response);
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
export function createRefactoringEngine(provider, options) {
    return new RefactoringEngine(provider, options);
}
/**
 * Quick refactor helper
 */
export async function refactorCode(provider, code, focusAreas) {
    const engine = new RefactoringEngine(provider);
    return engine.refactor({ code, ...(focusAreas !== undefined ? { focusAreas } : {}) });
}
/**
 * Quick performance analysis helper
 */
export async function analyzePerformance(provider, code) {
    const engine = new RefactoringEngine(provider);
    return engine.analyzePerformance(code);
}
/**
 * Quick accessibility audit helper
 */
export async function auditAccessibility(provider, code, level) {
    const engine = new RefactoringEngine(provider);
    return engine.auditAccessibility(code, level);
}
//# sourceMappingURL=index.js.map