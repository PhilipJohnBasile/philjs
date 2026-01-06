/**
 * Tooltip component - shadcn/ui style for PhilJS
 */

import { signal, effect, type Signal } from '@philjs/core';
import { cn } from '../utils.js';

// Types
export interface TooltipProps {
    delayDuration?: number;
    skipDelayDuration?: number;
    disableHoverableContent?: boolean;
    children?: any;
}

export interface TooltipTriggerProps {
    asChild?: boolean;
    className?: string;
    children?: any;
}

export interface TooltipContentProps {
    side?: 'top' | 'right' | 'bottom' | 'left';
    sideOffset?: number;
    align?: 'start' | 'center' | 'end';
    className?: string;
    children?: any;
}

// Context
let currentTooltipContext: {
    open: Signal<boolean>;
    delayDuration: number;
    triggerRef: { current: HTMLElement | null };
} | null = null;

/**
 * Tooltip provider - wrap around trigger and content
 */
export function Tooltip(props: TooltipProps) {
    const { delayDuration = 400, children } = props;

    const open = signal(false);
    const triggerRef = { current: null as HTMLElement | null };

    const prevContext = currentTooltipContext;
    currentTooltipContext = { open, delayDuration, triggerRef };

    const result = (
        <span class="relative inline-block">
            {children}
        </span>
    );

    currentTooltipContext = prevContext;
    return result;
}

/**
 * Element that triggers the tooltip on hover
 */
export function TooltipTrigger(props: TooltipTriggerProps) {
    const { asChild, className, children } = props;
    const context = currentTooltipContext;

    let delayTimer: number | null = null;

    const handleMouseEnter = () => {
        if (context) {
            delayTimer = window.setTimeout(() => {
                context.open.set(true);
            }, context.delayDuration);
        }
    };

    const handleMouseLeave = () => {
        if (delayTimer) {
            clearTimeout(delayTimer);
            delayTimer = null;
        }
        context?.open.set(false);
    };

    const handleFocus = () => {
        context?.open.set(true);
    };

    const handleBlur = () => {
        context?.open.set(false);
    };

    if (asChild) {
        // Clone element with added handlers
        return children;
    }

    return (
        <button
            type="button"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
            class={className}
            ref={(el: HTMLElement) => {
                if (context) context.triggerRef.current = el;
            }}
        >
            {children}
        </button>
    );
}

/**
 * Tooltip content that appears on hover
 */
export function TooltipContent(props: TooltipContentProps) {
    const {
        side = 'top',
        sideOffset = 4,
        align = 'center',
        className,
        children,
    } = props;

    const context = currentTooltipContext;

    if (!context?.open()) return null;

    // Position classes based on side
    const positionClasses = {
        top: 'bottom-full mb-2',
        bottom: 'top-full mt-2',
        left: 'right-full mr-2',
        right: 'left-full ml-2',
    };

    const alignClasses = {
        start: side === 'top' || side === 'bottom' ? 'left-0' : 'top-0',
        center: side === 'top' || side === 'bottom'
            ? 'left-1/2 -translate-x-1/2'
            : 'top-1/2 -translate-y-1/2',
        end: side === 'top' || side === 'bottom' ? 'right-0' : 'bottom-0',
    };

    // Animation based on side
    const animationClasses = {
        top: 'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2',
        bottom: 'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
        left: 'animate-in fade-in-0 zoom-in-95 slide-in-from-right-2',
        right: 'animate-in fade-in-0 zoom-in-95 slide-in-from-left-2',
    };

    return (
        <div
            role="tooltip"
            class={cn(
                'absolute z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground',
                positionClasses[side],
                alignClasses[align],
                animationClasses[side],
                className
            )}
            style={{ marginTop: side === 'bottom' ? `${sideOffset}px` : undefined }}
        >
            {children}
        </div>
    );
}

/**
 * Global tooltip provider for app-wide configuration
 */
export interface TooltipProviderProps {
    delayDuration?: number;
    skipDelayDuration?: number;
    disableHoverableContent?: boolean;
    children?: any;
}

export function TooltipProvider(props: TooltipProviderProps) {
    // Provider component - just passes through children
    // Configuration is handled at individual Tooltip level
    return props.children;
}
