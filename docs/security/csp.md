# Content Security Policy Guide

Content Security Policy (CSP) is a powerful security feature that helps prevent XSS attacks by controlling which resources can be loaded and executed in your application.

## Table of Contents

1. [Understanding CSP](#understanding-csp)
2. [CSP in PhilJS](#csp-in-philjs)
3. [Configuration](#configuration)
4. [Nonce-Based Scripts](#nonce-based-scripts)
5. [Common Patterns](#common-patterns)
6. [Testing and Debugging](#testing-and-debugging)
7. [Migration Guide](#migration-guide)

## Understanding CSP

CSP allows you to create an allowlist of trusted sources for content. When properly configured, it prevents:

- XSS attacks via inline scripts
- Data exfiltration
- Clickjacking
- Protocol downgrade attacks
- Mixed content

### How CSP Works

CSP uses HTTP headers to tell the browser which resources are allowed:

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com
```

This policy means:
- By default, only load resources from the same origin (`'self'`)
- Scripts can be loaded from same origin or cdn.example.com
- Inline scripts are blocked (unless using nonces or hashes)

## CSP in PhilJS

PhilJS provides comprehensive CSP utilities in the `philjs-ssr` package:

### Basic Setup

```typescript
import { buildCSP } from 'philjs-ssr';

const csp = buildCSP({
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'https:', 'data:'],
  },
});

response.headers.set(csp.header, csp.value);
```

### With Auto-Generated Nonce

```typescript
import { buildCSP } from 'philjs-ssr';

const csp = buildCSP({
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
  },
  autoNonce: true, // Automatically generate nonce
});

response.headers.set(csp.header, csp.value);

// Use the nonce in your HTML
const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <script nonce="${csp.nonce}">
        // This inline script is allowed
        console.log('CSP with nonce!');
      </script>
    </head>
  </html>
`;
```

## Configuration

### Default Directives

PhilJS provides secure defaults:

```typescript
import { DEFAULT_CSP_DIRECTIVES } from 'philjs-ssr';

// Equivalent to:
{
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'frame-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': true,
}
```

### Strict CSP

For maximum security:

```typescript
import { STRICT_CSP_DIRECTIVES } from 'philjs-ssr';

const csp = buildCSP({
  directives: STRICT_CSP_DIRECTIVES,
  autoNonce: true,
});

// Strict policy blocks everything except explicitly allowed
```

### Development CSP

More relaxed for local development:

```typescript
import { DEV_CSP_DIRECTIVES } from 'philjs-ssr';

const isDev = process.env.NODE_ENV === 'development';

const csp = buildCSP({
  directives: isDev ? DEV_CSP_DIRECTIVES : DEFAULT_CSP_DIRECTIVES,
  autoNonce: !isDev,
});
```

### Custom Directives

Add your own directives:

```typescript
import { buildCSP, mergeCSP, DEFAULT_CSP_DIRECTIVES } from 'philjs-ssr';

const customCSP = mergeCSP(DEFAULT_CSP_DIRECTIVES, {
  'script-src': ["'self'", 'https://analytics.example.com'],
  'connect-src': ["'self'", 'https://api.example.com'],
  'img-src': ["'self'", 'https://cdn.example.com', 'data:'],
});

const csp = buildCSP({ directives: customCSP });
```

## Nonce-Based Scripts

Nonces allow specific inline scripts while blocking all others:

### Server-Side Implementation

```typescript
import { buildCSP, generateNonce } from 'philjs-ssr';

export async function handleRequest(request: Request) {
  // Generate CSP with nonce
  const csp = buildCSP({
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
    },
    autoNonce: true,
  });

  // Render page with nonce
  const html = renderPage({ nonce: csp.nonce });

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      [csp.header]: csp.value,
    },
  });
}

function renderPage({ nonce }: { nonce?: string }) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>My App</title>
      </head>
      <body>
        <div id="root"></div>

        <!-- Inline script with nonce -->
        <script nonce="${nonce}">
          window.__INITIAL_STATE__ = { user: "John" };
        </script>

        <!-- External script (allowed by 'self') -->
        <script src="/app.js"></script>
      </body>
    </html>
  `;
}
```

### SSR with Nonces

```typescript
import { renderToStream, buildCSP } from 'philjs-ssr';

export async function handleSSR(request: Request) {
  const csp = buildCSP({
    directives: {
      'script-src': ["'self'"],
    },
    autoNonce: true,
  });

  const stream = renderToStream(<App />, {
    bootstrapScripts: ['/client.js'],
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/html',
      [csp.header]: csp.value,
    },
  });
}
```

### Client-Side Hydration

Pass the nonce to client-side code:

```typescript
// server.ts
const csp = buildCSP({ autoNonce: true });
const html = `
  <script nonce="${csp.nonce}">
    window.__CSP_NONCE__ = "${csp.nonce}";
  </script>
  <script nonce="${csp.nonce}" src="/client.js"></script>
`;

// client.ts
const nonce = (window as any).__CSP_NONCE__;

// Use nonce for dynamically created scripts
const script = document.createElement('script');
script.nonce = nonce;
script.textContent = 'console.log("Dynamic script");';
document.head.appendChild(script);
```

## Common Patterns

### Pattern 1: Static Site

Simple CSP for static sites:

```typescript
const csp = buildCSP({
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'img-src': ["'self'", 'data:'],
    'font-src': ["'self'"],
    'connect-src': ["'none'"],
    'object-src': ["'none'"],
  },
});
```

### Pattern 2: SPA with CDN

Allow CDN resources:

```typescript
const csp = buildCSP({
  directives: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
    ],
    'style-src': ["'self'", 'https://cdn.jsdelivr.net'],
    'img-src': ["'self'", 'https:', 'data:'],
    'connect-src': ["'self'", 'https://api.example.com'],
  },
});
```

### Pattern 3: Analytics Integration

Allow third-party analytics:

```typescript
const csp = buildCSP({
  directives: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
    ],
    'connect-src': [
      "'self'",
      'https://www.google-analytics.com',
      'https://stats.g.doubleclick.net',
    ],
    'img-src': [
      "'self'",
      'https://www.google-analytics.com',
      'data:',
    ],
  },
});
```

### Pattern 4: Embedding Content

Allow frames and embeds:

```typescript
const csp = buildCSP({
  directives: {
    'default-src': ["'self'"],
    'frame-src': [
      'https://www.youtube.com',
      'https://player.vimeo.com',
    ],
    'img-src': ["'self'", 'https:', 'data:'],
  },
});
```

### Pattern 5: Report-Only Mode

Test CSP without breaking your app:

```typescript
const csp = buildCSP({
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'report-uri': '/csp-violation-report',
  },
  reportOnly: true, // Won't block, only report
});

