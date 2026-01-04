/**
 * Audit Logging for PhilJS Enterprise
 *
 * Provides comprehensive audit logging for compliance and security.
 */
export interface AuditEvent {
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
export interface AuditMetadata {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    requestId?: string;
    geoLocation?: {
        country?: string;
        city?: string;
    };
    deviceInfo?: {
        type?: string;
        os?: string;
        browser?: string;
    };
}
export interface AuditConfig {
    enabled: boolean;
    retentionDays: number;
    storage: AuditStorage;
    realtime?: boolean;
    encrypt?: boolean;
    pii?: boolean;
}
export interface AuditStorage {
    type: 'memory' | 'database' | 'cloud' | 'custom';
    write: (event: AuditEvent) => Promise<void>;
    query: (filter: AuditFilter) => Promise<AuditEvent[]>;
    delete: (filter: AuditFilter) => Promise<number>;
}
export interface AuditFilter {
    tenantId?: string;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    outcome?: 'success' | 'failure';
    severity?: 'info' | 'warning' | 'critical';
    limit?: number;
    offset?: number;
}
export declare class AuditLogger {
    private config;
    private buffer;
    private flushInterval;
    constructor(config: AuditConfig);
    log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void>;
    query(filter: AuditFilter): Promise<AuditEvent[]>;
    flush(): Promise<void>;
    cleanup(): Promise<number>;
    destroy(): void;
    private generateId;
}
export declare function createAuditLogger(config: AuditConfig): AuditLogger;
export declare function createInMemoryStorage(): AuditStorage;
//# sourceMappingURL=audit.d.ts.map