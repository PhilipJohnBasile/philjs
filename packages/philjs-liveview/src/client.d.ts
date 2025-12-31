/**
 * PhilJS LiveView - Client
 *
 * Client-side runtime for LiveView. Handles:
 * - WebSocket connection to server
 * - DOM patching with morphdom
 * - Event binding (phx-click, phx-change, etc.)
 * - Hooks lifecycle
 * - Form handling
 * - Navigation
 */
import type { LiveViewClientOptions, Hooks } from './types.js';
export declare class LiveViewClient {
    private socket;
    private container;
    private topic;
    private sessionToken;
    private staticToken;
    private cleanupNav?;
    private options;
    private eventHandlers;
    constructor(options: LiveViewClientOptions);
    /**
     * Connect to the LiveView server
     */
    connect(container: HTMLElement | string): void;
    /**
     * Disconnect from the LiveView server
     */
    disconnect(): void;
    /**
     * Push an event to the server
     */
    pushEvent(event: string, payload: any, target?: string): void;
    /**
     * Push an event to a specific component
     */
    pushEventTo(selector: string, event: string, payload: any): void;
    /**
     * Register a handler for server events
     */
    handleEvent(event: string, callback: (payload: any) => void): void;
    /**
     * Register custom hooks
     */
    registerHooks(hooks: Hooks): void;
    private handleOpen;
    private handleClose;
    private handleError;
    private handleMessage;
    private handleNavPatch;
    private applyRender;
    private applyDiff;
    private bindEvents;
    private bindPhxEvent;
    private bindPhxKeyEvent;
    private mountHooks;
    private updateHooks;
    private handleUpload;
}
/**
 * Create and connect a LiveView client
 */
export declare function createLiveViewClient(options: LiveViewClientOptions): LiveViewClient;
/**
 * Quick initialization for standard setup
 */
export declare function initLiveView(options?: Partial<LiveViewClientOptions>): LiveViewClient | null;
export { registerHooks } from './hooks.js';
export { livePatch, liveRedirect } from './navigation.js';
//# sourceMappingURL=client.d.ts.map