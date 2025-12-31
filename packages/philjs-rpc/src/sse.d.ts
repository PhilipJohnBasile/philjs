/**
 * Server-Sent Events (SSE) transport for philjs-rpc subscriptions.
 * Provides a fallback when WebSocket is unavailable with the same API.
 */
import type { UseSubscriptionOptions, UseSubscriptionResult, SubscriptionObserver, SubscriptionEventMap } from './types.js';
export interface SSEConnectionConfig {
    /** SSE endpoint URL */
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
    /** Custom headers */
    headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
    /** Custom fetch implementation */
    fetch?: typeof fetch;
    /** Heartbeat timeout in ms (close connection if no message received) */
    heartbeatTimeout?: number;
    /** Whether to include credentials in requests */
    withCredentials?: boolean;
}
export interface SSEMessage {
    type: 'data' | 'error' | 'complete' | 'heartbeat';
    id: string;
    data?: unknown;
    error?: {
        code: string;
        message: string;
    };
}
export declare class SSEConnection {
    private config;
    private reconnectAttempts;
    private reconnectTimeout;
    private heartbeatTimeout;
    private subscriptions;
    private eventSources;
    private connectionState;
    private eventHandlers;
    private abortControllers;
    constructor(config: SSEConnectionConfig);
    /**
     * Connect to the SSE server (no-op for SSE, connection is per-subscription).
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the SSE server.
     */
    disconnect(): void;
    /**
     * Subscribe to a procedure using SSE.
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
     * Create an EventSource for a subscription.
     */
    private createEventSource;
    /**
     * Handle incoming SSE message.
     */
    private handleMessage;
    /**
     * Attempt to reconnect a subscription.
     */
    private attemptReconnect;
    /**
     * Reset heartbeat timeout.
     */
    private resetHeartbeatTimeout;
    /**
     * Get headers for requests.
     */
    private getHeaders;
}
/**
 * Create a subscription hook for SSE-based real-time data.
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
export declare function createUseSSESubscription<TInput, TOutput>(connection: SSEConnection, path: string): (input: TInput, options?: UseSubscriptionOptions<TOutput>) => UseSubscriptionResult<TOutput>;
/**
 * Check if SSE is supported in the current environment.
 */
export declare function isSSESupported(): boolean;
/**
 * Create a transport that automatically selects between WebSocket and SSE.
 */
export declare function createAutoTransport(config: {
    wsUrl: string;
    sseUrl: string;
    preferWebSocket?: boolean;
}): {
    connection: any;
    type: 'websocket' | 'sse';
};
//# sourceMappingURL=sse.d.ts.map