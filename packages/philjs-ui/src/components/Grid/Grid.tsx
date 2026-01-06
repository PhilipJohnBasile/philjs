/**
 * PhilJS UI - Grid Component
 *
 * CSS Grid layout component with responsive column support.
 */

import type { JSX } from '@philjs/core/jsx-runtime';
import { cn } from '../../utils/cn.js';
import { variants, type VariantProps } from '../../utils/variants.js';

const gridVariants = variants({
  base: 'grid',
  variants: {
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      7: 'grid-cols-7',
      8: 'grid-cols-8',
      9: 'grid-cols-9',
      10: 'grid-cols-10',
      11: 'grid-cols-11',
      12: 'grid-cols-12',
      none: 'grid-cols-none',
      auto: 'grid-cols-[repeat(auto-fit,minmax(0,1fr))]',
    },
    rows: {
      1: 'grid-rows-1',
      2: 'grid-rows-2',
      3: 'grid-rows-3',
      4: 'grid-rows-4',
      5: 'grid-rows-5',
      6: 'grid-rows-6',
      none: 'grid-rows-none',
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
    flow: {
      row: 'grid-flow-row',
      col: 'grid-flow-col',
      dense: 'grid-flow-dense',
      rowDense: 'grid-flow-row-dense',
      colDense: 'grid-flow-col-dense',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    justify: {
      start: 'justify-items-start',
      center: 'justify-items-center',
      end: 'justify-items-end',
      stretch: 'justify-items-stretch',
    },
  },
  defaultVariants: {
    cols: 12,
    gap: 4,
  },
});

export type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'none' | 'auto';
export type GridRows = 1 | 2 | 3 | 4 | 5 | 6 | 'none';
export type GridGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;

export interface GridProps extends VariantProps<typeof gridVariants> {
  children?: JSX.Element | JSX.Element[] | string;
  /** Custom CSS class */
  className?: string;
  /** Inline styles */
  style?: Record<string, string>;
  /** HTML element to render as */
  as?: 'div' | 'section' | 'article' | 'main' | 'ul' | 'ol';
  /** ARIA role */
  role?: string;
  /** ARIA label */
  'aria-label'?: string;
  /** Test ID */
  'data-testid'?: string;
  /** Responsive columns - applies at sm breakpoint and up */
  smCols?: GridCols;
  /** Responsive columns - applies at md breakpoint and up */
  mdCols?: GridCols;
  /** Responsive columns - applies at lg breakpoint and up */
  lgCols?: GridCols;
  /** Responsive columns - applies at xl breakpoint and up */
  xlCols?: GridCols;
}

const responsiveColsMap: Record<GridCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
  none: 'grid-cols-none',
  auto: 'grid-cols-[repeat(auto-fit,minmax(0,1fr))]',
};

/**
 * Grid component for CSS Grid layouts.
 *
 * @example
 * ```tsx
 * <Grid cols={3} gap={4}>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Grid>
 *
 * <Grid cols={1} mdCols={2} lgCols={4} gap={6}>
 *   {items.map(item => <Card key={item.id}>{item.name}</Card>)}
 * </Grid>
 * ```
 */
export function Grid(props: GridProps): JSX.Element {
  const {
    children,
    cols,
    rows,
    gap,
    flow,
    align,
    justify,
    className,
    style,
    as: Component = 'div',
    role,
    smCols,
    mdCols,
    lgCols,
    xlCols,
    'aria-label': ariaLabel,
    'data-testid': testId,
  } = props;

  const responsiveClasses = cn(
    smCols && `sm:${responsiveColsMap[smCols]}`,
    mdCols && `md:${responsiveColsMap[mdCols]}`,
    lgCols && `lg:${responsiveColsMap[lgCols]}`,
    xlCols && `xl:${responsiveColsMap[xlCols]}`
  );

  const classes = cn(
    gridVariants({ cols, rows, gap, flow, align, justify }),
    responsiveClasses,
    className
  );

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
 * Grid.Item component for grid children with span control.
 */
export interface GridItemProps {
  children?: JSX.Element | JSX.Element[] | string;
  className?: string;
  style?: Record<string, string>;
  /** Column span */
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'full';
  /** Row span */
  rowSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 'full';
  /** Column start position */
  colStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 'auto';
  /** Row start position */
  rowStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'auto';
}

const colSpanMap: Record<string | number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
  full: 'col-span-full',
};

const rowSpanMap: Record<string | number, string> = {
  1: 'row-span-1',
  2: 'row-span-2',
  3: 'row-span-3',
  4: 'row-span-4',
  5: 'row-span-5',
  6: 'row-span-6',
  full: 'row-span-full',
};

export function GridItem(props: GridItemProps): JSX.Element {
  const {
    children,
    className,
    style,
    colSpan,
    rowSpan,
    colStart,
    rowStart,
  } = props;

  const classes = cn(
    colSpan && colSpanMap[colSpan],
    rowSpan && rowSpanMap[rowSpan],
    colStart && (colStart === 'auto' ? 'col-start-auto' : `col-start-${colStart}`),
    rowStart && (rowStart === 'auto' ? 'row-start-auto' : `row-start-${rowStart}`),
    className
  );

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}

// Attach GridItem to Grid
Grid.Item = GridItem;

export default Grid;
