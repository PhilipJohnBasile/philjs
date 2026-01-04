import { signal, type Signal } from '@philjs/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils.js';

const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground hover:bg-primary/90',
                destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-md px-3',
                lg: 'h-11 rounded-md px-8',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
    children?: any;
    class?: string;
    disabled?: boolean | Signal<boolean>;
    loading?: boolean | Signal<boolean>;
    type?: 'button' | 'submit' | 'reset';
    onClick?: (e: MouseEvent) => void;
}

/**
 * Native PhilJS Button component with shadcn/ui styling
 * 
 * @example
 * ```tsx
 * <Button variant="default" size="lg" onClick={() => console.log('clicked')}>
 *   Click me
 * </Button>
 * ```
 */
export function Button(props: ButtonProps) {
    const {
        children,
        class: className,
        variant,
        size,
        disabled,
        loading,
        type = 'button',
        onClick,
    } = props;

    const isDisabled = () => {
        const d = typeof disabled === 'function' ? disabled() : disabled;
        const l = typeof loading === 'function' ? loading() : loading;
        return d || l;
    };

    return (
        <button
            type={type}
            class={cn(buttonVariants({ variant, size }), className)}
            disabled={isDisabled()}
            onClick={onClick}
        >
            {typeof loading === 'function' ? (
                loading() ? <Spinner class="mr-2 h-4 w-4" /> : null
            ) : loading ? (
                <Spinner class="mr-2 h-4 w-4" />
            ) : null}
            {children}
        </button>
    );
}

function Spinner(props: { class?: string }) {
    return (
        <svg
            class={cn('animate-spin', props.class)}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
            />
            <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}

export { buttonVariants };
