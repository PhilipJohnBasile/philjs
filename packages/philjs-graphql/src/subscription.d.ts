/**
 * PhilJS GraphQL Subscriptions
 *
 * Provides robust WebSocket-based GraphQL subscriptions with:
 * - graphql-ws protocol support
 * - Automatic reconnection with exponential backoff
 * - Signal-based subscription state management
 * - Connection pooling for multiple subscriptions
 * - Heartbeat/keepalive support
 */
import { type Signal, type Memo } from 'philjs-core';
import type { DocumentNode } from 'graphql';
export interface SubscriptionConfig {
    /** WebSocket endpoint URL */
    url: string;
    /** Connection timeout in milliseconds (default: 5000) */
    connectionTimeout?: number;
    /** Maximum reconnection attempts (default: 5) */
    maxReconnectAttempts?: number;
    /** Base delay for reconnection in ms (default: 1000) */
    reconnectDelay?: number;
    /** Exponential backoff multiplier (default: 2) */
    backoffMultiplier?: number;
    /** Enable keepalive pings (default: true) */
    keepalive?: boolean;
    /** Keepalive interval in ms (default: 30000) */
    keepaliveInterval?: number;
    /** Custom headers for WebSocket connection */
    connectionParams?: () => Record<string, any> | Promise<Record<string, any>>;
    /** Lazy connection - only connect when first subscription is created */
    lazy?: boolean;
}
export interface SubscriptionOptions<TData = any, TVariables = any> {
    /** GraphQL subscription document */
    query: string | DocumentNode;
    /** Subscription variables */
    variables?: TVariables;
    /** Operation name (optional) */
    operationName?: string;
    /** Callback for subscription data */
    onData?: (data: TData) => void;
    /** Callback for subscription errors */
    onError?: (error: Error) => void;
    /** Callback for subscription completion */
    onComplete?: () => void;
}
export interface SubscriptionState<TData = any> {
    /** Current subscription data */
    data: TData | null;
    /** Subscription error if any */
    error: Error | null;
    /** Whether subscription is active */
    active: boolean;
    /** Connection state */
    connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
}
/**
 * GraphQL WebSocket Subscription Client
 * Implements the graphql-ws protocol
 */
export declare class SubscriptionClient {
    private config;
    private ws;
    private subscriptions;
    private reconnectAttempt;
    private reconnectTimer;
    private keepaliveTimer;
    private connectionState;
    private messageQueue;
    private subscriptionIdCounter;
    constructor(config: SubscriptionConfig);
    /**
     * Get current connection state
     */
    getConnectionState(): Signal<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>;
    /**
     * Create a new subscription
     */
    subscribe<TData = any, TVariables = any>(options: SubscriptionOptions<TData, TVariables>): SubscriptionHandle<TData>;
    /**
     * Unsubscribe from a subscription
     */
    unsubscribe(id: string): void;
    /**
     * Connect to WebSocket
     */
    private connect;
    /**
     * Disconnect from WebSocket
     */
    private disconnect;
    /**
     * Handle WebSocket open
     */
    private handleOpen;
    /**
     * Handle WebSocket message
     */
    private handleMessage;
    /**
     * Handle connection acknowledgment
     */
    private handleConnectionAck;
    /**
     * Handle subscription data
     */
    private handleNext;
    /**
     * Handle subscription error
     */
    private handleSubscriptionError;
    /**
     * Handle subscription completion
     */
    private handleComplete;
    /**
     * Handle WebSocket error
     */
    private handleError;
    /**
     * Handle WebSocket close
     */
    private handleClose;
    /**
     * Handle connection timeout
     */
    private handleConnectionTimeout;
    /**
     * Reconnect with exponential backoff
     */
    private reconnect;
    /**
     * Start keepalive pings
     */
    private startKeepalive;
    /**
     * Send a message to the WebSocket
     */
    private send;
    /**
     * Send subscribe message
     */
    private sendSubscribe;
    /**
     * Generate unique subscription ID
     */
    private generateSubscriptionId;
    /**
     * Convert DocumentNode to string if needed
     */
    private documentToString;
    /**
     * Close all subscriptions and disconnect
     */
    close(): void;
}
/**
 * Subscription handle returned to consumers
 */
export declare class SubscriptionHandle<TData = any> {
    private client;
    private id;
    state: Signal<SubscriptionState<TData>>;
    constructor(client: SubscriptionClient, id: string, state: Signal<SubscriptionState<TData>>);
    /**
     * Get current subscription data
     */
    get data(): Memo<TData | null>;
    /**
     * Get current subscription error
     */
    get error(): Memo<Error | null>;
    /**
     * Check if subscription is active
     */
    get active(): Memo<boolean>;
    /**
     * Get connection state
     */
    get connectionState(): Memo<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>;
    /**
     * Unsubscribe and clean up
     */
    unsubscribe(): void;
}
/**
 * Create a subscription client
 */
export declare function createSubscriptionClient(config: SubscriptionConfig): SubscriptionClient;
/**
 * Hook for using subscriptions with reactive state
 */
export declare function useSubscription<TData = any, TVariables = any>(client: SubscriptionClient, options: SubscriptionOptions<TData, TVariables>): {
    data: Memo<TData | null>;
    error: Memo<Error | null>;
    active: Memo<boolean>;
    connectionState: Memo<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>;
    unsubscribe: () => void;
};
//# sourceMappingURL=subscription.d.ts.map