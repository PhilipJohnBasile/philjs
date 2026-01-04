/**
 * Analytics utility functions
 */
/**
 * Check if code is running in browser
 */
export declare function isBrowser(): boolean;
/**
 * Check if running in development mode
 */
export declare function isDevelopment(): boolean;
/**
 * Check if user has Do Not Track enabled
 */
export declare function isDNTEnabled(): boolean;
/**
 * Generate unique session ID
 */
export declare function generateSessionId(): string;
/**
 * Get user agent information
 */
export declare function getUserAgent(): {
    userAgent?: never;
    language?: never;
    platform?: never;
    vendor?: never;
} | {
    userAgent: string;
    language: string;
    platform: string;
    vendor: string;
};
/**
 * Get page metadata
 */
export declare function getPageMetadata(): {
    url?: never;
    path?: never;
    search?: never;
    hash?: never;
    title?: never;
    referrer?: never;
} | {
    url: string;
    path: string;
    search: string;
    hash: string;
    title: string;
    referrer: string;
};
/**
 * Get viewport size
 */
export declare function getViewportSize(): {
    width: number;
    height: number;
};
/**
 * Get screen resolution
 */
export declare function getScreenResolution(): {
    width: number;
    height: number;
};
/**
 * Debounce function
 */
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Throttle function
 */
export declare function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void;
/**
 * Parse URL query parameters
 */
export declare function parseQueryParams(url?: string): Record<string, string>;
/**
 * Get UTM parameters from URL
 */
export declare function getUTMParams(): Record<string, string>;
/**
 * Store value in localStorage with error handling
 */
export declare function setLocalStorage(key: string, value: any): void;
/**
 * Get value from localStorage with error handling
 */
export declare function getLocalStorage<T = any>(key: string): T | null;
/**
 * Remove value from localStorage
 */
export declare function removeLocalStorage(key: string): void;
/**
 * Check if cookies are enabled
 */
export declare function areCookiesEnabled(): boolean;
/**
 * Get cookie value
 */
export declare function getCookie(name: string): string | null;
/**
 * Set cookie value
 */
export declare function setCookie(name: string, value: string, days?: number, domain?: string): void;
/**
 * Delete cookie
 */
export declare function deleteCookie(name: string, domain?: string): void;
//# sourceMappingURL=utils.d.ts.map