/**
 * MetricsPanel - Display metrics (counters, histograms, gauges)
 *
 * Comprehensive metrics visualization panel with real-time updates,
 * filtering, and various visualization options.
 */

import { signal, memo, effect } from 'philjs-core';
import type { MetricValue } from '../index';
import { TimeSeriesChart, type TimeSeries } from '../charts/TimeSeriesChart';
import { Histogram, type HistogramBucket } from '../charts/Histogram';
import { MetricCard, CompactMetricCard } from '../widgets/MetricCard';
import { Sparkline } from '../charts/Sparkline';

// ============================================================================
// Types
// ============================================================================

export interface MetricsPanelProps {
  metrics: MetricValue[];
  refreshInterval?: number;
  onRefresh?: () => Promise<MetricValue[]>;
  showFilters?: boolean;
  layout?: 'grid' | 'list' | 'compact';
  className?: string;
}

export interface MetricGroup {
  name: string;
  type: MetricValue['type'];
  values: MetricValue[];
  labels: string[];
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  panel: `
    background: #0f0f1a;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
  searchInput: `
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 6px;
    color: #e0e0ff;
    padding: 8px 12px;
    font-size: 13px;
    width: 200px;
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
  content: `
    padding: 24px;
  `,
  grid: `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  `,
  list: `
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  compact: `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 8px;
  `,
  metricSection: `
    margin-bottom: 32px;
  `,
  sectionTitle: `
    color: #8a8aaa;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 16px;
    padding-left: 4px;
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
  emptyIcon: `
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  `,
  emptyTitle: `
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 8px;
    color: #8a8aaa;
  `,
  emptyText: `
    font-size: 13px;
  `,
  tabs: `
    display: flex;
    gap: 4px;
    padding: 4px;
    background: #1a1a2e;
    border-radius: 8px;
  `,
  tab: `
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #8a8aaa;
    background: transparent;
    border: none;
  `,
  tabActive: `
    background: #2a2a4e;
    color: #e0e0ff;
  `,
  chartContainer: `
    margin-top: 24px;
    padding: 20px;
    background: #1a1a2e;
    border-radius: 12px;
  `,
  chartTitle: `
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
  `,
};

// ============================================================================
// Helper Functions
// ============================================================================

function groupMetrics(metrics: MetricValue[]): Map<string, MetricGroup> {
  const groups = new Map<string, MetricGroup>();

  for (const metric of metrics) {
    const baseName = metric.name.replace(/_total$|_count$|_bucket$|_sum$/, '');

    if (!groups.has(baseName)) {
      groups.set(baseName, {
        name: baseName,
        type: metric.type,
        values: [],
        labels: [],
      });
    }

    const group = groups.get(baseName)!;
    group.values.push(metric);

    // Collect unique label combinations
    const labelKey = Object.entries(metric.labels)
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    if (!group.labels.includes(labelKey)) {
      group.labels.push(labelKey);
    }
  }

  return groups;
}

function getLatestValue(values: MetricValue[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => b.timestamp - a.timestamp);
  return sorted[0].value;
}

function getSparklineData(values: MetricValue[], limit = 20): number[] {
  const sorted = [...values].sort((a, b) => a.timestamp - b.timestamp);
  return sorted.slice(-limit).map(v => v.value);
}

function calculateTrend(values: MetricValue[]): { direction: 'up' | 'down' | 'neutral'; value: string } {
  if (values.length < 2) return { direction: 'neutral', value: '0%' };

  const sorted = [...values].sort((a, b) => a.timestamp - b.timestamp);
  const recent = sorted.slice(-5);
  const older = sorted.slice(-10, -5);

  if (recent.length === 0 || older.length === 0) {
    return { direction: 'neutral', value: '0%' };
  }

  const recentAvg = recent.reduce((s, v) => s + v.value, 0) / recent.length;
  const olderAvg = older.reduce((s, v) => s + v.value, 0) / older.length;

  if (olderAvg === 0) return { direction: 'neutral', value: '0%' };

  const change = ((recentAvg - olderAvg) / olderAvg) * 100;

  return {
    direction: change > 1 ? 'up' : change < -1 ? 'down' : 'neutral',
    value: `${Math.abs(change).toFixed(1)}%`,
  };
}

