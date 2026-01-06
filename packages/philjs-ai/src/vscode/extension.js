/**
 * VS Code Extension Entry Point for PhilJS AI
 *
 * Features:
 * - Inline code suggestions
 * - Quick fixes for errors
 * - Command palette integration
 * - Code actions for refactoring
 */
import { AutocompleteEngine } from '../autocomplete/index.js';
import { ComponentGenerator } from '../codegen/component-generator.js';
import { RefactoringEngine } from '../refactor/index.js';
import { TestGenerator } from '../testing/test-generator.js';
import { DocGenerator } from '../docs/doc-generator.js';
import { autoDetectProvider } from '../providers/index.js';
/**
 * PhilJS AI Extension class
 */
export class PhilJSAIExtension {
    provider = null;
    autocompleteEngine = null;
    componentGenerator = null;
    refactoringEngine = null;
    testGenerator = null;
    docGenerator = null;
    /**
     * Activate the extension
     */
    async activate(context) {
        // Initialize AI provider
        try {
            this.provider = autoDetectProvider();
            this.initializeEngines();
        }
        catch (error) {
            console.warn('No AI provider available. Some features will be limited.');
        }
        // Register all providers and commands
        this.registerCompletionProvider(context);
        this.registerCodeActionsProvider(context);
        this.registerCommands(context);
        this.registerInlineCompletionProvider(context);
    }
    /**
     * Deactivate the extension
     */
    deactivate() {
        this.provider = null;
        this.autocompleteEngine = null;
        this.componentGenerator = null;
        this.refactoringEngine = null;
        this.testGenerator = null;
        this.docGenerator = null;
    }
    /**
     * Initialize AI engines
     */
    initializeEngines() {
        if (!this.provider)
            return;
        this.autocompleteEngine = new AutocompleteEngine(this.provider);
        this.componentGenerator = new ComponentGenerator(this.provider);
        this.refactoringEngine = new RefactoringEngine(this.provider);
        this.testGenerator = new TestGenerator(this.provider);
        this.docGenerator = new DocGenerator(this.provider);
    }
    /**
     * Register completion provider for suggestions
     */
    registerCompletionProvider(context) {
        // This would be implemented using vscode.languages.registerCompletionItemProvider
        // For now, we provide the logic that the provider would use
        const getCompletions = async (document, position) => {
            if (!this.autocompleteEngine)
                return [];
            const autoContext = this.buildAutocompleteContext(document, position);
            const suggestions = await this.autocompleteEngine.getSuggestions(autoContext);
            return suggestions.map((suggestion, index) => {
                const item = {
                    label: suggestion.label,
                    kind: this.mapSuggestionKind(suggestion.kind),
                    insertText: suggestion.insertText || suggestion.text,
                    sortText: String(index).padStart(5, '0'),
                };
                if (suggestion.detail !== undefined)
                    item.detail = suggestion.detail;
                if (suggestion.documentation !== undefined)
                    item.documentation = suggestion.documentation;
                return item;
            });
        };
        // Store for external use
        this['getCompletions'] = getCompletions;
    }
    /**
     * Register code actions provider for quick fixes
     */
    registerCodeActionsProvider(context) {
        // This would be implemented using vscode.languages.registerCodeActionsProvider
        const getCodeActions = async (document, _range, diagnostics) => {
            if (!this.autocompleteEngine)
                return [];
            const actions = [];
            for (const diagnostic of diagnostics) {
                const autoContext = this.buildAutocompleteContext(document, diagnostic.range.start);
                const fixes = await this.autocompleteEngine.getFixSuggestions({
                    message: diagnostic.message,
                    code: String(diagnostic.code),
                    location: { line: diagnostic.range.start.line, column: diagnostic.range.start.character },
                }, autoContext);
                for (const fix of fixes) {
                    actions.push(this.createCodeAction(fix, document, diagnostic));
                }
            }
            // Add refactoring actions
            actions.push(...this.getRefactoringActions(document, _range));
            return actions;
        };
        this['getCodeActions'] = getCodeActions;
    }
    /**
     * Register inline completion provider (ghost text)
     */
    registerInlineCompletionProvider(_context) {
        const getInlineCompletion = async (document, position) => {
            if (!this.autocompleteEngine)
                return null;
            const autoContext = this.buildAutocompleteContext(document, position);
            const result = await this.autocompleteEngine.getInlineCompletionFromContext(autoContext);
            return result;
        };
        this['getInlineCompletion'] = getInlineCompletion;
    }
    /**
     * Register extension commands
     */
    registerCommands(_context) {
        const commands = {
            'philjs-ai.generateComponent': (...args) => this.generateComponentCommand(args[0]),
            'philjs-ai.generateTests': (...args) => this.generateTestsCommand(args[0]),
            'philjs-ai.refactorCode': (...args) => this.refactorCodeCommand(args[0]),
            'philjs-ai.addDocumentation': (...args) => this.addDocumentationCommand(args[0]),
            'philjs-ai.explainCode': (...args) => this.explainCodeCommand(args[0], args[1]),
            'philjs-ai.reviewCode': (...args) => this.reviewCodeCommand(args[0]),
            'philjs-ai.optimizePerformance': (...args) => this.optimizePerformanceCommand(args[0]),
            'philjs-ai.fixAccessibility': (...args) => this.fixAccessibilityCommand(args[0]),
        };
        this['commands'] = commands;
    }
    /**
     * Generate component command
     */
    async generateComponentCommand(description) {
        if (!this.componentGenerator) {
            console.error('AI provider not configured');
            return;
        }
        const desc = description || 'A button component with loading state';
        const result = await this.componentGenerator.generateFromDescription({
            name: 'GeneratedComponent',
            description: desc,
            useSignals: true,
        });
        // In actual extension, this would open a new document with the generated code
    }
    /**
     * Generate tests command
     */
    async generateTestsCommand(document) {
        if (!this.testGenerator || !document) {
            console.error('AI provider not configured or no document');
            return;
        }
        const code = document.getText();
        const result = await this.testGenerator.generateUnitTests(code);
    }
    /**
     * Refactor code command
     */
    async refactorCodeCommand(document) {
        if (!this.refactoringEngine || !document) {
            console.error('AI provider not configured or no document');
            return;
        }
        const code = document.getText();
        const result = await this.refactoringEngine.refactor({
            code,
            filePath: document.uri.fsPath,
            focusAreas: ['performance', 'patterns'],
        });
        console.log('Refactoring suggestions:', result.suggestions.length);
    }
    /**
     * Add documentation command
     */
    async addDocumentationCommand(document) {
        if (!this.docGenerator || !document) {
            console.error('AI provider not configured or no document');
            return;
        }
        const code = document.getText();
        const documented = await this.docGenerator.addJSDoc(code, { includeExamples: true });
        // In actual extension, this would replace the document content
    }
    /**
     * Explain code command
     */
    async explainCodeCommand(document, selection) {
        if (!this.provider || !document) {
            console.error('AI provider not configured or no document');
            return;
        }
        const code = selection
            ? document.getText().split('\n').slice(selection.start.line, selection.end.line + 1).join('\n')
            : document.getText();
        const explanation = await this.provider.generateCompletion(`Explain this PhilJS code:\n\n\`\`\`typescript\n${code}\n\`\`\``, { systemPrompt: 'You are a helpful coding assistant. Explain code clearly and concisely.' });
    }
    /**
     * Review code command
     */
    async reviewCodeCommand(document) {
        if (!this.refactoringEngine || !document) {
            console.error('AI provider not configured or no document');
            return;
        }
        const code = document.getText();
        const result = await this.refactoringEngine.reviewCode(code, document.uri.fsPath);
        console.log(`Code review score: ${result.overallScore}/100`);
        console.log(`Issues found: ${result.issues.length}`);
    }
    /**
     * Optimize performance command
     */
    async optimizePerformanceCommand(document) {
        if (!this.refactoringEngine || !document) {
            console.error('AI provider not configured or no document');
            return;
        }
        const code = document.getText();
        const analysis = await this.refactoringEngine.analyzePerformance(code);
        console.log(`Performance issues: ${analysis.issues.length}`);
        console.log(`Optimizations: ${analysis.optimizations.length}`);
    }
    /**
     * Fix accessibility command
     */
    async fixAccessibilityCommand(document) {
        if (!this.refactoringEngine || !document) {
            console.error('AI provider not configured or no document');
            return;
        }
        const code = document.getText();
        const audit = await this.refactoringEngine.auditAccessibility(code, 'AA');
        console.log(`Accessibility compliance: ${audit.compliance.level}`);
        console.log(`Issues: ${audit.issues.length}`);
    }
    /**
     * Build autocomplete context from VS Code document
     */
    buildAutocompleteContext(document, position) {
        const language = document.languageId;
        return {
            fileContent: document.getText(),
            cursor: { line: position.line, column: position.character },
            filePath: document.uri.fsPath,
            language: ['typescript', 'typescriptreact', 'tsx'].includes(document.languageId)
                ? 'typescript'
                : ['javascript', 'javascriptreact', 'jsx'].includes(document.languageId)
                    ? 'javascript'
                    : language,
            prefix: this.getPrefix(document, position),
        };
    }
    /**
     * Get text prefix before cursor
     */
    getPrefix(document, position) {
        const line = document.lineAt(position.line).text;
        const beforeCursor = line.slice(0, position.character);
        const match = beforeCursor.match(/[\w.]+$/);
        return match?.[0] || '';
    }
    /**
     * Map suggestion kind to VS Code completion item kind
     */
    mapSuggestionKind(kind) {
        const kindMap = {
            component: 6, // Class
            prop: 9, // Property
            function: 2, // Function
            variable: 5, // Variable
            type: 7, // Interface
            keyword: 13, // Keyword
            snippet: 14, // Snippet
            import: 8, // Module
            file: 16, // File
            fix: 1, // Text
        };
        return kindMap[kind] || 1;
    }
    /**
     * Create VS Code code action from fix suggestion
     */
    createCodeAction(fix, document, diagnostic) {
        const action = {
            title: fix.description,
            kind: { value: fix.kind === 'quickfix' ? 'quickfix' : 'refactor' },
            // In actual extension, would include WorkspaceEdit
        };
        if (fix.isPreferred !== undefined)
            action.isPreferred = fix.isPreferred;
        return action;
    }
    /**
     * Get refactoring actions for selection
     */
    getRefactoringActions(document, range) {
        const actions = [];
        // Add standard refactoring actions
        actions.push({
            title: 'PhilJS: Optimize signals',
            kind: { value: 'refactor.rewrite' },
        });
        actions.push({
            title: 'PhilJS: Extract component',
            kind: { value: 'refactor.extract' },
        });
        actions.push({
            title: 'PhilJS: Add accessibility attributes',
            kind: { value: 'source.fixAll' },
        });
        actions.push({
            title: 'PhilJS: Generate tests',
            kind: { value: 'source' },
        });
        actions.push({
            title: 'PhilJS: Add documentation',
            kind: { value: 'source' },
        });
        return actions;
    }
}
/**
 * Extension activation function (called by VS Code)
 */
