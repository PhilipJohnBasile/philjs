/**
 * TimeSeriesChart - Line chart for time-series data visualization
 */

export interface DataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface TimeSeries {
  name: string;
  data: DataPoint[];
  color?: string;
  strokeWidth?: number;
}

export interface TimeSeriesChartProps {
  series: TimeSeries[];
  width?: number;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  timeFormat?: string;
  className?: string;
}

export function TimeSeriesChart(props: TimeSeriesChartProps): string {
  const {
    series,
    width = 600,
    height = 300,
    showLegend = true,
    showGrid = true,
    xAxisLabel,
    yAxisLabel,
    className = '',
  } = props;

  // Calculate bounds
  let minValue = Infinity;
  let maxValue = -Infinity;
  let minTime = Infinity;
  let maxTime = -Infinity;

  for (const s of series) {
    for (const point of s.data) {
      minValue = Math.min(minValue, point.value);
      maxValue = Math.max(maxValue, point.value);
      minTime = Math.min(minTime, point.timestamp);
      maxTime = Math.max(maxTime, point.timestamp);
    }
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const scaleX = (timestamp: number) =>
    padding.left + ((timestamp - minTime) / (maxTime - minTime)) * chartWidth;
  const scaleY = (value: number) =>
    padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;

  // Generate paths
  const paths = series.map((s, i) => {
    const color = s.color || `hsl(${(i * 60) % 360}, 70%, 50%)`;
    const strokeWidth = s.strokeWidth || 2;
    const d = s.data
      .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(point.timestamp)} ${scaleY(point.value)}`)
      .join(' ');
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />`;
  });

  // Generate grid
  const gridLines: string[] = [];
  if (showGrid) {
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight * i) / 5;
      gridLines.push(`<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e0e0e0" stroke-dasharray="4,4" />`);
    }
  }

  // Generate legend
  const legend = showLegend
    ? series
        .map(
          (s, i) =>
            `<g transform="translate(${padding.left + i * 100}, ${height - 10})">
              <rect x="0" y="-8" width="12" height="12" fill="${s.color || `hsl(${(i * 60) % 360}, 70%, 50%)`}" />
              <text x="16" y="0" font-size="10">${s.name}</text>
            </g>`
        )
        .join('')
    : '';

  return `
    <svg width="${width}" height="${height}" class="${className}" xmlns="http://www.w3.org/2000/svg">
      ${gridLines.join('')}
      ${paths.join('')}
      <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="#333" />
      <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}" stroke="#333" />
      ${xAxisLabel ? `<text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-size="12">${xAxisLabel}</text>` : ''}
      ${yAxisLabel ? `<text x="15" y="${height / 2}" transform="rotate(-90, 15, ${height / 2})" text-anchor="middle" font-size="12">${yAxisLabel}</text>` : ''}
      ${legend}
    </svg>
  `;
}
