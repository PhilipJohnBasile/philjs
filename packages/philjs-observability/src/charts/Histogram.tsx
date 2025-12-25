/**
 * Histogram - Distribution visualization component
 *
 * Displays the distribution of values in buckets with
 * support for percentile markers and tooltips.
 */

import { signal } from 'philjs-core';

// ============================================================================
// Types
// ============================================================================

export interface HistogramBucket {
  min: number;
  max: number;
  count: number;
}

export interface HistogramProps {
  buckets: HistogramBucket[];
  width?: number;
  height?: number;
  color?: string;
  highlightColor?: string;
  showPercentiles?: boolean;
  percentiles?: number[]; // e.g., [50, 90, 99]
  formatValue?: (value: number) => string;
  title?: string;
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: `
    background: #1a1a2e;
    border-radius: 8px;
    padding: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,
  title: `
    color: #e0e0ff;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
  `,
  svg: `
    display: block;
    width: 100%;
    height: auto;
  `,
  bar: `
    transition: fill 0.2s ease;
    cursor: pointer;
  `,
  axis: `
    stroke: #4a4a6a;
    stroke-width: 1;
  `,
  axisLabel: `
    fill: #8a8aaa;
    font-size: 10px;
  `,
  percentileLine: `
    stroke-width: 2;
    stroke-dasharray: 4 2;
  `,
  percentileLabel: `
    font-size: 10px;
    font-weight: 600;
  `,
  tooltip: `
    position: absolute;
    background: #2a2a4e;
    border: 1px solid #3a3a6e;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 12px;
    color: #e0e0ff;
    pointer-events: none;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  `,
  stats: `
    display: flex;
    gap: 24px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #2a2a4a;
  `,
  stat: `
    display: flex;
    flex-direction: column;
    gap: 2px;
  `,
  statLabel: `
    font-size: 10px;
    color: #6a6a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
  statValue: `
    font-size: 14px;
    color: #e0e0ff;
    font-weight: 600;
  `,
};

// ============================================================================
// Percentile Colors
// ============================================================================

const percentileColors: Record<number, string> = {
  50: '#22c55e', // p50 - green
  75: '#f59e0b', // p75 - amber
  90: '#f97316', // p90 - orange
  95: '#ef4444', // p95 - red
  99: '#dc2626', // p99 - dark red
};

// ============================================================================
// Helper Functions
// ============================================================================

function calculatePercentile(buckets: HistogramBucket[], percentile: number): number {
  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  const targetCount = (percentile / 100) * total;

  let cumulative = 0;
  for (const bucket of buckets) {
    cumulative += bucket.count;
    if (cumulative >= targetCount) {
      // Linear interpolation within the bucket
      const prevCumulative = cumulative - bucket.count;
      const fraction = (targetCount - prevCumulative) / bucket.count;
      return bucket.min + fraction * (bucket.max - bucket.min);
    }
  }

  return buckets[buckets.length - 1]?.max || 0;
}

function formatDefaultValue(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  return `${value.toFixed(0)}ms`;
}

// ============================================================================
// Component
// ============================================================================

