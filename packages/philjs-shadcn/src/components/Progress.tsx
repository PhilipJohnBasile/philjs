/**
 * Progress component - shadcn/ui style for PhilJS
 */

import { type Signal } from '@philjs/core';
import { cn } from '../utils.js';

export interface ProgressProps {
    value?: number | Signal<number>;
    max?: number;
    className?: string;
    indicatorClassName?: string;
}

/**
 * Progress bar component
 */
export function Progress(props: ProgressProps) {
    const { value, max = 100, className, indicatorClassName } = props;

    const currentValue = typeof value === 'function' ? value() : (value ?? 0);
    const percentage = Math.min(Math.max((currentValue / max) * 100, 0), 100);

    return (
        <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={currentValue}
            class={cn(
                'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
                className
            )}
        >
            <div
                class={cn(
                    'h-full w-full flex-1 bg-primary transition-all',
                    indicatorClassName
                )}
                style={{ transform: `translateX(-${100 - percentage}%)` }}
            />
        </div>
    );
}

/**
 * Indeterminate progress (spinner/loading state)
 */
export function ProgressIndeterminate(props: { className?: string }) {
    const { className } = props;

    return (
        <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            class={cn(
                'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
                className
            )}
        >
            <div
                class="h-full w-1/3 bg-primary animate-progress-indeterminate"
            />
        </div>
    );
}

/**
 * Circular progress indicator
 */
export interface CircularProgressProps {
    value?: number | Signal<number>;
    size?: number;
    strokeWidth?: number;
    className?: string;
}

export function CircularProgress(props: CircularProgressProps) {
    const { value, size = 40, strokeWidth = 4, className } = props;

    const currentValue = typeof value === 'function' ? value() : (value ?? 0);
    const percentage = Math.min(Math.max(currentValue, 0), 100);

    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <svg
            width={size}
            height={size}
            class={cn('transform -rotate-90', className)}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={currentValue}
        >
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                stroke-width={strokeWidth}
                class="text-primary/20"
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                stroke-width={strokeWidth}
                stroke-dasharray={circumference}
                stroke-dashoffset={offset}
                stroke-linecap="round"
                class="text-primary transition-all duration-300"
            />
        </svg>
    );
}
