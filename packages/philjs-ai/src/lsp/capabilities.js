/**
 * LSP Capabilities Module
 *
 * Defines the capabilities of the PhilJS AI Language Server.
 * Compatible with the Language Server Protocol specification.
 */
/**
 * Text document sync kinds
 */
export var TextDocumentSyncKind;
(function (TextDocumentSyncKind) {
    TextDocumentSyncKind[TextDocumentSyncKind["None"] = 0] = "None";
    TextDocumentSyncKind[TextDocumentSyncKind["Full"] = 1] = "Full";
    TextDocumentSyncKind[TextDocumentSyncKind["Incremental"] = 2] = "Incremental";
})(TextDocumentSyncKind || (TextDocumentSyncKind = {}));
/**
 * Inline completion trigger kinds
 */
export var InlineCompletionTriggerKind;
(function (InlineCompletionTriggerKind) {
    InlineCompletionTriggerKind[InlineCompletionTriggerKind["Invoked"] = 0] = "Invoked";
    InlineCompletionTriggerKind[InlineCompletionTriggerKind["Automatic"] = 1] = "Automatic";
})(InlineCompletionTriggerKind || (InlineCompletionTriggerKind = {}));
/**
 * Code action kinds supported by the server
 */
export const CODE_ACTION_KINDS = {
    /** Quick fix */
    QuickFix: 'quickfix',
    /** Refactor */
    Refactor: 'refactor',
    /** Refactor extract */
    RefactorExtract: 'refactor.extract',
    /** Refactor inline */
    RefactorInline: 'refactor.inline',
    /** Refactor rewrite */
    RefactorRewrite: 'refactor.rewrite',
    /** Source action */
    Source: 'source',
    /** Organize imports */
    SourceOrganizeImports: 'source.organizeImports',
    /** Fix all */
    SourceFixAll: 'source.fixAll',
    /** AI-powered actions */
    AIGenerate: 'ai.generate',
    AIRefactor: 'ai.refactor',
    AIExplain: 'ai.explain',
    AITest: 'ai.test',
};
/**
 * Diagnostic severity levels
 */
export var DiagnosticSeverity;
(function (DiagnosticSeverity) {
    DiagnosticSeverity[DiagnosticSeverity["Error"] = 1] = "Error";
    DiagnosticSeverity[DiagnosticSeverity["Warning"] = 2] = "Warning";
    DiagnosticSeverity[DiagnosticSeverity["Information"] = 3] = "Information";
    DiagnosticSeverity[DiagnosticSeverity["Hint"] = 4] = "Hint";
})(DiagnosticSeverity || (DiagnosticSeverity = {}));
/**
 * Diagnostic tags
 */
export var DiagnosticTag;
(function (DiagnosticTag) {
    DiagnosticTag[DiagnosticTag["Unnecessary"] = 1] = "Unnecessary";
    DiagnosticTag[DiagnosticTag["Deprecated"] = 2] = "Deprecated";
})(DiagnosticTag || (DiagnosticTag = {}));
/**
 * Get default server capabilities
 *
 * @returns Default server capabilities configuration
 */
export function getDefaultCapabilities() {
    return {
        textDocumentSync: {
            openClose: true,
            change: TextDocumentSyncKind.Incremental,
            save: {
                includeText: true,
            },
        },
        completionProvider: {
            triggerCharacters: ['.', '<', '/', '"', "'", '`', '@', '{'],
            resolveProvider: true,
            workDoneProgress: true,
        },
        hoverProvider: true,
        signatureHelpProvider: {
            triggerCharacters: ['(', ','],
            retriggerCharacters: [')'],
        },
        definitionProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        codeActionProvider: {
            codeActionKinds: [
                CODE_ACTION_KINDS.QuickFix,
                CODE_ACTION_KINDS.Refactor,
                CODE_ACTION_KINDS.RefactorExtract,
                CODE_ACTION_KINDS.RefactorInline,
                CODE_ACTION_KINDS.RefactorRewrite,
                CODE_ACTION_KINDS.Source,
                CODE_ACTION_KINDS.SourceOrganizeImports,
                CODE_ACTION_KINDS.SourceFixAll,
                CODE_ACTION_KINDS.AIGenerate,
                CODE_ACTION_KINDS.AIRefactor,
                CODE_ACTION_KINDS.AIExplain,
                CODE_ACTION_KINDS.AITest,
            ],
            resolveProvider: true,
        },
        codeLensProvider: {
            resolveProvider: true,
        },
        documentFormattingProvider: true,
        documentRangeFormattingProvider: true,
        renameProvider: {
            prepareProvider: true,
        },
        inlineCompletionProvider: {
            triggerKinds: [
                InlineCompletionTriggerKind.Invoked,
                InlineCompletionTriggerKind.Automatic,
            ],
        },
        diagnosticProvider: {
            identifier: 'philjs-ai',
            interFileDependencies: true,
            workspaceDiagnostics: true,
        },
        workspace: {
            workspaceFolders: {
                supported: true,
                changeNotifications: true,
            },
            fileOperations: {
                didCreate: {
                    patterns: [
                        { glob: '**/*.{ts,tsx,js,jsx}', matches: 'file' },
                    ],
                },
                didRename: {
                    patterns: [
                        { glob: '**/*.{ts,tsx,js,jsx}', matches: 'file' },
                    ],
                },
                didDelete: {
                    patterns: [
                        { glob: '**/*.{ts,tsx,js,jsx}', matches: 'file' },
                    ],
                },
            },
        },
        experimental: {
            aiCodeGeneration: true,
            aiRefactoring: true,
            aiExplanation: true,
            aiTestGeneration: true,
            aiAntiPatternDetection: true,
            philjsSignalAnalysis: true,
        },
    };
}
/**
 * Get initialization result
 *
 * @param version - Server version
 * @returns Initialize result
 */
export function getInitializeResult(version = '1.0.0') {
    return {
        capabilities: getDefaultCapabilities(),
        serverInfo: {
            name: 'PhilJS AI Language Server',
            version,
        },
    };
}
/**
 * Check if client supports a capability
 *
 * @param capabilities - Client capabilities
 * @param path - Dot-separated path to capability
 * @returns Whether the capability is supported
 */
export function hasCapability(capabilities, path) {
    const parts = path.split('.');
    let current = capabilities;
    for (const part of parts) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return false;
        }
        current = current[part];
    }
    return current === true || (typeof current === 'object' && current !== null);
}
//# sourceMappingURL=capabilities.js.map