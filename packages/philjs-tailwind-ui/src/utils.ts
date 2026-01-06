/**
 * @philjs/tailwind-ui - Utility Functions
 * Helper utilities for UI components
 */

import type { Signal } from '@philjs/core';
import type { Size, ColorVariant, ButtonVariant, MaybeSignal } from './types.js';

// ============================================================================
// Class Name Utilities
// ============================================================================

type ClassValue = string | undefined | null | false | ClassValue[];

/**
 * Merge class names, filtering out falsy values
 */
export function cn(...classes: ClassValue[]): string {
  return classes
    .flat(Infinity)
    .filter((c): c is string => typeof c === 'string' && c.length > 0)
    .join(' ');
}

/**
 * Conditionally apply a class
 */
export function clsx(
  condition: boolean | undefined | null,
  trueClass: string,
  falseClass = ''
): string {
  return condition ? trueClass : falseClass;
}

// ============================================================================
// Signal Utilities
// ============================================================================

/**
 * Check if a value is a Signal
 */
export function isSignal<T>(value: unknown): value is Signal<T> {
  return (
    typeof value === 'function' &&
    'set' in value &&
    typeof (value as Signal<T>).set === 'function'
  );
}

/**
 * Get the current value from a MaybeSignal
 */
export function getValue<T>(value: MaybeSignal<T>): T {
  return isSignal(value) ? value() : value;
}

/**
 * Create a reactive getter for a MaybeSignal
 */
export function toGetter<T>(value: MaybeSignal<T>): () => T {
  return isSignal(value) ? value : () => value;
}

// ============================================================================
// Size Utilities
// ============================================================================

const sizeClasses: Record<Size, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const paddingSizeClasses: Record<Size, string> = {
  xs: 'px-2 py-1',
  sm: 'px-3 py-1.5',
  md: 'px-4 py-2',
  lg: 'px-5 py-2.5',
  xl: 'px-6 py-3',
};

const heightSizeClasses: Record<Size, string> = {
  xs: 'h-6',
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
  xl: 'h-14',
};

const iconSizeClasses: Record<Size, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export function getSizeClass(size: Size): string {
  return sizeClasses[size];
}

export function getPaddingClass(size: Size): string {
  return paddingSizeClasses[size];
}

export function getHeightClass(size: Size): string {
  return heightSizeClasses[size];
}

export function getIconSizeClass(size: Size): string {
  return iconSizeClasses[size];
}

// ============================================================================
// Color Utilities
// ============================================================================

const colorClasses: Record<ColorVariant, Record<ButtonVariant, string>> = {
  primary: {
    solid: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
    outline: 'border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950',
    ghost: 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950',
    link: 'text-blue-600 hover:underline dark:text-blue-400',
    soft: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300',
  },
  secondary: {
    solid: 'bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600',
    outline: 'border-gray-600 text-gray-600 hover:bg-gray-50 dark:border-gray-400 dark:text-gray-400 dark:hover:bg-gray-900',
    ghost: 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900',
    link: 'text-gray-600 hover:underline dark:text-gray-400',
    soft: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300',
  },
  success: {
    solid: 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600',
    outline: 'border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-950',
    ghost: 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950',
    link: 'text-green-600 hover:underline dark:text-green-400',
    soft: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300',
  },
  warning: {
    solid: 'bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600',
    outline: 'border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:border-yellow-400 dark:text-yellow-400 dark:hover:bg-yellow-950',
    ghost: 'text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-950',
    link: 'text-yellow-600 hover:underline dark:text-yellow-400',
    soft: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
  },
  error: {
    solid: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
    outline: 'border-red-600 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950',
    ghost: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950',
    link: 'text-red-600 hover:underline dark:text-red-400',
    soft: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300',
  },
  info: {
    solid: 'bg-cyan-600 text-white hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600',
    outline: 'border-cyan-600 text-cyan-600 hover:bg-cyan-50 dark:border-cyan-400 dark:text-cyan-400 dark:hover:bg-cyan-950',
    ghost: 'text-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-950',
    link: 'text-cyan-600 hover:underline dark:text-cyan-400',
    soft: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900 dark:text-cyan-300',
  },
  neutral: {
    solid: 'bg-gray-800 text-white hover:bg-gray-900 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100',
    outline: 'border-gray-800 text-gray-800 hover:bg-gray-50 dark:border-gray-200 dark:text-gray-200 dark:hover:bg-gray-900',
    ghost: 'text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800',
    link: 'text-gray-800 hover:underline dark:text-gray-200',
    soft: 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200',
  },
};

