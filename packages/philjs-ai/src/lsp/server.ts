/**
 * PhilJS AI Language Server
 *
 * A Language Server Protocol (LSP) implementation powered by AI
 * for intelligent code assistance in PhilJS projects.
 *
 * Features:
 * - AI-powered code completions
 * - Inline completions (Copilot-style)
 * - Signature help
 * - Hover documentation
 * - Code actions and quick fixes
 * - Diagnostics with anti-pattern detection
 * - AI-powered refactoring
 * - Test generation
 */

import type { AIProvider } from '../types.js';
import { getDefaultCapabilities, getInitializeResult, type ServerCapabilities, type ClientCapabilities, type InitializeResult } from './capabilities.js';
import { LSPHandlers, type CompletionParams, type CompletionList, type TextDocumentPositionParams, type Hover, type SignatureHelpParams, type SignatureHelp, type CodeActionParams, type CodeAction, type InlineCompletionParams, type InlineCompletionList, type Diagnostic } from './handlers.js';

/**
 * LSP Message types
 */
export interface LSPMessage {
  jsonrpc: '2.0';
  id?: number | string;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * LSP Request message
 */
export interface LSPRequest extends LSPMessage {
  id: number | string;
  method: string;
  params?: unknown;
}

/**
 * LSP Response message
 */
export interface LSPResponse extends LSPMessage {
  id: number | string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * LSP Notification message
 */
export interface LSPNotification extends LSPMessage {
  method: string;
  params?: unknown;
}

/**
 * Server state
 */
export type ServerState = 'uninitialized' | 'initializing' | 'initialized' | 'shutdown';

/**
 * Server configuration
 */
export interface ServerConfig {
  /** AI provider */
  provider: AIProvider;
  /** Server name */
  name?: string;
  /** Server version */
  version?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom capabilities */
  capabilities?: Partial<ServerCapabilities>;
}

/**
 * Message handler type
 */
export type MessageHandler = (params: unknown) => Promise<unknown> | unknown;

/**
 * Notification handler type
 */
export type NotificationHandler = (params: unknown) => void;

/**
 * PhilJS AI Language Server
 *
 * Implements the Language Server Protocol with AI-powered features.
 */
export class PhilJSLanguageServer {
  private config: Required<ServerConfig>;
  private state: ServerState = 'uninitialized';
  private handlers: LSPHandlers;
  private clientCapabilities: ClientCapabilities = {};
  private requestHandlers: Map<string, MessageHandler> = new Map();
  private notificationHandlers: Map<string, NotificationHandler> = new Map();
  private pendingRequests: Map<number | string, { resolve: (value: unknown) => void; reject: (error: Error) => void }> = new Map();
  private nextRequestId = 1;
  private onSendMessage: ((message: LSPMessage) => void) | null = null;

  constructor(config: ServerConfig) {
    this.config = {
      name: 'PhilJS AI Language Server',
      version: '1.0.0',
      debug: false,
      capabilities: {},
      ...config,
    };

    this.handlers = new LSPHandlers(config.provider);
    this.registerBuiltInHandlers();
  }

  /**
   * Set the message sender callback
   */
  setSendMessage(callback: (message: LSPMessage) => void): void {
    this.onSendMessage = callback;
  }

  /**
   * Process an incoming LSP message
   */
  async processMessage(message: LSPMessage): Promise<void> {
    if (this.config.debug) {
      console.log('Received:', JSON.stringify(message, null, 2));
    }

    if ('id' in message && message.id !== undefined) {
      if ('method' in message && message.method) {
        // Request
        await this.handleRequest(message as LSPRequest);
      } else {
        // Response
        this.handleResponse(message as LSPResponse);
      }
    } else if ('method' in message && message.method) {
      // Notification
      await this.handleNotification(message as LSPNotification);
    }
  }

  /**
   * Get current server state
   */
  getState(): ServerState {
    return this.state;
  }

  /**
   * Get server capabilities
   */
  getCapabilities(): ServerCapabilities {
    const defaults = getDefaultCapabilities();
    return {
      ...defaults,
      ...this.config.capabilities,
    };
  }

  /**
   * Register a custom request handler
   */
  onRequest(method: string, handler: MessageHandler): void {
    this.requestHandlers.set(method, handler);
  }

  /**
   * Register a custom notification handler
   */
  onNotification(method: string, handler: NotificationHandler): void {
    this.notificationHandlers.set(method, handler);
  }

