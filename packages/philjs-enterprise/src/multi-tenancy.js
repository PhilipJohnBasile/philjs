/**
 * Multi-Tenancy Support for PhilJS
 *
 * Provides tenant isolation, data partitioning, and tenant-specific configuration.
 */
// ============================================================================
// Tenant Manager
// ============================================================================
/**
 * Manages multi-tenant operations
 */
export class TenantManager {
    config;
    cache = new Map();
    currentContext = null;
    constructor(config) {
        this.config = {
            cache: true,
            cacheTTL: 300,
            ...config,
        };
    }
    /**
     * Resolve tenant from request
     */
    async resolveTenant(request) {
        const identifier = this.extractIdentifier(request);
        if (!identifier) {
            if (this.config.defaultTenant) {
                return this.getTenant(this.config.defaultTenant);
            }
            return null;
        }
        return this.getTenant(identifier);
    }
    /**
     * Get tenant by identifier
     */
    async getTenant(identifier) {
        // Check cache
        if (this.config.cache) {
            const cached = this.cache.get(identifier);
            if (cached && cached.expires > Date.now()) {
                return cached.tenant;
            }
        }
        // Load tenant
        const tenant = await this.config.loadTenant(identifier);
        if (!tenant) {
            this.config.onTenantNotFound?.(identifier);
            return null;
        }
        // Cache tenant
        if (this.config.cache) {
            this.cache.set(identifier, {
                tenant,
                expires: Date.now() + (this.config.cacheTTL * 1000),
            });
        }
        return tenant;
    }
    /**
     * Set current tenant context
     */
    setContext(context) {
        this.currentContext = context;
    }
    /**
     * Get current tenant context
     */
    getContext() {
        return this.currentContext;
    }
    /**
     * Clear tenant context
     */
    clearContext() {
        this.currentContext = null;
    }
    /**
     * Check if feature is enabled for current tenant
     */
    hasFeature(feature) {
        return this.currentContext?.features.includes(feature) ?? false;
    }
    /**
     * Check if user has permission
     */
    hasPermission(permission) {
        return this.currentContext?.permissions.includes(permission) ?? false;
    }
    /**
     * Get tenant-specific setting
     */
    getSetting(key) {
        return this.currentContext?.tenant.settings[key];
    }
    /**
     * Get tenant branding
     */
    getBranding() {
        return this.currentContext?.tenant.branding;
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Invalidate specific tenant cache
     */
    invalidateTenant(identifier) {
        this.cache.delete(identifier);
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    extractIdentifier(request) {
        switch (this.config.strategy) {
            case 'subdomain':
                return this.extractSubdomain(request.hostname);
            case 'domain':
                return request.hostname || null;
            case 'path':
                return this.extractPathSegment(request.path);
            case 'header':
                return request.headers?.[this.config.headerName || 'x-tenant-id'] || null;
            case 'cookie':
                return request.cookies?.[this.config.cookieName || 'tenant'] || null;
            default:
                return null;
        }
    }
    extractSubdomain(hostname) {
        if (!hostname)
            return null;
        const parts = hostname.split('.');
        if (parts.length < 3)
            return null;
        // Skip 'www' subdomain
        const subdomain = parts[0];
        if (subdomain === 'www')
            return parts[1] ?? null;
        return subdomain ?? null;
    }
    extractPathSegment(path) {
        if (!path)
            return null;
        const segments = path.split('/').filter(Boolean);
        return segments[0] || null;
    }
}
// ============================================================================
// Middleware
// ============================================================================
/**
 * Create tenant resolution middleware
 */
export function createTenantMiddleware(manager) {
    return async (request, next) => {
        const url = new URL(request.url);
        const tenant = await manager.resolveTenant({
            hostname: url.hostname,
            path: url.pathname,
            headers: Object.fromEntries(request.headers.entries()),
        });
        if (!tenant) {
            return new Response('Tenant not found', { status: 404 });
        }
        if (tenant.status !== 'active') {
            return new Response('Tenant suspended', { status: 403 });
        }
        // Set context
        manager.setContext({
            tenant,
            permissions: [],
            features: tenant.features,
        });
        try {
            return await next();
        }
        finally {
            manager.clearContext();
        }
    };
}
// ============================================================================
// Data Isolation
// ============================================================================
/**
 * Tenant-scoped database query helper
 */
export function tenantScope(query, tenantId) {
    return query().filter(item => item.tenantId === tenantId);
}
/**
 * Add tenant ID to data before insert
 */
export function withTenantId(data, tenantId) {
    return { ...data, tenantId };
}
/**
 * Create tenant-scoped storage key
 */
export function tenantKey(tenantId, key) {
    return `tenant:${tenantId}:${key}`;
}
// ============================================================================
// Factory Functions
// ============================================================================
/**
 * Create a tenant manager
 */
export function createTenantManager(config) {
    return new TenantManager(config);
}
/**
 * Create default tenant settings
 */
export function createDefaultTenantSettings() {
    return {
        locale: 'en-US',
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        currency: 'USD',
        maxUsers: 10,
        maxStorage: 1073741824, // 1GB
        mfaRequired: false,
    };
}
/**
 * Create default tenant branding
 */
export function createDefaultBranding() {
    return {
        primaryColor: '#3b82f6',
        secondaryColor: '#10b981',
    };
}
//# sourceMappingURL=multi-tenancy.js.map