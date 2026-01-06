/**
 * Switch component - shadcn/ui style for PhilJS
 */

import { signal, effect, type Signal } from '@philjs/core';
import { cn } from '../utils.js';

export interface SwitchProps {
    checked?: boolean | Signal<boolean>;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean | Signal<boolean>;
    required?: boolean;
    name?: string;
    value?: string;
    id?: string;
    className?: string;
}

/**
 * Toggle switch component
 */
export function Switch(props: SwitchProps) {
    const {
        checked,
        defaultChecked = false,
        onCheckedChange,
        disabled,
        required,
        name,
        value = 'on',
        id,
        className,
    } = props;

    const isDisabled = typeof disabled === 'function' ? disabled() : disabled;

    // Internal state for uncontrolled mode
    const internalChecked = signal(
        typeof checked === 'function' ? checked() : (checked ?? defaultChecked)
    );

    // Sync with external signal if provided
    if (typeof checked === 'function') {
        effect(() => {
            internalChecked.set(checked());
        });
    }

    const isChecked = typeof checked === 'function'
        ? checked()
        : (checked ?? internalChecked());

    const toggle = () => {
        if (isDisabled) return;

        const newValue = !isChecked;

        if (typeof checked !== 'function' && checked === undefined) {
            internalChecked.set(newValue);
        }

        onCheckedChange?.(newValue);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
        }
    };

    return (
        <button
            type="button"
            role="switch"
            aria-checked={isChecked}
            aria-required={required}
            disabled={isDisabled}
            id={id}
            name={name}
            value={value}
            onClick={toggle}
            onKeyDown={handleKeyDown}
            class={cn(
                'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isChecked ? 'bg-primary' : 'bg-input',
                className
            )}
            data-state={isChecked ? 'checked' : 'unchecked'}
        >
            <span
                class={cn(
                    'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
                    isChecked ? 'translate-x-4' : 'translate-x-0'
                )}
            />
        </button>
    );
}

/**
 * Switch with label - convenience component
 */
export interface SwitchWithLabelProps extends SwitchProps {
    label: string;
    description?: string;
}

export function SwitchWithLabel(props: SwitchWithLabelProps) {
    const { label, description, id, ...switchProps } = props;
    const switchId = id ?? `switch-${Math.random().toString(36).slice(2, 9)}`;

    return (
        <div class="flex items-center justify-between space-x-4">
            <div class="space-y-0.5">
                <label
                    htmlFor={switchId}
                    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    {label}
                </label>
                {description && (
                    <p class="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            <Switch id={switchId} {...switchProps} />
        </div>
    );
}
