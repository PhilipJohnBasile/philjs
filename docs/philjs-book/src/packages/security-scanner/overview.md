# @philjs/security-scanner

The `@philjs/security-scanner` package provides industry-first framework-native security scanning for PhilJS applications. It offers static code analysis, dependency vulnerability checking, runtime security monitoring, and security headers validation.

## Installation

```bash
npm install @philjs/security-scanner
# or
pnpm add @philjs/security-scanner
# or
bun add @philjs/security-scanner
```

## Features

- **Static Code Analysis** - Detect common vulnerabilities like XSS, SQL injection, and eval usage
- **Dependency Scanning** - Check npm dependencies against vulnerability databases
- **Runtime Monitoring** - Real-time detection of CSP violations and suspicious activity
- **Security Headers Validation** - Validate and generate recommended HTTP security headers
- **Custom Rules** - Extend with your own security rules and patterns
- **Severity Filtering** - Filter vulnerabilities by severity threshold
- **Hooks Integration** - PhilJS-native hooks for component-level security

## Quick Start

```typescript
import { SecurityScanner } from '@philjs/security-scanner';

// Create a scanner instance
const scanner = new SecurityScanner();

// Initialize the vulnerability database
await scanner.initialize();

// Scan code for vulnerabilities
const code = `
  const userInput = req.query.name;
  document.innerHTML = userInput;
  eval(userInput);
`;

const vulnerabilities = scanner.scanCode(code, 'user-form.ts');

console.log(vulnerabilities);
// [
//   { type: 'xss', severity: 'high', title: 'Potential XSS via innerHTML' },
//   { type: 'command-injection', severity: 'critical', title: 'Code Injection via eval()' }
// ]

// Start runtime monitoring
scanner.startRuntimeMonitoring();

// Subscribe to security alerts
scanner.onRuntimeAlert((alert) => {
  console.log('Security alert:', alert.message);
});
```

---

## Static Code Scanner

The `StaticScanner` class analyzes source code for security vulnerabilities using pattern matching and custom rules.

### Basic Usage

```typescript
import { StaticScanner } from '@philjs/security-scanner';
import type { ScanConfig } from '@philjs/security-scanner';

// Create with default configuration
const scanner = new StaticScanner();

// Or with custom configuration
const config: ScanConfig = {
  severityThreshold: 'medium',
  excludePaths: ['node_modules', 'dist', 'test'],
  disabledRules: ['regex-dos'],
};

const customScanner = new StaticScanner(config);
```

### Scanning Individual Files

```typescript
import { StaticScanner } from '@philjs/security-scanner';

const scanner = new StaticScanner();

const code = `
  const apiKey = "sk-abc123def456";
  const query = "SELECT * FROM users WHERE id = " + req.params.id;
`;

const vulnerabilities = scanner.scanCode(code, 'database.ts');

for (const vuln of vulnerabilities) {
  console.log(`[${vuln.severity.toUpperCase()}] ${vuln.title}`);
  console.log(`  File: ${vuln.location?.file}:${vuln.location?.line}`);
  console.log(`  Fix: ${vuln.remediation}`);
}

// Output:
// [HIGH] Hardcoded Secret Detected
//   File: database.ts:2
//   Fix: Use environment variables or a secrets manager
// [CRITICAL] Potential SQL Injection
//   File: database.ts:3
//   Fix: Use parameterized queries or prepared statements
```

### Scanning Multiple Files

```typescript
import { StaticScanner } from '@philjs/security-scanner';
import type { ScanResult } from '@philjs/security-scanner';

const scanner = new StaticScanner();

const files = [
  { name: 'auth.ts', content: 'eval(req.body.code);' },
  { name: 'api.ts', content: 'document.write(userInput);' },
  { name: 'utils.ts', content: 'const safe = "hello";' },
];

const result: ScanResult = scanner.scanFiles(files);

console.log(`Scan completed in ${result.duration}ms`);
console.log(`Total vulnerabilities: ${result.summary.total}`);
console.log(`  Critical: ${result.summary.critical}`);
console.log(`  High: ${result.summary.high}`);
console.log(`  Medium: ${result.summary.medium}`);
console.log(`  Low: ${result.summary.low}`);
console.log(`  Info: ${result.summary.info}`);
```

