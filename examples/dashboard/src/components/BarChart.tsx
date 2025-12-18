import { memo } from "philjs-core";

interface BarChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartData[];
  width?: number;
  height?: number;
  color?: string;
}

export function BarChart(props: BarChartProps) {
  const width = props.width || 400;
  const height = props.height || 200;
  const color = props.color || "#764ba2";
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = memo(() => Math.max(...props.data.map((d) => d.value), 1));

  const barWidth = memo(() => {
    if (props.data.length === 0) return 0;
    return chartWidth / props.data.length - 10;
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
      {/* Y-axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const y = padding.top + chartHeight * (1 - ratio);
        const value = maxValue() * ratio;
        return (
          <g key={i}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#e0e0e0"
              stroke-width="1"
              stroke-dasharray="2,2"
            />
            <text
              x={padding.left - 10}
              y={y + 4}
              text-anchor="end"
              font-size="12"
              fill="#666"
            >
              {value.toFixed(0)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {props.data.map((d, i) => {
        const x = padding.left + i * (chartWidth / props.data.length) + 5;
        const barHeight = (d.value / maxValue()) * chartHeight;
        const y = padding.top + chartHeight - barHeight;

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth()}
              height={barHeight}
              fill={color}
              rx="4"
              opacity="0.8"
            />
            <text
              x={x + barWidth() / 2}
              y={height - padding.bottom + 15}
              text-anchor="middle"
              font-size="11"
              fill="#666"
            >
              {d.label}
            </text>
            <text
              x={x + barWidth() / 2}
              y={y - 5}
              text-anchor="middle"
              font-size="12"
              fill="#333"
              font-weight="bold"
            >
              {d.value.toFixed(0)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
