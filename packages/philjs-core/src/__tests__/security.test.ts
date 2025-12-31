import { describe, it, expect, vi } from 'vitest';
import {
  escapeHtml,
  escapeAttr,
  escapeJs,
  escapeUrl,
  sanitizeHtml,
  safeJsonParse,
  sanitizeUrl,
  isValidEmail,
  constantTimeEqual,
  generateSecureToken,
  createCspNonce,
} from '../security.js';

describe('security', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("it's")).toBe('it&#39;s');
    });

    it('should handle non-string input', () => {
      expect(escapeHtml(123 as any)).toBe('123');
      expect(escapeHtml(null as any)).toBe('null');
    });

    it('should preserve safe strings', () => {
      expect(escapeHtml('hello world')).toBe('hello world');
    });
  });

  describe('escapeAttr', () => {
    it('should escape attribute special characters', () => {
      const input = 'hello" onclick="alert(1)"';
      expect(escapeAttr(input)).toContain('&quot;');
    });

    it('should escape less-than and greater-than', () => {
      expect(escapeAttr('<test>')).toBe('&lt;test&gt;');
    });

    it('should handle non-string input', () => {
      expect(escapeAttr(42 as any)).toBe('42');
    });
  });

  describe('escapeJs', () => {
    it('should escape double quotes', () => {
      expect(escapeJs('hello "world"')).toBe('hello \\"world\\"');
    });

    it('should escape single quotes', () => {
      expect(escapeJs("it's")).toBe("it\\'s");
    });

    it('should escape backslashes', () => {
      expect(escapeJs('path\\to\\file')).toBe('path\\\\to\\\\file');
    });

    it('should escape newlines', () => {
      expect(escapeJs('line1\nline2')).toBe('line1\\nline2');
    });

    it('should escape HTML tags', () => {
      expect(escapeJs('<script>')).toBe('\\x3cscript\\x3e');
    });

    it('should handle non-string input', () => {
      expect(escapeJs(123 as any)).toBe('123');
    });
  });

  describe('escapeUrl', () => {
    it('should URL encode special characters', () => {
      expect(escapeUrl('hello world')).toBe('hello%20world');
    });

    it('should encode ampersands', () => {
      expect(escapeUrl('a=1&b=2')).toBe('a%3D1%26b%3D2');
    });

    it('should handle non-string input', () => {
      expect(escapeUrl(42 as any)).toBe('42');
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      expect(sanitizeHtml(input)).toBe('<p>Hello</p>');
    });

    it('should remove style tags', () => {
      const input = '<p>Hello</p><style>body{display:none}</style>';
      expect(sanitizeHtml(input)).toBe('<p>Hello</p>');
    });

    it('should remove event handlers', () => {
      const input = '<p onclick="alert(1)">Hello</p>';
      expect(sanitizeHtml(input)).not.toContain('onclick');
    });

    it('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">click</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript');
    });

    it('should allow safe tags', () => {
      const input = '<p><strong>Bold</strong> and <em>italic</em></p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
    });

    it('should filter disallowed tags', () => {
      const input = '<iframe src="evil.com"></iframe><p>Safe</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('iframe');
      expect(result).toContain('<p>');
    });

    it('should handle non-string input', () => {
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(123 as any)).toBe('');
    });

    it('should respect custom allowed tags', () => {
      const input = '<p>Hello</p><div>World</div>';
      const result = sanitizeHtml(input, { allowedTags: ['p'] });
      expect(result).toContain('<p>');
      expect(result).not.toContain('<div>');
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"name":"John","age":30}');
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should prevent __proto__ pollution', () => {
      const malicious = '{"__proto__": {"isAdmin": true}}';
      const result = safeJsonParse(malicious);
      expect((result as any).__proto__).toBeUndefined();
      expect(({} as any).isAdmin).toBeUndefined();
    });

    it('should prevent constructor pollution', () => {
      const malicious = '{"constructor": {"prototype": {"isAdmin": true}}}';
      const result = safeJsonParse(malicious);
      expect((result as any).constructor).toBeUndefined();
    });

    it('should support reviver function', () => {
      const result = safeJsonParse('{"date":"2024-01-01"}', (key, value) => {
        if (key === 'date') return new Date(value as string);
        return value;
      });
      expect((result as any).date).toBeInstanceOf(Date);
    });

    it('should throw for invalid JSON', () => {
      expect(() => safeJsonParse('not json')).toThrow();
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow valid HTTP URLs', () => {
      const url = 'https://example.com/path';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should block javascript: protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    });

    it('should block data: protocol', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('should allow relative URLs', () => {
      expect(sanitizeUrl('/path/to/page')).not.toBeNull();
    });

    it('should validate against allowed domains', () => {
      const url = 'https://evil.com/path';
      expect(sanitizeUrl(url, ['example.com'])).toBeNull();
    });

    it('should allow URLs from allowed domains', () => {
      const url = 'https://example.com/path';
      expect(sanitizeUrl(url, ['example.com'])).toBe(url);
    });

    it('should allow subdomains of allowed domains', () => {
      const url = 'https://sub.example.com/path';
      expect(sanitizeUrl(url, ['example.com'])).toBe(url);
    });

    it('should return null for invalid input', () => {
      expect(sanitizeUrl('')).toBeNull();
      expect(sanitizeUrl(null as any)).toBeNull();
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.com')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });

    it('should reject emails with spaces', () => {
      expect(isValidEmail('user @example.com')).toBe(false);
      expect(isValidEmail('user@ example.com')).toBe(false);
    });

    it('should reject oversized emails', () => {
      const longLocal = 'a'.repeat(65) + '@example.com';
      expect(isValidEmail(longLocal)).toBe(false);
    });

    it('should handle non-string input', () => {
      expect(isValidEmail(null as any)).toBe(false);
      expect(isValidEmail(123 as any)).toBe(false);
    });
  });

  describe('constantTimeEqual', () => {
    it('should return true for equal strings', () => {
      expect(constantTimeEqual('secret', 'secret')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(constantTimeEqual('secret', 'other')).toBe(false);
    });

    it('should return false for different lengths', () => {
      expect(constantTimeEqual('short', 'longer')).toBe(false);
    });

    it('should handle non-string input', () => {
      expect(constantTimeEqual(null as any, 'test')).toBe(false);
      expect(constantTimeEqual('test', null as any)).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(constantTimeEqual('', '')).toBe(true);
      expect(constantTimeEqual('', 'x')).toBe(false);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate token of default length', async () => {
      const token = await generateSecureToken();
      expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    it('should generate token of custom length', async () => {
      const token = await generateSecureToken(16);
      expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('should generate unique tokens', async () => {
      const token1 = await generateSecureToken();
      const token2 = await generateSecureToken();
      expect(token1).not.toBe(token2);
    });

    it('should only contain hex characters', async () => {
      const token = await generateSecureToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('createCspNonce', () => {
    it('should generate a nonce', async () => {
      const nonce = await createCspNonce();
      expect(nonce).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('should generate unique nonces', async () => {
      const nonce1 = await createCspNonce();
      const nonce2 = await createCspNonce();
      expect(nonce1).not.toBe(nonce2);
    });
  });
});
