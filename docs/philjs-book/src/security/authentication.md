# Authentication Patterns

This guide covers secure authentication patterns for PhilJS applications, including session management, JWT tokens, OAuth integration, and best practices.

## Table of Contents

1. [Authentication Overview](#authentication-overview)
2. [Session-Based Authentication](#session-based-authentication)
3. [Token-Based Authentication](#token-based-authentication)
4. [OAuth and Social Login](#oauth-and-social-login)
5. [Password Security](#password-security)
6. [Multi-Factor Authentication](#multi-factor-authentication)
7. [Best Practices](#best-practices)

## Authentication Overview

PhilJS doesn't include built-in authentication, giving you flexibility to choose the right approach for your application. This guide shows secure patterns for common authentication methods.

### Choosing an Authentication Strategy

| Strategy | Best For | Pros | Cons |
|----------|----------|------|------|
| Session-based | Traditional web apps | Simple, stateful | Scalability challenges |
| JWT | APIs, microservices | Stateless, scalable | Token size, revocation |
| OAuth | Third-party login | No password management | Dependency on provider |
| Hybrid | Complex applications | Flexibility | More complexity |

## Session-Based Authentication

### Implementation

```typescript
import { createCookie } from '@philjs/ssr';
import { generateSecureToken } from '@philjs/core';

// Session storage (use Redis in production)
const sessions = new Map<string, {
  userId: string;
  expires: number;
  data: Record<string, any>;
}>();

// Create secure session cookie
const sessionCookie = createCookie('session', {
  httpOnly: true,
  secure: true,
  sameSite: 'Lax',
  maxAge: 3600, // 1 hour
  secrets: [process.env.COOKIE_SECRET!],
});

// Login handler
export async function handleLogin(request: Request) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validate credentials
  const user = await validateCredentials(email, password);
  if (!user) {
    return new Response('Invalid credentials', { status: 401 });
  }

  // Create session
  const sessionId = generateSecureToken();
  sessions.set(sessionId, {
    userId: user.id,
    expires: Date.now() + 3600000, // 1 hour
    data: {},
  });

  // Set cookie
  const cookie = sessionCookie.serialize(sessionId);

  return new Response('Login successful', {
    status: 302,
    headers: {
      'Location': '/dashboard',
      'Set-Cookie': cookie,
    },
  });
}

// Logout handler
export async function handleLogout(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const parsed = sessionCookie.parse(cookieHeader);

  if (parsed) {
    sessions.delete(parsed.value);
  }

  return new Response('Logged out', {
    status: 302,
    headers: {
      'Location': '/',
      'Set-Cookie': sessionCookie.destroy(),
    },
  });
}

// Middleware to get current user
export function getCurrentUser(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const parsed = sessionCookie.parse(cookieHeader);

  if (!parsed) {
    return null;
  }

  const session = sessions.get(parsed.value);
  if (!session || session.expires < Date.now()) {
    sessions.delete(parsed.value);
    return null;
  }

  return { userId: session.userId };
}
```

### Session Storage

**Development** (in-memory):
```typescript
const sessions = new Map();
```

**Production** (Redis):
```typescript
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL,
});

await redis.connect();

async function createSession(userId: string) {
  const sessionId = generateSecureToken();
  await redis.setEx(
    `session:${sessionId}`,
    3600, // TTL in seconds
    JSON.stringify({ userId })
  );
  return sessionId;
}

async function getSession(sessionId: string) {
  const data = await redis.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

async function deleteSession(sessionId: string) {
  await redis.del(`session:${sessionId}`);
}
```

## Token-Based Authentication

### JWT Implementation

```typescript
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

// Generate JWT
export async function generateToken(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(JWT_SECRET);

  return token;
}

// Verify JWT
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string };
  } catch {
    return null;
  }
}

// Login handler with JWT
export async function handleLogin(request: Request) {
  const { email, password } = await request.json();

  const user = await validateCredentials(email, password);
  if (!user) {
    return new Response('Invalid credentials', { status: 401 });
  }

  const token = await generateToken(user.id);

  return Response.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
}

// Protected route middleware
export async function requireAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return new Response('Invalid token', { status: 401 });
  }

  return payload;
}
```

### Refresh Tokens

```typescript
import { generateSecureToken } from '@philjs/core';

const refreshTokens = new Map<string, {
  userId: string;
  expires: number;
}>();

// Generate token pair
export async function generateTokenPair(userId: string) {
  const accessToken = await generateToken(userId);
  const refreshToken = generateSecureToken();

  refreshTokens.set(refreshToken, {
    userId,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return { accessToken, refreshToken };
}

// Refresh access token
export async function handleRefresh(request: Request) {
  const { refreshToken } = await request.json();

  const tokenData = refreshTokens.get(refreshToken);
  if (!tokenData || tokenData.expires < Date.now()) {
    refreshTokens.delete(refreshToken);
    return new Response('Invalid refresh token', { status: 401 });
  }

  // Generate new access token
  const accessToken = await generateToken(tokenData.userId);

  return Response.json({ accessToken });
}
```

## OAuth and Social Login

### OAuth 2.0 Flow

```typescript
import { generateSecureToken } from '@philjs/core';

const OAUTH_CONFIG = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
  },
};

// Store state tokens
const oauthStates = new Map<string, {
  provider: string;
  expires: number;
}>();

// Initiate OAuth flow
export function handleOAuthLogin(provider: 'google' | 'github') {
  const config = OAUTH_CONFIG[provider];
  const state = generateSecureToken();

  oauthStates.set(state, {
    provider,
    expires: Date.now() + 600000, // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${process.env.APP_URL}/auth/callback/${provider}`,
    response_type: 'code',
    scope: provider === 'google' ? 'email profile' : 'user:email',
    state,
  });

  const authUrl = `${config.authUrl}?${params}`;

  return Response.redirect(authUrl);
}

// OAuth callback handler
export async function handleOAuthCallback(
  provider: 'google' | 'github',
  request: Request
) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // Validate state
  const stateData = oauthStates.get(state!);
  if (!stateData || stateData.expires < Date.now()) {
    return new Response('Invalid state', { status: 400 });
  }
  oauthStates.delete(state!);

  const config = OAUTH_CONFIG[provider];

  // Exchange code for token
  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code!,
      redirect_uri: `${process.env.APP_URL}/auth/callback/${provider}`,
      grant_type: 'authorization_code',
    }),
  });

  const { access_token } = await tokenResponse.json();

  // Get user info
  const userResponse = await fetch(config.userInfoUrl, {
    headers: {
      'Authorization': `Bearer ${access_token}`,
    },
  });

  const userData = await userResponse.json();

  // Create or update user
  const user = await findOrCreateUser({
    email: userData.email,
    name: userData.name || userData.login,
    provider,
    providerId: userData.id,
  });

  // Create session
  const sessionId = generateSecureToken();
  sessions.set(sessionId, {
    userId: user.id,
    expires: Date.now() + 3600000,
    data: {},
  });

  const cookie = sessionCookie.serialize(sessionId);

  return new Response('Login successful', {
    status: 302,
    headers: {
      'Location': '/dashboard',
      'Set-Cookie': cookie,
    },
  });
}
```

## Password Security

### Password Hashing

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Validate password strength
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain numbers');
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain special characters');
  }

  // Check against common passwords
  const commonPasswords = ['password', '12345678', 'qwerty'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### User Registration

```typescript
export async function handleRegister(request: Request) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validate email
  if (!isValidEmail(email)) {
    return new Response('Invalid email', { status: 400 });
  }

  // Validate password strength
  const passwordCheck = validatePasswordStrength(password);
  if (!passwordCheck.valid) {
    return Response.json({
      errors: passwordCheck.errors,
    }, { status: 400 });
  }

  // Check if user exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return new Response('Email already registered', { status: 409 });
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await createUser({
    email,
    password: hashedPassword,
  });

  // Send verification email
  await sendVerificationEmail(user.email, user.verificationToken);

  return Response.json({
    message: 'Registration successful. Please check your email.',
  });
}
```

### Password Reset

```typescript
export async function handlePasswordResetRequest(request: Request) {
  const { email } = await request.json();

  const user = await findUserByEmail(email);
  if (!user) {
    // Don't reveal if email exists
    return Response.json({
      message: 'If the email exists, a reset link has been sent.',
    });
  }

  // Generate reset token
  const resetToken = generateSecureToken();
  const resetExpires = Date.now() + 3600000; // 1 hour

  await updateUser(user.id, {
    resetToken,
    resetExpires,
  });

  // Send reset email
  await sendPasswordResetEmail(user.email, resetToken);

  return Response.json({
    message: 'If the email exists, a reset link has been sent.',
  });
}

