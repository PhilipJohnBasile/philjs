/**
 * Notifications API
 *
 * Push notifications and local notifications.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Notification permission status
 */
export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

/**
 * Notification content
 */
export interface NotificationContent {
  title: string;
  body?: string;
  subtitle?: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string | boolean;
  categoryIdentifier?: string;
  launchImageName?: string;
  attachments?: NotificationAttachment[];
}

/**
 * Notification attachment
 */
export interface NotificationAttachment {
  identifier: string;
  url: string;
  type?: string;
}

/**
 * Notification trigger
 */
export type NotificationTrigger =
  | { type: 'timeInterval'; seconds: number; repeats?: boolean }
  | { type: 'date'; date: Date }
  | { type: 'calendar'; dateComponents: DateComponents; repeats?: boolean }
  | { type: 'location'; region: LocationRegion; repeats?: boolean };

/**
 * Date components for calendar trigger
 */
export interface DateComponents {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  weekday?: number;
}

/**
 * Location region for location trigger
 */
export interface LocationRegion {
  identifier: string;
  center: { latitude: number; longitude: number };
  radius: number;
  notifyOnEntry?: boolean;
  notifyOnExit?: boolean;
}

/**
 * Scheduled notification
 */
export interface ScheduledNotification {
  identifier: string;
  content: NotificationContent;
  trigger: NotificationTrigger | null;
}

/**
 * Notification response
 */
export interface NotificationResponse {
  notification: ScheduledNotification;
  actionIdentifier: string;
  userText?: string;
}

/**
 * Notification category
 */
export interface NotificationCategory {
  identifier: string;
  actions: NotificationAction[];
  intentIdentifiers?: string[];
  options?: NotificationCategoryOptions;
}

/**
 * Notification action
 */
export interface NotificationAction {
  identifier: string;
  title: string;
  options?: NotificationActionOptions;
  textInput?: { buttonTitle: string; placeholder: string };
}

/**
 * Notification category options
 */
export interface NotificationCategoryOptions {
  customDismissAction?: boolean;
  allowInCarPlay?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
}

/**
 * Notification action options
 */
export interface NotificationActionOptions {
  foreground?: boolean;
  destructive?: boolean;
  authenticationRequired?: boolean;
}

/**
 * Push token result
 */
export interface PushToken {
  data: string;
  type: 'fcm' | 'apns';
}

// ============================================================================
// Notification State
// ============================================================================

/**
 * Notification permission state
 */
export const notificationPermission: Signal<NotificationPermissionStatus> = signal<NotificationPermissionStatus>('undetermined');

/**
 * Push token state
 */
export const pushToken: Signal<PushToken | null> = signal<PushToken | null>(null);

/**
 * Notification listeners
 */
