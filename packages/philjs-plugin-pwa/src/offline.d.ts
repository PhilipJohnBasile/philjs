/**
 * Offline support utilities
 */
import type { Signal } from 'philjs-core';
/**
 * Online/offline status signal
 */
export declare const isOnline: Signal<boolean>;
/**
 * Initialize offline detection
 */
export declare function initOfflineDetection(): () => void;
/**
 * Queue request for background sync when offline
 */
export declare function queueOfflineRequest(url: string, options?: RequestInit, queueName?: string): Promise<void>;
/**
 * Check if offline page is cached
 */
export declare function isOfflinePageCached(offlinePage?: string): Promise<boolean>;
/**
 * Prefetch offline page
 */
export declare function prefetchOfflinePage(offlinePage?: string): Promise<void>;
//# sourceMappingURL=offline.d.ts.map