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
  audit: AuditConfig;
}

export type ComplianceFramework =
  | 'GDPR'
  | 'CCPA'
  | 'HIPAA'
  | 'SOC2'
  | 'ISO27001'
  | 'PCI-DSS'
  | 'FERPA'
  | 'COPPA';

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

export interface AuditConfig {
  /** Enable audit logging */
  enabled: boolean;
  /** Events to audit */
  events: AuditEventType[];
  /** Audit log retention in days */
  retentionDays: number;
  /** Export format */
  exportFormat: 'json' | 'csv' | 'xml';
}

export type AuditEventType =
  | 'data_access'
  | 'data_modification'
  | 'data_deletion'
  | 'consent_change'
  | 'export_request'
  | 'login'
  | 'logout'
  | 'permission_change'
  | 'config_change';

/**
 * Compliance Manager
 */
export class ComplianceManager {
  private config: ComplianceConfig;
  private consentStore: Map<string, UserConsent> = new Map();
  private auditLog: AuditEntry[] = [];

  constructor(config: Partial<ComplianceConfig> = {}) {
    this.config = {
      frameworks: config.frameworks ?? ['GDPR'],
      dataRetention: config.dataRetention ?? {
        defaultPeriod: 365,
        policies: [],
        autoDelete: false,
        archiveBeforeDelete: true,
      },
      privacy: config.privacy ?? {
        anonymization: true,
        pseudonymization: true,
        encryptionAtRest: true,
        encryptionInTransit: true,
        piiHandling: {
          autoDetect: true,
          patterns: this.getDefaultPIIPatterns(),
          defaultAction: 'mask',
          logAccess: true,
        },
      },
      consent: config.consent ?? {
        requireExplicit: true,
        categories: this.getDefaultConsentCategories(),
        storage: 'server',
        expirationDays: 365,
      },
      audit: config.audit ?? {
        enabled: true,
        events: ['data_access', 'data_modification', 'consent_change'],
        retentionDays: 2555, // 7 years
        exportFormat: 'json',
      },
    };
  }

  // ==========================================================================
  // GDPR Compliance
  // ==========================================================================

