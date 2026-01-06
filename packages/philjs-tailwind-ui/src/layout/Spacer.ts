/**
 * Spacer Component
 * Flexible space that pushes elements apart in flex containers
 */

import { jsx } from '@philjs/core';
import { cn } from '../utils.js';
import type { BaseProps, Spacing } from '../types.js';

export interface SpacerProps extends BaseProps {
  /** Fixed size (instead of flex grow) */
  size?: Spacing;
  /** Axis for the spacing */
  axis?: 'horizontal' | 'vertical' | 'both';
}

const sizeClasses: Record<number, { horizontal: string; vertical: string }> = {
  0: { horizontal: 'w-0', vertical: 'h-0' },
  1: { horizontal: 'w-1', vertical: 'h-1' },
  2: { horizontal: 'w-2', vertical: 'h-2' },
  3: { horizontal: 'w-3', vertical: 'h-3' },
  4: { horizontal: 'w-4', vertical: 'h-4' },
  5: { horizontal: 'w-5', vertical: 'h-5' },
  6: { horizontal: 'w-6', vertical: 'h-6' },
  8: { horizontal: 'w-8', vertical: 'h-8' },
  10: { horizontal: 'w-10', vertical: 'h-10' },
  12: { horizontal: 'w-12', vertical: 'h-12' },
  16: { horizontal: 'w-16', vertical: 'h-16' },
  20: { horizontal: 'w-20', vertical: 'h-20' },
  24: { horizontal: 'w-24', vertical: 'h-24' },
};

export function Spacer(props: SpacerProps): JSX.Element {
  const {
    size,
    axis = 'both',
    class: className,
    id,
    testId,
    ...rest
  } = props;

  // If size is specified, use fixed dimensions
  if (size !== undefined) {
    const classes = cn(
      axis === 'horizontal' && sizeClasses[size]?.horizontal,
      axis === 'vertical' && sizeClasses[size]?.vertical,
      axis === 'both' && cn(sizeClasses[size]?.horizontal, sizeClasses[size]?.vertical),
      'flex-shrink-0',
      className
    );

    return jsx('div', {
      class: classes,
      id,
      'data-testid': testId,
      'aria-hidden': 'true',
      ...rest,
    });
  }

  // Otherwise, use flex-grow
  const classes = cn(
    'flex-grow',
    className
  );

  return jsx('div', {
    class: classes,
    id,
    'data-testid': testId,
    'aria-hidden': 'true',
    ...rest,
  });
}

// Convenience fixed size spacers
export function SpacerXs(props: Omit<SpacerProps, 'size'>): JSX.Element {
  return Spacer({ ...props, size: 1 });
}

export function SpacerSm(props: Omit<SpacerProps, 'size'>): JSX.Element {
  return Spacer({ ...props, size: 2 });
}

export function SpacerMd(props: Omit<SpacerProps, 'size'>): JSX.Element {
  return Spacer({ ...props, size: 4 });
}

export function SpacerLg(props: Omit<SpacerProps, 'size'>): JSX.Element {
  return Spacer({ ...props, size: 8 });
}

export function SpacerXl(props: Omit<SpacerProps, 'size'>): JSX.Element {
  return Spacer({ ...props, size: 16 });
}
