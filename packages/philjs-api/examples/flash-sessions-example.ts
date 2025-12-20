/**
 * Flash Messages and Enhanced Session Management Examples
 *
 * This file demonstrates how to use the new flash messages,
 * enhanced cookie sessions, and session utilities in PhilJS.
 */

import {
  // Enhanced Cookie Sessions
  createEnhancedCookieSessionStorage,
  csrfMiddleware,
  sessionRotationMiddleware,
  type CookieSessionOptions,

  // Flash Messages
  setFlashSuccess,
  setFlashError,
  setFlashWarning,
  setFlashInfo,
  getFlashMessages,
  createFlashUtils,
  flashMiddleware,
  type FlashMessage,

  // Session Utilities
  sessionMiddleware,
  sessionTimeoutMiddleware,
  sessionValidatorMiddleware,
  requireSession,
  regenerateSession,
  createTypedSessionUtils,
  type TypedSession,
} from 'philjs-api';

// ============================================================================
// Example 1: Basic Flash Messages
// ============================================================================

interface BasicSessionData {
  userId?: string;
  username?: string;
}

async function example1_basicFlash() {
  const sessionStorage = createEnhancedCookieSessionStorage<BasicSessionData>({
    name: 'my_session',
    secret: 'a'.repeat(32), // Use env var in production
  });

  const request = new Request('http://localhost/');
  const session = await sessionStorage.getSession(request);

  // Set flash messages
  setFlashSuccess(session, 'Welcome back!');
  setFlashError(session, 'Failed to save settings');
  setFlashWarning(session, 'Your password will expire soon');
  setFlashInfo(session, 'New features available');

  // Commit session
  const setCookie = await sessionStorage.commitSession(session);

  // On next request, get and display messages
  const request2 = new Request('http://localhost/', {
    headers: { Cookie: setCookie.split(';')[0]! },
  });
  const session2 = await sessionStorage.getSession(request2);

  const messages = getFlashMessages(session2);
  console.log('Flash messages:', messages);
  // Messages are now cleared from session
}

// ============================================================================
// Example 2: Flash Utils for Cleaner Code
// ============================================================================

async function example2_flashUtils() {
  const sessionStorage = createEnhancedCookieSessionStorage({
    secret: 'a'.repeat(32),
  });

  const request = new Request('http://localhost/');
  const session = await sessionStorage.getSession(request);

  // Create flash utilities
  const flash = createFlashUtils(session);

  // Cleaner API
  flash.success('Profile updated!');
  flash.error('Upload failed');
  flash.warning('Approaching quota limit');
  flash.info('Check out our new features');

  // Get messages
  const allMessages = flash.get();
  const errors = flash.getByCategory('error');

  // Peek without clearing
  const peeked = flash.peek();

  console.log('All messages:', allMessages);
  console.log('Errors only:', errors);
  console.log('Peeked:', peeked);
}

// ============================================================================
// Example 3: Enhanced Cookie Sessions with Encryption
// ============================================================================

interface SecureSessionData {
  userId: string;
  role: 'admin' | 'user';
  email: string;
}

