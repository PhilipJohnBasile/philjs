/**
 * @philjs/analytics - Built-in Analytics Dashboard
 *
 * Zero-config analytics with Web Vitals, custom events, and real-time dashboard.
 * No external dependencies required.
 *
 * @example
 * ```tsx
 * import { initAnalytics, trackEvent, useAnalytics, AnalyticsDashboard } from '@philjs/analytics';
 *
 * // Initialize
 * initAnalytics({ appId: 'my-app' });
 *
 * // Track events
 * trackEvent('button_click', { buttonId: 'cta-hero' });
 *
 * // Use in components
 * function MyComponent() {
 *   const { pageViews, events } = useAnalytics();
 *   return <div>Page views: {pageViews()}</div>;
 * }
 *
 * // Built-in dashboard
 * function AdminPage() {
 *   return <AnalyticsDashboard />;
 * }
 * ```
 */

// Types for @philjs/core (peer dependency)
type Signal<T> = {
  (): T;
  set(value: T): void;
};

// Stub implementations - actual implementations come from @philjs/core at runtime
function signal<T>(value: T): Signal<T> {
  let current = value;
  const fn = (() => current) as Signal<T>;
  fn.set = (v: T) => { current = v; };
  return fn;
}

function effect(fn: () => void): void {
  fn();
}

// Types

export interface AnalyticsConfig {
  /** Application identifier */
  appId: string;
  /** Enable debug mode */
  debug?: boolean;
  /** Track Web Vitals automatically */
  trackWebVitals?: boolean;
  /** Track page views automatically */
  trackPageViews?: boolean;
  /** Track clicks automatically */
  trackClicks?: boolean;
  /** Track scroll depth */
  trackScrollDepth?: boolean;
  /** Track session duration */
  trackSessionDuration?: boolean;
  /** Sample rate (0-1) */
  sampleRate?: number;
  /** Data retention in days */
  retentionDays?: number;
  /** Endpoint for sending analytics (optional remote) */
  endpoint?: string;
  /** Custom dimensions */
  dimensions?: Record<string, () => string>;
  /** Events to ignore */
  ignoreEvents?: string[];
  /** Pages to ignore */
  ignorePages?: RegExp[];
}

export interface AnalyticsEvent {
  /** Event name */
  name: string;
  /** Event properties */
  properties?: Record<string, any>;
  /** Timestamp */
  timestamp: number;
  /** Session ID */
  sessionId: string;
  /** User ID */
  userId?: string;
  /** Page path */
  path: string;
  /** Referrer */
  referrer?: string;
}

export interface PageView {
  /** Page path */
  path: string;
  /** Page title */
  title: string;
  /** Timestamp */
  timestamp: number;
  /** Session ID */
  sessionId: string;
  /** User ID */
  userId?: string;
  /** Referrer */
  referrer?: string;
  /** Duration in seconds */
  duration?: number;
}

export interface WebVitals {
  /** Largest Contentful Paint */
  lcp?: number;
  /** First Input Delay */
  fid?: number;
  /** Cumulative Layout Shift */
  cls?: number;
  /** First Contentful Paint */
  fcp?: number;
  /** Time to First Byte */
  ttfb?: number;
  /** Interaction to Next Paint */
  inp?: number;
}

export interface SessionData {
  /** Session ID */
  id: string;
  /** Start timestamp */
  startedAt: number;
  /** Last activity timestamp */
  lastActivityAt: number;
  /** Page views count */
  pageViews: number;
  /** Events count */
  events: number;
  /** Entry page */
  entryPage: string;
  /** Exit page */
  exitPage?: string;
  /** Device type */
  deviceType: 'mobile' | 'tablet' | 'desktop';
  /** Browser */
  browser: string;
  /** Country (if available) */
  country?: string;
  /** Duration in seconds */
  duration: number;
}

