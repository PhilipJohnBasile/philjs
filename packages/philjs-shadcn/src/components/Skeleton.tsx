/**
 * Skeleton component - shadcn/ui style for PhilJS
 */

import { cn } from '../utils.js';

export interface SkeletonProps {
    className?: string;
}

/**
 * Skeleton loading placeholder
 */
export function Skeleton(props: SkeletonProps) {
    const { className } = props;

    return (
        <div
            class={cn(
                'animate-pulse rounded-md bg-primary/10',
                className
            )}
        />
    );
}

/**
 * Text skeleton - mimics a line of text
 */
export function SkeletonText(props: { lines?: number; className?: string }) {
    const { lines = 1, className } = props;

    return (
        <div class={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    class={cn(
                        'h-4',
                        i === lines - 1 && lines > 1 ? 'w-4/5' : 'w-full'
                    )}
                />
            ))}
        </div>
    );
}

/**
 * Circle skeleton - for avatars
 */
export function SkeletonCircle(props: { size?: number; className?: string }) {
    const { size = 40, className } = props;

    return (
        <Skeleton
            class={cn('rounded-full', className)}
            style={{ width: `${size}px`, height: `${size}px` }}
        />
    );
}

/**
 * Card skeleton - full card placeholder
 */
export function SkeletonCard(props: { className?: string }) {
    const { className } = props;

    return (
        <div class={cn('rounded-lg border p-4 space-y-4', className)}>
            <div class="flex items-center space-x-4">
                <SkeletonCircle size={48} />
                <div class="space-y-2 flex-1">
                    <Skeleton class="h-4 w-1/2" />
                    <Skeleton class="h-3 w-1/4" />
                </div>
            </div>
            <SkeletonText lines={3} />
            <div class="flex space-x-2">
                <Skeleton class="h-9 w-20" />
                <Skeleton class="h-9 w-20" />
            </div>
        </div>
    );
}

/**
 * Table skeleton - for table loading states
 */
export function SkeletonTable(props: { rows?: number; columns?: number; className?: string }) {
    const { rows = 5, columns = 4, className } = props;

    return (
        <div class={cn('w-full space-y-3', className)}>
            {/* Header */}
            <div class="flex space-x-4">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} class="h-8 flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} class="flex space-x-4">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={colIndex} class="h-10 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

/**
 * Image skeleton - for image placeholders
 */
export function SkeletonImage(props: { aspectRatio?: string; className?: string }) {
    const { aspectRatio = '16/9', className } = props;

    return (
        <Skeleton
            class={cn('w-full', className)}
            style={{ aspectRatio }}
        />
    );
}
