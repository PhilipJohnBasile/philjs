/**
 * PhilJS UI - Spinner and Progress Components
 */
import type { JSX } from '@philjs/core/jsx-runtime';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type ProgressSize = 'xs' | 'sm' | 'md' | 'lg';
type ProgressColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple';
type SkeletonVariant = 'text' | 'circular' | 'rectangular';

const sizeStyles: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  thickness?: string;
  speed?: string;
  label?: string;
  className?: string;
}

export function Spinner(props: SpinnerProps): JSX.Element {
  const {
    size = 'md',
    color = 'text-blue-600',
    thickness = 'border-2',
    speed = 'animate-spin',
    label = 'Loading',
    className = '',
  } = props;

  return (
    <div role="status" className={`inline-flex items-center ${className}`}>
      <svg
        className={`${speed} ${sizeStyles[size]} ${color}`}
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
      <span className="sr-only">{label}</span>
    </div>
  );
}

const progressSizes: Record<ProgressSize, string> = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

const progressColors: Record<ProgressColor, string> = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  red: 'bg-red-600',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-600',
};

export interface ProgressProps {
  value: number;
  max?: number;
  size?: ProgressSize;
  color?: ProgressColor;
  showValue?: boolean;
  striped?: boolean;
  animated?: boolean;
  label?: string;
  className?: string;
}

export function Progress(props: ProgressProps): JSX.Element {
  const {
    value,
    max = 100,
    size = 'md',
    color = 'blue',
    showValue = false,
    striped = false,
    animated = false,
    label,
    className = '',
  } = props;

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const stripedClass = striped
    ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:1rem_100%]'
    : '';

  const animatedClass = animated
    ? 'animate-[progress-stripes_1s_linear_infinite]'
    : '';

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between mb-1 text-sm">
          {label && <span className="text-gray-700">{label}</span>}
          {showValue && (
            <span className="text-gray-500">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${progressSizes[size]}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={`
            ${progressSizes[size]}
            ${progressColors[color]}
            ${stripedClass}
            ${animatedClass}
            rounded-full transition-all duration-300
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  color?: string;
  trackColor?: string;
  showValue?: boolean;
  className?: string;
}

export function CircularProgress(props: CircularProgressProps): JSX.Element {
  const {
    value,
    max = 100,
    size = 48,
    thickness = 4,
    color = '#3b82f6',
    trackColor = '#e5e7eb',
    showValue = false,
    className = '',
  } = props;

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - thickness) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300"
        />
      </svg>
      {showValue && (
        <span className="absolute text-sm font-medium text-gray-700">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function Skeleton(props: SkeletonProps): JSX.Element {
  const {
    variant = 'text',
    width,
    height,
    className = '',
  } = props;

  const variantStyles: Record<SkeletonVariant, string> = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  const style: Record<string, string> = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'circular' && width && !height) {
    style.height = style.width;
  }

  return (
    <div
      className={`
        animate-pulse bg-gray-200
        ${variantStyles[variant]}
        ${className}
      `}
      style={style}
      aria-hidden="true"
    />
  );
}
