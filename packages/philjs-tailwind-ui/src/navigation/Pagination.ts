/**
 * Pagination Component
 * Page navigation for lists and tables
 */

import { jsx, signal, memo } from '@philjs/core';
import { cn, getValue } from '../utils.js';
import type { BaseProps, Size, MaybeSignal } from '../types.js';

export interface PaginationProps extends BaseProps {
  /** Current page (1-indexed) */
  page?: number | MaybeSignal<number>;
  /** Default page */
  defaultPage?: number;
  /** Total number of pages */
  totalPages: number;
  /** Page change handler */
  onChange?: (page: number) => void;
  /** Size variant */
  size?: Size;
  /** Number of sibling pages to show */
  siblingCount?: number;
  /** Number of boundary pages to show */
  boundaryCount?: number;
  /** Show first/last buttons */
  showFirstLast?: boolean;
  /** Show prev/next buttons */
  showPrevNext?: boolean;
  /** Variant style */
  variant?: 'outline' | 'solid' | 'ghost';
  /** Shape of page buttons */
  shape?: 'square' | 'rounded' | 'circle';
  /** Color variant */
  color?: 'primary' | 'neutral';
  /** Disabled state */
  disabled?: boolean;
}

const sizeClasses = {
  xs: 'h-6 min-w-6 text-xs',
  sm: 'h-8 min-w-8 text-sm',
  md: 'h-10 min-w-10 text-sm',
  lg: 'h-12 min-w-12 text-base',
  xl: 'h-14 min-w-14 text-lg',
};

const iconSizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

const shapeClasses = {
  square: 'rounded-none',
  rounded: 'rounded-md',
  circle: 'rounded-full',
};

