/**
 * Enterprise Compliance Module
 *
 * Compliance and regulatory features for enterprise deployments:
 * - GDPR compliance helpers
 * - HIPAA compliance
 * - SOC 2 compliance
 * - Data retention policies
 * - Privacy controls
 * - Consent management
 */
export interface ComplianceConfig {
    /** Enabled compliance frameworks */
    frameworks: ComplianceFramework[];
    /** Data retention configuration */
    dataRetention: DataRetentionConfig;
    /** Privacy settings */
    privacy: PrivacyConfig;
    /** Consent configuration */
    consent: ConsentConfig;
    /** Audit configuration */
    audit: ComplianceAuditConfig;
}
export type ComplianceFramework = 'GDPR' | 'CCPA' | 'HIPAA' | 'SOC2' | 'ISO27001' | 'PCI-DSS' | 'FERPA' | 'COPPA';
export interface DataRetentionConfig {
    /** Default retention period in days */
    defaultPeriod: number;
    /** Per-data-type retention periods */
    policies: DataRetentionPolicy[];
    /** Enable automatic deletion */
    autoDelete: boolean;
    /** Archive before deletion */
    archiveBeforeDelete: boolean;
}
export interface DataRetentionPolicy {
    dataType: string;
    retentionDays: number;
    archiveDays?: number;
    deleteAfterArchive?: boolean;
    legalHold?: boolean;
}
export interface PrivacyConfig {
    /** Enable data anonymization */
    anonymization: boolean;
    /** Enable data pseudonymization */
    pseudonymization: boolean;
    /** Enable data encryption at rest */
    encryptionAtRest: boolean;
    /** Enable data encryption in transit */
    encryptionInTransit: boolean;
    /** PII detection and handling */
    piiHandling: PIIHandlingConfig;
}
export interface PIIHandlingConfig {
    /** Automatically detect PII */
    autoDetect: boolean;
    /** PII field patterns */
    patterns: PIIPattern[];
    /** Default handling action */
    defaultAction: 'mask' | 'encrypt' | 'hash' | 'redact';
    /** Log PII access */
    logAccess: boolean;
}
export interface PIIPattern {
    name: string;
    pattern: RegExp;
    action: 'mask' | 'encrypt' | 'hash' | 'redact';
    maskChar?: string;
}
export interface ConsentConfig {
    /** Require explicit consent */
    requireExplicit: boolean;
    /** Consent categories */
    categories: ConsentCategory[];
    /** Consent storage method */
    storage: 'cookie' | 'localStorage' | 'server';
    /** Consent expiration in days */
    expirationDays: number;
}
export interface ConsentCategory {
    id: string;
    name: string;
    description: string;
    required: boolean;
    default: boolean;
}
export interface ComplianceAuditConfig {
    /** Enable audit logging */
    enabled: boolean;
    /** Events to audit */
    events: AuditEventType[];
    /** Audit log retention in days */
    retentionDays: number;
    /** Export format */
    exportFormat: 'json' | 'csv' | 'xml';
}
export type AuditEventType = 'data_access' | 'data_modification' | 'data_deletion' | 'consent_change' | 'export_request' | 'login' | 'logout' | 'permission_change' | 'config_change';
/**
 * Compliance Manager
 */