export async function handlePasswordReset(request: Request) {
  const { token, newPassword } = await request.json();

  const user = await findUserByResetToken(token);
  if (!user || user.resetExpires! < Date.now()) {
    return new Response('Invalid or expired token', { status: 400 });
  }

  // Validate new password
  const passwordCheck = validatePasswordStrength(newPassword);
  if (!passwordCheck.valid) {
    return Response.json({
      errors: passwordCheck.errors,
    }, { status: 400 });
  }

  // Hash and update password
  const hashedPassword = await hashPassword(newPassword);
  await updateUser(user.id, {
    password: hashedPassword,
    resetToken: null,
    resetExpires: null,
  });

  return Response.json({
    message: 'Password reset successful',
  });
}
```

## Multi-Factor Authentication

### TOTP (Time-Based One-Time Password)

```typescript
import * as OTPAuth from 'otpauth';
import { generateSecureToken } from '@philjs/core';

// Generate TOTP secret
export function generateTOTPSecret(email: string) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: 'MyApp',
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  return {
    secret: secret.base32,
    uri: totp.toString(),
  };
}

// Verify TOTP code
export function verifyTOTP(secret: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    digits: 6,
    period: 30,
  });

  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

// Enable 2FA
export async function handleEnable2FA(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { secret, uri } = generateTOTPSecret(user.email);

  // Save secret (encrypted)
  await updateUser(user.id, {
    totpSecret: secret,
    twoFactorEnabled: false, // Not enabled until verified
  });

  return Response.json({
    secret,
    qrCodeUri: uri,
  });
}

