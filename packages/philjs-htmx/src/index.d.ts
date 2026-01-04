/**
 * PhilJS HTMX Compatibility Layer
 *
 * Use HTMX-style hx-* attributes with PhilJS reactivity.
 * Progressive enhancement for HTML-first development.
 *
 * @example
 * ```html
 * <button hx-get="/api/users" hx-target="#user-list" hx-swap="innerHTML">
 *   Load Users
 * </button>
 *
 * <div id="user-list"></div>
 * ```
 *
 * @example
 * ```typescript
 * import { initHTMX, htmx } from '@philjs/htmx';
 *
 * // Initialize HTMX processing
 * initHTMX();
 *
 * // Or use programmatically
 * htmx.ajax('GET', '/api/users', { target: '#user-list' });
 * ```
 */
export interface HTMXConfig {
    /** Default swap style */
    defaultSwapStyle?: SwapStyle;
    /** Default swap delay in ms */
    defaultSwapDelay?: number;
    /** Default settle delay in ms */
    defaultSettleDelay?: number;
    /** Enable history API integration */
    historyEnabled?: boolean;
    /** Timeout for requests in ms */
    timeout?: number;
    /** Include credentials in requests */
    withCredentials?: boolean;
    /** Default indicator class */
    indicatorClass?: string;
    /** Request class added during loading */
    requestClass?: string;
    /** Enable scroll behavior */
    scrollBehavior?: 'smooth' | 'auto';
    /** Global error handler */
    onError?: (error: HTMXError) => void;
    /** Global before request hook */
    onBeforeRequest?: (event: HTMXRequestEvent) => boolean | void;
    /** Global after request hook */
    onAfterRequest?: (event: HTMXResponseEvent) => void;
    /** Global before swap hook */
    onBeforeSwap?: (event: HTMXSwapEvent) => boolean | void;
    /** Global after swap hook */
    onAfterSwap?: (event: HTMXSwapEvent) => void;
    /** Enable debug mode */
    debug?: boolean;
}
export type SwapStyle = 'innerHTML' | 'outerHTML' | 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend' | 'delete' | 'none';
export type TriggerEvent = 'click' | 'change' | 'submit' | 'input' | 'focus' | 'blur' | 'keyup' | 'keydown' | 'load' | 'revealed' | 'intersect' | 'every';
export interface TriggerSpec {
    event: TriggerEvent;
    modifiers: TriggerModifier[];
    pollInterval?: number;
}
export interface TriggerModifier {
    type: 'once' | 'changed' | 'delay' | 'throttle' | 'from' | 'target' | 'consume' | 'queue';
    value?: string | number;
}
export interface HTMXRequestEvent {
    element: Element;
    target: Element;
    verb: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    headers: Record<string, string>;
    parameters: Record<string, string>;
}
export interface HTMXResponseEvent {
    element: Element;
    target: Element;
    xhr: Response;
    successful: boolean;
    html: string;
}
export interface HTMXSwapEvent {
    element: Element;
    target: Element;
    html: string;
    swapStyle: SwapStyle;
}
export interface HTMXError {
    type: 'network' | 'timeout' | 'abort' | 'parse' | 'swap';
    message: string;
    element?: Element;
    xhr?: Response;
}
export interface AjaxOptions {
    target?: string | Element;
    swap?: SwapStyle;
    values?: Record<string, string>;
    headers?: Record<string, string>;
    select?: string;
    indicator?: string | Element;
}
/**
 * Initialize HTMX attribute processing
 */
export declare function initHTMX(userConfig?: HTMXConfig): void;
export declare const htmx: {
    /**
     * Configure HTMX
     */
    config(userConfig: HTMXConfig): void;
    /**
     * Process HTMX attributes on element
     */
    process(element: Element): void;
    /**
     * Make an AJAX request
     */
    ajax(verb: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, options?: AjaxOptions): Promise<void>;
    /**
     * Find elements with HTMX attributes
     */
    find(selector: string): Element[];
    /**
     * Add class after transition
     */
    addClass(element: Element, className: string): void;
    /**
     * Remove class after transition
     */
    removeClass(element: Element, className: string): void;
    /**
     * Toggle class
     */
    toggleClass(element: Element, className: string): void;
    /**
     * Trigger an event
     */
    trigger(element: Element | string, eventName: string, detail?: any): void;
    /**
     * Remove element with optional swap animation
     */
    remove(element: Element, swapDelay?: number): void;
    /**
     * Get closest element matching selector
     */
    closest(element: Element, selector: string): Element | null;
    /**
     * Refresh element (re-issue its request)
     */
    refresh(element: Element): void;
};
export interface HTMXExtension {
    name: string;
    onEvent?: (name: string, event: CustomEvent) => boolean | void;
    transformResponse?: (text: string, xhr: Response, element: Element) => string;
    isInlineSwap?: (swapStyle: string) => boolean;
    handleSwap?: (swapStyle: string, target: Element, fragment: DocumentFragment) => boolean;
    encodeParameters?: (xhr: XMLHttpRequest, parameters: any, element: Element) => any;
}
/**
 * Define an HTMX extension
 */
export declare function defineExtension(extension: HTMXExtension): void;
/**
 * Remove an extension
 */
export declare function removeExtension(name: string): void;
/**
 * Create HTMX response headers
 */
export declare function htmxResponse(options: {
    trigger?: string | Record<string, any>;
    triggerAfterSettle?: string | Record<string, any>;
    triggerAfterSwap?: string | Record<string, any>;
    push?: string;
    redirect?: string;
    refresh?: boolean;
    retarget?: string;
    reswap?: SwapStyle;
}): Record<string, string>;
/**
 * Check if request is from HTMX
 */
export declare function isHTMXRequest(request: Request): boolean;
/**
 * Get HTMX request info
 */
export declare function getHTMXInfo(request: Request): {
    isHTMX: boolean;
    target?: string;
    trigger?: string;
    triggerName?: string;
    prompt?: string;
    currentUrl?: string;
    boosted?: boolean;
};
export declare const htmxStyles = "\n.htmx-indicator {\n  opacity: 0;\n  transition: opacity 200ms ease-in;\n}\n\n.htmx-request .htmx-indicator {\n  opacity: 1;\n}\n\n.htmx-request.htmx-indicator {\n  opacity: 1;\n}\n\n.htmx-swapping {\n  opacity: 0;\n  transition: opacity 100ms ease-out;\n}\n\n.htmx-settling {\n  transition: all 200ms ease-in;\n}\n\n.htmx-added {\n  opacity: 0;\n}\n";
/**
 * Inject HTMX styles into document
 */
export declare function injectStyles(): void;
//# sourceMappingURL=index.d.ts.map