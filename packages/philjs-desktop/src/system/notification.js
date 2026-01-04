/**
 * System Notification APIs
 *
 * Uses @tauri-apps/plugin-notification for Tauri v2
 * with browser fallbacks when running outside Tauri context.
 */
import { isTauri } from '../tauri/context.js';
/**
 * Error thrown when notification operations fail
 */
export class NotificationError extends Error {
    cause;
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'NotificationError';
    }
}
/**
 * Notification API
 */
export const Notification = {
    /**
     * Request notification permission
     */
    async requestPermission() {
        if (!isTauri()) {
            try {
                const result = await window.Notification.requestPermission();
                return result;
            }
            catch (error) {
                throw new NotificationError('Failed to request notification permission in browser context', error);
            }
        }
        try {
            const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification');
            let permission = await isPermissionGranted();
            if (!permission) {
                const result = await requestPermission();
                permission = result === 'granted';
            }
            return permission ? 'granted' : 'denied';
        }
        catch (error) {
            throw new NotificationError('Failed to request notification permission. Ensure @tauri-apps/plugin-notification is installed and configured.', error);
        }
    },
    /**
     * Check if notifications are permitted
     */
    async isPermissionGranted() {
        if (!isTauri()) {
            try {
                return window.Notification.permission === 'granted';
            }
            catch {
                return false;
            }
        }
        try {
            const { isPermissionGranted } = await import('@tauri-apps/plugin-notification');
            return await isPermissionGranted();
        }
        catch (error) {
            throw new NotificationError('Failed to check notification permission. Ensure @tauri-apps/plugin-notification is installed and configured.', error);
        }
    },
    /**
     * Show a notification
     */
    async show(options) {
        if (!isTauri()) {
            // Browser fallback
            try {
                const notificationOptions = {};
                if (options.body !== undefined)
                    notificationOptions.body = options.body;
                if (options.icon !== undefined)
                    notificationOptions.icon = options.icon;
                if (options.silent !== undefined)
                    notificationOptions.silent = options.silent;
                new window.Notification(options.title, notificationOptions);
                return;
            }
            catch (error) {
                throw new NotificationError('Failed to show notification in browser context', error);
            }
        }
        try {
            const { sendNotification } = await import('@tauri-apps/plugin-notification');
            const tauriOptions = { title: options.title };
            if (options.body !== undefined)
                tauriOptions.body = options.body;
            if (options.icon !== undefined)
                tauriOptions.icon = options.icon;
            if (options.sound !== undefined)
                tauriOptions.sound = options.sound;
            if (options.largeBody !== undefined)
                tauriOptions.largeBody = options.largeBody;
            await sendNotification(tauriOptions);
        }
        catch (error) {
            throw new NotificationError('Failed to show notification. Ensure @tauri-apps/plugin-notification is installed and configured.', error);
        }
    },
    /**
     * Show a simple notification
     */
    async notify(title, body) {
        const options = { title };
        if (body !== undefined)
            options.body = body;
        return this.show(options);
    },
    /**
     * Schedule a notification
     */
    async schedule(options) {
        if (!isTauri()) {
            // Browser fallback using setTimeout
            const delay = options.at.getTime() - Date.now();
            if (delay > 0) {
                const id = setTimeout(() => {
                    this.show(options);
                }, delay);
                return id;
            }
            throw new NotificationError('Scheduled time must be in the future');
        }
        try {
            const { sendNotification, Schedule } = await import('@tauri-apps/plugin-notification');
            // Generate a unique ID for the scheduled notification
            const notificationId = Math.floor(Math.random() * 2147483647);
            // Tauri v2 uses Schedule.at() for scheduling
            const tauriOptions = {
                id: notificationId,
                title: options.title,
                schedule: Schedule.at(options.at, options.repeating ?? false),
            };
            if (options.body !== undefined)
                tauriOptions.body = options.body;
            sendNotification(tauriOptions);
            return notificationId;
        }
        catch (error) {
            throw new NotificationError('Failed to schedule notification. Ensure @tauri-apps/plugin-notification is installed and configured.', error);
        }
    },
    /**
     * Cancel a scheduled notification
     */
    async cancel(id) {
        if (!isTauri()) {
            clearTimeout(id);
            return;
        }
        try {
            const { cancel } = await import('@tauri-apps/plugin-notification');
            await cancel([id]);
        }
        catch (error) {
            throw new NotificationError('Failed to cancel notification. Ensure @tauri-apps/plugin-notification is installed and configured.', error);
        }
    },
    /**
     * Cancel all pending notifications
     */
    async cancelAll() {
        if (!isTauri()) {
            // Can't clear all timeouts in browser
            return;
        }
        try {
            const { cancelAll } = await import('@tauri-apps/plugin-notification');
            await cancelAll();
        }
        catch (error) {
            throw new NotificationError('Failed to cancel all notifications. Ensure @tauri-apps/plugin-notification is installed and configured.', error);
        }
    },
    /**
     * Remove all active/delivered notifications
     */
    async removeAllActive() {
        if (!isTauri()) {
            return;
        }
        try {
            const { removeAllActive } = await import('@tauri-apps/plugin-notification');
            await removeAllActive();
        }
        catch (error) {
            throw new NotificationError('Failed to remove all active notifications. Ensure @tauri-apps/plugin-notification is installed and configured.', error);
        }
    },
    /**
     * Get pending notifications
     */
    async getPending() {
        if (!isTauri()) {
            return [];
        }
        try {
            const { pending } = await import('@tauri-apps/plugin-notification');
            const notifications = await pending();
            return notifications.map((n) => {
                const result = { id: n.id };
                if (n.title !== undefined)
                    result.title = n.title;
                return result;
            });
        }
        catch (error) {
            throw new NotificationError('Failed to get pending notifications. Ensure @tauri-apps/plugin-notification is installed and configured.', error);
        }
    },
    /**
     * Register notification action types
     */
    async registerActionTypes(types) {
        if (!isTauri()) {
            return;
        }
        try {
            const { registerActionTypes } = await import('@tauri-apps/plugin-notification');
            await registerActionTypes([{
                    id: 'default',
                    actions: types,
                }]);
        }
        catch (error) {
            throw new NotificationError('Failed to register action types. Ensure @tauri-apps/plugin-notification is installed and configured.', error);
        }
    },
    /**
     * Listen for notification action events
     */
    async onAction(callback) {
        if (!isTauri()) {
            return () => { };
        }
        try {
            const { onAction } = await import('@tauri-apps/plugin-notification');
            const listener = await onAction((notification) => {
                const result = {
                    title: notification.title,
                };
                if (notification.id !== undefined)
                    result.id = notification.id;
                if (notification.actionTypeId !== undefined)
                    result.actionTypeId = notification.actionTypeId;
                if (notification.body !== undefined)
                    result.body = notification.body;
                callback(result);
            });
            return () => listener.unregister();
        }
        catch (error) {
            throw new NotificationError('Failed to register action listener. Ensure @tauri-apps/plugin-notification is installed and configured.', error);
        }
    },
    /**
     * Listen for notification received events
     */
    async onNotificationReceived(callback) {
        if (!isTauri()) {
            return () => { };
        }
        try {
            const { onNotificationReceived } = await import('@tauri-apps/plugin-notification');
            const listener = await onNotificationReceived((notification) => {
                const result = {
                    title: notification.title,
                };
                if (notification.id !== undefined)
                    result.id = notification.id;
                if (notification.body !== undefined)
                    result.body = notification.body;
                callback(result);
            });
            return () => listener.unregister();
        }
        catch (error) {
            throw new NotificationError('Failed to register notification listener. Ensure @tauri-apps/plugin-notification is installed and configured.', error);
        }
    },
};
// Convenience exports
export const requestNotificationPermission = Notification.requestPermission;
export const showNotification = Notification.show;
export const notify = Notification.notify;
export const scheduleNotification = Notification.schedule;
export const cancelNotification = Notification.cancel;
//# sourceMappingURL=notification.js.map