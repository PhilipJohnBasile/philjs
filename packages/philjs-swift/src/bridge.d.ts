/**
 * Swift WebView Bridge for PhilJS
 *
 * Bidirectional JS <-> Swift communication bridge using JSON-RPC protocol
 */
import type { WebViewBridgeConfig, NativeModuleConfig } from './types.js';
/**
 * Message types for the bridge protocol
 */
export type BridgeMessageType = 'call' | 'event' | 'response' | 'error';
/**
 * Bridge message interface for JSON-RPC communication
 */
export interface BridgeMessage<T = unknown> {
    /** Unique message ID for request/response correlation */
    id: string;
    /** Message type */
    type: BridgeMessageType;
    /** Method name (for 'call' and 'event' types) */
    method?: string | undefined;
    /** Parameters (for 'call' and 'event' types) */
    params?: T | undefined;
    /** Result data (for 'response' type) */
    result?: T | undefined;
    /** Error information (for 'error' type) */
    error?: BridgeError | undefined;
}
/**
 * Bridge error structure
 */
export interface BridgeError {
    code: number;
    message: string;
    data?: unknown | undefined;
}
/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (data: T) => void;
/**
 * Runtime bridge for JS <-> Swift communication
 * Implements Disposable for proper cleanup
 */
export declare class BridgeRuntime implements Disposable {
    private pendingCalls;
    private eventHandlers;
    private messageIdCounter;
    private disposed;
    private readonly defaultTimeout;
    /** Callback for sending messages to Swift (must be set by platform integration) */
    onSendToNative?: ((message: string) => void) | undefined;
    constructor(options?: {
        defaultTimeout?: number;
    });
    /**
     * Generate unique message ID
     */
    private generateId;
    /**
     * Call a native Swift method and wait for response
     */
    call<T = unknown, P = unknown>(method: string, params?: P, options?: {
        timeout?: number;
    }): Promise<T>;
    /**
     * Subscribe to an event
     */
    on<T = unknown>(event: string, handler: EventHandler<T>): () => void;
    /**
     * Unsubscribe from an event
     */
    off<T = unknown>(event: string, handler: EventHandler<T>): void;
    /**
     * Subscribe to an event once (auto-unsubscribes after first emission)
     */
    once<T = unknown>(event: string, handler: EventHandler<T>): () => void;
    /**
     * Emit an event to Swift
     */
    emit<T = unknown>(event: string, data?: T): void;
    /**
     * Handle incoming message from Swift
     */
    handleMessage(messageJson: string): void;
    /**
     * Handle response message
     */
    private handleResponse;
    /**
     * Handle error message
     */
    private handleError;
    /**
     * Handle event message from Swift
     */
    private handleEvent;
    /**
     * Handle call from Swift (request-response pattern)
     */
    private handleNativeCall;
    /**
     * Register a handler for native calls
     */
    registerHandler<T = unknown, R = unknown>(method: string, handler: (params: T) => R | Promise<R>): () => void;
    /**
     * Send response back to Swift
     */
    private sendResponse;
    /**
     * Send error back to Swift
     */
    private sendError;
    /**
     * Send message to native Swift
     */
    private sendToNative;
    /**
     * Dispose the bridge runtime and clean up resources
     */
    [Symbol.dispose](): void;
    /**
     * Dispose the bridge runtime and clean up resources
     */
    dispose(): void;
}
/**
 * Generate Swift WebView bridge code with full bidirectional communication
 */
export declare function generateWebViewBridge(config: WebViewBridgeConfig): string;
/**
 * Generate native module Swift code with async/await handlers
 */
export declare function generateNativeModule(config: NativeModuleConfig): string;
/**
 * Generate TypeScript bindings for a Swift module
 */
export declare function generateTypeScriptBindings(config: NativeModuleConfig): string;
/**
 * Generate complete bridge setup code for both platforms
 */
export declare function generateBridgeSetup(config: {
    modules: NativeModuleConfig[];
    webViewConfig: WebViewBridgeConfig;
}): {
    swift: string;
    typescript: string;
};
/**
 * Create a new BridgeRuntime instance
 */
export declare function createBridgeRuntime(options?: {
    defaultTimeout?: number;
}): BridgeRuntime;
//# sourceMappingURL=bridge.d.ts.map