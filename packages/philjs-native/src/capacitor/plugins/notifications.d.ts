/**
 * PhilJS Native - Capacitor Push Notifications Plugin
 *
 * Provides push notification support with registration,
 * handling, and local notification scheduling.
 */
import { type Signal } from '@philjs/core';
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
    every?: 'year' | 'month' | 'two-weeks' | 'week' | 'day' | 'hour' | 'minute' | 'second';
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
/**
 * Push notification permission
 */
export declare const notificationPermission: Signal<NotificationPermissionState>;
/**
 * Push token
 */
export declare const pushToken: Signal<string | null>;
/**
 * Last received notification
 */
export declare const lastNotification: Signal<PushNotification | null>;
type NotificationCallback<T> = (data: T) => void;
/**
 * Push Notifications API
 */
export declare const CapacitorPushNotifications: {
    /**
     * Request permission for push notifications
     */
    requestPermissions(): Promise<{
        receive: NotificationPermissionState;
    }>;
    /**
     * Check current permissions
     */
    checkPermissions(): Promise<{
        receive: NotificationPermissionState;
    }>;
    /**
     * Register for push notifications
     */
    register(): Promise<void>;
    /**
     * Unregister from push notifications
     */
    unregister(): Promise<void>;
    /**
     * Get delivered notifications
     */
    getDeliveredNotifications(): Promise<{
        notifications: PushNotification[];
    }>;
    /**
     * Remove delivered notifications
     */
    removeDeliveredNotifications(options: {
        notifications: PushNotification[];
    }): Promise<void>;
    /**
     * Remove all delivered notifications
     */
    removeAllDeliveredNotifications(): Promise<void>;
    /**
     * Create notification channel (Android)
     */
    createChannel(channel: NotificationChannel): Promise<void>;
    /**
     * Delete notification channel (Android)
     */
    deleteChannel(options: {
        id: string;
    }): Promise<void>;
    /**
     * List notification channels (Android)
     */
    listChannels(): Promise<{
        channels: NotificationChannel[];
    }>;
    /**
     * Add registration listener
     */
    addRegistrationListener(callback: NotificationCallback<PushNotificationToken>): () => void;
    /**
     * Add registration error listener
     */
    addRegistrationErrorListener(callback: NotificationCallback<RegistrationError>): () => void;
    /**
     * Add push notification received listener
     */
    addReceivedListener(callback: NotificationCallback<PushNotification>): () => void;
    /**
     * Add notification action listener
     */
    addActionListener(callback: NotificationCallback<NotificationActionPerformed>): () => void;
    /**
     * Remove all listeners
     */
    removeAllListeners(): void;
};
/**
 * Local Notifications API
 */
export declare const CapacitorLocalNotifications: {
    /**
     * Schedule local notifications
     */
    schedule(options: {
        notifications: LocalNotificationOptions[];
    }): Promise<{
        notifications: {
            id: number;
        }[];
    }>;
    /**
     * Cancel scheduled notifications
     */
    cancel(options: {
        notifications: {
            id: number;
        }[];
    }): Promise<void>;
    /**
     * Get pending notifications
     */
    getPending(): Promise<{
        notifications: LocalNotificationOptions[];
    }>;
    /**
     * Register action types
     */
    registerActionTypes(options: {
        types: {
            id: string;
            actions: NotificationAction[];
        }[];
    }): Promise<void>;
};
/**
 * Hook for notification permission
 */
export declare function useNotificationPermission(): NotificationPermissionState;
/**
 * Hook for push token
 */
export declare function usePushToken(): string | null;
/**
 * Hook for last notification
 */
export declare function useLastNotification(): PushNotification | null;
/**
 * Hook for notification received events
 */
export declare function useNotificationReceived(callback: (notification: PushNotification) => void): void;
/**
 * Hook for notification action events
 */
export declare function useNotificationAction(callback: (action: NotificationActionPerformed) => void): void;
export { CapacitorPushNotifications as PushNotifications, CapacitorLocalNotifications as LocalNotifications, };
export default CapacitorPushNotifications;
//# sourceMappingURL=notifications.d.ts.map