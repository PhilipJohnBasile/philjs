/**
 * GaugeChart - Circular gauge visualization
 *
 * Displays a value within a range using a circular gauge,
 * perfect for showing percentages, scores, or progress.
 */

import { signal, memo } from 'philjs-core';

// ============================================================================
// Types
// ============================================================================

export interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  unit?: string;
  thresholds?: Array<{
    value: number;
    color: string;
    label?: string;
  }>;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  showTicks?: boolean;
  animate?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: `
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,
  svg: `
    overflow: visible;
  `,
  track: `
    fill: none;
    stroke: #2a2a4a;
  `,
  progress: `
    fill: none;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.5s ease;
  `,
  valueText: `
    font-weight: 700;
    fill: #ffffff;
  `,
  labelText: `
    font-size: 12px;
    fill: #8a8aaa;
  `,
  unitText: `
    font-size: 14px;
    fill: #6a6a8a;
  `,
  tickLabel: `
    font-size: 10px;
    fill: #6a6a8a;
  `,
  thresholdMarker: `
    stroke-width: 2;
    stroke-linecap: round;
  `,
  needle: `
    fill: #ffffff;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  `,
  needleCircle: `
    fill: #3a3a6e;
  `,
};

// ============================================================================
// Helper Functions
// ============================================================================

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
  ].join(' ');
}

function getColorForValue(
  value: number,
  thresholds: Array<{ value: number; color: string }>
): string {
  if (thresholds.length === 0) return '#6366f1';

  // Sort thresholds by value
  const sorted = [...thresholds].sort((a, b) => a.value - b.value);

  // Find the appropriate color
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (value >= sorted[i].value) {
      return sorted[i].color;
    }
  }

  return sorted[0].color;
}

// ============================================================================
// Component
// ============================================================================

