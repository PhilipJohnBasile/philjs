/**
 * DropdownMenu component - shadcn/ui style for PhilJS
 */

import { signal, effect, type Signal } from '@philjs/core';
import { cn } from '../utils.js';

// Types
export interface DropdownMenuProps {
    open?: boolean | Signal<boolean>;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: any;
}

export interface DropdownMenuTriggerProps {
    asChild?: boolean;
    className?: string;
    children?: any;
}

export interface DropdownMenuContentProps {
    side?: 'top' | 'right' | 'bottom' | 'left';
    sideOffset?: number;
    align?: 'start' | 'center' | 'end';
    className?: string;
    children?: any;
}

export interface DropdownMenuItemProps {
    disabled?: boolean | Signal<boolean>;
    onSelect?: () => void;
    className?: string;
    children?: any;
}

export interface DropdownMenuCheckboxItemProps {
    checked?: boolean | Signal<boolean>;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean | Signal<boolean>;
    className?: string;
    children?: any;
}

export interface DropdownMenuRadioGroupProps {
    value?: string | Signal<string>;
    onValueChange?: (value: string) => void;
    children?: any;
}

export interface DropdownMenuRadioItemProps {
    value: string;
    disabled?: boolean | Signal<boolean>;
    className?: string;
    children?: any;
}

export interface DropdownMenuLabelProps {
    inset?: boolean;
    className?: string;
    children?: any;
}

export interface DropdownMenuSeparatorProps {
    className?: string;
}

export interface DropdownMenuSubProps {
    open?: boolean | Signal<boolean>;
    onOpenChange?: (open: boolean) => void;
    children?: any;
}

// Contexts
let currentMenuContext: {
    open: Signal<boolean>;
    onOpenChange?: (open: boolean) => void;
} | null = null;

let currentRadioGroupContext: {
    value: Signal<string>;
    onValueChange?: (value: string) => void;
} | null = null;

/**
 * Root DropdownMenu component
 */
export function DropdownMenu(props: DropdownMenuProps) {
    const { open, defaultOpen = false, onOpenChange, children } = props;

    const internalOpen = signal(
        typeof open === 'function' ? open() : (open ?? defaultOpen)
    );

    if (typeof open === 'function') {
        effect(() => {
            internalOpen.set(open());
        });
    }

    const prevContext = currentMenuContext;
    currentMenuContext = { open: internalOpen, onOpenChange };

    const result = (
        <div class="relative inline-block text-left">
            {children}
        </div>
    );

    currentMenuContext = prevContext;
    return result;
}

/**
 * Trigger button for the dropdown
 */
export function DropdownMenuTrigger(props: DropdownMenuTriggerProps) {
    const { asChild, className, children } = props;
    const context = currentMenuContext;

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
            aria-haspopup="menu"
            aria-expanded={context?.open() ?? false}
            class={cn(
                'inline-flex items-center justify-center',
                className
            )}
        >
            {children}
        </button>
    );
}

/**
 * Dropdown content panel
 */
export function DropdownMenuContent(props: DropdownMenuContentProps) {
    const {
        side = 'bottom',
        sideOffset = 4,
        align = 'start',
        className,
        children,
    } = props;

    const context = currentMenuContext;

    if (!context?.open()) return null;

    const positionClasses = {
        top: 'bottom-full mb-1',
        bottom: 'top-full mt-1',
        left: 'right-full mr-1',
        right: 'left-full ml-1',
    };

    const alignClasses = {
        start: side === 'top' || side === 'bottom' ? 'left-0' : 'top-0',
        center: side === 'top' || side === 'bottom'
            ? 'left-1/2 -translate-x-1/2'
            : 'top-1/2 -translate-y-1/2',
        end: side === 'top' || side === 'bottom' ? 'right-0' : 'bottom-0',
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            context.open.set(false);
            context.onOpenChange?.(false);
        }
    };

    return (
        <div
            role="menu"
            class={cn(
                'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
                'animate-in fade-in-0 zoom-in-95',
                side === 'bottom' && 'slide-in-from-top-2',
                side === 'top' && 'slide-in-from-bottom-2',
                side === 'left' && 'slide-in-from-right-2',
                side === 'right' && 'slide-in-from-left-2',
                positionClasses[side],
                alignClasses[align],
                className
            )}
            onKeyDown={handleKeyDown}
        >
            {children}
        </div>
    );
}

/**
 * Menu item
 */
export function DropdownMenuItem(props: DropdownMenuItemProps) {
    const { disabled, onSelect, className, children } = props;
    const context = currentMenuContext;

    const isDisabled = typeof disabled === 'function' ? disabled() : disabled;

    const handleClick = () => {
        if (!isDisabled) {
            onSelect?.();
            if (context) {
                context.open.set(false);
                context.onOpenChange?.(false);
            }
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
            e.preventDefault();
            handleClick();
        }
    };

    return (
        <div
            role="menuitem"
            tabindex={isDisabled ? -1 : 0}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            class={cn(
                'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
                'focus:bg-accent focus:text-accent-foreground',
                isDisabled && 'pointer-events-none opacity-50',
                className
            )}
            aria-disabled={isDisabled}
        >
            {children}
        </div>
    );
}

/**
 * Checkbox menu item
 */
