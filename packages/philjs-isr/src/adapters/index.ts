/**
 * PhilJS ISR Cache Adapters
 *
 * Export all cache adapter implementations.
 */

export { MemoryCacheAdapter, createMemoryCache } from './memory.js';
export type { MemoryCacheConfig } from './memory.js';

// Redis adapter requires ioredis - use dynamic import: const { RedisCacheAdapter } = await import('@philjs/isr/adapters/redis');

export { FilesystemCacheAdapter, createFilesystemCache } from './filesystem.js';
export type { FilesystemCacheConfig } from './filesystem.js';

export { CloudflareKVAdapter, createCloudflareKVCache } from './cloudflare-kv.js';
export type { CloudflareKVConfig } from './cloudflare-kv.js';

export { VercelKVAdapter, createVercelKVCache } from './vercel.js';
export type { VercelKVConfig } from './vercel.js';
