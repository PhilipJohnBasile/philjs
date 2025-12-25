import { Metadata } from 'next';
import { CodeBlock, Terminal } from '@/components/CodeBlock';
import { Callout } from '@/components/APIReference';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Building a Dashboard',
  description: 'Build a data-rich dashboard application with charts, real-time updates, and data fetching in PhilJS.',
};

export default function BuildingDashboardPage() {
  return (
    <div className="mdx-content">
      <h1>Building a Dashboard</h1>

      <p className="lead text-xl text-surface-600 dark:text-surface-400">
        Build a data-rich dashboard application with charts, real-time updates, and data fetching in PhilJS.
      </p>

      <h2 id="what-well-build">What We'll Build</h2>

      <p>
        In this tutorial, we'll create a comprehensive analytics dashboard that demonstrates:
      </p>

      <ul>
        <li>Data fetching with async operations</li>
        <li>Real-time updates using signals</li>
        <li>Chart visualization with third-party libraries</li>
        <li>Resource management for efficient data loading</li>
        <li>Error handling and loading states</li>
        <li>Component composition for complex UIs</li>
      </ul>

      <h2 id="setup">Project Setup</h2>

      <Terminal commands={[
        'npm create philjs@latest analytics-dashboard',
        'cd analytics-dashboard',
        'npm install chart.js date-fns',
        'npm run dev',
      ]} />

      <h2 id="data-types">Data Types</h2>

      <p>
        First, let's define our data structures. Create <code>src/types.ts</code>:
      </p>

      <CodeBlock
        code={`export interface MetricData {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface DashboardData {
  metrics: MetricData[];
  userActivity: ChartDataPoint[];
  revenue: ChartDataPoint[];
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
}

export interface ApiResponse<T> {
  data: T;
  timestamp: number;
}`}
        language="typescript"
        filename="src/types.ts"
      />

      <h2 id="api-service">API Service</h2>

      <p>
        Create a service to fetch dashboard data. In a real app, this would call your backend API:
      </p>

      <CodeBlock
        code={`import type { DashboardData, ApiResponse } from './types';

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data generator
function generateMockData(): DashboardData {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return {
    metrics: [
      { label: 'Total Users', value: 12543, change: 12.5, trend: 'up' },
      { label: 'Revenue', value: 45678, change: -3.2, trend: 'down' },
      { label: 'Active Sessions', value: 892, change: 5.7, trend: 'up' },
      { label: 'Conversion Rate', value: 3.24, change: 0.1, trend: 'stable' },
    ],
    userActivity: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(now - (29 - i) * dayMs).toISOString().split('T')[0],
      value: Math.floor(Math.random() * 1000) + 500,
    })),
    revenue: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(now - (29 - i) * dayMs).toISOString().split('T')[0],
      value: Math.floor(Math.random() * 5000) + 2000,
    })),
    topProducts: [
      { name: 'Premium Plan', sales: 1234, revenue: 98720 },
      { name: 'Starter Plan', sales: 3456, revenue: 69120 },
      { name: 'Enterprise Plan', sales: 234, revenue: 56160 },
      { name: 'Add-ons', sales: 892, revenue: 17840 },
    ],
  };
}

export async function fetchDashboardData(): Promise<ApiResponse<DashboardData>> {
  await delay(800); // Simulate network delay

  // Simulate occasional errors
  if (Math.random() < 0.1) {
    throw new Error('Failed to fetch dashboard data');
  }

  return {
    data: generateMockData(),
    timestamp: Date.now(),
  };
}

export async function fetchMetrics() {
  await delay(400);
  return generateMockData().metrics;
}`}
        language="typescript"
        filename="src/services/api.ts"
      />

      <h2 id="metric-card">Metric Card Component</h2>

      <p>
        Let's create a reusable component to display metric cards:
      </p>

      <CodeBlock
        code={`import { Show } from 'philjs-core';
import type { MetricData } from './types';

interface MetricCardProps {
  metric: MetricData;
}

export function MetricCard(props: MetricCardProps) {
  const trendColor = () => {
    switch (props.metric.trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const trendIcon = () => {
    switch (props.metric.trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  return (
    <div className="metric-card">
      <div className="metric-label">{props.metric.label}</div>
      <div className="metric-value">
        {props.metric.label.includes('Rate')
          ? \`\${props.metric.value}%\`
          : props.metric.value.toLocaleString()}
      </div>
      <div className={\`metric-change \${trendColor()}\`}>
        <span className="trend-icon">{trendIcon()}</span>
        <span>{Math.abs(props.metric.change)}%</span>
      </div>
    </div>
  );
}`}
        language="typescript"
        filename="src/components/MetricCard.tsx"
      />

      <h2 id="chart-component">Chart Component</h2>

      <p>
        Create a chart component using Chart.js:
      </p>

      <CodeBlock
        code={`import { onMount, onCleanup } from 'philjs-core';
import { Chart, registerables } from 'chart.js';
import type { ChartDataPoint } from '../types';

Chart.register(...registerables);

interface LineChartProps {
  data: ChartDataPoint[];
  label: string;
  color?: string;
}

export function LineChart(props: LineChartProps) {
  let canvasRef: HTMLCanvasElement | undefined;
  let chart: Chart | undefined;

  onMount(() => {
    if (!canvasRef) return;

    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: props.data.map(d => d.date),
        datasets: [
          {
            label: props.label,
            data: props.data.map(d => d.value),
            borderColor: props.color || 'rgb(75, 192, 192)',
            backgroundColor: \`\${props.color || 'rgb(75, 192, 192)'}33\`,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  });

  onCleanup(() => {
    if (chart) {
      chart.destroy();
    }
  });

  return (
    <div className="chart-container">
      <h3 className="chart-title">{props.label}</h3>
      <div className="chart-wrapper">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}`}
        language="typescript"
        filename="src/components/LineChart.tsx"
      />

      <h2 id="resource">Using Resources for Data Fetching</h2>

      <p>
        PhilJS provides the <code>createResource</code> primitive for handling async data:
      </p>

      <CodeBlock
        code={`import { createResource, Show, For } from 'philjs-core';
import { fetchDashboardData } from './services/api';
import { MetricCard } from './components/MetricCard';
import { LineChart } from './components/LineChart';
import './App.css';

function App() {
  const [data, { refetch }] = createResource(fetchDashboardData);

  // Auto-refresh every 30 seconds
  const refreshInterval = setInterval(() => refetch(), 30000);
  onCleanup(() => clearInterval(refreshInterval));

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <button onClick={refetch} className="refresh-btn">
          Refresh Data
        </button>
      </header>

      <Show
        when={!data.loading}
        fallback={
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading dashboard data...</p>
          </div>
        }
      >
        <Show
          when={!data.error}
          fallback={
            <div className="error-state">
              <p>Failed to load dashboard data</p>
              <button onClick={refetch}>Try Again</button>
            </div>
          }
        >
          <div className="dashboard-content">
            {/* Metrics Grid */}
            <section className="metrics-grid">
              <For each={data()?.data.metrics || []}>
                {(metric) => <MetricCard metric={metric} />}
              </For>
            </section>

            {/* Charts */}
            <section className="charts-grid">
              <LineChart
                data={data()?.data.userActivity || []}
                label="User Activity (30 Days)"
                color="rgb(59, 130, 246)"
              />
              <LineChart
                data={data()?.data.revenue || []}
                label="Revenue (30 Days)"
                color="rgb(34, 197, 94)"
              />
            </section>

            {/* Top Products Table */}
            <section className="top-products">
              <h2>Top Products</h2>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Sales</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={data()?.data.topProducts || []}>
                    {(product) => (
                      <tr>
                        <td>{product.name}</td>
                        <td>{product.sales.toLocaleString()}</td>
                        <td>\${product.revenue.toLocaleString()}</td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </section>
          </div>
        </Show>
      </Show>
    </div>
  );
}

export default App;`}
        language="typescript"
        filename="src/App.tsx"
      />

      <Callout type="info" title="Resources">
        <code>createResource</code> handles async operations and provides loading states, error states,
        and automatic re-fetching. It's perfect for data fetching in PhilJS applications.
      </Callout>

      <h2 id="styling">Dashboard Styles</h2>

      <CodeBlock
        code={`.dashboard {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 2rem;
  color: #1a202c;
  margin: 0;
}

.refresh-btn {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.refresh-btn:hover {
  background: #2563eb;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.metric-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 2rem;
  font-weight: bold;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.metric-change {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.chart-container {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 1rem 0;
}

.chart-wrapper {
  height: 300px;
}

.top-products {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.top-products h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 1rem 0;
}

.top-products table {
  width: 100%;
  border-collapse: collapse;
}

.top-products th {
  text-align: left;
  padding: 0.75rem;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.top-products td {
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  color: #1a202c;
}

.top-products tr:last-child td {
  border-bottom: none;
}`}
        language="css"
        filename="src/App.css"
      />

      <h2 id="real-time-updates">Adding Real-Time Updates</h2>

      <p>
        Let's enhance the dashboard with WebSocket support for real-time data:
      </p>

      <CodeBlock
        code={`import { createSignal, createEffect, onCleanup } from 'philjs-core';

interface RealtimeMetric {
  type: string;
  value: number;
  timestamp: number;
}

export function useRealtimeMetrics() {
  const [metrics, setMetrics] = createSignal<RealtimeMetric[]>([]);
  let ws: WebSocket | undefined;

  createEffect(() => {
    // Connect to WebSocket
    ws = new WebSocket('wss://api.example.com/metrics');

    ws.onmessage = (event) => {
      const metric: RealtimeMetric = JSON.parse(event.data);
      setMetrics(prev => [...prev.slice(-50), metric]); // Keep last 50
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      // Implement reconnection logic here
    };
  });

  onCleanup(() => {
    if (ws) {
      ws.close();
    }
  });

  return metrics;
}

// Usage in App component:
function App() {
  const realtimeMetrics = useRealtimeMetrics();

  return (
    <div>
      <h3>Real-time Metrics</h3>
      <For each={realtimeMetrics()}>
        {(metric) => (
          <div>
            {metric.type}: {metric.value}
          </div>
        )}
      </For>
    </div>
  );
}`}
        language="typescript"
        filename="src/hooks/useRealtimeMetrics.ts"
      />

      <h2 id="advanced-features">Advanced Features</h2>

      <h3>Date Range Selector</h3>

      <CodeBlock
        code={`import { createSignal } from 'philjs-core';

export function DateRangeSelector() {
  const [range, setRange] = createSignal<'7d' | '30d' | '90d'>('30d');

  return (
    <div className="date-range-selector">
      <button
        className={range() === '7d' ? 'active' : ''}
        onClick={() => setRange('7d')}
      >
        Last 7 Days
      </button>
      <button
        className={range() === '30d' ? 'active' : ''}
        onClick={() => setRange('30d')}
      >
        Last 30 Days
      </button>
      <button
        className={range() === '90d' ? 'active' : ''}
        onClick={() => setRange('90d')}
      >
        Last 90 Days
      </button>
    </div>
  );
}`}
        language="typescript"
        filename="src/components/DateRangeSelector.tsx"
      />

      <h3>Export Data Functionality</h3>

      <CodeBlock
        code={`function exportToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => row[header]).join(',')
    ),
  ].join('\\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Usage:
<button onClick={() => exportToCSV(data()?.data.topProducts || [], 'products.csv')}>
  Export to CSV
</button>`}
        language="typescript"
      />

      <h2 id="next-steps">Next Steps</h2>

      <ul>
        <li>Add user authentication and authorization</li>
        <li>Implement data filtering and searching</li>
        <li>Add drill-down capabilities for detailed views</li>
        <li>Create custom dashboard layouts with drag-and-drop</li>
        <li>Add data export in multiple formats (CSV, PDF, Excel)</li>
        <li>Implement real-time notifications for important events</li>
        <li>Add responsive design for mobile devices</li>
        <li>Create shareable dashboard links</li>
      </ul>

      <div className="grid md:grid-cols-2 gap-4 mt-6 not-prose">
        <Link
          href="/docs/tutorials/rust-fullstack"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Rust Full-Stack Guide</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Build full-stack apps with Rust backend
          </p>
        </Link>

        <Link
          href="/docs/core-concepts/effects"
          className="block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <h3 className="font-semibold text-surface-900 dark:text-white">Effects & Lifecycle</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
            Master side effects and component lifecycle
          </p>
        </Link>
      </div>
    </div>
  );
}
