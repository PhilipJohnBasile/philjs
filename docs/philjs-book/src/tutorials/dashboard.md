# Build a Real-time Dashboard with PhilJS

Create an analytics dashboard with live data using SSR, streaming, and WebSocket updates.

**Time to complete**: ~25 minutes

---

## 1. Setup

```bash
pnpm add @philjs/charts recharts
```

## 2. Data Store with Live Updates

```typescript
// src/stores/dashboard.ts
import { signal, resource } from '@philjs/core';

export interface Metric {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ChartPoint {
  timestamp: number;
  value: number;
}

// Live metrics via WebSocket
const ws = new WebSocket('wss://api.example.com/metrics');
export const liveMetrics = signal<Metric[]>([]);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  liveMetrics.set(data.metrics);
};

// Historical data via resource (auto-refetches)
export const chartData = resource<ChartPoint[]>(
  async () => {
    const res = await fetch('/api/metrics/history?period=24h');
    return res.json();
  },
  { refetchInterval: 60000 } // Refresh every minute
);
```

## 3. Dashboard Component

```typescript
// src/components/Dashboard.tsx
import { memo } from '@philjs/core';
import { liveMetrics, chartData } from '../stores/dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '@philjs/shadcn';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  return (
    <div class="dashboard">
      {/* Live metrics row */}
      <div class="grid grid-cols-4 gap-4 mb-8">
        {liveMetrics().map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      {/* Charts */}
      <div class="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Traffic Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <Show when={chartData()} fallback={<ChartSkeleton />}>
              {(data) => (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data}>
                    <XAxis dataKey="timestamp" tickFormatter={formatTime} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Show>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard(props: { metric: Metric }) {
  const { label, value, change, trend } = props.metric;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <Card>
      <CardContent class="pt-6">
        <p class="text-sm text-gray-500">{label}</p>
        <p class="text-3xl font-bold">{value.toLocaleString()}</p>
        <p class={`text-sm ${trendColor}`}>
          {trendIcon} {change > 0 ? '+' : ''}{change}%
        </p>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return <div class="h-[300px] bg-gray-100 animate-pulse rounded" />;
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString();
}
```

## 4. Server-Side Rendering with Streaming

```typescript
// src/entry-server.ts
import { renderToStream } from '@philjs/ssr';
import { Dashboard } from './components/Dashboard';

export async function handler(req: Request) {
  const stream = await renderToStream(<Dashboard />);
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
```

## Key Features

| Feature | How |
|:--------|:----|
| Live updates | WebSocket → signal |
| Auto-refresh data | `resource` with `refetchInterval` |
| SSR streaming | `renderToStream` for fast TTFB |
| Skeleton loading | `<Show>` with fallback |