export function Histogram(props: HistogramProps) {
  const {
    buckets,
    width = 500,
    height = 200,
    color = '#6366f1',
    highlightColor = '#818cf8',
    showPercentiles = true,
    percentiles = [50, 90, 99],
    formatValue = formatDefaultValue,
    title,
    className = '',
  } = props;

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const hoveredBar = signal<number | null>(null);
  const tooltip = signal<{ x: number; y: number; bucket: HistogramBucket } | null>(null);

  if (buckets.length === 0) {
    return (
      <div style={styles.container} class={className}>
        {title && <div style={styles.title}>{title}</div>}
        <div style="display: flex; align-items: center; justify-content: center; height: 150px; color: #6a6a8a;">
          No data available
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...buckets.map(b => b.count));
  const minValue = buckets[0].min;
  const maxValue = buckets[buckets.length - 1].max;
  const totalCount = buckets.reduce((sum, b) => sum + b.count, 0);

  const barWidth = chartWidth / buckets.length - 2;

  // Calculate percentile positions
  const percentileMarkers = showPercentiles
    ? percentiles.map(p => ({
        percentile: p,
        value: calculatePercentile(buckets, p),
        x: padding.left + ((calculatePercentile(buckets, p) - minValue) / (maxValue - minValue)) * chartWidth,
        color: percentileColors[p] || '#8b5cf6',
      }))
    : [];

  const handleMouseEnter = (index: number, bucket: HistogramBucket, e: MouseEvent) => {
    hoveredBar.set(index);
    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    tooltip.set({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      bucket,
    });
  };

  const handleMouseLeave = () => {
    hoveredBar.set(null);
    tooltip.set(null);
  };

  return (
    <div style={styles.container + 'position: relative;'} class={className}>
      {title && <div style={styles.title}>{title}</div>}

      <svg width={width} height={height} style={styles.svg}>
        {/* Y-axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          style={styles.axis}
        />

        {/* X-axis */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          style={styles.axis}
        />

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(fraction => {
          const count = Math.round(maxCount * fraction);
          const y = padding.top + (1 - fraction) * chartHeight;
          return (
            <text x={padding.left - 10} y={y + 4} style={styles.axisLabel} text-anchor="end">
              {count}
            </text>
          );
        })}

        {/* X-axis labels */}
        {buckets.filter((_, i) => i % Math.ceil(buckets.length / 6) === 0).map((bucket, i) => {
          const x = padding.left + (i * Math.ceil(buckets.length / 6) + 0.5) * (chartWidth / buckets.length);
          return (
            <text x={x} y={height - padding.bottom + 20} style={styles.axisLabel} text-anchor="middle">
              {formatValue(bucket.min)}
            </text>
          );
        })}

        {/* Bars */}
        {buckets.map((bucket, i) => {
          const barHeight = (bucket.count / maxCount) * chartHeight;
          const x = padding.left + i * (chartWidth / buckets.length) + 1;
          const y = height - padding.bottom - barHeight;
          const isHovered = hoveredBar() === i;

          return (
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={isHovered ? highlightColor : color}
              style={styles.bar}
              rx={2}
              onMouseEnter={(e: MouseEvent) => handleMouseEnter(i, bucket, e)}
              onMouseLeave={handleMouseLeave}
            />
          );
        })}

        {/* Percentile markers */}
        {percentileMarkers.map(marker => (
          <g>
            <line
              x1={marker.x}
              y1={padding.top}
              x2={marker.x}
              y2={height - padding.bottom}
              stroke={marker.color}
              style={styles.percentileLine}
            />
            <text
              x={marker.x}
              y={padding.top - 5}
              fill={marker.color}
              style={styles.percentileLabel}
              text-anchor="middle"
            >
              p{marker.percentile}
            </text>
          </g>
        ))}
      </svg>

      {/* Stats */}
      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Total</span>
          <span style={styles.statValue}>{totalCount.toLocaleString()}</span>
        </div>
        {percentileMarkers.map(marker => (
          <div style={styles.stat}>
            <span style={styles.statLabel}>p{marker.percentile}</span>
            <span style={styles.statValue + `color: ${marker.color};`}>
              {formatValue(marker.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip() && (
        <div
          style={styles.tooltip + `left: ${tooltip()!.x}px; top: ${tooltip()!.y}px; transform: translate(-50%, -100%);`}
        >
          <div style="font-weight: 600; margin-bottom: 4px;">
            {formatValue(tooltip()!.bucket.min)} - {formatValue(tooltip()!.bucket.max)}
          </div>
          <div>Count: {tooltip()!.bucket.count.toLocaleString()}</div>
          <div style="color: #8a8aaa;">
            {((tooltip()!.bucket.count / totalCount) * 100).toFixed(1)}% of total
          </div>
        </div>
      )}
    </div>
  );
}

export default Histogram;
