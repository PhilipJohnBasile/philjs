import { memo } from "@philjs/core";
import { MetricData } from "../utils/data";

interface LineChartProps {
  data: MetricData[];
  width?: number;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showAxes?: boolean;
}

export function LineChart(props: LineChartProps) {
  const width = props.width || 400;
  const height = props.height || 200;
  const color = props.color || "#667eea";
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = memo(() => {
    if (props.data.length === 0) return "";

    const values = props.data.map((d) => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    return props.data
      .map((d, i) => {
        const x = padding.left + (i / (props.data.length - 1)) * chartWidth;
        const y =
          padding.top +
          chartHeight -
          ((d.value - minValue) / range) * chartHeight;
        return `${x},${y}`;
      })
      .join(" ");
  });

  const area = memo(() => {
    if (props.data.length === 0) return "";

    const linePoints = points();
    const firstPoint = linePoints.split(" ")[0];
    const lastPoint = linePoints.split(" ")[linePoints.split(" ").length - 1];

    const [firstX] = firstPoint.split(",");
    const [lastX] = lastPoint.split(",");

    return `${firstPoint} ${linePoints} ${lastX},${
      height - padding.bottom
    } ${firstX},${height - padding.bottom}`;
  });

  const gridLines = memo(() => {
    if (!props.showGrid) return null;

    const lines = [];
    const numLines = 5;

    for (let i = 0; i <= numLines; i++) {
      const y = padding.top + (i / numLines) * chartHeight;
      lines.push(
        <line
          key={`h-${i}`}
          x1={padding.left}
          y1={y}
          x2={width - padding.right}
          y2={y}
          stroke="#e0e0e0"
          stroke-width="1"
          stroke-dasharray="2,2"
        />
      );
    }

    return <>{lines}</>;
  });

  const yAxisLabels = memo(() => {
    if (!props.showAxes || props.data.length === 0) return null;

    const values = props.data.map((d) => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const numLabels = 5;
    const labels = [];

    for (let i = 0; i <= numLabels; i++) {
      const value = minValue + ((maxValue - minValue) * i) / numLabels;
      const y = padding.top + chartHeight - (i / numLabels) * chartHeight;

      labels.push(
        <text
          key={`label-${i}`}
          x={padding.left - 10}
          y={y + 4}
          text-anchor="end"
          font-size="12"
          fill="#666"
        >
          {value.toFixed(0)}
        </text>
      );
    }

    return <>{labels}</>;
  });

  if (props.data.length === 0) {
    return (
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
          borderRadius: "8px",
          color: "#999",
        }}
      >
        No data available
      </div>
    );
  }

  return (
    <svg width={width} height={height}>
      {gridLines()}
      {yAxisLabels()}

      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color={color} stop-opacity="0.3" />
          <stop offset="100%" stop-color={color} stop-opacity="0.05" />
        </linearGradient>
      </defs>

      <polygon
        points={area()}
        fill={`url(#gradient-${color})`}
      />

      <polyline
        points={points()}
        fill="none"
        stroke={color}
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      {props.data.map((d, i) => {
        const values = props.data.map((d) => d.value);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const range = maxValue - minValue || 1;

        const x = padding.left + (i / (props.data.length - 1)) * chartWidth;
        const y =
          padding.top +
          chartHeight -
          ((d.value - minValue) / range) * chartHeight;

        if (i === props.data.length - 1) {
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill={color}
              stroke="white"
              stroke-width="2"
            />
          );
        }
        return null;
      })}
    </svg>
  );
}
