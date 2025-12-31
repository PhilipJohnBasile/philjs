# Security Overview

PhilJS is built with security as a core principle. This guide provides an overview of the security features, best practices, and considerations when building applications with PhilJS.

## Table of Contents

1. [Security Features](#security-features)
2. [Security Architecture](#security-architecture)
3. [Common Vulnerabilities](#common-vulnerabilities)
4. [Security Checklist](#security-checklist)
5. [Reporting Security Issues](#reporting-security-issues)

## Security Features

### Built-in XSS Protection

PhilJS automatically escapes user input during server-side rendering and client-side hydration:

- **Automatic HTML Escaping**: All text content is escaped by default
- **Attribute Sanitization**: HTML attributes are properly escaped
- **Script Context Protection**: User data in script tags is escaped
- **Safe JSON Serialization**: Prevents prototype pollution attacks

See [XSS Prevention Guide](./xss-prevention.md) for detailed information.

### Content Security Policy (CSP)

PhilJS provides utilities for implementing strict Content Security Policies:

- **Nonce-based Script Loading**: Eliminate `unsafe-inline` for scripts
- **Configurable Directives**: Fine-grained control over resource loading
- **CSP Report Monitoring**: Track and respond to policy violations
- **Development Mode Support**: Relaxed policies for HMR and debugging

See [CSP Guide](./csp.md) for implementation details.

### CSRF Protection

Built-in CSRF protection for form submissions and API calls:

- **Token Generation**: Cryptographically secure tokens
- **Automatic Validation**: Middleware for request verification
- **Double Submit Cookies**: Additional protection layer
- **Session Integration**: Works with existing session management

See [API Security Guide](./api-security.md) for CSRF implementation.

### Secure Cookie Handling

PhilJS provides utilities for secure cookie management:

- **HttpOnly Cookies**: Prevent XSS access to sensitive cookies
- **Secure Flag**: HTTPS-only transmission
- **SameSite Protection**: CSRF protection via cookie attributes
- **Signed Cookies**: Tamper detection with HMAC signatures
- **Automatic Encryption**: Optional cookie value encryption

### Input Validation and Sanitization

Security utilities for safe data handling:

```typescript
import {
  escapeHtml,
  sanitizeHtml,
  sanitizeUrl,
  safeJsonParse
} from '@philjs/core';

// Escape user input
const safe = escapeHtml(userInput);

// Sanitize HTML content
const clean = sanitizeHtml(richText, {
  allowedTags: ['p', 'strong', 'em'],
});

// Validate URLs
const validUrl = sanitizeUrl(redirectUrl, ['example.com']);

// Safe JSON parsing (prevents prototype pollution)
const data = safeJsonParse(jsonString);
```

## Security Architecture

### Defense in Depth

PhilJS employs multiple layers of security:

1. **Input Validation**: Validate and sanitize all user input
2. **Output Encoding**: Escape data based on context (HTML, JS, URL)
3. **CSP Headers**: Restrict resource loading and execution
4. **CSRF Tokens**: Prevent cross-site request forgery
5. **Secure Defaults**: Security-first configuration out of the box

### SSR Security Model

Server-side rendering introduces unique security considerations:

- **Server-Side Validation**: Never trust client-side validation alone
- **State Serialization**: Sanitize state before embedding in HTML
- **Hydration Integrity**: Verify hydration data hasn't been tampered with
- **Secret Management**: Keep server secrets out of client bundles

### Client-Side Security

Protecting the browser environment:

- **Sandboxed Execution**: Isolate untrusted content
- **Secure State Management**: Prevent state injection attacks
- **Safe Hydration**: Validate server-rendered content before hydration
- **Event Handler Security**: Sanitize event handler attributes

## Common Vulnerabilities

### Cross-Site Scripting (XSS)

**Risk**: Attackers inject malicious scripts into your application.

**PhilJS Protection**:
- Automatic HTML escaping in templates
- CSP to block inline scripts
- Sanitization utilities for rich content

**Your Responsibility**:
- Never use `dangerouslySetInnerHTML` with unsanitized input
- Validate and sanitize user-generated content
- Use CSP nonces for legitimate inline scripts

Example:
```typescript
// BAD - Vulnerable to XSS
<div dangerouslySetInnerHTML={{ __html: userComment }} />

// GOOD - Safe rendering
import { sanitizeHtml } from '@philjs/core';
<div>{sanitizeHtml(userComment)}</div>
```

### Cross-Site Request Forgery (CSRF)

**Risk**: Attackers trick users into performing unwanted actions.

**PhilJS Protection**:
- Built-in CSRF token generation
- SameSite cookie attributes
- Origin validation

**Your Responsibility**:
- Enable CSRF protection for state-changing operations
- Use POST for non-idempotent actions
- Validate the origin header

Example:
```typescript
import { csrfProtection } from '@philjs/ssr';

const csrf = csrfProtection({
  getSessionId: (req) => req.headers.get('session-id') || 'default',
});

// Generate token for forms
const token = csrf.generateToken(request);

// Verify on submission
if (!csrf.verifyRequest(request)) {
  return new Response('CSRF validation failed', { status: 403 });
}
```

### Prototype Pollution

**Risk**: Attackers modify Object.prototype, affecting all objects.

**PhilJS Protection**:
- Safe JSON parsing utilities
- Input sanitization
- No direct prototype manipulation

**Your Responsibility**:
- Use `safeJsonParse` instead of `JSON.parse` for untrusted data
- Validate object keys before using them
- Avoid using `Object.assign` with user input

Example:
```typescript
import { safeJsonParse } from '@philjs/core';

// BAD - Vulnerable to prototype pollution
const data = JSON.parse(userInput);

// GOOD - Protected against prototype pollution
const data = safeJsonParse(userInput);
```

### SQL Injection

**Risk**: Attackers manipulate database queries.

**PhilJS Protection**:
- Framework doesn't include database layer (reduces attack surface)
- Recommendations for safe database practices

**Your Responsibility**:
- Always use parameterized queries or ORMs
- Never concatenate user input into SQL
- Validate and sanitize database inputs

Example:
```typescript
// BAD - SQL Injection vulnerability
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// GOOD - Parameterized query
db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

### Open Redirect

**Risk**: Attackers redirect users to malicious sites.

**PhilJS Protection**:
- URL sanitization utilities
- Allowlist-based validation

**Your Responsibility**:
- Validate redirect URLs
- Use allowlists for external domains
- Avoid user-controlled redirects when possible

Example:
```typescript
import { sanitizeUrl } from '@philjs/core';

// Validate redirect URL
const redirectUrl = sanitizeUrl(
  userProvidedUrl,
  ['example.com', 'trusted-domain.com']
);

if (redirectUrl) {
  return Response.redirect(redirectUrl);
} else {
  return Response.redirect('/');
}
```

### Server-Side Request Forgery (SSRF)

**Risk**: Attackers make the server send requests to internal resources.

**PhilJS Protection**:
- No built-in HTTP client (reduces attack surface)

**Your Responsibility**:
- Validate and sanitize URLs before making requests
- Implement allowlists for external APIs
- Block private IP ranges
- Use network-level protections

Example:
```typescript
function isPrivateIP(hostname: string): boolean {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^127\./,
    /^localhost$/,
  ];
  return privateRanges.some(range => range.test(hostname));
}

async function fetchExternal(url: string) {
  const parsed = new URL(url);

  if (isPrivateIP(parsed.hostname)) {
    throw new Error('Private IP addresses not allowed');
  }

  return fetch(url);
}
```

## Security Checklist

Use this checklist when deploying PhilJS applications:

### Development Phase

- [ ] Enable strict TypeScript checks
- [ ] Configure CSP headers for your application
- [ ] Implement CSRF protection for forms and APIs
- [ ] Use HTTPS for all environments (including development)
- [ ] Sanitize all user input
- [ ] Validate file uploads (type, size, content)
- [ ] Implement rate limiting for APIs
- [ ] Use secure session management
- [ ] Configure secure cookie settings
- [ ] Review third-party dependencies regularly

### Pre-Production

- [ ] Run `pnpm audit` and fix vulnerabilities
- [ ] Review CSP violations in report-only mode
- [ ] Test authentication and authorization flows
- [ ] Perform security code review
- [ ] Test XSS protection with fuzzing
- [ ] Verify CSRF protection works
- [ ] Check for exposed secrets in code/config
- [ ] Test error handling (no sensitive info in errors)
- [ ] Configure security headers (CSP, HSTS, X-Frame-Options)
- [ ] Enable HTTPS with strong TLS configuration

### Production

- [ ] Monitor CSP violation reports
- [ ] Set up security logging and alerting
- [ ] Implement DDoS protection
- [ ] Configure firewall rules
- [ ] Use environment variables for secrets
- [ ] Enable automatic security updates
- [ ] Implement backup and disaster recovery
- [ ] Set up security monitoring (SIEM)
- [ ] Configure rate limiting and throttling
- [ ] Regular security audits and penetration testing

### Post-Deployment

- [ ] Monitor security logs regularly
- [ ] Keep dependencies updated
- [ ] Review and rotate secrets/keys periodically
- [ ] Conduct regular security training
- [ ] Maintain incident response plan
- [ ] Track and patch CVEs promptly

See [Security Checklist](./checklist.md) for a comprehensive pre-deployment checklist.

## Security Best Practices

### 1. Validate Input, Escape Output

```typescript
import { escapeHtml, sanitizeHtml } from '@philjs/core';

// Always validate input
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Always escape output
function renderComment(comment: string) {
  return <div>{escapeHtml(comment)}</div>;
}
```

### 2. Use Security Headers

```typescript
import { buildCSP } from '@philjs/ssr';

const csp = buildCSP({
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"],
  },
  autoNonce: true,
});

response.headers.set(csp.header, csp.value);
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
response.headers.set('Permissions-Policy', 'geolocation=(), microphone=()');
```

### 3. Implement Rate Limiting

```typescript
import { RateLimiter } from '@philjs/ssr';

const limiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
});

// In request handler
if (!limiter.check(clientId)) {
  return new Response('Too many requests', { status: 429 });
}
```

### 4. Secure Authentication

```typescript
// Use secure cookies for sessions
import { createCookie } from '@philjs/ssr';

const sessionCookie = createCookie('session', {
  httpOnly: true,
  secure: true,
  sameSite: 'Strict',
  maxAge: 3600, // 1 hour
  secrets: [process.env.COOKIE_SECRET!],
});
```

### 5. Environment Variables for Secrets

```typescript
// Never hardcode secrets
const API_KEY = process.env.API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const SESSION_SECRET = process.env.SESSION_SECRET;

// Validate required secrets exist
if (!API_KEY || !DATABASE_URL || !SESSION_SECRET) {
  throw new Error('Missing required environment variables');
}
```

## Dependency Security

PhilJS applications depend on npm packages. Keep dependencies secure:

### Regular Audits

```bash
# Check for vulnerabilities
pnpm audit

# Update dependencies
pnpm update

# Check outdated packages
pnpm outdated
```

### Current Vulnerabilities (as of audit)

Based on the latest `pnpm audit`, the following vulnerabilities exist:

1. **js-yaml** (Moderate) - YAML parsing vulnerability
   - Affected: `@changesets/cli`, `eslint`
   - Fix: Update to js-yaml 4.1.1+

2. **undici** (Moderate) - Insufficiently random values in multipart requests
   - Affected: `@vercel/node`
   - Fix: Update undici to 5.28.5+

3. **esbuild** (Low) - Command injection in CLI
   - Affected: `@philjs/cli`, `@vercel/node`
   - Fix: Update esbuild to latest

4. **glob** (High) - Command injection via `-c` flag
   - Affected: `@philjs/migrate`
   - Fix: Update glob to 10.5.0+

### Mitigation Steps

1. Update dependencies:
```bash
pnpm update @changesets/cli eslint
pnpm update @vercel/node
pnpm update esbuild
pnpm update glob
```

2. Review and test after updates

3. Consider alternative packages if updates aren't available

## Reporting Security Issues

If you discover a security vulnerability in PhilJS:

1. **DO NOT** open a public GitHub issue
2. Email security details to: security@philjs.dev
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will:
- Acknowledge receipt within 48 hours
- Provide a timeline for fixing the issue
- Credit you in the security advisory (unless you prefer to remain anonymous)
- Notify you when the fix is released

## Additional Resources

- [XSS Prevention Guide](./xss-prevention.md)
- [Content Security Policy Guide](./csp.md)
- [Authentication Patterns](./authentication.md)
- [API Security Guide](./api-security.md)
- [Security Checklist](./checklist.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

## Version History

- **v1.0.0** (2024): Initial security documentation
- Security features continuously updated with framework releases
