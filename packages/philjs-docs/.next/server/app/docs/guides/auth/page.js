(()=>{var e={};e.id=1207,e.ids=[1207],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},2494:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>a.a,__next_app__:()=>h,originalPathname:()=>c,pages:()=>u,routeModule:()=>p,tree:()=>d}),r(2436),r(2108),r(4001),r(1305);var s=r(3545),i=r(5947),o=r(9761),a=r.n(o),n=r(4798),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);r.d(t,l);let d=["",{children:["docs",{children:["guides",{children:["auth",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,2436)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\auth\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,1305,23)),"next/dist/client/components/not-found-error"]}],u=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\guides\\auth\\page.tsx"],c="/docs/guides/auth/page",h={require:r,loadChunk:()=>Promise.resolve()},p=new s.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/docs/guides/auth/page",pathname:"/docs/guides/auth",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},4357:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,5505,23)),Promise.resolve().then(r.bind(r,2015)),Promise.resolve().then(r.bind(r,306))},4444:(e,t,r)=>{Promise.resolve().then(r.bind(r,5173))},5173:(e,t,r)=>{"use strict";r.d(t,{Sidebar:()=>u,docsNavigation:()=>d});var s=r(6741),i=r(8972),o=r(47),a=r(7678),n=r(3178),l=r(5280);let d=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function u({sections:e}){let t=(0,o.usePathname)(),[r,d]=(0,l.useState)(()=>{let r=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(r?[r.title]:[e[0]?.title])}),u=e=>{d(t=>{let r=new Set(t);return r.has(e)?r.delete(e):r.add(e),r})};return s.jsx("nav",{className:"w-64 flex-shrink-0",children:s.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:s.jsx("ul",{className:"space-y-6",children:e.map(e=>{let o=r.has(e.title),l=e.links.some(e=>t===e.href);return(0,s.jsxs)("li",{children:[(0,s.jsxs)("button",{onClick:()=>u(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,s.jsx(n.Z,{className:(0,a.Z)("w-4 h-4 transition-transform",o&&"rotate-90")})]}),(o||l)&&s.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let r=t===e.href;return s.jsx("li",{children:s.jsx(i.default,{href:e.href,className:(0,a.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",r?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,r)=>{"use strict";r.d(t,{default:()=>i.a});var s=r(7654),i=r.n(s)},7654:(e,t,r)=>{"use strict";let{createProxy:s}=r(1471);e.exports=s("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},2436:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>l,metadata:()=>n});var s=r(9015),i=r(3288),o=r(7309),a=r(8951);let n={title:"Authentication - PhilJS Guide",description:"Implement secure authentication in PhilJS applications with sessions, JWTs, OAuth, and protected routes."};function l(){return(0,s.jsxs)("div",{className:"mdx-content",children:[s.jsx("h1",{children:"Authentication"}),s.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"Learn how to implement secure authentication patterns in PhilJS, including sessions, JWTs, OAuth integration, and protecting routes."}),s.jsx("h2",{id:"overview",children:"Overview"}),s.jsx("p",{children:"PhilJS provides flexible authentication primitives that work with any auth provider or custom implementation. The core patterns include:"}),(0,s.jsxs)("ul",{children:[s.jsx("li",{children:"Session-based authentication"}),s.jsx("li",{children:"JWT (JSON Web Token) authentication"}),s.jsx("li",{children:"OAuth providers (Google, GitHub, etc.)"}),s.jsx("li",{children:"Protected routes and middleware"})]}),s.jsx("h2",{id:"setup",children:"Setup"}),s.jsx(i.oI,{commands:["pnpm add philjs-auth","# Optional: Add your preferred session store","pnpm add @philjs/session-redis"]}),s.jsx("h2",{id:"auth-context",children:"Auth Context"}),s.jsx(i.dn,{code:`// lib/auth.ts
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
}`,language:"typescript"}),s.jsx("h2",{id:"session-auth",children:"Session-Based Authentication"}),s.jsx(i.dn,{code:`// server/auth.ts
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
}`,language:"typescript",filename:"server/auth.ts"}),s.jsx("h2",{id:"login-form",children:"Login Form"}),s.jsx(i.dn,{code:`import { createSignal } from 'philjs-core';
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
}`,language:"typescript"}),s.jsx("h2",{id:"protected-routes",children:"Protected Routes"}),s.jsx(i.dn,{code:`// components/ProtectedRoute.tsx
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
}`,language:"typescript"}),s.jsx("h2",{id:"oauth",children:"OAuth Integration"}),s.jsx(i.dn,{code:`// server/oauth.ts
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
}`,language:"typescript"}),s.jsx("h2",{id:"jwt-auth",children:"JWT Authentication"}),s.jsx(i.dn,{code:`// server/jwt-auth.ts
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
}`,language:"typescript"}),s.jsx("h2",{id:"rust-auth",children:"Authentication in Rust"}),s.jsx(i.dn,{code:`use philjs_auth::prelude::*;
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
}`,language:"rust"}),s.jsx("h2",{id:"middleware",children:"Auth Middleware for SSR"}),s.jsx(i.dn,{code:`// middleware.ts
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
});`,language:"typescript"}),s.jsx(o.U,{type:"warning",title:"Security Best Practices",children:(0,s.jsxs)("ul",{className:"list-disc ml-4 space-y-1",children:[s.jsx("li",{children:"Always use HTTPS in production"}),s.jsx("li",{children:"Store passwords with strong hashing (bcrypt, argon2)"}),s.jsx("li",{children:"Implement rate limiting on auth endpoints"}),s.jsx("li",{children:"Use secure, httpOnly cookies for sessions"}),s.jsx("li",{children:"Validate and sanitize all user inputs"})]})}),s.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,s.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,s.jsxs)(a.default,{href:"/docs/guides/forms",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Forms"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Build secure authentication forms"})]}),(0,s.jsxs)(a.default,{href:"/docs/guides/deployment",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[s.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Deployment"}),s.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Deploy with secure auth configuration"})]})]})]})}},2108:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>n});var s=r(9015),i=r(1471);let o=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),a=(0,i.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function n({children:e}){return s.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,s.jsxs)("div",{className:"flex gap-12",children:[s.jsx(a,{sections:o}),s.jsx("main",{className:"flex-1 min-w-0",children:s.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},3288:(e,t,r)=>{"use strict";r.d(t,{dn:()=>i,oI:()=>o});var s=r(1471);let i=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let o=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[732,6314,9858],()=>r(2494));module.exports=s})();