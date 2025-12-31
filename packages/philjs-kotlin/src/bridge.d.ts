/**
 * Kotlin WebView Bridge for PhilJS
 *
 * Provides bidirectional JS <-> Kotlin communication via JSON-RPC protocol.
 */
import type { WebViewBridgeConfig, NativeModuleConfig } from './types.js';
/**
 * Message types for bridge communication
 */
export type BridgeMessageType = 'call' | 'event' | 'response' | 'error';
/**
 * Bridge message interface for JSON-RPC communication
 */
export interface BridgeMessage<T = unknown> {
    /** Unique message identifier for request/response correlation */
    id: string;
    /** Message type */
    type: BridgeMessageType;
    /** Method name for call messages */
    method?: string;
    /** Parameters for call/event messages */
    params?: T;
    /** Result for response messages */
    result?: T;
    /** Error details for error messages */
    error?: BridgeError;
}
/**
 * Error structure for bridge errors
 */
export interface BridgeError {
    code: number;
    message: string;
    data?: unknown;
}
/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (data: T) => void;
/**
 * Bridge configuration options
 */
export interface BridgeRuntimeConfig {
    /** Default timeout for calls in milliseconds */
    defaultTimeout?: number;
    /** Handler for sending messages to Kotlin */
    sendMessage?: (message: string) => void;
    /** Enable debug logging */
    debug?: boolean;
}
/**
 * BridgeRuntime manages bidirectional communication between JS and Kotlin.
 *
 * Features:
 * - JSON-RPC protocol implementation
 * - Promise-based call/response with timeout handling
 * - Event subscription system (on, off, once, emit)
 * - Automatic cleanup via Disposable pattern
 *
 * @example
 * ```typescript
 * const bridge = new BridgeRuntime({
 *   defaultTimeout: 5000,
 *   sendMessage: (msg) => window.PhilJSNative?.postMessage(msg)
 * });
 *
 * // Call Kotlin method
 * const result = await bridge.call<string>('getUserName', { userId: 123 });
 *
 * // Listen for Kotlin events
 * bridge.on('locationUpdate', (location) => {
 *   console.log('Location:', location);
 * });
 *
 * // Emit event to Kotlin
 * bridge.emit('userAction', { action: 'click', target: 'button' });
 * ```
 */
export declare class BridgeRuntime implements Disposable {
    private messageId;
    private readonly pendingCalls;
    private readonly eventHandlers;
    private readonly onceHandlers;
    private readonly config;
    private disposed;
    constructor(config?: BridgeRuntimeConfig);
    /**
     * Default message sender (expects PhilJSNative interface on window)
     */
    private defaultSendMessage;
    /**
     * Setup the message receiver to handle messages from Kotlin
     */
    private setupMessageReceiver;
    /**
     * Generate unique message ID
     */
    private generateId;
    /**
     * Debug logging
     */
    private log;
    /**
     * Handle incoming message from Kotlin
     */
    private handleMessage;
    /**
     * Handle response message
     */
    private handleResponse;
    /**
     * Handle error message
     */
    private handleError;
    /**
     * Handle event message from Kotlin
     */
    private handleEvent;
    /**
     * Handle call message from Kotlin (Kotlin calling JS)
     */
    private handleCall;
    /**
     * Send response back to Kotlin
     */
    private sendResponse;
    /**
     * Send error back to Kotlin
     */
    private sendError;
    /**
     * Send message to Kotlin
     */
    private sendMessage;
    /**
     * Call a Kotlin method and return a Promise with the result.
     * Uses Promise.withResolvers() for clean promise management.
     *
     * @param method - Method name to call
     * @param params - Parameters to pass
     * @param timeout - Optional timeout override
     * @returns Promise resolving to the method result
     *
     * @example
     * ```typescript
     * const user = await bridge.call<User>('getUser', { id: 123 });
     * ```
     */
    call<T>(method: string, params?: unknown, timeout?: number): Promise<T>;
    /**
     * Subscribe to an event from Kotlin.
     *
     * @param event - Event name
     * @param handler - Event handler
     * @returns Unsubscribe function
     *
     * @example
     * ```typescript
     * const unsubscribe = bridge.on('locationUpdate', (loc) => {
     *   console.log(loc.lat, loc.lng);
     * });
     * // Later: unsubscribe();
     * ```
     */
    on<T = unknown>(event: string, handler: EventHandler<T>): () => void;
    /**
     * Unsubscribe from an event.
     *
     * @param event - Event name
     * @param handler - Handler to remove
     */
    off<T = unknown>(event: string, handler: EventHandler<T>): void;
    /**
     * Subscribe to an event once. Handler is automatically removed after first call.
     *
     * @param event - Event name
     * @param handler - Event handler
     * @returns Unsubscribe function
     */
    once<T = unknown>(event: string, handler: EventHandler<T>): () => void;
    /**
     * Emit an event to Kotlin.
     *
     * @param event - Event name
     * @param data - Event data
     *
     * @example
     * ```typescript
     * bridge.emit('userClick', { buttonId: 'submit' });
     * ```
     */
    emit(event: string, data?: unknown): void;
    /**
     * Register a handler for Kotlin method calls.
     * Allows Kotlin to call JS functions.
     *
     * @param method - Method name
     * @param handler - Handler function
     * @returns Unregister function
     */
    registerHandler<T = unknown, R = unknown>(method: string, handler: (params: T) => R | Promise<R>): () => void;
    /**
     * Wait for a specific event. Returns a Promise that resolves when the event fires.
     *
     * @param event - Event name
     * @param timeout - Optional timeout
     * @returns Promise resolving to event data
     */
    waitFor<T = unknown>(event: string, timeout?: number): Promise<T>;
    /**
     * Cleanup resources. Implements Disposable interface.
     */
    [Symbol.dispose](): void;
    /**
     * Cleanup resources manually.
     */
    dispose(): void;
    /**
     * Check if the bridge is disposed
     */
    get isDisposed(): boolean;
}
/**
 * Generate Kotlin WebView bridge code with full JSON-RPC support
 */
export declare function generateWebViewBridge(config: WebViewBridgeConfig): string;
/**
 * Generate native module Kotlin code with full async support
 */
export declare function generateNativeModule(config: NativeModuleConfig): string;
/**
 * Generate complete Kotlin bridge package with all necessary files
 */
export declare function generateKotlinBridgePackage(config: {
    packageName: string;
    webViewConfig: WebViewBridgeConfig;
    modules?: NativeModuleConfig[];
}): Map<string, string>;
/**
 * Create a new BridgeRuntime instance
 */
export declare function createBridge(config?: BridgeRuntimeConfig): BridgeRuntime;
/**
 * Create a bridge and return it with using() support for automatic cleanup
 */
export declare function useBridge(config?: BridgeRuntimeConfig): BridgeRuntime;
declare global {
    interface Window {
        __philjs_bridge_receive__?: (message: string) => void;
        __philjs_bridge_initialized__?: boolean;
        PhilJSNative?: {
            postMessage: (message: string) => void;
            receiveMessage?: (message: string) => void;
        };
    }
}
//# sourceMappingURL=bridge.d.ts.map