/**
 * RadioGroup component - shadcn/ui style for PhilJS
 */

import { signal, effect, type Signal } from '@philjs/core';
import { cn } from '../utils.js';

// Types
export interface RadioGroupProps {
    value?: string | Signal<string>;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean | Signal<boolean>;
    name?: string;
    orientation?: 'horizontal' | 'vertical';
    className?: string;
    children?: any;
}

export interface RadioGroupItemProps {
    value: string;
    disabled?: boolean | Signal<boolean>;
    id?: string;
    className?: string;
}

// Context
let currentRadioContext: {
    value: Signal<string>;
    onValueChange?: (value: string) => void;
    name?: string;
    disabled: boolean;
} | null = null;

/**
 * Radio group container
 */
export function RadioGroup(props: RadioGroupProps) {
    const {
        value,
        defaultValue = '',
        onValueChange,
        disabled,
        name,
        orientation = 'vertical',
        className,
        children,
    } = props;

    const isDisabled = typeof disabled === 'function' ? disabled() : (disabled ?? false);

    const internalValue = signal(
        typeof value === 'function' ? value() : (value ?? defaultValue)
    );

    if (typeof value === 'function') {
        effect(() => {
            internalValue.set(value());
        });
    }

    const prevContext = currentRadioContext;
    currentRadioContext = {
        value: internalValue,
        onValueChange,
        name,
        disabled: isDisabled,
    };

    const result = (
        <div
            role="radiogroup"
            aria-orientation={orientation}
            class={cn(
                'grid gap-2',
                orientation === 'horizontal' && 'grid-flow-col',
                className
            )}
        >
            {children}
        </div>
    );

    currentRadioContext = prevContext;
    return result;
}

/**
 * Individual radio item
 */
export function RadioGroupItem(props: RadioGroupItemProps) {
    const { value, disabled, id, className } = props;
    const context = currentRadioContext;

    const isDisabled = typeof disabled === 'function'
        ? disabled()
        : (disabled ?? context?.disabled ?? false);

    const isSelected = context?.value() === value;

    const handleClick = () => {
        if (!isDisabled && context) {
            context.value.set(value);
            context.onValueChange?.(value);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
            e.preventDefault();
            handleClick();
        }
    };

    return (
        <button
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={isDisabled}
            id={id}
            name={context?.name}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            class={cn(
                'aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow',
                'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            data-state={isSelected ? 'checked' : 'unchecked'}
        >
            {isSelected && (
                <span class="flex items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="h-2.5 w-2.5"
                    >
                        <circle cx="12" cy="12" r="5" />
                    </svg>
                </span>
            )}
        </button>
    );
}

/**
 * Convenience wrapper for radio with label
 */
export interface RadioGroupItemWithLabelProps extends RadioGroupItemProps {
    label: string;
    description?: string;
}

export function RadioGroupItemWithLabel(props: RadioGroupItemWithLabelProps) {
    const { label, description, id, ...radioProps } = props;
    const itemId = id ?? `radio-${props.value}-${Math.random().toString(36).slice(2, 9)}`;

    return (
        <div class="flex items-start space-x-3">
            <RadioGroupItem id={itemId} {...radioProps} />
            <div class="grid gap-1.5 leading-none">
                <label
                    htmlFor={itemId}
                    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    {label}
                </label>
                {description && (
                    <p class="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
        </div>
    );
}