### Adding Custom Rules

```typescript
import { StaticScanner } from '@philjs/security-scanner';
import type { SecurityRule, Vulnerability } from '@philjs/security-scanner';

const scanner = new StaticScanner();

// Define a custom security rule
const noConsoleLog: SecurityRule = {
  id: 'no-console-log',
  name: 'No Console Log in Production',
  description: 'Detects console.log statements that may leak sensitive data',
  type: 'sensitive-data-exposure',
  severity: 'low',
  pattern: /console\.log\s*\(/g,
  check: (code: string, filename: string): Vulnerability[] => {
    const vulnerabilities: Vulnerability[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      if (/console\.log\s*\(/.test(line)) {
        vulnerabilities.push({
          id: `no-console-log-${index}`,
          type: 'sensitive-data-exposure',
          severity: 'low',
          title: 'Console.log Detected',
          description: 'Console statements may leak sensitive information in production',
          location: {
            file: filename,
            line: index + 1,
            snippet: line.trim(),
          },
          remediation: 'Remove console.log or use a proper logging library',
        });
      }
    });

    return vulnerabilities;
  },
};

// Add the custom rule
scanner.addRule(noConsoleLog);
```

### Configuration Options

```typescript
import { StaticScanner } from '@philjs/security-scanner';
import type { ScanConfig } from '@philjs/security-scanner';

const config: ScanConfig = {
  // Only run these specific rules
  enabledRules: ['xss-innerhtml', 'sql-injection', 'eval-injection'],

  // Or disable specific rules
  disabledRules: ['regex-dos'],

  // Minimum severity to report
  severityThreshold: 'medium', // 'critical' | 'high' | 'medium' | 'low' | 'info'

  // Paths to exclude from scanning
  excludePaths: [
    'node_modules',
    'dist',
    'coverage',
    '*.test.ts',
    '*.spec.ts',
  ],

  // Add custom rules
  customRules: [
    {
      id: 'custom-rule',
      name: 'Custom Rule',
      description: 'My custom security check',
      type: 'security-misconfiguration',
      severity: 'medium',
      pattern: /dangerouslySetInnerHTML/g,
      check: (code, filename) => [],
    },
  ],
};

const scanner = new StaticScanner(config);
```

---

## Built-in Security Rules

The scanner includes 8 built-in security rules covering common vulnerabilities:

### XSS Detection

```typescript
// Rule: xss-innerhtml
// Severity: high
// CWE: CWE-79

// Detected:
element.innerHTML = userInput;       // Dynamic assignment
container.innerHTML = data.html;     // Variable assignment

// Not detected:
element.innerHTML = '<div>static</div>';  // Static string
element.textContent = userInput;          // Safe alternative
```

```typescript
// Rule: xss-document-write
// Severity: high
// CWE: CWE-79

// Detected:
document.write(content);
document.write('<script>' + userCode + '</script>');

// Remediation: Use DOM manipulation methods instead
const el = document.createElement('div');
el.textContent = content;
document.body.appendChild(el);
```

### Command Injection

```typescript
// Rule: eval-injection
// Severity: critical
// CWE: CWE-95

// Detected:
eval(userInput);
eval('return ' + expression);
const fn = new Function(code);

// Remediation: Use JSON.parse() for JSON, avoid dynamic code execution
const data = JSON.parse(userInput);
```

### SQL Injection

```typescript
// Rule: sql-injection
// Severity: critical
// CWE: CWE-89

// Detected:
const query = "SELECT * FROM users WHERE id = " + req.params.id;
const sql = `DELETE FROM orders WHERE user = '${req.body.user}'`;

// Remediation: Use parameterized queries
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [req.params.id]);
```

