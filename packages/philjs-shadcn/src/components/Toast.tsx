/**
 * Toast notification component - shadcn/ui style for PhilJS
 */

import { signal, effect, type Signal } from '@philjs/core';
import { cn } from '../utils.js';
import { cva, type VariantProps } from 'class-variance-authority';

// Toast variants
const toastVariants = cva(
    'group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
    {
        variants: {
            variant: {
                default: 'border bg-background text-foreground',
                destructive:
                    'destructive group border-destructive bg-destructive text-destructive-foreground',
                success: 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100',
                warning: 'border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100',
                info: 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

// Types
export interface ToastProps extends VariantProps<typeof toastVariants> {
    id?: string;
    title?: string;
    description?: string;
    action?: { label: string; onClick: () => void };
    duration?: number;
    onDismiss?: () => void;
    className?: string;
}

export interface ToastState {
    toasts: Signal<ToastProps[]>;
    addToast: (toast: Omit<ToastProps, 'id'>) => string;
    removeToast: (id: string) => void;
    clearToasts: () => void;
}

// Global toast state
const toastState = signal<ToastProps[]>([]);
let toastCounter = 0;

/**
 * Create toast state hook
 */
export function useToast(): ToastState {
    const addToast = (toast: Omit<ToastProps, 'id'>): string => {
        const id = `toast-${++toastCounter}`;
        const newToast: ToastProps = { ...toast, id };

        toastState.set([...toastState(), newToast]);

        // Auto-dismiss after duration
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    };

    const removeToast = (id: string) => {
        toastState.set(toastState().filter(t => t.id !== id));
    };

    const clearToasts = () => {
        toastState.set([]);
    };

    return {
        toasts: toastState,
        addToast,
        removeToast,
        clearToasts,
    };
}

/**
 * Convenience function to show a toast
 */
export function toast(props: Omit<ToastProps, 'id'>) {
    const { addToast } = useToast();
    return addToast(props);
}

toast.success = (title: string, description?: string) =>
    toast({ title, description, variant: 'success' });

toast.error = (title: string, description?: string) =>
    toast({ title, description, variant: 'destructive' });

toast.warning = (title: string, description?: string) =>
    toast({ title, description, variant: 'warning' });

toast.info = (title: string, description?: string) =>
    toast({ title, description, variant: 'info' });

/**
 * Individual toast component
 */
export function Toast(props: ToastProps) {
    const { id, variant, title, description, action, onDismiss, className } = props;

    const handleDismiss = () => {
        if (id) {
            toastState.set(toastState().filter(t => t.id !== id));
        }
        onDismiss?.();
    };

    return (
        <div
            class={cn(toastVariants({ variant }), className)}
            data-state="open"
        >
            <div class="grid gap-1">
                {title && <div class="text-sm font-semibold">{title}</div>}
                {description && (
                    <div class="text-sm opacity-90">{description}</div>
                )}
            </div>

            {action && (
                <button
                    type="button"
                    onClick={action.onClick}
                    class="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive"
                >
                    {action.label}
                </button>
            )}

            <button
                type="button"
                onClick={handleDismiss}
                class="absolute right-1 top-1 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-4 w-4"
                >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                </svg>
            </button>
        </div>
    );
}

/**
 * Toast viewport - container for all toasts
 */
export interface ToastViewportProps {
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    className?: string;
}

export function ToastViewport(props: ToastViewportProps) {
    const { position = 'bottom-right', className } = props;

    const positionClasses = {
        'top-left': 'top-0 left-0',
        'top-center': 'top-0 left-1/2 -translate-x-1/2',
        'top-right': 'top-0 right-0',
        'bottom-left': 'bottom-0 left-0',
        'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
        'bottom-right': 'bottom-0 right-0',
    };

    const toasts = toastState();

    return (
        <div
            class={cn(
                'fixed z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:flex-col md:max-w-[420px]',
                positionClasses[position],
                className
            )}
        >
            {toasts.map(toast => (
                <Toast key={toast.id} {...toast} />
            ))}
        </div>
    );
}

/**
 * Toaster component - place once at app root
 */
export function Toaster(props: ToastViewportProps = {}) {
    return <ToastViewport {...props} />;
}
