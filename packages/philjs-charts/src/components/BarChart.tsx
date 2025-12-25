/**
 * BarChart - Signal-based bar and column chart component
 */

import type { BarChartProps, DataPoint, Series } from '../types';
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

export function BarChart(props: BarChartProps) {
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
    ariaLabel = 'Bar chart',
    title,
    xAxis = { dataKey: 'name' },
    yAxis = { dataKey: 'value' },
    series,
    layout = 'vertical',
    stacked = false,
    barGap = 4,
    barSize,
    radius = 0,
    legend = { show: true, position: 'bottom' },
    tooltip = { show: true },
    onBarClick,
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

  // Calculate max value for scaling
  let maxValue = 0;
  if (stacked) {
    maxValue = Math.max(...data.map(d =>
      resolvedSeries.reduce((sum, s) => sum + ((d[s.dataKey] as number) || 0), 0)
    ));
  } else {
    maxValue = Math.max(...resolvedSeries.flatMap(s =>
      data.map(d => (d[s.dataKey] as number) || 0)
    ));
  }

  // Scales
  const xScale = (index: number) => {
    const bandwidth = chartWidth / data.length;
    return index * bandwidth + bandwidth / 2;
  };

  const yScale = (value: number) =>
    chartHeight - (value / maxValue) * chartHeight;

  // Calculate bar dimensions
  const totalBars = stacked ? 1 : resolvedSeries.length;
  const bandwidth = chartWidth / data.length;
  const calculatedBarSize = barSize || Math.max(10, (bandwidth - barGap * (totalBars + 1)) / totalBars);
  const totalBarWidth = calculatedBarSize * totalBars + barGap * (totalBars - 1);
  const barStartOffset = (bandwidth - totalBarWidth) / 2;

  // Get border radius array
  const getRadius = (): [number, number, number, number] => {
    if (typeof radius === 'number') {
      return [radius, radius, 0, 0];
    }
    return radius;
  };

  const borderRadius = getRadius();

  // Animation attributes
  const animationDuration = animation === false ? 0 :
    (typeof animation === 'object' ? animation.duration : defaultAnimationConfig.duration);

  // Generate rounded rect path
  const roundedRectPath = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: [number, number, number, number]
  ): string => {
    const [tl, tr, br, bl] = r;
    return `
      M ${x + tl} ${y}
      H ${x + w - tr}
      Q ${x + w} ${y} ${x + w} ${y + tr}
      V ${y + h - br}
      Q ${x + w} ${y + h} ${x + w - br} ${y + h}
      H ${x + bl}
      Q ${x} ${y + h} ${x} ${y + h - bl}
      V ${y + tl}
      Q ${x} ${y} ${x + tl} ${y}
      Z
    `;
  };

  return (
    <svg
      width={responsive ? '100%' : svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      class={`philjs-bar-chart ${className}`}
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
            {data.map((d, i) => {
              const x = xScale(i);
              const label = xAxis.tickFormat
                ? xAxis.tickFormat(d[xAxis.dataKey || 'name'])
                : String(d[xAxis.dataKey || 'name']);
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
              const value = maxValue - (maxValue / 4) * i;
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

        {/* Bars */}
        {data.map((d, dataIndex) => {
          let stackedY = chartHeight;

          return (
            <g key={`bar-group-${dataIndex}`} class="bar-group">
              {resolvedSeries.map((s, seriesIndex) => {
                if (s.hidden) return null;

                const value = (d[s.dataKey] as number) || 0;
                const color = s.color || resolvedTheme.colors[seriesIndex % resolvedTheme.colors.length];
                const barHeight = (value / maxValue) * chartHeight;

                let x: number;
                let y: number;

                if (stacked) {
                  x = xScale(dataIndex) - calculatedBarSize / 2;
                  stackedY -= barHeight;
                  y = stackedY;
                } else {
                  x = xScale(dataIndex) - totalBarWidth / 2 + seriesIndex * (calculatedBarSize + barGap);
                  y = chartHeight - barHeight;
                }

                const isTop = stacked ? seriesIndex === resolvedSeries.length - 1 : true;
                const currentRadius: [number, number, number, number] = isTop
                  ? borderRadius
                  : [0, 0, 0, 0];

                return (
                  <path
                    key={`bar-${dataIndex}-${seriesIndex}`}
                    d={roundedRectPath(x, y, calculatedBarSize, barHeight, currentRadius)}
                    fill={color}
                    style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                    onClick={() => onBarClick?.(d, dataIndex)}
                  >
                    {animationDuration > 0 && (
                      <animate
                        attributeName="d"
                        from={roundedRectPath(x, chartHeight, calculatedBarSize, 0, currentRadius)}
                        to={roundedRectPath(x, y, calculatedBarSize, barHeight, currentRadius)}
                        dur={`${animationDuration}ms`}
                        fill="freeze"
                      />
                    )}
                  </path>
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
    k !== xKey && k !== 'name' && typeof firstItem[k] === 'number'
  );

  if (keys.length === 0 && 'value' in firstItem) {
    return [{ name: 'value', dataKey: 'value', color: defaultPalette[0] }];
  }

  return keys.map((key, index) => ({
    name: key,
    dataKey: key,
    color: defaultPalette[index % defaultPalette.length],
  }));
}

export default BarChart;
