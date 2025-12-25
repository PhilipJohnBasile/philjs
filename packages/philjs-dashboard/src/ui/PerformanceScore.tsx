/**
 * Performance Score Widget Component
 * Displays a visual performance score based on Core Web Vitals
 */

import React, { useMemo } from 'react';
import type { WebVitalsMetrics } from '../collector/metrics';
import { calculatePerformanceScore } from '../collector/metrics';
import { useDashboard } from './Dashboard';

// ============================================================================
// Types
// ============================================================================

export interface PerformanceScoreProps {
  /** Override Web Vitals from context */
  webVitals?: WebVitalsMetrics;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Show breakdown of individual metrics */
  showBreakdown?: boolean;
  /** Show trend indicator */
  showTrend?: boolean;
  /** Previous score for trend calculation */
  previousScore?: number;
  /** Custom className */
  className?: string;
}

export type ScoreCategory = 'good' | 'needs-improvement' | 'poor';

// ============================================================================
// Constants
// ============================================================================

const SCORE_THRESHOLDS = {
  good: 90,
  needsImprovement: 50,
};

const CATEGORY_COLORS: Record<ScoreCategory, string> = {
  good: '#22c55e',
  'needs-improvement': '#f59e0b',
  poor: '#ef4444',
};

const CATEGORY_LABELS: Record<ScoreCategory, string> = {
  good: 'Good',
  'needs-improvement': 'Needs Improvement',
  poor: 'Poor',
};

