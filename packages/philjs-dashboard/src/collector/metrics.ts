/**
 * Metrics Collection Module
 * Collects Core Web Vitals, custom metrics, memory, CPU, and network data
 */

import type { Metric as WebVitalMetric } from 'web-vitals';

// ============================================================================
// Types
// ============================================================================

export interface WebVitalsMetrics {
  /** Largest Contentful Paint */
  lcp: number | null;
  /** First Input Delay */
  fid: number | null;
  /** Cumulative Layout Shift */
  cls: number | null;
  /** First Contentful Paint */
  fcp: number | null;
  /** Time to First Byte */
  ttfb: number | null;
  /** Interaction to Next Paint */
  inp: number | null;
}

export interface MemoryMetrics {
  /** Used JS heap size in bytes */
  usedJSHeapSize: number;
  /** Total JS heap size in bytes */
  totalJSHeapSize: number;
  /** JS heap size limit in bytes */
  jsHeapSizeLimit: number;
  /** Heap utilization percentage */
  heapUtilization: number;
}

export interface CPUMetrics {
  /** Number of logical processors */
  hardwareConcurrency: number;
  /** Long tasks detected */
  longTasks: LongTaskEntry[];
  /** Total blocking time estimate */
  totalBlockingTime: number;
}

export interface LongTaskEntry {
  /** Start time of the long task */
  startTime: number;
  /** Duration of the long task */
  duration: number;
  /** Attribution information */
  attribution: LongTaskAttribution[];
}

export interface LongTaskAttribution {
  /** Name of the container */
  name: string;
  /** Entry type */
  entryType: string;
  /** Container type */
  containerType: string;
  /** Container ID */
  containerId: string;
  /** Container name */
  containerName: string;
  /** Container source */
  containerSrc: string;
}

export interface NetworkRequest {
  /** Request URL */
  url: string;
  /** HTTP method */
  method: string;
  /** Request start time */
  startTime: number;
  /** Response end time */
  endTime: number;
  /** Duration in milliseconds */
  duration: number;
  /** Transfer size in bytes */
  transferSize: number;
  /** Encoded body size */
  encodedBodySize: number;
  /** Decoded body size */
  decodedBodySize: number;
  /** HTTP status code */
  status: number;
  /** Resource type */
  initiatorType: string;
  /** Next hop protocol (h2, h3, etc.) */
  nextHopProtocol: string;
}

export interface CustomMetric {
  /** Metric name */
  name: string;
  /** Metric value */
  value: number;
  /** Unit of measurement */
  unit: string;
  /** Timestamp when recorded */
  timestamp: number;
  /** Optional tags */
  tags?: Record<string, string>;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

export interface MetricsSnapshot {
  /** Timestamp of the snapshot */
  timestamp: number;
  /** Session ID */
  sessionId: string;
  /** Page URL */
  pageUrl: string;
  /** Web Vitals metrics */
  webVitals: WebVitalsMetrics;
  /** Memory metrics */
  memory: MemoryMetrics | null;
  /** CPU metrics */
  cpu: CPUMetrics;
  /** Network requests */
  networkRequests: NetworkRequest[];
  /** Custom metrics */
  customMetrics: CustomMetric[];
}

export interface MetricsCollectorConfig {
  /** Enable Web Vitals collection */
  collectWebVitals?: boolean;
  /** Enable memory metrics collection */
  collectMemory?: boolean;
  /** Enable CPU/long task monitoring */
  collectCPU?: boolean;
  /** Enable network request tracking */
  collectNetwork?: boolean;
  /** Sample rate (0-1) */
  sampleRate?: number;
  /** Maximum network requests to store */
  maxNetworkRequests?: number;
  /** Long task threshold in ms */
  longTaskThreshold?: number;
  /** Callback when metrics are collected */
  onMetrics?: (snapshot: MetricsSnapshot) => void;
}

// ============================================================================
// Metrics Collector Class
// ============================================================================

export class MetricsCollector {
  private config: Required<MetricsCollectorConfig>;
  private sessionId: string;
  private webVitals: WebVitalsMetrics;
  private longTasks: LongTaskEntry[] = [];
  private networkRequests: NetworkRequest[] = [];
  private customMetrics: CustomMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isCollecting = false;

