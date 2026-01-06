/**
 * ScrollArea component - shadcn/ui style for PhilJS
 */

import { signal, effect, type Signal } from '@philjs/core';
import { cn } from '../utils.js';

export interface ScrollAreaProps {
    className?: string;
    viewportClassName?: string;
    orientation?: 'vertical' | 'horizontal' | 'both';
    children?: any;
}

export interface ScrollBarProps {
    orientation?: 'vertical' | 'horizontal';
    className?: string;
}

/**
 * Custom scroll area with styled scrollbars
 */
export function ScrollArea(props: ScrollAreaProps) {
    const {
        className,
        viewportClassName,
        orientation = 'vertical',
        children,
    } = props;

    const showVertical = orientation === 'vertical' || orientation === 'both';
    const showHorizontal = orientation === 'horizontal' || orientation === 'both';

    return (
        <div class={cn('relative overflow-hidden', className)}>
            <div
                class={cn(
                    'h-full w-full rounded-[inherit]',
                    showVertical && 'overflow-y-auto',
                    showHorizontal && 'overflow-x-auto',
                    // Custom scrollbar styling via CSS
                    '[&::-webkit-scrollbar]:w-2.5',
                    '[&::-webkit-scrollbar]:h-2.5',
                    '[&::-webkit-scrollbar-track]:bg-transparent',
                    '[&::-webkit-scrollbar-thumb]:rounded-full',
                    '[&::-webkit-scrollbar-thumb]:bg-border',
                    '[&::-webkit-scrollbar-thumb:hover]:bg-border/80',
                    viewportClassName
                )}
            >
                {children}
            </div>

            {/* Scrollbar indicators (optional visual elements) */}
            {showVertical && <ScrollBar orientation="vertical" />}
            {showHorizontal && <ScrollBar orientation="horizontal" />}
        </div>
    );
}

/**
 * Custom scrollbar element
 */
export function ScrollBar(props: ScrollBarProps) {
    const { orientation = 'vertical', className } = props;

    // The actual scrollbar styling is handled by CSS on the viewport
    // This is a visual placeholder for potential future custom scrollbar implementation
    return (
        <div
            class={cn(
                'absolute touch-none select-none transition-colors',
                orientation === 'vertical' &&
                    'right-0 top-0 h-full w-2.5 border-l border-l-transparent p-[1px]',
                orientation === 'horizontal' &&
                    'bottom-0 left-0 h-2.5 w-full border-t border-t-transparent p-[1px]',
                className
            )}
            style={{ display: 'none' }} // Hidden - using native scrollbars with CSS styling
        >
            <div
                class={cn(
                    'relative rounded-full bg-border',
                    orientation === 'vertical' && 'flex-1',
                    orientation === 'horizontal' && 'h-full'
                )}
            />
        </div>
    );
}

/**
 * Scroll area with fade edges to indicate more content
 */
export interface ScrollAreaWithFadeProps extends ScrollAreaProps {
    fadeSize?: number;
}

export function ScrollAreaWithFade(props: ScrollAreaWithFadeProps) {
    const { fadeSize = 20, className, ...rest } = props;

    return (
        <div class={cn('relative', className)}>
            <ScrollArea {...rest} />
            {/* Top fade */}
            <div
                class="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-background to-transparent"
                style={{ height: `${fadeSize}px` }}
            />
            {/* Bottom fade */}
            <div
                class="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background to-transparent"
                style={{ height: `${fadeSize}px` }}
            />
        </div>
    );
}