function valuesToHistogramBuckets(values: MetricValue[], numBuckets = 20): HistogramBucket[] {
  if (values.length === 0) return [];

  const allValues = values.map(v => v.value);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const bucketSize = range / numBuckets;

  const buckets: HistogramBucket[] = [];
  for (let i = 0; i < numBuckets; i++) {
    const bucketMin = min + i * bucketSize;
    const bucketMax = min + (i + 1) * bucketSize;
    const count = allValues.filter(v => v >= bucketMin && v < bucketMax).length;
    buckets.push({ min: bucketMin, max: bucketMax, count });
  }

  return buckets;
}

function valuesToTimeSeries(group: MetricGroup): TimeSeries[] {
  // Group by label combination
  const seriesMap = new Map<string, MetricValue[]>();

  for (const value of group.values) {
    const labelKey = Object.entries(value.labels)
      .map(([k, v]) => `${k}=${v}`)
      .join(',') || 'default';

    if (!seriesMap.has(labelKey)) {
      seriesMap.set(labelKey, []);
    }
    seriesMap.get(labelKey)!.push(value);
  }

  return Array.from(seriesMap.entries()).map(([labelKey, values], idx) => ({
    id: labelKey,
    name: labelKey === 'default' ? group.name : labelKey,
    data: values
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(v => ({ timestamp: v.timestamp, value: v.value })),
  }));
}

function formatMetricValue(value: number, type: MetricValue['type']): string {
  if (type === 'counter') {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toFixed(0);
  }
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return value.toFixed(2);
}

// ============================================================================
// Component
// ============================================================================

