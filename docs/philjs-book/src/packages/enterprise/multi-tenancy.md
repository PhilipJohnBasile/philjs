# Multi-Tenancy

PhilJS Enterprise provides a robust multi-tenancy engine that supports data isolation, tenant resolution, and per-tenant configuration out of the box.

## Architecture

The system uses a **Tenant Manager** to resolve the current tenant context from the request and enforce isolation policies.

### Tenant Resolution Strategies

PhilJS supports multiple strategies to identify tenants:

1.  **Subdomain**: `tenant.app.com` (Default)
2.  **Path**: `app.com/tenant/...`
3.  **Header**: `x-tenant-id: tenant-123`
4.  **Cookie**: `tenant=tenant-123`
5.  **Custom Domain**: `tenant-custom-domain.com`

## Implementation

### 1. Configure Tenant Manager

```typescript
import { createTenantManager } from '@philjs/enterprise/multi-tenancy';

export const tenantManager = createTenantManager({
  strategy: 'subdomain',
  
  // How to load tenant data from your DB
  loadTenant: async (identifier) => {
    return await db.tenants.findUnique({
      where: { slug: identifier }
    });
  },

  // Caching configuration
  cache: true,
  cacheTTL: 300 // 5 minutes
});
```

### 2. Add Middleware

Add the tenant middleware to your server entry point. This ensures `request.context.tenant` is available.

```typescript
import { createTenantMiddleware } from '@philjs/enterprise/multi-tenancy';
import { tenantManager } from './auth';

// In entry.server.ts
export function handleRequest(request) {
  const middleware = createTenantMiddleware(tenantManager);
  return middleware(request, () => processRequest(request));
}
```

### 3. Data Isolation

Use the `tenantScope` helper to enforce data boundaries.

```typescript
import { tenantScope, withTenantId } from '@philjs/enterprise/multi-tenancy';

// Querying data
async function getProducts() {
  const tenant = tenantManager.getContext();
  
  // Automatically adds "WHERE tenant_id = ?"
  return await db.products.findMany({
    where: { tenantId: tenant.id }
  });
}

// Creating data
async function createProduct(data) {
  const tenant = tenantManager.getContext();
  
  // Automatically adds tenantId
  const scopedData = withTenantId(data, tenant.id);
  
  return await db.products.create({ data: scopedData });
}
```

## Per-Tenant Configuration

Tenants can have custom settings, branding, and feature flags.

```typescript
const tenant = tenantManager.getContext();

// Access settings
if (tenant.settings.mfaRequired) {
  // Enforce MFA
}

// Access branding
const styles = {
  '--primary-color': tenant.branding.primaryColor,
  '--logo-url': tenant.branding.logo
};
```
