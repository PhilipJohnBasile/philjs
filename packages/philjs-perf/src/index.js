/**
 * @philjs/perf - High-performance runtime utilities
 *
 * Zero-dependency, tree-shakeable performance primitives
 */
export { memo, memoWeak, memoAsync, clearMemoCache } from './memo.js';
export { batch, batchAsync, createBatcher, Scheduler } from './batch.js';
export { createPool, ObjectPool } from './pool.js';
export { lazy, lazyAsync, LazyValue } from './lazy.js';
export { debounce, throttle, rafThrottle } from './timing.js';
export { LRUCache, createLRU } from './cache.js';
//# sourceMappingURL=index.js.map