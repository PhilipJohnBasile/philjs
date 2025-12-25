/**
 * Dashboard UI Component
 * Real-time metrics display with charts, time range selector, and filters
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from 'react';
import type { MetricsSnapshot, WebVitalsMetrics } from '../collector/metrics';
import type { Span } from '../collector/tracing';
import type { CapturedError, ErrorGroup } from '../collector/errors';

// ============================================================================
// Types
// ============================================================================

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
  icon?: React.ReactNode;
}

export interface DashboardData {
  metrics: MetricsSnapshot[];
  spans: Span[];
  errors: CapturedError[];
  errorGroups: ErrorGroup[];
  isLoading: boolean;
  error: Error | null;
}

export interface DashboardContextValue {
  data: DashboardData;
  timeRange: TimeRangeValue;
  setTimeRange: (range: TimeRange, custom?: { start: number; end: number }) => void;
  filters: DashboardFilter;
  setFilters: (filters: DashboardFilter) => void;
  refresh: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export interface DashboardProps {
  /** Data fetcher function */
  fetchData: (
    timeRange: TimeRangeValue,
    filters: DashboardFilter
  ) => Promise<Omit<DashboardData, 'isLoading' | 'error'>>;
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
  /** Default time range */
  defaultTimeRange?: TimeRange;
  /** Available tabs */
  tabs?: DashboardTab[];
  /** Custom header content */
  headerContent?: React.ReactNode;
  /** Custom styles */
  className?: string;
  /** Theme */
  theme?: 'light' | 'dark' | 'system';
  /** On error callback */
  onError?: (error: Error) => void;
  /** Children components */
  children?: React.ReactNode;
}

// ============================================================================
// Context
// ============================================================================

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a Dashboard component');
  }
  return context;
}

// ============================================================================
// Time Range Utilities
// ============================================================================

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '15m': 'Last 15 minutes',
  '1h': 'Last hour',
  '6h': 'Last 6 hours',
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  custom: 'Custom range',
};

function getTimeRangeValue(range: TimeRange): TimeRangeValue {
  const now = Date.now();
  const durations: Record<TimeRange, number> = {
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    custom: 0,
  };

  return {
    start: now - durations[range],
    end: now,
    label: TIME_RANGE_LABELS[range],
  };
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  dashboard: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    minHeight: '100vh',
    backgroundColor: 'var(--dashboard-bg, #f5f5f5)',
    color: 'var(--dashboard-text, #333)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    backgroundColor: 'var(--dashboard-header-bg, #fff)',
    borderBottom: '1px solid var(--dashboard-border, #e0e0e0)',
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: 600,
    margin: 0,
  },
  headerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid var(--dashboard-border, #e0e0e0)',
    backgroundColor: 'var(--dashboard-header-bg, #fff)',
    paddingLeft: '24px',
  },
  tab: {
    padding: '12px 20px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--dashboard-text-secondary, #666)',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    color: 'var(--dashboard-primary, #3b82f6)',
    borderBottomColor: 'var(--dashboard-primary, #3b82f6)',
  },
  content: {
    flex: 1,
    padding: '24px',
    overflow: 'auto',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid var(--dashboard-border, #e0e0e0)',
    borderRadius: '6px',
    backgroundColor: 'var(--dashboard-input-bg, #fff)',
    fontSize: '14px',
    cursor: 'pointer',
  },
  button: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'var(--dashboard-primary, #3b82f6)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    fontSize: '16px',
    color: 'var(--dashboard-text-secondary, #666)',
  },
  error: {
    padding: '16px',
    backgroundColor: 'var(--dashboard-error-bg, #fef2f2)',
    color: 'var(--dashboard-error-text, #dc2626)',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: 'var(--dashboard-card-bg, #fff)',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--dashboard-text-secondary, #666)',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  cardValue: {
    fontSize: '32px',
    fontWeight: 700,
    color: 'var(--dashboard-text, #333)',
  },
  cardSubtext: {
    fontSize: '12px',
    color: 'var(--dashboard-text-secondary, #666)',
    marginTop: '4px',
  },
};

// ============================================================================
// Sub-components
// ============================================================================

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps): JSX.Element {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TimeRange)}
      style={styles.select}
    >
      <option value="15m">Last 15 minutes</option>
      <option value="1h">Last hour</option>
      <option value="6h">Last 6 hours</option>
      <option value="24h">Last 24 hours</option>
      <option value="7d">Last 7 days</option>
      <option value="30d">Last 30 days</option>
    </select>
  );
}

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading: boolean;
}

