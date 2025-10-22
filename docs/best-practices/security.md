# Security Best Practices

Protect your PhilJS application and users from security vulnerabilities.

> ⚠️ PhilJS currently ships low-level routing utilities (see [`/docs/api-reference/router.md`](../api-reference/router.md)). Any high-level router helpers referenced here—for example `Navigate` in guard examples—are part of the planned ergonomic API and are shown for conceptual guidance.

## XSS Prevention

### Cross-Site Scripting (XSS)

PhilJS automatically escapes content in JSX, but be aware of edge cases.

```tsx
// ✅ Safe - automatically escaped
function UserProfile({ user }: { user: User }) {
  return (
    <div>
      <h1>{user.name}</h1>  {/* Escaped */}
      <p>{user.bio}</p>      {/* Escaped */}
    </div>
  );
}

// ❌ DANGEROUS - using dangerouslySetInnerHTML
function DangerousComponent({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// ✅ Safe - sanitize HTML first
import DOMPurify from 'dompurify';

function SafeHTML({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### Sanitizing User Input

```tsx
function CommentForm() {
  const comment = signal('');

  const handleSubmit = async () => {
    // ✅ Validate and sanitize on server
    await api.post('/comments', {
      content: comment() // Server validates this
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={comment()}
        onInput={(e) => comment.set(e.currentTarget.value)}
      />
      <button type="submit">Post Comment</button>
    </form>
  );
}
```

### Avoid eval() and Function()

```tsx
// ❌ DANGEROUS - arbitrary code execution
const userCode = getUserInput();
eval(userCode);

// ❌ DANGEROUS - similar to eval
new Function(userCode)();

// ✅ Safe - use JSON.parse for data
const userData = JSON.parse(userInput);
```

## CSRF Protection

PhilJS includes built-in CSRF (Cross-Site Request Forgery) protection for server-side actions and API routes.

### Built-in CSRF Protection

```typescript
import { csrfProtection, generateCSRFToken, csrfField } from 'philjs-ssr';

// Set up CSRF middleware
const csrf = csrfProtection({
  getSessionId: (request) => {
    // Get session ID from cookie or header
    return request.headers.get('x-session-id') || 'default';
  },
  skip: (request) => {
    // Skip CSRF for certain routes (e.g., webhooks)
    return request.url.includes('/webhooks/');
  }
});

// Generate token for a request
const token = csrf.generateToken(request);

// Verify request
const isValid = csrf.verifyRequest(request);
if (!isValid) {
  return new Response('CSRF verification failed', { status: 403 });
}
```

### Form Protection

```typescript
import { csrfField } from 'philjs-ssr';

// Server-side: Generate token and include in form
export async function GET({ request }: { request: Request }) {
  const csrf = csrfProtection({ getSessionId: getSession });
  const csrfToken = csrf.generateToken(request);

  return new Response(`
    <!DOCTYPE html>
    <html>
      <body>
        <form method="POST" action="/submit">
          ${csrfField(csrfToken)}
          <input type="text" name="data" />
          <button type="submit">Submit</button>
        </form>
      </body>
    </html>
  `);
}

// Server-side: Verify on POST
export async function POST({ request }: { request: Request }) {
  const csrf = csrfProtection({ getSessionId: getSession });

  if (!csrf.verifyRequest(request)) {
    return new Response('CSRF verification failed', { status: 403 });
  }

  // Process form submission
  const formData = await request.formData();
  // ...
}
```

### AJAX Request Protection

```typescript
// Client-side: Fetch CSRF token
async function submitForm(data: any) {
  // Get CSRF token from meta tag or API
  const csrfToken = document.querySelector('meta[name="csrf-token"]')
    ?.getAttribute('content');

  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken || ''
    },
    body: JSON.stringify(data)
  });

  return response.json();
}
```

### PhilJS Component Integration

```tsx
import { signal } from 'philjs-core';
import { csrfProtection } from 'philjs-ssr';

