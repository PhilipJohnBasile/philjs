/**
 * Menu Component
 * Dropdown menu for actions and navigation
 */

import { jsx, signal } from '@philjs/core';
import { cn, getValue, generateId } from '../utils.js';
import type { BaseProps, WithChildren, Size, MaybeSignal } from '../types.js';

export interface MenuItemData {
  id: string;
  label: string | JSX.Element;
  icon?: JSX.Element | (() => JSX.Element);
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
  href?: string;
}

export interface MenuGroupData {
  label?: string;
  items: MenuItemData[];
}

export interface MenuProps extends BaseProps {
  /** Menu items or groups */
  items: (MenuItemData | MenuGroupData)[];
  /** Trigger element */
  trigger: JSX.Element | ((isOpen: boolean) => JSX.Element);
  /** Open state */
  isOpen?: boolean | MaybeSignal<boolean>;
  /** On open change */
  onOpenChange?: (isOpen: boolean) => void;
  /** Size variant */
  size?: Size;
  /** Placement */
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'right-start' | 'left-start';
  /** Close on item click */
  closeOnSelect?: boolean;
  /** Min width */
  minWidth?: number | string;
}

const sizeClasses = {
  xs: 'text-xs py-1',
  sm: 'text-sm py-1.5',
  md: 'text-sm py-2',
  lg: 'text-base py-2.5',
  xl: 'text-lg py-3',
};

const itemPaddingClasses = {
  xs: 'px-2 py-1',
  sm: 'px-3 py-1.5',
  md: 'px-3 py-2',
  lg: 'px-4 py-2.5',
  xl: 'px-4 py-3',
};

const placementClasses = {
  'bottom-start': 'top-full left-0 mt-1',
  'bottom-end': 'top-full right-0 mt-1',
  'top-start': 'bottom-full left-0 mb-1',
  'top-end': 'bottom-full right-0 mb-1',
  'right-start': 'left-full top-0 ml-1',
  'left-start': 'right-full top-0 mr-1',
};

function isMenuGroup(item: MenuItemData | MenuGroupData): item is MenuGroupData {
  return 'items' in item;
}

export function Menu(props: MenuProps): JSX.Element {
  const {
    items,
    trigger,
    isOpen: controlledIsOpen,
    onOpenChange,
    size = 'md',
    placement = 'bottom-start',
    closeOnSelect = true,
    minWidth = 160,
    class: className,
    id: providedId,
    testId,
    ...rest
  } = props;

  const id = providedId || generateId('menu');
  const internalIsOpen = signal(false);

  const isOpen = () =>
    controlledIsOpen !== undefined ? getValue(controlledIsOpen) : internalIsOpen();

  const setIsOpen = (open: boolean) => {
    if (controlledIsOpen === undefined) {
      internalIsOpen.set(open);
    }
    onOpenChange?.(open);
  };

  const toggleMenu = () => setIsOpen(!isOpen());
  const closeMenu = () => setIsOpen(false);

  const handleItemClick = (item: MenuItemData) => {
    if (item.disabled) return;

    item.onClick?.();

    if (closeOnSelect) {
      closeMenu();
    }
  };

  const renderMenuItem = (item: MenuItemData) => {
    const itemClasses = cn(
      'w-full flex items-center gap-2',
      itemPaddingClasses[size],
      'cursor-pointer transition-colors duration-150',
      'focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700',
      item.disabled
        ? 'opacity-50 cursor-not-allowed'
        : item.danger
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    );

    const content = [
      // Icon
      item.icon && jsx('span', {
        class: 'w-4 h-4 flex-shrink-0',
        'aria-hidden': 'true',
        children: typeof item.icon === 'function' ? item.icon() : item.icon,
      }),
      // Label
      jsx('span', { class: 'flex-1 text-left', children: item.label }),
      // Shortcut
      item.shortcut && jsx('span', {
        class: 'text-xs text-gray-400 dark:text-gray-500 ml-4',
        children: item.shortcut,
      }),
    ];

    if (item.href && !item.disabled) {
      return jsx('a', {
        href: item.href,
        class: itemClasses,
        role: 'menuitem',
        onclick: (e: MouseEvent) => {
          handleItemClick(item);
        },
        children: content,
      });
    }

    return jsx('button', {
      type: 'button',
      class: itemClasses,
      role: 'menuitem',
      disabled: item.disabled,
      onclick: () => handleItemClick(item),
      children: content,
    });
  };

  const renderMenuContent = () => {
    const menuItems: JSX.Element[] = [];

    items.forEach((item, index) => {
      if (isMenuGroup(item)) {
        // Add separator before group (except first)
        if (index > 0) {
          menuItems.push(
            jsx('div', {
              class: 'my-1 h-px bg-gray-200 dark:bg-gray-700',
              role: 'separator',
            })
          );
        }

        // Group label
        if (item.label) {
          menuItems.push(
            jsx('div', {
              class: cn(
                'px-3 py-1.5 text-xs font-semibold uppercase tracking-wider',
                'text-gray-500 dark:text-gray-400'
              ),
              children: item.label,
            })
          );
        }

        // Group items
        item.items.forEach(groupItem => {
          menuItems.push(renderMenuItem(groupItem));
        });
      } else {
        menuItems.push(renderMenuItem(item));
      }
    });

    return menuItems;
  };

  // Render trigger
  const triggerElement = typeof trigger === 'function' ? trigger(isOpen()) : trigger;

  return jsx('div', {
    class: cn('relative inline-block', className),
    id,
    'data-testid': testId,
    ...rest,
    children: [
      // Trigger wrapper
      jsx('div', {
        onclick: toggleMenu,
        'aria-haspopup': 'menu',
        'aria-expanded': isOpen(),
        children: triggerElement,
      }),
      // Backdrop (for closing)
      isOpen() && jsx('div', {
        class: 'fixed inset-0 z-40',
        onclick: closeMenu,
        'aria-hidden': 'true',
      }),
      // Menu dropdown
      isOpen() && jsx('div', {
        class: cn(
          'absolute z-50',
          'bg-white dark:bg-gray-800',
          'border border-gray-200 dark:border-gray-700',
          'rounded-md shadow-lg',
          'overflow-hidden',
          sizeClasses[size],
          placementClasses[placement]
        ),
        style: { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth },
        role: 'menu',
        'aria-orientation': 'vertical',
        children: renderMenuContent(),
      }),
    ],
  });
}