  constructor(config: MetricsCollectorConfig = {}) {
    this.config = {
      collectWebVitals: config.collectWebVitals ?? true,
      collectMemory: config.collectMemory ?? true,
      collectCPU: config.collectCPU ?? true,
      collectNetwork: config.collectNetwork ?? true,
      sampleRate: config.sampleRate ?? 1,
      maxNetworkRequests: config.maxNetworkRequests ?? 100,
      longTaskThreshold: config.longTaskThreshold ?? 50,
      onMetrics: config.onMetrics ?? (() => {}),
    };

    this.sessionId = this.generateSessionId();
    this.webVitals = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
      inp: null,
    };
  }

  /**
   * Start collecting metrics
   */
  async start(): Promise<void> {
    if (this.isCollecting) return;
    if (!this.shouldSample()) return;

    this.isCollecting = true;

    if (this.config.collectWebVitals) {
      await this.initWebVitals();
    }

    if (this.config.collectCPU) {
      this.initLongTaskObserver();
    }

    if (this.config.collectNetwork) {
      this.initNetworkObserver();
    }
  }

  /**
   * Stop collecting metrics
   */
  stop(): void {
    this.isCollecting = false;
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }

  /**
   * Get current metrics snapshot
   */
  getSnapshot(): MetricsSnapshot {
    return {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      webVitals: { ...this.webVitals },
      memory: this.getMemoryMetrics(),
      cpu: this.getCPUMetrics(),
      networkRequests: [...this.networkRequests],
      customMetrics: [...this.customMetrics],
    };
  }

  /**
   * Record a custom metric
   */
  recordMetric(
    name: string,
    value: number,
    unit = 'ms',
    tags?: Record<string, string>,
    metadata?: Record<string, unknown>
  ): void {
    const metric: CustomMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
      metadata,
    };

