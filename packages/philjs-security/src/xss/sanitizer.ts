/**
 * PhilJS Security - XSS Sanitizer
 *
 * HTML sanitization and safe templating.
 */

import type { SanitizeConfig } from '../types.js';

/**
 * Default allowed HTML tags
 */
const defaultAllowedTags = [
  'a',
  'abbr',
  'address',
  'article',
  'aside',
  'b',
  'bdi',
  'bdo',
  'blockquote',
  'br',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'dd',
  'del',
  'details',
  'dfn',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'i',
  'img',
  'ins',
  'kbd',
  'li',
  'main',
  'mark',
  'nav',
  'ol',
  'p',
  'picture',
  'pre',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'section',
  'small',
  'source',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'time',
  'tr',
  'u',
  'ul',
  'var',
  'video',
  'wbr',
];

/**
 * Default allowed attributes per tag
 */
const defaultAllowedAttributes: Record<string, string[]> = {
  '*': ['class', 'id', 'title', 'lang', 'dir', 'aria-*', 'data-*', 'role'],
  a: ['href', 'target', 'rel', 'download'],
  img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
  video: ['src', 'poster', 'controls', 'width', 'height', 'preload', 'autoplay', 'loop', 'muted'],
  source: ['src', 'type', 'media'],
  time: ['datetime'],
  data: ['value'],
  ol: ['start', 'reversed', 'type'],
  li: ['value'],
  table: ['border', 'cellpadding', 'cellspacing'],
  td: ['colspan', 'rowspan', 'headers'],
  th: ['colspan', 'rowspan', 'headers', 'scope'],
  col: ['span'],
  colgroup: ['span'],
  blockquote: ['cite'],
  q: ['cite'],
  del: ['cite', 'datetime'],
  ins: ['cite', 'datetime'],
};

/**
 * Default allowed URL schemes
 */
const defaultAllowedSchemes = ['http', 'https', 'mailto', 'tel'];

