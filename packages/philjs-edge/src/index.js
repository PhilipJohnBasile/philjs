/**
 * PhilJS Edge - Edge Computing Primitives
 *
 * Unified API for edge computing across providers:
 * - Cloudflare Workers (KV, Durable Objects, D1, Queues, R2)
 * - Vercel Edge Config
 * - Deno KV
 * - Generic adapters
 */
import { signal, memo } from '@philjs/core';
export class MemoryKVStore {
    store = new Map();
    async get(key, options) {
        const stored = this.store.get(key);
        if (!stored)
            return null;
        if (stored.expiration && Date.now() / 1000 > stored.expiration) {
            this.store.delete(key);
            return null;
        }
        const value = stored.value;
        if (options?.type === 'json' && typeof value === 'string') {
            return JSON.parse(value);
        }
        return value;
    }
    async put(key, value, options) {
        let storedValue;
        if (value instanceof ReadableStream) {
            const reader = value.getReader();
            const chunks = [];
            while (true) {
                const { done, value: chunk } = await reader.read();
                if (done)
                    break;
                chunks.push(chunk);
            }
            // Combine chunks into single ArrayBuffer
            const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
            const combined = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
                combined.set(chunk, offset);
                offset += chunk.length;
            }
            storedValue = combined.buffer;
        }
        else {
            storedValue = value;
        }
        const entry = {
            value: storedValue,
        };
        if (options?.metadata) {
            entry.metadata = options.metadata;
        }
        if (options?.expirationTtl) {
            entry.expiration = Date.now() / 1000 + options.expirationTtl;
        }
        else if (options?.expiration) {
            entry.expiration = options.expiration;
        }
        this.store.set(key, entry);
    }
    async delete(key) {
        this.store.delete(key);
    }
    async list(options) {
        const keys = [];
        const prefix = options?.prefix || '';
        const limit = options?.limit || 1000;
        for (const [key, stored] of this.store) {
            if (key.startsWith(prefix)) {
                if (stored.expiration && Date.now() / 1000 > stored.expiration) {
                    this.store.delete(key);
                    continue;
                }
                const keyEntry = { name: key };
                if (stored.expiration !== undefined) {
                    keyEntry.expiration = stored.expiration;
                }
                if (stored.metadata !== undefined) {
                    keyEntry.metadata = stored.metadata;
                }
                keys.push(keyEntry);
                if (keys.length >= limit)
                    break;
            }
        }
        return {
            keys,
            complete: keys.length < limit,
        };
    }
    async getWithMetadata(key) {
        const stored = this.store.get(key);
        if (!stored)
            return { value: null, metadata: null };
        return {
            value: stored.value,
            metadata: stored.metadata || null,
        };
    }
}
// ============================================================================
// Cloudflare KV Wrapper
// ============================================================================
export function createCloudflareKV(binding) {
    return {
        async get(key, options) {
            return binding.get(key, options);
        },
        async put(key, value, options) {
            await binding.put(key, value, options);
        },
        async delete(key) {
            await binding.delete(key);
        },
        async list(options) {
            const result = await binding.list(options);
            return {
                keys: result.keys,
                cursor: result.cursor,
                complete: result.list_complete,
            };
        },
        async getWithMetadata(key) {
            return binding.getWithMetadata(key);
        },
    };
}
export class DurableObject {
    state;
    constructor(state) {
        this.state = state;
    }
}
// ============================================================================
// In-Memory Durable Storage
// ============================================================================
export class MemoryDurableStorage {
    store = new Map();
    async get(keyOrKeys) {
        if (Array.isArray(keyOrKeys)) {
            const result = new Map();
            for (const key of keyOrKeys) {
                const value = this.store.get(key);
                if (value !== undefined) {
                    result.set(key, value);
                }
            }
            return result;
        }
        return this.store.get(keyOrKeys);
    }
    async put(keyOrEntries, value) {
        if (typeof keyOrEntries === 'string') {
            this.store.set(keyOrEntries, value);
        }
        else {
            for (const [k, v] of Object.entries(keyOrEntries)) {
                this.store.set(k, v);
            }
        }
    }
    async delete(keyOrKeys) {
        if (Array.isArray(keyOrKeys)) {
            let count = 0;
            for (const key of keyOrKeys) {
                if (this.store.delete(key))
                    count++;
            }
            return count;
        }
        return this.store.delete(keyOrKeys);
    }
    async list(options) {
        const result = new Map();
        const prefix = options?.prefix || '';
        const limit = options?.limit || Infinity;
        let count = 0;
        for (const [key, value] of this.store) {
            if (count >= limit)
                break;
            if (!key.startsWith(prefix))
                continue;
            if (options?.start && key < options.start)
                continue;
            if (options?.end && key >= options.end)
                continue;
            result.set(key, value);
            count++;
        }
        return result;
    }
    async transaction(closure) {
        // Simple implementation - no true atomicity in memory
        return closure(this);
    }
}
export class MemoryQueue {
    queue = [];
    handler;
    options;
    processing = false;
    constructor(options = {}) {
        this.options = {
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
        };
        if (options.deadLetterQueue) {
            this.options.deadLetterQueue = options.deadLetterQueue;
        }
    }
    async send(message) {
        this.queue.push({
            id: Math.random().toString(36).slice(2),
            body: message,
            timestamp: Date.now(),
            retries: 0,
        });
        this.process();
    }
    async sendBatch(messages) {
        for (const message of messages) {
            await this.send(message);
        }
    }
    consume(handler) {
        this.handler = handler;
        this.process();
    }
    async process() {
        if (this.processing || !this.handler || this.queue.length === 0)
            return;
        this.processing = true;
        try {
            const batch = this.queue.splice(0, 10); // Process in batches of 10
            try {
                await this.handler(batch);
            }
            catch (error) {
                // Retry failed messages
                for (const msg of batch) {
                    if (msg.retries < (this.options.maxRetries || 3)) {
                        msg.retries++;
                        setTimeout(() => {
                            this.queue.push(msg);
                            this.process();
                        }, this.options.retryDelay || 1000);
                    }
                    else if (this.options.deadLetterQueue) {
                        await this.options.deadLetterQueue.send(msg.body);
                    }
                }
            }
        }
        finally {
            this.processing = false;
            if (this.queue.length > 0) {
                setTimeout(() => this.process(), 0);
            }
        }
    }
}
export class CronScheduler {
    jobs = new Map();
    timers = new Map();
    register(id, schedule, handler) {
        this.jobs.set(id, {
            id,
            schedule,
            handler,
            enabled: true,
        });
        this.scheduleNext(id);
    }
    unregister(id) {
        this.jobs.delete(id);
        const timer = this.timers.get(id);
        if (timer)
            clearTimeout(timer);
        this.timers.delete(id);
    }
    enable(id) {
        const job = this.jobs.get(id);
        if (job) {
            job.enabled = true;
            this.scheduleNext(id);
        }
    }
    disable(id) {
        const job = this.jobs.get(id);
        if (job) {
            job.enabled = false;
            const timer = this.timers.get(id);
            if (timer)
                clearTimeout(timer);
            this.timers.delete(id);
        }
    }
    scheduleNext(id) {
        const job = this.jobs.get(id);
        if (!job || !job.enabled)
            return;
        const nextRun = this.parseSchedule(job.schedule);
        job.nextRun = nextRun;
        const delay = nextRun.getTime() - Date.now();
        if (delay <= 0)
            return;
        const timer = setTimeout(async () => {
            job.lastRun = new Date();
            try {
                await job.handler();
            }
            catch (error) {
                console.error(`Cron job ${id} failed:`, error);
            }
            this.scheduleNext(id);
        }, delay);
        this.timers.set(id, timer);
    }
    parseSchedule(schedule) {
        // Simple implementation - for production use a proper cron parser
        const parts = schedule.split(' ');
        const now = new Date();
        if (parts.length === 1 && parts[0].endsWith('s')) {
            // Simple interval: "30s", "60s"
            const seconds = parseInt(parts[0]);
            return new Date(now.getTime() + seconds * 1000);
        }
        if (parts.length === 1 && parts[0].endsWith('m')) {
            const minutes = parseInt(parts[0]);
            return new Date(now.getTime() + minutes * 60 * 1000);
        }
        if (parts.length === 1 && parts[0].endsWith('h')) {
            const hours = parseInt(parts[0]);
            return new Date(now.getTime() + hours * 60 * 60 * 1000);
        }
        // Default: run in 1 minute
        return new Date(now.getTime() + 60 * 1000);
    }
    getJobs() {
        return Array.from(this.jobs.values());
    }
}
// ============================================================================
// useEdgeKV Hook
// ============================================================================
export function useEdgeKV(store, key) {
    const data = signal(null);
    const isLoading = signal(false);
    const error = signal(null);
    const fetch = async () => {
        isLoading.set(true);
        error.set(null);
        try {
            const value = await store.get(key, { type: 'json' });
            data.set(value);
        }
        catch (e) {
            error.set(e instanceof Error ? e : new Error(String(e)));
        }
        finally {
            isLoading.set(false);
        }
    };
    const set = async (value) => {
        isLoading.set(true);
        error.set(null);
        try {
            await store.put(key, JSON.stringify(value));
            data.set(value);
        }
        catch (e) {
            error.set(e instanceof Error ? e : new Error(String(e)));
        }
        finally {
            isLoading.set(false);
        }
    };
    const remove = async () => {
        isLoading.set(true);
        error.set(null);
        try {
            await store.delete(key);
            data.set(null);
        }
        catch (e) {
            error.set(e instanceof Error ? e : new Error(String(e)));
        }
        finally {
            isLoading.set(false);
        }
    };
    return {
        data: () => data(),
        isLoading: () => isLoading(),
        error: () => error(),
        fetch,
        set,
        remove,
    };
}
// ============================================================================
// Re-exports from specialized modules
// ============================================================================
export * from './geo-routing.js';
export * from './prefetch.js';
export * from './streaming.js';
export * from './state-replication.js';
export * from './smart-cache.js';
export * from './rate-limiter.js';
export * from './edge-functions.js';
// ============================================================================
// Exports - All types and classes defined above are already exported inline
// ============================================================================
//# sourceMappingURL=index.js.map