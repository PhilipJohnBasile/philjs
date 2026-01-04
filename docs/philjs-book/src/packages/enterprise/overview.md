# @philjs/enterprise - Complete Reference

The `@philjs/enterprise` package provides enterprise-grade features for PhilJS applications, including multi-tenancy, Single Sign-On (SSO), Role-Based Access Control (RBAC), audit logging, feature flags, white-labeling, and compliance management.

## Installation

```bash
npm install @philjs/enterprise
# or
pnpm add @philjs/enterprise
# or
bun add @philjs/enterprise
```

## Features

- **Multi-Tenancy** - Tenant isolation, data partitioning, and tenant-specific configuration
- **Enterprise SSO** - SAML 2.0, OpenID Connect (OIDC), LDAP/Active Directory, OAuth 2.0
- **Role-Based Access Control** - Fine-grained permissions with role inheritance
- **Audit Logging** - Comprehensive audit trails for compliance and security
- **Feature Flags** - Gradual rollouts, A/B testing, and variant management
- **White-Labeling** - Custom branding, theming, and domain configuration
- **Compliance** - GDPR, CCPA, HIPAA, SOC2, ISO27001, PCI-DSS support

## Package Exports

| Export | Description |
|--------|-------------|
| `@philjs/enterprise` | Main entry point with all exports |
| `@philjs/enterprise/multi-tenancy` | Multi-tenant management |
| `@philjs/enterprise/sso` | Enterprise SSO authentication |
| `@philjs/enterprise/rbac` | Role-based access control |
| `@philjs/enterprise/audit` | Audit logging system |
| `@philjs/enterprise/feature-flags` | Feature flag management |
| `@philjs/enterprise/white-label` | White-labeling and branding |

## Quick Start

```typescript
import {
  createTenantManager,
  createSSOManager,
  createRBACManager,
  createAuditLogger,
  createFeatureFlagManager,
  createWhiteLabelManager,
  createComplianceManager,
} from '@philjs/enterprise';

// Set up multi-tenancy
const tenantManager = createTenantManager({
  strategy: 'subdomain',
  loadTenant: async (slug) => {
    return await db.tenants.findBySlug(slug);
  },
});

// Set up SSO
const ssoManager = createSSOManager();
ssoManager.registerConfig('tenant-1', {
  provider: 'oidc',
  enabled: true,
  settings: {
    issuer: 'https://auth.example.com',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    redirectUri: 'https://app.example.com/callback',
    scopes: ['openid', 'profile', 'email'],
  },
});

// Set up RBAC
const rbac = createRBACManager({
  roles: [
    { id: 'admin', name: 'Administrator', permissions: ['users:*', 'settings:*'] },
    { id: 'editor', name: 'Editor', permissions: ['content:read', 'content:write'] },
    { id: 'viewer', name: 'Viewer', permissions: ['content:read'] },
  ],
  permissions: [],
});

// Check permissions
if (rbac.can(['editor'], 'write', 'content')) {
  // User can write content
}
```

---

## Multi-Tenancy

The multi-tenancy module provides complete tenant isolation with multiple resolution strategies.

### Tenant Manager

```typescript
import { createTenantManager, TenantManager } from '@philjs/enterprise/multi-tenancy';

const tenantManager = createTenantManager({
  // Resolution strategy: 'subdomain' | 'path' | 'header' | 'cookie' | 'domain'
  strategy: 'subdomain',

  // Load tenant from database
  loadTenant: async (identifier) => {
    return await db.tenants.findOne({ slug: identifier });
  },

  // Enable caching (default: true)
  cache: true,
  cacheTTL: 300, // 5 minutes

  // Default tenant fallback
  defaultTenant: 'default',

  // Handle tenant not found
  onTenantNotFound: (identifier) => {
    console.log(`Tenant not found: ${identifier}`);
  },
});
```

### Tenant Resolution

```typescript
// Resolve tenant from request
const tenant = await tenantManager.resolveTenant({
  hostname: 'acme.app.example.com',
  path: '/dashboard',
  headers: { 'x-tenant-id': 'acme' },
  cookies: { tenant: 'acme' },
});

// Get tenant by identifier
const tenant = await tenantManager.getTenant('acme');

// Set and get current context
tenantManager.setContext({
  tenant,
  user: currentUser,
  permissions: ['read', 'write'],
  features: ['feature-x', 'feature-y'],
});

const context = tenantManager.getContext();
```

### Tenant-Specific Operations

