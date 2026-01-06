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
 */

// Type definitions
export interface DashboardProps {
    title?: string;
    refreshInterval?: number;
    tabs?: DashboardTab[];
    children?: VNode[];
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
    data?: WebVitalsData;
}

export interface WebVitalsData {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
}

export interface WebVitalThresholds {
    lcp?: { good: number; needsImprovement: number };
    fid?: { good: number; needsImprovement: number };
    cls?: { good: number; needsImprovement: number };
}

export interface MetricsPanelProps {
    metrics?: MetricGroup[];
    title?: string;
}

export interface MetricGroup {
    name: string;
    metrics: Array<{ name: string; value: number; unit?: string }>;
}

export interface TracesPanelProps {
    traces?: Trace[];
    maxDisplayed?: number;
}

export interface Trace {
    traceId: string;
    name: string;
    duration: number;
    status: 'ok' | 'error';
    startTime?: number;
    spans?: TraceSpan[];
}

export interface TraceSpan {
    spanId: string;
    name: string;
    duration: number;
    startTime: number;
}

export interface LogsPanelProps {
    level?: 'debug' | 'info' | 'warn' | 'error';
    logs?: LogEntry[];
    maxDisplayed?: number;
}

export interface LogEntry {
    timestamp: number;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    context?: Record<string, any>;
}

export interface ErrorsPanelProps {
    errors?: TrackedError[];
    groupBy?: 'message' | 'stack';
}

export interface TrackedError {
    id: string;
    message: string;
    stack?: string;
    count: number;
    lastSeen?: number;
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
    updateInterval?: number;
}

export interface MetricStream {
    name: string;
    dataPoints: Array<{ timestamp: number; value: number }>;
    color?: string;
}

export interface NetworkWaterfallPanelProps {
    resources?: ResourceTiming[];
}

export interface ResourceTiming {
    name: string;
    startTime: number;
    duration: number;
    type: string;
    size?: number;
}

export interface ResourceGroup {
    type: string;
    resources: ResourceTiming[];
}

export interface ComponentRenderPanelProps {
    components?: ComponentRenderData[];
    sortBy?: 'name' | 'renderCount' | 'totalTime';
}

export interface ComponentRenderData {
    name: string;
    renderCount: number;
    totalTime: number;
    avgTime?: number;
}

export interface RenderProfile {
    componentName: string;
    renders: Array<{ timestamp: number; duration: number }>;
}

export interface MemoryUsagePanelProps {
    snapshots?: MemorySnapshot[];
    threshold?: number;
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
    onSave?: (rules: AlertRule[]) => void;
}

