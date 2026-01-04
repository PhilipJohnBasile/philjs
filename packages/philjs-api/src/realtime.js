/**
 * Real-time Communication - WebSocket & SSE Support
 *
 * Provides tRPC-style real-time subscriptions with WebSocket and SSE fallback
 */
import { signal, memo, effect } from '@philjs/core';
// ============================================================================
// WebSocket Client
// ============================================================================
export class WebSocketClient {
    ws = null;
    url;
    subscriptions = new Map();
    reconnectAttempts = 0;
    maxReconnectAttempts;
    reconnectDelay;
    shouldReconnect;
    pingInterval = null;
    constructor(url, options = {}) {
        this.url = url;
        this.shouldReconnect = options.reconnect ?? true;
        this.reconnectDelay = options.reconnectDelay ?? 1000;
        this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
    }
    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url);
                this.ws.onopen = () => {
                    this.reconnectAttempts = 0;
                    this.startPing();
                    resolve();
                };
                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this.handleMessage(message);
                    }
                    catch (error) {
                        console.error('[WebSocket] Failed to parse message:', error);
                    }
                };
                this.ws.onerror = (error) => {
                    console.error('[WebSocket] Error:', error);
                    reject(error);
                };
                this.ws.onclose = () => {
                    this.stopPing();
                    if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnect();
                    }
                };
            }
            catch (error) {
                reject(error);
            }
        });
    }
    reconnect() {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        setTimeout(() => {
            this.connect().catch((error) => {
                console.error('[WebSocket] Reconnect failed:', error);
            });
        }, delay);
    }
    startPing() {
        this.pingInterval = window.setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.send({ type: 'ping', channel: '__system__', id: Date.now().toString(), timestamp: Date.now() });
            }
        }, 30000); // Ping every 30 seconds
    }
    stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
    subscribe(channel, callback) {
        if (!this.subscriptions.has(channel)) {
            this.subscriptions.set(channel, new Set());
            // Send subscribe message
            this.send({
                type: 'subscribe',
                channel,
                id: Date.now().toString(),
                timestamp: Date.now(),
            });
        }
        this.subscriptions.get(channel).add(callback);
        return () => {
            const subscribers = this.subscriptions.get(channel);
            if (subscribers) {
                subscribers.delete(callback);
                if (subscribers.size === 0) {
                    this.subscriptions.delete(channel);
                    // Send unsubscribe message
                    this.send({
                        type: 'unsubscribe',
                        channel,
                        id: Date.now().toString(),
                        timestamp: Date.now(),
                    });
                }
            }
        };
    }
    send(message) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
    handleMessage(message) {
        const subscribers = this.subscriptions.get(message.channel);
        if (subscribers) {
            subscribers.forEach(callback => callback(message));
        }
    }
    close() {
        this.shouldReconnect = false;
        this.stopPing();
        this.ws?.close();
        this.ws = null;
    }
    get readyState() {
        return this.ws?.readyState ?? WebSocket.CLOSED;
    }
}
// ============================================================================
// SSE Client
// ============================================================================
export class SSEClient {
    eventSources = new Map();
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    subscribe(channel, callback) {
        if (this.eventSources.has(channel)) {
            console.warn(`[SSE] Already subscribed to channel: ${channel}`);
            return () => { };
        }
        const url = `${this.baseUrl}/${channel}`;
        const eventSource = new EventSource(url);
        eventSource.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                callback(message);
            }
            catch (error) {
                console.error('[SSE] Failed to parse message:', error);
            }
        };
        eventSource.onerror = (error) => {
            console.error('[SSE] Error:', error);
            callback({
                id: Date.now().toString(),
                type: 'error',
                channel,
                error: 'SSE connection error',
                timestamp: Date.now(),
            });
        };
        this.eventSources.set(channel, eventSource);
        return () => {
            eventSource.close();
            this.eventSources.delete(channel);
        };
    }
    close() {
        this.eventSources.forEach(es => es.close());
        this.eventSources.clear();
    }
}
// ============================================================================
// Realtime Manager
// ============================================================================
export class RealtimeManager {
    wsClient = null;
    sseClient = null;
    preferredTransport;
    wsUrl;
    sseUrl;
    constructor(options) {
        this.wsUrl = options.wsUrl;
        this.sseUrl = options.sseUrl;
        this.preferredTransport = options.transport || 'websocket';
    }
    async connect() {
        if (this.preferredTransport === 'websocket' && typeof WebSocket !== 'undefined') {
            this.wsClient = new WebSocketClient(this.wsUrl);
            await this.wsClient.connect();
        }
        else if (typeof EventSource !== 'undefined') {
            this.sseClient = new SSEClient(this.sseUrl);
        }
    }
    subscribe(channel, options = {}) {
        const state = signal('connecting');
        const data = signal(null);
        const error = signal(null);
        const isConnected = memo(() => state() === 'connected');
        let unsubscribeFn = null;
        const handleMessage = (message) => {
            switch (message.type) {
                case 'data':
                    data.set(message.data || null);
                    options.onData?.(message.data);
                    break;
                case 'error':
                    const err = new Error(message.error || 'Unknown error');
                    error.set(err);
                    options.onError?.(err);
                    break;
                case 'complete':
                    state.set('disconnected');
                    options.onComplete?.();
                    break;
            }
        };
        // Try WebSocket first, fallback to SSE
        if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
            state.set('connected');
            unsubscribeFn = this.wsClient.subscribe(channel, handleMessage);
        }
        else if (this.sseClient) {
            state.set('connected');
            unsubscribeFn = this.sseClient.subscribe(channel, handleMessage);
        }
        else {
            state.set('failed');
            error.set(new Error('No realtime transport available'));
        }
        return {
            state,
            data,
            error,
            isConnected,
            unsubscribe: () => {
                unsubscribeFn?.();
                state.set('disconnected');
            },
            send: (sendData) => {
                if (this.wsClient) {
                    this.wsClient.send({
                        type: 'data',
                        channel,
                        data: sendData,
                        id: Date.now().toString(),
                        timestamp: Date.now(),
                    });
                }
            },
        };
    }
    close() {
        this.wsClient?.close();
        this.sseClient?.close();
    }
}
// ============================================================================
// High-Level Hooks
// ============================================================================
let globalManager = null;
export function initRealtime(options) {
    if (!globalManager) {
        globalManager = new RealtimeManager(options);
        globalManager.connect();
    }
    return globalManager;
}
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
export function useSubscription(channel, options = {}) {
    if (!globalManager) {
        throw new Error('Realtime not initialized. Call initRealtime() first.');
    }
    return globalManager.subscribe(channel, options);
}
// ============================================================================
// Server-Side Helpers
// ============================================================================
/**
 * Create SSE response
 */
export function createSSEResponse(options) {
    const { onSubscribe } = options;
    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();
            const send = (data) => {
                const message = {
                    id: Date.now().toString(),
                    type: 'data',
                    channel: '__sse__',
                    data,
                    timestamp: Date.now(),
                };
                const text = `data: ${JSON.stringify(message)}\n\n`;
                controller.enqueue(encoder.encode(text));
            };
            // Send initial connection message
            send({ type: 'connected' });
            // Set up subscription
            const unsubscribe = onSubscribe(send);
            // Cleanup on close
            return () => {
                unsubscribe();
            };
        },
    });
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
export function handleWebSocketUpgrade(request, handler) {
    const upgrade = request.headers.get('upgrade');
    if (upgrade !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 });
    }
    // This would be platform-specific (Cloudflare, Deno, Bun, etc.)
    // For now, return a basic response
    return new Response(null, { status: 101 });
}
//# sourceMappingURL=realtime.js.map