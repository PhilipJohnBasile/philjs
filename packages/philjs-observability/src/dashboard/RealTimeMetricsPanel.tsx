/**
 * RealTimeMetricsPanel - Live metrics visualization
 *
 * Displays real-time metrics with live updating charts,
 * streaming data visualization, and performance indicators.
 */

import { signal, memo, effect } from 'philjs-core';
import type { MetricValue, PerformanceMetrics } from '../index';
import { TimeSeriesChart, type TimeSeries, type DataPoint } from '../charts/TimeSeriesChart';
import { Sparkline } from '../charts/Sparkline';

// ============================================================================
// Types
// ============================================================================

export interface MetricStream {
  id: string;
  name: string;
  displayName: string;
  unit: string;
  color: string;
  data: DataPoint[];
  currentValue: number;
  previousValue: number;
  min: number;
  max: number;
  avg: number;
  status: 'normal' | 'warning' | 'critical';
  thresholds?: {
    warning: number;
    critical: number;
  };
}

export interface RealTimeMetricsPanelProps {
  streams: MetricStream[];
  webVitals?: PerformanceMetrics;
  refreshRate?: number;  // ms between updates
  historyLength?: number; // Number of data points to keep
  onStreamSubscribe?: (streamId: string) => void;
  onStreamUnsubscribe?: (streamId: string) => void;
  onRefresh?: () => Promise<Record<string, number>>;
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
  liveIndicator: `
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: #22c55e22;
    border-radius: 6px;
    font-size: 12px;
    color: #22c55e;
  `,
  liveIndicatorDot: `
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    animation: pulse 1.5s ease-in-out infinite;
  `,
  liveIndicatorPaused: `
    background: #f59e0b22;
    color: #f59e0b;
  `,
  refreshRate: `
    color: #6a6a8a;
    font-size: 11px;
    margin-left: 8px;
  `,
  webVitalsBar: `
    display: flex;
    gap: 16px;
    padding: 16px 24px;
    background: #1a1a2e;
    border-bottom: 1px solid #2a2a4a;
    overflow-x: auto;
  `,
  webVital: `
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 100px;
  `,
  webVitalLabel: `
    font-size: 10px;
    color: #6a6a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  webVitalValue: `
    font-size: 20px;
    font-weight: 700;
    font-family: 'SF Mono', 'Monaco', monospace;
  `,
  webVitalUnit: `
    font-size: 12px;
    color: #8a8aaa;
    margin-left: 2px;
  `,
  webVitalStatus: `
    display: inline-flex;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
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
  chartControls: `
    display: flex;
    gap: 8px;
  `,
  chartToggle: `
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    background: transparent;
    color: #6a6a8a;
  `,
  chartToggleActive: `
    background: #2a2a4e;
    color: #e0e0ff;
    border-color: #3a3a6e;
  `,
  chartContainer: `
    background: #1a1a2e;
    border-radius: 12px;
    padding: 20px;
  `,
  metricsGrid: `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  `,
  metricCard: `
    background: #1a1a2e;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #2a2a4a;
    transition: border-color 0.2s ease;
  `,
  metricCardHover: `
    border-color: #6366f1;
  `,
  metricCardWarning: `
    border-color: #f59e0b;
  `,
  metricCardCritical: `
    border-color: #ef4444;
  `,
  metricHeader: `
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  `,
  metricName: `
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
  `,
  metricBadge: `
    display: inline-flex;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
  `,
  metricValue: `
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 8px;
  `,
  metricValueNumber: `
    font-size: 32px;
    font-weight: 700;
    font-family: 'SF Mono', 'Monaco', monospace;
  `,
  metricValueUnit: `
    font-size: 14px;
    color: #8a8aaa;
  `,
  metricChange: `
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    margin-bottom: 12px;
  `,
  metricChangePositive: `
    color: #ef4444;
  `,
  metricChangeNegative: `
    color: #22c55e;
  `,
  metricChangeNeutral: `
    color: #6a6a8a;
  `,
  metricStats: `
    display: flex;
    gap: 16px;
    padding-top: 12px;
    border-top: 1px solid #2a2a4a;
    font-size: 11px;
  `,
  metricStat: `
    display: flex;
    flex-direction: column;
    gap: 2px;
  `,
  metricStatLabel: `
    color: #6a6a8a;
    text-transform: uppercase;
  `,
  metricStatValue: `
    color: #e0e0ff;
    font-family: 'SF Mono', 'Monaco', monospace;
  `,
  metricSparkline: `
    margin-top: 12px;
  `,
  streamList: `
    margin-top: 24px;
  `,
  streamListHeader: `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  `,
  streamListTitle: `
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
  `,
  streamTable: `
    width: 100%;
    border-collapse: collapse;
  `,
  streamTableHeader: `
    text-align: left;
    padding: 12px 16px;
    background: #1a1a2e;
    color: #6a6a8a;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  `,
  streamTableRow: `
    border-bottom: 1px solid #1a1a2e;
    transition: background 0.2s ease;
  `,
  streamTableRowHover: `
    background: rgba(99, 102, 241, 0.05);
  `,
  streamTableCell: `
    padding: 12px 16px;
    font-size: 13px;
    color: #e0e0ff;
  `,
  streamName: `
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  streamColor: `
    width: 12px;
    height: 12px;
    border-radius: 3px;
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
};

