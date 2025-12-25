/**
 * LSP Capabilities Module
 *
 * Defines the capabilities of the PhilJS AI Language Server.
 * Compatible with the Language Server Protocol specification.
 */

/**
 * Server capabilities configuration
 */
export interface ServerCapabilities {
  /** Text document sync options */
  textDocumentSync: TextDocumentSyncOptions;
  /** Completion provider options */
  completionProvider: CompletionOptions;
  /** Hover provider */
  hoverProvider: boolean;
  /** Signature help provider */
  signatureHelpProvider: SignatureHelpOptions;
  /** Definition provider */
  definitionProvider: boolean;
  /** References provider */
  referencesProvider: boolean;
  /** Document symbol provider */
  documentSymbolProvider: boolean;
  /** Code action provider */
  codeActionProvider: CodeActionOptions;
  /** Code lens provider */
  codeLensProvider: CodeLensOptions;
  /** Document formatting provider */
  documentFormattingProvider: boolean;
  /** Document range formatting provider */
  documentRangeFormattingProvider: boolean;
  /** Rename provider */
  renameProvider: RenameOptions;
  /** Inline completion provider (experimental) */
  inlineCompletionProvider: InlineCompletionOptions;
  /** Diagnostic provider */
  diagnosticProvider: DiagnosticOptions;
  /** Workspace capabilities */
  workspace: WorkspaceCapabilities;
  /** Experimental capabilities */
  experimental: ExperimentalCapabilities;
}

/**
 * Text document sync options
 */
export interface TextDocumentSyncOptions {
  /** Open and close notifications */
  openClose: boolean;
  /** Change notifications */
  change: TextDocumentSyncKind;
  /** Save notifications */
  save: SaveOptions;
}

/**
 * Text document sync kinds
 */
export enum TextDocumentSyncKind {
  None = 0,
  Full = 1,
  Incremental = 2,
}

/**
 * Save options
 */
export interface SaveOptions {
  /** Include text on save */
  includeText: boolean;
}

/**
 * Completion options
 */
export interface CompletionOptions {
  /** Trigger characters for completion */
  triggerCharacters: string[];
  /** Resolve provider */
  resolveProvider: boolean;
  /** Work done progress */
  workDoneProgress: boolean;
}

/**
 * Signature help options
 */
export interface SignatureHelpOptions {
  /** Trigger characters */
  triggerCharacters: string[];
  /** Retrigger characters */
  retriggerCharacters: string[];
}

/**
 * Code action options
 */
export interface CodeActionOptions {
  /** Code action kinds supported */
  codeActionKinds: string[];
  /** Resolve provider */
  resolveProvider: boolean;
}

/**
 * Code lens options
 */
export interface CodeLensOptions {
  /** Resolve provider */
  resolveProvider: boolean;
}

/**
 * Rename options
 */
export interface RenameOptions {
  /** Prepare provider */
  prepareProvider: boolean;
}

/**
 * Inline completion options
 */
export interface InlineCompletionOptions {
  /** Trigger kinds */
  triggerKinds: InlineCompletionTriggerKind[];
}

/**
 * Inline completion trigger kinds
 */
export enum InlineCompletionTriggerKind {
  Invoked = 0,
  Automatic = 1,
}

/**
 * Diagnostic options
 */
export interface DiagnosticOptions {
  /** Identifier */
  identifier: string;
  /** Inter file dependencies */
  interFileDependencies: boolean;
  /** Workspace diagnostics */
  workspaceDiagnostics: boolean;
}

/**
 * Workspace capabilities
 */
export interface WorkspaceCapabilities {
  /** Workspace folders */
  workspaceFolders: {
    supported: boolean;
    changeNotifications: boolean;
  };
  /** File operations */
  fileOperations: {
    didCreate: FileOperationFilter;
    didRename: FileOperationFilter;
    didDelete: FileOperationFilter;
  };
}

/**
 * File operation filter
 */
export interface FileOperationFilter {
  /** File patterns */
  patterns: FileOperationPattern[];
}

/**
 * File operation pattern
 */
export interface FileOperationPattern {
  /** Glob pattern */
  glob: string;
  /** Match type */
  matches: 'file' | 'folder';
}

/**
 * Experimental capabilities
 */
export interface ExperimentalCapabilities {
  /** AI-powered code generation */
  aiCodeGeneration: boolean;
  /** AI-powered refactoring */
  aiRefactoring: boolean;
  /** AI-powered code explanation */
  aiExplanation: boolean;
  /** AI-powered test generation */
  aiTestGeneration: boolean;
  /** AI-powered anti-pattern detection */
  aiAntiPatternDetection: boolean;
  /** PhilJS-specific features */
  philjsSignalAnalysis: boolean;
}

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
} as const;

/**
 * Diagnostic severity levels
 */
export enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4,
}

/**
 * Diagnostic tags
 */
export enum DiagnosticTag {
  Unnecessary = 1,
  Deprecated = 2,
}

/**
 * Get default server capabilities
 *
 * @returns Default server capabilities configuration
 */
export function getDefaultCapabilities(): ServerCapabilities {
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
 * Initialize result for LSP
 */
export interface InitializeResult {
  /** Server capabilities */
  capabilities: ServerCapabilities;
  /** Server info */
  serverInfo: {
    name: string;
    version: string;
  };
}

/**
 * Get initialization result
 *
 * @param version - Server version
 * @returns Initialize result
 */
export function getInitializeResult(version: string = '1.0.0'): InitializeResult {
  return {
    capabilities: getDefaultCapabilities(),
    serverInfo: {
      name: 'PhilJS AI Language Server',
      version,
    },
  };
}

/**
 * Client capabilities (expected from client)
 */
export interface ClientCapabilities {
  /** Text document capabilities */
  textDocument?: {
    completion?: {
      completionItem?: {
        snippetSupport?: boolean;
        commitCharactersSupport?: boolean;
        documentationFormat?: string[];
        deprecatedSupport?: boolean;
        preselectSupport?: boolean;
        insertReplaceSupport?: boolean;
        resolveSupport?: {
          properties: string[];
        };
      };
      contextSupport?: boolean;
    };
    hover?: {
      contentFormat?: string[];
    };
    signatureHelp?: {
      signatureInformation?: {
        documentationFormat?: string[];
        parameterInformation?: {
          labelOffsetSupport?: boolean;
        };
      };
      contextSupport?: boolean;
    };
    codeAction?: {
      codeActionLiteralSupport?: {
        codeActionKind: {
          valueSet: string[];
        };
      };
      isPreferredSupport?: boolean;
      dataSupport?: boolean;
      resolveSupport?: {
        properties: string[];
      };
    };
    inlineCompletion?: {
      dynamicRegistration?: boolean;
    };
  };
  /** Workspace capabilities */
  workspace?: {
    applyEdit?: boolean;
    workspaceEdit?: {
      documentChanges?: boolean;
      resourceOperations?: string[];
      failureHandling?: string;
    };
    workspaceFolders?: boolean;
    configuration?: boolean;
    didChangeConfiguration?: {
      dynamicRegistration?: boolean;
    };
  };
  /** Experimental capabilities */
  experimental?: Record<string, unknown>;
}

/**
 * Check if client supports a capability
 *
 * @param capabilities - Client capabilities
 * @param path - Dot-separated path to capability
 * @returns Whether the capability is supported
 */
export function hasCapability(
  capabilities: ClientCapabilities,
  path: string
): boolean {
  const parts = path.split('.');
  let current: unknown = capabilities;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return false;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current === true || (typeof current === 'object' && current !== null);
}
