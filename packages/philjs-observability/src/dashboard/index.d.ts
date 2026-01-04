/**
 * Dashboard Components - Observability dashboard panels and views
 *
 * Features:
 * - Main Dashboard with overview and navigation
 * - Performance Dashboard with comprehensive monitoring
 * - Web Vitals Dashboard (LCP, FID, CLS, etc.)
 * - Metrics display (counters, histograms, gauges)
 * - Real-time graphs with live streaming data
 * - Error tracking panel with filtering
 * - Network waterfall for resource loading timeline
 * - Component render times profiling
 * - Memory usage tracking and alerts
 * - Bundle analysis with treemap visualization
 * - Configurable threshold alerts
 *
 * @remarks
 * Dashboard component implementations are currently placeholder stubs.
 * The type definitions and interfaces are complete and ready for use.
 * Component implementations will render full dashboard UIs when the
 * philjs-observability-ui package is available.
 *
 * Planned components (backlog):
 * - Dashboard, PerformanceDashboard, WebVitalsDashboard
 * - MetricsPanel, TracesPanel, LogsPanel, ErrorsPanel, PerformancePanel
 * - RealTimeMetricsPanel, NetworkWaterfallPanel, ComponentRenderPanel
 * - MemoryUsagePanel, BundleAnalysisPanel, AlertsConfigPanel
 */
export interface DashboardProps {
    title?: string;
    refreshInterval?: number;
}
export interface DashboardTab {
    id: string;
    label: string;
    icon?: string;
}
export interface PerformanceDashboardProps {
    metrics?: PerformanceMetrics;
    panels?: DashboardPanel[];
}
export interface PerformanceMetrics {
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    ttfb?: number;
}
export interface DashboardPanel {
    id: string;
    title: string;
    type: 'chart' | 'table' | 'stat';
}
export interface WebVitalsDashboardProps {
    thresholds?: WebVitalThresholds;
}
export interface WebVitalsData {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
}
export interface WebVitalThresholds {
    lcp?: {
        good: number;
        needsImprovement: number;
    };
    fid?: {
        good: number;
        needsImprovement: number;
    };
    cls?: {
        good: number;
        needsImprovement: number;
    };
}
export interface MetricsPanelProps {
    metrics?: MetricGroup[];
}
export interface MetricGroup {
    name: string;
    metrics: Array<{
        name: string;
        value: number;
    }>;
}
export interface TracesPanelProps {
    traces?: Trace[];
}
export interface Trace {
    traceId: string;
    name: string;
    duration: number;
    status: 'ok' | 'error';
}
export interface LogsPanelProps {
    level?: 'debug' | 'info' | 'warn' | 'error';
}
export interface ErrorsPanelProps {
    errors?: TrackedError[];
}
export interface TrackedError {
    id: string;
    message: string;
    stack?: string;
    count: number;
}
export interface ErrorGroup {
    fingerprint: string;
    errors: TrackedError[];
}
export interface PerformancePanelProps {
    vitals?: WebVital[];
}
export interface WebVital {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
}
export interface RealTimeMetricsPanelProps {
    streams?: MetricStream[];
}
export interface MetricStream {
    name: string;
    dataPoints: Array<{
        timestamp: number;
        value: number;
    }>;
}
export interface NetworkWaterfallPanelProps {
    resources?: ResourceTiming[];
}
export interface ResourceTiming {
    name: string;
    startTime: number;
    duration: number;
    type: string;
}
export interface ResourceGroup {
    type: string;
    resources: ResourceTiming[];
}
export interface ComponentRenderPanelProps {
    components?: ComponentRenderData[];
}
export interface ComponentRenderData {
    name: string;
    renderCount: number;
    totalTime: number;
}
export interface RenderProfile {
    componentName: string;
    renders: Array<{
        timestamp: number;
        duration: number;
    }>;
}
export interface MemoryUsagePanelProps {
    snapshots?: MemorySnapshot[];
}
export interface MemorySnapshot {
    timestamp: number;
    usedJSHeapSize: number;
    totalJSHeapSize: number;
}
export interface MemoryTrend {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
}
export interface MemoryAlert {
    threshold: number;
    triggered: boolean;
}
export interface BundleAnalysisPanelProps {
    analysis?: BundleAnalysis;
}
export interface BundleModule {
    name: string;
    size: number;
    path: string;
}
export interface BundleChunk {
    name: string;
    size: number;
    modules: BundleModule[];
}
export interface BundleAnalysis {
    totalSize: number;
    chunks: BundleChunk[];
}
export interface AlertsConfigPanelProps {
    rules?: AlertRule[];
}
export interface AlertRule {
    id: string;
    name: string;
    condition: AlertCondition;
    channels: AlertChannel[];
}
export interface AlertChannel {
    type: 'email' | 'slack' | 'webhook';
    target: string;
}
export interface AlertCondition {
    metric: AlertMetricType;
    operator: '>' | '<' | '==' | '>=' | '<=';
    threshold: number;
}
export type AlertMetricType = 'lcp' | 'fid' | 'cls' | 'memory' | 'error_rate' | 'custom';
export interface AlertHistory {
    ruleId: string;
    triggeredAt: Date;
    resolvedAt?: Date;
}
export declare function Dashboard(_props: DashboardProps): null;
export declare function PerformanceDashboard(_props: PerformanceDashboardProps): null;
export declare function WebVitalsDashboard(_props: WebVitalsDashboardProps): null;
export declare function MetricsPanel(_props: MetricsPanelProps): null;
export declare function TracesPanel(_props: TracesPanelProps): null;
export declare function LogsPanel(_props: LogsPanelProps): null;
export declare function ErrorsPanel(_props: ErrorsPanelProps): null;
export declare function PerformancePanel(_props: PerformancePanelProps): null;
export declare function RealTimeMetricsPanel(_props: RealTimeMetricsPanelProps): null;
export declare function NetworkWaterfallPanel(_props: NetworkWaterfallPanelProps): null;
export declare function ComponentRenderPanel(_props: ComponentRenderPanelProps): null;
export declare function MemoryUsagePanel(_props: MemoryUsagePanelProps): null;
export declare function BundleAnalysisPanel(_props: BundleAnalysisPanelProps): null;
export declare function AlertsConfigPanel(_props: AlertsConfigPanelProps): null;
//# sourceMappingURL=index.d.ts.map