/**
 * @philjs/durable - Durable Objects for PhilJS
 *
 * Cloudflare-compatible Durable Objects implementation providing:
 * - Strongly consistent storage
 * - Transactional operations
 * - WebSocket support
 * - Alarm scheduling
 *
 * Works with Cloudflare Workers and provides a local emulation mode.
 */

// =============================================================================
// Core Types
// =============================================================================

export interface DurableObjectState {
    id: DurableObjectId;
    storage: DurableObjectStorage;
    blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
    waitUntil(promise: Promise<unknown>): void;
}

export interface DurableObjectId {
    toString(): string;
    equals(other: DurableObjectId): boolean;
    name?: string;
}

export interface DurableObjectStorage {
    get<T = unknown>(key: string): Promise<T | undefined>;
    get<T = unknown>(keys: string[]): Promise<Map<string, T>>;
    put<T>(key: string, value: T): Promise<void>;
    put<T>(entries: Record<string, T>): Promise<void>;
    delete(key: string): Promise<boolean>;
    delete(keys: string[]): Promise<number>;
    deleteAll(): Promise<void>;
    list<T = unknown>(options?: ListOptions): Promise<Map<string, T>>;
    transaction<T>(closure: (txn: DurableObjectTransaction) => Promise<T>): Promise<T>;
    getAlarm(): Promise<number | null>;
    setAlarm(scheduledTime: number | Date): Promise<void>;
    deleteAlarm(): Promise<void>;
    sync(): Promise<void>;
}

export interface DurableObjectTransaction {
    get<T = unknown>(key: string): Promise<T | undefined>;
    get<T = unknown>(keys: string[]): Promise<Map<string, T>>;
    put<T>(key: string, value: T): Promise<void>;
    put<T>(entries: Record<string, T>): Promise<void>;
    delete(key: string): Promise<boolean>;
    delete(keys: string[]): Promise<number>;
    deleteAll(): Promise<void>;
    rollback(): void;
}

export interface ListOptions {
    start?: string;
    startAfter?: string;
    end?: string;
    prefix?: string;
    reverse?: boolean;
    limit?: number;
}

export interface DurableObjectNamespace {
    idFromName(name: string): DurableObjectId;
    idFromString(id: string): DurableObjectId;
    newUniqueId(): DurableObjectId;
    get(id: DurableObjectId): DurableObjectStub;
}

export interface DurableObjectStub {
    id: DurableObjectId;
    fetch(request: Request | string, init?: RequestInit): Promise<Response>;
}

export interface Env {
    [key: string]: unknown;
}

// =============================================================================
// Base Durable Object Class
// =============================================================================

/**
 * Base class for Durable Objects
 *
 * @example
 * ```typescript
 * export class Counter extends PhilDurable {
 *   async fetch(request: Request): Promise<Response> {
 *     const value = await this.state.storage.get<number>('count') ?? 0;
 *
 *     if (request.method === 'POST') {
 *       await this.state.storage.put('count', value + 1);
 *       return new Response(String(value + 1));
 *     }
 *
 *     return new Response(String(value));
 *   }
 * }
 * ```
 */
export abstract class PhilDurable {
    protected state: DurableObjectState;
    protected env: Env;

    constructor(state: DurableObjectState, env: Env) {
        this.state = state;
        this.env = env;
    }

    /**
     * Handle incoming HTTP requests
     */
    abstract fetch(request: Request): Promise<Response>;

    /**
     * Handle scheduled alarms (optional)
     */
    async alarm?(): Promise<void>;

    /**
     * Handle WebSocket messages (optional)
     */
    async webSocketMessage?(ws: WebSocket, message: string | ArrayBuffer): Promise<void>;

    /**
     * Handle WebSocket close (optional)
     */
    async webSocketClose?(
        ws: WebSocket,
        code: number,
        reason: string,
        wasClean: boolean
    ): Promise<void>;

    /**
     * Handle WebSocket errors (optional)
     */
    async webSocketError?(ws: WebSocket, error: unknown): Promise<void>;

    // Utility methods

