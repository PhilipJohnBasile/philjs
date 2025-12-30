/**
 * Enterprise SSO Integration for PhilJS
 *
 * Supports SAML 2.0, OpenID Connect (OIDC), LDAP/Active Directory, and OAuth 2.0
 */

// ============================================================================
// Types
// ============================================================================

export type SSOProvider = 'saml' | 'oidc' | 'ldap' | 'oauth2';

export interface SSOConfig {
  provider: SSOProvider;
  enabled: boolean;
  tenantId?: string;
  settings: SAMLConfig | OIDCConfig | LDAPConfig | OAuth2Config;
  attributeMapping?: AttributeMapping;
  provisioning?: ProvisioningConfig;
}

export interface SAMLConfig {
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificate: string;
  privateKey?: string;
  signatureAlgorithm?: 'sha256' | 'sha512';
  nameIdFormat?: 'email' | 'persistent' | 'transient';
  forceAuthn?: boolean;
  authnContext?: string;
}

export interface OIDCConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  responseType?: 'code' | 'token' | 'id_token';
  tokenEndpoint?: string;
  userInfoEndpoint?: string;
  jwksUri?: string;
  pkce?: boolean;
}

export interface LDAPConfig {
  url: string;
  baseDN: string;
  bindDN: string;
  bindPassword: string;
  userSearchBase?: string;
  userSearchFilter?: string;
  groupSearchBase?: string;
  groupSearchFilter?: string;
  useTLS?: boolean;
  tlsCert?: string;
  connectionTimeout?: number;
  searchTimeout?: number;
}

export interface OAuth2Config {
  authorizationUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  userInfoUrl?: string;
}

export interface AttributeMapping {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  groups?: string;
  roles?: string;
  department?: string;
  custom?: Record<string, string>;
}

export interface ProvisioningConfig {
  enabled: boolean;
  createUsers: boolean;
  updateUsers: boolean;
  deactivateUsers: boolean;
  syncGroups: boolean;
  defaultRole?: string;
  roleMapping?: Record<string, string>;
}

export interface SSOUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  groups?: string[];
  roles?: string[];
  attributes: Record<string, unknown>;
  raw: unknown;
}

export interface SSOSession {
  user: SSOUser;
  provider: SSOProvider;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: Date;
  sessionIndex?: string;
}

// ============================================================================
// SSO Manager
// ============================================================================

/**
 * Manages SSO authentication flows
 */
export class SSOManager {
  private configs: Map<string, SSOConfig> = new Map();
  private sessions: Map<string, SSOSession> = new Map();

  /**
   * Register SSO configuration
   */
  registerConfig(tenantId: string, config: SSOConfig): void {
    this.configs.set(tenantId, config);
  }

  /**
   * Get SSO configuration for tenant
   */
  getConfig(tenantId: string): SSOConfig | undefined {
    return this.configs.get(tenantId);
  }