```typescript
// Check feature availability
if (tenantManager.hasFeature('advanced-analytics')) {
  // Feature is enabled for current tenant
}

// Check user permission
if (tenantManager.hasPermission('users:create')) {
  // User has permission
}

// Get tenant settings
const locale = tenantManager.getSetting('locale'); // 'en-US'
const timezone = tenantManager.getSetting('timezone'); // 'UTC'

// Get tenant branding
const branding = tenantManager.getBranding();
// { primaryColor: '#3b82f6', logo: '/logo.png', ... }
```

### Tenant Middleware

```typescript
import { createTenantMiddleware } from '@philjs/enterprise/multi-tenancy';

const middleware = createTenantMiddleware(tenantManager);

// Use with your server framework
app.use(async (req, res, next) => {
  const response = await middleware(req, () => next());
  return response;
});
```

### Data Isolation Helpers

```typescript
import { tenantScope, withTenantId, tenantKey } from '@philjs/enterprise/multi-tenancy';

// Filter data by tenant
const userPosts = tenantScope(
  () => posts.getAll(),
  'tenant-123'
);

// Add tenant ID to data
const newPost = withTenantId(
  { title: 'Hello', content: '...' },
  'tenant-123'
);
// { title: 'Hello', content: '...', tenantId: 'tenant-123' }

// Create tenant-scoped storage key
const key = tenantKey('tenant-123', 'user:preferences');
// 'tenant:tenant-123:user:preferences'
```

### Tenant Types

```typescript
interface Tenant {
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

interface TenantSettings {
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

interface TenantBranding {
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  favicon?: string;
  appName?: string;
  emailFooter?: string;
  customCSS?: string;
  loginBackground?: string;
}
```

---

## Enterprise SSO

The SSO module supports SAML 2.0, OpenID Connect (OIDC), LDAP/Active Directory, and OAuth 2.0.

### SSO Manager

```typescript
import { createSSOManager, SSOManager } from '@philjs/enterprise/sso';

const ssoManager = createSSOManager();
```

### OIDC Configuration

```typescript
import { createOIDCConfig } from '@philjs/enterprise/sso';

const oidcConfig = createOIDCConfig({
  issuer: 'https://auth.example.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://app.example.com/callback',
  scopes: ['openid', 'profile', 'email'],
  responseType: 'code',
  pkce: true, // Enable PKCE for enhanced security
});

ssoManager.registerConfig('tenant-1', oidcConfig);
```

### SAML Configuration

```typescript
import { createSAMLConfig } from '@philjs/enterprise/sso';

const samlConfig = createSAMLConfig({
  entityId: 'https://app.example.com',
  ssoUrl: 'https://idp.example.com/sso',
  sloUrl: 'https://idp.example.com/slo',
  certificate: '-----BEGIN CERTIFICATE-----\n...',
  signatureAlgorithm: 'sha256',
  nameIdFormat: 'email',
  forceAuthn: false,
});

ssoManager.registerConfig('tenant-2', samlConfig);
```

### LDAP Configuration

```typescript
import { createLDAPConfig } from '@philjs/enterprise/sso';

const ldapConfig = createLDAPConfig({
  url: 'ldap://ldap.example.com:389',
  baseDN: 'dc=example,dc=com',
  bindDN: 'cn=admin,dc=example,dc=com',
  bindPassword: 'admin-password',
  userSearchBase: 'ou=users',
  userSearchFilter: '(uid={{username}})',
  groupSearchBase: 'ou=groups',
  useTLS: true,
});

ssoManager.registerConfig('tenant-3', ldapConfig);
```

### SSO Authentication Flow

```typescript
// 1. Initiate login
const { redirectUrl, state } = await ssoManager.initiateLogin('tenant-1', {
  returnUrl: '/dashboard',
});

// Redirect user to redirectUrl
res.redirect(redirectUrl);

// 2. Handle callback
const session = await ssoManager.handleCallback('tenant-1', {
  code: req.query.code,
  state: req.query.state,
});

// Access user info
console.log(session.user.email);
console.log(session.user.groups);

// 3. LDAP authentication (direct)
const user = await ssoManager.authenticateLDAP(
  'tenant-3',
  'username',
  'password'
);
```

### Session Management

```typescript
// Get session
const session = ssoManager.getSession(sessionId);

// Validate session
if (ssoManager.isSessionValid(sessionId)) {
  // Session is valid
}

// Logout
const { redirectUrl } = await ssoManager.initiateLogout('tenant-1', sessionId);
if (redirectUrl) {
  res.redirect(redirectUrl); // Redirect to IdP for SLO
}
```

### Attribute Mapping