    /**
     * Get a value from storage with type safety
     */
    protected async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
        const value = await this.state.storage.get<T>(key);
        return value ?? defaultValue;
    }

    /**
     * Set a value in storage
     */
    protected async set<T>(key: string, value: T): Promise<void> {
        await this.state.storage.put(key, value);
    }

    /**
     * Delete a key from storage
     */
    protected async delete(key: string): Promise<boolean> {
        return this.state.storage.delete(key);
    }

    /**
     * Run operations in a transaction
     */
    protected async transaction<T>(
        fn: (txn: DurableObjectTransaction) => Promise<T>
    ): Promise<T> {
        return this.state.storage.transaction(fn);
    }

    /**
     * Schedule an alarm
     */
    protected async scheduleAlarm(when: Date | number): Promise<void> {
        await this.state.storage.setAlarm(when);
    }

    /**
     * Cancel a scheduled alarm
     */
    protected async cancelAlarm(): Promise<void> {
        await this.state.storage.deleteAlarm();
    }

    /**
     * Block concurrent requests while performing initialization
     */
    protected async blockConcurrencyWhile<T>(fn: () => Promise<T>): Promise<T> {
        return this.state.blockConcurrencyWhile(fn);
    }
}

// =============================================================================
// WebSocket-enabled Durable Object
// =============================================================================

/**
 * Durable Object with built-in WebSocket room support
 */
export abstract class WebSocketDurable extends PhilDurable {
    private sessions = new Map<WebSocket, SessionInfo>();

    protected abstract handleMessage(session: SessionInfo, message: string | ArrayBuffer): Promise<void>;

    async fetch(request: Request): Promise<Response> {
        const upgradeHeader = request.headers.get('Upgrade');

        if (upgradeHeader === 'websocket') {
            return this.handleWebSocketUpgrade(request);
        }

        return this.handleHttpRequest(request);
    }

    /**
     * Override to handle non-WebSocket HTTP requests
     */
    protected async handleHttpRequest(request: Request): Promise<Response> {
        return new Response('WebSocket endpoint', { status: 200 });
    }

    private async handleWebSocketUpgrade(request: Request): Promise<Response> {
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        const session: SessionInfo = {
            ws: server,
            id: crypto.randomUUID(),
            connectedAt: Date.now(),
            metadata: {},
        };

        this.sessions.set(server, session);

        server.accept();

        server.addEventListener('message', async (event) => {
            try {
                await this.handleMessage(session, event.data);
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        });

        server.addEventListener('close', async (event) => {
            this.sessions.delete(server);
            await this.onSessionClose?.(session, event.code, event.reason);
        });

        server.addEventListener('error', async (event) => {
            console.error('WebSocket error:', event);
            this.sessions.delete(server);
            await this.onSessionError?.(session, event);
        });

        await this.onSessionOpen?.(session);

        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }

    /**
     * Called when a new session connects
     */
    protected async onSessionOpen?(session: SessionInfo): Promise<void>;

    /**
     * Called when a session closes
     */
    protected async onSessionClose?(
        session: SessionInfo,
        code: number,
        reason: string
    ): Promise<void>;

    /**
     * Called when a session encounters an error
     */
    protected async onSessionError?(session: SessionInfo, error: Event): Promise<void>;

    /**
     * Broadcast a message to all connected sessions
     */
    protected broadcast(message: string | ArrayBuffer, except?: SessionInfo): void {
        for (const [ws, session] of this.sessions) {
            if (session !== except && ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        }
    }

    /**
     * Send a message to a specific session
     */
    protected send(session: SessionInfo, message: string | ArrayBuffer): void {
        if (session.ws.readyState === WebSocket.OPEN) {
            session.ws.send(message);
        }
    }

    /**
     * Get all connected sessions
     */
    protected getSessions(): SessionInfo[] {
        return Array.from(this.sessions.values());
    }

    /**
     * Get session count
     */
    protected getSessionCount(): number {
        return this.sessions.size;
    }

    /**
     * Close a specific session
     */
    protected closeSession(session: SessionInfo, code?: number, reason?: string): void {
        session.ws.close(code, reason);
        this.sessions.delete(session.ws);
    }
}

export interface SessionInfo {
    ws: WebSocket;
    id: string;
    connectedAt: number;
    metadata: Record<string, unknown>;
}

// =============================================================================
// Rate Limiting Durable Object
// =============================================================================

/**
 * Built-in rate limiting Durable Object
 */
export class RateLimiter extends PhilDurable {
    private config = {
        maxRequests: 100,
        windowMs: 60000, // 1 minute
    };

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const action = url.pathname.split('/').pop();

        switch (action) {
            case 'check':
                return this.check();
            case 'configure':
                return this.configure(request);
            case 'reset':
                return this.reset();
            default:
                return new Response('Unknown action', { status: 400 });
        }
    }

    private async check(): Promise<Response> {
        const now = Date.now();
        const windowStart = await this.get<number>('windowStart') ?? now;
        let count = await this.get<number>('count') ?? 0;

        // Reset if window expired
        if (now - windowStart >= this.config.windowMs) {
            await this.transaction(async (txn) => {
                await txn.put('windowStart', now);
                await txn.put('count', 1);
            });
            return Response.json({ allowed: true, remaining: this.config.maxRequests - 1 });
        }

        // Check limit
        if (count >= this.config.maxRequests) {
            const retryAfter = Math.ceil((windowStart + this.config.windowMs - now) / 1000);
            return Response.json(
                { allowed: false, remaining: 0, retryAfter },
                {
                    status: 429,
                    headers: { 'Retry-After': String(retryAfter) },
                }
            );
        }

        // Increment count
        count++;
        await this.set('count', count);

        return Response.json({
            allowed: true,
            remaining: this.config.maxRequests - count,
        });
    }

    private async configure(request: Request): Promise<Response> {
        const body = await request.json() as Partial<typeof this.config>;

        if (body.maxRequests) this.config.maxRequests = body.maxRequests;
        if (body.windowMs) this.config.windowMs = body.windowMs;

        return Response.json({ success: true, config: this.config });
    }

    private async reset(): Promise<Response> {
        await this.state.storage.deleteAll();
        return Response.json({ success: true });
    }
}

// =============================================================================
// Counter Durable Object
// =============================================================================

/**
 * Simple counter Durable Object example
 */
export class Counter extends PhilDurable {
    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const action = url.pathname.split('/').pop();

