/**
 * PhilJS CLI - Auth Generator
 *
 * Generate authentication setup with multiple provider options:
 * - Clerk
 * - Auth0
 * - Supabase
 * - NextAuth
 * - Custom
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as pc from 'picocolors';
/**
 * Main auth generator entry point
 */
export async function generateAuth(options) {
    const { provider, directory = 'src', typescript = true, withUI = true, withMiddleware = true, withProtectedRoutes = true, } = options;
    console.log(pc.cyan(`\n🔐 Setting up ${provider} authentication...\n`));
    const ext = typescript ? 'tsx' : 'jsx';
    const tsExt = typescript ? 'ts' : 'js';
    // Create auth directory structure
    const authDir = path.join(process.cwd(), directory, 'auth');
    await fs.mkdir(authDir, { recursive: true });
    // Generate provider-specific config
    await generateProviderConfig(provider, authDir, typescript);
    // Generate auth provider wrapper
    await generateAuthProvider(provider, authDir, typescript);
    // Generate hooks
    await generateAuthHooks(provider, authDir, typescript);
    // Generate middleware (if requested)
    if (withMiddleware) {
        await generateAuthMiddleware(provider, directory, typescript);
    }
    // Generate UI components (if requested)
    if (withUI) {
        const uiDir = path.join(authDir, 'components');
        await fs.mkdir(uiDir, { recursive: true });
        await generateLoginForm(provider, uiDir, ext);
        await generateSignupForm(provider, uiDir, ext);
        await generatePasswordReset(provider, uiDir, ext);
        await generateProfileForm(provider, uiDir, ext);
    }
    // Generate protected route utilities (if requested)
    if (withProtectedRoutes) {
        await generateProtectedRouteUtils(provider, authDir, ext);
        await generateAuthGuard(provider, authDir, ext);
    }
    // Generate example pages
    await generateExamplePages(provider, directory, ext);
    // Generate .env.example
    await generateEnvExample(provider);
    // Print setup instructions
    printSetupInstructions(provider);
    console.log(pc.green(`\n✅ ${provider} authentication setup complete!\n`));
}
/**
 * Generate provider-specific configuration
 */
async function generateProviderConfig(provider, authDir, typescript) {
    const ext = typescript ? 'ts' : 'js';
    const configPath = path.join(authDir, `config.${ext}`);
    let configContent = '';
    switch (provider) {
        case 'clerk':
            configContent = generateClerkConfig(typescript);
            break;
        case 'auth0':
            configContent = generateAuth0Config(typescript);
            break;
        case 'supabase':
            configContent = generateSupabaseConfig(typescript);
            break;
        case 'nextauth':
            configContent = generateNextAuthConfig(typescript);
            break;
        case 'custom':
            configContent = generateCustomConfig(typescript);
            break;
    }
    await fs.writeFile(configPath, configContent);
    console.log(pc.green(`  ✓ Created auth/config.${ext}`));
}
/**
 * Generate Clerk configuration
 */
function generateClerkConfig(ts) {
    return `/**
 * Clerk Authentication Configuration
 *
 * Get your keys from: https://dashboard.clerk.com
 */

${ts ? `export interface ClerkConfig {
  publishableKey: string;
  secretKey?: string;
  signInUrl?: string;
  signUpUrl?: string;
  afterSignInUrl?: string;
  afterSignUpUrl?: string;
}

` : ''}export const clerkConfig${ts ? ': ClerkConfig' : ''} = {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '',
  secretKey: import.meta.env.CLERK_SECRET_KEY,
  signInUrl: '/auth/sign-in',
  signUpUrl: '/auth/sign-up',
  afterSignInUrl: '/dashboard',
  afterSignUpUrl: '/onboarding',
};

// Validate configuration
if (!clerkConfig.publishableKey) {
  console.warn('⚠️  Missing VITE_CLERK_PUBLISHABLE_KEY environment variable');
}
`;
}
/**
 * Generate Auth0 configuration
 */
function generateAuth0Config(ts) {
    return `/**
 * Auth0 Authentication Configuration
 *
 * Get your credentials from: https://manage.auth0.com
 */

${ts ? `export interface Auth0Config {
  domain: string;
  clientId: string;
  clientSecret?: string;
  audience?: string;
  redirectUri: string;
  scope: string;
}

` : ''}export const auth0Config${ts ? ': Auth0Config' : ''} = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || '',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || '',
  clientSecret: import.meta.env.AUTH0_CLIENT_SECRET,
  audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  redirectUri: typeof window !== 'undefined'
    ? \`\${window.location.origin}/auth/callback\`
    : 'http://localhost:3000/auth/callback',
  scope: 'openid profile email',
};

// Validate configuration
if (!auth0Config.domain || !auth0Config.clientId) {
  console.warn('⚠️  Missing Auth0 environment variables');
}
`;
}
/**
 * Generate Supabase configuration
 */