export function DropdownMenuCheckboxItem(props: DropdownMenuCheckboxItemProps) {
    const { checked, onCheckedChange, disabled, className, children } = props;

    const isChecked = typeof checked === 'function' ? checked() : checked;
    const isDisabled = typeof disabled === 'function' ? disabled() : disabled;

    const handleClick = () => {
        if (!isDisabled) {
            onCheckedChange?.(!isChecked);
        }
    };

    return (
        <div
            role="menuitemcheckbox"
            aria-checked={isChecked}
            aria-disabled={isDisabled}
            tabindex={isDisabled ? -1 : 0}
            onClick={handleClick}
            class={cn(
                'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
                'focus:bg-accent focus:text-accent-foreground',
                isDisabled && 'pointer-events-none opacity-50',
                className
            )}
        >
            <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {isChecked && (
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
                        class="h-4 w-4"
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                )}
            </span>
            {children}
        </div>
    );
}

/**
 * Radio group container for menu
 */
export function DropdownMenuRadioGroup(props: DropdownMenuRadioGroupProps) {
    const { value, onValueChange, children } = props;

    const internalValue = signal(
        typeof value === 'function' ? value() : (value ?? '')
    );

    if (typeof value === 'function') {
        effect(() => {
            internalValue.set(value());
        });
    }

    const prevContext = currentRadioGroupContext;
    currentRadioGroupContext = { value: internalValue, onValueChange };

    const result = <div role="group">{children}</div>;

    currentRadioGroupContext = prevContext;
    return result;
}

/**
 * Radio menu item
 */
export function DropdownMenuRadioItem(props: DropdownMenuRadioItemProps) {
    const { value, disabled, className, children } = props;
    const context = currentRadioGroupContext;

    const isDisabled = typeof disabled === 'function' ? disabled() : disabled;
    const isSelected = context?.value() === value;

    const handleClick = () => {
        if (!isDisabled && context) {
            context.value.set(value);
            context.onValueChange?.(value);
        }
    };

    return (
        <div
            role="menuitemradio"
            aria-checked={isSelected}
            aria-disabled={isDisabled}
            tabindex={isDisabled ? -1 : 0}
            onClick={handleClick}
            class={cn(
                'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
                'focus:bg-accent focus:text-accent-foreground',
                isDisabled && 'pointer-events-none opacity-50',
                className
            )}
        >
            <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {isSelected && (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        class="h-4 w-4"
                    >
                        <circle cx="12" cy="12" r="4" fill="currentColor" />
                    </svg>
                )}
            </span>
            {children}
        </div>
    );
}

/**
 * Label for grouping items
 */
export function DropdownMenuLabel(props: DropdownMenuLabelProps) {
    const { inset, className, children } = props;

    return (
        <div
            class={cn(
                'px-2 py-1.5 text-sm font-semibold',
                inset && 'pl-8',
                className
            )}
        >
            {children}
        </div>
    );
}

/**
 * Separator line
 */
export function DropdownMenuSeparator(props: DropdownMenuSeparatorProps) {
    const { className } = props;

    return (
        <div
            role="separator"
            class={cn('-mx-1 my-1 h-px bg-muted', className)}
        />
    );
}

/**
 * Group container
 */
export function DropdownMenuGroup(props: { className?: string; children?: any }) {
    return <div role="group" class={props.className}>{props.children}</div>;
}

/**
 * Shortcut text
 */
export function DropdownMenuShortcut(props: { className?: string; children?: any }) {
    return (
        <span class={cn('ml-auto text-xs tracking-widest opacity-60', props.className)}>
            {props.children}
        </span>
    );
}

/**
 * Sub-menu container
 */
export function DropdownMenuSub(props: DropdownMenuSubProps) {
    const { open, onOpenChange, children } = props;

    const internalOpen = signal(
        typeof open === 'function' ? open() : (open ?? false)
    );

    if (typeof open === 'function') {
        effect(() => {
            internalOpen.set(open());
        });
    }

    const prevContext = currentMenuContext;
    currentMenuContext = { open: internalOpen, onOpenChange };

    const result = <div class="relative">{children}</div>;

    currentMenuContext = prevContext;
    return result;
}

/**
 * Sub-menu trigger
 */
export function DropdownMenuSubTrigger(props: { inset?: boolean; className?: string; children?: any }) {
    const { inset, className, children } = props;
    const context = currentMenuContext;

    const handleMouseEnter = () => {
        if (context) {
            context.open.set(true);
            context.onOpenChange?.(true);
        }
    };

    return (
        <div
            class={cn(
                'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent',
                inset && 'pl-8',
                className
            )}
            onMouseEnter={handleMouseEnter}
        >
            {children}
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
                class="ml-auto h-4 w-4"
            >
                <path d="m9 18 6-6-6-6" />
            </svg>
        </div>
    );
}

/**
 * Sub-menu content
 */
export function DropdownMenuSubContent(props: { className?: string; children?: any }) {
    const context = currentMenuContext;

    if (!context?.open()) return null;

    return (
        <div
            class={cn(
                'absolute left-full top-0 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg',
                'animate-in fade-in-0 zoom-in-95 slide-in-from-left-2',
                props.className
            )}
        >
            {props.children}
        </div>
    );
}
