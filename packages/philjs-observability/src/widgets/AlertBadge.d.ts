/**
 * AlertBadge Widget - Display alerts and notifications
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export interface Alert {
    id: string;
    title: string;
    message: string;
    severity: AlertSeverity;
    timestamp: Date;
    acknowledged?: boolean;
}
export interface AlertBadgeProps {
    count: number;
    severity?: AlertSeverity;
    onClick?: () => void;
}
export interface AlertListProps {
    alerts: Alert[];
    maxItems?: number;
    onAcknowledge?: (id: string) => void;
    onDismiss?: (id: string) => void;
}
export interface AlertBannerProps {
    alert: Alert;
    dismissible?: boolean;
    onDismiss?: () => void;
}
export interface AlertToastProps {
    alert: Alert;
    duration?: number;
    onClose?: () => void;
}
export declare function AlertBadge(_props: AlertBadgeProps): string;
export declare function AlertList(_props: AlertListProps): string;
export declare function AlertBanner(_props: AlertBannerProps): string;
export declare function AlertToast(_props: AlertToastProps): string;
//# sourceMappingURL=AlertBadge.d.ts.map