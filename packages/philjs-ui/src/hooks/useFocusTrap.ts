/**
 * PhilJS UI - useFocusTrap Hook
 *
 * Traps focus within a container element.
 * Essential for accessible modals and dialogs.
 */

import { effect, onCleanup } from '@philjs/core';

/**
 * Focusable element selector
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Options for useFocusTrap
 */
export interface UseFocusTrapOptions {
  /** Whether the focus trap is enabled (default: true) */
  enabled?: boolean | (() => boolean);
  /** Whether to focus the first element on mount (default: true) */
  autoFocus?: boolean;
  /** Whether to restore focus when unmounted (default: true) */
  restoreFocus?: boolean;
  /** Selector for the initial focus element */
  initialFocus?: string | (() => HTMLElement | null);
  /** Selector for the element to focus when trap is deactivated */
  finalFocus?: string | (() => HTMLElement | null);
  /** Callback when escape key is pressed */
  onEscape?: () => void;
  /** Whether clicking outside should close (for accessibility) */
  closeOnClickOutside?: boolean;
}

/**
 * Traps keyboard focus within a container element.
 *
 * @example
 * ```tsx
 * function Modal(props: { isOpen: boolean; onClose: () => void }) {
 *   let containerRef: HTMLDivElement | null = null;
 *
 *   useFocusTrap(
 *     () => containerRef,
 *     {
 *       enabled: () => props.isOpen,
 *       onEscape: props.onClose,
 *       restoreFocus: true,
 *     }
 *   );
 *
 *   return (
 *     <div ref={(el) => containerRef = el} role="dialog" aria-modal="true">
 *       <button onClick={props.onClose}>Close</button>
 *       <input type="text" />
 *       <button>Submit</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap(
  containerRef: () => HTMLElement | null | undefined,
  options: UseFocusTrapOptions = {}
): void {
  const {
    enabled = true,
    autoFocus = true,
    restoreFocus = true,
    initialFocus,
    onEscape,
  } = options;

  let previousActiveElement: Element | null = null;

  effect(() => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) return;

    const container = containerRef();
    if (!container) return;

    // Store the previously focused element
    previousActiveElement = document.activeElement;

    // Get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter(el => {
          // Check if element is visible
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });
    };

    // Focus initial element
    if (autoFocus) {
      requestAnimationFrame(() => {
        let elementToFocus: HTMLElement | null = null;

        if (initialFocus) {
          if (typeof initialFocus === 'string') {
            elementToFocus = container.querySelector(initialFocus);
          } else {
            elementToFocus = initialFocus();
          }
        }

        if (!elementToFocus) {
          const focusableElements = getFocusableElements();
          elementToFocus = focusableElements[0] ?? container;
        }

        elementToFocus?.focus();
      });
    }

    // Handle keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      // Shift + Tab: Move focus to last element if on first
      if (event.shiftKey) {
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      }
      // Tab: Move focus to first element if on last
      else {
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    onCleanup(() => {
      container.removeEventListener('keydown', handleKeyDown);

      // Restore focus
      if (restoreFocus && previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    });
  });
}

/**
 * Gets all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

/**
 * Gets the first focusable element within a container
 */
export function getFirstFocusable(container: HTMLElement): HTMLElement | null {
  const elements = getFocusableElements(container);
  return elements[0] ?? null;
}

/**
 * Gets the last focusable element within a container
 */
export function getLastFocusable(container: HTMLElement): HTMLElement | null {
  const elements = getFocusableElements(container);
  return elements[elements.length - 1] ?? null;
}

export default useFocusTrap;
