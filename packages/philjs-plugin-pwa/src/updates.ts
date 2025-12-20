/**
 * Service worker update notifications
 */

import { signal } from 'philjs-core';
import type { Signal } from 'philjs-core';
import type { UpdateCheckResult } from './types.js';

/**
 * Whether an update is available
 */
export const hasUpdate: Signal<boolean> = signal(false);

/**
 * Update version info
 */
export const updateInfo: Signal<UpdateCheckResult | null> = signal(null);

/**
 * Initialize update checking
 */
export function initUpdateNotifications(options: {
  checkInterval?: number;
  autoCheck?: boolean;
} = {}): () => void {
  const { checkInterval = 60 * 60 * 1000, autoCheck = true } = options;

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return () => {};
  }

  let intervalId: number | null = null;

  const handleUpdateAvailable = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    hasUpdate.set(true);
    updateInfo.set({
      hasUpdate: true,
      version: detail?.version,
      releaseNotes: detail?.releaseNotes,
    });

    console.log('[Updates] Update available');

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwa-update-ready', { detail }));
  };

  window.addEventListener('pwa-update-available', handleUpdateAvailable);

  // Auto check for updates
  if (autoCheck) {
    intervalId = window.setInterval(() => {
      checkForUpdates();
    }, checkInterval);

    // Check immediately
    checkForUpdates();
  }

  return () => {
    window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
  };
}

/**
 * Check for service worker updates
 */
export async function checkForUpdates(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return false;
    }

    await registration.update();

    const hasUpdateNow = !!registration.waiting || !!registration.installing;

    if (hasUpdateNow) {
      hasUpdate.set(true);
      console.log('[Updates] Update found');
    }

    return hasUpdateNow;
  } catch (error) {
    console.error('[Updates] Failed to check for updates:', error);
    return false;
  }
}

/**
 * Apply update and reload
 */
export async function applyUpdate(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();

  if (registration?.waiting) {
    // Tell the waiting service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload when the new service worker takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
}

/**
 * Dismiss update notification
 */
export function dismissUpdate(): void {
  hasUpdate.set(false);
  updateInfo.set(null);
}
