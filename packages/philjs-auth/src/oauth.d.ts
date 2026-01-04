/**
 * OAuth 2.0 provider implementations
 */
import type { OAuthProvider, OAuthConfig, User } from './types.js';
/**
 * Built-in OAuth providers
 */
export declare const OAuthProviders: {
    google: (clientId: string, clientSecret: string, redirectUri: string) => OAuthProvider;
    github: (clientId: string, clientSecret: string, redirectUri: string) => OAuthProvider;
    discord: (clientId: string, clientSecret: string, redirectUri: string) => OAuthProvider;
    microsoft: (clientId: string, clientSecret: string, redirectUri: string) => OAuthProvider;
    twitter: (clientId: string, clientSecret: string, redirectUri: string) => OAuthProvider;
};
/**
 * OAuth Manager class
 */
export declare class OAuthManager {
    private config;
    constructor(config: OAuthConfig);
    /**
     * Get authorization URL for a provider
     * @param providerName - The name of the OAuth provider
     * @param state - Required state parameter for CSRF protection
     * @param pkce - Optional PKCE parameters (recommended for public clients)
     */
    getAuthUrl(providerName: string, state: string, pkce?: {
        codeChallenge: string;
        codeChallengeMethod: 'S256';
    }): string;
    /**
     * Exchange authorization code for access token
     * @param providerName - The name of the OAuth provider
     * @param code - The authorization code
     * @param codeVerifier - The PKCE code verifier (if PKCE was used in auth request)
     */
    exchangeCode(providerName: string, code: string, codeVerifier?: string): Promise<{
        accessToken: string;
        refreshToken?: string;
        expiresIn?: number;
    }>;
    /**
     * Get user information from provider
     */
    getUserInfo(providerName: string, accessToken: string): Promise<User>;
    /**
     * Complete OAuth flow (exchange code + get user info)
     */
    completeAuth(providerName: string, code: string): Promise<{
        user: User;
        accessToken: string;
        refreshToken?: string;
        expiresIn?: number;
    }>;
    /**
     * Normalize user data across different providers
     */
    private normalizeUserData;
    /**
     * Refresh access token
     */
    refreshAccessToken(providerName: string, refreshToken: string): Promise<{
        accessToken: string;
        expiresIn?: number;
    }>;
}
/**
 * Create an OAuth manager instance
 */
export declare function createOAuthManager(config: OAuthConfig): OAuthManager;
/**
 * Helper to generate a random state parameter for CSRF protection
 */
export declare function generateState(): string;
/**
 * Helper to validate state parameter using constant-time comparison
 */
export declare function validateState(received: string, expected: string): boolean;
/**
 * Generate a PKCE code verifier (43-128 character random string)
 */
export declare function generateCodeVerifier(length?: number): string;
/**
 * Generate a PKCE code challenge from a code verifier
 */
export declare function generateCodeChallenge(verifier: string): Promise<string>;
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
export declare function generatePKCE(): Promise<PKCEPair>;
//# sourceMappingURL=oauth.d.ts.map