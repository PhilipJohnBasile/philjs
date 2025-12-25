/**
 * LineChart - Signal-based line and area chart component
 */

import type { LineChartProps, DataPoint, Series } from '../types';
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

export function LineChart(props: LineChartProps) {
  const {
    data: dataOrSignal,
    width = '100%',
    height = 300,
    responsive = true,
    margin = { top: 20, right: 30, bottom: 30, left: 50 },
    theme = 'light',
    animation = defaultAnimationConfig,
    className = '',
    style = {},
    ariaLabel = 'Line chart',
    title,
    xAxis = { dataKey: 'x' },
    yAxis = { dataKey: 'y' },
    series,
    curve = 'monotone',
    showDots = true,
    dotSize = 4,
    strokeWidth = 2,
    area = false,
    areaOpacity = 0.3,
    legend = { show: true, position: 'bottom' },
    tooltip = { show: true },
    onDataPointClick,
  } = props;

  // Get reactive data
  const data = getData(dataOrSignal);

  // Resolve theme
  const resolvedTheme = typeof theme === 'string'
    ? (theme === 'dark' ? darkTheme : lightTheme)
    : theme;

  // Determine series from props or data
  const resolvedSeries: Series[] = series || detectSeries(data, xAxis.dataKey);

  // Calculate dimensions
  const svgWidth = typeof width === 'number' ? width : 800;
  const svgHeight = typeof height === 'number' ? height : 300;
  const chartWidth = svgWidth - (margin.left || 0) - (margin.right || 0);
  const chartHeight = svgHeight - (margin.top || 0) - (margin.bottom || 0);

  // Calculate scales
  const xValues = data.map(d => d[xAxis.dataKey || 'x'] as number);
  const allYValues = resolvedSeries.flatMap(s =>
    data.map(d => d[s.dataKey] as number).filter(v => v !== undefined && v !== null)
  );

  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(0, ...allYValues);
  const yMax = Math.max(...allYValues);

  const xScale = (value: number) =>
    ((value - xMin) / (xMax - xMin)) * chartWidth;
  const yScale = (value: number) =>
    chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;

  // Generate curve type attribute
  const getCurveType = () => {
    switch (curve) {
      case 'step': return 'step';
      case 'natural': return 'natural';
      case 'linear': return 'linear';
      default: return 'monotone';
    }
  };

  // Generate path for a series
  const generatePath = (seriesData: Series): string => {
    const points = data
      .map((d, i) => {
        const x = xScale(d[xAxis.dataKey || 'x'] as number);
        const y = yScale(d[seriesData.dataKey] as number);
        return { x, y, index: i };
      })
      .filter(p => !isNaN(p.y));

    if (points.length === 0) return '';

    if (curve === 'step') {
      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        path += ` H ${points[i].x} V ${points[i].y}`;
      }
      return path;
    }

    // Default: smooth curve approximation
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return path;
  };

  // Generate area path
  const generateAreaPath = (seriesData: Series): string => {
    const linePath = generatePath(seriesData);
    if (!linePath) return '';

    const points = data
      .map((d) => xScale(d[xAxis.dataKey || 'x'] as number))
      .filter((_, i) => !isNaN(yScale(data[i][seriesData.dataKey] as number)));

    const lastX = points[points.length - 1];
    const firstX = points[0];
    const baseY = yScale(0);

    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  // Animation attributes
  const animationDuration = animation === false ? 0 :
    (typeof animation === 'object' ? animation.duration : defaultAnimationConfig.duration);

  return (
    <svg
      width={responsive ? '100%' : svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      class={`philjs-line-chart ${className}`}
      style={{
        backgroundColor: resolvedTheme.background,
        ...style,
      }}
      role="img"
      aria-label={ariaLabel}
    >
      {title && (
        <title>{title}</title>
      )}

      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* Grid lines */}
        {!yAxis.hide && yAxis.grid !== false && (
          <g class="grid-lines">
            {Array.from({ length: 5 }, (_, i) => {
              const y = (chartHeight / 4) * i;
              return (
                <line
                  key={`grid-${i}`}
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
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
              const value = xMin + ((xMax - xMin) / 4) * i;
              const x = xScale(value);
              const label = xAxis.tickFormat
                ? xAxis.tickFormat(value)
                : value.toLocaleString();
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
              const value = yMax - ((yMax - yMin) / 4) * i;
              const y = yScale(value);
              const label = yAxis.tickFormat
                ? yAxis.tickFormat(value)
                : value.toLocaleString();
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

        {/* Series */}
        {resolvedSeries.map((s, seriesIndex) => {
          if (s.hidden) return null;
          const color = s.color || resolvedTheme.colors[seriesIndex % resolvedTheme.colors.length];

          return (
            <g key={s.name} class={`series series-${seriesIndex}`}>
              {/* Area fill */}
              {area && (
                <path
                  d={generateAreaPath(s)}
                  fill={color}
                  fill-opacity={areaOpacity}
                  stroke="none"
                >
                  {animationDuration > 0 && (
                    <animate
                      attributeName="fill-opacity"
                      from="0"
                      to={areaOpacity.toString()}
                      dur={`${animationDuration}ms`}
                      fill="freeze"
                    />
                  )}
                </path>
              )}

              {/* Line */}
              <path
                d={generatePath(s)}
                fill="none"
                stroke={color}
                stroke-width={strokeWidth}
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                {animationDuration > 0 && (
                  <animate
                    attributeName="stroke-dashoffset"
                    from="1000"
                    to="0"
                    dur={`${animationDuration}ms`}
                    fill="freeze"
                  />
                )}
              </path>

              {/* Dots */}
              {showDots && data.map((d, i) => {
                const x = xScale(d[xAxis.dataKey || 'x'] as number);
                const y = yScale(d[s.dataKey] as number);
                if (isNaN(y)) return null;

                return (
                  <circle
                    key={`dot-${i}`}
                    cx={x}
                    cy={y}
                    r={dotSize}
                    fill={color}
                    stroke={resolvedTheme.background}
                    stroke-width={2}
                    style={{ cursor: onDataPointClick ? 'pointer' : 'default' }}
                    onClick={() => onDataPointClick?.(d, i)}
                  >
                    {animationDuration > 0 && (
                      <animate
                        attributeName="r"
                        from="0"
                        to={dotSize.toString()}
                        dur={`${animationDuration}ms`}
                        fill="freeze"
                      />
                    )}
                  </circle>
                );
              })}
            </g>
          );
        })}

        {/* Legend */}
        {legend.show && resolvedSeries.length > 1 && (
          <g
            class="legend"
            transform={`translate(0, ${legend.position === 'top' ? -20 : chartHeight + 50})`}
          >
            {resolvedSeries.map((s, i) => {
              const color = s.color || resolvedTheme.colors[i % resolvedTheme.colors.length];
              const x = i * 100;
              return (
                <g
                  key={s.name}
                  transform={`translate(${x}, 0)`}
                  style={{ cursor: 'pointer' }}
                  opacity={s.hidden ? 0.5 : 1}
                >
                  <rect
                    width={12}
                    height={12}
                    fill={color}
                    rx={2}
                  />
                  <text
                    x={18}
                    y={10}
                    fill={resolvedTheme.text}
                    font-size="12"
                  >
                    {s.name}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </g>
    </svg>
  );
}

// Helper to detect series from data
function detectSeries(data: DataPoint[], xKey?: string): Series[] {
  if (!data.length) return [];

  const firstItem = data[0];
  const keys = Object.keys(firstItem).filter(k =>
    k !== xKey && k !== 'x' && typeof firstItem[k] === 'number'
  );

  return keys.map((key, index) => ({
    name: key,
    dataKey: key,
    color: defaultPalette[index % defaultPalette.length],
  }));
}

export default LineChart;