```typescript
ssoManager.registerConfig('tenant-1', {
  provider: 'oidc',
  enabled: true,
  settings: oidcSettings,
  attributeMapping: {
    id: 'sub',
    email: 'email',
    firstName: 'given_name',
    lastName: 'family_name',
    displayName: 'name',
    groups: 'groups',
    roles: 'app_roles',
    department: 'department',
    custom: {
      employeeId: 'employee_number',
    },
  },
  provisioning: {
    enabled: true,
    createUsers: true,
    updateUsers: true,
    deactivateUsers: false,
    syncGroups: true,
    defaultRole: 'user',
    roleMapping: {
      'IdP-Admin': 'admin',
      'IdP-User': 'user',
    },
  },
});
```

### SSO Types

```typescript
type SSOProvider = 'saml' | 'oidc' | 'ldap' | 'oauth2';

interface SSOUser {
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

interface SSOSession {
  user: SSOUser;
  provider: SSOProvider;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: Date;
  sessionIndex?: string;
}
```

---

## Role-Based Access Control (RBAC)

The RBAC module provides fine-grained permission management with role inheritance.

### RBAC Manager

```typescript
import { createRBACManager, RBACManager } from '@philjs/enterprise/rbac';

const rbac = createRBACManager({
  roles: [
    {
      id: 'super_admin',
      name: 'Super Administrator',
      permissions: ['*'], // All permissions
    },
    {
      id: 'admin',
      name: 'Administrator',
      permissions: ['users:*', 'settings:*', 'content:*'],
      inherits: ['editor'], // Inherit editor permissions
    },
    {
      id: 'editor',
      name: 'Editor',
      permissions: ['content:read', 'content:write', 'content:publish'],
      inherits: ['viewer'],
    },
    {
      id: 'viewer',
      name: 'Viewer',
      permissions: ['content:read', 'profile:read'],
    },
  ],
  permissions: [
    {
      id: 'content:write',
      name: 'Write Content',
      resource: 'content',
      actions: ['create', 'update'],
      conditions: [
        { field: 'status', operator: 'ne', value: 'published' },
      ],
    },
  ],
  superAdminRole: 'super_admin',
});
```

### Permission Checks

```typescript
// Check specific permission
if (rbac.hasPermission(['editor'], 'content:write')) {
  // User can write content
}

// Check action on resource
if (rbac.can(['editor'], 'write', 'content')) {
  // User can write content
}

// Check with context (for conditional permissions)
if (rbac.can(['editor'], 'update', 'content', { status: 'draft' })) {
  // User can update draft content
}

// Get all permissions for roles
const permissions = rbac.getAllPermissions(['admin', 'editor']);
// Set { 'users:*', 'settings:*', 'content:*', 'content:read', ... }
```

### Role Management

```typescript
// Get role details
const role = rbac.getRole('admin');
// { id: 'admin', name: 'Administrator', permissions: [...], inherits: [...] }
```

### RBAC Types

```typescript
interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  inherits?: string[]; // Role inheritance
  tenantId?: string;
}

interface Permission {
  id: string;
  name: string;
  resource: string;
  actions: string[];
  conditions?: PermissionCondition[];
}

interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'contains' | 'startsWith';
  value: unknown;
}
```

---

## Audit Logging

The audit module provides comprehensive audit trails for compliance and security monitoring.

### Audit Logger

```typescript
import { createAuditLogger, createInMemoryStorage } from '@philjs/enterprise/audit';

const auditLogger = createAuditLogger({
  enabled: true,
  retentionDays: 365,
  storage: createInMemoryStorage(), // Use database storage in production
  realtime: true, // Immediate writes
  encrypt: true,
  pii: false, // Don't log PII
});
```

### Logging Events

```typescript
// Log an audit event
await auditLogger.log({
  tenantId: 'tenant-123',
  userId: 'user-456',
  userEmail: 'user@example.com',
  action: 'user.login',
  resource: 'auth',
  resourceId: 'session-789',
  outcome: 'success',
  severity: 'info',
  details: {
    method: 'password',
    mfaUsed: true,
  },
  metadata: {
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    sessionId: 'session-789',
    requestId: 'req-abc',
    geoLocation: { country: 'US', city: 'San Francisco' },
    deviceInfo: { type: 'desktop', os: 'macOS', browser: 'Chrome' },
  },
});
```

### Querying Audit Logs

```typescript
// Query audit logs
const events = await auditLogger.query({
  tenantId: 'tenant-123',
  userId: 'user-456',
  action: 'user.login',
  startDate: new Date('2024-01-01'),
  endDate: new Date(),
  outcome: 'success',
  severity: 'info',
  limit: 100,
  offset: 0,
});
```

### Custom Storage Backend