export function MetricsPanel(props: MetricsPanelProps) {
  const {
    metrics,
    refreshInterval = 30000,
    onRefresh,
    showFilters = true,
    layout = 'grid',
    className = '',
  } = props;

  const currentMetrics = signal(metrics);
  const searchQuery = signal('');
  const selectedType = signal<'all' | MetricValue['type']>('all');
  const activeTab = signal<'cards' | 'charts' | 'histogram'>('cards');
  const selectedMetric = signal<string | null>(null);
  const isLoading = signal(false);

  // Auto-refresh
  if (onRefresh && refreshInterval > 0) {
    effect(() => {
      const interval = setInterval(async () => {
        isLoading.set(true);
        try {
          const newMetrics = await onRefresh();
          currentMetrics.set(newMetrics);
        } finally {
          isLoading.set(false);
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    });
  }

  // Filter and group metrics
  const filteredGroups = memo(() => {
    let filtered = currentMetrics();

    // Filter by search
    if (searchQuery()) {
      const query = searchQuery().toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(query) ||
        Object.values(m.labels).some(v => v.toLowerCase().includes(query))
      );
    }

    // Filter by type
    if (selectedType() !== 'all') {
      filtered = filtered.filter(m => m.type === selectedType());
    }

    return groupMetrics(filtered);
  });

  const handleRefresh = async () => {
    if (!onRefresh) return;
    isLoading.set(true);
    try {
      const newMetrics = await onRefresh();
      currentMetrics.set(newMetrics);
    } finally {
      isLoading.set(false);
    }
  };

  const getLayoutStyle = () => {
    switch (layout) {
      case 'list': return styles.list;
      case 'compact': return styles.compact;
      default: return styles.grid;
    }
  };

  const renderMetricCards = () => {
    const groups = Array.from(filteredGroups().values());

    if (groups.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>[~]</div>
          <div style={styles.emptyTitle}>No metrics found</div>
          <div style={styles.emptyText}>
            {searchQuery() ? 'Try adjusting your search query' : 'Metrics will appear here once collected'}
          </div>
        </div>
      );
    }

    // Group by type
    const counters = groups.filter(g => g.type === 'counter');
    const gauges = groups.filter(g => g.type === 'gauge');
    const histograms = groups.filter(g => g.type === 'histogram');

    return (
      <>
        {counters.length > 0 && (
          <div style={styles.metricSection}>
            <div style={styles.sectionTitle}>Counters</div>
            <div style={getLayoutStyle()}>
              {counters.map(group => {
                const latestValue = getLatestValue(group.values);
                const trend = calculateTrend(group.values);
                const sparkline = getSparklineData(group.values);

                return layout === 'compact' ? (
                  <CompactMetricCard
                    label={group.name}
                    value={formatMetricValue(latestValue, 'counter')}
                  />
                ) : (
                  <MetricCard
                    title={group.name}
                    value={formatMetricValue(latestValue, 'counter')}
                    trend={trend}
                    sparklineData={sparkline}
                    description={`${group.labels.length} series`}
                    onClick={() => selectedMetric.set(group.name)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {gauges.length > 0 && (
          <div style={styles.metricSection}>
            <div style={styles.sectionTitle}>Gauges</div>
            <div style={getLayoutStyle()}>
              {gauges.map(group => {
                const latestValue = getLatestValue(group.values);
                const trend = calculateTrend(group.values);
                const sparkline = getSparklineData(group.values);

                return layout === 'compact' ? (
                  <CompactMetricCard
                    label={group.name}
                    value={formatMetricValue(latestValue, 'gauge')}
                  />
                ) : (
                  <MetricCard
                    title={group.name}
                    value={formatMetricValue(latestValue, 'gauge')}
                    trend={trend}
                    sparklineData={sparkline}
                    description={`${group.labels.length} series`}
                    onClick={() => selectedMetric.set(group.name)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {histograms.length > 0 && (
          <div style={styles.metricSection}>
            <div style={styles.sectionTitle}>Histograms</div>
            <div style={getLayoutStyle()}>
              {histograms.map(group => {
                const latestValue = getLatestValue(group.values);
                const trend = calculateTrend(group.values);
                const sparkline = getSparklineData(group.values);

                return layout === 'compact' ? (
                  <CompactMetricCard
                    label={group.name}
                    value={formatMetricValue(latestValue, 'histogram')}
                    unit="ms"
                  />
                ) : (
                  <MetricCard
                    title={group.name}
                    value={formatMetricValue(latestValue, 'histogram')}
                    unit="ms"
                    trend={trend}
                    sparklineData={sparkline}
                    description={`${group.labels.length} series`}
                    onClick={() => selectedMetric.set(group.name)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  };

  const renderCharts = () => {
    const groups = Array.from(filteredGroups().values());

    if (groups.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={styles.emptyTitle}>No metrics to chart</div>
        </div>
      );
    }

    return (
      <>
        {groups.slice(0, 4).map(group => (
          <div style={styles.chartContainer}>
            <div style={styles.chartTitle}>{group.name}</div>
            <TimeSeriesChart
              series={valuesToTimeSeries(group)}
              width={600}
              height={250}
              showLegend={group.labels.length > 1}
            />
          </div>
        ))}
      </>
    );
  };

  const renderHistograms = () => {
    const groups = Array.from(filteredGroups().values())
      .filter(g => g.type === 'histogram');

    if (groups.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={styles.emptyTitle}>No histogram metrics found</div>
        </div>
      );
    }

    return (
      <>
        {groups.map(group => (
          <div style={styles.chartContainer}>
            <Histogram
              buckets={valuesToHistogramBuckets(group.values)}
              title={group.name}
              width={600}
              height={250}
            />
          </div>
        ))}
      </>
    );
  };

  return (
    <div style={styles.panel} class={className}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Metrics</h2>
        <div style={styles.controls}>
          {showFilters && (
            <>
              <input
                type="text"
                placeholder="Search metrics..."
                style={styles.searchInput}
                value={searchQuery()}
                onInput={(e: InputEvent) => searchQuery.set((e.target as HTMLInputElement).value)}
              />
              <select
                style={styles.select}
                value={selectedType()}
                onChange={(e: Event) => selectedType.set((e.target as HTMLSelectElement).value as any)}
              >
                <option value="all">All Types</option>
                <option value="counter">Counters</option>
                <option value="gauge">Gauges</option>
                <option value="histogram">Histograms</option>
              </select>
            </>
          )}
          <div style={styles.tabs}>
            <button
              style={styles.tab + (activeTab() === 'cards' ? styles.tabActive : '')}
              onClick={() => activeTab.set('cards')}
            >
              Cards
            </button>
            <button
              style={styles.tab + (activeTab() === 'charts' ? styles.tabActive : '')}
              onClick={() => activeTab.set('charts')}
            >
              Charts
            </button>
            <button
              style={styles.tab + (activeTab() === 'histogram' ? styles.tabActive : '')}
              onClick={() => activeTab.set('histogram')}
            >
              Histograms
            </button>
          </div>
          {onRefresh && (
            <button style={styles.button} onClick={handleRefresh} disabled={isLoading()}>
              {isLoading() ? 'Loading...' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab() === 'cards' && renderMetricCards()}
        {activeTab() === 'charts' && renderCharts()}
        {activeTab() === 'histogram' && renderHistograms()}
      </div>
    </div>
  );
}

export default MetricsPanel;
