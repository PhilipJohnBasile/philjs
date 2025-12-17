/**
 * PhilJS Scoped Styles
 *
 * Svelte-style scoped CSS with automatic class name generation.
 */
import type { CSSProperties } from './types';
/**
 * Create scoped CSS from a template literal
 */
export declare function css(strings: TemplateStringsArray, ...values: unknown[]): string;
/**
 * Create a styled component
 */
export declare function styled<P extends object = {}>(tag: string | ((props: P) => any), styles: CSSProperties | ((props: P) => CSSProperties)): (props: P & {
    className?: string;
    children?: any;
}) => any;
/**
 * Create keyframe animations
 */
export declare function keyframes(strings: TemplateStringsArray, ...values: unknown[]): string;
/**
 * Create global styles
 */
export declare function createGlobalStyle(strings: TemplateStringsArray, ...values: unknown[]): () => null;
/**
 * Create variant-based styles (like Stitches/CVA)
 */
export declare function cva<V extends Record<string, Record<string, CSSProperties>>>(config: {
    base?: CSSProperties;
    variants?: V;
    compoundVariants?: Array<Partial<{
        [K in keyof V]: keyof V[K];
    }> & {
        css: CSSProperties;
    }>;
    defaultVariants?: Partial<{
        [K in keyof V]: keyof V[K];
    }>;
}): (props?: Partial<{ [K in keyof V]: keyof V[K]; }>) => string;
//# sourceMappingURL=scoped.d.ts.map