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
// Built-in Security Rules
// ============================================================================
const builtInRules = [
    {
        id: 'xss-innerhtml',
        name: 'innerHTML XSS',
        description: 'Detects potential XSS via innerHTML assignment',
        type: 'xss',
        severity: 'high',
        pattern: /\.innerHTML\s*=\s*(?!['"`])/g,
        check: (code, filename) => {
            const vulnerabilities = [];
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
            const vulnerabilities = [];
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
            const vulnerabilities = [];
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
            const vulnerabilities = [];
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
            const vulnerabilities = [];
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
            const vulnerabilities = [];
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
            const vulnerabilities = [];
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
            const vulnerabilities = [];
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
    rules;
    config;
    constructor(config = {}) {
        this.config = config;
        this.rules = this.initializeRules();
    }
    initializeRules() {
        let rules = [...builtInRules, ...(this.config.customRules ?? [])];
        if (this.config.enabledRules?.length) {
            rules = rules.filter(r => this.config.enabledRules.includes(r.id));
        }
        if (this.config.disabledRules?.length) {
            rules = rules.filter(r => !this.config.disabledRules.includes(r.id));
        }
        return rules;
    }
    scanCode(code, filename) {
        const vulnerabilities = [];
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
            const severityOrder = ['info', 'low', 'medium', 'high', 'critical'];
            const threshold = severityOrder.indexOf(this.config.severityThreshold);
            return vulnerabilities.filter(v => severityOrder.indexOf(v.severity) >= threshold);
        }
        return vulnerabilities;
    }
    scanFiles(files) {
        const startTime = Date.now();
        const allVulnerabilities = [];
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
    createSummary(vulnerabilities) {
        return {
            total: vulnerabilities.length,
            critical: vulnerabilities.filter(v => v.severity === 'critical').length,
            high: vulnerabilities.filter(v => v.severity === 'high').length,
            medium: vulnerabilities.filter(v => v.severity === 'medium').length,
            low: vulnerabilities.filter(v => v.severity === 'low').length,
            info: vulnerabilities.filter(v => v.severity === 'info').length
        };
    }
    addRule(rule) {
        this.rules.push(rule);
    }
}
// ============================================================================
// Dependency Scanner
// ============================================================================
export class DependencyScanner {
    vulnerabilityDb = new Map();
    async loadVulnerabilityDatabase(url) {
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
    scanDependencies(dependencies) {
        const vulnerabilities = [];
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
    isVersionVulnerable(actual, vulnerable) {
        // Simplified version check - in production, use semver
        const cleanActual = actual.replace(/[\^~]/, '');
        const match = vulnerable.match(/<([\d.]+)/);
        if (match) {
            return cleanActual < match[1];
        }
        return false;
    }
}
// ============================================================================
// Runtime Security Monitor
// ============================================================================
export class RuntimeMonitor {
    alerts = [];
    callbacks = [];
    isActive = false;
    start() {
        if (this.isActive)
            return;
        this.isActive = true;
        this.setupCSPViolationListener();
        this.setupXSSProtection();
        this.setupConsoleMonitor();
    }
    setupCSPViolationListener() {
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
    setupXSSProtection() {
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
    detectSuspiciousScript(content) {
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
    setupConsoleMonitor() {
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
    addAlert(alert) {
        const fullAlert = {
            ...alert,
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            url: window.location.href
        };
        this.alerts.push(fullAlert);
        this.callbacks.forEach(cb => cb(fullAlert));
    }
    onAlert(callback) {
        this.callbacks.push(callback);
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1)
                this.callbacks.splice(index, 1);
        };
    }
    getAlerts() {
        return [...this.alerts];
    }
    clearAlerts() {
        this.alerts = [];
    }
    stop() {
        this.isActive = false;
    }
}
// ============================================================================
// Security Headers Validator
// ============================================================================
export class HeadersValidator {
    validateHeaders(headers) {
        const vulnerabilities = [];
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
        }
        else if (headers['Content-Security-Policy'].includes("'unsafe-inline'")) {
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
    generateRecommendedHeaders() {
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
    staticScanner;
    dependencyScanner;
    runtimeMonitor;
    headersValidator;
    constructor(config) {
        this.staticScanner = new StaticScanner(config);
        this.dependencyScanner = new DependencyScanner();
        this.runtimeMonitor = new RuntimeMonitor();
        this.headersValidator = new HeadersValidator();
    }
    async initialize() {
        await this.dependencyScanner.loadVulnerabilityDatabase();
    }
    scanCode(code, filename) {
        return this.staticScanner.scanCode(code, filename);
    }
    scanFiles(files) {
        return this.staticScanner.scanFiles(files);
    }
    scanDependencies(dependencies) {
        return this.dependencyScanner.scanDependencies(dependencies);
    }
    validateHeaders(headers) {
        return this.headersValidator.validateHeaders(headers);
    }
    getRecommendedHeaders() {
        return this.headersValidator.generateRecommendedHeaders();
    }
    startRuntimeMonitoring() {
        this.runtimeMonitor.start();
    }
    onRuntimeAlert(callback) {
        return this.runtimeMonitor.onAlert(callback);
    }
    stopRuntimeMonitoring() {
        this.runtimeMonitor.stop();
    }
    getRuntimeAlerts() {
        return this.runtimeMonitor.getAlerts();
    }
    addCustomRule(rule) {
        this.staticScanner.addRule(rule);
    }
}
const effectQueue = [];
function useEffect(effect, _deps) {
    effectQueue.push(effect);
}
function useState(initial) {
    let state = initial;
    const setState = (value) => {
        state = typeof value === 'function' ? value(state) : value;
    };
    return [state, setState];
}
function useRef(initial) {
    return { current: initial };
}
function useCallback(fn, _deps) {
    return fn;
}
export function useSecurityScanner(config) {
    const scannerRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    useEffect(() => {
        const scanner = new SecurityScanner(config);
        scanner.initialize().then(() => {
            scannerRef.current = scanner;
            setIsReady(true);
        });
    }, []);
    const scanCode = useCallback((code, filename) => {
        return scannerRef.current?.scanCode(code, filename) ?? [];
    }, []);
    const scanDependencies = useCallback((deps) => {
        return scannerRef.current?.scanDependencies(deps) ?? [];
    }, []);
    return { scanner: scannerRef.current, isReady, scanCode, scanDependencies };
}
export function useRuntimeMonitor() {
    const monitorRef = useRef(new RuntimeMonitor());
    const [alerts, setAlerts] = useState([]);
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
    const validate = useCallback((headers) => {
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
//# sourceMappingURL=index.js.map