/**
 * Multi-Tenancy Support for PhilJS
 *
 * Provides tenant isolation, data partitioning, and tenant-specific configuration.
 */

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Tenant Manager
// ============================================================================

/**
 * Manages multi-tenant operations
 */
export class TenantManager {
  private config: MultiTenancyConfig;
  private cache: Map<string, { tenant: Tenant; expires: number }> = new Map();
  private currentContext: TenantContext | null = null;

  constructor(config: MultiTenancyConfig) {
    this.config = {
      cache: true,
      cacheTTL: 300,
      ...config,
    };
  }

  /**
   * Resolve tenant from request
   */
  async resolveTenant(request: {
    hostname?: string;
    path?: string;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  }): Promise<Tenant | null> {
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
  async getTenant(identifier: string): Promise<Tenant | null> {
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
        expires: Date.now() + (this.config.cacheTTL! * 1000),
      });
    }

    return tenant;
  }

  /**
   * Set current tenant context
   */
  setContext(context: TenantContext): void {
    this.currentContext = context;
  }

  /**
   * Get current tenant context
   */
  getContext(): TenantContext | null {
    return this.currentContext;
  }

  /**
   * Clear tenant context
   */
  clearContext(): void {
    this.currentContext = null;
  }

  /**
   * Check if feature is enabled for current tenant
   */
  hasFeature(feature: string): boolean {
    return this.currentContext?.features.includes(feature) ?? false;
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): boolean {
    return this.currentContext?.permissions.includes(permission) ?? false;
  }

  /**
   * Get tenant-specific setting
   */
  getSetting<K extends keyof TenantSettings>(key: K): TenantSettings[K] | undefined {
    return this.currentContext?.tenant.settings[key];
  }

  /**
   * Get tenant branding
   */
  getBranding(): TenantBranding | undefined {
    return this.currentContext?.tenant.branding;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalidate specific tenant cache
   */
  invalidateTenant(identifier: string): void {
    this.cache.delete(identifier);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private extractIdentifier(request: {
    hostname?: string;
    path?: string;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  }): string | null {
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

  private extractSubdomain(hostname?: string): string | null {
    if (!hostname) return null;

    const parts = hostname.split('.');
    if (parts.length < 3) return null;

    // Skip 'www' subdomain
    const subdomain = parts[0];
    if (subdomain === 'www') return parts[1];

    return subdomain;
  }

  private extractPathSegment(path?: string): string | null {
    if (!path) return null;

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
export function createTenantMiddleware(manager: TenantManager) {
  return async (request: Request, next: () => Promise<Response>): Promise<Response> => {
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
    } finally {
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
export function tenantScope<T extends { tenantId: string }>(
  query: () => T[],
  tenantId: string
): T[] {
  return query().filter(item => item.tenantId === tenantId);
}

/**
 * Add tenant ID to data before insert
 */
export function withTenantId<T>(
  data: T,
  tenantId: string
): T & { tenantId: string } {
  return { ...data, tenantId };
}

/**
 * Create tenant-scoped storage key
 */
export function tenantKey(tenantId: string, key: string): string {
  return `tenant:${tenantId}:${key}`;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a tenant manager
 */
export function createTenantManager(config: MultiTenancyConfig): TenantManager {
  return new TenantManager(config);
}

/**
 * Create default tenant settings
 */
export function createDefaultTenantSettings(): TenantSettings {
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
export function createDefaultBranding(): TenantBranding {
  return {
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
  };
}
