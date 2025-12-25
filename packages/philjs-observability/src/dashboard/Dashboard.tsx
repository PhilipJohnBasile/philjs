/**
 * Dashboard - Main observability dashboard component
 *
 * Unified dashboard combining metrics, traces, logs, errors,
 * and performance monitoring in a professional dark theme.
 */

import { signal, memo, effect } from 'philjs-core';
import type { MetricValue, Span, LogEntry, PerformanceMetrics } from '../index';
import { MetricsPanel } from './MetricsPanel';
import { TracesPanel, type Trace } from './TracesPanel';
import { LogsPanel } from './LogsPanel';
import { ErrorsPanel, type TrackedError } from './ErrorsPanel';
import { PerformancePanel } from './PerformancePanel';
import { StatusIndicator, StatusCard, type HealthStatus } from '../widgets/StatusIndicator';
import { AlertBadge, AlertList, type Alert } from '../widgets/AlertBadge';
import { MetricCard } from '../widgets/MetricCard';
import { Sparkline } from '../charts/Sparkline';

// ============================================================================
// Types
// ============================================================================

export type DashboardTab = 'overview' | 'metrics' | 'traces' | 'logs' | 'errors' | 'performance';

export interface DashboardProps {
  // Data sources
  metrics?: MetricValue[];
  traces?: Trace[];
  logs?: LogEntry[];
  errors?: TrackedError[];
  performance?: PerformanceMetrics;
  performanceHistory?: PerformanceMetrics[];

  // System status
  systemStatus?: HealthStatus;
  services?: Array<{
    name: string;
    status: HealthStatus;
    latency?: number;
    uptime?: number;
  }>;

  // Alerts
  alerts?: Alert[];
  onAlertDismiss?: (alertId: string) => void;
  onAlertAcknowledge?: (alertId: string) => void;

  // Refresh callbacks
  onRefreshMetrics?: () => Promise<MetricValue[]>;
  onRefreshTraces?: () => Promise<Trace[]>;
  onRefreshLogs?: () => Promise<LogEntry[]>;
  onRefreshErrors?: () => Promise<TrackedError[]>;
  onRefreshPerformance?: () => Promise<PerformanceMetrics>;

