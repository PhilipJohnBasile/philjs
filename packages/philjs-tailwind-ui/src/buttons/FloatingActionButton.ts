/**
 * FloatingActionButton Component
 * Floating action button (FAB) for primary actions
 */

import { jsx, signal } from '@philjs/core';
import { cn, getValue } from '../utils.js';
import type { BaseProps, DisableableProps, LoadableProps, ClickableProps, Size, ColorVariant, MaybeSignal } from '../types.js';

export interface FloatingActionButtonProps extends BaseProps, DisableableProps, LoadableProps, ClickableProps {
  /** Icon to display */
  icon: JSX.Element | (() => JSX.Element);
  /** Size variant */
  size?: Size;
  /** Color variant */
  color?: ColorVariant;
  /** Position on screen */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right' | 'top-left';
  /** Extended FAB with label */
  label?: string;
  /** Fixed positioning */
  fixed?: boolean;
  /** Z-index */
  zIndex?: number;
  /** Aria label */
  ariaLabel: string;
}

const sizeClasses = {
  xs: 'w-8 h-8',
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
};

const extendedSizeClasses = {
  xs: 'h-8 px-3 text-xs',
  sm: 'h-10 px-4 text-sm',
  md: 'h-14 px-5 text-base',
  lg: 'h-16 px-6 text-lg',
  xl: 'h-20 px-8 text-xl',
};

const iconSizeClasses = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10',
};

const colorClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-blue-500/30',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 shadow-gray-500/30',
  success: 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 shadow-green-500/30',
  warning: 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-yellow-500/30',
  error: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 shadow-red-500/30',
  info: 'bg-cyan-600 text-white hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 shadow-cyan-500/30',
  neutral: 'bg-gray-800 text-white hover:bg-gray-900 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100 shadow-gray-800/30',
};

const positionClasses = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
};

