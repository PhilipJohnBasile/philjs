/**
 * PhilJS HTMX Compatibility
 *
 * Provides HTMX-style attributes for server-driven UI updates.
 *
 * SECURITY NOTE: This module trusts server responses and renders them as HTML.
 * Ensure your server endpoints:
 * 1. Return properly escaped/sanitized HTML
 * 2. Are protected against XSS injection
 * 3. Validate and sanitize all user input before including in responses
 *
 * The hx-vals attribute evaluates JavaScript expressions - never use with
 * untrusted input. Only use these attributes in trusted HTML templates.
 *
 * @example
 * ```html
 * <button hx-get="/api/users" hx-target="#users-list">
 *   Load Users
 * </button>
 *
 * <form hx-post="/api/submit" hx-swap="outerHTML">
 *   <input name="email" />
 *   <button>Submit</button>
 * </form>
 * ```
 */
export interface HtmxConfig {
    /** Default swap strategy */
    defaultSwap: SwapStrategy;
    /** Default target (css selector) */
    defaultTarget?: string;
    /** Request timeout in ms */
    timeout: number;
    /** Include credentials in requests */
    withCredentials: boolean;
    /** Global request headers */
    headers: Record<string, string>;
    /** Enable history push */
    historyEnabled: boolean;
    /** Loading indicator class */
    indicatorClass: string;
    /** Disable elements during request */
    disableOnRequest: boolean;
}
export type SwapStrategy = 'innerHTML' | 'outerHTML' | 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend' | 'delete' | 'none';
export interface HtmxRequest {
    method: string;
    url: string;
    target: HTMLElement | null;
    trigger: HTMLElement;
    swap: SwapStrategy;
    values: Record<string, string>;
    headers: Record<string, string>;
}
export interface HtmxResponse {
    html: string;
    headers: Headers;
    status: number;
    url: string;
}
/**
 * Configure HTMX behavior
 */
export declare function configure(options: Partial<HtmxConfig>): void;
/**
 * Process an element for HTMX attributes
 */
export declare function process(el: HTMLElement): void;
/**
 * Initialize HTMX on the document
 */
export declare function initHtmx(root?: HTMLElement): void;
export { process as processHtmx };
//# sourceMappingURL=htmx.d.ts.map