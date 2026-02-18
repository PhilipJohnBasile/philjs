# Single Sign-On (SSO)

PhilJS Enterprise includes a production-ready SSO engine supporting SAML, OIDC, and LDAP. It abstracts away the complexity of parsing XML assertions and verifying signatures.

## Supported Providers

-   **SAML 2.0**: Okta, OneLogin, Salesforce, Shibboleth.
-   **OIDC (OpenID Connect)**: Google, Auth0, Microsoft Azure AD.
-   **LDAP**: Active Directory.
-   **OAuth 2.0**: GitHub, Facebook, etc.

## Configuration

Configure SSO per-tenant.

```typescript
import { createSSOManager, createSAMLConfig } from '@philjs/enterprise/sso';

const sso = createSSOManager();

// Configure SAML for Tenant A
sso.registerConfig('tenant-a', createSAMLConfig({
  entityId: 'https://api.myapp.com/sso/saml/metadata',
  ssoUrl: 'https://idp.example.com/sso',
  certificate: '-----BEGIN CERTIFICATE-----\n...',
  attributeMapping: {
    email: 'User.Email',
    firstName: 'User.FirstName',
    role: 'User.Role'
  }
}));
```

## Implementation Flow

### 1. Initiate Login

Redirect the user to the Identity Provider (IdP).

```typescript
// Route: /auth/login/:tenantId
export async function login({ params }) {
  const result = await sso.initiateLogin(params.tenantId);
  return redirect(result.redirectUrl);
}
```

### 2. Handle Callback

Process the response from the IdP.

```typescript
// Route: /auth/callback
export async function callback({ request }) {
  const formData = await request.formData();
  
  try {
    const session = await sso.handleCallback('tenant-a', {
      samlResponse: formData.get('SAMLResponse')
    });
    
    // session.user contains normalized user data
    console.log(session.user.email); 
    
    return createUserSession(session.user);
  } catch (err) {
    return new Response('SSO Failed', { status: 401 });
  }
}
```

## Attribute Mapping

Different IdPs send user data in different formats. PhilJS normalizes this using `attributeMapping`.

```typescript
attributeMapping: {
  // Map incoming 'urn:oid:0.9.2342.19200300.100.1.3' to 'email'
  email: 'urn:oid:0.9.2342.19200300.100.1.3',
  // Map 'givenName' to 'firstName'
  firstName: 'givenName'
}
```