function RefreshButton({ onRefresh, isLoading }: RefreshButtonProps): JSX.Element {
  return (
    <button
      onClick={onRefresh}
      disabled={isLoading}
      style={{
        ...styles.button,
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      {isLoading ? 'Loading...' : 'Refresh'}
    </button>
  );
}

interface OverviewCardsProps {
  data: DashboardData;
}

function OverviewCards({ data }: OverviewCardsProps): JSX.Element {
  const latestMetrics = data.metrics[data.metrics.length - 1];
  const webVitals = latestMetrics?.webVitals;

  const stats = useMemo(() => {
    const errorCount = data.errors.length;
    const spanCount = data.spans.length;
    const avgDuration =
      spanCount > 0
        ? data.spans.reduce((sum, s) => sum + (s.duration ?? 0), 0) / spanCount
        : 0;

    return {
      errorCount,
      spanCount,
      avgDuration: Math.round(avgDuration),
    };
  }, [data.errors, data.spans]);

  return (
    <div style={styles.grid}>
      <div style={styles.card}>
        <div style={styles.cardTitle}>LCP</div>
        <div style={styles.cardValue}>
          {webVitals?.lcp ? `${Math.round(webVitals.lcp)}ms` : '-'}
        </div>
        <div style={styles.cardSubtext}>Largest Contentful Paint</div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>FID</div>
        <div style={styles.cardValue}>
          {webVitals?.fid ? `${Math.round(webVitals.fid)}ms` : '-'}
        </div>
        <div style={styles.cardSubtext}>First Input Delay</div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>CLS</div>
        <div style={styles.cardValue}>
          {webVitals?.cls !== null && webVitals?.cls !== undefined
            ? webVitals.cls.toFixed(3)
            : '-'}
        </div>
        <div style={styles.cardSubtext}>Cumulative Layout Shift</div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Errors</div>
        <div style={styles.cardValue}>{stats.errorCount}</div>
        <div style={styles.cardSubtext}>
          {data.errorGroups.length} unique issues
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Traces</div>
        <div style={styles.cardValue}>{stats.spanCount}</div>
        <div style={styles.cardSubtext}>Avg duration: {stats.avgDuration}ms</div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>TTFB</div>
        <div style={styles.cardValue}>
          {webVitals?.ttfb ? `${Math.round(webVitals.ttfb)}ms` : '-'}
        </div>
        <div style={styles.cardSubtext}>Time to First Byte</div>
      </div>
    </div>
  );
}

// ============================================================================
// Dashboard Component
// ============================================================================

const DEFAULT_TABS: DashboardTab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'traces', label: 'Traces' },
  { id: 'errors', label: 'Errors' },
];

export function Dashboard({
  fetchData,
  refreshInterval = 30000,
  defaultTimeRange = '1h',
  tabs = DEFAULT_TABS,
  headerContent,
  className,
  theme = 'light',
  onError,
  children,
}: DashboardProps): JSX.Element {
  const [selectedRange, setSelectedRange] = useState<TimeRange>(defaultTimeRange);
  const [timeRange, setTimeRangeState] = useState<TimeRangeValue>(() =>
    getTimeRangeValue(defaultTimeRange)
  );
  const [filters, setFilters] = useState<DashboardFilter>({});
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? 'overview');
  const [data, setData] = useState<DashboardData>({
    metrics: [],
    spans: [],
    errors: [],
    errorGroups: [],
    isLoading: true,
    error: null,
  });

  const fetchDashboardData = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await fetchData(timeRange, filters);
      setData({
        ...result,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setData((prev) => ({ ...prev, isLoading: false, error: err }));
      onError?.(err);
    }
  }, [fetchData, timeRange, filters, onError]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const timer = setInterval(fetchDashboardData, refreshInterval);
      return () => clearInterval(timer);
    }
  }, [fetchDashboardData, refreshInterval]);

  const handleTimeRangeChange = useCallback(
    (range: TimeRange, custom?: { start: number; end: number }) => {
      setSelectedRange(range);
      if (range === 'custom' && custom) {
        setTimeRangeState({
          start: custom.start,
          end: custom.end,
          label: 'Custom range',
        });
      } else {
        setTimeRangeState(getTimeRangeValue(range));
      }
    },
    []
  );

  const contextValue = useMemo<DashboardContextValue>(
    () => ({
      data,
      timeRange,
      setTimeRange: handleTimeRangeChange,
      filters,
      setFilters,
      refresh: fetchDashboardData,
      activeTab,
      setActiveTab,
    }),
    [data, timeRange, handleTimeRangeChange, filters, fetchDashboardData, activeTab]
  );

  const themeClass = theme === 'dark' ? 'dashboard-dark' : 'dashboard-light';

  return (
    <DashboardContext.Provider value={contextValue}>
      <div
        className={`${themeClass} ${className ?? ''}`}
        style={styles.dashboard}
        data-theme={theme}
      >
        {/* Header */}
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>Performance Dashboard</h1>
          <div style={styles.headerControls}>
            {headerContent}
            <TimeRangeSelector
              value={selectedRange}
              onChange={(range) => handleTimeRangeChange(range)}
            />
            <RefreshButton
              onRefresh={fetchDashboardData}
              isLoading={data.isLoading}
            />
          </div>
        </header>

        {/* Tabs */}
        <nav style={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {}),
              }}
            >
              {tab.icon && <span style={{ marginRight: '8px' }}>{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main style={styles.content}>
          {data.error && (
            <div style={styles.error}>
              <strong>Error:</strong> {data.error.message}
            </div>
          )}

          {data.isLoading && !data.metrics.length ? (
            <div style={styles.loading}>Loading dashboard data...</div>
          ) : (
            <>
              {activeTab === 'overview' && <OverviewCards data={data} />}
              {children}
            </>
          )}
        </main>
      </div>
    </DashboardContext.Provider>
  );
}

// ============================================================================
// Dashboard Widgets
// ============================================================================

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color,
}: MetricCardProps): JSX.Element {
  const trendColors = {
    up: '#22c55e',
    down: '#ef4444',
    neutral: '#6b7280',
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={{ ...styles.cardValue, color: color ?? 'inherit' }}>
        {value}
      </div>
      {(subtitle || trendValue) && (
        <div style={styles.cardSubtext}>
          {trendValue && (
            <span
              style={{
                color: trend ? trendColors[trend] : undefined,
                marginRight: '8px',
              }}
            >
              {trend === 'up' ? '+' : trend === 'down' ? '' : ''}
              {trendValue}
            </span>
          )}
          {subtitle}
        </div>
      )}
    </div>
  );
}

export interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  height?: number;
}

export function ChartContainer({
  title,
  children,
  height = 300,
}: ChartContainerProps): JSX.Element {
  return (
    <div style={{ ...styles.card, marginTop: '16px' }}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={{ height, marginTop: '16px' }}>{children}</div>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { TimeRangeSelector, RefreshButton, OverviewCards };
export type { WebVitalsMetrics };
