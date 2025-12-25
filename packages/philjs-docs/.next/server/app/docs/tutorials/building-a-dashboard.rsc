2:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","7978","static/chunks/app/docs/tutorials/building-a-dashboard/page-ea1fbbb86baa5145.js"],"Terminal"]
3:I[8850,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","7978","static/chunks/app/docs/tutorials/building-a-dashboard/page-ea1fbbb86baa5145.js"],"CodeBlock"]
8:I[7696,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","7978","static/chunks/app/docs/tutorials/building-a-dashboard/page-ea1fbbb86baa5145.js"],"Callout"]
b:I[6542,["1763","static/chunks/1763-be59ea8b08cc01ae.js","7696","static/chunks/7696-3ed40d5e79880c18.js","7978","static/chunks/app/docs/tutorials/building-a-dashboard/page-ea1fbbb86baa5145.js"],""]
c:I[6419,[],""]
d:I[8445,[],""]
e:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"Sidebar"]
f:I[8765,["1763","static/chunks/1763-be59ea8b08cc01ae.js","3998","static/chunks/app/docs/layout-7a64e01358952c8e.js"],"docsNavigation"]
10:I[1229,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"ThemeProvider"]
11:I[8529,["1763","static/chunks/1763-be59ea8b08cc01ae.js","2793","static/chunks/2793-28ddd1020ce77999.js","3185","static/chunks/app/layout-575709e7d70e2afe.js"],"Header"]
4:T6aa,import type { DashboardData, ApiResponse } from './types';

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
}5:T43e,import { Show } from 'philjs-core';
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
          ? `${props.metric.value}%`
          : props.metric.value.toLocaleString()}
      </div>
      <div className={`metric-change ${trendColor()}`}>
        <span className="trend-icon">{trendIcon()}</span>
        <span>{Math.abs(props.metric.change)}%</span>
      </div>
    </div>
  );
}6:T5ec,import { onMount, onCleanup } from 'philjs-core';
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
            backgroundColor: `${props.color || 'rgb(75, 192, 192)'}33`,
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
}7:Tb21,import { createResource, Show, For } from 'philjs-core';
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
                        <td>${product.revenue.toLocaleString()}</td>
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

