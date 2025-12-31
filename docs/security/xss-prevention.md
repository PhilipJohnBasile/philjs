# XSS Prevention Guide

Cross-Site Scripting (XSS) is one of the most common web vulnerabilities. This guide explains how PhilJS protects against XSS attacks and best practices for keeping your application secure.

## Table of Contents

1. [Understanding XSS](#understanding-xss)
2. [PhilJS Built-in Protection](#philjs-built-in-protection)
3. [Context-Specific Escaping](#context-specific-escaping)
4. [Safe Content Rendering](#safe-content-rendering)
5. [Common XSS Patterns](#common-xss-patterns)
6. [Testing for XSS](#testing-for-xss)

## Understanding XSS

XSS attacks occur when untrusted data is included in a web page without proper validation or escaping, allowing attackers to execute malicious scripts in users' browsers.

### Types of XSS

**1. Reflected XSS**
```typescript
// Vulnerable code
function SearchResults({ query }: { query: string }) {
  return <div>Results for: {query}</div>; // SAFE in PhilJS (auto-escaped)
}

// Attack URL: /search?q=<script>alert('XSS')</script>
```

**2. Stored XSS**
```typescript
// Vulnerable if not sanitized
function Comment({ text }: { text: string }) {
  // If 'text' comes from database with malicious content
  return <div>{text}</div>; // SAFE in PhilJS (auto-escaped)
}
```

**3. DOM-based XSS**
```typescript
// Vulnerable code (in vanilla JS)
element.innerHTML = location.hash.substring(1); // DANGEROUS

// Attack URL: /page#<img src=x onerror=alert('XSS')>
```

## PhilJS Built-in Protection

PhilJS automatically protects against XSS in most scenarios:

### 1. Automatic HTML Escaping

All text content is escaped by default:

```typescript
function UserProfile({ name }: { name: string }) {
  // Even if name contains <script> tags, they will be escaped
  return <h1>Welcome, {name}!</h1>;
}

// Input: "<script>alert('XSS')</script>"
// Output: "Welcome, &lt;script&gt;alert('XSS')&lt;/script&gt;!"
```

### 2. Attribute Escaping

Attributes are properly escaped:

```typescript
function UserLink({ url, title }: { url: string; title: string }) {
  // Both url and title are escaped
  return <a href={url} title={title}>Link</a>;
}

// Input: url = 'javascript:alert("XSS")', title = '"><script>alert("XSS")</script>'
// The dangerous content is escaped
```

### 3. Server-Side Rendering Protection

PhilJS SSR escapes content before sending HTML to the client:

```typescript
import { renderToString } from '@philjs/ssr';

const html = renderToString(
  <div>{userInput}</div>
);
// userInput is escaped in the rendered HTML
```

## Context-Specific Escaping

Different contexts require different escaping strategies. PhilJS provides utilities for each context:

### HTML Context

```typescript
import { escapeHtml } from '@philjs/core';

const userComment = '<script>alert("XSS")</script>';
const safe = escapeHtml(userComment);
// Result: '&lt;script&gt;alert("XSS")&lt;/script&gt;'

function Comment({ text }: { text: string }) {
  return <div>{text}</div>; // Automatically escaped by PhilJS
}
```

### Attribute Context

```typescript
import { escapeAttr } from '@philjs/core';

const userInput = '" onload="alert(\'XSS\')';
const safe = escapeAttr(userInput);

function Image({ alt }: { alt: string }) {
  return <img src="/image.png" alt={alt} />; // Auto-escaped
}
```

### JavaScript Context

```typescript
import { escapeJs } from '@philjs/core';

const userName = 'John"; alert("XSS"); var x="';
const safe = escapeJs(userName);

function Analytics({ userId }: { userId: string }) {
  return (
    <script nonce={nonce}>
      {`window.analytics.identify("${escapeJs(userId)}");`}
    </script>
  );
}
```

### URL Context

```typescript
import { escapeUrl, sanitizeUrl } from '@philjs/core';

// For query parameters
const searchQuery = 'hello world & stuff';
const url = `/search?q=${escapeUrl(searchQuery)}`;

// For redirect URLs (with validation)
const redirectUrl = sanitizeUrl(userInput, ['example.com']);
if (redirectUrl) {
  window.location.href = redirectUrl;
}
```

## Safe Content Rendering

### Rich Text Content

When you need to render HTML from user input (e.g., blog posts, comments):

```typescript
import { sanitizeHtml } from '@philjs/core';

function BlogPost({ content }: { content: string }) {
  // Sanitize HTML to remove dangerous elements
  const safe = sanitizeHtml(content, {
    allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: {
      'a': ['href', 'title'],
    },
    allowedSchemes: ['http', 'https'],
  });

  // Use dangerouslySetInnerHTML only with sanitized content
  return <div dangerouslySetInnerHTML={{ __html: safe }} />;
}
```

### Markdown Content

For Markdown, use a trusted library with XSS protection:

```typescript
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

function MarkdownContent({ markdown }: { markdown: string }) {
  // First, convert Markdown to HTML
  const html = marked(markdown);

  // Then sanitize the HTML
  const safe = DOMPurify.sanitize(html);

  return <div dangerouslySetInnerHTML={{ __html: safe }} />;
}
```

### User Avatars and Images

Validate image URLs to prevent XSS via SVG or data URLs:

```typescript
import { sanitizeUrl } from '@philjs/core';

function Avatar({ imageUrl }: { imageUrl: string }) {
  // Validate URL
  const safeUrl = sanitizeUrl(imageUrl, ['cdn.example.com']);

  if (!safeUrl) {
    // Fallback to default avatar
    return <img src="/default-avatar.png" alt="Avatar" />;
  }

  return <img src={safeUrl} alt="User Avatar" />;
}
```

## Common XSS Patterns

### Pattern 1: Event Handlers

```typescript
// DANGEROUS - Never do this
function Button({ onClick }: { onClick: string }) {
  return <button onclick={onClick}>Click</button>; // XSS vulnerability
}

// SAFE - Use function references
function Button({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick}>Click</button>;
}
```

### Pattern 2: Dynamic Styles

```typescript
// DANGEROUS - User-controlled styles
function StyledDiv({ userStyle }: { userStyle: string }) {
  return <div style={userStyle}>Content</div>; // Can inject CSS-based XSS
}

// SAFE - Object-based styles
function StyledDiv({ color }: { color: string }) {
  // Validate color value
  const validColors = ['red', 'blue', 'green'];
  const safeColor = validColors.includes(color) ? color : 'black';

  return <div style={{ color: safeColor }}>Content</div>;
}
```

### Pattern 3: Dynamic URLs

```typescript
// DANGEROUS - Unvalidated URLs
function Link({ href }: { href: string }) {
  return <a href={href}>Click</a>; // javascript: URLs are XSS
}

// SAFE - Validated URLs
import { sanitizeUrl } from '@philjs/core';

function Link({ href }: { href: string }) {
  const safeHref = sanitizeUrl(href, ['example.com']) || '#';
  return <a href={safeHref}>Click</a>;
}
```

### Pattern 4: JSON in Script Tags

```typescript
// DANGEROUS - Unescaped JSON
function InitialState({ data }: { data: object }) {
  return (
    <script>
      window.__INITIAL_STATE__ = {JSON.stringify(data)};
    </script>
  );
}
// Attack: data = { xss: '</script><script>alert("XSS")</script>' }

// SAFE - Escaped JSON
function InitialState({ data }: { data: object }) {
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  return (
    <script nonce={nonce}>
      {`window.__INITIAL_STATE__ = ${json};`}
    </script>
  );
}
```

### Pattern 5: SVG Content

```typescript
// DANGEROUS - User SVG content
function Icon({ svg }: { svg: string }) {
  return <div dangerouslySetInnerHTML={{ __html: svg }} />; // SVG can contain scripts
}

// SAFE - Sanitized SVG
import { sanitizeHtml } from '@philjs/core';

function Icon({ svg }: { svg: string }) {
  const safe = sanitizeHtml(svg, {
    allowedTags: ['svg', 'path', 'circle', 'rect', 'line', 'polygon'],
    allowedAttributes: {
      '*': ['fill', 'stroke', 'stroke-width', 'd', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height'],
    },
  });

  return <div dangerouslySetInnerHTML={{ __html: safe }} />;
}
```

## Best Practices

### 1. Never Trust User Input

```typescript
// Always validate and sanitize
function processInput(input: string): string {
  // Validate format
  if (!/^[a-zA-Z0-9\s]+$/.test(input)) {
    throw new Error('Invalid input format');
  }

  // Sanitize
  return escapeHtml(input);
}
```

### 2. Use Content Security Policy

Combine XSS prevention with CSP headers:

```typescript
import { buildCSP } from '@philjs/ssr';

const csp = buildCSP({
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'object-src': ["'none'"],
  },
  autoNonce: true,
});

response.headers.set(csp.header, csp.value);
```

### 3. Avoid dangerouslySetInnerHTML

Only use when absolutely necessary and always with sanitization:

```typescript
// AVOID when possible
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// PREFER escaping
<div>{userContent}</div>

// IF REQUIRED, sanitize first
import { sanitizeHtml } from '@philjs/core';
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
```

### 4. Validate URLs

Always validate URLs before using them:

```typescript
import { sanitizeUrl } from '@philjs/core';

function handleRedirect(url: string) {
  const safe = sanitizeUrl(url, ['example.com', 'trusted-site.com']);

  if (!safe) {
    throw new Error('Invalid redirect URL');
  }

  return Response.redirect(safe);
}
```

### 5. Escape Data in All Contexts

Different contexts require different escaping:

```typescript
import { escapeHtml, escapeAttr, escapeJs, escapeUrl } from '@philjs/core';

// In HTML
<div>{escapeHtml(data)}</div>

// In attributes
<div title={escapeAttr(data)} />

// In JavaScript
<script>var x = "{escapeJs(data)}";</script>

// In URLs
<a href={`/search?q=${escapeUrl(data)}`}>Search</a>
```

## Testing for XSS

### Manual Testing

Test with common XSS payloads:

```typescript
const xssPayloads = [
  '<script>alert("XSS")</script>',
  '"><script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  'javascript:alert("XSS")',
  '<svg onload=alert("XSS")>',
  '&lt;script&gt;alert("XSS")&lt;/script&gt;',
  '<iframe src="javascript:alert(\'XSS\')">',
];

// Test each input field with these payloads
```

### Automated Testing

Use tools to scan for XSS vulnerabilities:

```bash
# Using OWASP ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://your-app

# Using npm packages
npm install -g retire
retire --path /path/to/your/app
```

### Unit Tests

Write tests for your sanitization functions:

```typescript
import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeHtml } from '@philjs/core';

describe('XSS Prevention', () => {
  it('should escape HTML special characters', () => {
    const input = '<script>alert("XSS")</script>';
    const output = escapeHtml(input);
    expect(output).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  });

  it('should sanitize dangerous HTML', () => {
    const input = '<p>Safe</p><script>alert("XSS")</script>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('<script>');
    expect(output).toContain('<p>Safe</p>');
  });

  it('should remove event handlers', () => {
    const input = '<img src=x onerror=alert("XSS")>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('onerror');
  });
});
```

## Security Checklist

- [ ] All user input is validated on the server
- [ ] Text content is automatically escaped by PhilJS
- [ ] `dangerouslySetInnerHTML` is only used with sanitized content
- [ ] URLs are validated before use
- [ ] CSP headers are configured
- [ ] Event handlers use function references, not strings
- [ ] JSON in script tags is properly escaped
- [ ] SVG content is sanitized
- [ ] Third-party libraries are kept up to date
- [ ] XSS testing is part of the QA process

## Resources

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Content Security Policy Guide](./csp.md)
- [Security Overview](./overview.md)
- [MDN: XSS](https://developer.mozilla.org/en-US/docs/Glossary/Cross-site_scripting)

## Summary

PhilJS provides strong XSS protection out of the box:

1. Automatic HTML escaping for all content
2. Context-aware escaping utilities
3. HTML sanitization for rich content
4. URL validation and sanitization
5. Safe JSON serialization

Remember: **Never trust user input**. Always validate, sanitize, and escape data based on the context where it will be used.