export interface AlertRule {
    id: string;
    name: string;
    condition: AlertCondition;
    channels: AlertChannel[];
    enabled?: boolean;
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

// VNode type for framework-agnostic rendering
export interface VNode {
    type: string;
    props: Record<string, any>;
    children: (VNode | string)[];
}

// Helper to create VNodes
function h(type: string, props: Record<string, any> = {}, ...children: (VNode | string | null | undefined)[]): VNode {
    return {
        type,
        props,
        children: children.filter((c): c is VNode | string => c != null),
    };
}

// Utility functions
function formatNumber(num: number, decimals = 2): string {
    return num.toFixed(decimals);
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

function getRatingClass(rating: string): string {
    switch (rating) {
        case 'good': return 'rating-good';
        case 'needs-improvement': return 'rating-warning';
        case 'poor': return 'rating-poor';
        default: return '';
    }
}

function getVitalRating(name: string, value: number, thresholds?: WebVitalThresholds): 'good' | 'needs-improvement' | 'poor' {
    const defaults: Record<string, { good: number; needsImprovement: number }> = {
        lcp: { good: 2500, needsImprovement: 4000 },
        fid: { good: 100, needsImprovement: 300 },
        cls: { good: 0.1, needsImprovement: 0.25 },
        fcp: { good: 1800, needsImprovement: 3000 },
        ttfb: { good: 800, needsImprovement: 1800 },
    };

    const threshold = (thresholds as any)?.[name] || defaults[name];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
}

// Dashboard Components

export function Dashboard(props: DashboardProps): VNode {
    const { title = 'Observability Dashboard', tabs = [], children = [] } = props;

    return h('div', { class: 'phil-dashboard' },
        h('header', { class: 'dashboard-header' },
            h('h1', { class: 'dashboard-title' }, title),
            tabs.length > 0 && h('nav', { class: 'dashboard-tabs' },
                ...tabs.map(tab =>
                    h('button', { class: 'dashboard-tab', 'data-tab': tab.id },
                        tab.icon && h('span', { class: 'tab-icon' }, tab.icon),
                        tab.label
                    )
                )
            )
        ),
        h('main', { class: 'dashboard-content' }, ...children)
    );
}

export function PerformanceDashboard(props: PerformanceDashboardProps): VNode {
    const { metrics = {}, panels = [] } = props;

    return h('div', { class: 'performance-dashboard' },
        h('section', { class: 'metrics-overview' },
            h('h2', {}, 'Performance Overview'),
            h('div', { class: 'metrics-grid' },
                metrics.fcp !== undefined && h('div', { class: 'metric-card' },
                    h('span', { class: 'metric-label' }, 'FCP'),
                    h('span', { class: 'metric-value' }, formatDuration(metrics.fcp))
                ),
                metrics.lcp !== undefined && h('div', { class: 'metric-card' },
                    h('span', { class: 'metric-label' }, 'LCP'),
                    h('span', { class: 'metric-value' }, formatDuration(metrics.lcp))
                ),
                metrics.fid !== undefined && h('div', { class: 'metric-card' },
                    h('span', { class: 'metric-label' }, 'FID'),
                    h('span', { class: 'metric-value' }, formatDuration(metrics.fid))
                ),
                metrics.cls !== undefined && h('div', { class: 'metric-card' },
                    h('span', { class: 'metric-label' }, 'CLS'),
                    h('span', { class: 'metric-value' }, formatNumber(metrics.cls, 3))
                ),
                metrics.ttfb !== undefined && h('div', { class: 'metric-card' },
                    h('span', { class: 'metric-label' }, 'TTFB'),
                    h('span', { class: 'metric-value' }, formatDuration(metrics.ttfb))
                )
            )
        ),
        panels.length > 0 && h('section', { class: 'dashboard-panels' },
            ...panels.map(panel =>
                h('div', { class: `panel panel-${panel.type}`, id: panel.id },
                    h('h3', { class: 'panel-title' }, panel.title)
                )
            )
        )
    );
}

export function WebVitalsDashboard(props: WebVitalsDashboardProps): VNode {
    const { thresholds, data } = props;

    const vitals = data ? [
        { name: 'lcp', label: 'Largest Contentful Paint', value: data.lcp, unit: 'ms' },
        { name: 'fid', label: 'First Input Delay', value: data.fid, unit: 'ms' },
        { name: 'cls', label: 'Cumulative Layout Shift', value: data.cls, unit: '' },
        { name: 'fcp', label: 'First Contentful Paint', value: data.fcp, unit: 'ms' },
        { name: 'ttfb', label: 'Time to First Byte', value: data.ttfb, unit: 'ms' },
    ] : [];

    return h('div', { class: 'web-vitals-dashboard' },
        h('h2', {}, 'Core Web Vitals'),
        h('div', { class: 'vitals-grid' },
            ...vitals.map(vital => {
                const rating = getVitalRating(vital.name, vital.value, thresholds);
                return h('div', { class: `vital-card ${getRatingClass(rating)}` },
                    h('span', { class: 'vital-name' }, vital.label),
                    h('span', { class: 'vital-value' },
                        vital.unit === 'ms' ? formatDuration(vital.value) : formatNumber(vital.value, 3)
                    ),
                    h('span', { class: 'vital-rating' }, rating)
                );
            })
        )
    );
}

export function MetricsPanel(props: MetricsPanelProps): VNode {
    const { metrics = [], title = 'Metrics' } = props;

    return h('div', { class: 'metrics-panel' },
        h('h3', { class: 'panel-title' }, title),
        h('div', { class: 'metrics-groups' },
            ...metrics.map(group =>
                h('div', { class: 'metric-group' },
                    h('h4', { class: 'group-name' }, group.name),
                    h('ul', { class: 'metrics-list' },
                        ...group.metrics.map(m =>
                            h('li', { class: 'metric-item' },
                                h('span', { class: 'metric-name' }, m.name),
                                h('span', { class: 'metric-value' },
                                    formatNumber(m.value),
                                    m.unit && h('span', { class: 'metric-unit' }, ` ${m.unit}`)
                                )
                            )
                        )
                    )
                )
            )
        )
    );
}

export function TracesPanel(props: TracesPanelProps): VNode {
    const { traces = [], maxDisplayed = 50 } = props;
    const displayedTraces = traces.slice(0, maxDisplayed);

    return h('div', { class: 'traces-panel' },
        h('h3', { class: 'panel-title' }, 'Traces'),
        h('table', { class: 'traces-table' },
            h('thead', {},
                h('tr', {},
                    h('th', {}, 'Trace ID'),
                    h('th', {}, 'Name'),
                    h('th', {}, 'Duration'),
                    h('th', {}, 'Status')
                )
            ),
            h('tbody', {},
                ...displayedTraces.map(trace =>
                    h('tr', { class: `trace-row trace-${trace.status}` },
                        h('td', { class: 'trace-id' }, trace.traceId.slice(0, 8)),
                        h('td', { class: 'trace-name' }, trace.name),
                        h('td', { class: 'trace-duration' }, formatDuration(trace.duration)),
                        h('td', { class: 'trace-status' },
                            h('span', { class: `status-badge status-${trace.status}` }, trace.status)
                        )
                    )
                )
            )
        ),
        traces.length > maxDisplayed && h('div', { class: 'show-more' },
            `Showing ${maxDisplayed} of ${traces.length} traces`
        )
    );
}

export function LogsPanel(props: LogsPanelProps): VNode {
    const { logs = [], level, maxDisplayed = 100 } = props;
    const filteredLogs = level ? logs.filter(l => l.level === level) : logs;
    const displayedLogs = filteredLogs.slice(0, maxDisplayed);

    return h('div', { class: 'logs-panel' },
        h('div', { class: 'logs-header' },
            h('h3', { class: 'panel-title' }, 'Logs'),
            h('div', { class: 'log-filters' },
                h('select', { class: 'log-level-filter' },
                    h('option', { value: '' }, 'All Levels'),
                    h('option', { value: 'debug' }, 'Debug'),
                    h('option', { value: 'info' }, 'Info'),
                    h('option', { value: 'warn' }, 'Warning'),
                    h('option', { value: 'error' }, 'Error')
                )
            )
        ),
        h('div', { class: 'logs-list' },
            ...displayedLogs.map(log =>
                h('div', { class: `log-entry log-${log.level}` },
                    h('span', { class: 'log-timestamp' },
                        new Date(log.timestamp).toISOString()
                    ),
                    h('span', { class: `log-level level-${log.level}` }, log.level.toUpperCase()),
                    h('span', { class: 'log-message' }, log.message)
                )
            )
        )
    );
}

export function ErrorsPanel(props: ErrorsPanelProps): VNode {
    const { errors = [] } = props;
    const sortedErrors = [...errors].sort((a, b) => b.count - a.count);

    return h('div', { class: 'errors-panel' },
        h('h3', { class: 'panel-title' }, `Errors (${errors.length})`),
        h('div', { class: 'errors-list' },
            ...sortedErrors.map(error =>
                h('div', { class: 'error-item' },
                    h('div', { class: 'error-header' },
                        h('span', { class: 'error-message' }, error.message),
                        h('span', { class: 'error-count' }, `${error.count}x`)
                    ),
                    error.stack && h('pre', { class: 'error-stack' }, error.stack),
                    error.lastSeen && h('span', { class: 'error-last-seen' },
                        `Last seen: ${new Date(error.lastSeen).toLocaleString()}`
                    )
                )
            )
        )
    );
}

export function PerformancePanel(props: PerformancePanelProps): VNode {
    const { vitals = [] } = props;

    return h('div', { class: 'performance-panel' },
        h('h3', { class: 'panel-title' }, 'Performance'),
        h('div', { class: 'vitals-list' },
            ...vitals.map(vital =>
                h('div', { class: `vital-item ${getRatingClass(vital.rating)}` },
                    h('span', { class: 'vital-name' }, vital.name),
                    h('div', { class: 'vital-bar' },
                        h('div', { class: 'vital-bar-fill', style: `width: ${Math.min(vital.value / 50, 100)}%` })
                    ),
                    h('span', { class: 'vital-value' }, formatNumber(vital.value)),
                    h('span', { class: 'vital-rating' }, vital.rating)
                )
            )
        )
    );
}

export function RealTimeMetricsPanel(props: RealTimeMetricsPanelProps): VNode {
    const { streams = [] } = props;

    return h('div', { class: 'realtime-metrics-panel' },
        h('h3', { class: 'panel-title' }, 'Real-Time Metrics'),
        h('div', { class: 'streams-container' },
            ...streams.map(stream => {
                const latestValue = stream.dataPoints[stream.dataPoints.length - 1]?.value ?? 0;
                return h('div', { class: 'stream-card' },
                    h('span', { class: 'stream-name' }, stream.name),
                    h('span', { class: 'stream-value' }, formatNumber(latestValue)),
                    h('div', { class: 'stream-sparkline', 'data-points': JSON.stringify(stream.dataPoints) },
                        // Sparkline would be rendered here via canvas/svg
                        h('svg', { class: 'sparkline-svg', viewBox: '0 0 100 30' },
                            h('polyline', {
                                class: 'sparkline-line',
                                fill: 'none',
                                stroke: stream.color || '#3b82f6',
                                'stroke-width': '2',
                                points: stream.dataPoints.slice(-20).map((p, i) =>
                                    `${i * 5},${30 - (p.value / Math.max(...stream.dataPoints.map(d => d.value)) * 25)}`
                                ).join(' ')
                            })
                        )
                    )
                );
            })
        )
    );
}

export function NetworkWaterfallPanel(props: NetworkWaterfallPanelProps): VNode {
    const { resources = [] } = props;
    const sortedResources = [...resources].sort((a, b) => a.startTime - b.startTime);
    const maxEndTime = Math.max(...resources.map(r => r.startTime + r.duration), 0);

    return h('div', { class: 'network-waterfall-panel' },
        h('h3', { class: 'panel-title' }, 'Network Waterfall'),
        h('div', { class: 'waterfall-container' },
            ...sortedResources.map(resource => {
                const startPercent = (resource.startTime / maxEndTime) * 100;
                const widthPercent = (resource.duration / maxEndTime) * 100;
                return h('div', { class: `waterfall-row resource-${resource.type}` },
                    h('div', { class: 'resource-name' }, resource.name.split('/').pop() || resource.name),
                    h('div', { class: 'waterfall-bar-container' },
                        h('div', {
                            class: 'waterfall-bar',
                            style: `left: ${startPercent}%; width: ${Math.max(widthPercent, 1)}%`
                        })
                    ),
                    h('span', { class: 'resource-duration' }, formatDuration(resource.duration)),
                    resource.size !== undefined && h('span', { class: 'resource-size' }, formatBytes(resource.size))
                );
            })
        )
    );
}

export function ComponentRenderPanel(props: ComponentRenderPanelProps): VNode {
    const { components = [], sortBy = 'totalTime' } = props;
    const sortedComponents = [...components].sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'renderCount') return b.renderCount - a.renderCount;
        return b.totalTime - a.totalTime;
    });

    return h('div', { class: 'component-render-panel' },
        h('h3', { class: 'panel-title' }, 'Component Render Times'),
        h('table', { class: 'render-table' },
            h('thead', {},
                h('tr', {},
                    h('th', {}, 'Component'),
                    h('th', {}, 'Renders'),
                    h('th', {}, 'Total Time'),
                    h('th', {}, 'Avg Time')
                )
            ),
            h('tbody', {},
                ...sortedComponents.map(comp => {
                    const avgTime = comp.avgTime ?? (comp.renderCount > 0 ? comp.totalTime / comp.renderCount : 0);
                    return h('tr', { class: 'render-row' },
                        h('td', { class: 'component-name' }, comp.name),
                        h('td', { class: 'render-count' }, String(comp.renderCount)),
                        h('td', { class: 'total-time' }, formatDuration(comp.totalTime)),
                        h('td', { class: 'avg-time' }, formatDuration(avgTime))
                    );
                })
            )
        )
    );
}

