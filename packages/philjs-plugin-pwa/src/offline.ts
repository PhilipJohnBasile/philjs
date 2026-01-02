/**
 * Offline support utilities
 */

import { signal } from '@philjs/core';
import type { Signal } from '@philjs/core';

/**
 * Online/offline status signal
 */
export const isOnline: Signal<boolean> = signal(
  typeof navigator !== 'undefined' ? navigator.onLine : true
);

/**
 * Initialize offline detection
 */
export function initOfflineDetection(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
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
export async function queueOfflineRequest(
  url: string,
  options: RequestInit = {},
  queueName: string = 'sync-queue'
): Promise<void> {
  if (!('caches' in self)) {
    throw new Error('Cache API not supported');
  }

  const request = new Request(url, options);
  const cache = await caches.open(queueName);
  await cache.put(request, new Response(null));

  console.log('[Offline] Queued request:', url);
}

/**
 * Check if offline page is cached
 */
export async function isOfflinePageCached(offlinePage: string = '/offline.html'): Promise<boolean> {
  if (!('caches' in self)) {
    return false;
  }

  const cache = await caches.match(offlinePage);
  return !!cache;
}

/**
 * Prefetch offline page
 */
export async function prefetchOfflinePage(offlinePage: string = '/offline.html'): Promise<void> {
  if (!('caches' in self)) {
    return;
  }

  try {
    const response = await fetch(offlinePage);
    if (response.ok) {
      const cache = await caches.open('offline-pages');
      await cache.put(offlinePage, response);
    }
  } catch (error) {
    console.error('[Offline] Failed to prefetch offline page:', error);
  }
}
