/**
 * Background Sync API utilities
 */
import type { BackgroundSyncOptions } from './types.js';
/**
 * Check if Background Sync is supported
 */
export declare function isBackgroundSyncSupported(): boolean;
/**
 * Register background sync
 */
export declare function registerBackgroundSync(tag: string, options?: Partial<BackgroundSyncOptions>): Promise<void>;
/**
 * Get registered sync tags
 */
export declare function getSyncTags(): Promise<string[]>;
/**
 * Queue data for background sync
 */
export declare function queueForSync(data: any, tag?: string): Promise<void>;
//# sourceMappingURL=background-sync.d.ts.map