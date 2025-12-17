/**
 * PhilJS UI - Toast Component
 */
import { JSX } from 'philjs-core';
export type ToastStatus = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition = 'top' | 'top-left' | 'top-right' | 'bottom' | 'bottom-left' | 'bottom-right';
export interface ToastOptions {
    id?: string;
    title?: string;
    description?: string;
    status?: ToastStatus;
    duration?: number;
    isClosable?: boolean;
    position?: ToastPosition;
    render?: (props: {
        onClose: () => void;
    }) => JSX.Element;
}
export declare function toast(options: ToastOptions): string;
export declare namespace toast {
    var success: (options: Omit<ToastOptions, "status">) => string;
    var error: (options: Omit<ToastOptions, "status">) => string;
    var warning: (options: Omit<ToastOptions, "status">) => string;
    var info: (options: Omit<ToastOptions, "status">) => string;
    var close: (id: string) => void;
    var closeAll: () => void;
}
/**
 * Toast Container - Renders all active toasts
 */
export declare function ToastContainer(): import("philjs-core").JSXElement;
/**
 * useToast hook for easier access
 */
export declare function useToast(): typeof toast;
//# sourceMappingURL=Toast.d.ts.map