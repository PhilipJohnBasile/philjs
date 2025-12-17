/**
 * PhilJS UI - Badge Component
 */

export type BadgeVariant = 'solid' | 'subtle' | 'outline';
export type BadgeColor = 'gray' | 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'cyan' | 'purple' | 'pink';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: any;
  variant?: BadgeVariant;
  color?: BadgeColor;
  size?: BadgeSize;
  rounded?: boolean;
  className?: string;
}

const colorStyles: Record<BadgeColor, Record<BadgeVariant, string>> = {
  gray: {
    solid: 'bg-gray-600 text-white',
    subtle: 'bg-gray-100 text-gray-800',
    outline: 'border border-gray-600 text-gray-600',
  },
  red: {
    solid: 'bg-red-600 text-white',
    subtle: 'bg-red-100 text-red-800',
    outline: 'border border-red-600 text-red-600',
  },
  orange: {
    solid: 'bg-orange-600 text-white',
    subtle: 'bg-orange-100 text-orange-800',
    outline: 'border border-orange-600 text-orange-600',
  },
  yellow: {
    solid: 'bg-yellow-500 text-white',
    subtle: 'bg-yellow-100 text-yellow-800',
    outline: 'border border-yellow-500 text-yellow-600',
  },
  green: {
    solid: 'bg-green-600 text-white',
    subtle: 'bg-green-100 text-green-800',
    outline: 'border border-green-600 text-green-600',
  },
  teal: {
    solid: 'bg-teal-600 text-white',
    subtle: 'bg-teal-100 text-teal-800',
    outline: 'border border-teal-600 text-teal-600',
  },
  blue: {
    solid: 'bg-blue-600 text-white',
    subtle: 'bg-blue-100 text-blue-800',
    outline: 'border border-blue-600 text-blue-600',
  },
  cyan: {
    solid: 'bg-cyan-600 text-white',
    subtle: 'bg-cyan-100 text-cyan-800',
    outline: 'border border-cyan-600 text-cyan-600',
  },
  purple: {
    solid: 'bg-purple-600 text-white',
    subtle: 'bg-purple-100 text-purple-800',
    outline: 'border border-purple-600 text-purple-600',
  },
  pink: {
    solid: 'bg-pink-600 text-white',
    subtle: 'bg-pink-100 text-pink-800',
    outline: 'border border-pink-600 text-pink-600',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-sm',
  lg: 'px-2.5 py-1 text-base',
};

export function Badge(props: BadgeProps) {
  const {
    children,
    variant = 'subtle',
    color = 'gray',
    size = 'md',
    rounded = false,
    className = '',
  } = props;

  const classes = [
    'inline-flex items-center font-medium',
    colorStyles[color][variant],
    sizeStyles[size],
    rounded ? 'rounded-full' : 'rounded',
    className,
  ].join(' ');

  return <span className={classes}>{children}</span>;
}

/**
 * Status Indicator - Small dot badge for status
 */
export type StatusIndicatorStatus = 'online' | 'offline' | 'busy' | 'away' | 'idle';

export interface StatusIndicatorProps {
  status: StatusIndicatorStatus;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusColors: Record<StatusIndicatorStatus, string> = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
  away: 'bg-yellow-500',
  idle: 'bg-gray-300',
};

const statusSizes: Record<string, string> = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

export function StatusIndicator(props: StatusIndicatorProps) {
  const { status, label, size = 'md', className = '' } = props;

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span
        className={`${statusSizes[size]} ${statusColors[status]} rounded-full`}
        aria-hidden="true"
      />
      {label && <span className="ml-2 text-sm text-gray-600">{label}</span>}
    </span>
  );
}

/**
 * Notification Badge - For counts
 */
export interface NotificationBadgeProps {
  count: number;
  max?: number;
  showZero?: boolean;
  color?: 'red' | 'blue' | 'green' | 'gray';
  className?: string;
}

export function NotificationBadge(props: NotificationBadgeProps) {
  const {
    count,
    max = 99,
    showZero = false,
    color = 'red',
    className = '',
  } = props;

  if (count === 0 && !showZero) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  const colorStyles = {
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    gray: 'bg-gray-500 text-white',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        min-w-[1.25rem] h-5 px-1.5
        text-xs font-bold rounded-full
        ${colorStyles[color]}
        ${className}
      `}
    >
      {displayCount}
    </span>
  );
}
