/**
 * PerformancePanel - Core Web Vitals and performance metrics
 *
 * Displays FCP, LCP, CLS, FID, TTFB and other performance
 * metrics with scoring and recommendations.
 */

import { signal, memo, effect } from 'philjs-core';
import type { PerformanceMetrics } from '../index';
import { TimeSeriesChart, type TimeSeries } from '../charts/TimeSeriesChart';
import { Histogram } from '../charts/Histogram';
import { MetricCard } from '../widgets/MetricCard';
import { Sparkline } from '../charts/Sparkline';

// ============================================================================
// Types
// ============================================================================

export interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  thresholds: { good: number; poor: number };
  unit: string;
  description: string;
  history?: number[];
}

export interface PerformancePanelProps {
  metrics: PerformanceMetrics;
  history?: PerformanceMetrics[];
  onRefresh?: () => Promise<PerformanceMetrics>;
  showRecommendations?: boolean;
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
  subtitle: `
    color: #6a6a8a;
    font-size: 13px;
    margin-top: 4px;
  `,
  score: `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  `,
  scoreValue: `
    font-size: 48px;
    font-weight: 700;
    line-height: 1;
  `,
  scoreLabel: `
    font-size: 11px;
    color: #6a6a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  content: `
    padding: 24px;
  `,
  section: `
    margin-bottom: 32px;
  `,
  sectionTitle: `
    color: #8a8aaa;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 16px;
  `,
  vitalsGrid: `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  `,
  vitalCard: `
    background: linear-gradient(135deg, #1e1e3f 0%, #1a1a2e 100%);
    border: 1px solid #2a2a4a;
    border-radius: 12px;
    padding: 20px;
  `,
  vitalHeader: `
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  `,
  vitalName: `
    color: #8a8aaa;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  vitalRating: `
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    text-transform: uppercase;
  `,
  vitalValue: `
    font-size: 36px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 4px;
  `,
  vitalUnit: `
    font-size: 14px;
    color: #6a6a8a;
    font-weight: 500;
    margin-left: 4px;
  `,
  vitalDescription: `
    font-size: 12px;
    color: #6a6a8a;
    margin-top: 12px;
    line-height: 1.4;
  `,
  vitalThresholds: `
    display: flex;
    gap: 16px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #2a2a4a;
    font-size: 11px;
  `,
  vitalThreshold: `
    display: flex;
    align-items: center;
    gap: 4px;
    color: #6a6a8a;
  `,
  thresholdDot: `
    width: 8px;
    height: 8px;
    border-radius: 50%;
  `,
  gauge: `
    position: relative;
    height: 8px;
    background: #2a2a4a;
    border-radius: 4px;
    margin-top: 12px;
    overflow: hidden;
  `,
  gaugeBar: `
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  `,
  gaugeMarker: `
    position: absolute;
    top: -4px;
    width: 2px;
    height: 16px;
    background: #ffffff;
    border-radius: 1px;
    transform: translateX(-50%);
  `,
  recommendations: `
    background: #1a1a2e;
    border-radius: 12px;
    padding: 20px;
  `,
  recommendationsTitle: `
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
  `,
  recommendation: `
    display: flex;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #2a2a4a;
  `,
  recommendationLast: `
    border-bottom: none;
  `,
  recommendationIcon: `
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  `,
  recommendationContent: `
    flex: 1;
  `,
  recommendationTitle: `
    color: #e0e0ff;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 4px;
  `,
  recommendationText: `
    color: #6a6a8a;
    font-size: 12px;
    line-height: 1.4;
  `,
  recommendationImpact: `
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 600;
    margin-left: 8px;
  `,
  chart: `
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
  emptyState: `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #6a6a8a;
    text-align: center;
  `,
  refreshButton: `
    background: #2a2a4e;
    border: 1px solid #3a3a6e;
    border-radius: 6px;
    color: #e0e0ff;
    padding: 8px 16px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  `,
};

// ============================================================================
// Rating Colors
// ============================================================================

const ratingColors = {
  good: { bg: '#22c55e22', text: '#22c55e' },
  'needs-improvement': { bg: '#f59e0b22', text: '#f59e0b' },
  poor: { bg: '#ef444422', text: '#ef4444' },
};

// ============================================================================
// Web Vitals Thresholds
// ============================================================================

const vitalsConfig = {
  fcp: {
    name: 'First Contentful Paint',
    shortName: 'FCP',
    thresholds: { good: 1800, poor: 3000 },
    unit: 'ms',
    description: 'Time until the first text or image is painted',
  },
  lcp: {
    name: 'Largest Contentful Paint',
    shortName: 'LCP',
    thresholds: { good: 2500, poor: 4000 },
    unit: 'ms',
    description: 'Time until the largest content element is visible',
  },
  fid: {
    name: 'First Input Delay',
    shortName: 'FID',
    thresholds: { good: 100, poor: 300 },
    unit: 'ms',
    description: 'Time from first interaction to browser response',
  },
  cls: {
    name: 'Cumulative Layout Shift',
    shortName: 'CLS',
    thresholds: { good: 0.1, poor: 0.25 },
    unit: '',
    description: 'Measure of visual stability during page load',
  },
  ttfb: {
    name: 'Time to First Byte',
    shortName: 'TTFB',
    thresholds: { good: 800, poor: 1800 },
    unit: 'ms',
    description: 'Time until the first byte is received from the server',
  },
  tti: {
    name: 'Time to Interactive',
    shortName: 'TTI',
    thresholds: { good: 3800, poor: 7300 },
    unit: 'ms',
    description: 'Time until the page is fully interactive',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function getRating(value: number, thresholds: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

function calculateOverallScore(metrics: PerformanceMetrics): number {
  let score = 100;
  let count = 0;

  const vitals = ['fcp', 'lcp', 'fid', 'cls', 'ttfb'] as const;

  for (const vital of vitals) {
    const value = metrics[vital];
    if (value === undefined) continue;

    const config = vitalsConfig[vital];
    const rating = getRating(value, config.thresholds);

    if (rating === 'good') score += 0;
    else if (rating === 'needs-improvement') score -= 15;
    else score -= 30;

    count++;
  }

  return Math.max(0, Math.min(100, count > 0 ? Math.round(score / (count / vitals.length)) : 0));
}

function formatValue(value: number | undefined, unit: string): string {
  if (value === undefined) return '-';
  if (unit === '') return value.toFixed(3);
  if (value >= 1000) return `${(value / 1000).toFixed(2)}`;
  return value.toFixed(0);
}

function getDisplayUnit(value: number | undefined, unit: string): string {
  if (value === undefined || unit === '') return unit;
  if (value >= 1000 && unit === 'ms') return 's';
  return unit;
}

function generateRecommendations(metrics: PerformanceMetrics): Array<{
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'lcp' | 'fid' | 'cls' | 'general';
}> {
  const recommendations = [];

  if (metrics.lcp && metrics.lcp > 2500) {
    recommendations.push({
      title: 'Optimize Largest Contentful Paint',
      description: 'Consider preloading critical assets, optimizing images, and reducing server response times.',
      impact: 'high' as const,
      category: 'lcp' as const,
    });
  }

  if (metrics.fid && metrics.fid > 100) {
    recommendations.push({
      title: 'Reduce First Input Delay',
      description: 'Break up long JavaScript tasks, use web workers, and defer non-critical scripts.',
      impact: 'high' as const,
      category: 'fid' as const,
    });
  }

  if (metrics.cls && metrics.cls > 0.1) {
    recommendations.push({
      title: 'Minimize Layout Shifts',
      description: 'Set explicit dimensions for images and embeds, avoid inserting content above existing content.',
      impact: 'medium' as const,
      category: 'cls' as const,
    });
  }

  if (metrics.fcp && metrics.fcp > 1800) {
    recommendations.push({
      title: 'Improve First Contentful Paint',
      description: 'Eliminate render-blocking resources, minimize CSS, and use a CDN.',
      impact: 'medium' as const,
      category: 'general' as const,
    });
  }

  if (metrics.ttfb && metrics.ttfb > 800) {
    recommendations.push({
      title: 'Reduce Server Response Time',
      description: 'Optimize server-side code, use caching, and consider edge locations.',
      impact: 'medium' as const,
      category: 'general' as const,
    });
  }

  return recommendations;
}

// ============================================================================
// Component
// ============================================================================

export function PerformancePanel(props: PerformancePanelProps) {
  const {
    metrics,
    history = [],
    onRefresh,
    showRecommendations = true,
    className = '',
  } = props;

  const isLoading = signal(false);

  const overallScore = memo(() => calculateOverallScore(metrics));

  const scoreColor = memo(() => {
    const score = overallScore();
    if (score >= 90) return ratingColors.good.text;
    if (score >= 50) return ratingColors['needs-improvement'].text;
    return ratingColors.poor.text;
  });

  const vitals = memo(() => {
    const result: WebVital[] = [];

    for (const [key, config] of Object.entries(vitalsConfig)) {
      const value = metrics[key as keyof PerformanceMetrics];
      if (value === undefined) continue;

      const rating = getRating(value, config.thresholds);
      const historyValues = history
        .map(h => h[key as keyof PerformanceMetrics])
        .filter((v): v is number => v !== undefined);

      result.push({
        name: config.name,
        value,
        rating,
        thresholds: config.thresholds,
        unit: config.unit,
        description: config.description,
        history: historyValues.length > 0 ? historyValues : undefined,
      });
    }

    return result;
  });

  const recommendations = memo(() => {
    if (!showRecommendations) return [];
    return generateRecommendations(metrics);
  });

  const handleRefresh = async () => {
    if (!onRefresh) return;
    isLoading.set(true);
    try {
      await onRefresh();
    } finally {
      isLoading.set(false);
    }
  };

  const hasMetrics = Object.values(metrics).some(v => v !== undefined);

  if (!hasMetrics) {
    return (
      <div style={styles.panel} class={className}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Performance</h2>
            <p style={styles.subtitle}>Core Web Vitals</p>
          </div>
          {onRefresh && (
            <button style={styles.refreshButton} onClick={handleRefresh} disabled={isLoading()}>
              {isLoading() ? 'Loading...' : 'Measure'}
            </button>
          )}
        </div>
        <div style={styles.emptyState}>
          <div style="font-size: 16px; margin-bottom: 8px; color: #8a8aaa;">
            No performance data available
          </div>
          <div style="font-size: 13px;">
            Performance metrics will be collected automatically on page load
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.panel} class={className}>
      {/* Header with Overall Score */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Performance</h2>
          <p style={styles.subtitle}>Core Web Vitals & Performance Metrics</p>
        </div>
        <div style={styles.score}>
          <span style={styles.scoreValue + `color: ${scoreColor()};`}>{overallScore()}</span>
          <span style={styles.scoreLabel}>Overall Score</span>
        </div>
      </div>

      <div style={styles.content}>
        {/* Web Vitals */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Core Web Vitals</div>
          <div style={styles.vitalsGrid}>
            {vitals().map(vital => {
              const colors = ratingColors[vital.rating];
              const gaugePercent = Math.min(100, (vital.value / vital.thresholds.poor) * 100);
              const goodPercent = (vital.thresholds.good / vital.thresholds.poor) * 100;

              return (
                <div style={styles.vitalCard}>
                  <div style={styles.vitalHeader}>
                    <span style={styles.vitalName}>{vital.name}</span>
                    <span
                      style={styles.vitalRating + `background: ${colors.bg}; color: ${colors.text};`}
                    >
                      {vital.rating.replace('-', ' ')}
                    </span>
                  </div>

                  <div>
                    <span style={styles.vitalValue + `color: ${colors.text};`}>
                      {formatValue(vital.value, vital.unit)}
                    </span>
                    <span style={styles.vitalUnit}>
                      {getDisplayUnit(vital.value, vital.unit)}
                    </span>
                  </div>

                  {/* Progress Gauge */}
                  <div style={styles.gauge}>
                    <div
                      style={styles.gaugeBar + `
                        width: ${Math.min(gaugePercent, 100)}%;
                        background: ${colors.text};
                      `}
                    />
                    {/* Good threshold marker */}
                    <div
                      style={styles.gaugeMarker + `left: ${goodPercent}%; background: #22c55e;`}
                      title={`Good: < ${vital.thresholds.good}${vital.unit}`}
                    />
                  </div>

                  {/* History sparkline */}
                  {vital.history && vital.history.length > 1 && (
                    <div style="margin-top: 12px;">
                      <Sparkline
                        data={vital.history}
                        width={180}
                        height={30}
                        color={colors.text}
                        showArea={true}
                      />
                    </div>
                  )}

                  <div style={styles.vitalDescription}>{vital.description}</div>

                  <div style={styles.vitalThresholds}>
                    <div style={styles.vitalThreshold}>
                      <span style={styles.thresholdDot + 'background: #22c55e;'} />
                      <span>Good: {'<'} {vital.thresholds.good}{vital.unit}</span>
                    </div>
                    <div style={styles.vitalThreshold}>
                      <span style={styles.thresholdDot + 'background: #ef4444;'} />
                      <span>Poor: {'>'} {vital.thresholds.poor}{vital.unit}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        {showRecommendations && recommendations().length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Recommendations</div>
            <div style={styles.recommendations}>
              {recommendations().map((rec, i) => {
                const impactColors = {
                  high: { bg: '#ef444422', text: '#ef4444' },
                  medium: { bg: '#f59e0b22', text: '#f59e0b' },
                  low: { bg: '#22c55e22', text: '#22c55e' },
                };
                const colors = impactColors[rec.impact];

                return (
                  <div
                    style={styles.recommendation +
                      (i === recommendations().length - 1 ? styles.recommendationLast : '')}
                  >
                    <div
                      style={styles.recommendationIcon + `background: ${colors.bg}; color: ${colors.text};`}
                    >
                      !
                    </div>
                    <div style={styles.recommendationContent}>
                      <div style={styles.recommendationTitle}>
                        {rec.title}
                        <span
                          style={styles.recommendationImpact + `background: ${colors.bg}; color: ${colors.text};`}
                        >
                          {rec.impact} impact
                        </span>
                      </div>
                      <div style={styles.recommendationText}>{rec.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Historical Chart */}
        {history.length > 1 && (
          <div style={styles.chart}>
            <div style={styles.chartTitle}>Performance Over Time</div>
            <TimeSeriesChart
              series={[
                {
                  id: 'lcp',
                  name: 'LCP',
                  data: history
                    .filter(h => h.lcp !== undefined)
                    .map((h, i) => ({
                      timestamp: Date.now() - (history.length - i) * 3600000,
                      value: h.lcp!,
                    })),
                  color: '#6366f1',
                },
                {
                  id: 'fcp',
                  name: 'FCP',
                  data: history
                    .filter(h => h.fcp !== undefined)
                    .map((h, i) => ({
                      timestamp: Date.now() - (history.length - i) * 3600000,
                      value: h.fcp!,
                    })),
                  color: '#22c55e',
                },
              ]}
              width={600}
              height={250}
              showLegend={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default PerformancePanel;
