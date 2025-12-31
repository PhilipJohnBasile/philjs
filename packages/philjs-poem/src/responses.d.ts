/**
 * PhilJS Poem Responses
 *
 * Custom response types for the Poem framework integration.
 */
import type { HtmlResponseOptions, JsonResponseOptions, StreamResponseOptions, MetaTag, Script } from './types.js';
/**
 * HTML Response builder for PhilJS views
 */
export declare class HtmlResponse {
    private content;
    private options;
    constructor(options?: HtmlResponseOptions);
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
     * Set HTTP status
     */
    status(code: number): this;
    /**
     * Add response header
     */
    header(name: string, value: string): this;
    /**
     * Build full HTML document
     */
    buildDocument(): string;
    /**
     * Generate Rust response code
     */
    static toRustCode(): string;
}
/**
 * JSON Response builder
 */
export declare class JsonResponse<T> {
    private data;
    private options;
    constructor(data: T, options?: JsonResponseOptions);
    /**
     * Pretty print JSON
     */
    pretty(): this;
    /**
     * Set HTTP status
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
     * Generate Rust response code
     */
    static toRustCode(): string;
}
/**
 * Streaming Response for SSR
 */
export declare class StreamResponse {
    private options;
    constructor(options?: StreamResponseOptions);
    /**
     * Set HTTP status
     */
    status(code: number): this;
    /**
     * Generate Rust response code
     */
    static toRustCode(): string;
}
/**
 * Redirect Response
 */
export declare class RedirectResponse {
    private url;
    private permanent;
    constructor(url: string, permanent?: boolean);
    static temporary(url: string): RedirectResponse;
    static permanent(url: string): RedirectResponse;
    static seeOther(url: string): RedirectResponse;
    static toRustCode(): string;
}
/**
 * Error Response
 */
export declare class ErrorResponse {
    private code;
    private message;
    private details?;
    constructor(code: number, message: string, details?: unknown);
    static badRequest(message?: string): ErrorResponse;
    static unauthorized(message?: string): ErrorResponse;
    static forbidden(message?: string): ErrorResponse;
    static notFound(message?: string): ErrorResponse;
    static internal(message?: string): ErrorResponse;
    toJson(): string;
    toHtml(): string;
    static toRustCode(): string;
}
/**
 * File Download Response
 */
export declare class FileResponse {
    private filename;
    private contentType;
    private data;
    private inline;
    constructor(filename: string, data: Uint8Array | string, contentType?: string, inline?: boolean);
    static toRustCode(): string;
}
/**
 * Create an HTML response
 */
export declare function html(content: string, options?: HtmlResponseOptions): HtmlResponse;
/**
 * Create a JSON response
 */
export declare function json<T>(data: T, options?: JsonResponseOptions): JsonResponse<T>;
/**
 * Create a streaming response
 */
export declare function stream(options?: StreamResponseOptions): StreamResponse;
/**
 * Create a redirect response
 */
export declare function redirect(url: string, permanent?: boolean): RedirectResponse;
/**
 * Create an error response
 */
export declare function error(code: number, message: string, details?: unknown): ErrorResponse;
/**
 * Create a file download response
 */
export declare function file(filename: string, data: Uint8Array | string, contentType?: string): FileResponse;
//# sourceMappingURL=responses.d.ts.map