const SIZE_CONFIG = {
  small: {
    diameter: 80,
    strokeWidth: 6,
    fontSize: 20,
    labelSize: 10,
  },
  medium: {
    diameter: 120,
    strokeWidth: 8,
    fontSize: 32,
    labelSize: 12,
  },
  large: {
    diameter: 180,
    strokeWidth: 12,
    fontSize: 48,
    labelSize: 14,
  },
};

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
  },
  scoreContainer: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    position: 'absolute' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontWeight: 700,
    lineHeight: 1,
  },
  scoreLabel: {
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    fontWeight: 600,
    marginTop: '4px',
  },
  breakdown: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '12px',
    width: '100%',
    marginTop: '8px',
  },
  metricCard: {
    padding: '12px',
    backgroundColor: 'var(--dashboard-bg, #f5f5f5)',
    borderRadius: '8px',
    textAlign: 'center' as const,
  },
  metricName: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--dashboard-text-secondary, #666)',
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
  },
  metricValue: {
    fontSize: '16px',
    fontWeight: 700,
  },
  metricStatus: {
    fontSize: '10px',
    marginTop: '2px',
  },
  trend: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 500,
  },
  trendUp: {
    color: '#22c55e',
  },
  trendDown: {
    color: '#ef4444',
  },
  trendNeutral: {
    color: '#6b7280',
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

function getScoreCategory(score: number): ScoreCategory {
  if (score >= SCORE_THRESHOLDS.good) return 'good';
  if (score >= SCORE_THRESHOLDS.needsImprovement) return 'needs-improvement';
  return 'poor';
}

function getMetricStatus(
  metric: keyof WebVitalsMetrics,
  value: number | null
): ScoreCategory {
  if (value === null) return 'poor';

  const thresholds: Record<keyof WebVitalsMetrics, { good: number; needsImprovement: number }> = {
    lcp: { good: 2500, needsImprovement: 4000 },
    fid: { good: 100, needsImprovement: 300 },
    cls: { good: 0.1, needsImprovement: 0.25 },
    fcp: { good: 1800, needsImprovement: 3000 },
    ttfb: { good: 800, needsImprovement: 1800 },
    inp: { good: 200, needsImprovement: 500 },
  };

  const t = thresholds[metric];
  if (value <= t.good) return 'good';
  if (value <= t.needsImprovement) return 'needs-improvement';
  return 'poor';
}

function formatMetricValue(metric: keyof WebVitalsMetrics, value: number | null): string {
  if (value === null) return '-';
  if (metric === 'cls') return value.toFixed(3);
  return `${Math.round(value)}`;
}

function getMetricUnit(metric: keyof WebVitalsMetrics): string {
  if (metric === 'cls') return '';
  return 'ms';
}

// ============================================================================
// Sub-components
// ============================================================================

interface CircularProgressProps {
  score: number;
  size: 'small' | 'medium' | 'large';
  category: ScoreCategory;
}

function CircularProgress({ score, size, category }: CircularProgressProps): JSX.Element {
  const config = SIZE_CONFIG[size];
  const radius = (config.diameter - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const center = config.diameter / 2;

  return (
    <svg
      width={config.diameter}
      height={config.diameter}
      style={{ transform: 'rotate(-90deg)' }}
    >
      {/* Background circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--dashboard-bg, #e5e7eb)"
        strokeWidth={config.strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={CATEGORY_COLORS[category]}
        strokeWidth={config.strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        style={{
          transition: 'stroke-dashoffset 0.5s ease-out',
        }}
      />
    </svg>
  );
}

interface TrendIndicatorProps {
  currentScore: number;
  previousScore: number;
}

function TrendIndicator({ currentScore, previousScore }: TrendIndicatorProps): JSX.Element {
  const diff = currentScore - previousScore;
  const absDiff = Math.abs(diff);

  if (absDiff < 1) {
    return (
      <div style={{ ...styles.trend, ...styles.trendNeutral }}>
        <span>-</span>
        <span>No change</span>
      </div>
    );
  }

  const isUp = diff > 0;

  return (
    <div style={{ ...styles.trend, ...(isUp ? styles.trendUp : styles.trendDown) }}>
      <span>{isUp ? '+' : ''}{diff.toFixed(0)}</span>
      <span>{isUp ? 'improvement' : 'decrease'}</span>
    </div>
  );
}

interface MetricBreakdownProps {
  webVitals: WebVitalsMetrics;
}

function MetricBreakdown({ webVitals }: MetricBreakdownProps): JSX.Element {
  const metrics: Array<{ key: keyof WebVitalsMetrics; label: string }> = [
    { key: 'lcp', label: 'LCP' },
    { key: 'fid', label: 'FID' },
    { key: 'cls', label: 'CLS' },
    { key: 'fcp', label: 'FCP' },
    { key: 'ttfb', label: 'TTFB' },
    { key: 'inp', label: 'INP' },
  ];

  return (
    <div style={styles.breakdown}>
      {metrics.map(({ key, label }) => {
        const value = webVitals[key];
        const status = getMetricStatus(key, value);
        const formattedValue = formatMetricValue(key, value);
        const unit = getMetricUnit(key);

        return (
          <div key={key} style={styles.metricCard}>
            <div style={styles.metricName}>{label}</div>
            <div style={{ ...styles.metricValue, color: CATEGORY_COLORS[status] }}>
              {formattedValue}
              {unit && <span style={{ fontSize: '12px', fontWeight: 400 }}>{unit}</span>}
            </div>
            <div style={{ ...styles.metricStatus, color: CATEGORY_COLORS[status] }}>
              {CATEGORY_LABELS[status]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PerformanceScore({
  webVitals: propWebVitals,
  size = 'medium',
  showBreakdown = true,
  showTrend = false,
  previousScore,
  className,
}: PerformanceScoreProps): JSX.Element {
  const dashboardContext = useDashboard();
  const metrics = dashboardContext?.data.metrics ?? [];
  const latestMetrics = metrics[metrics.length - 1];

  const webVitals = propWebVitals ?? latestMetrics?.webVitals ?? {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null,
  };

  const score = useMemo(() => calculatePerformanceScore(webVitals), [webVitals]);
  const category = getScoreCategory(score);
  const config = SIZE_CONFIG[size];

  const hasAnyMetric = Object.values(webVitals).some((v) => v !== null);

  if (!hasAnyMetric) {
    return (
      <div className={className} style={styles.container}>
        <div style={styles.scoreContainer}>
          <CircularProgress score={0} size={size} category="poor" />
          <div style={styles.scoreText}>
            <span
              style={{
                ...styles.scoreValue,
                fontSize: config.fontSize,
                color: CATEGORY_COLORS.poor,
              }}
            >
              -
            </span>
            <span
              style={{
                ...styles.scoreLabel,
                fontSize: config.labelSize,
                color: 'var(--dashboard-text-secondary, #666)',
              }}
            >
              No Data
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={styles.container}>
      <div style={styles.scoreContainer}>
        <CircularProgress score={score} size={size} category={category} />
        <div style={styles.scoreText}>
          <span
            style={{
              ...styles.scoreValue,
              fontSize: config.fontSize,
              color: CATEGORY_COLORS[category],
            }}
          >
            {score}
          </span>
          <span
            style={{
              ...styles.scoreLabel,
              fontSize: config.labelSize,
              color: CATEGORY_COLORS[category],
            }}
          >
            {CATEGORY_LABELS[category]}
          </span>
        </div>
      </div>

      {showTrend && previousScore !== undefined && (
        <TrendIndicator currentScore={score} previousScore={previousScore} />
      )}

      {showBreakdown && <MetricBreakdown webVitals={webVitals} />}
    </div>
  );
}

// ============================================================================
// Compact Score Display
// ============================================================================

export interface CompactScoreProps {
  webVitals?: WebVitalsMetrics;
  className?: string;
}

export function CompactScore({ webVitals: propWebVitals, className }: CompactScoreProps): JSX.Element {
  const dashboardContext = useDashboard();
  const metrics = dashboardContext?.data.metrics ?? [];
  const latestMetrics = metrics[metrics.length - 1];

  const webVitals = propWebVitals ?? latestMetrics?.webVitals ?? {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null,
  };

  const score = useMemo(() => calculatePerformanceScore(webVitals), [webVitals]);
  const category = getScoreCategory(score);

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 12px',
        backgroundColor: `${CATEGORY_COLORS[category]}20`,
        borderRadius: '16px',
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: CATEGORY_COLORS[category],
        }}
      />
      <span
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: CATEGORY_COLORS[category],
        }}
      >
        {score}
      </span>
    </div>
  );
}

// ============================================================================
// Score History Chart
// ============================================================================

export interface ScoreHistoryProps {
  scores: Array<{ timestamp: number; score: number }>;
  height?: number;
  className?: string;
}

export function ScoreHistory({
  scores,
  height = 100,
  className,
}: ScoreHistoryProps): JSX.Element {
  if (scores.length === 0) {
    return (
      <div
        className={className}
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--dashboard-text-secondary, #666)',
          fontSize: '14px',
        }}
      >
        No score history available
      </div>
    );
  }

  const maxScore = 100;
  const points = scores.map((s, i) => {
    const x = (i / (scores.length - 1 || 1)) * 100;
    const y = ((maxScore - s.score) / maxScore) * 100;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M 0,100 L ${points.join(' L ')} L 100,100 Z`;

  return (
    <div className={className} style={{ height }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Threshold lines */}
        <line
          x1="0"
          y1={100 - SCORE_THRESHOLDS.good}
          x2="100"
          y2={100 - SCORE_THRESHOLDS.good}
          stroke={CATEGORY_COLORS.good}
          strokeWidth="0.5"
          strokeDasharray="2,2"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="0"
          y1={100 - SCORE_THRESHOLDS.needsImprovement}
          x2="100"
          y2={100 - SCORE_THRESHOLDS.needsImprovement}
          stroke={CATEGORY_COLORS['needs-improvement']}
          strokeWidth="0.5"
          strokeDasharray="2,2"
          vectorEffect="non-scaling-stroke"
        />

        {/* Area fill */}
        <path
          d={areaD}
          fill="url(#scoreGradient)"
          opacity="0.2"
        />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--dashboard-primary, #3b82f6)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--dashboard-primary, #3b82f6)" />
            <stop offset="100%" stopColor="var(--dashboard-primary, #3b82f6)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export {
  CircularProgress,
  TrendIndicator,
  MetricBreakdown,
  getScoreCategory,
  SCORE_THRESHOLDS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
};