function generateSupabaseConfig(ts) {
    return `/**
 * Supabase Authentication Configuration
 *
 * Get your credentials from: https://app.supabase.com
 */

${ts ? `export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  auth?: {
    autoRefreshToken?: boolean;
    persistSession?: boolean;
    detectSessionInUrl?: boolean;
  };
}

` : ''}export const supabaseConfig${ts ? ': SupabaseConfig' : ''} = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  serviceRoleKey: import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
};

// Validate configuration
if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  console.warn('⚠️  Missing Supabase environment variables');
}
`;
}
/**
 * Generate NextAuth configuration
 */
function generateNextAuthConfig(ts) {
    return `/**
 * NextAuth.js Configuration
 *
 * Compatible with PhilJS via adapter
 */

${ts ? `export interface NextAuthConfig {
  secret: string;
  providers: Array<any>;
  session?: {
    strategy?: 'jwt' | 'database';
    maxAge?: number;
  };
  pages?: {
    signIn?: string;
    signOut?: string;
    error?: string;
    verifyRequest?: string;
  };
}

` : ''}export const nextAuthConfig${ts ? ': NextAuthConfig' : ''} = {
  secret: import.meta.env.NEXTAUTH_SECRET || '',
  providers: [
    // Add your NextAuth providers here
    // Example: GithubProvider, GoogleProvider, etc.
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
};

// Validate configuration
if (!nextAuthConfig.secret) {
  console.warn('⚠️  Missing NEXTAUTH_SECRET environment variable');
}
`;
}
/**
 * Generate custom auth configuration
 */
function generateCustomConfig(ts) {
    return `/**
 * Custom Authentication Configuration
 *
 * Configure your custom authentication system
 */

${ts ? `export interface CustomAuthConfig {
  apiUrl: string;
  tokenKey: string;
  refreshTokenKey: string;
  tokenExpiry: number;
  endpoints: {
    login: string;
    signup: string;
    logout: string;
    refresh: string;
    me: string;
  };
}

` : ''}export const authConfig${ts ? ': CustomAuthConfig' : ''} = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  tokenKey: 'auth_token',
  refreshTokenKey: 'refresh_token',
  tokenExpiry: 3600000, // 1 hour in milliseconds
  endpoints: {
    login: '/auth/login',
    signup: '/auth/signup',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
  },
};

${ts ? `
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: string;
  metadata?: Record<string, unknown>;
}
` : ''}`;
}
/**
 * Generate auth provider wrapper component
 */