// Set up violation reporting endpoint
export async function handleCSPReport(request: Request) {
  const violation = await request.json();
  console.log('CSP Violation:', violation);

  // Log to your monitoring service
  await logToMonitoring({
    type: 'csp_violation',
    details: violation,
  });

  return new Response('OK', { status: 200 });
}
```

## Directive Reference

### Fetch Directives

Control where resources can be loaded from:

```typescript
{
  'default-src': ["'self'"],          // Default for all fetch directives
  'script-src': ["'self'"],           // JavaScript sources
  'style-src': ["'self'"],            // CSS sources
  'img-src': ["'self'", 'https:'],    // Image sources
  'font-src': ["'self'", 'data:'],    // Font sources
  'connect-src': ["'self'"],          // XHR, WebSocket, EventSource
  'media-src': ["'self'"],            // Audio, video sources
  'object-src': ["'none'"],           // <object>, <embed>, <applet>
  'frame-src': ["'self'"],            // <iframe> sources
  'worker-src': ["'self'"],           // Worker sources
  'manifest-src': ["'self'"],         // Manifest sources
}
```

### Document Directives

Control document properties:

```typescript
{
  'base-uri': ["'self'"],             // <base> element URLs
  'form-action': ["'self'"],          // Form submission URLs
  'frame-ancestors': ["'none'"],      // Who can embed this page
}
```

### Navigation Directives

```typescript
{
  'navigate-to': ["'self'"],          // Navigation URLs (experimental)
}
```

### Reporting Directives

```typescript
{
  'report-uri': '/csp-report',        // Legacy reporting endpoint
  'report-to': 'csp-endpoint',        // Modern reporting endpoint
}
```

### Other Directives

```typescript
{
  'upgrade-insecure-requests': true,   // Upgrade HTTP to HTTPS
  'block-all-mixed-content': true,     // Block mixed content
  'require-sri-for': ['script', 'style'], // Require SRI
}
```

## Testing and Debugging

### Enable Report-Only Mode

Start with report-only to test without breaking:

```typescript
const csp = buildCSP({
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
  },
  reportOnly: true,
});
```

### Use Browser DevTools

Check CSP violations in the console:

```
Refused to load the script 'https://evil.com/script.js' because it violates
the following Content Security Policy directive: "script-src 'self'".
```

### Validate CSP

Use PhilJS validation:

```typescript
import { validateCSP } from 'philjs-ssr';

