/**
 * Route Testing Utilities
 *
 * Comprehensive utilities for testing PhilJS routes:
 * - Route component testing
 * - Loader mocking
 * - Action mocking
 * - Navigation testing
 * - Route parameter testing
 */

import { signal, type Signal } from 'philjs-core/signals';

// ============================================================================
// Types
// ============================================================================

export interface MockRouteOptions {
  /**
   * Route path
   */
  path?: string;

  /**
   * Route parameters
   */
  params?: Record<string, string>;

  /**
   * Search params
   */
  searchParams?: Record<string, string>;

  /**
   * Loader data
   */
  loaderData?: any;

  /**
   * Action data
   */
  actionData?: any;

  /**
   * Navigation state
   */
  navigation?: NavigationState;

  /**
   * Form data for actions
   */
  formData?: FormData;
}

export interface NavigationState {
  state: 'idle' | 'loading' | 'submitting';
  location?: {
    pathname: string;
    search: string;
    hash: string;
  };
}

export interface MockLoader<T = any> {
  /**
   * Mock loader function
   */
  mock: jest.Mock | ((args: LoaderArgs) => T | Promise<T>);

  /**
   * Set loader response
   */
  mockReturnValue: (value: T) => void;

  /**
   * Set loader error
   */
  mockRejectedValue: (error: Error) => void;

  /**
   * Reset loader mock
   */
  mockReset: () => void;

  /**
   * Get call count
   */
  callCount: () => number;

  /**
   * Get call arguments
   */
  calls: () => LoaderArgs[];
}

export interface MockAction<T = any> {
  /**
   * Mock action function
   */
  mock: jest.Mock | ((args: ActionArgs) => T | Promise<T>);

  /**
   * Set action response
   */
  mockReturnValue: (value: T) => void;

  /**
   * Set action error
   */
  mockRejectedValue: (error: Error) => void;

  /**
   * Reset action mock
   */
  mockReset: () => void;

  /**
   * Get call count
   */
  callCount: () => number;

  /**
   * Get call arguments
   */
  calls: () => ActionArgs[];
}

export interface LoaderArgs {
  request: Request;
  params: Record<string, string>;
  context?: any;
}

export interface ActionArgs {
  request: Request;
  params: Record<string, string>;
  formData?: FormData;
  context?: any;
}

export interface RouteTestContext {
  /**
   * Current path
   */
  path: Signal<string>;

  /**
   * Route params
   */
  params: Signal<Record<string, string>>;

  /**
   * Search params
   */
  searchParams: Signal<URLSearchParams>;

  /**
   * Loader data
   */
  loaderData: Signal<any>;

  /**
   * Action data
   */
  actionData: Signal<any>;

  /**
   * Navigation state
   */
  navigation: Signal<NavigationState>;

  /**
   * Navigate to path
   */
  navigate: (to: string, options?: NavigateOptions) => void;

  /**
   * Submit form
   */
  submit: (formData: FormData, options?: SubmitOptions) => Promise<void>;

  /**
   * Reload loader
   */
  revalidate: () => Promise<void>;
}

export interface NavigateOptions {
  replace?: boolean;
  state?: any;
}

export interface SubmitOptions {
  method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
  action?: string;
  replace?: boolean;
}

// ============================================================================
// Route Testing
// ============================================================================

/**
 * Create mock route context
 */
