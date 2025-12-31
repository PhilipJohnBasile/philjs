/**
 * PhilJS Auth - Authentication and authorization utilities
 * @packageDocumentation
 */
export type { User, AuthSession, AuthConfig, OAuthProvider, OAuthConfig, JWTPayload, JWTConfig, ProtectedRouteConfig } from './types.js';
export { BaseAuthProvider, AuthProviderFactory, type AuthProvider, type AuthProviderConfig, type AuthProviderContext, } from './auth-provider.js';
export { ClerkAuthProvider, type ClerkConfig } from './providers/clerk.js';
export { Auth0AuthProvider, type Auth0Config } from './providers/auth0.js';
export { SupabaseAuthProvider, type SupabaseConfig } from './providers/supabase.js';
export { NextAuthProvider, type NextAuthConfig } from './providers/next-auth.js';
export { useAuth, useUser, useSession, useIsAuthenticated, useAuthLoading, useHasPermission, useRequireAuth, useAccessToken, setAuthProvider, getAuthProvider, } from './hooks.js';
export { ProtectedRoute, withAuth, requireAuth, redirectToLogin, getRedirectUrl, redirectAfterLogin, } from './protected-route.js';
export { SessionManager, createSessionManager, getDefaultSessionManager, setDefaultSessionManager } from './session.js';
export { SessionRefreshManager, getSessionRefreshManager, startSessionRefresh, stopSessionRefresh, logoutEverywhere, SessionPersistence, type RefreshConfig, } from './session-refresh.js';
export { JWTManager, createJWTManager, createToken, verifyToken, decodeToken } from './jwt.js';
export { OAuthManager, OAuthProviders, createOAuthManager, generateState, validateState } from './oauth.js';
//# sourceMappingURL=index.d.ts.map