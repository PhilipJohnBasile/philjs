/**
 * Spinner Component
 * Loading indicator animations
 */

import { jsx } from '@philjs/core';
import { cn } from '../utils.js';
import type { BaseProps, Size, ColorVariant } from '../types.js';

export interface SpinnerProps extends BaseProps {
  /** Size variant */
  size?: Size | number;
  /** Color variant */
  color?: ColorVariant | 'current' | 'white';
  /** Spinner style */
  variant?: 'circle' | 'dots' | 'bars' | 'ring';
  /** Animation speed */
  speed?: 'slow' | 'normal' | 'fast';
  /** Thickness for circle/ring */
  thickness?: number;
  /** Label for accessibility */
  label?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const colorClasses = {
  primary: 'text-blue-600 dark:text-blue-500',
  secondary: 'text-gray-600 dark:text-gray-400',
  success: 'text-green-600 dark:text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-600 dark:text-red-500',
  info: 'text-cyan-600 dark:text-cyan-500',
  neutral: 'text-gray-800 dark:text-gray-200',
  current: 'text-current',
  white: 'text-white',
};

const speedClasses = {
  slow: 'animate-[spin_1.5s_linear_infinite]',
  normal: 'animate-spin',
  fast: 'animate-[spin_0.5s_linear_infinite]',
};

export function Spinner(props: SpinnerProps): JSX.Element {
  const {
    size = 'md',
    color = 'primary',
    variant = 'circle',
    speed = 'normal',
    thickness,
    label = 'Loading',
    class: className,
    id,
    testId,
    ...rest
  } = props;

  const sizeValue = typeof size === 'number' ? size : undefined;
  const sizeClass = typeof size === 'string' ? sizeClasses[size] : '';

  const baseClasses = cn(
    colorClasses[color],
    sizeClass,
    className
  );

  const style = sizeValue
    ? { width: `${sizeValue}px`, height: `${sizeValue}px` }
    : undefined;

  // Circle spinner (default)
  if (variant === 'circle') {
    return jsx('svg', {
      class: cn(baseClasses, speedClasses[speed]),
      style,
      fill: 'none',
      viewBox: '0 0 24 24',
      id,
      'data-testid': testId,
      role: 'status',
      'aria-label': label,
      ...rest,
      children: [
        jsx('circle', {
          class: 'opacity-25',
          cx: '12',
          cy: '12',
          r: '10',
          stroke: 'currentColor',
          'stroke-width': thickness || 4,
        }),
        jsx('path', {
          class: 'opacity-75',
          fill: 'currentColor',
          d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z',
        }),
      ],
    });
  }

  // Ring spinner
  if (variant === 'ring') {
    const strokeWidth = thickness || 3;
    return jsx('div', {
      class: cn(baseClasses, speedClasses[speed]),
      style,
      id,
      'data-testid': testId,
      role: 'status',
      'aria-label': label,
      ...rest,
      children: jsx('svg', {
        class: 'w-full h-full',
        viewBox: '0 0 24 24',
        fill: 'none',
        children: jsx('circle', {
          cx: '12',
          cy: '12',
          r: 10 - strokeWidth / 2,
          stroke: 'currentColor',
          'stroke-width': strokeWidth,
          'stroke-linecap': 'round',
          'stroke-dasharray': '32 32',
        }),
      }),
    });
  }

  // Dots spinner
  if (variant === 'dots') {
    const dotSize = typeof size === 'number' ? size / 4 : { xs: 2, sm: 2, md: 3, lg: 4, xl: 5 }[size];

    return jsx('div', {
      class: cn('inline-flex items-center gap-1', colorClasses[color], className),
      style,
      id,
      'data-testid': testId,
      role: 'status',
      'aria-label': label,
      ...rest,
      children: [0, 1, 2].map(i =>
        jsx('span', {
          class: 'rounded-full bg-current animate-bounce',
          style: {
            width: `${dotSize}px`,
            height: `${dotSize}px`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s',
          },
        })
      ),
    });
  }

  // Bars spinner
  if (variant === 'bars') {
    const barWidth = typeof size === 'number' ? size / 5 : { xs: 2, sm: 2, md: 3, lg: 4, xl: 5 }[size];
    const barHeight = typeof size === 'number' ? size : { xs: 12, sm: 16, md: 24, lg: 32, xl: 48 }[size];

    return jsx('div', {
      class: cn('inline-flex items-end gap-0.5', colorClasses[color], className),
      id,
      'data-testid': testId,
      role: 'status',
      'aria-label': label,
      ...rest,
      children: [0, 1, 2, 3].map(i =>
        jsx('span', {
          class: 'bg-current animate-pulse',
          style: {
            width: `${barWidth}px`,
            height: `${barHeight * (0.4 + Math.random() * 0.6)}px`,
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.8s',
          },
        })
      ),
    });
  }

  return jsx('div', { children: 'Invalid spinner variant' });
}

// Loading Overlay
export interface LoadingOverlayProps extends BaseProps {
  /** Show the overlay */
  isLoading?: boolean;
  /** Spinner props */
  spinnerProps?: Omit<SpinnerProps, 'label'>;
  /** Loading text */
  text?: string;
  /** Overlay opacity */
  opacity?: number;
  /** Blur background */
  blur?: boolean;
  /** Cover full screen */
  fullScreen?: boolean;
}

export function LoadingOverlay(props: LoadingOverlayProps): JSX.Element {
  const {
    isLoading = true,
    spinnerProps = {},
    text,
    opacity = 0.7,
    blur = false,
    fullScreen = false,
    class: className,
    id,
    testId,
    ...rest
  } = props;

  if (!isLoading) {
    return jsx('div', { style: { display: 'none' } });
  }

  return jsx('div', {
    class: cn(
      'flex flex-col items-center justify-center',
      fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0',
      blur && 'backdrop-blur-sm',
      className
    ),
    style: { backgroundColor: `rgba(255, 255, 255, ${opacity})` },
    id,
    'data-testid': testId,
    role: 'status',
    'aria-live': 'polite',
    ...rest,
    children: [
      Spinner({ size: 'lg', ...spinnerProps, label: text || 'Loading' }),
      text && jsx('p', {
        class: 'mt-3 text-sm text-gray-600 dark:text-gray-400',
        children: text,
      }),
    ],
  });
}
