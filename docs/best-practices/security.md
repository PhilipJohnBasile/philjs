# Security Best Practices

Protect your PhilJS application and users from security vulnerabilities.

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

### CSRF Tokens

```tsx
// services/api.ts
class ApiClient {
  private csrfToken: string | null = null;

  async getCsrfToken(): Promise<string> {
    if (!this.csrfToken) {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      this.csrfToken = data.token;
    }
    return this.csrfToken;
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    const csrfToken = await this.getCsrfToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify(body)
    });

    return response.json();
  }
}
```

### SameSite Cookies

```tsx
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

### Client-Side Rate Limiting

```tsx
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
    }
  };
}

// Usage
const rateLimiter = createRateLimiter(5, 60000); // 5 requests per minute

async function searchProducts(query: string) {
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  return api.get(`/search?q=${query}`);
}
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
