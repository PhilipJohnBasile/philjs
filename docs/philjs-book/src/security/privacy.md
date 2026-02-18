# Privacy Best Practices

Building privacy-preserving applications requires a defense-in-depth approach. PhilJS provides tools and patterns to help you minimize data exposure and comply with regulations.

## Core Principles

1.  **Data Minimization**: Collect only what you need.
2.  **Purpose Limitation**: Use data only for the stated purpose.
3.  **Storage Limitation**: Keep data only as long as necessary.
4.  **Integrity and Confidentiality**: Protect data from unauthorized access.

## Implementation Guide

### 1. Data Classification

Tag your data models to automate privacy controls.

```typescript
// Define schema with privacy tags
const userSchema = z.object({
  id: z.string(),
  email: z.string().tag('PII'),
  preferences: z.object({
    theme: z.string()
  }).tag('Public')
});
```

### 2. PII Redaction

Use the Enterprise Compliance module to automatically redact PII in logs and dumps.

```typescript
import { ComplianceManager } from '@philjs/enterprise/compliance';

const compliance = new ComplianceManager();
logger.addProcessor(msg => compliance.sanitizePII(msg));
```

### 3. Cookies & Tracking

PhilJS recommends a strictly necessary by default approach for cookies.

-   Use `SameSite=Strict` or `Lax` for all cookies.
-   Mark cookies as `Secure` and `HttpOnly`.
-   Use the [`@philjs/enterprise/compliance`](../packages/enterprise/compliance.md) module to manage consent.

### 4. Third-Party Scripts

Load third-party scripts (Analytics, Ads) only after consent is granted.

```tsx
<Script
  src="https://analytics.example.com/js"
  strategy="worker" // Run in web worker to isolate access
  consent="analytics" // Only load if 'analytics' consent is true
/>
```

## Security Headers

Ensure your application sends appropriate headers to prevent data leaks.

-   `Referrer-Policy: strict-origin-when-cross-origin`
-   `Permissions-Policy: geolocation=(), camera=(), microphone=()`

## Related Documentation

-   [Compliance Module](../packages/enterprise/compliance.md) - GDPR/CCPA tools
-   [Security Overview](./overview.md) - General security practices
