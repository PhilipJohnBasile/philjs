/**
 * Test setup for PhilJS UI component tests
 */

import { vi } from 'vitest';

// Mock @philjs/core
vi.mock('@philjs/core', () => ({
  signal: <T>(initial: T) => {
    let value = initial;
    const getter = () => value;
    getter.set = (newValue: T) => { value = newValue; };
    return getter;
  },
  memo: (fn: () => any) => fn,
  effect: (fn: () => any) => {
    fn();
    return () => {};
  },
  createContext: <T>(defaultValue: T) => {
    let contextValue = defaultValue;
    return {
      Provider: ({ value, children }: { value: T; children: any }) => {
        contextValue = value;
        return children;
      },
      _getValue: () => contextValue,
    };
  },
  useContext: <T>(context: { _getValue?: () => T }): T | null => {
    return context._getValue ? context._getValue() : null;
  },
}));

/**
 * Helper to unwrap VNode children that may be wrapped in arrays
 */
export function unwrapChildren(children: any): any {
  if (Array.isArray(children) && children.length === 1) {
    return children[0];
  }
  return children;
}

/**
 * Helper to get text content from VNode children
 */
export function getTextContent(children: any): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children.map(getTextContent).join('');
  }
  if (children?.props?.children) {
    return getTextContent(children.props.children);
  }
  return '';
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock document.activeElement
Object.defineProperty(document, 'activeElement', {
  writable: true,
  value: document.body,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = MockResizeObserver as any;

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.IntersectionObserver = MockIntersectionObserver as any;
