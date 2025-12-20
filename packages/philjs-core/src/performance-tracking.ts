/**
 * Performance Tracking Hooks
 *
 * Comprehensive performance monitoring utilities:
 * - Component render timing
 * - API call performance
 * - Resource loading tracking
 * - Custom performance marks
 * - Performance budgets
 * - Real-time monitoring dashboard
 */

import { signal, effect, type Signal } from './signals';

// ============================================================================
// Types
// ============================================================================

export interface PerformanceMark {
  name: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceBudget {
  name: string;
  maxDuration: number;
  warn?: boolean;
  error?: boolean;
}

export interface ComponentPerformance {
  componentName: string;
  renderTime: number;
  updateTime: number;
  renderCount: number;
  lastRender: number;
}

export interface APIPerformance {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  error?: Error;
}

export interface ResourcePerformance {
  url: string;
  type: string;
  size: number;
  duration: number;
  cached: boolean;
}

export interface PerformanceSnapshot {
  timestamp: number;
  components: ComponentPerformance[];
  api: APIPerformance[];
  resources: ResourcePerformance[];
  marks: PerformanceMark[];
  memory?: {
    used: number;
    total: number;
    limit: number;
  };
}

// ============================================================================
// Performance Tracker
// ============================================================================

export class PerformanceTracker {
  private marks = new Map<string, PerformanceMark>();
  private budgets = new Map<string, PerformanceBudget>();
  private components = new Map<string, ComponentPerformance>();
  private apiCalls: APIPerformance[] = [];
  private resources: ResourcePerformance[] = [];

  public isTracking = signal(false);

  /**
   * Start performance mark
   */
  mark(name: string, metadata?: Record<string, any>): void {
    const mark: PerformanceMark = {
      name,
      timestamp: performance.now(),
      metadata,
    };

    this.marks.set(name, mark);

    // Use native Performance API if available
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * Measure duration between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      throw new Error(`Start mark "${startMark}" not found`);
    }

    const endTime = endMark
      ? this.marks.get(endMark)?.timestamp || performance.now()
      : performance.now();

    const duration = endTime - start.timestamp;

    // Store measurement
    this.marks.set(name, {
      name,
      timestamp: start.timestamp,
      duration,
    });

    // Use native Performance API
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (error) {
        // Ignore errors from native API
      }
    }

    // Check budget
    const budget = this.budgets.get(name);
    if (budget && duration > budget.maxDuration) {
      const message = `Performance budget exceeded for "${name}": ${duration.toFixed(2)}ms > ${budget.maxDuration}ms`;

      if (budget.error) {
        console.error(message);
      } else if (budget.warn) {
        console.warn(message);
      }
    }

