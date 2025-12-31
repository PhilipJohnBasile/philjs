/**
 * High-performance batching utilities
 */
/**
 * Microtask scheduler for batching
 */
export class Scheduler {
    queue = [];
    scheduled = false;
    schedule(callback) {
        this.queue.push(callback);
        if (!this.scheduled) {
            this.scheduled = true;
            queueMicrotask(() => this.flush());
        }
    }
    flush() {
        this.scheduled = false;
        const callbacks = this.queue;
        this.queue = [];
        for (let i = 0; i < callbacks.length; i++) {
            callbacks[i]();
        }
    }
    clear() {
        this.queue = [];
        this.scheduled = false;
    }
}
// Global scheduler instance
const globalScheduler = new Scheduler();
/**
 * Batch multiple calls into a single execution
 */
export function batch(fn, options = {}) {
    const { wait = 0, maxSize = Infinity, leading = false } = options;
    let queue = [];
    let timeoutId = null;
    let lastCallTime = 0;
    const flush = () => {
        timeoutId = null;
        const items = queue;
        queue = [];
        if (items.length > 0) {
            // Execute with all batched args
            fn(...items[items.length - 1]);
        }
    };
    const batched = function (...args) {
        const now = Date.now();
        queue.push(args);
        // Leading edge
        if (leading && queue.length === 1 && now - lastCallTime > wait) {
            lastCallTime = now;
            flush();
            return;
        }
        // Max size reached
        if (queue.length >= maxSize) {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
            flush();
            return;
        }
        // Schedule flush
        if (timeoutId === null) {
            if (wait === 0) {
                globalScheduler.schedule(flush);
            }
            else {
                timeoutId = setTimeout(flush, wait);
            }
        }
    };
    // Attach flush method
    batched.flush = flush;
    return batched;
}
/**
 * Batch async operations
 */
export function batchAsync(fn, options = {}) {
    const { wait = 0, maxSize = Infinity } = options;
    let queue = [];
    let timeoutId = null;
    const flush = async () => {
        timeoutId = null;
        const items = queue;
        queue = [];
        if (items.length === 0)
            return;
        try {
            const results = await fn(items.map(p => p.item));
            for (let i = 0; i < items.length; i++) {
                items[i].resolve(results[i]);
            }
        }
        catch (error) {
            for (const pending of items) {
                pending.reject(error);
            }
        }
    };
    return (item) => {
        return new Promise((resolve, reject) => {
            queue.push({ item, resolve, reject });
            if (queue.length >= maxSize) {
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                }
                flush();
                return;
            }
            if (timeoutId === null) {
                if (wait === 0) {
                    globalScheduler.schedule(flush);
                }
                else {
                    timeoutId = setTimeout(flush, wait);
                }
            }
        });
    };
}
/**
 * Create a custom batcher with shared state
 */
export function createBatcher(processBatch, options = {}) {
    const { maxSize = Infinity } = options;
    let queue = [];
    return {
        add(item) {
            queue.push(item);
            if (queue.length >= maxSize) {
                this.flush();
            }
        },
        flush() {
            const items = queue;
            queue = [];
            return processBatch(items);
        },
        size() {
            return queue.length;
        },
    };
}
//# sourceMappingURL=batch.js.map