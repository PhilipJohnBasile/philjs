/**
 * Popover component - shadcn/ui style for PhilJS
 */

import { signal, effect, type Signal } from '@philjs/core';
import { cn } from '../utils.js';

// Types
export interface PopoverProps {
    open?: boolean | Signal<boolean>;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: any;
}

export interface PopoverTriggerProps {
    asChild?: boolean;
    className?: string;
    children?: any;
}

export interface PopoverContentProps {
    side?: 'top' | 'right' | 'bottom' | 'left';
    sideOffset?: number;
    align?: 'start' | 'center' | 'end';
    alignOffset?: number;
    className?: string;
    children?: any;
}

export interface PopoverCloseProps {
    asChild?: boolean;
    className?: string;
    children?: any;
}

// Context
let currentPopoverContext: {
    open: Signal<boolean>;
    onOpenChange?: (open: boolean) => void;
    triggerRef: { current: HTMLElement | null };
} | null = null;

/**
 * Root Popover component
 */
export function Popover(props: PopoverProps) {
    const { open, defaultOpen = false, onOpenChange, children } = props;

    const internalOpen = signal(
        typeof open === 'function' ? open() : (open ?? defaultOpen)
    );

    if (typeof open === 'function') {
        effect(() => {
            internalOpen.set(open());
        });
    }

    const prevContext = currentPopoverContext;
    currentPopoverContext = {
        open: internalOpen,
        onOpenChange,
        triggerRef: { current: null },
    };

    const result = (
        <div class="relative inline-block">
            {children}
        </div>
    );

    currentPopoverContext = prevContext;
    return result;
}

/**
 * Trigger element for the popover
 */
export function PopoverTrigger(props: PopoverTriggerProps) {
    const { asChild, className, children } = props;
    const context = currentPopoverContext;

    const handleClick = () => {
        if (context) {
            const newState = !context.open();
            context.open.set(newState);
            context.onOpenChange?.(newState);
        }
    };

    if (asChild) {
        return children;
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            class={className}
            aria-expanded={context?.open() ?? false}
            ref={(el: HTMLElement) => {
                if (context) context.triggerRef.current = el;
            }}
        >
            {children}
        </button>
    );
}

/**
 * Popover content panel
 */
export function PopoverContent(props: PopoverContentProps) {
    const {
        side = 'bottom',
        sideOffset = 4,
        align = 'center',
        alignOffset = 0,
        className,
        children,
    } = props;

    const context = currentPopoverContext;

    if (!context?.open()) return null;

    // Position classes
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

    // Animation classes
    const animationClasses = {
        top: 'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2',
        bottom: 'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
        left: 'animate-in fade-in-0 zoom-in-95 slide-in-from-right-2',
        right: 'animate-in fade-in-0 zoom-in-95 slide-in-from-left-2',
    };

    const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        const content = e.currentTarget as HTMLElement;

        if (!content.contains(target) && context.triggerRef.current !== target) {
            context.open.set(false);
            context.onOpenChange?.(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            context.open.set(false);
            context.onOpenChange?.(false);
        }
    };

    return (
        <div
            role="dialog"
            class={cn(
                'absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
                positionClasses[side],
                alignClasses[align],
                animationClasses[side],
                className
            )}
            style={{
                marginTop: side === 'bottom' ? `${sideOffset}px` : undefined,
                marginBottom: side === 'top' ? `${sideOffset}px` : undefined,
                marginLeft: side === 'right' ? `${sideOffset}px` : undefined,
                marginRight: side === 'left' ? `${sideOffset}px` : undefined,
            }}
            onKeyDown={handleKeyDown}
            tabindex={-1}
        >
            {children}
        </div>
    );
}

/**
 * Close button for popover
 */
export function PopoverClose(props: PopoverCloseProps) {
    const { asChild, className, children } = props;
    const context = currentPopoverContext;

    const handleClick = () => {
        if (context) {
            context.open.set(false);
            context.onOpenChange?.(false);
        }
    };

    if (asChild) {
        return children;
    }

    return (
        <button type="button" onClick={handleClick} class={className}>
            {children}
        </button>
    );
}

/**
 * Popover anchor - for positioning relative to another element
 */
export function PopoverAnchor(props: { className?: string; children?: any }) {
    return <div class={props.className}>{props.children}</div>;
}