### Hardcoded Secrets

```typescript
// Rule: hardcoded-secret
// Severity: high
// CWE: CWE-798

// Detected:
const apiKey = "sk_live_abc123def456";
const password = "supersecretpassword";
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// Not detected (uses environment variables):
const apiKey = process.env.API_KEY;

// Remediation: Use environment variables or a secrets manager
import { config } from 'dotenv';
config();
const apiKey = process.env.API_KEY;
```

### Open Redirect

```typescript
// Rule: open-redirect
// Severity: medium
// CWE: CWE-601

// Detected:
window.location = req.query.redirect;
location.href = params.url;
location.assign(query.next);

// Remediation: Validate against an allowlist
const allowedUrls = ['/', '/dashboard', '/profile'];
if (allowedUrls.includes(redirectUrl)) {
  window.location = redirectUrl;
}
```

### Prototype Pollution

```typescript
// Rule: prototype-pollution
// Severity: high
// CWE: CWE-1321

// Detected:
obj["__proto__"] = payload;
obj["constructor"] = malicious;
obj["prototype"] = attack;

// Remediation: Validate keys and use null prototype objects
const safeObj = Object.create(null);
if (!['__proto__', 'constructor', 'prototype'].includes(key)) {
  safeObj[key] = value;
}
```

### ReDoS (Regular Expression Denial of Service)

```typescript
// Rule: regex-dos
// Severity: medium
// CWE: CWE-1333

// Detected:
new RegExp(userInput);
new RegExp('.*' + pattern + '.*');

// Remediation: Sanitize input or use a safe regex library
import { escape } from 'lodash';
const safePattern = new RegExp(escape(userInput));
```

---

## Dependency Scanner

The `DependencyScanner` checks your npm dependencies against known vulnerability databases.

### Basic Usage

```typescript
import { DependencyScanner } from '@philjs/security-scanner';

const scanner = new DependencyScanner();

// Load the vulnerability database
await scanner.loadVulnerabilityDatabase();

// Scan dependencies from package.json
const dependencies = {
  'lodash': '^4.17.15',
  'express': '^4.18.0',
  'axios': '^1.0.0',
};

const vulnerabilities = scanner.scanDependencies(dependencies);

for (const vuln of vulnerabilities) {
  console.log(`[${vuln.vulnerability.severity.toUpperCase()}] ${vuln.package}@${vuln.version}`);
  console.log(`  ${vuln.vulnerability.title}`);
  console.log(`  Patched in: ${vuln.vulnerability.patchedVersions}`);
}
```

### Integration with package.json

```typescript
import { DependencyScanner } from '@philjs/security-scanner';
import { readFileSync } from 'fs';

async function scanProjectDependencies() {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));

  const allDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const scanner = new DependencyScanner();
  await scanner.loadVulnerabilityDatabase();

  const vulnerabilities = scanner.scanDependencies(allDependencies);

  if (vulnerabilities.length > 0) {
    console.error(`Found ${vulnerabilities.length} vulnerable dependencies!`);
    process.exit(1);
  }

  console.log('All dependencies are secure!');
}
```

---

## Runtime Monitor

The `RuntimeMonitor` provides real-time security monitoring for browser environments.

### Basic Usage

```typescript
import { RuntimeMonitor } from '@philjs/security-scanner';

const monitor = new RuntimeMonitor();

// Start monitoring
monitor.start();

// Subscribe to alerts
const unsubscribe = monitor.onAlert((alert) => {
  console.log(`[${alert.severity}] ${alert.type}: ${alert.message}`);
  console.log('Details:', alert.details);
  console.log('URL:', alert.url);
  console.log('Timestamp:', new Date(alert.timestamp));
});

// Get all alerts
const alerts = monitor.getAlerts();

// Clear alerts
monitor.clearAlerts();

// Stop monitoring
monitor.stop();

// Cleanup subscription
unsubscribe();
```

