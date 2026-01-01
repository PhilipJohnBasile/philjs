# @philjs/enterprise

Enterprise features for PhilJS applications including SSO, audit logging, RBAC, and compliance tools. Built for organizations with advanced security and governance requirements.

## Installation

```bash
npm install @philjs/enterprise
# or
yarn add @philjs/enterprise
# or
pnpm add @philjs/enterprise
```

## Basic Usage

```tsx
import {
  EnterpriseProvider,
  SSOProvider,
  AuditLogger,
  usePermissions
} from '@philjs/enterprise';

function App() {
  return (
    <EnterpriseProvider
      sso={{ provider: 'okta', domain: 'company.okta.com' }}
      audit={{ enabled: true }}
    >
      <SSOProvider>
        <Dashboard />
      </SSOProvider>
    </EnterpriseProvider>
  );
}

function Dashboard() {
  const { can } = usePermissions();

  return (
    <div>
      {can('view:reports') && <ReportsPanel />}
      {can('manage:users') && <UserManagement />}
    </div>
  );
}
```

## Features

- **Single Sign-On (SSO)** - SAML 2.0 and OIDC integration
- **Identity Providers** - Okta, Azure AD, Google Workspace, OneLogin
- **Audit Logging** - Comprehensive activity tracking
- **RBAC** - Role-based access control with fine-grained permissions
- **ABAC** - Attribute-based access control policies
- **Session Management** - Secure session handling with timeout controls
- **MFA Support** - Multi-factor authentication integration
- **Compliance** - SOC 2, HIPAA, GDPR compliance helpers
- **Data Encryption** - At-rest and in-transit encryption utilities
- **IP Allowlisting** - Restrict access by IP address
- **Tenant Isolation** - Multi-tenant data separation
- **License Management** - Seat-based licensing controls

## SSO Providers

| Provider | Protocol |
|----------|----------|
| Okta | SAML 2.0, OIDC |
| Azure AD | SAML 2.0, OIDC |
| Google Workspace | OIDC |
| OneLogin | SAML 2.0 |
| Auth0 | OIDC |
| Custom | SAML 2.0, OIDC |

## Audit Logging

```typescript
import { auditLog } from '@philjs/enterprise';

auditLog.record({
  action: 'user.updated',
  actor: userId,
  resource: targetUserId,
  metadata: { changes: ['email', 'role'] },
});
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./multi-tenancy, ./sso, ./rbac, ./audit, ./feature-flags, ./white-label
- Source files: packages/philjs-enterprise/src/index.ts, packages/philjs-enterprise/src/multi-tenancy.ts, packages/philjs-enterprise/src/sso.ts, packages/philjs-enterprise/src/rbac.ts, packages/philjs-enterprise/src/audit.ts, packages/philjs-enterprise/src/feature-flags.ts, packages/philjs-enterprise/src/white-label.ts

### Public API
- Direct exports: AttributeMapping, AuditConfig, AuditEvent, AuditFilter, AuditLogger, AuditMetadata, AuditStorage, BrandingConfig, CustomizationConfig, DomainConfig, EmailTemplate, EvaluationContext, FeatureFlag, FeatureFlagManager, FeatureRule, FeatureVariant, LDAPConfig, MultiTenancyConfig, OAuth2Config, OIDCConfig, Permission, PermissionCondition, ProvisioningConfig, RBACConfig, RBACManager, Role, RuleCondition, SAMLConfig, SSOConfig, SSOManager, SSOProvider, SSOSession, SSOUser, Tenant, TenantBranding, TenantContext, TenantManager, TenantSettings, TenantUser, WhiteLabelConfig, WhiteLabelManager, createAuditLogger, createDefaultBranding, createDefaultTenantSettings, createFeatureFlagManager, createInMemoryStorage, createLDAPConfig, createOIDCConfig, createRBACManager, createSAMLConfig, createSSOManager, createTenantManager, createTenantMiddleware, createWhiteLabelManager, tenantKey, tenantScope, withTenantId
- Re-exported names: (none detected)
- Re-exported modules: ./audit.js, ./compliance.js, ./feature-flags.js, ./multi-tenancy.js, ./rbac.js, ./sso.js, ./white-label.js
<!-- API_SNAPSHOT_END -->

## License

MIT
