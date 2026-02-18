# Compliance & Privacy

The PhilJS Compliance module provides a standardized interface for handling regulatory requirements like GDPR, CCPA, HIPAA, and SOC 2.

## Features

-   **PII Detection & Redaction**: Automatically detect and mask sensitive data.
-   **Consent Management**: Universal consent tracking (cookie banners, etc.).
-   **Audit Logging**: Immutable logs for security events.
-   **Data Retention**: Automated cleanup policies.
-   **DSAR Handling**: Helpers for Data Subject Access Requests.

## PII Handling

Configure how Personally Identifiable Information (PII) is handled in logs and storage.

```typescript
import { ComplianceManager } from '@philjs/enterprise/compliance';

const compliance = new ComplianceManager({
  privacy: {
    piiHandling: {
      autoDetect: true,
      defaultAction: 'mask',
      patterns: [
        // Built-in patterns: email, phone, ssn, credit_card
        {
          name: 'internal_id',
          pattern: /INT-\d{5}/,
          action: 'redact'
        }
      ]
    }
  }
});

// Usage
const safeData = compliance.sanitizePII({
  user: 'Alice',
  email: 'alice@example.com',
  creditCard: '4242-4242-4242-4242'
});

// Output:
// {
//   user: 'Alice',
//   email: 'al**@**.com',
//   creditCard: '***********4242'
// }
```

## Audit Logging

Log security-critical events for compliance audits.

```typescript
compliance.logAudit('data_access', userId, {
  resource: 'medical_record',
  recordId: '123',
  action: 'read'
});
```

Export logs for auditors (JSON/CSV/XML):

```typescript
const report = compliance.exportAuditLog('csv', {
  startDate: new Date('2023-01-01'),
  eventType: 'data_access'
});
```

## GDPR Requests (DSAR)

Automated handlers for "Right to Access" and "Right to Erasure".

```typescript
// Handle "Download My Data"
const exportPackage = await compliance.handleDataAccessRequest(userId);

// Handle "Delete My Account"
const deletionReport = await compliance.handleErasureRequest(userId, {
  retainLegalHold: true // Don't delete tax records
});
```

## Consent Management

Manage user consent for cookies and data processing.

```typescript
// Record consent
compliance.recordConsent(userId, {
  necessary: true,
  analytics: true,
  marketing: false
});

// Check consent before tracking
if (compliance.hasConsent(userId, 'analytics')) {
  trackPageview();
}
```
