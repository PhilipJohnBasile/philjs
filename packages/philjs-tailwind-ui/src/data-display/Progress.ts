/**
 * Progress Component
 * Progress bars and indicators
 */

import { jsx, memo } from '@philjs/core';
import { cn, getValue } from '../utils.js';
import type { BaseProps, Size, ColorVariant, MaybeSignal } from '../types.js';

export interface ProgressProps extends BaseProps {
  /** Current value (0-100) */
  value?: number | MaybeSignal<number>;
  /** Maximum value */
  max?: number;
  /** Size variant */
  size?: Size;
  /** Color variant */
  color?: ColorVariant;
  /** Show value label */
  showValue?: boolean;
  /** Custom value formatter */
  formatValue?: (value: number, max: number) => string;
  /** Animated stripes */
  striped?: boolean;
  /** Animation for striped */
  animated?: boolean;
  /** Indeterminate state (loading) */
  indeterminate?: boolean;
  /** Border radius */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Label */
  label?: string;
  /** Aria label */
  ariaLabel?: string;
}

const sizeClasses = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
  xl: 'h-6',
};

const textSizeClasses = {
  xs: 'text-[8px]',
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-base',
};

const colorClasses = {
  primary: 'bg-blue-600 dark:bg-blue-500',
  secondary: 'bg-gray-600 dark:bg-gray-500',
  success: 'bg-green-600 dark:bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-600 dark:bg-red-500',
  info: 'bg-cyan-600 dark:bg-cyan-500',
  neutral: 'bg-gray-800 dark:bg-gray-200',
};

const radiusClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded',
  lg: 'rounded-md',
  full: 'rounded-full',
};

export function Progress(props: ProgressProps): JSX.Element {
  const {
    value = 0,
    max = 100,
    size = 'md',
    color = 'primary',
    showValue = false,
    formatValue = (v, m) => `${Math.round((v / m) * 100)}%`,
    striped = false,
    animated = false,
    indeterminate = false,
    radius = 'full',
    label,
    ariaLabel,
    class: className,
    id,
    testId,
    ...rest
  } = props;

  const currentValue = getValue(value as MaybeSignal<number>);
  const percentage = Math.min(100, Math.max(0, (currentValue / max) * 100));

  const trackClasses = cn(
    'w-full overflow-hidden',
    'bg-gray-200 dark:bg-gray-700',
    sizeClasses[size],
    radiusClasses[radius],
    className
  );

  const barClasses = cn(
    'h-full transition-all duration-300',
    colorClasses[color],
    radiusClasses[radius],
    striped && 'bg-stripes',
    animated && striped && 'animate-stripes',
    indeterminate && 'animate-indeterminate'
  );

  // Show value inside bar for larger sizes
  const showValueInside = showValue && (size === 'lg' || size === 'xl');
  const showValueOutside = showValue && !showValueInside;

  const progressBar = jsx('div', {
    class: trackClasses,
    id,
    'data-testid': testId,
    role: 'progressbar',
    'aria-valuenow': indeterminate ? undefined : currentValue,
    'aria-valuemin': 0,
    'aria-valuemax': max,
    'aria-label': ariaLabel || label,
    ...rest,
    children: jsx('div', {
      class: barClasses,
      style: indeterminate ? undefined : { width: `${percentage}%` },
      children: showValueInside && jsx('span', {
        class: cn(
          'flex items-center justify-center h-full px-2',
          'text-white font-medium',
          textSizeClasses[size]
        ),
        children: formatValue(currentValue, max),
      }),
    }),
  });

  if (label || showValueOutside) {
    return jsx('div', {
      class: 'w-full',
      children: [
        (label || showValueOutside) && jsx('div', {
          class: 'flex justify-between mb-1',
          children: [
            label && jsx('span', {
              class: 'text-sm font-medium text-gray-700 dark:text-gray-300',
              children: label,
            }),
            showValueOutside && jsx('span', {
              class: 'text-sm text-gray-500 dark:text-gray-400',
              children: formatValue(currentValue, max),
            }),
          ],
        }),
        progressBar,
      ],
    });
  }

  return progressBar;
}

// Circular Progress
export interface CircularProgressProps extends BaseProps {
  /** Current value (0-100) */
  value?: number | MaybeSignal<number>;
  /** Maximum value */
  max?: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color variant */
  color?: ColorVariant;
  /** Show value */
  showValue?: boolean;
  /** Custom value formatter */
  formatValue?: (value: number, max: number) => string;
  /** Indeterminate state */
  indeterminate?: boolean;
  /** Track color */
  trackColor?: string;
  /** Content inside circle */
  children?: JSX.Element;
  /** Aria label */
  ariaLabel?: string;
}

const strokeColorClasses = {
  primary: 'stroke-blue-600 dark:stroke-blue-500',
  secondary: 'stroke-gray-600 dark:stroke-gray-500',
  success: 'stroke-green-600 dark:stroke-green-500',
  warning: 'stroke-yellow-500',
  error: 'stroke-red-600 dark:stroke-red-500',
  info: 'stroke-cyan-600 dark:stroke-cyan-500',
  neutral: 'stroke-gray-800 dark:stroke-gray-200',
};

export function CircularProgress(props: CircularProgressProps): JSX.Element {
  const {
    value = 0,
    max = 100,
    size = 48,
    strokeWidth = 4,
    color = 'primary',
    showValue = false,
    formatValue = (v, m) => `${Math.round((v / m) * 100)}%`,
    indeterminate = false,
    trackColor,
    children,
    ariaLabel,
    class: className,
    id,
    testId,
    ...rest
  } = props;

  const currentValue = getValue(value as MaybeSignal<number>);
  const percentage = Math.min(100, Math.max(0, (currentValue / max) * 100));

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return jsx('div', {
    class: cn(
      'relative inline-flex items-center justify-center',
      indeterminate && 'animate-spin',
      className
    ),
    style: { width: `${size}px`, height: `${size}px` },
    id,
    'data-testid': testId,
    role: 'progressbar',
    'aria-valuenow': indeterminate ? undefined : currentValue,
    'aria-valuemin': 0,
    'aria-valuemax': max,
    'aria-label': ariaLabel,
    ...rest,
    children: [
      // SVG circle
      jsx('svg', {
        class: 'transform -rotate-90',
        width: size,
        height: size,
        children: [
          // Track
          jsx('circle', {
            class: trackColor || 'stroke-gray-200 dark:stroke-gray-700',
            fill: 'none',
            cx: size / 2,
            cy: size / 2,
            r: radius,
            'stroke-width': strokeWidth,
          }),
          // Progress
          jsx('circle', {
            class: cn(
              strokeColorClasses[color],
              'transition-all duration-300'
            ),
            fill: 'none',
            cx: size / 2,
            cy: size / 2,
            r: radius,
            'stroke-width': strokeWidth,
            'stroke-linecap': 'round',
            'stroke-dasharray': circumference,
            'stroke-dashoffset': indeterminate ? circumference * 0.75 : offset,
          }),
        ],
      }),
      // Center content
      (showValue || children) && jsx('div', {
        class: 'absolute inset-0 flex items-center justify-center',
        children: children || jsx('span', {
          class: 'text-sm font-medium text-gray-700 dark:text-gray-300',
          children: formatValue(currentValue, max),
        }),
      }),
    ],
  });
}
