/**
 * PhilJS Testing - Async Utilities
 */

import { waitFor as dtlWaitFor, waitForElementToBeRemoved as dtlWaitForElementToBeRemoved } from '@testing-library/dom';

export interface WaitForOptions {
  timeout?: number;
  interval?: number;
  onTimeout?: (error: Error) => Error;
}

/**
 * Wait for a condition to be true
 */
export async function waitFor<T>(
  callback: () => T | Promise<T>,
  options: WaitForOptions = {}
): Promise<T> {
  const { timeout = 5000, interval = 50, onTimeout } = options;

  return dtlWaitFor(callback, {
    timeout,
    interval,
    onTimeout: onTimeout as any,
  });
}

/**
 * Wait for an element to be removed from the DOM
 */
export async function waitForElementToBeRemoved<T extends Element>(
  callback: (() => T | T[] | null) | T | T[],
  options: WaitForOptions = {}
): Promise<void> {
  return dtlWaitForElementToBeRemoved(callback as any, options as any);
}

/**
 * Find element by role (async)
 */
export async function findByRole(
  container: HTMLElement,
  role: string,
  options: { name?: string | RegExp; timeout?: number } = {}
): Promise<HTMLElement> {
  const { name, timeout = 5000 } = options;

  return waitFor(() => {
    const element = container.querySelector(`[role="${role}"]`) as HTMLElement;

    if (!element) {
      throw new Error(`Unable to find element with role: ${role}`);
    }

    if (name) {
      const accessibleName = element.getAttribute('aria-label') ||
                            element.textContent ||
                            '';

      if (typeof name === 'string' && accessibleName !== name) {
        throw new Error(`Found element with role ${role} but name doesn't match`);
      }

      if (name instanceof RegExp && !name.test(accessibleName)) {
        throw new Error(`Found element with role ${role} but name doesn't match pattern`);
      }
    }

    return element;
  }, { timeout });
}

/**
 * Find element by text (async)
 */
export async function findByText(
  container: HTMLElement,
  text: string | RegExp,
  options: { exact?: boolean; timeout?: number } = {}
): Promise<HTMLElement> {
  const { exact = true, timeout = 5000 } = options;

  return waitFor(() => {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node: Node | null;
    while ((node = walker.nextNode())) {
      const textContent = node.textContent || '';
      const matches = typeof text === 'string'
        ? exact
          ? textContent.trim() === text
          : textContent.includes(text)
        : text.test(textContent);

      if (matches && node.parentElement) {
        return node.parentElement;
      }
    }

    throw new Error(`Unable to find element with text: ${text}`);
  }, { timeout });
}

/**
 * Wait for loading to finish
 */
export async function waitForLoadingToFinish(
  container: HTMLElement = document.body,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 10000 } = options;

  // Wait for common loading indicators to disappear
  const loadingSelectors = [
    '[aria-busy="true"]',
    '[data-loading="true"]',
    '.loading',
    '.spinner',
    '[role="progressbar"]',
  ];

  await waitFor(() => {
    for (const selector of loadingSelectors) {
      if (container.querySelector(selector)) {
        throw new Error('Still loading');
      }
    }
    return true;
  }, { timeout });
}

/**
 * Wait for network requests to settle
 */
export async function waitForNetworkIdle(
  options: { timeout?: number; idleTime?: number } = {}
): Promise<void> {
  const { timeout = 5000, idleTime = 500 } = options;
  const interval = Math.max(1, Math.min(100, idleTime, Math.floor(timeout / 2)));

  let lastRequestTime = Date.now();

  // Track fetch requests
  const originalFetch = window.fetch;
  let pendingRequests = 0;

  window.fetch = async function(...args) {
    pendingRequests++;
    lastRequestTime = Date.now();

    try {
      const result = await originalFetch.apply(this, args);
      return result;
    } finally {
      pendingRequests--;
      lastRequestTime = Date.now();
    }
  };

  try {
    await waitFor(
      () => {
        if (pendingRequests > 0) {
          throw new Error('Network requests pending');
        }

        if (Date.now() - lastRequestTime < idleTime) {
          throw new Error('Waiting for network idle');
        }

        return true;
      },
      { timeout, interval }
    );
  } finally {
    window.fetch = originalFetch;
  }
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
