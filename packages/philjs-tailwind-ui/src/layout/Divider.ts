/**
 * Divider Component
 * Visual separator between content sections
 */

import { jsx } from '@philjs/core';
import { cn } from '../utils.js';
import type { BaseProps, WithChildren } from '../types.js';

export interface DividerProps extends BaseProps, WithChildren {
  /** Orientation of the divider */
  orientation?: 'horizontal' | 'vertical';
  /** Visual style of the divider */
  variant?: 'solid' | 'dashed' | 'dotted';
  /** Thickness of the divider */
  thickness?: 'thin' | 'medium' | 'thick';
  /** Color of the divider */
  color?: 'light' | 'default' | 'dark';
  /** Label position (for horizontal dividers with children) */
  labelPosition?: 'left' | 'center' | 'right';
  /** Spacing around the divider */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

const thicknessClasses = {
  horizontal: {
    thin: 'h-px',
    medium: 'h-0.5',
    thick: 'h-1',
  },
  vertical: {
    thin: 'w-px',
    medium: 'w-0.5',
    thick: 'w-1',
  },
};

const colorClasses = {
  light: 'bg-gray-100 dark:bg-gray-800',
  default: 'bg-gray-200 dark:bg-gray-700',
  dark: 'bg-gray-300 dark:bg-gray-600',
};

const variantClasses = {
  solid: '',
  dashed: 'border-dashed',
  dotted: 'border-dotted',
};

const spacingClasses = {
  horizontal: {
    none: '',
    sm: 'my-2',
    md: 'my-4',
    lg: 'my-8',
  },
  vertical: {
    none: '',
    sm: 'mx-2',
    md: 'mx-4',
    lg: 'mx-8',
  },
};

const labelPositionClasses = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
};

export function Divider(props: DividerProps): JSX.Element {
  const {
    orientation = 'horizontal',
    variant = 'solid',
    thickness = 'thin',
    color = 'default',
    labelPosition = 'center',
    spacing = 'md',
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  const isHorizontal = orientation === 'horizontal';
  const hasLabel = !!children;

  // Simple divider without label
  if (!hasLabel) {
    const classes = cn(
      // Size
      isHorizontal ? 'w-full' : 'h-full',
      thicknessClasses[orientation][thickness],
      // Color
      colorClasses[color],
      // Variant (for dashed/dotted we use border instead of bg)
      variant !== 'solid' && cn(
        'bg-transparent',
        isHorizontal ? 'border-t' : 'border-l',
        isHorizontal ? 'border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700',
        variantClasses[variant]
      ),
      // Spacing
      spacingClasses[orientation][spacing],
      // Custom
      className
    );

    return jsx('hr', {
      class: classes,
      id,
      'data-testid': testId,
      'aria-orientation': orientation,
      role: 'separator',
      ...rest,
    });
  }

  // Divider with label (only horizontal)
  const containerClasses = cn(
    'flex items-center w-full',
    spacingClasses.horizontal[spacing],
    labelPositionClasses[labelPosition],
    className
  );

  const lineClasses = cn(
    'flex-1',
    thicknessClasses.horizontal[thickness],
    colorClasses[color]
  );

  const labelClasses = cn(
    'px-3 text-sm text-gray-500 dark:text-gray-400',
    'whitespace-nowrap'
  );

  return jsx('div', {
    class: containerClasses,
    id,
    'data-testid': testId,
    role: 'separator',
    'aria-orientation': 'horizontal',
    ...rest,
    children: [
      labelPosition !== 'left' && jsx('div', { class: lineClasses, 'aria-hidden': 'true' }),
      jsx('span', { class: labelClasses, children }),
      labelPosition !== 'right' && jsx('div', { class: lineClasses, 'aria-hidden': 'true' }),
    ],
  });
}
