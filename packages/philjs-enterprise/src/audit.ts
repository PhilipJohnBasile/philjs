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
  geoLocation?: { country?: string; city?: string };
  deviceInfo?: { type?: string; os?: string; browser?: string };
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

export class AuditLogger {
  private config: AuditConfig;
  private buffer: AuditEvent[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: AuditConfig) {
    this.config = config;
    if (config.realtime) {
      this.flushInterval = setInterval(() => this.flush(), 5000);
    }
  }

  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    if (!this.config.enabled) return;

    const auditEvent: AuditEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date(),
    };

    if (this.config.realtime) {
      await this.config.storage.write(auditEvent);
    } else {
      this.buffer.push(auditEvent);
      if (this.buffer.length >= 100) {
        await this.flush();
      }
    }
  }

  async query(filter: AuditFilter): Promise<AuditEvent[]> {
    return this.config.storage.query(filter);
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const events = [...this.buffer];
    this.buffer = [];
    for (const event of events) {
      await this.config.storage.write(event);
    }
  }

  async cleanup(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    return this.config.storage.delete({ endDate: cutoffDate });
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
  }

  private generateId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export function createAuditLogger(config: AuditConfig): AuditLogger {
  return new AuditLogger(config);
}

export function createInMemoryStorage(): AuditStorage {
  const events: AuditEvent[] = [];

  return {
    type: 'memory',
    async write(event: AuditEvent): Promise<void> {
      events.push(event);
    },
    async query(filter: AuditFilter): Promise<AuditEvent[]> {
      return events.filter(e => {
        if (filter.tenantId && e.tenantId !== filter.tenantId) return false;
        if (filter.userId && e.userId !== filter.userId) return false;
        if (filter.action && e.action !== filter.action) return false;
        if (filter.startDate && e.timestamp < filter.startDate) return false;
        if (filter.endDate && e.timestamp > filter.endDate) return false;
        return true;
      }).slice(filter.offset || 0, (filter.offset || 0) + (filter.limit || 100));
    },
    async delete(filter: AuditFilter): Promise<number> {
      const before = events.length;
      const toKeep = events.filter(e => {
        if (filter.endDate && e.timestamp <= filter.endDate) return false;
        return true;
      });
      events.length = 0;
      events.push(...toKeep);
      return before - events.length;
    },
  };
}
