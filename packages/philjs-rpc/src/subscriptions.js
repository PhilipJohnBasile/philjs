/**
 * WebSocket-based subscriptions for philjs-rpc.
 * Provides real-time data streaming with automatic reconnection and lifecycle hooks.
 */
import { signal, effect } from '@philjs/core';
export class WebSocketConnection {
    ws = null;
    config;
    reconnectAttempts = 0;
    reconnectTimeout = null;
    heartbeatInterval = null;
    subscriptions = new Map();
    connectionState = signal('disconnected');
    messageHandlers = new Set();
    eventHandlers = new Map();
    constructor(config) {
        this.config = {
            url: config.url,
            reconnect: {
                enabled: config.reconnect?.enabled ?? true,
                maxAttempts: config.reconnect?.maxAttempts ?? 10,
                delay: config.reconnect?.delay ?? 1000,
                maxDelay: config.reconnect?.maxDelay ?? 30000,
                backoffMultiplier: config.reconnect?.backoffMultiplier ?? 1.5,
            },
            connectionTimeout: config.connectionTimeout ?? 10000,
            heartbeatInterval: config.heartbeatInterval ?? 30000,
            WebSocketImpl: config.WebSocketImpl ?? (typeof WebSocket !== 'undefined' ? WebSocket : null),
            headers: config.headers ?? {},
            protocols: config.protocols ?? [],
        };
    }
    /**
     * Connect to the WebSocket server.
     */
    async connect() {
        if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
            return;
        }
        return new Promise((resolve, reject) => {
            this.connectionState.set('connecting');
            this.emit('connecting', {});
            const timeout = setTimeout(() => {
                if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
                    this.ws.close();
                    const error = new Error('Connection timeout');
                    this.connectionState.set('error');
                    this.emit('error', { error });
                    reject(error);
                }
            }, this.config.connectionTimeout);
            try {
                this.ws = new this.config.WebSocketImpl(this.config.url, this.config.protocols);
                this.ws.onopen = () => {
                    clearTimeout(timeout);
                    this.connectionState.set('connected');
                    this.reconnectAttempts = 0;
                    this.emit('connected', {});
                    this.startHeartbeat();
                    this.resubscribeAll();
                    resolve();
                };
                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this.handleMessage(message);
                    }
                    catch (error) {
                        console.error('Failed to parse WebSocket message:', error);
                    }
                };
                this.ws.onerror = (event) => {
                    clearTimeout(timeout);
                    this.connectionState.set('error');
                    this.emit('error', { error: new Error('WebSocket error') });
                };
                this.ws.onclose = () => {
                    clearTimeout(timeout);
                    this.connectionState.set('disconnected');
                    this.emit('disconnected', {});
                    this.stopHeartbeat();
                    this.attemptReconnect();
                };
            }
            catch (error) {
                clearTimeout(timeout);
                this.connectionState.set('error');
                this.emit('error', { error: error });
                reject(error);
            }
        });
    }
    /**
     * Disconnect from the WebSocket server.
     */
    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.onclose = null; // Prevent reconnection
            this.ws.close();
            this.ws = null;
        }
        this.connectionState.set('disconnected');
    }
    /**
     * Subscribe to a procedure.
     */
    subscribe(id, path, input, observer) {
        // Store subscription state
        this.subscriptions.set(id, {
            id,
            path,
            input,
            observer: observer,
        });
        // Send subscribe message if connected
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendMessage({
                type: 'subscribe',
                id,
                path,
                input,
            });
        }
        // Return unsubscribe function
        return () => {
            this.unsubscribe(id);
        };
    }
    /**
     * Unsubscribe from a procedure.
     */
    unsubscribe(id) {
        this.subscriptions.delete(id);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendMessage({
                type: 'unsubscribe',
                id,
            });
        }
    }
    /**
     * Get connection state.
     */
    getState() {
        return this.connectionState();
    }
    /**
     * Check if connected.
     */
    isConnected() {
        return this.connectionState() === 'connected';
    }
    /**
     * Add event listener.
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
        return () => {
            this.eventHandlers.get(event)?.delete(handler);
        };
    }
    /**
     * Emit event.
     */
    emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            for (const handler of handlers) {
                handler(data);
            }
        }
    }
    /**
     * Send a message to the server.
     */
    sendMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
    /**
     * Handle incoming message.
     */
    handleMessage(message) {
        // Notify message handlers
        for (const handler of this.messageHandlers) {
            handler(message);
        }
        // Handle specific message types
        switch (message.type) {
            case 'data': {
                const subscription = this.subscriptions.get(message.id);
                if (subscription?.observer.next) {
                    subscription.observer.next(message.data);
                }
                break;
            }
            case 'error': {
                const subscription = this.subscriptions.get(message.id);
                if (subscription?.observer.error) {
                    const error = new Error(message.error?.message ?? 'Subscription error');
                    error.code = message.error?.code;
                    subscription.observer.error(error);
                }
                break;
            }
            case 'complete': {
                const subscription = this.subscriptions.get(message.id);
                if (subscription?.observer.complete) {
                    subscription.observer.complete();
                }
                this.subscriptions.delete(message.id);
                break;
            }
            case 'pong': {
                // Heartbeat response
                break;
            }
        }
    }
    /**
     * Attempt to reconnect.
     */
    attemptReconnect() {
        if (!this.config.reconnect.enabled)
            return;
        if (this.reconnectAttempts >= this.config.reconnect.maxAttempts) {
            this.emit('reconnectFailed', {});
            return;
        }
        this.reconnectAttempts++;
        const delay = Math.min(this.config.reconnect.delay * Math.pow(this.config.reconnect.backoffMultiplier, this.reconnectAttempts - 1), this.config.reconnect.maxDelay);
        this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });
        this.reconnectTimeout = setTimeout(() => {
            this.connect().catch(() => {
                // Reconnection failed, will retry
            });
        }, delay);
    }
    /**
     * Resubscribe to all active subscriptions.
     */
    resubscribeAll() {
        for (const [id, subscription] of this.subscriptions) {
            this.sendMessage({
                type: 'subscribe',
                id,
                path: subscription.path,
                input: subscription.input,
            });
        }
    }
    /**
     * Start heartbeat to keep connection alive.
     */
    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.sendMessage({ type: 'ping' });
            }
        }, this.config.heartbeatInterval);
    }
    /**
     * Stop heartbeat.
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
}
// ============================================================================
// useSubscription Hook
// ============================================================================
let subscriptionIdCounter = 0;
/**
 * Create a subscription hook for real-time data.
 *
 * @example
 * ```ts
 * const messages = client.chat.onMessage.useSubscription(
 *   { roomId: 'general' },
 *   {
 *     onData: (msg) => console.log('New message:', msg),
 *     onError: (err) => console.error('Subscription error:', err),
 *   }
 * );
 * ```
 */
