/**
 * Core authentication types for PhilJS Auth
 */

export interface User {
  id: string;
  email?: string | undefined;
  name?: string | undefined;
  avatar?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface AuthSession {
  user: User | null;
  token?: string | undefined;
  expiresAt?: number | undefined;
  refreshToken?: string | undefined;
}

export interface AuthConfig {
  sessionKey?: string | undefined;
  tokenKey?: string | undefined;
  cookieName?: string | undefined;
  cookieDomain?: string | undefined;
  cookieSecure?: boolean | undefined;
  cookieSameSite?: 'strict' | 'lax' | 'none' | undefined;
  sessionExpiry?: number | undefined; // in milliseconds
}

export interface OAuthProvider {
  name: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string[];
  redirectUri: string;
}

export interface OAuthConfig {
  providers: Record<string, OAuthProvider>;
}

export interface JWTPayload {
  sub: string;
  iat?: number | undefined;
  exp?: number | undefined;
  [key: string]: unknown;
}

export interface JWTConfig {
  secret: string;
  algorithm?: 'HS256' | 'HS384' | 'HS512' | undefined;
  expiresIn?: number | undefined; // in seconds
  issuer?: string | undefined;
  audience?: string | undefined;
}

export interface ProtectedRouteConfig {
  redirectTo?: string | undefined;
  checkAuth?: (() => boolean | Promise<boolean>) | undefined;
  onUnauthorized?: (() => void) | undefined;
}