    this.customMetrics.push(metric);
  }

  /**
   * Record a timing metric
   */
  recordTiming(name: string, startTime: number, endTime?: number): void {
    const end = endTime ?? performance.now();
    this.recordMetric(name, end - startTime, 'ms');
  }

  /**
   * Create a timer that can be stopped
   */
  startTimer(name: string): () => void {
    const startTime = performance.now();
    return () => this.recordTiming(name, startTime);
  }

  /**
   * Clear collected metrics
   */
  clear(): void {
    this.networkRequests = [];
    this.customMetrics = [];
    this.longTasks = [];
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private async initWebVitals(): Promise<void> {
    try {
      const webVitalsModule = await import('web-vitals');

      const handleMetric = (metric: WebVitalMetric) => {
        const metricName = metric.name.toLowerCase() as keyof WebVitalsMetrics;
        if (metricName in this.webVitals) {
          this.webVitals[metricName] = metric.value;
        }
        this.config.onMetrics(this.getSnapshot());
      };

      webVitalsModule.onLCP(handleMetric);
      webVitalsModule.onFID(handleMetric);
      webVitalsModule.onCLS(handleMetric);
      webVitalsModule.onFCP(handleMetric);
      webVitalsModule.onTTFB(handleMetric);
      webVitalsModule.onINP(handleMetric);
    } catch {
      console.warn('[MetricsCollector] Failed to initialize web-vitals');
    }
  }

  private initLongTaskObserver(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration >= this.config.longTaskThreshold) {
            const taskEntry = entry as PerformanceEntry & {
              attribution?: Array<{
                name: string;
                entryType: string;
                containerType: string;
                containerId: string;
                containerName: string;
                containerSrc: string;
              }>;
            };

            this.longTasks.push({
              startTime: entry.startTime,
              duration: entry.duration,
              attribution: (taskEntry.attribution || []).map((attr) => ({
                name: attr.name,
                entryType: attr.entryType,
                containerType: attr.containerType,
                containerId: attr.containerId,
                containerName: attr.containerName,
                containerSrc: attr.containerSrc,
              })),
            });
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch {
      console.warn('[MetricsCollector] Long task observation not supported');
    }
  }

  private initNetworkObserver(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;

          const request: NetworkRequest = {
            url: resourceEntry.name,
            method: 'GET', // Not available from PerformanceResourceTiming
            startTime: resourceEntry.startTime,
            endTime: resourceEntry.responseEnd,
            duration: resourceEntry.duration,
            transferSize: resourceEntry.transferSize,
            encodedBodySize: resourceEntry.encodedBodySize,
            decodedBodySize: resourceEntry.decodedBodySize,
            status: 200, // Not available from PerformanceResourceTiming
            initiatorType: resourceEntry.initiatorType,
            nextHopProtocol: resourceEntry.nextHopProtocol,
          };

          this.networkRequests.push(request);

          // Trim to max size
          if (this.networkRequests.length > this.config.maxNetworkRequests) {
            this.networkRequests.shift();
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch {
      console.warn('[MetricsCollector] Resource observation not supported');
    }
  }

  private getMemoryMetrics(): MemoryMetrics | null {
    if (!this.config.collectMemory) return null;

    const performance = globalThis.performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };

    if (!performance.memory) return null;

    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;

    return {
      usedJSHeapSize,
      totalJSHeapSize,
      jsHeapSizeLimit,
      heapUtilization: (usedJSHeapSize / jsHeapSizeLimit) * 100,
    };
  }

  private getCPUMetrics(): CPUMetrics {
    const totalBlockingTime = this.longTasks.reduce(
      (total, task) => total + Math.max(0, task.duration - 50),
      0
    );

    return {
      hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 1 : 1,
      longTasks: [...this.longTasks],
      totalBlockingTime,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let defaultCollector: MetricsCollector | null = null;

export function getMetricsCollector(config?: MetricsCollectorConfig): MetricsCollector {
  if (!defaultCollector) {
    defaultCollector = new MetricsCollector(config);
  }
  return defaultCollector;
}

export function resetMetricsCollector(): void {
  if (defaultCollector) {
    defaultCollector.stop();
    defaultCollector = null;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Measure execution time of an async function
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  collector?: MetricsCollector
): Promise<T> {
  const metricsCollector = collector ?? getMetricsCollector();
  const stopTimer = metricsCollector.startTimer(name);

  try {
    return await fn();
  } finally {
    stopTimer();
  }
}

/**
 * Measure execution time of a sync function
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  collector?: MetricsCollector
): T {
  const metricsCollector = collector ?? getMetricsCollector();
  const stopTimer = metricsCollector.startTimer(name);

  try {
    return fn();
  } finally {
    stopTimer();
  }
}

/**
 * Calculate performance score based on Web Vitals
 */
export function calculatePerformanceScore(webVitals: WebVitalsMetrics): number {
  let score = 100;
  let metrics = 0;

  // LCP scoring (Good: <2.5s, Needs Improvement: <4s, Poor: >4s)
  if (webVitals.lcp !== null) {
    metrics++;
    if (webVitals.lcp <= 2500) {
      score += 100;
    } else if (webVitals.lcp <= 4000) {
      score += 50;
    } else {
      score += 0;
    }
  }

  // FID scoring (Good: <100ms, Needs Improvement: <300ms, Poor: >300ms)
  if (webVitals.fid !== null) {
    metrics++;
    if (webVitals.fid <= 100) {
      score += 100;
    } else if (webVitals.fid <= 300) {
      score += 50;
    } else {
      score += 0;
    }
  }

  // CLS scoring (Good: <0.1, Needs Improvement: <0.25, Poor: >0.25)
  if (webVitals.cls !== null) {
    metrics++;
    if (webVitals.cls <= 0.1) {
      score += 100;
    } else if (webVitals.cls <= 0.25) {
      score += 50;
    } else {
      score += 0;
    }
  }

  // FCP scoring (Good: <1.8s, Needs Improvement: <3s, Poor: >3s)
  if (webVitals.fcp !== null) {
    metrics++;
    if (webVitals.fcp <= 1800) {
      score += 100;
    } else if (webVitals.fcp <= 3000) {
      score += 50;
    } else {
      score += 0;
    }
  }

  // TTFB scoring (Good: <800ms, Needs Improvement: <1800ms, Poor: >1800ms)
  if (webVitals.ttfb !== null) {
    metrics++;
    if (webVitals.ttfb <= 800) {
      score += 100;
    } else if (webVitals.ttfb <= 1800) {
      score += 50;
    } else {
      score += 0;
    }
  }

  return metrics > 0 ? Math.round((score - 100) / metrics) : 0;
}