// ============================================================================
// Status Colors
// ============================================================================

const statusColors = {
  normal: { bg: '#22c55e22', text: '#22c55e' },
  warning: { bg: '#f59e0b22', text: '#f59e0b' },
  critical: { bg: '#ef444422', text: '#ef4444' },
};

const webVitalThresholds = {
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  ttfb: { good: 800, poor: 1800 },
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatValue(value: number, unit: string): { value: string; unit: string } {
  if (unit === 'ms') {
    if (value >= 1000) return { value: (value / 1000).toFixed(2), unit: 's' };
    return { value: value.toFixed(0), unit: 'ms' };
  }
  if (unit === '%') {
    return { value: value.toFixed(1), unit: '%' };
  }
  if (unit === 'bytes') {
    if (value >= 1024 * 1024) return { value: (value / (1024 * 1024)).toFixed(2), unit: 'MB' };
    if (value >= 1024) return { value: (value / 1024).toFixed(1), unit: 'KB' };
    return { value: value.toFixed(0), unit: 'B' };
  }
  if (unit === '/s') {
    if (value >= 1000) return { value: (value / 1000).toFixed(2), unit: 'k/s' };
    return { value: value.toFixed(1), unit: '/s' };
  }
  return { value: value.toFixed(2), unit };
}

function calculateChange(current: number, previous: number): { value: number; percent: number; direction: 'up' | 'down' | 'neutral' } {
  if (previous === 0) return { value: 0, percent: 0, direction: 'neutral' };

  const diff = current - previous;
  const percent = (diff / previous) * 100;

  return {
    value: diff,
    percent,
    direction: Math.abs(percent) < 1 ? 'neutral' : percent > 0 ? 'up' : 'down',
  };
}

function getWebVitalStatus(metric: keyof typeof webVitalThresholds, value: number): 'normal' | 'warning' | 'critical' {
  const thresholds = webVitalThresholds[metric];
  if (!thresholds) return 'normal';
  if (value <= thresholds.good) return 'normal';
  if (value <= thresholds.poor) return 'warning';
  return 'critical';
}

// ============================================================================
// Component
// ============================================================================

export function RealTimeMetricsPanel(props: RealTimeMetricsPanelProps) {
  const {
    streams,
    webVitals,
    refreshRate = 1000,
    historyLength = 60,
    onStreamSubscribe,
    onStreamUnsubscribe,
    onRefresh,
    className = '',
  } = props;

  const isPaused = signal(false);
  const selectedTimeRange = signal<'1m' | '5m' | '15m' | '1h'>('5m');
  const viewMode = signal<'cards' | 'chart' | 'table'>('cards');
  const selectedStreams = signal<Set<string>>(new Set(streams.slice(0, 4).map(s => s.id)));
  const hoveredStreamId = signal<string | null>(null);
  const lastUpdate = signal(Date.now());

  // Auto-update timestamp
  if (!isPaused()) {
    effect(() => {
      const interval = setInterval(() => {
        lastUpdate.set(Date.now());
      }, refreshRate);

      return () => clearInterval(interval);
    });
  }

  // Calculate time range in ms
  const timeRangeMs = memo(() => {
    const ranges = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
    };
    return ranges[selectedTimeRange()];
  });

  // Filter data by time range
  const filteredStreams = memo(() => {
    const cutoff = Date.now() - timeRangeMs();
    return streams.map(stream => ({
      ...stream,
      data: stream.data.filter(d => d.timestamp >= cutoff),
    }));
  });

  // Chart series for selected streams
  const chartSeries = memo((): TimeSeries[] => {
    return filteredStreams()
      .filter(s => selectedStreams().has(s.id))
      .map(stream => ({
        id: stream.id,
        name: stream.displayName,
        data: stream.data,
        color: stream.color,
      }));
  });

  const toggleStream = (streamId: string) => {
    const current = new Set(selectedStreams());
    if (current.has(streamId)) {
      current.delete(streamId);
      onStreamUnsubscribe?.(streamId);
    } else {
      current.add(streamId);
      onStreamSubscribe?.(streamId);
    }
    selectedStreams.set(current);
  };

  const renderWebVitals = () => {
    if (!webVitals) return null;

    const vitals = [
      { key: 'fcp', label: 'FCP', value: webVitals.fcp, unit: 'ms' },
      { key: 'lcp', label: 'LCP', value: webVitals.lcp, unit: 'ms' },
      { key: 'fid', label: 'FID', value: webVitals.fid, unit: 'ms' },
      { key: 'cls', label: 'CLS', value: webVitals.cls, unit: '' },
      { key: 'ttfb', label: 'TTFB', value: webVitals.ttfb, unit: 'ms' },
    ].filter(v => v.value !== undefined);

    return (
      <div style={styles.webVitalsBar}>
        {vitals.map(vital => {
          const status = getWebVitalStatus(vital.key as keyof typeof webVitalThresholds, vital.value!);
          const colors = statusColors[status];
          const formatted = vital.unit === ''
            ? { value: vital.value!.toFixed(3), unit: '' }
            : formatValue(vital.value!, vital.unit);

          return (
            <div style={styles.webVital}>
              <span style={styles.webVitalLabel}>{vital.label}</span>
              <div>
                <span style={styles.webVitalValue + `color: ${colors.text};`}>
                  {formatted.value}
                </span>
                <span style={styles.webVitalUnit}>{formatted.unit}</span>
              </div>
              <span
                style={styles.webVitalStatus + `background: ${colors.bg}; color: ${colors.text};`}
              >
                {status === 'normal' ? 'Good' : status === 'warning' ? 'Needs Work' : 'Poor'}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMetricCards = () => (
    <div style={styles.metricsGrid}>
      {filteredStreams().map(stream => {
        const colors = statusColors[stream.status];
        const isHovered = hoveredStreamId() === stream.id;
        const formatted = formatValue(stream.currentValue, stream.unit);
        const change = calculateChange(stream.currentValue, stream.previousValue);

        let cardStyle = styles.metricCard;
        if (stream.status === 'warning') cardStyle += styles.metricCardWarning;
        else if (stream.status === 'critical') cardStyle += styles.metricCardCritical;
        else if (isHovered) cardStyle += styles.metricCardHover;

        return (
          <div
            style={cardStyle}
            onMouseEnter={() => hoveredStreamId.set(stream.id)}
            onMouseLeave={() => hoveredStreamId.set(null)}
          >
            <div style={styles.metricHeader}>
              <span style={styles.metricName}>{stream.displayName}</span>
              <span
                style={styles.metricBadge + `background: ${colors.bg}; color: ${colors.text};`}
              >
                {stream.status}
              </span>
            </div>

            <div style={styles.metricValue}>
              <span style={styles.metricValueNumber + `color: ${colors.text};`}>
                {formatted.value}
              </span>
              <span style={styles.metricValueUnit}>{formatted.unit}</span>
            </div>

            <div style={styles.metricChange + (
              change.direction === 'up' ? styles.metricChangePositive :
              change.direction === 'down' ? styles.metricChangeNegative :
              styles.metricChangeNeutral
            )}>
              {change.direction === 'up' ? '+' : change.direction === 'down' ? '-' : ''}
              {Math.abs(change.percent).toFixed(1)}%
              <span style="color: #6a6a8a; margin-left: 4px;">
                vs previous
              </span>
            </div>

            {stream.data.length > 1 && (
              <div style={styles.metricSparkline}>
                <Sparkline
                  data={stream.data.map(d => d.value)}
                  width={220}
                  height={40}
                  color={stream.color}
                  showArea={true}
                />
              </div>
            )}

            <div style={styles.metricStats}>
              <div style={styles.metricStat}>
                <span style={styles.metricStatLabel}>Min</span>
                <span style={styles.metricStatValue}>
                  {formatValue(stream.min, stream.unit).value}
                </span>
              </div>
              <div style={styles.metricStat}>
                <span style={styles.metricStatLabel}>Max</span>
                <span style={styles.metricStatValue}>
                  {formatValue(stream.max, stream.unit).value}
                </span>
              </div>
              <div style={styles.metricStat}>
                <span style={styles.metricStatLabel}>Avg</span>
                <span style={styles.metricStatValue}>
                  {formatValue(stream.avg, stream.unit).value}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderChart = () => (
    <div style={styles.chartSection}>
      <div style={styles.chartHeader}>
        <span style={styles.chartTitle}>Real-Time Metrics</span>
        <div style={styles.chartControls}>
          {streams.map(stream => (
            <button
              style={styles.chartToggle +
                (selectedStreams().has(stream.id) ? styles.chartToggleActive : '')}
              onClick={() => toggleStream(stream.id)}
            >
              <span style={`display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: ${stream.color}; margin-right: 6px;`} />
              {stream.displayName}
            </button>
          ))}
        </div>
      </div>
      <div style={styles.chartContainer}>
        {chartSeries().length > 0 ? (
          <TimeSeriesChart
            series={chartSeries()}
            width={800}
            height={300}
            showLegend={true}
            animate={true}
          />
        ) : (
          <div style={styles.emptyState}>
            <div style="font-size: 14px; color: #8a8aaa;">
              Select metrics to display on the chart
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderTable = () => (
    <div style={styles.streamList}>
      <div style={styles.streamListHeader}>
        <span style={styles.streamListTitle}>All Metrics</span>
      </div>
      <table style={styles.streamTable}>
        <thead>
          <tr>
            <th style={styles.streamTableHeader}>Metric</th>
            <th style={styles.streamTableHeader}>Current</th>
            <th style={styles.streamTableHeader}>Change</th>
            <th style={styles.streamTableHeader}>Min</th>
            <th style={styles.streamTableHeader}>Max</th>
            <th style={styles.streamTableHeader}>Avg</th>
            <th style={styles.streamTableHeader}>Status</th>
            <th style={styles.streamTableHeader}>Trend</th>
          </tr>
        </thead>
        <tbody>
          {filteredStreams().map(stream => {
            const colors = statusColors[stream.status];
            const formatted = formatValue(stream.currentValue, stream.unit);
            const change = calculateChange(stream.currentValue, stream.previousValue);
            const isHovered = hoveredStreamId() === stream.id;

            return (
              <tr
                style={styles.streamTableRow + (isHovered ? styles.streamTableRowHover : '')}
                onMouseEnter={() => hoveredStreamId.set(stream.id)}
                onMouseLeave={() => hoveredStreamId.set(null)}
              >
                <td style={styles.streamTableCell}>
                  <div style={styles.streamName}>
                    <span style={styles.streamColor + `background: ${stream.color};`} />
                    {stream.displayName}
                  </div>
                </td>
                <td style={styles.streamTableCell + 'font-family: "SF Mono", "Monaco", monospace;'}>
                  {formatted.value} {formatted.unit}
                </td>
                <td style={styles.streamTableCell + (
                  change.direction === 'up' ? 'color: #ef4444;' :
                  change.direction === 'down' ? 'color: #22c55e;' : ''
                )}>
                  {change.direction === 'up' ? '+' : change.direction === 'down' ? '' : ''}
                  {change.percent.toFixed(1)}%
                </td>
                <td style={styles.streamTableCell}>
                  {formatValue(stream.min, stream.unit).value}
                </td>
                <td style={styles.streamTableCell}>
                  {formatValue(stream.max, stream.unit).value}
                </td>
                <td style={styles.streamTableCell}>
                  {formatValue(stream.avg, stream.unit).value}
                </td>
                <td style={styles.streamTableCell}>
                  <span
                    style={styles.metricBadge + `background: ${colors.bg}; color: ${colors.text};`}
                  >
                    {stream.status}
                  </span>
                </td>
                <td style={styles.streamTableCell}>
                  {stream.data.length > 1 && (
                    <Sparkline
                      data={stream.data.slice(-20).map(d => d.value)}
                      width={80}
                      height={24}
                      color={stream.color}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={styles.panel} class={className}>
      {/* Header */}
      <div style={styles.header}>
        <div style="display: flex; align-items: center; gap: 16px;">
          <h2 style={styles.title}>Real-Time Metrics</h2>
          <div
            style={styles.liveIndicator + (isPaused() ? styles.liveIndicatorPaused : '')}
          >
            <span style={styles.liveIndicatorDot + (isPaused() ? 'background: #f59e0b; animation: none;' : '')} />
            {isPaused() ? 'Paused' : 'Live'}
            <span style={styles.refreshRate}>
              {refreshRate}ms
            </span>
          </div>
        </div>
        <div style={styles.controls}>
          <select
            style={styles.select}
            value={selectedTimeRange()}
            onChange={(e: Event) => selectedTimeRange.set((e.target as HTMLSelectElement).value as any)}
          >
            <option value="1m">Last 1 minute</option>
            <option value="5m">Last 5 minutes</option>
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last 1 hour</option>
          </select>
          <select
            style={styles.select}
            value={viewMode()}
            onChange={(e: Event) => viewMode.set((e.target as HTMLSelectElement).value as any)}
          >
            <option value="cards">Cards</option>
            <option value="chart">Chart</option>
            <option value="table">Table</option>
          </select>
          <button
            style={styles.button + (isPaused() ? 'background: #22c55e33; border-color: #22c55e;' : '')}
            onClick={() => isPaused.set(!isPaused())}
          >
            {isPaused() ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      {/* Web Vitals Bar */}
      {renderWebVitals()}

      {/* Content */}
      <div style={styles.content}>
        {streams.length === 0 ? (
          <div style={styles.emptyState}>
            <div style="font-size: 16px; margin-bottom: 8px; color: #8a8aaa;">
              No metrics available
            </div>
            <div style="font-size: 13px;">
              Metrics will appear here when data starts streaming
            </div>
          </div>
        ) : (
          <>
            {viewMode() === 'cards' && renderMetricCards()}
            {viewMode() === 'chart' && renderChart()}
            {viewMode() === 'table' && renderTable()}
          </>
        )}
      </div>
    </div>
  );
}

export default RealTimeMetricsPanel;
