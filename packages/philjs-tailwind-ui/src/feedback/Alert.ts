/**
 * Alert Component
 * Informational messages and notifications
 */

import { jsx, signal } from '@philjs/core';
import { cn, getValue } from '../utils.js';
import type { BaseProps, WithChildren, StatusVariant, MaybeSignal } from '../types.js';

export interface AlertProps extends BaseProps, WithChildren {
  /** Alert variant/status */
  variant?: StatusVariant;
  /** Alert title */
  title?: string;
  /** Visual style */
  style?: 'solid' | 'outline' | 'soft' | 'left-accent' | 'top-accent';
  /** Dismissible alert */
  dismissible?: boolean;
  /** Visible state */
  isVisible?: boolean | MaybeSignal<boolean>;
  /** On dismiss callback */
  onDismiss?: () => void;
  /** Custom icon */
  icon?: JSX.Element | false;
  /** Action buttons */
  action?: JSX.Element;
}

const variantStyles = {
  success: {
    solid: 'bg-green-600 text-white border-green-600',
    outline: 'border-green-500 text-green-700 dark:text-green-400',
    soft: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    'left-accent': 'bg-green-50 text-green-700 border-l-4 border-green-500 dark:bg-green-900/20 dark:text-green-400',
    'top-accent': 'bg-green-50 text-green-700 border-t-4 border-green-500 dark:bg-green-900/20 dark:text-green-400',
  },
  warning: {
    solid: 'bg-yellow-500 text-white border-yellow-500',
    outline: 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
    soft: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    'left-accent': 'bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500 dark:bg-yellow-900/20 dark:text-yellow-400',
    'top-accent': 'bg-yellow-50 text-yellow-700 border-t-4 border-yellow-500 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  error: {
    solid: 'bg-red-600 text-white border-red-600',
    outline: 'border-red-500 text-red-700 dark:text-red-400',
    soft: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    'left-accent': 'bg-red-50 text-red-700 border-l-4 border-red-500 dark:bg-red-900/20 dark:text-red-400',
    'top-accent': 'bg-red-50 text-red-700 border-t-4 border-red-500 dark:bg-red-900/20 dark:text-red-400',
  },
  info: {
    solid: 'bg-blue-600 text-white border-blue-600',
    outline: 'border-blue-500 text-blue-700 dark:text-blue-400',
    soft: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    'left-accent': 'bg-blue-50 text-blue-700 border-l-4 border-blue-500 dark:bg-blue-900/20 dark:text-blue-400',
    'top-accent': 'bg-blue-50 text-blue-700 border-t-4 border-blue-500 dark:bg-blue-900/20 dark:text-blue-400',
  },
  neutral: {
    solid: 'bg-gray-600 text-white border-gray-600',
    outline: 'border-gray-500 text-gray-700 dark:text-gray-400',
    soft: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    'left-accent': 'bg-gray-50 text-gray-700 border-l-4 border-gray-500 dark:bg-gray-800 dark:text-gray-300',
    'top-accent': 'bg-gray-50 text-gray-700 border-t-4 border-gray-500 dark:bg-gray-800 dark:text-gray-300',
  },
};

const variantIcons = {
  success: jsx('svg', {
    class: 'w-5 h-5',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    children: jsx('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M5 13l4 4L19 7',
    }),
  }),
  warning: jsx('svg', {
    class: 'w-5 h-5',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    children: jsx('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    }),
  }),
  error: jsx('svg', {
    class: 'w-5 h-5',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    children: jsx('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    }),
  }),
  info: jsx('svg', {
    class: 'w-5 h-5',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    children: jsx('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    }),
  }),
  neutral: jsx('svg', {
    class: 'w-5 h-5',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    children: jsx('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    }),
  }),
};

export function Alert(props: AlertProps): JSX.Element {
  const {
    variant = 'info',
    title,
    style: alertStyle = 'soft',
    dismissible = false,
    isVisible = true,
    onDismiss,
    icon,
    action,
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  const visible = getValue(isVisible as MaybeSignal<boolean>);

  if (!visible) {
    return jsx('div', { style: { display: 'none' } });
  }

  const alertClasses = cn(
    'p-4 rounded-md',
    alertStyle === 'outline' && 'border',
    alertStyle === 'soft' && 'border',
    variantStyles[variant][alertStyle],
    className
  );

  const showIcon = icon !== false;
  const alertIcon = icon || variantIcons[variant];

  return jsx('div', {
    class: alertClasses,
    role: 'alert',
    id,
    'data-testid': testId,
    ...rest,
    children: jsx('div', {
      class: 'flex',
      children: [
        // Icon
        showIcon && jsx('div', {
          class: 'flex-shrink-0',
          children: alertIcon,
        }),
        // Content
        jsx('div', {
          class: cn('flex-1', showIcon && 'ml-3'),
          children: [
            title && jsx('h3', {
              class: 'text-sm font-medium',
              children: title,
            }),
            children && jsx('div', {
              class: cn('text-sm', title && 'mt-1'),
              children,
            }),
            action && jsx('div', {
              class: 'mt-3',
              children: action,
            }),
          ],
        }),
        // Dismiss button
        dismissible && jsx('div', {
          class: 'ml-auto pl-3',
          children: jsx('button', {
            type: 'button',
            class: cn(
              'inline-flex rounded-md p-1.5',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              alertStyle === 'solid'
                ? 'text-white/80 hover:text-white focus:ring-white/50'
                : 'hover:bg-black/5 dark:hover:bg-white/10 focus:ring-current'
            ),
            onclick: onDismiss,
            'aria-label': 'Dismiss',
            children: jsx('svg', {
              class: 'w-4 h-4',
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
        }),
      ],
    }),
  });
}
