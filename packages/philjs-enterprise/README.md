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

## License

MIT
