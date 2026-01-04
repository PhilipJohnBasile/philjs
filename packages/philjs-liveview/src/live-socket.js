// @ts-nocheck
/**
 * PhilJS LiveView - Socket Protocol Implementation
 */
// ============================================================================
// Message Types
// ============================================================================
export const MESSAGE_TYPES = {
    PHX_JOIN: 'phx_join',
    PHX_LEAVE: 'phx_leave',
    PHX_REPLY: 'phx_reply',
    PHX_ERROR: 'phx_error',
    PHX_CLOSE: 'phx_close',
    EVENT: 'event',
    DIFF: 'diff',
    HEARTBEAT: 'heartbeat',
    LIVE_PATCH: 'live_patch',
    LIVE_REDIRECT: 'live_redirect',
    PUSH_PATCH: 'push_patch',
    PUSH_REDIRECT: 'push_redirect',
};
export function createChannel(topic) {
    let state = 'closed';
    let joinRef = 0;
    return {
        topic,
        get state() {
            return state;
        },
        set state(s) {
            state = s;
        },
        get joinRef() {
            return joinRef;
        },
        set joinRef(ref) {
            joinRef = ref;
        },
        onMessage: () => { },
        onClose: () => { },
        onError: () => { },
    };
}
export class SocketConnection {
    ws = null;
    url;
    params;
    heartbeatInterval;
    heartbeatTimer;
    reconnectTimer;
    reconnectTries = 0;
    reconnectAfterMs;
    timeout;
    messageRef = 0;
    pendingRefs = new Map();
    channels = new Map();
    callbacks;
    isConnected = false;
    constructor(options) {
        this.url = options.url;
        this.params = options.params || {};
        this.heartbeatInterval = options.heartbeatIntervalMs || 30000;
        this.timeout = options.timeout || 10000;
        this.reconnectAfterMs = options.reconnectAfterMs || ((tries) => [1000, 2000, 5000, 10000][Math.min(tries, 3)]);
        this.callbacks = {
            onOpen: options.onOpen,
            onClose: options.onClose,
            onError: options.onError,
        };
    }
    connect() {
        if (this.ws?.readyState === WebSocket.OPEN)
            return;
        const urlWithParams = this.buildUrl();
        this.ws = new WebSocket(urlWithParams);
        this.ws.onopen = () => {
            this.isConnected = true;
            this.reconnectTries = 0;
            this.startHeartbeat();
            this.callbacks.onOpen?.();
            // Rejoin all channels
            for (const channel of this.channels.values()) {
                if (channel.state === 'joined' || channel.state === 'joining') {
                    channel.state = 'joining';
                    // Re-join logic handled by channel
                }
            }
        };
        this.ws.onclose = () => {
            this.isConnected = false;
            this.stopHeartbeat();
            this.callbacks.onClose?.();
            this.scheduleReconnect();
        };
        this.ws.onerror = (event) => {
            this.callbacks.onError?.(event);
        };
        this.ws.onmessage = (event) => {
            const message = this.decode(event.data);
            this.handleMessage(message);
        };
    }
    disconnect() {
        this.stopHeartbeat();
        clearTimeout(this.reconnectTimer);
        this.ws?.close();
        this.ws = null;
        this.isConnected = false;
    }
    channel(topic) {
        if (this.channels.has(topic)) {
            return this.channels.get(topic);
        }
        const ch = createChannel(topic);
        this.channels.set(topic, ch);
        return ch;
    }
    async join(topic, payload) {
        const channel = this.channel(topic);
        channel.state = 'joining';
        const ref = this.makeRef();
        channel.joinRef = parseInt(ref, 10);
        return this.pushWithReply(topic, MESSAGE_TYPES.PHX_JOIN, payload, ref);
    }
    leave(topic) {
        const channel = this.channels.get(topic);
        if (channel) {
            channel.state = 'leaving';
            this.push(topic, MESSAGE_TYPES.PHX_LEAVE, {});
            this.channels.delete(topic);
        }
    }
    push(topic, event, payload, ref) {
        const message = [
            topic,
            event,
            payload,
            ref || this.makeRef(),
        ];
        this.send(message);
    }
    async pushWithReply(topic, event, payload, ref) {
        const messageRef = ref || this.makeRef();
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingRefs.delete(messageRef);
                reject(new Error('Timeout'));
            }, this.timeout);
            this.pendingRefs.set(messageRef, {
                resolve: (data) => {
                    clearTimeout(timer);
                    resolve(data);
                },
                reject: (err) => {
                    clearTimeout(timer);
                    reject(err);
                },
            });
            this.push(topic, event, payload, messageRef);
        });
    }
    buildUrl() {
        const url = new URL(this.url, window.location.origin);
        for (const [key, value] of Object.entries(this.params)) {
            url.searchParams.set(key, String(value));
        }
        return url.toString();
    }
    handleMessage(message) {
        // Message format: [topic, event, payload, ref]
        const [topic, event, payload, ref] = message;
        // Handle replies
        if (event === MESSAGE_TYPES.PHX_REPLY && ref) {
            const pending = this.pendingRefs.get(ref);
            if (pending) {
                this.pendingRefs.delete(ref);
                if (payload.status === 'ok') {
                    pending.resolve(payload.response);
                }
                else {
                    pending.reject(new Error(payload.response?.reason || 'Error'));
                }
            }
        }
        // Handle channel-specific messages
        const channel = this.channels.get(topic);
        if (channel) {
            if (event === MESSAGE_TYPES.PHX_REPLY && ref === String(channel.joinRef)) {
                if (payload.status === 'ok') {
                    channel.state = 'joined';
                }
                else {
                    channel.state = 'errored';
                    channel.onError(new Error(payload.response?.reason || 'Join error'));
                }
            }
            if (event === MESSAGE_TYPES.PHX_CLOSE) {
                channel.state = 'closed';
                channel.onClose();
            }
            // Forward to channel handler
            channel.onMessage({ topic, event, payload, ref });
        }
    }
    send(message) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(this.encode(message));
        }
    }
    encode(data) {
        return JSON.stringify(data);
    }
    decode(data) {
        return JSON.parse(data);
    }
    makeRef() {
        this.messageRef++;
        return String(this.messageRef);
    }
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            this.push('phoenix', MESSAGE_TYPES.HEARTBEAT, {});
        }, this.heartbeatInterval);
    }
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }
    }
    scheduleReconnect() {
        const delay = this.reconnectAfterMs(this.reconnectTries);
        this.reconnectTries++;
        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, delay);
    }
}
// ============================================================================
// Event Serialization
// ============================================================================
export function serializeEvent(eventType, target, value) {
    const event = {
        type: eventType,
        value,
        target: target.getAttribute('id') || undefined,
    };
    // Add form data if applicable
    if (target instanceof HTMLFormElement) {
        const formData = new FormData(target);
        event.value = Object.fromEntries(formData.entries());
    }
    // Add input value
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
        event.value = target.value;
    }
    // Add checkbox value
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
        event.value = target.checked;
    }
    return event;
}
export function serializeKeyEvent(eventType, event, target) {
    return {
        type: eventType,
        target: target.getAttribute('id') || undefined,
        key: event.key,
        keyCode: event.keyCode,
        meta: {
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
        },
    };
}
// ============================================================================
// Topic Generation
// ============================================================================
export function generateViewTopic(viewName, sessionId) {
    return `lv:${viewName}:${sessionId}`;
}
export function generateComponentTopic(componentId, viewTopic) {
    return `${viewTopic}:component:${componentId}`;
}
//# sourceMappingURL=live-socket.js.map