export function FloatingActionButton(props: FloatingActionButtonProps): JSX.Element {
  const {
    icon,
    size = 'md',
    color = 'primary',
    position = 'bottom-right',
    label,
    fixed = true,
    zIndex = 50,
    disabled,
    loading,
    onClick,
    onDoubleClick,
    ariaLabel,
    class: className,
    id,
    testId,
    style = {},
    ...rest
  } = props;

  const isDisabled = getValue(disabled as MaybeSignal<boolean>) || false;
  const isLoading = getValue(loading as MaybeSignal<boolean>) || false;
  const isExtended = !!label;

  const handleClick = (e: MouseEvent) => {
    if (isDisabled || isLoading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const fabClasses = cn(
    // Base styles
    'inline-flex items-center justify-center',
    'rounded-full',
    'font-medium',
    'shadow-lg',
    'transition-all duration-200',
    'focus:outline-none focus:ring-4 focus:ring-offset-2',
    'hover:shadow-xl hover:scale-105',
    'active:scale-95',

    // Size
    isExtended ? extendedSizeClasses[size] : sizeClasses[size],

    // Color
    colorClasses[color],

    // Position
    fixed && 'fixed',
    fixed && positionClasses[position],

    // States
    (isDisabled || isLoading) && 'opacity-50 cursor-not-allowed pointer-events-none',

    // Custom
    className
  );

  const buttonChildren: JSX.Element[] = [];

  // Loading spinner
  if (isLoading) {
    buttonChildren.push(
      jsx('svg', {
        class: cn('animate-spin', iconSizeClasses[size]),
        fill: 'none',
        viewBox: '0 0 24 24',
        'aria-hidden': 'true',
        children: [
          jsx('circle', {
            class: 'opacity-25',
            cx: '12',
            cy: '12',
            r: '10',
            stroke: 'currentColor',
            'stroke-width': '4',
          }),
          jsx('path', {
            class: 'opacity-75',
            fill: 'currentColor',
            d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z',
          }),
        ],
      })
    );
  } else {
    buttonChildren.push(
      jsx('span', {
        class: cn(iconSizeClasses[size], isExtended && 'mr-2'),
        'aria-hidden': 'true',
        children: typeof icon === 'function' ? icon() : icon,
      })
    );
  }

  // Label for extended FAB
  if (isExtended && !isLoading) {
    buttonChildren.push(
      jsx('span', { children: label })
    );
  }

  return jsx('button', {
    type: 'button',
    class: fabClasses,
    style: { ...style, zIndex },
    disabled: isDisabled || isLoading,
    id,
    'data-testid': testId,
    'aria-label': ariaLabel,
    'aria-busy': isLoading,
    'aria-disabled': isDisabled,
    onclick: handleClick,
    ondblclick: onDoubleClick,
    ...rest,
    children: buttonChildren,
  });
}

// Speed Dial (FAB with expandable actions)
export interface SpeedDialAction {
  icon: JSX.Element | (() => JSX.Element);
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface SpeedDialProps extends Omit<FloatingActionButtonProps, 'onClick' | 'label'> {
  /** Actions to show when expanded */
  actions: SpeedDialAction[];
  /** Direction to expand */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Spacing between actions */
  spacing?: number;
}

export function SpeedDial(props: SpeedDialProps): JSX.Element {
  const {
    icon,
    actions,
    direction = 'up',
    spacing = 12,
    size = 'md',
    color = 'primary',
    position = 'bottom-right',
    fixed = true,
    zIndex = 50,
    disabled,
    ariaLabel,
    class: className,
    id,
    testId,
    ...rest
  } = props;

  const isOpen = signal(false);
  const isDisabled = getValue(disabled as MaybeSignal<boolean>) || false;

  const toggleOpen = () => {
    if (!isDisabled) {
      isOpen.set(!isOpen());
    }
  };

  const actionSizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16',
  };

  const actionIconSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const getDirectionStyles = (index: number) => {
    const offset = (index + 1) * (parseInt(actionSizeClasses[size].match(/\d+/)?.[0] || '12') * 4 + spacing);
    switch (direction) {
      case 'up': return { bottom: `${offset}px`, left: '50%', transform: 'translateX(-50%)' };
      case 'down': return { top: `${offset}px`, left: '50%', transform: 'translateX(-50%)' };
      case 'left': return { right: `${offset}px`, top: '50%', transform: 'translateY(-50%)' };
      case 'right': return { left: `${offset}px`, top: '50%', transform: 'translateY(-50%)' };
    }
  };

  const containerClasses = cn(
    'relative inline-flex',
    fixed && 'fixed',
    fixed && positionClasses[position],
    className
  );

  return jsx('div', {
    class: containerClasses,
    style: { zIndex },
    id,
    'data-testid': testId,
    children: [
      // Action buttons
      ...actions.map((action, index) =>
        jsx('button', {
          type: 'button',
          class: cn(
            'absolute inline-flex items-center justify-center',
            'rounded-full shadow-md',
            'bg-white dark:bg-gray-800',
            'text-gray-700 dark:text-gray-200',
            'hover:bg-gray-50 dark:hover:bg-gray-700',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            actionSizeClasses[size],
            isOpen()
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-0 pointer-events-none',
            action.disabled && 'opacity-50 cursor-not-allowed'
          ),
          style: getDirectionStyles(index),
          disabled: action.disabled,
          'aria-label': action.label,
          onclick: () => {
            action.onClick();
            isOpen.set(false);
          },
          children: jsx('span', {
            class: actionIconSizeClasses[size],
            'aria-hidden': 'true',
            children: typeof action.icon === 'function' ? action.icon() : action.icon,
          }),
        })
      ),
      // Main FAB
      FloatingActionButton({
        icon: isOpen()
          ? jsx('svg', {
              class: 'w-6 h-6 transition-transform duration-200',
              fill: 'none',
              stroke: 'currentColor',
              viewBox: '0 0 24 24',
              children: jsx('path', {
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
                'stroke-width': '2',
                d: 'M6 18L18 6M6 6l12 12',
              }),
            })
          : icon,
        size,
        color,
        fixed: false,
        disabled: isDisabled,
        ariaLabel: isOpen() ? 'Close actions' : ariaLabel,
        onClick: toggleOpen,
        ...rest,
      }),
    ],
  });
}
