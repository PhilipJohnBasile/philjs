import { signal, type Signal } from '@philjs/core';
import { cn } from '../utils.js';

export interface InputProps {
    type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';
    placeholder?: string;
    value?: string | Signal<string>;
    class?: string;
    disabled?: boolean | Signal<boolean>;
    required?: boolean;
    id?: string;
    name?: string;
    onInput?: (value: string) => void;
    onChange?: (value: string) => void;
    onFocus?: (e: FocusEvent) => void;
    onBlur?: (e: FocusEvent) => void;
}

/**
 * Native PhilJS Input component with shadcn/ui styling
 * 
 * @example
 * ```tsx
 * const email = signal('');
 * <Input 
 *   type="email" 
 *   placeholder="Enter email" 
 *   value={email} 
 *   onInput={(v) => email.set(v)} 
 * />
 * ```
 */
export function Input(props: InputProps) {
    const {
        type = 'text',
        placeholder,
        value,
        class: className,
        disabled,
        required,
        id,
        name,
        onInput,
        onChange,
        onFocus,
        onBlur,
    } = props;

    const getValue = () => (typeof value === 'function' ? value() : value ?? '');
    const isDisabled = () => (typeof disabled === 'function' ? disabled() : disabled);

    return (
        <input
            type={type}
            id={id}
            name={name}
            placeholder={placeholder}
            value={getValue()}
            disabled={isDisabled()}
            required={required}
            class={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                'file:border-0 file:bg-transparent file:text-sm file:font-medium',
                'placeholder:text-muted-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            onInput={(e) => onInput?.((e.target as HTMLInputElement).value)}
            onChange={(e) => onChange?.((e.target as HTMLInputElement).value)}
            onFocus={onFocus}
            onBlur={onBlur}
        />
    );
}
