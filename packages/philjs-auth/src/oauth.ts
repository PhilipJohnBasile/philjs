/**
 * OAuth 2.0 provider implementations
 */

import type { OAuthProvider, OAuthConfig, User } from './types.js';

/**
 * Built-in OAuth providers
 */
export const OAuthProviders = {
  google: (clientId: string, clientSecret: string, redirectUri: string): OAuthProvider => ({
    name: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    clientId,
    clientSecret,
    redirectUri,
    scope: ['openid', 'email', 'profile']
  }),

  github: (clientId: string, clientSecret: string, redirectUri: string): OAuthProvider => ({
    name: 'GitHub',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    clientId,
    clientSecret,
    redirectUri,
    scope: ['read:user', 'user:email']
  }),

  discord: (clientId: string, clientSecret: string, redirectUri: string): OAuthProvider => ({
    name: 'Discord',
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userInfoUrl: 'https://discord.com/api/users/@me',
    clientId,
    clientSecret,
    redirectUri,
    scope: ['identify', 'email']
  }),

  microsoft: (clientId: string, clientSecret: string, redirectUri: string): OAuthProvider => ({
    name: 'Microsoft',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    clientId,
    clientSecret,
    redirectUri,
    scope: ['openid', 'email', 'profile']
  }),

  twitter: (clientId: string, clientSecret: string, redirectUri: string): OAuthProvider => ({
    name: 'Twitter',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    userInfoUrl: 'https://api.twitter.com/2/users/me',
    clientId,
    clientSecret,
    redirectUri,
    scope: ['tweet.read', 'users.read']
  })
};

/**
 * OAuth Manager class
 */
export class OAuthManager {
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  /**
   * Get authorization URL for a provider
   * @param providerName - The name of the OAuth provider
   * @param state - Required state parameter for CSRF protection
   * @param pkce - Optional PKCE parameters (recommended for public clients)
   */
  getAuthUrl(
    providerName: string,
    state: string,
    pkce?: { codeChallenge: string; codeChallengeMethod: 'S256' }
  ): string {
    const provider = this.config.providers[providerName];
    if (!provider) {
      throw new Error(`Unknown OAuth provider: ${providerName}`);
    }

    if (!state) {
      throw new Error('State parameter is required for CSRF protection');
    }

    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: provider.redirectUri,
      response_type: 'code',
      scope: provider.scope.join(' '),
      state
    });

    // Add PKCE parameters if provided
    if (pkce) {
      params.set('code_challenge', pkce.codeChallenge);
      params.set('code_challenge_method', pkce.codeChallengeMethod);
    }

    return `${provider.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param providerName - The name of the OAuth provider
   * @param code - The authorization code
   * @param codeVerifier - The PKCE code verifier (if PKCE was used in auth request)
   */
  async exchangeCode(
    providerName: string,
    code: string,
    codeVerifier?: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    const provider = this.config.providers[providerName];
    if (!provider) {
      throw new Error(`Unknown OAuth provider: ${providerName}`);
    }

    const bodyParams: Record<string, string> = {
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: provider.redirectUri
    };

    // Add PKCE code_verifier if provided
    if (codeVerifier) {
      bodyParams['code_verifier'] = codeVerifier;
    }

    const body = new URLSearchParams(bodyParams);

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    };
  }

  /**
   * Get user information from provider
   */
  async getUserInfo(providerName: string, accessToken: string): Promise<User> {
    const provider = this.config.providers[providerName];
    if (!provider) {
      throw new Error(`Unknown OAuth provider: ${providerName}`);
    }

    const response = await fetch(provider.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get user info: ${error}`);
    }

    const data = await response.json();

    // Normalize user data across providers
    return this.normalizeUserData(providerName, data);
  }

  /**
   * Complete OAuth flow (exchange code + get user info)
   */
  async completeAuth(providerName: string, code: string): Promise<{
    user: User;
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }> {
    const tokens = await this.exchangeCode(providerName, code);
    const user = await this.getUserInfo(providerName, tokens.accessToken);

    return {
      user,
      ...tokens
    };
  }

  /**
   * Normalize user data across different providers
   */
  private normalizeUserData(providerName: string, data: any): User {
    switch (providerName) {
      case 'google':
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          avatar: data.picture,
          metadata: {
            provider: 'google',
            verified: data.verified_email
          }
        };

      case 'github':
        return {
          id: data.id.toString(),
          email: data.email,
          name: data.name || data.login,
          avatar: data.avatar_url,
          metadata: {
            provider: 'github',
            username: data.login,
            bio: data.bio
          }
        };

      case 'discord':
        return {
          id: data.id,
          email: data.email,
          name: data.username,
          avatar: data.avatar
            ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
            : undefined,
          metadata: {
            provider: 'discord',
            discriminator: data.discriminator,
            verified: data.verified
          }
        };

      case 'microsoft':
        return {
          id: data.id,
          email: data.mail || data.userPrincipalName,
          name: data.displayName,
          avatar: undefined,
          metadata: {
            provider: 'microsoft',
            jobTitle: data.jobTitle
          }
        };

      case 'twitter':
        return {
          id: data.id || data.data?.id,
          email: undefined, // Twitter doesn't provide email by default
          name: data.name || data.data?.name,
          avatar: data.profile_image_url || data.data?.profile_image_url,
          metadata: {
            provider: 'twitter',
            username: data.username || data.data?.username
          }
        };

      default:
        // Generic fallback
        return {
          id: data.id || data.sub,
          email: data.email,
          name: data.name || data.username,
          avatar: data.avatar || data.picture || data.avatar_url,
          metadata: {
            provider: providerName
          }
        };
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(
    providerName: string,
    refreshToken: string
  ): Promise<{ accessToken: string; expiresIn?: number }> {
    const provider = this.config.providers[providerName];
    if (!provider) {
      throw new Error(`Unknown OAuth provider: ${providerName}`);
    }

    const body = new URLSearchParams({
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in
    };
  }
}

/**
 * Create an OAuth manager instance
 */
export function createOAuthManager(config: OAuthConfig): OAuthManager {
  return new OAuthManager(config);
}

/**
 * Helper to generate a random state parameter for CSRF protection
 */
export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Helper to validate state parameter using constant-time comparison
 */
export function validateState(received: string, expected: string): boolean {
  if (typeof received !== 'string' || typeof expected !== 'string') {
    return false;
  }

  const encoder = new TextEncoder();
  const bufA = encoder.encode(received);
  const bufB = encoder.encode(expected);

  if (bufA.length !== bufB.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < bufA.length; i++) {
    diff |= bufA[i]! ^ bufB[i]!;
  }

  return diff === 0;
}

// ============================================================================
// PKCE Support
// ============================================================================

/**
 * Generate a PKCE code verifier (43-128 character random string)
 */
export function generateCodeVerifier(length: number = 64): string {
  if (length < 43 || length > 128) {
    throw new Error('Code verifier must be between 43 and 128 characters');
  }
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  // Use URL-safe base64 alphabet
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

/**
 * Generate a PKCE code challenge from a code verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const digestArray = new Uint8Array(digest);
  // Base64 URL encode the digest
  const base64 = btoa(String.fromCharCode(...digestArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return base64;
}

/**
 * PKCE pair for OAuth flow
 */
export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

/**
 * Generate a PKCE pair for use in OAuth flows
 */
export async function generatePKCE(): Promise<PKCEPair> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256'
  };
}
