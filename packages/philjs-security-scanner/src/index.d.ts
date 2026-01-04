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
export type VulnerabilityType = 'xss' | 'csrf' | 'sql-injection' | 'command-injection' | 'path-traversal' | 'insecure-dependency' | 'sensitive-data-exposure' | 'broken-auth' | 'security-misconfiguration' | 'insecure-deserialization' | 'insufficient-logging' | 'ssrf' | 'open-redirect' | 'prototype-pollution' | 'regex-dos';
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
export declare class StaticScanner {
    private rules;
    private config;
    constructor(config?: ScanConfig);
    private initializeRules;
    scanCode(code: string, filename: string): Vulnerability[];
    scanFiles(files: Array<{
        name: string;
        content: string;
    }>): ScanResult;
    private createSummary;
    addRule(rule: SecurityRule): void;
}
export declare class DependencyScanner {
    private vulnerabilityDb;
    loadVulnerabilityDatabase(url?: string): Promise<void>;
    scanDependencies(dependencies: Record<string, string>): DependencyVulnerability[];
    private isVersionVulnerable;
}
export declare class RuntimeMonitor {
    private alerts;
    private callbacks;
    private isActive;
    start(): void;
    private setupCSPViolationListener;
    private setupXSSProtection;
    private detectSuspiciousScript;
    private setupConsoleMonitor;
    private addAlert;
    onAlert(callback: (alert: RuntimeAlert) => void): () => void;
    getAlerts(): RuntimeAlert[];
    clearAlerts(): void;
    stop(): void;
}
export declare class HeadersValidator {
    validateHeaders(headers: SecurityHeaders): Vulnerability[];
    generateRecommendedHeaders(): SecurityHeaders;
}
export declare class SecurityScanner {
    private staticScanner;
    private dependencyScanner;
    private runtimeMonitor;
    private headersValidator;
    constructor(config?: ScanConfig);
    initialize(): Promise<void>;
    scanCode(code: string, filename: string): Vulnerability[];
    scanFiles(files: Array<{
        name: string;
        content: string;
    }>): ScanResult;
    scanDependencies(dependencies: Record<string, string>): DependencyVulnerability[];
    validateHeaders(headers: SecurityHeaders): Vulnerability[];
    getRecommendedHeaders(): SecurityHeaders;
    startRuntimeMonitoring(): void;
    onRuntimeAlert(callback: (alert: RuntimeAlert) => void): () => void;
    stopRuntimeMonitoring(): void;
    getRuntimeAlerts(): RuntimeAlert[];
    addCustomRule(rule: SecurityRule): void;
}
export declare function useSecurityScanner(config?: ScanConfig): {
    scanner: SecurityScanner | null;
    isReady: boolean;
    scanCode: (code: string, filename: string) => Vulnerability[];
    scanDependencies: (deps: Record<string, string>) => DependencyVulnerability[];
};
export declare function useRuntimeMonitor(): {
    alerts: RuntimeAlert[];
    clearAlerts: () => void;
};
export declare function useSecurityHeaders(): {
    validate: (headers: SecurityHeaders) => Vulnerability[];
    getRecommended: () => SecurityHeaders;
};
declare const _default: {
    SecurityScanner: typeof SecurityScanner;
    StaticScanner: typeof StaticScanner;
    DependencyScanner: typeof DependencyScanner;
    RuntimeMonitor: typeof RuntimeMonitor;
    HeadersValidator: typeof HeadersValidator;
    builtInRules: SecurityRule[];
    useSecurityScanner: typeof useSecurityScanner;
    useRuntimeMonitor: typeof useRuntimeMonitor;
    useSecurityHeaders: typeof useSecurityHeaders;
};
export default _default;
//# sourceMappingURL=index.d.ts.map