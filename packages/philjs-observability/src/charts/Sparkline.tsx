/**
 * Sparkline - Inline mini chart visualization
 *
 * Compact line charts for inline data visualization,
 * perfect for dashboards and metric cards.
 */

import { signal, memo } from 'philjs-core';

// ============================================================================
// Types
// ============================================================================

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  showArea?: boolean;
  showDots?: boolean;
  showMinMax?: boolean;
  animate?: boolean;
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: `
    display: inline-block;
    position: relative;
    vertical-align: middle;
  `,
  svg: `
    display: block;
  `,
  line: `
    fill: none;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  `,
  area: `
    opacity: 0.2;
  `,
  dot: `
    transition: r 0.2s ease;
  `,
  minMaxLabel: `
    font-size: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,
};

// ============================================================================
// Component
// ============================================================================

export function Sparkline(props: SparklineProps) {
  const {
    data,
    width = 100,
    height = 30,
    color = '#6366f1',
    fillColor,
    showArea = true,
    showDots = false,
    showMinMax = false,
    animate = false,
    className = '',
  } = props;

  const hoveredIndex = signal<number | null>(null);

  if (data.length === 0) {
    return (
      <div style={styles.container} class={className}>
        <svg width={width} height={height} style={styles.svg}>
          <line
            x1={0}
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="#3a3a6a"
            stroke-width={1}
            stroke-dasharray="4 2"
          />
        </svg>
      </div>
    );
  }

  const padding = showMinMax ? 10 : 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const valueRange = maxValue - minValue || 1;

  const minIndex = data.indexOf(minValue);
  const maxIndex = data.indexOf(maxValue);

  // Generate points
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + (1 - (value - minValue) / valueRange) * chartHeight;
    return { x, y, value };
  });

  // Generate line path
  const linePath = points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  // Generate area path
  const areaPath = linePath +
    ` L ${points[points.length - 1].x} ${height - padding}` +
    ` L ${points[0].x} ${height - padding} Z`;

  const handleMouseMove = (e: MouseEvent) => {
    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left - padding;
    const index = Math.round((x / chartWidth) * (data.length - 1));
    if (index >= 0 && index < data.length) {
      hoveredIndex.set(index);
    }
  };

  const handleMouseLeave = () => {
    hoveredIndex.set(null);
  };

  const effectiveFillColor = fillColor || color;

  return (
    <div style={styles.container} class={className}>
      <svg
        width={width}
        height={height}
        style={styles.svg}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Area fill */}
        {showArea && (
          <path
            d={areaPath}
            fill={effectiveFillColor}
            style={styles.area}
          />
        )}

        {/* Line */}
        <path
          d={linePath}
          stroke={color}
          style={styles.line + (animate ? 'animation: drawSparkline 0.5s ease-out forwards;' : '')}
        />

        {/* Dots */}
        {showDots && points.map((point, i) => (
          <circle
            cx={point.x}
            cy={point.y}
            r={hoveredIndex() === i ? 3 : 2}
            fill={color}
            style={styles.dot}
          />
        ))}

        {/* Hovered dot */}
        {hoveredIndex() !== null && !showDots && (
          <circle
            cx={points[hoveredIndex()!].x}
            cy={points[hoveredIndex()!].y}
            r={3}
            fill={color}
          />
        )}

        {/* Min/Max markers */}
        {showMinMax && (
          <>
            <circle
              cx={points[minIndex].x}
              cy={points[minIndex].y}
              r={2}
              fill="#ef4444"
            />
            <circle
              cx={points[maxIndex].x}
              cy={points[maxIndex].y}
              r={2}
              fill="#22c55e"
            />
          </>
        )}
      </svg>
    </div>
  );
}

// ============================================================================
// Variants
// ============================================================================

export interface SparkBarProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  negativeColor?: string;
  gap?: number;
  className?: string;
}

export function SparkBar(props: SparkBarProps) {
  const {
    data,
    width = 100,
    height = 30,
    color = '#6366f1',
    negativeColor = '#ef4444',
    gap = 1,
    className = '',
  } = props;

  if (data.length === 0) {
    return (
      <div style={styles.container} class={className}>
        <svg width={width} height={height} style={styles.svg} />
      </div>
    );
  }

  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = (chartWidth - gap * (data.length - 1)) / data.length;

  const maxAbsValue = Math.max(...data.map(Math.abs));
  const hasNegative = data.some(v => v < 0);
  const baseline = hasNegative ? chartHeight / 2 : chartHeight;

  return (
    <div style={styles.container} class={className}>
      <svg width={width} height={height} style={styles.svg}>
        {data.map((value, i) => {
          const barHeight = (Math.abs(value) / maxAbsValue) * (hasNegative ? chartHeight / 2 : chartHeight);
          const x = padding + i * (barWidth + gap);
          const y = value >= 0 ? baseline - barHeight + padding : baseline + padding;

          return (
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={value >= 0 ? color : negativeColor}
              rx={1}
            />
          );
        })}

        {hasNegative && (
          <line
            x1={padding}
            y1={baseline + padding}
            x2={width - padding}
            y2={baseline + padding}
            stroke="#4a4a6a"
            stroke-width={1}
          />
        )}
      </svg>
    </div>
  );
}

// ============================================================================
// Spark Area (filled only, no stroke)
// ============================================================================

export interface SparkAreaProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function SparkArea(props: SparkAreaProps) {
  const {
    data,
    width = 100,
    height = 30,
    color = '#6366f1',
    className = '',
  } = props;

  if (data.length === 0) {
    return (
      <div style={styles.container} class={className}>
        <svg width={width} height={height} style={styles.svg} />
      </div>
    );
  }

  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const valueRange = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + (1 - (value - minValue) / valueRange) * chartHeight;
    return { x, y };
  });

  const areaPath = points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ') +
    ` L ${points[points.length - 1].x} ${height - padding}` +
    ` L ${points[0].x} ${height - padding} Z`;

  return (
    <div style={styles.container} class={className}>
      <svg width={width} height={height} style={styles.svg}>
        <defs>
          <linearGradient id={`spark-gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color={color} stop-opacity="0.6" />
            <stop offset="100%" stop-color={color} stop-opacity="0.1" />
          </linearGradient>
        </defs>
        <path
          d={areaPath}
          fill={`url(#spark-gradient-${color.replace('#', '')})`}
        />
      </svg>
    </div>
  );
}

export default Sparkline;
