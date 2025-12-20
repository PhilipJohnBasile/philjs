/**
 * Router Mocking Utilities
 *
 * Create mock router for testing route components
 */

import { signal } from 'philjs-core';

export interface MockRouter {
  pathname: ReturnType<typeof signal<string>>;
  params: ReturnType<typeof signal<Record<string, string>>>;
  searchParams: ReturnType<typeof signal<URLSearchParams>>;
  navigate: (path: string) => void;
  back: () => void;
  forward: () => void;
  push: (path: string) => void;
  replace: (path: string) => void;
  getCalls: () => Array<{ method: string; args: any[] }>;
}

/**
 * Create a mock router
 */
export function createMockRouter(initialPath = '/'): MockRouter {
  const pathname$ = signal(initialPath);
  const params$ = signal<Record<string, string>>({});
  const searchParams$ = signal(new URLSearchParams());
  const calls: Array<{ method: string; args: any[]; timestamp: number }> = [];

  const router: MockRouter = {
    pathname: pathname$,
    params: params$,
    searchParams: searchParams$,

    navigate: (path: string) => {
      calls.push({ method: 'navigate', args: [path], timestamp: Date.now() });
      pathname$.set(path);
    },

    back: () => {
      calls.push({ method: 'back', args: [], timestamp: Date.now() });
    },

    forward: () => {
      calls.push({ method: 'forward', args: [], timestamp: Date.now() });
    },

    push: (path: string) => {
      calls.push({ method: 'push', args: [path], timestamp: Date.now() });
      pathname$.set(path);
    },

    replace: (path: string) => {
      calls.push({ method: 'replace', args: [path], timestamp: Date.now() });
      pathname$.set(path);
    },

    getCalls: () => calls,
  };

  return router;
}

/**
 * Create mock route params
 */
export function createMockParams(params: Record<string, string>) {
  return signal(params);
}

/**
 * Create mock search params
 */
export function createMockSearchParams(params: Record<string, string> = {}) {
  return signal(new URLSearchParams(params));
}
