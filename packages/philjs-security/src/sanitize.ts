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

const DEFAULT_ALLOWED_TAGS = [
  'a', 'b', 'i', 'u', 'em', 'strong', 'span', 'div', 'p', 'br', 'hr',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'code', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const DEFAULT_ALLOWED_ATTRIBUTES = {
  '*': ['class', 'id', 'style'],
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
};

const DEFAULT_ALLOWED_SCHEMES = ['http', 'https', 'mailto'];

/**
 * Sanitize HTML string to prevent XSS
 */
export function sanitizeHTML(html: string, config: SanitizeConfig = {}): string {
  if (config.stripAll) {
    return stripHTML(html);
  }

  const allowedTags = new Set(config.allowedTags || DEFAULT_ALLOWED_TAGS);
  const allowedAttributes = config.allowedAttributes || DEFAULT_ALLOWED_ATTRIBUTES;
  const allowedSchemes = new Set(config.allowedSchemes || DEFAULT_ALLOWED_SCHEMES);

  // Simple HTML parser/sanitizer (for basic use cases)
  // For production, consider using DOMPurify or similar
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^^]*(?:(?!<\/style>)<[^]*)*<\/style>/gi, '')
    .replace(/on\w+\s*=/gi, 'data-removed=')
    .replace(/javascript:/gi, '');
}

/**
 * Completely strip all HTML tags
 */
export function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Escape HTML entities
 */
export function escapeHTML(html: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return html.replace(/[&<>"']/g, (char) => escapeMap[char] ?? char);
}

/**
 * Unescape HTML entities
 */
export function unescapeHTML(html: string): string {
  const unescapeMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&#39;': "'",
  };
  return html.replace(/&(amp|lt|gt|quot|#0?39);/g, (entity) => unescapeMap[entity] ?? entity);
}

/**
 * Sanitize URL to prevent javascript: and other malicious schemes
 */
export function sanitizeURL(url: string, allowedSchemes = DEFAULT_ALLOWED_SCHEMES): string {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(':', '');
    if (!allowedSchemes.includes(scheme)) {
      return '';
    }
    return parsed.toString();
  } catch {
    // Relative URL or invalid - allow relative URLs
    if (url.startsWith('/') || url.startsWith('.') || url.startsWith('#')) {
      return url;
    }
    return '';
  }
}