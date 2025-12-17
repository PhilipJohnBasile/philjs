/**
 * PhilJS UI - Card Component
 */

import { JSX } from 'philjs-core';

export type CardVariant = 'elevated' | 'outlined' | 'filled';

export interface CardProps {
  children: JSX.Element;
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  elevated: 'bg-white shadow-md',
  outlined: 'bg-white border border-gray-200',
  filled: 'bg-gray-50',
};

const paddingStyles: Record<string, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card(props: CardProps) {
  const {
    children,
    variant = 'elevated',
    padding = 'md',
    hoverable = false,
    clickable = false,
    onClick,
    className = '',
  } = props;

  const classes = [
    'rounded-lg',
    variantStyles[variant],
    paddingStyles[padding],
    hoverable ? 'transition-shadow hover:shadow-lg' : '',
    clickable ? 'cursor-pointer' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {children}
    </div>
  );
}

/**
 * Card Header
 */
export function CardHeader(props: {
  children: JSX.Element;
  action?: JSX.Element;
  className?: string;
}) {
  const { children, action, className = '' } = props;

  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * Card Title
 */
export function CardTitle(props: {
  children: JSX.Element;
  subtitle?: string;
  className?: string;
}) {
  const { children, subtitle, className = '' } = props;

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-gray-900">{children}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

/**
 * Card Body
 */
export function CardBody(props: { children: JSX.Element; className?: string }) {
  return <div className={props.className || ''}>{props.children}</div>;
}

/**
 * Card Footer
 */
export function CardFooter(props: {
  children: JSX.Element;
  divider?: boolean;
  className?: string;
}) {
  const { children, divider = false, className = '' } = props;

  return (
    <div
      className={`
        mt-4 pt-4
        ${divider ? 'border-t border-gray-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * Card Image
 */
export function CardImage(props: {
  src: string;
  alt: string;
  position?: 'top' | 'bottom';
  className?: string;
}) {
  const { src, alt, position = 'top', className = '' } = props;

  const positionClasses = position === 'top'
    ? '-mx-4 -mt-4 mb-4 rounded-t-lg'
    : '-mx-4 -mb-4 mt-4 rounded-b-lg';

  return (
    <img
      src={src}
      alt={alt}
      className={`w-full object-cover ${positionClasses} ${className}`}
    />
  );
}