        switch (action) {
            case 'increment':
                return this.increment();
            case 'decrement':
                return this.decrement();
            case 'value':
            case '':
                return this.getValue();
            case 'reset':
                return this.resetCounter();
            default:
                return new Response('Unknown action', { status: 400 });
        }
    }

    private async increment(): Promise<Response> {
        const value = await this.get<number>('value') ?? 0;
        const newValue = value + 1;
        await this.set('value', newValue);
        return Response.json({ value: newValue });
    }

    private async decrement(): Promise<Response> {
        const value = await this.get<number>('value') ?? 0;
        const newValue = value - 1;
        await this.set('value', newValue);
        return Response.json({ value: newValue });
    }

    private async getValue(): Promise<Response> {
        const value = await this.get<number>('value') ?? 0;
        return Response.json({ value });
    }

    private async resetCounter(): Promise<Response> {
        await this.set('value', 0);
        return Response.json({ value: 0 });
    }
}

// =============================================================================
// Chat Room Durable Object
// =============================================================================

interface ChatMessage {
    id: string;
    userId: string;
    username: string;
    content: string;
    timestamp: number;
}

/**
 * Chat room Durable Object with message history
 */
export class ChatRoom extends WebSocketDurable {
    private messageHistory: ChatMessage[] = [];
    private maxHistoryLength = 100;

