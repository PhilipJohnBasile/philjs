/**
 * PhilJS LiveView - Server
 *
 * Server-side runtime for LiveView. Handles:
 * - Initial HTTP rendering
 * - WebSocket connections
 * - View state management
 * - PubSub broadcasting
 * - Session management
 */
import type { LiveViewServerOptions, LiveViewDefinition, LiveComponentDefinition } from './types.js';
export declare class LiveViewServer {
    private options;
    private views;
    private components;
    private sessions;
    private subscriptions;
    private differ;
    constructor(options: LiveViewServerOptions);
    /**
     * Register a LiveView at a path
     */
    register(path: string, view: LiveViewDefinition): void;
    /**
     * Register a LiveComponent
     */
    registerComponent(name: string, component: LiveComponentDefinition): void;
    /**
     * Handle HTTP request for initial render
     */
    handleRequest(request: Request): Promise<Response>;
    /**
     * Handle WebSocket connection
     */
    handleSocket(ws: WebSocket, request: Request): void;
    /**
     * Broadcast to a topic
     */
    broadcast(topic: string, event: string, payload: any): void;
    /**
     * Subscribe a socket to a topic
     */
    subscribe(socketId: string, topic: string): void;
    /**
     * Unsubscribe a socket from a topic
     */
    unsubscribe(socketId: string, topic: string): void;
    private findView;
    private matchPath;
    private handleJoin;
    private handleLeave;
    private sendReply;
    private sendDiff;
    private generateSessionId;
    private encodeSession;
    private decodeSession;
    private encodeStatic;
    private buildPageHtml;
    private generateCsrfToken;
}
/**
 * Create a LiveView server
 */
export declare function createLiveViewServer(options: LiveViewServerOptions): LiveViewServer;
/**
 * Express/Hono middleware for LiveView
 */
export declare function liveViewMiddleware(server: LiveViewServer): (req: Request) => Promise<Response | null>;
/**
 * WebSocket handler for LiveView
 */
export declare function liveViewWebSocketHandler(server: LiveViewServer): (ws: WebSocket, request: Request) => void;
export interface PubSub {
    subscribe(topic: string, callback: (event: string, payload: any) => void): () => void;
    broadcast(topic: string, event: string, payload: any): void;
    broadcastFrom(socketId: string, topic: string, event: string, payload: any): void;
}
/**
 * Create an in-memory PubSub for development
 */
export declare function createMemoryPubSub(): PubSub;
export { createLiveView } from './live-view.js';
export { createLiveComponent } from './live-component.js';
//# sourceMappingURL=server.d.ts.map