# Flash Messages & Enhanced Session Management

Complete guide to using Flash Messages and Enhanced Session Management in PhilJS.

## Table of Contents

- [Flash Messages](#flash-messages)
- [Enhanced Cookie Sessions](#enhanced-cookie-sessions)
- [Session Utilities](#session-utilities)
- [Complete Examples](#complete-examples)

## Flash Messages

Remix-style flash messages with session-based one-time messages that are automatically cleared after being read.

### Basic Usage

```typescript
import { createCookieSessionStorage } from 'philjs-api/session';
import { setFlashSuccess, getFlashMessages } from 'philjs-api/flash';

const sessionStorage = createCookieSessionStorage({
  secret: process.env.SESSION_SECRET!,
});

// In your action/handler
export async function handleFormSubmit(request: Request) {
  const session = await sessionStorage.getSession(request);

  // Set a flash message
  setFlashSuccess(session, 'Your changes have been saved!');

  // Commit and redirect
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/dashboard',
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  });
}

// In your page loader
export async function loadPage(request: Request) {
  const session = await sessionStorage.getSession(request);

  // Get flash messages (auto-cleared after read)
  const messages = getFlashMessages(session);

  return {
    messages,
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  };
}
```

### Flash Categories

```typescript
import {
  setFlashSuccess,
  setFlashError,
  setFlashWarning,
  setFlashInfo,
} from 'philjs-api/flash';

// Success message
setFlashSuccess(session, 'Operation completed successfully!');

// Error message
setFlashError(session, 'Something went wrong!');

// Warning message
setFlashWarning(session, 'Please verify your email address');

// Info message
setFlashInfo(session, 'You have 3 new notifications');
```

### Flash with Metadata

```typescript
import { setFlash } from 'philjs-api/flash';

setFlash(session, 'success', 'User created', {
  userId: 123,
  username: 'johndoe',
  action: 'create',
});
```

### Flash Utilities

```typescript
import { createFlashUtils } from 'philjs-api/flash';

const flash = createFlashUtils(session);

// Set messages
flash.success('Success!');
flash.error('Error!');
flash.warning('Warning!');
flash.info('Info!');

// Get messages (auto-cleared)
const messages = flash.get();

// Get by category (auto-cleared)
const errors = flash.getByCategory('error');

// Peek without clearing
const peeked = flash.peek();

// Check if has messages
if (flash.has()) {
  // Handle messages
}

// Clear all messages
flash.clear();
```

### Advanced Usage

```typescript
import {
  getFlashMessagesByCategory,
  peekFlashMessages,
  hasFlashMessages,
} from 'philjs-api/flash';

// Get messages by category
const errors = getFlashMessagesByCategory(session, 'error');

// Peek without clearing
const messages = peekFlashMessages(session);

// Check for messages
if (hasFlashMessages(session)) {
  // Display toast notifications
}
```

### Flash Middleware

```typescript
import { flashMiddleware } from 'philjs-api/flash';

const middleware = flashMiddleware(sessionStorage);

// Use in your request handler
const response = await middleware(request, async () => {
  // Your handler logic
  return new Response('OK');
});
```

## Enhanced Cookie Sessions

Secure cookie-based sessions with signing, encryption, rotation, and CSRF protection.

### Basic Setup

```typescript
import { createCookieSessionStorage } from 'philjs-api/cookie-session';

const sessionStorage = createCookieSessionStorage({
  name: 'my_session',
  secret: process.env.SESSION_SECRET!, // Min 32 chars
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
});
```

### With Encryption

```typescript
const sessionStorage = createCookieSessionStorage({
  name: 'my_session',
  secret: process.env.SESSION_SECRET!, // For signing
  encryptionSecret: process.env.ENCRYPTION_SECRET!, // For encryption (min 32 chars)
  secure: true,
  httpOnly: true,
  sameSite: 'strict',
});
```

### Session Rotation

```typescript
const sessionStorage = createCookieSessionStorage({
  secret: process.env.SESSION_SECRET!,
  rotate: true,
  rotateInterval: 3600, // Rotate every hour
});

// Manual rotation
sessionStorage.rotateSession(session);
```

### CSRF Protection

```typescript
const sessionStorage = createCookieSessionStorage({
  secret: process.env.SESSION_SECRET!,
  csrf: true,
  csrfFieldName: 'csrf_token',
});

// Generate CSRF token
const csrfToken = sessionStorage.generateCSRF(session);

// Verify CSRF token
const isValid = await sessionStorage.verifyCSRF(request, token);
```

### CSRF Middleware

```typescript
import { csrfMiddleware } from 'philjs-api/cookie-session';

const middleware = csrfMiddleware(sessionStorage);

// Protects POST, PUT, PATCH, DELETE requests
const response = await middleware(request, async () => {
  return new Response('OK');
});
```

### Session Rotation Middleware

```typescript
import { sessionRotationMiddleware } from 'philjs-api/cookie-session';

const middleware = sessionRotationMiddleware(sessionStorage);

const response = await middleware(request, async () => {
  return new Response('OK');
});
```

## Session Utilities

Helper functions and middleware for session management.

### Basic Helpers

```typescript
import {
  commitSession,
  destroySession,
  getOrCreateSession,
  requireSession,
} from 'philjs-api/session-utils';

// Commit session
const setCookie = await commitSession(storage, session);

// Destroy session
const setCookie = await destroySession(storage, session);

// Get or create session
const session = await getOrCreateSession(storage, request);

// Require session (throws if not found)
const session = await requireSession(storage, request, 'Login required');
```

### Session Middleware

```typescript
import { sessionMiddleware } from 'philjs-api/session-utils';

const middleware = sessionMiddleware({
  storage: sessionStorage,
  autoCommit: true, // Auto-commit on response
  contextKey: 'session',
});

const response = await middleware(request, async (req) => {
  // Session is attached to request
  const session = (req as RequestWithSession).session;

  session?.set('userId', '123');

  return new Response('OK');
});
```

### Session Value Helpers

```typescript
import {
  getSessionValue,
  setSessionValue,
  mergeSessionData,
  clearSessionData,
} from 'philjs-api/session-utils';

// Get with default
const userId = getSessionValue(session, 'userId', 'anonymous');

// Set with validation
const success = setSessionValue(
  session,
  'count',
  5,
  (value) => value > 0
);

// Merge data
mergeSessionData(session, {
  username: 'john',
  email: 'john@example.com',
});

// Clear all data
clearSessionData(session);
```

### Typed Session Utilities

```typescript
import { createTypedSessionUtils } from 'philjs-api/session-utils';

interface MySessionData {
  userId: string;
  username: string;
  role: 'admin' | 'user';
}

const utils = createTypedSessionUtils<MySessionData>(sessionStorage);

// All methods are fully typed
const session = await utils.get(request);
session.set('role', 'admin'); // Type-safe

const userId = utils.getValue(session, 'userId', 'anonymous');

utils.merge(session, {
  username: 'john',
  role: 'user',
});
```

### Session Timeout Middleware

```typescript
import { sessionTimeoutMiddleware } from 'philjs-api/session-utils';

const middleware = sessionTimeoutMiddleware(
  sessionStorage,
  3600 // 1 hour timeout
);

const response = await middleware(request, async () => {
  return new Response('OK');
});
```

### Session Validator Middleware

```typescript
import { sessionValidatorMiddleware } from 'philjs-api/session-utils';

const middleware = sessionValidatorMiddleware(
  sessionStorage,
  (session) => {
    // Validate session
    return session.get('userId') !== undefined;
  }
);

const response = await middleware(request, async () => {
  return new Response('OK');
});
```

### Session Regeneration

```typescript
import { regenerateSession } from 'philjs-api/session-utils';

// After login or privilege escalation
const newSession = await regenerateSession(storage, oldSession);

// Destroy old session
await storage.destroySession(oldSession);

// Commit new session
const setCookie = await storage.commitSession(newSession);
```

## Complete Examples

### Login with Flash Messages

```typescript
import { createCookieSessionStorage } from 'philjs-api/cookie-session';
import { setFlashSuccess, setFlashError } from 'philjs-api/flash';
import { regenerateSession } from 'philjs-api/session-utils';

const sessionStorage = createCookieSessionStorage({
  secret: process.env.SESSION_SECRET!,
  encryptionSecret: process.env.ENCRYPTION_SECRET!,
  csrf: true,
  rotate: true,
});

export async function handleLogin(request: Request) {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');

  const session = await sessionStorage.getSession(request);

  // Verify credentials
  const user = await verifyCredentials(email, password);

  if (!user) {
    setFlashError(session, 'Invalid credentials');

    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/login',
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    });
  }

  // Regenerate session after login
  const newSession = await regenerateSession(sessionStorage, session);

  // Set user data
  newSession.set('userId', user.id);
  newSession.set('role', user.role);

  // Set success message
  setFlashSuccess(newSession, `Welcome back, ${user.name}!`);

  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/dashboard',
      'Set-Cookie': await sessionStorage.commitSession(newSession),
    },
  });
}
```

### Protected Route with Session Validation

```typescript
import { sessionValidatorMiddleware, requireSession } from 'philjs-api/session-utils';
import { setFlashWarning } from 'philjs-api/flash';

const authMiddleware = sessionValidatorMiddleware(
  sessionStorage,
  async (session) => {
    // Check if user is authenticated
    const userId = session.get('userId');

    if (!userId) {
      setFlashWarning(session, 'Please log in to continue');
      return false;
    }

    // Additional validation
    const user = await getUserById(userId);
    return user !== null && user.active;
  }
);

export async function handleProtectedRoute(request: Request) {
  return authMiddleware(request, async () => {
    const session = await requireSession(sessionStorage, request);
    const userId = session.get('userId');

    // Handle protected route
    return new Response(`Hello, user ${userId}`);
  });
}
```

### Form with CSRF Protection

```typescript
import { csrfMiddleware } from 'philjs-api/cookie-session';
import { setFlashSuccess } from 'philjs-api/flash';

const csrf = csrfMiddleware(sessionStorage);

export async function handleForm(request: Request) {
  return csrf(request, async () => {
    const session = await sessionStorage.getSession(request);
    const formData = await request.formData();

    // Process form
    await saveFormData(formData);

    setFlashSuccess(session, 'Form submitted successfully!');

    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/success',
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    });
  });
}

// In your HTML template
export async function renderForm(request: Request) {
  const session = await sessionStorage.getSession(request);
  const csrfToken = sessionStorage.generateCSRF(session);

  return `
    <form method="POST">
      <input type="hidden" name="csrf_token" value="${csrfToken}" />
      <!-- form fields -->
      <button type="submit">Submit</button>
    </form>
  `;
}
```

### Complete Middleware Stack

```typescript
import { composeMiddleware } from 'philjs-api/middleware';
import { sessionMiddleware, sessionTimeoutMiddleware } from 'philjs-api/session-utils';
import { csrfMiddleware, sessionRotationMiddleware } from 'philjs-api/cookie-session';
import { flashMiddleware } from 'philjs-api/flash';

const middleware = composeMiddleware([
  sessionMiddleware({ storage: sessionStorage }),
  sessionTimeoutMiddleware(sessionStorage, 3600),
  sessionRotationMiddleware(sessionStorage),
  csrfMiddleware(sessionStorage),
  flashMiddleware(sessionStorage),
]);

export async function handleRequest(request: Request) {
  return middleware(request, async (req) => {
    // Your app logic
    return new Response('OK');
  });
}
```

## Type Safety

All utilities are fully typed and work with TypeScript:

```typescript
import type { TypedSession } from 'philjs-api/session-utils';
import type { FlashSessionData } from 'philjs-api/flash';

interface MySessionData extends FlashSessionData {
  userId: string;
  username: string;
  role: 'admin' | 'user';
  preferences: {
    theme: 'light' | 'dark';
    language: string;
  };
}

const session: TypedSession<MySessionData> = await sessionStorage.getSession(request);

// Fully typed
session.set('role', 'admin'); // ✓
session.set('role', 'invalid'); // ✗ Type error
```

## Security Best Practices

1. **Use strong secrets**: At least 32 characters, randomly generated
2. **Enable encryption**: For sensitive session data
3. **Enable CSRF protection**: For state-changing operations
4. **Use session rotation**: For long-lived sessions
5. **Set secure cookie options**: `secure`, `httpOnly`, `sameSite`
6. **Implement session timeout**: For inactive sessions
7. **Regenerate after login**: Prevent session fixation
8. **Validate session data**: On each request

```typescript
const sessionStorage = createCookieSessionStorage({
  secret: process.env.SESSION_SECRET!, // Strong secret
  encryptionSecret: process.env.ENCRYPTION_SECRET!, // Enable encryption
  csrf: true, // Enable CSRF
  rotate: true, // Enable rotation
  rotateInterval: 3600, // Rotate hourly
  secure: true, // HTTPS only
  httpOnly: true, // No JS access
  sameSite: 'strict', // CSRF protection
  maxAge: 60 * 60 * 24 * 7, // 7 days
});
```
