/**
 * PhilJS UI - Avatar Component
 */

import { signal } from 'philjs-core';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  rounded?: boolean;
  showBorder?: boolean;
  borderColor?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; status: string }> = {
  xs: { container: 'h-6 w-6', text: 'text-xs', status: 'h-1.5 w-1.5' },
  sm: { container: 'h-8 w-8', text: 'text-sm', status: 'h-2 w-2' },
  md: { container: 'h-10 w-10', text: 'text-base', status: 'h-2.5 w-2.5' },
  lg: { container: 'h-12 w-12', text: 'text-lg', status: 'h-3 w-3' },
  xl: { container: 'h-14 w-14', text: 'text-xl', status: 'h-3.5 w-3.5' },
  '2xl': { container: 'h-16 w-16', text: 'text-2xl', status: 'h-4 w-4' },
};

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
  away: 'bg-yellow-500',
};

const bgColors = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-green-500',
  'bg-teal-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-purple-500',
  'bg-pink-500',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getBgColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

export function Avatar(props: AvatarProps) {
  const {
    src,
    alt,
    name,
    size = 'md',
    rounded = true,
    showBorder = false,
    borderColor = 'border-white',
    status,
    className = '',
  } = props;

  const hasError = signal(false);
  const { container, text, status: statusSize } = sizeStyles[size];

  const handleError = () => {
    hasError.set(true);
  };

  const showImage = src && !hasError();
  const initials = name ? getInitials(name) : '?';
  const bgColor = name ? getBgColor(name) : 'bg-gray-400';

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className={`
          ${container}
          flex items-center justify-center
          overflow-hidden
          ${rounded ? 'rounded-full' : 'rounded-md'}
          ${showBorder ? `border-2 ${borderColor}` : ''}
          ${showImage ? '' : bgColor}
        `}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            onError={handleError}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className={`${text} font-medium text-white`}>
            {initials}
          </span>
        )}
      </div>

      {status && (
        <span
          className={`
            absolute bottom-0 right-0
            ${statusSize}
            ${statusColors[status]}
            rounded-full
            ring-2 ring-white
          `}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

/**
 * Avatar Group
 */
export interface AvatarGroupProps {
  children: any;
  max?: number;
  size?: AvatarSize;
  spacing?: number;
  className?: string;
}

export function AvatarGroup(props: AvatarGroupProps) {
  const {
    children,
    max,
    size = 'md',
    spacing = -3,
    className = '',
  } = props;

  const avatars = Array.isArray(children) ? children : [children];
  const displayCount = max ? Math.min(avatars.length, max) : avatars.length;
  const remaining = avatars.length - displayCount;

  return (
    <div className={`flex items-center ${className}`}>
      {avatars.slice(0, displayCount).map((avatar, index) => (
        <div
          key={index}
          style={{ marginLeft: index > 0 ? `${spacing * 4}px` : 0 }}
          className="relative"
        >
          {avatar}
        </div>
      ))}

      {remaining > 0 && (
        <div
          style={{ marginLeft: `${spacing * 4}px` }}
          className={`
            ${sizeStyles[size].container}
            flex items-center justify-center
            rounded-full bg-gray-200
            ${sizeStyles[size].text} font-medium text-gray-600
          `}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

/**
 * Avatar Badge - Overlay badge on avatar
 */
export interface AvatarBadgeProps {
  children: any;
  badge: any;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

export function AvatarBadge(props: AvatarBadgeProps) {
  const {
    children,
    badge,
    position = 'bottom-right',
    className = '',
  } = props;

  const positionStyles: Record<string, string> = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      {children}
      <div className={`absolute ${positionStyles[position]}`}>
        {badge}
      </div>
    </div>
  );
}