export function MemoryUsagePanel(props: MemoryUsagePanelProps): VNode {
    const { snapshots = [], threshold } = props;
    const latestSnapshot = snapshots[snapshots.length - 1];
    const usagePercent = latestSnapshot
        ? (latestSnapshot.usedJSHeapSize / latestSnapshot.totalJSHeapSize) * 100
        : 0;
    const isOverThreshold = threshold && latestSnapshot && latestSnapshot.usedJSHeapSize > threshold;

    return h('div', { class: `memory-usage-panel ${isOverThreshold ? 'threshold-exceeded' : ''}` },
        h('h3', { class: 'panel-title' }, 'Memory Usage'),
        latestSnapshot && h('div', { class: 'memory-stats' },
            h('div', { class: 'memory-gauge' },
                h('div', { class: 'gauge-fill', style: `width: ${usagePercent}%` }),
                h('span', { class: 'gauge-label' }, `${formatNumber(usagePercent, 1)}%`)
            ),
            h('div', { class: 'memory-details' },
                h('div', { class: 'memory-item' },
                    h('span', { class: 'memory-label' }, 'Used'),
                    h('span', { class: 'memory-value' }, formatBytes(latestSnapshot.usedJSHeapSize))
                ),
                h('div', { class: 'memory-item' },
                    h('span', { class: 'memory-label' }, 'Total'),
                    h('span', { class: 'memory-value' }, formatBytes(latestSnapshot.totalJSHeapSize))
                )
            )
        ),
        isOverThreshold && h('div', { class: 'memory-alert' },
            h('span', { class: 'alert-icon' }, '!'),
            `Memory usage exceeds threshold (${formatBytes(threshold!)})`
        )
    );
}