  /**
   * Initiate SSO login
   */
  async initiateLogin(tenantId: string, options?: {
    returnUrl?: string;
    state?: string;
  }): Promise<{ redirectUrl: string; state: string }> {
    const config = this.configs.get(tenantId);
    if (!config || !config.enabled) {
      throw new Error('SSO not configured for tenant');
    }

    const state = options?.state || this.generateState();

    switch (config.provider) {
      case 'saml':
        return this.initiateSAMLLogin(config.settings as SAMLConfig, state);
      case 'oidc':
        return this.initiateOIDCLogin(config.settings as OIDCConfig, state);
      case 'oauth2':
        return this.initiateOAuth2Login(config.settings as OAuth2Config, state);
      case 'ldap':
        throw new Error('LDAP does not support redirect-based login');
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Handle SSO callback
   */
  async handleCallback(
    tenantId: string,
    callbackData: {
      code?: string;
      token?: string;
      samlResponse?: string;
      state?: string;
      error?: string;
    }
  ): Promise<SSOSession> {
    const config = this.configs.get(tenantId);
    if (!config) {
      throw new Error('SSO not configured for tenant');
    }

    if (callbackData.error) {
      throw new Error(`SSO error: ${callbackData.error}`);
    }

    let user: SSOUser;

    switch (config.provider) {
      case 'saml':
        user = await this.handleSAMLCallback(
          config.settings as SAMLConfig,
          callbackData.samlResponse!,
          config.attributeMapping
        );
        break;
      case 'oidc':
        user = await this.handleOIDCCallback(
          config.settings as OIDCConfig,
          callbackData.code!,
          config.attributeMapping
        );
        break;
      case 'oauth2':
        user = await this.handleOAuth2Callback(
          config.settings as OAuth2Config,
          callbackData.code!,
          config.attributeMapping
        );
        break;
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }

    // Create session
    const session: SSOSession = {
      user,
      provider: config.provider,
    };

    const sessionId = this.generateSessionId();
    this.sessions.set(sessionId, session);

    return session;
  }

  /**
   * Authenticate with LDAP
   */
  async authenticateLDAP(
    tenantId: string,
    username: string,
    password: string
  ): Promise<SSOUser> {
    const config = this.configs.get(tenantId);
    if (!config || config.provider !== 'ldap') {
      throw new Error('LDAP not configured for tenant');
    }

    const ldapConfig = config.settings as LDAPConfig;

    // In real implementation, use an LDAP client library
    // This is a placeholder for the LDAP authentication logic
    const ldapUser = await this.ldapBind(ldapConfig, username, password);

    return this.mapLDAPUser(ldapUser, config.attributeMapping);
  }

  /**
   * Initiate single logout
   */
  async initiateLogout(tenantId: string, sessionId: string): Promise<{ redirectUrl?: string }> {
    const config = this.configs.get(tenantId);
    const session = this.sessions.get(sessionId);

    if (!session) {
      return {};
    }

    // Remove session
    this.sessions.delete(sessionId);

    // Handle provider-specific logout
    if (config?.provider === 'saml') {
      const samlConfig = config.settings as SAMLConfig;
      if (samlConfig.sloUrl) {
        return {
          redirectUrl: this.buildSLORequest(samlConfig, session),
        };
      }
    }

    if (config?.provider === 'oidc') {
      const oidcConfig = config.settings as OIDCConfig;
      return {
        redirectUrl: `${oidcConfig.issuer}/logout?id_token_hint=${session.idToken}`,
      };
    }

    return {};
  }

  /**
   * Get active session
   */
  getSession(sessionId: string): SSOSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Validate session
   */
  isSessionValid(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    if (session.expiresAt && session.expiresAt < new Date()) return false;
    return true;
  }

  // ============================================================================
  // Private Methods - SAML
  // ============================================================================

  private async initiateSAMLLogin(
    config: SAMLConfig,
    state: string
  ): Promise<{ redirectUrl: string; state: string }> {
    // Build SAML AuthnRequest
    const requestId = this.generateRequestId();
    const issueInstant = new Date().toISOString();

    const authnRequest = `
      <samlp:AuthnRequest
        xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
        ID="${requestId}"
        Version="2.0"
        IssueInstant="${issueInstant}"
        Destination="${config.ssoUrl}"
        AssertionConsumerServiceURL="${config.entityId}/acs"
        ${config.forceAuthn ? 'ForceAuthn="true"' : ''}>
        <saml:Issuer>${config.entityId}</saml:Issuer>
        <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:${config.nameIdFormat === 'email' ? '1.1:nameid-format:emailAddress' : '2.0:nameid-format:persistent'}" />
      </samlp:AuthnRequest>
    `;

    // Encode and sign request
    const encodedRequest = Buffer.from(authnRequest).toString('base64');
    const redirectUrl = `${config.ssoUrl}?SAMLRequest=${encodeURIComponent(encodedRequest)}&RelayState=${state}`;

    return { redirectUrl, state };
  }

  private async handleSAMLCallback(
    config: SAMLConfig,
    samlResponse: string,
    attributeMapping?: AttributeMapping
  ): Promise<SSOUser> {
    // Decode and validate SAML response
    const decoded = Buffer.from(samlResponse, 'base64').toString('utf-8');

    // In real implementation, validate signature and parse assertion
    // This is a simplified placeholder
    const attributes = this.parseSAMLAssertion(decoded);

    return this.mapAttributes(attributes, attributeMapping);
  }

  private parseSAMLAssertion(xml: string): Record<string, unknown> {
    // Placeholder - use proper XML parser in production
    return {};
  }

  private buildSLORequest(config: SAMLConfig, session: SSOSession): string {
    const requestId = this.generateRequestId();
    const issueInstant = new Date().toISOString();

    const logoutRequest = `
      <samlp:LogoutRequest
        xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
        ID="${requestId}"
        Version="2.0"
        IssueInstant="${issueInstant}"
        Destination="${config.sloUrl}">
        <saml:Issuer>${config.entityId}</saml:Issuer>
        <saml:NameID>${session.user.email}</saml:NameID>
        ${session.sessionIndex ? `<samlp:SessionIndex>${session.sessionIndex}</samlp:SessionIndex>` : ''}
      </samlp:LogoutRequest>
    `;

    const encoded = Buffer.from(logoutRequest).toString('base64');
    return `${config.sloUrl}?SAMLRequest=${encodeURIComponent(encoded)}`;
  }

  // ============================================================================
  // Private Methods - OIDC
  // ============================================================================

  private async initiateOIDCLogin(
    config: OIDCConfig,
    state: string
  ): Promise<{ redirectUrl: string; state: string }> {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: config.responseType || 'code',
      scope: config.scopes.join(' '),
      state,
    });

    if (config.pkce) {
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      params.set('code_challenge', codeChallenge);
      params.set('code_challenge_method', 'S256');
    }

    const authUrl = `${config.issuer}/authorize?${params.toString()}`;
    return { redirectUrl: authUrl, state };
  }

