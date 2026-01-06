/**
 * PhilJS UI - Variant System
 *
 * A type-safe utility for creating component variants.
 * Similar to CVA (class-variance-authority) but simpler and framework-agnostic.
 */

import { cn, type ClassValue } from './cn.js';

/**
 * Configuration for a variant system
 */
export interface VariantConfig<TVariants extends Record<string, Record<string, ClassValue>>> {
  /** Base classes applied to all variants */
  base?: ClassValue;
  /** Variant definitions */
  variants: TVariants;
  /** Compound variants for specific combinations */
  compoundVariants?: Array<{
    [K in keyof TVariants]?: keyof TVariants[K];
  } & { class: ClassValue }>;
  /** Default variant values */
  defaultVariants?: {
    [K in keyof TVariants]?: keyof TVariants[K];
  };
}

/**
 * Props type for a variant config
 */
export type VariantProps<TConfig extends VariantConfig<Record<string, Record<string, ClassValue>>>> = {
  [K in keyof TConfig['variants']]?: keyof TConfig['variants'][K];
} & {
  class?: ClassValue;
  className?: ClassValue;
};

/**
 * Creates a variant function that generates class names based on variant props.
 *
 * @example
 * ```tsx
 * const buttonVariants = variants({
 *   base: 'rounded font-medium transition-colors',
 *   variants: {
 *     variant: {
 *       primary: 'bg-blue-600 text-white hover:bg-blue-700',
 *       secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
 *       outline: 'border-2 border-current bg-transparent',
 *     },
 *     size: {
 *       sm: 'px-3 py-1.5 text-sm',
 *       md: 'px-4 py-2 text-base',
 *       lg: 'px-6 py-3 text-lg',
 *     },
 *   },
 *   defaultVariants: {
 *     variant: 'primary',
 *     size: 'md',
 *   },
 * });
 *
 * buttonVariants({ variant: 'secondary', size: 'lg' });
 * // => 'rounded font-medium transition-colors bg-gray-200 text-gray-900 hover:bg-gray-300 px-6 py-3 text-lg'
 * ```
 */
export function variants<TVariants extends Record<string, Record<string, ClassValue>>>(
  config: VariantConfig<TVariants>
): (props?: VariantProps<VariantConfig<TVariants>>) => string {
  return (props = {}) => {
    const { class: classFromProp, className, ...variantProps } = props as Record<string, unknown>;

    const classes: ClassValue[] = [config.base];

    // Apply variant classes
    for (const [variantKey, variantOptions] of Object.entries(config.variants)) {
      const selectedVariant = variantProps[variantKey] ?? config.defaultVariants?.[variantKey];
      if (selectedVariant && variantOptions[selectedVariant as string]) {
        classes.push(variantOptions[selectedVariant as string]);
      }
    }

    // Apply compound variants
    if (config.compoundVariants) {
      for (const compound of config.compoundVariants) {
        const { class: compoundClass, ...compoundConditions } = compound;

        const matches = Object.entries(compoundConditions).every(([key, value]) => {
          const selectedValue = variantProps[key] ?? config.defaultVariants?.[key];
          return selectedValue === value;
        });

        if (matches) {
          classes.push(compoundClass);
        }
      }
    }

    // Apply custom classes
    classes.push(classFromProp, className);

    return cn(...classes);
  };
}

/**
 * Slot-based variant system for complex components with multiple elements.
 *
 * @example
 * ```tsx
 * const cardVariants = slotVariants({
 *   slots: {
 *     root: 'rounded-lg shadow',
 *     header: 'p-4 border-b',
 *     body: 'p-4',
 *     footer: 'p-4 border-t',
 *   },
 *   variants: {
 *     size: {
 *       sm: { root: 'max-w-sm', body: 'text-sm' },
 *       md: { root: 'max-w-md', body: 'text-base' },
 *       lg: { root: 'max-w-lg', body: 'text-lg' },
 *     },
 *   },
 * });
 *
 * const { root, header, body, footer } = cardVariants({ size: 'md' });
 * ```
 */
export interface SlotVariantConfig<
  TSlots extends Record<string, ClassValue>,
  TVariants extends Record<string, Record<string, Partial<Record<keyof TSlots, ClassValue>>>>
> {
  slots: TSlots;
  variants?: TVariants;
  defaultVariants?: {
    [K in keyof TVariants]?: keyof TVariants[K];
  };
}

export type SlotVariantProps<TConfig extends SlotVariantConfig<Record<string, ClassValue>, Record<string, Record<string, Record<string, ClassValue>>>>> = {
  [K in keyof TConfig['variants']]?: keyof TConfig['variants'][K];
};

export function slotVariants<
  TSlots extends Record<string, ClassValue>,
  TVariants extends Record<string, Record<string, Partial<Record<keyof TSlots, ClassValue>>>>
>(
  config: SlotVariantConfig<TSlots, TVariants>
): (props?: SlotVariantProps<SlotVariantConfig<TSlots, TVariants>>) => Record<keyof TSlots, string> {
  return (props = {}) => {
    const result = {} as Record<keyof TSlots, string>;

    for (const slotKey of Object.keys(config.slots) as (keyof TSlots)[]) {
      const classes: ClassValue[] = [config.slots[slotKey]];

      // Apply variant classes for this slot
      if (config.variants) {
        for (const [variantKey, variantOptions] of Object.entries(config.variants)) {
          const selectedVariant = (props as Record<string, unknown>)[variantKey] ?? config.defaultVariants?.[variantKey];
          if (selectedVariant && variantOptions[selectedVariant as string]) {
            const slotClass = variantOptions[selectedVariant as string][slotKey];
            if (slotClass) {
              classes.push(slotClass);
            }
          }
        }
      }

      result[slotKey] = cn(...classes);
    }

    return result;
  };
}

export default variants;
