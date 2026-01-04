import { cn } from '../utils.js';
import { cva, type VariantProps } from 'class-variance-authority';

const labelVariants = cva(
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

export interface LabelProps extends VariantProps<typeof labelVariants> {
    children?: any;
    class?: string;
    htmlFor?: string;
    required?: boolean;
}

/**
 * Form label component
 */
export function Label(props: LabelProps) {
    const { children, class: className, htmlFor, required } = props;

    return (
        <label
            for={htmlFor}
            class={cn(labelVariants(), className)}
        >
            {children}
            {required && <span class="text-destructive ml-1">*</span>}
        </label>
    );
}

export { labelVariants };