export function Pagination(props: PaginationProps): JSX.Element {
  const {
    page,
    defaultPage = 1,
    totalPages,
    onChange,
    size = 'md',
    siblingCount = 1,
    boundaryCount = 1,
    showFirstLast = true,
    showPrevNext = true,
    variant = 'outline',
    shape = 'rounded',
    color = 'primary',
    disabled = false,
    class: className,
    id,
    testId,
    ...rest
  } = props;

  // Internal state
  const internalPage = signal(defaultPage);

  const getCurrentPage = () => page !== undefined ? getValue(page) : internalPage();

  const handlePageChange = (newPage: number) => {
    if (disabled || newPage < 1 || newPage > totalPages || newPage === getCurrentPage()) {
      return;
    }

    if (page === undefined) {
      internalPage.set(newPage);
    }
    onChange?.(newPage);
  };

  // Generate page range
  const getPageRange = (): (number | 'ellipsis')[] => {
    const currentPage = getCurrentPage();
    const range: (number | 'ellipsis')[] = [];

    // Calculate range boundaries
    const startPages = Array.from({ length: Math.min(boundaryCount, totalPages) }, (_, i) => i + 1);
    const endPages = Array.from(
      { length: Math.min(boundaryCount, totalPages) },
      (_, i) => totalPages - i
    ).reverse();

    const siblingsStart = Math.max(
      Math.min(currentPage - siblingCount, totalPages - boundaryCount - siblingCount * 2 - 1),
      boundaryCount + 2
    );
    const siblingsEnd = Math.min(
      Math.max(currentPage + siblingCount, boundaryCount + siblingCount * 2 + 2),
      totalPages - boundaryCount - 1
    );

    // Build the range
    range.push(...startPages);

    // Left ellipsis
    if (siblingsStart > boundaryCount + 2) {
      range.push('ellipsis');
    } else if (boundaryCount + 1 < totalPages - boundaryCount) {
      range.push(boundaryCount + 1);
    }

    // Sibling pages
    for (let i = siblingsStart; i <= siblingsEnd; i++) {
      if (i > boundaryCount && i <= totalPages - boundaryCount) {
        range.push(i);
      }
    }

    // Right ellipsis
    if (siblingsEnd < totalPages - boundaryCount - 1) {
      range.push('ellipsis');
    } else if (totalPages - boundaryCount > boundaryCount) {
      range.push(totalPages - boundaryCount);
    }

    range.push(...endPages.filter(p => !range.includes(p)));

    // Remove duplicates and sort
    return Array.from(new Set(range)).sort((a, b) => {
      if (a === 'ellipsis') return 0;
      if (b === 'ellipsis') return 0;
      return a - b;
    });
  };

  const getButtonClasses = (isActive: boolean, isNavButton = false) => {
    const base = cn(
      'inline-flex items-center justify-center',
      'font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500',
      sizeClasses[size],
      shapeClasses[shape],
      !isNavButton && 'px-3',
      disabled && 'opacity-50 cursor-not-allowed'
    );

    if (variant === 'solid') {
      return cn(
        base,
        isActive
          ? 'bg-blue-600 text-white dark:bg-blue-500'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      );
    }

    if (variant === 'ghost') {
      return cn(
        base,
        isActive
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      );
    }

    // Outline variant (default)
    return cn(
      base,
      'border',
      isActive
        ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
    );
  };

  const currentPage = getCurrentPage();
  const pageRange = getPageRange();

  // Navigation icons
  const firstIcon = jsx('svg', {
    class: iconSizeClasses[size],
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    children: jsx('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M11 19l-7-7 7-7m8 14l-7-7 7-7',
    }),
  });

  const prevIcon = jsx('svg', {
    class: iconSizeClasses[size],
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    children: jsx('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M15 19l-7-7 7-7',
    }),
  });

  const nextIcon = jsx('svg', {
    class: iconSizeClasses[size],
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    children: jsx('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M9 5l7 7-7 7',
    }),
  });

  const lastIcon = jsx('svg', {
    class: iconSizeClasses[size],
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    children: jsx('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M13 5l7 7-7 7M5 5l7 7-7 7',
    }),
  });

  const buttons: JSX.Element[] = [];

  // First button
  if (showFirstLast) {
    buttons.push(
      jsx('button', {
        type: 'button',
        class: getButtonClasses(false, true),
        disabled: disabled || currentPage === 1,
        onclick: () => handlePageChange(1),
        'aria-label': 'Go to first page',
        children: firstIcon,
      })
    );
  }

  // Previous button
  if (showPrevNext) {
    buttons.push(
      jsx('button', {
        type: 'button',
        class: getButtonClasses(false, true),
        disabled: disabled || currentPage === 1,
        onclick: () => handlePageChange(currentPage - 1),
        'aria-label': 'Go to previous page',
        children: prevIcon,
      })
    );
  }

  // Page buttons
  let ellipsisCount = 0;
  pageRange.forEach(item => {
    if (item === 'ellipsis') {
      ellipsisCount++;
      buttons.push(
        jsx('span', {
          key: `ellipsis-${ellipsisCount}`,
          class: cn(
            'inline-flex items-center justify-center px-2',
            'text-gray-400 dark:text-gray-500',
            sizeClasses[size]
          ),
          children: '...',
        })
      );
    } else {
      const pageNum = item;
      const isActive = pageNum === currentPage;

      buttons.push(
        jsx('button', {
          type: 'button',
          class: getButtonClasses(isActive),
          disabled,
          'aria-label': `Go to page ${pageNum}`,
          'aria-current': isActive ? 'page' : undefined,
          onclick: () => handlePageChange(pageNum),
          children: String(pageNum),
        })
      );
    }
  });

  // Next button
  if (showPrevNext) {
    buttons.push(
      jsx('button', {
        type: 'button',
        class: getButtonClasses(false, true),
        disabled: disabled || currentPage === totalPages,
        onclick: () => handlePageChange(currentPage + 1),
        'aria-label': 'Go to next page',
        children: nextIcon,
      })
    );
  }

  // Last button
  if (showFirstLast) {
    buttons.push(
      jsx('button', {
        type: 'button',
        class: getButtonClasses(false, true),
        disabled: disabled || currentPage === totalPages,
        onclick: () => handlePageChange(totalPages),
        'aria-label': 'Go to last page',
        children: lastIcon,
      })
    );
  }

  return jsx('nav', {
    'aria-label': 'Pagination',
    class: cn('flex items-center gap-1', className),
    id,
    'data-testid': testId,
    ...rest,
    children: buttons,
  });
}
