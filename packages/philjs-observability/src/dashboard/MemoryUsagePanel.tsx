/**
 * MemoryUsagePanel - Memory usage tracking and visualization
 *
 * Displays JavaScript heap memory usage over time, helping identify
 * memory leaks and optimize memory consumption.
 */

import { signal, memo, effect } from 'philjs-core';
import { TimeSeriesChart, type TimeSeries } from '../charts/TimeSeriesChart';
import { Sparkline } from '../charts/Sparkline';

// ============================================================================
// Types
// ============================================================================

export interface MemorySnapshot {
  id: string;
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  // Additional metrics if available
  domNodes?: number;
  eventListeners?: number;
  detachedNodes?: number;
}

export interface MemoryTrend {
  period: '1m' | '5m' | '15m' | '1h';
  startValue: number;
  endValue: number;
  change: number;
  changePercent: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface MemoryAlert {
  id: string;
  type: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export interface MemoryUsagePanelProps {
  snapshots: MemorySnapshot[];
  refreshInterval?: number;
  onRefresh?: () => Promise<MemorySnapshot>;
  onGarbageCollect?: () => void;
  onTakeHeapSnapshot?: () => void;
  thresholds?: {
    warning: number;  // Percentage of heap limit (e.g., 70)
    critical: number; // Percentage of heap limit (e.g., 90)
  };
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  panel: `
    background: #0f0f1a;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    flex-direction: column;
    height: 100%;
  `,
  header: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #1a1a2e;
  `,
  title: `
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
  `,
  controls: `
    display: flex;
    gap: 12px;
    align-items: center;
  `,
  select: `
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 6px;
    color: #e0e0ff;
    padding: 8px 12px;
    font-size: 13px;
    cursor: pointer;
    outline: none;
  `,
  button: `
    background: #2a2a4e;
    border: 1px solid #3a3a6e;
    border-radius: 6px;
    color: #e0e0ff;
    padding: 8px 16px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  `,
  buttonPrimary: `
    background: #6366f1;
    border-color: #6366f1;
  `,
  buttonDanger: `
    background: #ef4444;
    border-color: #ef4444;
  `,
  statsGrid: `
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 24px;
    border-bottom: 1px solid #1a1a2e;
  `,
  statCard: `
    background: linear-gradient(135deg, #1e1e3f 0%, #1a1a2e 100%);
    border: 1px solid #2a2a4a;
    border-radius: 12px;
    padding: 20px;
  `,
  statLabel: `
    color: #6a6a8a;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  `,
  statValue: `
    font-size: 28px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 4px;
  `,
  statUnit: `
    color: #8a8aaa;
    font-size: 14px;
    font-weight: 400;
    margin-left: 4px;
  `,
  statChange: `
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    margin-top: 8px;
  `,
  statChangePositive: `
    color: #ef4444;
  `,
  statChangeNegative: `
    color: #22c55e;
  `,
  statChangeNeutral: `
    color: #6a6a8a;
  `,
  content: `
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  `,
  chartSection: `
    margin-bottom: 24px;
  `,
  chartHeader: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  `,
  chartTitle: `
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
  `,
  chartContainer: `
    background: #1a1a2e;
    border-radius: 12px;
    padding: 20px;
  `,
  usageBar: `
    margin-top: 24px;
  `,
  usageBarLabel: `
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 12px;
    color: #8a8aaa;
  `,
  usageBarTrack: `
    height: 24px;
    background: #2a2a4a;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
  `,
  usageBarFill: `
    height: 100%;
    border-radius: 12px;
    transition: width 0.3s ease, background 0.3s ease;
    position: relative;
  `,
  usageBarMarker: `
    position: absolute;
    top: 0;
    height: 100%;
    width: 2px;
    background: rgba(255, 255, 255, 0.3);
  `,
  usageBarMarkerLabel: `
    position: absolute;
    top: -18px;
    transform: translateX(-50%);
    font-size: 10px;
    color: #6a6a8a;
  `,
  metricsGrid: `
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 24px;
  `,
  metricCard: `
    background: #1a1a2e;
    border-radius: 8px;
    padding: 16px;
  `,
  metricLabel: `
    color: #6a6a8a;
    font-size: 11px;
    text-transform: uppercase;
    margin-bottom: 8px;
  `,
  metricValue: `
    color: #e0e0ff;
    font-size: 20px;
    font-weight: 600;
  `,
  alertsSection: `
    margin-top: 24px;
  `,
  alertsTitle: `
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
  `,
  alert: `
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 8px;
  `,
  alertWarning: `
    background: #f59e0b22;
    border: 1px solid #f59e0b44;
  `,
  alertCritical: `
    background: #ef444422;
    border: 1px solid #ef444444;
  `,
  alertIcon: `
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  `,
  alertContent: `
    flex: 1;
  `,
  alertMessage: `
    font-size: 13px;
    margin-bottom: 4px;
  `,
  alertMeta: `
    font-size: 11px;
    color: #6a6a8a;
  `,
  trendIndicator: `
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
  `,
  snapshotsSection: `
    margin-top: 24px;
  `,
  snapshotList: `
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 300px;
    overflow-y: auto;
  `,
  snapshotItem: `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #1a1a2e;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s ease;
  `,
  snapshotItemHover: `
    background: rgba(99, 102, 241, 0.1);
  `,
  snapshotTime: `
    color: #8a8aaa;
    font-size: 12px;
  `,
  snapshotValue: `
    color: #e0e0ff;
    font-size: 13px;
    font-weight: 500;
  `,
  emptyState: `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #6a6a8a;
    text-align: center;
  `,
  liveIndicator: `
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #22c55e;
  `,
  liveIndicatorDot: `
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #22c55e;
    animation: pulse 1.5s ease-in-out infinite;
  `,
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function formatBytesShort(bytes: number): { value: string; unit: string } {
  if (bytes === 0) return { value: '0', unit: 'B' };
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return {
    value: (bytes / Math.pow(1024, i)).toFixed(1),
    unit: units[i],
  };
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function calculateTrend(
  snapshots: MemorySnapshot[],
  period: MemoryTrend['period']
): MemoryTrend {
  const periodMs = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
  }[period];

  const now = Date.now();
  const periodStart = now - periodMs;
  const periodSnapshots = snapshots.filter(s => s.timestamp >= periodStart);

  if (periodSnapshots.length < 2) {
    return {
      period,
      startValue: 0,
      endValue: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
    };
  }

  const startValue = periodSnapshots[0].usedJSHeapSize;
  const endValue = periodSnapshots[periodSnapshots.length - 1].usedJSHeapSize;
  const change = endValue - startValue;
  const changePercent = startValue > 0 ? (change / startValue) * 100 : 0;

  let trend: MemoryTrend['trend'] = 'stable';
  if (changePercent > 5) trend = 'increasing';
  else if (changePercent < -5) trend = 'decreasing';

  return {
    period,
    startValue,
    endValue,
    change,
    changePercent,
    trend,
  };
}

function getUsageColor(percentage: number, thresholds: { warning: number; critical: number }): string {
  if (percentage >= thresholds.critical) return '#ef4444';
  if (percentage >= thresholds.warning) return '#f59e0b';
  if (percentage >= 50) return '#6366f1';
  return '#22c55e';
}

function detectMemoryIssues(
  snapshots: MemorySnapshot[],
  thresholds: { warning: number; critical: number }
): MemoryAlert[] {
  const alerts: MemoryAlert[] = [];

  if (snapshots.length === 0) return alerts;

  const latest = snapshots[snapshots.length - 1];
  const usagePercent = (latest.usedJSHeapSize / latest.jsHeapSizeLimit) * 100;

  // High memory usage
  if (usagePercent >= thresholds.critical) {
    alerts.push({
      id: 'critical-memory',
      type: 'critical',
      message: `Memory usage is critically high at ${usagePercent.toFixed(1)}%`,
      value: usagePercent,
      threshold: thresholds.critical,
      timestamp: latest.timestamp,
    });
  } else if (usagePercent >= thresholds.warning) {
    alerts.push({
      id: 'warning-memory',
      type: 'warning',
      message: `Memory usage is high at ${usagePercent.toFixed(1)}%`,
      value: usagePercent,
      threshold: thresholds.warning,
      timestamp: latest.timestamp,
    });
  }

  // Detect memory leak pattern
  if (snapshots.length >= 10) {
    const recent = snapshots.slice(-10);
    let increasingCount = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].usedJSHeapSize > recent[i - 1].usedJSHeapSize) {
        increasingCount++;
      }
    }
    if (increasingCount >= 8) {
      alerts.push({
        id: 'memory-leak',
        type: 'warning',
        message: 'Potential memory leak detected: memory usage has been consistently increasing',
        value: latest.usedJSHeapSize,
        threshold: 0,
        timestamp: latest.timestamp,
      });
    }
  }

  // High DOM node count
  if (latest.domNodes && latest.domNodes > 1500) {
    alerts.push({
      id: 'high-dom-nodes',
      type: 'warning',
      message: `High DOM node count: ${latest.domNodes} nodes`,
      value: latest.domNodes,
      threshold: 1500,
      timestamp: latest.timestamp,
    });
  }

  // Detached nodes (memory leak indicator)
  if (latest.detachedNodes && latest.detachedNodes > 100) {
    alerts.push({
      id: 'detached-nodes',
      type: 'warning',
      message: `${latest.detachedNodes} detached DOM nodes found - possible memory leak`,
      value: latest.detachedNodes,
      threshold: 100,
      timestamp: latest.timestamp,
    });
  }

  return alerts;
}

// ============================================================================
// Component
// ============================================================================

export function MemoryUsagePanel(props: MemoryUsagePanelProps) {
  const {
    snapshots,
    refreshInterval = 1000,
    onRefresh,
    onGarbageCollect,
    onTakeHeapSnapshot,
    thresholds = { warning: 70, critical: 90 },
    className = '',
  } = props;

  const currentSnapshots = signal(snapshots);
  const selectedPeriod = signal<MemoryTrend['period']>('5m');
  const isLive = signal(true);
  const isLoading = signal(false);
  const hoveredSnapshotId = signal<string | null>(null);

  // Auto-refresh
  if (onRefresh && refreshInterval > 0) {
    effect(() => {
      if (!isLive()) return;

      const interval = setInterval(async () => {
        try {
          const newSnapshot = await onRefresh();
          currentSnapshots.set([...currentSnapshots(), newSnapshot].slice(-300)); // Keep last 5 mins at 1s intervals
        } catch (e) {
          // Handle error silently
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    });
  }

  // Current values
  const current = memo(() => {
    const snaps = currentSnapshots();
    if (snaps.length === 0) return null;
    return snaps[snaps.length - 1];
  });

  // Usage percentage
  const usagePercent = memo(() => {
    const c = current();
    if (!c) return 0;
    return (c.usedJSHeapSize / c.jsHeapSizeLimit) * 100;
  });

  // Trend calculation
  const trend = memo(() => calculateTrend(currentSnapshots(), selectedPeriod()));

  // Alerts
  const alerts = memo(() => detectMemoryIssues(currentSnapshots(), thresholds));

  // Chart data
  const chartData = memo((): TimeSeries[] => {
    const snaps = currentSnapshots();
    return [
      {
        id: 'used',
        name: 'Used Heap',
        data: snaps.map(s => ({ timestamp: s.timestamp, value: s.usedJSHeapSize / (1024 * 1024) })),
        color: '#6366f1',
      },
      {
        id: 'total',
        name: 'Total Heap',
        data: snaps.map(s => ({ timestamp: s.timestamp, value: s.totalJSHeapSize / (1024 * 1024) })),
        color: '#3b82f6',
      },
    ];
  });

  const handleRefresh = async () => {
    if (!onRefresh) return;
    isLoading.set(true);
    try {
      const newSnapshot = await onRefresh();
      currentSnapshots.set([...currentSnapshots(), newSnapshot]);
    } finally {
      isLoading.set(false);
    }
  };

  const usageColor = getUsageColor(usagePercent(), thresholds);

  if (!current()) {
    return (
      <div style={styles.panel} class={className}>
        <div style={styles.header}>
          <h2 style={styles.title}>Memory Usage</h2>
        </div>
        <div style={styles.emptyState}>
          <div style="font-size: 16px; margin-bottom: 8px; color: #8a8aaa;">
            No memory data available
          </div>
          <div style="font-size: 13px;">
            Memory snapshots will appear here when available
          </div>
        </div>
      </div>
    );
  }

  const currentFormatted = formatBytesShort(current()!.usedJSHeapSize);
  const totalFormatted = formatBytesShort(current()!.totalJSHeapSize);
  const limitFormatted = formatBytesShort(current()!.jsHeapSizeLimit);

  return (
    <div style={styles.panel} class={className}>
      {/* Header */}
      <div style={styles.header}>
        <div style="display: flex; align-items: center; gap: 16px;">
          <h2 style={styles.title}>Memory Usage</h2>
          {isLive() && (
            <div style={styles.liveIndicator}>
              <span style={styles.liveIndicatorDot} />
              Live
            </div>
          )}
        </div>
        <div style={styles.controls}>
          <select
            style={styles.select}
            value={selectedPeriod()}
            onChange={(e: Event) => selectedPeriod.set((e.target as HTMLSelectElement).value as any)}
          >
            <option value="1m">Last 1 minute</option>
            <option value="5m">Last 5 minutes</option>
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last 1 hour</option>
          </select>
          <button
            style={styles.button + (isLive() ? 'background: #22c55e33;' : '')}
            onClick={() => isLive.set(!isLive())}
          >
            {isLive() ? 'Pause' : 'Resume'}
          </button>
          {onGarbageCollect && (
            <button style={styles.button} onClick={onGarbageCollect}>
              Force GC
            </button>
          )}
          {onTakeHeapSnapshot && (
            <button style={styles.button + styles.buttonPrimary} onClick={onTakeHeapSnapshot}>
              Take Snapshot
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Used Heap</div>
          <div style={styles.statValue + `color: ${usageColor};`}>
            {currentFormatted.value}
            <span style={styles.statUnit}>{currentFormatted.unit}</span>
          </div>
          <div style={styles.statChange + (
            trend().trend === 'increasing' ? styles.statChangePositive :
            trend().trend === 'decreasing' ? styles.statChangeNegative :
            styles.statChangeNeutral
          )}>
            {trend().trend === 'increasing' ? '+' : trend().trend === 'decreasing' ? '-' : ''}
            {formatBytes(Math.abs(trend().change))}
            <span>({Math.abs(trend().changePercent).toFixed(1)}%)</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Heap</div>
          <div style={styles.statValue}>
            {totalFormatted.value}
            <span style={styles.statUnit}>{totalFormatted.unit}</span>
          </div>
          <div style={styles.statChange + styles.statChangeNeutral}>
            Allocated by browser
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Heap Limit</div>
          <div style={styles.statValue}>
            {limitFormatted.value}
            <span style={styles.statUnit}>{limitFormatted.unit}</span>
          </div>
          <div style={styles.statChange + styles.statChangeNeutral}>
            Maximum available
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Usage</div>
          <div style={styles.statValue + `color: ${usageColor};`}>
            {usagePercent().toFixed(1)}
            <span style={styles.statUnit}>%</span>
          </div>
          <div style={styles.trendIndicator + `
            background: ${trend().trend === 'increasing' ? '#ef444422' :
              trend().trend === 'decreasing' ? '#22c55e22' : '#6a6a8a22'};
            color: ${trend().trend === 'increasing' ? '#ef4444' :
              trend().trend === 'decreasing' ? '#22c55e' : '#6a6a8a'};
          `}>
            {trend().trend === 'increasing' ? 'Increasing' :
             trend().trend === 'decreasing' ? 'Decreasing' : 'Stable'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Chart */}
        <div style={styles.chartSection}>
          <div style={styles.chartHeader}>
            <span style={styles.chartTitle}>Memory Over Time</span>
          </div>
          <div style={styles.chartContainer}>
            <TimeSeriesChart
              series={chartData()}
              width={700}
              height={250}
              showLegend={true}
            />

            {/* Usage Bar */}
            <div style={styles.usageBar}>
              <div style={styles.usageBarLabel}>
                <span>Heap Usage</span>
                <span>{formatBytes(current()!.usedJSHeapSize)} / {formatBytes(current()!.jsHeapSizeLimit)}</span>
              </div>
              <div style={styles.usageBarTrack}>
                <div
                  style={styles.usageBarFill + `
                    width: ${usagePercent()}%;
                    background: linear-gradient(90deg, ${usageColor}88, ${usageColor});
                  `}
                />
                {/* Warning threshold marker */}
                <div style={styles.usageBarMarker + `left: ${thresholds.warning}%;`}>
                  <span style={styles.usageBarMarkerLabel}>{thresholds.warning}%</span>
                </div>
                {/* Critical threshold marker */}
                <div style={styles.usageBarMarker + `left: ${thresholds.critical}%;`}>
                  <span style={styles.usageBarMarkerLabel}>{thresholds.critical}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        {(current()!.domNodes !== undefined || current()!.eventListeners !== undefined) && (
          <div style={styles.metricsGrid}>
            {current()!.domNodes !== undefined && (
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>DOM Nodes</div>
                <div style={styles.metricValue + (current()!.domNodes! > 1500 ? 'color: #f59e0b;' : '')}>
                  {current()!.domNodes!.toLocaleString()}
                </div>
              </div>
            )}
            {current()!.eventListeners !== undefined && (
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Event Listeners</div>
                <div style={styles.metricValue}>
                  {current()!.eventListeners!.toLocaleString()}
                </div>
              </div>
            )}
            {current()!.detachedNodes !== undefined && (
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Detached Nodes</div>
                <div style={styles.metricValue + (current()!.detachedNodes! > 100 ? 'color: #ef4444;' : '')}>
                  {current()!.detachedNodes!.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alerts */}
        {alerts().length > 0 && (
          <div style={styles.alertsSection}>
            <div style={styles.alertsTitle}>Alerts</div>
            {alerts().map(alert => (
              <div
                style={styles.alert + (alert.type === 'critical' ? styles.alertCritical : styles.alertWarning)}
              >
                <div
                  style={styles.alertIcon + `
                    background: ${alert.type === 'critical' ? '#ef4444' : '#f59e0b'};
                    color: white;
                  `}
                >
                  !
                </div>
                <div style={styles.alertContent}>
                  <div style={styles.alertMessage + `color: ${alert.type === 'critical' ? '#f87171' : '#fbbf24'};`}>
                    {alert.message}
                  </div>
                  <div style={styles.alertMeta}>
                    {formatTimestamp(alert.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Snapshots */}
        <div style={styles.snapshotsSection}>
          <div style={styles.alertsTitle}>Recent Snapshots</div>
          <div style={styles.snapshotList}>
            {currentSnapshots().slice(-20).reverse().map(snapshot => {
              const isHovered = hoveredSnapshotId() === snapshot.id;
              const usage = (snapshot.usedJSHeapSize / snapshot.jsHeapSizeLimit) * 100;

              return (
                <div
                  style={styles.snapshotItem + (isHovered ? styles.snapshotItemHover : '')}
                  onMouseEnter={() => hoveredSnapshotId.set(snapshot.id)}
                  onMouseLeave={() => hoveredSnapshotId.set(null)}
                >
                  <span style={styles.snapshotTime}>{formatTimestamp(snapshot.timestamp)}</span>
                  <div style="display: flex; align-items: center; gap: 16px;">
                    <span style={styles.snapshotValue}>{formatBytes(snapshot.usedJSHeapSize)}</span>
                    <span style={`
                      font-size: 12px;
                      color: ${getUsageColor(usage, thresholds)};
                    `}>
                      {usage.toFixed(1)}%
                    </span>
                    <Sparkline
                      data={currentSnapshots()
                        .slice(Math.max(0, currentSnapshots().indexOf(snapshot) - 20), currentSnapshots().indexOf(snapshot) + 1)
                        .map(s => s.usedJSHeapSize)}
                      width={60}
                      height={20}
                      color={getUsageColor(usage, thresholds)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemoryUsagePanel;