export default App;9:T9cd,.dashboard {
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
}a:T4b4,import { createSignal, createEffect, onCleanup } from 'philjs-core';

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
}0:["cd22Ei08xvul0IDkb5kRy",[[["",{"children":["docs",{"children":["tutorials",{"children":["building-a-dashboard",{"children":["__PAGE__",{}]}]}]}]},"$undefined","$undefined",true],["",{"children":["docs",{"children":["tutorials",{"children":["building-a-dashboard",{"children":["__PAGE__",{},[["$L1",["$","div",null,{"className":"mdx-content","children":[["$","h1",null,{"children":"Building a Dashboard"}],["$","p",null,{"className":"lead text-xl text-surface-600 dark:text-surface-400","children":"Build a data-rich dashboard application with charts, real-time updates, and data fetching in PhilJS."}],["$","h2",null,{"id":"what-well-build","children":"What We'll Build"}],["$","p",null,{"children":"In this tutorial, we'll create a comprehensive analytics dashboard that demonstrates:"}],["$","ul",null,{"children":[["$","li",null,{"children":"Data fetching with async operations"}],["$","li",null,{"children":"Real-time updates using signals"}],["$","li",null,{"children":"Chart visualization with third-party libraries"}],["$","li",null,{"children":"Resource management for efficient data loading"}],["$","li",null,{"children":"Error handling and loading states"}],["$","li",null,{"children":"Component composition for complex UIs"}]]}],["$","h2",null,{"id":"setup","children":"Project Setup"}],["$","$L2",null,{"commands":["npm create philjs@latest analytics-dashboard","cd analytics-dashboard","npm install chart.js date-fns","npm run dev"]}],["$","h2",null,{"id":"data-types","children":"Data Types"}],["$","p",null,{"children":["First, let's define our data structures. Create ",["$","code",null,{"children":"src/types.ts"}],":"]}],["$","$L3",null,{"code":"export interface MetricData {\n  label: string;\n  value: number;\n  change: number;\n  trend: 'up' | 'down' | 'stable';\n}\n\nexport interface ChartDataPoint {\n  date: string;\n  value: number;\n}\n\nexport interface DashboardData {\n  metrics: MetricData[];\n  userActivity: ChartDataPoint[];\n  revenue: ChartDataPoint[];\n  topProducts: Array<{\n    name: string;\n    sales: number;\n    revenue: number;\n  }>;\n}\n\nexport interface ApiResponse<T> {\n  data: T;\n  timestamp: number;\n}","language":"typescript","filename":"src/types.ts"}],["$","h2",null,{"id":"api-service","children":"API Service"}],["$","p",null,{"children":"Create a service to fetch dashboard data. In a real app, this would call your backend API:"}],["$","$L3",null,{"code":"$4","language":"typescript","filename":"src/services/api.ts"}],["$","h2",null,{"id":"metric-card","children":"Metric Card Component"}],["$","p",null,{"children":"Let's create a reusable component to display metric cards:"}],["$","$L3",null,{"code":"$5","language":"typescript","filename":"src/components/MetricCard.tsx"}],["$","h2",null,{"id":"chart-component","children":"Chart Component"}],["$","p",null,{"children":"Create a chart component using Chart.js:"}],["$","$L3",null,{"code":"$6","language":"typescript","filename":"src/components/LineChart.tsx"}],["$","h2",null,{"id":"resource","children":"Using Resources for Data Fetching"}],["$","p",null,{"children":["PhilJS provides the ",["$","code",null,{"children":"createResource"}]," primitive for handling async data:"]}],["$","$L3",null,{"code":"$7","language":"typescript","filename":"src/App.tsx"}],["$","$L8",null,{"type":"info","title":"Resources","children":[["$","code",null,{"children":"createResource"}]," handles async operations and provides loading states, error states, and automatic re-fetching. It's perfect for data fetching in PhilJS applications."]}],["$","h2",null,{"id":"styling","children":"Dashboard Styles"}],["$","$L3",null,{"code":"$9","language":"css","filename":"src/App.css"}],["$","h2",null,{"id":"real-time-updates","children":"Adding Real-Time Updates"}],["$","p",null,{"children":"Let's enhance the dashboard with WebSocket support for real-time data:"}],["$","$L3",null,{"code":"$a","language":"typescript","filename":"src/hooks/useRealtimeMetrics.ts"}],["$","h2",null,{"id":"advanced-features","children":"Advanced Features"}],["$","h3",null,{"children":"Date Range Selector"}],["$","$L3",null,{"code":"import { createSignal } from 'philjs-core';\n\nexport function DateRangeSelector() {\n  const [range, setRange] = createSignal<'7d' | '30d' | '90d'>('30d');\n\n  return (\n    <div className=\"date-range-selector\">\n      <button\n        className={range() === '7d' ? 'active' : ''}\n        onClick={() => setRange('7d')}\n      >\n        Last 7 Days\n      </button>\n      <button\n        className={range() === '30d' ? 'active' : ''}\n        onClick={() => setRange('30d')}\n      >\n        Last 30 Days\n      </button>\n      <button\n        className={range() === '90d' ? 'active' : ''}\n        onClick={() => setRange('90d')}\n      >\n        Last 90 Days\n      </button>\n    </div>\n  );\n}","language":"typescript","filename":"src/components/DateRangeSelector.tsx"}],["$","h3",null,{"children":"Export Data Functionality"}],["$","$L3",null,{"code":"function exportToCSV(data: any[], filename: string) {\n  const headers = Object.keys(data[0]);\n  const csv = [\n    headers.join(','),\n    ...data.map(row =>\n      headers.map(header => row[header]).join(',')\n    ),\n  ].join('\\n');\n\n  const blob = new Blob([csv], { type: 'text/csv' });\n  const url = URL.createObjectURL(blob);\n  const link = document.createElement('a');\n  link.href = url;\n  link.download = filename;\n  link.click();\n  URL.revokeObjectURL(url);\n}\n\n// Usage:\n<button onClick={() => exportToCSV(data()?.data.topProducts || [], 'products.csv')}>\n  Export to CSV\n</button>","language":"typescript"}],["$","h2",null,{"id":"next-steps","children":"Next Steps"}],["$","ul",null,{"children":[["$","li",null,{"children":"Add user authentication and authorization"}],["$","li",null,{"children":"Implement data filtering and searching"}],["$","li",null,{"children":"Add drill-down capabilities for detailed views"}],["$","li",null,{"children":"Create custom dashboard layouts with drag-and-drop"}],["$","li",null,{"children":"Add data export in multiple formats (CSV, PDF, Excel)"}],["$","li",null,{"children":"Implement real-time notifications for important events"}],["$","li",null,{"children":"Add responsive design for mobile devices"}],["$","li",null,{"children":"Create shareable dashboard links"}]]}],["$","div",null,{"className":"grid md:grid-cols-2 gap-4 mt-6 not-prose","children":[["$","$Lb",null,{"href":"/docs/tutorials/rust-fullstack","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Rust Full-Stack Guide"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Build full-stack apps with Rust backend"}]]}],["$","$Lb",null,{"href":"/docs/core-concepts/effects","className":"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors","children":[["$","h3",null,{"className":"font-semibold text-surface-900 dark:text-white","children":"Effects & Lifecycle"}],["$","p",null,{"className":"text-sm text-surface-600 dark:text-surface-400 mt-1","children":"Master side effects and component lifecycle"}]]}]]}]]}],null],null],null]},[null,["$","$Lc",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","tutorials","children","building-a-dashboard","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Ld",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[null,["$","$Lc",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children","tutorials","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Ld",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]],null]},[[null,["$","div",null,{"className":"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8","children":["$","div",null,{"className":"flex gap-12","children":[["$","$Le",null,{"sections":"$f"}],["$","main",null,{"className":"flex-1 min-w-0","children":["$","article",null,{"className":"prose prose-surface dark:prose-invert max-w-none","children":["$","$Lc",null,{"parallelRouterKey":"children","segmentPath":["children","docs","children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Ld",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","notFoundStyles":"$undefined"}]}]}]]}]}]],null],null]},[[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/00bb994365e07be9.css","precedence":"next","crossOrigin":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":["$","body",null,{"className":"__variable_f367f3 __variable_3c557b font-sans antialiased","children":["$","$L10",null,{"children":["$","div",null,{"className":"min-h-screen bg-white dark:bg-surface-950","children":[["$","$L11",null,{}],["$","$Lc",null,{"parallelRouterKey":"children","segmentPath":["children"],"error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Ld",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":"404"}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],"notFoundStyles":[]}]]}]}]}]}]],null],null],["$L12",null]]]]
12:[["$","meta","0",{"name":"viewport","content":"width=device-width, initial-scale=1"}],["$","meta","1",{"charSet":"utf-8"}],["$","title","2",{"children":"Building a Dashboard | PhilJS"}],["$","meta","3",{"name":"description","content":"Build a data-rich dashboard application with charts, real-time updates, and data fetching in PhilJS."}],["$","meta","4",{"name":"author","content":"PhilJS Team"}],["$","link","5",{"rel":"manifest","href":"/site.webmanifest","crossOrigin":"use-credentials"}],["$","meta","6",{"name":"keywords","content":"philjs,javascript,typescript,rust,framework,signals,reactivity,wasm"}],["$","meta","7",{"property":"og:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","8",{"property":"og:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","9",{"property":"og:url","content":"https://philjs.dev/"}],["$","meta","10",{"property":"og:site_name","content":"PhilJS"}],["$","meta","11",{"property":"og:locale","content":"en_US"}],["$","meta","12",{"property":"og:image","content":"https://philjs.dev/og-image.png"}],["$","meta","13",{"property":"og:image:width","content":"1200"}],["$","meta","14",{"property":"og:image:height","content":"630"}],["$","meta","15",{"property":"og:image:alt","content":"PhilJS Framework"}],["$","meta","16",{"property":"og:type","content":"website"}],["$","meta","17",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","18",{"name":"twitter:title","content":"PhilJS - The Modern Web Framework"}],["$","meta","19",{"name":"twitter:description","content":"A fast, modern web framework with fine-grained reactivity and optional Rust integration."}],["$","meta","20",{"name":"twitter:image","content":"https://philjs.dev/og-image.png"}],["$","link","21",{"rel":"shortcut icon","href":"/favicon-16x16.png"}],["$","link","22",{"rel":"icon","href":"/favicon.ico"}],["$","link","23",{"rel":"apple-touch-icon","href":"/apple-touch-icon.png"}]]
1:null
