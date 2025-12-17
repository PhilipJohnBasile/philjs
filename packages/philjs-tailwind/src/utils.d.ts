/**
 * PhilJS Tailwind Utilities
 *
 * Helper functions for working with Tailwind CSS.
 */
export type ClassValue = string | number | boolean | null | undefined | ClassValue[] | {
    [key: string]: boolean | null | undefined;
};
/**
 * Conditionally join class names (clsx compatible)
 */
export declare function clsx(...inputs: ClassValue[]): string;
/**
 * Merge Tailwind classes intelligently
 */
export declare function twMerge(...inputs: ClassValue[]): string;
/**
 * Alias for clsx (class name helper)
 */
export declare const cn: typeof twMerge;
/**
 * Join Tailwind classes (simple join without merging)
 */
export declare function twJoin(...inputs: ClassValue[]): string;
/**
 * Tagged template for Tailwind classes
 */
export declare function tw(strings: TemplateStringsArray, ...values: unknown[]): string;
/**
 * Class Variance Authority (CVA) implementation
 */
export interface VariantProps<T extends (...args: any) => any> {
    [key: string]: string | boolean | undefined;
}
export declare function cva<V extends Record<string, Record<string, string>>, D extends {
    [K in keyof V]?: keyof V[K];
}>(config: {
    base?: string;
    variants?: V;
    compoundVariants?: Array<Partial<{
        [K in keyof V]: keyof V[K] | (keyof V[K])[];
    }> & {
        class: string;
    }>;
    defaultVariants?: D;
}): (props?: Partial<{ [K in keyof V]: keyof V[K]; }> & {
    class?: string;
    className?: string;
}) => string;
/**
 * Focus ring utility
 */
export declare const focusRing = "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
/**
 * Common class patterns
 */
export declare const patterns: {
    button: {
        base: string;
        primary: string;
        secondary: string;
        outline: string;
        ghost: string;
        link: string;
    };
    input: {
        base: string;
    };
    card: {
        base: string;
    };
};
//# sourceMappingURL=utils.d.ts.map