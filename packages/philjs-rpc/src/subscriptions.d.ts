/**
 * WebSocket-based subscriptions for philjs-rpc.
 * Provides real-time data streaming with automatic reconnection and lifecycle hooks.
 */
import type { UseSubscriptionOptions, UseSubscriptionResult, SubscriptionObserver, SubscriptionEventMap } from './types.js';
export interface WebSocketConnectionConfig {
    /** WebSocket URL */
    url: string;
    /** Reconnection settings */
    reconnect?: {
        /** Enable automatic reconnection */
        enabled?: boolean;
        /** Maximum number of reconnection attempts */
        maxAttempts?: number;
        /** Delay between reconnection attempts in ms */
        delay?: number;
        /** Maximum delay between reconnection attempts in ms */
        maxDelay?: number;
        /** Backoff multiplier */
        backoffMultiplier?: number;
    };
    /** Connection timeout in ms */
    connectionTimeout?: number;
    /** Heartbeat interval in ms */
    heartbeatInterval?: number;
    /** Custom WebSocket implementation */
    WebSocketImpl?: typeof WebSocket;
    /** Custom headers (for node environments) */
    headers?: Record<string, string>;
    /** Protocols */
    protocols?: string | string[];
}
export interface WebSocketMessage {
    type: 'subscribe' | 'unsubscribe' | 'data' | 'error' | 'complete' | 'ping' | 'pong';
    id?: string;
    path?: string;
    input?: unknown;
    data?: unknown;
    error?: {
        code: string;
        message: string;
    };
}
export declare class WebSocketConnection {
    private ws;
    private config;
    private reconnectAttempts;
    private reconnectTimeout;
    private heartbeatInterval;
    private subscriptions;
    private connectionState;
    private messageHandlers;
    private eventHandlers;
    constructor(config: WebSocketConnectionConfig);
    /**
     * Connect to the WebSocket server.
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the WebSocket server.
     */
    disconnect(): void;
    /**
     * Subscribe to a procedure.
     */
    subscribe<TInput, TOutput>(id: string, path: string, input: TInput, observer: SubscriptionObserver<TOutput>): () => void;
    /**
     * Unsubscribe from a procedure.
     */
    private unsubscribe;
    /**
     * Get connection state.
     */
    getState(): 'connecting' | 'connected' | 'disconnected' | 'error';
    /**
     * Check if connected.
     */
    isConnected(): boolean;
    /**
     * Add event listener.
     */
    on<K extends keyof SubscriptionEventMap>(event: K, handler: (data: SubscriptionEventMap[K]) => void): () => void;
    /**
     * Emit event.
     */
    private emit;
    /**
     * Send a message to the server.
     */
    private sendMessage;
    /**
     * Handle incoming message.
     */
    private handleMessage;
    /**
     * Attempt to reconnect.
     */
    private attemptReconnect;
    /**
     * Resubscribe to all active subscriptions.
     */
    private resubscribeAll;
    /**
     * Start heartbeat to keep connection alive.
     */
    private startHeartbeat;
    /**
     * Stop heartbeat.
     */
    private stopHeartbeat;
}
/**
 * Create a subscription hook for real-time data.
 *
 * @example
 * ```ts
 * const messages = client.chat.onMessage.useSubscription(
 *   { roomId: 'general' },
 *   {
 *     onData: (msg) => console.log('New message:', msg),
 *     onError: (err) => console.error('Subscription error:', err),
 *   }
 * );
 * ```
 */
export declare function createUseSubscription<TInput, TOutput>(connection: WebSocketConnection, path: string): (input: TInput, options?: UseSubscriptionOptions<TOutput>) => UseSubscriptionResult<TOutput>;
export interface SubscriptionStateManager {
    /** Save subscription state */
    save(key: string, state: unknown): void;
    /** Load subscription state */
    load(key: string): unknown | undefined;
    /** Clear subscription state */
    clear(key: string): void;
    /** Clear all subscription states */
    clearAll(): void;
}
/**
 * Create a localStorage-based state manager.
 */
export declare function createLocalStorageStateManager(prefix?: string): SubscriptionStateManager;
/**
 * Create an in-memory state manager.
 */
export declare function createMemoryStateManager(): SubscriptionStateManager;
//# sourceMappingURL=subscriptions.d.ts.map