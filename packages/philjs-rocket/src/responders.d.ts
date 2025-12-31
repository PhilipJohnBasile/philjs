/**
 * PhilJS Rocket Responders
 *
 * Custom responders for PhilJS components in Rocket.
 * Responders convert PhilJS views into HTTP responses.
 */
import type { HtmlResponderOptions, JsonResponderOptions, StreamResponderOptions, MetaTag, Script } from './types.js';
/**
 * HTML Response builder for PhilJS views
 */
export declare class HtmlResponder {
    private content;
    private options;
    constructor(options?: HtmlResponderOptions);
    /**
     * Set HTML content
     */
    html(content: string): this;
    /**
     * Set document title
     */
    title(title: string): this;
    /**
     * Add meta tag
     */
    meta(tag: MetaTag): this;
    /**
     * Add script
     */
    script(script: Script): this;
    /**
     * Add stylesheet
     */
    style(href: string): this;
    /**
     * Set hydration data
     */
    hydrationData(data: unknown): this;
    /**
     * Set HTTP status code
     */
    status(code: number): this;
    /**
     * Add response header
     */
    header(name: string, value: string): this;
    /**
     * Enable caching
     */
    cache(ttl: number): this;
    /**
     * Build full HTML document
     */
    buildDocument(): string;
    /**
     * Generate Rust responder code
     */
    toRustCode(): string;
}
/**
 * JSON Response builder
 */
export declare class JsonResponder<T> {
    private data;
    private options;
    constructor(data: T, options?: JsonResponderOptions);
    /**
     * Pretty print JSON
     */
    pretty(): this;
    /**
     * Set HTTP status code
     */
    status(code: number): this;
    /**
     * Add response header
     */
    header(name: string, value: string): this;
    /**
     * Build JSON string
     */
    build(): string;
    /**
     * Generate Rust responder code
     */
    static toRustCode(): string;
}
/**
 * Streaming HTML Response for SSR
 */
export declare class StreamResponder {
    private options;
    private chunks;
    constructor(options?: StreamResponderOptions);
    /**
     * Add a chunk to the stream
     */
    push(chunk: string): this;
    /**
     * Set HTTP status code
     */
    status(code: number): this;
    /**
     * Generate Rust responder code
     */
    static toRustCode(): string;
}
/**
 * Redirect Response builder
 */
export declare class RedirectResponder {
    private url;
    private permanent;
    constructor(url: string, permanent?: boolean);
    /**
     * Create a temporary redirect (302)
     */
    static temporary(url: string): RedirectResponder;
    /**
     * Create a permanent redirect (301)
     */
    static permanent(url: string): RedirectResponder;
    /**
     * Create a "See Other" redirect (303)
     */
    static seeOther(url: string): RedirectResponder;
    /**
     * Generate Rust responder code
     */
    static toRustCode(): string;
}
/**
 * Error Response builder
 */
export declare class ErrorResponder {
    private code;
    private message;
    private details?;
    constructor(code: number, message: string, details?: unknown);
    /**
     * Create a 400 Bad Request error
     */
    static badRequest(message?: string): ErrorResponder;
    /**
     * Create a 401 Unauthorized error
     */
    static unauthorized(message?: string): ErrorResponder;
    /**
     * Create a 403 Forbidden error
     */
    static forbidden(message?: string): ErrorResponder;
    /**
     * Create a 404 Not Found error
     */
    static notFound(message?: string): ErrorResponder;
    /**
     * Create a 500 Internal Server Error
     */
    static internal(message?: string): ErrorResponder;
    /**
     * Build JSON error response
     */
    toJson(): string;
    /**
     * Build HTML error response
     */
    toHtml(): string;
    /**
     * Generate Rust responder code
     */
    static toRustCode(): string;
}
/**
 * Create an HTML response
 */
export declare function html(content: string, options?: HtmlResponderOptions): HtmlResponder;
/**
 * Create a JSON response
 */
export declare function json<T>(data: T, options?: JsonResponderOptions): JsonResponder<T>;
/**
 * Create a streaming response
 */
export declare function stream(options?: StreamResponderOptions): StreamResponder;
/**
 * Create a redirect response
 */
export declare function redirect(url: string, permanent?: boolean): RedirectResponder;
/**
 * Create an error response
 */
export declare function error(code: number, message: string, details?: unknown): ErrorResponder;
//# sourceMappingURL=responders.d.ts.map