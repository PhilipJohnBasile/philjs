import { signal, memo, effect, onCleanup } from "@philjs/core";
import { LineChart } from "../components/LineChart";
import { BarChart } from "../components/BarChart";
import { MetricCard } from "../components/MetricCard";
import { createDashboardStreams, calculateStats } from "../utils/data";

export function Overview() {
  const streams = createDashboardStreams();
  const isLive = signal(true);

  effect(() => {
    if (isLive()) {
      streams.activeUsers.start();
      streams.responseTime.start();
      streams.revenue.start();
      streams.errorRate.start();
    } else {
      streams.activeUsers.stop();
      streams.responseTime.stop();
      streams.revenue.stop();
      streams.errorRate.stop();
    }
  });

  onCleanup(() => {
    streams.activeUsers.stop();
    streams.responseTime.stop();
    streams.revenue.stop();
    streams.errorRate.stop();
  });

  const activeUsersStats = memo(() => calculateStats(streams.activeUsers.data()));
  const responseTimeStats = memo(() => calculateStats(streams.responseTime.data()));
  const revenueStats = memo(() => calculateStats(streams.revenue.data()));
  const errorRateStats = memo(() => calculateStats(streams.errorRate.data()));

  const countryData = memo(() => [
    { label: "USA", value: 450 },
    { label: "UK", value: 320 },
    { label: "CA", value: 180 },
    { label: "DE", value: 150 },
    { label: "FR", value: 130 },
  ]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#111827",
              marginBottom: "0.5rem",
            }}
          >
            Dashboard Overview
          </h1>
          <p style={{ color: "#6b7280" }}>
            Real-time analytics powered by PhilJS signals
          </p>
        </div>
        <button
          onClick={() => isLive.set(!isLive())}
          style={{
            padding: "0.75rem 1.5rem",
            background: isLive() ? "#ef4444" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "white",
              animation: isLive() ? "pulse 2s infinite" : "none",
            }}
          />
          {isLive() ? "Live (Click to Pause)" : "Paused (Click to Resume)"}
        </button>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}
      </style>

      {/* Metrics Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <MetricCard
          title="Active Users"
          value={activeUsersStats().current}
          format="number"
          change={3.2}
          icon="👥"
          color="#667eea"
          subtitle={`Avg: ${activeUsersStats().avg.toFixed(0)}`}
        />
        <MetricCard
          title="Response Time"
          value={responseTimeStats().current}
          format="number"
          change={-2.1}
          icon="⚡"
          color="#10b981"
          subtitle={`Min: ${responseTimeStats().min.toFixed(0)}ms`}
        />
        <MetricCard
          title="Revenue"
          value={revenueStats().current}
          format="currency"
          change={5.7}
          icon="💰"
          color="#f59e0b"
          subtitle={`Total: $${revenueStats().avg.toFixed(0)}/min`}
        />
        <MetricCard
          title="Error Rate"
          value={errorRateStats().current}
          format="percent"
          change={-0.8}
          icon="⚠️"
          color="#ef4444"
          subtitle={`Target: <3%`}
        />
      </div>

      {/* Charts Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <ChartCard title="Active Users (Live)" subtitle="Last 60 minutes">
          <LineChart
            data={streams.activeUsers.data()}
            width={550}
            height={250}
            color="#667eea"
            showGrid={true}
            showAxes={true}
          />
        </ChartCard>

        <ChartCard title="Response Time (ms)" subtitle="Last 60 minutes">
          <LineChart
            data={streams.responseTime.data()}
            width={550}
            height={250}
            color="#10b981"
            showGrid={true}
            showAxes={true}
          />
        </ChartCard>

        <ChartCard title="Revenue Stream" subtitle="Last 60 minutes">
          <LineChart
            data={streams.revenue.data()}
            width={550}
            height={250}
            color="#f59e0b"
            showGrid={true}
            showAxes={true}
          />
        </ChartCard>

        <ChartCard title="Users by Country" subtitle="Current distribution">
          <BarChart data={countryData()} width={550} height={250} color="#764ba2" />
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard(props: { title: string; subtitle: string; children: any }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <h3
          style={{
            fontSize: "1.125rem",
            fontWeight: "600",
            color: "#111827",
            marginBottom: "0.25rem",
          }}
        >
          {props.title}
        </h3>
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{props.subtitle}</p>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {props.children}
      </div>
    </div>
  );
}
