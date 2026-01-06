/**
 * Skeleton Component
 * Loading placeholder with shimmer effect
 */

import { jsx } from '@philjs/core';
import { cn } from '../utils.js';
import type { BaseProps, WithChildren } from '../types.js';

export interface SkeletonProps extends BaseProps {
  /** Width (CSS value or number for pixels) */
  width?: string | number;
  /** Height (CSS value or number for pixels) */
  height?: string | number;
  /** Border radius variant */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Animation type */
  animation?: 'pulse' | 'shimmer' | 'none';
  /** Circle skeleton */
  circle?: boolean;
  /** Number of lines (for text skeleton) */
  lines?: number;
  /** Line height for text skeleton */
  lineHeight?: number;
  /** Spacing between lines */
  lineSpacing?: number;
}

const radiusClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

const animationClasses = {
  pulse: 'animate-pulse',
  shimmer: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]',
  none: '',
};

export function Skeleton(props: SkeletonProps): JSX.Element {
  const {
    width,
    height,
    radius = 'md',
    animation = 'pulse',
    circle = false,
    lines,
    lineHeight = 16,
    lineSpacing = 8,
    class: className,
    id,
    testId,
    ...rest
  } = props;

  // Multi-line text skeleton
  if (lines && lines > 1) {
    return jsx('div', {
      class: cn('space-y-2', className),
      id,
      'data-testid': testId,
      'aria-busy': 'true',
      'aria-live': 'polite',
      ...rest,
      children: Array.from({ length: lines }).map((_, index) => {
        // Make last line shorter
        const lineWidth = index === lines - 1 ? '75%' : '100%';

        return jsx('div', {
          key: index,
          class: cn(
            'bg-gray-200 dark:bg-gray-700',
            animationClasses[animation],
            radiusClasses[radius]
          ),
          style: {
            width: lineWidth,
            height: `${lineHeight}px`,
            marginTop: index > 0 ? `${lineSpacing}px` : undefined,
          },
        });
      }),
    });
  }

  // Single skeleton element
  const style: Record<string, string | number | undefined> = {};

  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }

  if (height !== undefined) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  } else if (!circle) {
    style.height = '16px'; // Default height
  }

  if (circle && width !== undefined) {
    style.height = style.width; // Make it square for circle
  }

  const skeletonClasses = cn(
    'bg-gray-200 dark:bg-gray-700',
    animationClasses[animation],
    circle ? 'rounded-full' : radiusClasses[radius],
    className
  );

  return jsx('div', {
    class: skeletonClasses,
    style: Object.keys(style).length > 0 ? style : undefined,
    id,
    'data-testid': testId,
    'aria-busy': 'true',
    'aria-live': 'polite',
    ...rest,
  });
}

// Skeleton Text
export interface SkeletonTextProps extends Omit<SkeletonProps, 'circle' | 'width' | 'height'> {
  /** Number of lines */
  lines?: number;
  /** Line height */
  lineHeight?: number;
  /** Spacing between lines */
  spacing?: number;
  /** Width of lines (can be array for different widths) */
  widths?: (string | number)[];
}

export function SkeletonText(props: SkeletonTextProps): JSX.Element {
  const {
    lines = 3,
    lineHeight = 14,
    spacing = 8,
    widths,
    radius = 'sm',
    animation = 'pulse',
    class: className,
    id,
    testId,
    ...rest
  } = props;

  const defaultWidths = ['100%', '100%', '75%'];

  return jsx('div', {
    class: cn('space-y-2', className),
    id,
    'data-testid': testId,
    'aria-busy': 'true',
    'aria-live': 'polite',
    ...rest,
    children: Array.from({ length: lines }).map((_, index) => {
      const lineWidth = widths?.[index] ?? defaultWidths[index] ?? (index === lines - 1 ? '75%' : '100%');

      return Skeleton({
        width: lineWidth,
        height: lineHeight,
        radius,
        animation,
      });
    }),
  });
}

// Skeleton Circle
export function SkeletonCircle(props: Omit<SkeletonProps, 'circle' | 'radius'>): JSX.Element {
  return Skeleton({ ...props, circle: true });
}

// Common Skeleton Layouts
export interface SkeletonCardProps extends BaseProps {
  /** Show image area */
  hasImage?: boolean;
  /** Image height */
  imageHeight?: number;
  /** Number of text lines */
  textLines?: number;
}

export function SkeletonCard(props: SkeletonCardProps): JSX.Element {
  const {
    hasImage = true,
    imageHeight = 200,
    textLines = 3,
    class: className,
    id,
    testId,
    ...rest
  } = props;

  return jsx('div', {
    class: cn(
      'bg-white dark:bg-gray-800',
      'rounded-lg shadow-md overflow-hidden',
      className
    ),
    id,
    'data-testid': testId,
    'aria-busy': 'true',
    'aria-live': 'polite',
    ...rest,
    children: [
      hasImage && Skeleton({
        width: '100%',
        height: imageHeight,
        radius: 'none',
      }),
      jsx('div', {
        class: 'p-4 space-y-4',
        children: [
          // Title
          Skeleton({ width: '70%', height: 20 }),
          // Text lines
          SkeletonText({ lines: textLines }),
        ],
      }),
    ],
  });
}

export interface SkeletonListItemProps extends BaseProps {
  /** Show avatar */
  hasAvatar?: boolean;
  /** Avatar size */
  avatarSize?: number;
  /** Number of text lines */
  textLines?: number;
}

export function SkeletonListItem(props: SkeletonListItemProps): JSX.Element {
  const {
    hasAvatar = true,
    avatarSize = 40,
    textLines = 2,
    class: className,
    id,
    testId,
    ...rest
  } = props;

  return jsx('div', {
    class: cn('flex items-start gap-3 p-3', className),
    id,
    'data-testid': testId,
    'aria-busy': 'true',
    'aria-live': 'polite',
    ...rest,
    children: [
      hasAvatar && SkeletonCircle({ width: avatarSize, height: avatarSize }),
      jsx('div', {
        class: 'flex-1 space-y-2',
        children: SkeletonText({ lines: textLines, lineHeight: 12 }),
      }),
    ],
  });
}

// Skeleton Table
export interface SkeletonTableProps extends BaseProps {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Show header */
  showHeader?: boolean;
}

export function SkeletonTable(props: SkeletonTableProps): JSX.Element {
  const {
    rows = 5,
    columns = 4,
    showHeader = true,
    class: className,
    id,
    testId,
    ...rest
  } = props;

  return jsx('div', {
    class: cn('w-full', className),
    id,
    'data-testid': testId,
    'aria-busy': 'true',
    'aria-live': 'polite',
    ...rest,
    children: [
      showHeader && jsx('div', {
        class: 'flex gap-4 p-3 bg-gray-50 dark:bg-gray-800',
        children: Array.from({ length: columns }).map(() =>
          Skeleton({ height: 16, width: '100%' })
        ),
      }),
      ...Array.from({ length: rows }).map((_, rowIndex) =>
        jsx('div', {
          key: rowIndex,
          class: 'flex gap-4 p-3 border-b border-gray-100 dark:border-gray-700',
          children: Array.from({ length: columns }).map((_, colIndex) =>
            Skeleton({
              height: 14,
              width: colIndex === 0 ? '60%' : '100%',
            })
          ),
        })
      ),
    ],
  });
}
