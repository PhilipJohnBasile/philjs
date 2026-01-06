/**
 * PhilJS UI - Flex Component
 *
 * Flexbox layout component with comprehensive alignment options.
 */

import type { JSX } from '@philjs/core/jsx-runtime';
import { cn } from '../../utils/cn.js';
import { variants, type VariantProps } from '../../utils/variants.js';

const flexVariants = variants({
  base: 'flex',
  variants: {
    direction: {
      row: 'flex-row',
      rowReverse: 'flex-row-reverse',
      col: 'flex-col',
      colReverse: 'flex-col-reverse',
    },
    wrap: {
      wrap: 'flex-wrap',
      nowrap: 'flex-nowrap',
      wrapReverse: 'flex-wrap-reverse',
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
    gap: {
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
    },
    inline: {
      true: 'inline-flex',
      false: 'flex',
    },
  },
  defaultVariants: {
    direction: 'row',
    wrap: 'nowrap',
    align: 'stretch',
    justify: 'start',
    inline: false,
  },
});

export type FlexDirection = 'row' | 'rowReverse' | 'col' | 'colReverse';
export type FlexWrap = 'wrap' | 'nowrap' | 'wrapReverse';
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type FlexGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;

export interface FlexProps extends VariantProps<typeof flexVariants> {
  children?: JSX.Element | JSX.Element[] | string;
  /** Custom CSS class */
  className?: string;
  /** Inline styles */
  style?: Record<string, string>;
  /** HTML element to render as */
  as?: 'div' | 'section' | 'article' | 'main' | 'header' | 'footer' | 'nav' | 'aside' | 'ul' | 'ol' | 'span';
  /** ARIA role */
  role?: string;
  /** ARIA label */
  'aria-label'?: string;
  /** Test ID */
  'data-testid'?: string;
}

/**
 * Flex component for flexbox layouts.
 *
 * @example
 * ```tsx
 * <Flex align="center" justify="between" gap={4}>
 *   <Logo />
 *   <Nav />
 *   <UserMenu />
 * </Flex>
 *
 * <Flex direction="col" gap={2}>
 *   {items.map(item => <ListItem key={item.id}>{item.name}</ListItem>)}
 * </Flex>
 * ```
 */
export function Flex(props: FlexProps): JSX.Element {
  const {
    children,
    direction,
    wrap,
    align,
    justify,
    gap,
    inline,
    className,
    style,
    as: Component = 'div',
    role,
    'aria-label': ariaLabel,
    'data-testid': testId,
  } = props;

  const classes = flexVariants({
    direction,
    wrap,
    align,
    justify,
    gap,
    inline,
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
 * Flex.Item for controlling individual flex item behavior.
 */
export interface FlexItemProps {
  children?: JSX.Element | JSX.Element[] | string;
  className?: string;
  style?: Record<string, string>;
  /** Flex grow value */
  grow?: 0 | 1;
  /** Flex shrink value */
  shrink?: 0 | 1;
  /** Flex basis */
  basis?: 'auto' | '0' | 'full' | '1/2' | '1/3' | '2/3' | '1/4' | '3/4';
  /** Self alignment override */
  alignSelf?: 'auto' | 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /** Order in flex container */
  order?: 'first' | 'last' | 'none' | number;
}

const growMap: Record<number, string> = {
  0: 'flex-grow-0',
  1: 'flex-grow',
};

const shrinkMap: Record<number, string> = {
  0: 'flex-shrink-0',
  1: 'flex-shrink',
};

const basisMap: Record<string, string> = {
  auto: 'basis-auto',
  '0': 'basis-0',
  full: 'basis-full',
  '1/2': 'basis-1/2',
  '1/3': 'basis-1/3',
  '2/3': 'basis-2/3',
  '1/4': 'basis-1/4',
  '3/4': 'basis-3/4',
};

const alignSelfMap: Record<string, string> = {
  auto: 'self-auto',
  start: 'self-start',
  center: 'self-center',
  end: 'self-end',
  stretch: 'self-stretch',
  baseline: 'self-baseline',
};

export function FlexItem(props: FlexItemProps): JSX.Element {
  const {
    children,
    className,
    style,
    grow,
    shrink,
    basis,
    alignSelf,
    order,
  } = props;

  let orderClass = '';
  if (order === 'first') orderClass = 'order-first';
  else if (order === 'last') orderClass = 'order-last';
  else if (order === 'none') orderClass = 'order-none';
  else if (typeof order === 'number') orderClass = `order-${order}`;

  const classes = cn(
    grow !== undefined && growMap[grow],
    shrink !== undefined && shrinkMap[shrink],
    basis && basisMap[basis],
    alignSelf && alignSelfMap[alignSelf],
    orderClass,
    className
  );

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}

// Attach FlexItem to Flex
Flex.Item = FlexItem;

export default Flex;
