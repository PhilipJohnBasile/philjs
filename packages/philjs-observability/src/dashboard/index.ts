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

// Main Dashboard
export { Dashboard, type DashboardProps, type DashboardTab } from './Dashboard';

// Performance Dashboard (Comprehensive)
export {
  PerformanceDashboard,
  type PerformanceDashboardProps,
  type PerformanceMetrics,
  type DashboardPanel,
} from './PerformanceDashboard';

// Web Vitals Dashboard
export {
  WebVitalsDashboard,
  type WebVitalsDashboardProps,
  type WebVitalsData,
  type WebVitalThresholds,
} from './WebVitalsDashboard';

// Core Panels
export { MetricsPanel, type MetricsPanelProps, type MetricGroup } from './MetricsPanel';
export { TracesPanel, type TracesPanelProps, type Trace } from './TracesPanel';
export { LogsPanel, type LogsPanelProps } from './LogsPanel';
export { ErrorsPanel, type ErrorsPanelProps, type TrackedError, type ErrorGroup } from './ErrorsPanel';
export { PerformancePanel, type PerformancePanelProps, type WebVital } from './PerformancePanel';

// Real-Time Metrics
export {
  RealTimeMetricsPanel,
  type RealTimeMetricsPanelProps,
  type MetricStream,
} from './RealTimeMetricsPanel';

// Network Analysis
export {
  NetworkWaterfallPanel,
  type NetworkWaterfallPanelProps,
  type ResourceTiming,
  type ResourceGroup,
} from './NetworkWaterfallPanel';

// Component Performance
export {
  ComponentRenderPanel,
  type ComponentRenderPanelProps,
  type ComponentRenderData,
  type RenderProfile,
} from './ComponentRenderPanel';

// Memory Monitoring
export {
  MemoryUsagePanel,
  type MemoryUsagePanelProps,
  type MemorySnapshot,
  type MemoryTrend,
  type MemoryAlert,
} from './MemoryUsagePanel';

// Bundle Analysis
export {
  BundleAnalysisPanel,
  type BundleAnalysisPanelProps,
  type BundleModule,
  type BundleChunk,
  type BundleAnalysis,
} from './BundleAnalysisPanel';

// Alerts Configuration
export {
  AlertsConfigPanel,
  type AlertsConfigPanelProps,
  type AlertRule,
  type AlertChannel,
  type AlertCondition,
  type AlertMetricType,
  type AlertHistory,
} from './AlertsConfigPanel';
