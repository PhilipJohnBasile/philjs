/**
 * Multi-Tenancy Support for PhilJS
 *
 * Provides tenant isolation, data partitioning, and tenant-specific configuration.
 */
export interface Tenant {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    subdomain?: string;
    settings: TenantSettings;
    branding?: TenantBranding;
    features: string[];
    plan: 'free' | 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'suspended' | 'pending';
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, unknown>;
}
export interface TenantSettings {
    locale: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    maxUsers?: number;
    maxStorage?: number;
    customDomain?: boolean;
    ssoEnabled?: boolean;
    auditLogRetention?: number;
    dataRetention?: number;
    mfaRequired?: boolean;
    ipWhitelist?: string[];
    allowedEmailDomains?: string[];
}
export interface TenantBranding {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
    favicon?: string;
    appName?: string;
    emailFooter?: string;
    customCSS?: string;
    loginBackground?: string;
}
export interface TenantContext {
    tenant: Tenant;
    user?: TenantUser;
    permissions: string[];
    features: string[];
}
export interface TenantUser {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
    lastLogin?: Date;
}
export interface MultiTenancyConfig {
    /** Tenant resolution strategy */
    strategy: 'subdomain' | 'path' | 'header' | 'cookie' | 'domain';
    /** Header name for header strategy */
    headerName?: string;
    /** Cookie name for cookie strategy */
    cookieName?: string;
    /** Default tenant for fallback */
    defaultTenant?: string;
    /** Tenant loader function */
    loadTenant: (identifier: string) => Promise<Tenant | null>;
    /** Enable tenant caching */
    cache?: boolean;
    /** Cache TTL in seconds */
    cacheTTL?: number;
    /** Tenant not found handler */
    onTenantNotFound?: (identifier: string) => void;
}
/**
 * Manages multi-tenant operations
 */
export declare class TenantManager {
    private config;
    private cache;
    private currentContext;
    constructor(config: MultiTenancyConfig);
    /**
     * Resolve tenant from request
     */
    resolveTenant(request: {
        hostname?: string;
        path?: string;
        headers?: Record<string, string>;
        cookies?: Record<string, string>;
    }): Promise<Tenant | null>;
    /**
     * Get tenant by identifier
     */
    getTenant(identifier: string): Promise<Tenant | null>;
    /**
     * Set current tenant context
     */
    setContext(context: TenantContext): void;
    /**
     * Get current tenant context
     */
    getContext(): TenantContext | null;
    /**
     * Clear tenant context
     */
    clearContext(): void;
    /**
     * Check if feature is enabled for current tenant
     */
    hasFeature(feature: string): boolean;
    /**
     * Check if user has permission
     */
    hasPermission(permission: string): boolean;
    /**
     * Get tenant-specific setting
     */
    getSetting<K extends keyof TenantSettings>(key: K): TenantSettings[K] | undefined;
    /**
     * Get tenant branding
     */
    getBranding(): TenantBranding | undefined;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Invalidate specific tenant cache
     */
    invalidateTenant(identifier: string): void;
    private extractIdentifier;
    private extractSubdomain;
    private extractPathSegment;
}
/**
 * Create tenant resolution middleware
 */
export declare function createTenantMiddleware(manager: TenantManager): (request: Request, next: () => Promise<Response>) => Promise<Response>;
/**
 * Tenant-scoped database query helper
 */
export declare function tenantScope<T extends {
    tenantId: string;
}>(query: () => T[], tenantId: string): T[];
/**
 * Add tenant ID to data before insert
 */
export declare function withTenantId<T>(data: T, tenantId: string): T & {
    tenantId: string;
};
/**
 * Create tenant-scoped storage key
 */
export declare function tenantKey(tenantId: string, key: string): string;
/**
 * Create a tenant manager
 */
export declare function createTenantManager(config: MultiTenancyConfig): TenantManager;
/**
 * Create default tenant settings
 */
export declare function createDefaultTenantSettings(): TenantSettings;
/**
 * Create default tenant branding
 */
export declare function createDefaultBranding(): TenantBranding;
//# sourceMappingURL=multi-tenancy.d.ts.map