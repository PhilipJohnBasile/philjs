// @ts-nocheck
/**
 * PhilJS Native - Capacitor Push Notifications Plugin
 *
 * Provides push notification support with registration,
 * handling, and local notification scheduling.
 */
import { signal, effect } from '@philjs/core';
import { isNativePlatform, callPlugin, registerPlugin, getCapacitorPlatform, } from '../index.js';
// ============================================================================
// State
// ============================================================================
/**
 * Push notification permission
 */
export const notificationPermission = signal('prompt');
/**
 * Push token
 */
export const pushToken = signal(null);
/**
 * Last received notification
 */
export const lastNotification = signal(null);
const registrationListeners = new Set();
const registrationErrorListeners = new Set();
const notificationReceivedListeners = new Set();
const notificationActionListeners = new Set();
// ============================================================================
// Web Implementation
// ============================================================================
const WebNotifications = {
    async requestPermissions() {
        if (!('Notification' in window)) {
            return { receive: 'denied' };
        }
        const result = await Notification.requestPermission();
        const permission = result;
        notificationPermission.set(permission);
        return { receive: permission };
    },
    async checkPermissions() {
        if (!('Notification' in window)) {
            return { receive: 'denied' };
        }
        const permission = Notification.permission;
        notificationPermission.set(permission);
        return { receive: permission };
    },
    async register() {
        // Web push requires service worker setup
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            registrationErrorListeners.forEach((cb) => cb({ error: 'Push notifications not supported' }));
            return;
        }
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                // This should be configured by the app
                localStorage.getItem('philjs_vapid_key') || ''),
            });
            const token = JSON.stringify(subscription);
            pushToken.set(token);
            registrationListeners.forEach((cb) => cb({ value: token }));
        }
        catch (error) {
            registrationErrorListeners.forEach((cb) => cb({ error: error.message }));
        }
    },
    async unregister() {
        if (!('serviceWorker' in navigator))
            return;
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            await subscription?.unsubscribe();
            pushToken.set(null);
        }
        catch {
            // Ignore errors
        }
    },
    async schedule(options) {
        if (!('Notification' in window))
            return;
        const show = () => {
            const notification = new Notification(options.title, {
                body: options.body,
                icon: options.largeIcon,
                badge: options.badge?.toString(),
                tag: options.id.toString(),
                data: options.extra,
            });
            notification.onclick = () => {
                notificationActionListeners.forEach((cb) => cb({
                    actionId: 'tap',
                    notification: {
                        id: options.id.toString(),
                        title: options.title,
                        body: options.body,
                        data: options.extra,
                    },
                }));
            };
        };
        if (options.schedule?.at) {
            const delay = options.schedule.at.getTime() - Date.now();
            if (delay > 0) {
                setTimeout(show, delay);
            }
        }
        else {
            show();
        }
    },
    async cancel(ids) {
        // Web notifications can't be cancelled once shown
        // but we can close active ones
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            const notifications = await registration.getNotifications();
            notifications
                .filter((n) => ids.includes(Number(n.tag)))
                .forEach((n) => n.close());
        }
    },
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    },
};
// ============================================================================
// Push Notifications API
// ============================================================================
registerPlugin('PushNotifications', { web: WebNotifications });
/**
 * Push Notifications API
 */