export function createMockRoute(options: MockRouteOptions = {}): RouteTestContext {
  const {
    path: initialPath = '/',
    params: initialParams = {},
    searchParams: initialSearchParams = {},
    loaderData: initialLoaderData = null,
    actionData: initialActionData = null,
    navigation: initialNavigation = { state: 'idle' },
  } = options;

  const path = signal(initialPath);
  const params = signal(initialParams);
  const searchParams = signal(new URLSearchParams(initialSearchParams));
  const loaderData = signal(initialLoaderData);
  const actionData = signal(initialActionData);
  const navigation = signal(initialNavigation);

  const navigate = (to: string, options: NavigateOptions = {}) => {
    navigation.set({ state: 'loading' });

    // Simulate navigation
    setTimeout(() => {
      path.set(to);
      const url = new URL(to, 'http://localhost');
      searchParams.set(url.searchParams);
      navigation.set({ state: 'idle' });
    }, 0);
  };

  const submit = async (formData: FormData, options: SubmitOptions = {}) => {
    navigation.set({ state: 'submitting' });

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 0));

    navigation.set({ state: 'idle' });
  };

  const revalidate = async () => {
    navigation.set({ state: 'loading' });

    // Simulate revalidation
    await new Promise(resolve => setTimeout(resolve, 0));

    navigation.set({ state: 'idle' });
  };

  return {
    path,
    params,
    searchParams,
    loaderData,
    actionData,
    navigation,
    navigate,
    submit,
    revalidate,
  };
}

/**
 * Create mock loader
 */
export function createMockLoader<T = any>(
  defaultValue?: T
): MockLoader<T> {
  const calls: LoaderArgs[] = [];
  let returnValue: T | undefined = defaultValue;
  let rejectedValue: Error | undefined;

  const mockFn = async (args: LoaderArgs): Promise<T> => {
    calls.push(args);

    if (rejectedValue) {
      throw rejectedValue;
    }

    if (returnValue !== undefined) {
      return returnValue;
    }

    throw new Error('Mock loader has no return value');
  };

  return {
    mock: mockFn as any,
    mockReturnValue: (value: T) => {
      returnValue = value;
      rejectedValue = undefined;
    },
    mockRejectedValue: (error: Error) => {
      rejectedValue = error;
      returnValue = undefined;
    },
    mockReset: () => {
      calls.length = 0;
      returnValue = defaultValue;
      rejectedValue = undefined;
    },
    callCount: () => calls.length,
    calls: () => [...calls],
  };
}

/**
 * Create mock action
 */
export function createMockAction<T = any>(
  defaultValue?: T
): MockAction<T> {
  const calls: ActionArgs[] = [];
  let returnValue: T | undefined = defaultValue;
  let rejectedValue: Error | undefined;

  const mockFn = async (args: ActionArgs): Promise<T> => {
    calls.push(args);

    if (rejectedValue) {
      throw rejectedValue;
    }

    if (returnValue !== undefined) {
      return returnValue;
    }

    throw new Error('Mock action has no return value');
  };

  return {
    mock: mockFn as any,
    mockReturnValue: (value: T) => {
      returnValue = value;
      rejectedValue = undefined;
    },
    mockRejectedValue: (error: Error) => {
      rejectedValue = error;
      returnValue = undefined;
    },
    mockReset: () => {
      calls.length = 0;
      returnValue = defaultValue;
      rejectedValue = undefined;
    },
    callCount: () => calls.length,
    calls: () => [...calls],
  };
}

/**
 * Create mock Request
 */
export function createMockRequest(
  url: string,
  options: RequestInit = {}
): Request {
  const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
  return new Request(fullUrl, options);
}

/**
 * Create mock FormData
 */
export function createMockFormData(
  data: Record<string, string | Blob>
): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value);
  }

  return formData;
}

// ============================================================================
// Loader Testing Utilities
// ============================================================================

/**
 * Test loader function
 */
export async function testLoader<T>(
  loader: (args: LoaderArgs) => T | Promise<T>,
  options: {
    url?: string;
    params?: Record<string, string>;
    context?: any;
  } = {}
): Promise<T> {
  const {
    url = '/',
    params = {},
    context,
  } = options;

  const request = createMockRequest(url);

  return loader({ request, params, context });
}

/**
 * Test loader with params
 */
export async function testLoaderWithParams<T>(
  loader: (args: LoaderArgs) => T | Promise<T>,
  params: Record<string, string>
): Promise<T> {
  return testLoader(loader, { params });
}

/**
 * Expect loader to return value
 */
export async function expectLoaderToReturn<T>(
  loader: (args: LoaderArgs) => T | Promise<T>,
  expectedValue: T,
  options?: {
    url?: string;
    params?: Record<string, string>;
  }
): Promise<void> {
  const result = await testLoader(loader, options);
  expect(result).toEqual(expectedValue);
}

