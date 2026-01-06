/**
 * Card Component
 * Content container with various layouts
 */

import { jsx } from '@philjs/core';
import { cn } from '../utils.js';
import type { BaseProps, WithChildren } from '../types.js';

export interface CardProps extends BaseProps, WithChildren {
  /** Card variant */
  variant?: 'elevated' | 'outline' | 'filled' | 'unstyled';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Border radius */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Hoverable effect */
  hoverable?: boolean;
  /** Clickable card */
  clickable?: boolean;
  /** Click handler */
  onClick?: (e: MouseEvent) => void;
  /** Link href */
  href?: string;
  /** Full height */
  fullHeight?: boolean;
}

const variantClasses = {
  elevated: 'bg-white dark:bg-gray-800 shadow-md',
  outline: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  filled: 'bg-gray-100 dark:bg-gray-800',
  unstyled: '',
};

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
};

const radiusClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
};

export function Card(props: CardProps): JSX.Element {
  const {
    variant = 'elevated',
    padding = 'md',
    radius = 'lg',
    hoverable = false,
    clickable = false,
    onClick,
    href,
    fullHeight = false,
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  const cardClasses = cn(
    'overflow-hidden',
    variantClasses[variant],
    paddingClasses[padding],
    radiusClasses[radius],
    hoverable && 'transition-shadow duration-200 hover:shadow-lg',
    (clickable || onClick || href) && 'cursor-pointer',
    fullHeight && 'h-full',
    className
  );

  if (href) {
    return jsx('a', {
      href,
      class: cardClasses,
      id,
      'data-testid': testId,
      onclick: onClick,
      ...rest,
      children,
    });
  }

  if (onClick || clickable) {
    return jsx('div', {
      class: cardClasses,
      id,
      'data-testid': testId,
      role: 'button',
      tabindex: 0,
      onclick: onClick,
      onkeydown: (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e as unknown as MouseEvent);
        }
      },
      ...rest,
      children,
    });
  }

  return jsx('div', {
    class: cardClasses,
    id,
    'data-testid': testId,
    ...rest,
    children,
  });
}

// Card Header
export interface CardHeaderProps extends BaseProps, WithChildren {
  /** Title */
  title?: string | JSX.Element;
  /** Subtitle */
  subtitle?: string | JSX.Element;
  /** Action elements */
  action?: JSX.Element;
  /** Avatar/icon */
  avatar?: JSX.Element;
}

export function CardHeader(props: CardHeaderProps): JSX.Element {
  const {
    title,
    subtitle,
    action,
    avatar,
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  if (children) {
    return jsx('div', {
      class: cn('flex items-center justify-between', className),
      id,
      'data-testid': testId,
      ...rest,
      children,
    });
  }

  return jsx('div', {
    class: cn('flex items-center gap-3', className),
    id,
    'data-testid': testId,
    ...rest,
    children: [
      avatar && jsx('div', { class: 'flex-shrink-0', children: avatar }),
      jsx('div', {
        class: 'flex-1 min-w-0',
        children: [
          title && jsx('h3', {
            class: 'text-lg font-semibold text-gray-900 dark:text-gray-100 truncate',
            children: title,
          }),
          subtitle && jsx('p', {
            class: 'text-sm text-gray-500 dark:text-gray-400 truncate',
            children: subtitle,
          }),
        ],
      }),
      action && jsx('div', { class: 'flex-shrink-0', children: action }),
    ],
  });
}

// Card Body
export interface CardBodyProps extends BaseProps, WithChildren {}

export function CardBody(props: CardBodyProps): JSX.Element {
  const { class: className, children, id, testId, ...rest } = props;

  return jsx('div', {
    class: cn('text-gray-700 dark:text-gray-300', className),
    id,
    'data-testid': testId,
    ...rest,
    children,
  });
}

// Card Footer
export interface CardFooterProps extends BaseProps, WithChildren {
  /** Justify content */
  justify?: 'start' | 'center' | 'end' | 'between';
  /** Add border top */
  bordered?: boolean;
}

export function CardFooter(props: CardFooterProps): JSX.Element {
  const {
    justify = 'end',
    bordered = false,
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  };

  return jsx('div', {
    class: cn(
      'flex items-center gap-3 pt-4',
      justifyClasses[justify],
      bordered && 'border-t border-gray-200 dark:border-gray-700 mt-4',
      className
    ),
    id,
    'data-testid': testId,
    ...rest,
    children,
  });
}

// Card Image
export interface CardImageProps extends BaseProps {
  /** Image source */
  src: string;
  /** Alt text */
  alt: string;
  /** Aspect ratio */
  aspectRatio?: 'square' | 'video' | 'wide' | 'auto';
  /** Object fit */
  objectFit?: 'cover' | 'contain' | 'fill';
  /** Position (top, bottom, or overlay) */
  position?: 'top' | 'bottom';
}

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  wide: 'aspect-[2/1]',
  auto: '',
};

export function CardImage(props: CardImageProps): JSX.Element {
  const {
    src,
    alt,
    aspectRatio = 'video',
    objectFit = 'cover',
    position = 'top',
    class: className,
    id,
    testId,
    ...rest
  } = props;

  return jsx('div', {
    class: cn(
      '-mx-4 sm:-mx-6',
      position === 'top' ? '-mt-4 sm:-mt-6 mb-4' : '-mb-4 sm:-mb-6 mt-4',
      aspectRatioClasses[aspectRatio],
      'overflow-hidden'
    ),
    id,
    'data-testid': testId,
    ...rest,
    children: jsx('img', {
      src,
      alt,
      class: cn(
        'w-full h-full',
        objectFit === 'cover' && 'object-cover',
        objectFit === 'contain' && 'object-contain',
        objectFit === 'fill' && 'object-fill',
        className
      ),
      loading: 'lazy',
    }),
  });
}
