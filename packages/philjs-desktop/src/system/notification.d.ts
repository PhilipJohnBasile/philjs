/**
 * System Notification APIs
 *
 * Uses @tauri-apps/plugin-notification for Tauri v2
 * with browser fallbacks when running outside Tauri context.
 */
/**
 * Error thrown when notification operations fail
 */
export declare class NotificationError extends Error {
    readonly cause?: unknown | undefined;
    constructor(message: string, cause?: unknown | undefined);
}
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
export declare const Notification: {
    /**
     * Request notification permission
     */
    requestPermission(): Promise<"granted" | "denied" | "default">;
    /**
     * Check if notifications are permitted
     */
    isPermissionGranted(): Promise<boolean>;
    /**
     * Show a notification
     */
    show(options: NotificationOptions): Promise<void>;
    /**
     * Show a simple notification
     */
    notify(title: string, body?: string): Promise<void>;
    /**
     * Schedule a notification
     */
    schedule(options: ScheduledNotificationOptions): Promise<number>;
    /**
     * Cancel a scheduled notification
     */
    cancel(id: number): Promise<void>;
    /**
     * Cancel all pending notifications
     */
    cancelAll(): Promise<void>;
    /**
     * Remove all active/delivered notifications
     */
    removeAllActive(): Promise<void>;
    /**
     * Get pending notifications
     */
    getPending(): Promise<{
        id: number;
        title?: string;
    }[]>;
    /**
     * Register notification action types
     */
    registerActionTypes(types: NotificationAction[]): Promise<void>;
    /**
     * Listen for notification action events
     */
    onAction(callback: (notification: {
        id?: number;
        actionTypeId?: string;
        title: string;
        body?: string;
    }) => void): Promise<() => void>;
    /**
     * Listen for notification received events
     */
    onNotificationReceived(callback: (notification: {
        id?: number;
        title: string;
        body?: string;
    }) => void): Promise<() => void>;
};
export declare const requestNotificationPermission: () => Promise<"granted" | "denied" | "default">;
export declare const showNotification: (options: NotificationOptions) => Promise<void>;
export declare const notify: (title: string, body?: string) => Promise<void>;
export declare const scheduleNotification: (options: ScheduledNotificationOptions) => Promise<number>;
export declare const cancelNotification: (id: number) => Promise<void>;
//# sourceMappingURL=notification.d.ts.map