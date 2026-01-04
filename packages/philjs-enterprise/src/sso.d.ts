/**
 * Enterprise SSO Integration for PhilJS
 *
 * Supports SAML 2.0, OpenID Connect (OIDC), LDAP/Active Directory, and OAuth 2.0
 */
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
/**
 * Manages SSO authentication flows
 */
export declare class SSOManager {
    private configs;
    private sessions;
    /**
     * Register SSO configuration
     */
    registerConfig(tenantId: string, config: SSOConfig): void;
    /**
     * Get SSO configuration for tenant
     */
    getConfig(tenantId: string): SSOConfig | undefined;
    /**
     * Initiate SSO login
     */
    initiateLogin(tenantId: string, options?: {
        returnUrl?: string;
        state?: string;
    }): Promise<{
        redirectUrl: string;
        state: string;
    }>;
    /**
     * Handle SSO callback
     */
    handleCallback(tenantId: string, callbackData: {
        code?: string;
        token?: string;
        samlResponse?: string;
        state?: string;
        error?: string;
    }): Promise<SSOSession>;
    /**
     * Authenticate with LDAP
     */
    authenticateLDAP(tenantId: string, username: string, password: string): Promise<SSOUser>;
    /**
     * Initiate single logout
     */
    initiateLogout(tenantId: string, sessionId: string): Promise<{
        redirectUrl?: string;
    }>;
    /**
     * Get active session
     */
    getSession(sessionId: string): SSOSession | undefined;
    /**
     * Validate session
     */
    isSessionValid(sessionId: string): boolean;
    private initiateSAMLLogin;
    private handleSAMLCallback;
    private parseSAMLAssertion;
    private buildSLORequest;
    private initiateOIDCLogin;
    private handleOIDCCallback;
    private initiateOAuth2Login;
    private handleOAuth2Callback;
    private ldapBind;
    private mapLDAPUser;
    private mapAttributes;
    private generateState;
    private generateRequestId;
    private generateSessionId;
    private generateCodeVerifier;
    private generateCodeChallenge;
}
/**
 * Create an SSO manager
 */
export declare function createSSOManager(): SSOManager;
/**
 * Create SAML configuration
 */
export declare function createSAMLConfig(config: SAMLConfig): SSOConfig;
/**
 * Create OIDC configuration
 */
export declare function createOIDCConfig(config: OIDCConfig): SSOConfig;
/**
 * Create LDAP configuration
 */
export declare function createLDAPConfig(config: LDAPConfig): SSOConfig;
//# sourceMappingURL=sso.d.ts.map