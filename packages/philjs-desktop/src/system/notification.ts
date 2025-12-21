/**
 * System Notification APIs
 */

import { isTauri } from '../tauri/context';

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
      const result = await window.Notification.requestPermission();
      return result;
    }

    const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification');
    let permission = await isPermissionGranted();

    if (!permission) {
      const result = await requestPermission();
      permission = result === 'granted';
    }

    return permission ? 'granted' : 'denied';
  },

  /**
   * Check if notifications are permitted
   */
  async isPermissionGranted(): Promise<boolean> {
    if (!isTauri()) {
      return window.Notification.permission === 'granted';
    }

    const { isPermissionGranted } = await import('@tauri-apps/plugin-notification');
    return isPermissionGranted();
  },

  /**
   * Show a notification
   */
  async show(options: NotificationOptions): Promise<void> {
    if (!isTauri()) {
      // Browser fallback
      const notification = new window.Notification(options.title, {
        body: options.body,
        icon: options.icon,
        silent: options.silent,
      });
      return;
    }

    const { sendNotification } = await import('@tauri-apps/plugin-notification');
    await sendNotification({
      title: options.title,
      body: options.body,
      icon: options.icon,
      sound: options.sound,
      largeBody: options.largeBody,
    });
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
      throw new Error('Scheduled time must be in the future');
    }

    const { schedule } = await import('@tauri-apps/plugin-notification');
    const result = await schedule([{
      title: options.title,
      body: options.body,
      schedule: {
        at: options.at,
        repeating: options.repeating,
      },
    }]);

    return result[0]?.id || 0;
  },

  /**
   * Cancel a scheduled notification
   */
  async cancel(id: number): Promise<void> {
    if (!isTauri()) {
      clearTimeout(id);
      return;
    }

    const { cancel } = await import('@tauri-apps/plugin-notification');
    await cancel([id]);
  },

  /**
   * Cancel all pending notifications
   */
  async cancelAll(): Promise<void> {
    if (!isTauri()) {
      // Can't clear all timeouts in browser
      return;
    }

    const { removeAllDelivered } = await import('@tauri-apps/plugin-notification');
    await removeAllDelivered();
  },

  /**
   * Get pending notifications
   */
  async getPending(): Promise<{ id: number; title: string }[]> {
    if (!isTauri()) {
      return [];
    }

    const { pending } = await import('@tauri-apps/plugin-notification');
    const notifications = await pending();
    return notifications.map((n: any) => ({
      id: n.id,
      title: n.title,
    }));
  },

  /**
   * Register notification action types
   */
  async registerActionTypes(types: NotificationAction[]): Promise<void> {
    if (!isTauri()) {
      return;
    }

    const { registerActionTypes } = await import('@tauri-apps/plugin-notification');
    await registerActionTypes([{
      id: 'default',
      actions: types,
    }]);
  },

  /**
   * Listen for notification events
   */
  async onAction(callback: (action: { actionTypeId: string; id: number }) => void): Promise<() => void> {
    if (!isTauri()) {
      return () => {};
    }

    const { onAction } = await import('@tauri-apps/plugin-notification');
    return onAction(callback);
  },
};

// Convenience exports
export const requestNotificationPermission = Notification.requestPermission;
export const showNotification = Notification.show;
export const notify = Notification.notify;
export const scheduleNotification = Notification.schedule;
export const cancelNotification = Notification.cancel;
