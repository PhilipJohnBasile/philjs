/**
 * Histogram - Bar chart for distribution visualization
 */

export interface HistogramBucket {
  label: string;
  value: number;
  color?: string;
}

export interface HistogramProps {
  buckets: HistogramBucket[];
  width?: number;
  height?: number;
  barColor?: string;
  showValues?: boolean;
  showLabels?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  className?: string;
}

export function Histogram(props: HistogramProps): string {
  const {
    buckets,
    width = 500,
    height = 300,
    barColor = '#4a90d9',
    showValues = true,
    showLabels = true,
    xAxisLabel,
    yAxisLabel,
    className = '',
  } = props;

  const padding = { top: 20, right: 20, bottom: 50, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...buckets.map((b) => b.value));
  const barWidth = chartWidth / buckets.length - 4;

  const bars = buckets.map((bucket, i) => {
    const x = padding.left + i * (chartWidth / buckets.length) + 2;
    const barHeight = (bucket.value / maxValue) * chartHeight;
    const y = padding.top + chartHeight - barHeight;
    const color = bucket.color || barColor;

    return `
      <g>
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" />
        ${showValues ? `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="10">${bucket.value}</text>` : ''}
        ${showLabels ? `<text x="${x + barWidth / 2}" y="${padding.top + chartHeight + 15}" text-anchor="middle" font-size="10" transform="rotate(-45, ${x + barWidth / 2}, ${padding.top + chartHeight + 15})">${bucket.label}</text>` : ''}
      </g>
    `;
  });

  return `
    <svg width="${width}" height="${height}" class="${className}" xmlns="http://www.w3.org/2000/svg">
      ${bars.join('')}
      <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="#333" />
      <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}" stroke="#333" />
      ${xAxisLabel ? `<text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-size="12">${xAxisLabel}</text>` : ''}
      ${yAxisLabel ? `<text x="15" y="${height / 2}" transform="rotate(-90, 15, ${height / 2})" text-anchor="middle" font-size="12">${yAxisLabel}</text>` : ''}
    </svg>
  `;
}
