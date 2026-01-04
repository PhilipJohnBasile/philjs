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
import { type ServerCapabilities } from './capabilities.js';
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
export declare class PhilJSLanguageServer {
    private config;
    private state;
    private handlers;
    private clientCapabilities;
    private requestHandlers;
    private notificationHandlers;
    private pendingRequests;
    private nextRequestId;
    private onSendMessage;
    constructor(config: ServerConfig);
    /**
     * Set the message sender callback
     */
    setSendMessage(callback: (message: LSPMessage) => void): void;
    /**
     * Process an incoming LSP message
     */
    processMessage(message: LSPMessage): Promise<void>;
    /**
     * Get current server state
     */
    getState(): ServerState;
    /**
     * Get server capabilities
     */
    getCapabilities(): ServerCapabilities;
    /**
     * Register a custom request handler
     */
    onRequest(method: string, handler: MessageHandler): void;
    /**
     * Register a custom notification handler
     */
    onNotification(method: string, handler: NotificationHandler): void;
    /**
     * Send a request to the client
     */
    sendRequest<T = unknown>(method: string, params?: unknown): Promise<T>;
    /**
     * Send a notification to the client
     */
    sendNotification(method: string, params?: unknown): void;
    /**
     * Publish diagnostics for a document
     */
    publishDiagnostics(uri: string): Promise<void>;
    /**
     * Log a message to the client
     */
    logMessage(type: 'error' | 'warning' | 'info' | 'log', message: string): void;
    /**
     * Show a message to the user
     */
    showMessage(type: 'error' | 'warning' | 'info', message: string): void;
    private registerBuiltInHandlers;
    private handleRequest;
    private handleResponse;
    private handleNotification;
    private send;
    private sendResult;
    private sendError;
    private handleInitialize;
    private handleInitialized;
    private handleShutdown;
    private handleExit;
    private handleTextDocumentDidOpen;
    private handleTextDocumentDidChange;
    private handleTextDocumentDidClose;
    private handleTextDocumentDidSave;
    private handleTextDocumentCompletion;
    private handleTextDocumentHover;
    private handleTextDocumentSignatureHelp;
    private handleTextDocumentCodeAction;
    private handleTextDocumentInlineCompletion;
    private handleExecuteCommand;
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
export declare function createLanguageServer(config: ServerConfig): PhilJSLanguageServer;
/**
 * Start an LSP server on stdin/stdout
 *
 * @param provider - AI provider
 * @param options - Server options
 * @returns Server instance
 */
export declare function startStdioServer(provider: AIProvider, options?: Omit<ServerConfig, 'provider'>): PhilJSLanguageServer;
export * from './capabilities.js';
export * from './handlers.js';
//# sourceMappingURL=server.d.ts.map