  /**
   * Send a request to the client
   */
  async sendRequest<T = unknown>(method: string, params?: unknown): Promise<T> {
    const id = this.nextRequestId++;
    const message: LSPRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve: resolve as (value: unknown) => void, reject });
      this.send(message);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request ${method} timed out`));
        }
      }, 30000);
    });
  }

  /**
   * Send a notification to the client
   */
  sendNotification(method: string, params?: unknown): void {
    const message: LSPNotification = {
      jsonrpc: '2.0',
      method,
      params,
    };
    this.send(message);
  }

  /**
   * Publish diagnostics for a document
   */
  async publishDiagnostics(uri: string): Promise<void> {
    const diagnostics = await this.handlers.handleDiagnostics(uri);
    this.sendNotification('textDocument/publishDiagnostics', {
      uri,
      diagnostics,
    });
  }

  /**
   * Log a message to the client
   */
  logMessage(type: 'error' | 'warning' | 'info' | 'log', message: string): void {
    const typeMap = { error: 1, warning: 2, info: 3, log: 4 };
    this.sendNotification('window/logMessage', {
      type: typeMap[type],
      message,
    });
  }

  /**
   * Show a message to the user
   */
  showMessage(type: 'error' | 'warning' | 'info', message: string): void {
    const typeMap = { error: 1, warning: 2, info: 3 };
    this.sendNotification('window/showMessage', {
      type: typeMap[type],
      message,
    });
  }

  // ============ Private Methods ============

  private registerBuiltInHandlers(): void {
    // Lifecycle
    this.onRequest('initialize', (params) => this.handleInitialize(params as { capabilities: ClientCapabilities }));
    this.onRequest('shutdown', this.handleShutdown.bind(this));
    this.onNotification('initialized', () => this.handleInitialized());
    this.onNotification('exit', () => this.handleExit());

    // Text document synchronization
    this.onNotification('textDocument/didOpen', (params) =>
      this.handleTextDocumentDidOpen(params as { textDocument: { uri: string; languageId: string; version: number; text: string } }));
    this.onNotification('textDocument/didChange', (params) =>
      this.handleTextDocumentDidChange(params as { textDocument: { uri: string; version: number }; contentChanges: { text: string }[] }));
    this.onNotification('textDocument/didClose', (params) =>
      this.handleTextDocumentDidClose(params as { textDocument: { uri: string } }));
    this.onNotification('textDocument/didSave', (params) =>
      this.handleTextDocumentDidSave(params as { textDocument: { uri: string }; text?: string }));

    // Language features
    this.onRequest('textDocument/completion', (params) =>
      this.handleTextDocumentCompletion(params as CompletionParams));
    this.onRequest('textDocument/hover', (params) =>
      this.handleTextDocumentHover(params as TextDocumentPositionParams));
    this.onRequest('textDocument/signatureHelp', (params) =>
      this.handleTextDocumentSignatureHelp(params as SignatureHelpParams));
    this.onRequest('textDocument/codeAction', (params) =>
      this.handleTextDocumentCodeAction(params as CodeActionParams));
    this.onRequest('textDocument/inlineCompletion', (params) =>
      this.handleTextDocumentInlineCompletion(params as InlineCompletionParams));

    // Workspace
    this.onRequest('workspace/executeCommand', (params) =>
      this.handleExecuteCommand(params as { command: string; arguments?: unknown[] }));
  }

  private async handleRequest(request: LSPRequest): Promise<void> {
    const handler = this.requestHandlers.get(request.method);

    if (!handler) {
      this.sendError(request.id, -32601, `Method not found: ${request.method}`);
      return;
    }

    try {
      const result = await handler(request.params);
      this.sendResult(request.id, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.sendError(request.id, -32603, message);
    }
  }

  private handleResponse(response: LSPResponse): void {
    const pending = this.pendingRequests.get(response.id);
    if (!pending) {
      return;
    }

    this.pendingRequests.delete(response.id);

    if (response.error) {
      pending.reject(new Error(response.error.message));
    } else {
      pending.resolve(response.result);
    }
  }

  private async handleNotification(notification: LSPNotification): Promise<void> {
    const handler = this.notificationHandlers.get(notification.method);
    if (handler) {
      handler(notification.params);
    }
  }

  private send(message: LSPMessage): void {
    if (this.config.debug) {
      console.log('Sending:', JSON.stringify(message, null, 2));
    }

    if (this.onSendMessage) {
      this.onSendMessage(message);
    }
  }

  private sendResult(id: number | string, result: unknown): void {
    this.send({
      jsonrpc: '2.0',
      id,
      result,
    });
  }

  private sendError(id: number | string, code: number, message: string, data?: unknown): void {
    this.send({
      jsonrpc: '2.0',
      id,
      error: { code, message, data },
    });
  }

  // ============ Request Handlers ============

  private handleInitialize(params: { capabilities: ClientCapabilities }): InitializeResult {
    this.state = 'initializing';
    this.clientCapabilities = params.capabilities;

    return getInitializeResult(this.config.version);
  }

  private handleInitialized(): void {
    this.state = 'initialized';
    this.logMessage('info', `${this.config.name} v${this.config.version} initialized`);
  }

  private handleShutdown(): null {
    this.state = 'shutdown';
    return null;
  }

  private handleExit(): void {
    process.exit(this.state === 'shutdown' ? 0 : 1);
  }

  private handleTextDocumentDidOpen(params: {
    textDocument: { uri: string; languageId: string; version: number; text: string };
  }): void {
    const { uri, languageId, version, text } = params.textDocument;
    this.handlers.handleDidOpen(uri, text, version, languageId);

    // Publish initial diagnostics
    this.publishDiagnostics(uri);
  }

  private handleTextDocumentDidChange(params: {
    textDocument: { uri: string; version: number };
    contentChanges: Array<{ text: string }>;
  }): void {
    const { uri, version } = params.textDocument;
    const content = params.contentChanges[params.contentChanges.length - 1]?.text;
    if (content !== undefined) {
      this.handlers.handleDidChange(uri, content, version);
    }
  }

  private handleTextDocumentDidClose(params: {
    textDocument: { uri: string };
  }): void {
    this.handlers.handleDidClose(params.textDocument.uri);
  }

  private handleTextDocumentDidSave(params: {
    textDocument: { uri: string };
    text?: string;
  }): void {
    // Re-publish diagnostics on save
    this.publishDiagnostics(params.textDocument.uri);
  }

  private async handleTextDocumentCompletion(params: CompletionParams): Promise<CompletionList> {
    return this.handlers.handleCompletion(params);
  }

  private async handleTextDocumentHover(params: TextDocumentPositionParams): Promise<Hover | null> {
    return this.handlers.handleHover(params);
  }

  private async handleTextDocumentSignatureHelp(params: SignatureHelpParams): Promise<SignatureHelp | null> {
    return this.handlers.handleSignatureHelp(params);
  }

  private async handleTextDocumentCodeAction(params: CodeActionParams): Promise<CodeAction[]> {
    return this.handlers.handleCodeAction(params);
  }

  private async handleTextDocumentInlineCompletion(params: InlineCompletionParams): Promise<InlineCompletionList> {
    return this.handlers.handleInlineCompletion(params);
  }

  private async handleExecuteCommand(params: { command: string; arguments?: unknown[] }): Promise<unknown> {
    return this.handlers.executeCommand(params.command, params.arguments || []);
  }
}

/**
 * Create a PhilJS AI Language Server instance
 *
 * @param config - Server configuration
 * @returns Language server instance
 *
 * @example
 * ```typescript
 * import { createLanguageServer } from '@philjs/ai';
 *
 * const server = createLanguageServer({
 *   provider: myAIProvider,
 *   debug: true,
 * });
 *
 * // Connect to stdin/stdout for CLI usage
 * server.setSendMessage(msg => {
 *   process.stdout.write(JSON.stringify(msg) + '\n');
 * });
 *
 * process.stdin.on('data', data => {
 *   server.processMessage(JSON.parse(data.toString()));
 * });
 * ```
 */
export function createLanguageServer(config: ServerConfig): PhilJSLanguageServer {
  return new PhilJSLanguageServer(config);
}

/**
 * Start an LSP server on stdin/stdout
 *
 * @param provider - AI provider
 * @param options - Server options
 * @returns Server instance
 */
export function startStdioServer(
  provider: AIProvider,
  options?: Omit<ServerConfig, 'provider'>
): PhilJSLanguageServer {
  const server = createLanguageServer({ provider, ...options });

  // Set up message transport
  server.setSendMessage((message) => {
    const json = JSON.stringify(message);
    const contentLength = Buffer.byteLength(json, 'utf8');
    process.stdout.write(`Content-Length: ${contentLength}\r\n\r\n${json}`);
  });

  // Parse incoming messages
  let buffer = '';

  process.stdin.on('data', (chunk) => {
    buffer += chunk.toString();

    while (true) {
      // Look for header
      const headerEnd = buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;

      // Parse content length
      const header = buffer.slice(0, headerEnd);
      const contentLengthMatch = header.match(/Content-Length: (\d+)/i);
      if (!contentLengthMatch || contentLengthMatch[1] === undefined) {
        buffer = buffer.slice(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(contentLengthMatch[1], 10);
      const messageStart = headerEnd + 4;
      const messageEnd = messageStart + contentLength;

      if (buffer.length < messageEnd) break;

      // Extract and parse message
      const messageJson = buffer.slice(messageStart, messageEnd);
      buffer = buffer.slice(messageEnd);

      try {
        const message = JSON.parse(messageJson);
        server.processMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    }
  });

  process.stdin.on('end', () => {
    process.exit(0);
  });

  return server;
}

// Re-export types and utilities
export * from './capabilities.js';
export * from './handlers.js';
