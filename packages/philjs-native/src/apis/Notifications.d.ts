/**
 * Notifications API
 *
 * Push notifications and local notifications.
 */
import { type Signal } from 'philjs-core';
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
export type NotificationTrigger = {
    type: 'timeInterval';
    seconds: number;
    repeats?: boolean;
} | {
    type: 'date';
    date: Date;
} | {
    type: 'calendar';
    dateComponents: DateComponents;
    repeats?: boolean;
} | {
    type: 'location';
    region: LocationRegion;
    repeats?: boolean;
};
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
    center: {
        latitude: number;
        longitude: number;
    };
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
    textInput?: {
        buttonTitle: string;
        placeholder: string;
    };
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
/**
 * Notification permission state
 */
export declare const notificationPermission: Signal<NotificationPermissionStatus>;
/**
 * Push token state
 */
export declare const pushToken: Signal<PushToken | null>;
/**
 * Notifications API singleton
 */
export declare const Notifications: {
    /**
     * Request notification permission
     */
    requestPermission(): Promise<NotificationPermissionStatus>;
    /**
     * Get permission status
     */
    getPermissionStatus(): Promise<NotificationPermissionStatus>;
    /**
     * Schedule a local notification
     */
    scheduleNotification(content: NotificationContent, trigger?: NotificationTrigger): Promise<string>;
    /**
     * Present notification immediately (foreground)
     */
    presentNotification(content: NotificationContent): Promise<string>;
    /**
     * Cancel a scheduled notification
     */
    cancelNotification(identifier: string): Promise<void>;
    /**
     * Cancel all scheduled notifications
     */
    cancelAllNotifications(): Promise<void>;
    /**
     * Get all scheduled notifications
     */
    getScheduledNotifications(): Promise<ScheduledNotification[]>;
    /**
     * Set notification categories
     */
    setCategories(categories: NotificationCategory[]): Promise<void>;
    /**
     * Set badge count
     */
    setBadgeCount(count: number): Promise<void>;
    /**
     * Get badge count
     */
    getBadgeCount(): Promise<number>;
    /**
     * Register for push notifications
     */
    registerForPushNotifications(): Promise<PushToken>;
    /**
     * Unregister from push notifications
     */
    unregisterFromPushNotifications(): Promise<void>;
    /**
     * Add notification received listener
     */
    addNotificationReceivedListener(callback: (notification: ScheduledNotification) => void): () => void;
    /**
     * Add notification response listener
     */
    addNotificationResponseListener(callback: (response: NotificationResponse) => void): () => void;
    /**
     * Get last notification response (when app opened from notification)
     */
    getLastNotificationResponse(): Promise<NotificationResponse | null>;
};
/**
 * Hook for notification received events
 */
export declare function useNotificationReceived(callback: (notification: ScheduledNotification) => void): void;
/**
 * Hook for notification response events
 */
export declare function useNotificationResponse(callback: (response: NotificationResponse) => void): void;
export default Notifications;
//# sourceMappingURL=Notifications.d.ts.map