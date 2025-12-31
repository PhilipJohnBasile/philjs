/**
 * Dashboard Web Component
 * Real-time metrics display with charts, time range selector, and filters
 * Pure Web Component - No React
 */
import type { MetricsSnapshot, WebVitalsMetrics } from '../collector/metrics.js';
import type { Span } from '../collector/tracing.js';
import type { CapturedError, ErrorGroup } from '../collector/errors.js';
export type TimeRange = '15m' | '1h' | '6h' | '24h' | '7d' | '30d' | 'custom';
export interface TimeRangeValue {
    start: number;
    end: number;
    label: string;
}
export interface DashboardFilter {
    sessionId?: string;
    traceId?: string;
    errorFingerprint?: string;
    environment?: string;
    release?: string;
}
export interface DashboardTab {
    id: string;
    label: string;
    icon?: string;
}
export interface DashboardData {
    metrics: MetricsSnapshot[];
    spans: Span[];
    errors: CapturedError[];
    errorGroups: ErrorGroup[];
    isLoading: boolean;
    error: Error | null;
}
export interface DashboardConfig {
    fetchData: (timeRange: TimeRangeValue, filters: DashboardFilter) => Promise<Omit<DashboardData, 'isLoading' | 'error'>>;
    refreshInterval?: number;
    defaultTimeRange?: TimeRange;
    tabs?: DashboardTab[];
    theme?: 'light' | 'dark' | 'system';
    onError?: (error: Error) => void;
}
export declare class PhilDashboard extends HTMLElement {
    static observedAttributes: string[];
    private shadow;
    private config;
    private data;
    private selectedRange;
    private timeRange;
    private filters;
    private activeTab;
    private refreshTimer;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, _oldValue: string, newValue: string): void;
    configure(config: DashboardConfig): void;
    private fetchData;
    private startAutoRefresh;
    private stopAutoRefresh;
    private setupEventListeners;
    private renderOverviewCards;
    private render;
}
export declare class PhilMetricCard extends HTMLElement {
    static observedAttributes: string[];
    private shadow;
    constructor();
    connectedCallback(): void;
    attributeChangedCallback(): void;
    private render;
}
export declare class PhilChartContainer extends HTMLElement {
    static observedAttributes: string[];
    private shadow;
    constructor();
    connectedCallback(): void;
    attributeChangedCallback(): void;
    private render;
}
export { type WebVitalsMetrics };
//# sourceMappingURL=Dashboard.d.ts.map