export const CapacitorPushNotifications = {
    /**
     * Request permission for push notifications
     */
    async requestPermissions() {
        if (!isNativePlatform()) {
            return WebNotifications.requestPermissions();
        }
        try {
            const result = await callPlugin('PushNotifications', 'requestPermissions');
            notificationPermission.set(result.receive);
            return result;
        }
        catch {
            return { receive: 'denied' };
        }
    },
    /**
     * Check current permissions
     */
    async checkPermissions() {
        if (!isNativePlatform()) {
            return WebNotifications.checkPermissions();
        }
        try {
            const result = await callPlugin('PushNotifications', 'checkPermissions');
            notificationPermission.set(result.receive);
            return result;
        }
        catch {
            return { receive: 'prompt' };
        }
    },
    /**
     * Register for push notifications
     */
    async register() {
        if (!isNativePlatform()) {
            return WebNotifications.register();
        }
        try {
            await callPlugin('PushNotifications', 'register');
        }
        catch (error) {
            registrationErrorListeners.forEach((cb) => cb({ error: error.message }));
        }
    },
    /**
     * Unregister from push notifications
     */
    async unregister() {
        if (!isNativePlatform()) {
            return WebNotifications.unregister();
        }
        try {
            await callPlugin('PushNotifications', 'unregister');
            pushToken.set(null);
        }
        catch {
            // Ignore errors
        }
    },
    /**
     * Get delivered notifications
     */
    async getDeliveredNotifications() {
        if (!isNativePlatform()) {
            return { notifications: [] };
        }
        try {
            return await callPlugin('PushNotifications', 'getDeliveredNotifications');
        }
        catch {
            return { notifications: [] };
        }
    },
    /**
     * Remove delivered notifications
     */
    async removeDeliveredNotifications(options) {
        if (!isNativePlatform())
            return;
        try {
            await callPlugin('PushNotifications', 'removeDeliveredNotifications', options);
        }
        catch {
            // Ignore errors
        }
    },
    /**
     * Remove all delivered notifications
     */
    async removeAllDeliveredNotifications() {
        if (!isNativePlatform())
            return;
        try {
            await callPlugin('PushNotifications', 'removeAllDeliveredNotifications');
        }
        catch {
            // Ignore errors
        }
    },
    /**
     * Create notification channel (Android)
     */
    async createChannel(channel) {
        if (getCapacitorPlatform() !== 'android')
            return;
        try {
            await callPlugin('PushNotifications', 'createChannel', channel);
        }
        catch {
            // Ignore errors
        }
    },
    /**
     * Delete notification channel (Android)
     */
    async deleteChannel(options) {
        if (getCapacitorPlatform() !== 'android')
            return;
        try {
            await callPlugin('PushNotifications', 'deleteChannel', options);
        }
        catch {
            // Ignore errors
        }
    },
    /**
     * List notification channels (Android)
     */
    async listChannels() {
        if (getCapacitorPlatform() !== 'android') {
            return { channels: [] };
        }
        try {
            return await callPlugin('PushNotifications', 'listChannels');
        }
        catch {
            return { channels: [] };
        }
    },
    /**
     * Add registration listener
     */
    addRegistrationListener(callback) {
        if (isNativePlatform()) {
            const capacitor = window.Capacitor;
            if (capacitor?.Plugins?.PushNotifications) {
                const handle = capacitor.Plugins.PushNotifications.addListener('registration', (token) => {
                    pushToken.set(token.value);
                    callback(token);
                });
                return () => handle.remove();
            }
        }
        registrationListeners.add(callback);
        return () => registrationListeners.delete(callback);
    },
    /**
     * Add registration error listener
     */
    addRegistrationErrorListener(callback) {
        if (isNativePlatform()) {
            const capacitor = window.Capacitor;
            if (capacitor?.Plugins?.PushNotifications) {
                const handle = capacitor.Plugins.PushNotifications.addListener('registrationError', callback);
                return () => handle.remove();
            }
        }
        registrationErrorListeners.add(callback);
        return () => registrationErrorListeners.delete(callback);
    },
    /**
     * Add push notification received listener
     */
    addReceivedListener(callback) {
        if (isNativePlatform()) {
            const capacitor = window.Capacitor;
            if (capacitor?.Plugins?.PushNotifications) {
                const handle = capacitor.Plugins.PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    lastNotification.set(notification);
                    callback(notification);
                });
                return () => handle.remove();
            }
        }
        notificationReceivedListeners.add(callback);
        return () => notificationReceivedListeners.delete(callback);
    },
    /**
     * Add notification action listener
     */
    addActionListener(callback) {
        if (isNativePlatform()) {
            const capacitor = window.Capacitor;
            if (capacitor?.Plugins?.PushNotifications) {
                const handle = capacitor.Plugins.PushNotifications.addListener('pushNotificationActionPerformed', callback);
                return () => handle.remove();
            }
        }
        notificationActionListeners.add(callback);
        return () => notificationActionListeners.delete(callback);
    },
    /**
     * Remove all listeners
     */
    removeAllListeners() {
        registrationListeners.clear();
        registrationErrorListeners.clear();
        notificationReceivedListeners.clear();
        notificationActionListeners.clear();
        if (isNativePlatform()) {
            const capacitor = window.Capacitor;
            capacitor?.Plugins?.PushNotifications?.removeAllListeners?.();
        }
    },
};
// ============================================================================
// Local Notifications API
// ============================================================================
/**
 * Local Notifications API
 */
export const CapacitorLocalNotifications = {
    /**
     * Schedule local notifications
     */
    async schedule(options) {
        if (!isNativePlatform()) {
            for (const notification of options.notifications) {
                await WebNotifications.schedule(notification);
            }
            return {
                notifications: options.notifications.map((n) => ({ id: n.id })),
            };
        }
        try {
            return await callPlugin('LocalNotifications', 'schedule', options);
        }
        catch {
            return { notifications: [] };
        }
    },
    /**
     * Cancel scheduled notifications
     */
    async cancel(options) {
        if (!isNativePlatform()) {
            await WebNotifications.cancel(options.notifications.map((n) => n.id));
            return;
        }
        try {
            await callPlugin('LocalNotifications', 'cancel', options);
        }
        catch {
            // Ignore errors
        }
    },
    /**
     * Get pending notifications
     */
    async getPending() {
        if (!isNativePlatform()) {
            return { notifications: [] };
        }
        try {
            return await callPlugin('LocalNotifications', 'getPending');
        }
        catch {
            return { notifications: [] };
        }
    },
    /**
     * Register action types
     */
    async registerActionTypes(options) {
        if (!isNativePlatform())
            return;
        try {
            await callPlugin('LocalNotifications', 'registerActionTypes', options);
        }
        catch {
            // Ignore errors
        }
    },
};
// ============================================================================
// Hooks
// ============================================================================
/**
 * Hook for notification permission
 */
export function useNotificationPermission() {
    return notificationPermission();
}
/**
 * Hook for push token
 */
export function usePushToken() {
    return pushToken();
}
/**
 * Hook for last notification
 */
export function useLastNotification() {
    return lastNotification();
}
/**
 * Hook for notification received events
 */
export function useNotificationReceived(callback) {
    effect(() => {
        const unsubscribe = CapacitorPushNotifications.addReceivedListener(callback);
        return unsubscribe;
    });
}
/**
 * Hook for notification action events
 */
export function useNotificationAction(callback) {
    effect(() => {
        const unsubscribe = CapacitorPushNotifications.addActionListener(callback);
        return unsubscribe;
    });
}
// ============================================================================
// Exports
// ============================================================================
export { CapacitorPushNotifications as PushNotifications, CapacitorLocalNotifications as LocalNotifications, };
export default CapacitorPushNotifications;
//# sourceMappingURL=notifications.js.map