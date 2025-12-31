# Migration Guide: Enhanced Sessions

Guide for migrating from basic session management to enhanced cookie sessions with flash messages.

## Overview

PhilJS 0.1.0 introduces enhanced session management features:

- **Flash Messages**: One-time messages with auto-cleanup
- **Enhanced Cookie Sessions**: Encryption, signing, CSRF protection, rotation
- **Session Utilities**: Timeout, validation, and helper functions

## Migration Steps

### Step 1: Update Imports

**Before:**
```typescript
import { createCookieSessionStorage } from '@philjs/api/session';
```

**After:**
```typescript
// For basic sessions (backward compatible)
import { createCookieSessionStorage } from '@philjs/api/session';

// For enhanced sessions (new)
import { createEnhancedCookieSessionStorage } from '@philjs/api/cookie-session';

// For flash messages
import { setFlashSuccess, getFlashMessages } from '@philjs/api/flash';

// For utilities
import { sessionMiddleware, requireSession } from '@philjs/api/session-utils';
```

### Step 2: Update Session Configuration

**Before:**
```typescript
const sessionStorage = createCookieSessionStorage({
  cookieName: 'session',
  secret: process.env.SESSION_SECRET,
  cookie: {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  },
});
```

**After (Enhanced):**
```typescript
const sessionStorage = createEnhancedCookieSessionStorage({
  name: 'session', // Renamed from cookieName
  secret: process.env.SESSION_SECRET,
  encryptionSecret: process.env.ENCRYPTION_SECRET, // NEW: Enable encryption
  csrf: true, // NEW: Enable CSRF protection
  rotate: true, // NEW: Enable session rotation
  rotateInterval: 3600, // NEW: Rotate every hour
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7,
});
```

### Step 3: Add Flash Messages

**Before:**
```typescript
// Storing temporary messages in session
session.set('message', 'Success!');
session.set('messageType', 'success');

// In loader
const message = session.get('message');
const messageType = session.get('messageType');
session.delete('message');
session.delete('messageType');
```

**After:**
```typescript
import { setFlashSuccess, getFlashMessages } from '@philjs/api/flash';

// In action
setFlashSuccess(session, 'Success!');

// In loader
const messages = getFlashMessages(session); // Auto-cleared
// messages = [{ category: 'success', message: 'Success!', ... }]
```

### Step 4: Add CSRF Protection

**Before:**
```typescript
// Manual CSRF handling
const csrfToken = generateRandomToken();
session.set('csrfToken', csrfToken);

// In form handler
const submittedToken = formData.get('csrf_token');
if (submittedToken !== session.get('csrfToken')) {
  throw new Error('Invalid CSRF token');
}
```

**After:**
```typescript
import { csrfMiddleware } from '@philjs/api/cookie-session';

// Enable in session config
const sessionStorage = createEnhancedCookieSessionStorage({
  secret: process.env.SESSION_SECRET,
  csrf: true,
});

// Generate token for form
const csrfToken = sessionStorage.generateCSRF(session);

// Protect route with middleware
const csrf = csrfMiddleware(sessionStorage);

export async function handleForm(request: Request) {
  return csrf(request, async () => {
    // CSRF verified automatically
    const formData = await request.formData();
    // Process form...
  });
}
```

### Step 5: Add Session Timeout

**Before:**
```typescript
// Manual timeout tracking
const lastActivity = session.get('lastActivity') as number;
if (Date.now() - lastActivity > TIMEOUT) {
  await destroySession(sessionStorage, session);
  return redirect('/login');
}
session.set('lastActivity', Date.now());
```

**After:**
```typescript
import { sessionTimeoutMiddleware } from '@philjs/api/session-utils';

const timeoutMw = sessionTimeoutMiddleware(
  sessionStorage,
  3600 // 1 hour
);

export async function handleRequest(request: Request) {
  return timeoutMw(request, async () => {
    // Timeout handled automatically
    return new Response('OK');
  });
}
```

### Step 6: Add Session Validation

**Before:**
```typescript
// Manual validation
const userId = session.get('userId');
if (!userId) {
  return redirect('/login');
}

const user = await db.user.findUnique({ where: { id: userId } });
if (!user || !user.active) {
  await destroySession(sessionStorage, session);
  return redirect('/login');
}
```

**After:**
```typescript
import { sessionValidatorMiddleware } from '@philjs/api/session-utils';

const validator = sessionValidatorMiddleware(
  sessionStorage,
  async (session) => {
    const userId = session.get('userId');
    if (!userId) return false;

    const user = await db.user.findUnique({ where: { id: userId } });
    return user !== null && user.active;
  }
);

export async function handleProtectedRoute(request: Request) {
  return validator(request, async () => {
    // Session validated automatically
    return new Response('Protected content');
  });
}
```

### Step 7: Update Login Flow

**Before:**
```typescript
export async function handleLogin(request: Request) {
  const { email, password } = await request.json();
  const user = await authenticate(email, password);

  if (!user) {
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const session = await sessionStorage.getSession(request);
  session.set('userId', user.id);

  return json(
    { success: true },
    {
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    }
  );
}
```

**After:**
```typescript
import { regenerateSession } from '@philjs/api/session-utils';
import { setFlashSuccess, setFlashError } from '@philjs/api/flash';

export async function handleLogin(request: Request) {
  const { email, password } = await request.json();
  const session = await sessionStorage.getSession(request);

  const user = await authenticate(email, password);

  if (!user) {
    setFlashError(session, 'Invalid credentials');
    return redirect('/login', {
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    });
  }

  // Regenerate to prevent session fixation
  const newSession = await regenerateSession(sessionStorage, session);
  newSession.set('userId', user.id);

  setFlashSuccess(newSession, `Welcome back, ${user.name}!`);

  return redirect('/dashboard', {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(newSession),
    },
  });
}
```

