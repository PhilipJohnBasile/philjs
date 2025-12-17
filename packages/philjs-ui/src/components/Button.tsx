/**
 * PhilJS UI - Button Component
 */

import { signal, memo } from 'philjs-core';

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

export interface ButtonProps {
  children: any;
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: any;
  rightIcon?: any;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: MouseEvent) => void;
  className?: string;
  style?: Record<string, string>;
  'aria-label'?: string;
}

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

const variantStyles: Record<ButtonVariant, Record<ButtonColor, string>> = {
  solid: {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800',
    success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-700',
    error: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    info: 'bg-cyan-600 text-white hover:bg-cyan-700 active:bg-cyan-800',
  },
  outline: {
    primary: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100',
    secondary: 'border-2 border-gray-600 text-gray-600 hover:bg-gray-50 active:bg-gray-100',
    success: 'border-2 border-green-600 text-green-600 hover:bg-green-50 active:bg-green-100',
    warning: 'border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 active:bg-yellow-100',
    error: 'border-2 border-red-600 text-red-600 hover:bg-red-50 active:bg-red-100',
    info: 'border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 active:bg-cyan-100',
  },
  ghost: {
    primary: 'text-blue-600 hover:bg-blue-50 active:bg-blue-100',
    secondary: 'text-gray-600 hover:bg-gray-50 active:bg-gray-100',
    success: 'text-green-600 hover:bg-green-50 active:bg-green-100',
    warning: 'text-yellow-600 hover:bg-yellow-50 active:bg-yellow-100',
    error: 'text-red-600 hover:bg-red-50 active:bg-red-100',
    info: 'text-cyan-600 hover:bg-cyan-50 active:bg-cyan-100',
  },
  link: {
    primary: 'text-blue-600 hover:underline',
    secondary: 'text-gray-600 hover:underline',
    success: 'text-green-600 hover:underline',
    warning: 'text-yellow-600 hover:underline',
    error: 'text-red-600 hover:underline',
    info: 'text-cyan-600 hover:underline',
  },
};

export function Button(props: ButtonProps) {
  const {
    children,
    variant = 'solid',
    size = 'md',
    color = 'primary',
    disabled = false,
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    type = 'button',
    onClick,
    className = '',
    style,
    'aria-label': ariaLabel,
  } = props;

  const isDisabled = disabled || loading;

  const baseStyles = `
    inline-flex items-center justify-center
    font-medium rounded-md
    transition-colors duration-150
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim().replace(/\s+/g, ' ');

  const classes = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant][color],
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={classes}
      style={style}
      aria-label={ariaLabel}
      aria-busy={loading}
      aria-disabled={isDisabled}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}

/**
 * Icon Button - Button with only an icon
 */
export function IconButton(props: Omit<ButtonProps, 'children' | 'leftIcon' | 'rightIcon'> & {
  icon: any;
  'aria-label': string;
}) {
  const { icon, size = 'md', ...rest } = props;

  const iconSizes: Record<ButtonSize, string> = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
    xl: 'p-4',
  };

  return (
    <Button
      {...rest}
      size={size}
      className={`${iconSizes[size]} ${props.className || ''}`}
    >
      {icon}
    </Button>
  );
}

/**
 * Button Group
 */
export function ButtonGroup(props: {
  children: any | any[];
  attached?: boolean;
  className?: string;
}) {
  const { children, attached = false, className = '' } = props;

  const groupClasses = attached
    ? 'inline-flex [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none [&>*:not(:first-child)]:-ml-px'
    : 'inline-flex gap-2';

  return (
    <div className={`${groupClasses} ${className}`} role="group">
      {children}
    </div>
  );
}
