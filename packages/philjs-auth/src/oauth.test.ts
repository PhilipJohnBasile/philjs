/**
 * Comprehensive tests for OAuth module
 * Testing OAuth providers, auth flows, PKCE, state validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  OAuthProviders,
  OAuthManager,
  createOAuthManager,
  generateState,
  validateState,
  generateCodeVerifier,
  generateCodeChallenge,
  generatePKCE,
  type PKCEPair,
} from './oauth';

describe('OAuthProviders', () => {
  const mockCredentials = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'https://example.com/callback',
  };

  describe('Google provider', () => {
    it('should create Google OAuth provider', () => {
      const provider = OAuthProviders.google(
        mockCredentials.clientId,
        mockCredentials.clientSecret,
        mockCredentials.redirectUri
      );

      expect(provider.name).toBe('Google');
      expect(provider.authUrl).toBe('https://accounts.google.com/o/oauth2/v2/auth');
      expect(provider.tokenUrl).toBe('https://oauth2.googleapis.com/token');
      expect(provider.userInfoUrl).toBe('https://www.googleapis.com/oauth2/v2/userinfo');
      expect(provider.clientId).toBe(mockCredentials.clientId);
      expect(provider.clientSecret).toBe(mockCredentials.clientSecret);
      expect(provider.redirectUri).toBe(mockCredentials.redirectUri);
      expect(provider.scope).toContain('openid');
      expect(provider.scope).toContain('email');
      expect(provider.scope).toContain('profile');
    });
  });

  describe('GitHub provider', () => {
    it('should create GitHub OAuth provider', () => {
      const provider = OAuthProviders.github(
        mockCredentials.clientId,
        mockCredentials.clientSecret,
        mockCredentials.redirectUri
      );

      expect(provider.name).toBe('GitHub');
      expect(provider.authUrl).toBe('https://github.com/login/oauth/authorize');
      expect(provider.tokenUrl).toBe('https://github.com/login/oauth/access_token');
      expect(provider.userInfoUrl).toBe('https://api.github.com/user');
      expect(provider.scope).toContain('read:user');
      expect(provider.scope).toContain('user:email');
    });
  });

  describe('Discord provider', () => {
    it('should create Discord OAuth provider', () => {
      const provider = OAuthProviders.discord(
        mockCredentials.clientId,
        mockCredentials.clientSecret,
        mockCredentials.redirectUri
      );

      expect(provider.name).toBe('Discord');
      expect(provider.authUrl).toBe('https://discord.com/api/oauth2/authorize');
      expect(provider.tokenUrl).toBe('https://discord.com/api/oauth2/token');
      expect(provider.userInfoUrl).toBe('https://discord.com/api/users/@me');
      expect(provider.scope).toContain('identify');
      expect(provider.scope).toContain('email');
    });
  });

  describe('Microsoft provider', () => {
    it('should create Microsoft OAuth provider', () => {
      const provider = OAuthProviders.microsoft(
        mockCredentials.clientId,
        mockCredentials.clientSecret,
        mockCredentials.redirectUri
      );

      expect(provider.name).toBe('Microsoft');
      expect(provider.authUrl).toContain('login.microsoftonline.com');
      expect(provider.tokenUrl).toContain('login.microsoftonline.com');
      expect(provider.userInfoUrl).toBe('https://graph.microsoft.com/v1.0/me');
    });
  });

  describe('Twitter provider', () => {
    it('should create Twitter OAuth provider', () => {
      const provider = OAuthProviders.twitter(
        mockCredentials.clientId,
        mockCredentials.clientSecret,
        mockCredentials.redirectUri
      );

      expect(provider.name).toBe('Twitter');
      expect(provider.authUrl).toBe('https://twitter.com/i/oauth2/authorize');
      expect(provider.tokenUrl).toBe('https://api.twitter.com/2/oauth2/token');
      expect(provider.userInfoUrl).toBe('https://api.twitter.com/2/users/me');
      expect(provider.scope).toContain('tweet.read');
      expect(provider.scope).toContain('users.read');
    });
  });
});

describe('OAuthManager', () => {
  const mockConfig = {
    providers: {
      google: OAuthProviders.google(
        'google-client-id',
        'google-client-secret',
        'https://example.com/callback/google'
      ),
      github: OAuthProviders.github(
        'github-client-id',
        'github-client-secret',
        'https://example.com/callback/github'
      ),
    },
  };

  let manager: OAuthManager;

  beforeEach(() => {
    manager = new OAuthManager(mockConfig);
  });

  describe('getAuthUrl', () => {
    it('should generate authorization URL with required state', () => {
      const state = generateState();
      const url = manager.getAuthUrl('google', state);

      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('client_id=google-client-id');
      expect(url).toContain('redirect_uri=');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=');
      expect(url).toContain(`state=${state}`);
    });

    it('should throw error for unknown provider', () => {
      expect(() => manager.getAuthUrl('unknown', 'state')).toThrow(
        'Unknown OAuth provider: unknown'
      );
    });

    it('should throw error when state is missing', () => {
      expect(() => manager.getAuthUrl('google', '')).toThrow(
        'State parameter is required for CSRF protection'
      );
    });

    it('should include PKCE parameters when provided', () => {
      const state = generateState();
      const pkce = {
        codeChallenge: 'test-challenge',
        codeChallengeMethod: 'S256' as const,
      };

      const url = manager.getAuthUrl('google', state, pkce);

      expect(url).toContain('code_challenge=test-challenge');
      expect(url).toContain('code_challenge_method=S256');
    });

    it('should include scope in URL', () => {
      const state = generateState();
      const url = manager.getAuthUrl('google', state);

      expect(url).toContain('scope=');
      expect(url).toContain('openid');
    });
  });

  describe('exchangeCode', () => {
    beforeEach(() => {
      vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should exchange code for tokens', async () => {
      const mockTokenResponse = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      const tokens = await manager.exchangeCode('google', 'auth-code');

      expect(tokens.accessToken).toBe('mock-access-token');
      expect(tokens.refreshToken).toBe('mock-refresh-token');
      expect(tokens.expiresIn).toBe(3600);
    });

    it('should throw error for unknown provider', async () => {
      await expect(manager.exchangeCode('unknown', 'code')).rejects.toThrow(
        'Unknown OAuth provider: unknown'
      );
    });

    it('should throw error when token exchange fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Invalid code'),
      });

      await expect(manager.exchangeCode('google', 'invalid-code')).rejects.toThrow(
        'Token exchange failed: Invalid code'
      );
    });

    it('should include code_verifier when provided', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'token' }),
      });

      await manager.exchangeCode('google', 'code', 'verifier');

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(fetchCall[1].body).toContain('code_verifier=verifier');
    });
  });

  describe('getUserInfo', () => {
    beforeEach(() => {
      vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should fetch and normalize Google user info', async () => {
      const mockGoogleUser = {
        id: '12345',
        email: 'user@gmail.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
        verified_email: true,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGoogleUser),
      });

      const user = await manager.getUserInfo('google', 'access-token');

      expect(user.id).toBe('12345');
      expect(user.email).toBe('user@gmail.com');
      expect(user.name).toBe('Test User');
      expect(user.avatar).toBe('https://example.com/avatar.jpg');
      expect(user.metadata?.provider).toBe('google');
    });

    it('should fetch and normalize GitHub user info', async () => {
      const mockGitHubUser = {
        id: 67890,
        email: 'user@github.com',
        name: 'GitHub User',
        login: 'ghuser',
        avatar_url: 'https://github.com/avatar.jpg',
        bio: 'Developer',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGitHubUser),
      });

      const user = await manager.getUserInfo('github', 'access-token');

      expect(user.id).toBe('67890');
      expect(user.email).toBe('user@github.com');
      expect(user.name).toBe('GitHub User');
      expect(user.avatar).toBe('https://github.com/avatar.jpg');
      expect(user.metadata?.username).toBe('ghuser');
    });

    it('should throw error for unknown provider', async () => {
      await expect(manager.getUserInfo('unknown', 'token')).rejects.toThrow(
        'Unknown OAuth provider: unknown'
      );
    });

    it('should throw error when user info request fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Unauthorized'),
      });

      await expect(manager.getUserInfo('google', 'invalid-token')).rejects.toThrow(
        'Failed to get user info: Unauthorized'
      );
    });

    it('should send authorization header', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: '1' }),
      });

      await manager.getUserInfo('google', 'my-token');

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(fetchCall[1].headers['Authorization']).toBe('Bearer my-token');
    });
  });

  describe('completeAuth', () => {
    beforeEach(() => {
      vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should complete auth flow', async () => {
      // Mock token exchange
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            expires_in: 3600,
          }),
      });

      // Mock user info
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: '123',
            email: 'user@example.com',
            name: 'Test User',
          }),
      });

      const result = await manager.completeAuth('google', 'auth-code');

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.expiresIn).toBe(3600);
      expect(result.user.id).toBe('123');
      expect(result.user.email).toBe('user@example.com');
    });
  });

  describe('refreshAccessToken', () => {
    beforeEach(() => {
      vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should refresh access token', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'new-access-token',
            expires_in: 3600,
          }),
      });

      const result = await manager.refreshAccessToken('google', 'old-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.expiresIn).toBe(3600);
    });

    it('should throw error for unknown provider', async () => {
      await expect(manager.refreshAccessToken('unknown', 'token')).rejects.toThrow(
        'Unknown OAuth provider: unknown'
      );
    });

    it('should throw error when refresh fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Invalid refresh token'),
      });

      await expect(manager.refreshAccessToken('google', 'invalid')).rejects.toThrow(
        'Token refresh failed: Invalid refresh token'
      );
    });
  });
});

describe('createOAuthManager', () => {
  it('should create OAuthManager instance', () => {
    const manager = createOAuthManager({
      providers: {
        google: OAuthProviders.google('id', 'secret', 'https://example.com/cb'),
      },
    });

    expect(manager).toBeInstanceOf(OAuthManager);
  });
});

describe('State Management', () => {
  describe('generateState', () => {
    it('should generate unique state values', () => {
      const state1 = generateState();
      const state2 = generateState();

      expect(state1).not.toBe(state2);
    });

    it('should generate 64 character hex string', () => {
      const state = generateState();

      expect(state).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(state)).toBe(true);
    });

    it('should generate many unique states', () => {
      const states = new Set<string>();

      for (let i = 0; i < 1000; i++) {
        states.add(generateState());
      }

      expect(states.size).toBe(1000);
    });
  });

  describe('validateState', () => {
    it('should return true for matching states', () => {
      const state = generateState();

      expect(validateState(state, state)).toBe(true);
    });

    it('should return false for non-matching states', () => {
      const state1 = generateState();
      const state2 = generateState();

      expect(validateState(state1, state2)).toBe(false);
    });

    it('should return false for different lengths', () => {
      expect(validateState('abc', 'abcd')).toBe(false);
      expect(validateState('abcd', 'abc')).toBe(false);
    });

    it('should return false for null/undefined inputs', () => {
      expect(validateState(null as any, 'test')).toBe(false);
      expect(validateState('test', null as any)).toBe(false);
      expect(validateState(undefined as any, 'test')).toBe(false);
    });

    it('should use constant-time comparison', () => {
      // This is hard to test directly, but we can verify it works correctly
      const state = 'a'.repeat(64);
      const similar = 'a'.repeat(63) + 'b';

      expect(validateState(state, similar)).toBe(false);
    });
  });
});

describe('PKCE Support', () => {
  describe('generateCodeVerifier', () => {
    it('should generate verifier of default length (64)', () => {
      const verifier = generateCodeVerifier();

      expect(verifier).toHaveLength(64);
    });

    it('should generate verifier of custom length', () => {
      const verifier = generateCodeVerifier(128);

      expect(verifier).toHaveLength(128);
    });

    it('should throw for length less than 43', () => {
      expect(() => generateCodeVerifier(42)).toThrow(
        'Code verifier must be between 43 and 128 characters'
      );
    });

    it('should throw for length greater than 128', () => {
      expect(() => generateCodeVerifier(129)).toThrow(
        'Code verifier must be between 43 and 128 characters'
      );
    });

    it('should only use URL-safe characters', () => {
      const verifier = generateCodeVerifier();
      const safePattern = /^[A-Za-z0-9\-._~]+$/;

      expect(safePattern.test(verifier)).toBe(true);
    });

    it('should generate unique verifiers', () => {
      const verifiers = new Set<string>();

      for (let i = 0; i < 100; i++) {
        verifiers.add(generateCodeVerifier());
      }

      expect(verifiers.size).toBe(100);
    });
  });

  describe('generateCodeChallenge', () => {
    it('should generate base64url encoded challenge', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);

      // Base64 URL safe characters only
      const base64UrlPattern = /^[A-Za-z0-9\-_]+$/;
      expect(base64UrlPattern.test(challenge)).toBe(true);
    });

    it('should not contain padding characters', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);

      expect(challenge).not.toContain('=');
    });

    it('should be consistent for same verifier', async () => {
      const verifier = generateCodeVerifier();
      const challenge1 = await generateCodeChallenge(verifier);
      const challenge2 = await generateCodeChallenge(verifier);

      expect(challenge1).toBe(challenge2);
    });

    it('should produce different challenges for different verifiers', async () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      const challenge1 = await generateCodeChallenge(verifier1);
      const challenge2 = await generateCodeChallenge(verifier2);

      expect(challenge1).not.toBe(challenge2);
    });

    it('should generate valid SHA-256 hash (43 chars)', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);

      // SHA-256 produces 32 bytes = 43 base64url chars (without padding)
      expect(challenge).toHaveLength(43);
    });
  });

  describe('generatePKCE', () => {
    it('should generate PKCE pair', async () => {
      const pkce = await generatePKCE();

      expect(pkce).toHaveProperty('codeVerifier');
      expect(pkce).toHaveProperty('codeChallenge');
      expect(pkce).toHaveProperty('codeChallengeMethod');
    });

    it('should use S256 method', async () => {
      const pkce = await generatePKCE();

      expect(pkce.codeChallengeMethod).toBe('S256');
    });

    it('should have valid verifier', async () => {
      const pkce = await generatePKCE();

      expect(pkce.codeVerifier.length).toBeGreaterThanOrEqual(43);
      expect(pkce.codeVerifier.length).toBeLessThanOrEqual(128);
    });

    it('should have matching challenge for verifier', async () => {
      const pkce = await generatePKCE();
      const expectedChallenge = await generateCodeChallenge(pkce.codeVerifier);

      expect(pkce.codeChallenge).toBe(expectedChallenge);
    });

    it('should generate unique PKCE pairs', async () => {
      const pkce1 = await generatePKCE();
      const pkce2 = await generatePKCE();

      expect(pkce1.codeVerifier).not.toBe(pkce2.codeVerifier);
      expect(pkce1.codeChallenge).not.toBe(pkce2.codeChallenge);
    });
  });
});

describe('User Data Normalization', () => {
  let manager: OAuthManager;

  beforeEach(() => {
    vi.spyOn(global, 'fetch');
    manager = new OAuthManager({
      providers: {
        google: OAuthProviders.google('id', 'secret', 'https://example.com/cb'),
        github: OAuthProviders.github('id', 'secret', 'https://example.com/cb'),
        discord: OAuthProviders.discord('id', 'secret', 'https://example.com/cb'),
        microsoft: OAuthProviders.microsoft('id', 'secret', 'https://example.com/cb'),
        twitter: OAuthProviders.twitter('id', 'secret', 'https://example.com/cb'),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should normalize Discord user with avatar', async () => {
    const mockDiscordUser = {
      id: '12345',
      email: 'user@discord.com',
      username: 'discorduser',
      avatar: 'abc123',
      discriminator: '1234',
      verified: true,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDiscordUser),
    });

    const user = await manager.getUserInfo('discord', 'token');

    expect(user.id).toBe('12345');
    expect(user.name).toBe('discorduser');
    expect(user.avatar).toBe('https://cdn.discordapp.com/avatars/12345/abc123.png');
    expect(user.metadata?.discriminator).toBe('1234');
  });

  it('should normalize Microsoft user', async () => {
    const mockMsUser = {
      id: 'ms-user-id',
      mail: 'user@outlook.com',
      displayName: 'MS User',
      jobTitle: 'Developer',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMsUser),
    });

    const user = await manager.getUserInfo('microsoft', 'token');

    expect(user.id).toBe('ms-user-id');
    expect(user.email).toBe('user@outlook.com');
    expect(user.name).toBe('MS User');
    expect(user.metadata?.jobTitle).toBe('Developer');
  });

  it('should normalize Twitter user', async () => {
    const mockTwitterUser = {
      data: {
        id: 'twitter-id',
        name: 'Twitter User',
        username: 'twitteruser',
        profile_image_url: 'https://pbs.twimg.com/avatar.jpg',
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTwitterUser),
    });

    const user = await manager.getUserInfo('twitter', 'token');

    expect(user.id).toBe('twitter-id');
    expect(user.name).toBe('Twitter User');
    expect(user.metadata?.username).toBe('twitteruser');
  });

  it('should handle GitHub user without name (use login)', async () => {
    const mockGitHubUser = {
      id: 123,
      email: 'user@github.com',
      name: null, // No display name
      login: 'githublogin',
      avatar_url: 'https://github.com/avatar.jpg',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGitHubUser),
    });

    const user = await manager.getUserInfo('github', 'token');

    expect(user.name).toBe('githublogin');
  });

  it('should handle Microsoft user with userPrincipalName fallback', async () => {
    const mockMsUser = {
      id: 'ms-id',
      userPrincipalName: 'user@company.onmicrosoft.com',
      displayName: 'User',
      // mail is undefined
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMsUser),
    });

    const user = await manager.getUserInfo('microsoft', 'token');

    expect(user.email).toBe('user@company.onmicrosoft.com');
  });
});
