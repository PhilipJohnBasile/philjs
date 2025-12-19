# API Security Guide

This guide covers security best practices for building and consuming APIs in PhilJS applications, including CSRF protection, rate limiting, input validation, and more.

## Table of Contents

1. [API Security Overview](#api-security-overview)
2. [CSRF Protection](#csrf-protection)
3. [Rate Limiting](#rate-limiting)
4. [Input Validation](#input-validation)
5. [Authentication](#authentication)
6. [Authorization](#authorization)
7. [Data Protection](#data-protection)
8. [Error Handling](#error-handling)

## API Security Overview

Secure APIs are critical for protecting user data and preventing attacks. Key security concerns:

- **Authentication**: Verify who is making the request
- **Authorization**: Verify what they're allowed to do
- **Input Validation**: Prevent injection attacks
- **Rate Limiting**: Prevent abuse and DoS
- **CSRF Protection**: Prevent unauthorized actions
- **Data Protection**: Encrypt sensitive data
- **Error Handling**: Don't leak sensitive information

## CSRF Protection

Cross-Site Request Forgery (CSRF) attacks trick users into performing unwanted actions. PhilJS provides built-in CSRF protection.

### Implementation

```typescript
import { csrfProtection, generateCSRFToken, extractCSRFToken } from 'philjs-ssr';

// Create CSRF middleware
const csrf = csrfProtection({
  getSessionId: (request) => {
    // Extract session ID from cookie or header
    const sessionCookie = request.headers.get('cookie');
    // Parse session ID...
    return sessionId || 'default';
  },
});

// Generate token for forms
export async function handleGetForm(request: Request) {
  const token = csrf.generateToken(request);

  return new Response(
    `
    <form method="POST" action="/api/submit">
      <input type="hidden" name="_csrf" value="${token}">
      <input type="text" name="data">
      <button type="submit">Submit</button>
    </form>
    `,
    { headers: { 'Content-Type': 'text/html' } }
  );
}

// Verify token on POST
export async function handlePost(request: Request) {
  // Verify CSRF token
  if (!csrf.verifyRequest(request)) {
    return new Response('CSRF validation failed', { status: 403 });
  }

  // Process request...
  return Response.json({ success: true });
}
```

### Token in Headers

For SPA applications:

```typescript
// Server: Send token to client
export async function handleGetToken(request: Request) {
  const token = csrf.generateToken(request);
  return Response.json({ csrfToken: token });
}

// Client: Include token in requests
async function makeRequest(url: string, data: any) {
  const response = await fetch('/api/csrf-token');
  const { csrfToken } = await response.json();

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(data),
  });
}
```

### Double Submit Cookie

Alternative CSRF protection:

```typescript
import { createCookie, generateSecureToken } from 'philjs-ssr';

const csrfCookie = createCookie('csrf-token', {
  httpOnly: false, // Must be readable by JavaScript
  secure: true,
  sameSite: 'Strict',
  maxAge: 3600,
});

export async function handleRequest(request: Request) {
  const token = generateSecureToken();

  // Set cookie and return token
  return Response.json({ csrfToken: token }, {
    headers: {
      'Set-Cookie': csrfCookie.serialize(token),
    },
  });
}

// Verify double submit
export async function verifyDoubleSubmit(request: Request) {
  const cookieToken = csrfCookie.parse(request.headers.get('cookie'))?.value;
  const headerToken = request.headers.get('X-CSRF-Token');

  return cookieToken && headerToken && cookieToken === headerToken;
}
```

## Rate Limiting

Protect APIs from abuse with rate limiting:

### Basic Rate Limiting

```typescript
import { RateLimiter } from 'philjs-ssr';

const apiLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
});

export async function handleAPIRequest(request: Request) {
  const clientId = getClientId(request);

  if (!apiLimiter.check(clientId)) {
    return new Response('Too many requests', {
      status: 429,
      headers: {
        'Retry-After': '900', // 15 minutes in seconds
      },
    });
  }

  // Process request...
}

function getClientId(request: Request): string {
  // Use IP address
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';

  // Or use authenticated user ID
  const user = getCurrentUser(request);
  return user ? `user:${user.id}` : `ip:${ip}`;
}
```

### Advanced Rate Limiting

Different limits for different endpoints:

```typescript
const limiters = {
  login: new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5, // Strict limit for login
  }),
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100, // Normal API limit
  }),
  upload: new RateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10, // Very strict for uploads
  }),
};

export function rateLimitMiddleware(
  endpoint: 'login' | 'api' | 'upload'
) {
  return (request: Request) => {
    const clientId = getClientId(request);
    const limiter = limiters[endpoint];

    if (!limiter.check(clientId)) {
      return new Response('Too many requests', { status: 429 });
    }

    return null; // Continue to handler
  };
}
```

### Token Bucket Algorithm

More sophisticated rate limiting:

```typescript
class TokenBucket {
  private tokens: Map<string, { count: number; lastRefill: number }> = new Map();

  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
  ) {}

  consume(key: string, tokens: number = 1): boolean {
    const now = Date.now();
    let bucket = this.tokens.get(key);

    if (!bucket) {
      bucket = { count: this.capacity, lastRefill: now };
      this.tokens.set(key, bucket);
    }

    // Refill tokens based on time passed
    const timePassed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.refillRate);

    if (tokensToAdd > 0) {
      bucket.count = Math.min(this.capacity, bucket.count + tokensToAdd);
      bucket.lastRefill = now;
    }

    // Check if we have enough tokens
    if (bucket.count >= tokens) {
      bucket.count -= tokens;
      return true;
    }

    return false;
  }
}

const bucket = new TokenBucket(100, 10); // 100 capacity, 10 tokens/sec

export function handleRequest(request: Request) {
  const clientId = getClientId(request);

  if (!bucket.consume(clientId)) {
    return new Response('Too many requests', { status: 429 });
  }

  // Process request...
}
```

## Input Validation

Always validate and sanitize input:

### Schema Validation

```typescript
import { z } from 'zod';

// Define schema
const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  age: z.number().int().min(18).max(120).optional(),
});

export async function handleCreateUser(request: Request) {
  let data;

  try {
    const json = await request.json();
    data = UserSchema.parse(json);
  } catch (error) {
    return Response.json({
      error: 'Validation failed',
      details: error.errors,
    }, { status: 400 });
  }

  // Data is validated and typed
  const user = await createUser(data);
  return Response.json(user);
}
```

### Manual Validation

```typescript
import { isValidEmail, escapeHtml, sanitizeUrl } from 'philjs-core';

export function validateInput(data: any): {
  valid: boolean;
  errors: string[];
  sanitized?: any;
} {
  const errors: string[] = [];

  // Validate email
  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Invalid email address');
  }

  // Validate name
  if (!data.name || data.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  // Validate URL
  if (data.website) {
    const validUrl = sanitizeUrl(data.website, ['example.com']);
    if (!validUrl) {
      errors.push('Invalid website URL');
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    sanitized: {
      email: data.email.toLowerCase(),
      name: escapeHtml(data.name),
      website: data.website ? sanitizeUrl(data.website) : null,
    },
  };
}
```

### SQL Injection Prevention

Use parameterized queries:

```typescript
// BAD - SQL Injection vulnerable
const userId = request.params.id;
const query = `SELECT * FROM users WHERE id = ${userId}`;
db.query(query);

// GOOD - Parameterized query
const userId = request.params.id;
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);

// BETTER - ORM
const user = await db.users.findOne({ where: { id: userId } });
```

### NoSQL Injection Prevention

```typescript
// BAD - NoSQL injection vulnerable
const username = request.body.username;
db.collection('users').findOne({ username });

// GOOD - Validate input type
import { z } from 'zod';

const LoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const { username, password } = LoginSchema.parse(request.body);
db.collection('users').findOne({ username });
```

## Authentication

Secure API authentication patterns:

### Bearer Token

```typescript
export async function requireAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Missing authentication', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Bearer realm="API"',
      },
    });
  }

  const token = authHeader.substring(7);
  const user = await verifyToken(token);

  if (!user) {
    return new Response('Invalid token', { status: 401 });
  }

  return user;
}

// Use in handler
export async function handleProtectedAPI(request: Request) {
  const user = await requireAuth(request);
  if (user instanceof Response) {
    return user; // Return error response
  }

  // User is authenticated
  return Response.json({ data: 'protected data' });
}
```

### API Keys

```typescript
const API_KEYS = new Map<string, {
  userId: string;
  permissions: string[];
  rateLimit: number;
}>();

export async function validateAPIKey(request: Request) {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return new Response('API key required', { status: 401 });
  }

  const keyData = API_KEYS.get(apiKey);
  if (!keyData) {
    return new Response('Invalid API key', { status: 401 });
  }

  return keyData;
}

// Generate API key
import { generateSecureToken } from 'philjs-core';

export async function createAPIKey(userId: string, permissions: string[]) {
  const apiKey = generateSecureToken(32);

  API_KEYS.set(apiKey, {
    userId,
    permissions,
    rateLimit: 100,
  });

  return apiKey;
}
```

## Authorization

Control what authenticated users can access:

### Role-Based Access Control (RBAC)

```typescript
enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin',
}

const rolePermissions: Record<string, Permission[]> = {
  user: [Permission.READ],
  editor: [Permission.READ, Permission.WRITE],
  admin: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN],
};

export function hasPermission(
  userRole: string,
  required: Permission
): boolean {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(required);
}

export function requirePermission(permission: Permission) {
  return async (request: Request) => {
    const user = await getCurrentUser(request);

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!hasPermission(user.role, permission)) {
      return new Response('Forbidden', { status: 403 });
    }

    return null; // Continue
  };
}

// Use in handler
export async function handleDeleteUser(request: Request) {
  const authCheck = await requirePermission(Permission.DELETE)(request);
  if (authCheck) return authCheck;

  // User has delete permission
  // ... delete logic
}
```

### Attribute-Based Access Control (ABAC)

```typescript
type AccessPolicy = {
  resource: string;
  action: string;
  condition: (context: AccessContext) => boolean;
};

type AccessContext = {
  user: User;
  resource: any;
  environment: {
    time: Date;
    ip: string;
  };
};

const policies: AccessPolicy[] = [
  {
    resource: 'document',
    action: 'read',
    condition: (ctx) => {
      // Owner can always read
      if (ctx.resource.ownerId === ctx.user.id) return true;

      // Public documents can be read by anyone
      if (ctx.resource.visibility === 'public') return true;

      // Collaborators can read
      return ctx.resource.collaborators.includes(ctx.user.id);
    },
  },
  {
    resource: 'document',
    action: 'write',
    condition: (ctx) => {
      // Only owner and collaborators can write
      return ctx.resource.ownerId === ctx.user.id ||
             ctx.resource.collaborators.includes(ctx.user.id);
    },
  },
];

export function checkAccess(
  resource: string,
  action: string,
  context: AccessContext
): boolean {
  const policy = policies.find(
    p => p.resource === resource && p.action === action
  );

  if (!policy) {
    return false; // Default deny
  }

  return policy.condition(context);
}
```

## Data Protection

### Encrypt Sensitive Data

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];

  const decipher = createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Use in API
export async function handleSaveSecret(request: Request) {
  const { secret } = await request.json();

  const encrypted = encrypt(secret);

  await db.secrets.create({
    userId: user.id,
    value: encrypted,
  });

  return Response.json({ success: true });
}
```

### Hash Sensitive Data

```typescript
import { createHash } from 'crypto';

export function hashData(data: string): string {
  return createHash('sha256')
    .update(data)
    .digest('hex');
}

// For credit cards, SSN, etc.
export async function storePaymentMethod(cardNumber: string) {
  const hash = hashData(cardNumber);
  const last4 = cardNumber.slice(-4);

  await db.paymentMethods.create({
    hash,
    last4,
    // Don't store full card number
  });
}
```

## Error Handling

Don't leak sensitive information in errors:

### Secure Error Responses

```typescript
export function handleError(error: unknown): Response {
  console.error('API Error:', error);

  // Don't expose internal errors to clients
  if (process.env.NODE_ENV === 'production') {
    return Response.json({
      error: 'Internal server error',
    }, { status: 500 });
  }

  // In development, provide more details
  return Response.json({
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  }, { status: 500 });
}

// Use in handler
export async function handleAPIRequest(request: Request) {
  try {
    // ... API logic
    return Response.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
```

### Error Logging

```typescript
type SecurityEvent = {
  type: 'error' | 'warning' | 'info';
  message: string;
  userId?: string;
  ip: string;
  endpoint: string;
  timestamp: Date;
};

export async function logSecurityEvent(event: SecurityEvent) {
  // Log to your monitoring service
  console.log('[SECURITY]', event);

  // Store in database for analysis
  await db.securityLogs.create(event);

  // Alert on critical events
  if (event.type === 'error') {
    await sendAlert(event);
  }
}

// Use in API
export async function handleRequest(request: Request) {
  try {
    // ... handle request
  } catch (error) {
    await logSecurityEvent({
      type: 'error',
      message: error.message,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      endpoint: new URL(request.url).pathname,
      timestamp: new Date(),
    });

    throw error;
  }
}
```

## Security Headers

Always set security headers:

```typescript
export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // CSP
  const csp = buildCSP({
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
    },
  });
  headers.set(csp.header, csp.value);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Apply to all responses
export async function handleRequest(request: Request) {
  const response = await routeHandler(request);
  return addSecurityHeaders(response);
}
```

## API Security Checklist

- [ ] Implement CSRF protection for state-changing operations
- [ ] Use rate limiting on all endpoints
- [ ] Validate all input with schemas
- [ ] Use parameterized queries to prevent injection
- [ ] Require authentication for protected endpoints
- [ ] Implement proper authorization checks
- [ ] Encrypt sensitive data at rest
- [ ] Use HTTPS for all API communication
- [ ] Set security headers on all responses
- [ ] Don't expose sensitive data in error messages
- [ ] Log security events
- [ ] Implement request timeout
- [ ] Validate content-type headers
- [ ] Use API versioning
- [ ] Implement request signing for sensitive operations
- [ ] Use CORS properly
- [ ] Implement audit logging
- [ ] Regularly review API permissions
- [ ] Monitor for unusual activity
- [ ] Keep dependencies updated

## Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [OWASP REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [Authentication Patterns](./authentication.md)
- [CSRF Protection](./overview.md#csrf-protection)
- [Security Overview](./overview.md)
