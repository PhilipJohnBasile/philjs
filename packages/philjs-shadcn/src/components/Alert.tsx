/**
 * Alert component - shadcn/ui style for PhilJS
 */

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils.js';

// Alert variants
export const alertVariants = cva(
    'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
    {
        variants: {
            variant: {
                default: 'bg-background text-foreground',
                destructive:
                    'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
                success:
                    'border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600',
                warning:
                    'border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600',
                info:
                    'border-blue-500/50 text-blue-700 dark:text-blue-400 [&>svg]:text-blue-600',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface AlertProps extends VariantProps<typeof alertVariants> {
    className?: string;
    children?: any;
}

export interface AlertTitleProps {
    className?: string;
    children?: any;
}

export interface AlertDescriptionProps {
    className?: string;
    children?: any;
}

/**
 * Alert container
 */
export function Alert(props: AlertProps) {
    const { variant, className, children } = props;

    return (
        <div
            role="alert"
            class={cn(alertVariants({ variant }), className)}
        >
            {children}
        </div>
    );
}

/**
 * Alert title
 */
export function AlertTitle(props: AlertTitleProps) {
    const { className, children } = props;

    return (
        <h5 class={cn('mb-1 font-medium leading-none tracking-tight', className)}>
            {children}
        </h5>
    );
}

/**
 * Alert description text
 */
export function AlertDescription(props: AlertDescriptionProps) {
    const { className, children } = props;

    return (
        <div class={cn('text-sm [&_p]:leading-relaxed', className)}>
            {children}
        </div>
    );
}

// Common alert icons
export function AlertCircleIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
    );
}

export function CheckCircleIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}

export function TriangleAlertIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" x2="12" y1="9" y2="13" />
            <line x1="12" x2="12.01" y1="17" y2="17" />
        </svg>
    );
}

export function InfoIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    );
}
