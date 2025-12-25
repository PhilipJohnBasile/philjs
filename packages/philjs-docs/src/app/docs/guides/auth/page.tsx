import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Authentication - PhilJS Guide',
  description: 'Implement secure authentication in PhilJS applications with sessions, JWTs, OAuth, and protected routes.',
};

export default function AuthPage() {
  return (
    <div className="mdx-content">
      <h1>Authentication</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        Learn how to implement secure authentication patterns in PhilJS, including sessions,
        JWTs, OAuth integration, and protecting routes.
      </p>

      <h2 id="overview">Overview</h2>

      <p>
        PhilJS provides flexible authentication primitives that work with any auth provider
        or custom implementation. The core patterns include:
      </p>

      <ul>
        <li>Session-based authentication</li>
        <li>JWT (JSON Web Token) authentication</li>
        <li>OAuth providers (Google, GitHub, etc.)</li>
        <li>Protected routes and middleware</li>
      </ul>

      <h2 id="setup">Setup</h2>

      <Terminal commands={[
        'pnpm add philjs-auth',
        '# Optional: Add your preferred session store',
        'pnpm add @philjs/session-redis',
      ]} />

      <h2 id="auth-context">Auth Context</h2>

      <CodeBlock
        code={`// lib/auth.ts
import { createAuthContext } from 'philjs-auth';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export const {
  AuthProvider,
  useAuth,
  useUser,
  useSession,
} = createAuthContext<User>();

// App.tsx
import { AuthProvider } from './lib/auth';

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}`}
        language="typescript"
      />

      <h2 id="session-auth">Session-Based Authentication</h2>

      <CodeBlock
        code={`// server/auth.ts
'use server';

import { createSession, destroySession, getSession } from 'philjs-auth/server';
import { db } from './db';
import { hash, verify } from './password';

export async function signUp(email: string, password: string, name: string) {
  // Check if user exists
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Email already registered');
  }

  // Create user
  const user = await db.user.create({
    data: {
      email,
      password: await hash(password),
      name,
    },
  });

  // Create session
  await createSession({ userId: user.id });

  return { success: true };
}

export async function signIn(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !(await verify(password, user.password))) {
    throw new Error('Invalid email or password');
  }

  await createSession({ userId: user.id });

  return { success: true };
}

export async function signOut() {
  await destroySession();
  return { success: true };
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) return null;

  return db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });
}`}
        language="typescript"
        filename="server/auth.ts"
      />

      <h2 id="login-form">Login Form</h2>

      <CodeBlock
        code={`import { createSignal } from 'philjs-core';
import { useAuth } from './lib/auth';
import { signIn } from './server/auth';

function LoginForm() {
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const { refresh } = useAuth();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email(), password());
      await refresh(); // Refresh auth state
      // Navigate to dashboard
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error() && (
        <div className="alert alert-error">{error()}</div>
      )}

      <input
        type="email"
        value={email()}
        onInput={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />

      <input
        type="password"
        value={password()}
        onInput={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />

      <button type="submit" disabled={loading()}>
        {loading() ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}`}
        language="typescript"
      />

      <h2 id="protected-routes">Protected Routes</h2>

      <CodeBlock
        code={`// components/ProtectedRoute.tsx
import { useAuth } from './lib/auth';
import { Navigate } from 'philjs-router';

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRole?: 'user' | 'admin';
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Show loading state while checking auth
  if (loading()) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!user()) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (requiredRole && user()?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// Usage in routes
import { Route, Routes } from 'philjs-router';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        component={() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/admin"
        component={() => (
          <ProtectedRoute requiredRole="admin">
            <AdminPanel />
          </ProtectedRoute>
        )}
      />
    </Routes>
  );
}`}
        language="typescript"
      />

      <h2 id="oauth">OAuth Integration</h2>

      <CodeBlock
        code={`// server/oauth.ts
'use server';

import { OAuth2Client } from 'philjs-auth/oauth';
import { createSession } from 'philjs-auth/server';
import { db } from './db';

const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: \`\${process.env.APP_URL}/auth/google/callback\`,
});

export async function getGoogleAuthUrl() {
  return googleClient.getAuthorizationUrl({
    scope: ['email', 'profile'],
    state: crypto.randomUUID(),
  });
}

export async function handleGoogleCallback(code: string) {
  const tokens = await googleClient.getTokens(code);
  const profile = await googleClient.getUserInfo(tokens.accessToken);

  // Find or create user
  let user = await db.user.findUnique({
    where: { email: profile.email },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        avatar: profile.picture,
        provider: 'google',
        providerId: profile.id,
      },
    });
  }

  await createSession({ userId: user.id });

  return { success: true };
}

// components/GoogleLoginButton.tsx
import { getGoogleAuthUrl } from './server/oauth';

function GoogleLoginButton() {
  const handleClick = async () => {
    const url = await getGoogleAuthUrl();
    window.location.href = url;
  };

  return (
    <button onClick={handleClick} className="google-btn">
      <GoogleIcon />
      Continue with Google
    </button>
  );
}`}
        language="typescript"
      />

      <h2 id="jwt-auth">JWT Authentication</h2>

      <CodeBlock
        code={`// server/jwt-auth.ts
'use server';

import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function createToken(payload: { userId: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function createRefreshToken(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

// Middleware for protected API routes
export async function authMiddleware(request: Request) {
  const token = request.headers.get('Authorization')?.split(' ')[1];

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return new Response('Invalid token', { status: 401 });
  }

  // Attach user to request context
  return { userId: payload.userId, role: payload.role };
}`}
        language="typescript"
      />

      <h2 id="rust-auth">Authentication in Rust</h2>

      <CodeBlock
        code={`use philjs_auth::prelude::*;
use axum::{
    extract::State,
    middleware::from_fn_with_state,
    routing::{get, post},
    Router,
};

#[derive(Clone)]
struct AppState {
    db: Database,
    session_store: SessionStore,
}

async fn sign_in(
    State(state): State<AppState>,
    Json(credentials): Json<Credentials>,
) -> Result<Json<AuthResponse>, AuthError> {
    let user = state.db
        .find_user_by_email(&credentials.email)
        .await?
        .ok_or(AuthError::InvalidCredentials)?;

    if !verify_password(&credentials.password, &user.password_hash) {
        return Err(AuthError::InvalidCredentials);
    }

    let session = state.session_store.create(user.id).await?;

    Ok(Json(AuthResponse {
        user: user.into(),
        token: session.token,
    }))
}

async fn require_auth(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, AuthError> {
    let token = request
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .ok_or(AuthError::Unauthorized)?;

    let session = state.session_store
        .validate(token)
        .await?
        .ok_or(AuthError::Unauthorized)?;

    request.extensions_mut().insert(session.user_id);
    Ok(next.run(request).await)
}

fn app() -> Router {
    let state = AppState::new();

    Router::new()
        .route("/api/auth/signin", post(sign_in))
        .route("/api/auth/signup", post(sign_up))
        .route(
            "/api/protected",
            get(protected_route)
                .layer(from_fn_with_state(state.clone(), require_auth)),
        )
        .with_state(state)
}`}
        language="rust"
      />

      <h2 id="middleware">Auth Middleware for SSR</h2>

      <CodeBlock
        code={`// middleware.ts
import { createMiddleware } from 'philjs-ssr/middleware';
import { getSession } from 'philjs-auth/server';

export const authMiddleware = createMiddleware(async (request, next) => {
  const session = await getSession(request);
  const isAuthPage = request.url.includes('/login') ||
                     request.url.includes('/signup');

  // Redirect authenticated users away from auth pages
  if (session?.userId && isAuthPage) {
    return Response.redirect(new URL('/dashboard', request.url));
  }

  // Protect dashboard routes
  if (!session?.userId && request.url.includes('/dashboard')) {
    return Response.redirect(new URL('/login', request.url));
  }

  return next();
});`}
        language="typescript"
      />

      <Callout type="warning" title="Security Best Practices">
        <ul className="list-disc ml-4 space-y-1">
          <li>Always use HTTPS in production</li>
          <li>Store passwords with strong hashing (bcrypt, argon2)</li>
          <li>Implement rate limiting on auth endpoints</li>
          <li>Use secure, httpOnly cookies for sessions</li>
          <li>Validate and sanitize all user inputs</li>
        </ul>
      </Callout>

      <h2 id="next-steps">Next Steps</h2>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/guides/forms"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Forms</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Build secure authentication forms
          </p>
        </Link>

        <Link
          href="/docs/guides/deployment"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Deployment</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Deploy with secure auth configuration
          </p>
        </Link>
      </div>
    </div>
  );
}
