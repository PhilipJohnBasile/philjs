/**
 * PhilJS Email Utilities
 *
 * Utility functions for email operations
 */
/**
 * Default retry configuration
 */
export const defaultRetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryOn: [429, 500, 502, 503, 504],
};
/**
 * Normalize an email address to a consistent EmailAddress object
 */
export function normalizeAddress(address) {
    if (typeof address === 'string') {
        const trimmed = address.trim();
        const angleStart = trimmed.indexOf('<');
        const angleEnd = trimmed.lastIndexOf('>');
        if (angleStart !== -1 && angleEnd !== -1 && angleEnd > angleStart) {
            const namePart = trimmed.slice(0, angleStart).trim();
            const emailPart = trimmed.slice(angleStart + 1, angleEnd).trim();
            const result = { email: emailPart || trimmed };
            if (namePart) {
                const unquotedName = namePart.replace(/^"(.*)"$/, '$1').trim();
                if (unquotedName) {
                    result.name = unquotedName;
                }
            }
            return result;
        }
        return { email: trimmed.replace(/^"(.*)"$/, '$1').trim() };
    }
    return address;
}
/**
 * Format an email address for use in email headers
 */
export function formatAddress(address) {
    const normalized = normalizeAddress(address);
    if (normalized.name) {
        // Escape quotes in name
        const escapedName = normalized.name.replace(/"/g, '\\"');
        return `"${escapedName}" <${normalized.email}>`;
    }
    return normalized.email;
}
/**
 * Validate an email address format
 */
export function isValidEmail(email) {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Parse a string containing multiple email addresses
 * Supports comma-separated and semicolon-separated formats
 */
export function parseEmails(input) {
    const addresses = [];
    // Split by comma or semicolon
    const parts = input.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
        const normalized = normalizeAddress(part);
        if (normalized.email && isValidEmail(normalized.email)) {
            addresses.push(normalized);
        }
    }
    return addresses;
}
/**
 * Render a React email component to HTML and text
 * Uses @react-email/components if available
 */
export async function renderReactEmail(component) {
    try {
        // Try to use @react-email/components
        const { render } = await import('@react-email/components');
        const html = await render(component);
        const text = await render(component, { plainText: true });
        return { html, text };
    }
    catch {
        try {
            // Fallback to @react-email/render (dynamically imported, may not be installed)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const renderModule = await import('@react-email/render');
            const render = renderModule.render;
            const html = await render(component);
            const text = await render(component, { plainText: true });
            return { html, text };
        }
        catch {
            // Final fallback: use react-dom/server
            const { renderToStaticMarkup } = await import('react-dom/server');
            const html = renderToStaticMarkup(component);
            const text = htmlToText(html);
            return { html, text };
        }
    }
}
/**
 * Convert HTML to plain text
 */
export function htmlToText(html) {
    // Remove style and script tags with content
    let text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    // Replace common block elements with newlines
    text = text.replace(/<\/?(div|p|br|hr|h[1-6]|ul|ol|li|table|tr)[^>]*>/gi, '\n');
    // Replace links with text and URL
    text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)');
    // Remove all remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');
    // Decode HTML entities
    text = decodeHtmlEntities(text);
    // Clean up whitespace
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.trim();
    return text;
}
/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text) {
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&nbsp;': ' ',
        '&copy;': '\u00A9',
        '&reg;': '\u00AE',
        '&trade;': '\u2122',
        '&mdash;': '\u2014',
        '&ndash;': '\u2013',
        '&bull;': '\u2022',
        '&hellip;': '\u2026',
    };
    let result = text;
    for (const [entity, char] of Object.entries(entities)) {
        result = result.replace(new RegExp(entity, 'gi'), char);
    }
    // Handle numeric entities
    result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
    result = result.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    return result;
}
/**
 * Execute a function with retry logic
 */
export async function withRetry(fn, config = {}) {
    const { maxAttempts = defaultRetryConfig.maxAttempts, initialDelay = defaultRetryConfig.initialDelay, maxDelay = defaultRetryConfig.maxDelay, backoffMultiplier = defaultRetryConfig.backoffMultiplier, } = config;
    let lastError;
    let delay = initialDelay;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt === maxAttempts) {
                break;
            }
            // Wait before retrying
            await sleep(delay);
            // Increase delay with exponential backoff
            delay = Math.min(delay * backoffMultiplier, maxDelay);
        }
    }
    throw lastError;
}
/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Generate a unique ID for tracking
 */
export function generateId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${randomPart}`;
}
/**
 * Split an array into chunks of specified size
 */
export function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
/**
 * Create a tracking pixel URL
 */
export function createTrackingPixel(baseUrl, messageId, recipient, metadata) {
    const params = new URLSearchParams({
        id: messageId,
        recipient,
    });
    if (metadata) {
        params.set('meta', JSON.stringify(metadata));
    }
    return `${baseUrl}?${params.toString()}`;
}
/**
 * Wrap links in HTML for click tracking
 */
export function wrapLinksForTracking(html, baseUrl, messageId, recipient) {
    // Match anchor tags with href attributes
    return html.replace(/<a([^>]*?)href="([^"]+)"([^>]*)>/gi, (match, before, href, after) => {
        // Skip mailto: and tel: links
        if (href.startsWith('mailto:') || href.startsWith('tel:')) {
            return match;
        }
        // Create tracking URL
        const trackingUrl = `${baseUrl}?${new URLSearchParams({
            id: messageId,
            recipient,
            url: href,
        }).toString()}`;
        return `<a${before}href="${trackingUrl}"${after}>`;
    });
}
//# sourceMappingURL=utils.js.map