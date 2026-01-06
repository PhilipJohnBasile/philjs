/**
 * Stack Component
 * Vertical or horizontal stack layout with consistent spacing
 */

import { jsx } from '@philjs/core';
import { cn } from '../utils.js';
import type { BaseProps, WithChildren, Spacing, Alignment, JustifyContent } from '../types.js';

export interface StackProps extends BaseProps, WithChildren {
  /** Direction of the stack */
  direction?: 'vertical' | 'horizontal';
  /** Space between items */
  spacing?: Spacing;
  /** Align items along the cross axis */
  align?: Alignment;
  /** Justify content along the main axis */
  justify?: JustifyContent;
  /** Whether items should wrap */
  wrap?: boolean;
  /** Whether to add dividers between items */
  divider?: boolean;
  /** HTML tag to use */
  as?: 'div' | 'section' | 'article' | 'main' | 'aside' | 'nav' | 'ul' | 'ol';
}

const spacingClasses: Record<number, { vertical: string; horizontal: string }> = {
  0: { vertical: 'space-y-0', horizontal: 'space-x-0' },
  1: { vertical: 'space-y-1', horizontal: 'space-x-1' },
  2: { vertical: 'space-y-2', horizontal: 'space-x-2' },
  3: { vertical: 'space-y-3', horizontal: 'space-x-3' },
  4: { vertical: 'space-y-4', horizontal: 'space-x-4' },
  5: { vertical: 'space-y-5', horizontal: 'space-x-5' },
  6: { vertical: 'space-y-6', horizontal: 'space-x-6' },
  8: { vertical: 'space-y-8', horizontal: 'space-x-8' },
  10: { vertical: 'space-y-10', horizontal: 'space-x-10' },
  12: { vertical: 'space-y-12', horizontal: 'space-x-12' },
  16: { vertical: 'space-y-16', horizontal: 'space-x-16' },
  20: { vertical: 'space-y-20', horizontal: 'space-x-20' },
  24: { vertical: 'space-y-24', horizontal: 'space-x-24' },
};

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

export function Stack(props: StackProps): JSX.Element {
  const {
    direction = 'vertical',
    spacing = 4,
    align = 'stretch',
    justify = 'start',
    wrap = false,
    divider = false,
    as = 'div',
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  const isHorizontal = direction === 'horizontal';

  const classes = cn(
    'flex',
    // Direction
    isHorizontal ? 'flex-row' : 'flex-col',
    // Spacing (only if no divider)
    !divider && spacingClasses[spacing]?.[isHorizontal ? 'horizontal' : 'vertical'],
    // Alignment
    alignClasses[align],
    justifyClasses[justify],
    // Wrap
    wrap && 'flex-wrap',
    // Divider gap for divider mode
    divider && (isHorizontal ? 'gap-x-4' : 'gap-y-4'),
    // Custom
    className
  );

  // If divider is enabled, we need to wrap children
  if (divider && Array.isArray(children)) {
    const dividedChildren: JSX.Element[] = [];
    children.forEach((child, index) => {
      if (index > 0) {
        dividedChildren.push(
          jsx('div', {
            class: cn(
              isHorizontal
                ? 'w-px h-full bg-gray-200 dark:bg-gray-700'
                : 'h-px w-full bg-gray-200 dark:bg-gray-700'
            ),
            'aria-hidden': 'true',
            key: `divider-${index}`,
          })
        );
      }
      dividedChildren.push(child as JSX.Element);
    });

    return jsx(as, {
      class: classes,
      id,
      'data-testid': testId,
      role: as === 'ul' || as === 'ol' ? 'list' : undefined,
      ...rest,
      children: dividedChildren,
    });
  }

  return jsx(as, {
    class: classes,
    id,
    'data-testid': testId,
    role: as === 'ul' || as === 'ol' ? 'list' : undefined,
    ...rest,
    children,
  });
}

// Convenience components
export function VStack(props: Omit<StackProps, 'direction'>): JSX.Element {
  return Stack({ ...props, direction: 'vertical' });
}

export function HStack(props: Omit<StackProps, 'direction'>): JSX.Element {
  return Stack({ ...props, direction: 'horizontal' });
}
