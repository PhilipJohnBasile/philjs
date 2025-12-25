/**
 * Metrics Panel Component
 * Visualizes performance metrics with charts and graphs
 */

import React, { useMemo } from 'react';
import type { MetricsSnapshot, WebVitalsMetrics } from '../collector/metrics';
import { useDashboard } from './Dashboard';

// ============================================================================
// Types
// ============================================================================

export interface MetricsPanelProps {
  /** Override data from context */
  metrics?: MetricsSnapshot[];
  /** Show Web Vitals section */
  showWebVitals?: boolean;
  /** Show memory section */
  showMemory?: boolean;
  /** Show network section */
  showNetwork?: boolean;
  /** Show custom metrics section */
  showCustomMetrics?: boolean;
  /** Custom className */
  className?: string;
}

export interface WebVitalThreshold {
  good: number;
  needsImprovement: number;
}

export type WebVitalStatus = 'good' | 'needs-improvement' | 'poor';

// ============================================================================
// Constants
// ============================================================================

const WEB_VITAL_THRESHOLDS: Record<keyof WebVitalsMetrics, WebVitalThreshold> = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 },
  inp: { good: 200, needsImprovement: 500 },
};

const STATUS_COLORS: Record<WebVitalStatus, string> = {
  good: '#22c55e',
  'needs-improvement': '#f59e0b',
  poor: '#ef4444',
};

// ============================================================================
// Styles
// ============================================================================