/**
 * Expect loader to throw error
 */
export async function expectLoaderToThrow(
  loader: (args: LoaderArgs) => any,
  expectedError?: string | RegExp | Error,
  options?: {
    url?: string;
    params?: Record<string, string>;
  }
): Promise<void> {
  await expect(testLoader(loader, options)).rejects.toThrow(expectedError);
}

// ============================================================================
// Action Testing Utilities
// ============================================================================

/**
 * Test action function
 */
export async function testAction<T>(
  action: (args: ActionArgs) => T | Promise<T>,
  options: {
    url?: string;
    method?: string;
    formData?: FormData | Record<string, string>;
    params?: Record<string, string>;
    context?: any;
  } = {}
): Promise<T> {
  const {
    url = '/',
    method = 'POST',
    formData: formDataInput,
    params = {},
    context,
  } = options;

  const formData = formDataInput instanceof FormData
    ? formDataInput
    : createMockFormData(formDataInput || {});

  const request = createMockRequest(url, {
    method,
    body: formData,
  });

  return action({ request, params, formData, context });
}

/**
 * Test POST action with form data
 */
export async function testPostAction<T>(
  action: (args: ActionArgs) => T | Promise<T>,
  formData: Record<string, string>
): Promise<T> {
  return testAction(action, { method: 'POST', formData });
}

/**
 * Expect action to return value
 */
export async function expectActionToReturn<T>(
  action: (args: ActionArgs) => T | Promise<T>,
  expectedValue: T,
  options?: {
    formData?: Record<string, string>;
    params?: Record<string, string>;
  }
): Promise<void> {
  const result = await testAction(action, options);
  expect(result).toEqual(expectedValue);
}

/**
 * Expect action to throw error
 */
export async function expectActionToThrow(
  action: (args: ActionArgs) => any,
  expectedError?: string | RegExp | Error,
  options?: {
    formData?: Record<string, string>;
    params?: Record<string, string>;
  }
): Promise<void> {
  await expect(testAction(action, options)).rejects.toThrow(expectedError);
}

// ============================================================================
// Navigation Testing
// ============================================================================

/**
 * Test navigation
 */
export function testNavigation() {
  const history: string[] = [];
  let currentPath = '/';

  return {
    navigate: (to: string) => {
      history.push(to);
      currentPath = to;
    },
    getCurrentPath: () => currentPath,
    getHistory: () => [...history],
    clearHistory: () => {
      history.length = 0;
    },
  };
}

/**
 * Wait for navigation
 */
export async function waitForNavigation(
  context: RouteTestContext,
  expectedPath?: string,
  timeout = 1000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (context.navigation().state === 'idle') {
      if (!expectedPath || context.path() === expectedPath) {
        return;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 10));
  }

  throw new Error(`Navigation did not complete within ${timeout}ms`);
}

/**
 * Wait for loader data
 */
export async function waitForLoaderData(
  context: RouteTestContext,
  timeout = 1000
): Promise<any> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const data = context.loaderData();
    if (data !== null && data !== undefined) {
      return data;
    }

    await new Promise(resolve => setTimeout(resolve, 10));
  }

  throw new Error(`Loader data not available within ${timeout}ms`);
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert route params
 */
export function assertRouteParams(
  context: RouteTestContext,
  expected: Record<string, string>
): void {
  expect(context.params()).toEqual(expected);
}

/**
 * Assert search params
 */
export function assertSearchParams(
  context: RouteTestContext,
  expected: Record<string, string>
): void {
  const searchParams = context.searchParams();
  const actual: Record<string, string> = {};

  for (const [key, value] of searchParams) {
    actual[key] = value;
  }

  expect(actual).toEqual(expected);
}

/**
 * Assert navigation state
 */
export function assertNavigationState(
  context: RouteTestContext,
  expectedState: 'idle' | 'loading' | 'submitting'
): void {
  expect(context.navigation().state).toBe(expectedState);
}

// Global expect function (assumes Jest/Vitest)
declare global {
  function expect(value: any): any;
}