export async function activate(context) {
    const extension = new PhilJSAIExtension();
    await extension.activate(context);
    return extension;
}
/**
 * Extension deactivation function (called by VS Code)
 */
export function deactivate() {
    // Cleanup handled by extension instance
}
/**
 * Get contribution points for package.json
 */
export function getContributionPoints() {
    return {
        commands: [
            { command: 'philjs-ai.generateComponent', title: 'PhilJS AI: Generate Component' },
            { command: 'philjs-ai.generateTests', title: 'PhilJS AI: Generate Tests' },
            { command: 'philjs-ai.refactorCode', title: 'PhilJS AI: Refactor Code' },
            { command: 'philjs-ai.addDocumentation', title: 'PhilJS AI: Add Documentation' },
            { command: 'philjs-ai.explainCode', title: 'PhilJS AI: Explain Code' },
            { command: 'philjs-ai.reviewCode', title: 'PhilJS AI: Review Code' },
            { command: 'philjs-ai.optimizePerformance', title: 'PhilJS AI: Optimize Performance' },
            { command: 'philjs-ai.fixAccessibility', title: 'PhilJS AI: Fix Accessibility' },
        ],
        keybindings: [
            { command: 'philjs-ai.generateComponent', key: 'ctrl+shift+g', mac: 'cmd+shift+g' },
            { command: 'philjs-ai.generateTests', key: 'ctrl+shift+t', mac: 'cmd+shift+t' },
            { command: 'philjs-ai.refactorCode', key: 'ctrl+shift+r', mac: 'cmd+shift+r' },
        ],
        menus: {
            'editor/context': [
                { command: 'philjs-ai.explainCode', group: 'philjs-ai' },
                { command: 'philjs-ai.refactorCode', group: 'philjs-ai' },
                { command: 'philjs-ai.generateTests', group: 'philjs-ai' },
            ],
        },
        configuration: {
            title: 'PhilJS AI',
            properties: {
                'philjs-ai.provider': {
                    type: 'string',
                    default: 'auto',
                    enum: ['auto', 'openai', 'anthropic', 'local'],
                    description: 'AI provider to use',
                },
                'philjs-ai.model': {
                    type: 'string',
                    default: '',
                    description: 'AI model to use (empty for default)',
                },
                'philjs-ai.enableInlineSuggestions': {
                    type: 'boolean',
                    default: true,
                    description: 'Enable inline code suggestions',
                },
                'philjs-ai.enableCodeActions': {
                    type: 'boolean',
                    default: true,
                    description: 'Enable AI-powered code actions',
                },
            },
        },
    };
}
//# sourceMappingURL=extension.js.map