const styles = {
  panel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  section: {
    backgroundColor: 'var(--dashboard-card-bg, #fff)',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
    color: 'var(--dashboard-text, #333)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    padding: '16px',
    backgroundColor: 'var(--dashboard-bg, #f5f5f5)',
    borderRadius: '8px',
    borderLeft: '4px solid',
  },
  metricLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--dashboard-text-secondary, #666)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '4px',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 700,
  },
  metricDescription: {
    fontSize: '12px',
    color: 'var(--dashboard-text-secondary, #666)',
    marginTop: '4px',
  },
  chart: {
    height: '200px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '4px',
    padding: '16px 0',
  },
  bar: {
    flex: 1,
    backgroundColor: 'var(--dashboard-primary, #3b82f6)',
    borderRadius: '4px 4px 0 0',
    minHeight: '4px',
    transition: 'height 0.3s ease',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '14px',
  },
  tableHeader: {
    textAlign: 'left' as const,
    padding: '12px 8px',
    borderBottom: '2px solid var(--dashboard-border, #e0e0e0)',
    fontWeight: 600,
    color: 'var(--dashboard-text-secondary, #666)',
  },
  tableCell: {
    padding: '12px 8px',
    borderBottom: '1px solid var(--dashboard-border, #e0e0e0)',
  },
  progressBar: {
    height: '8px',
    backgroundColor: 'var(--dashboard-bg, #f5f5f5)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  noData: {
    padding: '40px',
    textAlign: 'center' as const,
    color: 'var(--dashboard-text-secondary, #666)',
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

function getWebVitalStatus(
  metric: keyof WebVitalsMetrics,
  value: number | null
): WebVitalStatus {
  if (value === null) return 'poor';

  const threshold = WEB_VITAL_THRESHOLDS[metric];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

function formatWebVitalValue(metric: keyof WebVitalsMetrics, value: number | null): string {
  if (value === null) return '-';

  if (metric === 'cls') {
    return value.toFixed(3);
  }

  return `${Math.round(value)}ms`;
}

function getWebVitalDescription(metric: keyof WebVitalsMetrics): string {
  const descriptions: Record<keyof WebVitalsMetrics, string> = {
    lcp: 'Largest Contentful Paint - loading performance',
    fid: 'First Input Delay - interactivity',
    cls: 'Cumulative Layout Shift - visual stability',
    fcp: 'First Contentful Paint - initial render',
    ttfb: 'Time to First Byte - server response',
    inp: 'Interaction to Next Paint - responsiveness',
  };
  return descriptions[metric];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================================================
// Sub-components
// ============================================================================

interface WebVitalCardProps {
  metric: keyof WebVitalsMetrics;
  value: number | null;
}

function WebVitalCard({ metric, value }: WebVitalCardProps): JSX.Element {
  const status = getWebVitalStatus(metric, value);
  const formattedValue = formatWebVitalValue(metric, value);
  const description = getWebVitalDescription(metric);

  return (
    <div
      style={{
        ...styles.metricCard,
        borderLeftColor: STATUS_COLORS[status],
      }}
    >
      <div style={styles.metricLabel}>{metric.toUpperCase()}</div>
      <div style={{ ...styles.metricValue, color: STATUS_COLORS[status] }}>
        {formattedValue}
      </div>
      <div style={styles.metricDescription}>{description}</div>
    </div>
  );
}

interface WebVitalsHistoryProps {
  metrics: MetricsSnapshot[];
  metric: keyof WebVitalsMetrics;
}

function WebVitalsHistory({ metrics, metric }: WebVitalsHistoryProps): JSX.Element {
  const values = useMemo(() => {
    return metrics
      .map((m) => m.webVitals[metric])
      .filter((v): v is number => v !== null)
      .slice(-30);
  }, [metrics, metric]);

  if (values.length === 0) {
    return <div style={styles.noData}>No data available</div>;
  }

  const max = Math.max(...values);
  const threshold = WEB_VITAL_THRESHOLDS[metric];

  return (
    <div style={styles.chart}>
      {values.map((value, index) => {
        const height = max > 0 ? (value / max) * 100 : 0;
        const status = getWebVitalStatus(metric, value);

        return (
          <div
            key={index}
            style={{
              ...styles.bar,
              height: `${Math.max(height, 5)}%`,
              backgroundColor: STATUS_COLORS[status],
            }}
            title={`${formatWebVitalValue(metric, value)}`}
          />
        );
      })}
    </div>
  );
}

interface MemorySectionProps {
  metrics: MetricsSnapshot[];
}

function MemorySection({ metrics }: MemorySectionProps): JSX.Element {
  const latestMemory = metrics[metrics.length - 1]?.memory;

  if (!latestMemory) {
    return (
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Memory Usage</h3>
        <div style={styles.noData}>Memory data not available</div>
      </div>
    );
  }

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Memory Usage</h3>
      <div style={styles.grid}>
        <div style={{ ...styles.metricCard, borderLeftColor: '#3b82f6' }}>
          <div style={styles.metricLabel}>Used Heap</div>
          <div style={styles.metricValue}>
            {formatBytes(latestMemory.usedJSHeapSize)}
          </div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${latestMemory.heapUtilization}%`,
                backgroundColor:
                  latestMemory.heapUtilization > 80
                    ? '#ef4444'
                    : latestMemory.heapUtilization > 60
                      ? '#f59e0b'
                      : '#22c55e',
              }}
            />
          </div>
          <div style={styles.metricDescription}>
            {latestMemory.heapUtilization.toFixed(1)}% of limit
          </div>
        </div>

        <div style={{ ...styles.metricCard, borderLeftColor: '#8b5cf6' }}>
          <div style={styles.metricLabel}>Total Heap</div>
          <div style={styles.metricValue}>
            {formatBytes(latestMemory.totalJSHeapSize)}
          </div>
        </div>

        <div style={{ ...styles.metricCard, borderLeftColor: '#06b6d4' }}>
          <div style={styles.metricLabel}>Heap Limit</div>
          <div style={styles.metricValue}>
            {formatBytes(latestMemory.jsHeapSizeLimit)}
          </div>
        </div>
      </div>
    </div>
  );
}

interface NetworkSectionProps {
  metrics: MetricsSnapshot[];
}

function NetworkSection({ metrics }: NetworkSectionProps): JSX.Element {
  const latestMetrics = metrics[metrics.length - 1];
  const requests = latestMetrics?.networkRequests ?? [];

  const stats = useMemo(() => {
    if (requests.length === 0) {
      return { total: 0, avgDuration: 0, totalSize: 0 };
    }

    const totalDuration = requests.reduce((sum, r) => sum + r.duration, 0);
    const totalSize = requests.reduce((sum, r) => sum + r.transferSize, 0);

    return {
      total: requests.length,
      avgDuration: Math.round(totalDuration / requests.length),
      totalSize,
    };
  }, [requests]);

  const groupedByType = useMemo(() => {
    const groups: Record<string, { count: number; size: number }> = {};
    for (const req of requests) {
      const type = req.initiatorType || 'other';
      if (!groups[type]) {
        groups[type] = { count: 0, size: 0 };
      }
      groups[type].count++;
      groups[type].size += req.transferSize;
    }
    return Object.entries(groups).sort((a, b) => b[1].count - a[1].count);
  }, [requests]);

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Network Requests</h3>

      <div style={{ ...styles.grid, marginBottom: '20px' }}>
        <div style={{ ...styles.metricCard, borderLeftColor: '#3b82f6' }}>
          <div style={styles.metricLabel}>Total Requests</div>
          <div style={styles.metricValue}>{stats.total}</div>
        </div>

        <div style={{ ...styles.metricCard, borderLeftColor: '#22c55e' }}>
          <div style={styles.metricLabel}>Avg Duration</div>
          <div style={styles.metricValue}>{stats.avgDuration}ms</div>
        </div>

        <div style={{ ...styles.metricCard, borderLeftColor: '#f59e0b' }}>
          <div style={styles.metricLabel}>Total Size</div>
          <div style={styles.metricValue}>{formatBytes(stats.totalSize)}</div>
        </div>
      </div>

      {groupedByType.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Type</th>
              <th style={styles.tableHeader}>Count</th>
              <th style={styles.tableHeader}>Size</th>
            </tr>
          </thead>
          <tbody>
            {groupedByType.map(([type, data]) => (
              <tr key={type}>
                <td style={styles.tableCell}>{type}</td>
                <td style={styles.tableCell}>{data.count}</td>
                <td style={styles.tableCell}>{formatBytes(data.size)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

interface CustomMetricsSectionProps {
  metrics: MetricsSnapshot[];
}

function CustomMetricsSection({ metrics }: CustomMetricsSectionProps): JSX.Element {
  const latestMetrics = metrics[metrics.length - 1];
  const customMetrics = latestMetrics?.customMetrics ?? [];

  if (customMetrics.length === 0) {
    return (
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Custom Metrics</h3>
        <div style={styles.noData}>No custom metrics recorded</div>
      </div>
    );
  }

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Custom Metrics</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.tableHeader}>Name</th>
            <th style={styles.tableHeader}>Value</th>
            <th style={styles.tableHeader}>Unit</th>
            <th style={styles.tableHeader}>Time</th>
          </tr>
        </thead>
        <tbody>
          {customMetrics.map((metric, index) => (
            <tr key={`${metric.name}-${index}`}>
              <td style={styles.tableCell}>{metric.name}</td>
              <td style={styles.tableCell}>{metric.value.toFixed(2)}</td>
              <td style={styles.tableCell}>{metric.unit}</td>
              <td style={styles.tableCell}>
                {new Date(metric.timestamp).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MetricsPanel({
  metrics: propMetrics,
  showWebVitals = true,
  showMemory = true,
  showNetwork = true,
  showCustomMetrics = true,
  className,
}: MetricsPanelProps): JSX.Element {
  const dashboardContext = useDashboard();
  const metrics = propMetrics ?? dashboardContext?.data.metrics ?? [];
  const latestMetrics = metrics[metrics.length - 1];
  const webVitals = latestMetrics?.webVitals;

  if (metrics.length === 0) {
    return (
      <div className={className} style={styles.panel}>
        <div style={styles.section}>
          <div style={styles.noData}>
            No metrics data available. Start collecting metrics to see performance data.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={styles.panel}>
      {showWebVitals && webVitals && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Core Web Vitals</h3>
          <div style={styles.grid}>
            {(Object.keys(WEB_VITAL_THRESHOLDS) as Array<keyof WebVitalsMetrics>).map(
              (metric) => (
                <WebVitalCard
                  key={metric}
                  metric={metric}
                  value={webVitals[metric]}
                />
              )
            )}
          </div>

          {metrics.length > 1 && (
            <div style={{ marginTop: '24px' }}>
              <div style={styles.metricLabel}>LCP History (Last 30 samples)</div>
              <WebVitalsHistory metrics={metrics} metric="lcp" />
            </div>
          )}
        </div>
      )}

      {showMemory && <MemorySection metrics={metrics} />}

      {showNetwork && <NetworkSection metrics={metrics} />}

      {showCustomMetrics && <CustomMetricsSection metrics={metrics} />}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { WebVitalCard, WebVitalsHistory, MemorySection, NetworkSection, CustomMetricsSection };
export type { WebVitalStatus };