/**
 * HTML entity map
 */
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML entities in a string
 *
 * @param str - String to escape
 * @returns Escaped string
 *
 * @example
 * ```typescript
 * const safe = escape('<script>alert("xss")</script>');
 * // Result: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
export function escape(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Unescape HTML entities in a string
 *
 * @param str - String to unescape
 * @returns Unescaped string
 */
export function unescape(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  const reverseEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
  };

  return str.replace(
    /&(?:amp|lt|gt|quot|#x27|#x2F|#x60|#x3D);/g,
    (entity) => reverseEntities[entity] || entity
  );
}

/**
 * Check if a URL is safe
 */
function isSafeUrl(url: string, allowedSchemes: string[], allowDataUrls: boolean): boolean {
  const trimmed = url.trim().toLowerCase();

  // Check for javascript: URLs
  if (trimmed.startsWith('javascript:')) {
    return false;
  }

  // Check for vbscript: URLs
  if (trimmed.startsWith('vbscript:')) {
    return false;
  }

  // Check for data: URLs
  if (trimmed.startsWith('data:')) {
    return allowDataUrls;
  }

  // Relative URLs are always allowed
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('.')) {
    return true;
  }

  // Check scheme
  const schemeMatch = trimmed.match(/^([a-z][a-z0-9+.-]*?):/);
  if (schemeMatch && schemeMatch[1]) {
    const scheme = schemeMatch[1];
    return allowedSchemes.includes(scheme);
  }

  // No scheme = relative URL
  return true;
}

/**
 * Check if an attribute is allowed
 */
function isAttributeAllowed(
  tag: string,
  attr: string,
  allowedAttributes: Record<string, string[]>
): boolean {
  const normalizedAttr = attr.toLowerCase();

  // Check tag-specific attributes
  const tagAttrs = allowedAttributes[tag.toLowerCase()];
  if (tagAttrs) {
    if (tagAttrs.includes(normalizedAttr)) {
      return true;
    }
    // Check wildcard patterns
    for (const pattern of tagAttrs) {
      if (pattern.endsWith('*') && normalizedAttr.startsWith(pattern.slice(0, -1))) {
        return true;
      }
    }
  }

  // Check global attributes
  const globalAttrs = allowedAttributes['*'];
  if (globalAttrs) {
    if (globalAttrs.includes(normalizedAttr)) {
      return true;
    }
    // Check wildcard patterns (like aria-* and data-*)
    for (const pattern of globalAttrs) {
      if (pattern.endsWith('*') && normalizedAttr.startsWith(pattern.slice(0, -1))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Simple HTML parser for sanitization
 * Note: For production use, consider using DOMPurify
 */
function parseAndSanitize(
  html: string,
  allowedTags: string[],
  allowedAttributes: Record<string, string[]>,
  allowedSchemes: string[],
  allowDataUrls: boolean
): string {
  const result: string[] = [];
  let i = 0;

  const urlAttributes = ['href', 'src', 'action', 'poster', 'data'];

  while (i < html.length) {
    const tagStart = html.indexOf('<', i);

    if (tagStart === -1) {
      // No more tags, add remaining text
      result.push(escape(html.slice(i)));
      break;
    }

    // Add text before tag
    if (tagStart > i) {
      result.push(escape(html.slice(i, tagStart)));
    }

    // Find tag end
    const tagEnd = html.indexOf('>', tagStart);
    if (tagEnd === -1) {
      // Malformed HTML, escape the rest
      result.push(escape(html.slice(tagStart)));
      break;
    }

    const tagContent = html.slice(tagStart + 1, tagEnd);

    // Check for closing tag
    if (tagContent.startsWith('/')) {
      const tagName = tagContent.slice(1).trim().toLowerCase().split(/\s/)[0];
      if (tagName && allowedTags.includes(tagName)) {
        result.push(`</${tagName}>`);
      }
      i = tagEnd + 1;
      continue;
    }

    // Check for comment
    if (tagContent.startsWith('!--')) {
      const commentEnd = html.indexOf('-->', tagStart);
      if (commentEnd !== -1) {
        i = commentEnd + 3;
      } else {
        i = tagEnd + 1;
      }
      continue;
    }

    // Parse opening tag
    const selfClosing = tagContent.endsWith('/');
    const cleanContent = selfClosing ? tagContent.slice(0, -1) : tagContent;

    // Extract tag name
    const parts = cleanContent.trim().split(/\s+/);
    const tagName = (parts[0] || '').toLowerCase();

    if (!tagName || !allowedTags.includes(tagName)) {
      // Tag not allowed, skip it
      i = tagEnd + 1;
      continue;
    }

    // Parse attributes
    const sanitizedAttrs: string[] = [];
    const attrRegex = /([a-zA-Z_:][a-zA-Z0-9_:.-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let match;

    const attrString = cleanContent.slice(tagName.length);
    while ((match = attrRegex.exec(attrString)) !== null) {
      const attrName = match[1]!.toLowerCase();
      const attrValue = match[2] ?? match[3] ?? match[4] ?? '';

      // Skip event handlers
      if (attrName.startsWith('on')) {
        continue;
      }

      // Skip dangerous attributes
      if (['style', 'srcdoc', 'formaction'].includes(attrName)) {
        continue;
      }

      // Check if attribute is allowed
      if (!isAttributeAllowed(tagName, attrName, allowedAttributes)) {
        continue;
      }

      // Validate URL attributes
      if (urlAttributes.includes(attrName)) {
        if (!isSafeUrl(attrValue, allowedSchemes, allowDataUrls)) {
          continue;
        }
      }

      sanitizedAttrs.push(`${attrName}="${escape(attrValue)}"`);
    }

    // Build sanitized tag
    const attrsStr = sanitizedAttrs.length > 0 ? ' ' + sanitizedAttrs.join(' ') : '';
    const closingSlash = selfClosing ? ' /' : '';
    result.push(`<${tagName}${attrsStr}${closingSlash}>`);

    i = tagEnd + 1;
  }

  return result.join('');
}

/**
 * Sanitize HTML string
 *
 * Removes potentially dangerous HTML elements and attributes.
 * For maximum security, use with DOMPurify in browser environments.
 *
 * @param html - HTML string to sanitize
 * @param config - Sanitization configuration
 * @returns Sanitized HTML string
 *
 * @example
 * ```typescript
 * const safe = sanitize('<script>alert("xss")</script><p>Hello</p>');
 * // Result: '<p>Hello</p>'
 *
 * const custom = sanitize(userInput, {
 *   allowedTags: ['p', 'strong', 'em'],
 *   allowedAttributes: { a: ['href'] },
 * });
 * ```
 */
export function sanitize(html: string, config: SanitizeConfig = {}): string {
  if (typeof html !== 'string') {
    return '';
  }

  // Strip all HTML if requested
  if (config.stripAll) {
    return escape(html.replace(/<[^>]*>/g, ''));
  }

  // Use custom sanitizer if provided
  if (config.customSanitizer) {
    return config.customSanitizer(html);
  }

  // Try to use DOMPurify if available and requested
  if (config.useDOMPurify !== false) {
    try {
      // Dynamic import for optional DOMPurify
      const DOMPurify = (globalThis as any).DOMPurify;
      if (DOMPurify) {
        return DOMPurify.sanitize(html, {
          ALLOWED_TAGS: config.allowedTags || defaultAllowedTags,
          ALLOWED_ATTR: Object.values(
            config.allowedAttributes || defaultAllowedAttributes
          ).flat(),
          ALLOWED_URI_REGEXP: new RegExp(
            `^(?:(?:${(config.allowedSchemes || defaultAllowedSchemes).join('|')}):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))`,
            'i'
          ),
        });
      }
    } catch {
      // DOMPurify not available, fall back to built-in
    }
  }

  // Use built-in sanitizer
  const allowedTags = config.allowedTags || defaultAllowedTags;
  const allowedAttributes = config.allowedAttributes || defaultAllowedAttributes;
  const allowedSchemes = config.allowedSchemes || defaultAllowedSchemes;
  const allowDataUrls = config.allowDataUrls ?? false;

  return parseAndSanitize(html, allowedTags, allowedAttributes, allowedSchemes, allowDataUrls);
}

/**
 * Safe HTML template tag
 *
 * Automatically escapes interpolated values to prevent XSS.
 *
 * @example
 * ```typescript
 * const userInput = '<script>alert("xss")</script>';
 * const safe = html`<p>Hello, ${userInput}!</p>`;
 * // Result: '<p>Hello, &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;!</p>'
 *
 * // Use { __html: value } to insert trusted HTML
 * const trusted = html`<div>${{ __html: '<strong>Bold</strong>' }}</div>`;
 * // Result: '<div><strong>Bold</strong></div>'
 * ```
 */
export function html(
  strings: TemplateStringsArray,
  ...values: Array<string | number | { __html: string } | null | undefined>
): string {
  const result: string[] = [];

  for (let i = 0; i < strings.length; i++) {
    result.push(strings[i]!);

    if (i < values.length) {
      const value = values[i];

      if (value === null || value === undefined) {
        continue;
      }

      // Check for trusted HTML
      if (typeof value === 'object' && '__html' in value) {
        result.push(value.__html);
      } else {
        result.push(escape(String(value)));
      }
    }
  }

  return result.join('');
}

/**
 * Create a trusted HTML object for use with html template tag
 *
 * @param value - HTML string to trust
 * @returns Trusted HTML object
 *
 * @example
 * ```typescript
 * const content = trustedHtml(sanitize(userContent));
 * const output = html`<div>${content}</div>`;
 * ```
 */
export function trustedHtml(value: string): { __html: string } {
  return { __html: value };
}

/**
 * Strip all HTML tags from a string
 *
 * @param html - HTML string
 * @returns Plain text without HTML tags
 *
 * @example
 * ```typescript
 * const text = stripTags('<p>Hello <strong>World</strong>!</p>');
 * // Result: 'Hello World!'
 * ```
 */
export function stripTags(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }

  // Remove all tags
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Encode string for use in HTML attributes
 *
 * @param value - Value to encode
 * @returns Encoded string safe for attribute values
 *
 * @example
 * ```typescript
 * const attr = encodeAttribute('value with "quotes" and <html>');
 * const el = `<input value="${attr}">`;
 * ```
 */
export function encodeAttribute(value: string): string {
  return escape(String(value));
}
