/**
 * Web Vitals Monitoring
 *
 * Track and report Core Web Vitals and custom performance metrics:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 * - INP (Interaction to Next Paint)
 * - Custom metrics
 */

import { signal, type Signal } from './signals';

// ============================================================================
// Types
// ============================================================================

export interface WebVitalsMetric {
  /**
   * Metric name
   */
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP' | string;

  /**
   * Metric value
   */
  value: number;

  /**
   * Metric rating (good, needs-improvement, poor)
   */
  rating: 'good' | 'needs-improvement' | 'poor';

  /**
   * Delta from previous value
   */
  delta: number;

  /**
   * Unique ID
   */
  id: string;

  /**
   * Timestamp
   */
  timestamp: number;

  /**
   * Navigation type
   */
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender';

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

export interface WebVitalsOptions {
  /**
   * Report callback
   */
  onReport?: (metric: WebVitalsMetric) => void;

  /**
   * Sampling rate (0-1)
   */
  samplingRate?: number;

  /**
   * Enable debug mode
   */
  debug?: boolean;

  /**
   * Custom thresholds
   */
  thresholds?: Partial<Record<string, [number, number]>>;

  /**
   * Report to analytics
   */
  analytics?: {
    provider: 'google-analytics' | 'custom';
    trackingId?: string;
    send?: (metric: WebVitalsMetric) => void;
  };
}

export interface PerformanceMetrics {
  lcp: Signal<WebVitalsMetric | null>;
  fid: Signal<WebVitalsMetric | null>;
  cls: Signal<WebVitalsMetric | null>;
  fcp: Signal<WebVitalsMetric | null>;
  ttfb: Signal<WebVitalsMetric | null>;
  inp: Signal<WebVitalsMetric | null>;
}

// ============================================================================
// Default Thresholds
// ============================================================================

const DEFAULT_THRESHOLDS: Record<string, [number, number]> = {
  LCP: [2500, 4000],
  FID: [100, 300],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
  INP: [200, 500],
};

// ============================================================================
// Web Vitals Monitor
// ============================================================================

export class WebVitalsMonitor {
  private options: WebVitalsOptions;
  private metrics = new Map<string, WebVitalsMetric>();
  private observers = new Map<string, PerformanceObserver>();

  public lcp = signal<WebVitalsMetric | null>(null);
  public fid = signal<WebVitalsMetric | null>(null);
  public cls = signal<WebVitalsMetric | null>(null);
  public fcp = signal<WebVitalsMetric | null>(null);
  public ttfb = signal<WebVitalsMetric | null>(null);
  public inp = signal<WebVitalsMetric | null>(null);

  constructor(options: WebVitalsOptions = {}) {
    this.options = {
      samplingRate: 1,
      debug: false,
      thresholds: DEFAULT_THRESHOLDS,
      ...options,
    };

    if (typeof window === 'undefined') return;

    // Sample check
    if (Math.random() > this.options.samplingRate!) return;

    this.init();
  }

