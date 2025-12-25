import type { ReactElement } from 'react';
import type { EmailAddress, RetryConfig } from './types';

/**
 * Normalize an email address to a consistent format
 */
export function normalizeAddress(address: string | EmailAddress): EmailAddress {
  if (typeof address === 'string') {
    // Parse "Name <email@example.com>" format
    const match = address.match(/^(.+?)\s*<(.+)>$/);
    if (match) {
      return {
        name: match[1].trim().replace(/^["']|["']$/g, ''),
        email: match[2].trim(),
      };
    }
    return { email: address.trim() };
  }
  return address;
}

/**
 * Format an email address for use in email headers
 */
export function formatAddress(address: string | EmailAddress): string {
  const normalized = normalizeAddress(address);
  if (normalized.name) {
    // Escape quotes in name
    const escapedName = normalized.name.replace(/"/g, '\\"');
    return `"${escapedName}" <${normalized.email}>`;
  }
  return normalized.email;
}

/**
 * Render a React Email template to HTML and text
 */
export async function renderReactEmail(
  element: ReactElement
): Promise<{ html: string; text: string }> {
  // Dynamic import to avoid bundling issues
  try {
    const { render } = await import('@react-email/components');

    const html = await render(element);
    const text = await render(element, { plainText: true });

    return { html, text };
  } catch (error) {
    // Fallback: try to use react-dom/server
    try {
      const ReactDOMServer = await import('react-dom/server');
      const html = ReactDOMServer.renderToStaticMarkup(element);
      // Generate basic text from HTML
      const text = htmlToText(html);
      return { html, text };
    } catch {
      throw new Error(
        'Failed to render React email template. Ensure @react-email/components is installed.'
      );
    }
  }
}

/**
 * Convert HTML to plain text
 */
export function htmlToText(html: string): string {
  return html
    // Remove style and script tags and their content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Convert line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    // Convert links to text with URL
    .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error | undefined;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      if (config.retryOn && config.retryOn.length > 0) {
        const shouldRetry = config.retryOn.some(
          (pattern) =>
            lastError!.message.includes(pattern) ||
            lastError!.name.includes(pattern)
        );
        if (!shouldRetry) {
          throw lastError;
        }
      }

      // Don't wait after the last attempt
      if (attempt < config.maxAttempts) {
        await sleep(delay);
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }
  }

  throw lastError;
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate an email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Parse and validate email addresses
 */
export function parseEmails(
  input: string | EmailAddress | (string | EmailAddress)[]
): EmailAddress[] {
  const addresses = Array.isArray(input) ? input : [input];

  return addresses.map((addr) => {
    const normalized = normalizeAddress(addr);
    if (!isValidEmail(normalized.email)) {
      throw new Error(`Invalid email address: ${normalized.email}`);
    }
    return normalized;
  });
}

/**
 * Chunk an array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Create a tracking pixel HTML
 */
export function createTrackingPixel(
  trackingUrl: string,
  messageId: string
): string {
  const url = new URL(trackingUrl);
  url.searchParams.set('id', messageId);
  url.searchParams.set('type', 'open');

  return `<img src="${url.toString()}" width="1" height="1" alt="" style="display:none" />`;
}

/**
 * Wrap links in HTML for click tracking
 */
export function wrapLinksForTracking(
  html: string,
  trackingUrl: string,
  messageId: string
): string {
  return html.replace(
    /<a([^>]*)href=["']([^"']*)["']([^>]*)>/gi,
    (match, before, href, after) => {
      // Skip tracking for mailto: and tel: links
      if (href.startsWith('mailto:') || href.startsWith('tel:')) {
        return match;
      }

      const url = new URL(trackingUrl);
      url.searchParams.set('id', messageId);
      url.searchParams.set('type', 'click');
      url.searchParams.set('url', href);

      return `<a${before}href="${url.toString()}"${after}>`;
    }
  );
}

/**
 * Default retry configuration
 */
export const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryOn: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'rate limit', '429', '503'],
};