export function getColorClass(color: ColorVariant, variant: ButtonVariant): string {
  return colorClasses[color]?.[variant] ?? colorClasses.primary.solid;
}

// ============================================================================
// Accessibility Utilities
// ============================================================================

/**
 * Generate a unique ID
 */
let idCounter = 0;
export function generateId(prefix = 'philjs'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Create ARIA attributes for a component
 */
export function createAriaProps(options: {
  label?: string;
  describedBy?: string;
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  controls?: string;
  owns?: string;
  haspopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  live?: 'polite' | 'assertive' | 'off';
  role?: string;
}): Record<string, string | boolean | undefined> {
  const props: Record<string, string | boolean | undefined> = {};

  if (options.label) props['aria-label'] = options.label;
  if (options.describedBy) props['aria-describedby'] = options.describedBy;
  if (options.expanded !== undefined) props['aria-expanded'] = options.expanded;
  if (options.selected !== undefined) props['aria-selected'] = options.selected;
  if (options.checked !== undefined) props['aria-checked'] = options.checked;
  if (options.disabled) props['aria-disabled'] = options.disabled;
  if (options.hidden) props['aria-hidden'] = options.hidden;
  if (options.controls) props['aria-controls'] = options.controls;
  if (options.owns) props['aria-owns'] = options.owns;
  if (options.haspopup) props['aria-haspopup'] = String(options.haspopup);
  if (options.live) props['aria-live'] = options.live;
  if (options.role) props.role = options.role;

  return props;
}

// ============================================================================
// Keyboard Utilities
// ============================================================================

export const Keys = {
  Enter: 'Enter',
  Space: ' ',
  Escape: 'Escape',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  Home: 'Home',
  End: 'End',
  Tab: 'Tab',
  Backspace: 'Backspace',
  Delete: 'Delete',
} as const;

/**
 * Check if a keyboard event matches specific keys
 */
export function matchesKey(
  event: KeyboardEvent,
  ...keys: (keyof typeof Keys)[]
): boolean {
  return keys.some(key => event.key === Keys[key]);
}

// ============================================================================
// DOM Utilities
// ============================================================================

/**
 * Focus the first focusable element within a container
 */
export function focusFirstElement(container: HTMLElement): void {
  const focusable = container.querySelector<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  focusable?.focus();
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    )
  );
}

/**
 * Trap focus within a container
 */
export function createFocusTrap(container: HTMLElement): () => void {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  return () => container.removeEventListener('keydown', handleKeyDown);
}

// ============================================================================
// Transition Utilities
// ============================================================================

export const transitionClasses = {
  fade: {
    enter: 'transition-opacity duration-200',
    enterFrom: 'opacity-0',
    enterTo: 'opacity-100',
    leave: 'transition-opacity duration-150',
    leaveFrom: 'opacity-100',
    leaveTo: 'opacity-0',
  },
  scale: {
    enter: 'transition-all duration-200',
    enterFrom: 'opacity-0 scale-95',
    enterTo: 'opacity-100 scale-100',
    leave: 'transition-all duration-150',
    leaveFrom: 'opacity-100 scale-100',
    leaveTo: 'opacity-0 scale-95',
  },
  slideUp: {
    enter: 'transition-all duration-200',
    enterFrom: 'opacity-0 translate-y-4',
    enterTo: 'opacity-100 translate-y-0',
    leave: 'transition-all duration-150',
    leaveFrom: 'opacity-100 translate-y-0',
    leaveTo: 'opacity-0 translate-y-4',
  },
  slideDown: {
    enter: 'transition-all duration-200',
    enterFrom: 'opacity-0 -translate-y-4',
    enterTo: 'opacity-100 translate-y-0',
    leave: 'transition-all duration-150',
    leaveFrom: 'opacity-100 translate-y-0',
    leaveTo: 'opacity-0 -translate-y-4',
  },
  slideLeft: {
    enter: 'transition-all duration-200',
    enterFrom: 'opacity-0 translate-x-4',
    enterTo: 'opacity-100 translate-x-0',
    leave: 'transition-all duration-150',
    leaveFrom: 'opacity-100 translate-x-0',
    leaveTo: 'opacity-0 translate-x-4',
  },
  slideRight: {
    enter: 'transition-all duration-200',
    enterFrom: 'opacity-0 -translate-x-4',
    enterTo: 'opacity-100 translate-x-0',
    leave: 'transition-all duration-150',
    leaveFrom: 'opacity-100 translate-x-0',
    leaveTo: 'opacity-0 -translate-x-4',
  },
};
