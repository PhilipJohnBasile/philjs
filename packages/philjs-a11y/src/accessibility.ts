/**
 * Accessibility Utilities for PhilJS
 *
 * Tools for building accessible web applications following WCAG 2.1 guidelines
 */

// ============================================================================
// Focus Management
// ============================================================================

/**
 * Trap focus within an element (for modals, dialogs)
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]',
  ].join(', ');

  const focusableElements = element.querySelectorAll<HTMLElement>(focusableSelectors);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleKeydown);
  firstFocusable?.focus();

  return () => {
    element.removeEventListener('keydown', handleKeydown);
  };
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];

  return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(', ')));
}

/**
 * Manage focus when content changes dynamically
 */
export function announceFocusChange(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcer = getOrCreateAnnouncer(priority);
  announcer.textContent = '';
  // Use setTimeout to ensure screen readers pick up the change
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);
}

function getOrCreateAnnouncer(priority: 'polite' | 'assertive'): HTMLElement {
  const id = `philjs-a11y-announcer-${priority}`;
  let announcer = document.getElementById(id);

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = id;
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(announcer);
  }

  return announcer;
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

/**
 * Arrow key navigation for lists/grids
 */
export function useArrowKeyNavigation(
  container: HTMLElement,
  options: {
    selector?: string;
    orientation?: 'horizontal' | 'vertical' | 'both';
    wrap?: boolean;
    onSelect?: (element: HTMLElement, index: number) => void;
  } = {}
): () => void {
  const { selector = '[role="option"], [role="menuitem"], li', orientation = 'vertical', wrap = true, onSelect } = options;

  let currentIndex = 0;

  const getItems = () => Array.from(container.querySelectorAll<HTMLElement>(selector));

  const focusItem = (index: number) => {
    const items = getItems();
    if (items.length === 0) return;

    if (wrap) {
      index = ((index % items.length) + items.length) % items.length;
    } else {
      index = Math.max(0, Math.min(items.length - 1, index));
    }

    currentIndex = index;
    items[index]?.focus();
    onSelect?.(items[index]!, index);
  };

  const handleKeydown = (e: KeyboardEvent) => {
    const items = getItems();
    if (items.length === 0) return;

    let handled = false;

    switch (e.key) {
      case 'ArrowDown':
        if (orientation !== 'horizontal') {
          focusItem(currentIndex + 1);
          handled = true;
        }
        break;
      case 'ArrowUp':
        if (orientation !== 'horizontal') {
          focusItem(currentIndex - 1);
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (orientation !== 'vertical') {
          focusItem(currentIndex + 1);
          handled = true;
        }
        break;
      case 'ArrowLeft':
        if (orientation !== 'vertical') {
          focusItem(currentIndex - 1);
          handled = true;
        }
        break;
      case 'Home':
        focusItem(0);
        handled = true;
        break;
      case 'End':
        focusItem(items.length - 1);
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();
    }
  };

  container.addEventListener('keydown', handleKeydown);

  return () => {
    container.removeEventListener('keydown', handleKeydown);
  };
}

/**
 * Roving tabindex pattern for complex widgets
 */
export function useRovingTabindex(container: HTMLElement, itemSelector: string): () => void {
  const items = Array.from(container.querySelectorAll<HTMLElement>(itemSelector));

  if (items.length === 0) return () => {};

  // Set initial tabindex
  items.forEach((item, i) => {
    item.setAttribute('tabindex', i === 0 ? '0' : '-1');
  });

  const handleFocus = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (items.includes(target)) {
      items.forEach((item) => {
        item.setAttribute('tabindex', item === target ? '0' : '-1');
      });
    }
  };

  container.addEventListener('focus', handleFocus, true);

  return () => {
    container.removeEventListener('focus', handleFocus, true);
  };
}

// ============================================================================
// Screen Reader Utilities
// ============================================================================

/**
 * Visually hidden but accessible to screen readers
 */
export const srOnlyStyles: Readonly<Record<string, string>> = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0',
};

/**
 * Apply sr-only styles to an element
 */
export function makeSrOnly(element: HTMLElement): void {
  Object.assign(element.style, srOnlyStyles);
}

/**
 * Create a screen reader only element
 */
