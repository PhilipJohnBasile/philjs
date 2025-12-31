/**
 * PhilJS LiveView - Socket Protocol Implementation
 */
import type { JoinPayload, LiveViewEvent } from './types.js';
export declare const MESSAGE_TYPES: {
    readonly PHX_JOIN: "phx_join";
    readonly PHX_LEAVE: "phx_leave";
    readonly PHX_REPLY: "phx_reply";
    readonly PHX_ERROR: "phx_error";
    readonly PHX_CLOSE: "phx_close";
    readonly EVENT: "event";
    readonly DIFF: "diff";
    readonly HEARTBEAT: "heartbeat";
    readonly LIVE_PATCH: "live_patch";
    readonly LIVE_REDIRECT: "live_redirect";
    readonly PUSH_PATCH: "push_patch";
    readonly PUSH_REDIRECT: "push_redirect";
};
export interface Channel {
    topic: string;
    state: 'closed' | 'joining' | 'joined' | 'leaving' | 'errored';
    joinRef: number;
    onMessage: (message: any) => void;
    onClose: () => void;
    onError: (error: Error) => void;
}
export declare function createChannel(topic: string): Channel;
export interface SocketConnectionOptions {
    url: string;
    params?: Record<string, any> | undefined;
    heartbeatIntervalMs?: number | undefined;
    reconnectAfterMs?: ((tries: number) => number) | undefined;
    timeout?: number | undefined;
    onOpen?: (() => void) | undefined;
    onClose?: (() => void) | undefined;
    onError?: ((error: Event) => void) | undefined;
}
export declare class SocketConnection {
    private ws;
    private url;
    private params;
    private heartbeatInterval;
    private heartbeatTimer?;
    private reconnectTimer?;
    private reconnectTries;
    private reconnectAfterMs;
    private timeout;
    private messageRef;
    private pendingRefs;
    private channels;
    private callbacks;
    isConnected: boolean;
    constructor(options: SocketConnectionOptions);
    connect(): void;
    disconnect(): void;
    channel(topic: string): Channel;
    join(topic: string, payload: JoinPayload): Promise<any>;
    leave(topic: string): void;
    push(topic: string, event: string, payload: any, ref?: string): void;
    pushWithReply(topic: string, event: string, payload: any, ref?: string): Promise<any>;
    private buildUrl;
    private handleMessage;
    private send;
    private encode;
    private decode;
    private makeRef;
    private startHeartbeat;
    private stopHeartbeat;
    private scheduleReconnect;
}
export declare function serializeEvent(eventType: string, target: HTMLElement, value?: any): LiveViewEvent;
export declare function serializeKeyEvent(eventType: string, event: KeyboardEvent, target: HTMLElement): LiveViewEvent;
export declare function generateViewTopic(viewName: string, sessionId: string): string;
export declare function generateComponentTopic(componentId: string, viewTopic: string): string;
//# sourceMappingURL=live-socket.d.ts.map