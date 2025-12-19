/**
 * Core authentication types for PhilJS Auth
 */

export interface User {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthSession {
  user: User | null;
  token?: string;
  expiresAt?: number;
  refreshToken?: string;
}

export interface AuthConfig {
  sessionKey?: string;
  tokenKey?: string;
  cookieName?: string;
  cookieDomain?: string;
  cookieSecure?: boolean;
  cookieSameSite?: 'strict' | 'lax' | 'none';
  sessionExpiry?: number; // in milliseconds
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
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export interface JWTConfig {
  secret: string;
  algorithm?: 'HS256' | 'HS384' | 'HS512';
  expiresIn?: number; // in seconds
  issuer?: string;
  audience?: string;
}

export interface ProtectedRouteConfig {
  redirectTo?: string;
  checkAuth?: () => boolean | Promise<boolean>;
  onUnauthorized?: () => void;
}
