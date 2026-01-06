/**
 * Button Component
 * Versatile button with multiple variants and states
 */

import { jsx, signal } from '@philjs/core';
import { cn, getValue, getColorClass, getPaddingClass, getSizeClass } from '../utils.js';
import type { BaseProps, WithChildren, DisableableProps, LoadableProps, ClickableProps, Size, ColorVariant, ButtonVariant, MaybeSignal } from '../types.js';

export interface ButtonProps extends BaseProps, WithChildren, DisableableProps, LoadableProps, ClickableProps {
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Size variant */
  size?: Size;
  /** Color variant */
  color?: ColorVariant;
  /** Button style variant */
  variant?: ButtonVariant;
  /** Full width button */
  fullWidth?: boolean;
  /** Rounded pill style */
  rounded?: boolean;
  /** Left icon */
  leftIcon?: JSX.Element | (() => JSX.Element);
  /** Right icon */
  rightIcon?: JSX.Element | (() => JSX.Element);
  /** Icon only button (no padding for text) */
  iconOnly?: boolean;
  /** Form to associate with */
  form?: string;
  /** Name for form submission */
  name?: string;
  /** Value for form submission */
  value?: string;
  /** Aria label */
  ariaLabel?: string;
  /** Aria pressed for toggle buttons */
  ariaPressed?: boolean;
  /** Aria expanded for dropdown triggers */
  ariaExpanded?: boolean;
  /** Aria controls */
  ariaControls?: string;
}

const sizeClasses = {
  xs: 'h-6 text-xs px-2 gap-1',
  sm: 'h-8 text-sm px-3 gap-1.5',
  md: 'h-10 text-sm px-4 gap-2',
  lg: 'h-12 text-base px-5 gap-2',
  xl: 'h-14 text-lg px-6 gap-2.5',
};

const iconOnlySizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-14 w-14',
};

const iconSizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

export function Button(props: ButtonProps): JSX.Element {
  const {
    type = 'button',
    size = 'md',
    color = 'primary',
    variant = 'solid',
    fullWidth = false,
    rounded = false,
    leftIcon,
    rightIcon,
    iconOnly = false,
    disabled,
    loading,
    form,
    name,
    value,
    onClick,
    onDoubleClick,
    ariaLabel,
    ariaPressed,
    ariaExpanded,
    ariaControls,
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  const isDisabled = getValue(disabled as MaybeSignal<boolean>) || false;
  const isLoading = getValue(loading as MaybeSignal<boolean>) || false;

  const handleClick = (e: MouseEvent) => {
    if (isDisabled || isLoading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const buttonClasses = cn(
    // Base styles
    'inline-flex items-center justify-center',
    'font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'border',

    // Size
    iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size],

    // Variant and color
    getColorClass(color, variant),

    // Border for outline variant
    variant === 'outline' ? 'border-current' : 'border-transparent',

    // Border radius
    rounded ? 'rounded-full' : 'rounded-md',

    // Full width
    fullWidth && 'w-full',

    // States
    (isDisabled || isLoading) && 'opacity-50 cursor-not-allowed pointer-events-none',

    // Custom
    className
  );

  // Build children array
  const buttonChildren: JSX.Element[] = [];

  // Loading spinner
  if (isLoading) {
    buttonChildren.push(
      jsx('svg', {
        class: cn('animate-spin', iconSizeClasses[size], children && 'mr-2'),
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
  } else if (leftIcon) {
    buttonChildren.push(
      jsx('span', {
        class: iconSizeClasses[size],
        'aria-hidden': 'true',
        children: typeof leftIcon === 'function' ? leftIcon() : leftIcon,
      })
    );
  }

  // Main content
  if (children && !iconOnly) {
    buttonChildren.push(
      jsx('span', { children })
    );
  }

  // Right icon
  if (rightIcon && !isLoading) {
    buttonChildren.push(
      jsx('span', {
        class: iconSizeClasses[size],
        'aria-hidden': 'true',
        children: typeof rightIcon === 'function' ? rightIcon() : rightIcon,
      })
    );
  }

  return jsx('button', {
    type,
    class: buttonClasses,
    disabled: isDisabled || isLoading,
    form,
    name,
    value,
    id,
    'data-testid': testId,
    'aria-label': ariaLabel,
    'aria-pressed': ariaPressed,
    'aria-expanded': ariaExpanded,
    'aria-controls': ariaControls,
    'aria-busy': isLoading,
    'aria-disabled': isDisabled,
    onclick: handleClick,
    ondblclick: onDoubleClick,
    ...rest,
    children: buttonChildren,
  });
}

// Icon Button Component
export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'leftIcon' | 'rightIcon' | 'iconOnly'> {
  /** Icon to display */
  icon: JSX.Element | (() => JSX.Element);
  /** Aria label (required for accessibility) */
  ariaLabel: string;
}

export function IconButton(props: IconButtonProps): JSX.Element {
  const { icon, ariaLabel, ...rest } = props;

  return Button({
    ...rest,
    iconOnly: true,
    ariaLabel,
    children: jsx('span', {
      'aria-hidden': 'true',
      children: typeof icon === 'function' ? icon() : icon,
    }),
  });
}