  private async handleOIDCCallback(
    config: OIDCConfig,
    code: string,
    attributeMapping?: AttributeMapping
  ): Promise<SSOUser> {
    // Exchange code for tokens
    const tokenEndpoint = config.tokenEndpoint || `${config.issuer}/token`;

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Get user info
    const userInfoEndpoint = config.userInfoEndpoint || `${config.issuer}/userinfo`;
    const userInfoResponse = await fetch(userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userInfo = await userInfoResponse.json();
    return this.mapAttributes(userInfo, attributeMapping);
  }

  // ============================================================================
  // Private Methods - OAuth2
  // ============================================================================

  private async initiateOAuth2Login(
    config: OAuth2Config,
    state: string
  ): Promise<{ redirectUrl: string; state: string }> {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
    });

    const authUrl = `${config.authorizationUrl}?${params.toString()}`;
    return { redirectUrl: authUrl, state };
  }

  private async handleOAuth2Callback(
    config: OAuth2Config,
    code: string,
    attributeMapping?: AttributeMapping
  ): Promise<SSOUser> {
    // Exchange code for tokens
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Get user info if endpoint provided
    if (config.userInfoUrl) {
      const userInfoResponse = await fetch(config.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        return this.mapAttributes(userInfo, attributeMapping);
      }
    }

    // Return minimal user from token
    return {
      id: tokens.sub || 'unknown',
      email: tokens.email || 'unknown@unknown.com',
      attributes: tokens,
      raw: tokens,
    };
  }

  // ============================================================================
  // Private Methods - LDAP
  // ============================================================================

  private async ldapBind(
    config: LDAPConfig,
    username: string,
    password: string
  ): Promise<Record<string, unknown>> {
    // Placeholder - use proper LDAP client in production
    // Example: ldapjs, ldapts
    throw new Error('LDAP authentication requires server-side implementation');
  }

  private mapLDAPUser(
    ldapUser: Record<string, unknown>,
    attributeMapping?: AttributeMapping
  ): SSOUser {
    return this.mapAttributes(ldapUser, attributeMapping);
  }

  // ============================================================================
  // Private Methods - Utilities
  // ============================================================================

  private mapAttributes(
    attributes: Record<string, unknown>,
    mapping?: AttributeMapping
  ): SSOUser {
    const defaultMapping: AttributeMapping = {
      id: 'sub',
      email: 'email',
      firstName: 'given_name',
      lastName: 'family_name',
      displayName: 'name',
      groups: 'groups',
      roles: 'roles',
    };

    const m = { ...defaultMapping, ...mapping };

    const firstName = attributes[m.firstName!] as string | undefined;
    const lastName = attributes[m.lastName!] as string | undefined;
    const displayName = attributes[m.displayName!] as string | undefined;

    return {
      id: String(attributes[m.id!] || attributes['sub'] || attributes['id'] || 'unknown'),
      email: String(attributes[m.email!] || attributes['email'] || ''),
      groups: (attributes[m.groups!] as string[]) || [],
      roles: (attributes[m.roles!] as string[]) || [],
      attributes,
      raw: attributes,
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(displayName !== undefined && { displayName }),
    };
  }

  private generateState(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private generateRequestId(): string {
    return '_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private generateSessionId(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private generateCodeVerifier(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an SSO manager
 */
export function createSSOManager(): SSOManager {
  return new SSOManager();
}

/**
 * Create SAML configuration
 */
export function createSAMLConfig(config: SAMLConfig): SSOConfig {
  return {
    provider: 'saml',
    enabled: true,
    settings: config,
  };
}

/**
 * Create OIDC configuration
 */
export function createOIDCConfig(config: OIDCConfig): SSOConfig {
  return {
    provider: 'oidc',
    enabled: true,
    settings: {
      ...config,
      scopes: config.scopes || ['openid', 'profile', 'email'],
    },
  };
}

/**
 * Create LDAP configuration
 */
export function createLDAPConfig(config: LDAPConfig): SSOConfig {
  return {
    provider: 'ldap',
    enabled: true,
    settings: {
      ...config,
      userSearchFilter: config.userSearchFilter || '(uid={{username}})',
    },
  };
}