    protected async handleMessage(session: SessionInfo, message: string | ArrayBuffer): Promise<void> {
        if (typeof message !== 'string') return;

        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'join':
                    await this.handleJoin(session, data);
                    break;
                case 'message':
                    await this.handleChatMessage(session, data);
                    break;
                case 'typing':
                    this.handleTyping(session, data);
                    break;
            }
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    }

    private async handleJoin(session: SessionInfo, data: { username: string }): Promise<void> {
        session.metadata.username = data.username;
        session.metadata.userId = session.id;

        // Send message history
        this.send(session, JSON.stringify({
            type: 'history',
            messages: this.messageHistory.slice(-50),
        }));

        // Broadcast join notification
        this.broadcast(JSON.stringify({
            type: 'userJoined',
            userId: session.id,
            username: data.username,
            userCount: this.getSessionCount(),
        }));
    }

    private async handleChatMessage(
        session: SessionInfo,
        data: { content: string }
    ): Promise<void> {
        const chatMessage: ChatMessage = {
            id: crypto.randomUUID(),
            userId: session.id,
            username: session.metadata.username as string || 'Anonymous',
            content: data.content,
            timestamp: Date.now(),
        };

        // Store in memory (could also persist to storage)
        this.messageHistory.push(chatMessage);
        if (this.messageHistory.length > this.maxHistoryLength) {
            this.messageHistory.shift();
        }

        // Persist latest messages
        await this.set('messages', this.messageHistory);

        // Broadcast to all
        this.broadcast(JSON.stringify({
            type: 'message',
            ...chatMessage,
        }));
    }

    private handleTyping(session: SessionInfo, data: { isTyping: boolean }): void {
        this.broadcast(
            JSON.stringify({
                type: 'typing',
                userId: session.id,
                username: session.metadata.username,
                isTyping: data.isTyping,
            }),
            session
        );
    }

    protected async onSessionOpen(session: SessionInfo): Promise<void> {
        // Load message history from storage on first connection
        if (this.messageHistory.length === 0) {
            const stored = await this.get<ChatMessage[]>('messages');
            if (stored) {
                this.messageHistory = stored;
            }
        }
    }

    protected async onSessionClose(
        session: SessionInfo,
        code: number,
        reason: string
    ): Promise<void> {
        this.broadcast(JSON.stringify({
            type: 'userLeft',
            userId: session.id,
            username: session.metadata.username,
            userCount: this.getSessionCount(),
        }));
    }
}

// =============================================================================
// Local Emulation (for development/testing)
// =============================================================================

/**
 * In-memory storage for local development
 */
class LocalStorage implements DurableObjectStorage {
    private store = new Map<string, unknown>();
    private alarm: number | null = null;

    async get<T>(keyOrKeys: string | string[]): Promise<T | Map<string, T> | undefined> {
        if (Array.isArray(keyOrKeys)) {
            const result = new Map<string, T>();
            for (const key of keyOrKeys) {
                const value = this.store.get(key) as T | undefined;
                if (value !== undefined) {
                    result.set(key, value);
                }
            }
            return result;
        }
        return this.store.get(keyOrKeys) as T | undefined;
    }

    async put<T>(keyOrEntries: string | Record<string, T>, value?: T): Promise<void> {
        if (typeof keyOrEntries === 'string') {
            this.store.set(keyOrEntries, value);
        } else {
            for (const [k, v] of Object.entries(keyOrEntries)) {
                this.store.set(k, v);
            }
        }
    }

    async delete(keyOrKeys: string | string[]): Promise<boolean | number> {
        if (Array.isArray(keyOrKeys)) {
            let count = 0;
            for (const key of keyOrKeys) {
                if (this.store.delete(key)) count++;
            }
            return count;
        }
        return this.store.delete(keyOrKeys);
    }

    async deleteAll(): Promise<void> {
        this.store.clear();
    }

    async list<T>(options?: ListOptions): Promise<Map<string, T>> {
        const result = new Map<string, T>();
        let keys = Array.from(this.store.keys());

        if (options?.prefix) {
            keys = keys.filter(k => k.startsWith(options.prefix!));
        }
        if (options?.start) {
            keys = keys.filter(k => k >= options.start!);
        }
        if (options?.startAfter) {
            keys = keys.filter(k => k > options.startAfter!);
        }
        if (options?.end) {
            keys = keys.filter(k => k < options.end!);
        }

        keys.sort();
        if (options?.reverse) {
            keys.reverse();
        }
        if (options?.limit) {
            keys = keys.slice(0, options.limit);
        }

        for (const key of keys) {
            result.set(key, this.store.get(key) as T);
        }
        return result;
    }

    async transaction<T>(closure: (txn: DurableObjectTransaction) => Promise<T>): Promise<T> {
        const snapshot = new Map(this.store);
        let rolledBack = false;

        const txn: DurableObjectTransaction = {
            get: this.get.bind(this),
            put: this.put.bind(this),
            delete: this.delete.bind(this),
            deleteAll: this.deleteAll.bind(this),
            rollback: () => {
                rolledBack = true;
            },
        };

        try {
            const result = await closure(txn);
            if (rolledBack) {
                this.store = snapshot;
            }
            return result;
        } catch (error) {
            this.store = snapshot;
            throw error;
        }
    }