export function GaugeChart(props: GaugeChartProps) {
  const {
    value,
    min = 0,
    max = 100,
    label,
    unit,
    thresholds = [],
    size = 200,
    strokeWidth = 16,
    showValue = true,
    showTicks = true,
    animate = true,
    formatValue = (v) => Math.round(v).toString(),
    className = '',
  } = props;

  const center = size / 2;
  const radius = (size - strokeWidth) / 2 - 10; // Extra padding for ticks

  // Gauge arc spans from 135deg to 405deg (270 degree arc)
  const startAngle = 135;
  const endAngle = 405;
  const angleRange = endAngle - startAngle;

  // Calculate value angle
  const normalizedValue = Math.max(min, Math.min(max, value));
  const valuePercent = (normalizedValue - min) / (max - min);
  const valueAngle = startAngle + valuePercent * angleRange;

  // Calculate arc circumference for animation
  const arcLength = (angleRange / 360) * 2 * Math.PI * radius;
  const progressLength = valuePercent * arcLength;

  // Get color based on thresholds
  const color = thresholds.length > 0
    ? getColorForValue(normalizedValue, thresholds)
    : '#6366f1';

  // Generate tick marks
  const ticks = showTicks ? [0, 0.25, 0.5, 0.75, 1].map(percent => {
    const tickAngle = startAngle + percent * angleRange;
    const innerPoint = polarToCartesian(center, center, radius - strokeWidth / 2 - 5, tickAngle);
    const outerPoint = polarToCartesian(center, center, radius + strokeWidth / 2 + 5, tickAngle);
    const labelPoint = polarToCartesian(center, center, radius + strokeWidth / 2 + 18, tickAngle);
    const tickValue = min + percent * (max - min);

    return {
      percent,
      angle: tickAngle,
      innerPoint,
      outerPoint,
      labelPoint,
      value: tickValue,
    };
  }) : [];

  // Track path
  const trackPath = describeArc(center, center, radius, startAngle, endAngle);

  // Needle path
  const needleLength = radius - 20;
  const needleWidth = 8;
  const needlePoint = polarToCartesian(center, center, needleLength, valueAngle);
  const needleBase1 = polarToCartesian(center, center, needleWidth, valueAngle - 90);
  const needleBase2 = polarToCartesian(center, center, needleWidth, valueAngle + 90);

  const needlePath = `
    M ${needlePoint.x} ${needlePoint.y}
    L ${needleBase1.x} ${needleBase1.y}
    L ${needleBase2.x} ${needleBase2.y}
    Z
  `;

  return (
    <div style={styles.container} class={className}>
      <svg
        width={size}
        height={size * 0.75}
        viewBox={`0 0 ${size} ${size * 0.75}`}
        style={styles.svg}
      >
        {/* Threshold gradient segments */}
        {thresholds.length > 1 && (
          <defs>
            {thresholds.map((threshold, i) => {
              if (i === 0) return null;
              const prevThreshold = thresholds[i - 1];
              const startPercent = (prevThreshold.value - min) / (max - min);
              const endPercent = (threshold.value - min) / (max - min);
              const segmentStartAngle = startAngle + startPercent * angleRange;
              const segmentEndAngle = startAngle + endPercent * angleRange;

              return (
                <path
                  key={`threshold-${i}`}
                  d={describeArc(center, center, radius, segmentStartAngle, segmentEndAngle)}
                  stroke={prevThreshold.color}
                  stroke-width={strokeWidth}
                  fill="none"
                  opacity={0.3}
                />
              );
            })}
          </defs>
        )}

        {/* Track */}
        <path
          d={trackPath}
          stroke="#2a2a4a"
          stroke-width={strokeWidth}
          style={styles.track}
        />

        {/* Progress arc */}
        {normalizedValue > min && (
          <path
            d={describeArc(center, center, radius, startAngle, valueAngle)}
            stroke={color}
            stroke-width={strokeWidth}
            style={styles.progress + (animate ? `
              stroke-dasharray: ${arcLength};
              stroke-dashoffset: ${arcLength - progressLength};
              animation: gaugeProgress 1s ease-out forwards;
            ` : '')}
          />
        )}

        {/* Tick marks */}
        {ticks.map((tick, i) => (
          <g key={`tick-${i}`}>
            <line
              x1={tick.innerPoint.x}
              y1={tick.innerPoint.y}
              x2={tick.outerPoint.x}
              y2={tick.outerPoint.y}
              stroke="#4a4a6a"
              stroke-width={tick.percent === 0 || tick.percent === 1 ? 2 : 1}
            />
            <text
              x={tick.labelPoint.x}
              y={tick.labelPoint.y}
              text-anchor="middle"
              dominant-baseline="middle"
              style={styles.tickLabel}
            >
              {formatValue(tick.value)}
            </text>
          </g>
        ))}

        {/* Threshold markers */}
        {thresholds.map((threshold, i) => {
          const thresholdPercent = (threshold.value - min) / (max - min);
          if (thresholdPercent <= 0 || thresholdPercent >= 1) return null;

          const thresholdAngle = startAngle + thresholdPercent * angleRange;
          const innerPoint = polarToCartesian(center, center, radius - strokeWidth / 2 - 3, thresholdAngle);
          const outerPoint = polarToCartesian(center, center, radius + strokeWidth / 2 + 3, thresholdAngle);

          return (
            <line
              key={`threshold-marker-${i}`}
              x1={innerPoint.x}
              y1={innerPoint.y}
              x2={outerPoint.x}
              y2={outerPoint.y}
              stroke={threshold.color}
              style={styles.thresholdMarker}
            />
          );
        })}

        {/* Needle */}
        <path d={needlePath} style={styles.needle} />
        <circle cx={center} cy={center} r={10} style={styles.needleCircle} />

        {/* Value text */}
        {showValue && (
          <g>
            <text
              x={center}
              y={center + 35}
              text-anchor="middle"
              style={styles.valueText}
              font-size={size * 0.15}
            >
              {formatValue(normalizedValue)}
              {unit && (
                <tspan style={styles.unitText + 'padding-left: 4px;'}>
                  {' '}{unit}
                </tspan>
              )}
            </text>
            {label && (
              <text
                x={center}
                y={center + 55}
                text-anchor="middle"
                style={styles.labelText}
              >
                {label}
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}

// ============================================================================
// Variants
// ============================================================================

export interface MiniGaugeProps {
  value: number;
  max?: number;
  color?: string;
  size?: number;
  thickness?: number;
  className?: string;
}

export function MiniGauge(props: MiniGaugeProps) {
  const {
    value,
    max = 100,
    color = '#6366f1',
    size = 60,
    thickness = 6,
    className = '',
  } = props;

  const center = size / 2;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(1, Math.max(0, value / max));
  const offset = circumference - percent * circumference;

  return (
    <div style={styles.container} class={className}>
      <svg width={size} height={size} style={styles.svg}>
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#2a2a4a"
          stroke-width={thickness}
        />

        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          stroke-width={thickness}
          stroke-linecap="round"
          stroke-dasharray={circumference}
          stroke-dashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style="transition: stroke-dashoffset 0.5s ease;"
        />

        {/* Value */}
        <text
          x={center}
          y={center}
          text-anchor="middle"
          dominant-baseline="middle"
          fill="#ffffff"
          font-size={size * 0.25}
          font-weight={700}
        >
          {Math.round(value)}
        </text>
      </svg>
    </div>
  );
}

// ============================================================================
// Half Gauge (semicircle)
// ============================================================================

export interface HalfGaugeProps {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  thresholds?: Array<{ value: number; color: string }>;
  width?: number;
  height?: number;
  strokeWidth?: number;
  formatValue?: (value: number) => string;
  className?: string;
}

export function HalfGauge(props: HalfGaugeProps) {
  const {
    value,
    min = 0,
    max = 100,
    label,
    thresholds = [],
    width = 200,
    height = 120,
    strokeWidth = 20,
    formatValue = (v) => Math.round(v).toString(),
    className = '',
  } = props;

  const center = width / 2;
  const baseY = height - 20;
  const radius = Math.min(width / 2 - strokeWidth, height - 40);

  const normalizedValue = Math.max(min, Math.min(max, value));
  const valuePercent = (normalizedValue - min) / (max - min);

  // Arc from 180deg to 0deg (semicircle)
  const startAngle = 180;
  const endAngle = 0;
  const valueAngle = startAngle - valuePercent * 180;

  const color = thresholds.length > 0
    ? getColorForValue(normalizedValue, thresholds)
    : '#6366f1';

  // Generate arc path for semicircle
  const startPoint = polarToCartesian(center, baseY, radius, startAngle);
  const endPoint = polarToCartesian(center, baseY, radius, endAngle);
  const valuePoint = polarToCartesian(center, baseY, radius, valueAngle);

  const trackPath = `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 0 1 ${endPoint.x} ${endPoint.y}`;
  const valuePath = valuePercent > 0
    ? `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${valuePercent > 0.5 ? 1 : 0} 1 ${valuePoint.x} ${valuePoint.y}`
    : '';

  return (
    <div style={styles.container} class={className}>
      <svg width={width} height={height} style={styles.svg}>
        {/* Track */}
        <path
          d={trackPath}
          stroke="#2a2a4a"
          stroke-width={strokeWidth}
          fill="none"
          stroke-linecap="round"
        />

        {/* Progress */}
        {valuePath && (
          <path
            d={valuePath}
            stroke={color}
            stroke-width={strokeWidth}
            fill="none"
            stroke-linecap="round"
          />
        )}

        {/* Min/Max labels */}
        <text
          x={startPoint.x}
          y={baseY + 15}
          text-anchor="middle"
          style={styles.tickLabel}
        >
          {formatValue(min)}
        </text>
        <text
          x={endPoint.x}
          y={baseY + 15}
          text-anchor="middle"
          style={styles.tickLabel}
        >
          {formatValue(max)}
        </text>

        {/* Value */}
        <text
          x={center}
          y={baseY - 10}
          text-anchor="middle"
          fill={color}
          font-size={24}
          font-weight={700}
        >
          {formatValue(normalizedValue)}
        </text>

        {/* Label */}
        {label && (
          <text
            x={center}
            y={baseY + 15}
            text-anchor="middle"
            style={styles.labelText}
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}

export default GaugeChart;