### Alert Types

The runtime monitor detects four types of security events:

```typescript
import type { RuntimeAlert } from '@philjs/security-scanner';

// CSP Violation - When Content Security Policy is violated
const cspAlert: RuntimeAlert = {
  id: 'alert-123',
  type: 'csp-violation',
  severity: 'high',
  message: 'CSP violation: script-src',
  details: {
    blockedURI: 'https://evil.com/script.js',
    violatedDirective: 'script-src',
    originalPolicy: "default-src 'self'",
  },
  timestamp: Date.now(),
  url: 'https://myapp.com/page',
};

// XSS Attempt - When suspicious inline scripts are injected
const xssAlert: RuntimeAlert = {
  type: 'xss-attempt',
  severity: 'critical',
  message: 'Suspicious inline script detected',
  details: {
    scriptContent: 'document.cookie...',
  },
  // ...
};

// Suspicious Activity - Security-related console errors
const suspiciousAlert: RuntimeAlert = {
  type: 'suspicious-activity',
  severity: 'medium',
  message: 'Security-related console error',
  details: {
    message: 'Blocked by CORS policy',
  },
  // ...
};

// Data Leak - Potential sensitive data exposure
const dataLeakAlert: RuntimeAlert = {
  type: 'data-leak',
  severity: 'high',
  message: 'Potential data leak detected',
  details: {
    // ...
  },
  // ...
};
```

### Integration with Error Reporting

```typescript
import { RuntimeMonitor } from '@philjs/security-scanner';

const monitor = new RuntimeMonitor();
monitor.start();

// Send alerts to your error reporting service
monitor.onAlert((alert) => {
  if (alert.severity === 'critical' || alert.severity === 'high') {
    // Send to Sentry, DataDog, etc.
    reportSecurityIncident({
      type: alert.type,
      message: alert.message,
      severity: alert.severity,
      metadata: {
        url: alert.url,
        timestamp: alert.timestamp,
        details: alert.details,
      },
    });
  }
});
```

---

## Headers Validator

The `HeadersValidator` validates and generates HTTP security headers.

### Validating Headers

```typescript
import { HeadersValidator } from '@philjs/security-scanner';
import type { SecurityHeaders } from '@philjs/security-scanner';

const validator = new HeadersValidator();

// Check your current headers
const currentHeaders: SecurityHeaders = {
  'Content-Security-Policy': "default-src 'self' 'unsafe-inline'",
  'X-Content-Type-Options': 'nosniff',
  // Missing X-Frame-Options, HSTS, etc.
};

const issues = validator.validateHeaders(currentHeaders);

for (const issue of issues) {
  console.log(`[${issue.severity}] ${issue.title}`);
  console.log(`  ${issue.description}`);
  console.log(`  Fix: ${issue.remediation}`);
}

// Output:
// [MEDIUM] CSP allows unsafe-inline
//   unsafe-inline reduces XSS protection
//   Fix: Remove unsafe-inline and use nonces or hashes instead
// [MEDIUM] Missing X-Frame-Options Header
//   Helps prevent clickjacking attacks
//   Fix: Add X-Frame-Options: DENY or SAMEORIGIN header
// [MEDIUM] Missing Strict-Transport-Security Header
//   Ensures browser only connects via HTTPS
//   Fix: Add Strict-Transport-Security header with appropriate max-age
```

### Generating Recommended Headers

```typescript
import { HeadersValidator } from '@philjs/security-scanner';

const validator = new HeadersValidator();

const recommendedHeaders = validator.generateRecommendedHeaders();

console.log(recommendedHeaders);
// {
//   'Content-Security-Policy': "default-src 'self'; script-src 'self'; ...",
//   'X-Content-Type-Options': 'nosniff',
//   'X-Frame-Options': 'DENY',
//   'X-XSS-Protection': '1; mode=block',
//   'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
//   'Referrer-Policy': 'strict-origin-when-cross-origin',
//   'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
// }
```