export function createUseSubscription(connection, path) {
    return (input, options) => {
        const { enabled = true, onData, onError, onComplete, onStart, retryOnError = true, retryDelay = 1000, } = options ?? {};
        const subscriptionId = `sub-${subscriptionIdCounter++}`;
        const data = signal([]);
        const lastData = signal(undefined);
        const error = signal(null);
        const status = signal('idle');
        let unsubscribe = null;
        const subscribe = () => {
            if (!enabled)
                return;
            status.set('connecting');
            if (onStart) {
                onStart();
            }
            // Ensure connection is established
            if (!connection.isConnected()) {
                connection.connect().then(() => {
                    startSubscription();
                }).catch((err) => {
                    status.set('error');
                    error.set(err);
                    if (onError) {
                        onError(err);
                    }
                });
            }
            else {
                startSubscription();
            }
        };
        const startSubscription = () => {
            unsubscribe = connection.subscribe(subscriptionId, path, input, {
                next: (value) => {
                    status.set('subscribed');
                    error.set(null);
                    lastData.set(value);
                    data.set([...data(), value]);
                    if (onData) {
                        onData(value);
                    }
                },
                error: (err) => {
                    status.set('error');
                    error.set(err);
                    if (onError) {
                        onError(err);
                    }
                    // Retry on error if enabled
                    if (retryOnError) {
                        setTimeout(() => {
                            if (enabled) {
                                subscribe();
                            }
                        }, retryDelay);
                    }
                },
                complete: () => {
                    status.set('idle');
                    if (onComplete) {
                        onComplete();
                    }
                },
            });
        };
        // Start subscription
        subscribe();
        // Cleanup on unmount
        effect(() => {
            return () => {
                if (unsubscribe) {
                    unsubscribe();
                }
            };
        });
        return {
            get data() {
                return data();
            },
            get lastData() {
                return lastData();
            },
            get error() {
                return error();
            },
            get status() {
                return status();
            },
            get isSubscribed() {
                return status() === 'subscribed';
            },
            get isError() {
                return status() === 'error';
            },
            reset: () => {
                data.set([]);
                lastData.set(undefined);
                error.set(null);
                status.set('idle');
            },
            resubscribe: () => {
                if (unsubscribe) {
                    unsubscribe();
                }
                subscribe();
            },
        };
    };
}
/**
 * Create a localStorage-based state manager.
 */
export function createLocalStorageStateManager(prefix = 'philjs-rpc-sub') {
    return {
        save(key, state) {
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(`${prefix}:${key}`, JSON.stringify(state));
                }
            }
            catch (error) {
                console.error('Failed to save subscription state:', error);
            }
        },
        load(key) {
            try {
                if (typeof localStorage !== 'undefined') {
                    const item = localStorage.getItem(`${prefix}:${key}`);
                    return item ? JSON.parse(item) : undefined;
                }
            }
            catch (error) {
                console.error('Failed to load subscription state:', error);
            }
            return undefined;
        },
        clear(key) {
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.removeItem(`${prefix}:${key}`);
                }
            }
            catch (error) {
                console.error('Failed to clear subscription state:', error);
            }
        },
        clearAll() {
            try {
                if (typeof localStorage !== 'undefined') {
                    const keys = Object.keys(localStorage).filter((k) => k.startsWith(`${prefix}:`));
                    for (const key of keys) {
                        localStorage.removeItem(key);
                    }
                }
            }
            catch (error) {
                console.error('Failed to clear all subscription states:', error);
            }
        },
    };
}
/**
 * Create an in-memory state manager.
 */
export function createMemoryStateManager() {
    const storage = new Map();
    return {
        save(key, state) {
            storage.set(key, state);
        },
        load(key) {
            return storage.get(key);
        },
        clear(key) {
            storage.delete(key);
        },
        clearAll() {
            storage.clear();
        },
    };
}
//# sourceMappingURL=subscriptions.js.map