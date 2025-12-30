/**
 * Route Mocking Utilities
 *
 * Mock loaders and actions for route components
 */

import { signal } from 'philjs-core';

export interface MockLoader<T = any> {
  data: ReturnType<typeof signal<T | null>>;
  loading: ReturnType<typeof signal<boolean>>;
  error: ReturnType<typeof signal<Error | null>>;
  load: (params?: Record<string, any>) => Promise<void>;
  getCalls: () => Array<{ params?: Record<string, any>; timestamp: number }>;
}

export interface MockAction<T = any> {
  data: ReturnType<typeof signal<T | null>>;
  submitting: ReturnType<typeof signal<boolean>>;
  error: ReturnType<typeof signal<Error | null>>;
  submit: (data: any) => Promise<void>;
  getCalls: () => Array<{ data: any; timestamp: number }>;
}

/**
 * Create a mock loader
 */
export function createMockLoader<T = any>(
  loadFn: (params?: Record<string, any>) => Promise<T>
): MockLoader<T> {
  const data$ = signal<T | null>(null);
  const loading$ = signal(false);
  const error$ = signal<Error | null>(null);
  const calls: Array<{ params?: Record<string, any>; timestamp: number }> = [];

  return {
    data: data$,
    loading: loading$,
    error: error$,

    async load(params?: Record<string, any>) {
      calls.push({ ...(params !== undefined ? { params } : {}), timestamp: Date.now() });
      loading$.set(true);
      error$.set(null);

      try {
        const result = await loadFn(params);
        data$.set(result);
      } catch (err) {
        error$.set(err as Error);
      } finally {
        loading$.set(false);
      }
    },

    getCalls: () => calls,
  };
}

/**
 * Create a mock action
 */
export function createMockAction<T = any>(
  submitFn: (data: any) => Promise<T>
): MockAction<T> {
  const data$ = signal<T | null>(null);
  const submitting$ = signal(false);
  const error$ = signal<Error | null>(null);
  const calls: Array<{ data: any; timestamp: number }> = [];

  return {
    data: data$,
    submitting: submitting$,
    error: error$,

    async submit(data: any) {
      calls.push({ data, timestamp: Date.now() });
      submitting$.set(true);
      error$.set(null);

      try {
        const result = await submitFn(data);
        data$.set(result);
      } catch (err) {
        error$.set(err as Error);
      } finally {
        submitting$.set(false);
      }
    },

    getCalls: () => calls,
  };
}

/**
 * Create a mock loader with data
 */
export function createMockLoaderWithData<T = any>(data: T): MockLoader<T> {
  return createMockLoader(async () => data);
}

/**
 * Create a mock loader with error
 */
export function createMockLoaderWithError(
  errorMessage: string
): MockLoader<any> {
  return createMockLoader<any>(async () => {
    throw new Error(errorMessage);
  });
}