export function createSrOnlyElement(text: string, tag = 'span'): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = text;
  makeSrOnly(element);
  return element;
}

// ============================================================================
// ARIA Helpers
// ============================================================================

/**
 * Set aria-expanded and update related elements
 */
export function setExpanded(trigger: HTMLElement, isExpanded: boolean, contentId?: string): void {
  trigger.setAttribute('aria-expanded', String(isExpanded));

  if (contentId) {
    const content = document.getElementById(contentId);
    if (content) {
      content.hidden = !isExpanded;
    }
  }
}

/**
 * Set aria-selected for single selection
 */
export function setSelected(container: HTMLElement, selected: HTMLElement): void {
  const options = container.querySelectorAll('[role="option"]');
  options.forEach((option) => {
    option.setAttribute('aria-selected', String(option === selected));
  });
}

/**
 * Set aria-current for navigation
 */
export function setCurrent(
  items: HTMLElement[],
  current: HTMLElement,
  type: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' = 'page'
): void {
  items.forEach((item) => {
    if (item === current) {
      item.setAttribute('aria-current', type);
    } else {
      item.removeAttribute('aria-current');
    }
  });
}

/**
 * Generate unique ID for accessibility relationships
 */
export function generateId(prefix = 'philjs-a11y'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Link label to input
 */
export function linkLabelToInput(label: HTMLElement, input: HTMLElement): string {
  const id = input.id || generateId('input');
  input.id = id;
  label.setAttribute('for', id);
  return id;
}

/**
 * Link description to element
 */
export function linkDescription(element: HTMLElement, description: HTMLElement): string {
  const id = description.id || generateId('desc');
  description.id = id;

  const existingDescribedBy = element.getAttribute('aria-describedby');
  const ids = existingDescribedBy ? `${existingDescribedBy} ${id}` : id;
  element.setAttribute('aria-describedby', ids);

  return id;
}

// ============================================================================
// Color Contrast
// ============================================================================

/**
 * Calculate relative luminance of a color
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs! + 0.7152 * gs! + 0.0722 * bs!;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const l1 = getLuminance(color1.r, color1.g, color1.b);
  const l2 = getLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG requirements
 */
export function meetsContrastRequirement(
  ratio: number,
  level: 'AA' | 'AAA' = 'AA',
  largeText = false
): boolean {
  if (level === 'AAA') {
    return largeText ? ratio >= 4.5 : ratio >= 7;
  }
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Parse hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : null;
}

// ============================================================================
// Reduced Motion
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Watch for reduced motion preference changes
 */
export function watchReducedMotion(callback: (prefersReduced: boolean) => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const handler = (e: MediaQueryListEvent) => callback(e.matches);
  mediaQuery.addEventListener('change', handler);

  // Initial call
  callback(mediaQuery.matches);

  return () => mediaQuery.removeEventListener('change', handler);
}

// ============================================================================
// Skip Links
// ============================================================================

/**
 * Create a skip link for keyboard navigation
 */
export function createSkipLink(targetId: string, text = 'Skip to main content'): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.textContent = text;
  link.className = 'philjs-skip-link';

  // Add default styles
  link.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    z-index: 9999;
    transition: top 0.3s;
  `;

  link.addEventListener('focus', () => {
    link.style.top = '0';
  });

  link.addEventListener('blur', () => {
    link.style.top = '-40px';
  });

  return link;
}

// ============================================================================
// Live Regions
// ============================================================================

export interface LiveRegionOptions {
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

/**
 * Create a live region for dynamic announcements
 */
export function createLiveRegion(options: LiveRegionOptions = {}): {
  element: HTMLElement;
  announce: (message: string) => void;
  clear: () => void;
} {
  const { politeness = 'polite', atomic = true, relevant = 'additions text' } = options;

  const element = document.createElement('div');
  element.setAttribute('aria-live', politeness);
  element.setAttribute('aria-atomic', String(atomic));
  element.setAttribute('aria-relevant', relevant);
  makeSrOnly(element);
  document.body.appendChild(element);

  return {
    element,
    announce: (message: string) => {
      element.textContent = '';
      setTimeout(() => {
        element.textContent = message;
      }, 100);
    },
    clear: () => {
      element.textContent = '';
    },
  };
}
