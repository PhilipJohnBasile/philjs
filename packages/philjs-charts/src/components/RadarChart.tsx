/**
 * RadarChart - Signal-based radar/spider chart component
 */

import type { RadarChartProps, DataPoint, Series } from '../types';
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

export function RadarChart(props: RadarChartProps) {
  const {
    data: dataOrSignal,
    width = '100%',
    height = 300,
    responsive = true,
    margin = { top: 40, right: 40, bottom: 40, left: 40 },
    theme = 'light',
    animation = defaultAnimationConfig,
    className = '',
    style = {},
    ariaLabel = 'Radar chart',
    title,
    dataKey = 'value',
    categories,
    series,
    startAngle = 90,
    outerRadius = '80%',
    gridType = 'polygon',
    fillOpacity = 0.3,
    legend = { show: true, position: 'bottom' },
    tooltip = { show: true },
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

  // Calculate center and radius
  const centerX = chartWidth / 2;
  const centerY = chartHeight / 2;
  const maxRadius = Math.min(centerX, centerY);

  const resolvedRadius = typeof outerRadius === 'string'
    ? (parseFloat(outerRadius) / 100) * maxRadius
    : outerRadius;

  // Determine series from props or data
  const resolvedSeries: Series[] = series || detectSeries(data, categories);

  // Calculate max value for scaling
  const allValues = resolvedSeries.flatMap(s =>
    categories.map(cat => {
      const dataItem = data.find(d => d[dataKey] === cat || d.name === cat);
      return dataItem ? (dataItem[s.dataKey] as number) || 0 : 0;
    })
  );
  const maxValue = Math.max(...allValues, 0) || 100;

  // Calculate angle for each category
  const angleStep = (Math.PI * 2) / categories.length;

  // Convert polar to cartesian
  const polarToCartesian = (angle: number, radius: number) => {
    const adjustedAngle = ((startAngle - 90) * Math.PI) / 180 + angle;
    return {
      x: Math.cos(adjustedAngle) * radius,
      y: Math.sin(adjustedAngle) * radius,
    };
  };

  // Generate grid
  const gridLevels = 5;
  const generateGridPath = (level: number): string => {
    const radius = (resolvedRadius / gridLevels) * level;

    if (gridType === 'circle') {
      return `M ${radius} 0 A ${radius} ${radius} 0 1 1 ${radius} -0.001`;
    }

    // Polygon grid
    const points = categories.map((_, i) => {
      const angle = angleStep * i;
      return polarToCartesian(angle, radius);
    });

    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ') + ' Z';
  };

  // Generate axis lines
  const generateAxisLine = (index: number): { x: number; y: number } => {
    const angle = angleStep * index;
    return polarToCartesian(angle, resolvedRadius);
  };

  // Generate data polygon for a series
  const generateDataPath = (seriesData: Series): string => {
    const points = categories.map((cat, i) => {
      const dataItem = data.find(d => d[dataKey] === cat || d.name === cat);
      const value = dataItem ? (dataItem[seriesData.dataKey] as number) || 0 : 0;
      const normalizedRadius = (value / maxValue) * resolvedRadius;
      const angle = angleStep * i;
      return polarToCartesian(angle, normalizedRadius);
    });

    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ') + ' Z';
  };

  // Animation attributes
  const animationDuration = animation === false ? 0 :
    (typeof animation === 'object' ? animation.duration : defaultAnimationConfig.duration);

  return (
    <svg
      width={responsive ? '100%' : svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      class={`philjs-radar-chart ${className}`}
      style={{
        backgroundColor: resolvedTheme.background,
        ...style,
      }}
      role="img"
      aria-label={ariaLabel}
    >
      {title && <title>{title}</title>}

      <g transform={`translate(${(margin.left || 0) + centerX}, ${(margin.top || 0) + centerY})`}>
        {/* Grid */}
        <g class="grid">
          {Array.from({ length: gridLevels }, (_, i) => (
            <path
              key={`grid-${i}`}
              d={generateGridPath(i + 1)}
              fill="none"
              stroke={resolvedTheme.grid}
              stroke-width={1}
            />
          ))}
        </g>

        {/* Axis lines */}
        <g class="axes">
          {categories.map((_, i) => {
            const end = generateAxisLine(i);
            return (
              <line
                key={`axis-${i}`}
                x1={0}
                y1={0}
                x2={end.x}
                y2={end.y}
                stroke={resolvedTheme.grid}
                stroke-width={1}
              />
            );
          })}
        </g>

        {/* Axis labels */}
        <g class="labels">
          {categories.map((cat, i) => {
            const labelPos = polarToCartesian(angleStep * i, resolvedRadius + 15);
            const angle = angleStep * i;
            const isLeft = Math.cos(((startAngle - 90) * Math.PI) / 180 + angle) < -0.1;
            const isRight = Math.cos(((startAngle - 90) * Math.PI) / 180 + angle) > 0.1;

            return (
              <text
                key={`label-${i}`}
                x={labelPos.x}
                y={labelPos.y}
                text-anchor={isLeft ? 'end' : isRight ? 'start' : 'middle'}
                dominant-baseline="middle"
                fill={resolvedTheme.text}
                font-size="12"
              >
                {cat}
              </text>
            );
          })}
        </g>

        {/* Value labels on grid */}
        <g class="value-labels">
          {Array.from({ length: gridLevels }, (_, i) => {
            const value = (maxValue / gridLevels) * (i + 1);
            const pos = polarToCartesian(0, (resolvedRadius / gridLevels) * (i + 1));
            return (
              <text
                key={`value-${i}`}
                x={pos.x + 5}
                y={pos.y}
                fill={resolvedTheme.axis}
                font-size="10"
                dominant-baseline="middle"
              >
                {value.toFixed(0)}
              </text>
            );
          })}
        </g>

        {/* Data polygons */}
        {resolvedSeries.map((s, seriesIndex) => {
          if (s.hidden) return null;
          const color = s.color || resolvedTheme.colors[seriesIndex % resolvedTheme.colors.length];
          const path = generateDataPath(s);

          return (
            <g key={s.name} class={`data-series series-${seriesIndex}`}>
              <path
                d={path}
                fill={hexToRgba(color, fillOpacity)}
                stroke={color}
                stroke-width={2}
              >
                {animationDuration > 0 && (
                  <animate
                    attributeName="opacity"
                    from="0"
                    to="1"
                    dur={`${animationDuration}ms`}
                    fill="freeze"
                  />
                )}
              </path>

              {/* Data points */}
              {categories.map((cat, i) => {
                const dataItem = data.find(d => d[dataKey] === cat || d.name === cat);
                const value = dataItem ? (dataItem[s.dataKey] as number) || 0 : 0;
                const normalizedRadius = (value / maxValue) * resolvedRadius;
                const angle = angleStep * i;
                const pos = polarToCartesian(angle, normalizedRadius);

                return (
                  <circle
                    key={`point-${i}`}
                    cx={pos.x}
                    cy={pos.y}
                    r={4}
                    fill={color}
                    stroke={resolvedTheme.background}
                    stroke-width={2}
                  />
                );
              })}
            </g>
          );
        })}
      </g>

      {/* Legend */}
      {legend.show && resolvedSeries.length > 1 && (
        <g
          class="legend"
          transform={`translate(${svgWidth / 2 - (resolvedSeries.length * 50)}, ${legend.position === 'top' ? 20 : svgHeight - 20})`}
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
    </svg>
  );
}

// Helper to detect series from data
function detectSeries(data: DataPoint[], categories: string[]): Series[] {
  if (!data.length) return [];

  const firstItem = data[0];
  const keys = Object.keys(firstItem).filter(k =>
    k !== 'name' && k !== 'value' && typeof firstItem[k] === 'number'
  );

  if (keys.length === 0) {
    return [{ name: 'Value', dataKey: 'value', color: defaultPalette[0] }];
  }

  return keys.map((key, index) => ({
    name: key,
    dataKey: key,
    color: defaultPalette[index % defaultPalette.length],
  }));
}

export default RadarChart;
