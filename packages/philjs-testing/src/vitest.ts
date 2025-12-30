/**
 * PhilJS Testing - Vitest Setup
 *
 * Setup file for Vitest test runner.
 * Import this in your vitest.config.ts setupFiles array.
 */

import { afterEach, expect } from 'vitest';
import { cleanup } from './render.js';
import { cleanupHooks } from './hooks.js';
import * as matchers from './matchers.js';

/**
 * Auto-cleanup after each test
 */
afterEach(() => {
  cleanup();
  cleanupHooks();
});

/**
 * Extend Vitest matchers with PhilJS-specific assertions
 */
if (expect && typeof expect.extend === 'function') {
  expect.extend({
    toBeInTheDocument: matchers.toBeInTheDocument,
    toHaveTextContent: matchers.toHaveTextContent,
    toBeVisible: matchers.toBeVisible,
    toBeDisabled: matchers.toBeDisabled,
    toBeEnabled: matchers.toBeEnabled,
    toHaveAttribute: matchers.toHaveAttribute,
    toHaveClass: matchers.toHaveClass,
    toHaveStyle: matchers.toHaveStyle,
    toHaveFocus: matchers.toHaveFocus,
    toHaveValue: matchers.toHaveValue,
    toBeChecked: matchers.toBeChecked,
    toBeEmptyDOMElement: matchers.toBeEmptyDOMElement,
  });
}

/**
 * Setup jsdom environment
 */
if (typeof global !== 'undefined' && !global.ResizeObserver) {
  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

if (typeof global !== 'undefined' && !global.IntersectionObserver) {
  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = '';
    thresholds = [];
  } as any;
}

// Mock window.matchMedia
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });
}

/**
 * Extend Vitest type definitions
 */
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeInTheDocument(): T;
    toHaveTextContent(text: string | RegExp): T;
    toBeVisible(): T;
    toBeDisabled(): T;
    toBeEnabled(): T;
    toHaveAttribute(attr: string, value?: string | RegExp): T;
    toHaveClass(...classNames: string[]): T;
    toHaveStyle(style: string | Record<string, any>): T;
    toHaveFocus(): T;
    toHaveValue(value: string | number): T;
    toBeChecked(): T;
    toBeEmptyDOMElement(): T;
  }

  interface AsymmetricMatchersContaining {
    toBeInTheDocument(): any;
    toHaveTextContent(text: string | RegExp): any;
    toBeVisible(): any;
    toBeDisabled(): any;
    toBeEnabled(): any;
    toHaveAttribute(attr: string, value?: string | RegExp): any;
    toHaveClass(...classNames: string[]): any;
    toHaveStyle(style: string | Record<string, any>): any;
    toHaveFocus(): any;
    toHaveValue(value: string | number): any;
    toBeChecked(): any;
    toBeEmptyDOMElement(): any;
  }
}

export {
  // Re-export everything for convenience
  render,
  cleanup,
  screen,
  within,
  fireEvent,
  userEvent,
  user,
  setup,
  renderHook,
  act,
  waitFor,
  waitForElementToBeRemoved,
  findByRole,
  findByText,
  waitForLoadingToFinish,
  waitForNetworkIdle,
  delay,
  createMockSignal,
  createMockComputed,
  waitForSignal,
  waitForSignalValue,
  debug,
  logDOM,
  prettyDOM,
} from './index.js';
