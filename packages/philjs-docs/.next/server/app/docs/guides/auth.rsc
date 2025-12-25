2:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","1207","static/chunks/app/docs/guides/auth/page-d83d6d2dc8ce7523.js"],"Terminal"]
3:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","1207","static/chunks/app/docs/guides/auth/page-d83d6d2dc8ce7523.js"],"CodeBlock"]
a:I[7696,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","1207","static/chunks/app/docs/guides/auth/page-d83d6d2dc8ce7523.js"],"Callout"]
b:I[6542,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","1207","static/chunks/app/docs/guides/auth/page-d83d6d2dc8ce7523.js"],""]
c:I[6419,[],""]
d:I[8445,[],""]
e:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"Sidebar"]
f:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"docsNavigation"]
10:I[1229,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"ThemeProvider"]
11:I[8529,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"Header"]
4:T530,// server/auth.ts
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
}5:T53e,import { createSignal } from 'philjs-core';
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
}6:T529,// components/ProtectedRoute.tsx
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
}7:T5de,// server/oauth.ts
'use server';

import { OAuth2Client } from 'philjs-auth/oauth';
import { createSession } from 'philjs-auth/server';
import { db } from './db';

const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: `${process.env.APP_URL}/auth/google/callback`,
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
}8:T4b8,// server/jwt-auth.ts
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
}9:T6a8,use philjs_auth::prelude::*;
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
}0:["cd22Ei08xvul0IDkb5kRy",[[["",{"children":["docs",{"children":["guides",{"children":["auth",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",{"children":["docs",{"children":["guides",{"children":["auth",{"children":["__PAGE__",{},[["$L1",["$","div",null,{"className":"mdx-content","children":[["$","h1",null,{"children":"Authentication"}],["$","p",null,{"className":"lead text-xl text-surface-600 dark:text-surface-400","children":"Learn how to implement secure authentication patterns in PhilJS, including sessions, JWTs, OAuth integration, and protecting routes."}],["$","h2",null,{"id":"overview","children":"Overview"}],["$","p",null,{"children":"PhilJS provides flexible authentication primitives that work with any auth provider or custom implementation. The core patterns include:"}],["$","ul",null,{"children":[["$","li",null,{"children":"Session-based authentication"}],["$","li",null,{"children":"JWT (JSON Web Token) authentication"}],["$","li",null,{"children":"OAuth providers (Google, GitHub, etc.)"}],["$","li",null,{"children":"Protected routes and middleware"}]]}],["$","h2",null,{"id":"setup","children":"Setup"}],["$","$L2",null,{"commands":["pnpm add philjs-auth","# Optional: Add your preferred session store","pnpm add @philjs/session-redis"]}],["$","h2",null,{"id":"auth-context","children":"Auth Context"}],["$","$L3",null,{"code":"// lib/auth.ts\nimport { createAuthContext } from 'philjs-auth';\n\nexport interface User {\n  id: string;\n  email: string;\n  name: string;\n  role: 'user' | 'admin';\n}\n\nexport const {\n  AuthProvider,\n  useAuth,\n  useUser,\n  useSession,\n} = createAuthContext<User>();\n\n// App.tsx\nimport { AuthProvider } from './lib/auth';\n\nfunction App() {\n  return (\n    <AuthProvider>\n      <Router />\n    </AuthProvider>\n  );\n}","language":"typescript"}],["$","h2",null,{"id":"session-auth","children":"Session-Based Authentication"}],["$","$L3",null,{"code":"$4","language":"typescript","filename":"server/auth.ts"}],["$","h2",null,{"id":"login-form","children":"Login Form"}],["$","$L3",null,{"code":"$5","language":"typescript"}],["$","h2",null,{"id":"protected-routes","children":"Protected Routes"}],["$","$L3",null,{"code":"$6","language":"typescript"}],["$","h2",null,{"id":"oauth","children":"OAuth Integration"}],["$","$L3",null,{"code":"$7","language":"typescript"}],["$","h2",null,{"id":"jwt-auth","children":"JWT Authentication"}],["$","$L3",null,{"code":"$8","language":"typescript"}],["$","h2",null,{"id":"rust-auth","children":"Authentication in Rust"}],["$","$L3",null,{"code":"$9","language":"rust"}],["$","h2",null,{"id":"middleware","children":"Auth Middleware for SSR"}],["$","$L3",null,{"code":"// middleware.ts\nimport { createMiddleware } from 'philjs-ssr/middleware';\nimport { getSession } from 'philjs-auth/server';\n\nexport const authMiddleware = createMiddleware(async (request, next) => {\n  const session = await getSession(request);\n  const isAuthPage = request.url.includes('/login') ||\n                     request.url.includes('/signup');\n\n  // Redirect authenticated users away from auth pages\n  if (session?.userId && isAuthPage) {\n    return Response.redirect(new URL('/dashboard', request.url));\n  }\n\n  // Protect dashboard routes\n  if (!session?.userId && request.url.includes('/dashboard')) {\n    return Response.redirect(new URL('/login', request.url));\n  }\n\n  return next();\n});","language":"typescript"}],["$","$La",null,{"type":"warning","title":"Security Best Practices","children":["$","ul",null,{"className":"list-disc ml-4 space-y-1","children":[["$","li",null,{"children":"Always use HTTPS in production"}],["$","li",null,{"children":"Store passwords with strong hashing (bcrypt, argon2)"}],["$","li",null,{"children":"Implement rate limiting on auth endpoints"}],["$","li",null,{"children":"Use secure, httpOnly cookies for sessions"}],["$","li",null,{"children":"Validate and sanitize all user inputs"}]]}]}],["$","h2",null,{"id":"next-steps","children":"Next Steps"}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 mt-6 not-prose","children":[["$","$Lb",null,{"href":"/docs/guides/forms","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Forms"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Build secure authentication forms"}]]}],["$","$Lb",null,{"href":"/docs/guides/deployment","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Deployment"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Deploy with secure auth configuration"}]]}]]}]]}],null],null],null]},[null,["$","$Lc",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","guides","children","auth","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Ld",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[null,["$","$Lc",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","guides","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Ld",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[null,["$","div",null,{"className":"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8","children":["$","div",null,{"className":"flex gap-12","children":[["$","$Le",null,{"sections":"$f"}],["$","main",null,{"className":"flex-1 min-w-0","children":["$","article",null,{"className":"prose prose-surface dark:prose-invert max-w-none","children":["$","$Lc",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Ld",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]}]}]]}]}]],null],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/00bb994365e07be9.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":["$","body",null,{"className":"__variable_f367f3 __variable_3c557b font-sans antialiased","children":["$","$L10",null,{"children":["$","div",null,{"className":"min-h-screen bg-white dark:bg-surface-950","children":[["$","$L11",null,{}],["$","$Lc",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Ld",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]]}]}]}]}]],null],null],["$L12",null]]]]
12:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Authentication - PhilJS Guide | PhilJS"}],["$","meta","3",{"name":"description","content":"Implement secure authentication in PhilJS applications with sessions, JWTs, OAuth, and protected routes."}],["$","meta","4",{"name":"author","content":"PhilJS Team"}],["$","link","5",{"rel":"manifest","href":"/site.webmanifest","crossOrigin":"use-credentials"}],["$","meta","6",{"name":"keywords","content":"philjs,javascript,typescript,rust,framework,signals,reactivity,wasm"}],["$","meta","7",{"property":"og:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","8",{"property":"og:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","9",{"property":"og:url","content":"https://philjs.dev/"}],["$","meta","10",{"property":"og:site_name","content":"PhilJS"}],["$","meta","11",{"property":"og:locale","content":"en_US"}],["$","meta","12",{"property":"og:image","content":"https://philjs.dev/og-image.png"}],["$","meta","13",{"property":"og:image:width","content":"1200"}],["$","meta","14",{"property":"og:image:height","content":"630"}],["$","meta","15",{"property":"og:image:alt","content":"PhilJS Framework"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","18",{"name":"twitter:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","19",{"name":"twitter:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","20",{"name":"twitter:image","content":"https://philjs.dev/og-image.png"}],["$","link","21",{"rel":"shortcut icon","href":"/favicon-16x16.png"}],["$","link","22",{"rel":"icon","href":"/favicon.ico"}],["$","link","23",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]]
1:null
