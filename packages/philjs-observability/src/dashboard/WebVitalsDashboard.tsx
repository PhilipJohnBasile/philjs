/**
 * WebVitalsDashboard - Core Web Vitals Visualization
 *
 * Displays all Core Web Vitals metrics (LCP, FID, CLS, FCP, TTFB, INP)
 * with detailed breakdowns, historical trends, and recommendations.
 */

import { signal, memo, effect } from 'philjs-core';
import { TimeSeriesChart, type TimeSeries } from '../charts/TimeSeriesChart';
import { Sparkline } from '../charts/Sparkline';
import { GaugeChart } from '../charts/GaugeChart';

// ============================================================================
// Types
// ============================================================================

export interface WebVitalsData {
  // Core Web Vitals
  lcp: number;              // Largest Contentful Paint (ms)
  fid: number;              // First Input Delay (ms)
  cls: number;              // Cumulative Layout Shift (score)

  // Additional Vitals
  fcp: number;              // First Contentful Paint (ms)
  ttfb: number;             // Time to First Byte (ms)
  inp: number;              // Interaction to Next Paint (ms)

  // History for sparklines
  lcpHistory?: number[];
  fidHistory?: number[];
  clsHistory?: number[];
  fcpHistory?: number[];
  ttfbHistory?: number[];
  inpHistory?: number[];

  // Breakdown data
  lcpBreakdown?: {
    ttfb: number;
    resourceLoadDelay: number;
    resourceLoadTime: number;
    elementRenderDelay: number;
  };

  clsBreakdown?: Array<{
    element: string;
    score: number;
    timestamp: number;
  }>;

  // Element info
  lcpElement?: string;

  // Timestamps
  timestamp: number;
}

export interface WebVitalThresholds {
  good: number;
  needsImprovement: number;
}

export interface WebVitalsDashboardProps {
  data: WebVitalsData;
  onRefresh?: () => Promise<WebVitalsData>;
  refreshInterval?: number;
  showRecommendations?: boolean;
  className?: string;
}

// ============================================================================
// Thresholds (Based on Google's recommendations)
// ============================================================================

const thresholds: Record<string, WebVitalThresholds> = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 },
  inp: { good: 200, needsImprovement: 500 },
};

// ============================================================================
// Styles
// ============================================================================

