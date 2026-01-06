/**
 * Sheet (drawer) component - shadcn/ui style for PhilJS
 */

import { signal, effect, type Signal } from '@philjs/core';
import { cn } from '../utils.js';
import { cva, type VariantProps } from 'class-variance-authority';

// Sheet variants for different sides
const sheetVariants = cva(
    'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
    {
        variants: {
            side: {
                top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
                bottom: 'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
                left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
                right: 'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
            },
        },
        defaultVariants: {
            side: 'right',
        },
    }
);

// Types
export interface SheetProps {
    open?: boolean | Signal<boolean>;
    onOpenChange?: (open: boolean) => void;
    children?: any;
}

export interface SheetTriggerProps {
    asChild?: boolean;
    className?: string;
    children?: any;
}

export interface SheetContentProps extends VariantProps<typeof sheetVariants> {
    className?: string;
    children?: any;
}

export interface SheetHeaderProps {
    className?: string;
    children?: any;
}

export interface SheetTitleProps {
    className?: string;
    children?: any;
}

export interface SheetDescriptionProps {
    className?: string;
    children?: any;
}

export interface SheetFooterProps {
    className?: string;
    children?: any;
}

export interface SheetCloseProps {
    asChild?: boolean;
    className?: string;
    children?: any;
}

// Context
let currentSheetContext: {
    open: Signal<boolean>;
    onOpenChange?: (open: boolean) => void;
} | null = null;

/**
 * Root Sheet component
 */
export function Sheet(props: SheetProps) {
    const { open, onOpenChange, children } = props;

    const internalOpen = signal(
        typeof open === 'function' ? open() : (open ?? false)
    );

    if (typeof open === 'function') {
        effect(() => {
            internalOpen.set(open());
        });
    }

    const prevContext = currentSheetContext;
    currentSheetContext = { open: internalOpen, onOpenChange };

    const result = children;

    currentSheetContext = prevContext;
    return result;
}

/**
 * Trigger button to open the sheet
 */
export function SheetTrigger(props: SheetTriggerProps) {
    const { asChild, className, children } = props;
    const context = currentSheetContext;

    const handleClick = () => {
        if (context) {
            context.open.set(true);
            context.onOpenChange?.(true);
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
 * Sheet content panel
 */
export function SheetContent(props: SheetContentProps) {
    const { side = 'right', className, children } = props;
    const context = currentSheetContext;

    const isOpen = context?.open() ?? false;

    if (!isOpen) return null;

    const handleClose = () => {
        if (context) {
            context.open.set(false);
            context.onOpenChange?.(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleClose();
        }
    };

    const handleOverlayClick = (e: MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                data-state={isOpen ? 'open' : 'closed'}
                onClick={handleOverlayClick}
            />

            {/* Sheet panel */}
            <div
                role="dialog"
                aria-modal="true"
                data-state={isOpen ? 'open' : 'closed'}
                onKeyDown={handleKeyDown}
                class={cn(sheetVariants({ side }), className)}
            >
                {children}

                {/* Close button */}
                <button
                    type="button"
                    onClick={handleClose}
                    class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
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
                    <span class="sr-only">Close</span>
                </button>
            </div>
        </>
    );
}

/**
 * Sheet header area
 */
export function SheetHeader(props: SheetHeaderProps) {
    const { className, children } = props;

    return (
        <div class={cn('flex flex-col space-y-2 text-center sm:text-left', className)}>
            {children}
        </div>
    );
}

/**
 * Sheet title
 */
export function SheetTitle(props: SheetTitleProps) {
    const { className, children } = props;

    return (
        <h2 class={cn('text-lg font-semibold text-foreground', className)}>
            {children}
        </h2>
    );
}

/**
 * Sheet description
 */
export function SheetDescription(props: SheetDescriptionProps) {
    const { className, children } = props;

    return (
        <p class={cn('text-sm text-muted-foreground', className)}>
            {children}
        </p>
    );
}

/**
 * Sheet footer area
 */
export function SheetFooter(props: SheetFooterProps) {
    const { className, children } = props;

    return (
        <div class={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}>
            {children}
        </div>
    );
}

/**
 * Close button for the sheet
 */
export function SheetClose(props: SheetCloseProps) {
    const { asChild, className, children } = props;
    const context = currentSheetContext;

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
