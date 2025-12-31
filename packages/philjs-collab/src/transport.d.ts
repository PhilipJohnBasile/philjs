/**
 * Transport Layer for PhilJS Collab
 *
 * Provides WebSocket and WebRTC transport for real-time collaboration
 */
export type MessageType = 'sync' | 'awareness' | 'presence' | 'cursor' | 'operation' | 'ack' | 'error' | 'ping' | 'pong';
export interface CollabMessage<T = unknown> {
    type: MessageType;
    roomId: string;
    clientId: string;
    payload: T;
    timestamp: number;
    version?: number;
}
export interface TransportConfig {
    url: string;
    roomId: string;
    clientId: string;
    reconnect?: boolean;
    reconnectDelay?: number;
    maxReconnectAttempts?: number;
    pingInterval?: number;
    messageQueueSize?: number;
}
export interface TransportEvents {
    connect: () => void;
    disconnect: (reason: string) => void;
    message: (message: CollabMessage) => void;
    error: (error: Error) => void;
    reconnecting: (attempt: number) => void;
}
export type TransportEventHandler<K extends keyof TransportEvents> = TransportEvents[K];
/**
 * WebSocket Transport for collaboration
 */
export declare class WebSocketTransport {
    private ws;
    private config;
    private handlers;
    private messageQueue;
    private reconnectAttempts;
    private pingTimer;
    private reconnectTimer;
    private connected;
    constructor(config: TransportConfig);
    /**
     * Connect to the server
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the server
     */
    disconnect(): void;
    /**
     * Send a message
     */
    send<T>(type: MessageType, payload: T): void;
    /**
     * Subscribe to events
     */
    on<K extends keyof TransportEvents>(event: K, handler: TransportEventHandler<K>): () => void;
    /**
     * Check if connected
     */
    isConnected(): boolean;
    private emit;
    private startPing;
    private stopPing;
    private scheduleReconnect;
    private flushQueue;
}
/**
 * Broadcast Channel Transport for same-origin tabs
 */
export declare class BroadcastTransport {
    private channel;
    private config;
    private handlers;
    constructor(config: {
        roomId: string;
        clientId: string;
    });
    send<T>(type: MessageType, payload: T): void;
    on<K extends keyof TransportEvents>(event: K, handler: TransportEventHandler<K>): () => void;
    close(): void;
    private emit;
}
/**
 * Create a WebSocket transport
 */
export declare function createWebSocketTransport(config: TransportConfig): WebSocketTransport;
/**
 * Create a Broadcast Channel transport
 */
export declare function createBroadcastTransport(config: {
    roomId: string;
    clientId: string;
}): BroadcastTransport;
/**
 * Generate a unique client ID
 */
export declare function generateClientId(): string;
//# sourceMappingURL=transport.d.ts.map