```typescript
import { AuditStorage, AuditEvent, AuditFilter } from '@philjs/enterprise/audit';

const databaseStorage: AuditStorage = {
  type: 'database',

  async write(event: AuditEvent): Promise<void> {
    await db.auditEvents.insert(event);
  },

  async query(filter: AuditFilter): Promise<AuditEvent[]> {
    return await db.auditEvents.find(filter);
  },

  async delete(filter: AuditFilter): Promise<number> {
    return await db.auditEvents.deleteMany(filter);
  },
};

const auditLogger = createAuditLogger({
  enabled: true,
  retentionDays: 2555, // 7 years for compliance
  storage: databaseStorage,
});
```

### Cleanup and Maintenance

```typescript
// Cleanup old events based on retention policy
const deletedCount = await auditLogger.cleanup();

// Flush buffered events (for non-realtime mode)
await auditLogger.flush();

// Destroy logger and cleanup resources
auditLogger.destroy();
```

### Audit Types

```typescript
interface AuditEvent {
  id: string;
  timestamp: Date;
  tenantId: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  metadata?: AuditMetadata;
  outcome: 'success' | 'failure' | 'pending';
  severity: 'info' | 'warning' | 'critical';
}

interface AuditMetadata {
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  geoLocation?: { country?: string; city?: string };
  deviceInfo?: { type?: string; os?: string; browser?: string };
}
```

---

## Feature Flags

The feature flags module enables gradual rollouts, A/B testing, and variant management.

### Feature Flag Manager

```typescript
import { createFeatureFlagManager, FeatureFlagManager } from '@philjs/enterprise/feature-flags';

const flags = createFeatureFlagManager([
  {
    id: 'new-dashboard',
    name: 'New Dashboard',
    description: 'Redesigned dashboard experience',
    enabled: true,
    rolloutPercentage: 50, // 50% of users
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    enabled: true,
    rules: [
      {
        conditions: [
          { attribute: 'tenantId', operator: 'in', value: ['premium', 'enterprise'] },
        ],
        result: true,
      },
    ],
  },
  {
    id: 'checkout-flow',
    name: 'Checkout Flow',
    enabled: true,
    variants: [
      { id: 'control', name: 'Control', weight: 50 },
      { id: 'variant-a', name: 'Variant A', weight: 25, payload: { buttonColor: 'blue' } },
      { id: 'variant-b', name: 'Variant B', weight: 25, payload: { buttonColor: 'green' } },
    ],
  },
]);
```

### Checking Flags

```typescript
// Simple boolean check
if (flags.isEnabled('new-dashboard')) {
  // Feature is enabled
}

// Check with context
const context = {
  userId: 'user-123',
  tenantId: 'premium',
  environment: 'production',
  attributes: {
    plan: 'enterprise',
    country: 'US',
  },
};

if (flags.isEnabled('dark-mode', context)) {
  // Dark mode enabled for this user
}

// Get evaluation result (boolean or variant ID)
const result = flags.evaluate('checkout-flow', context);
// true, false, or 'variant-a', 'variant-b'

// Get variant with payload
const variant = flags.getVariant('checkout-flow', context);
if (variant) {
  console.log(variant.id); // 'variant-a'
  console.log(variant.payload); // { buttonColor: 'blue' }
}
```

### Managing Flags

```typescript
// Update a flag
flags.setFlag({
  id: 'new-dashboard',
  name: 'New Dashboard',
  enabled: true,
  rolloutPercentage: 100, // Full rollout
});

// Get flag configuration
const flag = flags.getFlag('new-dashboard');

// Get all flags
const allFlags = flags.getAllFlags();

// Invalidate cache
flags.invalidateCache('new-dashboard'); // Specific flag
flags.invalidateCache(); // All flags
```

### Rule Conditions

```typescript
interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  rules?: FeatureRule[];
  variants?: FeatureVariant[];
  rolloutPercentage?: number;
  metadata?: Record<string, unknown>;
}

interface FeatureRule {
  conditions: RuleCondition[];
  result: boolean | string; // true/false or variant ID
}

interface RuleCondition {
  attribute: string;
  operator: 'eq' | 'ne' | 'in' | 'notIn' | 'gt' | 'lt' | 'contains' | 'regex';
  value: unknown;
}

// Example: Complex targeting rules
const flag: FeatureFlag = {
  id: 'beta-feature',
  name: 'Beta Feature',
  enabled: true,
  rules: [
    // Enable for beta testers
    {
      conditions: [
        { attribute: 'userType', operator: 'eq', value: 'beta' },
      ],
      result: true,
    },
    // Enable for US enterprise customers
    {
      conditions: [
        { attribute: 'country', operator: 'eq', value: 'US' },
        { attribute: 'plan', operator: 'in', value: ['enterprise', 'premium'] },
      ],
      result: true,
    },
    // Enable for specific email domains
    {
      conditions: [
        { attribute: 'email', operator: 'regex', value: '@(company1|company2)\\.com$' },
      ],
      result: true,
    },
  ],
};
```