async function generateAuthProvider(provider, authDir, typescript) {
    const ext = typescript ? 'tsx' : 'jsx';
    const providerPath = path.join(authDir, `AuthProvider.${ext}`);
    let content = '';
    switch (provider) {
        case 'clerk':
            content = generateClerkProvider(typescript);
            break;
        case 'auth0':
            content = generateAuth0Provider(typescript);
            break;
        case 'supabase':
            content = generateSupabaseProvider(typescript);
            break;
        case 'nextauth':
            content = generateNextAuthProvider(typescript);
            break;
        case 'custom':
            content = generateCustomProvider(typescript);
            break;
    }
    await fs.writeFile(providerPath, content);
    console.log(pc.green(`  ✓ Created auth/AuthProvider.${ext}`));
}
function generateClerkProvider(ts) {
    return `/**
 * Clerk Authentication Provider
 *
 * Wraps the app with Clerk's authentication context
 */

import { ClerkProvider } from '@clerk/clerk-react';
import { clerkConfig } from './config${ts ? '.js' : ''}';
${ts ? `import type { JSX } from '@philjs/core';\n` : ''}
${ts ? `interface AuthProviderProps {
  children: JSX.Element;
}

` : ''}export function AuthProvider({ children }${ts ? ': AuthProviderProps' : ''}) {
  return (
    <ClerkProvider
      publishableKey={clerkConfig.publishableKey}
      navigate={(to) => window.location.href = to}
    >
      {children}
    </ClerkProvider>
  );
}
`;
}
function generateAuth0Provider(ts) {
    return `/**
 * Auth0 Authentication Provider
 *
 * Wraps the app with Auth0's authentication context
 */

import { Auth0Provider } from '@auth0/auth0-react';
import { auth0Config } from './config${ts ? '.js' : ''}';
${ts ? `import type { JSX } from '@philjs/core';\n` : ''}
${ts ? `interface AuthProviderProps {
  children: JSX.Element;
}

` : ''}export function AuthProvider({ children }${ts ? ': AuthProviderProps' : ''}) {
  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: auth0Config.redirectUri,
        audience: auth0Config.audience,
        scope: auth0Config.scope,
      }}
    >
      {children}
    </Auth0Provider>
  );
}
`;
}
function generateSupabaseProvider(ts) {
    return `/**
 * Supabase Authentication Provider
 *
 * Provides Supabase auth context to the app
 */

import { createContext, useEffect } from '@philjs/core';
import { signal } from '@philjs/core/signals';
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config${ts ? '.js' : ''}';
${ts ? `import type { JSX } from '@philjs/core';
import type { SupabaseClient, User, Session } from '@supabase/supabase-js';

interface SupabaseAuthContext {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  loading: boolean;
}
` : ''}
// Create Supabase client
export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  { auth: supabaseConfig.auth }
);

// Auth state signals
const userSignal = signal${ts ? '<User | null>' : ''}(null);
const sessionSignal = signal${ts ? '<Session | null>' : ''}(null);
const loadingSignal = signal(true);

// Auth context
export const SupabaseAuthContext = createContext${ts ? '<SupabaseAuthContext>' : ''}({
  supabase,
  user: null,
  session: null,
  loading: true,
});

${ts ? `interface AuthProviderProps {
  children: JSX.Element;
}

` : ''}export function AuthProvider({ children }${ts ? ': AuthProviderProps' : ''}) {
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      sessionSignal.set(session);
      userSignal.set(session?.user ?? null);
      loadingSignal.set(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      sessionSignal.set(session);
      userSignal.set(session?.user ?? null);
      loadingSignal.set(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SupabaseAuthContext.Provider
      value={{
        supabase,
        user: userSignal.get(),
        session: sessionSignal.get(),
        loading: loadingSignal.get(),
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
}
`;
}
function generateNextAuthProvider(ts) {
    return `/**
 * NextAuth Provider Adapter for PhilJS
 *
 * Adapts NextAuth to work with PhilJS
 */

import { SessionProvider } from 'next-auth/react';
${ts ? `import type { JSX } from '@philjs/core';
import type { Session } from 'next-auth';

interface AuthProviderProps {
  children: JSX.Element;
  session?: Session | null;
}
` : ''}
export function AuthProvider({ children, session }${ts ? ': AuthProviderProps' : ''}) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}
`;
}
function generateCustomProvider(ts) {
    return `/**
 * Custom Authentication Provider
 *
 * Manages custom authentication state
 */

import { createContext, useEffect } from '@philjs/core';
import { signal, computed } from '@philjs/core/signals';
import { authConfig } from './config${ts ? '.js' : ''}';
${ts ? `import type { JSX } from '@philjs/core';
import type { User } from './config${ts ? '.js' : ''}';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}
` : ''}
// Auth state signals
const userSignal = signal${ts ? '<User | null>' : ''}(null);
const tokenSignal = signal${ts ? '<string | null>' : ''}(null);
const loadingSignal = signal(true);

const isAuthenticated = computed(() => !!userSignal.get() && !!tokenSignal.get());

// Auth context
export const AuthContext = createContext${ts ? '<AuthContextValue>' : ''}({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  refreshToken: async () => {},
});

${ts ? `interface AuthProviderProps {
  children: JSX.Element;
}

` : ''}/**
 * Authentication Provider Component
 */
export function AuthProvider({ children }${ts ? ': AuthProviderProps' : ''}) {
  // Load initial auth state
  useEffect(() => {
    loadAuthState();
  }, []);

  const login = async (email${ts ? ': string' : ''}, password${ts ? ': string' : ''}) => {
    try {
      loadingSignal.set(true);
      const response = await fetch(\`\${authConfig.apiUrl}\${authConfig.endpoints.login}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      tokenSignal.set(data.token);
      userSignal.set(data.user);

      // Store in localStorage
      localStorage.setItem(authConfig.tokenKey, data.token);
      if (data.refreshToken) {
        localStorage.setItem(authConfig.refreshTokenKey, data.refreshToken);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      loadingSignal.set(false);
    }
  };

  const signup = async (email${ts ? ': string' : ''}, password${ts ? ': string' : ''}, name${ts ? '?: string' : ''}) => {
    try {
      loadingSignal.set(true);
      const response = await fetch(\`\${authConfig.apiUrl}\${authConfig.endpoints.signup}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        throw new Error('Signup failed');
      }

      const data = await response.json();

      tokenSignal.set(data.token);
      userSignal.set(data.user);

      localStorage.setItem(authConfig.tokenKey, data.token);
      if (data.refreshToken) {
        localStorage.setItem(authConfig.refreshTokenKey, data.refreshToken);
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      loadingSignal.set(false);
    }
  };

  const logout = async () => {
    try {
      const token = tokenSignal.get();
      if (token) {
        await fetch(\`\${authConfig.apiUrl}\${authConfig.endpoints.logout}\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      userSignal.set(null);
      tokenSignal.set(null);
      localStorage.removeItem(authConfig.tokenKey);
      localStorage.removeItem(authConfig.refreshTokenKey);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem(authConfig.refreshTokenKey);
      if (!refreshToken) return;

      const response = await fetch(\`\${authConfig.apiUrl}\${authConfig.endpoints.refresh}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      tokenSignal.set(data.token);
      localStorage.setItem(authConfig.tokenKey, data.token);
    } catch (error) {
      console.error('Refresh token error:', error);
      await logout();
    }
  };

  const loadAuthState = async () => {
    try {
      const token = localStorage.getItem(authConfig.tokenKey);
      if (!token) {
        loadingSignal.set(false);
        return;
      }

      tokenSignal.set(token);

      // Fetch current user
      const response = await fetch(\`\${authConfig.apiUrl}\${authConfig.endpoints.me}\`, {
        headers: { 'Authorization': \`Bearer \${token}\` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const user = await response.json();
      userSignal.set(user);
    } catch (error) {
      console.error('Load auth state error:', error);
      await logout();
    } finally {
      loadingSignal.set(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: userSignal.get(),
        token: tokenSignal.get(),
        isAuthenticated: isAuthenticated.get(),
        loading: loadingSignal.get(),
        login,
        signup,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
`;
}
/**
 * Generate auth hooks
 */
