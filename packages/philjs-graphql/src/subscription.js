/**
 * PhilJS GraphQL Subscriptions
 *
 * Provides robust WebSocket-based GraphQL subscriptions with:
 * - graphql-ws protocol support
 * - Automatic reconnection with exponential backoff
 * - Signal-based subscription state management
 * - Connection pooling for multiple subscriptions
 * - Heartbeat/keepalive support
 */
import { signal, memo, batch } from '@philjs/core';
const MessageType = {
    ConnectionInit: 'connection_init',
    ConnectionAck: 'connection_ack',
    Ping: 'ping',
    Pong: 'pong',
    Subscribe: 'subscribe',
    Next: 'next',
    Error: 'error',
    Complete: 'complete',
};
/**
 * GraphQL WebSocket Subscription Client
 * Implements the graphql-ws protocol
 */
export class SubscriptionClient {
    config;
    ws = null;
    subscriptions = new Map();
    reconnectAttempt = 0;
    reconnectTimer = null;
    keepaliveTimer = null;
    connectionState = signal('disconnected');
    messageQueue = [];
    subscriptionIdCounter = 0;
    constructor(config) {
        this.config = {
            connectionTimeout: 5000,
            maxReconnectAttempts: 5,
            reconnectDelay: 1000,
            backoffMultiplier: 2,
            keepalive: true,
            keepaliveInterval: 30000,
            connectionParams: () => ({}),
            lazy: false,
            ...config,
        };
        if (!this.config.lazy) {
            this.connect();
        }
    }
    /**
     * Get current connection state
     */
    getConnectionState() {
        return this.connectionState;
    }
    /**
     * Create a new subscription
     */
    subscribe(options) {
        const id = this.generateSubscriptionId();
        const query = this.documentToString(options.query);
        const state = signal({
            data: null,
            error: null,
            active: false,
            connectionState: this.connectionState(),
        });
        const subscription = {
            id,
            query,
            state: state,
            ...(options.variables !== undefined && { variables: options.variables }),
            ...(options.operationName !== undefined && { operationName: options.operationName }),
            ...(options.onData !== undefined && { onData: options.onData }),
            ...(options.onError !== undefined && { onError: options.onError }),
            ...(options.onComplete !== undefined && { onComplete: options.onComplete }),
        };
        this.subscriptions.set(id, subscription);
        // Connect if lazy and this is the first subscription
        if (this.config.lazy && !this.ws) {
            this.connect();
        }
        // Send subscription message if connected
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendSubscribe(subscription);
        }
        else {
            // Queue the subscription to be sent when connected
            this.messageQueue.push({
                id,
                type: MessageType.Subscribe,
                payload: {
                    query,
                    variables: options.variables,
                    operationName: options.operationName,
                },
            });
        }
        return new SubscriptionHandle(this, id, state);
    }
    /**
     * Unsubscribe from a subscription
     */
    unsubscribe(id) {
        const subscription = this.subscriptions.get(id);
        if (!subscription)
            return;
        // Send complete message if connected
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send({
                id,
                type: MessageType.Complete,
            });
        }
        // Update state
        batch(() => {
            subscription.state.set({
                ...subscription.state(),
                active: false,
            });
        });
        this.subscriptions.delete(id);
        // Disconnect if lazy and no more subscriptions
        if (this.config.lazy && this.subscriptions.size === 0) {
            this.disconnect();
        }
    }
    /**
     * Connect to WebSocket
     */
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return;
        }
        this.connectionState.set('connecting');
        try {
            this.ws = new WebSocket(this.config.url, 'graphql-transport-ws');
            this.ws.onopen = () => this.handleOpen();
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onerror = (error) => this.handleError(error);
            this.ws.onclose = (event) => this.handleClose(event);
            // Set connection timeout
            setTimeout(() => {
                if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
                    this.ws.close();
                    this.handleConnectionTimeout();
                }
            }, this.config.connectionTimeout);
        }
        catch (error) {
            this.handleError(error);
        }
    }
    /**
     * Disconnect from WebSocket
     */
    disconnect() {
        if (this.keepaliveTimer) {
            clearInterval(this.keepaliveTimer);
            this.keepaliveTimer = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connectionState.set('disconnected');
    }
    /**
     * Handle WebSocket open
     */
    async handleOpen() {
        // Send connection_init message
        const payload = this.config.connectionParams
            ? await this.config.connectionParams()
            : {};
        this.send({
            type: MessageType.ConnectionInit,
            payload,
        });
    }
    /**
     * Handle WebSocket message
     */
    handleMessage(event) {
        const message = JSON.parse(event.data);
        switch (message.type) {
            case MessageType.ConnectionAck:
                this.handleConnectionAck();
                break;
            case MessageType.Ping:
                this.send({ type: MessageType.Pong });
                break;
            case MessageType.Next:
                this.handleNext(message);
                break;
            case MessageType.Error:
                this.handleSubscriptionError(message);
                break;
            case MessageType.Complete:
                this.handleComplete(message);
                break;
        }
    }
    /**
     * Handle connection acknowledgment
     */
    handleConnectionAck() {
        this.connectionState.set('connected');
        this.reconnectAttempt = 0;
        // Update all subscription states
        batch(() => {
            this.subscriptions.forEach((sub) => {
                sub.state.set({
                    ...sub.state(),
                    connectionState: 'connected',
                    active: true,
                });
            });
        });
        // Send queued messages
        this.messageQueue.forEach((msg) => this.send(msg));
        this.messageQueue = [];
        // Resubscribe to all active subscriptions
        this.subscriptions.forEach((sub) => {
            this.sendSubscribe(sub);
        });
        // Start keepalive
        if (this.config.keepalive) {
            this.startKeepalive();
        }
    }
    /**
     * Handle subscription data
     */
    handleNext(message) {
        if (!message.id)
            return;
        const subscription = this.subscriptions.get(message.id);
        if (!subscription)
            return;
        const data = message.payload?.data;
        batch(() => {
            subscription.state.set({
                ...subscription.state(),
                data,
                error: null,
            });
        });
        if (subscription.onData) {
            subscription.onData(data);
        }
    }
    /**
     * Handle subscription error
     */
    handleSubscriptionError(message) {
        if (!message.id)
            return;
        const subscription = this.subscriptions.get(message.id);
        if (!subscription)
            return;
        const error = new Error(message.payload?.message || 'Subscription error');
        batch(() => {
            subscription.state.set({
                ...subscription.state(),
                error,
            });
        });
        if (subscription.onError) {
            subscription.onError(error);
        }
    }
    /**
     * Handle subscription completion
     */
    handleComplete(message) {
        if (!message.id)
            return;
        const subscription = this.subscriptions.get(message.id);
        if (!subscription)
            return;
        batch(() => {
            subscription.state.set({
                ...subscription.state(),
                active: false,
            });
        });
        if (subscription.onComplete) {
            subscription.onComplete();
        }
        this.subscriptions.delete(message.id);
    }
    /**
     * Handle WebSocket error
     */
    handleError(error) {
        console.error('WebSocket error:', error);
        // Notify all subscriptions
        batch(() => {
            this.subscriptions.forEach((sub) => {
                const err = error instanceof Error ? error : new Error('WebSocket error');
                sub.state.set({
                    ...sub.state(),
                    error: err,
                });
                if (sub.onError) {
                    sub.onError(err);
                }
            });
        });
    }
    /**
     * Handle WebSocket close
     */
    handleClose(event) {
        this.connectionState.set('disconnected');
        // Clear keepalive
        if (this.keepaliveTimer) {
            clearInterval(this.keepaliveTimer);
            this.keepaliveTimer = null;
        }
        // Update subscription states
        batch(() => {
            this.subscriptions.forEach((sub) => {
                sub.state.set({
                    ...sub.state(),
                    connectionState: 'disconnected',
                    active: false,
                });
            });
        });
        // Attempt reconnection if not a clean close
        if (!event.wasClean && this.subscriptions.size > 0) {
            this.reconnect();
        }
    }
    /**
     * Handle connection timeout
     */
    handleConnectionTimeout() {
        console.error('WebSocket connection timeout');
        this.reconnect();
    }
    /**
     * Reconnect with exponential backoff
     */
    reconnect() {
        if (this.reconnectAttempt >= this.config.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            const error = new Error('Failed to reconnect after maximum attempts');
            batch(() => {
                this.subscriptions.forEach((sub) => {
                    sub.state.set({
                        ...sub.state(),
                        error,
                    });
                    if (sub.onError) {
                        sub.onError(error);
                    }
                });
            });
            return;
        }
        this.connectionState.set('reconnecting');
        const delay = this.config.reconnectDelay *
            Math.pow(this.config.backoffMultiplier, this.reconnectAttempt);
        this.reconnectAttempt++;
        console.log(`Reconnecting attempt ${this.reconnectAttempt} in ${delay}ms...`);
        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, delay);
    }
    /**
     * Start keepalive pings
     */
    startKeepalive() {
        this.keepaliveTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.send({ type: MessageType.Ping });
            }
        }, this.config.keepaliveInterval);
    }
    /**
     * Send a message to the WebSocket
     */
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
    /**
     * Send subscribe message
     */
    sendSubscribe(subscription) {
        this.send({
            id: subscription.id,
            type: MessageType.Subscribe,
            payload: {
                query: subscription.query,
                variables: subscription.variables,
                operationName: subscription.operationName,
            },
        });
    }
    /**
     * Generate unique subscription ID
     */
    generateSubscriptionId() {
        return `sub_${++this.subscriptionIdCounter}_${Date.now()}`;
    }
    /**
     * Convert DocumentNode to string if needed
     */
    documentToString(doc) {
        if (typeof doc === 'string') {
            return doc;
        }
        return doc.loc?.source?.body || String(doc);
    }
    /**
     * Close all subscriptions and disconnect
     */
    close() {
        this.subscriptions.forEach((_, id) => {
            this.unsubscribe(id);
        });
        this.disconnect();
    }
}
/**
 * Subscription handle returned to consumers
 */
export class SubscriptionHandle {
    client;
    id;
    state;
    constructor(client, id, state) {
        this.client = client;
        this.id = id;
        this.state = state;
    }
    /**
     * Get current subscription data
     */
    get data() {
        return memo(() => this.state().data);
    }
    /**
     * Get current subscription error
     */
    get error() {
        return memo(() => this.state().error);
    }
    /**
     * Check if subscription is active
     */
    get active() {
        return memo(() => this.state().active);
    }
    /**
     * Get connection state
     */
    get connectionState() {
        return memo(() => this.state().connectionState);
    }
    /**
     * Unsubscribe and clean up
     */
    unsubscribe() {
        this.client.unsubscribe(this.id);
    }
}
/**
 * Create a subscription client
 */
export function createSubscriptionClient(config) {
    return new SubscriptionClient(config);
}
/**
 * Hook for using subscriptions with reactive state
 */
export function useSubscription(client, options) {
    const handle = client.subscribe(options);
    return {
        data: handle.data,
        error: handle.error,
        active: handle.active,
        connectionState: handle.connectionState,
        unsubscribe: () => handle.unsubscribe(),
    };
}
//# sourceMappingURL=subscription.js.map