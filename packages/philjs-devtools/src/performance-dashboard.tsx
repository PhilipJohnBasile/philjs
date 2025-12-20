/**
 * Performance Monitoring Dashboard for PhilJS
 * Real-time Web Vitals, component render times, API metrics, and bundle analysis
 */

import { signal, memo, effect, type Signal } from 'philjs-core';
import type { JSXElement } from 'philjs-core/jsx-runtime';

// ============================================================================
// Types
// ============================================================================

export interface WebVitals {
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  inp: number | null; // Interaction to Next Paint
}

export interface ComponentMetrics {
  name: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  totalRenderTime: number;
}

export interface APIMetrics {
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: number;
  size?: number;
}

export interface BundleMetrics {
  totalSize: number;
  scripts: Array<{ name: string; size: number }>;
  styles: Array<{ name: string; size: number }>;
}

export interface PerformanceData {
  webVitals: WebVitals;
  components: Map<string, ComponentMetrics>;
  apiCalls: APIMetrics[];
  bundle: BundleMetrics | null;
}

// ============================================================================
// Performance Monitoring
// ============================================================================

const webVitals: Signal<WebVitals> = signal({
  lcp: null,
  fid: null,
  cls: null,
  fcp: null,
  ttfb: null,
  inp: null,
});

const componentMetrics: Signal<Map<string, ComponentMetrics>> = signal(new Map());
const apiMetrics: Signal<APIMetrics[]> = signal([]);
const bundleMetrics: Signal<BundleMetrics | null> = signal(null);

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitalsMonitoring(): () => void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return () => {};
  }

  const observers: PerformanceObserver[] = [];

  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      webVitals.set({ ...webVitals(), lcp: lastEntry.renderTime || lastEntry.loadTime });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    observers.push(lcpObserver);
  } catch (e) {}

  // First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        webVitals.set({ ...webVitals(), fid: entry.processingStart - entry.startTime });
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
    observers.push(fidObserver);
  } catch (e) {}

  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  try {
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          webVitals.set({ ...webVitals(), cls: clsValue });
        }
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    observers.push(clsObserver);
  } catch (e) {}

  // Navigation Timing
  if (performance.getEntriesByType) {
    const navTiming = performance.getEntriesByType('navigation')[0] as any;
    if (navTiming) {
      webVitals.set({
        ...webVitals(),
        fcp: navTiming.responseStart - navTiming.requestStart,
        ttfb: navTiming.responseStart - navTiming.requestStart,
      });
    }
  }

  return () => {
    observers.forEach(observer => observer.disconnect());
  };
}

/**
 * Track component render time
 */
export function trackComponentRender(componentName: string, renderTime: number): void {
  const metrics = componentMetrics();
  const existing = metrics.get(componentName);

  if (existing) {
    const totalTime = existing.totalRenderTime + renderTime;
    const count = existing.renderCount + 1;
    metrics.set(componentName, {
      name: componentName,
      renderCount: count,
      averageRenderTime: totalTime / count,
      lastRenderTime: renderTime,
      totalRenderTime: totalTime,
    });
  } else {
    metrics.set(componentName, {
      name: componentName,
      renderCount: 1,
      averageRenderTime: renderTime,
      lastRenderTime: renderTime,
      totalRenderTime: renderTime,
    });
  }

  componentMetrics.set(new Map(metrics));
}

/**
 * Track API call
 */
export function trackAPICall(
  url: string,
  method: string,
  status: number,
  duration: number,
  size?: number
): void {
  const calls = apiMetrics();
  calls.push({
    url,
    method,
    status,
    duration,
    timestamp: Date.now(),
    size,
  });

  // Keep only last 100 calls
  if (calls.length > 100) {
    calls.shift();
  }

  apiMetrics.set([...calls]);
}

/**
 * Analyze bundle size
 */
