/**
 * Badge Component
 * Status and count indicators
 */

import { jsx } from '@philjs/core';
import { cn } from '../utils.js';
import type { BaseProps, WithChildren, Size, ColorVariant } from '../types.js';

export interface BadgeProps extends BaseProps, WithChildren {
  /** Color variant */
  color?: ColorVariant | 'gray';
  /** Size variant */
  size?: Size;
  /** Visual variant */
  variant?: 'solid' | 'outline' | 'soft';
  /** Rounded pill style */
  rounded?: boolean;
  /** Left icon */
  leftIcon?: JSX.Element;
  /** Right icon */
  rightIcon?: JSX.Element;
  /** Removable badge */
  removable?: boolean;
  /** Remove handler */
  onRemove?: () => void;
}

const sizeClasses = {
  xs: 'text-[10px] px-1.5 py-0',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-0.5',
  lg: 'text-sm px-3 py-1',
  xl: 'text-sm px-3.5 py-1.5',
};

const solidColorClasses = {
  primary: 'bg-blue-600 text-white dark:bg-blue-500',
  secondary: 'bg-gray-600 text-white dark:bg-gray-500',
  success: 'bg-green-600 text-white dark:bg-green-500',
  warning: 'bg-yellow-500 text-white',
  error: 'bg-red-600 text-white dark:bg-red-500',
  info: 'bg-cyan-600 text-white dark:bg-cyan-500',
  neutral: 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800',
  gray: 'bg-gray-500 text-white dark:bg-gray-400',
};

const outlineColorClasses = {
  primary: 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400',
  secondary: 'border-gray-600 text-gray-600 dark:border-gray-400 dark:text-gray-400',
  success: 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400',
  warning: 'border-yellow-500 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400',
  error: 'border-red-600 text-red-600 dark:border-red-400 dark:text-red-400',
  info: 'border-cyan-600 text-cyan-600 dark:border-cyan-400 dark:text-cyan-400',
  neutral: 'border-gray-800 text-gray-800 dark:border-gray-200 dark:text-gray-200',
  gray: 'border-gray-500 text-gray-500 dark:border-gray-400 dark:text-gray-400',
};

const softColorClasses = {
  primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  secondary: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  info: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

export function Badge(props: BadgeProps): JSX.Element {
  const {
    color = 'primary',
    size = 'md',
    variant = 'soft',
    rounded = false,
    leftIcon,
    rightIcon,
    removable = false,
    onRemove,
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  const getColorClass = () => {
    switch (variant) {
      case 'solid':
        return solidColorClasses[color];
      case 'outline':
        return outlineColorClasses[color];
      case 'soft':
      default:
        return softColorClasses[color];
    }
  };

  const badgeClasses = cn(
    'inline-flex items-center gap-1',
    'font-medium',
    sizeClasses[size],
    getColorClass(),
    variant === 'outline' && 'border',
    rounded ? 'rounded-full' : 'rounded-md',
    className
  );

  return jsx('span', {
    class: badgeClasses,
    id,
    'data-testid': testId,
    ...rest,
    children: [
      leftIcon && jsx('span', {
        class: 'flex-shrink-0 -ml-0.5',
        children: leftIcon,
      }),
      jsx('span', { children }),
      rightIcon && jsx('span', {
        class: 'flex-shrink-0 -mr-0.5',
        children: rightIcon,
      }),
      removable && jsx('button', {
        type: 'button',
        class: cn(
          'flex-shrink-0 -mr-0.5 ml-0.5',
          'rounded-full p-0.5',
          'hover:bg-black/10 dark:hover:bg-white/10',
          'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-current'
        ),
        onclick: onRemove,
        'aria-label': 'Remove',
        children: jsx('svg', {
          class: 'w-3 h-3',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          children: jsx('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M6 18L18 6M6 6l12 12',
          }),
        }),
      }),
    ],
  });
}

// Tag Component (alias with slightly different styling)
export interface TagProps extends BadgeProps {
  /** Clickable tag */
  clickable?: boolean;
  /** Click handler */
  onClick?: () => void;
}

export function Tag(props: TagProps): JSX.Element {
  const {
    clickable = false,
    onClick,
    class: className,
    ...rest
  } = props;

  if (clickable && onClick) {
    return jsx('button', {
      type: 'button',
      class: cn(
        'cursor-pointer',
        'hover:opacity-80 transition-opacity',
        'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500',
        className
      ),
      onclick: onClick,
      children: Badge({ ...rest, rounded: true }),
    });
  }

  return Badge({ ...rest, rounded: true, class: className });
}
