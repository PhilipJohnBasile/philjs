/**
 * PhilJS UI - useKeyboard Hook
 *
 * Keyboard event handling utilities for accessible components.
 */

import { effect, onCleanup } from '@philjs/core';

/**
 * Key constants for common keyboard navigation
 */
export const Keys = {
  Enter: 'Enter',
  Space: ' ',
  Escape: 'Escape',
  Tab: 'Tab',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  Backspace: 'Backspace',
  Delete: 'Delete',
} as const;

export type KeyName = keyof typeof Keys;

/**
 * Key handler map type
 */
export type KeyHandlers = {
  [K in keyof typeof Keys]?: (event: KeyboardEvent) => void;
} & {
  default?: (event: KeyboardEvent) => void;
};

/**
 * Options for useKeyboard
 */
export interface UseKeyboardOptions {
  /** Whether the handler is enabled (default: true) */
  enabled?: boolean | (() => boolean);
  /** Whether to prevent default behavior (default: false) */
  preventDefault?: boolean;
  /** Whether to stop propagation (default: false) */
  stopPropagation?: boolean;
  /** Capture phase (default: false) */
  capture?: boolean;
}

/**
 * Handles keyboard events on a target element.
 *
 * @example
 * ```tsx
 * function ListBox() {
 *   let listRef: HTMLUListElement | null = null;
 *   const selectedIndex = signal(0);
 *
 *   useKeyboard(() => listRef, {
 *     ArrowDown: () => selectedIndex.set(i => i + 1),
 *     ArrowUp: () => selectedIndex.set(i => Math.max(0, i - 1)),
 *     Home: () => selectedIndex.set(0),
 *     End: () => selectedIndex.set(items.length - 1),
 *     Enter: () => selectItem(selectedIndex()),
 *   });
 *
 *   return <ul ref={(el) => listRef = el} tabIndex={0}>...</ul>;
 * }
 * ```
 */
export function useKeyboard(
  targetRef: () => HTMLElement | null | undefined,
  handlers: KeyHandlers,
  options: UseKeyboardOptions = {}
): void {
  const {
    enabled = true,
    preventDefault = false,
    stopPropagation = false,
    capture = false,
  } = options;

  effect(() => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) return;

    const target = targetRef();
    if (!target) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key as keyof typeof Keys;
      const handler = handlers[key] ?? handlers.default;

      if (handler) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        handler(event);
      }
    };

    target.addEventListener('keydown', handleKeyDown, { capture });

    onCleanup(() => {
      target.removeEventListener('keydown', handleKeyDown, { capture });
    });
  });
}

/**
 * Global keyboard shortcut handler.
 *
 * @example
 * ```tsx
 * useGlobalKeyboard({
 *   'Ctrl+K': () => openCommandPalette(),
 *   'Ctrl+S': (e) => { e.preventDefault(); saveDocument(); },
 *   'Escape': () => closeModal(),
 * });
 * ```
 */
export function useGlobalKeyboard(
  shortcuts: Record<string, (event: KeyboardEvent) => void>,
  options: Pick<UseKeyboardOptions, 'enabled'> = {}
): void {
  const { enabled = true } = options;

  effect(() => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Build the key combination string
      const parts: string[] = [];
      if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
      if (event.altKey) parts.push('Alt');
      if (event.shiftKey) parts.push('Shift');

      // Normalize the key
      let key = event.key;
      if (key === ' ') key = 'Space';
      parts.push(key);

      const combo = parts.join('+');

      // Check for matching shortcut
      const handler = shortcuts[combo] ?? shortcuts[key];
      if (handler) {
        handler(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  });
}

/**
 * Roving tabindex pattern for keyboard navigation.
 * Used in menus, toolbars, and list boxes.
 *
 * @example
 * ```tsx
 * const { activeIndex, setActiveIndex, getTabIndex, handleKeyDown } = useRovingTabindex({
 *   itemCount: () => items.length,
 *   orientation: 'vertical',
 * });
 * ```
 */
export interface UseRovingTabindexOptions {
  /** Total number of items */
  itemCount: () => number;
  /** Initial active index (default: 0) */
  initialIndex?: number;
  /** Navigation orientation (default: 'vertical') */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /** Whether to wrap around (default: true) */
  wrap?: boolean;
  /** Callback when active index changes */
  onActiveChange?: (index: number) => void;
}

export function useRovingTabindex(options: UseRovingTabindexOptions): {
  activeIndex: () => number;
  setActiveIndex: (index: number) => void;
  getTabIndex: (index: number) => 0 | -1;
  handleKeyDown: (event: KeyboardEvent) => void;
} {
  const {
    itemCount,
    initialIndex = 0,
    orientation = 'vertical',
    wrap = true,
    onActiveChange,
  } = options;

  let activeIndex = initialIndex;

  const setActiveIndex = (index: number) => {
    const count = itemCount();
    if (count === 0) return;

    if (wrap) {
      activeIndex = ((index % count) + count) % count;
    } else {
      activeIndex = Math.max(0, Math.min(count - 1, index));
    }

    onActiveChange?.(activeIndex);
  };

  const getTabIndex = (index: number): 0 | -1 => {
    return index === activeIndex ? 0 : -1;
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const count = itemCount();
    if (count === 0) return;

    let handled = true;

    switch (event.key) {
      case Keys.ArrowDown:
        if (orientation === 'vertical' || orientation === 'both') {
          setActiveIndex(activeIndex + 1);
        } else {
          handled = false;
        }
        break;

      case Keys.ArrowUp:
        if (orientation === 'vertical' || orientation === 'both') {
          setActiveIndex(activeIndex - 1);
        } else {
          handled = false;
        }
        break;

      case Keys.ArrowRight:
        if (orientation === 'horizontal' || orientation === 'both') {
          setActiveIndex(activeIndex + 1);
        } else {
          handled = false;
        }
        break;

      case Keys.ArrowLeft:
        if (orientation === 'horizontal' || orientation === 'both') {
          setActiveIndex(activeIndex - 1);
        } else {
          handled = false;
        }
        break;

      case Keys.Home:
        setActiveIndex(0);
        break;

      case Keys.End:
        setActiveIndex(count - 1);
        break;

      default:
        handled = false;
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return {
    activeIndex: () => activeIndex,
    setActiveIndex,
    getTabIndex,
    handleKeyDown,
  };
}

export default useKeyboard;
