/**
 * Code Autocomplete Module
 *
 * AI-powered context-aware code suggestions for PhilJS
 *
 * Features:
 * - Context-aware suggestions
 * - Component prop suggestions
 * - Import suggestions
 * - Fix suggestions for errors
 */
import type { AIProvider, CompletionOptions } from '../types.js';
/**
 * Autocomplete context
 */
export interface AutocompleteContext {
    /** Current file content */
    fileContent: string;
    /** Cursor position (line, column) */
    cursor: {
        line: number;
        column: number;
    };
    /** Current file path */
    filePath: string;
    /** Language/file type */
    language: 'typescript' | 'tsx' | 'javascript' | 'jsx';
    /** Project context (imports, types, etc.) */
    projectContext?: ProjectContext;
    /** Trigger character (e.g., '.', '<', '/') */
    triggerCharacter?: string;
    /** Prefix before cursor */
    prefix?: string;
}
/**
 * Project context for better suggestions
 */
export interface ProjectContext {
    /** Available imports/modules */
    availableImports?: ModuleInfo[];
    /** Available components */
    components?: ComponentInfo[];
    /** Type definitions */
    types?: TypeInfo[];
    /** Project dependencies */
    dependencies?: string[];
    /** Custom hooks/utilities */
    utilities?: UtilityInfo[];
}
/**
 * Module information
 */
export interface ModuleInfo {
    /** Module name */
    name: string;
    /** Exported members */
    exports: string[];
    /** Module path */
    path: string;
    /** Is default export */
    hasDefault?: boolean;
}
/**
 * Component information
 */
export interface ComponentInfo {
    /** Component name */
    name: string;
    /** Props interface */
    props?: PropInfo[];
    /** Component description */
    description?: string;
    /** Import path */
    importPath: string;
}
/**
 * Prop information
 */
export interface PropInfo {
    /** Prop name */
    name: string;
    /** Prop type */
    type: string;
    /** Is required */
    required: boolean;
    /** Default value */
    defaultValue?: string;
    /** Description */
    description?: string;
}
/**
 * Type information
 */
export interface TypeInfo {
    /** Type name */
    name: string;
    /** Type definition */
    definition: string;
    /** Source file */
    source: string;
}
/**
 * Utility information
 */
export interface UtilityInfo {
    /** Utility name */
    name: string;
    /** Signature */
    signature: string;
    /** Description */
    description?: string;
    /** Import path */
    importPath: string;
}
/**
 * Autocomplete suggestion
 */
export interface AutocompleteSuggestion {
    /** Suggestion text to insert */
    text: string;
    /** Display label */
    label: string;
    /** Suggestion kind */
    kind: SuggestionKind;
    /** Detail information */
    detail?: string;
    /** Documentation */
    documentation?: string;
    /** Insert text with snippets */
    insertText?: string;
    /** Sort order priority */
    sortPriority?: number;
    /** Required imports */
    imports?: ImportSuggestion[];
    /** Additional edits */
    additionalEdits?: TextEdit[];
}
/**
 * Suggestion kinds
 */
export type SuggestionKind = 'component' | 'prop' | 'function' | 'variable' | 'type' | 'keyword' | 'snippet' | 'import' | 'file' | 'fix';
/**
 * Import suggestion
 */
export interface ImportSuggestion {
    /** Module path */
    module: string;
    /** Named imports */
    named?: string[];
    /** Default import name */
    default?: string;
}
/**
 * Text edit for additional changes
 */
export interface TextEdit {
    /** Range to replace */
    range: {
        start: {
            line: number;
            column: number;
        };
        end: {
            line: number;
            column: number;
        };
    };
    /** New text */
    newText: string;
}
/**
 * Error information for fix suggestions
 */
export interface ErrorInfo {
    /** Error message */
    message: string;
    /** Error code */
    code?: string;
    /** Error location */
    location: {
        line: number;
        column: number;
    };
    /** Error source */
    source?: string;
}
/**
 * Fix suggestion
 */
export interface FixSuggestion {
    /** Fix description */
    description: string;
    /** Code changes */
    changes: TextEdit[];
    /** Is preferred fix */
    isPreferred?: boolean;
    /** Fix kind */
    kind: 'quickfix' | 'refactor' | 'source';
}
/**
 * Inline completion result (Copilot-style)
 */