    return duration;
  }

  /**
   * Clear mark
   */
  clearMark(name: string): void {
    this.marks.delete(name);

    if (typeof performance !== 'undefined' && performance.clearMarks) {
      performance.clearMarks(name);
    }
  }

  /**
   * Clear all marks
   */
  clearMarks(): void {
    this.marks.clear();

    if (typeof performance !== 'undefined' && performance.clearMarks) {
      performance.clearMarks();
    }
  }

  /**
   * Set performance budget
   */
  setBudget(name: string, maxDuration: number, options: { warn?: boolean; error?: boolean } = {}): void {
    this.budgets.set(name, {
      name,
      maxDuration,
      warn: options.warn ?? true,
      error: options.error ?? false,
    });
  }

  /**
   * Track component render
   */
  trackComponent(componentName: string, renderTime: number): void {
    const existing = this.components.get(componentName);

    if (existing) {
      existing.updateTime = renderTime;
      existing.renderCount++;
      existing.lastRender = Date.now();
    } else {
      this.components.set(componentName, {
        componentName,
        renderTime,
        updateTime: renderTime,
        renderCount: 1,
        lastRender: Date.now(),
      });
    }
  }

  /**
   * Track API call
   */
  trackAPI(endpoint: string, method: string, duration: number, status: number, error?: Error): void {
    this.apiCalls.push({
      endpoint,
      method,
      duration,
      status,
      timestamp: Date.now(),
      error,
    });

    // Keep only last 100 calls
    if (this.apiCalls.length > 100) {
      this.apiCalls.shift();
    }
  }

  /**
   * Track resource loading
   */
  trackResource(url: string, type: string, size: number, duration: number, cached: boolean): void {
    this.resources.push({
      url,
      type,
      size,
      duration,
      cached,
    });
  }

  /**
   * Get component performance
   */
  getComponentPerformance(componentName: string): ComponentPerformance | undefined {
    return this.components.get(componentName);
  }

  /**
   * Get all component performance
   */
  getAllComponentPerformance(): ComponentPerformance[] {
    return Array.from(this.components.values());
  }

  /**
   * Get API performance
   */
  getAPIPerformance(): APIPerformance[] {
    return [...this.apiCalls];
  }

  /**
   * Get resource performance
   */
  getResourcePerformance(): ResourcePerformance[] {
    return [...this.resources];
  }

  /**
   * Get performance snapshot
   */
  getSnapshot(): PerformanceSnapshot {
    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      components: this.getAllComponentPerformance(),
      api: this.getAPIPerformance(),
      resources: this.getResourcePerformance(),
      marks: Array.from(this.marks.values()),
    };

    // Add memory info if available
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      snapshot.memory = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };
    }

    return snapshot;
  }

  /**
   * Start tracking
   */
  start(): void {
    this.isTracking.set(true);
  }

  /**
   * Stop tracking
   */
  stop(): void {
    this.isTracking.set(false);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.marks.clear();
    this.components.clear();
    this.apiCalls.length = 0;
    this.resources.length = 0;
  }
}

// ============================================================================
// Hooks
// ============================================================================

let globalTracker: PerformanceTracker | null = null;

/**
 * Get or create global performance tracker
 */
function getTracker(): PerformanceTracker {
  if (!globalTracker) {
    globalTracker = new PerformanceTracker();
  }
  return globalTracker;
}

/**
 * Track component render performance
 */
export function usePerformance(componentName: string): {
  startRender: () => void;
  endRender: () => void;
  performance: Signal<ComponentPerformance | null>;
} {
  const tracker = getTracker();
  const performance = signal<ComponentPerformance | null>(null);

  let startTime = 0;

  const startRender = () => {
    startTime = performance.now();
  };

  const endRender = () => {
    const duration = performance.now() - startTime;
    tracker.trackComponent(componentName, duration);
    performance.set(tracker.getComponentPerformance(componentName) || null);
  };

  return {
    startRender,
    endRender,
    performance,
  };
}

/**
 * Track API call performance
 */
export function useAPIPerformance() {
  const tracker = getTracker();

  return {
    track: async <T>(
      endpoint: string,
      fetchFn: () => Promise<T>,
      method = 'GET'
    ): Promise<T> => {
      const startTime = performance.now();

      try {
        const result = await fetchFn();
        const duration = performance.now() - startTime;

        tracker.trackAPI(endpoint, method, duration, 200);

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        tracker.trackAPI(endpoint, method, duration, 500, error as Error);
        throw error;
      }
    },

    getMetrics: () => tracker.getAPIPerformance(),
  };
}

/**
 * Track custom performance
 */
export function useCustomPerformance(name: string) {
  const tracker = getTracker();

  return {
    start: (metadata?: Record<string, any>) => {
      tracker.mark(`${name}:start`, metadata);
    },

    end: () => {
      tracker.mark(`${name}:end`);
      return tracker.measure(name, `${name}:start`, `${name}:end`);
    },

    measure: (startMark: string, endMark?: string) => {
      return tracker.measure(name, startMark, endMark);
    },
  };
}

