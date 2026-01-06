/**
 * PhilJS UI - Stack Component
 *
 * Vertical or horizontal stack layout with consistent spacing.
 * A simplified abstraction over Flex for common stacking patterns.
 */

import type { JSX } from '@philjs/core/jsx-runtime';
import { cn } from '../../utils/cn.js';
import { variants, type VariantProps } from '../../utils/variants.js';

const stackVariants = variants({
  base: 'flex',
  variants: {
    direction: {
      vertical: 'flex-col',
      horizontal: 'flex-row',
    },
    spacing: {
      0: 'gap-0',
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      5: 'gap-5',
      6: 'gap-6',
      8: 'gap-8',
      10: 'gap-10',
      12: 'gap-12',
      16: 'gap-16',
      20: 'gap-20',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    },
    wrap: {
      true: 'flex-wrap',
      false: 'flex-nowrap',
    },
    dividers: {
      true: '',
      false: '',
    },
  },
  defaultVariants: {
    direction: 'vertical',
    spacing: 4,
    align: 'stretch',
    justify: 'start',
    wrap: false,
    dividers: false,
  },
});

export type StackDirection = 'vertical' | 'horizontal';
export type StackSpacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20;

export interface StackProps extends VariantProps<typeof stackVariants> {
  children?: JSX.Element | JSX.Element[] | string;
  /** Custom CSS class */
  className?: string;
  /** Inline styles */
  style?: Record<string, string>;
  /** HTML element to render as */
  as?: 'div' | 'section' | 'article' | 'main' | 'header' | 'footer' | 'nav' | 'aside' | 'ul' | 'ol';
  /** ARIA role */
  role?: string;
  /** ARIA label */
  'aria-label'?: string;
  /** Test ID */
  'data-testid'?: string;
}

/**
 * Stack component for consistent vertical or horizontal layouts.
 *
 * @example
 * ```tsx
 * // Vertical stack (default)
 * <Stack spacing={4}>
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Stack>
 *
 * // Horizontal stack
 * <Stack direction="horizontal" spacing={2} align="center">
 *   <Avatar />
 *   <Text>John Doe</Text>
 *   <Badge>Admin</Badge>
 * </Stack>
 * ```
 */
export function Stack(props: StackProps): JSX.Element {
  const {
    children,
    direction,
    spacing,
    align,
    justify,
    wrap,
    dividers,
    className,
    style,
    as: Component = 'div',
    role,
    'aria-label': ariaLabel,
    'data-testid': testId,
  } = props;

  const classes = stackVariants({
    direction,
    spacing,
    align,
    justify,
    wrap,
    dividers,
    className,
  });

  return (
    <Component
      className={classes}
      style={style}
      role={role}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {children}
    </Component>
  );
}

/**
 * HStack - Horizontal Stack shorthand
 */
export function HStack(props: Omit<StackProps, 'direction'>): JSX.Element {
  return <Stack {...props} direction="horizontal" />;
}

/**
 * VStack - Vertical Stack shorthand
 */
export function VStack(props: Omit<StackProps, 'direction'>): JSX.Element {
  return <Stack {...props} direction="vertical" />;
}

// Attach shortcuts
Stack.Horizontal = HStack;
Stack.Vertical = VStack;

export default Stack;
