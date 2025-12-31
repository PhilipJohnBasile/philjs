/**
 * LSP Request Handlers Module
 *
 * Implements handlers for all LSP requests using PhilJS AI capabilities.
 */
import type { AIProvider } from '../types.js';
import { DiagnosticSeverity } from './capabilities.js';
/**
 * Position in a text document
 */
export interface Position {
    line: number;
    character: number;
}
/**
 * Range in a text document
 */
export interface Range {
    start: Position;
    end: Position;
}
/**
 * Text document identifier
 */
export interface TextDocumentIdentifier {
    uri: string;
}
/**
 * Text document position parameters
 */
export interface TextDocumentPositionParams {
    textDocument: TextDocumentIdentifier;
    position: Position;
}
/**
 * Completion params
 */
export interface CompletionParams extends TextDocumentPositionParams {
    context?: {
        triggerKind: number;
        triggerCharacter?: string;
    };
}
/**
 * Completion item
 */
export interface CompletionItem {
    label: string;
    kind: number;
    detail?: string;
    documentation?: string | {
        kind: string;
        value: string;
    };
    insertText?: string;
    insertTextFormat?: number;
    sortText?: string;
    filterText?: string;
    preselect?: boolean;
    textEdit?: {
        range: Range;
        newText: string;
    };
    additionalTextEdits?: Array<{
        range: Range;
        newText: string;
    }>;
    command?: {
        title: string;
        command: string;
        arguments?: unknown[];
    };
    data?: unknown;
}
/**
 * Completion list
 */
export interface CompletionList {
    isIncomplete: boolean;
    items: CompletionItem[];
}
/**
 * Hover result
 */
export interface Hover {
    contents: {
        kind: string;
        value: string;
    } | string;
    range?: Range;
}
/**
 * Signature help
 */
export interface SignatureHelp {
    signatures: Array<{
        label: string;
        documentation?: string | {
            kind: string;
            value: string;
        };
        parameters?: Array<{
            label: string | [number, number];
            documentation?: string | {
                kind: string;
                value: string;
            };
        }>;
    }>;
    activeSignature: number;
    activeParameter: number;
}
/**
 * Signature help params
 */
export interface SignatureHelpParams extends TextDocumentPositionParams {
    context?: {
        triggerKind: number;
        triggerCharacter?: string;
        isRetrigger: boolean;
        activeSignatureHelp?: SignatureHelp;
    };
}
/**
 * Code action params
 */
export interface CodeActionParams {
    textDocument: TextDocumentIdentifier;
    range: Range;
    context: {
        diagnostics: Diagnostic[];
        only?: string[];
        triggerKind?: number;
    };
}
/**
 * Code action
 */
export interface CodeAction {
    title: string;
    kind?: string;
    diagnostics?: Diagnostic[];
    isPreferred?: boolean;
    disabled?: {
        reason: string;
    };
    edit?: WorkspaceEdit;
    command?: {
        title: string;
        command: string;
        arguments?: unknown[];
    };
    data?: unknown;
}
/**
 * Workspace edit
 */
export interface WorkspaceEdit {
    changes?: Record<string, TextEdit[]>;
    documentChanges?: Array<{
        textDocument: {
            uri: string;
            version: number | null;
        };
        edits: TextEdit[];
    }>;
}
/**
 * Text edit
 */
export interface TextEdit {
    range: Range;
    newText: string;
}
/**
 * Diagnostic
 */
export interface Diagnostic {
    range: Range;
    severity?: DiagnosticSeverity;
    code?: string | number;
    source?: string;
    message: string;
    tags?: number[];
    relatedInformation?: Array<{
        location: {
            uri: string;
            range: Range;
        };
        message: string;
    }>;
    data?: unknown;
}
/**
 * Inline completion params
 */
export interface InlineCompletionParams {
    textDocument: TextDocumentIdentifier;
    position: Position;
    context: {
        triggerKind: number;
        selectedCompletionInfo?: {
            range: Range;
            text: string;
        };
    };
}
/**
 * Inline completion item
 */
export interface InlineCompletionItem {
    insertText: string;
    filterText?: string;
    range?: Range;
    command?: {
        title: string;
        command: string;
        arguments?: unknown[];
    };
}
/**
 * Inline completion list
 */
export interface InlineCompletionList {
    items: InlineCompletionItem[];
}
/**
 * Document store for tracking open documents
 */
export declare class DocumentStore {
    private documents;
    open(uri: string, content: string, version: number, languageId: string): void;
    update(uri: string, content: string, version: number): void;
    close(uri: string): void;
    get(uri: string): {
        content: string;
        version: number;
        languageId: string;
    } | undefined;
    getContent(uri: string): string | undefined;
    has(uri: string): boolean;
    getAll(): Array<{
        uri: string;
        content: string;
        version: number;
        languageId: string;
    }>;
}
/**
 * LSP Request Handlers
 *
 * Provides handlers for all LSP requests using PhilJS AI capabilities.
 */
export declare class LSPHandlers {
    private provider;
    private documents;
    private autocomplete;
    private codeGenerator;
    private analyzer;
    private refactoring;
    private testGenerator;
    constructor(provider: AIProvider);
    /**
     * Get the document store
     */
    getDocumentStore(): DocumentStore;
    /**
     * Handle text document did open
     */
    handleDidOpen(uri: string, content: string, version: number, languageId: string): void;
    /**
     * Handle text document did change
     */
    handleDidChange(uri: string, content: string, version: number): void;
    /**
     * Handle text document did close
     */
    handleDidClose(uri: string): void;
    /**
     * Handle completion request
     */
    handleCompletion(params: CompletionParams): Promise<CompletionList>;
    /**
     * Handle hover request
     */
    handleHover(params: TextDocumentPositionParams): Promise<Hover | null>;
    /**
     * Handle signature help request
     */
    handleSignatureHelp(params: SignatureHelpParams): Promise<SignatureHelp | null>;
    /**
     * Handle code action request
     */
    handleCodeAction(params: CodeActionParams): Promise<CodeAction[]>;
    /**
     * Handle inline completion request
     */
    handleInlineCompletion(params: InlineCompletionParams): Promise<InlineCompletionList>;
    /**
     * Handle diagnostics request
     */
    handleDiagnostics(uri: string): Promise<Diagnostic[]>;
    /**
     * Execute a command
     */
    executeCommand(command: string, args: unknown[]): Promise<unknown>;
    private getPrefix;
    private getTextBeforePosition;
    private getTextAfterPosition;
    private getTextInRange;
    private getWordAtPosition;
    private getFunctionNameAtPosition;
    private uriToPath;
    private getLanguage;
    private mapSeverity;
    private hasReactPatterns;
    private getQuickFixes;
    private getBuiltInDocumentation;
}
/**
 * Create LSP handlers instance
 *
 * @param provider - AI provider
 * @returns LSP handlers
 */
export declare function createLSPHandlers(provider: AIProvider): LSPHandlers;
//# sourceMappingURL=handlers.d.ts.map