---

## White-Labeling

The white-label module enables custom branding, theming, and domain configuration per tenant.

### White-Label Manager

```typescript
import { createWhiteLabelManager, WhiteLabelManager } from '@philjs/enterprise/white-label';

const whiteLabel = createWhiteLabelManager();

// Register tenant branding
whiteLabel.register({
  tenantId: 'acme-corp',
  branding: {
    appName: 'ACME Portal',
    logo: 'https://cdn.acme.com/logo.png',
    logoAlt: 'ACME Corporation',
    favicon: 'https://cdn.acme.com/favicon.ico',
    primaryColor: '#1a365d',
    secondaryColor: '#2563eb',
    accentColor: '#10b981',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    fontFamily: 'Inter, system-ui, sans-serif',
    customCSS: `
      .custom-header { background: linear-gradient(to right, #1a365d, #2563eb); }
    `,
  },
  customization: {
    hidePhilJSBranding: true,
    customFooter: 'Copyright 2024 ACME Corporation',
    customHeader: '<div class="custom-header">Welcome to ACME Portal</div>',
    loginBackground: 'https://cdn.acme.com/login-bg.jpg',
    emailTemplate: {
      fromName: 'ACME Portal',
      fromEmail: 'noreply@acme.com',
      replyTo: 'support@acme.com',
      footer: 'ACME Corporation | 123 Business St',
      logoUrl: 'https://cdn.acme.com/email-logo.png',
    },
    termsUrl: 'https://acme.com/terms',
    privacyUrl: 'https://acme.com/privacy',
    supportEmail: 'support@acme.com',
    supportUrl: 'https://support.acme.com',
  },
  domains: [
    { domain: 'portal.acme.com', type: 'primary', ssl: true, verified: true },
    { domain: 'app.acme.com', type: 'alias', ssl: true, verified: true },
    { domain: 'old.acme.com', type: 'redirect', ssl: true, verified: true },
  ],
});
```

### Using White-Label Config

```typescript
// Get full configuration
const config = whiteLabel.get('acme-corp');

// Get branding only
const branding = whiteLabel.getBranding('acme-corp');
// { appName: 'ACME Portal', primaryColor: '#1a365d', ... }

// Generate CSS variables
const css = whiteLabel.generateCSS('acme-corp');
// :root { --brand-primary: #1a365d; --brand-secondary: #2563eb; ... }

// Generate meta tags for HTML head
const metaTags = whiteLabel.getMetaTags('acme-corp');
// <title>ACME Portal</title><link rel="icon" href="..."/>...
```

### Applying Branding

```typescript
// Server-side: Inject CSS and meta tags
function renderHTML(tenantId: string) {
  const css = whiteLabel.generateCSS(tenantId);
  const metaTags = whiteLabel.getMetaTags(tenantId);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        ${metaTags}
        <style>${css}</style>
      </head>
      <body>
        <div id="app"></div>
      </body>
    </html>
  `;
}

// Client-side: Apply CSS variables
function applyBranding(tenantId: string) {
  const branding = whiteLabel.getBranding(tenantId);
  if (branding) {
    document.documentElement.style.setProperty('--brand-primary', branding.primaryColor);
    document.documentElement.style.setProperty('--brand-secondary', branding.secondaryColor);
  }
}
```

### White-Label Types

```typescript
interface WhiteLabelConfig {
  tenantId: string;
  branding: BrandingConfig;
  customization: CustomizationConfig;
  domains?: DomainConfig[];
}

interface BrandingConfig {
  appName: string;
  logo: string;
  logoAlt?: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  customCSS?: string;
}

interface CustomizationConfig {
  hidePhilJSBranding: boolean;
  customFooter?: string;
  customHeader?: string;
  loginBackground?: string;
  emailTemplate?: EmailTemplate;
  termsUrl?: string;
  privacyUrl?: string;
  supportEmail?: string;
  supportUrl?: string;
}

interface DomainConfig {
  domain: string;
  type: 'primary' | 'alias' | 'redirect';
  ssl: boolean;
  verified: boolean;
}
```

---

## Compliance Management

The compliance module provides tools for regulatory compliance including GDPR, CCPA, HIPAA, SOC2, and more.

### Compliance Manager

```typescript
import { createComplianceManager, ComplianceManager } from '@philjs/enterprise/compliance';

const compliance = createComplianceManager({
  frameworks: ['GDPR', 'HIPAA', 'SOC2'],

  dataRetention: {
    defaultPeriod: 365,
    autoDelete: true,
    archiveBeforeDelete: true,
    policies: [
      { dataType: 'logs', retentionDays: 90 },
      { dataType: 'audit', retentionDays: 2555, legalHold: true }, // 7 years
      { dataType: 'user_data', retentionDays: 365, archiveDays: 180 },
    ],
  },

  privacy: {
    anonymization: true,
    pseudonymization: true,
    encryptionAtRest: true,
    encryptionInTransit: true,
    piiHandling: {
      autoDetect: true,
      patterns: [], // Use defaults
      defaultAction: 'mask',
      logAccess: true,
    },
  },

  consent: {
    requireExplicit: true,
    categories: [
      { id: 'necessary', name: 'Necessary', description: 'Required for operation', required: true, default: true },
      { id: 'analytics', name: 'Analytics', description: 'Usage analytics', required: false, default: false },
      { id: 'marketing', name: 'Marketing', description: 'Marketing communications', required: false, default: false },
    ],
    storage: 'server',
    expirationDays: 365,
  },

  audit: {
    enabled: true,
    events: ['data_access', 'data_modification', 'consent_change', 'export_request'],
    retentionDays: 2555,
    exportFormat: 'json',
  },
});
```

### GDPR Data Subject Rights

```typescript
// Handle Data Subject Access Request (DSAR)
const accessResponse = await compliance.handleDataAccessRequest('user-123');
// { requestId, userId, data: { ... }, generatedAt, expiresAt }

// Handle Right to Erasure (Right to be Forgotten)
const erasureResponse = await compliance.handleErasureRequest('user-123', {
  retainLegalHold: true, // Retain data under legal hold
});
// { requestId, userId, deletedData: [...], retainedData: [...], completedAt }

// Handle Data Portability Request
const portabilityResponse = await compliance.handlePortabilityRequest('user-123', 'json');
// { requestId, userId, format: 'json', data: '...', generatedAt }
```

### Consent Management

```typescript
// Record user consent
const consent = compliance.recordConsent('user-123', {
  necessary: true,
  analytics: true,
  marketing: false,
}, {
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
});

// Check consent
if (compliance.hasConsent('user-123', 'analytics')) {
  // User has consented to analytics
}

// Get all consents
const consents = compliance.getUserConsents('user-123');

// Withdraw consent
compliance.withdrawConsent('user-123', ['marketing']); // Specific categories
compliance.withdrawConsent('user-123'); // All non-required categories
```

### PII Detection and Handling

```typescript
// Detect PII in data
const data = {
  name: 'John Doe',
  email: 'john@example.com',
  ssn: '123-45-6789',
  phone: '+1 (555) 123-4567',
};

const piiFields = compliance.detectPII(data);
// [
//   { field: 'email', type: 'email', value: 'jo**@exa***le.com', action: 'mask' },
//   { field: 'ssn', type: 'ssn', value: '[REDACTED]', action: 'redact' },
//   { field: 'phone', type: 'phone', value: '+1***(5**)*123-4567', action: 'mask' },
// ]

// Sanitize PII from data
const sanitized = compliance.sanitizePII(data);
// { name: 'John Doe', email: 'jo**@exa***le.com', ssn: '[REDACTED]', ... }

// Anonymize data
const anonymized = compliance.anonymize(data);
// { name: 'hash_abc123', email: 'hash_def456', ... }

// Pseudonymize with mapping
const pseudonymMap = new Map([
  ['john@example.com', 'user_001'],
  ['John Doe', 'User 001'],
]);
const pseudonymized = compliance.pseudonymize(data, pseudonymMap);
// { name: 'User 001', email: 'user_001', ... }
```

### Data Retention

```typescript
// Apply retention policies
const result = await compliance.applyRetentionPolicies();
// { processed: 100, deleted: 50, archived: 30, errors: [] }

// Get retention status for data
const status = compliance.getRetentionStatus('user_data', new Date('2023-01-01'));
// {
//   dataType: 'user_data',
//   createdAt: Date,
//   expiresAt: Date,
//   daysRemaining: 180,
//   legalHold: false,
//   willArchive: true,
//   willDelete: true,
// }
```

### Audit Logging

```typescript
// Get audit log
const auditLog = compliance.getAuditLog({
  userId: 'user-123',
  eventType: 'data_access',
  startDate: new Date('2024-01-01'),
  endDate: new Date(),
});

// Export audit log
const exportedLog = compliance.exportAuditLog('json', {
  userId: 'user-123',
});
```

### Compliance Reports

```typescript
// Generate compliance report
const report = await compliance.generateComplianceReport('GDPR');
// {
//   framework: 'GDPR',
//   generatedAt: Date,
//   overallScore: 85,
//   passedControls: 17,
//   failedControls: 3,
//   controls: [
//     { controlId: 'gdpr-1', name: 'Consent Management', status: 'pass' },
//     { controlId: 'gdpr-2', name: 'Data Access Rights', status: 'pass' },
//     ...
//   ],
//   recommendations: [
//     'Enable encryption at rest',
//     ...
//   ],
// }
```

### Compliance Types

```typescript
type ComplianceFramework =
  | 'GDPR'
  | 'CCPA'
  | 'HIPAA'
  | 'SOC2'
  | 'ISO27001'
  | 'PCI-DSS'
  | 'FERPA'
  | 'COPPA';

type AuditEventType =
  | 'data_access'
  | 'data_modification'
  | 'data_deletion'
  | 'consent_change'
  | 'export_request'
  | 'login'
  | 'logout'
  | 'permission_change'
  | 'config_change';

interface UserConsent {
  userId: string;
  consents: Record<string, boolean>;
  timestamp: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  version: string;
}

interface ComplianceReport {
  framework: ComplianceFramework;
  generatedAt: Date;
  overallScore: number;
  passedControls: number;
  failedControls: number;
  controls: ControlResult[];
  recommendations: string[];
}
```

---

## Types Reference

### Multi-Tenancy Types

| Type | Description |
|------|-------------|
| `Tenant` | Tenant entity with settings and branding |
| `TenantSettings` | Tenant configuration options |
| `TenantBranding` | Tenant visual branding |
| `TenantContext` | Current tenant context with user |
| `TenantUser` | User within a tenant |
| `MultiTenancyConfig` | Tenant manager configuration |

### SSO Types

| Type | Description |
|------|-------------|
| `SSOProvider` | SSO provider type: `'saml' \| 'oidc' \| 'ldap' \| 'oauth2'` |
| `SSOConfig` | SSO configuration wrapper |
| `SAMLConfig` | SAML 2.0 configuration |
| `OIDCConfig` | OpenID Connect configuration |
| `LDAPConfig` | LDAP/AD configuration |
| `OAuth2Config` | OAuth 2.0 configuration |
| `SSOUser` | Authenticated user from SSO |
| `SSOSession` | Active SSO session |
| `AttributeMapping` | IdP to app attribute mapping |
| `ProvisioningConfig` | User provisioning settings |

### RBAC Types

| Type | Description |
|------|-------------|
| `Role` | Role with permissions and inheritance |
| `Permission` | Permission with conditions |
| `PermissionCondition` | Conditional permission rule |
| `RBACConfig` | RBAC manager configuration |

### Audit Types

| Type | Description |
|------|-------------|
| `AuditEvent` | Audit log entry |
| `AuditMetadata` | Event metadata (IP, user agent, etc.) |
| `AuditConfig` | Audit logger configuration |
| `AuditStorage` | Storage backend interface |
| `AuditFilter` | Query filter options |

### Feature Flag Types

| Type | Description |
|------|-------------|
| `FeatureFlag` | Feature flag configuration |
| `FeatureRule` | Targeting rule |
| `RuleCondition` | Rule condition |
| `FeatureVariant` | A/B test variant |
| `EvaluationContext` | Flag evaluation context |

### White-Label Types

| Type | Description |
|------|-------------|
| `WhiteLabelConfig` | Full white-label configuration |
| `BrandingConfig` | Visual branding settings |
| `CustomizationConfig` | UI customization options |
| `DomainConfig` | Custom domain configuration |
| `EmailTemplate` | Email branding template |

### Compliance Types

| Type | Description |
|------|-------------|
| `ComplianceConfig` | Compliance manager configuration |
| `ComplianceFramework` | Supported frameworks |
| `DataRetentionConfig` | Data retention settings |
| `DataRetentionPolicy` | Per-type retention policy |
| `PrivacyConfig` | Privacy settings |
| `PIIHandlingConfig` | PII detection and handling |
| `PIIPattern` | PII detection pattern |
| `ConsentConfig` | Consent management settings |
| `ConsentCategory` | Consent category definition |
| `UserConsent` | User consent record |
| `ComplianceReport` | Compliance audit report |

---

## API Reference

### Multi-Tenancy API

| Function/Class | Description |
|----------------|-------------|
| `createTenantManager(config)` | Create tenant manager instance |
| `createTenantMiddleware(manager)` | Create HTTP middleware for tenant resolution |
| `createDefaultTenantSettings()` | Get default tenant settings |
| `createDefaultBranding()` | Get default tenant branding |
| `tenantScope(query, tenantId)` | Filter query results by tenant |
| `withTenantId(data, tenantId)` | Add tenant ID to data |
| `tenantKey(tenantId, key)` | Create tenant-scoped storage key |
| `TenantManager` | Tenant management class |

### SSO API

| Function/Class | Description |
|----------------|-------------|
| `createSSOManager()` | Create SSO manager instance |
| `createSAMLConfig(config)` | Create SAML configuration |
| `createOIDCConfig(config)` | Create OIDC configuration |
| `createLDAPConfig(config)` | Create LDAP configuration |
| `SSOManager` | SSO authentication manager class |

### RBAC API

| Function/Class | Description |
|----------------|-------------|
| `createRBACManager(config)` | Create RBAC manager instance |
| `RBACManager` | Role-based access control class |

### Audit API

| Function/Class | Description |
|----------------|-------------|
| `createAuditLogger(config)` | Create audit logger instance |
| `createInMemoryStorage()` | Create in-memory audit storage |
| `AuditLogger` | Audit logging class |

### Feature Flags API

| Function/Class | Description |
|----------------|-------------|
| `createFeatureFlagManager(flags)` | Create feature flag manager |
| `FeatureFlagManager` | Feature flag management class |

### White-Label API

| Function/Class | Description |
|----------------|-------------|
| `createWhiteLabelManager()` | Create white-label manager |
| `WhiteLabelManager` | White-label configuration class |

### Compliance API

| Function/Class | Description |
|----------------|-------------|
| `createComplianceManager(config)` | Create compliance manager |
| `ComplianceManager` | Compliance management class |

---

## Complete Example

```typescript
import {
  createTenantManager,
  createSSOManager,
  createRBACManager,
  createAuditLogger,
  createFeatureFlagManager,
  createWhiteLabelManager,
  createComplianceManager,
  createInMemoryStorage,
  createOIDCConfig,
} from '@philjs/enterprise';

// Initialize all enterprise features
const tenantManager = createTenantManager({
  strategy: 'subdomain',
  loadTenant: async (slug) => db.tenants.findBySlug(slug),
});

const ssoManager = createSSOManager();

const rbac = createRBACManager({
  roles: [
    { id: 'admin', name: 'Admin', permissions: ['*'] },
    { id: 'user', name: 'User', permissions: ['read:*'] },
  ],
  permissions: [],
});

const auditLogger = createAuditLogger({
  enabled: true,
  retentionDays: 365,
  storage: createInMemoryStorage(),
  realtime: true,
});

const flags = createFeatureFlagManager([
  { id: 'new-ui', name: 'New UI', enabled: true, rolloutPercentage: 50 },
]);

const whiteLabel = createWhiteLabelManager();

const compliance = createComplianceManager({
  frameworks: ['GDPR', 'SOC2'],
});

// Middleware example
async function handleRequest(req: Request): Promise<Response> {
  // 1. Resolve tenant
  const url = new URL(req.url);
  const tenant = await tenantManager.resolveTenant({
    hostname: url.hostname,
  });

  if (!tenant) {
    return new Response('Tenant not found', { status: 404 });
  }

  // 2. Apply branding
  whiteLabel.register({
    tenantId: tenant.id,
    branding: tenant.branding!,
    customization: { hidePhilJSBranding: true },
  });

  // 3. Set up SSO if enabled
  if (tenant.settings.ssoEnabled) {
    const ssoConfig = await db.ssoConfigs.findByTenant(tenant.id);
    if (ssoConfig) {
      ssoManager.registerConfig(tenant.id, ssoConfig);
    }
  }

  // 4. Check feature flags
  const context = { tenantId: tenant.id };
  const showNewUI = flags.isEnabled('new-ui', context);

  // 5. Log audit event
  await auditLogger.log({
    tenantId: tenant.id,
    action: 'page.view',
    resource: 'dashboard',
    outcome: 'success',
    severity: 'info',
  });

  // 6. Return response with branding
  const css = whiteLabel.generateCSS(tenant.id);

  return new Response(renderApp({ showNewUI, css }), {
    headers: { 'Content-Type': 'text/html' },
  });
}
```

---

## Next Steps

- [Multi-Tenancy Guide](./multi-tenancy.md) - Deep dive into tenant isolation
- [SSO Integration](./sso.md) - Enterprise authentication patterns
- [RBAC Best Practices](./rbac.md) - Permission management strategies
- [Compliance Checklist](./compliance.md) - Meeting regulatory requirements
