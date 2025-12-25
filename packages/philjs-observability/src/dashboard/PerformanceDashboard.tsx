/**
 * PerformanceDashboard - Complete Performance Monitoring Dashboard
 *
 * A comprehensive dashboard that integrates all performance monitoring
 * components including real-time metrics, Web Vitals, network waterfall,
 * component render timing, memory usage, error tracking, and alerting.
 */

import { signal, memo, effect } from 'philjs-core';
import { TimeSeriesChart, type TimeSeries } from '../charts/TimeSeriesChart';
import { Sparkline } from '../charts/Sparkline';
import { MetricCard, type MetricStatus, type TrendDirection } from '../widgets/MetricCard';
import { StatusIndicator } from '../widgets/StatusIndicator';
import { WebVitalsDashboard, type WebVitalsData } from './WebVitalsDashboard';
import { NetworkWaterfallPanel, type ResourceTiming } from './NetworkWaterfallPanel';
import { ComponentRenderPanel, type ComponentRenderData, type RenderProfile } from './ComponentRenderPanel';
import { MemoryUsagePanel, type MemorySnapshot } from './MemoryUsagePanel';
import { ErrorsPanel, type TrackedError, type ErrorGroup } from './ErrorsPanel';
import { AlertsConfigPanel, type AlertRule, type AlertHistory } from './AlertsConfigPanel';
import type { Alert } from '../widgets/AlertBadge';

// ============================================================================
// Types
// ============================================================================

export interface PerformanceMetrics {
  // Page Load Metrics
  pageLoadTime: number;
  domContentLoaded: number;
  timeToInteractive: number;

  // Resource Metrics
  resourceCount: number;
  totalTransferSize: number;
  cacheHitRate: number;

  // Runtime Metrics
  fps: number;
  jsHeapUsage: number;
  longTasks: number;

  // Network Metrics
  requestCount: number;
  failedRequests: number;
  averageResponseTime: number;
}

export interface DashboardPanel {
  id: string;
  title: string;
  type: 'overview' | 'webvitals' | 'network' | 'components' | 'memory' | 'errors' | 'alerts';
  visible: boolean;
}

export interface PerformanceDashboardProps {
  // Data Sources
  webVitals?: WebVitalsData;
  networkRequests?: ResourceTiming[];
  componentRenderData?: ComponentRenderData[];
  renderProfiles?: RenderProfile[];
  memorySnapshots?: MemorySnapshot[];
  errors?: TrackedError[];
  errorGroups?: ErrorGroup[];
  alertRules?: AlertRule[];
  alertHistory?: AlertHistory[];
  activeAlerts?: Alert[];
  metrics?: PerformanceMetrics;

  // Time Series Data
  metricsHistory?: TimeSeries[];

  // Refresh Callbacks
  onRefreshWebVitals?: () => Promise<WebVitalsData>;
  onRefreshNetwork?: () => Promise<ResourceTiming[]>;
  onRefreshComponents?: () => Promise<ComponentRenderData[]>;
  onRefreshMemory?: () => Promise<MemorySnapshot>;
  onRefreshErrors?: () => Promise<TrackedError[]>;

  // Alert Callbacks
  onAlertRuleCreate?: (rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>) => void;
  onAlertRuleUpdate?: (id: string, updates: Partial<AlertRule>) => void;
  onAlertRuleDelete?: (id: string) => void;
  onAlertRuleToggle?: (id: string, enabled: boolean) => void;
  onAlertAcknowledge?: (alertId: string) => void;
  onAlertResolve?: (alertId: string) => void;

  // Memory Actions
  onGarbageCollect?: () => void;
  onTakeHeapSnapshot?: () => void;

  // Error Actions
  onErrorResolve?: (errorId: string) => void;
  onErrorIgnore?: (errorId: string) => void;