  // Configuration
  defaultTab?: DashboardTab;
  refreshInterval?: number;
  title?: string;
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  dashboard: `
    background: #0a0a12;
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #e0e0ff;
  `,
  topBar: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%);
    border-bottom: 1px solid #2a2a4a;
    position: sticky;
    top: 0;
    z-index: 100;
  `,
  titleSection: `
    display: flex;
    align-items: center;
    gap: 16px;
  `,
  logo: `
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
  `,
  title: `
    color: #ffffff;
    font-size: 20px;
    font-weight: 700;
  `,
  systemStatus: `
    display: flex;
    align-items: center;
    gap: 24px;
  `,
  alertButton: `
    position: relative;
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #a0a0c0;
    font-size: 13px;
    transition: all 0.2s ease;
  `,
  alertBadgeContainer: `
    position: absolute;
    top: -6px;
    right: -6px;
  `,
  nav: `
    display: flex;
    gap: 4px;
    padding: 0 24px 16px;
    background: #0f0f1a;
    border-bottom: 1px solid #1a1a2e;
  `,
  navButton: `
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    background: transparent;
    color: #8a8aaa;
  `,
  navButtonActive: `
    background: #2a2a4e;
    color: #ffffff;
  `,
  navButtonHover: `
    background: rgba(99, 102, 241, 0.1);
    color: #e0e0ff;
  `,
  content: `
    padding: 24px;
    max-width: 1800px;
    margin: 0 auto;
  `,
  overviewGrid: `
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  `,
  overviewCard: `
    background: linear-gradient(135deg, #1e1e3f 0%, #1a1a2e 100%);
    border: 1px solid #2a2a4a;
    border-radius: 12px;
    padding: 20px;
  `,
  overviewLabel: `
    color: #6a6a8a;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  `,
  overviewValue: `
    font-size: 32px;
    font-weight: 700;
    color: #ffffff;
  `,
  overviewChange: `
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
    font-size: 12px;
  `,
  servicesGrid: `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  `,
  splitView: `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
  `,
  fullWidth: `
    margin-bottom: 24px;
  `,
  section: `
    background: #0f0f1a;
    border-radius: 12px;
    overflow: hidden;
  `,
  sectionHeader: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #1a1a2e;
  `,
  sectionTitle: `
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
  `,
  sectionViewAll: `
    color: #6366f1;
    font-size: 12px;
    cursor: pointer;
    transition: color 0.2s ease;
  `,
  alertPanel: `
    position: fixed;
    right: 24px;
    top: 80px;
    width: 400px;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    border-radius: 12px;
  `,
  timestamp: `
    color: #6a6a8a;
    font-size: 11px;
    margin-left: auto;
  `,
  refreshIndicator: `
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #6a6a8a;
  `,
  refreshDot: `
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #22c55e;
    animation: pulse 2s ease-in-out infinite;
  `,
};

// ============================================================================
// Component
// ============================================================================

export function Dashboard(props: DashboardProps) {
  const {
    metrics = [],
    traces = [],
    logs = [],
    errors = [],
    performance,
    performanceHistory = [],
    systemStatus = 'healthy',
    services = [],
    alerts = [],
    onAlertDismiss,
    onAlertAcknowledge,
    onRefreshMetrics,
    onRefreshTraces,
    onRefreshLogs,
    onRefreshErrors,
    onRefreshPerformance,
    defaultTab = 'overview',
    refreshInterval = 30000,
    title = 'Observability Dashboard',
    className = '',
  } = props;

  const activeTab = signal<DashboardTab>(defaultTab);
  const showAlerts = signal(false);
  const lastRefresh = signal(new Date());

  // Auto-refresh
  if (refreshInterval > 0) {
    effect(() => {
      const interval = setInterval(() => {
        lastRefresh.set(new Date());
      }, refreshInterval);
      return () => clearInterval(interval);
    });
  }

  // Stats
  const stats = memo(() => {
    const activeErrors = errors.filter(e => !e.resolved).length;
    const errorRate = errors.length > 0
      ? (errors.filter(e => !e.resolved).length / errors.length) * 100
      : 0;

    const avgLatency = traces.length > 0
      ? traces.reduce((sum, t) => sum + t.duration, 0) / traces.length
      : 0;

    const requestsPerMin = metrics
      .filter(m => m.name.includes('request') && m.type === 'counter')
      .reduce((sum, m) => sum + m.value, 0) / (refreshInterval / 60000) || 0;

    return {
      activeErrors,
      errorRate,
      avgLatency,
      requestsPerMin,
      totalMetrics: metrics.length,
      totalTraces: traces.length,
      totalLogs: logs.length,
    };
  });

  const criticalAlerts = memo(() => alerts.filter(a => a.severity === 'critical').length);

  const handleTabChange = (tab: DashboardTab) => {
    activeTab.set(tab);
    showAlerts.set(false);
  };

  const renderOverview = () => (
    <>
      {/* Quick Stats */}
      <div style={styles.overviewGrid}>
        <div style={styles.overviewCard}>
          <div style={styles.overviewLabel}>Requests / min</div>
          <div style={styles.overviewValue}>{stats().requestsPerMin.toFixed(0)}</div>
          <Sparkline
            data={metrics.slice(-20).map(m => m.value)}
            width={150}
            height={30}
            color="#6366f1"
          />
        </div>
        <div style={styles.overviewCard}>
          <div style={styles.overviewLabel}>Avg Latency</div>
          <div style={styles.overviewValue}>
            {stats().avgLatency >= 1000
              ? `${(stats().avgLatency / 1000).toFixed(2)}s`
              : `${stats().avgLatency.toFixed(0)}ms`}
          </div>
          <Sparkline
            data={traces.slice(-20).map(t => t.duration)}
            width={150}
            height={30}
            color="#22c55e"
          />
        </div>
        <div style={styles.overviewCard}>
          <div style={styles.overviewLabel}>Error Rate</div>
          <div style={styles.overviewValue + (stats().errorRate > 5 ? 'color: #ef4444;' : '')}>
            {stats().errorRate.toFixed(1)}%
          </div>
          <Sparkline
            data={errors.slice(-20).map(e => e.count)}
            width={150}
            height={30}
            color="#ef4444"
          />
        </div>
        <div style={styles.overviewCard}>
          <div style={styles.overviewLabel}>Active Errors</div>
          <div style={styles.overviewValue + (stats().activeErrors > 0 ? 'color: #f59e0b;' : 'color: #22c55e;')}>
            {stats().activeErrors}
          </div>
          <div style={styles.overviewChange + 'color: #6a6a8a;'}>
            {errors.length} total tracked
          </div>
        </div>
      </div>

      {/* Services Status */}
      {services.length > 0 && (
        <div style={styles.fullWidth}>
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionTitle}>Services</span>
            </div>
            <div style={styles.servicesGrid + 'padding: 16px;'}>
              {services.map(service => (
                <StatusCard
                  title={service.name}
                  status={service.status}
                  uptime={service.uptime}
                  latency={service.latency}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Split View: Metrics & Performance */}
      <div style={styles.splitView}>
        {/* Recent Metrics */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Recent Metrics</span>
            <span
              style={styles.sectionViewAll}
              onClick={() => activeTab.set('metrics')}
            >
              View All
            </span>
          </div>
          <div style="padding: 16px; display: grid; gap: 12px;">
            {metrics.slice(0, 4).map(metric => (
              <MetricCard
                title={metric.name}
                value={metric.value.toFixed(2)}
                unit={metric.type === 'histogram' ? 'ms' : undefined}
                size="sm"
              />
            ))}
          </div>
        </div>

        {/* Performance Summary */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Performance</span>
            <span
              style={styles.sectionViewAll}
              onClick={() => activeTab.set('performance')}
            >
              View Details
            </span>
          </div>
          <div style="padding: 16px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            {performance?.lcp !== undefined && (
              <MetricCard
                title="LCP"
                value={performance.lcp >= 1000 ? (performance.lcp / 1000).toFixed(2) : performance.lcp.toFixed(0)}
                unit={performance.lcp >= 1000 ? 's' : 'ms'}
                status={performance.lcp <= 2500 ? 'good' : performance.lcp <= 4000 ? 'warning' : 'critical'}
                size="sm"
              />
            )}
            {performance?.fcp !== undefined && (
              <MetricCard
                title="FCP"
                value={performance.fcp >= 1000 ? (performance.fcp / 1000).toFixed(2) : performance.fcp.toFixed(0)}
                unit={performance.fcp >= 1000 ? 's' : 'ms'}
                status={performance.fcp <= 1800 ? 'good' : performance.fcp <= 3000 ? 'warning' : 'critical'}
                size="sm"
              />
            )}
            {performance?.cls !== undefined && (
              <MetricCard
                title="CLS"
                value={performance.cls.toFixed(3)}
                status={performance.cls <= 0.1 ? 'good' : performance.cls <= 0.25 ? 'warning' : 'critical'}
                size="sm"
              />
            )}
            {performance?.ttfb !== undefined && (
              <MetricCard
                title="TTFB"
                value={performance.ttfb.toFixed(0)}
                unit="ms"
                status={performance.ttfb <= 800 ? 'good' : performance.ttfb <= 1800 ? 'warning' : 'critical'}
                size="sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* Recent Logs & Errors */}
      <div style={styles.splitView}>
        {/* Recent Logs */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Recent Logs</span>
            <span
              style={styles.sectionViewAll}
              onClick={() => activeTab.set('logs')}
            >
              View All
            </span>
          </div>
          <div style="max-height: 300px; overflow-y: auto;">
            {logs.slice(0, 10).map((log, i) => (
              <div style={`
                padding: 10px 16px;
                border-bottom: 1px solid #1a1a2e;
                font-size: 12px;
                display: flex;
                gap: 12px;
                align-items: flex-start;
              `}>
                <span style={`
                  padding: 2px 6px;
                  border-radius: 3px;
                  font-size: 10px;
                  font-weight: 600;
                  text-transform: uppercase;
                  background: ${log.level === 'error' ? '#4a1515' : log.level === 'warn' ? '#4a3f0c' : '#1e3a5f'};
                  color: ${log.level === 'error' ? '#f87171' : log.level === 'warn' ? '#fbbf24' : '#60a5fa'};
                `}>
                  {log.level}
                </span>
                <span style="color: #e0e0ff; flex: 1; word-break: break-word;">{log.message}</span>
                <span style="color: #6a6a8a; font-size: 11px; flex-shrink: 0;">
                  {log.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Errors */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Recent Errors</span>
            <span
              style={styles.sectionViewAll}
              onClick={() => activeTab.set('errors')}
            >
              View All
            </span>
          </div>
          <div style="max-height: 300px; overflow-y: auto;">
            {errors.filter(e => !e.resolved).slice(0, 5).map(error => (
              <div style={`
                padding: 12px 16px;
                border-bottom: 1px solid #1a1a2e;
              `}>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: #ef4444; font-size: 12px; font-weight: 600;">{error.type}</span>
                  <span style="background: #4a1515; color: #f87171; font-size: 10px; padding: 2px 8px; border-radius: 10px;">
                    {error.count}x
                  </span>
                </div>
                <div style="color: #e0e0ff; font-size: 12px; margin-bottom: 4px;">
                  {error.message.slice(0, 80)}{error.message.length > 80 ? '...' : ''}
                </div>
                <div style="color: #6a6a8a; font-size: 11px;">
                  Last seen: {error.lastSeen.toLocaleTimeString()}
                </div>
              </div>
            ))}
            {errors.filter(e => !e.resolved).length === 0 && (
              <div style="padding: 40px; text-align: center; color: #22c55e; font-size: 13px;">
                No active errors
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div style={styles.dashboard} class={className}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div style={styles.titleSection}>
          <div style={styles.logo}>O</div>
          <h1 style={styles.title}>{title}</h1>
        </div>
        <div style={styles.systemStatus}>
          <div style={styles.refreshIndicator}>
            <span style={styles.refreshDot} />
            <span>Live</span>
            <span style={styles.timestamp}>
              Updated {lastRefresh().toLocaleTimeString()}
            </span>
          </div>
          <StatusIndicator status={systemStatus} label="System" size="md" />
          <div
            style={styles.alertButton}
            onClick={() => showAlerts.set(!showAlerts())}
          >
            <span>Alerts</span>
            {criticalAlerts() > 0 && (
              <div style={styles.alertBadgeContainer}>
                <AlertBadge count={criticalAlerts()} severity="critical" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={styles.nav}>
        {([
          { id: 'overview', label: 'Overview' },
          { id: 'metrics', label: 'Metrics' },
          { id: 'traces', label: 'Traces' },
          { id: 'logs', label: 'Logs' },
          { id: 'errors', label: 'Errors' },
          { id: 'performance', label: 'Performance' },
        ] as const).map(tab => (
          <button
            style={styles.navButton + (activeTab() === tab.id ? styles.navButtonActive : '')}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
            {tab.id === 'errors' && stats().activeErrors > 0 && (
              <span style="margin-left: 8px; background: #ef4444; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px;">
                {stats().activeErrors}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab() === 'overview' && renderOverview()}
        {activeTab() === 'metrics' && (
          <MetricsPanel
            metrics={metrics}
            onRefresh={onRefreshMetrics}
            refreshInterval={refreshInterval}
          />
        )}
        {activeTab() === 'traces' && (
          <TracesPanel traces={traces} />
        )}
        {activeTab() === 'logs' && (
          <LogsPanel
            logs={logs}
            onRefresh={onRefreshLogs}
            refreshInterval={refreshInterval}
          />
        )}
        {activeTab() === 'errors' && (
          <ErrorsPanel errors={errors} />
        )}
        {activeTab() === 'performance' && performance && (
          <PerformancePanel
            metrics={performance}
            history={performanceHistory}
            onRefresh={onRefreshPerformance}
          />
        )}
      </div>

      {/* Alert Panel */}
      {showAlerts() && (
        <div style={styles.alertPanel}>
          <AlertList
            alerts={alerts}
            onAcknowledge={onAlertAcknowledge}
            onDismiss={onAlertDismiss}
            onDismissAll={() => alerts.forEach(a => onAlertDismiss?.(a.id))}
          />
        </div>
      )}
    </div>
  );
}

export default Dashboard;
