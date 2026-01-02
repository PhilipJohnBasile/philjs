/**
 * PhilJS UI - Card Component
 */
import type { JSX } from '@philjs/core/jsx-runtime';

type CardVariant = 'elevated' | 'outlined' | 'filled';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type ImagePosition = 'top' | 'bottom';

const variantStyles: Record<CardVariant, string> = {
  elevated: 'bg-white shadow-md',
  outlined: 'bg-white border border-gray-200',
  filled: 'bg-gray-50',
};

const paddingStyles: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export interface CardProps {
  children: JSX.Element | JSX.Element[];
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Card(props: CardProps): JSX.Element {
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
  ]
    .filter(Boolean)
    .join(' ');

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

export interface CardHeaderProps {
  children: JSX.Element | JSX.Element[] | string;
  action?: JSX.Element;
  className?: string;
}

/**
 * Card Header
 */
export function CardHeader(props: CardHeaderProps): JSX.Element {
  const { children, action, className = '' } = props;

  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

export interface CardTitleProps {
  children: JSX.Element | JSX.Element[] | string;
  subtitle?: string;
  className?: string;
}

/**
 * Card Title
 */
export function CardTitle(props: CardTitleProps): JSX.Element {
  const { children, subtitle, className = '' } = props;

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-gray-900">{children}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export interface CardBodyProps {
  children: JSX.Element | JSX.Element[] | string;
  className?: string;
}

/**
 * Card Body
 */
export function CardBody(props: CardBodyProps): JSX.Element {
  return <div className={props.className || ''}>{props.children}</div>;
}

export interface CardFooterProps {
  children: JSX.Element | JSX.Element[];
  divider?: boolean;
  className?: string;
}

/**
 * Card Footer
 */
export function CardFooter(props: CardFooterProps): JSX.Element {
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

export interface CardImageProps {
  src: string;
  alt: string;
  position?: ImagePosition;
  className?: string;
}

/**
 * Card Image
 */
export function CardImage(props: CardImageProps): JSX.Element {
  const { src, alt, position = 'top', className = '' } = props;

  const positionClasses =
    position === 'top'
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
