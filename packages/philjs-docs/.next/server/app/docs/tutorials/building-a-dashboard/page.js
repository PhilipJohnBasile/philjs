(()=>{var e={};e.id=7978,e.ids=[7978],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},8865:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>o.a,__next_app__:()=>h,originalPathname:()=>p,pages:()=>l,routeModule:()=>u,tree:()=>d}),r(199),r(2108),r(4001),r(1305);var a=r(3545),s=r(5947),i=r(9761),o=r.n(i),n=r(4798),c={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(c[e]=()=>n[e]);r.d(t,c);let d=["",{children:["docs",{children:["tutorials",{children:["building-a-dashboard",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,199)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\tutorials\\building-a-dashboard\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,2108)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,4001)),"C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,1305,23)),"next/dist/client/components/not-found-error"]}],l=["C:\\Users\\Phili\\Git\\philjs\\packages\\philjs-docs\\src\\app\\docs\\tutorials\\building-a-dashboard\\page.tsx"],p="/docs/tutorials/building-a-dashboard/page",h={require:r,loadChunk:()=>Promise.resolve()},u=new a.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/docs/tutorials/building-a-dashboard/page",pathname:"/docs/tutorials/building-a-dashboard",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},4357:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,5505,23)),Promise.resolve().then(r.bind(r,2015)),Promise.resolve().then(r.bind(r,306))},4444:(e,t,r)=>{Promise.resolve().then(r.bind(r,5173))},5173:(e,t,r)=>{"use strict";r.d(t,{Sidebar:()=>l,docsNavigation:()=>d});var a=r(6741),s=r(8972),i=r(47),o=r(7678),n=r(3178),c=r(5280);let d=[{title:"Getting Started",links:[{title:"Installation",href:"/docs/getting-started/installation"},{title:"Quick Start (TypeScript)",href:"/docs/getting-started/quickstart-typescript"},{title:"Quick Start (Rust)",href:"/docs/getting-started/quickstart-rust"},{title:"Project Structure",href:"/docs/getting-started/project-structure"},{title:"IDE Setup",href:"/docs/getting-started/ide-setup"}]},{title:"Tutorials",links:[{title:"Building a Todo App",href:"/docs/tutorials/building-a-todo-app"},{title:"Building a Dashboard",href:"/docs/tutorials/building-a-dashboard"},{title:"Rust Full-Stack Guide",href:"/docs/tutorials/rust-fullstack"},{title:"Migration from React",href:"/docs/tutorials/migration-from-react"}]},{title:"Core Concepts",links:[{title:"Signals",href:"/docs/core-concepts/signals"},{title:"Components",href:"/docs/core-concepts/components"},{title:"Effects & Memos",href:"/docs/core-concepts/effects"},{title:"Stores",href:"/docs/core-concepts/stores"},{title:"Server-Side Rendering",href:"/docs/core-concepts/ssr"}]},{title:"Guides",links:[{title:"SSR & Hydration",href:"/docs/guides/ssr-hydration"},{title:"Islands Architecture",href:"/docs/guides/islands"},{title:"LiveView",href:"/docs/guides/liveview"},{title:"Routing",href:"/docs/guides/routing"},{title:"Forms",href:"/docs/guides/forms"},{title:"Styling",href:"/docs/guides/styling"},{title:"State Management",href:"/docs/guides/state-management"},{title:"Data Fetching",href:"/docs/guides/data-fetching"},{title:"Authentication",href:"/docs/guides/auth"},{title:"Deployment",href:"/docs/guides/deployment"}]},{title:"API Reference",links:[{title:"philjs-core",href:"/docs/api/core"},{title:"philjs-router",href:"/docs/api/router"},{title:"philjs-ssr",href:"/docs/api/ssr"},{title:"philjs-forms",href:"/docs/api/forms"},{title:"Component Library",href:"/docs/api/ui"}]},{title:"Rust Guide",links:[{title:"Rust Quickstart",href:"/docs/rust-guide/quickstart"},{title:"cargo-philjs CLI",href:"/docs/rust-guide/cargo-philjs"},{title:"View Macro Syntax",href:"/docs/rust-guide/view-macro"},{title:"Server Functions",href:"/docs/rust-guide/server-functions"},{title:"Axum Integration",href:"/docs/rust-guide/axum"},{title:"WASM Deployment",href:"/docs/rust-guide/wasm"}]},{title:"Comparison",links:[{title:"vs React",href:"/docs/comparison/react"},{title:"vs SolidJS",href:"/docs/comparison/solidjs"},{title:"vs Leptos",href:"/docs/comparison/leptos"}]},{title:"Examples",links:[{title:"Example Gallery",href:"/examples"}]}];function l({sections:e}){let t=(0,i.usePathname)(),[r,d]=(0,c.useState)(()=>{let r=e.find(e=>e.links.some(e=>t?.startsWith(e.href)));return new Set(r?[r.title]:[e[0]?.title])}),l=e=>{d(t=>{let r=new Set(t);return r.has(e)?r.delete(e):r.add(e),r})};return a.jsx("nav",{className:"w-64 flex-shrink-0",children:a.jsx("div",{className:"sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-4",children:a.jsx("ul",{className:"space-y-6",children:e.map(e=>{let i=r.has(e.title),c=e.links.some(e=>t===e.href);return(0,a.jsxs)("li",{children:[(0,a.jsxs)("button",{onClick:()=>l(e.title),className:"flex items-center justify-between w-full text-left font-semibold text-surface-900 dark:text-white mb-2",children:[e.title,a.jsx(n.Z,{className:(0,o.Z)("w-4 h-4 transition-transform",i&&"rotate-90")})]}),(i||c)&&a.jsx("ul",{className:"space-y-1 border-l border-surface-200 dark:border-surface-700 pl-4 animate-slide-in",children:e.links.map(e=>{let r=t===e.href;return a.jsx("li",{children:a.jsx(s.default,{href:e.href,className:(0,o.Z)("block py-1.5 px-3 text-sm rounded-lg transition-colors -ml-px border-l-2",r?"text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-500":"text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white border-transparent hover:border-surface-300 dark:hover:border-surface-600"),children:e.title})},e.href)})})]},e.title)})})})})}},8951:(e,t,r)=>{"use strict";r.d(t,{default:()=>s.a});var a=r(7654),s=r.n(a)},7654:(e,t,r)=>{"use strict";let{createProxy:a}=r(1471);e.exports=a("C:\\Users\\Phili\\Git\\philjs\\node_modules\\.pnpm\\next@14.2.35_@opentelemetry+api@1.9.0_@playwright+test@1.55.1_react-dom@18.3.1_react@18.3.1__react@18.3.1\\node_modules\\next\\dist\\client\\link.js")},2108:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>n});var a=r(9015),s=r(1471);let i=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#docsNavigation`),o=(0,s.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\Sidebar.tsx#Sidebar`);function n({children:e}){return a.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:(0,a.jsxs)("div",{className:"flex gap-12",children:[a.jsx(o,{sections:i}),a.jsx("main",{className:"flex-1 min-w-0",children:a.jsx("article",{className:"prose prose-surface dark:prose-invert max-w-none",children:e})})]})})}},199:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>c,metadata:()=>n});var a=r(9015),s=r(3288),i=r(7309),o=r(8951);let n={title:"Building a Dashboard",description:"Build a data-rich dashboard application with charts, real-time updates, and data fetching in PhilJS."};function c(){return(0,a.jsxs)("div",{className:"mdx-content",children:[a.jsx("h1",{children:"Building a Dashboard"}),a.jsx("p",{className:"lead text-xl text-surface-600 dark:text-surface-400",children:"Build a data-rich dashboard application with charts, real-time updates, and data fetching in PhilJS."}),a.jsx("h2",{id:"what-well-build",children:"What We'll Build"}),a.jsx("p",{children:"In this tutorial, we'll create a comprehensive analytics dashboard that demonstrates:"}),(0,a.jsxs)("ul",{children:[a.jsx("li",{children:"Data fetching with async operations"}),a.jsx("li",{children:"Real-time updates using signals"}),a.jsx("li",{children:"Chart visualization with third-party libraries"}),a.jsx("li",{children:"Resource management for efficient data loading"}),a.jsx("li",{children:"Error handling and loading states"}),a.jsx("li",{children:"Component composition for complex UIs"})]}),a.jsx("h2",{id:"setup",children:"Project Setup"}),a.jsx(s.oI,{commands:["npm create philjs@latest analytics-dashboard","cd analytics-dashboard","npm install chart.js date-fns","npm run dev"]}),a.jsx("h2",{id:"data-types",children:"Data Types"}),(0,a.jsxs)("p",{children:["First, let's define our data structures. Create ",a.jsx("code",{children:"src/types.ts"}),":"]}),a.jsx(s.dn,{code:`export interface MetricData {
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
}`,language:"typescript",filename:"src/types.ts"}),a.jsx("h2",{id:"api-service",children:"API Service"}),a.jsx("p",{children:"Create a service to fetch dashboard data. In a real app, this would call your backend API:"}),a.jsx(s.dn,{code:`import type { DashboardData, ApiResponse } from './types';

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
}`,language:"typescript",filename:"src/services/api.ts"}),a.jsx("h2",{id:"metric-card",children:"Metric Card Component"}),a.jsx("p",{children:"Let's create a reusable component to display metric cards:"}),a.jsx(s.dn,{code:`import { Show } from 'philjs-core';
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
}`,language:"typescript",filename:"src/components/MetricCard.tsx"}),a.jsx("h2",{id:"chart-component",children:"Chart Component"}),a.jsx("p",{children:"Create a chart component using Chart.js:"}),a.jsx(s.dn,{code:`import { onMount, onCleanup } from 'philjs-core';
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
}`,language:"typescript",filename:"src/components/LineChart.tsx"}),a.jsx("h2",{id:"resource",children:"Using Resources for Data Fetching"}),(0,a.jsxs)("p",{children:["PhilJS provides the ",a.jsx("code",{children:"createResource"})," primitive for handling async data:"]}),a.jsx(s.dn,{code:`import { createResource, Show, For } from 'philjs-core';
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