    async getAlarm(): Promise<number | null> {
        return this.alarm;
    }

    async setAlarm(scheduledTime: number | Date): Promise<void> {
        this.alarm = typeof scheduledTime === 'number' ? scheduledTime : scheduledTime.getTime();
    }

    async deleteAlarm(): Promise<void> {
        this.alarm = null;
    }

    async sync(): Promise<void> {
        // No-op for local storage
    }
}

/**
 * Create a local ID for testing
 */
class LocalId implements DurableObjectId {
    private _id: string;
    public name?: string;

    constructor(idOrName: string, isName = false) {
        if (isName) {
            this.name = idOrName;
            this._id = `name:${idOrName}`;
        } else {
            this._id = idOrName;
        }
    }

    toString(): string {
        return this._id;
    }

    equals(other: DurableObjectId): boolean {
        return this._id === other.toString();
    }
}

/**
 * Local namespace for development/testing
 */
export class LocalNamespace implements DurableObjectNamespace {
    private instances = new Map<string, PhilDurable>();
    private DurableClass: new (state: DurableObjectState, env: Env) => PhilDurable;
    private env: Env;

    constructor(
        DurableClass: new (state: DurableObjectState, env: Env) => PhilDurable,
        env: Env = {}
    ) {
        this.DurableClass = DurableClass;
        this.env = env;
    }

    idFromName(name: string): DurableObjectId {
        return new LocalId(name, true);
    }

    idFromString(id: string): DurableObjectId {
        return new LocalId(id);
    }

    newUniqueId(): DurableObjectId {
        return new LocalId(crypto.randomUUID());
    }

    get(id: DurableObjectId): DurableObjectStub {
        const idStr = id.toString();

        if (!this.instances.has(idStr)) {
            const storage = new LocalStorage();
            const state: DurableObjectState = {
                id,
                storage,
                blockConcurrencyWhile: async <T>(callback: () => Promise<T>) => callback(),
                waitUntil: () => {},
            };
            this.instances.set(idStr, new this.DurableClass(state, this.env));
        }

        const instance = this.instances.get(idStr)!;

        return {
            id,
            fetch: (request: Request | string, init?: RequestInit) => {
                const req = typeof request === 'string' ? new Request(request, init) : request;
                return instance.fetch(req);
            },
        };
    }
}

// =============================================================================
// Decorator and Helpers
// =============================================================================

/**
 * Decorator to define a Durable Object class
 */
export function defineDurable<T extends PhilDurable>(
    cls: new (state: DurableObjectState, env: Env) => T
): new (state: DurableObjectState, env: Env) => T {
    return cls;
}

/**
 * Create a namespace binding for a Durable Object class (for local dev)
 */
export function createNamespace(
    DurableClass: new (state: DurableObjectState, env: Env) => PhilDurable,
    env?: Env
): DurableObjectNamespace {
    return new LocalNamespace(DurableClass, env);
}

/**
 * Helper to create a simple key-value Durable Object
 */
export function createKVDurable(): typeof PhilDurable {
    return class KVDurable extends PhilDurable {
        async fetch(request: Request): Promise<Response> {
            const url = new URL(request.url);
            const key = url.pathname.slice(1);

            if (request.method === 'GET') {
                const value = await this.get(key);
                if (value === undefined) {
                    return new Response('Not found', { status: 404 });
                }
                return Response.json(value);
            }

            if (request.method === 'PUT' || request.method === 'POST') {
                const value = await request.json();
                await this.set(key, value);
                return new Response('OK', { status: 200 });
            }

            if (request.method === 'DELETE') {
                const deleted = await this.delete(key);
                return new Response(deleted ? 'Deleted' : 'Not found', {
                    status: deleted ? 200 : 404,
                });
            }

            return new Response('Method not allowed', { status: 405 });
        }
    };
}

// =============================================================================
// Export Types
// =============================================================================

export type {
    DurableObjectState,
    DurableObjectId,
    DurableObjectStorage,
    DurableObjectTransaction,
    DurableObjectNamespace,
    DurableObjectStub,
    ListOptions,
    Env,
};
