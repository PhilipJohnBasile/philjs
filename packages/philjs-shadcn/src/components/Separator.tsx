/**
 * Separator component - shadcn/ui style for PhilJS
 */

import { cn } from '../utils.js';

export interface SeparatorProps {
    orientation?: 'horizontal' | 'vertical';
    decorative?: boolean;
    className?: string;
}

/**
 * Visual separator/divider
 */
export function Separator(props: SeparatorProps) {
    const {
        orientation = 'horizontal',
        decorative = true,
        className,
    } = props;

    return (
        <div
            role={decorative ? 'none' : 'separator'}
            aria-orientation={decorative ? undefined : orientation}
            class={cn(
                'shrink-0 bg-border',
                orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
                className
            )}
        />
    );
}
