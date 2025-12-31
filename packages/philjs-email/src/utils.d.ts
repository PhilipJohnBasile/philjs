/**
 * PhilJS Email Utilities
 *
 * Utility functions for email operations
 */
import type { ReactElement } from 'react';
import type { EmailAddress, RetryConfig } from './types.js';
/**
 * Default retry configuration
 */
export declare const defaultRetryConfig: Required<RetryConfig>;
/**
 * Normalize an email address to a consistent EmailAddress object
 */
export declare function normalizeAddress(address: string | EmailAddress): EmailAddress;
/**
 * Format an email address for use in email headers
 */
export declare function formatAddress(address: string | EmailAddress): string;
/**
 * Validate an email address format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Parse a string containing multiple email addresses
 * Supports comma-separated and semicolon-separated formats
 */
export declare function parseEmails(input: string): EmailAddress[];
/**
 * Render a React email component to HTML and text
 * Uses @react-email/components if available
 */
export declare function renderReactEmail(component: ReactElement): Promise<{
    html: string;
    text: string;
}>;
/**
 * Convert HTML to plain text
 */
export declare function htmlToText(html: string): string;
/**
 * Execute a function with retry logic
 */
export declare function withRetry<T>(fn: () => Promise<T>, config?: RetryConfig): Promise<T>;
/**
 * Sleep for a specified number of milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Generate a unique ID for tracking
 */
export declare function generateId(): string;
/**
 * Split an array into chunks of specified size
 */
export declare function chunk<T>(array: T[], size: number): T[][];
/**
 * Create a tracking pixel URL
 */
export declare function createTrackingPixel(baseUrl: string, messageId: string, recipient: string, metadata?: Record<string, unknown>): string;
/**
 * Wrap links in HTML for click tracking
 */
export declare function wrapLinksForTracking(html: string, baseUrl: string, messageId: string, recipient: string): string;
//# sourceMappingURL=utils.d.ts.map