import { signal, type Signal } from '@philjs/core';
import { cn } from '../utils.js';

export interface TextareaProps {
    placeholder?: string;
    value?: string | Signal<string>;
    class?: string;
    disabled?: boolean | Signal<boolean>;
    required?: boolean;
    id?: string;
    name?: string;
    rows?: number;
    onInput?: (value: string) => void;
    onChange?: (value: string) => void;
}

/**
 * Textarea form component
 */
export function Textarea(props: TextareaProps) {
    const {
        placeholder,
        value,
        class: className,
        disabled,
        required,
        id,
        name,
        rows = 3,
        onInput,
        onChange,
    } = props;

    const getValue = () => (typeof value === 'function' ? value() : value ?? '');
    const isDisabled = () => (typeof disabled === 'function' ? disabled() : disabled);

    return (
        <textarea
            id={id}
            name={name}
            placeholder={placeholder}
            value={getValue()}
            disabled={isDisabled()}
            required={required}
            rows={rows}
            class={cn(
                'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                'placeholder:text-muted-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            onInput={(e) => onInput?.((e.target as HTMLTextAreaElement).value)}
            onChange={(e) => onChange?.((e.target as HTMLTextAreaElement).value)}
        />
    );
}