/**
 * Set performance budget
 */
export function usePerformanceBudget(
  name: string,
  maxDuration: number,
  options?: { warn?: boolean; error?: boolean }
): void {
  const tracker = getTracker();
  tracker.setBudget(name, maxDuration, options);
}

/**
 * Get performance snapshot
 */
export function usePerformanceSnapshot(): Signal<PerformanceSnapshot> {
  const tracker = getTracker();
  const snapshot = signal<PerformanceSnapshot>(tracker.getSnapshot());

  // Update snapshot every second
  if (typeof window !== 'undefined') {
    setInterval(() => {
      snapshot.set(tracker.getSnapshot());
    }, 1000);
  }

  return snapshot;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Measure function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const tracker = getTracker();

  tracker.mark(`${name}:start`);

  try {
    const result = await fn();
    const duration = tracker.measure(name, `${name}:start`);

    return { result, duration };
  } catch (error) {
    tracker.measure(name, `${name}:start`);
    throw error;
  }
}

/**
 * Measure synchronous function
 */
export function measureSync<T>(
  name: string,
  fn: () => T
): { result: T; duration: number } {
  const tracker = getTracker();

  tracker.mark(`${name}:start`);

  try {
    const result = fn();
    const duration = tracker.measure(name, `${name}:start`);

    return { result, duration };
  } catch (error) {
    tracker.measure(name, `${name}:start`);
    throw error;
  }
}

/**
 * Monitor resource loading
 */
export function monitorResources(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  const tracker = getTracker();

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const resourceEntry = entry as PerformanceResourceTiming;

      tracker.trackResource(
        resourceEntry.name,
        resourceEntry.initiatorType,
        resourceEntry.transferSize,
        resourceEntry.duration,
        resourceEntry.transferSize === 0
      );
    }
  });

  observer.observe({ entryTypes: ['resource'] });
}

/**
 * Export performance data
 */
export function exportPerformanceData(): string {
  const tracker = getTracker();
  const snapshot = tracker.getSnapshot();

  return JSON.stringify(snapshot, null, 2);
}

/**
 * Import performance data
 */
export function importPerformanceData(data: string): void {
  const snapshot: PerformanceSnapshot = JSON.parse(data);
  const tracker = getTracker();

  // This is a simplified version - in production would restore full state
  console.log('Imported performance snapshot:', snapshot);
}

/**
 * Get global performance tracker
 */
export function getPerformanceTracker(): PerformanceTracker {
  return getTracker();
}

/**
 * Create performance report
 */
export function createPerformanceReport(): {
  summary: {
    totalComponents: number;
    avgRenderTime: number;
    totalAPICalls: number;
    avgAPITime: number;
    totalResources: number;
    totalResourceSize: number;
  };
  slowestComponents: ComponentPerformance[];
  slowestAPIs: APIPerformance[];
  largestResources: ResourcePerformance[];
} {
  const tracker = getTracker();
  const components = tracker.getAllComponentPerformance();
  const apis = tracker.getAPIPerformance();
  const resources = tracker.getResourcePerformance();

  const avgRenderTime = components.length > 0
    ? components.reduce((sum, c) => sum + c.renderTime, 0) / components.length
    : 0;

  const avgAPITime = apis.length > 0
    ? apis.reduce((sum, a) => sum + a.duration, 0) / apis.length
    : 0;

  const totalResourceSize = resources.reduce((sum, r) => sum + r.size, 0);

  return {
    summary: {
      totalComponents: components.length,
      avgRenderTime,
      totalAPICalls: apis.length,
      avgAPITime,
      totalResources: resources.length,
      totalResourceSize,
    },
    slowestComponents: components
      .sort((a, b) => b.renderTime - a.renderTime)
      .slice(0, 10),
    slowestAPIs: apis
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10),
    largestResources: resources
      .sort((a, b) => b.size - a.size)
      .slice(0, 10),
  };
}
