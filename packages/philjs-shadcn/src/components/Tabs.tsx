/**
 * Tabs component - shadcn/ui style for PhilJS
 */

import { signal, effect, type Signal } from '@philjs/core';
import { cn } from '../utils.js';

// Types
export interface TabsProps {
    defaultValue?: string;
    value?: string | Signal<string>;
    onValueChange?: (value: string) => void;
    orientation?: 'horizontal' | 'vertical';
    className?: string;
    children?: any;
}

export interface TabsListProps {
    className?: string;
    children?: any;
}

export interface TabsTriggerProps {
    value: string;
    disabled?: boolean | Signal<boolean>;
    className?: string;
    children?: any;
}

export interface TabsContentProps {
    value: string;
    className?: string;
    children?: any;
}

// Context for tabs state
let currentTabsContext: {
    value: Signal<string>;
    onValueChange?: (value: string) => void;
    orientation: 'horizontal' | 'vertical';
} | null = null;

/**
 * Root Tabs container
 */
export function Tabs(props: TabsProps) {
    const {
        defaultValue = '',
        value,
        onValueChange,
        orientation = 'horizontal',
        className,
        children,
    } = props;

    const internalValue = signal(
        typeof value === 'function' ? value() : (value ?? defaultValue)
    );

    // Sync external value changes
    if (typeof value === 'function') {
        effect(() => {
            internalValue.set(value());
        });
    }

    // Set context for child components
    const prevContext = currentTabsContext;
    currentTabsContext = {
        value: internalValue,
        onValueChange,
        orientation,
    };

    const result = (
        <div
            class={cn(
                'w-full',
                orientation === 'vertical' && 'flex',
                className
            )}
            data-orientation={orientation}
        >
            {children}
        </div>
    );

    currentTabsContext = prevContext;
    return result;
}

/**
 * Container for tab triggers
 */
export function TabsList(props: TabsListProps) {
    const { className, children } = props;
    const context = currentTabsContext;
    const orientation = context?.orientation ?? 'horizontal';

    return (
        <div
            role="tablist"
            aria-orientation={orientation}
            class={cn(
                'inline-flex items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
                orientation === 'horizontal' ? 'h-9' : 'flex-col h-auto',
                className
            )}
        >
            {children}
        </div>
    );
}

/**
 * Individual tab trigger button
 */
export function TabsTrigger(props: TabsTriggerProps) {
    const { value, disabled, className, children } = props;
    const context = currentTabsContext;

    const isDisabled = typeof disabled === 'function' ? disabled() : disabled;
    const isSelected = context?.value() === value;

    const handleClick = () => {
        if (!isDisabled && context) {
            context.value.set(value);
            context.onValueChange?.(value);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    return (
        <button
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={`tabpanel-${value}`}
            tabindex={isSelected ? 0 : -1}
            disabled={isDisabled}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            class={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                isSelected && 'bg-background text-foreground shadow',
                className
            )}
        >
            {children}
        </button>
    );
}

/**
 * Content panel for a tab
 */
export function TabsContent(props: TabsContentProps) {
    const { value, className, children } = props;
    const context = currentTabsContext;

    const isSelected = context?.value() === value;

    if (!isSelected) return null;

    return (
        <div
            role="tabpanel"
            id={`tabpanel-${value}`}
            tabindex={0}
            class={cn(
                'mt-2 ring-offset-background',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                className
            )}
        >
            {children}
        </div>
    );
}
