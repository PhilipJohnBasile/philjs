/**
 * Offline support utilities
 */
import { signal } from '@philjs/core';
/**
 * Online/offline status signal
 */
export const isOnline = signal(typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
    ? navigator.onLine
    : true);
/**
 * Initialize offline detection
 */
export function initOfflineDetection() {
    if (typeof window === 'undefined') {
        return () => { };
    }
    const handleOnline = () => isOnline.set(true);
    const handleOffline = () => isOnline.set(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}
/**
 * Queue request for background sync when offline
 */
export async function queueOfflineRequest(url, options = {}, queueName = 'sync-queue') {
    if (!('caches' in self)) {
        throw new Error('Cache API not supported');
    }
    const request = new Request(url, options);
    const cache = await caches.open(queueName);
    await cache.put(request, new Response(null));
}
/**
 * Check if offline page is cached
 */
export async function isOfflinePageCached(offlinePage = '/offline.html') {
    if (!('caches' in self)) {
        return false;
    }
    const cache = await caches.match(offlinePage);
    return !!cache;
}
/**
 * Prefetch offline page
 */
export async function prefetchOfflinePage(offlinePage = '/offline.html') {
    if (!('caches' in self)) {
        return;
    }
    try {
        const response = await fetch(offlinePage);
        if (response.ok) {
            const cache = await caches.open('offline-pages');
            await cache.put(offlinePage, response);
        }
    }
    catch (error) {
        console.error('[Offline] Failed to prefetch offline page:', error);
    }
}
//# sourceMappingURL=offline.js.map