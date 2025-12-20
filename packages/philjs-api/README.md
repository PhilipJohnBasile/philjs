# philjs-api

API routes and full-stack utilities for PhilJS applications.

## Features

- **Type-safe API routes** - End-to-end type safety from server to client
- **File-based routing** - Automatic API route generation
- **Middleware support** - Request/response interceptors
- **Request validation** - Schema validation with Zod
- **Session management** - Built-in session and cookie utilities
- **Flash messages** - Remix-style one-time messages with auto-cleanup
- **Enhanced cookie sessions** - Encrypted, signed, CSRF-protected sessions
- **Session utilities** - Timeout, validation, rotation middleware
- **CORS handling** - Cross-origin resource sharing support
- **Rate limiting** - Protect your API from abuse
- **WebSocket support** - Real-time communication

## Installation

```bash
pnpm add philjs-api
```

## Quick Start

### Create an API Route

Create `src/routes/api/users.ts`:

```typescript
import { defineAPIRoute, json } from 'philjs-api';
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email()
});

export default defineAPIRoute({
  GET: async ({ request }) => {
    const users = await db.user.findMany();
    return json({ users });
  },

  POST: async ({ request }) => {
    const body = await request.json();
    const data = UserSchema.parse(body);

    const user = await db.user.create({ data });
    return json({ user }, { status: 201 });
  }
});
```

### Call from Client

```typescript
import { api } from 'philjs-api/client';

// Type-safe API calls
const { users } = await api.get('/api/users');
const { user } = await api.post('/api/users', {
  name: 'Alice',
  email: 'alice@example.com'
});
```

### Sessions and Cookies

```typescript
import { defineAPIRoute, createSession } from 'philjs-api';

const session = createSession({
  secret: process.env.SESSION_SECRET!,
  maxAge: 60 * 60 * 24 * 7 // 7 days
});

export default defineAPIRoute({
  POST: async ({ request }) => {
    const { email, password } = await request.json();
    const user = await authenticateUser(email, password);

    // Set session
    await session.set(request, 'userId', user.id);

    return json({ success: true });
  }
});
```

### Middleware

```typescript
import { defineAPIRoute, withAuth } from 'philjs-api';

export default defineAPIRoute({
  GET: withAuth(async ({ request, user }) => {
    // user is automatically available
    return json({ user });
  })
});
```

## Advanced Features

### Flash Messages

One-time messages that persist across redirects:

```typescript
import { setFlashSuccess, getFlashMessages } from 'philjs-api/flash';

// Set flash message
setFlashSuccess(session, 'Profile updated successfully!');

// Get and auto-clear
const messages = getFlashMessages(session);
```

### Enhanced Cookie Sessions

Secure sessions with encryption and CSRF protection:

```typescript
import { createCookieSessionStorage } from 'philjs-api/cookie-session';

const sessionStorage = createCookieSessionStorage({
  secret: process.env.SESSION_SECRET!,
  encryptionSecret: process.env.ENCRYPTION_SECRET!,
  csrf: true,
  rotate: true,
});
```

### Session Utilities

Helpers and middleware for session management:

```typescript
import { sessionMiddleware, sessionTimeoutMiddleware } from 'philjs-api/session-utils';

const middleware = sessionMiddleware({
  storage: sessionStorage,
  autoCommit: true,
});
```

See [FLASH_SESSIONS.md](./FLASH_SESSIONS.md) for complete documentation.

## Documentation

For more information, see the [PhilJS documentation](../../docs).

## License

MIT
