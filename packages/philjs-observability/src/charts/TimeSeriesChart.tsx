/**
 * TimeSeriesChart - Time-based line chart visualization
 *
 * Displays metrics over time with support for multiple series,
 * tooltips, and responsive sizing.
 */

import { signal, memo, effect } from 'philjs-core';

// ============================================================================
// Types
// ============================================================================

export interface DataPoint {
  timestamp: number;
  value: number;
}

export interface TimeSeries {
  id: string;
  name: string;
  data: DataPoint[];
  color?: string;
}

export interface TimeSeriesChartProps {
  series: TimeSeries[];
  width?: number;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  formatValue?: (value: number) => string;
  formatTime?: (timestamp: number) => string;
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: `
    position: relative;
    background: #1a1a2e;
    border-radius: 8px;
    padding: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,
  svg: `
    display: block;
    width: 100%;
    height: auto;
  `,
  grid: `
    stroke: #2a2a4a;
    stroke-width: 1;
    stroke-dasharray: 4 4;
  `,
  axis: `
    stroke: #4a4a6a;
    stroke-width: 1;
  `,
  axisLabel: `
    fill: #8a8aaa;
    font-size: 10px;
  `,
  line: `
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  `,
  area: `
    opacity: 0.15;
  `,
  legend: `
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 12px;
    justify-content: center;
  `,
  legendItem: `
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #a0a0c0;
  `,
  legendDot: `
    width: 10px;
    height: 10px;
    border-radius: 50%;
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
  tooltipTitle: `
    font-weight: 600;
    margin-bottom: 4px;
    color: #ffffff;
  `,
  tooltipValue: `
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
  `,
};

// ============================================================================
// Default Colors
// ============================================================================

const defaultColors = [
  '#6366f1', // indigo
  '#22c55e', // green
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#ef4444', // red
  '#10b981', // emerald
];

// ============================================================================
// Helper Functions
// ============================================================================

function getMinMax(series: TimeSeries[]): { minTime: number; maxTime: number; minValue: number; maxValue: number } {
  let minTime = Infinity;
  let maxTime = -Infinity;
  let minValue = Infinity;
  let maxValue = -Infinity;

  for (const s of series) {
    for (const point of s.data) {
      minTime = Math.min(minTime, point.timestamp);
      maxTime = Math.max(maxTime, point.timestamp);
      minValue = Math.min(minValue, point.value);
      maxValue = Math.max(maxValue, point.value);
    }
  }

  // Add some padding to the value range
  const valueRange = maxValue - minValue;
  minValue = Math.max(0, minValue - valueRange * 0.1);
  maxValue = maxValue + valueRange * 0.1;

  return { minTime, maxTime, minValue, maxValue };
}

function scaleX(timestamp: number, minTime: number, maxTime: number, width: number, padding: number): number {
  if (maxTime === minTime) return padding;
  return padding + ((timestamp - minTime) / (maxTime - minTime)) * (width - padding * 2);
}

function scaleY(value: number, minValue: number, maxValue: number, height: number, padding: number): number {
  if (maxValue === minValue) return height - padding;
  return height - padding - ((value - minValue) / (maxValue - minValue)) * (height - padding * 2);
}

function formatDefaultTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDefaultValue(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(1);
}

// ============================================================================
// Component
// ============================================================================

