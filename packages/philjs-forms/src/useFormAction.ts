/**
 * useFormAction - Remix-style form action hook
 *
 * Provides progressive enhancement for form submissions with:
 * - Automatic loading states
 * - Error handling
 * - Success/failure callbacks
 * - Works without JavaScript
 */

import { signal, memo, type Signal, type Memo } from 'philjs-core/signals';
import type { FormValues } from './types.js';

export interface FormActionOptions<TData = any, TError = Error> {
  /**
   * The action URL or function to call
   */
  action?: string | ((formData: FormData) => Promise<TData>);

  /**
   * HTTP method for the form
   * @default 'POST'
   */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  /**
   * Called before submission
   */
  onSubmit?: (formData: FormData) => void | Promise<void>;

  /**
   * Called on successful submission
   */
  onSuccess?: (data: TData) => void | Promise<void>;

  /**
   * Called on failed submission
   */
  onError?: (error: TError) => void | Promise<void>;

  /**
   * Called after submission (success or error)
   */
  onSettled?: () => void | Promise<void>;

  /**
   * Enctype for file uploads
   */
  encType?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';

  /**
   * Reset form after successful submission
   * @default false
   */
  resetOnSuccess?: boolean;

  /**
   * Navigate after successful submission
   */
  redirectTo?: string;

  /**
   * Replace current history entry instead of pushing
   * @default false
   */
  replace?: boolean;

  /**
   * Transform form data before submission
   */
  transformData?: (formData: FormData) => FormData | Record<string, any>;

  /**
   * Validate form data before submission
   */
  validate?: (formData: FormData) => Promise<Record<string, string> | null>;
}

export interface FormActionState<TData = any, TError = Error> {
  data: Signal<TData | null>;
  error: Signal<TError | null>;
  isSubmitting: Signal<boolean>;
  isSuccess: Signal<boolean>;
  isError: Signal<boolean>;
  submitCount: Signal<number>;
}

export interface FormActionReturn<TData = any, TError = Error> {
  /**
   * Form action state
   */
  state: FormActionState<TData, TError>;

  /**
   * Computed: is the form idle (not submitting)
   */
  isIdle: Memo<boolean>;

  /**
   * Form props to spread on <form>
   */
  formProps: {
    action?: string;
    method: string;
    encType?: string;
    onSubmit: (e: Event) => Promise<void>;
  };

  /**
   * Submit the form programmatically
   */
  submit: (formData?: FormData | HTMLFormElement) => Promise<void>;

  /**
   * Reset the form state
   */
  reset: () => void;
}

/**
 * Hook for handling form actions with progressive enhancement
 *
 * @example
 * ```tsx
 * const { formProps, state } = useFormAction({
 *   action: '/api/login',
 *   method: 'POST',
 *   onSuccess: (data) => {
 *     console.log('Logged in:', data);
 *   },
 *   onError: (error) => {
 *     console.error('Login failed:', error);
 *   }
 * });
 *
 * return (
 *   <form {...formProps}>
 *     <input name="email" type="email" required />
 *     <input name="password" type="password" required />
 *     <button disabled={state.isSubmitting()}>
 *       {state.isSubmitting() ? 'Logging in...' : 'Log in'}
 *     </button>
 *     {state.error() && <p>{state.error().message}</p>}
 *   </form>
 * );
 * ```
 */
export function useFormAction<TData = any, TError = Error>(
  options: FormActionOptions<TData, TError> = {}
): FormActionReturn<TData, TError> {
  const {
    action,
    method = 'POST',
    onSubmit,
    onSuccess,
    onError,
    onSettled,
    encType,
    resetOnSuccess = false,
    redirectTo,
    replace = false,
    transformData,
    validate,
  } = options;

  // State
  const data = signal<TData | null>(null);
  const error = signal<TError | null>(null);
  const isSubmitting = signal(false);
  const isSuccess = signal(false);
  const isError = signal(false);
  const submitCount = signal(0);

  const isIdle = memo(() => !isSubmitting());

  const state: FormActionState<TData, TError> = {
    data,
    error,
    isSubmitting,
    isSuccess,
    isError,
    submitCount,
  };

  /**
   * Submit handler
   */
  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    await submitFormData(formData, form);
  };

  /**
   * Submit form data
   */
  const submitFormData = async (formData: FormData, form?: HTMLFormElement) => {
    // Reset previous state
    error.set(null);
    isError.set(false);
    isSuccess.set(false);

    // Start submission
    isSubmitting.set(true);
    submitCount.set(submitCount() + 1);

    try {
      // Call onSubmit
      await onSubmit?.(formData);

      // Validate
      if (validate) {
        const errors = await validate(formData);
        if (errors && Object.keys(errors).length > 0) {
          throw new Error('Validation failed');
        }
      }

      // Transform data if needed
      const dataToSubmit = transformData ? transformData(formData) : formData;

      let result: TData;

      // Submit
      if (typeof action === 'function') {
        // Call action function directly
        result = await action(formData);
      } else if (typeof action === 'string') {
        // Make HTTP request
        const body = dataToSubmit instanceof FormData
          ? dataToSubmit
          : JSON.stringify(dataToSubmit);

        const headers: Record<string, string> = {};
        if (!(dataToSubmit instanceof FormData)) {
          headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(action, {
          method,
          body,
          headers,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        result = await response.json();
      } else {
        // No action - just call onSuccess with form data as result
        result = Object.fromEntries(formData) as TData;
      }

      // Success
      data.set(result);
      isSuccess.set(true);

      await onSuccess?.(result);

      // Reset form if requested
      if (resetOnSuccess && form) {
        form.reset();
      }

      // Redirect if requested
      if (redirectTo && typeof window !== 'undefined') {
        if (replace) {
          window.location.replace(redirectTo);
        } else {
          window.location.href = redirectTo;
        }
      }
    } catch (err) {
      // Error
      const formError = err as TError;
      error.set(formError);
      isError.set(true);

      await onError?.(formError);
    } finally {
      isSubmitting.set(false);
      await onSettled?.();
    }
  };

  /**
   * Programmatic submit
   */
  const submit = async (formDataOrElement?: FormData | HTMLFormElement) => {
    let formData: FormData;
    let form: HTMLFormElement | undefined;

    if (formDataOrElement instanceof FormData) {
      formData = formDataOrElement;
    } else if (formDataOrElement instanceof HTMLFormElement) {
      form = formDataOrElement;
      formData = new FormData(form);
    } else {
      formData = new FormData();
    }

    await submitFormData(formData, form);
  };

  /**
   * Reset state
   */
  const reset = () => {
    data.set(null);
    error.set(null);
    isSubmitting.set(false);
    isSuccess.set(false);
    isError.set(false);
    submitCount.set(0);
  };

  return {
    state,
    isIdle,
    formProps: {
      ...(typeof action === 'string' && { action }),
      method: method.toUpperCase(),
      ...(encType !== undefined && { encType }),
      onSubmit: handleSubmit,
    },
    submit,
    reset,
  };
}