## Backward Compatibility

The original `createCookieSessionStorage` from `@philjs/api/session` remains unchanged and fully compatible. You can migrate incrementally:

1. Keep using basic sessions for existing code
2. Use enhanced sessions for new features
3. Gradually migrate existing code as needed

## Type Safety

Enhanced sessions support full TypeScript typing:

```typescript
interface MySessionData {
  userId: string;
  role: 'admin' | 'user';
  preferences: {
    theme: 'light' | 'dark';
  };
}

const sessionStorage = createEnhancedCookieSessionStorage<MySessionData>({
  secret: process.env.SESSION_SECRET,
});

const session = await sessionStorage.getSession(request);
session.set('role', 'admin'); // ✓ Type-safe
session.set('role', 'invalid'); // ✗ Type error
```

## Performance Considerations

### Encryption

Encryption adds minimal overhead (~1-2ms per request). Use it for sensitive data:

```typescript
const sessionStorage = createEnhancedCookieSessionStorage({
  secret: process.env.SESSION_SECRET,
  encryptionSecret: process.env.ENCRYPTION_SECRET, // Enable encryption
});
```

### Session Rotation

Rotation frequency affects performance. Recommended intervals:

- **High security**: 900s (15 minutes)
- **Normal security**: 3600s (1 hour)
- **Long-lived sessions**: 86400s (24 hours)

```typescript
const sessionStorage = createEnhancedCookieSessionStorage({
  secret: process.env.SESSION_SECRET,
  rotate: true,
  rotateInterval: 3600, // 1 hour
});
```

## Security Checklist

- [ ] Use strong secrets (min 32 characters, randomly generated)
- [ ] Enable encryption for sensitive data
- [ ] Enable CSRF protection for state-changing operations
- [ ] Set appropriate cookie options (`secure`, `httpOnly`, `sameSite`)
- [ ] Implement session timeout for inactive sessions
- [ ] Regenerate session after login/privilege changes
- [ ] Validate session data on each request
- [ ] Use session rotation for long-lived sessions

## Common Patterns

### Pattern 1: Protected Route

```typescript
import { sessionValidatorMiddleware, requireSession } from '@philjs/api/session-utils';

const auth = sessionValidatorMiddleware(
  sessionStorage,
  (session) => session.get('userId') !== undefined
);

export async function handleRoute(request: Request) {
  return auth(request, async () => {
    const session = await requireSession(sessionStorage, request);
    const userId = session.get('userId');
    // Handle authenticated request
  });
}
```

### Pattern 2: Form with Flash

```typescript
import { setFlashSuccess, setFlashError, getFlashMessages } from '@philjs/api/flash';

export async function handleForm(request: Request) {
  const session = await sessionStorage.getSession(request);
  const formData = await request.formData();

  try {
    await processForm(formData);
    setFlashSuccess(session, 'Form submitted successfully!');
  } catch (error) {
    setFlashError(session, 'Failed to submit form');
  }

  return redirect('/form', {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  });
}

export async function showForm(request: Request) {
  const session = await sessionStorage.getSession(request);
  const messages = getFlashMessages(session);

  return render({ messages });
}
```

### Pattern 3: Middleware Stack

```typescript
import { composeMiddleware } from '@philjs/api/middleware';
import { sessionMiddleware, sessionTimeoutMiddleware } from '@philjs/api/session-utils';
import { csrfMiddleware, sessionRotationMiddleware } from '@philjs/api/cookie-session';

const middleware = composeMiddleware([
  sessionMiddleware({ storage: sessionStorage }),
  sessionTimeoutMiddleware(sessionStorage, 3600),
  sessionRotationMiddleware(sessionStorage),
  csrfMiddleware(sessionStorage),
]);

export async function handleRequest(request: Request) {
  return middleware(request, async () => {
    // Your app logic
  });
}
```

## Troubleshooting

### Issue: Session not persisting

**Cause**: Cookie not being set correctly

**Solution**: Ensure you're committing the session and setting the cookie header

```typescript
const setCookie = await sessionStorage.commitSession(session);

return new Response('OK', {
  headers: {
    'Set-Cookie': setCookie,
  },
});
```

### Issue: CSRF token invalid

**Cause**: Token mismatch or missing

**Solution**: Ensure token is generated and submitted correctly

```typescript
// Generate in form
const csrfToken = sessionStorage.generateCSRF(session);

// Submit in header or form field
headers.set('X-CSRF-Token', csrfToken);
// OR
formData.append('csrf_token', csrfToken);
```

### Issue: Session timeout too aggressive

**Cause**: Timeout interval too short

**Solution**: Adjust timeout interval

```typescript
const timeoutMw = sessionTimeoutMiddleware(
  sessionStorage,
  7200 // 2 hours instead of 1 hour
);
```

## Need Help?

- [Flash Messages Documentation](./FLASH_SESSIONS.md#flash-messages)
- [Enhanced Sessions Documentation](./FLASH_SESSIONS.md#enhanced-cookie-sessions)
- [Session Utilities Documentation](./FLASH_SESSIONS.md#session-utilities)
- [Examples](./examples/flash-sessions-example.ts)