export function TimeSeriesChart(props: TimeSeriesChartProps) {
  const {
    series,
    width = 600,
    height = 300,
    showGrid = true,
    showLegend = true,
    showTooltip = true,
    animate = true,
    formatValue = formatDefaultValue,
    formatTime = formatDefaultTime,
    className = '',
  } = props;

  const padding = 50;
  const tooltip = signal<{ x: number; y: number; data: { name: string; value: number; color: string }[] } | null>(null);

  if (series.length === 0 || series.every(s => s.data.length === 0)) {
    return (
      <div style={styles.container} class={className}>
        <div style="display: flex; align-items: center; justify-content: center; height: 200px; color: #6a6a8a;">
          No data available
        </div>
      </div>
    );
  }

  const { minTime, maxTime, minValue, maxValue } = getMinMax(series);

  // Generate grid lines
  const gridLinesX: number[] = [];
  const gridLinesY: number[] = [];
  const xLabels: { x: number; label: string }[] = [];
  const yLabels: { y: number; label: string }[] = [];

  const numXLines = 6;
  const numYLines = 5;

  for (let i = 0; i <= numXLines; i++) {
    const t = minTime + (i / numXLines) * (maxTime - minTime);
    const x = scaleX(t, minTime, maxTime, width, padding);
    gridLinesX.push(x);
    xLabels.push({ x, label: formatTime(t) });
  }

  for (let i = 0; i <= numYLines; i++) {
    const v = minValue + (i / numYLines) * (maxValue - minValue);
    const y = scaleY(v, minValue, maxValue, height, padding);
    gridLinesY.push(y);
    yLabels.push({ y, label: formatValue(v) });
  }

  // Generate paths for each series
  const paths = series.map((s, idx) => {
    const color = s.color || defaultColors[idx % defaultColors.length];
    const sortedData = [...s.data].sort((a, b) => a.timestamp - b.timestamp);

    if (sortedData.length === 0) return null;

    const linePath = sortedData
      .map((point, i) => {
        const x = scaleX(point.timestamp, minTime, maxTime, width, padding);
        const y = scaleY(point.value, minValue, maxValue, height, padding);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    const areaPath = linePath +
      ` L ${scaleX(sortedData[sortedData.length - 1].timestamp, minTime, maxTime, width, padding)} ${height - padding}` +
      ` L ${scaleX(sortedData[0].timestamp, minTime, maxTime, width, padding)} ${height - padding} Z`;

    return { id: s.id, color, linePath, areaPath };
  }).filter(Boolean);

  const handleMouseMove = (e: MouseEvent) => {
    if (!showTooltip) return;

    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find closest data point
    const timestamp = minTime + ((x - padding) / (width - padding * 2)) * (maxTime - minTime);

    const dataPoints = series.map((s, idx) => {
      const color = s.color || defaultColors[idx % defaultColors.length];
      const closest = s.data.reduce((prev, curr) =>
        Math.abs(curr.timestamp - timestamp) < Math.abs(prev.timestamp - timestamp) ? curr : prev
      );
      return { name: s.name, value: closest.value, color };
    });

    tooltip.set({ x: e.clientX - rect.left + 10, y: e.clientY - rect.top - 10, data: dataPoints });
  };

  const handleMouseLeave = () => {
    tooltip.set(null);
  };

  return (
    <div style={styles.container + `position: relative;`} class={className}>
      <svg
        width={width}
        height={height}
        style={styles.svg}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid lines */}
        {showGrid && (
          <g>
            {gridLinesX.map(x => (
              <line x1={x} y1={padding} x2={x} y2={height - padding} style={styles.grid} />
            ))}
            {gridLinesY.map(y => (
              <line x1={padding} y1={y} x2={width - padding} y2={y} style={styles.grid} />
            ))}
          </g>
        )}

        {/* Axes */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} style={styles.axis} />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} style={styles.axis} />

        {/* X-axis labels */}
        {xLabels.map(({ x, label }) => (
          <text x={x} y={height - padding + 20} style={styles.axisLabel} text-anchor="middle">
            {label}
          </text>
        ))}

        {/* Y-axis labels */}
        {yLabels.map(({ y, label }) => (
          <text x={padding - 10} y={y + 4} style={styles.axisLabel} text-anchor="end">
            {label}
          </text>
        ))}

        {/* Data series */}
        {paths.map(p => (
          <g key={p!.id}>
            <path d={p!.areaPath} fill={p!.color} style={styles.area} />
            <path
              d={p!.linePath}
              stroke={p!.color}
              style={styles.line + (animate ? 'animation: drawLine 1s ease-out forwards;' : '')}
            />
          </g>
        ))}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div style={styles.legend}>
          {series.map((s, idx) => (
            <div style={styles.legendItem}>
              <span style={styles.legendDot + `background: ${s.color || defaultColors[idx % defaultColors.length]};`} />
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && tooltip() && (
        <div style={styles.tooltip + `left: ${tooltip()!.x}px; top: ${tooltip()!.y}px;`}>
          <div style={styles.tooltipTitle}>{formatTime(Date.now())}</div>
          {tooltip()!.data.map(d => (
            <div style={styles.tooltipValue}>
              <span style={`width: 8px; height: 8px; border-radius: 50%; background: ${d.color};`} />
              <span>{d.name}: {formatValue(d.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TimeSeriesChart;