export default App;`,language:"typescript",filename:"src/App.tsx"}),(0,a.jsxs)(i.U,{type:"info",title:"Resources",children:[a.jsx("code",{children:"createResource"})," handles async operations and provides loading states, error states, and automatic re-fetching. It's perfect for data fetching in PhilJS applications."]}),a.jsx("h2",{id:"styling",children:"Dashboard Styles"}),a.jsx(s.dn,{code:`.dashboard {
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
}`,language:"css",filename:"src/App.css"}),a.jsx("h2",{id:"real-time-updates",children:"Adding Real-Time Updates"}),a.jsx("p",{children:"Let's enhance the dashboard with WebSocket support for real-time data:"}),a.jsx(s.dn,{code:`import { createSignal, createEffect, onCleanup } from 'philjs-core';

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
}`,language:"typescript",filename:"src/hooks/useRealtimeMetrics.ts"}),a.jsx("h2",{id:"advanced-features",children:"Advanced Features"}),a.jsx("h3",{children:"Date Range Selector"}),a.jsx(s.dn,{code:`import { createSignal } from 'philjs-core';

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
}`,language:"typescript",filename:"src/components/DateRangeSelector.tsx"}),a.jsx("h3",{children:"Export Data Functionality"}),a.jsx(s.dn,{code:`function exportToCSV(data: any[], filename: string) {
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
</button>`,language:"typescript"}),a.jsx("h2",{id:"next-steps",children:"Next Steps"}),(0,a.jsxs)("ul",{children:[a.jsx("li",{children:"Add user authentication and authorization"}),a.jsx("li",{children:"Implement data filtering and searching"}),a.jsx("li",{children:"Add drill-down capabilities for detailed views"}),a.jsx("li",{children:"Create custom dashboard layouts with drag-and-drop"}),a.jsx("li",{children:"Add data export in multiple formats (CSV, PDF, Excel)"}),a.jsx("li",{children:"Implement real-time notifications for important events"}),a.jsx("li",{children:"Add responsive design for mobile devices"}),a.jsx("li",{children:"Create shareable dashboard links"})]}),(0,a.jsxs)("div",{className:"grid md:grid-cols-2 gap-4 mt-6 not-prose",children:[(0,a.jsxs)(o.default,{href:"/docs/tutorials/rust-fullstack",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[a.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Rust Full-Stack Guide"}),a.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Build full-stack apps with Rust backend"})]}),(0,a.jsxs)(o.default,{href:"/docs/core-concepts/effects",className:"block p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors",children:[a.jsx("h3",{className:"font-semibold text-surface-900 dark:text-white",children:"Effects & Lifecycle"}),a.jsx("p",{className:"text-sm text-surface-600 dark:text-surface-400 mt-1",children:"Master side effects and component lifecycle"})]})]})]})}},3288:(e,t,r)=>{"use strict";r.d(t,{dn:()=>s,oI:()=>i});var a=r(1471);let s=(0,a.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#CodeBlock`);(0,a.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#InlineCode`);let i=(0,a.createProxy)(String.raw`C:\Users\Phili\Git\philjs\packages\philjs-docs\src\components\CodeBlock.tsx#Terminal`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[732,6314,9858],()=>r(8865));module.exports=a})();