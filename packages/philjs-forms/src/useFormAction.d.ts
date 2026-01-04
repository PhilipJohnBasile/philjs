/**
 * useFormAction - Remix-style form action hook
 *
 * Provides progressive enhancement for form submissions with:
 * - Automatic loading states
 * - Error handling
 * - Success/failure callbacks
 * - Works without JavaScript
 */
import { type Signal, type Memo } from '@philjs/core/signals';
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
export declare function useFormAction<TData = any, TError = Error>(options?: FormActionOptions<TData, TError>): FormActionReturn<TData, TError>;
//# sourceMappingURL=useFormAction.d.ts.map