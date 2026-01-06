/**
 * Breadcrumb Component
 * Navigation breadcrumb trail
 */

import { jsx } from '@philjs/core';
import { cn } from '../utils.js';
import type { BaseProps, Size } from '../types.js';

export interface BreadcrumbItem {
  label: string | JSX.Element;
  href?: string;
  icon?: JSX.Element | (() => JSX.Element);
  onClick?: (e: MouseEvent) => void;
}

export interface BreadcrumbProps extends BaseProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Size variant */
  size?: Size;
  /** Separator between items */
  separator?: 'slash' | 'chevron' | 'arrow' | 'dot' | JSX.Element;
  /** Show home icon for first item */
  showHomeIcon?: boolean;
  /** Maximum items to show (collapses middle items) */
  maxItems?: number;
  /** Aria label */
  ariaLabel?: string;
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

const iconSizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

const separatorIcons = {
  slash: '/',
  chevron: jsx('svg', {
    class: 'w-4 h-4',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    children: jsx('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M9 5l7 7-7 7',
    }),
  }),
  arrow: jsx('svg', {
    class: 'w-4 h-4',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    children: jsx('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M14 5l7 7m0 0l-7 7m7-7H3',
    }),
  }),
  dot: jsx('span', {
    class: 'w-1 h-1 rounded-full bg-current',
    'aria-hidden': 'true',
  }),
};

const homeIcon = jsx('svg', {
  class: 'w-4 h-4',
  fill: 'none',
  stroke: 'currentColor',
  viewBox: '0 0 24 24',
  'aria-hidden': 'true',
  children: jsx('path', {
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': '2',
    d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  }),
});

export function Breadcrumb(props: BreadcrumbProps): JSX.Element {
  const {
    items,
    size = 'md',
    separator = 'chevron',
    showHomeIcon = false,
    maxItems,
    ariaLabel = 'Breadcrumb',
    class: className,
    id,
    testId,
    ...rest
  } = props;

  // Get separator element
  const separatorElement = typeof separator === 'string'
    ? separatorIcons[separator]
    : separator;

  // Handle collapsed items
  let displayItems = items;
  let hasCollapsed = false;

  if (maxItems && items.length > maxItems) {
    const keepStart = Math.ceil(maxItems / 2);
    const keepEnd = Math.floor(maxItems / 2);
    displayItems = [
      ...items.slice(0, keepStart),
      { label: '...', href: undefined } as BreadcrumbItem,
      ...items.slice(-keepEnd),
    ];
    hasCollapsed = true;
  }

  const renderItem = (item: BreadcrumbItem, index: number, isLast: boolean) => {
    const isCollapsedPlaceholder = item.label === '...' && hasCollapsed;
    const isFirst = index === 0;

    const itemClasses = cn(
      'inline-flex items-center gap-1.5',
      isLast
        ? 'text-gray-500 dark:text-gray-400 font-medium'
        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
      'transition-colors duration-200'
    );

    const content = [
      // Home icon for first item
      isFirst && showHomeIcon && jsx('span', {
        class: iconSizeClasses[size],
        children: homeIcon,
      }),
      // Item icon
      item.icon && jsx('span', {
        class: iconSizeClasses[size],
        children: typeof item.icon === 'function' ? item.icon() : item.icon,
      }),
      // Label
      jsx('span', { children: item.label }),
    ];

    if (isCollapsedPlaceholder) {
      return jsx('span', {
        class: 'text-gray-400 dark:text-gray-500',
        children: '...',
      });
    }

    if (item.href && !isLast) {
      return jsx('a', {
        href: item.href,
        class: itemClasses,
        onclick: item.onClick,
        children: content,
      });
    }

    if (item.onClick && !isLast) {
      return jsx('button', {
        type: 'button',
        class: cn(itemClasses, 'cursor-pointer'),
        onclick: item.onClick,
        children: content,
      });
    }

    return jsx('span', {
      class: itemClasses,
      'aria-current': isLast ? 'page' : undefined,
      children: content,
    });
  };

  return jsx('nav', {
    'aria-label': ariaLabel,
    class: cn('flex', className),
    id,
    'data-testid': testId,
    ...rest,
    children: jsx('ol', {
      class: cn(
        'inline-flex items-center gap-2',
        sizeClasses[size]
      ),
      children: displayItems.map((item, index) => {
        const isLast = index === displayItems.length - 1;

        return jsx('li', {
          class: 'inline-flex items-center gap-2',
          children: [
            renderItem(item, index, isLast),
            !isLast && jsx('span', {
              class: 'text-gray-400 dark:text-gray-500 flex items-center',
              'aria-hidden': 'true',
              children: separatorElement,
            }),
          ],
        });
      }),
    }),
  });
}
