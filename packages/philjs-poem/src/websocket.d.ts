/**
 * PhilJS Poem WebSocket
 *
 * WebSocket support for LiveView in Poem.
 */
import type { WebSocketOptions, WebSocketConnection, LiveViewHandler, LiveViewMessage } from './types.js';
/**
 * Default WebSocket options
 */
export declare const DEFAULT_WS_OPTIONS: Required<WebSocketOptions>;
/**
 * WebSocket configuration builder
 */
export declare class WebSocketConfig {
    private options;
    constructor(options?: WebSocketOptions);
    maxMessageSize(bytes: number): this;
    maxFrameSize(bytes: number): this;
    compression(enabled: boolean): this;
    heartbeatInterval(ms: number): this;
    timeout(ms: number): this;
    build(): Required<WebSocketOptions>;
    toRustCode(): string;
}
/**
 * LiveView WebSocket handler builder
 */
export declare class LiveViewSocketBuilder<S> {
    private handler;
    private config;
    onConnect(handler: (socket: WebSocketConnection) => S | Promise<S>): this;
    onMessage(handler: (message: LiveViewMessage, state: S, socket: WebSocketConnection) => S | Promise<S>): this;
    onClose(handler: (state: S) => void | Promise<void>): this;
    render(fn: (state: S) => string): this;
    configure(options: WebSocketOptions): this;
    build(): LiveViewHandler<S>;
    toRustCode(): string;
}
/**
 * Broadcast channel for pub/sub messaging
 */
export interface BroadcastChannel {
    name: string;
    subscribe: (handler: (message: unknown) => void) => () => void;
    broadcast: (message: unknown) => void;
    subscriberCount: () => number;
}
/**
 * Broadcast manager for real-time updates
 */
export declare class BroadcastManager {
    private channels;
    channel(name: string): BroadcastChannel;
    broadcast(channelName: string, message: unknown): void;
    getChannelNames(): string[];
    static toRustCode(): string;
}
/**
 * Presence entry for tracking connected users
 */
export interface PresenceEntry {
    id: string;
    phx_ref: string;
    meta: Record<string, unknown>;
    joinedAt: number;
}
/**
 * Presence state
 */
export type PresenceState = Map<string, PresenceEntry[]>;
/**
 * Presence tracker for LiveView
 */
export declare class PresenceTracker {
    private state;
    private onJoin?;
    private onLeave?;
    track(key: string, entry: Omit<PresenceEntry, 'joinedAt'>): void;
    untrack(key: string, id: string): void;
    get(key: string): PresenceEntry[];
    list(): PresenceState;
    onJoinCallback(callback: (key: string, current: PresenceEntry[] | undefined, newPresence: PresenceEntry) => void): void;
    onLeaveCallback(callback: (key: string, current: PresenceEntry[], leftPresence: PresenceEntry) => void): void;
    static toRustCode(): string;
}
/**
 * Create a WebSocket configuration builder
 */
export declare function configureWebSocket(options?: WebSocketOptions): WebSocketConfig;
/**
 * Create a LiveView socket builder
 */
export declare function createLiveViewSocket<S>(): LiveViewSocketBuilder<S>;
/**
 * Create a broadcast manager
 */
export declare function createBroadcastManager(): BroadcastManager;
/**
 * Create a presence tracker
 */
export declare function createPresenceTracker(): PresenceTracker;
//# sourceMappingURL=websocket.d.ts.map