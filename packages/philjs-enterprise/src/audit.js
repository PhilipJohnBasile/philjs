/**
 * Audit Logging for PhilJS Enterprise
 *
 * Provides comprehensive audit logging for compliance and security.
 */
export class AuditLogger {
    config;
    buffer = [];
    flushInterval = null;
    constructor(config) {
        this.config = config;
        if (config.realtime) {
            this.flushInterval = setInterval(() => this.flush(), 5000);
        }
    }
    async log(event) {
        if (!this.config.enabled)
            return;
        const auditEvent = {
            ...event,
            id: this.generateId(),
            timestamp: new Date(),
        };
        if (this.config.realtime) {
            await this.config.storage.write(auditEvent);
        }
        else {
            this.buffer.push(auditEvent);
            if (this.buffer.length >= 100) {
                await this.flush();
            }
        }
    }
    async query(filter) {
        return this.config.storage.query(filter);
    }
    async flush() {
        if (this.buffer.length === 0)
            return;
        const events = [...this.buffer];
        this.buffer = [];
        for (const event of events) {
            await this.config.storage.write(event);
        }
    }
    async cleanup() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
        return this.config.storage.delete({ endDate: cutoffDate });
    }
    destroy() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
    }
    generateId() {
        return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
export function createAuditLogger(config) {
    return new AuditLogger(config);
}
export function createInMemoryStorage() {
    const events = [];
    return {
        type: 'memory',
        async write(event) {
            events.push(event);
        },
        async query(filter) {
            return events.filter(e => {
                if (filter.tenantId && e.tenantId !== filter.tenantId)
                    return false;
                if (filter.userId && e.userId !== filter.userId)
                    return false;
                if (filter.action && e.action !== filter.action)
                    return false;
                if (filter.startDate && e.timestamp < filter.startDate)
                    return false;
                if (filter.endDate && e.timestamp > filter.endDate)
                    return false;
                return true;
            }).slice(filter.offset || 0, (filter.offset || 0) + (filter.limit || 100));
        },
        async delete(filter) {
            const before = events.length;
            const toKeep = events.filter(e => {
                if (filter.endDate && e.timestamp <= filter.endDate)
                    return false;
                return true;
            });
            events.length = 0;
            events.push(...toKeep);
            return before - events.length;
        },
    };
}
//# sourceMappingURL=audit.js.map