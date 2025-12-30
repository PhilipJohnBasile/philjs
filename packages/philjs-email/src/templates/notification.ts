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

export function NotificationEmail(_props: NotificationEmailProps): string {
  return '';
}

export function getNotificationSubject(title: string): string {
  return title;
}
