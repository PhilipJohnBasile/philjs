/**
 * Notification email template
 */
export type NotificationType = 'info' | 'warning' | 'success' | 'error';
export interface NotificationEmailProps {
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
}
export declare function NotificationEmail(_props: NotificationEmailProps): string;
export declare function getNotificationSubject(title: string): string;
//# sourceMappingURL=notification.d.ts.map