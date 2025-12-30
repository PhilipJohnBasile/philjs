/**
 * @philjs/security-scanner - Auto Vulnerability Detection
 *
 * Industry-first framework-native security scanning:
 * - Static code analysis for common vulnerabilities
 * - Dependency vulnerability checking
 * - Runtime security monitoring
 * - CSP violation detection
 * - XSS/CSRF/Injection prevention
 * - Security headers validation
 */

// ============================================================================
// Types
// ============================================================================

export interface ScanResult {
  id: string;
  timestamp: number;
  duration: number;
  vulnerabilities: Vulnerability[];
  summary: ScanSummary;
}

export interface Vulnerability {
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

export type VulnerabilityType =
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

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface CodeLocation {
  file: string;
  line: number;
  column?: number;
  snippet?: string;
}

export interface ScanSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface ScanConfig {
  enabledRules?: string[];
  disabledRules?: string[];
  severityThreshold?: Severity;
  excludePaths?: string[];
  customRules?: SecurityRule[];
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  type: VulnerabilityType;
  severity: Severity;
  pattern: RegExp;
  check: (code: string, filename: string) => Vulnerability[];
}

export interface DependencyVulnerability {
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

export interface RuntimeAlert {
  id: string;
  type: 'csp-violation' | 'xss-attempt' | 'suspicious-activity' | 'data-leak';
  severity: Severity;
  message: string;
  details: Record<string, unknown>;
  timestamp: number;
  url: string;
}

export interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'X-Content-Type-Options'?: string;
  'X-Frame-Options'?: string;
  'X-XSS-Protection'?: string;
  'Strict-Transport-Security'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
}

// ============================================================================
// Built-in Security Rules
// ============================================================================

const builtInRules: SecurityRule[] = [
  {
    id: 'xss-innerhtml',
    name: 'innerHTML XSS',
    description: 'Detects potential XSS via innerHTML assignment',
    type: 'xss',
    severity: 'high',
    pattern: /\.innerHTML\s*=\s*(?!['"`])/g,
    check: (code, filename) => {
      const vulnerabilities: Vulnerability[] = [];
      const lines = code.split('\n');

      lines.forEach((line, index) => {
        if (/\.innerHTML\s*=\s*(?!['"`])/.test(line)) {
          vulnerabilities.push({
            id: `xss-innerhtml-${index}`,
            type: 'xss',
            severity: 'high',
            title: 'Potential XSS via innerHTML',
            description: 'Using innerHTML with dynamic content can lead to XSS attacks',
            location: { file: filename, line: index + 1, snippet: line.trim() },
            remediation: 'Use textContent for text or sanitize HTML before insertion',
            cwe: 'CWE-79'
          });
        }
      });

      return vulnerabilities;
    }
  },
  {
    id: 'xss-document-write',
    name: 'document.write XSS',
    description: 'Detects potential XSS via document.write',
    type: 'xss',
    severity: 'high',
    pattern: /document\.write\s*\(/g,
    check: (code, filename) => {
      const vulnerabilities: Vulnerability[] = [];
      const lines = code.split('\n');

      lines.forEach((line, index) => {
        if (/document\.write\s*\(/.test(line)) {
          vulnerabilities.push({
            id: `xss-document-write-${index}`,
            type: 'xss',
            severity: 'high',
            title: 'Potential XSS via document.write',
            description: 'document.write can be exploited for XSS attacks',
            location: { file: filename, line: index + 1, snippet: line.trim() },
            remediation: 'Avoid document.write, use DOM manipulation methods instead',
            cwe: 'CWE-79'
          });
        }
      });

      return vulnerabilities;
    }
  },
  {
    id: 'eval-injection',
    name: 'Eval Injection',
    description: 'Detects use of eval() which can lead to code injection',
    type: 'command-injection',
    severity: 'critical',
    pattern: /\beval\s*\(/g,
    check: (code, filename) => {
      const vulnerabilities: Vulnerability[] = [];
      const lines = code.split('\n');

      lines.forEach((line, index) => {
        if (/\beval\s*\(/.test(line) && !/\/\/.*eval/.test(line)) {
          vulnerabilities.push({
            id: `eval-injection-${index}`,
            type: 'command-injection',
            severity: 'critical',
            title: 'Code Injection via eval()',
            description: 'Using eval() with dynamic content can lead to arbitrary code execution',
            location: { file: filename, line: index + 1, snippet: line.trim() },
            remediation: 'Avoid eval(). Use JSON.parse() for JSON, or refactor logic',
            cwe: 'CWE-95'
          });
        }
      });

      return vulnerabilities;
    }
  },
  {
    id: 'sql-injection',
    name: 'SQL Injection',
    description: 'Detects potential SQL injection via string concatenation',
    type: 'sql-injection',
    severity: 'critical',
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE|WHERE).*\+.*(?:req\.|params\.|query\.|body\.)/gi,
    check: (code, filename) => {
      const vulnerabilities: Vulnerability[] = [];
      const lines = code.split('\n');

      lines.forEach((line, index) => {
        if (/(?:SELECT|INSERT|UPDATE|DELETE|WHERE)/i.test(line) &&
            /\+.*(?:req\.|params\.|query\.|body\.)/.test(line)) {
          vulnerabilities.push({
            id: `sql-injection-${index}`,
            type: 'sql-injection',
            severity: 'critical',
            title: 'Potential SQL Injection',
            description: 'SQL query constructed with string concatenation using user input',
            location: { file: filename, line: index + 1, snippet: line.trim() },
            remediation: 'Use parameterized queries or prepared statements',
            cwe: 'CWE-89'
          });
        }
      });

      return vulnerabilities;
    }
  },
  {
    id: 'hardcoded-secret',
    name: 'Hardcoded Secret',
    description: 'Detects hardcoded API keys, passwords, or secrets',
    type: 'sensitive-data-exposure',
    severity: 'high',
    pattern: /(?:api[_-]?key|password|secret|token|auth)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    check: (code, filename) => {
      const vulnerabilities: Vulnerability[] = [];
      const lines = code.split('\n');

      lines.forEach((line, index) => {
        if (/(?:api[_-]?key|password|secret|token|auth)\s*[:=]\s*['"][^'"]{8,}['"]/i.test(line) &&
            !/process\.env/.test(line)) {
          vulnerabilities.push({
            id: `hardcoded-secret-${index}`,
            type: 'sensitive-data-exposure',
            severity: 'high',
            title: 'Hardcoded Secret Detected',
            description: 'Sensitive credentials should not be hardcoded in source code',
            location: { file: filename, line: index + 1, snippet: line.trim().substring(0, 50) + '...' },
            remediation: 'Use environment variables or a secrets manager',
            cwe: 'CWE-798'
          });
        }
      });

      return vulnerabilities;
    }
  },
  {
    id: 'open-redirect',
    name: 'Open Redirect',
    description: 'Detects potential open redirect vulnerabilities',
    type: 'open-redirect',
    severity: 'medium',
    pattern: /(?:window\.location|location\.href|location\.assign|location\.replace)\s*=\s*(?:req\.|params\.|query\.)/g,
    check: (code, filename) => {
      const vulnerabilities: Vulnerability[] = [];
      const lines = code.split('\n');

      lines.forEach((line, index) => {
        if (/(?:window\.location|location\.href|location\.assign|location\.replace)\s*=/.test(line) &&
            /(?:req\.|params\.|query\.)/.test(line)) {
          vulnerabilities.push({
            id: `open-redirect-${index}`,
            type: 'open-redirect',
            severity: 'medium',
            title: 'Potential Open Redirect',
            description: 'Redirecting to user-controlled URL can lead to phishing attacks',
            location: { file: filename, line: index + 1, snippet: line.trim() },
            remediation: 'Validate redirect URLs against an allowlist',
            cwe: 'CWE-601'
          });
        }
      });

      return vulnerabilities;
    }
  },
  {
    id: 'prototype-pollution',
    name: 'Prototype Pollution',
    description: 'Detects potential prototype pollution vulnerabilities',
    type: 'prototype-pollution',
    severity: 'high',
    pattern: /\[['"]__proto__['"]\]|\[['"]constructor['"]\]|\[['"]prototype['"]\]/g,
    check: (code, filename) => {
      const vulnerabilities: Vulnerability[] = [];
      const lines = code.split('\n');

      lines.forEach((line, index) => {
        if (/\[['"](?:__proto__|constructor|prototype)['"]\]/.test(line)) {
          vulnerabilities.push({
            id: `prototype-pollution-${index}`,
            type: 'prototype-pollution',
            severity: 'high',
            title: 'Potential Prototype Pollution',
            description: 'Accessing __proto__, constructor, or prototype with dynamic keys',
            location: { file: filename, line: index + 1, snippet: line.trim() },
            remediation: 'Validate object keys and use Object.create(null) for maps',
            cwe: 'CWE-1321'
          });
        }
      });

      return vulnerabilities;
    }
  },
  {
    id: 'regex-dos',
    name: 'ReDoS',
    description: 'Detects potentially vulnerable regular expressions',
    type: 'regex-dos',
    severity: 'medium',
    pattern: /new RegExp\(.*\+.*\)|\/.*(\+|\*|\{.*,.*\}).*(\+|\*|\{.*,.*\}).*\//g,
    check: (code, filename) => {
      const vulnerabilities: Vulnerability[] = [];
      const lines = code.split('\n');

      lines.forEach((line, index) => {
        // Check for dynamic RegExp with user input
        if (/new RegExp\s*\(.*\+/.test(line)) {
          vulnerabilities.push({
            id: `regex-dos-dynamic-${index}`,
            type: 'regex-dos',
            severity: 'medium',
            title: 'Potential ReDoS via Dynamic RegExp',
            description: 'Creating RegExp from user input can cause denial of service',
            location: { file: filename, line: index + 1, snippet: line.trim() },
            remediation: 'Sanitize input or use a safe regex library',
            cwe: 'CWE-1333'
          });
        }
      });

      return vulnerabilities;
    }
  }
];

// ============================================================================
// Static Code Scanner
// ============================================================================

export class StaticScanner {
  private rules: SecurityRule[];
  private config: ScanConfig;

  constructor(config: ScanConfig = {}) {
    this.config = config;
    this.rules = this.initializeRules();
  }

  private initializeRules(): SecurityRule[] {
    let rules = [...builtInRules, ...(this.config.customRules ?? [])];

    if (this.config.enabledRules?.length) {
      rules = rules.filter(r => this.config.enabledRules!.includes(r.id));
    }

    if (this.config.disabledRules?.length) {
      rules = rules.filter(r => !this.config.disabledRules!.includes(r.id));
    }

    return rules;
  }

  scanCode(code: string, filename: string): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];

    // Check excluded paths
    if (this.config.excludePaths?.some(path => filename.includes(path))) {
      return [];
    }

    for (const rule of this.rules) {
      const found = rule.check(code, filename);
      vulnerabilities.push(...found);
    }

    // Filter by severity threshold
    if (this.config.severityThreshold) {
      const severityOrder: Severity[] = ['info', 'low', 'medium', 'high', 'critical'];
      const threshold = severityOrder.indexOf(this.config.severityThreshold);
      return vulnerabilities.filter(v =>
        severityOrder.indexOf(v.severity) >= threshold
      );
    }

    return vulnerabilities;
  }

  scanFiles(files: Array<{ name: string; content: string }>): ScanResult {
    const startTime = Date.now();
    const allVulnerabilities: Vulnerability[] = [];

    for (const file of files) {
      const vulns = this.scanCode(file.content, file.name);
      allVulnerabilities.push(...vulns);
    }

    return {
      id: `scan-${Date.now()}`,
      timestamp: Date.now(),
      duration: Date.now() - startTime,
      vulnerabilities: allVulnerabilities,
      summary: this.createSummary(allVulnerabilities)
    };
  }

  private createSummary(vulnerabilities: Vulnerability[]): ScanSummary {
    return {
      total: vulnerabilities.length,
      critical: vulnerabilities.filter(v => v.severity === 'critical').length,
      high: vulnerabilities.filter(v => v.severity === 'high').length,
      medium: vulnerabilities.filter(v => v.severity === 'medium').length,
      low: vulnerabilities.filter(v => v.severity === 'low').length,
      info: vulnerabilities.filter(v => v.severity === 'info').length
    };
  }

  addRule(rule: SecurityRule): void {
    this.rules.push(rule);
  }
}

// ============================================================================
// Dependency Scanner
// ============================================================================

export class DependencyScanner {
  private vulnerabilityDb: Map<string, DependencyVulnerability[]> = new Map();

  async loadVulnerabilityDatabase(url?: string): Promise<void> {
    // In production, load from npm audit API or OSV database
    // This is a placeholder with example vulnerabilities
    this.vulnerabilityDb.set('lodash', [{
      package: 'lodash',
      version: '<4.17.21',
      vulnerability: {
        id: 'GHSA-35jh-r3h4-6jhm',
        severity: 'high',
        title: 'Prototype Pollution in lodash',
        description: 'Versions before 4.17.21 are vulnerable to prototype pollution',
        patchedVersions: '>=4.17.21',
        references: ['https://github.com/advisories/GHSA-35jh-r3h4-6jhm']
      }
    }]);
  }

  scanDependencies(
    dependencies: Record<string, string>
  ): DependencyVulnerability[] {
    const vulnerabilities: DependencyVulnerability[] = [];

    for (const [pkg, version] of Object.entries(dependencies)) {
      const pkgVulns = this.vulnerabilityDb.get(pkg);
      if (pkgVulns) {
        for (const vuln of pkgVulns) {
          if (this.isVersionVulnerable(version, vuln.version)) {
            vulnerabilities.push({
              ...vuln,
              version
            });
          }
        }
      }
    }

    return vulnerabilities;
  }

  private isVersionVulnerable(actual: string, vulnerable: string): boolean {
    // Simplified version check - in production, use semver
    const cleanActual = actual.replace(/[\^~]/, '');
    const match = vulnerable.match(/<([\d.]+)/);
    if (match) {
      return cleanActual < match[1]!;
    }
    return false;
  }
}

// ============================================================================
// Runtime Security Monitor
// ============================================================================

export class RuntimeMonitor {
  private alerts: RuntimeAlert[] = [];
  private callbacks: Array<(alert: RuntimeAlert) => void> = [];
  private isActive: boolean = false;

  start(): void {
    if (this.isActive) return;
    this.isActive = true;

    this.setupCSPViolationListener();
    this.setupXSSProtection();
    this.setupConsoleMonitor();
  }

  private setupCSPViolationListener(): void {
    document.addEventListener('securitypolicyviolation', (e) => {
      this.addAlert({
        type: 'csp-violation',
        severity: 'high',
        message: `CSP violation: ${e.violatedDirective}`,
        details: {
          blockedURI: e.blockedURI,
          violatedDirective: e.violatedDirective,
          originalPolicy: e.originalPolicy
        }
      });
    });
  }

  private setupXSSProtection(): void {
    // Monitor for suspicious DOM modifications
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLScriptElement && !node.src) {
              // Inline script added dynamically
              const content = node.textContent || '';
              if (this.detectSuspiciousScript(content)) {
                this.addAlert({
                  type: 'xss-attempt',
                  severity: 'critical',
                  message: 'Suspicious inline script detected',
                  details: {
                    scriptContent: content.substring(0, 100)
                  }
                });
              }
            }
          });
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private detectSuspiciousScript(content: string): boolean {
    const suspiciousPatterns = [
      /document\.cookie/,
      /localStorage\./,
      /sessionStorage\./,
      /\.src\s*=.*(?:javascript:|data:)/,
      /eval\s*\(/,
      /Function\s*\(/,
      /document\.write/
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  private setupConsoleMonitor(): void {
    const originalError = console.error;
    console.error = (...args) => {
      // Check for security-related errors
      const message = args.join(' ');
      if (/blocked|cors|csp|security/i.test(message)) {
        this.addAlert({
          type: 'suspicious-activity',
          severity: 'medium',
          message: 'Security-related console error',
          details: { message }
        });
      }
      originalError.apply(console, args);
    };
  }

  private addAlert(
    alert: Omit<RuntimeAlert, 'id' | 'timestamp' | 'url'>
  ): void {
    const fullAlert: RuntimeAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      url: window.location.href
    };

    this.alerts.push(fullAlert);
    this.callbacks.forEach(cb => cb(fullAlert));
  }

  onAlert(callback: (alert: RuntimeAlert) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) this.callbacks.splice(index, 1);
    };
  }

  getAlerts(): RuntimeAlert[] {
    return [...this.alerts];
  }

  clearAlerts(): void {
    this.alerts = [];
  }

  stop(): void {
    this.isActive = false;
  }
}

// ============================================================================
// Security Headers Validator
// ============================================================================

export class HeadersValidator {
  validateHeaders(headers: SecurityHeaders): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];

    // Check Content-Security-Policy
    if (!headers['Content-Security-Policy']) {
      vulnerabilities.push({
        id: 'missing-csp',
        type: 'security-misconfiguration',
        severity: 'high',
        title: 'Missing Content-Security-Policy Header',
        description: 'CSP helps prevent XSS and other code injection attacks',
        remediation: 'Add a Content-Security-Policy header with appropriate directives'
      });
    } else if (headers['Content-Security-Policy'].includes("'unsafe-inline'")) {
      vulnerabilities.push({
        id: 'csp-unsafe-inline',
        type: 'security-misconfiguration',
        severity: 'medium',
        title: 'CSP allows unsafe-inline',
        description: 'unsafe-inline reduces XSS protection',
        remediation: 'Remove unsafe-inline and use nonces or hashes instead'
      });
    }

    // Check X-Content-Type-Options
    if (headers['X-Content-Type-Options'] !== 'nosniff') {
      vulnerabilities.push({
        id: 'missing-content-type-options',
        type: 'security-misconfiguration',
        severity: 'low',
        title: 'Missing X-Content-Type-Options Header',
        description: 'Prevents MIME type sniffing attacks',
        remediation: 'Add X-Content-Type-Options: nosniff header'
      });
    }

    // Check X-Frame-Options
    if (!headers['X-Frame-Options']) {
      vulnerabilities.push({
        id: 'missing-frame-options',
        type: 'security-misconfiguration',
        severity: 'medium',
        title: 'Missing X-Frame-Options Header',
        description: 'Helps prevent clickjacking attacks',
        remediation: 'Add X-Frame-Options: DENY or SAMEORIGIN header'
      });
    }

    // Check Strict-Transport-Security
    if (!headers['Strict-Transport-Security']) {
      vulnerabilities.push({
        id: 'missing-hsts',
        type: 'security-misconfiguration',
        severity: 'medium',
        title: 'Missing Strict-Transport-Security Header',
        description: 'Ensures browser only connects via HTTPS',
        remediation: 'Add Strict-Transport-Security header with appropriate max-age'
      });
    }

    return vulnerabilities;
  }

  generateRecommendedHeaders(): SecurityHeaders {
    return {
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };
  }
}

// ============================================================================
// Security Scanner (Main Class)
// ============================================================================

export class SecurityScanner {
  private staticScanner: StaticScanner;
  private dependencyScanner: DependencyScanner;
  private runtimeMonitor: RuntimeMonitor;
  private headersValidator: HeadersValidator;

  constructor(config?: ScanConfig) {
    this.staticScanner = new StaticScanner(config);
    this.dependencyScanner = new DependencyScanner();
    this.runtimeMonitor = new RuntimeMonitor();
    this.headersValidator = new HeadersValidator();
  }

  async initialize(): Promise<void> {
    await this.dependencyScanner.loadVulnerabilityDatabase();
  }

  scanCode(code: string, filename: string): Vulnerability[] {
    return this.staticScanner.scanCode(code, filename);
  }

  scanFiles(files: Array<{ name: string; content: string }>): ScanResult {
    return this.staticScanner.scanFiles(files);
  }

  scanDependencies(dependencies: Record<string, string>): DependencyVulnerability[] {
    return this.dependencyScanner.scanDependencies(dependencies);
  }

  validateHeaders(headers: SecurityHeaders): Vulnerability[] {
    return this.headersValidator.validateHeaders(headers);
  }

  getRecommendedHeaders(): SecurityHeaders {
    return this.headersValidator.generateRecommendedHeaders();
  }

  startRuntimeMonitoring(): void {
    this.runtimeMonitor.start();
  }

  onRuntimeAlert(callback: (alert: RuntimeAlert) => void): () => void {
    return this.runtimeMonitor.onAlert(callback);
  }

  stopRuntimeMonitoring(): void {
    this.runtimeMonitor.stop();
  }

  getRuntimeAlerts(): RuntimeAlert[] {
    return this.runtimeMonitor.getAlerts();
  }

  addCustomRule(rule: SecurityRule): void {
    this.staticScanner.addRule(rule);
  }
}

// ============================================================================
// Hooks
// ============================================================================

type CleanupFn = () => void;
type EffectFn = () => void | CleanupFn;

const effectQueue: EffectFn[] = [];

function useEffect(effect: EffectFn, _deps?: unknown[]): void {
  effectQueue.push(effect);
}

function useState<T>(initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  let state = initial;
  const setState = (value: T | ((prev: T) => T)) => {
    state = typeof value === 'function' ? (value as (prev: T) => T)(state) : value;
  };
  return [state, setState];
}

function useRef<T>(initial: T): { current: T } {
  return { current: initial };
}

function useCallback<T extends (...args: never[]) => unknown>(fn: T, _deps: unknown[]): T {
  return fn;
}

export function useSecurityScanner(config?: ScanConfig) {
  const scannerRef = useRef<SecurityScanner | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const scanner = new SecurityScanner(config);
    scanner.initialize().then(() => {
      scannerRef.current = scanner;
      setIsReady(true);
    });
  }, []);

  const scanCode = useCallback((code: string, filename: string) => {
    return scannerRef.current?.scanCode(code, filename) ?? [];
  }, []);

  const scanDependencies = useCallback((deps: Record<string, string>) => {
    return scannerRef.current?.scanDependencies(deps) ?? [];
  }, []);

  return { scanner: scannerRef.current, isReady, scanCode, scanDependencies };
}

export function useRuntimeMonitor() {
  const monitorRef = useRef(new RuntimeMonitor());
  const [alerts, setAlerts] = useState<RuntimeAlert[]>([]);

  useEffect(() => {
    const monitor = monitorRef.current;
    monitor.start();

    monitor.onAlert((alert) => {
      setAlerts(prev => [...prev, alert]);
    });

    return () => monitor.stop();
  }, []);

  return {
    alerts,
    clearAlerts: () => {
      monitorRef.current.clearAlerts();
      setAlerts([]);
    }
  };
}

export function useSecurityHeaders() {
  const validatorRef = useRef(new HeadersValidator());

  const validate = useCallback((headers: SecurityHeaders) => {
    return validatorRef.current.validateHeaders(headers);
  }, []);

  const getRecommended = useCallback(() => {
    return validatorRef.current.generateRecommendedHeaders();
  }, []);

  return { validate, getRecommended };
}

// Export everything
export default {
  SecurityScanner,
  StaticScanner,
  DependencyScanner,
  RuntimeMonitor,
  HeadersValidator,
  builtInRules,
  useSecurityScanner,
  useRuntimeMonitor,
  useSecurityHeaders
};
