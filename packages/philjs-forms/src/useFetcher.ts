/**
 * useFetcher - Remix-style fetcher for non-navigational form submissions
 *
 * Perfect for:
 * - Newsletter signups
 * - Like buttons
 * - Add to cart
 * - Delete actions
 * - Any form that doesn't navigate
 */

import { signal, memo, type Signal } from 'philjs-core/signals';

export type FetcherMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface FetcherSubmitOptions {
  /**
   * HTTP method
   * @default 'POST'
   */
  method?: FetcherMethod;

  /**
   * Action URL
   */
  action?: string;

  /**
   * Enctype for the submission
   */
  encType?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'application/json';

  /**
   * Navigate to URL after successful submission
   */
  navigate?: string;

  /**
   * Replace current history entry
   */
  replace?: boolean;
}

export interface FetcherState<TData = any, TError = Error> {
  /**
   * Current state of the fetcher
   */
  state: 'idle' | 'submitting' | 'loading';

  /**
   * Response data from the action
   */
  data: TData | null;

  /**
   * Error from the action
   */
  error: TError | null;

  /**
   * Form data being submitted
   */
  formData: FormData | null;

  /**
   * Method used for submission
   */
  formMethod: FetcherMethod | null;

  /**
   * Action URL being submitted to
   */
  formAction: string | null;
}

export interface FetcherReturn<TData = any, TError = Error> {
  /**
   * Current fetcher state (reactive signal)
   */
  state: Signal<FetcherState<TData, TError>['state']>;

  /**
   * Response data (reactive signal)
   */
  data: Signal<TData | null>;

  /**
   * Error (reactive signal)
   */
  error: Signal<TError | null>;

  /**
   * Form data being submitted (reactive signal)
   */
  formData: Signal<FormData | null>;

  /**
   * Form method (reactive signal)
   */
  formMethod: Signal<FetcherMethod | null>;

  /**
   * Form action URL (reactive signal)
   */
  formAction: Signal<string | null>;

  /**
   * Submit form data
   */
  submit: (
    data: FormData | HTMLFormElement | Record<string, any>,
    options?: FetcherSubmitOptions
  ) => Promise<void>;

  /**
   * Load data from a URL (GET request)
   */
  load: (url: string) => Promise<void>;

  /**
   * Get form props for <fetcher.Form>
   */
  Form: (props: {
    action?: string;
    method?: FetcherMethod;
    encType?: string;
    onSubmit?: (e: Event) => void;
    children?: any;
  }) => any;
}

/**
 * Hook for non-navigational form submissions
 *
 * @example
 * ```tsx
 * // Newsletter signup (doesn't navigate)
 * const fetcher = useFetcher();
 *
 * return (
 *   <fetcher.Form action="/api/newsletter" method="POST">
 *     <input name="email" type="email" required />
 *     <button disabled={fetcher.state() === 'submitting'}>
 *       {fetcher.state() === 'submitting' ? 'Subscribing...' : 'Subscribe'}
 *     </button>
 *     {fetcher.data() && <p>Thanks for subscribing!</p>}
 *     {fetcher.error() && <p>Error: {fetcher.error().message}</p>}
 *   </fetcher.Form>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // Like button
 * const fetcher = useFetcher();
 *
 * const handleLike = () => {
 *   fetcher.submit(
 *     { postId: post.id },
 *     { action: '/api/like', method: 'POST' }
 *   );
 * };
 *
 * return (
 *   <button onClick={handleLike} disabled={fetcher.state() !== 'idle'}>
 *     {fetcher.state() === 'submitting' ? 'Liking...' : 'Like'}
 *   </button>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // Delete item
 * const fetcher = useFetcher();
 *
 * const handleDelete = () => {
 *   if (confirm('Are you sure?')) {
 *     fetcher.submit(
 *       { id: item.id },
 *       { action: `/api/items/${item.id}`, method: 'DELETE' }
 *     );
 *   }
 * };
 * ```
 */
export function useFetcher<TData = any, TError = Error>(): FetcherReturn<TData, TError> {
  // State
  const state = signal<FetcherState<TData, TError>['state']>('idle');
  const data = signal<TData | null>(null);
  const error = signal<TError | null>(null);
  const formData = signal<FormData | null>(null);
  const formMethod = signal<FetcherMethod | null>(null);
  const formAction = signal<string | null>(null);

  /**
   * Submit form data
   */
  const submit = async (
    submitData: FormData | HTMLFormElement | Record<string, any>,
    options: FetcherSubmitOptions = {}
  ) => {
    const {
      method = 'POST',
      action = '/',
      encType = 'application/json',
      navigate,
      replace = false,
    } = options;

    // Prepare form data
    let preparedFormData: FormData;

    if (submitData instanceof FormData) {
      preparedFormData = submitData;
    } else if (submitData instanceof HTMLFormElement) {
      preparedFormData = new FormData(submitData);
    } else {
      preparedFormData = new FormData();
      Object.entries(submitData).forEach(([key, value]) => {
        preparedFormData.append(key, String(value));
      });
    }

    // Set state
    state.set('submitting');
    formData.set(preparedFormData);
    formMethod.set(method);
    formAction.set(action);
    error.set(null);

    try {
      // Prepare request body
      let body: any;
      const headers: Record<string, string> = {};

      if (encType === 'application/json') {
        body = JSON.stringify(Object.fromEntries(preparedFormData));
        headers['Content-Type'] = 'application/json';
      } else {
        body = preparedFormData;
      }

      // Make request
      const response = await fetch(action, {
        method,
        body,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let responseData: TData;

      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = (await response.text()) as any;
      }

      // Success
      data.set(responseData);
      state.set('idle');

      // Navigate if requested
      if (navigate && typeof window !== 'undefined') {
        if (replace) {
          window.location.replace(navigate);
        } else {
          window.location.href = navigate;
        }
      }
    } catch (err) {
      // Error
      error.set(err as TError);
      state.set('idle');
    } finally {
      formData.set(null);
      formMethod.set(null);
      formAction.set(null);
    }
  };

  /**
   * Load data from URL (GET request)
   */
  const load = async (url: string) => {
    state.set('loading');
    error.set(null);

    try {
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      let responseData: TData;

      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = (await response.text()) as any;
      }

      data.set(responseData);
      state.set('idle');
    } catch (err) {
      error.set(err as TError);
      state.set('idle');
    }
  };

  /**
   * Form component
   */
  const Form = (props: {
    action?: string;
    method?: FetcherMethod;
    encType?: string;
    onSubmit?: (e: Event) => void;
    children?: any;
  }) => {
    const handleSubmit = async (e: Event) => {
      e.preventDefault();

      // Call user's onSubmit first
      props.onSubmit?.(e);

      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      await submit(formData, {
        action: props.action || form.action || '/',
        method: (props.method || form.method || 'POST') as FetcherMethod,
        encType: props.encType as any,
      });
    };

    return {
      type: 'form',
      props: {
        action: props.action,
        method: props.method?.toUpperCase() || 'POST',
        encType: props.encType,
        onSubmit: handleSubmit,
      },
      children: props.children,
    };
  };

  return {
    state,
    data,
    error,
    formData,
    formMethod,
    formAction,
    submit,
    load,
    Form,
  };
}