// Dropdown component (alias for Menu with simpler API)
export interface DropdownProps extends Omit<MenuProps, 'items'> {
  children: JSX.Element | JSX.Element[];
}

export function Dropdown(props: DropdownProps): JSX.Element {
  const {
    children,
    trigger,
    isOpen: controlledIsOpen,
    onOpenChange,
    placement = 'bottom-start',
    minWidth = 160,
    class: className,
    id: providedId,
    testId,
    ...rest
  } = props;

  const id = providedId || generateId('dropdown');
  const internalIsOpen = signal(false);

  const isOpen = () =>
    controlledIsOpen !== undefined ? getValue(controlledIsOpen) : internalIsOpen();

  const setIsOpen = (open: boolean) => {
    if (controlledIsOpen === undefined) {
      internalIsOpen.set(open);
    }
    onOpenChange?.(open);
  };

  const toggleMenu = () => setIsOpen(!isOpen());
  const closeMenu = () => setIsOpen(false);

  const triggerElement = typeof trigger === 'function' ? trigger(isOpen()) : trigger;

  return jsx('div', {
    class: cn('relative inline-block', className),
    id,
    'data-testid': testId,
    ...rest,
    children: [
      jsx('div', {
        onclick: toggleMenu,
        'aria-haspopup': 'true',
        'aria-expanded': isOpen(),
        children: triggerElement,
      }),
      isOpen() && jsx('div', {
        class: 'fixed inset-0 z-40',
        onclick: closeMenu,
        'aria-hidden': 'true',
      }),
      isOpen() && jsx('div', {
        class: cn(
          'absolute z-50',
          'bg-white dark:bg-gray-800',
          'border border-gray-200 dark:border-gray-700',
          'rounded-md shadow-lg',
          'py-1',
          placementClasses[placement]
        ),
        style: { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth },
        children,
      }),
    ],
  });
}

// Dropdown Item
export interface DropdownItemProps extends BaseProps, WithChildren {
  /** Icon */
  icon?: JSX.Element;
  /** Disabled */
  disabled?: boolean;
  /** Danger style */
  danger?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Link href */
  href?: string;
}

export function DropdownItem(props: DropdownItemProps): JSX.Element {
  const {
    icon,
    disabled = false,
    danger = false,
    onClick,
    href,
    class: className,
    children,
    id,
    testId,
    ...rest
  } = props;

  const itemClasses = cn(
    'w-full flex items-center gap-2 px-3 py-2',
    'text-sm cursor-pointer transition-colors duration-150',
    'focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700',
    disabled
      ? 'opacity-50 cursor-not-allowed'
      : danger
        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
    className
  );

  const content = [
    icon && jsx('span', { class: 'w-4 h-4', children: icon }),
    jsx('span', { children }),
  ];

  if (href && !disabled) {
    return jsx('a', {
      href,
      class: itemClasses,
      id,
      'data-testid': testId,
      onclick: onClick,
      ...rest,
      children: content,
    });
  }

  return jsx('button', {
    type: 'button',
    class: itemClasses,
    id,
    'data-testid': testId,
    disabled,
    onclick: onClick,
    ...rest,
    children: content,
  });
}

// Dropdown Divider
export function DropdownDivider(): JSX.Element {
  return jsx('div', {
    class: 'my-1 h-px bg-gray-200 dark:bg-gray-700',
    role: 'separator',
  });
}
