/**
 * VS Code Extension Entry Point for PhilJS AI
 *
 * Features:
 * - Inline code suggestions
 * - Quick fixes for errors
 * - Command palette integration
 * - Code actions for refactoring
 */
/**
 * Thenable type for VS Code compatibility
 */
type Thenable<T> = PromiseLike<T>;
/**
 * VS Code API types (simplified for type checking without vscode module)
 */
interface VSCodeExtensionContext {
    subscriptions: {
        dispose(): void;
    }[];
    workspaceState: {
        get<T>(key: string): T | undefined;
        update(key: string, value: unknown): Thenable<void>;
    };
    globalState: {
        get<T>(key: string): T | undefined;
        update(key: string, value: unknown): Thenable<void>;
    };
}
/**
 * PhilJS AI Extension class
 */
export declare class PhilJSAIExtension {
    private provider;
    private autocompleteEngine;
    private componentGenerator;
    private refactoringEngine;
    private testGenerator;
    private docGenerator;
    /**
     * Activate the extension
     */
    activate(context: VSCodeExtensionContext): Promise<void>;
    /**
     * Deactivate the extension
     */
    deactivate(): void;
    /**
     * Initialize AI engines
     */
    private initializeEngines;
    /**
     * Register completion provider for suggestions
     */
    private registerCompletionProvider;
    /**
     * Register code actions provider for quick fixes
     */
    private registerCodeActionsProvider;
    /**
     * Register inline completion provider (ghost text)
     */
    private registerInlineCompletionProvider;
    /**
     * Register extension commands
     */
    private registerCommands;
    /**
     * Generate component command
     */
    private generateComponentCommand;
    /**
     * Generate tests command
     */
    private generateTestsCommand;
    /**
     * Refactor code command
     */
    private refactorCodeCommand;
    /**
     * Add documentation command
     */
    private addDocumentationCommand;
    /**
     * Explain code command
     */
    private explainCodeCommand;
    /**
     * Review code command
     */
    private reviewCodeCommand;
    /**
     * Optimize performance command
     */
    private optimizePerformanceCommand;
    /**
     * Fix accessibility command
     */
    private fixAccessibilityCommand;
    /**
     * Build autocomplete context from VS Code document
     */
    private buildAutocompleteContext;
    /**
     * Get text prefix before cursor
     */
    private getPrefix;
    /**
     * Map suggestion kind to VS Code completion item kind
     */
    private mapSuggestionKind;
    /**
     * Create VS Code code action from fix suggestion
     */
    private createCodeAction;
    /**
     * Get refactoring actions for selection
     */
    private getRefactoringActions;
}
/**
 * Extension activation function (called by VS Code)
 */
export declare function activate(context: VSCodeExtensionContext): Promise<PhilJSAIExtension>;
/**
 * Extension deactivation function (called by VS Code)
 */
export declare function deactivate(): void;
/**
 * Get contribution points for package.json
 */
export declare function getContributionPoints(): Record<string, unknown>;
export {};
//# sourceMappingURL=extension.d.ts.map