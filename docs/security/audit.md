# Security Audit Documentation

Comprehensive security guidelines and best practices for PhilJS applications.

## Table of Contents

- [XSS Prevention](#xss-prevention)
- [Safe HTML Rendering](#safe-html-rendering)
- [Input Sanitization](#input-sanitization)
- [CSRF Protection](#csrf-protection)
- [Content Security Policy](#content-security-policy)
- [Rate Limiting](#rate-limiting)
- [Security Headers](#security-headers)
- [Authentication & Authorization](#authentication--authorization)
- [Security Checklist](#security-checklist)

---

## XSS Prevention

### How PhilJS Prevents XSS

PhilJS provides **automatic XSS protection** through its JSX rendering system. All dynamic content is escaped by default during server-side rendering.

#### Built-in HTML Escaping

The framework automatically escapes HTML special characters in text content:

```typescript
// packages/philjs-core/src/render-to-string.ts
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
```

#### Safe by Default

```tsx
// Safe - User input is automatically escaped
function UserProfile({ user }: { user: User }) {
  return (
    <div>
      <h1>{user.name}</h1>        {/* Escaped */}
      <p>{user.bio}</p>            {/* Escaped */}
      <span>{user.email}</span>    {/* Escaped */}
    </div>
  );
}

// Example: If user.name = "<script>alert('XSS')</script>"
// Rendered as: &lt;script&gt;alert('XSS')&lt;/script&gt;
```

#### Attribute Escaping

Attributes are also automatically escaped:

```tsx
function UserLink({ username, url }: { username: string; url: string }) {
  return (
    <a href={url} title={username}>
      {username}
    </a>
  );
}

// If url = "javascript:alert('XSS')"
// Rendered as: href="javascript:alert('XSS')" (escaped quotes prevent injection)
```

### Common XSS Vectors and Protections

#### 1. Script Injection

```tsx
// Unsafe input
const maliciousInput = "<script>alert('XSS')</script>";

// Safe - PhilJS escapes this
<div>{maliciousInput}</div>
// Renders as: &lt;script&gt;alert('XSS')&lt;/script&gt;
```

#### 2. Event Handler Injection

```tsx
// Unsafe input
const maliciousAttr = '" onload="alert(\'XSS\')';

// Safe - PhilJS escapes attribute values
<img src="image.jpg" alt={maliciousAttr} />
// Renders as: alt="&quot; onload=&quot;alert('XSS')"
```

#### 3. URL Injection

```tsx
// Validate URLs before using them
function SafeLink({ href, text }: { href: string; text: string }) {
  // Only allow safe protocols
  const isSafeUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  return (
    <a href={isSafeUrl(href) ? href : '#'}>
      {text}
    </a>
  );
}

// Blocks: javascript:, data:, vbscript:, etc.
```

### XSS Prevention Rules

```tsx
// Rule 1: Never bypass escaping unless absolutely necessary
// Avoid this pattern:
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // DANGEROUS

// Rule 2: If you must use raw HTML, sanitize it first
import DOMPurify from 'isomorphic-dompurify';

function SafeHTML({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
    ALLOWED_ATTR: ['href', 'title'],
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

// Rule 3: Validate and sanitize on the server
// Never trust client-side validation alone
```

---

## Safe HTML Rendering

### When You Need Raw HTML

Sometimes you need to render HTML from trusted sources (e.g., markdown content, WYSIWYG editors):

#### Using DOMPurify

```typescript
import DOMPurify from 'isomorphic-dompurify';

interface RichTextProps {
  content: string;
  allowedTags?: string[];
}

function RichText({ content, allowedTags }: RichTextProps) {
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: allowedTags || [
      'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

#### Content Security Policy for HTML

```typescript
// Only allow specific HTML elements and attributes
const SAFE_HTML_CONFIG = {
  ALLOWED_TAGS: [
    // Text formatting
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Lists
    'ul', 'ol', 'li',
    // Links
    'a',
    // Quotes
    'blockquote', 'q',
  ],
  ALLOWED_ATTR: {
    'a': ['href', 'title', 'target', 'rel'],
    '*': ['class'], // Allow class on all tags
  },
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true,
  RETURN_TRUSTED_TYPE: true,
};

function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, SAFE_HTML_CONFIG);
}
```

#### Markdown Rendering

```typescript
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

function MarkdownContent({ markdown }: { markdown: string }) {
  // Step 1: Convert markdown to HTML
  const html = marked.parse(markdown);

  // Step 2: Sanitize the HTML
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote'
    ],
    ALLOWED_ATTR: ['href', 'title'],
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### Server-Side Sanitization

Always sanitize on the server, not just the client:

```typescript
// server/api/content.ts
import DOMPurify from 'isomorphic-dompurify';

export async function POST(request: Request) {
  const { content } = await request.json();

  // Sanitize on server before storing
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
    ALLOWED_ATTR: [],
  });

  // Store sanitized content
  await db.content.create({ body: sanitized });

  return new Response(JSON.stringify({ success: true }));
}
```

---

## Input Sanitization

### Input Validation Patterns

#### 1. Email Validation

```typescript
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function EmailInput() {
  const email = signal('');
  const error = signal('');

  const handleChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    email.set(value);

    if (!validateEmail(value)) {
      error.set('Invalid email format');
    } else {
      error.set('');
    }
  };

  return (
    <div>
      <input
        type="email"
        value={email()}
        onInput={handleChange}
        required
      />
      {error() && <span class="error">{error()}</span>}
    </div>
  );
}
```

#### 2. Text Input Sanitization

```typescript
// Remove potentially dangerous characters
function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 1000); // Limit length
}

// Whitelist approach (safer)
function sanitizeUsername(input: string): string {
  // Only allow alphanumeric, underscore, hyphen
  return input.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
}

function sanitizeAlphanumeric(input: string): string {
  return input.replace(/[^a-zA-Z0-9\s]/g, '');
}
```

#### 3. Number Validation

```typescript
function validateNumber(input: string, min?: number, max?: number): number | null {
  const num = parseFloat(input);

  if (isNaN(num)) return null;
  if (min !== undefined && num < min) return null;
  if (max !== undefined && num > max) return null;

  return num;
}

function QuantityInput() {
  const quantity = signal(1);

  const handleChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    const num = validateNumber(value, 1, 100);

    if (num !== null) {
      quantity.set(num);
    }
  };

  return (
    <input
      type="number"
      min="1"
      max="100"
      value={quantity()}
      onInput={handleChange}
    />
  );
}
```

#### 4. URL Validation

```typescript
function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Block dangerous protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
```

### Form Validation

```tsx
import { useForm, v as validators } from '@philjs/core';

function RegistrationForm() {
  const form = useForm({
    initialValues: {
      username: '',
      email: '',
      password: '',
      age: 0,
    },
    schema: {
      username: {
        validators: [
          validators.required('Username is required'),
          validators.minLength(3, 'Username must be at least 3 characters'),
          validators.maxLength(30, 'Username must be less than 30 characters'),
          validators.pattern(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, _ and -'),
        ],
      },
      email: {
        validators: [
          validators.required('Email is required'),
          validators.email('Invalid email format'),
        ],
      },
      password: {
        validators: [
          validators.required('Password is required'),
          validators.minLength(8, 'Password must be at least 8 characters'),
          validators.pattern(/[A-Z]/, 'Password must contain uppercase'),
          validators.pattern(/[a-z]/, 'Password must contain lowercase'),
          validators.pattern(/[0-9]/, 'Password must contain number'),
        ],
      },
      age: {
        validators: [
          validators.min(18, 'Must be at least 18'),
          validators.max(120, 'Invalid age'),
        ],
      },
    },
    onSubmit: async (values) => {
      // All values are validated before reaching here
      await api.post('/register', values);
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <div>
        <input
          name="username"
          value={form.values.username}
          onInput={form.handleChange}
        />
        {form.errors.username && <span>{form.errors.username}</span>}
      </div>

      <div>
        <input
          name="email"
          type="email"
          value={form.values.email}
          onInput={form.handleChange}
        />
        {form.errors.email && <span>{form.errors.email}</span>}
      </div>

      <div>
        <input
          name="password"
          type="password"
          value={form.values.password}
          onInput={form.handleChange}
        />
        {form.errors.password && <span>{form.errors.password}</span>}
      </div>

      <button type="submit" disabled={!form.isValid}>
        Register
      </button>
    </form>
  );
}
```

---

## CSRF Protection

PhilJS provides built-in CSRF (Cross-Site Request Forgery) protection through the `@philjs/ssr` package.

### How CSRF Protection Works

CSRF protection uses secure random tokens to verify that requests originate from your application:

```typescript
// packages/philjs-ssr/src/csrf.ts
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex'); // 256-bit random token
}
```

### Server-Side Setup

```typescript
import { csrfProtection, csrfField } from '@philjs/ssr';

// Configure CSRF middleware
const csrf = csrfProtection({
  getSessionId: (request) => {
    // Extract session ID from cookie or header
    const cookie = request.headers.get('cookie');
    return parseSessionId(cookie) || 'default';
  },
  skip: (request) => {
    // Skip CSRF for safe methods (GET, HEAD, OPTIONS)
    // and for API endpoints that use other auth (e.g., API keys)
    const url = new URL(request.url);
    return url.pathname.startsWith('/api/public/');
  },
});

// Generate token for a user session
const token = csrf.generateToken(request);
```

### Form Protection

```typescript
// Server route handler
export async function GET(request: Request) {
  const csrf = csrfProtection({ getSessionId: getSession });
  const csrfToken = csrf.generateToken(request);

  return renderToString(
    <form method="POST" action="/submit">
      {/* Hidden CSRF token field */}
      <input type="hidden" name="_csrf" value={csrfToken} />

      <input type="text" name="data" />
      <button type="submit">Submit</button>
    </form>
  );
}

// POST handler - verify CSRF token
export async function POST(request: Request) {
  const csrf = csrfProtection({ getSessionId: getSession });

  if (!csrf.verifyRequest(request)) {
    return new Response('CSRF token invalid', { status: 403 });
  }

  // Process form data
  const formData = await request.formData();
  // ...
}
```

### AJAX/Fetch Protection

```tsx
import { signal, effect } from '@philjs/core';

function SecureForm() {
  const csrfToken = signal('');

  // Fetch CSRF token on mount
  effect(async () => {
    const response = await fetch('/api/csrf-token');
    const data = await response.json();
    csrfToken.set(data.token);
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken(), // Include token in header
      },
      body: JSON.stringify({ data: '...' }),
    });

    // Handle response
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="data" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Token Storage

For production, use Redis or a similar distributed store:

```typescript
import Redis from 'ioredis';
import { csrfProtection } from '@philjs/ssr';

const redis = new Redis();

// Custom CSRF store backed by Redis
class RedisCSRFStore {
  async set(sessionId: string, token: string, ttl: number = 3600000) {
    await redis.set(`csrf:${sessionId}`, token, 'PX', ttl);
  }

  async get(sessionId: string): Promise<string | null> {
    return await redis.get(`csrf:${sessionId}`);
  }

  async verify(sessionId: string, token: string): Promise<boolean> {
    const stored = await this.get(sessionId);
    return stored === token;
  }
}

// Use in your application
const csrfStore = new RedisCSRFStore();
```

### Extract CSRF Token from Requests

```typescript
import { extractCSRFToken } from '@philjs/ssr';

export async function POST(request: Request) {
  // Extract from header or form field
  const token = await extractCSRFToken(request);

  if (!token) {
    return new Response('Missing CSRF token', { status: 400 });
  }

  // Verify token
  const isValid = await verifyToken(token);
  // ...
}
```

### SameSite Cookies

Combine CSRF tokens with SameSite cookies for defense in depth:

```typescript
import { createCookie } from '@philjs/ssr';

const sessionCookie = createCookie('session', {
  httpOnly: true,      // Not accessible to JavaScript
  secure: true,        // HTTPS only
  sameSite: 'Strict',  // Strict CSRF protection
  maxAge: 86400,       // 24 hours
  path: '/',
});

// Set cookie
response.headers.set('Set-Cookie', sessionCookie.serialize(sessionId));
```

---

## Content Security Policy

PhilJS provides built-in CSP (Content Security Policy) support to prevent XSS and other injection attacks.

### CSP Implementation

```typescript
import { buildCSP, createNonce } from '@philjs/ssr';

// Generate nonce for inline scripts
const nonce = createNonce(); // Cryptographically secure random value

// Build CSP header
const csp = buildCSP({
  nonce,
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'nonce-{NONCE}'"],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': ["'self'", 'https://api.example.com'],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': [],
  },
  reportUri: '/api/csp-report', // Optional: report violations
});

// Set header
response.headers.set(csp.header, csp.value);
```

### Default CSP Directives

PhilJS includes secure defaults:

```typescript
const DEFAULT_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"], // unsafe-inline for style tags
  'img-src': ["'self'", 'data:', 'blob:'],
  'connect-src': ["'self'"],
  'font-src': ["'self'", 'data:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': [],
};
```

### Using Nonces for Inline Scripts

```tsx
import { buildCSP, createNonce } from '@philjs/ssr';

export async function renderPage(request: Request) {
  const nonce = createNonce();
  const csp = buildCSP({ nonce });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="Content-Security-Policy" content="${csp.value}">
      </head>
      <body>
        <div id="root"></div>

        <!-- Inline script with nonce -->
        <script nonce="${nonce}">
          window.__INITIAL_STATE__ = ${JSON.stringify(state)};
        </script>
      </body>
    </html>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      [csp.header]: csp.value,
    },
  });
}
```

### CSP Report-Only Mode

Test CSP without breaking your site:

```typescript
const csp = buildCSP({
  directives: { /* ... */ },
  reportOnly: true, // Don't enforce, only report violations
  reportUri: '/api/csp-report',
});

// Header will be: Content-Security-Policy-Report-Only
```

### Handling CSP Reports

```typescript
export async function POST(request: Request) {
  const report = await request.json();

  console.error('CSP Violation:', {
    documentUri: report['document-uri'],
    violatedDirective: report['violated-directive'],
    blockedUri: report['blocked-uri'],
    sourceFile: report['source-file'],
    lineNumber: report['line-number'],
  });

  // Store in logging system
  await logCSPViolation(report);

  return new Response('Report received', { status: 204 });
}
```

### Strict CSP

For maximum security, use a strict CSP with nonces:

```typescript
const strictCSP = buildCSP({
  nonce,
  directives: {
    'default-src': ["'none'"],
    'script-src': ["'nonce-{NONCE}'", "'strict-dynamic'"],
    'style-src': ["'nonce-{NONCE}'"],
    'img-src': ["'self'", 'data:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'base-uri': ["'none'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'upgrade-insecure-requests': [],
  },
});
```

---

## Rate Limiting

PhilJS provides comprehensive rate limiting to protect against abuse and DDoS attacks.

### Basic Rate Limiting

```typescript
import { rateLimit, MemoryRateLimitStore } from '@philjs/ssr';

// Create rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minute window
  maxRequests: 100,       // 100 requests per window
  message: 'Too many requests, please slow down',
});

// Use as middleware
export async function GET(request: Request) {
  const rateLimitResponse = await limiter(request, async () => {
    // Your handler
    return new Response('Success');
  });

  return rateLimitResponse;
}
```

### Pre-configured Limiters

```typescript
import {
  apiRateLimit,
  authRateLimit,
  apiKeyRateLimit,
  userRateLimit,
} from '@philjs/ssr';

// API routes: 60 requests/minute
export const apiLimiter = apiRateLimit(60);

// Auth routes: 5 attempts/minute
export const authLimiter = authRateLimit(5);

// API key: 1000 requests/minute
export const keyLimiter = apiKeyRateLimit(1000);

// Per-user: 100 requests/minute
export const userLimiter = userRateLimit(100, (request) => {
  return request.headers.get('x-user-id') || 'anonymous';
});
```

### Custom Key Generation

```typescript
const limiter = rateLimit({
  windowMs: 60000,
  maxRequests: 100,
  keyGenerator: (request) => {
    // Rate limit by API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey) return `api:${apiKey}`;

    // Fallback to IP address
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    return `ip:${ip}`;
  },
});
```

### Redis Store for Production

```typescript
import { RedisRateLimitStore } from '@philjs/ssr';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

const store = new RedisRateLimitStore(redis, 'app:ratelimit:');

const limiter = rateLimit(
  {
    windowMs: 60000,
    maxRequests: 100,
  },
  store
);
```

### Rate Limit Headers

PhilJS automatically adds standard rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-12-17T12:00:00.000Z
```

### Skip Successful/Failed Requests

```typescript
// Only count failed login attempts
const loginLimiter = rateLimit({
  windowMs: 60000,
  maxRequests: 5,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Only count successful uploads
const uploadLimiter = rateLimit({
  windowMs: 60000,
  maxRequests: 10,
  skipFailedRequests: true, // Don't count failed uploads
});
```

### Adaptive Rate Limiting

Automatically adjust limits based on error rates:

```typescript
import { AdaptiveRateLimiter } from '@philjs/ssr';

const limiter = new AdaptiveRateLimiter({
  baseLimit: 100,
  windowMs: 60000,
  errorThreshold: 0.1,      // 10% error rate triggers reduction
  adaptationFactor: 0.5,    // Reduce by 50% when errors high
});

// In request handler
const rateLimitResponse = await limiter.check(request);
if (rateLimitResponse) return rateLimitResponse;

const response = await handleRequest(request);
const success = response.status < 400;

// Record result for adaptation
await limiter.recordResult(success);
```

### Sliding Window Rate Limiting

More accurate than fixed windows:

```typescript
import { SlidingWindowRateLimiter } from '@philjs/ssr';

const limiter = new SlidingWindowRateLimiter({
  windowMs: 60000,
  maxRequests: 100,
  message: 'Rate limit exceeded',
});

const rateLimitResponse = await limiter.check(request);
if (rateLimitResponse) return rateLimitResponse;
```

---

## Security Headers

### Essential Security Headers

PhilJS applications should include these security headers:

```typescript
export function setSecurityHeaders(response: Response): Response {
  // Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Feature policy
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  // HTTPS only (HSTS)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  return response;
}
```

### Header Middleware

```typescript
export function securityHeadersMiddleware(
  handler: (request: Request) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    const response = await handler(request);
    return setSecurityHeaders(response);
  };
}

// Usage
export const GET = securityHeadersMiddleware(async (request) => {
  return new Response('Hello');
});
```

---

## Authentication & Authorization

### Secure Session Management

```typescript
import { createCookie } from '@philjs/ssr';

const sessionCookie = createCookie('session', {
  secrets: [process.env.SESSION_SECRET!],
  httpOnly: true,
  secure: true,
  sameSite: 'Strict',
  maxAge: 86400, // 24 hours
});

// Set session
export async function login(userId: string) {
  const sessionId = generateSecureId();

  // Store session in database/Redis
  await sessions.set(sessionId, {
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000,
  });

  // Set cookie
  return sessionCookie.serialize(sessionId);
}

// Verify session
export async function getSession(request: Request) {
  const cookie = request.headers.get('cookie');
  const parsed = sessionCookie.parse(cookie);

  if (!parsed || !parsed.signed) return null;

  const session = await sessions.get(parsed.value);

  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  return session;
}
```

### Password Hashing

Never store plain text passwords. Always hash:

```typescript
import bcrypt from 'bcrypt';

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Example usage
export async function register(email: string, password: string) {
  const hashedPassword = await hashPassword(password);

  await db.users.create({
    email,
    password: hashedPassword, // Store hash, not plain text
  });
}
```

### Role-Based Access Control

```typescript
type Role = 'admin' | 'editor' | 'viewer';

interface User {
  id: string;
  role: Role;
}

export function requireRole(allowedRoles: Role[]) {
  return async (request: Request, next: () => Promise<Response>) => {
    const session = await getSession(request);

    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const user = await getUser(session.userId);

    if (!allowedRoles.includes(user.role)) {
      return new Response('Forbidden', { status: 403 });
    }

    return next();
  };
}

// Usage
export const POST = requireRole(['admin', 'editor'])(async (request) => {
  // Only admins and editors can access this
  return new Response('Success');
});
```

---

## Security Checklist

### Development Checklist

- [ ] All user input is validated and sanitized
- [ ] XSS protection is enabled (automatic in PhilJS)
- [ ] CSRF tokens are used for state-changing operations
- [ ] Content Security Policy is configured
- [ ] Rate limiting is enabled for public endpoints
- [ ] Security headers are set
- [ ] Passwords are hashed with bcrypt/argon2
- [ ] Sessions use secure, httpOnly cookies
- [ ] HTTPS is enforced in production
- [ ] Secrets are stored in environment variables, not code
- [ ] Dependencies are regularly updated
- [ ] SQL injection prevention (use parameterized queries)
- [ ] File uploads are validated and scanned
- [ ] Error messages don't leak sensitive information
- [ ] Logging doesn't include sensitive data

### Production Checklist

- [ ] SSL/TLS certificates are valid and up-to-date
- [ ] HSTS is enabled
- [ ] CSP is enforced (not report-only)
- [ ] Rate limiting uses Redis or distributed store
- [ ] CSRF tokens use Redis or distributed store
- [ ] Sessions expire after inactivity
- [ ] Failed login attempts are rate-limited
- [ ] Security headers are set on all responses
- [ ] Error tracking is configured (but sanitized)
- [ ] Regular security audits are scheduled
- [ ] Dependency vulnerability scanning is automated
- [ ] Backup and disaster recovery plan exists
- [ ] Access logs are monitored
- [ ] Intrusion detection is enabled

### Code Review Checklist

- [ ] No hardcoded secrets or API keys
- [ ] No use of `eval()` or `Function()` with user input
- [ ] No direct HTML injection without sanitization
- [ ] All external data is validated
- [ ] Authentication is required for sensitive operations
- [ ] Authorization checks are performed
- [ ] Errors are handled gracefully
- [ ] Logging is appropriate (not too much/little)
- [ ] Third-party libraries are from trusted sources
- [ ] Security best practices are followed

---

## Summary

PhilJS provides comprehensive security features:

1. **XSS Prevention**: Automatic HTML escaping in JSX
2. **CSRF Protection**: Built-in token generation and verification
3. **CSP**: Content Security Policy with nonce support
4. **Rate Limiting**: Multiple strategies and storage backends
5. **Input Validation**: Form validation and sanitization
6. **Secure Cookies**: Signed, httpOnly, sameSite cookies
7. **Security Headers**: Best practice HTTP headers

### Key Principles

- **Defense in Depth**: Multiple layers of security
- **Secure by Default**: Safe defaults that work out of the box
- **Validate Everything**: Never trust user input
- **Fail Securely**: Errors should not expose sensitive information
- **Least Privilege**: Grant minimum necessary permissions
- **Stay Updated**: Regular security updates and audits

### Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Web Security Academy](https://portswigger.net/web-security)

---

**Next Steps:**

- Review your application against the security checklist
- Enable CSP and monitor violation reports
- Configure rate limiting for your API endpoints
- Set up CSRF protection for forms
- Implement proper authentication and authorization
- Schedule regular security audits

For questions or security concerns, please review the [security best practices guide](../best-practices/security.md).