export interface InlineCompletionResult {
    /** The completion text to insert */
    text: string;
    /** The range where the completion should be inserted */
    range: {
        start: {
            line: number;
            character: number;
        };
        end: {
            line: number;
            character: number;
        };
    };
    /** Shortened display text for UI */
    displayText?: string;
}
/**
 * Signature help result
 */
export interface SignatureHelpResult {
    /** Available signatures */
    signatures: SignatureInfo[];
    /** Index of the active signature */
    activeSignature: number;
    /** Index of the active parameter */
    activeParameter: number;
}
/**
 * Signature information
 */
export interface SignatureInfo {
    /** Full signature label */
    label: string;
    /** Signature documentation */
    documentation?: string;
    /** Parameter information */
    parameters: ParameterInfo[];
}
/**
 * Parameter information
 */
export interface ParameterInfo {
    /** Parameter label/name */
    label: string;
    /** Parameter documentation */
    documentation?: string;
}
/**
 * Code context for completions
 */
export interface CodeContext {
    /** File content */
    content: string;
    /** Cursor position */
    position: {
        line: number;
        column: number;
    };
    /** File path */
    filePath?: string;
    /** Language */
    language?: 'typescript' | 'tsx' | 'javascript' | 'jsx';
    /** Text before cursor on current line */
    prefix?: string;
    /** Trigger character */
    trigger?: string;
    /** Project context */
    projectContext?: ProjectContext;
}
/**
 * Completion item for LSP compatibility
 */
export interface CompletionItem {
    /** Display label */
    label: string;
    /** Item kind */
    kind: CompletionItemKind;
    /** Detail information */
    detail?: string;
    /** Documentation */
    documentation?: string;
    /** Text to insert */
    insertText: string;
    /** Sort order */
    sortText?: string;
    /** Filter text */
    filterText?: string;
    /** Pre-select this item */
    preselect?: boolean;
    /** Additional text edits */
    additionalTextEdits?: Array<{
        range: {
            start: {
                line: number;
                character: number;
            };
            end: {
                line: number;
                character: number;
            };
        };
        newText: string;
    }>;
}
/**
 * Completion item kinds (LSP-compatible)
 */
export declare enum CompletionItemKind {
    Text = 1,
    Method = 2,
    Function = 3,
    Constructor = 4,
    Field = 5,
    Variable = 6,
    Class = 7,
    Interface = 8,
    Module = 9,
    Property = 10,
    Unit = 11,
    Value = 12,
    Enum = 13,
    Keyword = 14,
    Snippet = 15,
    Color = 16,
    File = 17,
    Reference = 18,
    Folder = 19,
    EnumMember = 20,
    Constant = 21,
    Struct = 22,
    Event = 23,
    Operator = 24,
    TypeParameter = 25
}
/**
 * Autocomplete Engine
 */