// Verify and activate 2FA
export async function handleVerify2FA(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { token } = await request.json();

  const userData = await findUserById(user.userId);
  if (!userData?.totpSecret) {
    return new Response('2FA not set up', { status: 400 });
  }

  if (!verifyTOTP(userData.totpSecret, token)) {
    return new Response('Invalid code', { status: 400 });
  }

  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () =>
    generateSecureToken(8).toUpperCase()
  );

  await updateUser(user.userId, {
    twoFactorEnabled: true,
    backupCodes: await Promise.all(
      backupCodes.map(code => hashPassword(code))
    ),
  });

  return Response.json({
    message: '2FA enabled successfully',
    backupCodes,
  });
}

// Login with 2FA
export async function handleLoginWith2FA(request: Request) {
  const { email, password, totpToken } = await request.json();

  const user = await validateCredentials(email, password);
  if (!user) {
    return new Response('Invalid credentials', { status: 401 });
  }

  if (user.twoFactorEnabled) {
    if (!totpToken) {
      return Response.json({
        requiresTOTP: true,
      }, { status: 403 });
    }

    const isValid = verifyTOTP(user.totpSecret!, totpToken);
    if (!isValid) {
      // Try backup codes
      const backupCodeValid = await verifyBackupCode(user, totpToken);
      if (!backupCodeValid) {
        return new Response('Invalid 2FA code', { status: 401 });
      }
    }
  }

  // Create session
  const sessionId = generateSecureToken();
  sessions.set(sessionId, {
    userId: user.id,
    expires: Date.now() + 3600000,
    data: {},
  });

  const cookie = sessionCookie.serialize(sessionId);

  return Response.json({
    message: 'Login successful',
  }, {
    headers: {
      'Set-Cookie': cookie,
    },
  });
}
```

## Best Practices

### 1. Use HTTPS Everywhere

```typescript
// Redirect HTTP to HTTPS
export function httpsRedirect(request: Request) {
  const url = new URL(request.url);
  if (url.protocol === 'http:' && process.env.NODE_ENV === 'production') {
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }
}
```

### 2. Implement Rate Limiting

```typescript
import { RateLimiter } from '@philjs/ssr';

const loginLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts
});

export async function handleLogin(request: Request) {
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

  if (!loginLimiter.check(clientIp)) {
    return new Response('Too many login attempts', { status: 429 });
  }

  // ... rest of login logic
}
```

### 3. Secure Cookie Settings

```typescript
const sessionCookie = createCookie('session', {
  httpOnly: true,        // Prevent JavaScript access
  secure: true,          // HTTPS only
  sameSite: 'Strict',    // CSRF protection
  maxAge: 3600,          // 1 hour
  secrets: [process.env.COOKIE_SECRET!],
  path: '/',
});
```

### 4. Validate Sessions Server-Side

```typescript
export async function requireAuth(request: Request) {
  const user = await getCurrentUser(request);

  if (!user) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Bearer',
      },
    });
  }

  return user;
}
```

### 5. Log Security Events

```typescript
export async function logSecurityEvent(event: {
  type: 'login' | 'logout' | 'failed_login' | 'password_reset';
  userId?: string;
  ip: string;
  userAgent: string;
  success: boolean;
}) {
  // Log to your security monitoring system
  console.log('[SECURITY]', event);

  // Alert on suspicious activity
  if (event.type === 'failed_login') {
    await checkForBruteForce(event.ip);
  }
}
```

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Hash passwords with bcrypt (12+ rounds)
- [ ] Validate password strength
- [ ] Implement rate limiting on auth endpoints
- [ ] Use secure, httpOnly cookies
- [ ] Implement CSRF protection
- [ ] Enable 2FA for sensitive accounts
- [ ] Log authentication events
- [ ] Implement account lockout after failed attempts
- [ ] Use secure session storage (Redis in production)
- [ ] Rotate secrets regularly
- [ ] Validate JWT tokens properly
- [ ] Implement token refresh mechanism
- [ ] Use state parameter in OAuth flows
- [ ] Sanitize and validate all user input
- [ ] Implement email verification
- [ ] Use secure password reset flow
- [ ] Never log passwords or tokens
- [ ] Implement account recovery mechanisms
- [ ] Test authentication flows regularly

## Resources

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [API Security Guide](./api-security.md)
- [Security Overview](./overview.md)
