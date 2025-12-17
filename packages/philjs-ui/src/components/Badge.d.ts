/**
 * PhilJS UI - Badge Component
 */
import { JSX } from 'philjs-core';
export type BadgeVariant = 'solid' | 'subtle' | 'outline';
export type BadgeColor = 'gray' | 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'cyan' | 'purple' | 'pink';
export type BadgeSize = 'sm' | 'md' | 'lg';
export interface BadgeProps {
    children: JSX.Element;
    variant?: BadgeVariant;
    color?: BadgeColor;
    size?: BadgeSize;
    rounded?: boolean;
    className?: string;
}
export declare function Badge(props: BadgeProps): import("philjs-core").JSXElement;
/**
 * Status Indicator - Small dot badge for status
 */
export type StatusIndicatorStatus = 'online' | 'offline' | 'busy' | 'away' | 'idle';
export interface StatusIndicatorProps {
    status: StatusIndicatorStatus;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}
export declare function StatusIndicator(props: StatusIndicatorProps): import("philjs-core").JSXElement;
/**
 * Notification Badge - For counts
 */
export interface NotificationBadgeProps {
    count: number;
    max?: number;
    showZero?: boolean;
    color?: 'red' | 'blue' | 'green' | 'gray';
    className?: string;
}
export declare function NotificationBadge(props: NotificationBadgeProps): import("philjs-core").JSXElement | null;
//# sourceMappingURL=Badge.d.ts.map