export declare class AutocompleteEngine {
    private provider;
    private defaultOptions;
    private cache;
    private cacheTimeout;
    constructor(provider: AIProvider, options?: Partial<CompletionOptions> & {
        cacheTimeout?: number;
    });
    /**
     * Get autocomplete suggestions for current context
     */
    getSuggestions(context: AutocompleteContext): Promise<AutocompleteSuggestion[]>;
    /**
     * Get component prop suggestions
     */
    getComponentProps(componentName: string, context: AutocompleteContext): Promise<PropInfo[]>;
    /**
     * Get import suggestions for an identifier
     */
    getImportSuggestions(identifier: string, context: AutocompleteContext): Promise<ImportSuggestion[]>;
    /**
     * Get fix suggestions for an error
     */
    getFixSuggestions(error: ErrorInfo, context: AutocompleteContext): Promise<FixSuggestion[]>;
    /**
     * Get inline completion from context (for ghost text)
     */
    getInlineCompletionFromContext(context: AutocompleteContext): Promise<string | null>;
    /**
     * Get snippet suggestions
     */
    getSnippetSuggestions(trigger: string, context: AutocompleteContext): Promise<AutocompleteSuggestion[]>;
    /**
     * Build the suggestion prompt
     */
    private buildSuggestionPrompt;
    /**
     * Get system prompt based on context
     */
    private getSystemPrompt;
    /**
     * Parse suggestions from AI response
     */
    private parseSuggestions;
    /**
     * Get text before cursor
     */
    private getTextBeforeCursor;
    /**
     * Get text after cursor
     */
    private getTextAfterCursor;
    /**
     * Get current line
     */
    private getCurrentLine;
    /**
     * Extract surrounding code
     */
    private extractSurroundingCode;
    /**
     * Extract imports from file content
     */
    private extractImports;
    /**
     * Generate cache key for context
     */
    private getCacheKey;
    /**
     * Get built-in PhilJS snippets
     */
    private getBuiltInSnippets;
    /**
     * Clear the suggestion cache
     */
    clearCache(): void;
    /**
     * Get inline completion (Copilot-style ghost text)
     *
     * @param prefix - Code before the cursor position
     * @param suffix - Code after the cursor position
     * @param options - Completion options
     * @returns Inline completion suggestion or null
     *
     * @example
     * ```typescript
     * const completion = await engine.getInlineCompletion(
     *   'const user = ',
     *   ';\nconsole.log(user);',
     *   { maxLength: 50 }
     * );
     * // Returns something like: "{ name: 'John', age: 30 }"
     * ```
     */
    getInlineCompletion(prefix: string, suffix: string, options?: {
        maxLength?: number;
        language?: 'typescript' | 'tsx' | 'javascript' | 'jsx';
        stopSequences?: string[];
    }): Promise<InlineCompletionResult | null>;
    /**
     * Get function signature help
     *
     * @param functionName - Name of the function to get help for
     * @param context - Code context for better accuracy
     * @returns Signature help with parameters and documentation
     *
     * @example
     * ```typescript
     * const help = await engine.getSignatureHelp('signal', context);
     * console.log(help.signatures[0].label); // "signal<T>(initialValue: T): [Accessor<T>, Setter<T>]"
     * ```
     */
    getSignatureHelp(functionName: string, context?: AutocompleteContext): Promise<SignatureHelpResult | null>;
    /**
     * Get completions for the current code context
     *
     * @param context - The code context including file content, cursor position, etc.
     * @returns Array of completion suggestions
     */
    getCompletions(context: CodeContext): Promise<CompletionItem[]>;
    /**
     * Get built-in PhilJS signature help
     */
    private getBuiltInSignatureHelp;
    /**
     * Map suggestion kind to completion item kind
     */
    private mapSuggestionKind;
    /**
     * Format an import suggestion as import statement
     */
    private formatImport;
}
/**
 * Create an autocomplete engine instance
 */
export declare function createAutocompleteEngine(provider: AIProvider, options?: Partial<CompletionOptions> & {
    cacheTimeout?: number;
}): AutocompleteEngine;
/**
 * Quick suggestion helper
 */
export declare function getSuggestions(provider: AIProvider, context: AutocompleteContext): Promise<AutocompleteSuggestion[]>;
/**
 * Quick fix suggestion helper
 */
export declare function getFixSuggestions(provider: AIProvider, error: ErrorInfo, context: AutocompleteContext): Promise<FixSuggestion[]>;
/**
 * Quick inline completion helper
 *
 * @param provider - AI provider
 * @param prefix - Code before cursor
 * @param suffix - Code after cursor
 * @returns Inline completion result or null
 */
export declare function getInlineCompletion(provider: AIProvider, prefix: string, suffix: string): Promise<InlineCompletionResult | null>;
/**
 * Quick signature help helper
 *
 * @param provider - AI provider
 * @param functionName - Function name to get help for
 * @param context - Optional code context
 * @returns Signature help result or null
 */
export declare function getSignatureHelp(provider: AIProvider, functionName: string, context?: AutocompleteContext): Promise<SignatureHelpResult | null>;
/**
 * Quick completions helper
 *
 * @param provider - AI provider
 * @param context - Code context
 * @returns Array of completion items
 */
export declare function getCompletions(provider: AIProvider, context: CodeContext): Promise<CompletionItem[]>;
//# sourceMappingURL=index.d.ts.map