/**
 * PhilJS Testing Utilities
 * Makes it easy to test PhilJS components and applications
 */

import { createRoot, signal, type Signal } from './signals';
import { jsx, type VNode } from './jsx-runtime';
import { renderToString } from './render-to-string';

export interface RenderResult {
  /** The rendered HTML */
  html: string;
  /** Re-render the component */
  rerender: () => string;
  /** Cleanup function */
  cleanup: () => void;
  /** Query for elements by test ID */
  getByTestId: (testId: string) => string | null;
  /** Get all elements matching selector */
  queryAll: (selector: string) => string[];
  /** Check if HTML contains text */
  contains: (text: string) => boolean;
}

/**
 * Render a component for testing
 */
export function render(component: VNode): RenderResult {
  let dispose: (() => void) | null = null;

  const doRender = () => {
    if (dispose) {
      dispose();
    }

    let html = '';
    dispose = createRoot(d => {
      html = renderToString(component);
      return d;
    });

    return html;
  };

  let html = doRender();

  return {
    html,
    rerender: () => {
      html = doRender();
      return html;
    },
    cleanup: () => {
      if (dispose) {
        dispose();
      }
    },
    getByTestId: (testId: string) => {
      const regex = new RegExp(`data-testid="${testId}"[^>]*>([^<]*)<`, 'i');
      const match = html.match(regex);
      return match ? match[1] : null;
    },
    queryAll: (selector: string) => {
      // Simple selector matching for testing
      const matches: string[] = [];
      const tagMatch = selector.match(/^([a-z]+)/);

      if (tagMatch) {
        const tag = tagMatch[1];
        const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'gi');
        let match;
        while ((match = regex.exec(html)) !== null) {
          matches.push(match[1]);
        }
      }

      return matches;
    },
    contains: (text: string) => {
      return html.includes(text);
    }
  };
}

/**
 * Create a test signal that tracks all updates
 */
export function createTestSignal<T>(initialValue: T) {
  const updates: T[] = [initialValue];
  const sig = signal(initialValue);
  let tracking = true;

  const originalSet = sig.set;
  sig.set = (value: T | ((prev: T) => T)) => {
    const newValue = typeof value === 'function'
      ? (value as (prev: T) => T)(sig())
      : value;

    if (tracking) {
      updates.push(newValue);
    }
    originalSet(newValue);
  };

  return {
    signal: sig,
    updates,
    reset: () => {
      tracking = false;
      originalSet(initialValue);
      updates.length = 0;
      updates.push(initialValue);
      tracking = true;
    }
  };
}

/**
 * Wait for next tick (useful for async tests)
 */
export function nextTick(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Wait for a specific amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a spy function that tracks calls
 */
export function createSpy<T extends (...args: any[]) => any>() {
  const calls: Array<Parameters<T>> = [];
  const results: Array<ReturnType<T>> = [];

  const spy = ((...args: Parameters<T>) => {
    calls.push(args);
    const result = undefined as ReturnType<T>;
    results.push(result);
    return result;
  }) as T & {
    calls: Array<Parameters<T>>;
    results: Array<ReturnType<T>>;
    callCount: number;
    reset: () => void;
  };

  spy.calls = calls;
  spy.results = results;

  Object.defineProperty(spy, 'callCount', {
    get: () => calls.length
  });

  spy.reset = () => {
    calls.length = 0;
    results.length = 0;
  };

  return spy;
}

/**
 * Assert that a value is truthy
 */
export function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Test utilities for async operations
 */
export const async = {
  /** Wait for a condition to be true */
  waitFor: async (
    condition: () => boolean,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<void> => {
    const { timeout = 1000, interval = 10 } = options;
    const start = Date.now();

    while (!condition()) {
      if (Date.now() - start > timeout) {
        throw new Error(`Timeout waiting for condition after ${timeout}ms`);
      }
      await wait(interval);
    }
  },

  /** Wait for a signal to have a specific value */
  waitForSignal: async <T>(
    signal: Signal<T>,
    expectedValue: T,
    options?: { timeout?: number; interval?: number }
  ): Promise<void> => {
    await async.waitFor(() => signal() === expectedValue, options);
  }
};

/**
 * Snapshot testing utility
 */
export class SnapshotTester {
  private snapshots: Map<string, string> = new Map();

  snapshot(name: string, value: string): void {
    if (!this.snapshots.has(name)) {
      this.snapshots.set(name, value);
      return;
    }

    const existing = this.snapshots.get(name)!;
    if (existing !== value) {
      throw new Error(
        `Snapshot mismatch for "${name}"\nExpected:\n${existing}\n\nReceived:\n${value}`
      );
    }
  }

  update(name: string, value: string): void {
    this.snapshots.set(name, value);
  }

  clear(): void {
    this.snapshots.clear();
  }
}

/**
 * Mock utilities
 */
export const mock = {
  /** Create a mock function */
  fn: <T extends (...args: any[]) => any>(
    implementation?: T
  ): T & {
    calls: Array<Parameters<T>>;
    returns: Array<ReturnType<T>>;
    mockReturnValue: (value: ReturnType<T>) => void;
    mockImplementation: (impl: T) => void;
  } => {
    const calls: Array<Parameters<T>> = [];
    const returns: Array<ReturnType<T>> = [];
    let impl = implementation;

    const mockFn = ((...args: Parameters<T>) => {
      calls.push(args);
      const result = impl ? impl(...args) : undefined;
      returns.push(result);
      return result;
    }) as any;

    mockFn.calls = calls;
    mockFn.returns = returns;
    mockFn.mockReturnValue = (value: ReturnType<T>) => {
      impl = (() => value) as T;
    };
    mockFn.mockImplementation = (newImpl: T) => {
      impl = newImpl;
    };

    return mockFn;
  },

  /** Create a mock signal */
  signal: <T>(initialValue: T) => {
    const sig = signal(initialValue);
    const setCalls: T[] = [];

    const originalSet = sig.set;
    sig.set = (value: T | ((prev: T) => T)) => {
      const newValue = typeof value === 'function'
        ? (value as (prev: T) => T)(sig())
        : value;
      setCalls.push(newValue);
      originalSet(newValue);
    };

    return {
      signal: sig,
      setCalls
    };
  }
};

/**
 * Create a test component wrapper
 */
export function createTestComponent<P extends Record<string, any> = Record<string, any>>(
  Component: (props: P) => VNode
) {
  return {
    render: (props: P) => render(jsx(Component, props)),
    renderToString: (props: P) => renderToString(jsx(Component, props))
  };
}

/**
 * Batch test assertions
 */
export function expectAll(...assertions: Array<() => void>): void {
  const errors: Error[] = [];

  for (const assertion of assertions) {
    try {
      assertion();
    } catch (error) {
      errors.push(error as Error);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Multiple assertions failed:\n${errors.map(e => e.message).join('\n')}`
    );
  }
}

/**
 * Performance testing utilities
 */
export const perf = {
  /** Measure execution time */
  measure: <T>(fn: () => T): { result: T; duration: number } => {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    return { result, duration };
  },

  /** Measure async execution time */
  measureAsync: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    return { result, duration };
  },

  /** Assert function executes within time limit */
  assertFast: <T>(fn: () => T, maxDuration: number): T => {
    const { result, duration } = perf.measure(fn);
    if (duration > maxDuration) {
      throw new Error(`Function took ${duration}ms, expected < ${maxDuration}ms`);
    }
    return result;
  }
};
