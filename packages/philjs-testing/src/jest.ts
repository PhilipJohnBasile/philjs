/**
 * PhilJS Testing - Jest Setup
 *
 * Setup file for Jest test runner.
 * Import this in your setupFilesAfterEnv array in jest.config.js
 */

import { cleanup } from './render';
import { cleanupHooks } from './hooks';
import * as matchers from './matchers';

/**
 * Auto-cleanup after each test
 */
if (typeof afterEach !== 'undefined') {
  afterEach(() => {
    cleanup();
    cleanupHooks();
  });
}

/**
 * Extend Jest matchers with PhilJS-specific assertions
 */
if (typeof expect !== 'undefined' && expect.extend) {
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
if (typeof global !== 'undefined') {
  // Mock ResizeObserver
  if (!global.ResizeObserver) {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  }

  // Mock IntersectionObserver
  if (!global.IntersectionObserver) {
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

  // Mock window.scrollTo
  if (typeof window !== 'undefined' && !window.scrollTo) {
    window.scrollTo = () => {};
  }

  // Mock HTMLElement.prototype.scrollIntoView
  if (typeof HTMLElement !== 'undefined' && !HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = () => {};
  }
}

/**
 * Extend Jest matchers type definitions
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveAttribute(attr: string, value?: string | RegExp): R;
      toHaveClass(...classNames: string[]): R;
      toHaveStyle(style: string | Record<string, any>): R;
      toHaveFocus(): R;
      toHaveValue(value: string | number): R;
      toBeChecked(): R;
      toBeEmptyDOMElement(): R;
    }
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
} from './index';
