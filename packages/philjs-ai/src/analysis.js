/**
 * AI-Powered Code Analysis Module
 *
 * Provides intelligent code analysis capabilities including:
 * - Component structure analysis
 * - Performance optimization suggestions
 * - Anti-pattern detection
 * - Code quality metrics
 */
import { extractJSON } from './utils/parser.js';
/**
 * Code Analysis Engine
 *
 * Provides AI-powered code analysis capabilities for PhilJS applications.
 */
export class CodeAnalyzer {
    provider;
    defaultOptions;
    constructor(provider, options) {
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
    async analyzeComponent(code) {
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
        const result = extractJSON(response);
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
    async suggestOptimizations(code) {
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
        const result = extractJSON(response);
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
    async detectAntiPatterns(code) {
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
        const result = extractJSON(response);
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
    async analyzeComplexity(code) {
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
        const result = extractJSON(response);
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
    async analyzeSignalUsage(code) {
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
        const result = extractJSON(response);
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
    async analyzeAccessibility(code, targetLevel = 'AA') {
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
        const result = extractJSON(response);
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
    async getHealthCheck(code) {
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
        const result = extractJSON(response);
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
    getDefaultComponentAnalysis(code) {
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
export function createCodeAnalyzer(provider, options) {
    return new CodeAnalyzer(provider, options);
}
/**
 * Quick component analysis helper
 *
 * @param provider - AI provider
 * @param code - Component code
 * @returns Component analysis
 */
export async function analyzeComponent(provider, code) {
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
export async function suggestOptimizations(provider, code) {
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
export async function detectAntiPatterns(provider, code) {
    const analyzer = new CodeAnalyzer(provider);
    return analyzer.detectAntiPatterns(code);
}
//# sourceMappingURL=analysis.js.map