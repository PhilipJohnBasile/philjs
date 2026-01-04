import { signal, type Signal } from '@philjs/core';
import { cn } from '../utils.js';

export interface SelectProps {
    value?: string | Signal<string>;
    class?: string;
    disabled?: boolean | Signal<boolean>;
    required?: boolean;
    id?: string;
    name?: string;
    placeholder?: string;
    children?: any;
    onValueChange?: (value: string) => void;
}

/**
 * Select dropdown component
 */
export function Select(props: SelectProps) {
    const {
        value,
        class: className,
        disabled,
        required,
        id,
        name,
        placeholder,
        children,
        onValueChange,
    } = props;

    const getValue = () => (typeof value === 'function' ? value() : value ?? '');
    const isDisabled = () => (typeof disabled === 'function' ? disabled() : disabled);

    return (
        <select
            id={id}
            name={name}
            value={getValue()}
            disabled={isDisabled()}
            required={required}
            class={cn(
                'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                '[&>span]:line-clamp-1',
                className
            )}
            onChange={(e) => onValueChange?.((e.target as HTMLSelectElement).value)}
        >
            {placeholder && (
                <option value="" disabled>
                    {placeholder}
                </option>
            )}
            {children}
        </select>
    );
}

export interface SelectOptionProps {
    value: string;
    children?: any;
    disabled?: boolean;
}

/**
 * Select option
 */
export function SelectOption(props: SelectOptionProps) {
    return (
        <option value={props.value} disabled={props.disabled}>
            {props.children}
        </option>
    );
}
