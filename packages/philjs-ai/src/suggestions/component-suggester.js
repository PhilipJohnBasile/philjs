/**
 * Component Suggestion System
 *
 * Provides context-aware component suggestions based on:
 * - Current code context
 * - Project structure
 * - Common patterns
 * - User behavior
 */
import { extractJSON } from '../utils/parser.js';
// ============================================================================
// Built-in Component Catalog
// ============================================================================
const PHILJS_COMPONENTS = [
    {
        name: 'Button',
        description: 'Interactive button with variants and states',
        category: 'form',
        relevance: 90,
        props: [
            { name: 'variant', type: "'primary' | 'secondary' | 'ghost'", required: false, defaultValue: "'primary'" },
            { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, defaultValue: "'md'" },
            { name: 'disabled', type: 'boolean', required: false, defaultValue: 'false' },
            { name: 'loading', type: 'boolean', required: false, defaultValue: 'false' },
            { name: 'onClick', type: '() => void', required: false },
        ],
        importStatement: "import { Button } from '@philjs/ui';",
        snippet: '<Button variant="${1:primary}" onClick={${2:handleClick}}>${3:Click me}</Button>',
        reason: 'Common interactive element',
        source: 'built-in',
        tags: ['interactive', 'form', 'action'],
    },
    {
        name: 'Input',
        description: 'Text input with validation and states',
        category: 'form',
        relevance: 85,
        props: [
            { name: 'type', type: "'text' | 'email' | 'password' | 'number'", required: false, defaultValue: "'text'" },
            { name: 'value', type: 'string', required: true },
            { name: 'onChange', type: '(value: string) => void', required: true },
            { name: 'placeholder', type: 'string', required: false },
            { name: 'error', type: 'string', required: false },
        ],
        importStatement: "import { Input } from '@philjs/ui';",
        snippet: '<Input value={${1:value}} onChange={${2:setValue}} placeholder="${3:Enter text}" />',
        reason: 'Essential form input',
        source: 'built-in',
        tags: ['form', 'input', 'text'],
    },
    {
        name: 'Card',
        description: 'Container with border and padding',
        category: 'layout',
        relevance: 80,
        props: [
            { name: 'children', type: 'ReactNode', required: true },
            { name: 'className', type: 'string', required: false },
            { name: 'padding', type: "'none' | 'sm' | 'md' | 'lg'", required: false, defaultValue: "'md'" },
        ],
        importStatement: "import { Card } from '@philjs/ui';",
        snippet: '<Card>\n\t${1:content}\n</Card>',
        reason: 'Common container pattern',
        source: 'built-in',
        tags: ['layout', 'container'],
    },
    {
        name: 'Modal',
        description: 'Overlay dialog with backdrop',
        category: 'overlay',
        relevance: 75,
        props: [
            { name: 'open', type: 'boolean', required: true },
            { name: 'onClose', type: '() => void', required: true },
            { name: 'title', type: 'string', required: false },
            { name: 'children', type: 'ReactNode', required: true },
        ],
        importStatement: "import { Modal } from '@philjs/ui';",
        snippet: '<Modal open={${1:isOpen}} onClose={${2:onClose}} title="${3:Title}">\n\t${4:content}\n</Modal>',
        reason: 'For displaying important content',
        source: 'built-in',
        tags: ['overlay', 'dialog', 'modal'],
    },
    {
        name: 'Select',
        description: 'Dropdown select with options',
        category: 'form',
        relevance: 80,
        props: [
            { name: 'value', type: 'string', required: true },
            { name: 'onChange', type: '(value: string) => void', required: true },
            { name: 'options', type: 'Array<{ value: string; label: string }>', required: true },
            { name: 'placeholder', type: 'string', required: false },
        ],
        importStatement: "import { Select } from '@philjs/ui';",
        snippet: '<Select value={${1:value}} onChange={${2:setValue}} options={${3:options}} />',
        reason: 'For selecting from options',
        source: 'built-in',
        tags: ['form', 'select', 'dropdown'],
    },
    {
        name: 'Table',
        description: 'Data table with sorting and pagination',
        category: 'data-display',
        relevance: 70,
        props: [
            { name: 'data', type: 'T[]', required: true },
            { name: 'columns', type: 'Column<T>[]', required: true },
            { name: 'onRowClick', type: '(row: T) => void', required: false },
        ],
        importStatement: "import { Table } from '@philjs/ui';",
        snippet: '<Table data={${1:data}} columns={${2:columns}} />',
        reason: 'For displaying tabular data',
        source: 'built-in',
        tags: ['data', 'table', 'list'],
    },
    {
        name: 'List',
        description: 'Rendered list of items',
        category: 'data-display',
        relevance: 75,
        props: [
            { name: 'items', type: 'T[]', required: true },
            { name: 'renderItem', type: '(item: T, index: number) => ReactNode', required: true },
            { name: 'keyExtractor', type: '(item: T) => string', required: false },
        ],
        importStatement: "import { List } from '@philjs/ui';",
        snippet: '<List items={${1:items}} renderItem={(item) => ${2:<div>{item}</div>}} />',
        reason: 'For rendering lists efficiently',
        source: 'built-in',
        tags: ['data', 'list', 'render'],
    },
    {
        name: 'Tabs',
        description: 'Tabbed navigation with content panels',
        category: 'navigation',
        relevance: 70,
        props: [
            { name: 'tabs', type: 'Array<{ id: string; label: string; content: ReactNode }>', required: true },
            { name: 'defaultTab', type: 'string', required: false },
            { name: 'onChange', type: '(tabId: string) => void', required: false },
        ],
        importStatement: "import { Tabs } from '@philjs/ui';",
        snippet: '<Tabs tabs={${1:tabs}} defaultTab="${2:tab1}" />',
        reason: 'For organizing content',
        source: 'built-in',
        tags: ['navigation', 'tabs', 'panels'],
    },
    {
        name: 'Alert',
        description: 'Status alert message',
        category: 'feedback',
        relevance: 65,
        props: [
            { name: 'type', type: "'info' | 'success' | 'warning' | 'error'", required: true },
            { name: 'message', type: 'string', required: true },
            { name: 'onClose', type: '() => void', required: false },
        ],
        importStatement: "import { Alert } from '@philjs/ui';",
        snippet: '<Alert type="${1:info}" message="${2:Message}" />',
        reason: 'For user feedback',
        source: 'built-in',
        tags: ['feedback', 'alert', 'message'],
    },
    {
        name: 'Spinner',
        description: 'Loading spinner indicator',
        category: 'feedback',
        relevance: 60,
        props: [
            { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, defaultValue: "'md'" },
            { name: 'color', type: 'string', required: false },
        ],
        importStatement: "import { Spinner } from '@philjs/ui';",
        snippet: '<Spinner size="${1:md}" />',
        reason: 'For loading states',
        source: 'built-in',
        tags: ['feedback', 'loading', 'spinner'],
    },
];
// ============================================================================
// Component Suggester
// ============================================================================
/**
 * Component Suggestion Engine
 *
 * Provides intelligent component suggestions based on context.
 *
 * @example
 * ```typescript
 * const suggester = new ComponentSuggester(provider);
 *
 * const result = await suggester.suggest({
 *   fileContent: code,
 *   cursorPosition: { line: 10, column: 5 },
 *   filePath: 'src/components/MyComponent.tsx',
 * });
 *
 * result.suggestions.forEach(s => {
 *   console.log(`${s.name}: ${s.description} (relevance: ${s.relevance})`);
 * });
 * ```
 */