function SecureForm() {
  const formData = signal({ name: '', email: '' });
  const csrfToken = signal('');

  // Load CSRF token on mount
  effect(async () => {
    const response = await fetch('/api/csrf-token');
    const data = await response.json();
    csrfToken.set(data.token);
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    await fetch('/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken()
      },
      body: JSON.stringify(formData())
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="_csrf" value={csrfToken()} />
      <input
        type="text"
        value={formData().name}
        onInput={(e) => formData.set({ ...formData(), name: e.target.value })}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Custom Token Storage

PhilJS uses an in-memory token store by default. For production, use Redis:

```typescript
import { csrfProtection, csrfStore } from 'philjs-ssr';
import Redis from 'ioredis';

const redis = new Redis();

// Replace default store with Redis
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

// Use custom store
const customStore = new RedisCSRFStore();
```

### Extract CSRF Token

```typescript
import { extractCSRFToken } from 'philjs-ssr';

export async function POST({ request }: { request: Request }) {
  const token = await extractCSRFToken(request);

  if (!token) {
    return new Response('Missing CSRF token', { status: 400 });
  }

  // Verify token...
}
```

### SameSite Cookies

In addition to CSRF tokens, use SameSite cookies:

```typescript
// Server-side (example)
res.cookie('session', sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
});
```

## Authentication

### Secure Token Storage

```tsx
// ❌ INSECURE - localStorage accessible to XSS
localStorage.setItem('token', authToken);

// ✅ Better - httpOnly cookies (set by server)
// Server sets: Set-Cookie: token=xxx; HttpOnly; Secure; SameSite=Strict

// ✅ If you must use localStorage, validate carefully
class TokenStorage {
  private readonly KEY = 'auth_token';

  setToken(token: string) {
    // Validate token format
    if (!this.isValidToken(token)) {
      throw new Error('Invalid token format');
    }
    localStorage.setItem(this.KEY, token);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.KEY);
    return token && this.isValidToken(token) ? token : null;
  }

  clearToken() {
    localStorage.removeItem(this.KEY);
  }

  private isValidToken(token: string): boolean {
    // Validate JWT format: header.payload.signature
    return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(token);
  }
}

export const tokenStorage = new TokenStorage();
```

### Password Handling

```tsx
// ✅ NEVER store passwords in state longer than necessary
function LoginForm() {
  const email = signal('');
  const password = signal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    try {
      await authService.login(email(), password());

      // ✅ Clear password immediately after use
      password.set('');
    } catch (err) {
      // Handle error
      password.set(''); // Clear even on error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email()}
        onInput={(e) => email.set(e.currentTarget.value)}
      />

      <input
        type="password"
        value={password()}
        onInput={(e) => password.set(e.currentTarget.value)}
        autocomplete="current-password"
      />

      <button type="submit">Login</button>
    </form>
  );
}

// ❌ NEVER log passwords
console.log('Password:', password()); // DON'T DO THIS

// ❌ NEVER send passwords in URL
fetch(`/login?password=${password()}`); // DON'T DO THIS
```

### Session Management

```tsx
// stores/authStore.ts
function createAuthStore() {
  const user = signal<User | null>(null);
  const sessionExpiry = signal<number | null>(null);

  // Check session expiry
  effect(() => {
    if (!sessionExpiry()) return;

    const checkExpiry = setInterval(() => {
      if (Date.now() > sessionExpiry()!) {
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkExpiry);
  });

  const login = async (credentials: Credentials) => {
    const response = await authService.login(credentials);

    user.set(response.user);
    sessionExpiry.set(Date.now() + response.expiresIn);
  };

  const logout = () => {
    user.set(null);
    sessionExpiry.set(null);
    tokenStorage.clearToken();

    // Redirect to login
    window.location.href = '/login';
  };

  const refreshSession = async () => {
    const response = await authService.refresh();
    sessionExpiry.set(Date.now() + response.expiresIn);
  };

  return { user, login, logout, refreshSession };
}
```

## Authorization

### Role-Based Access Control

```tsx
// types/auth.ts
export type Role = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

// hooks/usePermissions.ts
import { userStore } from '@/stores/userStore';

export function usePermissions() {
  const { user } = userStore;

  const hasRole = (role: Role): boolean => {
    return user()?.role === role;
  };

  const canEdit = (): boolean => {
    const role = user()?.role;
    return role === 'admin' || role === 'editor';
  };

  const canDelete = (): boolean => {
    return user()?.role === 'admin';
  };

  return {
    hasRole,
    canEdit,
    canDelete
  };
}

// Usage in components
function DocumentActions({ document }: { document: Document }) {
  const { canEdit, canDelete } = usePermissions();

  return (
    <div>
      {canEdit() && (
        <button onClick={() => editDocument(document)}>Edit</button>
      )}

      {canDelete() && (
        <button onClick={() => deleteDocument(document)}>Delete</button>
      )}
    </div>
  );
}
```

### Route Guards

```tsx
// components/ProtectedRoute.tsx
import { Navigate } from 'philjs-router';
import { userStore } from '@/stores/userStore';

interface ProtectedRouteProps {
  component: () => JSX.Element;
  requiredRole?: Role;
}

export function ProtectedRoute({
  component: Component,
  requiredRole
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = userStore;

  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user()?.role !== requiredRole) {
    return <Navigate to="/forbidden" />;
  }

  return <Component />;
}

// Usage
<Route
  path="/admin"
  component={() => (
    <ProtectedRoute component={AdminDashboard} requiredRole="admin" />
  )}
/>
```

## Input Validation

### Client-Side Validation

```tsx
// utils/validation.ts
export const validators = {
  email(value: string): string | null {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Invalid email format';
    }
    return null;
  },

  password(value: string): string | null {
    if (!value) return 'Password is required';
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(value)) {
      return 'Password must contain uppercase letter';
    }
    if (!/[a-z]/.test(value)) {
      return 'Password must contain lowercase letter';
    }
    if (!/[0-9]/.test(value)) {
      return 'Password must contain number';
    }
    return null;
  },

  url(value: string): string | null {
    try {
      new URL(value);
      return null;
    } catch {
      return 'Invalid URL';
    }
  },

  maxLength(value: string, max: number): string | null {
    if (value.length > max) {
      return `Must be ${max} characters or less`;
    }
    return null;
  }
};
```

### Server-Side Validation

```tsx
// ✅ ALWAYS validate on server
// Client validation is for UX, server validation is for security

// services/userService.ts
export const userService = {
  async createUser(data: CreateUserDTO) {
    // Client does basic validation
    // Server does complete validation

    const response = await api.post('/users', data);

    // Server may return validation errors
    if (response.errors) {
      throw new ValidationError(response.errors);
    }

    return response.data;
  }
};
```

## SQL Injection Prevention

### Parameterized Queries

```tsx
// ❌ VULNERABLE - string concatenation
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ SAFE - parameterized query (server-side)
const query = 'SELECT * FROM users WHERE email = ?';
db.query(query, [email]);

// ✅ SAFE - ORM (server-side)
const user = await User.findOne({ where: { email } });
```

## Secrets Management

### Environment Variables

```tsx
// ✅ Use environment variables for secrets
const API_KEY = import.meta.env.VITE_API_KEY;

// ❌ NEVER commit secrets to code
const API_KEY = 'sk_live_abc123...'; // DON'T DO THIS

// .env (NOT in git)
VITE_API_KEY=sk_live_abc123...

// .env.example (in git)
VITE_API_KEY=your_api_key_here
```

### Client vs Server Secrets

```tsx
// ✅ Public keys (OK for client)
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// ❌ NEVER put secret keys in client
const STRIPE_SECRET_KEY = import.meta.env.VITE_STRIPE_SECRET_KEY; // DON'T

// ✅ Server-only secrets
// Keep in server environment, never send to client
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY; // Server only
```

## Content Security Policy

### CSP Headers

```tsx
// Server-side CSP configuration
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://trusted-cdn.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://api.example.com",
  "frame-ancestors 'none'"
].join('; ');

// Set in response headers
res.setHeader('Content-Security-Policy', cspHeader);
```

## Rate Limiting

PhilJS provides comprehensive rate limiting for API routes, protecting against abuse and DDoS attacks.

### Built-in Rate Limiting

```typescript
import {
  rateLimit,
  apiRateLimit,
  authRateLimit,
  MemoryRateLimitStore
} from 'philjs-ssr';

// Basic rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute window
  maxRequests: 100,         // 100 requests per window
  message: 'Too many requests'
});

// Use as middleware
app.use(async (request, next) => {
  const rateLimitResponse = await limiter(request, next);
  if (rateLimitResponse) {
    return rateLimitResponse; // 429 Too Many Requests
  }
  return next();
});
```

### Pre-configured Rate Limiters

```typescript
// API routes: 60 requests per minute
const apiLimiter = apiRateLimit(60);

// Authentication routes: 5 attempts per minute
const authLimiter = authRateLimit(5);

// API key-based: 1000 requests per minute
const apiKeyLimiter = apiKeyRateLimit(1000);

// User-based: Custom user ID extractor
const userLimiter = userRateLimit(
  100,
  (request) => request.headers.get('x-user-id')
);
```

### Custom Key Generation

```typescript
const customLimiter = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 50,
  keyGenerator: (request) => {
    // Rate limit by API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey) {
      return `api:${apiKey}`;
    }

    // Fallback to IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    return `ip:${ip}`;
  }
});
```

### Redis Store for Production

```typescript
import { RedisRateLimitStore } from 'philjs-ssr';
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379
});

const store = new RedisRateLimitStore(redis, 'philjs:ratelimit:');

const limiter = rateLimit(
  {
    windowMs: 60 * 1000,
    maxRequests: 100
  },
  store
);
```

### Sliding Window Rate Limiting

PhilJS includes a more accurate sliding window algorithm:

```typescript
import { SlidingWindowRateLimiter } from 'philjs-ssr';

const limiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  message: 'Rate limit exceeded'
});

// Check rate limit
const rateLimitResponse = await limiter.check(request);
if (rateLimitResponse) {
  return rateLimitResponse; // 429 if exceeded
}
```

### Adaptive Rate Limiting

Automatically adjust limits based on error rates:

```typescript
import { AdaptiveRateLimiter } from 'philjs-ssr';

const limiter = new AdaptiveRateLimiter({
  baseLimit: 100,
  windowMs: 60 * 1000,
  errorThreshold: 0.1,      // 10% error rate triggers reduction
  adaptationFactor: 0.5     // Reduce by 50% when errors high
});

// Use in request handler
const rateLimitResponse = await limiter.check(request);
if (rateLimitResponse) return rateLimitResponse;

// Record result for adaptation
const success = response.status < 400;
await limiter.recordResult(success);
```

### Rate Limit Headers

PhilJS automatically adds standard rate limit headers:

```typescript
// Response headers
X-RateLimit-Limit: 100          // Max requests per window
X-RateLimit-Remaining: 95       // Remaining requests
X-RateLimit-Reset: 2024-01-01T12:00:00Z  // When limit resets
```

### Skip Successful/Failed Requests

```typescript
// Don't count successful login attempts
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 5,
  skipSuccessfulRequests: true  // Only count failed logins
});

// Don't count failed requests
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 10,
  skipFailedRequests: true      // Only count successful uploads
});
```

### Custom Error Handling

```typescript
const limiter = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 100,
  handler: (request) => {
    // Custom 429 response
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: 60,
        message: 'Please slow down your requests'
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      }
    );
  }
});
```

### Per-Route Rate Limiting

```typescript
// Different limits for different routes
app.get('/api/search', apiRateLimit(30), searchHandler);
app.post('/api/login', authRateLimit(5), loginHandler);
app.post('/api/upload', uploadRateLimit(10), uploadHandler);
```

### Client-Side Rate Limiting

For client-side protection:

```typescript
function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests: number[] = [];

  return {
    canMakeRequest(): boolean {
      const now = Date.now();

      // Remove old requests outside window
      while (requests.length > 0 && requests[0] < now - windowMs) {
        requests.shift();
      }

      if (requests.length >= maxRequests) {
        return false;
      }

      requests.push(now);
      return true;
    },

    getRemainingRequests(): number {
      return Math.max(0, maxRequests - requests.length);
    },

    getResetTime(): number {
      return requests[0] + windowMs;
    }
  };
}

// Usage in component
function SearchForm() {
  const rateLimiter = createRateLimiter(5, 60000); // 5/min
  const query = signal('');

  const search = async () => {
    if (!rateLimiter.canMakeRequest()) {
      const resetTime = rateLimiter.getResetTime();
      const waitSeconds = Math.ceil((resetTime - Date.now()) / 1000);

      alert(`Rate limit exceeded. Try again in ${waitSeconds} seconds.`);
      return;
    }

    const results = await api.get(`/search?q=${query()}`);
    // ...
  };

  return (
    <div>
      <input value={query()} onInput={(e) => query.set(e.target.value)} />
      <button onClick={search}>
        Search ({rateLimiter.getRemainingRequests()} remaining)
      </button>
    </div>
  );
}
```

### Monitor Rate Limit Usage

```typescript
// Get rate limit info
const info = await limiter.getRateLimitInfo(request);

console.log(`Limit: ${info.limit}`);
console.log(`Remaining: ${info.remaining}`);
console.log(`Resets at: ${new Date(info.reset)}`);

// Show in UI
function RateLimitStatus() {
  const info = signal<RateLimitInfo | null>(null);

  effect(async () => {
    const response = await fetch('/api/rate-limit-status');
    info.set(await response.json());
  });

  return info() ? (
    <div class="rate-limit-status">
      Requests: {info().remaining}/{info().limit}
      <progress value={info().remaining} max={info().limit} />
    </div>
  ) : null;
}
```

### Best Practices

```typescript
// ✅ Use different limits for different routes
app.post('/api/auth/login', authRateLimit(5));      // Strict
app.get('/api/products', apiRateLimit(100));        // Generous
app.post('/api/upload', uploadRateLimit(10));       // Moderate

// ✅ Use Redis in production (distributed)
const redisStore = new RedisRateLimitStore(redis);
const limiter = rateLimit(config, redisStore);

// ✅ Whitelist trusted IPs
const limiter = rateLimit({
  windowMs: 60000,
  maxRequests: 100,
  keyGenerator: (request) => {
    const ip = request.headers.get('x-forwarded-for');
    const trustedIPs = ['10.0.0.1', '192.168.1.1'];

    if (trustedIPs.includes(ip)) {
      return 'trusted'; // Higher or no limit
    }

    return `ip:${ip}`;
  }
});

// ✅ Log rate limit violations
const limiter = rateLimit({
  windowMs: 60000,
  maxRequests: 100,
  handler: (request) => {
    const ip = request.headers.get('x-forwarded-for');
    console.warn(`Rate limit exceeded for IP: ${ip}`);

    // Alert if too many violations
    violations++;
    if (violations > 100) {
      alertSecurity(`High rate limit violations: ${violations}`);
    }

    return new Response('Too many requests', { status: 429 });
  }
});
```

## Dependency Security

### Regular Updates

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

### Secure Dependencies

```json
// package.json
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix"
  }
}
```

## Security Headers

### Essential Headers

```tsx
// Server-side security headers
res.setHeader('X-Content-Type-Options', 'nosniff');
res.setHeader('X-Frame-Options', 'DENY');
res.setHeader('X-XSS-Protection', '1; mode=block');
res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
res.setHeader('Permissions-Policy', 'geolocation=(), microphone=()');

// HTTPS only
res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
```

## File Upload Security

### Validate File Uploads

```tsx
function FileUpload() {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

  const handleFileUpload = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // ✅ Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    // ✅ Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, and GIF allowed.');
      return;
    }

    // ✅ Validate file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      alert('Invalid file extension.');
      return;
    }

    // Upload to server
    const formData = new FormData();
    formData.append('file', file);

    await api.post('/upload', formData);
  };

  return (
    <input
      type="file"
      accept={ALLOWED_TYPES.join(',')}
      onChange={handleFileUpload}
    />
  );
}
```

## Summary

**Security Best Practices:**

✅ Sanitize all user input
✅ Use CSRF tokens for state-changing requests
✅ Store tokens securely (httpOnly cookies preferred)
✅ Validate on both client and server
✅ Use parameterized queries
✅ Never commit secrets to code
✅ Implement role-based access control
✅ Use security headers
✅ Rate limit requests
✅ Keep dependencies updated
✅ Validate file uploads
✅ Use HTTPS in production
✅ Implement Content Security Policy

**Next:** [Accessibility →](./accessibility.md)
