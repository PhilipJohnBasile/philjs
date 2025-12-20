/**
 * PhilJS Auth - Authentication and authorization utilities
 * @packageDocumentation
 */

// Types
export type {
  User,
  AuthSession,
  AuthConfig,
  OAuthProvider,
  OAuthConfig,
  JWTPayload,
  JWTConfig,
  ProtectedRouteConfig
} from './types.js';

// Auth Provider Abstraction
export {
  BaseAuthProvider,
  AuthProviderFactory,
  type AuthProvider,
  type AuthProviderConfig,
  type AuthProviderContext,
} from './auth-provider.js';

// Provider Adapters
export { ClerkAuthProvider, type ClerkConfig } from './providers/clerk.js';
export { Auth0AuthProvider, type Auth0Config } from './providers/auth0.js';
export { SupabaseAuthProvider, type SupabaseConfig } from './providers/supabase.js';
export { NextAuthProvider, type NextAuthConfig } from './providers/next-auth.js';

// Hooks
export {
  useAuth,
  useUser,
  useSession,
  useIsAuthenticated,
  useAuthLoading,
  useHasPermission,
  useRequireAuth,
  useAccessToken,
  setAuthProvider,
  getAuthProvider,
} from './hooks.js';

// Protected Routes (Enhanced)
export {
  ProtectedRoute,
  withAuth,
  requireAuth,
  redirectToLogin,
  getRedirectUrl,
  redirectAfterLogin,
} from './protected-route.js';

export {
  withRole,
  withAnyRole,
  AuthGuard,
  ShowForAuth,
  ShowForGuest,
  ShowForRole,
  type AuthGuardProps,
  type ShowForAuthProps,
  type ShowForRoleProps,
} from './protected-routes.js';

// Session Management (Original)
export {
  SessionManager,
  createSessionManager,
  getDefaultSessionManager,
  setDefaultSessionManager
} from './session.js';

// Session Refresh Management
export {
  SessionRefreshManager,
  getSessionRefreshManager,
  startSessionRefresh,
  stopSessionRefresh,
  logoutEverywhere,
  SessionPersistence,
  type RefreshConfig,
} from './session-refresh.js';

// JWT utilities
export {
  JWTManager,
  createJWTManager,
  createToken,
  verifyToken,
  decodeToken
} from './jwt.js';

// OAuth providers
export {
  OAuthManager,
  OAuthProviders,
  createOAuthManager,
  generateState,
  validateState
} from './oauth.js';