async function generateAuthHooks(provider, authDir, typescript) {
    const ext = typescript ? 'ts' : 'js';
    const hooksPath = path.join(authDir, `hooks.${ext}`);
    let content = '';
    switch (provider) {
        case 'clerk':
            content = generateClerkHooks(typescript);
            break;
        case 'auth0':
            content = generateAuth0Hooks(typescript);
            break;
        case 'supabase':
            content = generateSupabaseHooks(typescript);
            break;
        case 'nextauth':
            content = generateNextAuthHooks(typescript);
            break;
        case 'custom':
            content = generateCustomHooks(typescript);
            break;
    }
    await fs.writeFile(hooksPath, content);
    console.log(pc.green(`  ✓ Created auth/hooks.${ext}`));
}
function generateClerkHooks(ts) {
    return `/**
 * Clerk Authentication Hooks
 */

import { useUser as useClerkUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
${ts ? `import type { User } from './config.js';\n` : ''}
/**
 * Hook to access current user
 */
export function useUser()${ts ? ': User | null' : ''} {
  const { user, isLoaded } = useClerkUser();

  if (!isLoaded || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress,
    name: user.fullName ?? user.firstName ?? undefined,
    avatar: user.imageUrl,
    metadata: user.publicMetadata,
  };
}

/**
 * Hook to access authentication functions
 */
export function useAuth() {
  const { isSignedIn, isLoaded, signOut } = useClerkAuth();
  const user = useUser();

  return {
    user,
    isAuthenticated: isSignedIn ?? false,
    isLoading: !isLoaded,
    logout: signOut,
  };
}
`;
}
function generateAuth0Hooks(ts) {
    return `/**
 * Auth0 Authentication Hooks
 */

import { useAuth0 } from '@auth0/auth0-react';
${ts ? `import type { User } from './config.js';\n` : ''}
/**
 * Hook to access current user
 */
export function useUser()${ts ? ': User | null' : ''} {
  const { user, isLoading } = useAuth0();

  if (isLoading || !user) {
    return null;
  }

  return {
    id: user.sub ?? '',
    email: user.email,
    name: user.name,
    avatar: user.picture,
    metadata: user,
  };
}

/**
 * Hook to access authentication functions
 */
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();

  return {
    user: useUser(),
    isAuthenticated,
    isLoading,
    login: loginWithRedirect,
    logout: () => auth0Logout({ logoutParams: { returnTo: window.location.origin } }),
    getAccessToken: getAccessTokenSilently,
  };
}
`;
}
function generateSupabaseHooks(ts) {
    return `/**
 * Supabase Authentication Hooks
 */

import { useContext } from '@philjs/core';
import { SupabaseAuthContext, supabase } from './AuthProvider${ts ? '.js' : ''}';
${ts ? `import type { User } from './config.js';\n` : ''}
/**
 * Hook to access current user
 */
export function useUser()${ts ? ': User | null' : ''} {
  const { user } = useContext(SupabaseAuthContext);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name ?? user.user_metadata?.full_name,
    avatar: user.user_metadata?.avatar_url,
    metadata: user.user_metadata,
  };
}

/**
 * Hook to access authentication functions
 */
export function useAuth() {
  const { user, session, loading } = useContext(SupabaseAuthContext);

  const login = async (email${ts ? ': string' : ''}, password${ts ? ': string' : ''}) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (email${ts ? ': string' : ''}, password${ts ? ': string' : ''}) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const loginWithProvider = async (provider${ts ? ': "github" | "google" | "gitlab"' : ''}) => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) throw error;
  };

  return {
    user: useUser(),
    session,
    isAuthenticated: !!user,
    isLoading: loading,
    login,
    signup,
    logout,
    loginWithProvider,
  };
}
`;
}
function generateNextAuthHooks(ts) {
    return `/**
 * NextAuth Hooks for PhilJS
 */

import { useSession } from 'next-auth/react';
${ts ? `import type { User } from './config.js';\n` : ''}
/**
 * Hook to access current user
 */
export function useUser()${ts ? ': User | null' : ''} {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  return {
    id: user.id ?? '',
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    avatar: user.image ?? undefined,
    metadata: user,
  };
}

/**
 * Hook to access authentication functions
 */
export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: useUser(),
    session,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  };
}
`;
}
function generateCustomHooks(ts) {
    return `/**
 * Custom Authentication Hooks
 */

import { useContext } from '@philjs/core';
import { AuthContext } from './AuthProvider${ts ? '.js' : ''}';
${ts ? `import type { User } from './config.js';\n` : ''}
/**
 * Hook to access current user
 */
export function useUser()${ts ? ': User | null' : ''} {
  const { user } = useContext(AuthContext);
  return user;
}

/**
 * Hook to access authentication functions
 */
export function useAuth() {
  return useContext(AuthContext);
}
`;
}
/**
 * Generate auth middleware
 */
