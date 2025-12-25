/**
 * Heatmap - Signal-based heatmap visualization component
 */

import type { HeatmapProps, HeatmapDataPoint } from '../types';
import { lightTheme, darkTheme, sequentialPalettes, getContrastColor } from '../utils/colors';
import { defaultAnimationConfig } from '../utils/animations';

// Check if value is a signal
function isSignal<T>(value: T | (() => T)): value is () => T {
  return typeof value === 'function';
}

// Get data from signal or direct value
function getData<T>(value: T | (() => T)): T {
  return isSignal(value) ? value() : value;
}

export function Heatmap(props: HeatmapProps) {
  const {
    data: dataOrSignal,
    width = '100%',
    height = 300,
    responsive = true,
    margin = { top: 30, right: 30, bottom: 50, left: 80 },
    theme = 'light',
    animation = defaultAnimationConfig,
    className = '',
    style = {},
    ariaLabel = 'Heatmap',
    title,
    xCategories,
    yCategories,
    xDataKey = 'x',
    yDataKey = 'y',
    valueDataKey = 'value',
    colorScale = sequentialPalettes.blues,
    cellBorderWidth = 1,
    cellBorderColor,
    showLabels = true,
    tooltip = { show: true },
    onCellClick,
  } = props;

  // Get reactive data
  const data = getData(dataOrSignal);

  // Resolve theme
  const resolvedTheme = typeof theme === 'string'
    ? (theme === 'dark' ? darkTheme : lightTheme)
    : theme;

  const resolvedBorderColor = cellBorderColor || resolvedTheme.background;

  // Calculate dimensions
  const svgWidth = typeof width === 'number' ? width : 600;
  const svgHeight = typeof height === 'number' ? height : 300;
  const chartWidth = svgWidth - (margin.left || 0) - (margin.right || 0);
  const chartHeight = svgHeight - (margin.top || 0) - (margin.bottom || 0);

  // Calculate cell dimensions
  const cellWidth = chartWidth / xCategories.length;
  const cellHeight = chartHeight / yCategories.length;

  // Calculate value range
  const values = data.map(d => d[valueDataKey] as number);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // Color scale function
  const getColor = (value: number): string => {
    if (maxValue === minValue) return colorScale[Math.floor(colorScale.length / 2)];
    const normalized = (value - minValue) / (maxValue - minValue);
    const index = Math.floor(normalized * (colorScale.length - 1));
    return colorScale[Math.max(0, Math.min(index, colorScale.length - 1))];
  };

  // Get cell data
  const getCellData = (xCat: string | number, yCat: string | number): HeatmapDataPoint | undefined => {
    return data.find(d =>
      (d[xDataKey] === xCat || String(d[xDataKey]) === String(xCat)) &&
      (d[yDataKey] === yCat || String(d[yDataKey]) === String(yCat))
    );
  };

  // Animation attributes
  const animationDuration = animation === false ? 0 :
    (typeof animation === 'object' ? animation.duration : defaultAnimationConfig.duration);

  return (
    <svg
      width={responsive ? '100%' : svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      class={`philjs-heatmap ${className}`}
      style={{
        backgroundColor: resolvedTheme.background,
        ...style,
      }}
      role="img"
      aria-label={ariaLabel}
    >
      {title && <title>{title}</title>}

      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* X Axis labels */}
        <g class="x-axis">
          {xCategories.map((cat, i) => (
            <text
              key={`x-label-${i}`}
              x={i * cellWidth + cellWidth / 2}
              y={-10}
              text-anchor="middle"
              fill={resolvedTheme.text}
              font-size="12"
            >
              {cat}
            </text>
          ))}
        </g>

        {/* Y Axis labels */}
        <g class="y-axis">
          {yCategories.map((cat, i) => (
            <text
              key={`y-label-${i}`}
              x={-10}
              y={i * cellHeight + cellHeight / 2}
              text-anchor="end"
              dominant-baseline="middle"
              fill={resolvedTheme.text}
              font-size="12"
            >
              {cat}
            </text>
          ))}
        </g>

        {/* Cells */}
        <g class="cells">
          {yCategories.map((yCat, yIndex) =>
            xCategories.map((xCat, xIndex) => {
              const cellData = getCellData(xCat, yCat);
              const value = cellData ? (cellData[valueDataKey] as number) : 0;
              const color = getColor(value);
              const textColor = getContrastColor(color);
              const x = xIndex * cellWidth;
              const y = yIndex * cellHeight;

              return (
                <g
                  key={`cell-${xIndex}-${yIndex}`}
                  class="cell"
                  style={{ cursor: onCellClick && cellData ? 'pointer' : 'default' }}
                  onClick={() => cellData && onCellClick?.(cellData)}
                >
                  <rect
                    x={x}
                    y={y}
                    width={cellWidth}
                    height={cellHeight}
                    fill={color}
                    stroke={resolvedBorderColor}
                    stroke-width={cellBorderWidth}
                  >
                    {animationDuration > 0 && (
                      <animate
                        attributeName="opacity"
                        from="0"
                        to="1"
                        dur={`${animationDuration}ms`}
                        fill="freeze"
                        begin={`${(yIndex * xCategories.length + xIndex) * 10}ms`}
                      />
                    )}
                  </rect>

                  {showLabels && cellData && (
                    <text
                      x={x + cellWidth / 2}
                      y={y + cellHeight / 2}
                      text-anchor="middle"
                      dominant-baseline="middle"
                      fill={textColor}
                      font-size={Math.min(cellWidth, cellHeight) * 0.3}
                      font-weight="500"
                    >
                      {value.toLocaleString()}
                    </text>
                  )}
                </g>
              );
            })
          )}
        </g>

        {/* Color legend */}
        <g class="legend" transform={`translate(${chartWidth + 10}, 0)`}>
          <defs>
            <linearGradient id="heatmap-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
              {colorScale.map((color, i) => (
                <stop
                  key={`stop-${i}`}
                  offset={`${(i / (colorScale.length - 1)) * 100}%`}
                  stop-color={color}
                />
              ))}
            </linearGradient>
          </defs>

          <rect
            x={0}
            y={0}
            width={15}
            height={chartHeight}
            fill="url(#heatmap-gradient)"
            stroke={resolvedTheme.grid}
          />

          <text
            x={20}
            y={10}
            fill={resolvedTheme.text}
            font-size="10"
          >
            {maxValue.toLocaleString()}
          </text>

          <text
            x={20}
            y={chartHeight}
            fill={resolvedTheme.text}
            font-size="10"
          >
            {minValue.toLocaleString()}
          </text>
        </g>
      </g>
    </svg>
  );
}

export default Heatmap;
