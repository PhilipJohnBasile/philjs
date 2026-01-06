/**
 * Container Component
 * Responsive container with max-width constraints
 */

import { jsx } from '@philjs/core';
import { cn } from '../utils.js';
import type { BaseProps, WithChildren, Size } from '../types.js';

export interface ContainerProps extends BaseProps, WithChildren {
  /** Maximum width of the container */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'prose';
  /** Whether to add horizontal padding */
  padding?: boolean;
  /** Whether to center the container */
  center?: boolean;
  /** Fluid container (no max-width) */
  fluid?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
  prose: 'max-w-prose',
};

export function Container(props: ContainerProps): JSX.Element {
  const {
    maxWidth = 'xl',
    padding = true,
    center = true,
    fluid = false,
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  const classes = cn(
    // Base
    'w-full',
    // Max width
    !fluid && maxWidthClasses[maxWidth],
    // Padding
    padding && 'px-4 sm:px-6 lg:px-8',
    // Center
    center && 'mx-auto',
    // Custom
    className
  );

  return jsx('div', {
    class: classes,
    id,
    'data-testid': testId,
    ...rest,
    children,
  });
}
