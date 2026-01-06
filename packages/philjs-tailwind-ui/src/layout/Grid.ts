/**
 * Grid Component
 * CSS Grid layout with responsive columns
 */

import { jsx } from '@philjs/core';
import { cn } from '../utils.js';
import type { BaseProps, WithChildren, Spacing } from '../types.js';

export interface GridProps extends BaseProps, WithChildren {
  /** Number of columns (1-12) */
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Responsive columns: sm breakpoint */
  colsSm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Responsive columns: md breakpoint */
  colsMd?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Responsive columns: lg breakpoint */
  colsLg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Responsive columns: xl breakpoint */
  colsXl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Gap between items */
  gap?: Spacing;
  /** Row gap */
  gapX?: Spacing;
  /** Column gap */
  gapY?: Spacing;
  /** Align items */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /** Justify items */
  justify?: 'start' | 'center' | 'end' | 'stretch';
  /** Flow direction */
  flow?: 'row' | 'col' | 'dense' | 'row-dense' | 'col-dense';
  /** HTML tag to use */
  as?: 'div' | 'section' | 'article' | 'main' | 'aside' | 'nav' | 'ul' | 'ol';
}

const colClasses: Record<number, string> = {
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

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyClasses = {
  start: 'justify-items-start',
  center: 'justify-items-center',
  end: 'justify-items-end',
  stretch: 'justify-items-stretch',
};

const flowClasses = {
  row: 'grid-flow-row',
  col: 'grid-flow-col',
  dense: 'grid-flow-dense',
  'row-dense': 'grid-flow-row-dense',
  'col-dense': 'grid-flow-col-dense',
};

export function Grid(props: GridProps): JSX.Element {
  const {
    cols = 1,
    colsSm,
    colsMd,
    colsLg,
    colsXl,
    gap = 4,
    gapX,
    gapY,
    align,
    justify,
    flow,
    as = 'div',
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  const classes = cn(
    'grid',
    // Base columns
    colClasses[cols],
    // Responsive columns
    colsSm && `sm:${colClasses[colsSm].replace('grid-cols', 'grid-cols')}`,
    colsMd && `md:grid-cols-${colsMd}`,
    colsLg && `lg:grid-cols-${colsLg}`,
    colsXl && `xl:grid-cols-${colsXl}`,
    // Gap
    gapX !== undefined ? gapXClasses[gapX] : gapY !== undefined ? '' : gapClasses[gap],
    gapX !== undefined && gapXClasses[gapX],
    gapY !== undefined && gapYClasses[gapY],
    // Alignment
    align && alignClasses[align],
    justify && justifyClasses[justify],
    // Flow
    flow && flowClasses[flow],
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

// Grid Item Component
export interface GridItemProps extends BaseProps, WithChildren {
  /** Column span (1-12 or 'full') */
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'full';
  /** Row span (1-6 or 'full') */
  rowSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 'full';
  /** Column start position */
  colStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 'auto';
  /** Column end position */
  colEnd?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 'auto';
  /** HTML tag to use */
  as?: 'div' | 'section' | 'article' | 'li';
}

const colSpanClasses: Record<string | number, string> = {
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

const rowSpanClasses: Record<string | number, string> = {
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
    colSpan,
    rowSpan,
    colStart,
    colEnd,
    as = 'div',
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  const classes = cn(
    colSpan && colSpanClasses[colSpan],
    rowSpan && rowSpanClasses[rowSpan],
    colStart && (colStart === 'auto' ? 'col-start-auto' : `col-start-${colStart}`),
    colEnd && (colEnd === 'auto' ? 'col-end-auto' : `col-end-${colEnd}`),
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
