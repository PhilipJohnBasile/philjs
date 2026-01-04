/**
 * PhilJS Auth - Authentication and authorization utilities
 * @packageDocumentation
 */
// Auth Provider Abstraction
export { BaseAuthProvider, AuthProviderFactory, } from './auth-provider.js';
// Provider Adapters
export { ClerkAuthProvider } from './providers/clerk.js';
export { Auth0AuthProvider } from './providers/auth0.js';
export { SupabaseAuthProvider } from './providers/supabase.js';
export { NextAuthProvider } from './providers/next-auth.js';
// Hooks
export { useAuth, useUser, useSession, useIsAuthenticated, useAuthLoading, useHasPermission, useRequireAuth, useAccessToken, setAuthProvider, getAuthProvider, } from './hooks.js';
// Protected Routes (Enhanced)
export { ProtectedRoute, withAuth, requireAuth, redirectToLogin, getRedirectUrl, redirectAfterLogin, } from './protected-route.js';
// Session Management (Original)
export { SessionManager, createSessionManager, getDefaultSessionManager, setDefaultSessionManager } from './session.js';
// Session Refresh Management
export { SessionRefreshManager, getSessionRefreshManager, startSessionRefresh, stopSessionRefresh, logoutEverywhere, SessionPersistence, } from './session-refresh.js';
// JWT utilities
export { JWTManager, createJWTManager, createToken, verifyToken, decodeToken } from './jwt.js';
// OAuth providers
export { OAuthManager, OAuthProviders, createOAuthManager, generateState, validateState } from './oauth.js';
//# sourceMappingURL=index.js.map