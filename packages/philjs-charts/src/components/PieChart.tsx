/**
 * PieChart - Signal-based pie and donut chart component
 */

import type { PieChartProps, CategoryDataPoint } from '../types';
import { lightTheme, darkTheme, defaultPalette } from '../utils/colors';
import { defaultAnimationConfig } from '../utils/animations';

// Check if value is a signal
function isSignal<T>(value: T | (() => T)): value is () => T {
  return typeof value === 'function';
}

// Get data from signal or direct value
function getData<T>(value: T | (() => T)): T {
  return isSignal(value) ? value() : value;
}

export function PieChart(props: PieChartProps) {
  const {
    data: dataOrSignal,
    width = '100%',
    height = 300,
    responsive = true,
    margin = { top: 20, right: 20, bottom: 20, left: 20 },
    theme = 'light',
    animation = defaultAnimationConfig,
    className = '',
    style = {},
    ariaLabel = 'Pie chart',
    title,
    dataKey = 'value',
    nameKey = 'name',
    innerRadius = 0,
    outerRadius = '80%',
    startAngle = 0,
    endAngle = 360,
    paddingAngle = 0,
    label = true,
    labelLine = true,
    legend = { show: true, position: 'right' },
    tooltip = { show: true },
    onSliceClick,
  } = props;

  // Get reactive data
  const data = getData(dataOrSignal);

  // Resolve theme
  const resolvedTheme = typeof theme === 'string'
    ? (theme === 'dark' ? darkTheme : lightTheme)
    : theme;

  // Calculate dimensions
  const svgWidth = typeof width === 'number' ? width : 400;
  const svgHeight = typeof height === 'number' ? height : 300;
  const chartWidth = svgWidth - (margin.left || 0) - (margin.right || 0);
  const chartHeight = svgHeight - (margin.top || 0) - (margin.bottom || 0);

  // Calculate center and radii
  const centerX = chartWidth / 2;
  const centerY = chartHeight / 2;
  const maxRadius = Math.min(centerX, centerY);

  const resolvedOuterRadius = typeof outerRadius === 'string'
    ? (parseFloat(outerRadius) / 100) * maxRadius
    : outerRadius;

  const resolvedInnerRadius = typeof innerRadius === 'string'
    ? (parseFloat(innerRadius) / 100) * maxRadius
    : innerRadius;

  // Calculate total and percentages
  const total = data.reduce((sum, d) => sum + ((d[dataKey] as number) || 0), 0);

  // Calculate slice angles
  interface SliceData {
    data: CategoryDataPoint;
    startAngle: number;
    endAngle: number;
    percentage: number;
    color: string;
  }

  const slices: SliceData[] = [];
  let currentAngle = startAngle;

  data.forEach((d, index) => {
    const value = (d[dataKey] as number) || 0;
    const percentage = total > 0 ? value / total : 0;
    const sliceAngle = percentage * (endAngle - startAngle);
    const adjustedPadding = paddingAngle / 2;

    slices.push({
      data: d,
      startAngle: currentAngle + adjustedPadding,
      endAngle: currentAngle + sliceAngle - adjustedPadding,
      percentage,
      color: resolvedTheme.colors[index % resolvedTheme.colors.length],
    });

    currentAngle += sliceAngle;
  });

  // Animation attributes
  const animationDuration = animation === false ? 0 :
    (typeof animation === 'object' ? animation.duration : defaultAnimationConfig.duration);

  // Convert degrees to radians
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  // Generate arc path
  const arcPath = (
    startAngle: number,
    endAngle: number,
    innerR: number,
    outerR: number
  ): string => {
    const startRad = toRadians(startAngle - 90);
    const endRad = toRadians(endAngle - 90);

    const x1 = Math.cos(startRad) * outerR;
    const y1 = Math.sin(startRad) * outerR;
    const x2 = Math.cos(endRad) * outerR;
    const y2 = Math.sin(endRad) * outerR;

    const x3 = Math.cos(endRad) * innerR;
    const y3 = Math.sin(endRad) * innerR;
    const x4 = Math.cos(startRad) * innerR;
    const y4 = Math.sin(startRad) * innerR;

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    if (innerR === 0) {
      return `
        M 0 0
        L ${x1} ${y1}
        A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x2} ${y2}
        Z
      `;
    }

    return `
      M ${x1} ${y1}
      A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x4} ${y4}
      Z
    `;
  };

  // Get label position
  const getLabelPosition = (slice: SliceData) => {
    const midAngle = (slice.startAngle + slice.endAngle) / 2;
    const midRad = toRadians(midAngle - 90);
    const labelRadius = resolvedOuterRadius * 1.15;
    return {
      x: Math.cos(midRad) * labelRadius,
      y: Math.sin(midRad) * labelRadius,
      midAngle,
    };
  };

  // Get label line points
  const getLabelLinePoints = (slice: SliceData) => {
    const midAngle = (slice.startAngle + slice.endAngle) / 2;
    const midRad = toRadians(midAngle - 90);

    const innerPoint = {
      x: Math.cos(midRad) * resolvedOuterRadius,
      y: Math.sin(midRad) * resolvedOuterRadius,
    };
    const outerPoint = {
      x: Math.cos(midRad) * (resolvedOuterRadius * 1.1),
      y: Math.sin(midRad) * (resolvedOuterRadius * 1.1),
    };

    return { innerPoint, outerPoint };
  };

  // Format label
  const formatLabel = (slice: SliceData): string => {
    if (typeof label === 'function') {
      return label(slice.data);
    }
    return `${(slice.percentage * 100).toFixed(1)}%`;
  };

  return (
    <svg
      width={responsive ? '100%' : svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      class={`philjs-pie-chart ${className}`}
      style={{
        backgroundColor: resolvedTheme.background,
        ...style,
      }}
      role="img"
      aria-label={ariaLabel}
    >
      {title && <title>{title}</title>}

      <g transform={`translate(${(margin.left || 0) + centerX}, ${(margin.top || 0) + centerY})`}>
        {/* Slices */}
        {slices.map((slice, index) => {
          const path = arcPath(
            slice.startAngle,
            slice.endAngle,
            resolvedInnerRadius,
            resolvedOuterRadius
          );

          return (
            <g key={`slice-${index}`} class="pie-slice">
              <path
                d={path}
                fill={slice.color}
                stroke={resolvedTheme.background}
                stroke-width={2}
                style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
                onClick={() => onSliceClick?.(slice.data, index)}
              >
                {animationDuration > 0 && (
                  <animate
                    attributeName="opacity"
                    from="0"
                    to="1"
                    dur={`${animationDuration}ms`}
                    fill="freeze"
                    begin={`${index * 50}ms`}
                  />
                )}
              </path>

              {/* Label line */}
              {label && labelLine && slice.percentage > 0.02 && (
                <line
                  x1={getLabelLinePoints(slice).innerPoint.x}
                  y1={getLabelLinePoints(slice).innerPoint.y}
                  x2={getLabelLinePoints(slice).outerPoint.x}
                  y2={getLabelLinePoints(slice).outerPoint.y}
                  stroke={resolvedTheme.text}
                  stroke-width={1}
                  opacity={0.5}
                />
              )}

              {/* Label */}
              {label && slice.percentage > 0.02 && (
                <text
                  x={getLabelPosition(slice).x}
                  y={getLabelPosition(slice).y}
                  text-anchor={getLabelPosition(slice).midAngle > 180 ? 'end' : 'start'}
                  dominant-baseline="middle"
                  fill={resolvedTheme.text}
                  font-size="12"
                >
                  {formatLabel(slice)}
                </text>
              )}
            </g>
          );
        })}

        {/* Center label for donut */}
        {resolvedInnerRadius > 0 && (
          <g class="center-label">
            <text
              x={0}
              y={0}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={resolvedTheme.text}
              font-size="24"
              font-weight="bold"
            >
              {total.toLocaleString()}
            </text>
            <text
              x={0}
              y={20}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={resolvedTheme.axis}
              font-size="12"
            >
              Total
            </text>
          </g>
        )}
      </g>

      {/* Legend */}
      {legend.show && (
        <g
          class="legend"
          transform={`translate(${legend.position === 'right' ? svgWidth - 100 : margin.left || 0}, ${legend.position === 'bottom' ? svgHeight - 30 : margin.top || 0})`}
        >
          {slices.map((slice, i) => {
            const name = slice.data[nameKey] as string;
            const y = legend.position === 'bottom' ? 0 : i * 24;
            const x = legend.position === 'bottom' ? i * 80 : 0;

            return (
              <g
                key={`legend-${i}`}
                transform={`translate(${x}, ${y})`}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  width={12}
                  height={12}
                  fill={slice.color}
                  rx={2}
                />
                <text
                  x={18}
                  y={10}
                  fill={resolvedTheme.text}
                  font-size="12"
                >
                  {name}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}

export default PieChart;
