/**
 * PhilJS Privacy-First Analytics
 *
 * UNIQUE INNOVATION: Built-in analytics that respect user privacy by default.
 *
 * Features:
 * - No third-party scripts or cookies
 * - All processing done client-side or at edge
 * - GDPR/CCPA compliant by design
 * - No PII collection
 * - Aggregated metrics only
 * - User-controlled data sharing
 * - Optional edge aggregation (no raw data leaves device)
 * - Differential privacy for sensitive metrics
 * - Open-source and auditable
 *
 * No other framework provides this level of privacy-respecting analytics.
 *
 * @packageDocumentation
 */
export interface PrivacyConfig {
    /** Enable analytics (respects Do Not Track) */
    enabled: boolean;
    /** Respect Do Not Track header */
    respectDoNotTrack: boolean;
    /** Enable differential privacy for sensitive metrics */
    differentialPrivacy: boolean;
    /** Privacy budget (epsilon for differential privacy) */
    privacyBudget: number;
    /** Aggregate metrics before sending */
    aggregateFirst: boolean;
    /** Minimum aggregation threshold (k-anonymity) */
    minAggregationCount: number;
    /** Data retention period (ms) */
    retentionPeriod: number;
    /** Enable consent management */
    requireConsent: boolean;
    /** Storage key for local data */
    storageKey: string;
    /** Endpoint for aggregated data (optional) */
    endpoint?: string;
    /** Enable Core Web Vitals tracking */
    trackWebVitals: boolean;
    /** Enable page view tracking */
    trackPageViews: boolean;
    /** Enable click tracking (aggregated) */
    trackClicks: boolean;
    /** Enable scroll tracking */
    trackScroll: boolean;
    /** Enable error tracking (sanitized) */
    trackErrors: boolean;
}
export interface AnalyticsEvent {
    /** Event type */
    type: EventType;
    /** Timestamp (rounded for privacy) */
    timestamp: number;
    /** Page/route */
    page: string;
    /** Additional data (sanitized) */
    data?: Record<string, string | number | boolean>;
}
export type EventType = 'page_view' | 'page_leave' | 'click' | 'scroll' | 'error' | 'web_vital' | 'custom';
export interface AggregatedMetrics {
    /** Time period start */
    periodStart: number;
    /** Time period end */
    periodEnd: number;
    /** Page view counts (aggregated) */
    pageViews: Map<string, number>;
    /** Unique visitor estimate (using HyperLogLog) */
    uniqueVisitors: number;
    /** Average session duration */
    avgSessionDuration: number;
    /** Bounce rate */
    bounceRate: number;
    /** Top pages */
    topPages: {
        page: string;
        count: number;
    }[];
    /** Web Vitals averages */
    webVitals: WebVitalsAggregate;
    /** Error counts by type */
    errorCounts: Map<string, number>;
    /** Device breakdown (generalized) */
    devices: {
        mobile: number;
        tablet: number;
        desktop: number;
    };
    /** Country breakdown (if allowed) */
    countries?: Map<string, number>;
}
export interface WebVitalsAggregate {
    /** Largest Contentful Paint (ms) */
    lcp: {
        p50: number;
        p75: number;
        p90: number;
    };
    /** First Input Delay (ms) */
    fid: {
        p50: number;
        p75: number;
        p90: number;
    };
    /** Cumulative Layout Shift */
    cls: {
        p50: number;
        p75: number;
        p90: number;
    };
    /** Interaction to Next Paint (ms) */
    inp: {
        p50: number;
        p75: number;
        p90: number;
    };
    /** Time to First Byte (ms) */
    ttfb: {
        p50: number;
        p75: number;
        p90: number;
    };
    /** First Contentful Paint (ms) */
    fcp: {
        p50: number;
        p75: number;
        p90: number;
    };
}
export interface ConsentState {
    /** Analytics consent given */
    analytics: boolean;
    /** Performance tracking consent */
    performance: boolean;
    /** Error tracking consent */
    errors: boolean;
    /** Consent timestamp */
    timestamp: number;
    /** Consent version (for re-prompting on policy changes) */
    version: number;
}
export declare class PrivacyFirstAnalytics {
    private config;
    private events;
    private consent;
    private sessionId;
    private sessionStart;
    private pageEnterTime;
    private scrollDepthMax;
    private hyperLogLog;
    private webVitals;
    private isDestroyed;
    constructor(config?: Partial<PrivacyConfig>);
    /**
     * Track a custom event
     */
    track(eventName: string, data?: Record<string, string | number | boolean>): void;
    /**
     * Track a page view
     */
    trackPageView(page?: string): void;
    /**
     * Set user consent
     */
    setConsent(consent: Partial<ConsentState>): void;
    /**
     * Get current consent state
     */
    getConsent(): ConsentState | null;
    /**
     * Get aggregated metrics (privacy-safe)
     */
    getMetrics(): AggregatedMetrics;
    /**
     * Export anonymized data for analysis
     */
    exportData(): string;
    /**
     * Clear all stored data
     */
    clearData(): void;
    /**
     * Cleanup
     */
    destroy(): void;
    private setupTracking;
    private setupWebVitalsTracking;
    private recordWebVital;
    private isDoNotTrackEnabled;
    private isTrackingAllowed;
    private sanitizeData;
    private isSensitiveField;
    private sanitizeString;
    private anonymizePage;
    private roundTimestamp;
    private roundNumber;
    private addLaplaceNoise;
    private laplaceSample;
    private applyKAnonymity;
    private generateSessionId;
    private getVisitorHash;
    private getCurrentPage;
    private getClickZone;
    private getDeviceBreakdown;
    private addEvent;
    private groupEventsBySession;
    private calculateSessionDuration;
    private calculateAverage;
    private aggregateWebVitals;
    private loadConsent;
    private saveConsent;
    private persistEvents;
}
/**
 * Initialize privacy-first analytics
 */
export declare function initAnalytics(config?: Partial<PrivacyConfig>): PrivacyFirstAnalytics;
/**
 * Get the global analytics instance
 */
export declare function getAnalytics(): PrivacyFirstAnalytics | null;
/**
 * Reset analytics (for testing)
 */
export declare function resetAnalytics(): void;
/**
 * Hook to use analytics
 */
export declare function useAnalytics(): {
    track: (event: string, data?: Record<string, any>) => void;
    trackPageView: (page?: string) => void;
    getMetrics: () => AggregatedMetrics;
};
/**
 * Hook to manage consent
 */
export declare function useConsent(): {
    consent: ConsentState | null;
    setConsent: (consent: Partial<ConsentState>) => void;
    isConsentRequired: boolean;
};
//# sourceMappingURL=privacy-first.d.ts.map