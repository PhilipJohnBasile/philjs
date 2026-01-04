/**
 * useFormAction - Remix-style form action hook
 *
 * Provides progressive enhancement for form submissions with:
 * - Automatic loading states
 * - Error handling
 * - Success/failure callbacks
 * - Works without JavaScript
 */
import { signal, memo } from '@philjs/core/signals';
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
export function useFormAction(options = {}) {
    const { action, method = 'POST', onSubmit, onSuccess, onError, onSettled, encType, resetOnSuccess = false, redirectTo, replace = false, transformData, validate, } = options;
    // State
    const data = signal(null);
    const error = signal(null);
    const isSubmitting = signal(false);
    const isSuccess = signal(false);
    const isError = signal(false);
    const submitCount = signal(0);
    const isIdle = memo(() => !isSubmitting());
    const state = {
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
    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        await submitFormData(formData, form);
    };
    /**
     * Submit form data
     */
    const submitFormData = async (formData, form) => {
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
            let result;
            // Submit
            if (typeof action === 'function') {
                // Call action function directly
                result = await action(formData);
            }
            else if (typeof action === 'string') {
                // Make HTTP request
                const body = dataToSubmit instanceof FormData
                    ? dataToSubmit
                    : JSON.stringify(dataToSubmit);
                const headers = {};
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
            }
            else {
                // No action - just call onSuccess with form data as result
                result = Object.fromEntries(formData);
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
                }
                else {
                    window.location.href = redirectTo;
                }
            }
        }
        catch (err) {
            // Error
            const formError = err;
            error.set(formError);
            isError.set(true);
            await onError?.(formError);
        }
        finally {
            isSubmitting.set(false);
            await onSettled?.();
        }
    };
    /**
     * Programmatic submit
     */
    const submit = async (formDataOrElement) => {
        let formData;
        let form;
        if (formDataOrElement instanceof FormData) {
            formData = formDataOrElement;
        }
        else if (formDataOrElement instanceof HTMLFormElement) {
            form = formDataOrElement;
            formData = new FormData(form);
        }
        else {
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
//# sourceMappingURL=useFormAction.js.map