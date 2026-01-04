import { signal, type Signal } from '@philjs/core';
import { cn } from '../utils.js';

export interface CheckboxProps {
    checked?: boolean | Signal<boolean>;
    class?: string;
    disabled?: boolean | Signal<boolean>;
    id?: string;
    name?: string;
    onCheckedChange?: (checked: boolean) => void;
}

/**
 * Checkbox form component
 */
export function Checkbox(props: CheckboxProps) {
    const {
        checked,
        class: className,
        disabled,
        id,
        name,
        onCheckedChange,
    } = props;

    const isChecked = () => (typeof checked === 'function' ? checked() : checked ?? false);
    const isDisabled = () => (typeof disabled === 'function' ? disabled() : disabled);

    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={isChecked()}
            id={id}
            disabled={isDisabled()}
            class={cn(
                'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
                className
            )}
            data-state={isChecked() ? 'checked' : 'unchecked'}
            onClick={() => onCheckedChange?.(!isChecked())}
        >
            {isChecked() && (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
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
        </button>
    );
}
