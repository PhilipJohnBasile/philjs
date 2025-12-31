/**
 * PhilJS Realtime - Real-time Collaboration & WebSockets
 *
 * Features:
 * - WebSocket client with auto-reconnect
 * - Presence (who's online)
 * - Cursors & awareness
 * - CRDT support via Y.js
 * - Room management
 * - Multiplayer state
 */
import { signal, effect, batch, memo } from 'philjs-core';
export class WebSocketClient {
    url;
    protocols;
    ws = null;
    reconnectAttempts = 0;
    maxAttempts;
    reconnectDelay;
    maxReconnectDelay;
    heartbeatTimer;
    heartbeatInterval;
    shouldReconnect;
    messageHandlers = new Map();
    status = signal('disconnected');
    lastMessage = signal(null);
    callbacks;
    constructor(options) {
        this.url = options.url;
        this.protocols = options.protocols;
        this.shouldReconnect = options.reconnect !== false;
        this.reconnectDelay = options.reconnectDelay || 1000;
        this.maxReconnectDelay = options.maxReconnectDelay || 30000;
        this.maxAttempts = options.reconnectAttempts || Infinity;
        this.heartbeatInterval = options.heartbeatInterval || 30000;
        this.callbacks = {
            onOpen: options.onOpen,
            onClose: options.onClose,
            onError: options.onError,
            onMessage: options.onMessage,
        };
    }
    connect() {
        if (this.ws?.readyState === WebSocket.OPEN)
            return;
        this.status.set('connecting');
        try {
            this.ws = new WebSocket(this.url, this.protocols);
            this.ws.onopen = () => {
                this.status.set('connected');
                this.reconnectAttempts = 0;
                this.startHeartbeat();
                this.callbacks.onOpen?.();
            };
            this.ws.onclose = (event) => {
                this.status.set('disconnected');
                this.stopHeartbeat();
                this.callbacks.onClose?.(event);
                if (this.shouldReconnect && this.reconnectAttempts < this.maxAttempts) {
                    this.scheduleReconnect();
                }
            };
            this.ws.onerror = (error) => {
                this.callbacks.onError?.(error);
            };
            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.lastMessage.set(message);
                    this.callbacks.onMessage?.(message);
                    // Dispatch to type-specific handlers
                    const handlers = this.messageHandlers.get(message.type);
                    handlers?.forEach(handler => handler(message.payload));
                }
                catch (e) {
                    console.error('Failed to parse message:', e);
                }
            };
        }
        catch (error) {
            this.status.set('disconnected');
            if (this.shouldReconnect) {
                this.scheduleReconnect();
            }
        }
    }
    disconnect() {
        this.shouldReconnect = false;
        this.stopHeartbeat();
        this.ws?.close();
        this.ws = null;
        this.status.set('disconnected');
    }
    send(type, payload, room) {
        if (this.ws?.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not connected');
            return;
        }
        const message = {
            type,
            payload,
            timestamp: Date.now(),
        };
        if (room !== undefined) {
            message.room = room;
        }
        this.ws.send(JSON.stringify(message));
    }
    on(type, handler) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, new Set());
        }
        this.messageHandlers.get(type).add(handler);
        return () => {
            this.messageHandlers.get(type)?.delete(handler);
        };
    }
    scheduleReconnect() {
        this.status.set('reconnecting');
        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
        setTimeout(() => this.connect(), delay);
    }
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            this.send('ping', {});
        }, this.heartbeatInterval);
    }
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }
    }
}
export function usePresence(options) {
    const { client, room, user, initialData, syncInterval = 1000 } = options;
    const others = signal(new Map());
    const myPresence = signal(initialData);
    const isConnected = memo(() => client.status() === 'connected');
    // Broadcast presence
    const broadcastPresence = () => {
        if (!isConnected())
            return;
        client.send('presence:update', {
            user,
            data: myPresence(),
            lastSeen: Date.now(),
        }, room);
    };
    // Update my presence
    const updatePresence = (data) => {
        myPresence.set({ ...myPresence(), ...data });
        broadcastPresence();
    };
    // Set up listeners
    effect(() => {
        const unsubUpdate = client.on('presence:update', (state) => {
            if (state.user.id !== user.id) {
                const current = new Map(others());
                current.set(state.user.id, state);
                others.set(current);
            }
        });
        const unsubLeave = client.on('presence:leave', (userId) => {
            const current = new Map(others());
            current.delete(userId);
            others.set(current);
        });
        // Periodic sync
        const interval = setInterval(broadcastPresence, syncInterval);
        // Announce arrival
        if (isConnected()) {
            client.send('presence:join', { user, room }, room);
            broadcastPresence();
        }
        return () => {
            unsubUpdate();
            unsubLeave();
            clearInterval(interval);
            client.send('presence:leave', user.id, room);
        };
    });
    return {
        others: () => Array.from(others().values()),
        myPresence: () => myPresence(),
        updatePresence,
        isConnected,
        count: memo(() => others().size + 1),
    };
}
export function useCursors(options) {
    const { client, room, user, throttle = 50 } = options;
    const cursors = signal(new Map());
    let lastBroadcast = 0;
    // Broadcast cursor position
    const broadcast = (x, y) => {
        const now = Date.now();
        if (now - lastBroadcast < throttle)
            return;
        lastBroadcast = now;
        client.send('cursor:move', {
            user,
            x,
            y,
            timestamp: now,
        }, room);
    };
    // Listen for cursor updates
    effect(() => {
        const unsub = client.on('cursor:move', (state) => {
            if (state.user.id !== user.id) {
                const current = new Map(cursors());
                current.set(state.user.id, state);
                cursors.set(current);
            }
        });
        const unsubLeave = client.on('presence:leave', (userId) => {
            const current = new Map(cursors());
            current.delete(userId);
            cursors.set(current);
        });
        return () => {
            unsub();
            unsubLeave();
        };
    });
    return {
        cursors: () => Array.from(cursors().values()),
        broadcast,
    };
}
export function useRoom(options) {
    const { client, roomId, user, password } = options;
    const room = signal(null);
    const users = signal([]);
    const isJoined = signal(false);
    const error = signal(null);
    const join = async () => {
        try {
            client.send('room:join', { roomId, user, password });
            isJoined.set(true);
        }
        catch (e) {
            error.set(e instanceof Error ? e : new Error(String(e)));
        }
    };
    const leave = () => {
        client.send('room:leave', { roomId, user });
        isJoined.set(false);
    };
    const broadcast = (type, payload) => {
        client.send(type, payload, roomId);
    };
    effect(() => {
        const unsubJoin = client.on('room:joined', (data) => {
            room.set(data);
            users.set(data.users);
        });
        const unsubUserJoin = client.on('room:user:joined', (newUser) => {
            users.set([...users(), newUser]);
        });
        const unsubUserLeave = client.on('room:user:left', (userId) => {
            users.set(users().filter(u => u.id !== userId));
        });
        const unsubError = client.on('room:error', (err) => {
            error.set(new Error(err.message));
        });
        return () => {
            unsubJoin();
            unsubUserJoin();
            unsubUserLeave();
            unsubError();
            if (isJoined())
                leave();
        };
    });
    return {
        room: () => room(),
        users: () => users(),
        isJoined: () => isJoined(),
        error: () => error(),
        join,
        leave,
        broadcast,
    };
}
export function useBroadcast(options) {
    const { client, room, channel } = options;
    const lastMessage = signal(null);
    const messageHistory = signal([]);
    const broadcast = (data) => {
        client.send(`broadcast:${channel}`, data, room);
    };
    effect(() => {
        const unsub = client.on(`broadcast:${channel}`, (data) => {
            lastMessage.set(data);
            messageHistory.set([...messageHistory(), data]);
        });
        return unsub;
    });
    return {
        broadcast,
        lastMessage: () => lastMessage(),
        history: () => messageHistory(),
        clear: () => messageHistory.set([]),
    };
}
export function useSharedState(options) {
    const { client, room, initialState } = options;
    const state = signal(initialState);
    const version = signal(0);
    const set = (key, value) => {
        const newState = { ...state(), [key]: value };
        state.set(newState);
        version.set(version() + 1);
        client.send('state:update', {
            key,
            value,
            version: version(),
        }, room);
    };
    const merge = (partial) => {
        const newState = { ...state(), ...partial };
        state.set(newState);
        version.set(version() + 1);
        client.send('state:merge', {
            data: partial,
            version: version(),
        }, room);
    };
    effect(() => {
        const unsubUpdate = client.on('state:update', (update) => {
            if (update.version > version()) {
                state.set({ ...state(), [update.key]: update.value });
                version.set(update.version);
            }
        });
        const unsubMerge = client.on('state:merge', (update) => {
            if (update.version > version()) {
                state.set({ ...state(), ...update.data });
                version.set(update.version);
            }
        });
        const unsubSync = client.on('state:sync', (fullState) => {
            state.set(fullState.data);
            version.set(fullState.version);
        });
        // Request sync on connect
        if (client.status() === 'connected') {
            client.send('state:sync:request', {}, room);
        }
        return () => {
            unsubUpdate();
            unsubMerge();
            unsubSync();
        };
    });
    return {
        state: () => state(),
        get: (key) => state()[key],
        set,
        merge,
        version: () => version(),
    };
}
// ============================================================================
// Server-Side Room Manager
// ============================================================================
export class RoomManager {
    rooms = new Map();
    userRooms = new Map();
    join(roomId, userId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId).add(userId);
        if (!this.userRooms.has(userId)) {
            this.userRooms.set(userId, new Set());
        }
        this.userRooms.get(userId).add(roomId);
    }
    leave(roomId, userId) {
        this.rooms.get(roomId)?.delete(userId);
        this.userRooms.get(userId)?.delete(roomId);
        // Clean up empty rooms
        if (this.rooms.get(roomId)?.size === 0) {
            this.rooms.delete(roomId);
        }
    }
    leaveAll(userId) {
        const rooms = Array.from(this.userRooms.get(userId) || []);
        rooms.forEach(roomId => this.leave(roomId, userId));
        this.userRooms.delete(userId);
        return rooms;
    }
    getUsers(roomId) {
        return Array.from(this.rooms.get(roomId) || []);
    }
    getRooms(userId) {
        return Array.from(this.userRooms.get(userId) || []);
    }
    isInRoom(roomId, userId) {
        return this.rooms.get(roomId)?.has(userId) || false;
    }
    getRoomCount() {
        return this.rooms.size;
    }
    getUserCount(roomId) {
        return this.rooms.get(roomId)?.size || 0;
    }
}
// ============================================================================
// All types and classes are already exported inline above
// ============================================================================
//# sourceMappingURL=index.js.map