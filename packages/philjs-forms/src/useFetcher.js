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
import { signal, memo } from '@philjs/core/signals';
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
export function useFetcher() {
    // State
    const state = signal('idle');
    const data = signal(null);
    const error = signal(null);
    const formData = signal(null);
    const formMethod = signal(null);
    const formAction = signal(null);
    /**
     * Submit form data
     */
    const submit = async (submitData, options = {}) => {
        const { method = 'POST', action = '/', encType = 'application/json', navigate, replace = false, } = options;
        // Prepare form data
        let preparedFormData;
        if (submitData instanceof FormData) {
            preparedFormData = submitData;
        }
        else if (submitData instanceof HTMLFormElement) {
            preparedFormData = new FormData(submitData);
        }
        else {
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
            let body;
            const headers = {};
            if (encType === 'application/json') {
                body = JSON.stringify(Object.fromEntries(preparedFormData));
                headers['Content-Type'] = 'application/json';
            }
            else {
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
            let responseData;
            if (contentType?.includes('application/json')) {
                responseData = await response.json();
            }
            else {
                responseData = (await response.text());
            }
            // Success
            data.set(responseData);
            state.set('idle');
            // Navigate if requested
            if (navigate && typeof window !== 'undefined') {
                if (replace) {
                    window.location.replace(navigate);
                }
                else {
                    window.location.href = navigate;
                }
            }
        }
        catch (err) {
            // Error
            error.set(err);
            state.set('idle');
        }
        finally {
            formData.set(null);
            formMethod.set(null);
            formAction.set(null);
        }
    };
    /**
     * Load data from URL (GET request)
     */
    const load = async (url) => {
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
            let responseData;
            if (contentType?.includes('application/json')) {
                responseData = await response.json();
            }
            else {
                responseData = (await response.text());
            }
            data.set(responseData);
            state.set('idle');
        }
        catch (err) {
            error.set(err);
            state.set('idle');
        }
    };
    /**
     * Form component
     */
    const Form = (props) => {
        const handleSubmit = async (e) => {
            e.preventDefault();
            // Call user's onSubmit first
            props.onSubmit?.(e);
            const form = e.target;
            const formData = new FormData(form);
            await submit(formData, {
                action: props.action || form.action || '/',
                method: (props.method || form.method || 'POST'),
                encType: props.encType,
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
//# sourceMappingURL=useFetcher.js.map