### Setting Headers in Your Server

```typescript
import { HeadersValidator } from '@philjs/security-scanner';

const validator = new HeadersValidator();
const headers = validator.generateRecommendedHeaders();

// Express.js
app.use((req, res, next) => {
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
});

// Hono
app.use('*', async (c, next) => {
  await next();
  Object.entries(headers).forEach(([key, value]) => {
    c.header(key, value);
  });
});
```

---

## Main SecurityScanner Class

The `SecurityScanner` class combines all scanning capabilities into a unified interface.

### Complete Example

```typescript
import { SecurityScanner } from '@philjs/security-scanner';
import type { ScanConfig } from '@philjs/security-scanner';

// Configure the scanner
const config: ScanConfig = {
  severityThreshold: 'low',
  excludePaths: ['node_modules', 'dist'],
};

// Create the scanner
const scanner = new SecurityScanner(config);

// Initialize (loads vulnerability database)
await scanner.initialize();

// Scan source code
const codeVulnerabilities = scanner.scanCode(sourceCode, 'app.ts');

// Scan multiple files
const scanResult = scanner.scanFiles([
  { name: 'auth.ts', content: authCode },
  { name: 'api.ts', content: apiCode },
]);

// Scan dependencies
const depVulnerabilities = scanner.scanDependencies({
  'lodash': '^4.17.15',
  'express': '^4.18.0',
});

// Validate headers
const headerIssues = scanner.validateHeaders({
  'Content-Security-Policy': "default-src 'self'",
});

// Get recommended headers
const recommendedHeaders = scanner.getRecommendedHeaders();

// Start runtime monitoring
scanner.startRuntimeMonitoring();

// Subscribe to runtime alerts
const unsubscribe = scanner.onRuntimeAlert((alert) => {
  console.log('Security alert:', alert);
});

// Get all runtime alerts
const alerts = scanner.getRuntimeAlerts();

// Stop monitoring
scanner.stopRuntimeMonitoring();

// Add custom rules
scanner.addCustomRule({
  id: 'custom-check',
  name: 'Custom Security Check',
  description: 'My custom rule',
  type: 'security-misconfiguration',
  severity: 'medium',
  pattern: /CUSTOM_PATTERN/g,
  check: (code, filename) => [],
});
```

---

## Hooks

The package provides PhilJS-native hooks for component-level security integration.

### useSecurityScanner

Initialize and use the security scanner in components:

```typescript
import { useSecurityScanner } from '@philjs/security-scanner';

function SecurityDashboard() {
  const { scanner, isReady, scanCode, scanDependencies } = useSecurityScanner({
    severityThreshold: 'medium',
  });

  function handleScan(code: string) {
    if (!isReady) return;

    const vulnerabilities = scanCode(code, 'user-input.ts');
    console.log('Found vulnerabilities:', vulnerabilities);
  }

  function checkDependencies(deps: Record<string, string>) {
    const vulnerabilities = scanDependencies(deps);
    console.log('Vulnerable dependencies:', vulnerabilities);
  }

  return (
    <div>
      {isReady ? (
        <button onClick={() => handleScan(codeToScan)}>Scan Code</button>
      ) : (
        <p>Loading scanner...</p>
      )}
    </div>
  );
}
```

### useRuntimeMonitor

Monitor runtime security events in components:

```typescript
import { useRuntimeMonitor } from '@philjs/security-scanner';

function SecurityAlerts() {
  const { alerts, clearAlerts } = useRuntimeMonitor();

  return (
    <div>
      <h2>Security Alerts ({alerts.length})</h2>

      {alerts.length > 0 && (
        <button onClick={clearAlerts}>Clear All</button>
      )}

      <ul>
        {alerts.map((alert) => (
          <li key={alert.id} class={`alert-${alert.severity}`}>
            <strong>[{alert.type}]</strong> {alert.message}
            <small>{new Date(alert.timestamp).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### useSecurityHeaders

Validate and generate security headers in components:

```typescript
import { useSecurityHeaders } from '@philjs/security-scanner';

