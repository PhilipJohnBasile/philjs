/**
 * Flex Component
 * Flexible box layout with full control over flexbox properties
 */

import { jsx } from '@philjs/core';
import { cn } from '../utils.js';
import type { BaseProps, WithChildren, Spacing, Alignment, JustifyContent } from '../types.js';

export interface FlexProps extends BaseProps, WithChildren {
  /** Flex direction */
  direction?: 'row' | 'row-reverse' | 'col' | 'col-reverse';
  /** Align items */
  align?: Alignment;
  /** Justify content */
  justify?: JustifyContent;
  /** Flex wrap */
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  /** Gap between items */
  gap?: Spacing;
  /** Gap on x-axis */
  gapX?: Spacing;
  /** Gap on y-axis */
  gapY?: Spacing;
  /** Whether flex container should grow */
  grow?: boolean;
  /** Whether flex container should shrink */
  shrink?: boolean;
  /** Initial flex basis */
  basis?: 'auto' | 'full' | '1/2' | '1/3' | '2/3' | '1/4' | '3/4';
  /** Display inline-flex instead of flex */
  inline?: boolean;
  /** HTML tag to use */
  as?: 'div' | 'span' | 'section' | 'article' | 'main' | 'aside' | 'nav' | 'header' | 'footer';
}

const directionClasses = {
  row: 'flex-row',
  'row-reverse': 'flex-row-reverse',
  col: 'flex-col',
  'col-reverse': 'flex-col-reverse',
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

const wrapClasses = {
  nowrap: 'flex-nowrap',
  wrap: 'flex-wrap',
  'wrap-reverse': 'flex-wrap-reverse',
};

const gapClasses: Record<number, string> = {
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
  24: 'gap-24',
};

const gapXClasses: Record<number, string> = {
  0: 'gap-x-0',
  1: 'gap-x-1',
  2: 'gap-x-2',
  3: 'gap-x-3',
  4: 'gap-x-4',
  5: 'gap-x-5',
  6: 'gap-x-6',
  8: 'gap-x-8',
  10: 'gap-x-10',
  12: 'gap-x-12',
  16: 'gap-x-16',
  20: 'gap-x-20',
  24: 'gap-x-24',
};

const gapYClasses: Record<number, string> = {
  0: 'gap-y-0',
  1: 'gap-y-1',
  2: 'gap-y-2',
  3: 'gap-y-3',
  4: 'gap-y-4',
  5: 'gap-y-5',
  6: 'gap-y-6',
  8: 'gap-y-8',
  10: 'gap-y-10',
  12: 'gap-y-12',
  16: 'gap-y-16',
  20: 'gap-y-20',
  24: 'gap-y-24',
};

const basisClasses = {
  auto: 'basis-auto',
  full: 'basis-full',
  '1/2': 'basis-1/2',
  '1/3': 'basis-1/3',
  '2/3': 'basis-2/3',
  '1/4': 'basis-1/4',
  '3/4': 'basis-3/4',
};

export function Flex(props: FlexProps): JSX.Element {
  const {
    direction = 'row',
    align = 'stretch',
    justify = 'start',
    wrap = 'nowrap',
    gap,
    gapX,
    gapY,
    grow,
    shrink,
    basis,
    inline = false,
    as = 'div',
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  const classes = cn(
    // Display
    inline ? 'inline-flex' : 'flex',
    // Direction
    directionClasses[direction],
    // Alignment
    alignClasses[align],
    justifyClasses[justify],
    // Wrap
    wrapClasses[wrap],
    // Gap
    gap !== undefined && gapClasses[gap],
    gapX !== undefined && gapXClasses[gapX],
    gapY !== undefined && gapYClasses[gapY],
    // Grow/Shrink
    grow === true && 'flex-grow',
    grow === false && 'flex-grow-0',
    shrink === true && 'flex-shrink',
    shrink === false && 'flex-shrink-0',
    // Basis
    basis && basisClasses[basis],
    // Custom
    className
  );

  return jsx(as, {
    class: classes,
    id,
    'data-testid': testId,
    ...rest,
    children,
  });
}

// Flex Item Component
export interface FlexItemProps extends BaseProps, WithChildren {
  /** Flex grow */
  grow?: boolean | number;
  /** Flex shrink */
  shrink?: boolean | number;
  /** Flex basis */
  basis?: 'auto' | 'full' | '1/2' | '1/3' | '2/3' | '1/4' | '3/4' | number;
  /** Align self */
  alignSelf?: 'auto' | 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /** Order */
  order?: 'first' | 'last' | 'none' | number;
  /** HTML tag to use */
  as?: 'div' | 'span' | 'li';
}

const alignSelfClasses = {
  auto: 'self-auto',
  start: 'self-start',
  center: 'self-center',
  end: 'self-end',
  stretch: 'self-stretch',
  baseline: 'self-baseline',
};

const orderClasses = {
  first: 'order-first',
  last: 'order-last',
  none: 'order-none',
};

export function FlexItem(props: FlexItemProps): JSX.Element {
  const {
    grow,
    shrink,
    basis,
    alignSelf,
    order,
    as = 'div',
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  const classes = cn(
    // Grow
    grow === true && 'flex-grow',
    grow === false && 'flex-grow-0',
    typeof grow === 'number' && `flex-grow-[${grow}]`,
    // Shrink
    shrink === true && 'flex-shrink',
    shrink === false && 'flex-shrink-0',
    typeof shrink === 'number' && `flex-shrink-[${shrink}]`,
    // Basis
    basis && (typeof basis === 'string' ? basisClasses[basis as keyof typeof basisClasses] : `basis-[${basis}px]`),
    // Align self
    alignSelf && alignSelfClasses[alignSelf],
    // Order
    order && (typeof order === 'string' ? orderClasses[order] : `order-${order}`),
    // Custom
    className
  );

  return jsx(as, {
    class: classes,
    id,
    'data-testid': testId,
    ...rest,
    children,
  });
}

// Center convenience component
export function Center(props: Omit<FlexProps, 'align' | 'justify'>): JSX.Element {
  return Flex({ ...props, align: 'center', justify: 'center' });
}
