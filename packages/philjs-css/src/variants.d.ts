import type { CSSStyleObject, VariantConfig, VariantProps, CSSResult } from './types.js';
/**
 * Create a component with variants (similar to Stitches/CVA)
 *
 * @example
 * ```ts
 * const button = variants({
 *   base: {
 *     padding: '10px 20px',
 *     borderRadius: '4px',
 *     border: 'none',
 *     cursor: 'pointer'
 *   },
 *   variants: {
 *     size: {
 *       sm: { padding: '6px 12px', fontSize: '14px' },
 *       md: { padding: '10px 20px', fontSize: '16px' },
 *       lg: { padding: '14px 28px', fontSize: '18px' }
 *     },
 *     color: {
 *       primary: { backgroundColor: '#3b82f6', color: 'white' },
 *       secondary: { backgroundColor: '#10b981', color: 'white' },
 *       danger: { backgroundColor: '#ef4444', color: 'white' }
 *     },
 *     outline: {
 *       true: { backgroundColor: 'transparent', border: '2px solid currentColor' }
 *     }
 *   },
 *   compoundVariants: [
 *     {
 *       size: 'sm',
 *       outline: true,
 *       css: { border: '1px solid currentColor' }
 *     }
 *   ],
 *   defaultVariants: {
 *     size: 'md',
 *     color: 'primary'
 *   }
 * });
 *
 * // Usage
 * const className = button({ size: 'lg', color: 'danger' });
 * ```
 */
export declare function variants<V extends Record<string, Record<string, CSSStyleObject>>>(config: VariantConfig<V>): (props?: VariantProps<V>) => string;
/**
 * Create responsive variants based on breakpoints
 *
 * @example
 * ```ts
 * const responsive = responsiveVariants({
 *   base: { width: '100%' },
 *   breakpoints: {
 *     md: { width: '50%' },
 *     lg: { width: '33.333%' }
 *   }
 * });
 * ```
 */
export declare function responsiveVariants(config: {
    base: CSSStyleObject;
    breakpoints: Record<string, CSSStyleObject>;
}): CSSResult;
/**
 * Create a variant recipe with TypeScript inference
 *
 * @example
 * ```ts
 * const cardRecipe = recipe({
 *   base: {
 *     borderRadius: '8px',
 *     padding: '16px'
 *   },
 *   variants: {
 *     elevated: {
 *       true: { boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }
 *     },
 *     bordered: {
 *       true: { border: '1px solid #e5e7eb' }
 *     }
 *   }
 * });
 * ```
 */
export declare function recipe<V extends Record<string, Record<string, CSSStyleObject>>>(config: VariantConfig<V>): ((props?: VariantProps<V> | undefined) => string) & {
    classNames: {
        base: string;
    };
};
/**
 * Boolean variant helper for cleaner API
 *
 * @example
 * ```ts
 * const styles = variants({
 *   variants: {
 *     loading: booleanVariant({
 *       opacity: 0.5,
 *       pointerEvents: 'none'
 *     }),
 *     disabled: booleanVariant({
 *       cursor: 'not-allowed',
 *       opacity: 0.6
 *     })
 *   }
 * });
 * ```
 */
export declare function booleanVariant(styles: CSSStyleObject): {
    true: CSSStyleObject;
};
/**
 * Create data attribute variants
 *
 * @example
 * ```ts
 * const button = dataVariants({
 *   base: { padding: '10px' },
 *   data: {
 *     disabled: { opacity: 0.5, cursor: 'not-allowed' },
 *     loading: { opacity: 0.7 }
 *   }
 * });
 *
 * // Usage: <button class={button} data-disabled data-loading>
 * ```
 */
export declare function dataVariants(config: {
    base?: CSSStyleObject;
    data: Record<string, CSSStyleObject>;
}): CSSResult;
/**
 * Create state variants (hover, focus, active, etc.)
 *
 * @example
 * ```ts
 * const interactive = stateVariants({
 *   base: { color: '#000' },
 *   states: {
 *     hover: { color: '#3b82f6' },
 *     focus: { outline: '2px solid #3b82f6' },
 *     active: { transform: 'scale(0.98)' }
 *   }
 * });
 * ```
 */
export declare function stateVariants(config: {
    base?: CSSStyleObject;
    states: {
        hover?: CSSStyleObject;
        focus?: CSSStyleObject;
        active?: CSSStyleObject;
        disabled?: CSSStyleObject;
        visited?: CSSStyleObject;
    };
}): CSSResult;
/**
 * Slot-based variants for complex components
 *
 * @example
 * ```ts
 * const card = slotVariants({
 *   slots: {
 *     root: { borderRadius: '8px', overflow: 'hidden' },
 *     header: { padding: '16px', borderBottom: '1px solid #e5e7eb' },
 *     body: { padding: '16px' },
 *     footer: { padding: '16px', backgroundColor: '#f9fafb' }
 *   },
 *   variants: {
 *     size: {
 *       sm: {
 *         root: { maxWidth: '400px' },
 *         header: { padding: '12px' },
 *         body: { padding: '12px' },
 *         footer: { padding: '12px' }
 *       },
 *       lg: {
 *         root: { maxWidth: '800px' },
 *         header: { padding: '24px' },
 *         body: { padding: '24px' },
 *         footer: { padding: '24px' }
 *       }
 *     }
 *   }
 * });
 *
 * const classes = card({ size: 'lg' });
 * // <div class={classes.root}>
 * //   <div class={classes.header}>Header</div>
 * //   <div class={classes.body}>Body</div>
 * //   <div class={classes.footer}>Footer</div>
 * // </div>
 * ```
 */
export declare function slotVariants<S extends Record<string, CSSStyleObject>, V extends Record<string, Record<string, Partial<S>>>>(config: {
    slots: S;
    variants?: V;
    defaultVariants?: {
        [K in keyof V]?: keyof V[K];
    };
}): (props?: {
    [K in keyof V]?: keyof V[K];
}) => {
    [K in keyof S]: string;
};
//# sourceMappingURL=variants.d.ts.map