/**
 * Background Sync API utilities
 */
/**
 * Check if Background Sync is supported
 */
export function isBackgroundSyncSupported() {
    return 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype;
}
/**
 * Register background sync
 */
export async function registerBackgroundSync(tag, options = {}) {
    if (!isBackgroundSyncSupported()) {
        console.warn('[Background Sync] Not supported');
        return;
    }
    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log('[Background Sync] Registered:', tag);
    }
    catch (error) {
        console.error('[Background Sync] Registration failed:', error);
        throw error;
    }
}
/**
 * Get registered sync tags
 */
export async function getSyncTags() {
    if (!isBackgroundSyncSupported()) {
        return [];
    }
    try {
        const registration = await navigator.serviceWorker.ready;
        return await registration.sync.getTags();
    }
    catch (error) {
        console.error('[Background Sync] Failed to get tags:', error);
        return [];
    }
}
/**
 * Queue data for background sync
 */
export async function queueForSync(data, tag = 'default-sync') {
    if (!('caches' in self)) {
        throw new Error('Cache API not supported');
    }
    // Store data in IndexedDB or Cache API
    const cache = await caches.open('sync-queue');
    const request = new Request(`/sync/${tag}/${Date.now()}`);
    const response = new Response(JSON.stringify(data));
    await cache.put(request, response);
    // Register background sync
    await registerBackgroundSync(tag);
}
//# sourceMappingURL=background-sync.js.map