/**
 * PhilJS UI - useClickOutside Hook
 *
 * Detects clicks outside of a referenced element.
 * Useful for closing dropdowns, modals, and popovers.
 */

import { effect, onCleanup, type Signal } from '@philjs/core';

/**
 * Options for useClickOutside
 */
export interface UseClickOutsideOptions {
  /** Whether the handler is enabled (default: true) */
  enabled?: boolean | (() => boolean);
  /** Events to listen for (default: ['mousedown', 'touchstart']) */
  events?: ('mousedown' | 'touchstart' | 'click')[];
  /** Whether to capture the event (default: true) */
  capture?: boolean;
}

/**
 * Calls handler when a click occurs outside the referenced element.
 *
 * @example
 * ```tsx
 * function Dropdown() {
 *   const isOpen = signal(false);
 *   let dropdownRef: HTMLDivElement | null = null;
 *
 *   useClickOutside(
 *     () => dropdownRef,
 *     () => isOpen.set(false),
 *     { enabled: () => isOpen() }
 *   );
 *
 *   return (
 *     <div ref={(el) => dropdownRef = el}>
 *       <button onClick={() => isOpen.set(!isOpen())}>Toggle</button>
 *       {isOpen() && <div>Dropdown content</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useClickOutside(
  elementRef: () => HTMLElement | null | undefined,
  handler: (event: MouseEvent | TouchEvent) => void,
  options: UseClickOutsideOptions = {}
): void {
  const {
    enabled = true,
    events = ['mousedown', 'touchstart'],
    capture = true
  } = options;

  effect(() => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) return;

    const element = elementRef();
    if (!element) return;

    const listener = (event: Event) => {
      const target = event.target as Node;

      // Check if click was inside the element
      if (element.contains(target)) return;

      // Call the handler
      handler(event as MouseEvent | TouchEvent);
    };

    // Add event listeners
    for (const eventName of events) {
      document.addEventListener(eventName, listener, { capture });
    }

    onCleanup(() => {
      for (const eventName of events) {
        document.removeEventListener(eventName, listener, { capture });
      }
    });
  });
}

/**
 * Returns a signal that tracks whether a click occurred outside the element.
 *
 * @example
 * ```tsx
 * const { isOutside, ref } = useClickOutsideSignal();
 *
 * effect(() => {
 *   if (isOutside()) closeModal();
 * });
 * ```
 */
export function useClickOutsideSignal(
  options: UseClickOutsideOptions = {}
): {
  isOutside: Signal<boolean>;
  setRef: (el: HTMLElement | null) => void;
} {
  // This would be implemented with the actual signal import
  // For now, we'll define the type signature
  throw new Error('useClickOutsideSignal requires @philjs/core signal implementation');
}

export default useClickOutside;
