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
import { getDefaultCapabilities, getInitializeResult } from './capabilities.js';
import { LSPHandlers } from './handlers.js';
/**
 * PhilJS AI Language Server
 *
 * Implements the Language Server Protocol with AI-powered features.
 */
export class PhilJSLanguageServer {
    config;
    state = 'uninitialized';
    handlers;
    clientCapabilities = {};
    requestHandlers = new Map();
    notificationHandlers = new Map();
    pendingRequests = new Map();
    nextRequestId = 1;
    onSendMessage = null;
    constructor(config) {
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
    setSendMessage(callback) {
        this.onSendMessage = callback;
    }
    /**
     * Process an incoming LSP message
     */
    async processMessage(message) {
        if (this.config.debug) {
            console.log('Received:', JSON.stringify(message, null, 2));
        }
        if ('id' in message && message.id !== undefined) {
            if ('method' in message && message.method) {
                // Request
                await this.handleRequest(message);
            }
            else {
                // Response
                this.handleResponse(message);
            }
        }
        else if ('method' in message && message.method) {
            // Notification
            await this.handleNotification(message);
        }
    }
    /**
     * Get current server state
     */
    getState() {
        return this.state;
    }
    /**
     * Get server capabilities
     */
    getCapabilities() {
        const defaults = getDefaultCapabilities();
        return {
            ...defaults,
            ...this.config.capabilities,
        };
    }
    /**
     * Register a custom request handler
     */
    onRequest(method, handler) {
        this.requestHandlers.set(method, handler);
    }
    /**
     * Register a custom notification handler
     */
    onNotification(method, handler) {
        this.notificationHandlers.set(method, handler);
    }
    /**
     * Send a request to the client
     */
    async sendRequest(method, params) {
        const id = this.nextRequestId++;
        const message = {
            jsonrpc: '2.0',
            id,
            method,
            params,
        };
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve: resolve, reject });
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
    sendNotification(method, params) {
        const message = {
            jsonrpc: '2.0',
            method,
            params,
        };
        this.send(message);
    }
    /**
     * Publish diagnostics for a document
     */
    async publishDiagnostics(uri) {
        const diagnostics = await this.handlers.handleDiagnostics(uri);
        this.sendNotification('textDocument/publishDiagnostics', {
            uri,
            diagnostics,
        });
    }
    /**
     * Log a message to the client
     */
    logMessage(type, message) {
        const typeMap = { error: 1, warning: 2, info: 3, log: 4 };
        this.sendNotification('window/logMessage', {
            type: typeMap[type],
            message,
        });
    }
    /**
     * Show a message to the user
     */
    showMessage(type, message) {
        const typeMap = { error: 1, warning: 2, info: 3 };
        this.sendNotification('window/showMessage', {
            type: typeMap[type],
            message,
        });
    }
    // ============ Private Methods ============
    registerBuiltInHandlers() {
        // Lifecycle
        this.onRequest('initialize', (params) => this.handleInitialize(params));
        this.onRequest('shutdown', this.handleShutdown.bind(this));
        this.onNotification('initialized', () => this.handleInitialized());
        this.onNotification('exit', () => this.handleExit());
        // Text document synchronization
        this.onNotification('textDocument/didOpen', (params) => this.handleTextDocumentDidOpen(params));
        this.onNotification('textDocument/didChange', (params) => this.handleTextDocumentDidChange(params));
        this.onNotification('textDocument/didClose', (params) => this.handleTextDocumentDidClose(params));
        this.onNotification('textDocument/didSave', (params) => this.handleTextDocumentDidSave(params));
        // Language features
        this.onRequest('textDocument/completion', (params) => this.handleTextDocumentCompletion(params));
        this.onRequest('textDocument/hover', (params) => this.handleTextDocumentHover(params));
        this.onRequest('textDocument/signatureHelp', (params) => this.handleTextDocumentSignatureHelp(params));
        this.onRequest('textDocument/codeAction', (params) => this.handleTextDocumentCodeAction(params));
        this.onRequest('textDocument/inlineCompletion', (params) => this.handleTextDocumentInlineCompletion(params));
        // Workspace
        this.onRequest('workspace/executeCommand', (params) => this.handleExecuteCommand(params));
    }
    async handleRequest(request) {
        const handler = this.requestHandlers.get(request.method);
        if (!handler) {
            this.sendError(request.id, -32601, `Method not found: ${request.method}`);
            return;
        }
        try {
            const result = await handler(request.params);
            this.sendResult(request.id, result);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.sendError(request.id, -32603, message);
        }
    }
    handleResponse(response) {
        const pending = this.pendingRequests.get(response.id);
        if (!pending) {
            return;
        }
        this.pendingRequests.delete(response.id);
        if (response.error) {
            pending.reject(new Error(response.error.message));
        }
        else {
            pending.resolve(response.result);
        }
    }
    async handleNotification(notification) {
        const handler = this.notificationHandlers.get(notification.method);
        if (handler) {
            handler(notification.params);
        }
    }
    send(message) {
        if (this.config.debug) {
            console.log('Sending:', JSON.stringify(message, null, 2));
        }
        if (this.onSendMessage) {
            this.onSendMessage(message);
        }
    }
    sendResult(id, result) {
        this.send({
            jsonrpc: '2.0',
            id,
            result,
        });
    }
    sendError(id, code, message, data) {
        this.send({
            jsonrpc: '2.0',
            id,
            error: { code, message, data },
        });
    }
    // ============ Request Handlers ============
    handleInitialize(params) {
        this.state = 'initializing';
        this.clientCapabilities = params.capabilities;
        return getInitializeResult(this.config.version);
    }
    handleInitialized() {
        this.state = 'initialized';
        this.logMessage('info', `${this.config.name} v${this.config.version} initialized`);
    }
    handleShutdown() {
        this.state = 'shutdown';
        return null;
    }
    handleExit() {
        process.exit(this.state === 'shutdown' ? 0 : 1);
    }
    handleTextDocumentDidOpen(params) {
        const { uri, languageId, version, text } = params.textDocument;
        this.handlers.handleDidOpen(uri, text, version, languageId);
        // Publish initial diagnostics
        this.publishDiagnostics(uri);
    }
    handleTextDocumentDidChange(params) {
        const { uri, version } = params.textDocument;
        const content = params.contentChanges[params.contentChanges.length - 1]?.text;
        if (content !== undefined) {
            this.handlers.handleDidChange(uri, content, version);
        }
    }
    handleTextDocumentDidClose(params) {
        this.handlers.handleDidClose(params.textDocument.uri);
    }
    handleTextDocumentDidSave(params) {
        // Re-publish diagnostics on save
        this.publishDiagnostics(params.textDocument.uri);
    }
    async handleTextDocumentCompletion(params) {
        return this.handlers.handleCompletion(params);
    }
    async handleTextDocumentHover(params) {
        return this.handlers.handleHover(params);
    }
    async handleTextDocumentSignatureHelp(params) {
        return this.handlers.handleSignatureHelp(params);
    }
    async handleTextDocumentCodeAction(params) {
        return this.handlers.handleCodeAction(params);
    }
    async handleTextDocumentInlineCompletion(params) {
        return this.handlers.handleInlineCompletion(params);
    }
    async handleExecuteCommand(params) {
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
export function createLanguageServer(config) {
    return new PhilJSLanguageServer(config);
}
/**
 * Start an LSP server on stdin/stdout
 *
 * @param provider - AI provider
 * @param options - Server options
 * @returns Server instance
 */
export function startStdioServer(provider, options) {
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
            if (headerEnd === -1)
                break;
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
            if (buffer.length < messageEnd)
                break;
            // Extract and parse message
            const messageJson = buffer.slice(messageStart, messageEnd);
            buffer = buffer.slice(messageEnd);
            try {
                const message = JSON.parse(messageJson);
                server.processMessage(message);
            }
            catch (error) {
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
//# sourceMappingURL=server.js.map