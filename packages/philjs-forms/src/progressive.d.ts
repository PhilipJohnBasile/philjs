/**
 * Progressive Enhancement utilities
 *
 * Ensure forms work without JavaScript, then enhance with JS when available.
 */
import { type Signal } from '@philjs/core/signals';
/**
 * Detect if JavaScript is available
 */
export declare const isJSEnabled: Signal<boolean>;
/**
 * Detect if the page has been hydrated
 */
export declare const isHydrated: Signal<boolean>;
/**
 * Progressive form enhancement options
 */
export interface ProgressiveFormOptions {
    /**
     * Disable form while JavaScript loads
     * @default false
     */
    disableWhileLoading?: boolean;
    /**
     * Show loading indicator
     * @default true
     */
    showLoadingIndicator?: boolean;
    /**
     * Prevent multiple submissions
     * @default true
     */
    preventMultipleSubmit?: boolean;
    /**
     * Auto-focus first error field
     * @default true
     */
    focusFirstError?: boolean;
    /**
     * Save form data to localStorage on change
     * @default false
     */
    persistToLocalStorage?: boolean;
    /**
     * LocalStorage key for persistence
     */
    storageKey?: string;
    /**
     * Restore from localStorage on mount
     * @default true
     */
    restoreFromLocalStorage?: boolean;
}
/**
 * Enhance a form with progressive enhancement
 *
 * @example
 * ```tsx
 * const { formRef, isEnhanced } = useProgressiveForm({
 *   preventMultipleSubmit: true,
 *   focusFirstError: true,
 *   persistToLocalStorage: true,
 *   storageKey: 'checkout-form'
 * });
 *
 * return (
 *   <form ref={formRef} action="/checkout" method="POST">
 *     <input name="email" required />
 *     <button>Checkout</button>
 *     {!isEnhanced() && <noscript>Form works without JavaScript</noscript>}
 *   </form>
 * );
 * ```
 */
export declare function useProgressiveForm(options?: ProgressiveFormOptions): {
    /**
     * Ref to attach to form element
     */
    formRef: (element: HTMLFormElement | null) => void;
    /**
     * Is the form enhanced with JavaScript?
     */
    isEnhanced: Signal<boolean>;
    /**
     * Is the form currently submitting?
     */
    isSubmitting: Signal<boolean>;
    /**
     * Save form data to localStorage
     */
    save: () => void;
    /**
     * Restore form data from localStorage
     */
    restore: () => void;
    /**
     * Clear saved data from localStorage
     */
    clearSaved: () => void;
};
/**
 * Check if form will work without JavaScript
 *
 * @example
 * ```tsx
 * const willWork = isProgressivelyEnhanced(formElement);
 * ```
 */
export declare function isProgressivelyEnhanced(form: HTMLFormElement): boolean;
/**
 * Add hidden input with JavaScript availability marker
 *
 * Useful for server-side detection of whether JS is enabled.
 *
 * @example
 * ```tsx
 * <form action="/submit">
 *   {addJavaScriptMarker()}
 *   <input name="email" required />
 *   <button>Submit</button>
 * </form>
 * ```
 */
export declare function addJavaScriptMarker(): HTMLInputElement | null;
/**
 * Detect if client supports JavaScript (server-side check)
 *
 * @example
 * ```ts
 * const formData = await request.formData();
 * const hasJS = clientHasJavaScript(formData);
 *
 * if (!hasJS) {
 *   // Redirect to success page instead of returning JSON
 *   return redirect('/success');
 * } else {
 *   // Return JSON for client-side handling
 *   return json({ success: true });
 * }
 * ```
 */
export declare function clientHasJavaScript(formData: FormData): boolean;
/**
 * NoScript component - shows content only when JavaScript is disabled
 *
 * @example
 * ```tsx
 * <NoScript>
 *   <p>This form works without JavaScript.</p>
 *   <p>You will be redirected to a confirmation page after submission.</p>
 * </NoScript>
 * ```
 */
export declare function NoScript(props: {
    children: any;
}): {
    type: string;
    props: {};
    children: any;
};
/**
 * ClientOnly component - shows content only when JavaScript is enabled
 *
 * @example
 * ```tsx
 * <ClientOnly fallback={<p>Loading...</p>}>
 *   <InteractiveWidget />
 * </ClientOnly>
 * ```
 */
export declare function ClientOnly(props: {
    children: any;
    fallback?: any;
}): any;
//# sourceMappingURL=progressive.d.ts.map