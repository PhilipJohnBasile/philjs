/**
 * Avatar Component
 * User avatar with image, initials, or icon fallback
 */

import { jsx, signal } from '@philjs/core';
import { cn, getValue, generateId } from '../utils.js';
import type { BaseProps, Size, MaybeSignal } from '../types.js';

export interface AvatarProps extends BaseProps {
  /** Image source */
  src?: string;
  /** Alt text for image */
  alt?: string;
  /** Name for generating initials */
  name?: string;
  /** Size variant */
  size?: Size | number;
  /** Shape */
  shape?: 'circle' | 'square' | 'rounded';
  /** Background color for initials */
  color?: 'gray' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';
  /** Custom fallback icon */
  fallbackIcon?: JSX.Element;
  /** Show online status */
  status?: 'online' | 'offline' | 'away' | 'busy';
  /** Show ring/border */
  bordered?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

const shapeClasses = {
  circle: 'rounded-full',
  square: 'rounded-none',
  rounded: 'rounded-lg',
};

const colorClasses = {
  gray: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  red: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
  pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300',
};

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
};

const statusSizeClasses = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): AvatarProps['color'] {
  const colors: AvatarProps['color'][] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function Avatar(props: AvatarProps): JSX.Element {
  const {
    src,
    alt,
    name,
    size = 'md',
    shape = 'circle',
    color,
    fallbackIcon,
    status,
    bordered = false,
    class: className,
    id,
    testId,
    ...rest
  } = props;

  const imageError = signal(false);

  const handleImageError = () => {
    imageError.set(true);
  };

  const sizeValue = typeof size === 'number' ? size : undefined;
  const sizeClass = typeof size === 'string' ? sizeClasses[size] : '';
  const actualColor = color || (name ? getColorFromName(name) : 'gray');

  const containerClasses = cn(
    'relative inline-flex items-center justify-center',
    'font-medium select-none',
    sizeClass,
    shapeClasses[shape],
    bordered && 'ring-2 ring-white dark:ring-gray-900',
    className
  );

  const containerStyle = sizeValue
    ? { width: `${sizeValue}px`, height: `${sizeValue}px` }
    : undefined;

  const showImage = src && !imageError();
  const showInitials = !showImage && name;
  const showFallback = !showImage && !showInitials;

  // Default fallback icon (user silhouette)
  const defaultFallbackIcon = jsx('svg', {
    class: 'w-1/2 h-1/2',
    fill: 'currentColor',
    viewBox: '0 0 24 24',
    children: jsx('path', {
      d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    }),
  });

  return jsx('div', {
    class: containerClasses,
    style: containerStyle,
    id,
    'data-testid': testId,
    role: 'img',
    'aria-label': alt || name || 'Avatar',
    ...rest,
    children: [
      // Image
      showImage && jsx('img', {
        src,
        alt: alt || name || 'Avatar',
        class: cn('w-full h-full object-cover', shapeClasses[shape]),
        onerror: handleImageError,
        loading: 'lazy',
      }),
      // Initials
      showInitials && jsx('div', {
        class: cn(
          'w-full h-full flex items-center justify-center',
          colorClasses[actualColor],
          shapeClasses[shape]
        ),
        children: getInitials(name!),
      }),
      // Fallback icon
      showFallback && jsx('div', {
        class: cn(
          'w-full h-full flex items-center justify-center',
          colorClasses[actualColor],
          shapeClasses[shape]
        ),
        children: fallbackIcon || defaultFallbackIcon,
      }),
      // Status indicator
      status && jsx('span', {
        class: cn(
          'absolute bottom-0 right-0',
          'rounded-full ring-2 ring-white dark:ring-gray-900',
          statusColors[status],
          typeof size === 'string' ? statusSizeClasses[size] : 'w-2.5 h-2.5'
        ),
        'aria-label': `Status: ${status}`,
      }),
    ],
  });
}

// Avatar Group
export interface AvatarGroupProps extends BaseProps {
  /** Avatars */
  avatars: Array<Omit<AvatarProps, 'size' | 'bordered'>>;
  /** Maximum avatars to show */
  max?: number;
  /** Size for all avatars */
  size?: Size;
  /** Spacing overlap */
  spacing?: number;
}

export function AvatarGroup(props: AvatarGroupProps): JSX.Element {
  const {
    avatars,
    max = 5,
    size = 'md',
    spacing = -8,
    class: className,
    id,
    testId,
    ...rest
  } = props;

  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return jsx('div', {
    class: cn('flex items-center', className),
    id,
    'data-testid': testId,
    role: 'group',
    'aria-label': `${avatars.length} users`,
    ...rest,
    children: [
      ...visibleAvatars.map((avatarProps, index) =>
        jsx('div', {
          class: 'relative',
          style: { marginLeft: index > 0 ? `${spacing}px` : undefined, zIndex: visibleAvatars.length - index },
          children: Avatar({ ...avatarProps, size, bordered: true }),
        })
      ),
      remainingCount > 0 && jsx('div', {
        class: 'relative',
        style: { marginLeft: `${spacing}px`, zIndex: 0 },
        children: jsx('div', {
          class: cn(
            'flex items-center justify-center',
            'bg-gray-200 dark:bg-gray-700',
            'text-gray-600 dark:text-gray-300',
            'font-medium rounded-full',
            'ring-2 ring-white dark:ring-gray-900',
            sizeClasses[size]
          ),
          children: `+${remainingCount}`,
        }),
      }),
    ],
  });
}
