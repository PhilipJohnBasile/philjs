/**
 * System Notification APIs
 *
 * Uses @tauri-apps/plugin-notification for Tauri v2
 * with browser fallbacks when running outside Tauri context.
 */

import { isTauri } from '../tauri/context';

/**
 * Error thrown when notification operations fail
 */
export class NotificationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'NotificationError';
  }
}

// Notification types
export interface NotificationOptions {
  /** Notification title */
  title: string;
  /** Notification body */
  body?: string;
  /** Notification icon path */
  icon?: string;
  /** Sound to play */
  sound?: string;
  /** Large body (multi-line) */
  largeBody?: string;
  /** Whether notification is silent */
  silent?: boolean;
}

export interface NotificationAction {
  /** Action ID */
  id: string;
  /** Action title */
  title: string;
}

export interface ScheduledNotificationOptions extends NotificationOptions {
  /** When to show notification (timestamp) */
  at: Date;
  /** Whether to repeat */
  repeating?: boolean;
}

/**
 * Notification API
 */
export const Notification = {
  /**
   * Request notification permission
   */
  async requestPermission(): Promise<'granted' | 'denied' | 'default'> {
    if (!isTauri()) {
      try {
        const result = await window.Notification.requestPermission();
        return result;
      } catch (error) {
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
    } catch (error) {
      throw new NotificationError(
        'Failed to request notification permission. Ensure @tauri-apps/plugin-notification is installed and configured.',
        error
      );
    }
  },

  /**
   * Check if notifications are permitted
   */
  async isPermissionGranted(): Promise<boolean> {
    if (!isTauri()) {
      try {
        return window.Notification.permission === 'granted';
      } catch {
        return false;
      }
    }

    try {
      const { isPermissionGranted } = await import('@tauri-apps/plugin-notification');
      return await isPermissionGranted();
    } catch (error) {
      throw new NotificationError(
        'Failed to check notification permission. Ensure @tauri-apps/plugin-notification is installed and configured.',
        error
      );
    }
  },

  /**
   * Show a notification
   */
  async show(options: NotificationOptions): Promise<void> {
    if (!isTauri()) {
      // Browser fallback
      try {
        new window.Notification(options.title, {
          body: options.body,
          icon: options.icon,
          silent: options.silent,
        });
        return;
      } catch (error) {
        throw new NotificationError('Failed to show notification in browser context', error);
      }
    }

    try {
      const { sendNotification } = await import('@tauri-apps/plugin-notification');
      await sendNotification({
        title: options.title,
        body: options.body,
        icon: options.icon,
        sound: options.sound,
        largeBody: options.largeBody,
      });
    } catch (error) {
      throw new NotificationError(
        'Failed to show notification. Ensure @tauri-apps/plugin-notification is installed and configured.',
        error
      );
    }
  },

  /**
   * Show a simple notification
   */
  async notify(title: string, body?: string): Promise<void> {
    return this.show({ title, body });
  },

  /**
   * Schedule a notification
   */
  async schedule(options: ScheduledNotificationOptions): Promise<number> {
    if (!isTauri()) {
      // Browser fallback using setTimeout
      const delay = options.at.getTime() - Date.now();
      if (delay > 0) {
        const id = setTimeout(() => {
          this.show(options);
        }, delay);
        return id as unknown as number;
      }
      throw new NotificationError('Scheduled time must be in the future');
    }

    try {
      const { sendNotification, Schedule } = await import('@tauri-apps/plugin-notification');
      // Generate a unique ID for the scheduled notification
      const notificationId = Math.floor(Math.random() * 2147483647);

      // Tauri v2 uses Schedule.at() for scheduling
      sendNotification({
        id: notificationId,
        title: options.title,
        body: options.body,
        schedule: Schedule.at(options.at, options.repeating ?? false),
      });

      return notificationId;
    } catch (error) {
      throw new NotificationError(
        'Failed to schedule notification. Ensure @tauri-apps/plugin-notification is installed and configured.',
        error
      );
    }
  },

  /**
   * Cancel a scheduled notification
   */
  async cancel(id: number): Promise<void> {
    if (!isTauri()) {
      clearTimeout(id);
      return;
    }

    try {
      const { cancel } = await import('@tauri-apps/plugin-notification');
      await cancel([id]);
    } catch (error) {
      throw new NotificationError(
        'Failed to cancel notification. Ensure @tauri-apps/plugin-notification is installed and configured.',
        error
      );
    }
  },

  /**
   * Cancel all pending notifications
   */
  async cancelAll(): Promise<void> {
    if (!isTauri()) {
      // Can't clear all timeouts in browser
      return;
    }

    try {
      const { cancelAll } = await import('@tauri-apps/plugin-notification');
      await cancelAll();
    } catch (error) {
      throw new NotificationError(
        'Failed to cancel all notifications. Ensure @tauri-apps/plugin-notification is installed and configured.',
        error
      );
    }
  },

  /**
   * Remove all active/delivered notifications
   */
  async removeAllActive(): Promise<void> {
    if (!isTauri()) {
      return;
    }

    try {
      const { removeAllActive } = await import('@tauri-apps/plugin-notification');
      await removeAllActive();
    } catch (error) {
      throw new NotificationError(
        'Failed to remove all active notifications. Ensure @tauri-apps/plugin-notification is installed and configured.',
        error
      );
    }
  },

  /**
   * Get pending notifications
   */
  async getPending(): Promise<{ id: number; title?: string }[]> {
    if (!isTauri()) {
      return [];
    }

    try {
      const { pending } = await import('@tauri-apps/plugin-notification');
      const notifications = await pending();
      return notifications.map((n) => ({
        id: n.id,
        title: n.title,
      }));
    } catch (error) {
      throw new NotificationError(
        'Failed to get pending notifications. Ensure @tauri-apps/plugin-notification is installed and configured.',
        error
      );
    }
  },

  /**
   * Register notification action types
   */
  async registerActionTypes(types: NotificationAction[]): Promise<void> {
    if (!isTauri()) {
      return;
    }

    try {
      const { registerActionTypes } = await import('@tauri-apps/plugin-notification');
      await registerActionTypes([{
        id: 'default',
        actions: types,
      }]);
    } catch (error) {
      throw new NotificationError(
        'Failed to register action types. Ensure @tauri-apps/plugin-notification is installed and configured.',
        error
      );
    }
  },

  /**
   * Listen for notification action events
   */
  async onAction(callback: (notification: { id?: number; actionTypeId?: string; title: string; body?: string }) => void): Promise<() => void> {
    if (!isTauri()) {
      return () => {};
    }

    try {
      const { onAction } = await import('@tauri-apps/plugin-notification');
      const listener = await onAction((notification) => {
        callback({
          id: notification.id,
          actionTypeId: notification.actionTypeId,
          title: notification.title,
          body: notification.body,
        });
      });
      return () => listener.unregister();
    } catch (error) {
      throw new NotificationError(
        'Failed to register action listener. Ensure @tauri-apps/plugin-notification is installed and configured.',
        error
      );
    }
  },

  /**
   * Listen for notification received events
   */
  async onNotificationReceived(callback: (notification: { id?: number; title: string; body?: string }) => void): Promise<() => void> {
    if (!isTauri()) {
      return () => {};
    }

    try {
      const { onNotificationReceived } = await import('@tauri-apps/plugin-notification');
      const listener = await onNotificationReceived((notification) => {
        callback({
          id: notification.id,
          title: notification.title,
          body: notification.body,
        });
      });
      return () => listener.unregister();
    } catch (error) {
      throw new NotificationError(
        'Failed to register notification listener. Ensure @tauri-apps/plugin-notification is installed and configured.',
        error
      );
    }
  },
};

// Convenience exports
export const requestNotificationPermission = Notification.requestPermission;
export const showNotification = Notification.show;
export const notify = Notification.notify;
export const scheduleNotification = Notification.schedule;
export const cancelNotification = Notification.cancel;