  private init(): void {
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();
    this.observeINP();

    // Report on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.reportAll();
      });
    }
  }

  /**
   * Observe Largest Contentful Paint
   */
  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;

        if (lastEntry) {
          this.reportMetric({
            name: 'LCP',
            value: lastEntry.renderTime || lastEntry.loadTime,
            delta: 0,
            id: this.generateId('LCP'),
          });
        }
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.set('LCP', observer);
    } catch (error) {
      this.log('Error observing LCP:', error);
    }
  }

  /**
   * Observe First Input Delay
   */
  private observeFID(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as any;

        if (firstEntry) {
          this.reportMetric({
            name: 'FID',
            value: firstEntry.processingStart - firstEntry.startTime,
            delta: 0,
            id: this.generateId('FID'),
          });
        }
      });

      observer.observe({ type: 'first-input', buffered: true });
      this.observers.set('FID', observer);
    } catch (error) {
      this.log('Error observing FID:', error);
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: any[] = [];

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            // Session has ended
            if (
              sessionValue &&
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000
            ) {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = entry.value;
              sessionEntries = [entry];
            }

            if (sessionValue > clsValue) {
              clsValue = sessionValue;

              this.reportMetric({
                name: 'CLS',
                value: clsValue,
                delta: entry.value,
                id: this.generateId('CLS'),
              });
            }
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.set('CLS', observer);
    } catch (error) {
      this.log('Error observing CLS:', error);
    }
  }

  /**
   * Observe First Contentful Paint
   */
  private observeFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');

        if (fcpEntry) {
          this.reportMetric({
            name: 'FCP',
            value: fcpEntry.startTime,
            delta: 0,
            id: this.generateId('FCP'),
          });
        }
      });

      observer.observe({ type: 'paint', buffered: true });
      this.observers.set('FCP', observer);
    } catch (error) {
      this.log('Error observing FCP:', error);
    }
  }

  /**
   * Observe Time to First Byte
   */
  private observeTTFB(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const navEntry = entries[0] as PerformanceNavigationTiming;

        if (navEntry) {
          this.reportMetric({
            name: 'TTFB',
            value: navEntry.responseStart - navEntry.requestStart,
            delta: 0,
            id: this.generateId('TTFB'),
          });
        }
      });

      observer.observe({ type: 'navigation', buffered: true });
      this.observers.set('TTFB', observer);
    } catch (error) {
      this.log('Error observing TTFB:', error);
    }
  }

  /**
   * Observe Interaction to Next Paint
   */
  private observeINP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      let maxDuration = 0;

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          const duration = entry.processingEnd - entry.startTime;

          if (duration > maxDuration) {
            maxDuration = duration;

            this.reportMetric({
              name: 'INP',
              value: duration,
              delta: 0,
              id: this.generateId('INP'),
            });
          }
        }
      });

      observer.observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit & { durationThreshold?: number });
      this.observers.set('INP', observer);
    } catch (error) {
      this.log('Error observing INP:', error);
    }
  }

  /**
   * Report metric
   */
  private reportMetric(metric: Partial<WebVitalsMetric>): void {
    const name = metric.name!;
    const value = metric.value!;

    // Get previous value for delta calculation
    const previous = this.metrics.get(name);
    const delta = previous ? value - previous.value : value;

    // Get rating based on thresholds
    const rating = this.getRating(name, value);

    // Get navigation type
    const navigationType = this.getNavigationType();

    const fullMetric: WebVitalsMetric = {
      name,
      value,
      delta,
      rating,
      id: metric.id || this.generateId(name),
      timestamp: Date.now(),
      navigationType,
      metadata: metric.metadata,
    };

    // Store metric
    this.metrics.set(name, fullMetric);

    // Update signal
    switch (name) {
      case 'LCP':
        this.lcp.set(fullMetric);
        break;
      case 'FID':
        this.fid.set(fullMetric);
        break;
      case 'CLS':
        this.cls.set(fullMetric);
        break;
      case 'FCP':
        this.fcp.set(fullMetric);
        break;
      case 'TTFB':
        this.ttfb.set(fullMetric);
        break;
      case 'INP':
        this.inp.set(fullMetric);
        break;
    }

    // Report to callback
    if (this.options.onReport) {
      this.options.onReport(fullMetric);
    }

    // Report to analytics
    if (this.options.analytics) {
      this.sendToAnalytics(fullMetric);
    }

    // Debug log
    this.log(`[${name}] ${value.toFixed(2)}ms (${rating})`);
  }

  /**
   * Get rating based on thresholds
   */
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = this.options.thresholds?.[name] || DEFAULT_THRESHOLDS[name];

    if (!thresholds) return 'good';

    const [good, needsImprovement] = thresholds;

    if (value <= good) return 'good';
    if (value <= needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Get navigation type
   */
  private getNavigationType(): WebVitalsMetric['navigationType'] {
    if (typeof performance === 'undefined') return 'navigate';

    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (!navEntry) return 'navigate';

    switch (navEntry.type) {
      case 'reload':
        return 'reload';
      case 'back_forward':
        return 'back-forward';
      case 'prerender':
        return 'prerender';
      default:
        return 'navigate';
    }
  }

  /**
   * Send metric to analytics
   */
  private sendToAnalytics(metric: WebVitalsMetric): void {
    const { analytics } = this.options;

    if (!analytics) return;

    if (analytics.send) {
      analytics.send(metric);
    } else if (analytics.provider === 'google-analytics' && typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        event_label: metric.rating,
        non_interaction: true,
      });
    }
  }

  /**
   * Report all metrics
   */
  public reportAll(): void {
    for (const metric of this.metrics.values()) {
      if (this.options.onReport) {
        this.options.onReport(metric);
      }
    }
  }

  /**
   * Get all metrics
   */
  public getMetrics(): WebVitalsMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get metric by name
   */
  public getMetric(name: string): WebVitalsMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Clear all metrics
   */
  public clear(): void {
    this.metrics.clear();
    this.lcp.set(null);
    this.fid.set(null);
    this.cls.set(null);
    this.fcp.set(null);
    this.ttfb.set(null);
    this.inp.set(null);
  }

  /**
   * Disconnect all observers
   */
  public disconnect(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }

  /**
   * Generate unique ID
   */
  private generateId(name: string): string {
    return `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Debug log
   */
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[Web Vitals]', ...args);
    }
  }
}

// ============================================================================
// High-Level API
// ============================================================================

let globalMonitor: WebVitalsMonitor | null = null;

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitals(options: WebVitalsOptions = {}): WebVitalsMonitor {
  if (!globalMonitor) {
    globalMonitor = new WebVitalsMonitor(options);
  }
  return globalMonitor;
}

/**
 * Get Web Vitals monitor instance
 */
export function getWebVitalsMonitor(): WebVitalsMonitor | null {
  return globalMonitor;
}

/**
 * Report Web Vitals to callback
 */
export function reportWebVitals(callback: (metric: WebVitalsMetric) => void): void {
  initWebVitals({ onReport: callback });
}

/**
 * Get current Web Vitals metrics
 */
export function getWebVitalsMetrics(): PerformanceMetrics {
  const monitor = globalMonitor || initWebVitals();

  return {
    lcp: monitor.lcp,
    fid: monitor.fid,
    cls: monitor.cls,
    fcp: monitor.fcp,
    ttfb: monitor.ttfb,
    inp: monitor.inp,
  };
}

// Global gtag function (for Google Analytics)
declare global {
  function gtag(...args: any[]): void;
}