  /**
   * Handle GDPR data subject access request (DSAR)
   */
  async handleDataAccessRequest(userId: string): Promise<DataAccessResponse> {
    this.logAudit('data_access', userId, { type: 'DSAR' });

    // Collect all user data
    const userData = await this.collectUserData(userId);

    return {
      requestId: this.generateRequestId(),
      userId,
      data: userData,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
  }

  /**
   * Handle GDPR right to erasure (right to be forgotten)
   */
  async handleErasureRequest(
    userId: string,
    options?: { retainLegalHold?: boolean }
  ): Promise<ErasureResponse> {
    this.logAudit('data_deletion', userId, { type: 'erasure_request' });

    const deletedData: string[] = [];
    const retainedData: string[] = [];

    // Process each data category
    for (const policy of this.config.dataRetention.policies) {
      if (policy.legalHold && options?.retainLegalHold) {
        retainedData.push(policy.dataType);
      } else {
        // Delete data
        await this.deleteUserData(userId, policy.dataType);
        deletedData.push(policy.dataType);
      }
    }

    return {
      requestId: this.generateRequestId(),
      userId,
      deletedData,
      retainedData,
      completedAt: new Date(),
    };
  }

  /**
   * Handle GDPR data portability request
   */
  async handlePortabilityRequest(
    userId: string,
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<PortabilityResponse> {
    this.logAudit('export_request', userId, { format });

    const userData = await this.collectUserData(userId);
    const exportData = this.formatExport(userData, format);

    return {
      requestId: this.generateRequestId(),
      userId,
      format,
      data: exportData,
      generatedAt: new Date(),
    };
  }

  // ==========================================================================
  // Consent Management
  // ==========================================================================

  /**
   * Record user consent
   */
  recordConsent(
    userId: string,
    consents: Record<string, boolean>,
    metadata?: Record<string, unknown>
  ): UserConsent {
    this.logAudit('consent_change', userId, { consents });

    const consent: UserConsent = {
      userId,
      consents,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + this.config.consent.expirationDays * 24 * 60 * 60 * 1000),
      ipAddress: metadata?.ipAddress as string,
      userAgent: metadata?.userAgent as string,
      version: this.getConsentVersion(),
    };

    this.consentStore.set(userId, consent);
    return consent;
  }

  /**
   * Check if user has given consent for category
   */
  hasConsent(userId: string, category: string): boolean {
    const consent = this.consentStore.get(userId);
    if (!consent) return false;
    if (consent.expiresAt < new Date()) return false;
    return consent.consents[category] === true;
  }

  /**
   * Get user's current consents
   */
  getUserConsents(userId: string): UserConsent | null {
    return this.consentStore.get(userId) ?? null;
  }

  /**
   * Withdraw consent
   */
  withdrawConsent(userId: string, categories?: string[]): void {
    this.logAudit('consent_change', userId, { action: 'withdraw', categories });

    const consent = this.consentStore.get(userId);
    if (!consent) return;

    if (categories) {
      for (const cat of categories) {
        consent.consents[cat] = false;
      }
    } else {
      // Withdraw all non-required consents
      for (const cat of this.config.consent.categories) {
        if (!cat.required) {
          consent.consents[cat.id] = false;
        }
      }
    }

    consent.timestamp = new Date();
    this.consentStore.set(userId, consent);
  }

  // ==========================================================================
  // PII Handling
  // ==========================================================================

  /**
   * Detect PII in data
   */
  detectPII(data: Record<string, unknown>): PIIDetectionResult[] {
    const results: PIIDetectionResult[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        for (const pattern of this.config.privacy.piiHandling.patterns) {
          if (pattern.pattern.test(value)) {
            results.push({
              field: key,
              type: pattern.name,
              value: this.maskValue(value, pattern.maskChar),
              action: pattern.action,
            });
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        const nested = this.detectPII(value as Record<string, unknown>);
        results.push(...nested.map(r => ({ ...r, field: `${key}.${r.field}` })));
      }
    }

    return results;
  }

  /**
   * Sanitize PII from data
   */
  sanitizePII(
    data: Record<string, unknown>,
    action?: 'mask' | 'encrypt' | 'hash' | 'redact'
  ): Record<string, unknown> {
    const sanitized = { ...data };
    const defaultAction = action ?? this.config.privacy.piiHandling.defaultAction;

    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        for (const pattern of this.config.privacy.piiHandling.patterns) {
          if (pattern.pattern.test(value)) {
            const piiAction = action ?? pattern.action;
            sanitized[key] = this.applyPIIAction(value, piiAction, pattern.maskChar);
            break;
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizePII(value as Record<string, unknown>, defaultAction);
      }
    }

    return sanitized;
  }

  /**
   * Anonymize data
   */
  anonymize(data: Record<string, unknown>): Record<string, unknown> {
    const anonymized = this.sanitizePII(data, 'hash');

    // Remove identifying fields
    const identifyingFields = ['id', 'userId', 'email', 'name', 'phone', 'address'];
    for (const field of identifyingFields) {
      if (field in anonymized) {
        anonymized[field] = this.hashValue(String(anonymized[field]));
      }
    }

    return anonymized;
  }

  /**
   * Pseudonymize data
   */
  pseudonymize(
    data: Record<string, unknown>,
    pseudonymMap: Map<string, string>
  ): Record<string, unknown> {
    const pseudonymized = { ...data };

    for (const [key, value] of Object.entries(pseudonymized)) {
      if (typeof value === 'string' && pseudonymMap.has(value)) {
        pseudonymized[key] = pseudonymMap.get(value);
      }
    }

    return pseudonymized;
  }

  // ==========================================================================
  // Data Retention
  // ==========================================================================

  /**
   * Apply data retention policies
   */
  async applyRetentionPolicies(): Promise<RetentionResult> {
    const result: RetentionResult = {
      processed: 0,
      deleted: 0,
      archived: 0,
      errors: [],
    };

    for (const policy of this.config.dataRetention.policies) {
      if (policy.legalHold) continue;

      try {
        const cutoffDate = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);
        const expiredData = await this.findExpiredData(policy.dataType, cutoffDate);

        for (const item of expiredData) {
          result.processed++;

          if (this.config.dataRetention.archiveBeforeDelete && policy.archiveDays) {
            await this.archiveData(item);
            result.archived++;
          }

          if (this.config.dataRetention.autoDelete) {
            await this.deleteData(item);
            result.deleted++;
          }
        }
      } catch (error) {
        result.errors.push({
          dataType: policy.dataType,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Get retention status for data
   */
  getRetentionStatus(dataType: string, createdAt: Date): RetentionStatus {
    const policy = this.config.dataRetention.policies.find(p => p.dataType === dataType);
    const retentionDays = policy?.retentionDays ?? this.config.dataRetention.defaultPeriod;
    const expiresAt = new Date(createdAt.getTime() + retentionDays * 24 * 60 * 60 * 1000);
    const daysRemaining = Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

    return {
      dataType,
      createdAt,
      expiresAt,
      daysRemaining,
      legalHold: policy?.legalHold ?? false,
      willArchive: this.config.dataRetention.archiveBeforeDelete,
      willDelete: this.config.dataRetention.autoDelete,
    };
  }

  // ==========================================================================
  // Audit Logging
  // ==========================================================================

  /**
   * Log audit event
   */
  logAudit(
    eventType: AuditEventType,
    userId: string,
    details: Record<string, unknown>
  ): void {
    if (!this.config.audit.enabled) return;
    if (!this.config.audit.events.includes(eventType)) return;

    const entry: AuditEntry = {
      id: this.generateRequestId(),
      timestamp: new Date(),
      eventType,
      userId,
      details,
      ipAddress: details.ipAddress as string,
      userAgent: details.userAgent as string,
    };

    this.auditLog.push(entry);

    // Trim old entries
    const cutoffDate = new Date(Date.now() - this.config.audit.retentionDays * 24 * 60 * 60 * 1000);
    this.auditLog = this.auditLog.filter(e => e.timestamp > cutoffDate);
  }

  /**
   * Get audit log for user
   */
  getAuditLog(
    filters?: {
      userId?: string;
      eventType?: AuditEventType;
      startDate?: Date;
      endDate?: Date;
    }
  ): AuditEntry[] {
    let entries = [...this.auditLog];

    if (filters?.userId) {
      entries = entries.filter(e => e.userId === filters.userId);
    }
    if (filters?.eventType) {
      entries = entries.filter(e => e.eventType === filters.eventType);
    }
    if (filters?.startDate) {
      entries = entries.filter(e => e.timestamp >= filters.startDate!);
    }
    if (filters?.endDate) {
      entries = entries.filter(e => e.timestamp <= filters.endDate!);
    }

    return entries;
  }

  /**
   * Export audit log
   */
  exportAuditLog(
    format?: 'json' | 'csv' | 'xml',
    filters?: {
      userId?: string;
      eventType?: AuditEventType;
      startDate?: Date;
      endDate?: Date;
    }
  ): string {
    const entries = this.getAuditLog(filters);
    return this.formatExport(entries, format ?? this.config.audit.exportFormat);
  }

  // ==========================================================================
  // Compliance Reports
  // ==========================================================================

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    framework: ComplianceFramework
  ): Promise<ComplianceReport> {
    const controls = this.getFrameworkControls(framework);
    const results: ControlResult[] = [];

    for (const control of controls) {
      const result = await this.evaluateControl(control);
      results.push(result);
    }

    const passedControls = results.filter(r => r.status === 'pass').length;
    const totalControls = results.length;

    return {
      framework,
      generatedAt: new Date(),
      overallScore: (passedControls / totalControls) * 100,
      passedControls,
      failedControls: totalControls - passedControls,
      controls: results,
      recommendations: results
        .filter(r => r.status === 'fail')
        .map(r => r.recommendation)
        .filter(Boolean) as string[],
    };
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  private getDefaultPIIPatterns(): PIIPattern[] {
    return [
      { name: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, action: 'mask', maskChar: '*' },
      { name: 'phone', pattern: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, action: 'mask', maskChar: '*' },
      { name: 'ssn', pattern: /\d{3}-?\d{2}-?\d{4}/g, action: 'redact' },
      { name: 'credit_card', pattern: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g, action: 'mask', maskChar: '*' },
      { name: 'ip_address', pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, action: 'hash' },
    ];
  }

  private getDefaultConsentCategories(): ConsentCategory[] {
    return [
      { id: 'necessary', name: 'Necessary', description: 'Required for the website to function', required: true, default: true },
      { id: 'analytics', name: 'Analytics', description: 'Help us improve our website', required: false, default: false },
      { id: 'marketing', name: 'Marketing', description: 'Personalized ads and content', required: false, default: false },
      { id: 'preferences', name: 'Preferences', description: 'Remember your settings', required: false, default: false },
    ];
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private getConsentVersion(): string {
    return '1.0';
  }

  private maskValue(value: string, maskChar = '*'): string {
    if (value.length <= 4) return maskChar.repeat(value.length);
    return value.slice(0, 2) + maskChar.repeat(value.length - 4) + value.slice(-2);
  }

  private hashValue(value: string): string {
    // Simple hash for demo - use crypto in production
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }

  private applyPIIAction(
    value: string,
    action: 'mask' | 'encrypt' | 'hash' | 'redact',
    maskChar = '*'
  ): string {
    switch (action) {
      case 'mask':
        return this.maskValue(value, maskChar);
      case 'hash':
        return this.hashValue(value);
      case 'redact':
        return '[REDACTED]';
      case 'encrypt':
        return `[ENCRYPTED:${this.hashValue(value)}]`;
      default:
        return value;
    }
  }

  private async collectUserData(userId: string): Promise<Record<string, unknown>> {
    // Override in implementation
    return { userId, data: 'placeholder' };
  }

  private async deleteUserData(userId: string, dataType: string): Promise<void> {
    // Override in implementation
  }

  private async findExpiredData(dataType: string, cutoffDate: Date): Promise<unknown[]> {
    // Override in implementation
    return [];
  }

  private async archiveData(item: unknown): Promise<void> {
    // Override in implementation
  }

  private async deleteData(item: unknown): Promise<void> {
    // Override in implementation
  }

  private formatExport(data: unknown, format: 'json' | 'csv' | 'xml'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        if (Array.isArray(data) && data.length > 0) {
          const headers = Object.keys(data[0] as object);
          const rows = data.map(item =>
            headers.map(h => JSON.stringify((item as Record<string, unknown>)[h])).join(',')
          );
          return [headers.join(','), ...rows].join('\n');
        }
        return '';
      case 'xml':
        return `<?xml version="1.0" encoding="UTF-8"?><data>${JSON.stringify(data)}</data>`;
      default:
        return JSON.stringify(data);
    }
  }

  private getFrameworkControls(framework: ComplianceFramework): ComplianceControl[] {
    // Return framework-specific controls
    const controls: Record<ComplianceFramework, ComplianceControl[]> = {
      GDPR: [
        { id: 'gdpr-1', name: 'Consent Management', category: 'Data Protection', required: true },
        { id: 'gdpr-2', name: 'Data Access Rights', category: 'Data Subject Rights', required: true },
        { id: 'gdpr-3', name: 'Data Portability', category: 'Data Subject Rights', required: true },
        { id: 'gdpr-4', name: 'Right to Erasure', category: 'Data Subject Rights', required: true },
        { id: 'gdpr-5', name: 'Data Breach Notification', category: 'Security', required: true },
      ],
      CCPA: [
        { id: 'ccpa-1', name: 'Privacy Notice', category: 'Transparency', required: true },
        { id: 'ccpa-2', name: 'Opt-Out Mechanism', category: 'Consumer Rights', required: true },
        { id: 'ccpa-3', name: 'Data Inventory', category: 'Data Management', required: true },
      ],
      HIPAA: [
        { id: 'hipaa-1', name: 'PHI Encryption', category: 'Security', required: true },
        { id: 'hipaa-2', name: 'Access Controls', category: 'Security', required: true },
        { id: 'hipaa-3', name: 'Audit Logging', category: 'Accountability', required: true },
      ],
      SOC2: [
        { id: 'soc2-1', name: 'Security Policies', category: 'Security', required: true },
        { id: 'soc2-2', name: 'Access Management', category: 'Security', required: true },
        { id: 'soc2-3', name: 'Incident Response', category: 'Availability', required: true },
      ],
      ISO27001: [
        { id: 'iso-1', name: 'Information Security Policy', category: 'Governance', required: true },
        { id: 'iso-2', name: 'Risk Assessment', category: 'Risk Management', required: true },
      ],
      'PCI-DSS': [
        { id: 'pci-1', name: 'Firewall Configuration', category: 'Network Security', required: true },
        { id: 'pci-2', name: 'Cardholder Data Protection', category: 'Data Protection', required: true },
      ],
      FERPA: [
        { id: 'ferpa-1', name: 'Student Records Protection', category: 'Data Protection', required: true },
      ],
      COPPA: [
        { id: 'coppa-1', name: 'Parental Consent', category: 'Consent', required: true },
      ],
    };

    return controls[framework] || [];
  }

  private async evaluateControl(control: ComplianceControl): Promise<ControlResult> {
    // Evaluate control status based on configuration
    let status: 'pass' | 'fail' | 'partial' = 'pass';
    let recommendation: string | undefined;

    // Simple evaluation based on config
    if (control.category === 'Data Protection' && !this.config.privacy.encryptionAtRest) {
      status = 'fail';
      recommendation = 'Enable encryption at rest';
    }

    return {
      controlId: control.id,
      name: control.name,
      status,
      recommendation,
    };
  }
}

// ==========================================================================
// Types
// ==========================================================================

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
  errors: { dataType: string; error: string }[];
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
export function createComplianceManager(config?: Partial<ComplianceConfig>): ComplianceManager {
  return new ComplianceManager(config);
}