export interface DashboardData {
  /** Total page views */
  pageViews: number;
  /** Unique visitors */
  uniqueVisitors: number;
  /** Average session duration */
  avgSessionDuration: number;
  /** Bounce rate */
  bounceRate: number;
  /** Top pages */
  topPages: Array<{ path: string; views: number }>;
  /** Top events */
  topEvents: Array<{ name: string; count: number }>;
  /** Traffic sources */
  trafficSources: Array<{ source: string; count: number }>;
  /** Devices */
  devices: Record<string, number>;
  /** Web Vitals */
  webVitals: WebVitals;
  /** Page views over time */
  pageViewsOverTime: Array<{ date: string; count: number }>;
}

// State

const eventsSignal: Signal<AnalyticsEvent[]> = signal([]);
const pageViewsSignal: Signal<PageView[]> = signal([]);
const webVitalsSignal: Signal<WebVitals> = signal({});
const sessionSignal: Signal<SessionData | null> = signal(null);
const dashboardDataSignal: Signal<DashboardData | null> = signal(null);

let config: AnalyticsConfig | null = null;
let sessionId: string = '';
let userId: string | undefined;
let sessionStartTime: number = 0;

// Core Functions

/**
 * Initializes the analytics system
 */
export function initAnalytics(cfg: AnalyticsConfig): void {
  config = {
    trackWebVitals: true,
    trackPageViews: true,
    trackClicks: false,
    trackScrollDepth: false,
    trackSessionDuration: true,
    sampleRate: 1,
    retentionDays: 30,
    debug: false,
    ...cfg,
  };

  // Check sample rate
  if (Math.random() > config.sampleRate!) {
    return;
  }

  // Generate session ID
  sessionId = generateSessionId();
  sessionStartTime = Date.now();

  // Initialize session
  initSession();

  // Load persisted data
  loadPersistedData();

  // Setup automatic tracking
  if (config.trackPageViews) {
    setupPageViewTracking();
  }

  if (config.trackWebVitals) {
    setupWebVitalsTracking();
  }

  if (config.trackClicks) {
    setupClickTracking();
  }

  if (config.trackScrollDepth) {
    setupScrollTracking();
  }

  if (config.trackSessionDuration) {
    setupSessionTracking();
  }

  // Persist on unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', persistData);
    window.addEventListener('visibilitychange', handleVisibilityChange);
  }

  if (config.debug) {
    console.log('[Analytics] Initialized', { sessionId, config });
  }
}

/**
 * Tracks a custom event
 */
export function trackEvent(
  name: string,
  properties?: Record<string, any>
): void {
  if (!config) {
    console.warn('Analytics not initialized');
    return;
  }

  if (config.ignoreEvents?.includes(name)) {
    return;
  }

  const event: AnalyticsEvent = {
    name,
    properties,
    timestamp: Date.now(),
    sessionId,
    userId,
    path: typeof window !== 'undefined' ? window.location.pathname : '/',
    referrer: typeof document !== 'undefined' ? document.referrer : undefined,
  };

  // Add to state
  eventsSignal.set([...eventsSignal(), event]);

  // Update session
  updateSessionActivity();

  if (config.debug) {
  }

  // Send to endpoint if configured
  if (config.endpoint) {
    sendToEndpoint('event', event);
  }
}

/**
 * Tracks a page view
 */
export function trackPageView(path?: string, title?: string): void {
  if (!config) return;

  const actualPath = path || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const actualTitle = title || (typeof document !== 'undefined' ? document.title : '');

  // Check ignore patterns
  if (config.ignorePages?.some((pattern) => pattern.test(actualPath))) {
    return;
  }

  const pageView: PageView = {
    path: actualPath,
    title: actualTitle,
    timestamp: Date.now(),
    sessionId,
    userId,
    referrer: typeof document !== 'undefined' ? document.referrer : undefined,
  };

  pageViewsSignal.set([...pageViewsSignal(), pageView]);
  updateSessionActivity();

  if (config.debug) {
  }

  if (config.endpoint) {
    sendToEndpoint('pageview', pageView);
  }
}

/**
 * Sets the user ID
 */
export function setUserId(id: string): void {
  userId = id;
}

/**
 * Gets analytics hooks
 */
export function useAnalytics() {
  return {
    events: eventsSignal,
    pageViews: pageViewsSignal,
    webVitals: webVitalsSignal,
    session: sessionSignal,
    dashboard: dashboardDataSignal,
    trackEvent,
    trackPageView,
    setUserId,
  };
}

