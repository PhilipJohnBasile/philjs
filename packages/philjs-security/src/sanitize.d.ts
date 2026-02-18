/**
 * HTML Sanitization
 */
export interface SanitizeConfig {
    /** Allowed HTML tags */
    allowedTags?: string[];
    /** Allowed attributes per tag */
    allowedAttributes?: Record<string, string[]>;
    /** Allowed URL schemes */
    allowedSchemes?: string[];
    /** Strip all HTML */
    stripAll?: boolean;
}
/**
 * Sanitize HTML string to prevent XSS
 */
export declare function sanitizeHTML(html: string, config?: SanitizeConfig): string;
/**
 * Completely strip all HTML tags
 */
export declare function stripHTML(html: string): string;
/**
 * Escape HTML entities
 */
export declare function escapeHTML(html: string): string;
/**
 * Unescape HTML entities
 */
export declare function unescapeHTML(html: string): string;
/**
 * Sanitize URL to prevent javascript: and other malicious schemes
 */
export declare function sanitizeURL(url: string, allowedSchemes?: string[]): string;
