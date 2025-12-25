/**
 * ScatterChart - Signal-based scatter plot component
 */

import type { ScatterChartProps, NumericDataPoint } from '../types';
import { lightTheme, darkTheme, defaultPalette, hexToRgba } from '../utils/colors';
import { defaultAnimationConfig } from '../utils/animations';

// Check if value is a signal
function isSignal<T>(value: T | (() => T)): value is () => T {
  return typeof value === 'function';
}

// Get data from signal or direct value
function getData<T>(value: T | (() => T)): T {
  return isSignal(value) ? value() : value;
}

export function ScatterChart(props: ScatterChartProps) {
  const {
    data: dataOrSignal,
    width = '100%',
    height = 300,
    responsive = true,
    margin = { top: 20, right: 30, bottom: 40, left: 50 },
    theme = 'light',
    animation = defaultAnimationConfig,
    className = '',
    style = {},
    ariaLabel = 'Scatter chart',
    title,
    xAxis = { dataKey: 'x' },
    yAxis = { dataKey: 'y' },
    xDataKey = 'x',
    yDataKey = 'y',
    sizeDataKey,
    colorDataKey,
    shape = 'circle',
    size = 8,
    legend = { show: false },
    tooltip = { show: true },
    onPointClick,
  } = props;

  // Get reactive data
  const data = getData(dataOrSignal);

  // Resolve theme
  const resolvedTheme = typeof theme === 'string'
    ? (theme === 'dark' ? darkTheme : lightTheme)
    : theme;

  // Calculate dimensions
  const svgWidth = typeof width === 'number' ? width : 600;
  const svgHeight = typeof height === 'number' ? height : 300;
  const chartWidth = svgWidth - (margin.left || 0) - (margin.right || 0);
  const chartHeight = svgHeight - (margin.top || 0) - (margin.bottom || 0);

  // Calculate scales
  const xValues = data.map(d => d[xDataKey] as number);
  const yValues = data.map(d => d[yDataKey] as number);

  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  // Add padding to scales
  const xPadding = (xMax - xMin) * 0.1 || 1;
  const yPadding = (yMax - yMin) * 0.1 || 1;

  const xScale = (value: number) =>
    ((value - (xMin - xPadding)) / ((xMax + xPadding) - (xMin - xPadding))) * chartWidth;
  const yScale = (value: number) =>
    chartHeight - ((value - (yMin - yPadding)) / ((yMax + yPadding) - (yMin - yPadding))) * chartHeight;

  // Size scale
  const sizeValues = sizeDataKey ? data.map(d => d[sizeDataKey] as number) : [];
  const sizeMin = sizeValues.length ? Math.min(...sizeValues) : 0;
  const sizeMax = sizeValues.length ? Math.max(...sizeValues) : 0;
  const sizeScale = sizeDataKey
    ? (value: number) => size * 0.5 + ((value - sizeMin) / (sizeMax - sizeMin || 1)) * size * 1.5
    : () => size;

  // Color scale
  const colorValues = colorDataKey ? data.map(d => d[colorDataKey] as number) : [];
  const colorMin = colorValues.length ? Math.min(...colorValues) : 0;
  const colorMax = colorValues.length ? Math.max(...colorValues) : 0;
  const colorScale = colorDataKey
    ? (value: number) => {
        const normalized = (value - colorMin) / (colorMax - colorMin || 1);
        const colorIndex = Math.floor(normalized * (resolvedTheme.colors.length - 1));
        return resolvedTheme.colors[colorIndex];
      }
    : () => resolvedTheme.colors[0];

  // Animation attributes
  const animationDuration = animation === false ? 0 :
    (typeof animation === 'object' ? animation.duration : defaultAnimationConfig.duration);

  // Generate shape path
  const getShapePath = (x: number, y: number, r: number): string => {
    switch (shape) {
      case 'square':
        return `M ${x - r} ${y - r} h ${r * 2} v ${r * 2} h ${-r * 2} Z`;
      case 'triangle':
        return `M ${x} ${y - r} L ${x + r} ${y + r} L ${x - r} ${y + r} Z`;
      case 'diamond':
        return `M ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} L ${x - r} ${y} Z`;
      default:
        return ''; // Circle uses <circle> element
    }
  };

  return (
    <svg
      width={responsive ? '100%' : svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      class={`philjs-scatter-chart ${className}`}
      style={{
        backgroundColor: resolvedTheme.background,
        ...style,
      }}
      role="img"
      aria-label={ariaLabel}
    >
      {title && <title>{title}</title>}

      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* Grid lines */}
        {yAxis.grid !== false && (
          <g class="grid-lines">
            {Array.from({ length: 5 }, (_, i) => {
              const y = (chartHeight / 4) * i;
              return (
                <line
                  key={`grid-y-${i}`}
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke={resolvedTheme.grid}
                  stroke-dasharray="3,3"
                />
              );
            })}
            {Array.from({ length: 5 }, (_, i) => {
              const x = (chartWidth / 4) * i;
              return (
                <line
                  key={`grid-x-${i}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={chartHeight}
                  stroke={resolvedTheme.grid}
                  stroke-dasharray="3,3"
                />
              );
            })}
          </g>
        )}

        {/* X Axis */}
        {!xAxis.hide && (
          <g class="x-axis" transform={`translate(0, ${chartHeight})`}>
            <line
              x1={0}
              y1={0}
              x2={chartWidth}
              y2={0}
              stroke={resolvedTheme.axis}
            />
            {Array.from({ length: 5 }, (_, i) => {
              const value = (xMin - xPadding) + (((xMax + xPadding) - (xMin - xPadding)) / 4) * i;
              const x = xScale(value);
              const label = xAxis.tickFormat
                ? xAxis.tickFormat(value)
                : value.toFixed(1);
              return (
                <g key={`x-tick-${i}`} transform={`translate(${x}, 0)`}>
                  <line y2={6} stroke={resolvedTheme.axis} />
                  <text
                    y={20}
                    text-anchor="middle"
                    fill={resolvedTheme.text}
                    font-size="12"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
            {xAxis.label && (
              <text
                x={chartWidth / 2}
                y={40}
                text-anchor="middle"
                fill={resolvedTheme.text}
                font-size="14"
              >
                {xAxis.label}
              </text>
            )}
          </g>
        )}

        {/* Y Axis */}
        {!yAxis.hide && (
          <g class="y-axis">
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={chartHeight}
              stroke={resolvedTheme.axis}
            />
            {Array.from({ length: 5 }, (_, i) => {
              const value = (yMax + yPadding) - (((yMax + yPadding) - (yMin - yPadding)) / 4) * i;
              const y = yScale(value);
              const label = yAxis.tickFormat
                ? yAxis.tickFormat(value)
                : value.toFixed(1);
              return (
                <g key={`y-tick-${i}`} transform={`translate(0, ${y})`}>
                  <line x2={-6} stroke={resolvedTheme.axis} />
                  <text
                    x={-10}
                    dy="0.32em"
                    text-anchor="end"
                    fill={resolvedTheme.text}
                    font-size="12"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
            {yAxis.label && (
              <text
                transform={`translate(-40, ${chartHeight / 2}) rotate(-90)`}
                text-anchor="middle"
                fill={resolvedTheme.text}
                font-size="14"
              >
                {yAxis.label}
              </text>
            )}
          </g>
        )}

        {/* Data points */}
        {data.map((d, index) => {
          const x = xScale(d[xDataKey] as number);
          const y = yScale(d[yDataKey] as number);
          const r = sizeDataKey ? sizeScale(d[sizeDataKey] as number) : size;
          const color = colorDataKey ? colorScale(d[colorDataKey] as number) : resolvedTheme.colors[0];

          if (shape === 'circle') {
            return (
              <circle
                key={`point-${index}`}
                cx={x}
                cy={y}
                r={r}
                fill={hexToRgba(color, 0.7)}
                stroke={color}
                stroke-width={2}
                style={{ cursor: onPointClick ? 'pointer' : 'default' }}
                onClick={() => onPointClick?.(d, index)}
              >
                {animationDuration > 0 && (
                  <animate
                    attributeName="r"
                    from="0"
                    to={r.toString()}
                    dur={`${animationDuration}ms`}
                    fill="freeze"
                    begin={`${index * 20}ms`}
                  />
                )}
              </circle>
            );
          }

          return (
            <path
              key={`point-${index}`}
              d={getShapePath(x, y, r)}
              fill={hexToRgba(color, 0.7)}
              stroke={color}
              stroke-width={2}
              style={{ cursor: onPointClick ? 'pointer' : 'default' }}
              onClick={() => onPointClick?.(d, index)}
            >
              {animationDuration > 0 && (
                <animate
                  attributeName="opacity"
                  from="0"
                  to="1"
                  dur={`${animationDuration}ms`}
                  fill="freeze"
                  begin={`${index * 20}ms`}
                />
              )}
            </path>
          );
        })}
      </g>
    </svg>
  );
}

export default ScatterChart;