const warnings = validateCSP({
  'script-src': ["'unsafe-eval'", "'unsafe-inline'"],
});

console.log(warnings);
// [
//   "script-src contains 'unsafe-eval' which allows eval() and is dangerous",
//   "script-src contains 'unsafe-inline' without nonce or hash..."
// ]
```

### Test CSP Online

Use online tools:
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Report URI CSP Wizard](https://report-uri.com/home/generate)

## Migration Guide

### Step 1: Start with Report-Only

```typescript
const csp = buildCSP({
  directives: DEFAULT_CSP_DIRECTIVES,
  reportOnly: true,
});
```

### Step 2: Monitor Violations

Set up violation reporting:

```typescript
const csp = buildCSP({
  directives: {
    ...DEFAULT_CSP_DIRECTIVES,
    'report-uri': '/csp-violations',
  },
  reportOnly: true,
});
```

### Step 3: Fix Violations

Common fixes:

```typescript
// Add missing domains
'script-src': ["'self'", 'https://cdn.example.com']

// Use nonces for inline scripts
autoNonce: true

// Allow specific styles
'style-src': ["'self'", "'unsafe-inline'"] // For CSS-in-JS
```

### Step 4: Enforce Policy

Remove report-only mode:

```typescript
const csp = buildCSP({
  directives: finalDirectives,
  reportOnly: false, // Enforce!
});
```

## Best Practices

### 1. Start Strict, Relax as Needed

```typescript
// Start with strict
import { STRICT_CSP_DIRECTIVES } from 'philjs-ssr';

// Add only what you need
const csp = mergeCSP(STRICT_CSP_DIRECTIVES, {
  'script-src': ["'self'", 'https://trusted-cdn.com'],
});
```

### 2. Use Nonces, Not unsafe-inline

```typescript
// BAD
'script-src': ["'self'", "'unsafe-inline'"]

// GOOD
const csp = buildCSP({
  directives: { 'script-src': ["'self'"] },
  autoNonce: true,
});
```

### 3. Avoid unsafe-eval

```typescript
// Avoid
'script-src': ["'self'", "'unsafe-eval'"]

// If you must, isolate it
'script-src': ["'self'"],
'worker-src': ["'self'", "'unsafe-eval'"] // Only for workers
```

### 4. Use SRI for CDN Resources

```typescript
<script
  src="https://cdn.example.com/lib.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"
></script>
```

### 5. Review Regularly

CSP should evolve with your app:

```typescript
// Audit periodically
const warnings = validateCSP(currentDirectives);
if (warnings.length > 0) {
  console.warn('CSP Issues:', warnings);
}
```

## Troubleshooting

### Issue: Inline Styles Blocked

**Problem**: CSS-in-JS libraries blocked

**Solution**: Allow unsafe-inline or use nonces

```typescript
// Option 1: Allow unsafe-inline (less secure)
'style-src': ["'self'", "'unsafe-inline'"]

// Option 2: Use nonces (more secure)
const csp = buildCSP({
  directives: { 'style-src': ["'self'"] },
  autoNonce: true,
});

// Apply nonce to style tags
<style nonce={csp.nonce}>...</style>
```

### Issue: Third-Party Scripts Blocked

**Problem**: Analytics, ads, or widgets blocked

**Solution**: Add domains to allowlist

```typescript
'script-src': [
  "'self'",
  'https://www.google-analytics.com',
  'https://cdn.segment.com',
]
```

### Issue: WebSocket Connections Blocked

**Problem**: WS connections fail

**Solution**: Allow ws: and wss: protocols

```typescript
'connect-src': ["'self'", 'ws://localhost:3000', 'wss://api.example.com']
```

### Issue: Image Loading Issues

**Problem**: Images from CDN blocked

**Solution**: Allow image domains

```typescript
'img-src': [
  "'self'",
  'https://images.example.com',
  'https:',  // Allow all HTTPS images
  'data:',   // Allow data URIs
]
```

## Resources

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Quick Reference](https://content-security-policy.com/)
- [Google CSP Guide](https://developers.google.com/web/fundamentals/security/csp)
- [XSS Prevention Guide](./xss-prevention.md)

## Summary

Content Security Policy is a powerful defense against XSS and other attacks. PhilJS makes it easy to implement CSP with:

1. Secure default directives
2. Automatic nonce generation
3. Flexible configuration
4. Validation and testing tools
5. Report-only mode for safe migration

Start with report-only mode, fix violations, then enforce your policy for maximum security.
