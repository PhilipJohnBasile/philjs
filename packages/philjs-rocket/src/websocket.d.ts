/**
 * PhilJS Rocket WebSocket
 *
 * WebSocket support for LiveView in Rocket.
 */
import type { WebSocketOptions, WebSocketConnection, LiveViewHandler, LiveViewMessage, LiveViewPatch } from './types.js';
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
    /**
     * Set maximum message size
     */
    maxMessageSize(bytes: number): this;
    /**
     * Set maximum frame size
     */
    maxFrameSize(bytes: number): this;
    /**
     * Enable/disable compression
     */
    compression(enabled: boolean): this;
    /**
     * Set heartbeat interval
     */
    heartbeatInterval(ms: number): this;
    /**
     * Set connection timeout
     */
    timeout(ms: number): this;
    /**
     * Get configuration
     */
    build(): Required<WebSocketOptions>;
    /**
     * Generate Rust configuration code
     */
    toRustCode(): string;
}
/**
 * LiveView state container
 */
export interface LiveViewState<S> {
    state: S;
    mountedAt: number;
    lastActivity: number;
    patchCount: number;
}
/**
 * LiveView WebSocket handler builder
 */
export declare class LiveViewSocketBuilder<S> {
    private handler;
    private config;
    /**
     * Set connection handler
     */
    onConnect(handler: (socket: WebSocketConnection) => S | Promise<S>): this;
    /**
     * Set message handler
     */
    onMessage(handler: (message: LiveViewMessage, state: S, socket: WebSocketConnection) => S | Promise<S>): this;
    /**
     * Set close handler
     */
    onClose(handler: (state: S) => void | Promise<void>): this;
    /**
     * Set render function
     */
    render(fn: (state: S) => string): this;
    /**
     * Configure WebSocket options
     */
    configure(options: WebSocketOptions): this;
    /**
     * Build the handler
     */
    build(): LiveViewHandler<S>;
    /**
     * Generate Rust handler code
     */
    toRustCode(): string;
}
/**
 * LiveView message types
 */
export type LiveViewClientMessage = {
    type: 'phx_join';
    topic: string;
    payload: unknown;
} | {
    type: 'phx_leave';
    topic: string;
} | {
    type: 'event';
    topic: string;
    event: string;
    payload: unknown;
} | {
    type: 'heartbeat';
};
/**
 * LiveView server message types
 */
export type LiveViewServerMessage = {
    type: 'phx_reply';
    ref: string;
    status: 'ok' | 'error';
    response: unknown;
} | {
    type: 'render';
    html: string;
} | {
    type: 'patch';
    patches: LiveViewPatch[];
} | {
    type: 'redirect';
    to: string;
} | {
    type: 'error';
    message: string;
};
/**
 * Create a LiveView message encoder
 */
export declare function createMessageEncoder(): {
    /**
     * Encode a join message
     */
    join(topic: string, payload: unknown): string;
    /**
     * Encode a leave message
     */
    leave(topic: string): string;
    /**
     * Encode an event message
     */
    event(topic: string, event: string, payload: unknown): string;
    /**
     * Encode a heartbeat message
     */
    heartbeat(): string;
};
/**
 * Create a LiveView message decoder
 */
export declare function createMessageDecoder(): {
    /**
     * Decode a server message
     */
    decode(data: string): LiveViewServerMessage | null;
    /**
     * Check if message is a render
     */
    isRender(msg: LiveViewServerMessage): msg is {
        type: "render";
        html: string;
    };
    /**
     * Check if message is a patch
     */
    isPatch(msg: LiveViewServerMessage): msg is {
        type: "patch";
        patches: LiveViewPatch[];
    };
    /**
     * Check if message is a redirect
     */
    isRedirect(msg: LiveViewServerMessage): msg is {
        type: "redirect";
        to: string;
    };
};
/**
 * Broadcast channel for pub/sub messaging
 */
export interface BroadcastChannel {
    /** Channel name/topic */
    name: string;
    /** Subscribe to the channel */
    subscribe: (handler: (message: unknown) => void) => () => void;
    /** Broadcast a message */
    broadcast: (message: unknown) => void;
    /** Get subscriber count */
    subscriberCount: () => number;
}
/**
 * Create a broadcast channel manager
 */
export declare class BroadcastManager {
    private channels;
    /**
     * Get or create a channel
     */
    channel(name: string): BroadcastChannel;
    /**
     * Broadcast to a channel
     */
    broadcast(channelName: string, message: unknown): void;
    /**
     * Get all channel names
     */
    getChannelNames(): string[];
    /**
     * Generate Rust broadcast code
     */
    static toRustCode(): string;
}
/**
 * Presence entry
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
    /**
     * Track a join
     */
    track(key: string, entry: Omit<PresenceEntry, 'joinedAt'>): void;
    /**
     * Untrack a leave
     */
    untrack(key: string, id: string): void;
    /**
     * Get presence for a key
     */
    get(key: string): PresenceEntry[];
    /**
     * List all presences
     */
    list(): PresenceState;
    /**
     * Set join callback
     */
    onJoinCallback(callback: (key: string, current: PresenceEntry[] | undefined, newPresence: PresenceEntry) => void): void;
    /**
     * Set leave callback
     */
    onLeaveCallback(callback: (key: string, current: PresenceEntry[], leftPresence: PresenceEntry) => void): void;
    /**
     * Generate Rust presence code
     */
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