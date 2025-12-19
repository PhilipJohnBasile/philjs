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

// Session management
export {
  SessionManager,
  createSessionManager,
  getDefaultSessionManager,
  setDefaultSessionManager
} from './session.js';

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

// Protected routes
export {
  ProtectedRoute,
  withAuth,
  requireAuth,
  useAuth,
  redirectToLogin,
  getRedirectUrl,
  redirectAfterLogin
} from './protected-route.js';