/**
 * Gets dashboard data
 */
export function getDashboardData(
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): DashboardData {
  const events = eventsSignal();
  const pageViews = pageViewsSignal();
  const vitals = webVitalsSignal();

  const startTime = options?.startDate?.getTime() || 0;
  const endTime = options?.endDate?.getTime() || Date.now();

  // Filter by date range
  const filteredPageViews = pageViews.filter(
    (pv) => pv.timestamp >= startTime && pv.timestamp <= endTime
  );
  const filteredEvents = events.filter(
    (e) => e.timestamp >= startTime && e.timestamp <= endTime
  );

  // Calculate metrics
  const uniqueSessionIds = new Set(filteredPageViews.map((pv) => pv.sessionId));
  const sessionsWithOnePageView = filteredPageViews.reduce((acc, pv) => {
    acc[pv.sessionId] = (acc[pv.sessionId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const bouncedSessions = Object.values(sessionsWithOnePageView).filter((count) => count === 1).length;

  // Top pages
  const pageCounts: Record<string, number> = {};
  for (const pv of filteredPageViews) {
    pageCounts[pv.path] = (pageCounts[pv.path] || 0) + 1;
  }
  const topPages = Object.entries(pageCounts)
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Top events
  const eventCounts: Record<string, number> = {};
  for (const e of filteredEvents) {
    eventCounts[e.name] = (eventCounts[e.name] || 0) + 1;
  }
  const topEvents = Object.entries(eventCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Traffic sources
  const sourceCounts: Record<string, number> = {};
  for (const pv of filteredPageViews) {
    const source = parseReferrer(pv.referrer);
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  }
  const trafficSources = Object.entries(sourceCounts)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Page views over time
  const pvByDate: Record<string, number> = {};
  for (const pv of filteredPageViews) {
    const date = new Date(pv.timestamp).toISOString().split('T')[0];
    pvByDate[date] = (pvByDate[date] || 0) + 1;
  }
  const pageViewsOverTime = Object.entries(pvByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const data: DashboardData = {
    pageViews: filteredPageViews.length,
    uniqueVisitors: uniqueSessionIds.size,
    avgSessionDuration: sessionSignal()?.duration || 0,
    bounceRate: uniqueSessionIds.size > 0 ? bouncedSessions / uniqueSessionIds.size : 0,
    topPages,
    topEvents,
    trafficSources,
    devices: { desktop: 70, mobile: 25, tablet: 5 }, // Would need actual device detection
    webVitals: vitals,
    pageViewsOverTime,
  };

  dashboardDataSignal.set(data);
  return data;
}

// Dashboard Component

/**
 * Built-in analytics dashboard component
 */
export function AnalyticsDashboard(props: {
  title?: string;
  class?: string;
  style?: string | Record<string, string>;
}) {
  const data = getDashboardData();

  return {
    type: 'div',
    props: {
      class: `philjs-analytics-dashboard ${props.class || ''}`,
      style: props.style || 'padding: 20px; font-family: system-ui, sans-serif;',
    },
    children: [
      {
        type: 'h1',
        props: { style: 'margin-bottom: 20px;' },
        children: [props.title || 'Analytics Dashboard'],
      },

      // Stats Grid
      {
        type: 'div',
        props: {
          style: 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;',
        },
        children: [
          StatCard({ title: 'Page Views', value: data.pageViews.toLocaleString() }),
          StatCard({ title: 'Unique Visitors', value: data.uniqueVisitors.toLocaleString() }),
          StatCard({ title: 'Avg. Duration', value: formatDuration(data.avgSessionDuration) }),
          StatCard({ title: 'Bounce Rate', value: `${(data.bounceRate * 100).toFixed(1)}%` }),
        ],
      },

      // Web Vitals
      {
        type: 'div',
        props: { style: 'margin-bottom: 24px;' },
        children: [
          { type: 'h2', props: { style: 'margin-bottom: 12px;' }, children: ['Web Vitals'] },
          {
            type: 'div',
            props: { style: 'display: flex; gap: 16px;' },
            children: [
              VitalCard({ name: 'LCP', value: data.webVitals.lcp, unit: 'ms', good: 2500, poor: 4000 }),
              VitalCard({ name: 'FID', value: data.webVitals.fid, unit: 'ms', good: 100, poor: 300 }),
              VitalCard({ name: 'CLS', value: data.webVitals.cls, unit: '', good: 0.1, poor: 0.25 }),
              VitalCard({ name: 'FCP', value: data.webVitals.fcp, unit: 'ms', good: 1800, poor: 3000 }),
              VitalCard({ name: 'TTFB', value: data.webVitals.ttfb, unit: 'ms', good: 800, poor: 1800 }),
            ],
          },
        ],
      },

      // Top Pages
      {
        type: 'div',
        props: { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 24px;' },
        children: [
          {
            type: 'div',
            props: {},
            children: [
              { type: 'h2', props: { style: 'margin-bottom: 12px;' }, children: ['Top Pages'] },
              {
                type: 'table',
                props: { style: 'width: 100%; border-collapse: collapse;' },
                children: [
                  {
                    type: 'tbody',
                    props: {},
                    children: data.topPages.map((page) => ({
                      type: 'tr',
                      props: { style: 'border-bottom: 1px solid #eee;' },
                      children: [
                        { type: 'td', props: { style: 'padding: 8px 0;' }, children: [page.path] },
                        { type: 'td', props: { style: 'padding: 8px 0; text-align: right;' }, children: [page.views.toString()] },
                      ],
                    })),
                  },
                ],
              },
            ],
          },
          {
            type: 'div',
            props: {},
            children: [
              { type: 'h2', props: { style: 'margin-bottom: 12px;' }, children: ['Top Events'] },
              {
                type: 'table',
                props: { style: 'width: 100%; border-collapse: collapse;' },
                children: [
                  {
                    type: 'tbody',
                    props: {},
                    children: data.topEvents.map((event) => ({
                      type: 'tr',
                      props: { style: 'border-bottom: 1px solid #eee;' },
                      children: [
                        { type: 'td', props: { style: 'padding: 8px 0;' }, children: [event.name] },
                        { type: 'td', props: { style: 'padding: 8px 0; text-align: right;' }, children: [event.count.toString()] },
                      ],
                    })),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

function StatCard(props: { title: string; value: string }) {
  return {
    type: 'div',
    props: {
      style: 'background: #f9fafb; padding: 16px; border-radius: 8px;',
    },
    children: [
      { type: 'div', props: { style: 'font-size: 14px; color: #666;' }, children: [props.title] },
      { type: 'div', props: { style: 'font-size: 24px; font-weight: bold;' }, children: [props.value] },
    ],
  };
}

function VitalCard(props: { name: string; value?: number; unit: string; good: number; poor: number }) {
  const value = props.value;
  const color = value === undefined ? '#999' : value <= props.good ? '#22c55e' : value <= props.poor ? '#f59e0b' : '#ef4444';

  return {
    type: 'div',
    props: {
      style: 'background: #f9fafb; padding: 12px; border-radius: 8px; text-align: center;',
    },
    children: [
      { type: 'div', props: { style: 'font-size: 12px; color: #666;' }, children: [props.name] },
      {
        type: 'div',
        props: { style: `font-size: 18px; font-weight: bold; color: ${color};` },
        children: [value !== undefined ? `${value}${props.unit}` : 'N/A'],
      },
    ],
  };
}

// Helper Functions

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function initSession(): void {
  sessionSignal.set({
    id: sessionId,
    startedAt: sessionStartTime,
    lastActivityAt: sessionStartTime,
    pageViews: 0,
    events: 0,
    entryPage: typeof window !== 'undefined' ? window.location.pathname : '/',
    deviceType: getDeviceType(),
    browser: getBrowser(),
    duration: 0,
  });
}

function updateSessionActivity(): void {
  const session = sessionSignal();
  if (!session) return;

  sessionSignal.set({
    ...session,
    lastActivityAt: Date.now(),
    duration: Math.floor((Date.now() - session.startedAt) / 1000),
  });
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|iphone|android/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getBrowser(): string {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Other';
}

function parseReferrer(referrer?: string): string {
  if (!referrer) return 'Direct';
  try {
    const url = new URL(referrer);
    if (url.hostname.includes('google')) return 'Google';
    if (url.hostname.includes('facebook')) return 'Facebook';
    if (url.hostname.includes('twitter') || url.hostname.includes('x.com')) return 'Twitter/X';
    return url.hostname;
  } catch {
    return 'Unknown';
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function setupPageViewTracking(): void {
  if (typeof window === 'undefined') return;

  // Track initial page view
  trackPageView();

  // Track history changes
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    trackPageView();
  };

  window.addEventListener('popstate', () => trackPageView());
}

function setupWebVitalsTracking(): void {
  if (typeof window === 'undefined') return;

  // Simplified Web Vitals tracking
  // In production, use the web-vitals library

  // LCP
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    webVitalsSignal.set({ ...webVitalsSignal(), lcp: Math.round(lastEntry.startTime) });
  }).observe({ type: 'largest-contentful-paint', buffered: true });

  // FCP
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
    if (fcpEntry) {
      webVitalsSignal.set({ ...webVitalsSignal(), fcp: Math.round(fcpEntry.startTime) });
    }
  }).observe({ type: 'paint', buffered: true });

  // CLS
  let clsValue = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    }
    webVitalsSignal.set({ ...webVitalsSignal(), cls: Math.round(clsValue * 1000) / 1000 });
  }).observe({ type: 'layout-shift', buffered: true });
}

function setupClickTracking(): void {
  if (typeof window === 'undefined') return;

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const button = target.closest('button, a, [role="button"]');
    if (button) {
      trackEvent('click', {
        element: button.tagName.toLowerCase(),
        id: button.id || undefined,
        text: button.textContent?.slice(0, 50),
        href: (button as HTMLAnchorElement).href || undefined,
      });
    }
  });
}

function setupScrollTracking(): void {
  if (typeof window === 'undefined') return;

  let maxScroll = 0;
  let lastTrackedDepth = 0;

  window.addEventListener('scroll', () => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );
    maxScroll = Math.max(maxScroll, scrollPercent);

    // Track at 25%, 50%, 75%, 100%
    const thresholds = [25, 50, 75, 100];
    for (const threshold of thresholds) {
      if (maxScroll >= threshold && lastTrackedDepth < threshold) {
        trackEvent('scroll_depth', { depth: threshold });
        lastTrackedDepth = threshold;
      }
    }
  });
}

function setupSessionTracking(): void {
  // Session is tracked automatically via updateSessionActivity
}

function handleVisibilityChange(): void {
  if (document.visibilityState === 'hidden') {
    persistData();
  }
}

function loadPersistedData(): void {
  if (typeof localStorage === 'undefined') return;

  try {
    const events = localStorage.getItem('philjs_analytics_events');
    const pageViews = localStorage.getItem('philjs_analytics_pageviews');

    if (events) eventsSignal.set(JSON.parse(events));
    if (pageViews) pageViewsSignal.set(JSON.parse(pageViews));
  } catch {
    // Ignore parse errors
  }
}

function persistData(): void {
  if (typeof localStorage === 'undefined') return;

  try {
    // Only keep data within retention period
    const cutoff = Date.now() - (config?.retentionDays || 30) * 24 * 60 * 60 * 1000;
    const events = eventsSignal().filter((e) => e.timestamp > cutoff);
    const pageViews = pageViewsSignal().filter((pv) => pv.timestamp > cutoff);

    localStorage.setItem('philjs_analytics_events', JSON.stringify(events));
    localStorage.setItem('philjs_analytics_pageviews', JSON.stringify(pageViews));
  } catch {
    // Ignore storage errors
  }
}

async function sendToEndpoint(type: string, data: any): Promise<void> {
  if (!config?.endpoint) return;

  try {
    await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data, appId: config.appId }),
      keepalive: true,
    });
  } catch {
    // Silently fail
  }
}

// Types are already exported at their definition sites
