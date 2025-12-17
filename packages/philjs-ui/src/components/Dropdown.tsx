/**
 * PhilJS UI - Dropdown Component
 */

import { signal, effect } from 'philjs-core';

export type DropdownPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

export interface DropdownProps {
  trigger: any;
  children: any;
  placement?: DropdownPlacement;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  closeOnSelect?: boolean;
  className?: string;
}

export function Dropdown(props: DropdownProps) {
  const {
    trigger,
    children,
    placement = 'bottom-start',
    isOpen: controlledIsOpen,
    onOpenChange,
    closeOnSelect = true,
    className = '',
  } = props;

  const internalIsOpen = signal(false);
  const isOpen = controlledIsOpen ?? internalIsOpen();

  let dropdownRef: HTMLDivElement | null = null;

  const toggleOpen = () => {
    const newValue = !isOpen;
    if (controlledIsOpen === undefined) {
      internalIsOpen.set(newValue);
    }
    onOpenChange?.(newValue);
  };

  const close = () => {
    if (controlledIsOpen === undefined) {
      internalIsOpen.set(false);
    }
    onOpenChange?.(false);
  };

  effect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef && !dropdownRef.contains(e.target as Node) && isOpen) {
        close();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  });

  const placementStyles: Record<DropdownPlacement, string> = {
    'bottom-start': 'top-full left-0 mt-1',
    'bottom-end': 'top-full right-0 mt-1',
    'top-start': 'bottom-full left-0 mb-1',
    'top-end': 'bottom-full right-0 mb-1',
  };

  const handleItemClick = () => {
    if (closeOnSelect) {
      close();
    }
  };

  return (
    <div ref={(el: any) => (dropdownRef = el)} className="relative inline-block">
      <div onClick={toggleOpen}>{trigger}</div>

      {isOpen && (
        <div
          role="menu"
          className={`
            absolute z-50
            ${placementStyles[placement]}
            min-w-[160px]
            bg-white rounded-md shadow-lg border border-gray-200
            py-1
            ${className}
          `}
          onClick={handleItemClick}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Dropdown Item
 */
export interface DropdownItemProps {
  children: any;
  onClick?: () => void;
  disabled?: boolean;
  icon?: any;
  danger?: boolean;
  className?: string;
}

export function DropdownItem(props: DropdownItemProps) {
  const {
    children,
    onClick,
    disabled = false,
    icon,
    danger = false,
    className = '',
  } = props;

  const handleClick = () => {
    if (!disabled) {
      onClick?.();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      role="menuitem"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={`
        w-full px-4 py-2 text-left text-sm
        flex items-center
        ${danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-gray-700 hover:bg-gray-100'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:bg-gray-100
        ${className}
      `}
    >
      {icon && <span className="mr-2 w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
}

/**
 * Dropdown Divider
 */
export function DropdownDivider() {
  return <hr className="my-1 border-gray-200" />;
}

/**
 * Dropdown Label
 */
export function DropdownLabel(props: { children: any }) {
  return (
    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {props.children}
    </div>
  );
}
