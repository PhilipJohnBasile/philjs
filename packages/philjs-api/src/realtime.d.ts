/**
 * Real-time Communication - WebSocket & SSE Support
 *
 * Provides tRPC-style real-time subscriptions with WebSocket and SSE fallback
 */
import { type Signal, type Memo } from '@philjs/core';
export type RealtimeTransport = 'websocket' | 'sse' | 'polling';
export interface RealtimeMessage<T = any> {
    id: string;
    type: 'data' | 'error' | 'complete' | 'ping' | 'pong' | 'subscribe' | 'unsubscribe';
    channel: string;
    data?: T;
    error?: string;
    timestamp: number;
}
export interface SubscriptionOptions<T = any> {
    /**
     * Preferred transport (will fallback if unavailable)
     */
    transport?: RealtimeTransport;
    /**
     * Reconnect on disconnect
     */
    reconnect?: boolean;
    /**
     * Reconnect delay in ms
     */
    reconnectDelay?: number;
    /**
     * Max reconnect attempts
     */
    maxReconnectAttempts?: number;
    /**
     * Callback for new data
     */
    onData?: (data: T) => void;
    /**
     * Callback for errors
     */
    onError?: (error: Error) => void;
    /**
     * Callback for completion
     */
    onComplete?: () => void;
    /**
     * Callback for connection state changes
     */
    onStateChange?: (state: ConnectionState) => void;
}
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';
export interface Subscription<T = any> {
    /**
     * Current connection state
     */
    state: Signal<ConnectionState>;
    /**
     * Latest data
     */
    data: Signal<T | null>;
    /**
     * Latest error
     */
    error: Signal<Error | null>;
    /**
     * Is connected
     */
    isConnected: Memo<boolean>;
    /**
     * Unsubscribe
     */
    unsubscribe: () => void;
    /**
     * Send data to server (for WebSocket only)
     */
    send: (data: any) => void;
}
export declare class WebSocketClient {
    private ws;
    private url;
    private subscriptions;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private shouldReconnect;
    private pingInterval;
    constructor(url: string, options?: {
        reconnect?: boolean;
        reconnectDelay?: number;
        maxReconnectAttempts?: number;
    });
    connect(): Promise<void>;
    private reconnect;
    private startPing;
    private stopPing;
    subscribe(channel: string, callback: (message: RealtimeMessage) => void): () => void;
    send(message: Partial<RealtimeMessage>): void;
    private handleMessage;
    close(): void;
    get readyState(): number;
}
export declare class SSEClient {
    private eventSources;
    private baseUrl;
    constructor(baseUrl: string);
    subscribe(channel: string, callback: (message: RealtimeMessage) => void): () => void;
    close(): void;
}
export declare class RealtimeManager {
    private wsClient;
    private sseClient;
    private preferredTransport;
    private wsUrl;
    private sseUrl;
    constructor(options: {
        wsUrl: string;
        sseUrl: string;
        transport?: RealtimeTransport;
    });
    connect(): Promise<void>;
    subscribe<T = any>(channel: string, options?: SubscriptionOptions<T>): Subscription<T>;
    close(): void;
}
export declare function initRealtime(options: {
    wsUrl: string;
    sseUrl: string;
    transport?: RealtimeTransport;
}): RealtimeManager;
/**
 * Subscribe to a realtime channel
 *
 * @example
 * ```tsx
 * const messages = useSubscription<Message>('chat/room-123', {
 *   onData: (message) => {
 *     console.log('New message:', message);
 *   }
 * });
 *
 * return (
 *   <div>
 *     {messages.data() && <Message data={messages.data()} />}
 *     {messages.error() && <Error error={messages.error()} />}
 *   </div>
 * );
 * ```
 */
export declare function useSubscription<T = any>(channel: string, options?: SubscriptionOptions<T>): Subscription<T>;
/**
 * Create SSE response
 */
export declare function createSSEResponse(options: {
    onSubscribe: (send: (data: any) => void) => () => void;
}): Response;
/**
 * WebSocket upgrade helper
 */
export interface WebSocketHandler {
    onConnect?: (socket: WebSocket) => void;
    onMessage?: (socket: WebSocket, message: any) => void;
    onClose?: (socket: WebSocket) => void;
    onError?: (socket: WebSocket, error: Error) => void;
}
export declare function handleWebSocketUpgrade(request: Request, handler: WebSocketHandler): Response;
//# sourceMappingURL=realtime.d.ts.map