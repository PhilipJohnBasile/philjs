/**
 * PhilJS UI - Divider Component
 *
 * A visual separator for content sections.
 */

import type { JSX } from '@philjs/core/jsx-runtime';
import { cn } from '../../utils/cn.js';
import { variants, type VariantProps } from '../../utils/variants.js';

const dividerVariants = variants({
  base: 'shrink-0',
  variants: {
    orientation: {
      horizontal: 'w-full h-px',
      vertical: 'h-full w-px',
    },
    variant: {
      solid: 'bg-gray-200 dark:bg-gray-700',
      dashed: 'border-dashed',
      dotted: 'border-dotted',
    },
    spacing: {
      0: '',
      1: '',
      2: '',
      4: '',
      6: '',
      8: '',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'solid',
    spacing: 4,
  },
  compoundVariants: [
    { orientation: 'horizontal', spacing: 1, class: 'my-1' },
    { orientation: 'horizontal', spacing: 2, class: 'my-2' },
    { orientation: 'horizontal', spacing: 4, class: 'my-4' },
    { orientation: 'horizontal', spacing: 6, class: 'my-6' },
    { orientation: 'horizontal', spacing: 8, class: 'my-8' },
    { orientation: 'vertical', spacing: 1, class: 'mx-1' },
    { orientation: 'vertical', spacing: 2, class: 'mx-2' },
    { orientation: 'vertical', spacing: 4, class: 'mx-4' },
    { orientation: 'vertical', spacing: 6, class: 'mx-6' },
    { orientation: 'vertical', spacing: 8, class: 'mx-8' },
  ],
});

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerVariant = 'solid' | 'dashed' | 'dotted';
export type DividerSpacing = 0 | 1 | 2 | 4 | 6 | 8;

export interface DividerProps extends VariantProps<typeof dividerVariants> {
  /** Custom CSS class */
  className?: string;
  /** Inline styles */
  style?: Record<string, string>;
  /** Text label to display in the divider */
  label?: string;
  /** Label position (for horizontal dividers with labels) */
  labelPosition?: 'start' | 'center' | 'end';
  /** Color override */
  color?: string;
  /** Test ID */
  'data-testid'?: string;
}

/**
 * Divider component for separating content.
 *
 * @example
 * ```tsx
 * // Simple horizontal divider
 * <Divider />
 *
 * // Vertical divider
 * <Flex>
 *   <Text>Left</Text>
 *   <Divider orientation="vertical" />
 *   <Text>Right</Text>
 * </Flex>
 *
 * // Divider with label
 * <Divider label="Or continue with" />
 * ```
 */
export function Divider(props: DividerProps): JSX.Element {
  const {
    orientation,
    variant,
    spacing,
    className,
    style,
    label,
    labelPosition = 'center',
    color,
    'data-testid': testId,
  } = props;

  // If there's a label, render a different structure
  if (label && orientation !== 'vertical') {
    const labelClasses = cn(
      'flex items-center',
      spacing === 1 && 'my-1',
      spacing === 2 && 'my-2',
      spacing === 4 && 'my-4',
      spacing === 6 && 'my-6',
      spacing === 8 && 'my-8',
      className
    );

    const lineClasses = cn(
      'flex-1 h-px',
      variant === 'solid' && (color ? `bg-${color}` : 'bg-gray-200 dark:bg-gray-700'),
      variant === 'dashed' && 'border-t border-dashed border-gray-200 dark:border-gray-700',
      variant === 'dotted' && 'border-t border-dotted border-gray-200 dark:border-gray-700'
    );

    return (
      <div
        className={labelClasses}
        style={style}
        role="separator"
        aria-orientation="horizontal"
        data-testid={testId}
      >
        {(labelPosition === 'center' || labelPosition === 'end') && (
          <div className={lineClasses} />
        )}
        <span className="px-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {label}
        </span>
        {(labelPosition === 'center' || labelPosition === 'start') && (
          <div className={lineClasses} />
        )}
      </div>
    );
  }

  const classes = cn(
    dividerVariants({ orientation, variant, spacing }),
    color && `bg-${color}`,
    className
  );

  return (
    <div
      className={classes}
      style={style}
      role="separator"
      aria-orientation={orientation}
      data-testid={testId}
    />
  );
}

/**
 * Convenience components for horizontal and vertical dividers
 */
export function HDivider(props: Omit<DividerProps, 'orientation'>): JSX.Element {
  return <Divider {...props} orientation="horizontal" />;
}

export function VDivider(props: Omit<DividerProps, 'orientation'>): JSX.Element {
  return <Divider {...props} orientation="vertical" />;
}

// Attach shortcuts
Divider.Horizontal = HDivider;
Divider.Vertical = VDivider;

export default Divider;
