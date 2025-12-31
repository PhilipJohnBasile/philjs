/**
 * Notifications API
 *
 * Push notifications and local notifications.
 */
import { signal, effect } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// Notification State
// ============================================================================
/**
 * Notification permission state
 */
export const notificationPermission = signal('undetermined');
/**
 * Push token state
 */
export const pushToken = signal(null);
/**
 * Notification listeners
 */
const notificationListeners = new Set();
const responseListeners = new Set();
// ============================================================================
// Notifications API
// ============================================================================
/**
 * Notifications API singleton
 */
export const Notifications = {
    /**
     * Request notification permission
     */
    async requestPermission() {
        const platform = detectPlatform();
        if (platform === 'web') {
            if (!('Notification' in window)) {
                return 'denied';
            }
            const result = await window.Notification.requestPermission();
            const status = result === 'granted' ? 'granted' :
                result === 'denied' ? 'denied' : 'undetermined';
            notificationPermission.set(status);
            return status;
        }
        const status = await nativeBridge.call('Notifications', 'requestPermission');
        notificationPermission.set(status);
        return status;
    },
    /**
     * Get permission status
     */
    async getPermissionStatus() {
        const platform = detectPlatform();
        if (platform === 'web') {
            if (!('Notification' in window)) {
                return 'denied';
            }
            const permission = window.Notification.permission;
            const status = permission === 'granted' ? 'granted' :
                permission === 'denied' ? 'denied' : 'undetermined';
            notificationPermission.set(status);
            return status;
        }
        const status = await nativeBridge.call('Notifications', 'getPermissionStatus');
        notificationPermission.set(status);
        return status;
    },
    /**
     * Schedule a local notification
     */
    async scheduleNotification(content, trigger) {
        const platform = detectPlatform();
        const identifier = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        if (platform === 'web') {
            if (!('Notification' in window)) {
                throw new Error('Notifications not supported');
            }
            const showNotification = () => {
                const notificationOptions = {
                    silent: !content.sound,
                };
                if (content.body !== undefined)
                    notificationOptions.body = content.body;
                if (content.attachments?.[0]?.url !== undefined)
                    notificationOptions.icon = content.attachments[0].url;
                if (content.badge !== undefined)
                    notificationOptions.badge = content.badge.toString();
                if (content.data !== undefined)
                    notificationOptions.data = content.data;
                new window.Notification(content.title, notificationOptions);
            };
            if (!trigger) {
                showNotification();
            }
            else if (trigger.type === 'timeInterval') {
                setTimeout(showNotification, trigger.seconds * 1000);
            }
            else if (trigger.type === 'date') {
                const delay = trigger.date.getTime() - Date.now();
                if (delay > 0) {
                    setTimeout(showNotification, delay);
                }
            }
            return identifier;
        }
        return nativeBridge.call('Notifications', 'scheduleNotification', {
            identifier,
            content,
            trigger,
        });
    },
    /**
     * Present notification immediately (foreground)
     */
    async presentNotification(content) {
        return this.scheduleNotification(content);
    },
    /**
     * Cancel a scheduled notification
     */
    async cancelNotification(identifier) {
        const platform = detectPlatform();
        if (platform !== 'web') {
            await nativeBridge.call('Notifications', 'cancelNotification', identifier);
        }
    },
    /**
     * Cancel all scheduled notifications
     */
    async cancelAllNotifications() {
        const platform = detectPlatform();
        if (platform !== 'web') {
            await nativeBridge.call('Notifications', 'cancelAllNotifications');
        }
    },
    /**
     * Get all scheduled notifications
     */
    async getScheduledNotifications() {
        const platform = detectPlatform();
        if (platform === 'web') {
            return [];
        }
        return nativeBridge.call('Notifications', 'getScheduledNotifications');
    },
    /**
     * Set notification categories
     */
    async setCategories(categories) {
        const platform = detectPlatform();
        if (platform !== 'web') {
            await nativeBridge.call('Notifications', 'setCategories', categories);
        }
    },
    /**
     * Set badge count
     */
    async setBadgeCount(count) {
        const platform = detectPlatform();
        if (platform === 'web') {
            // Web badge API (limited support)
            if ('setAppBadge' in navigator) {
                if (count === 0) {
                    await navigator.clearAppBadge();
                }
                else {
                    await navigator.setAppBadge(count);
                }
            }
            return;
        }
        await nativeBridge.call('Notifications', 'setBadgeCount', count);
    },
    /**
     * Get badge count
     */
    async getBadgeCount() {
        const platform = detectPlatform();
        if (platform === 'web') {
            return 0;
        }
        return nativeBridge.call('Notifications', 'getBadgeCount');
    },
    /**
     * Register for push notifications
     */
    async registerForPushNotifications() {
        const platform = detectPlatform();
        if (platform === 'web') {
            // Web push requires service worker
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: '', // Would need VAPID key
                });
                const token = {
                    data: JSON.stringify(subscription.toJSON()),
                    type: 'fcm', // Web uses FCM-like
                };
                pushToken.set(token);
                return token;
            }
            throw new Error('Push notifications not supported');
        }
        const token = await nativeBridge.call('Notifications', 'registerForPushNotifications');
        pushToken.set(token);
        return token;
    },
    /**
     * Unregister from push notifications
     */
    async unregisterFromPushNotifications() {
        const platform = detectPlatform();
        if (platform === 'web') {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                }
            }
            pushToken.set(null);
            return;
        }
        await nativeBridge.call('Notifications', 'unregisterFromPushNotifications');
        pushToken.set(null);
    },
    /**
     * Add notification received listener
     */
    addNotificationReceivedListener(callback) {
        notificationListeners.add(callback);
        // Set up native listener
        const unsubscribe = nativeBridge.on('notificationReceived', callback);
        return () => {
            notificationListeners.delete(callback);
            unsubscribe();
        };
    },
    /**
     * Add notification response listener
     */
    addNotificationResponseListener(callback) {
        responseListeners.add(callback);
        // Set up native listener
        const unsubscribe = nativeBridge.on('notificationResponse', callback);
        return () => {
            responseListeners.delete(callback);
            unsubscribe();
        };
    },
    /**
     * Get last notification response (when app opened from notification)
     */
    async getLastNotificationResponse() {
        const platform = detectPlatform();
        if (platform === 'web') {
            return null;
        }
        return nativeBridge.call('Notifications', 'getLastNotificationResponse');
    },
};
// ============================================================================
// Hooks
// ============================================================================
/**
 * Hook for notification received events
 */
export function useNotificationReceived(callback) {
    effect(() => {
        const unsubscribe = Notifications.addNotificationReceivedListener(callback);
        return unsubscribe;
    });
}
/**
 * Hook for notification response events
 */
export function useNotificationResponse(callback) {
    effect(() => {
        const unsubscribe = Notifications.addNotificationResponseListener(callback);
        return unsubscribe;
    });
}
// ============================================================================
// Export
// ============================================================================
export default Notifications;
//# sourceMappingURL=Notifications.js.map