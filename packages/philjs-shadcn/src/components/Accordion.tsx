/**
 * Accordion component - shadcn/ui style for PhilJS
 */

import { signal, effect, type Signal } from '@philjs/core';
import { cn } from '../utils.js';

// Types
export interface AccordionProps {
    type?: 'single' | 'multiple';
    defaultValue?: string | string[];
    value?: string | string[] | Signal<string | string[]>;
    onValueChange?: (value: string | string[]) => void;
    collapsible?: boolean;
    className?: string;
    children?: any;
}

export interface AccordionItemProps {
    value: string;
    disabled?: boolean | Signal<boolean>;
    className?: string;
    children?: any;
}

export interface AccordionTriggerProps {
    className?: string;
    children?: any;
}

export interface AccordionContentProps {
    className?: string;
    children?: any;
}

// Context
let currentAccordionContext: {
    type: 'single' | 'multiple';
    value: Signal<string | string[]>;
    onValueChange?: (value: string | string[]) => void;
    collapsible: boolean;
} | null = null;

let currentItemContext: {
    value: string;
    disabled: boolean;
} | null = null;

/**
 * Root Accordion container
 */
export function Accordion(props: AccordionProps) {
    const {
        type = 'single',
        defaultValue,
        value,
        onValueChange,
        collapsible = false,
        className,
        children,
    } = props;

    const initialValue = typeof value === 'function'
        ? value()
        : (value ?? defaultValue ?? (type === 'multiple' ? [] : ''));

    const internalValue = signal<string | string[]>(initialValue);

    // Sync external value
    if (typeof value === 'function') {
        effect(() => {
            internalValue.set(value());
        });
    }

    const prevContext = currentAccordionContext;
    currentAccordionContext = {
        type,
        value: internalValue,
        onValueChange,
        collapsible,
    };

    const result = (
        <div class={cn('w-full', className)} data-accordion-type={type}>
            {children}
        </div>
    );

    currentAccordionContext = prevContext;
    return result;
}

/**
 * Individual accordion item
 */
export function AccordionItem(props: AccordionItemProps) {
    const { value, disabled, className, children } = props;
    const isDisabled = typeof disabled === 'function' ? disabled() : (disabled ?? false);

    const prevItemContext = currentItemContext;
    currentItemContext = { value, disabled: isDisabled };

    const result = (
        <div
            class={cn('border-b', className)}
            data-state={isExpanded(value) ? 'open' : 'closed'}
            data-disabled={isDisabled ? '' : undefined}
        >
            {children}
        </div>
    );

    currentItemContext = prevItemContext;
    return result;
}

function isExpanded(value: string): boolean {
    const context = currentAccordionContext;
    if (!context) return false;

    const currentValue = context.value();
    if (context.type === 'multiple') {
        return Array.isArray(currentValue) && currentValue.includes(value);
    }
    return currentValue === value;
}

/**
 * Clickable trigger to expand/collapse
 */
export function AccordionTrigger(props: AccordionTriggerProps) {
    const { className, children } = props;
    const accordionContext = currentAccordionContext;
    const itemContext = currentItemContext;

    if (!itemContext) return null;

    const expanded = isExpanded(itemContext.value);

    const handleClick = () => {
        if (itemContext.disabled || !accordionContext) return;

        const { type, value, onValueChange, collapsible } = accordionContext;
        const currentValue = value();
        const itemValue = itemContext.value;

        let newValue: string | string[];

        if (type === 'multiple') {
            const arr = Array.isArray(currentValue) ? currentValue : [];
            if (arr.includes(itemValue)) {
                newValue = arr.filter(v => v !== itemValue);
            } else {
                newValue = [...arr, itemValue];
            }
        } else {
            if (currentValue === itemValue) {
                newValue = collapsible ? '' : itemValue;
            } else {
                newValue = itemValue;
            }
        }

        value.set(newValue);
        onValueChange?.(newValue);
    };

    return (
        <h3 class="flex">
            <button
                type="button"
                aria-expanded={expanded}
                disabled={itemContext.disabled}
                onClick={handleClick}
                class={cn(
                    'flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all',
                    'hover:underline [&[data-state=open]>svg]:rotate-180',
                    itemContext.disabled && 'cursor-not-allowed opacity-50',
                    className
                )}
                data-state={expanded ? 'open' : 'closed'}
            >
                {children}
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
                    class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>
        </h3>
    );
}

/**
 * Collapsible content area
 */
export function AccordionContent(props: AccordionContentProps) {
    const { className, children } = props;
    const itemContext = currentItemContext;

    if (!itemContext) return null;

    const expanded = isExpanded(itemContext.value);

    return (
        <div
            role="region"
            class={cn(
                'overflow-hidden text-sm',
                expanded ? 'animate-accordion-down' : 'animate-accordion-up hidden',
                className
            )}
            data-state={expanded ? 'open' : 'closed'}
        >
            <div class="pb-4 pt-0">{children}</div>
        </div>
    );
}
