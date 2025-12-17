/**
 * PhilJS UI - Alert Component
 */
import { JSX } from 'philjs-core';
export type AlertStatus = 'info' | 'success' | 'warning' | 'error';
export type AlertVariant = 'subtle' | 'solid' | 'left-accent' | 'top-accent';
export interface AlertProps {
    status?: AlertStatus;
    variant?: AlertVariant;
    title?: string;
    children?: JSX.Element;
    icon?: JSX.Element;
    showIcon?: boolean;
    dismissible?: boolean;
    onDismiss?: () => void;
    className?: string;
}
export declare function Alert(props: AlertProps): import("philjs-core").JSXElement | null;
/**
 * Alert Title
 */
export declare function AlertTitle(props: {
    children: JSX.Element;
}): import("philjs-core").JSXElement;
/**
 * Alert Description
 */
export declare function AlertDescription(props: {
    children: JSX.Element;
}): import("philjs-core").JSXElement;
//# sourceMappingURL=Alert.d.ts.map