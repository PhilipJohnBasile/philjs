/**
 * Badge component - shadcn/ui style for PhilJS
 */

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils.js';

// Badge variants using CVA
export const badgeVariants = cva(
    'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default:
                    'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
                secondary:
                    'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
                destructive:
                    'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
                outline: 'text-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
    className?: string;
    children?: any;
}

/**
 * Badge component for status indicators and labels
 */
export function Badge(props: BadgeProps) {
    const { variant, className, children } = props;

    return (
        <span class={cn(badgeVariants({ variant }), className)}>
            {children}
        </span>
    );
}