  // Configuration
  refreshInterval?: number;
  theme?: 'dark' | 'light';
  defaultPanel?: DashboardPanel['type'];
  visiblePanels?: DashboardPanel['type'][];
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  dashboard: `
    background: #0a0a15;
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,
  header: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 32px;
    background: #0f0f1a;
    border-bottom: 1px solid #1a1a2e;
    position: sticky;
    top: 0;
    z-index: 100;
  `,
  logo: `
    display: flex;
    align-items: center;
    gap: 12px;
  `,
  logoIcon: `
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 18px;
  `,
  logoText: `
    color: #ffffff;
    font-size: 20px;
    font-weight: 700;
  `,
  logoSubtext: `
    color: #6a6a8a;
    font-size: 12px;
  `,
  headerControls: `
    display: flex;
    gap: 16px;
    align-items: center;
  `,
  statusBadge: `
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #1a1a2e;
    border-radius: 20px;
    font-size: 13px;
  `,
  statusDot: `
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  `,
  button: `
    background: #2a2a4e;
    border: 1px solid #3a3a6e;
    border-radius: 8px;
    color: #e0e0ff;
    padding: 10px 20px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  buttonPrimary: `
    background: #6366f1;
    border-color: #6366f1;
  `,
  select: `
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    color: #e0e0ff;
    padding: 10px 16px;
    font-size: 13px;
    cursor: pointer;
    outline: none;
  `,
  nav: `
    display: flex;
    gap: 4px;
    padding: 8px;
    background: #1a1a2e;
    border-radius: 12px;
  `,
  navItem: `
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #8a8aaa;
    background: transparent;
    border: none;
    position: relative;
  `,
  navItemActive: `
    background: #2a2a4e;
    color: #e0e0ff;
  `,
  navItemBadge: `
    position: absolute;
    top: 4px;
    right: 4px;
    background: #ef4444;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 16px;
    text-align: center;
  `,
  main: `
    padding: 24px 32px;
  `,
  overviewGrid: `
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 32px;
  `,
  panelGrid: `
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    margin-bottom: 32px;
  `,
  fullWidthPanel: `
    grid-column: span 2;
  `,
  singlePanel: `
    min-height: 600px;
  `,
  sectionTitle: `
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
  `,
  sectionBadge: `
    background: #2a2a4e;
    color: #a0a0c0;
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 12px;
  `,
  chartContainer: `
    background: #0f0f1a;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid #1a1a2e;
  `,
  chartHeader: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  `,
  chartTitle: `
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
  `,
  chartControls: `
    display: flex;
    gap: 8px;
  `,
  timeRangeButton: `
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #8a8aaa;
    background: transparent;
    border: 1px solid transparent;
  `,
  timeRangeButtonActive: `
    background: #2a2a4e;
    color: #e0e0ff;
    border-color: #3a3a6e;
  `,
  quickStats: `
    display: flex;
    gap: 32px;
    padding: 20px 0;
    border-bottom: 1px solid #1a1a2e;
    margin-bottom: 24px;
  `,
  quickStat: `
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  quickStatValue: `
    font-size: 28px;
    font-weight: 700;
    color: #ffffff;
  `,
  quickStatLabel: `
    font-size: 12px;
    color: #6a6a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  quickStatChange: `
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
  `,
  healthScore: `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: linear-gradient(135deg, #1e1e3f 0%, #1a1a2e 100%);
    border-radius: 16px;
    border: 1px solid #2a2a4a;
  `,
  healthScoreValue: `
    font-size: 48px;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 8px;
  `,
  healthScoreLabel: `
    font-size: 14px;
    color: #8a8aaa;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  healthScoreBar: `
    width: 100%;
    height: 6px;
    background: #2a2a4a;
    border-radius: 3px;
    margin-top: 16px;
    overflow: hidden;
  `,
  healthScoreFill: `
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
  `,
  alertBanner: `
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    background: #ef444422;
    border: 1px solid #ef444444;
    border-radius: 12px;
    margin-bottom: 24px;
  `,
  alertBannerIcon: `
    width: 40px;
    height: 40px;
    background: #ef4444;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    font-weight: 700;
    flex-shrink: 0;
  `,
  alertBannerContent: `
    flex: 1;
  `,
  alertBannerTitle: `
    color: #f87171;
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
  `,
  alertBannerMessage: `
    color: #fca5a5;
    font-size: 13px;
  `,
  alertBannerActions: `
    display: flex;
    gap: 12px;
  `,
  emptyState: `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 40px;
    color: #6a6a8a;
    text-align: center;
  `,
  emptyStateIcon: `
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  `,
  emptyStateTitle: `
    font-size: 18px;
    color: #8a8aaa;
    margin-bottom: 8px;
  `,
  emptyStateText: `
    font-size: 14px;
    max-width: 400px;
    line-height: 1.6;
  `,
};

// ============================================================================
// Helper Functions
// ============================================================================

function calculateHealthScore(
  webVitals?: WebVitalsData,
  metrics?: PerformanceMetrics,
  errorRate?: number
): number {
  let score = 100;

  if (webVitals) {
    // LCP scoring (should be < 2500ms for good)
    if (webVitals.lcp > 4000) score -= 20;
    else if (webVitals.lcp > 2500) score -= 10;

    // FID scoring (should be < 100ms for good)
    if (webVitals.fid > 300) score -= 20;
    else if (webVitals.fid > 100) score -= 10;

    // CLS scoring (should be < 0.1 for good)
    if (webVitals.cls > 0.25) score -= 20;
    else if (webVitals.cls > 0.1) score -= 10;

    // TTFB scoring (should be < 800ms for good)
    if (webVitals.ttfb > 1800) score -= 10;
    else if (webVitals.ttfb > 800) score -= 5;
  }

  if (metrics) {
    // FPS scoring
    if (metrics.fps < 30) score -= 15;
    else if (metrics.fps < 50) score -= 5;

    // Memory usage
    if (metrics.jsHeapUsage > 90) score -= 10;
    else if (metrics.jsHeapUsage > 70) score -= 5;

    // Long tasks
    if (metrics.longTasks > 10) score -= 10;
    else if (metrics.longTasks > 5) score -= 5;
  }

  if (errorRate) {
    if (errorRate > 5) score -= 15;
    else if (errorRate > 1) score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

function getHealthColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 70) return '#84cc16';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function getHealthLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Improvement';
  return 'Poor';
}

function formatDuration(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function getMetricStatus(value: number, good: number, warning: number): MetricStatus {
  if (value <= good) return 'good';
  if (value <= warning) return 'warning';
  return 'critical';
}

function getTrend(current: number, previous: number): { direction: TrendDirection; value: string; isPositive: boolean } {
  if (!previous || previous === 0) {
    return { direction: 'neutral', value: 'N/A', isPositive: true };
  }

  const change = ((current - previous) / previous) * 100;
  const direction: TrendDirection = change > 1 ? 'up' : change < -1 ? 'down' : 'neutral';
  const isPositive = change <= 0; // For performance metrics, lower is better

  return {
    direction,
    value: `${Math.abs(change).toFixed(1)}%`,
    isPositive,
  };
}

// ============================================================================
// Component
// ============================================================================

export function PerformanceDashboard(props: PerformanceDashboardProps) {
  const {
    webVitals,
    networkRequests = [],
    componentRenderData = [],
    renderProfiles = [],
    memorySnapshots = [],
    errors = [],
    errorGroups = [],
    alertRules = [],
    alertHistory = [],
    activeAlerts = [],
    metrics,
    metricsHistory = [],
    onRefreshWebVitals,
    onRefreshNetwork,
    onRefreshComponents,
    onRefreshMemory,
    onRefreshErrors,
    onAlertRuleCreate,
    onAlertRuleUpdate,
    onAlertRuleDelete,
    onAlertRuleToggle,
    onAlertAcknowledge,
    onAlertResolve,
    onGarbageCollect,
    onTakeHeapSnapshot,
    onErrorResolve,
    onErrorIgnore,
    refreshInterval = 5000,
    defaultPanel = 'overview',
    visiblePanels = ['overview', 'webvitals', 'network', 'components', 'memory', 'errors', 'alerts'],
    className = '',
  } = props;

  const activePanel = signal<DashboardPanel['type']>(defaultPanel);
  const timeRange = signal<'1m' | '5m' | '15m' | '1h' | '24h'>('5m');
  const isLive = signal(true);
  const lastUpdated = signal(Date.now());

  // Calculate health score
  const healthScore = memo(() => {
    const errorRate = errors.length > 0 ? (errors.filter(e => Date.now() - e.lastSeen.getTime() < 60000).length / 60) * 100 : 0;
    return calculateHealthScore(webVitals, metrics, errorRate);
  });

  // Critical alerts count
  const criticalAlertCount = memo(() =>
    activeAlerts.filter(a => a.severity === 'critical').length
  );

  // Panel navigation items
  const navItems = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'webvitals' as const, label: 'Web Vitals' },
    { id: 'network' as const, label: 'Network' },
    { id: 'components' as const, label: 'Components' },
    { id: 'memory' as const, label: 'Memory' },
    { id: 'errors' as const, label: 'Errors', badge: errors.filter(e => !e.resolved).length },
    { id: 'alerts' as const, label: 'Alerts', badge: activeAlerts.length },
  ].filter(item => visiblePanels.includes(item.id));

  const renderOverview = () => (
    <>
      {/* Critical Alert Banner */}
      {criticalAlertCount() > 0 && (
        <div style={styles.alertBanner}>
          <div style={styles.alertBannerIcon}>!</div>
          <div style={styles.alertBannerContent}>
            <div style={styles.alertBannerTitle}>
              {criticalAlertCount()} Critical Alert{criticalAlertCount() > 1 ? 's' : ''}
            </div>
            <div style={styles.alertBannerMessage}>
              {activeAlerts.find(a => a.severity === 'critical')?.message || 'Action required'}
            </div>
          </div>
          <div style={styles.alertBannerActions}>
            <button style={styles.button} onClick={() => activePanel.set('alerts')}>
              View Alerts
            </button>
          </div>
        </div>
      )}

      {/* Health Score and Quick Stats */}
      <div style={styles.overviewGrid}>
        {/* Health Score Card */}
        <div style={styles.healthScore}>
          <div style={styles.healthScoreValue + `color: ${getHealthColor(healthScore())};`}>
            {healthScore()}
          </div>
          <div style={styles.healthScoreLabel}>Health Score</div>
          <div style="font-size: 12px; color: #8a8aaa; margin-top: 4px;">
            {getHealthLabel(healthScore())}
          </div>
          <div style={styles.healthScoreBar}>
            <div
              style={styles.healthScoreFill + `width: ${healthScore()}%; background: ${getHealthColor(healthScore())};`}
            />
          </div>
        </div>

        {/* LCP Card */}
        {webVitals && (
          <MetricCard
            title="LCP"
            value={formatDuration(webVitals.lcp)}
            description="Largest Contentful Paint"
            status={getMetricStatus(webVitals.lcp, 2500, 4000)}
            sparklineData={webVitals.lcpHistory}
            trend={getTrend(webVitals.lcp, webVitals.lcpHistory?.[webVitals.lcpHistory.length - 2] || 0)}
            onClick={() => activePanel.set('webvitals')}
          />
        )}

        {/* FPS Card */}
        {metrics && (
          <MetricCard
            title="FPS"
            value={Math.round(metrics.fps)}
            description="Frames per second"
            status={metrics.fps >= 55 ? 'good' : metrics.fps >= 30 ? 'warning' : 'critical'}
            trend={{
              direction: metrics.fps >= 55 ? 'up' : 'down',
              value: metrics.fps >= 55 ? 'Smooth' : 'Low',
              isPositive: metrics.fps >= 30,
            }}
          />
        )}

        {/* Error Rate Card */}
        <MetricCard
          title="Errors"
          value={errors.filter(e => !e.resolved).length}
          description="Unresolved errors"
          status={errors.filter(e => !e.resolved).length === 0 ? 'good' : errors.filter(e => !e.resolved).length < 5 ? 'warning' : 'critical'}
          onClick={() => activePanel.set('errors')}
        />
      </div>

      {/* Charts Row */}
      <div style={styles.panelGrid}>
        {/* Performance Over Time */}
        <div style={styles.chartContainer}>
          <div style={styles.chartHeader}>
            <span style={styles.chartTitle}>Performance Over Time</span>
            <div style={styles.chartControls}>
              {(['1m', '5m', '15m', '1h'] as const).map(range => (
                <button
                  style={styles.timeRangeButton + (timeRange() === range ? styles.timeRangeButtonActive : '')}
                  onClick={() => timeRange.set(range)}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          {metricsHistory.length > 0 ? (
            <TimeSeriesChart
              series={metricsHistory}
              width={500}
              height={250}
              showLegend={true}
            />
          ) : (
            <div style="display: flex; align-items: center; justify-content: center; height: 250px; color: #6a6a8a;">
              No historical data available
            </div>
          )}
        </div>

        {/* Web Vitals Mini Dashboard */}
        {webVitals && (
          <div style={styles.chartContainer}>
            <div style={styles.chartHeader}>
              <span style={styles.chartTitle}>Core Web Vitals</span>
              <button style={styles.button} onClick={() => activePanel.set('webvitals')}>
                View Details
              </button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
              <div style="text-align: center; padding: 16px;">
                <div style={`font-size: 24px; font-weight: 700; color: ${getMetricStatus(webVitals.lcp, 2500, 4000) === 'good' ? '#22c55e' : getMetricStatus(webVitals.lcp, 2500, 4000) === 'warning' ? '#f59e0b' : '#ef4444'};`}>
                  {formatDuration(webVitals.lcp)}
                </div>
                <div style="font-size: 12px; color: #6a6a8a; margin-top: 4px;">LCP</div>
              </div>
              <div style="text-align: center; padding: 16px;">
                <div style={`font-size: 24px; font-weight: 700; color: ${getMetricStatus(webVitals.fid, 100, 300) === 'good' ? '#22c55e' : getMetricStatus(webVitals.fid, 100, 300) === 'warning' ? '#f59e0b' : '#ef4444'};`}>
                  {formatDuration(webVitals.fid)}
                </div>
                <div style="font-size: 12px; color: #6a6a8a; margin-top: 4px;">FID</div>
              </div>
              <div style="text-align: center; padding: 16px;">
                <div style={`font-size: 24px; font-weight: 700; color: ${getMetricStatus(webVitals.cls * 1000, 100, 250) === 'good' ? '#22c55e' : getMetricStatus(webVitals.cls * 1000, 100, 250) === 'warning' ? '#f59e0b' : '#ef4444'};`}>
                  {webVitals.cls.toFixed(3)}
                </div>
                <div style="font-size: 12px; color: #6a6a8a; margin-top: 4px;">CLS</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Panels */}
      <div style={styles.panelGrid}>
        {/* Recent Errors */}
        <div style={styles.chartContainer}>
          <div style={styles.chartHeader}>
            <span style={styles.chartTitle}>Recent Errors</span>
            <button style={styles.button} onClick={() => activePanel.set('errors')}>
              View All
            </button>
          </div>
          {errors.length > 0 ? (
            <div style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;">
              {errors.slice(0, 5).map(error => (
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #1a1a2e; border-radius: 6px;">
                  <div style={`width: 8px; height: 8px; border-radius: 50%; background: ${error.count > 10 ? '#ef4444' : error.count > 5 ? '#f59e0b' : '#6a6a8a'};`} />
                  <div style="flex: 1; min-width: 0;">
                    <div style="color: #e0e0ff; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      {error.message}
                    </div>
                    <div style="color: #6a6a8a; font-size: 11px;">
                      {error.lastSeen.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #22c55e;">
              No errors detected
            </div>
          )}
        </div>

        {/* Active Alerts */}
        <div style={styles.chartContainer}>
          <div style={styles.chartHeader}>
            <span style={styles.chartTitle}>Active Alerts</span>
            <button style={styles.button} onClick={() => activePanel.set('alerts')}>
              Configure
            </button>
          </div>
          {activeAlerts.length > 0 ? (
            <div style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;">
              {activeAlerts.slice(0, 5).map(alert => (
                <div style={`display: flex; align-items: center; gap: 12px; padding: 12px; background: ${alert.severity === 'critical' ? '#ef444422' : alert.severity === 'warning' ? '#f59e0b22' : '#3b82f622'}; border-radius: 6px; border-left: 3px solid ${alert.severity === 'critical' ? '#ef4444' : alert.severity === 'warning' ? '#f59e0b' : '#3b82f6'};`}>
                  <div style="flex: 1; min-width: 0;">
                    <div style={`color: ${alert.severity === 'critical' ? '#f87171' : alert.severity === 'warning' ? '#fbbf24' : '#60a5fa'}; font-size: 13px; font-weight: 500;`}>
                      {alert.title}
                    </div>
                    <div style="color: #8a8aaa; font-size: 11px;">
                      {alert.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #22c55e;">
              All systems operational
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderPanel = () => {
    switch (activePanel()) {
      case 'overview':
        return renderOverview();

      case 'webvitals':
        return webVitals ? (
          <div style={styles.singlePanel}>
            <WebVitalsDashboard
              data={webVitals}
              onRefresh={onRefreshWebVitals}
              refreshInterval={refreshInterval}
            />
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateTitle}>No Web Vitals Data</div>
            <div style={styles.emptyStateText}>
              Web Vitals data will appear here once collected from your application.
            </div>
          </div>
        );

      case 'network':
        return (
          <div style={styles.singlePanel}>
            <NetworkWaterfallPanel
              resources={networkRequests}
              onRefresh={onRefreshNetwork}
              refreshInterval={refreshInterval}
            />
          </div>
        );

      case 'components':
        return (
          <div style={styles.singlePanel}>
            <ComponentRenderPanel
              components={componentRenderData}
              profiles={renderProfiles}
              onRefresh={onRefreshComponents}
              refreshInterval={refreshInterval}
            />
          </div>
        );

      case 'memory':
        return (
          <div style={styles.singlePanel}>
            <MemoryUsagePanel
              snapshots={memorySnapshots}
              onRefresh={onRefreshMemory}
              onGarbageCollect={onGarbageCollect}
              onTakeHeapSnapshot={onTakeHeapSnapshot}
              refreshInterval={1000}
            />
          </div>
        );

      case 'errors':
        return (
          <div style={styles.singlePanel}>
            <ErrorsPanel
              errors={errors}
              onResolve={onErrorResolve}
              onIgnore={onErrorIgnore}
            />
          </div>
        );

      case 'alerts':
        return (
          <div style={styles.singlePanel}>
            <AlertsConfigPanel
              rules={alertRules}
              history={alertHistory}
              activeAlerts={activeAlerts}
              onRuleCreate={onAlertRuleCreate}
              onRuleUpdate={onAlertRuleUpdate}
              onRuleDelete={onAlertRuleDelete}
              onRuleToggle={onAlertRuleToggle}
              onAlertAcknowledge={onAlertAcknowledge}
              onAlertResolve={onAlertResolve}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.dashboard} class={className}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>P</div>
          <div>
            <div style={styles.logoText}>Performance Dashboard</div>
            <div style={styles.logoSubtext}>PhilJS Observability</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.map(item => (
            <button
              style={styles.navItem + (activePanel() === item.id ? styles.navItemActive : '')}
              onClick={() => activePanel.set(item.id)}
            >
              {item.label}
              {item.badge && item.badge > 0 && (
                <span style={styles.navItemBadge}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={styles.headerControls}>
          <div style={styles.statusBadge}>
            <span
              style={styles.statusDot + `background: ${isLive() ? '#22c55e' : '#6a6a8a'};`}
            />
            <span style={`color: ${isLive() ? '#22c55e' : '#6a6a8a'};`}>
              {isLive() ? 'Live' : 'Paused'}
            </span>
          </div>
          <button
            style={styles.button}
            onClick={() => isLive.set(!isLive())}
          >
            {isLive() ? 'Pause' : 'Resume'}
          </button>
          <select
            style={styles.select}
            value={timeRange()}
            onChange={(e: Event) => timeRange.set((e.target as HTMLSelectElement).value as typeof timeRange extends { (): infer T } ? T : never)}
          >
            <option value="1m">Last 1 minute</option>
            <option value="5m">Last 5 minutes</option>
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last 1 hour</option>
            <option value="24h">Last 24 hours</option>
          </select>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {renderPanel()}
      </main>
    </div>
  );
}

export default PerformanceDashboard;
