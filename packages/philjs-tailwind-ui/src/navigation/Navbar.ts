/**
 * Navbar Component
 * Responsive navigation bar with mobile menu support
 */

import { jsx, signal } from '@philjs/core';
import { cn, getValue } from '../utils.js';
import type { BaseProps, WithChildren, MaybeSignal } from '../types.js';

export interface NavbarProps extends BaseProps, WithChildren {
  /** Brand/logo element */
  brand?: JSX.Element | (() => JSX.Element);
  /** Fixed to top */
  fixed?: boolean;
  /** Sticky positioning */
  sticky?: boolean;
  /** Background variant */
  variant?: 'solid' | 'transparent' | 'blur';
  /** Color scheme */
  color?: 'light' | 'dark' | 'primary';
  /** Show border bottom */
  bordered?: boolean;
  /** Height */
  height?: 'sm' | 'md' | 'lg';
  /** Maximum width */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Center content */
  centered?: boolean;
}

const heightClasses = {
  sm: 'h-12',
  md: 'h-16',
  lg: 'h-20',
};

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

const variantClasses = {
  solid: 'bg-white dark:bg-gray-900',
  transparent: 'bg-transparent',
  blur: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md',
};

const colorClasses = {
  light: 'text-gray-800 dark:text-gray-200',
  dark: 'bg-gray-900 text-white dark:bg-gray-800',
  primary: 'bg-blue-600 text-white dark:bg-blue-700',
};

export function Navbar(props: NavbarProps): JSX.Element {
  const {
    brand,
    fixed = false,
    sticky = false,
    variant = 'solid',
    color = 'light',
    bordered = true,
    height = 'md',
    maxWidth = 'xl',
    centered = false,
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  const navClasses = cn(
    'w-full',
    heightClasses[height],
    variantClasses[variant],
    color !== 'light' && colorClasses[color],
    fixed && 'fixed top-0 left-0 right-0 z-40',
    sticky && 'sticky top-0 z-40',
    bordered && 'border-b border-gray-200 dark:border-gray-700',
    className
  );

  const containerClasses = cn(
    'h-full mx-auto px-4 sm:px-6 lg:px-8',
    'flex items-center',
    centered ? 'justify-center' : 'justify-between',
    maxWidthClasses[maxWidth]
  );

  return jsx('nav', {
    class: navClasses,
    id,
    'data-testid': testId,
    role: 'navigation',
    'aria-label': 'Main navigation',
    ...rest,
    children: jsx('div', {
      class: containerClasses,
      children: [
        // Brand
        brand && jsx('div', {
          class: 'flex-shrink-0',
          children: typeof brand === 'function' ? brand() : brand,
        }),
        // Navigation items
        jsx('div', {
          class: cn(
            'flex items-center',
            centered ? 'gap-8' : 'flex-1 justify-end gap-4'
          ),
          children,
        }),
      ],
    }),
  });
}

// Navbar Item
export interface NavbarItemProps extends BaseProps, WithChildren {
  /** Link href */
  href?: string;
  /** Active state */
  active?: boolean | MaybeSignal<boolean>;
  /** Disabled state */
  disabled?: boolean;
  /** Click handler */
  onClick?: (e: MouseEvent) => void;
}

export function NavbarItem(props: NavbarItemProps): JSX.Element {
  const {
    href,
    active,
    disabled = false,
    onClick,
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  const isActive = getValue(active as MaybeSignal<boolean>) || false;

  const itemClasses = cn(
    'px-3 py-2 rounded-md text-sm font-medium',
    'transition-colors duration-200',
    isActive
      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800',
    disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    className
  );

  if (href && !disabled) {
    return jsx('a', {
      href,
      class: itemClasses,
      id,
      'data-testid': testId,
      'aria-current': isActive ? 'page' : undefined,
      onclick: onClick,
      ...rest,
      children,
    });
  }

  return jsx('button', {
    type: 'button',
    class: itemClasses,
    id,
    'data-testid': testId,
    disabled,
    'aria-current': isActive ? 'page' : undefined,
    onclick: onClick,
    ...rest,
    children,
  });
}

// Mobile Menu
export interface MobileMenuProps extends BaseProps, WithChildren {
  /** Open state */
  isOpen?: boolean | MaybeSignal<boolean>;
  /** On close callback */
  onClose?: () => void;
}

export function MobileMenu(props: MobileMenuProps): JSX.Element {
  const {
    isOpen,
    onClose,
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  const open = getValue(isOpen as MaybeSignal<boolean>) || false;

  if (!open) {
    return jsx('div', { style: { display: 'none' } });
  }

  return jsx('div', {
    class: cn(
      'fixed inset-0 z-50',
      className
    ),
    id,
    'data-testid': testId,
    ...rest,
    children: [
      // Backdrop
      jsx('div', {
        class: 'fixed inset-0 bg-black/50',
        onclick: onClose,
        'aria-hidden': 'true',
      }),
      // Menu panel
      jsx('div', {
        class: cn(
          'fixed inset-y-0 right-0 w-full max-w-sm',
          'bg-white dark:bg-gray-900',
          'shadow-xl',
          'transform transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        ),
        role: 'dialog',
        'aria-modal': 'true',
        children: [
          // Close button
          jsx('div', {
            class: 'flex justify-end p-4',
            children: jsx('button', {
              type: 'button',
              class: cn(
                'p-2 rounded-md',
                'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              ),
              onclick: onClose,
              'aria-label': 'Close menu',
              children: jsx('svg', {
                class: 'w-6 h-6',
                fill: 'none',
                stroke: 'currentColor',
                viewBox: '0 0 24 24',
                children: jsx('path', {
                  'stroke-linecap': 'round',
                  'stroke-linejoin': 'round',
                  'stroke-width': '2',
                  d: 'M6 18L18 6M6 6l12 12',
                }),
              }),
            }),
          }),
          // Menu content
          jsx('div', {
            class: 'px-4 py-2 space-y-1',
            children,
          }),
        ],
      }),
    ],
  });
}

// Menu Toggle Button
export interface MenuToggleProps extends BaseProps {
  /** Open state */
  isOpen?: boolean | MaybeSignal<boolean>;
  /** Toggle handler */
  onToggle?: () => void;
  /** Aria label */
  ariaLabel?: string;
}

export function MenuToggle(props: MenuToggleProps): JSX.Element {
  const {
    isOpen,
    onToggle,
    ariaLabel = 'Toggle menu',
    class: className,
    id,
    testId,
    ...rest
  } = props;

  const open = getValue(isOpen as MaybeSignal<boolean>) || false;

  return jsx('button', {
    type: 'button',
    class: cn(
      'p-2 rounded-md',
      'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
      'hover:bg-gray-100 dark:hover:bg-gray-800',
      'focus:outline-none focus:ring-2 focus:ring-blue-500',
      'lg:hidden',
      className
    ),
    id,
    'data-testid': testId,
    'aria-label': ariaLabel,
    'aria-expanded': open,
    onclick: onToggle,
    ...rest,
    children: jsx('svg', {
      class: 'w-6 h-6',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
      children: open
        ? jsx('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M6 18L18 6M6 6l12 12',
          })
        : jsx('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M4 6h16M4 12h16M4 18h16',
          }),
    }),
  });
}