async function example3_secureSession() {
  const sessionStorage = createEnhancedCookieSessionStorage<SecureSessionData>({
    name: 'secure_session',
    secret: process.env.SESSION_SECRET || 'a'.repeat(32),
    encryptionSecret: process.env.ENCRYPTION_SECRET || 'b'.repeat(32),
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  const request = new Request('http://localhost/');
  const session = await sessionStorage.getSession(request);

  // Store sensitive data (will be encrypted)
  session.set('userId', 'user123');
  session.set('role', 'admin');
  session.set('email', 'admin@example.com');

  const setCookie = await sessionStorage.commitSession(session);
  console.log('Encrypted session cookie:', setCookie);
}

// ============================================================================
// Example 4: CSRF Protection
// ============================================================================

async function example4_csrf() {
  const sessionStorage = createEnhancedCookieSessionStorage({
    secret: 'a'.repeat(32),
    csrf: true,
    csrfFieldName: 'csrf_token',
  });

  // GET request - render form with CSRF token
  async function renderForm(request: Request) {
    const session = await sessionStorage.getSession(request);
    const csrfToken = sessionStorage.generateCSRF(session);

    return `
      <form method="POST" action="/submit">
        <input type="hidden" name="csrf_token" value="${csrfToken}" />
        <input type="text" name="data" />
        <button type="submit">Submit</button>
      </form>
    `;
  }

  // POST request - protected by CSRF middleware
  const csrf = csrfMiddleware(sessionStorage);

  async function handleSubmit(request: Request) {
    return csrf(request, async () => {
      const formData = await request.formData();
      const data = formData.get('data');

      // Process form
      console.log('Form data:', data);

      return new Response('Success', { status: 200 });
    });
  }
}

// ============================================================================
// Example 5: Session Rotation
// ============================================================================

async function example5_rotation() {
  const sessionStorage = createEnhancedCookieSessionStorage({
    secret: 'a'.repeat(32),
    rotate: true,
    rotateInterval: 3600, // Rotate every hour
  });

  const rotationMiddleware = sessionRotationMiddleware(sessionStorage);

  async function handleRequest(request: Request) {
    return rotationMiddleware(request, async () => {
      // Session will be automatically rotated if needed
      return new Response('OK');
    });
  }
}

// ============================================================================
// Example 6: Session Timeout
// ============================================================================

interface TimeoutSessionData {
  userId: string;
  lastActivity?: number;
}

async function example6_timeout() {
  const sessionStorage = createEnhancedCookieSessionStorage<TimeoutSessionData>({
    secret: 'a'.repeat(32),
  });

  const timeoutMiddleware = sessionTimeoutMiddleware(
    sessionStorage,
    3600 // 1 hour timeout
  );

  async function handleRequest(request: Request) {
    return timeoutMiddleware(request, async () => {
      const session = await sessionStorage.getSession(request);
      console.log('Last activity:', session.get('lastActivity'));

      return new Response('OK');
    });
  }
}

// ============================================================================
// Example 7: Session Validation
// ============================================================================

async function example7_validation() {
  const sessionStorage = createEnhancedCookieSessionStorage({
    secret: 'a'.repeat(32),
  });

  const validationMiddleware = sessionValidatorMiddleware(
    sessionStorage,
    async (session) => {
      const userId = session.get('userId');

      // Check if user exists and is active
      if (!userId) return false;

      // Could check database here
      const user = await getUserFromDatabase(userId as string);
      return user !== null && user.active;
    }
  );

  async function handleProtectedRoute(request: Request) {
    return validationMiddleware(request, async () => {
      return new Response('Protected content');
    });
  }
}

// ============================================================================
// Example 8: Complete Login Flow
// ============================================================================

interface AuthSessionData {
  userId?: string;
  username?: string;
  role?: 'admin' | 'user';
}

async function example8_loginFlow() {
  const sessionStorage = createEnhancedCookieSessionStorage<AuthSessionData>({
    secret: process.env.SESSION_SECRET || 'a'.repeat(32),
    encryptionSecret: process.env.ENCRYPTION_SECRET || 'b'.repeat(32),
    csrf: true,
    rotate: true,
  });

  // Login handler
  async function handleLogin(request: Request) {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const session = await sessionStorage.getSession(request);
    const flash = createFlashUtils(session);

    // Verify credentials
    const user = await verifyCredentials(email, password);

    if (!user) {
      flash.error('Invalid email or password');

      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/login',
          'Set-Cookie': await sessionStorage.commitSession(session),
        },
      });
    }

    // Regenerate session to prevent fixation
    const newSession = await regenerateSession(sessionStorage, session);

    // Set user data
    newSession.set('userId', user.id);
    newSession.set('username', user.username);
    newSession.set('role', user.role);

    const newFlash = createFlashUtils(newSession);
    newFlash.success(`Welcome back, ${user.username}!`);

    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/dashboard',
        'Set-Cookie': await sessionStorage.commitSession(newSession),
      },
    });
  }

  // Logout handler
  async function handleLogout(request: Request) {
    const session = await sessionStorage.getSession(request);

    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/login',
        'Set-Cookie': await sessionStorage.destroySession(session),
      },
    });
  }
}

// ============================================================================
// Example 9: Typed Session Utilities
// ============================================================================

interface TypedSessionData {
  userId: string;
  username: string;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
  };
}

async function example9_typedUtils() {
  const sessionStorage = createEnhancedCookieSessionStorage<TypedSessionData>({
    secret: 'a'.repeat(32),
  });

  // Create typed utilities
  const utils = createTypedSessionUtils(sessionStorage);

  const request = new Request('http://localhost/');
  const session = await utils.get(request);

  // Fully typed operations
  session.set('userId', '123'); // ✓
  session.set('preferences', { theme: 'dark', language: 'en' }); // ✓
  // session.set('invalidKey', 'value'); // ✗ Type error

  // Get with default
  const theme = utils.getValue(
    session,
    'preferences',
    { theme: 'light', language: 'en' }
  );

  // Merge data
  utils.merge(session, {
    username: 'johndoe',
  });

  // Commit
  const setCookie = await utils.commit(session);
}

// ============================================================================
// Example 10: Complete Middleware Stack
// ============================================================================

async function example10_middlewareStack() {
  const sessionStorage = createEnhancedCookieSessionStorage({
    secret: 'a'.repeat(32),
    encryptionSecret: 'b'.repeat(32),
    csrf: true,
    rotate: true,
    rotateInterval: 3600,
  });

  // Compose multiple middleware
  async function handleRequest(request: Request) {
    // Session middleware
    const sessionMw = sessionMiddleware({ storage: sessionStorage });

    // Timeout middleware
    const timeoutMw = sessionTimeoutMiddleware(sessionStorage, 3600);

    // Rotation middleware
    const rotationMw = sessionRotationMiddleware(sessionStorage);

    // CSRF middleware
    const csrfMw = csrfMiddleware(sessionStorage);

    // Flash middleware
    const flashMw = flashMiddleware(sessionStorage);

    // Apply middleware stack
    return sessionMw(request, async (req1) => {
      return timeoutMw(req1, async (req2) => {
        return rotationMw(req2, async (req3) => {
          return csrfMw(req3, async (req4) => {
            return flashMw(req4, async () => {
              // Your application logic here
              return new Response('OK');
            });
          });
        });
      });
    });
  }
}

// ============================================================================
// Helper functions (mock implementations)
// ============================================================================

async function getUserFromDatabase(userId: string) {
  // Mock implementation
  return { id: userId, active: true };
}

async function verifyCredentials(email: string, password: string) {
  // Mock implementation
  if (email && password) {
    return {
      id: '123',
      username: 'johndoe',
      role: 'user' as const,
    };
  }
  return null;
}

// Export examples
export {
  example1_basicFlash,
  example2_flashUtils,
  example3_secureSession,
  example4_csrf,
  example5_rotation,
  example6_timeout,
  example7_validation,
  example8_loginFlow,
  example9_typedUtils,
  example10_middlewareStack,
};
