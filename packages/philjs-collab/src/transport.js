/**
 * Transport Layer for PhilJS Collab
 *
 * Provides WebSocket and WebRTC transport for real-time collaboration
 */
/**
 * WebSocket Transport for collaboration
 */
export class WebSocketTransport {
    ws = null;
    config;
    handlers = new Map();
    messageQueue = [];
    reconnectAttempts = 0;
    pingTimer = null;
    reconnectTimer = null;
    connected = false;
    constructor(config) {
        this.config = {
            url: config.url,
            roomId: config.roomId,
            clientId: config.clientId,
            reconnect: config.reconnect ?? true,
            reconnectDelay: config.reconnectDelay ?? 1000,
            maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
            pingInterval: config.pingInterval ?? 30000,
            messageQueueSize: config.messageQueueSize ?? 100,
        };
    }
    /**
     * Connect to the server
     */
    connect() {
        const { promise, resolve, reject } = Promise.withResolvers();
        try {
            const url = new URL(this.config.url);
            url.searchParams.set('room', this.config.roomId);
            url.searchParams.set('client', this.config.clientId);
            this.ws = new WebSocket(url.toString());
            this.ws.onopen = () => {
                this.connected = true;
                this.reconnectAttempts = 0;
                this.startPing();
                this.flushQueue();
                this.emit('connect');
                resolve();
            };
            this.ws.onclose = (event) => {
                this.connected = false;
                this.stopPing();
                this.emit('disconnect', event.reason || 'Connection closed');
                if (this.config.reconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
                    this.scheduleReconnect();
                }
            };
            this.ws.onerror = () => {
                const error = new Error('WebSocket error');
                this.emit('error', error);
                if (!this.connected) {
                    reject(error);
                }
            };
            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'pong') {
                        return;
                    }
                    this.emit('message', message);
                }
                catch (error) {
                    this.emit('error', new Error(`Invalid message: ${error}`));
                }
            };
        }
        catch (error) {
            reject(error);
        }
        return promise;
    }
    /**
     * Disconnect from the server
     */
    disconnect() {
        this.config.reconnect = false;
        this.stopPing();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }
        this.connected = false;
    }
    /**
     * Send a message
     */
    send(type, payload) {
        const message = {
            type,
            roomId: this.config.roomId,
            clientId: this.config.clientId,
            payload,
            timestamp: Date.now(),
        };
        if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
        else {
            // Queue message for later
            this.messageQueue.push(message);
            if (this.messageQueue.length > this.config.messageQueueSize) {
                this.messageQueue.shift();
            }
        }
    }
    /**
     * Subscribe to events
     */
    on(event, handler) {
        let handlers = this.handlers.get(event);
        if (!handlers) {
            handlers = new Set();
            this.handlers.set(event, handlers);
        }
        handlers.add(handler);
        return () => {
            handlers.delete(handler);
        };
    }
    /**
     * Check if connected
     */
    isConnected() {
        return this.connected && this.ws?.readyState === WebSocket.OPEN;
    }
    emit(event, ...args) {
        const handlers = this.handlers.get(event);
        if (handlers) {
            for (const handler of handlers) {
                handler(...args);
            }
        }
    }
    startPing() {
        this.pingTimer = setInterval(() => {
            this.send('ping', {});
        }, this.config.pingInterval);
    }
    stopPing() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    }
    scheduleReconnect() {
        this.reconnectAttempts++;
        const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        this.emit('reconnecting', this.reconnectAttempts);
        this.reconnectTimer = setTimeout(() => {
            this.connect().catch(() => {
                // Reconnect failed, will try again if attempts remain
            });
        }, delay);
    }
    flushQueue() {
        while (this.messageQueue.length > 0 && this.isConnected()) {
            const message = this.messageQueue.shift();
            this.ws.send(JSON.stringify(message));
        }
    }
}
/**
 * Broadcast Channel Transport for same-origin tabs
 */
export class BroadcastTransport {
    channel;
    config;
    handlers = new Map();
    constructor(config) {
        this.config = config;
        this.channel = new BroadcastChannel(`philjs-collab:${config.roomId}`);
        this.channel.onmessage = (event) => {
            const message = event.data;
            if (message.clientId !== this.config.clientId) {
                this.emit('message', message);
            }
        };
    }
    send(type, payload) {
        const message = {
            type,
            roomId: this.config.roomId,
            clientId: this.config.clientId,
            payload,
            timestamp: Date.now(),
        };
        this.channel.postMessage(message);
    }
    on(event, handler) {
        let handlers = this.handlers.get(event);
        if (!handlers) {
            handlers = new Set();
            this.handlers.set(event, handlers);
        }
        handlers.add(handler);
        return () => {
            handlers.delete(handler);
        };
    }
    close() {
        this.channel.close();
    }
    emit(event, ...args) {
        const handlers = this.handlers.get(event);
        if (handlers) {
            for (const handler of handlers) {
                handler(...args);
            }
        }
    }
}
/**
 * Create a WebSocket transport
 */
export function createWebSocketTransport(config) {
    return new WebSocketTransport(config);
}
/**
 * Create a Broadcast Channel transport
 */
export function createBroadcastTransport(config) {
    return new BroadcastTransport(config);
}
/**
 * Generate a unique client ID
 */
export function generateClientId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
//# sourceMappingURL=transport.js.map