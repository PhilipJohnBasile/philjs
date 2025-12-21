import type { CSSStyleObject, VariantConfig, VariantProps, CSSResult } from './types';
import { css, compose } from './css';

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
export function variants<V extends Record<string, Record<string, CSSStyleObject>>>(
  config: VariantConfig<V>
): (props?: VariantProps<V>) => string {
  // Pre-compile base styles
  const baseStyle = config.base ? css(config.base) : null;

  // Pre-compile all variant styles
  const compiledVariants: Record<string, Record<string, CSSResult>> = {};

  if (config.variants) {
    for (const [variantName, variantOptions] of Object.entries(config.variants)) {
      compiledVariants[variantName] = {};
      for (const [optionName, optionStyles] of Object.entries(variantOptions)) {
        compiledVariants[variantName][optionName] = css(optionStyles);
      }
    }
  }

  // Pre-compile compound variants
  const compiledCompounds = config.compoundVariants?.map(compound => ({
    conditions: { ...compound },
    style: css(compound.css)
  }));

  return (props: VariantProps<V> = {}) => {
    const classes: string[] = [];

    // Add base style
    if (baseStyle) {
      classes.push(baseStyle.className);
    }

    // Merge with default variants
    const finalProps = {
      ...config.defaultVariants,
      ...props
    };

    // Add variant styles
    if (config.variants) {
      for (const [variantName, selectedOption] of Object.entries(finalProps)) {
        if (selectedOption !== undefined && compiledVariants[variantName]) {
          const variantStyle = compiledVariants[variantName][selectedOption as string];
          if (variantStyle) {
            classes.push(variantStyle.className);
          }
        }
      }
    }

    // Add compound variant styles
    if (compiledCompounds) {
      for (const compound of compiledCompounds) {
        let matches = true;

        for (const [key, value] of Object.entries(compound.conditions)) {
          if (key === 'css') continue;
          if (finalProps[key as keyof typeof finalProps] !== value) {
            matches = false;
            break;
          }
        }

        if (matches) {
          classes.push(compound.style.className);
        }
      }
    }

    return classes.join(' ');
  };
}

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
export function responsiveVariants(config: {
  base: CSSStyleObject;
  breakpoints: Record<string, CSSStyleObject>;
}): CSSResult {
  const styles: CSSStyleObject = { ...config.base };

  // Add media queries for each breakpoint
  for (const [breakpoint, breakpointStyles] of Object.entries(config.breakpoints)) {
    const mediaQuery = `@media (min-width: ${breakpoint})`;
    styles[mediaQuery as keyof CSSStyleObject] = breakpointStyles as any;
  }

  return css(styles);
}

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
export function recipe<V extends Record<string, Record<string, CSSStyleObject>>>(
  config: VariantConfig<V>
) {
  const variantFn = variants(config);

  return Object.assign(variantFn, {
    classNames: {
      base: config.base ? css(config.base).className : ''
    }
  });
}

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
export function booleanVariant(styles: CSSStyleObject): { true: CSSStyleObject } {
  return { true: styles };
}

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
export function dataVariants(config: {
  base?: CSSStyleObject;
  data: Record<string, CSSStyleObject>;
}): CSSResult {
  const styles: CSSStyleObject = { ...(config.base || {}) };

  // Add data attribute selectors
  for (const [attr, attrStyles] of Object.entries(config.data)) {
    styles[`&[data-${attr}]` as keyof CSSStyleObject] = attrStyles as any;
  }

  return css(styles);
}

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
export function stateVariants(config: {
  base?: CSSStyleObject;
  states: {
    hover?: CSSStyleObject;
    focus?: CSSStyleObject;
    active?: CSSStyleObject;
    disabled?: CSSStyleObject;
    visited?: CSSStyleObject;
  };
}): CSSResult {
  const styles: CSSStyleObject = { ...(config.base || {}) };

  for (const [state, stateStyles] of Object.entries(config.states)) {
    const selector = `&:${state}` as keyof CSSStyleObject;
    styles[selector] = stateStyles as any;
  }

  return css(styles);
}

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
export function slotVariants<
  S extends Record<string, CSSStyleObject>,
  V extends Record<string, Record<string, Partial<S>>>
>(config: {
  slots: S;
  variants?: V;
  defaultVariants?: { [K in keyof V]?: keyof V[K] };
}): (props?: { [K in keyof V]?: keyof V[K] }) => { [K in keyof S]: string } {
  // Pre-compile slot styles
  const compiledSlots: Record<string, CSSResult> = {};
  for (const [slotName, slotStyles] of Object.entries(config.slots)) {
    compiledSlots[slotName] = css(slotStyles);
  }

  // Pre-compile variant styles
  const compiledVariants: Record<string, Record<string, Record<string, CSSResult>>> = {};
  if (config.variants) {
    for (const [variantName, variantOptions] of Object.entries(config.variants)) {
      compiledVariants[variantName] = {};
      for (const [optionName, slotOverrides] of Object.entries(variantOptions)) {
        compiledVariants[variantName][optionName] = {};
        for (const [slotName, slotStyles] of Object.entries(slotOverrides)) {
          if (slotStyles) {
            compiledVariants[variantName][optionName][slotName] = css(slotStyles as CSSStyleObject);
          }
        }
      }
    }
  }

  return (props = {}) => {
    const finalProps = {
      ...config.defaultVariants,
      ...props
    };

    const result: Record<string, string> = {};

    // Build class names for each slot
    for (const slotName of Object.keys(config.slots)) {
      const classes: string[] = [compiledSlots[slotName].className];

      // Add variant classes
      for (const [variantName, selectedOption] of Object.entries(finalProps)) {
        if (
          selectedOption !== undefined &&
          compiledVariants[variantName]?.[selectedOption as string]?.[slotName]
        ) {
          classes.push(
            compiledVariants[variantName][selectedOption as string][slotName].className
          );
        }
      }

      result[slotName] = classes.join(' ');
    }

    return result as { [K in keyof S]: string };
  };
}