const styles = {
  dashboard: `
    background: #0f0f1a;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    height: 100%;
    display: flex;
    flex-direction: column;
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
    font-size: 12px;
    margin-top: 4px;
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
  overallScore: `
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px;
    background: linear-gradient(135deg, #1e1e3f 0%, #1a1a2e 100%);
    border-bottom: 1px solid #1a1a2e;
  `,
  scoreCircle: `
    width: 100px;
    height: 100px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 4px solid;
  `,
  scoreValue: `
    font-size: 32px;
    font-weight: 700;
  `,
  scoreLabel: `
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 2px;
  `,
  scoreDetails: `
    flex: 1;
  `,
  scoreTitle: `
    color: #ffffff;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
  `,
  scoreDescription: `
    color: #8a8aaa;
    font-size: 13px;
    line-height: 1.5;
  `,
  passingBadges: `
    display: flex;
    gap: 8px;
    margin-top: 12px;
  `,
  passingBadge: `
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
  `,
  content: `
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  `,
  vitalsGrid: `
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 32px;
  `,
  vitalCard: `
    background: linear-gradient(135deg, #1e1e3f 0%, #1a1a2e 100%);
    border: 1px solid #2a2a4a;
    border-radius: 12px;
    padding: 24px;
    transition: all 0.2s ease;
  `,
  vitalCardHover: `
    border-color: #6366f1;
    transform: translateY(-2px);
  `,
  vitalHeader: `
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  `,
  vitalName: `
    color: #8a8aaa;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  vitalFullName: `
    color: #6a6a8a;
    font-size: 11px;
    margin-top: 4px;
  `,
  vitalStatus: `
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
  `,
  vitalValue: `
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 4px;
    line-height: 1;
  `,
  vitalUnit: `
    font-size: 14px;
    color: #6a6a8a;
    margin-left: 4px;
  `,
  vitalThresholds: `
    display: flex;
    gap: 16px;
    margin-top: 16px;
    font-size: 11px;
    color: #6a6a8a;
  `,
  vitalThreshold: `
    display: flex;
    align-items: center;
    gap: 4px;
  `,
  thresholdDot: `
    width: 6px;
    height: 6px;
    border-radius: 50%;
  `,
  sparklineContainer: `
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #2a2a4a;
  `,
  section: `
    margin-bottom: 32px;
  `,
  sectionTitle: `
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  breakdownContainer: `
    background: #1a1a2e;
    border-radius: 12px;
    padding: 20px;
  `,
  breakdownBar: `
    display: flex;
    height: 32px;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 16px;
  `,
  breakdownSegment: `
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    color: white;
    min-width: 40px;
    transition: opacity 0.2s ease;
  `,
  breakdownLegend: `
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  `,
  breakdownLegendItem: `
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #a0a0c0;
  `,
  breakdownLegendDot: `
    width: 12px;
    height: 12px;
    border-radius: 3px;
  `,
  clsShift: `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #0f0f1a;
    border-radius: 8px;
    margin-bottom: 8px;
  `,
  clsShiftElement: `
    color: #e0e0ff;
    font-size: 13px;
    font-family: 'SF Mono', 'Monaco', monospace;
  `,
  clsShiftScore: `
    font-size: 13px;
    font-weight: 600;
  `,
  recommendations: `
    background: #1a1a2e;
    border-radius: 12px;
    padding: 20px;
  `,
  recommendation: `
    display: flex;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid #2a2a4a;
  `,
  recommendationLast: `
    border-bottom: none;
  `,
  recommendationIcon: `
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  `,
  recommendationContent: `
    flex: 1;
  `,
  recommendationTitle: `
    color: #e0e0ff;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
  `,
  recommendationText: `
    color: #8a8aaa;
    font-size: 12px;
    line-height: 1.5;
  `,
  recommendationImpact: `
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    margin-top: 8px;
  `,
  historyChart: `
    background: #1a1a2e;
    border-radius: 12px;
    padding: 20px;
  `,
  tabs: `
    display: flex;
    gap: 4px;
    padding: 4px;
    background: #0f0f1a;
    border-radius: 8px;
    margin-bottom: 16px;
  `,
  tab: `
    padding: 8px 16px;
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
  elementInfo: `
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #0f0f1a;
    border-radius: 8px;
    margin-top: 16px;
  `,
  elementLabel: `
    color: #6a6a8a;
    font-size: 11px;
    text-transform: uppercase;
  `,
  elementValue: `
    color: #e0e0ff;
    font-size: 13px;
    font-family: 'SF Mono', 'Monaco', monospace;
  `,
};

// ============================================================================
// Helper Functions
// ============================================================================

function getVitalStatus(value: number, vital: string): 'good' | 'needs-improvement' | 'poor' {
  const t = thresholds[vital];
  if (!t) return 'good';

  if (vital === 'cls') {
    if (value <= t.good) return 'good';
    if (value <= t.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  if (value <= t.good) return 'good';
  if (value <= t.needsImprovement) return 'needs-improvement';
  return 'poor';
}

function getStatusColor(status: 'good' | 'needs-improvement' | 'poor'): string {
  switch (status) {
    case 'good': return '#22c55e';
    case 'needs-improvement': return '#f59e0b';
    case 'poor': return '#ef4444';
  }
}

function getStatusBg(status: 'good' | 'needs-improvement' | 'poor'): string {
  switch (status) {
    case 'good': return '#22c55e22';
    case 'needs-improvement': return '#f59e0b22';
    case 'poor': return '#ef444422';
  }
}

function formatValue(value: number, vital: string): string {
  if (vital === 'cls') {
    return value.toFixed(3);
  }
  if (value < 1) return '<1';
  if (value < 1000) return Math.round(value).toString();
  return (value / 1000).toFixed(2);
}

function getUnit(vital: string): string {
  if (vital === 'cls') return '';
  if (['lcp', 'fid', 'fcp', 'ttfb', 'inp'].includes(vital)) {
    return 'ms';
  }
  return '';
}

function getVitalFullName(vital: string): string {
  switch (vital) {
    case 'lcp': return 'Largest Contentful Paint';
    case 'fid': return 'First Input Delay';
    case 'cls': return 'Cumulative Layout Shift';
    case 'fcp': return 'First Contentful Paint';
    case 'ttfb': return 'Time to First Byte';
    case 'inp': return 'Interaction to Next Paint';
    default: return vital.toUpperCase();
  }
}

function calculateOverallScore(data: WebVitalsData): number {
  let score = 100;
  const vitals = ['lcp', 'fid', 'cls', 'fcp', 'ttfb', 'inp'] as const;

  for (const vital of vitals) {
    const value = data[vital];
    const status = getVitalStatus(value, vital);

    if (status === 'poor') score -= 20;
    else if (status === 'needs-improvement') score -= 10;
  }

  return Math.max(0, score);
}

function generateRecommendations(data: WebVitalsData): Array<{
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  vital: string;
}> {
  const recommendations = [];

  // LCP recommendations
  if (getVitalStatus(data.lcp, 'lcp') !== 'good') {
    if (data.lcpBreakdown && data.lcpBreakdown.resourceLoadTime > data.lcp * 0.4) {
      recommendations.push({
        title: 'Optimize LCP resource loading',
        description: 'The LCP element takes too long to load. Consider using preload for critical resources, optimizing images, or using a CDN.',
        impact: 'high' as const,
        vital: 'lcp',
      });
    }
    if (data.lcpBreakdown && data.lcpBreakdown.ttfb > 800) {
      recommendations.push({
        title: 'Reduce server response time',
        description: 'High TTFB is impacting LCP. Optimize your server, use caching, or consider edge deployment.',
        impact: 'high' as const,
        vital: 'lcp',
      });
    }
  }

  // FID recommendations
  if (getVitalStatus(data.fid, 'fid') !== 'good') {
    recommendations.push({
      title: 'Reduce JavaScript execution time',
      description: 'Break up long tasks, defer non-critical JavaScript, and use web workers for heavy computations.',
      impact: 'high' as const,
      vital: 'fid',
    });
  }

  // CLS recommendations
  if (getVitalStatus(data.cls, 'cls') !== 'good') {
    recommendations.push({
      title: 'Prevent layout shifts',
      description: 'Set explicit dimensions for images and embeds, avoid inserting content above existing content, and use transform animations.',
      impact: 'medium' as const,
      vital: 'cls',
    });
  }

  // TTFB recommendations
  if (getVitalStatus(data.ttfb, 'ttfb') !== 'good') {
    recommendations.push({
      title: 'Improve Time to First Byte',
      description: 'Use server-side caching, optimize database queries, use a CDN, or consider static generation.',
      impact: 'medium' as const,
      vital: 'ttfb',
    });
  }

  // INP recommendations
  if (getVitalStatus(data.inp, 'inp') !== 'good') {
    recommendations.push({
      title: 'Optimize interaction responsiveness',
      description: 'Minimize main thread work, use requestIdleCallback, debounce event handlers, and yield to the main thread regularly.',
      impact: 'high' as const,
      vital: 'inp',
    });
  }

  return recommendations;
}

// ============================================================================
// Component
// ============================================================================

export function WebVitalsDashboard(props: WebVitalsDashboardProps) {
  const {
    data,
    onRefresh,
    refreshInterval = 0,
    showRecommendations = true,
    className = '',
  } = props;

  const currentData = signal(data);
  const isLoading = signal(false);
  const selectedVital = signal<string | null>(null);
  const historyTab = signal<'lcp' | 'fid' | 'cls'>('lcp');

  // Auto-refresh
  if (onRefresh && refreshInterval > 0) {
    effect(() => {
      const interval = setInterval(async () => {
        isLoading.set(true);
        try {
          const newData = await onRefresh();
          currentData.set(newData);
        } finally {
          isLoading.set(false);
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    });
  }

  const overallScore = memo(() => calculateOverallScore(currentData()));
  const recommendations = memo(() => generateRecommendations(currentData()));

  const passingVitals = memo(() => {
    const d = currentData();
    return {
      lcp: getVitalStatus(d.lcp, 'lcp') === 'good',
      fid: getVitalStatus(d.fid, 'fid') === 'good',
      cls: getVitalStatus(d.cls, 'cls') === 'good',
    };
  });

  const handleRefresh = async () => {
    if (!onRefresh) return;
    isLoading.set(true);
    try {
      const newData = await onRefresh();
      currentData.set(newData);
    } finally {
      isLoading.set(false);
    }
  };

  const renderVitalCard = (vital: string, value: number, history?: number[]) => {
    const status = getVitalStatus(value, vital);
    const color = getStatusColor(status);
    const bg = getStatusBg(status);
    const t = thresholds[vital];

    return (
      <div style={styles.vitalCard}>
        <div style={styles.vitalHeader}>
          <div>
            <div style={styles.vitalName}>{vital.toUpperCase()}</div>
            <div style={styles.vitalFullName}>{getVitalFullName(vital)}</div>
          </div>
          <div style={styles.vitalStatus + `background: ${bg}; color: ${color};`}>
            {status === 'good' ? 'Good' : status === 'needs-improvement' ? 'Needs Work' : 'Poor'}
          </div>
        </div>

        <div style={styles.vitalValue + `color: ${color};`}>
          {formatValue(value, vital)}
          <span style={styles.vitalUnit}>{getUnit(vital)}</span>
        </div>

        {t && (
          <div style={styles.vitalThresholds}>
            <div style={styles.vitalThreshold}>
              <span style={styles.thresholdDot + 'background: #22c55e;'} />
              Good: {vital === 'cls' ? `<${t.good}` : `<${t.good}ms`}
            </div>
            <div style={styles.vitalThreshold}>
              <span style={styles.thresholdDot + 'background: #f59e0b;'} />
              Improve: {vital === 'cls' ? `<${t.needsImprovement}` : `<${t.needsImprovement}ms`}
            </div>
          </div>
        )}

        {history && history.length > 1 && (
          <div style={styles.sparklineContainer}>
            <Sparkline
              data={history}
              width={200}
              height={40}
              color={color}
              showArea={true}
            />
          </div>
        )}
      </div>
    );
  };

  const d = currentData();
  const scoreColor = overallScore() >= 90 ? '#22c55e' :
                     overallScore() >= 70 ? '#84cc16' :
                     overallScore() >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div style={styles.dashboard} class={className}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Core Web Vitals</h2>
          <div style={styles.subtitle}>
            Last updated: {new Date(d.timestamp).toLocaleTimeString()}
          </div>
        </div>
        <div style={styles.controls}>
          {onRefresh && (
            <button style={styles.button} onClick={handleRefresh} disabled={isLoading()}>
              {isLoading() ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* Overall Score */}
      <div style={styles.overallScore}>
        <div style={styles.scoreCircle + `border-color: ${scoreColor};`}>
          <div style={styles.scoreValue + `color: ${scoreColor};`}>
            {overallScore()}
          </div>
          <div style={styles.scoreLabel + `color: ${scoreColor};`}>
            Score
          </div>
        </div>
        <div style={styles.scoreDetails}>
          <div style={styles.scoreTitle}>
            {overallScore() >= 90 ? 'Excellent Performance' :
             overallScore() >= 70 ? 'Good Performance' :
             overallScore() >= 50 ? 'Needs Improvement' : 'Poor Performance'}
          </div>
          <div style={styles.scoreDescription}>
            {overallScore() >= 90
              ? 'Your page passes all Core Web Vitals assessments. Users experience fast, responsive interactions.'
              : 'Some metrics need attention to provide an optimal user experience. Check the recommendations below.'}
          </div>
          <div style={styles.passingBadges}>
            <span style={styles.passingBadge + `background: ${passingVitals().lcp ? '#22c55e22' : '#ef444422'}; color: ${passingVitals().lcp ? '#22c55e' : '#ef4444'};`}>
              LCP {passingVitals().lcp ? 'Passed' : 'Failed'}
            </span>
            <span style={styles.passingBadge + `background: ${passingVitals().fid ? '#22c55e22' : '#ef444422'}; color: ${passingVitals().fid ? '#22c55e' : '#ef4444'};`}>
              FID {passingVitals().fid ? 'Passed' : 'Failed'}
            </span>
            <span style={styles.passingBadge + `background: ${passingVitals().cls ? '#22c55e22' : '#ef444422'}; color: ${passingVitals().cls ? '#22c55e' : '#ef4444'};`}>
              CLS {passingVitals().cls ? 'Passed' : 'Failed'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Core Web Vitals Grid */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Core Web Vitals</div>
          <div style={styles.vitalsGrid}>
            {renderVitalCard('lcp', d.lcp, d.lcpHistory)}
            {renderVitalCard('fid', d.fid, d.fidHistory)}
            {renderVitalCard('cls', d.cls, d.clsHistory)}
          </div>
        </div>

        {/* Additional Vitals */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Additional Metrics</div>
          <div style={styles.vitalsGrid}>
            {renderVitalCard('fcp', d.fcp, d.fcpHistory)}
            {renderVitalCard('ttfb', d.ttfb, d.ttfbHistory)}
            {renderVitalCard('inp', d.inp, d.inpHistory)}
          </div>
        </div>

        {/* LCP Breakdown */}
        {d.lcpBreakdown && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>LCP Breakdown</div>
            <div style={styles.breakdownContainer}>
              <div style={styles.breakdownBar}>
                <div
                  style={styles.breakdownSegment + `background: #6366f1; width: ${(d.lcpBreakdown.ttfb / d.lcp) * 100}%;`}
                  title={`TTFB: ${d.lcpBreakdown.ttfb}ms`}
                >
                  {d.lcpBreakdown.ttfb > d.lcp * 0.1 ? `${Math.round(d.lcpBreakdown.ttfb)}ms` : ''}
                </div>
                <div
                  style={styles.breakdownSegment + `background: #8b5cf6; width: ${(d.lcpBreakdown.resourceLoadDelay / d.lcp) * 100}%;`}
                  title={`Resource Load Delay: ${d.lcpBreakdown.resourceLoadDelay}ms`}
                >
                  {d.lcpBreakdown.resourceLoadDelay > d.lcp * 0.1 ? `${Math.round(d.lcpBreakdown.resourceLoadDelay)}ms` : ''}
                </div>
                <div
                  style={styles.breakdownSegment + `background: #ec4899; width: ${(d.lcpBreakdown.resourceLoadTime / d.lcp) * 100}%;`}
                  title={`Resource Load Time: ${d.lcpBreakdown.resourceLoadTime}ms`}
                >
                  {d.lcpBreakdown.resourceLoadTime > d.lcp * 0.1 ? `${Math.round(d.lcpBreakdown.resourceLoadTime)}ms` : ''}
                </div>
                <div
                  style={styles.breakdownSegment + `background: #f59e0b; width: ${(d.lcpBreakdown.elementRenderDelay / d.lcp) * 100}%;`}
                  title={`Element Render Delay: ${d.lcpBreakdown.elementRenderDelay}ms`}
                >
                  {d.lcpBreakdown.elementRenderDelay > d.lcp * 0.1 ? `${Math.round(d.lcpBreakdown.elementRenderDelay)}ms` : ''}
                </div>
              </div>
              <div style={styles.breakdownLegend}>
                <div style={styles.breakdownLegendItem}>
                  <span style={styles.breakdownLegendDot + 'background: #6366f1;'} />
                  TTFB ({Math.round(d.lcpBreakdown.ttfb)}ms)
                </div>
                <div style={styles.breakdownLegendItem}>
                  <span style={styles.breakdownLegendDot + 'background: #8b5cf6;'} />
                  Resource Load Delay ({Math.round(d.lcpBreakdown.resourceLoadDelay)}ms)
                </div>
                <div style={styles.breakdownLegendItem}>
                  <span style={styles.breakdownLegendDot + 'background: #ec4899;'} />
                  Resource Load Time ({Math.round(d.lcpBreakdown.resourceLoadTime)}ms)
                </div>
                <div style={styles.breakdownLegendItem}>
                  <span style={styles.breakdownLegendDot + 'background: #f59e0b;'} />
                  Element Render Delay ({Math.round(d.lcpBreakdown.elementRenderDelay)}ms)
                </div>
              </div>

              {d.lcpElement && (
                <div style={styles.elementInfo}>
                  <span style={styles.elementLabel}>LCP Element:</span>
                  <span style={styles.elementValue}>{d.lcpElement}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CLS Shifts */}
        {d.clsBreakdown && d.clsBreakdown.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Layout Shifts</div>
            <div style={styles.breakdownContainer}>
              {d.clsBreakdown.slice(0, 5).map(shift => {
                const shiftColor = shift.score > 0.1 ? '#ef4444' : shift.score > 0.05 ? '#f59e0b' : '#22c55e';
                return (
                  <div style={styles.clsShift}>
                    <span style={styles.clsShiftElement}>{shift.element}</span>
                    <span style={styles.clsShiftScore + `color: ${shiftColor};`}>
                      {shift.score.toFixed(4)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                    <div style={styles.recommendationIcon + `background: ${colors.bg}; color: ${colors.text};`}>
                      {rec.impact === 'high' ? '!' : rec.impact === 'medium' ? '*' : 'i'}
                    </div>
                    <div style={styles.recommendationContent}>
                      <div style={styles.recommendationTitle}>{rec.title}</div>
                      <div style={styles.recommendationText}>{rec.description}</div>
                      <span style={styles.recommendationImpact + `background: ${colors.bg}; color: ${colors.text};`}>
                        {rec.impact.toUpperCase()} IMPACT - {rec.vital.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* History Chart */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Historical Trends</div>
          <div style={styles.historyChart}>
            <div style={styles.tabs}>
              {(['lcp', 'fid', 'cls'] as const).map(vital => (
                <button
                  style={styles.tab + (historyTab() === vital ? styles.tabActive : '')}
                  onClick={() => historyTab.set(vital)}
                >
                  {vital.toUpperCase()}
                </button>
              ))}
            </div>

            {historyTab() === 'lcp' && d.lcpHistory && d.lcpHistory.length > 0 && (
              <TimeSeriesChart
                series={[{
                  id: 'lcp',
                  name: 'LCP',
                  data: d.lcpHistory.map((value, i) => ({
                    timestamp: d.timestamp - (d.lcpHistory!.length - i - 1) * 60000,
                    value,
                  })),
                  color: getStatusColor(getVitalStatus(d.lcp, 'lcp')),
                }]}
                width={600}
                height={200}
                showLegend={false}
              />
            )}

            {historyTab() === 'fid' && d.fidHistory && d.fidHistory.length > 0 && (
              <TimeSeriesChart
                series={[{
                  id: 'fid',
                  name: 'FID',
                  data: d.fidHistory.map((value, i) => ({
                    timestamp: d.timestamp - (d.fidHistory!.length - i - 1) * 60000,
                    value,
                  })),
                  color: getStatusColor(getVitalStatus(d.fid, 'fid')),
                }]}
                width={600}
                height={200}
                showLegend={false}
              />
            )}

            {historyTab() === 'cls' && d.clsHistory && d.clsHistory.length > 0 && (
              <TimeSeriesChart
                series={[{
                  id: 'cls',
                  name: 'CLS',
                  data: d.clsHistory.map((value, i) => ({
                    timestamp: d.timestamp - (d.clsHistory!.length - i - 1) * 60000,
                    value,
                  })),
                  color: getStatusColor(getVitalStatus(d.cls, 'cls')),
                }]}
                width={600}
                height={200}
                showLegend={false}
                formatValue={(v) => v.toFixed(3)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WebVitalsDashboard;