export async function analyzeBundleSize(): Promise<void> {
  if (typeof window === 'undefined' || !performance.getEntriesByType) {
    return;
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  const scripts: Array<{ name: string; size: number }> = [];
  const styles: Array<{ name: string; size: number }> = [];
  let totalSize = 0;

  resources.forEach((resource) => {
    const size = resource.transferSize || 0;
    totalSize += size;

    const name = resource.name.split('/').pop() || resource.name;

    if (resource.initiatorType === 'script' || name.endsWith('.js')) {
      scripts.push({ name, size });
    } else if (resource.initiatorType === 'link' || name.endsWith('.css')) {
      styles.push({ name, size });
    }
  });

  bundleMetrics.set({ totalSize, scripts, styles });
}

// ============================================================================
// Performance Dashboard Component
// ============================================================================

/**
 * Performance Dashboard UI Component
 */
export function PerformanceDashboard(props: {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  minimized?: boolean;
}): JSXElement {
  const { position = 'bottom-right', minimized: initialMinimized = false } = props;

  const isMinimized = signal(initialMinimized);
  const selectedTab = signal<'vitals' | 'components' | 'api' | 'bundle'>('vitals');

  // Initialize monitoring
  effect(() => {
    const cleanup = initWebVitalsMonitoring();
    analyzeBundleSize();
    return cleanup;
  });

  const positionStyles: Record<string, string> = {
    'top-left': 'top: 1rem; left: 1rem;',
    'top-right': 'top: 1rem; right: 1rem;',
    'bottom-left': 'bottom: 1rem; left: 1rem;',
    'bottom-right': 'bottom: 1rem; right: 1rem;',
  };

  return (
    <div
      style={`
        position: fixed;
        ${positionStyles[position]}
        background: rgba(0, 0, 0, 0.95);
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        z-index: 999999;
        ${isMinimized() ? 'width: auto;' : 'width: 400px; max-height: 600px;'}
        overflow: hidden;
      `}
    >
      {/* Header */}
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
        "
        onclick={() => isMinimized.set(!isMinimized())}
      >
        <h3 style="margin: 0; font-size: 0.875rem; font-weight: 600;">
          Performance Monitor
        </h3>
        <button
          style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 1.25rem;
            padding: 0;
          "
        >
          {isMinimized() ? '▲' : '▼'}
        </button>
      </div>

      {!isMinimized() && (
        <>
          {/* Tabs */}
          <div
            style="
              display: flex;
              gap: 0.5rem;
              padding: 0.5rem;
              background: rgba(255, 255, 255, 0.05);
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            "
          >
            {(['vitals', 'components', 'api', 'bundle'] as const).map((tab) => (
              <button
                key={tab}
                onclick={() => selectedTab.set(tab)}
                style={`
                  background: ${selectedTab() === tab ? 'rgba(102, 126, 234, 0.5)' : 'transparent'};
                  border: none;
                  color: white;
                  padding: 0.5rem 1rem;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 0.75rem;
                  text-transform: capitalize;
                  transition: background 0.2s;
                `}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style="padding: 1rem; max-height: 500px; overflow-y: auto;">
            {selectedTab() === 'vitals' && <WebVitalsTab />}
            {selectedTab() === 'components' && <ComponentsTab />}
            {selectedTab() === 'api' && <APITab />}
            {selectedTab() === 'bundle' && <BundleTab />}
          </div>
        </>
      )}
    </div>
  );
}

function WebVitalsTab(): JSXElement {
  const vitals = webVitals();

  const formatMetric = (value: number | null, unit: string = 'ms') => {
    if (value === null) return 'N/A';
    return `${value.toFixed(2)}${unit}`;
  };

  const getColor = (metric: string, value: number | null) => {
    if (value === null) return '#666';

    const thresholds: Record<string, [number, number]> = {
      lcp: [2500, 4000],
      fid: [100, 300],
      cls: [0.1, 0.25],
      fcp: [1800, 3000],
      ttfb: [800, 1800],
      inp: [200, 500],
    };

    const [good, poor] = thresholds[metric] || [0, 0];
    if (value <= good) return '#0cce6b';
    if (value <= poor) return '#ffa400';
    return '#ff4e42';
  };

  return (
    <div>
      <h4 style="margin: 0 0 1rem 0; font-size: 0.875rem;">Web Vitals</h4>
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        {Object.entries(vitals).map(([key, value]) => (
          <div key={key}>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span style="font-size: 0.75rem; text-transform: uppercase; opacity: 0.7;">
                {key}
              </span>
              <span
                style={`font-size: 0.875rem; font-weight: 600; color: ${getColor(key, value)};`}
              >
                {formatMetric(value, key === 'cls' ? '' : 'ms')}
              </span>
            </div>
            <div style="height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 2px; overflow: hidden;">
              <div
                style={`
                  height: 100%;
                  width: ${value ? Math.min((value / (key === 'cls' ? 0.5 : 5000)) * 100, 100) : 0}%;
                  background: ${getColor(key, value)};
                  transition: width 0.3s;
                `}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComponentsTab(): JSXElement {
  const metrics = Array.from(componentMetrics().values())
    .sort((a, b) => b.totalRenderTime - a.totalRenderTime)
    .slice(0, 10);

  return (
    <div>
      <h4 style="margin: 0 0 1rem 0; font-size: 0.875rem;">Component Render Times</h4>
      {metrics.length === 0 ? (
        <p style="opacity: 0.5; font-size: 0.875rem;">No component data yet</p>
      ) : (
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          {metrics.map((metric) => (
            <div key={metric.name}>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                <span style="font-size: 0.75rem; font-family: monospace;">{metric.name}</span>
                <span style="font-size: 0.75rem; opacity: 0.7;">
                  {metric.averageRenderTime.toFixed(2)}ms avg ({metric.renderCount})
                </span>
              </div>
              <div style="height: 2px; background: rgba(255, 255, 255, 0.1); border-radius: 1px; overflow: hidden;">
                <div
                  style={`
                    height: 100%;
                    width: ${Math.min((metric.averageRenderTime / 50) * 100, 100)}%;
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    transition: width 0.3s;
                  `}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function APITab(): JSXElement {
  const calls = apiMetrics().slice(-20).reverse();

  return (
    <div>
      <h4 style="margin: 0 0 1rem 0; font-size: 0.875rem;">API Calls (Last 20)</h4>
      {calls.length === 0 ? (
        <p style="opacity: 0.5; font-size: 0.875rem;">No API calls yet</p>
      ) : (
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          {calls.map((call, index) => (
            <div
              key={index}
              style="
                padding: 0.5rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
                font-size: 0.75rem;
              "
            >
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                <span style="font-family: monospace; font-weight: 600;">
                  {call.method} {call.status}
                </span>
                <span style="opacity: 0.7;">{call.duration.toFixed(0)}ms</span>
              </div>
              <div style="opacity: 0.6; font-size: 0.7rem; word-break: break-all;">
                {call.url}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BundleTab(): JSXElement {
  const bundle = bundleMetrics();

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (!bundle) {
    return <p style="opacity: 0.5; font-size: 0.875rem;">Loading bundle data...</p>;
  }

  const topScripts = bundle.scripts.sort((a, b) => b.size - a.size).slice(0, 5);
  const topStyles = bundle.styles.sort((a, b) => b.size - a.size).slice(0, 5);

  return (
    <div>
      <h4 style="margin: 0 0 1rem 0; font-size: 0.875rem;">
        Bundle Size: {formatSize(bundle.totalSize)}
      </h4>

      <div style="margin-bottom: 1rem;">
        <h5 style="margin: 0 0 0.5rem 0; font-size: 0.75rem; opacity: 0.7;">Top Scripts</h5>
        {topScripts.map((script) => (
          <div key={script.name} style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.75rem;">
            <span style="font-family: monospace; word-break: break-all;">{script.name}</span>
            <span style="opacity: 0.7;">{formatSize(script.size)}</span>
          </div>
        ))}
      </div>

      <div>
        <h5 style="margin: 0 0 0.5rem 0; font-size: 0.75rem; opacity: 0.7;">Top Styles</h5>
        {topStyles.map((style) => (
          <div key={style.name} style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.75rem;">
            <span style="font-family: monospace; word-break: break-all;">{style.name}</span>
            <span style="opacity: 0.7;">{formatSize(style.size)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export {
  webVitals,
  componentMetrics,
  apiMetrics,
  bundleMetrics,
};