const notificationListeners = new Set<(notification: ScheduledNotification) => void>();
const responseListeners = new Set<(response: NotificationResponse) => void>();

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
  async requestPermission(): Promise<NotificationPermissionStatus> {
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

    const status = await nativeBridge.call<NotificationPermissionStatus>(
      'Notifications',
      'requestPermission'
    );
    notificationPermission.set(status);
    return status;
  },

  /**
   * Get permission status
   */
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
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

    const status = await nativeBridge.call<NotificationPermissionStatus>(
      'Notifications',
      'getPermissionStatus'
    );
    notificationPermission.set(status);
    return status;
  },

  /**
   * Schedule a local notification
   */
  async scheduleNotification(
    content: NotificationContent,
    trigger?: NotificationTrigger
  ): Promise<string> {
    const platform = detectPlatform();
    const identifier = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (platform === 'web') {
      if (!('Notification' in window)) {
        throw new Error('Notifications not supported');
      }

      const showNotification = () => {
        new window.Notification(content.title, {
          body: content.body,
          icon: content.attachments?.[0]?.url,
          badge: content.badge?.toString(),
          data: content.data,
          silent: !content.sound,
        });
      };

      if (!trigger) {
        showNotification();
      } else if (trigger.type === 'timeInterval') {
        setTimeout(showNotification, trigger.seconds * 1000);
      } else if (trigger.type === 'date') {
        const delay = trigger.date.getTime() - Date.now();
        if (delay > 0) {
          setTimeout(showNotification, delay);
        }
      }

      return identifier;
    }

    return nativeBridge.call<string>('Notifications', 'scheduleNotification', {
      identifier,
      content,
      trigger,
    });
  },

  /**
   * Present notification immediately (foreground)
   */
  async presentNotification(content: NotificationContent): Promise<string> {
    return this.scheduleNotification(content);
  },

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(identifier: string): Promise<void> {
    const platform = detectPlatform();

    if (platform !== 'web') {
      await nativeBridge.call('Notifications', 'cancelNotification', identifier);
    }
  },

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    const platform = detectPlatform();

    if (platform !== 'web') {
      await nativeBridge.call('Notifications', 'cancelAllNotifications');
    }
  },

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    const platform = detectPlatform();

    if (platform === 'web') {
      return [];
    }

    return nativeBridge.call<ScheduledNotification[]>(
      'Notifications',
      'getScheduledNotifications'
    );
  },

  /**
   * Set notification categories
   */
  async setCategories(categories: NotificationCategory[]): Promise<void> {
    const platform = detectPlatform();

    if (platform !== 'web') {
      await nativeBridge.call('Notifications', 'setCategories', categories);
    }
  },

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    const platform = detectPlatform();

    if (platform === 'web') {
      // Web badge API (limited support)
      if ('setAppBadge' in navigator) {
        if (count === 0) {
          await (navigator as any).clearAppBadge();
        } else {
          await (navigator as any).setAppBadge(count);
        }
      }
      return;
    }

    await nativeBridge.call('Notifications', 'setBadgeCount', count);
  },

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    const platform = detectPlatform();

    if (platform === 'web') {
      return 0;
    }

    return nativeBridge.call<number>('Notifications', 'getBadgeCount');
  },

  /**
   * Register for push notifications
   */
  async registerForPushNotifications(): Promise<PushToken> {
    const platform = detectPlatform();

    if (platform === 'web') {
      // Web push requires service worker
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: '', // Would need VAPID key
        });

        const token: PushToken = {
          data: JSON.stringify(subscription.toJSON()),
          type: 'fcm', // Web uses FCM-like
        };
        pushToken.set(token);
        return token;
      }

      throw new Error('Push notifications not supported');
    }

    const token = await nativeBridge.call<PushToken>(
      'Notifications',
      'registerForPushNotifications'
    );
    pushToken.set(token);
    return token;
  },

  /**
   * Unregister from push notifications
   */
  async unregisterFromPushNotifications(): Promise<void> {
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
  addNotificationReceivedListener(
    callback: (notification: ScheduledNotification) => void
  ): () => void {
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
  addNotificationResponseListener(
    callback: (response: NotificationResponse) => void
  ): () => void {
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
  async getLastNotificationResponse(): Promise<NotificationResponse | null> {
    const platform = detectPlatform();

    if (platform === 'web') {
      return null;
    }

    return nativeBridge.call<NotificationResponse | null>(
      'Notifications',
      'getLastNotificationResponse'
    );
  },
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for notification received events
 */
export function useNotificationReceived(
  callback: (notification: ScheduledNotification) => void
): void {
  effect(() => {
    const unsubscribe = Notifications.addNotificationReceivedListener(callback);
    return unsubscribe;
  });
}

/**
 * Hook for notification response events
 */
export function useNotificationResponse(
  callback: (response: NotificationResponse) => void
): void {
  effect(() => {
    const unsubscribe = Notifications.addNotificationResponseListener(callback);
    return unsubscribe;
  });
}

// ============================================================================
// Export
// ============================================================================

export default Notifications;
