import { memo } from "philjs-core";
import { formatNumber, formatCurrency, formatPercent } from "../utils/formatters";

interface MetricCardProps {
  title: string;
  value: number;
  format?: "number" | "currency" | "percent";
  change?: number;
  icon?: string;
  color?: string;
  subtitle?: string;
}

export function MetricCard(props: MetricCardProps) {
  const formattedValue = memo(() => {
    switch (props.format) {
      case "currency":
        return formatCurrency(props.value);
      case "percent":
        return formatPercent(props.value);
      default:
        return formatNumber(props.value);
    }
  });

  const changeColor = memo(() => {
    if (!props.change) return "#666";
    return props.change > 0 ? "#10b981" : "#ef4444";
  });

  const changeIcon = memo(() => {
    if (!props.change) return "";
    return props.change > 0 ? "↑" : "↓";
  });

  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: `2px solid ${props.color || "#e5e7eb"}`,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <div
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginBottom: "0.5rem",
              fontWeight: "500",
            }}
          >
            {props.title}
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#111827",
              marginBottom: "0.25rem",
            }}
          >
            {formattedValue()}
          </div>
          {props.subtitle && (
            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
              {props.subtitle}
            </div>
          )}
        </div>
        {props.icon && (
          <div
            style={{
              fontSize: "2rem",
              opacity: "0.3",
            }}
          >
            {props.icon}
          </div>
        )}
      </div>
      {props.change !== undefined && (
        <div
          style={{
            marginTop: "1rem",
            fontSize: "0.875rem",
            color: changeColor(),
            fontWeight: "600",
          }}
        >
          {changeIcon()} {Math.abs(props.change).toFixed(1)}% vs last period
        </div>
      )}
    </div>
  );
}