export class ComponentSuggester {
    provider;
    defaultOptions;
    componentCache;
    constructor(provider, options) {
        this.provider = provider;
        this.defaultOptions = {
            temperature: 0.2,
            maxTokens: 2048,
            ...options,
        };
        this.componentCache = new Map();
    }
    /**
     * Get component suggestions for the current context
     *
     * @param context - Current code context
     * @returns Suggestion result with components and analysis
     */
    async suggest(context) {
        const startTime = Date.now();
        let aiMs = 0;
        // Analyze the context
        const parseStart = Date.now();
        const contextAnalysis = this.analyzeContext(context);
        const parseMs = Date.now() - parseStart;
        // Get suggestions from various sources
        const suggestions = [];
        // 1. Built-in PhilJS components
        const builtInSuggestions = this.getBuiltInSuggestions(contextAnalysis, context);
        suggestions.push(...builtInSuggestions);
        // 2. Project components
        if (context.projectComponents) {
            const projectSuggestions = this.getProjectSuggestions(context.projectComponents, contextAnalysis);
            suggestions.push(...projectSuggestions);
        }
        // 3. AI-generated suggestions
        if (context.preferences?.includeAISuggestions !== false) {
            const aiStart = Date.now();
            const aiSuggestions = await this.getAISuggestions(context, contextAnalysis);
            aiMs = Date.now() - aiStart;
            suggestions.push(...aiSuggestions);
        }
        // Sort by relevance
        suggestions.sort((a, b) => b.relevance - a.relevance);
        // Apply max suggestions limit
        const maxSuggestions = context.preferences?.maxSuggestions || 10;
        const limitedSuggestions = suggestions.slice(0, maxSuggestions);
        return {
            suggestions: limitedSuggestions,
            context: contextAnalysis,
            timing: {
                parseMs,
                aiMs,
                totalMs: Date.now() - startTime,
            },
        };
    }
    /**
     * Get suggestions for a specific pattern
     *
     * @param pattern - UI pattern name (e.g., "form", "list-detail", "dashboard")
     * @param context - Optional context
     * @returns Component suggestions for the pattern
     */
    async suggestForPattern(pattern, context) {
        const prompt = `Suggest PhilJS components for implementing a "${pattern}" UI pattern.

${context?.fileContent ? `Current code context:\n\`\`\`typescript\n${context.fileContent.slice(0, 1000)}\n\`\`\`` : ''}

For each component, provide:
- name: Component name
- description: Brief description
- category: layout, navigation, form, data-display, feedback, overlay, media, utility
- relevance: Score 0-100
- props: Required props with types
- snippet: Usage snippet with placeholders
- reason: Why this component fits the pattern

Return JSON array of ComponentSuggestion objects.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are a UI/UX expert suggesting components for common patterns.',
        });
        const suggestions = extractJSON(response);
        return suggestions || [];
    }
    /**
     * Detect patterns in code and suggest improvements
     *
     * @param code - Code to analyze
     * @returns Pattern detections with suggestions
     */
    async detectPatterns(code) {
        const prompt = `Analyze this code and detect UI patterns that could be improved with components:

\`\`\`typescript
${code}
\`\`\`

Detect patterns like:
- Repeated markup that could be a component
- Common UI patterns (forms, lists, cards, modals)
- Missing error/loading states
- Accessibility improvements needed

For each detection:
- pattern: Name of the pattern
- confidence: 0-1 score
- suggestedComponents: List of component names

Return JSON array.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are an expert at identifying UI patterns and componentization opportunities.',
        });
        return extractJSON(response) || [];
    }
    /**
     * Get component completion for partial component name
     *
     * @param partial - Partial component name
     * @param context - Current context
     * @returns Matching component suggestions
     */
    async completeComponent(partial, context) {
        const lowerPartial = partial.toLowerCase();
        // First check built-in and project components
        const staticMatches = [];
        // Built-in matches
        for (const comp of PHILJS_COMPONENTS) {
            if (comp.name.toLowerCase().startsWith(lowerPartial)) {
                staticMatches.push({
                    ...comp,
                    relevance: 100 - (comp.name.length - partial.length),
                });
            }
        }
        // Project component matches
        if (context.projectComponents) {
            for (const comp of context.projectComponents) {
                if (comp.name.toLowerCase().startsWith(lowerPartial)) {
                    staticMatches.push({
                        name: comp.name,
                        description: `Project component from ${comp.path}`,
                        category: 'custom',
                        relevance: 90 - (comp.name.length - partial.length),
                        props: comp.props || [],
                        importStatement: `import { ${comp.name} } from '${comp.path}';`,
                        snippet: `<${comp.name} />`,
                        reason: 'Project component',
                        source: 'project',
                        tags: ['project'],
                    });
                }
            }
        }
        if (staticMatches.length > 0) {
            return staticMatches.sort((a, b) => b.relevance - a.relevance);
        }
        // If no static matches, use AI
        const prompt = `Complete this component name: "${partial}"

Context from file:
\`\`\`typescript
${context.fileContent.slice(0, 500)}
\`\`\`

Suggest component names that:
- Start with or contain "${partial}"
- Fit the context
- Follow PhilJS naming conventions

Return JSON array of ComponentSuggestion objects.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            temperature: 0.1,
        });
        return extractJSON(response) || [];
    }
    /**
     * Suggest child components for a parent
     *
     * @param parentComponent - Parent component name
     * @param context - Current context
     * @returns Suggested child components
     */
    async suggestChildren(parentComponent, context) {
        const prompt = `Suggest child components for a "${parentComponent}" component.

Current code:
\`\`\`typescript
${context.fileContent.slice(0, 1000)}
\`\`\`

Consider:
- Common child patterns for ${parentComponent}
- What's already in the component
- Typical composition patterns

Return JSON array of ComponentSuggestion objects for appropriate children.`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are an expert in component composition patterns.',
        });
        const suggestions = extractJSON(response);
        return suggestions || [];
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    analyzeContext(context) {
        const content = context.fileContent;
        const line = context.cursorPosition.line;
        const lines = content.split('\n');
        const currentLine = lines[line] || '';
        const prefix = context.linePrefix || currentLine.slice(0, context.cursorPosition.column);
        // Detect context type
        let contextType = 'unknown';
        let parentComponent;
        const siblingComponents = [];
        // Check if in JSX
        if (prefix.includes('<') || this.isInsideJSX(content, line)) {
            if (prefix.match(/<\w*$/)) {
                contextType = 'jsx-element';
            }
            else if (prefix.match(/\w+\s*=\s*[{"]?$/)) {
                contextType = 'jsx-attribute';
            }
            else {
                contextType = 'jsx-child';
            }
            // Find parent component
            parentComponent = this.findParentComponent(lines, line);
            // Find sibling components
            const jsxElements = content.match(/<(\w+)/g);
            if (jsxElements) {
                const seen = new Set();
                jsxElements.forEach(e => {
                    const name = e.slice(1);
                    if (/^[A-Z]/.test(name) && !seen.has(name)) {
                        siblingComponents.push(name);
                        seen.add(name);
                    }
                });
            }
        }
        else if (prefix.includes('import')) {
            contextType = 'import';
        }
        else {
            contextType = 'function-body';
        }
        // Detect patterns
        const patterns = this.detectCodePatterns(content);
        // Find missing common components
        const missingCommon = this.findMissingCommon(content, siblingComponents);
        return {
            contextType,
            ...(parentComponent !== undefined && { parentComponent }),
            siblingComponents,
            patterns,
            missingCommon,
        };
    }
    isInsideJSX(content, line) {
        const lines = content.split('\n');
        for (let i = line; i >= 0; i--) {
            const l = lines[i];
            if (l.includes('return (') || l.includes('return <')) {
                return true;
            }
            if (l.includes('function ') || l.includes('const ') && !l.includes('=')) {
                return false;
            }
        }
        return false;
    }
    findParentComponent(lines, currentLine) {
        let depth = 0;
        for (let i = currentLine; i >= 0; i--) {
            const line = lines[i];
            // Count closing tags
            const closeTags = (line.match(/<\/\w+>/g) || []).length;
            const selfCloseTags = (line.match(/\/>/g) || []).length;
            depth -= closeTags + selfCloseTags;
            // Find opening tag
            const openMatch = line.match(/<([A-Z]\w*)/g);
            if (openMatch) {
                for (const match of openMatch.reverse()) {
                    depth++;
                    if (depth > 0) {
                        return match.slice(1);
                    }
                }
            }
        }
        return undefined;
    }
    detectCodePatterns(content) {
        const patterns = [];
        if (content.includes('useState') || content.includes('signal(')) {
            patterns.push('stateful');
        }
        if (content.includes('form') || content.includes('Form') || content.includes('input')) {
            patterns.push('form');
        }
        if (content.includes('map(') || content.includes('.map(')) {
            patterns.push('list-rendering');
        }
        if (content.includes('fetch') || content.includes('axios') || content.includes('loader')) {
            patterns.push('data-fetching');
        }
        if (content.includes('Modal') || content.includes('Dialog')) {
            patterns.push('modal');
        }
        if (content.includes('isLoading') || content.includes('loading')) {
            patterns.push('loading-state');
        }
        if (content.includes('error') || content.includes('Error')) {
            patterns.push('error-handling');
        }
        return patterns;
    }
    findMissingCommon(content, existingComponents) {
        const common = ['Button', 'Input', 'Form', 'Card', 'Modal', 'Alert', 'Spinner'];
        const missing = [];
        for (const c of common) {
            if (!existingComponents.includes(c) && !content.includes(`<${c}`)) {
                // Check if it might be needed
                if (c === 'Button' && (content.includes('onClick') || content.includes('submit'))) {
                    missing.push(c);
                }
                else if (c === 'Input' && content.includes('form')) {
                    missing.push(c);
                }
                else if (c === 'Spinner' && content.includes('loading') && !content.includes('Spinner')) {
                    missing.push(c);
                }
                else if (c === 'Alert' && content.includes('error') && !content.includes('Alert')) {
                    missing.push(c);
                }
            }
        }
        return missing;
    }
    getBuiltInSuggestions(analysis, context) {
        const suggestions = [];
        for (const comp of PHILJS_COMPONENTS) {
            let relevance = comp.relevance;
            // Boost relevance based on context
            if (analysis.patterns?.includes('form') && comp.category === 'form') {
                relevance += 15;
            }
            if (analysis.patterns?.includes('loading-state') && comp.name === 'Spinner') {
                relevance += 20;
            }
            if (analysis.patterns?.includes('error-handling') && comp.name === 'Alert') {
                relevance += 20;
            }
            if (analysis.patterns?.includes('list-rendering') && comp.name === 'List') {
                relevance += 15;
            }
            // Boost if in missing common
            if (analysis.missingCommon?.includes(comp.name)) {
                relevance += 10;
            }
            // Reduce if already used
            if (analysis.siblingComponents?.includes(comp.name)) {
                relevance -= 20;
            }
            // Apply recent selections boost
            if (context.recentSelections?.includes(comp.name)) {
                relevance += 5;
            }
            suggestions.push({
                ...comp,
                relevance: Math.min(100, Math.max(0, relevance)),
            });
        }
        return suggestions;
    }
    getProjectSuggestions(projectComponents, analysis) {
        return projectComponents.map(comp => ({
            name: comp.name,
            description: `Project component (used ${comp.usageCount || 0} times)`,
            category: 'custom',
            relevance: 70 + (comp.usageCount || 0),
            props: comp.props || [],
            importStatement: `import { ${comp.name} } from '${comp.path}';`,
            snippet: `<${comp.name} />`,
            reason: 'Project component',
            source: 'project',
            tags: ['project'],
        }));
    }
    async getAISuggestions(context, analysis) {
        const prompt = `Suggest components for this context:

Context type: ${analysis.contextType}
Parent component: ${analysis.parentComponent || 'none'}
Detected patterns: ${analysis.patterns?.join(', ') || 'none'}
Missing common components: ${analysis.missingCommon?.join(', ') || 'none'}

Code snippet around cursor:
\`\`\`typescript
${this.getCodeAroundCursor(context)}
\`\`\`

Suggest 3-5 components that would be useful here.
Return JSON array of ComponentSuggestion objects with:
- name, description, category, relevance (0-100)
- props (name, type, required)
- snippet (with $1, $2 placeholders)
- reason why it's suggested
- source: "ai-generated"
- tags: relevant tags`;
        const response = await this.provider.generateCompletion(prompt, {
            ...this.defaultOptions,
            systemPrompt: 'You are a component suggestion AI. Suggest relevant, useful components.',
        });
        const suggestions = extractJSON(response);
        return (suggestions || []).map(s => ({
            ...s,
            source: 'ai-generated',
            importStatement: s.importStatement || `// Custom component: ${s.name}`,
        }));
    }
    getCodeAroundCursor(context) {
        const lines = context.fileContent.split('\n');
        const start = Math.max(0, context.cursorPosition.line - 5);
        const end = Math.min(lines.length, context.cursorPosition.line + 5);
        return lines.slice(start, end).join('\n');
    }
}
// ============================================================================
// Factory Functions
// ============================================================================
/**
 * Create a component suggester instance
 */
export function createComponentSuggester(provider, options) {
    return new ComponentSuggester(provider, options);
}
/**
 * Quick suggestion helper
 */
export async function suggestComponents(provider, context) {
    const suggester = new ComponentSuggester(provider);
    return suggester.suggest(context);
}
/**
 * Quick pattern detection helper
 */
export async function detectUIPatterns(provider, code) {
    const suggester = new ComponentSuggester(provider);
    return suggester.detectPatterns(code);
}
//# sourceMappingURL=component-suggester.js.map