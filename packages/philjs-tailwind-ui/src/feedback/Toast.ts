/**
 * Toast Component
 * Temporary notification messages
 */

import { jsx, signal, effect } from '@philjs/core';
import { cn, generateId } from '../utils.js';
import type { BaseProps, WithChildren, StatusVariant, Position } from '../types.js';

export interface ToastProps extends BaseProps, WithChildren {
  /** Toast variant/status */
  variant?: StatusVariant;
  /** Toast title */
  title?: string;
  /** Auto-dismiss duration in ms (0 to disable) */
  duration?: number;
  /** Visible state */
  isVisible?: boolean;
  /** On close callback */
  onClose?: () => void;
  /** Custom icon */
  icon?: JSX.Element | false;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Show close button */
  closable?: boolean;
  /** Position for standalone use */
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
}

const variantClasses = {
  success: 'bg-green-600 text-white',
  warning: 'bg-yellow-500 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
  neutral: 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800',
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
      d: 'M6 18L18 6M6 6l12 12',
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

export function Toast(props: ToastProps): JSX.Element {
  const {
    variant = 'neutral',
    title,
    duration = 5000,
    isVisible = true,
    onClose,
    icon,
    action,
    closable = true,
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  // Auto-dismiss timer
  if (duration > 0 && isVisible && onClose) {
    effect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    });
  }

  if (!isVisible) {
    return jsx('div', { style: { display: 'none' } });
  }

  const showIcon = icon !== false;
  const toastIcon = icon || variantIcons[variant];

  const toastClasses = cn(
    'flex items-start gap-3 p-4',
    'rounded-lg shadow-lg',
    'min-w-[300px] max-w-md',
    variantClasses[variant],
    className
  );

  return jsx('div', {
    class: toastClasses,
    role: 'alert',
    'aria-live': 'polite',
    id,
    'data-testid': testId,
    ...rest,
    children: [
      // Icon
      showIcon && jsx('div', {
        class: 'flex-shrink-0',
        children: toastIcon,
      }),
      // Content
      jsx('div', {
        class: 'flex-1 min-w-0',
        children: [
          title && jsx('p', {
            class: 'font-medium',
            children: title,
          }),
          children && jsx('p', {
            class: cn('text-sm', title && 'mt-1', 'opacity-90'),
            children,
          }),
          action && jsx('button', {
            type: 'button',
            class: cn(
              'mt-2 text-sm font-medium',
              'hover:underline focus:outline-none focus:underline'
            ),
            onclick: action.onClick,
            children: action.label,
          }),
        ],
      }),
      // Close button
      closable && jsx('button', {
        type: 'button',
        class: cn(
          'flex-shrink-0 p-1 rounded-md',
          'opacity-70 hover:opacity-100',
          'focus:outline-none focus:ring-2 focus:ring-white/50'
        ),
        onclick: onClose,
        'aria-label': 'Close',
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
    ],
  });
}

// Toast Container for positioning toasts
export interface ToastContainerProps extends BaseProps {
  /** Position of toast container */
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
  /** Toasts to display */
  toasts: Array<Omit<ToastProps, 'position'>>;
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

export function ToastContainer(props: ToastContainerProps): JSX.Element {
  const {
    position = 'top-right',
    toasts,
    class: className,
    id,
    testId,
    ...rest
  } = props;

  return jsx('div', {
    class: cn(
      'fixed z-50',
      'flex flex-col gap-2',
      positionClasses[position],
      className
    ),
    id,
    'data-testid': testId,
    'aria-live': 'polite',
    'aria-atomic': 'true',
    ...rest,
    children: toasts.map((toast, index) =>
      Toast({ ...toast, key: toast.id || index })
    ),
  });
}

// Toast Store for imperative toast management
export interface ToastData extends Omit<ToastProps, 'isVisible' | 'onClose'> {
  id: string;
}

export function createToastStore() {
  const toasts = signal<ToastData[]>([]);

  const addToast = (toast: Omit<ToastData, 'id'>): string => {
    const id = generateId('toast');
    toasts.set([...toasts(), { ...toast, id }]);
    return id;
  };

  const removeToast = (id: string) => {
    toasts.set(toasts().filter(t => t.id !== id));
  };

  const success = (title: string, message?: string) =>
    addToast({ variant: 'success', title, children: message });

  const error = (title: string, message?: string) =>
    addToast({ variant: 'error', title, children: message });

  const warning = (title: string, message?: string) =>
    addToast({ variant: 'warning', title, children: message });

  const info = (title: string, message?: string) =>
    addToast({ variant: 'info', title, children: message });

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
