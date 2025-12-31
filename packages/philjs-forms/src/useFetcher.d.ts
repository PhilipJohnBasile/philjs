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
import { type Signal } from 'philjs-core/signals';
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
    submit: (data: FormData | HTMLFormElement | Record<string, any>, options?: FetcherSubmitOptions) => Promise<void>;
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
export declare function useFetcher<TData = any, TError = Error>(): FetcherReturn<TData, TError>;
//# sourceMappingURL=useFetcher.d.ts.map