/**
 * Service worker update notifications
 */
import { signal } from '@philjs/core';
/**
 * Whether an update is available
 */
export const hasUpdate = signal(false);
/**
 * Update version info
 */
export const updateInfo = signal(null);
/**
 * Initialize update checking
 */
export function initUpdateNotifications(options = {}) {
    const { checkInterval = 60 * 60 * 1000, autoCheck = true } = options;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return () => { };
    }
    let intervalId = null;
    const handleUpdateAvailable = (event) => {
        const detail = event.detail;
        hasUpdate.set(true);
        updateInfo.set({
            hasUpdate: true,
            version: detail?.version,
            releaseNotes: detail?.releaseNotes,
        });
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
export async function checkForUpdates() {
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
        }
        return hasUpdateNow;
    }
    catch (error) {
        console.error('[Updates] Failed to check for updates:', error);
        return false;
    }
}
/**
 * Apply update and reload
 */
export async function applyUpdate() {
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
export function dismissUpdate() {
    hasUpdate.set(false);
    updateInfo.set(null);
}
//# sourceMappingURL=updates.js.map