export declare class ComplianceManager {
    private config;
    private consentStore;
    private auditLog;
    constructor(config?: Partial<ComplianceConfig>);
    /**
     * Handle GDPR data subject access request (DSAR)
     */
    handleDataAccessRequest(userId: string): Promise<DataAccessResponse>;
    /**
     * Handle GDPR right to erasure (right to be forgotten)
     */
    handleErasureRequest(userId: string, options?: {
        retainLegalHold?: boolean;
    }): Promise<ErasureResponse>;
    /**
     * Handle GDPR data portability request
     */
    handlePortabilityRequest(userId: string, format?: 'json' | 'csv' | 'xml'): Promise<PortabilityResponse>;
    /**
     * Record user consent
     */
    recordConsent(userId: string, consents: Record<string, boolean>, metadata?: Record<string, unknown>): UserConsent;
    /**
     * Check if user has given consent for category
     */
    hasConsent(userId: string, category: string): boolean;
    /**
     * Get user's current consents
     */
    getUserConsents(userId: string): UserConsent | null;
    /**
     * Withdraw consent
     */
    withdrawConsent(userId: string, categories?: string[]): void;
    /**
     * Detect PII in data
     */
    detectPII(data: Record<string, unknown>): PIIDetectionResult[];
    /**
     * Sanitize PII from data
     */
    sanitizePII(data: Record<string, unknown>, action?: 'mask' | 'encrypt' | 'hash' | 'redact'): Record<string, unknown>;
    /**
     * Anonymize data
     */
    anonymize(data: Record<string, unknown>): Record<string, unknown>;
    /**
     * Pseudonymize data
     */
    pseudonymize(data: Record<string, unknown>, pseudonymMap: Map<string, string>): Record<string, unknown>;
    /**
     * Apply data retention policies
     */
    applyRetentionPolicies(): Promise<RetentionResult>;
    /**
     * Get retention status for data
     */
    getRetentionStatus(dataType: string, createdAt: Date): RetentionStatus;
    /**
     * Log audit event
     */
    logAudit(eventType: AuditEventType, userId: string, details: Record<string, unknown>): void;
    /**
     * Get audit log for user
     */
    getAuditLog(filters?: {
        userId?: string;
        eventType?: AuditEventType;
        startDate?: Date;
        endDate?: Date;
    }): AuditEntry[];
    /**
     * Export audit log
     */
    exportAuditLog(format?: 'json' | 'csv' | 'xml', filters?: {
        userId?: string;
        eventType?: AuditEventType;
        startDate?: Date;
        endDate?: Date;
    }): string;
    /**
     * Generate compliance report
     */
    generateComplianceReport(framework: ComplianceFramework): Promise<ComplianceReport>;
    private getDefaultPIIPatterns;
    private getDefaultConsentCategories;
    private generateRequestId;
    private getConsentVersion;
    private maskValue;
    private hashValue;
    private applyPIIAction;
    private collectUserData;
    private deleteUserData;
    private findExpiredData;
    private archiveData;
    private deleteData;
    private formatExport;
    private getFrameworkControls;
    private evaluateControl;
}
export interface UserConsent {
    userId: string;
    consents: Record<string, boolean>;
    timestamp: Date;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
    version: string;
}
export interface DataAccessResponse {
    requestId: string;
    userId: string;
    data: Record<string, unknown>;
    generatedAt: Date;
    expiresAt: Date;
}
export interface ErasureResponse {
    requestId: string;
    userId: string;
    deletedData: string[];
    retainedData: string[];
    completedAt: Date;
}
export interface PortabilityResponse {
    requestId: string;
    userId: string;
    format: string;
    data: string;
    generatedAt: Date;
}
export interface PIIDetectionResult {
    field: string;
    type: string;
    value: string;
    action: string;
}
export interface RetentionResult {
    processed: number;
    deleted: number;
    archived: number;
    errors: {
        dataType: string;
        error: string;
    }[];
}
export interface RetentionStatus {
    dataType: string;
    createdAt: Date;
    expiresAt: Date;
    daysRemaining: number;
    legalHold: boolean;
    willArchive: boolean;
    willDelete: boolean;
}
export interface AuditEntry {
    id: string;
    timestamp: Date;
    eventType: AuditEventType;
    userId: string;
    details: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}
export interface ComplianceControl {
    id: string;
    name: string;
    category: string;
    required: boolean;
}
export interface ControlResult {
    controlId: string;
    name: string;
    status: 'pass' | 'fail' | 'partial';
    recommendation?: string;
}
export interface ComplianceReport {
    framework: ComplianceFramework;
    generatedAt: Date;
    overallScore: number;
    passedControls: number;
    failedControls: number;
    controls: ControlResult[];
    recommendations: string[];
}
/**
 * Create compliance manager
 */
export declare function createComplianceManager(config?: Partial<ComplianceConfig>): ComplianceManager;
//# sourceMappingURL=compliance.d.ts.map