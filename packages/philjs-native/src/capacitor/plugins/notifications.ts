/**
 * PhilJS Native - Capacitor Push Notifications Plugin
 *
 * Provides push notification support with registration,
 * handling, and local notification scheduling.
 */

import { signal, effect, type Signal } from 'philjs-core';
import {
  isNativePlatform,
  callPlugin,
  registerPlugin,
  getCapacitorPlatform,
} from '../index.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Notification permission status
 */
export type NotificationPermissionState = 'prompt' | 'granted' | 'denied';

/**
 * Push notification token
 */
export interface PushNotificationToken {
  value: string;
}

/**
 * Notification action
 */
export interface NotificationAction {
  id: string;
  title: string;
  requiresAuthentication?: boolean;
  foreground?: boolean;
  destructive?: boolean;
  input?: boolean;
  inputButtonTitle?: string;
  inputPlaceholder?: string;
}

/**
 * Notification channel (Android)
 */
export interface NotificationChannel {
  id: string;
  name: string;
  description?: string;
  importance?: 1 | 2 | 3 | 4 | 5;
  visibility?: -1 | 0 | 1;
  sound?: string;
  lights?: boolean;
  lightColor?: string;
  vibration?: boolean;
}

/**
 * Push notification schema
 */
export interface PushNotification {
  id: string;
  title?: string;
  subtitle?: string;
  body?: string;
  badge?: number;
  sound?: string;
  data?: Record<string, unknown>;
  click_action?: string;
  link?: string;
  group?: string;
  groupSummary?: boolean;
}

/**
 * Local notification options
 */
export interface LocalNotificationOptions {
  id: number;
  title: string;
  body: string;
  subtitle?: string;
  badge?: number;
  sound?: string;
  smallIcon?: string;
  largeIcon?: string;
  iconColor?: string;
  attachments?: NotificationAttachment[];
  actionTypeId?: string;
  extra?: Record<string, unknown>;
  threadIdentifier?: string;
  summaryArgument?: string;
  group?: string;
  groupSummary?: boolean;
  ongoing?: boolean;
  autoCancel?: boolean;
  schedule?: NotificationSchedule;
  channelId?: string;
}

/**
 * Notification attachment
 */
export interface NotificationAttachment {
  id: string;
  url: string;
  options?: {
    iosUNNotificationAttachmentOptionsTypeHintKey?: string;
    iosUNNotificationAttachmentOptionsThumbnailHiddenKey?: boolean;
    iosUNNotificationAttachmentOptionsThumbnailClippingRectKey?: string;
    iosUNNotificationAttachmentOptionsThumbnailTimeKey?: number;
  };
}

/**
 * Notification schedule
 */
export interface NotificationSchedule {
  at?: Date;
  repeats?: boolean;
  every?:
    | 'year'
    | 'month'
    | 'two-weeks'
    | 'week'
    | 'day'
    | 'hour'
    | 'minute'
    | 'second';
  count?: number;
  on?: {
    year?: number;
    month?: number;
    day?: number;
    weekday?: number;
    hour?: number;
    minute?: number;
    second?: number;
  };
  allowWhileIdle?: boolean;
}

/**
 * Notification action performed result
 */
export interface NotificationActionPerformed {
  actionId: string;
  inputValue?: string;
  notification: PushNotification;
}

/**
 * Registration error
 */
export interface RegistrationError {
  error: string;
}

// ============================================================================
// State
// ============================================================================

/**
 * Push notification permission
 */
export const notificationPermission: Signal<NotificationPermissionState> = signal('prompt');

/**
 * Push token
 */
export const pushToken: Signal<string | null> = signal(null);

/**
 * Last received notification
 */
export const lastNotification: Signal<PushNotification | null> = signal(null);

// ============================================================================
// Event Listeners
// ============================================================================

type NotificationCallback<T> = (data: T) => void;

const registrationListeners = new Set<NotificationCallback<PushNotificationToken>>();
const registrationErrorListeners = new Set<NotificationCallback<RegistrationError>>();
const notificationReceivedListeners = new Set<NotificationCallback<PushNotification>>();
const notificationActionListeners = new Set<NotificationCallback<NotificationActionPerformed>>();

// ============================================================================
// Web Implementation
// ============================================================================