function HeadersConfig() {
  const { validate, getRecommended } = useSecurityHeaders();

  const currentHeaders = {
    'Content-Security-Policy': "default-src 'self'",
    'X-Frame-Options': 'DENY',
  };

  const issues = validate(currentHeaders);
  const recommended = getRecommended();

  return (
    <div>
      <h2>Security Headers</h2>

      {issues.length > 0 && (
        <div class="warning">
          <h3>Issues Found:</h3>
          <ul>
            {issues.map((issue) => (
              <li key={issue.id}>
                <strong>{issue.title}</strong>: {issue.remediation}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3>Recommended Headers:</h3>
      <pre>{JSON.stringify(recommended, null, 2)}</pre>
    </div>
  );
}
```

---

## Types Reference

```typescript
// Scan result from scanning files
interface ScanResult {
  id: string;
  timestamp: number;
  duration: number;
  vulnerabilities: Vulnerability[];
  summary: ScanSummary;
}

// Individual vulnerability
interface Vulnerability {
  id: string;
  type: VulnerabilityType;
  severity: Severity;
  title: string;
  description: string;
  location?: CodeLocation;
  remediation: string;
  references?: string[];
  cwe?: string;
  cvss?: number;
}

// Vulnerability types
type VulnerabilityType =
  | 'xss'
  | 'csrf'
  | 'sql-injection'
  | 'command-injection'
  | 'path-traversal'
  | 'insecure-dependency'
  | 'sensitive-data-exposure'
  | 'broken-auth'
  | 'security-misconfiguration'
  | 'insecure-deserialization'
  | 'insufficient-logging'
  | 'ssrf'
  | 'open-redirect'
  | 'prototype-pollution'
  | 'regex-dos';

// Severity levels
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

// Code location for vulnerability
interface CodeLocation {
  file: string;
  line: number;
  column?: number;
  snippet?: string;
}

// Summary of scan results
interface ScanSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

// Scanner configuration
interface ScanConfig {
  enabledRules?: string[];
  disabledRules?: string[];
  severityThreshold?: Severity;
  excludePaths?: string[];
  customRules?: SecurityRule[];
}

// Custom security rule
interface SecurityRule {
  id: string;
  name: string;
  description: string;
  type: VulnerabilityType;
  severity: Severity;
  pattern: RegExp;
  check: (code: string, filename: string) => Vulnerability[];
}

// Dependency vulnerability
interface DependencyVulnerability {
  package: string;
  version: string;
  vulnerability: {
    id: string;
    severity: Severity;
    title: string;
    description: string;
    patchedVersions?: string;
    references: string[];
  };
}

// Runtime security alert
interface RuntimeAlert {
  id: string;
  type: 'csp-violation' | 'xss-attempt' | 'suspicious-activity' | 'data-leak';
  severity: Severity;
  message: string;
  details: Record<string, unknown>;
  timestamp: number;
  url: string;
}

// Security headers
interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'X-Content-Type-Options'?: string;
  'X-Frame-Options'?: string;
  'X-XSS-Protection'?: string;
  'Strict-Transport-Security'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
}
```

---

## API Reference

### Classes

| Export | Description |
|--------|-------------|
| `SecurityScanner` | Main scanner combining all capabilities |
| `StaticScanner` | Static code analysis for vulnerabilities |
| `DependencyScanner` | npm dependency vulnerability checking |
| `RuntimeMonitor` | Real-time security monitoring |
| `HeadersValidator` | Security headers validation |

### SecurityScanner Methods

| Method | Description |
|--------|-------------|
| `initialize()` | Load vulnerability database |
| `scanCode(code, filename)` | Scan source code for vulnerabilities |
| `scanFiles(files)` | Scan multiple files |
| `scanDependencies(deps)` | Check dependencies for vulnerabilities |
| `validateHeaders(headers)` | Validate security headers |
| `getRecommendedHeaders()` | Get recommended security headers |
| `startRuntimeMonitoring()` | Start real-time monitoring |
| `onRuntimeAlert(callback)` | Subscribe to runtime alerts |
| `stopRuntimeMonitoring()` | Stop real-time monitoring |
| `getRuntimeAlerts()` | Get all runtime alerts |
| `addCustomRule(rule)` | Add a custom security rule |

### StaticScanner Methods

| Method | Description |
|--------|-------------|
| `scanCode(code, filename)` | Scan code and return vulnerabilities |
| `scanFiles(files)` | Scan files and return ScanResult |
| `addRule(rule)` | Add a custom security rule |

### DependencyScanner Methods

| Method | Description |
|--------|-------------|
| `loadVulnerabilityDatabase(url?)` | Load vulnerability data |
| `scanDependencies(deps)` | Scan dependencies for vulnerabilities |

### RuntimeMonitor Methods

| Method | Description |
|--------|-------------|
| `start()` | Start monitoring |
| `stop()` | Stop monitoring |
| `onAlert(callback)` | Subscribe to alerts (returns unsubscribe) |
| `getAlerts()` | Get all alerts |
| `clearAlerts()` | Clear all alerts |

### HeadersValidator Methods

| Method | Description |
|--------|-------------|
| `validateHeaders(headers)` | Validate and return issues |
| `generateRecommendedHeaders()` | Generate recommended headers |

### Hooks

| Export | Description |
|--------|-------------|
| `useSecurityScanner` | Initialize scanner with reactive state |
| `useRuntimeMonitor` | Monitor runtime alerts in components |
| `useSecurityHeaders` | Validate headers in components |

### Types

| Export | Description |
|--------|-------------|
| `ScanResult` | Result from file scanning |
| `Vulnerability` | Individual vulnerability |
| `VulnerabilityType` | Type of vulnerability |
| `Severity` | Severity level |
| `CodeLocation` | Location in source code |
| `ScanSummary` | Summary counts by severity |
| `ScanConfig` | Scanner configuration |
| `SecurityRule` | Custom rule definition |
| `DependencyVulnerability` | Dependency vulnerability |
| `RuntimeAlert` | Runtime security alert |
| `SecurityHeaders` | HTTP security headers |

---

## Best Practices

### CI/CD Integration

```typescript
// security-scan.ts
import { SecurityScanner } from '@philjs/security-scanner';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

async function runSecurityScan() {
  const scanner = new SecurityScanner({
    severityThreshold: 'high',
    excludePaths: ['node_modules', 'dist', 'coverage'],
  });

  await scanner.initialize();

  // Scan source files
  const srcFiles = getFilesRecursively('./src');
  const result = scanner.scanFiles(srcFiles);

  // Scan dependencies
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
  const depVulns = scanner.scanDependencies(pkg.dependencies);

  // Fail if critical or high vulnerabilities found
  const hasBlockingIssues =
    result.summary.critical > 0 ||
    result.summary.high > 0 ||
    depVulns.some(v => ['critical', 'high'].includes(v.vulnerability.severity));

  if (hasBlockingIssues) {
    console.error('Security scan failed!');
    console.error('Code vulnerabilities:', result.summary);
    console.error('Dependency vulnerabilities:', depVulns.length);
    process.exit(1);
  }

  console.log('Security scan passed!');
}

runSecurityScan();
```

### Pre-commit Hook

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run security:scan"
    }
  },
  "scripts": {
    "security:scan": "tsx scripts/security-scan.ts"
  }
}
```

---

## Next Steps

- [@philjs/auth for Authentication](../auth/overview.md)
- [@philjs/core Security Utilities](../core/overview.md)
- [Security Best Practices](../../security/overview.md)
