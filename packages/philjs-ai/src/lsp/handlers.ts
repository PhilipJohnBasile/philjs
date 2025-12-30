/**
 * LSP Request Handlers Module
 *
 * Implements handlers for all LSP requests using PhilJS AI capabilities.
 */

import type { AIProvider } from '../types.js';
import { AutocompleteEngine, type AutocompleteContext, type CodeContext } from '../autocomplete/index.js';
import { CodeGenerator } from '../codegen.js';
import { CodeAnalyzer } from '../analysis.js';
import { RefactoringEngine } from '../refactor/index.js';
import { TestGenerator } from '../testing/test-generator.js';
import { DiagnosticSeverity, CODE_ACTION_KINDS } from './capabilities.js';

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
  documentation?: string | { kind: string; value: string };
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
  contents: { kind: string; value: string } | string;
  range?: Range;
}

/**
 * Signature help
 */
export interface SignatureHelp {
  signatures: Array<{
    label: string;
    documentation?: string | { kind: string; value: string };
    parameters?: Array<{
      label: string | [number, number];
      documentation?: string | { kind: string; value: string };
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
  disabled?: { reason: string };
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
    textDocument: { uri: string; version: number | null };
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
    location: { uri: string; range: Range };
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
export class DocumentStore {
  private documents: Map<string, { content: string; version: number; languageId: string }> = new Map();

  open(uri: string, content: string, version: number, languageId: string): void {
    this.documents.set(uri, { content, version, languageId });
  }

  update(uri: string, content: string, version: number): void {
    const doc = this.documents.get(uri);
    if (doc) {
      doc.content = content;
      doc.version = version;
    }
  }

  close(uri: string): void {
    this.documents.delete(uri);
  }

  get(uri: string): { content: string; version: number; languageId: string } | undefined {
    return this.documents.get(uri);
  }

  getContent(uri: string): string | undefined {
    return this.documents.get(uri)?.content;
  }

  has(uri: string): boolean {
    return this.documents.has(uri);
  }

  getAll(): Array<{ uri: string; content: string; version: number; languageId: string }> {
    return Array.from(this.documents.entries()).map(([uri, doc]) => ({
      uri,
      ...doc,
    }));
  }
}

/**
 * LSP Request Handlers
 *
 * Provides handlers for all LSP requests using PhilJS AI capabilities.
 */
export class LSPHandlers {
  private provider: AIProvider;
  private documents: DocumentStore;
  private autocomplete: AutocompleteEngine;
  private codeGenerator: CodeGenerator;
  private analyzer: CodeAnalyzer;
  private refactoring: RefactoringEngine;
  private testGenerator: TestGenerator;

  constructor(provider: AIProvider) {
    this.provider = provider;
    this.documents = new DocumentStore();
    this.autocomplete = new AutocompleteEngine(provider);
    this.codeGenerator = new CodeGenerator(provider);
    this.analyzer = new CodeAnalyzer(provider);
    this.refactoring = new RefactoringEngine(provider);
    this.testGenerator = new TestGenerator(provider);
  }

  /**
   * Get the document store
   */
  getDocumentStore(): DocumentStore {
    return this.documents;
  }

  /**
   * Handle text document did open
   */
  handleDidOpen(uri: string, content: string, version: number, languageId: string): void {
    this.documents.open(uri, content, version, languageId);
  }

  /**
   * Handle text document did change
   */
  handleDidChange(uri: string, content: string, version: number): void {
    this.documents.update(uri, content, version);
  }

  /**
   * Handle text document did close
   */
  handleDidClose(uri: string): void {
    this.documents.close(uri);
  }

  /**
   * Handle completion request
   */
  async handleCompletion(params: CompletionParams): Promise<CompletionList> {
    const doc = this.documents.get(params.textDocument.uri);
    if (!doc) {
      return { isIncomplete: false, items: [] };
    }

    const context: CodeContext = {
      content: doc.content,
      position: { line: params.position.line, column: params.position.character },
      filePath: this.uriToPath(params.textDocument.uri),
      language: this.getLanguage(doc.languageId),
      ...(params.context?.triggerCharacter && { trigger: params.context.triggerCharacter }),
      prefix: this.getPrefix(doc.content, params.position),
    };

    try {
      const completions = await this.autocomplete.getCompletions(context);

      return {
        isIncomplete: true,
        items: completions.map((c, i) => {
          const item: CompletionItem = {
            label: c.label,
            kind: c.kind,
            insertText: c.insertText,
            sortText: c.sortText || String(i).padStart(4, '0'),
            filterText: c.filterText || c.label,
            preselect: c.preselect ?? false,
          };
          if (c.detail) item.detail = c.detail;
          if (c.documentation) item.documentation = { kind: 'markdown', value: c.documentation };
          if (c.additionalTextEdits) item.additionalTextEdits = c.additionalTextEdits;
          return item;
        }),
      };
    } catch (error) {
      console.error('Completion error:', error);
      return { isIncomplete: false, items: [] };
    }
  }

  /**
   * Handle hover request
   */
  async handleHover(params: TextDocumentPositionParams): Promise<Hover | null> {
    const doc = this.documents.get(params.textDocument.uri);
    if (!doc) {
      return null;
    }

    const word = this.getWordAtPosition(doc.content, params.position);
    if (!word) {
      return null;
    }

    // Check for PhilJS built-in functions
    const builtInDoc = this.getBuiltInDocumentation(word);
    if (builtInDoc) {
      return {
        contents: {
          kind: 'markdown',
          value: builtInDoc,
        },
      };
    }

    // Use AI for custom symbols
    try {
      const context: AutocompleteContext = {
        fileContent: doc.content,
        cursor: { line: params.position.line, column: params.position.character },
        filePath: this.uriToPath(params.textDocument.uri),
        language: this.getLanguage(doc.languageId),
      };

      const signatureHelp = await this.autocomplete.getSignatureHelp(word, context);
      const sig = signatureHelp?.signatures[0];
      if (sig) {
        return {
          contents: {
            kind: 'markdown',
            value: `\`\`\`typescript\n${sig.label}\n\`\`\`\n\n${sig.documentation || ''}`,
          },
        };
      }
    } catch (error) {
      console.error('Hover error:', error);
    }

    return null;
  }

  /**
   * Handle signature help request
   */
  async handleSignatureHelp(params: SignatureHelpParams): Promise<SignatureHelp | null> {
    const doc = this.documents.get(params.textDocument.uri);
    if (!doc) {
      return null;
    }

    const functionName = this.getFunctionNameAtPosition(doc.content, params.position);
    if (!functionName) {
      return null;
    }

    try {
      const context: AutocompleteContext = {
        fileContent: doc.content,
        cursor: { line: params.position.line, column: params.position.character },
        filePath: this.uriToPath(params.textDocument.uri),
        language: this.getLanguage(doc.languageId),
      };

      const help = await this.autocomplete.getSignatureHelp(functionName, context);
      if (!help) {
        return null;
      }

      return {
        signatures: help.signatures.map(sig => {
          const signature: {
            label: string;
            documentation?: string | { kind: string; value: string };
            parameters?: { label: string | [number, number]; documentation?: string | { kind: string; value: string } }[];
          } = {
            label: sig.label,
          };
          if (sig.documentation) {
            signature.documentation = { kind: 'markdown', value: sig.documentation };
          }
          if (sig.parameters.length > 0) {
            signature.parameters = sig.parameters.map(p => {
              const param: { label: string | [number, number]; documentation?: string | { kind: string; value: string } } = {
                label: p.label,
              };
              if (p.documentation) {
                param.documentation = { kind: 'markdown', value: p.documentation };
              }
              return param;
            });
          }
          return signature;
        }),
        activeSignature: help.activeSignature,
        activeParameter: help.activeParameter,
      };
    } catch (error) {
      console.error('Signature help error:', error);
      return null;
    }
  }

  /**
   * Handle code action request
   */
  async handleCodeAction(params: CodeActionParams): Promise<CodeAction[]> {
    const doc = this.documents.get(params.textDocument.uri);
    if (!doc) {
      return [];
    }

    const actions: CodeAction[] = [];
    const selectedCode = this.getTextInRange(doc.content, params.range);

    // Quick fixes for diagnostics
    for (const diagnostic of params.context.diagnostics) {
      const fixes = await this.getQuickFixes(diagnostic, doc.content, params.textDocument.uri);
      actions.push(...fixes);
    }

    // AI-powered actions for selected code
    if (selectedCode && selectedCode.trim().length > 0) {
      // Generate tests action
      actions.push({
        title: 'Generate tests for selected code',
        kind: CODE_ACTION_KINDS.AITest,
        command: {
          title: 'Generate Tests',
          command: 'philjs.generateTests',
          arguments: [params.textDocument.uri, selectedCode],
        },
      });

      // Explain code action
      actions.push({
        title: 'Explain selected code',
        kind: CODE_ACTION_KINDS.AIExplain,
        command: {
          title: 'Explain Code',
          command: 'philjs.explainCode',
          arguments: [selectedCode],
        },
      });

      // Refactor action
      actions.push({
        title: 'Refactor with AI',
        kind: CODE_ACTION_KINDS.AIRefactor,
        command: {
          title: 'AI Refactor',
          command: 'philjs.refactorCode',
          arguments: [params.textDocument.uri, params.range, selectedCode],
        },
      });

      // Convert to signals action (if applicable)
      if (this.hasReactPatterns(selectedCode)) {
        actions.push({
          title: 'Convert to PhilJS signals',
          kind: CODE_ACTION_KINDS.RefactorRewrite,
          command: {
            title: 'Convert to Signals',
            command: 'philjs.convertToSignals',
            arguments: [params.textDocument.uri, params.range, selectedCode],
          },
        });
      }
    }

    // Source actions
    if (!params.context.only || params.context.only.includes(CODE_ACTION_KINDS.Source)) {
      actions.push({
        title: 'Organize imports',
        kind: CODE_ACTION_KINDS.SourceOrganizeImports,
        command: {
          title: 'Organize Imports',
          command: 'philjs.organizeImports',
          arguments: [params.textDocument.uri],
        },
      });
    }

    return actions;
  }

  /**
   * Handle inline completion request
   */
  async handleInlineCompletion(params: InlineCompletionParams): Promise<InlineCompletionList> {
    const doc = this.documents.get(params.textDocument.uri);
    if (!doc) {
      return { items: [] };
    }

    const prefix = this.getTextBeforePosition(doc.content, params.position);
    const suffix = this.getTextAfterPosition(doc.content, params.position);

    try {
      const completion = await this.autocomplete.getInlineCompletion(prefix, suffix, {
        language: this.getLanguage(doc.languageId),
      });

      if (!completion) {
        return { items: [] };
      }

      return {
        items: [
          {
            insertText: completion.text,
            range: {
              start: params.position,
              end: params.position,
            },
          },
        ],
      };
    } catch (error) {
      console.error('Inline completion error:', error);
      return { items: [] };
    }
  }

  /**
   * Handle diagnostics request
   */
  async handleDiagnostics(uri: string): Promise<Diagnostic[]> {
    const doc = this.documents.get(uri);
    if (!doc) {
      return [];
    }

    try {
      const antiPatterns = await this.analyzer.detectAntiPatterns(doc.content);
      const diagnostics: Diagnostic[] = [];

      for (const pattern of antiPatterns.patterns) {
        const severity = this.mapSeverity(pattern.severity);
        const range = pattern.location
          ? {
              start: { line: pattern.location.line - 1, character: pattern.location.column - 1 },
              end: { line: pattern.location.line - 1, character: pattern.location.column + 10 },
            }
          : { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } };

        diagnostics.push({
          range,
          severity,
          code: pattern.name,
          source: 'philjs-ai',
          message: pattern.description,
          data: { fix: pattern.fix, fixedCode: pattern.fixedCode },
        });
      }

      return diagnostics;
    } catch (error) {
      console.error('Diagnostics error:', error);
      return [];
    }
  }

  /**
   * Execute a command
   */
  async executeCommand(command: string, args: unknown[]): Promise<unknown> {
    switch (command) {
      case 'philjs.generateTests': {
        const [uri, code] = args as [string, string];
        const result = await this.testGenerator.generateTests({ code, type: 'unit' });
        return { uri, tests: result.code };
      }

      case 'philjs.explainCode': {
        const [code] = args as [string];
        const result = await this.codeGenerator.explainCode(code);
        return result;
      }

      case 'philjs.refactorCode': {
        const [uri, range, code] = args as [string, Range, string];
        const result = await this.refactoring.refactor({ code });
        return { uri, range, refactored: result.refactored };
      }

      case 'philjs.convertToSignals': {
        const [uri, range, code] = args as [string, Range, string];
        const result = await this.refactoring.optimizeSignals(code);
        return { uri, range, converted: result.code };
      }

      case 'philjs.generateComponent': {
        const [description, name] = args as [string, string];
        const result = await this.codeGenerator.generateComponent(description, { name });
        return result;
      }

      case 'philjs.analyzeComponent': {
        const [code] = args as [string];
        const result = await this.analyzer.analyzeComponent(code);
        return result;
      }

      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  // ============ Helper Methods ============

  private getPrefix(content: string, position: Position): string {
    const lines = content.split('\n');
    const line = lines[position.line] || '';
    return line.slice(0, position.character);
  }

  private getTextBeforePosition(content: string, position: Position): string {
    const lines = content.split('\n');
    const beforeLines = lines.slice(0, position.line);
    const currentLine = lines[position.line] || '';
    const beforeCursor = currentLine.slice(0, position.character);
    return [...beforeLines, beforeCursor].join('\n');
  }

  private getTextAfterPosition(content: string, position: Position): string {
    const lines = content.split('\n');
    const currentLine = lines[position.line] || '';
    const afterCursor = currentLine.slice(position.character);
    const afterLines = lines.slice(position.line + 1);
    return [afterCursor, ...afterLines].join('\n');
  }

  private getTextInRange(content: string, range: Range): string {
    const lines = content.split('\n');
    if (range.start.line === range.end.line) {
      return (lines[range.start.line] || '').slice(range.start.character, range.end.character);
    }

    const result: string[] = [];
    for (let i = range.start.line; i <= range.end.line; i++) {
      const line = lines[i] || '';
      if (i === range.start.line) {
        result.push(line.slice(range.start.character));
      } else if (i === range.end.line) {
        result.push(line.slice(0, range.end.character));
      } else {
        result.push(line);
      }
    }
    return result.join('\n');
  }

  private getWordAtPosition(content: string, position: Position): string | null {
    const lines = content.split('\n');
    const line = lines[position.line];
    if (!line) return null;

    const wordRegex = /\b\w+\b/g;
    let match;
    while ((match = wordRegex.exec(line)) !== null) {
      if (position.character >= match.index && position.character <= match.index + match[0].length) {
        return match[0];
      }
    }
    return null;
  }

  private getFunctionNameAtPosition(content: string, position: Position): string | null {
    const lines = content.split('\n');
    const line = lines[position.line];
    if (!line) return null;

    // Look for function call pattern before the cursor
    const beforeCursor = line.slice(0, position.character);
    const match = beforeCursor.match(/(\w+)\s*\([^)]*$/);
    return match?.[1] || null;
  }

  private uriToPath(uri: string): string {
    return uri.replace(/^file:\/\//, '').replace(/%20/g, ' ');
  }

  private getLanguage(languageId: string): 'typescript' | 'tsx' | 'javascript' | 'jsx' {
    const map: Record<string, 'typescript' | 'tsx' | 'javascript' | 'jsx'> = {
      typescript: 'typescript',
      typescriptreact: 'tsx',
      javascript: 'javascript',
      javascriptreact: 'jsx',
    };
    return map[languageId] || 'typescript';
  }

  private mapSeverity(severity: string): DiagnosticSeverity {
    const map: Record<string, DiagnosticSeverity> = {
      critical: DiagnosticSeverity.Error,
      error: DiagnosticSeverity.Error,
      warning: DiagnosticSeverity.Warning,
      info: DiagnosticSeverity.Information,
    };
    return map[severity] || DiagnosticSeverity.Information;
  }

  private hasReactPatterns(code: string): boolean {
    return (
      code.includes('useState') ||
      code.includes('useEffect') ||
      code.includes('useMemo') ||
      code.includes('useCallback')
    );
  }

  private async getQuickFixes(
    diagnostic: Diagnostic,
    content: string,
    uri: string
  ): Promise<CodeAction[]> {
    const fixes: CodeAction[] = [];
    const data = diagnostic.data as { fix?: string; fixedCode?: string } | undefined;

    if (data?.fixedCode) {
      fixes.push({
        title: data.fix || `Fix: ${diagnostic.message}`,
        kind: CODE_ACTION_KINDS.QuickFix,
        diagnostics: [diagnostic],
        isPreferred: true,
        edit: {
          changes: {
            [uri]: [
              {
                range: diagnostic.range,
                newText: data.fixedCode,
              },
            ],
          },
        },
      });
    }

    return fixes;
  }

  private getBuiltInDocumentation(name: string): string | null {
    const docs: Record<string, string> = {
      signal: `### signal<T>(initialValue: T): [Accessor<T>, Setter<T>]

Creates a reactive signal with fine-grained reactivity.

**Parameters:**
- \`initialValue\`: The initial value for the signal

**Returns:**
- Tuple of [getter function, setter function]

**Example:**
\`\`\`typescript
const [count, setCount] = signal(0);
console.log(count()); // 0
setCount(1);
console.log(count()); // 1
\`\`\``,

      memo: `### memo<T>(computation: () => T): Accessor<T>

Creates a computed/derived value that automatically tracks dependencies.

**Parameters:**
- \`computation\`: Function that computes the derived value

**Returns:**
- Accessor function for the computed value

**Example:**
\`\`\`typescript
const [count, setCount] = signal(0);
const doubled = memo(() => count() * 2);
console.log(doubled()); // 0
\`\`\``,

      effect: `### effect(fn: () => void | (() => void)): void

Creates a side effect that runs when dependencies change.

**Parameters:**
- \`fn\`: Effect function, can return a cleanup function

**Example:**
\`\`\`typescript
const [count, setCount] = signal(0);
effect(() => {
  console.log('Count is:', count());
  return () => console.log('Cleanup');
});
\`\`\``,
    };

    return docs[name] || null;
  }
}

/**
 * Create LSP handlers instance
 *
 * @param provider - AI provider
 * @returns LSP handlers
 */
export function createLSPHandlers(provider: AIProvider): LSPHandlers {
  return new LSPHandlers(provider);
}
