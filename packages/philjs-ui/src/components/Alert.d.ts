/**
 * PhilJS UI - Alert Component
 */
export type AlertStatus = 'info' | 'success' | 'warning' | 'error';
export type AlertVariant = 'subtle' | 'solid' | 'left-accent' | 'top-accent';
export interface AlertProps {
    status?: AlertStatus;
    variant?: AlertVariant;
    title?: string;
    children?: any;
    icon?: any;
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
    children: any;
}): import("philjs-core").JSXElement;
/**
 * Alert Description
 */
export declare function AlertDescription(props: {
    children: any;
}): import("philjs-core").JSXElement;
//# sourceMappingURL=Alert.d.ts.map