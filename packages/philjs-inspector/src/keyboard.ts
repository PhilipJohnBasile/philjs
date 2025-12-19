/**
 * Keyboard shortcuts and navigation for inspector
 */

export type KeyboardHandler = (event: KeyboardEvent) => void | boolean;

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: KeyboardHandler;
  description: string;
}

const shortcuts = new Map<string, KeyboardShortcut>();
let isListening = false;

/**
 * Register keyboard shortcut
 */
export function registerShortcut(shortcut: KeyboardShortcut): void {
  const key = makeShortcutKey(shortcut);
  shortcuts.set(key, shortcut);
}

/**
 * Unregister keyboard shortcut
 */
export function unregisterShortcut(key: string): void {
  shortcuts.delete(key);
}

/**
 * Start listening for keyboard events
 */
export function startKeyboardListening(): void {
  if (isListening) return;
  isListening = true;
  document.addEventListener('keydown', handleKeyDown, true);
}

/**
 * Stop listening for keyboard events
 */
export function stopKeyboardListening(): void {
  if (!isListening) return;
  isListening = false;
  document.removeEventListener('keydown', handleKeyDown, true);
}

/**
 * Handle keydown event
 */
function handleKeyDown(event: KeyboardEvent): void {
  const key = makeEventKey(event);
  const shortcut = shortcuts.get(key);

  if (shortcut) {
    const result = shortcut.handler(event);
    if (result !== false) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}

/**
 * Make shortcut key string
 */
function makeShortcutKey(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('ctrl');
  if (shortcut.shift) parts.push('shift');
  if (shortcut.alt) parts.push('alt');
  if (shortcut.meta) parts.push('meta');
  parts.push(shortcut.key.toLowerCase());
  return parts.join('+');
}

/**
 * Make key string from event
 */
function makeEventKey(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push('ctrl');
  if (event.shiftKey) parts.push('shift');
  if (event.altKey) parts.push('alt');
  if (event.metaKey) parts.push('meta');
  parts.push(event.key.toLowerCase());
  return parts.join('+');
}

/**
 * Get all registered shortcuts
 */
export function getAllShortcuts(): KeyboardShortcut[] {
  return Array.from(shortcuts.values());
}

/**
 * Clear all shortcuts
 */
export function clearAllShortcuts(): void {
  shortcuts.clear();
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  // Use platform-appropriate modifier key symbols
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');

  if (shortcut.ctrl) parts.push(isMac ? '⌃' : 'Ctrl');
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (shortcut.meta) parts.push(isMac ? '⌘' : 'Win');

  // Format key
  const key = shortcut.key.charAt(0).toUpperCase() + shortcut.key.slice(1);
  parts.push(key);

  return parts.join(isMac ? '' : '+');
}

/**
 * Check if keyboard event matches shortcut
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean {
  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    !!event.ctrlKey === !!shortcut.ctrl &&
    !!event.shiftKey === !!shortcut.shift &&
    !!event.altKey === !!shortcut.alt &&
    !!event.metaKey === !!shortcut.meta
  );
}

/**
 * Navigation helper for traversing component tree
 */
export class ComponentNavigator {
  private currentIndex = -1;
  private elements: Element[] = [];

  constructor() {}

  /**
   * Update elements list
   */
  public setElements(elements: Element[]): void {
    this.elements = elements;
    this.currentIndex = -1;
  }

  /**
   * Navigate to next component
   */
  public next(): Element | null {
    if (this.elements.length === 0) return null;
    this.currentIndex = (this.currentIndex + 1) % this.elements.length;
    return this.elements[this.currentIndex];
  }

  /**
   * Navigate to previous component
   */
  public previous(): Element | null {
    if (this.elements.length === 0) return null;
    this.currentIndex =
      this.currentIndex <= 0 ? this.elements.length - 1 : this.currentIndex - 1;
    return this.elements[this.currentIndex];
  }

  /**
   * Navigate to parent component
   */
  public parent(current: Element): Element | null {
    if (!current) return null;
    let parent = current.parentElement;
    while (parent && parent !== document.body) {
      if (this.elements.includes(parent)) {
        this.currentIndex = this.elements.indexOf(parent);
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }

  /**
   * Navigate to first child component
   */
  public firstChild(current: Element): Element | null {
    if (!current) return null;
    for (const child of Array.from(current.children)) {
      if (this.elements.includes(child)) {
        this.currentIndex = this.elements.indexOf(child);
        return child;
      }
    }
    return null;
  }

  /**
   * Navigate to next sibling
   */
  public nextSibling(current: Element): Element | null {
    if (!current || !current.parentElement) return null;
    const siblings = Array.from(current.parentElement.children).filter((el) =>
      this.elements.includes(el)
    );
    const currentIndex = siblings.indexOf(current);
    if (currentIndex === -1 || currentIndex === siblings.length - 1) return null;
    const nextSib = siblings[currentIndex + 1];
    this.currentIndex = this.elements.indexOf(nextSib);
    return nextSib;
  }

  /**
   * Navigate to previous sibling
   */
  public previousSibling(current: Element): Element | null {
    if (!current || !current.parentElement) return null;
    const siblings = Array.from(current.parentElement.children).filter((el) =>
      this.elements.includes(el)
    );
    const currentIndex = siblings.indexOf(current);
    if (currentIndex === -1 || currentIndex === 0) return null;
    const prevSib = siblings[currentIndex - 1];
    this.currentIndex = this.elements.indexOf(prevSib);
    return prevSib;
  }

  /**
   * Get current element
   */
  public getCurrent(): Element | null {
    if (this.currentIndex === -1 || this.currentIndex >= this.elements.length) {
      return null;
    }
    return this.elements[this.currentIndex];
  }

  /**
   * Set current element
   */
  public setCurrent(element: Element): void {
    const index = this.elements.indexOf(element);
    if (index !== -1) {
      this.currentIndex = index;
    }
  }

  /**
   * Get total count
   */
  public getCount(): number {
    return this.elements.length;
  }

  /**
   * Get current index
   */
  public getCurrentIndex(): number {
    return this.currentIndex;
  }
}