export function BundleAnalysisPanel(props: BundleAnalysisPanelProps): VNode {
    const { analysis } = props;

    if (!analysis) {
        return h('div', { class: 'bundle-analysis-panel' },
            h('h3', { class: 'panel-title' }, 'Bundle Analysis'),
            h('p', { class: 'no-data' }, 'No bundle analysis data available')
        );
    }

    const sortedChunks = [...analysis.chunks].sort((a, b) => b.size - a.size);

    return h('div', { class: 'bundle-analysis-panel' },
        h('h3', { class: 'panel-title' }, 'Bundle Analysis'),
        h('div', { class: 'bundle-summary' },
            h('span', { class: 'total-size' }, `Total: ${formatBytes(analysis.totalSize)}`),
            h('span', { class: 'chunk-count' }, `${analysis.chunks.length} chunks`)
        ),
        h('div', { class: 'chunks-list' },
            ...sortedChunks.map(chunk => {
                const sizePercent = (chunk.size / analysis.totalSize) * 100;
                return h('div', { class: 'chunk-item' },
                    h('div', { class: 'chunk-header' },
                        h('span', { class: 'chunk-name' }, chunk.name),
                        h('span', { class: 'chunk-size' }, formatBytes(chunk.size))
                    ),
                    h('div', { class: 'chunk-bar' },
                        h('div', { class: 'chunk-bar-fill', style: `width: ${sizePercent}%` })
                    ),
                    chunk.modules.length > 0 && h('div', { class: 'chunk-modules' },
                        ...chunk.modules.slice(0, 5).map(mod =>
                            h('div', { class: 'module-item' },
                                h('span', { class: 'module-name' }, mod.name),
                                h('span', { class: 'module-size' }, formatBytes(mod.size))
                            )
                        ),
                        chunk.modules.length > 5 && h('span', { class: 'more-modules' },
                            `+${chunk.modules.length - 5} more`
                        )
                    )
                );
            })
        )
    );
}

export function AlertsConfigPanel(props: AlertsConfigPanelProps): VNode {
    const { rules = [] } = props;

    return h('div', { class: 'alerts-config-panel' },
        h('h3', { class: 'panel-title' }, 'Alert Configuration'),
        h('div', { class: 'alerts-list' },
            ...rules.map(rule =>
                h('div', { class: `alert-rule ${rule.enabled === false ? 'disabled' : ''}` },
                    h('div', { class: 'rule-header' },
                        h('span', { class: 'rule-name' }, rule.name),
                        h('label', { class: 'rule-toggle' },
                            h('input', { type: 'checkbox', checked: rule.enabled !== false }),
                            h('span', { class: 'toggle-slider' })
                        )
                    ),
                    h('div', { class: 'rule-condition' },
                        `When ${rule.condition.metric} ${rule.condition.operator} ${rule.condition.threshold}`
                    ),
                    h('div', { class: 'rule-channels' },
                        ...rule.channels.map(channel =>
                            h('span', { class: `channel-badge channel-${channel.type}` }, channel.type)
                        )
                    )
                )
            )
        ),
        h('button', { class: 'add-rule-btn' }, '+ Add Alert Rule')
    );
}