const WebNotifications = {
  async requestPermissions(): Promise<{ receive: NotificationPermissionState }> {
    if (!('Notification' in window)) {
      return { receive: 'denied' };
    }

    const result = await Notification.requestPermission();
    const permission = result as NotificationPermissionState;
    notificationPermission.set(permission);
    return { receive: permission };
  },

  async checkPermissions(): Promise<{ receive: NotificationPermissionState }> {
    if (!('Notification' in window)) {
      return { receive: 'denied' };
    }

    const permission = Notification.permission as NotificationPermissionState;
    notificationPermission.set(permission);
    return { receive: permission };
  },

  async register(): Promise<void> {
    // Web push requires service worker setup
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      registrationErrorListeners.forEach((cb) =>
        cb({ error: 'Push notifications not supported' })
      );
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // This should be configured by the app
          localStorage.getItem('philjs_vapid_key') || ''
        ),
      });

      const token = JSON.stringify(subscription);
      pushToken.set(token);
      registrationListeners.forEach((cb) => cb({ value: token }));
    } catch (error) {
      registrationErrorListeners.forEach((cb) =>
        cb({ error: (error as Error).message })
      );
    }
  },

  async unregister(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      await subscription?.unsubscribe();
      pushToken.set(null);
    } catch {
      // Ignore errors
    }
  },

  async schedule(options: LocalNotificationOptions): Promise<void> {
    if (!('Notification' in window)) return;

    const show = () => {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.largeIcon,
        badge: options.badge?.toString(),
        tag: options.id.toString(),
        data: options.extra,
      });

      notification.onclick = () => {
        notificationActionListeners.forEach((cb) =>
          cb({
            actionId: 'tap',
            notification: {
              id: options.id.toString(),
              title: options.title,
              body: options.body,
              data: options.extra as Record<string, unknown>,
            },
          })
        );
      };
    };

    if (options.schedule?.at) {
      const delay = options.schedule.at.getTime() - Date.now();
      if (delay > 0) {
        setTimeout(show, delay);
      }
    } else {
      show();
    }
  },

  async cancel(ids: number[]): Promise<void> {
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

  urlBase64ToUint8Array(base64String: string): Uint8Array {
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
  async requestPermissions(): Promise<{ receive: NotificationPermissionState }> {
    if (!isNativePlatform()) {
      return WebNotifications.requestPermissions();
    }

    try {
      const result = await callPlugin<never, { receive: NotificationPermissionState }>(
        'PushNotifications',
        'requestPermissions'
      );
      notificationPermission.set(result.receive);
      return result;
    } catch {
      return { receive: 'denied' };
    }
  },

  /**
   * Check current permissions
   */
  async checkPermissions(): Promise<{ receive: NotificationPermissionState }> {
    if (!isNativePlatform()) {
      return WebNotifications.checkPermissions();
    }

    try {
      const result = await callPlugin<never, { receive: NotificationPermissionState }>(
        'PushNotifications',
        'checkPermissions'
      );
      notificationPermission.set(result.receive);
      return result;
    } catch {
      return { receive: 'prompt' };
    }
  },

  /**
   * Register for push notifications
   */
  async register(): Promise<void> {
    if (!isNativePlatform()) {
      return WebNotifications.register();
    }

    try {
      await callPlugin('PushNotifications', 'register');
    } catch (error) {
      registrationErrorListeners.forEach((cb) =>
        cb({ error: (error as Error).message })
      );
    }
  },

  /**
   * Unregister from push notifications
   */
  async unregister(): Promise<void> {
    if (!isNativePlatform()) {
      return WebNotifications.unregister();
    }

    try {
      await callPlugin('PushNotifications', 'unregister');
      pushToken.set(null);
    } catch {
      // Ignore errors
    }
  },

  /**
   * Get delivered notifications
   */
  async getDeliveredNotifications(): Promise<{ notifications: PushNotification[] }> {
    if (!isNativePlatform()) {
      return { notifications: [] };
    }

    try {
      return await callPlugin('PushNotifications', 'getDeliveredNotifications');
    } catch {
      return { notifications: [] };
    }
  },

  /**
   * Remove delivered notifications
   */
  async removeDeliveredNotifications(options: {
    notifications: PushNotification[];
  }): Promise<void> {
    if (!isNativePlatform()) return;

    try {
      await callPlugin('PushNotifications', 'removeDeliveredNotifications', options);
    } catch {
      // Ignore errors
    }
  },

  /**
   * Remove all delivered notifications
   */
  async removeAllDeliveredNotifications(): Promise<void> {
    if (!isNativePlatform()) return;

    try {
      await callPlugin('PushNotifications', 'removeAllDeliveredNotifications');
    } catch {
      // Ignore errors
    }
  },

  /**
   * Create notification channel (Android)
   */
  async createChannel(channel: NotificationChannel): Promise<void> {
    if (getCapacitorPlatform() !== 'android') return;

    try {
      await callPlugin('PushNotifications', 'createChannel', channel);
    } catch {
      // Ignore errors
    }
  },

  /**
   * Delete notification channel (Android)
   */
  async deleteChannel(options: { id: string }): Promise<void> {
    if (getCapacitorPlatform() !== 'android') return;

    try {
      await callPlugin('PushNotifications', 'deleteChannel', options);
    } catch {
      // Ignore errors
    }
  },

  /**
   * List notification channels (Android)
   */
  async listChannels(): Promise<{ channels: NotificationChannel[] }> {
    if (getCapacitorPlatform() !== 'android') {
      return { channels: [] };
    }

    try {
      return await callPlugin('PushNotifications', 'listChannels');
    } catch {
      return { channels: [] };
    }
  },

  /**
   * Add registration listener
   */
  addRegistrationListener(
    callback: NotificationCallback<PushNotificationToken>
  ): () => void {
    if (isNativePlatform()) {
      const capacitor = (window as any).Capacitor;
      if (capacitor?.Plugins?.PushNotifications) {
        const handle = capacitor.Plugins.PushNotifications.addListener(
          'registration',
          (token: PushNotificationToken) => {
            pushToken.set(token.value);
            callback(token);
          }
        );
        return () => handle.remove();
      }
    }

    registrationListeners.add(callback);
    return () => registrationListeners.delete(callback);
  },

  /**
   * Add registration error listener
   */
  addRegistrationErrorListener(
    callback: NotificationCallback<RegistrationError>
  ): () => void {
    if (isNativePlatform()) {
      const capacitor = (window as any).Capacitor;
      if (capacitor?.Plugins?.PushNotifications) {
        const handle = capacitor.Plugins.PushNotifications.addListener(
          'registrationError',
          callback
        );
        return () => handle.remove();
      }
    }

    registrationErrorListeners.add(callback);
    return () => registrationErrorListeners.delete(callback);
  },

  /**
   * Add push notification received listener
   */
  addReceivedListener(
    callback: NotificationCallback<PushNotification>
  ): () => void {
    if (isNativePlatform()) {
      const capacitor = (window as any).Capacitor;
      if (capacitor?.Plugins?.PushNotifications) {
        const handle = capacitor.Plugins.PushNotifications.addListener(
          'pushNotificationReceived',
          (notification: PushNotification) => {
            lastNotification.set(notification);
            callback(notification);
          }
        );
        return () => handle.remove();
      }
    }

    notificationReceivedListeners.add(callback);
    return () => notificationReceivedListeners.delete(callback);
  },

  /**
   * Add notification action listener
   */
  addActionListener(
    callback: NotificationCallback<NotificationActionPerformed>
  ): () => void {
    if (isNativePlatform()) {
      const capacitor = (window as any).Capacitor;
      if (capacitor?.Plugins?.PushNotifications) {
        const handle = capacitor.Plugins.PushNotifications.addListener(
          'pushNotificationActionPerformed',
          callback
        );
        return () => handle.remove();
      }
    }

    notificationActionListeners.add(callback);
    return () => notificationActionListeners.delete(callback);
  },

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    registrationListeners.clear();
    registrationErrorListeners.clear();
    notificationReceivedListeners.clear();
    notificationActionListeners.clear();

    if (isNativePlatform()) {
      const capacitor = (window as any).Capacitor;
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
  async schedule(options: {
    notifications: LocalNotificationOptions[];
  }): Promise<{ notifications: { id: number }[] }> {
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
    } catch {
      return { notifications: [] };
    }
  },

  /**
   * Cancel scheduled notifications
   */
  async cancel(options: { notifications: { id: number }[] }): Promise<void> {
    if (!isNativePlatform()) {
      await WebNotifications.cancel(options.notifications.map((n) => n.id));
      return;
    }

    try {
      await callPlugin('LocalNotifications', 'cancel', options);
    } catch {
      // Ignore errors
    }
  },

  /**
   * Get pending notifications
   */
  async getPending(): Promise<{ notifications: LocalNotificationOptions[] }> {
    if (!isNativePlatform()) {
      return { notifications: [] };
    }

    try {
      return await callPlugin('LocalNotifications', 'getPending');
    } catch {
      return { notifications: [] };
    }
  },

  /**
   * Register action types
   */
  async registerActionTypes(options: {
    types: { id: string; actions: NotificationAction[] }[];
  }): Promise<void> {
    if (!isNativePlatform()) return;

    try {
      await callPlugin('LocalNotifications', 'registerActionTypes', options);
    } catch {
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
export function useNotificationPermission(): NotificationPermissionState {
  return notificationPermission();
}

/**
 * Hook for push token
 */
export function usePushToken(): string | null {
  return pushToken();
}

/**
 * Hook for last notification
 */
export function useLastNotification(): PushNotification | null {
  return lastNotification();
}

/**
 * Hook for notification received events
 */
export function useNotificationReceived(
  callback: (notification: PushNotification) => void
): void {
  effect(() => {
    const unsubscribe = CapacitorPushNotifications.addReceivedListener(callback);
    return unsubscribe;
  });
}

/**
 * Hook for notification action events
 */
export function useNotificationAction(
  callback: (action: NotificationActionPerformed) => void
): void {
  effect(() => {
    const unsubscribe = CapacitorPushNotifications.addActionListener(callback);
    return unsubscribe;
  });
}

// ============================================================================
// Exports
// ============================================================================

export {
  CapacitorPushNotifications as PushNotifications,
  CapacitorLocalNotifications as LocalNotifications,
};

export default CapacitorPushNotifications;