async function generateAuthMiddleware(provider, directory, typescript) {
    const ext = typescript ? 'ts' : 'js';
    const middlewarePath = path.join(process.cwd(), directory, `middleware.${ext}`);
    const content = `/**
 * Authentication Middleware
 *
 * Protects routes that require authentication
 */

${provider === 'clerk' ? `import { authMiddleware } from '@clerk/clerk-react';

export default authMiddleware({
  publicRoutes: ['/', '/auth/sign-in', '/auth/sign-up'],
  ignoredRoutes: ['/api/public'],
});
` : provider === 'nextauth' ? `import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};
` : `// Custom middleware implementation
export async function authMiddleware(req${typescript ? ': Request' : ''}, next${typescript ? ': () => Response' : ''}) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify token here
  // ...

  return next();
}
`}`;
    await fs.writeFile(middlewarePath, content);
    console.log(pc.green(`  ✓ Created middleware.${ext}`));
}
/**
 * Generate login form component
 */
async function generateLoginForm(provider, uiDir, ext) {
    const content = `/**
 * Login Form Component
 */

import { signal } from '@philjs/core/signals';
import { useAuth } from '../hooks${ext.startsWith('t') ? '.js' : ''}';
${ext.startsWith('t') ? `import type { JSX } from '@philjs/core';\n` : ''}
const emailSignal = signal('');
const passwordSignal = signal('');
const errorSignal = signal${ext.startsWith('t') ? '<string | null>' : ''}(null);
const loadingSignal = signal(false);

export function LoginForm() {
  const auth = useAuth();

  const handleSubmit = async (e${ext.startsWith('t') ? ': Event' : ''}) => {
    e.preventDefault();
    errorSignal.set(null);
    loadingSignal.set(true);

    try {
      ${provider === 'custom' ? `await auth.login(emailSignal.get(), passwordSignal.get());` :
        provider === 'supabase' ? `await auth.login(emailSignal.get(), passwordSignal.get());` :
            `// Login handled by ${provider} provider`}

      // Redirect after successful login
      window.location.href = '/dashboard';
    } catch (err) {
      errorSignal.set(err instanceof Error ? err.message : 'Login failed');
    } finally {
      loadingSignal.set(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>

      {errorSignal.get() && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {errorSignal.get()}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={emailSignal.get()}
            onInput={(e) => emailSignal.set(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={passwordSignal.get()}
            onInput={(e) => passwordSignal.set(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loadingSignal.get()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loadingSignal.get() ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-600">
        <a href="/auth/forgot-password" className="text-blue-600 hover:underline">
          Forgot password?
        </a>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <a href="/auth/sign-up" className="text-blue-600 hover:underline">
          Sign up
        </a>
      </div>
    </div>
  );
}
`;
    await fs.writeFile(path.join(uiDir, `LoginForm.${ext}`), content);
    console.log(pc.green(`  ✓ Created auth/components/LoginForm.${ext}`));
}
/**
 * Generate signup form component
 */
async function generateSignupForm(provider, uiDir, ext) {
    const content = `/**
 * Signup Form Component
 */

import { signal } from '@philjs/core/signals';
import { useAuth } from '../hooks${ext.startsWith('t') ? '.js' : ''}';
${ext.startsWith('t') ? `import type { JSX } from '@philjs/core';\n` : ''}
const nameSignal = signal('');
const emailSignal = signal('');
const passwordSignal = signal('');
const confirmPasswordSignal = signal('');
const errorSignal = signal${ext.startsWith('t') ? '<string | null>' : ''}(null);
const loadingSignal = signal(false);

export function SignupForm() {
  const auth = useAuth();

  const handleSubmit = async (e${ext.startsWith('t') ? ': Event' : ''}) => {
    e.preventDefault();
    errorSignal.set(null);

    // Validate passwords match
    if (passwordSignal.get() !== confirmPasswordSignal.get()) {
      errorSignal.set('Passwords do not match');
      return;
    }

    loadingSignal.set(true);

    try {
      ${provider === 'custom' ? `await auth.signup(emailSignal.get(), passwordSignal.get(), nameSignal.get());` :
        provider === 'supabase' ? `await auth.signup(emailSignal.get(), passwordSignal.get());` :
            `// Signup handled by ${provider} provider`}

      // Redirect after successful signup
      window.location.href = '/dashboard';
    } catch (err) {
      errorSignal.set(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      loadingSignal.set(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

      {errorSignal.get() && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {errorSignal.get()}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={nameSignal.get()}
            onInput={(e) => nameSignal.set(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={emailSignal.get()}
            onInput={(e) => emailSignal.set(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={passwordSignal.get()}
            onInput={(e) => passwordSignal.set(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPasswordSignal.get()}
            onInput={(e) => confirmPasswordSignal.set(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loadingSignal.get()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loadingSignal.get() ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a href="/auth/sign-in" className="text-blue-600 hover:underline">
          Sign in
        </a>
      </div>
    </div>
  );
}
`;
    await fs.writeFile(path.join(uiDir, `SignupForm.${ext}`), content);
    console.log(pc.green(`  ✓ Created auth/components/SignupForm.${ext}`));
}
/**
 * Generate password reset component
 */
async function generatePasswordReset(provider, uiDir, ext) {
    const content = `/**
 * Password Reset Component
 */

import { signal } from '@philjs/core/signals';
${ext.startsWith('t') ? `import type { JSX } from '@philjs/core';\n` : ''}
const emailSignal = signal('');
const successSignal = signal(false);
const errorSignal = signal${ext.startsWith('t') ? '<string | null>' : ''}(null);
const loadingSignal = signal(false);

export function PasswordReset() {
  const handleSubmit = async (e${ext.startsWith('t') ? ': Event' : ''}) => {
    e.preventDefault();
    errorSignal.set(null);
    loadingSignal.set(true);

    try {
      // Password reset logic - sends reset email to user
      ${provider === 'supabase' ? `
      const { error } = await supabase.auth.resetPasswordForEmail(emailSignal.get(), {
        redirectTo: \`\${window.location.origin}/auth/reset-password\`,
      });
      if (error) throw error;
      ` : `
      // Call your password reset API endpoint
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailSignal.get() }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reset email');
      }
      `}

      successSignal.set(true);
    } catch (err) {
      errorSignal.set(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      loadingSignal.set(false);
    }
  };

  if (successSignal.get()) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="mb-4 text-green-600 text-5xl">✓</div>
          <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to <strong>{emailSignal.get()}</strong>
          </p>
          <a
            href="/auth/sign-in"
            className="text-blue-600 hover:underline"
          >
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>

      {errorSignal.get() && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {errorSignal.get()}
        </div>
      )}

      <p className="text-gray-600 mb-6 text-center">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={emailSignal.get()}
            onInput={(e) => emailSignal.set(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={loadingSignal.get()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loadingSignal.get() ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-600">
        <a href="/auth/sign-in" className="text-blue-600 hover:underline">
          Back to sign in
        </a>
      </div>
    </div>
  );
}
`;
    await fs.writeFile(path.join(uiDir, `PasswordReset.${ext}`), content);
    console.log(pc.green(`  ✓ Created auth/components/PasswordReset.${ext}`));
}
/**
 * Generate profile form component
 */
async function generateProfileForm(provider, uiDir, ext) {
    const content = `/**
 * Profile Form Component
 */

import { signal, useEffect } from '@philjs/core';
import { useUser } from '../hooks${ext.startsWith('t') ? '.js' : ''}';
${ext.startsWith('t') ? `import type { JSX } from '@philjs/core';\n` : ''}
const nameSignal = signal('');
const emailSignal = signal('');
const successSignal = signal(false);
const errorSignal = signal${ext.startsWith('t') ? '<string | null>' : ''}(null);
const loadingSignal = signal(false);

export function ProfileForm() {
  const user = useUser();

  useEffect(() => {
    if (user) {
      nameSignal.set(user.name || '');
      emailSignal.set(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e${ext.startsWith('t') ? ': Event' : ''}) => {
    e.preventDefault();
    errorSignal.set(null);
    successSignal.set(false);
    loadingSignal.set(true);

    try {
      // Update user profile via API
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameSignal.get(),
          email: emailSignal.get(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      successSignal.set(true);
      setTimeout(() => successSignal.set(false), 3000);
    } catch (err) {
      errorSignal.set(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      loadingSignal.set(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <p className="text-center text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>

      {successSignal.get() && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">
          Profile updated successfully!
        </div>
      )}

      {errorSignal.get() && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {errorSignal.get()}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={nameSignal.get()}
            onInput={(e) => nameSignal.set(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={emailSignal.get()}
            onInput={(e) => emailSignal.set(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loadingSignal.get()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loadingSignal.get() ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
`;
    await fs.writeFile(path.join(uiDir, `ProfileForm.${ext}`), content);
    console.log(pc.green(`  ✓ Created auth/components/ProfileForm.${ext}`));
}
/**
 * Generate protected route utilities
 */
async function generateProtectedRouteUtils(provider, authDir, ext) {
    const content = `/**
 * Protected Route Utilities
 */

import { useAuth } from './hooks${ext.startsWith('t') ? '.js' : ''}';
${ext.startsWith('t') ? `import type { JSX } from '@philjs/core';

interface ProtectedRouteProps {
  children: JSX.Element;
  redirectTo?: string;
  fallback?: JSX.Element;
}
` : ''}
/**
 * HOC to protect routes that require authentication
 */
export function withAuth(Component${ext.startsWith('t') ? ': (props: any) => JSX.Element' : ''}) {
  return function ProtectedComponent(props${ext.startsWith('t') ? ': any' : ''}) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/sign-in';
      }
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Component to protect routes
 */
export function ProtectedRoute({
  children,
  redirectTo = '/auth/sign-in',
  fallback
}${ext.startsWith('t') ? ': ProtectedRouteProps' : ''}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login
    if (typeof window !== 'undefined') {
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = \`\${redirectTo}?returnUrl=\${returnUrl}\`;
    }
    return null;
  }

  return children;
}

/**
 * Check if user has specific role
 */
export function requireRole(role${ext.startsWith('t') ? ': string' : ''}) {
  return function (Component${ext.startsWith('t') ? ': (props: any) => JSX.Element' : ''}) {
    return function RoleProtectedComponent(props${ext.startsWith('t') ? ': any' : ''}) {
      const { user, isAuthenticated } = useAuth();

      if (!isAuthenticated || !user) {
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/sign-in';
        }
        return null;
      }

      // Check role (adjust based on your user structure)
      const userRole = user.metadata?.role || user.role;
      if (userRole !== role) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to access this page.</p>
            </div>
          </div>
        );
      }

      return <Component {...props} />;
    };
  };
}
`;
    await fs.writeFile(path.join(authDir, `protected.${ext}`), content);
    console.log(pc.green(`  ✓ Created auth/protected.${ext}`));
}
/**
 * Generate AuthGuard component
 */
async function generateAuthGuard(provider, authDir, ext) {
    const content = `/**
 * AuthGuard Component
 *
 * Conditionally render content based on authentication state
 */

import { useAuth } from './hooks${ext.startsWith('t') ? '.js' : ''}';
${ext.startsWith('t') ? `import type { JSX } from '@philjs/core';

interface AuthGuardProps {
  children: JSX.Element;
  fallback?: JSX.Element;
  requireAuth?: boolean;
  requireUnauth?: boolean;
  loading?: JSX.Element;
}
` : ''}
/**
 * Guard component that shows/hides content based on auth state
 */
export function AuthGuard({
  children,
  fallback = null,
  requireAuth = true,
  requireUnauth = false,
  loading
}${ext.startsWith('t') ? ': AuthGuardProps' : ''}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return loading || (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Require authentication
  if (requireAuth && !isAuthenticated) {
    return fallback;
  }

  // Require NOT authenticated (e.g., for login page)
  if (requireUnauth && isAuthenticated) {
    return fallback;
  }

  return children;
}

${ext.startsWith('t') ? `interface ShowForAuthProps {
  children: JSX.Element;
  fallback?: JSX.Element;
}
` : ''}
/**
 * Show content only for authenticated users
 */
export function ShowForAuth({ children, fallback = null }${ext.startsWith('t') ? ': ShowForAuthProps' : ''}) {
  return (
    <AuthGuard requireAuth={true} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

/**
 * Show content only for unauthenticated users
 */
export function ShowForGuest({ children, fallback = null }${ext.startsWith('t') ? ': ShowForAuthProps' : ''}) {
  return (
    <AuthGuard requireAuth={false} requireUnauth={true} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}
`;
    await fs.writeFile(path.join(authDir, `AuthGuard.${ext}`), content);
    console.log(pc.green(`  ✓ Created auth/AuthGuard.${ext}`));
}
/**
 * Generate example pages
 */
async function generateExamplePages(provider, directory, ext) {
    const pagesDir = path.join(process.cwd(), directory, 'pages', 'auth');
    await fs.mkdir(pagesDir, { recursive: true });
    // Login page
    const loginPage = `import { LoginForm } from '../../auth/components/LoginForm${ext.startsWith('t') ? '.js' : ''}';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <LoginForm />
    </div>
  );
}
`;
    await fs.writeFile(path.join(pagesDir, `sign-in.${ext}`), loginPage);
    console.log(pc.green(`  ✓ Created pages/auth/sign-in.${ext}`));
    // Signup page
    const signupPage = `import { SignupForm } from '../../auth/components/SignupForm${ext.startsWith('t') ? '.js' : ''}';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <SignupForm />
    </div>
  );
}
`;
    await fs.writeFile(path.join(pagesDir, `sign-up.${ext}`), signupPage);
    console.log(pc.green(`  ✓ Created pages/auth/sign-up.${ext}`));
    // Password reset page
    const resetPage = `import { PasswordReset } from '../../auth/components/PasswordReset${ext.startsWith('t') ? '.js' : ''}';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <PasswordReset />
    </div>
  );
}
`;
    await fs.writeFile(path.join(pagesDir, `forgot-password.${ext}`), resetPage);
    console.log(pc.green(`  ✓ Created pages/auth/forgot-password.${ext}`));
    // Profile page
    const profilePage = `import { ProfileForm } from '../../auth/components/ProfileForm${ext.startsWith('t') ? '.js' : ''}';
import { ProtectedRoute } from '../../auth/protected${ext.startsWith('t') ? '.js' : ''}';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <ProfileForm />
      </div>
    </ProtectedRoute>
  );
}
`;
    await fs.writeFile(path.join(pagesDir, `profile.${ext}`), profilePage);
    console.log(pc.green(`  ✓ Created pages/auth/profile.${ext}`));
}
/**
 * Generate .env.example
 */
async function generateEnvExample(provider) {
    let envContent = `# Authentication Environment Variables\n\n`;
    switch (provider) {
        case 'clerk':
            envContent += `# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
`;
            break;
        case 'auth0':
            envContent += `# Auth0
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
VITE_AUTH0_AUDIENCE=your-api-audience
`;
            break;
        case 'supabase':
            envContent += `# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
`;
            break;
        case 'nextauth':
            envContent += `# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
`;
            break;
        case 'custom':
            envContent += `# Custom Auth
VITE_API_URL=http://localhost:3000/api
JWT_SECRET=your-jwt-secret-key
`;
            break;
    }
    const envPath = path.join(process.cwd(), '.env.example');
    try {
        // Try to append to existing .env.example
        const existing = await fs.readFile(envPath, 'utf-8');
        await fs.writeFile(envPath, existing + '\n' + envContent);
    }
    catch {
        // Create new .env.example
        await fs.writeFile(envPath, envContent);
    }
    console.log(pc.green(`  ✓ Updated .env.example`));
}
/**
 * Print setup instructions
 */
function printSetupInstructions(provider) {
    console.log(pc.white('1. Install required dependencies:'));
    switch (provider) {
        case 'clerk':
            console.log(pc.dim('   npm install @clerk/clerk-react'));
            break;
        case 'auth0':
            console.log(pc.dim('   npm install @auth0/auth0-react'));
            break;
        case 'supabase':
            console.log(pc.dim('   npm install @supabase/supabase-js'));
            break;
        case 'nextauth':
            break;
        case 'custom':
            console.log(pc.dim('   npm install philjs-auth jsonwebtoken'));
            break;
    }
    console.log(pc.white('\n2. Configure environment variables:'));
    console.log(pc.dim('   Copy .env.example to .env and fill in your credentials'));
    console.log(pc.white('\n3. Wrap your app with AuthProvider:'));
    console.log(pc.dim(`   import { AuthProvider } from './auth/AuthProvider';

   export function App() {
     return (
       <AuthProvider>
         <YourApp />
       </AuthProvider>
     );
   }`));
    console.log(pc.white('\n4. Use authentication in your components:'));
    console.log(pc.dim(`   import { useAuth, useUser } from './auth/hooks';

   function MyComponent() {
     const { isAuthenticated, logout } = useAuth();
     const user = useUser();

     // Your component logic
   }`));
    console.log(pc.dim(`   import { ProtectedRoute } from './auth/protected';

   <ProtectedRoute>
     <YourProtectedPage />
   </ProtectedRoute>`));
    if (provider !== 'custom') {
        console.log(pc.yellow(`\n⚠️  Don't forget to set up your ${provider} account and get your credentials!`));
    }
}
//# sourceMappingURL=auth.js.map