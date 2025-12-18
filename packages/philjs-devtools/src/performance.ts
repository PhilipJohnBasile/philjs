/**
 * Performance Timing Utilities
 *
 * Provides performance measurement and monitoring tools:
 * - Render timing and profiling
 * - Component update tracking
 * - Memory usage monitoring
 * - Performance marks and measures
 * - FPS and frame timing
 */

// ============================================================================
// Types
// ============================================================================

export type PerformanceMark = {
  name: string;
  timestamp: number;
  metadata?: Record<string, any>;
};

export type PerformanceMeasure = {
  name: string;
  startMark: string;
  endMark: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
};

export type RenderMetrics = {
  componentName: string;
  renderCount: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  lastRenderTime: number;
  timestamp: number;
};

export type FrameMetrics = {
  fps: number;
  frameTime: number;
  droppedFrames: number;
  timestamp: number;
};

export type MemoryMetrics = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
};

export type PerformanceReport = {
  marks: PerformanceMark[];
  measures: PerformanceMeasure[];
  renders: RenderMetrics[];
  frames: FrameMetrics[];
  memory: MemoryMetrics[];
  summary: {
    totalMarks: number;
    totalMeasures: number;
    totalRenders: number;
    averageFPS: number;
    slowestRender: RenderMetrics | null;
    slowestMeasure: PerformanceMeasure | null;
  };
};

export type PerformanceThresholds = {
  slowRender?: number; // ms
  slowMeasure?: number; // ms
  lowFPS?: number;
  highMemory?: number; // bytes
};

export type PerformanceWarning = {
  type: "slow-render" | "slow-measure" | "low-fps" | "high-memory";
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  metadata?: Record<string, any>;
};

// ============================================================================
// Performance Monitor
// ============================================================================

export class PerformanceMonitor {
  private marks: PerformanceMark[] = [];
  private measures: PerformanceMeasure[] = [];
  private renderMetrics = new Map<string, RenderMetrics>();
  private frameMetrics: FrameMetrics[] = [];
  private memoryMetrics: MemoryMetrics[] = [];
  private warnings: PerformanceWarning[] = [];

  private thresholds: Required<PerformanceThresholds>;
  private maxHistorySize = 100;
  private isMonitoring = false;
  private frameStartTime = 0;
  private frameCount = 0;
  private lastFPSCheck = 0;

  constructor(thresholds: PerformanceThresholds = {}) {
    this.thresholds = {
      slowRender: thresholds.slowRender ?? 16, // 60fps
      slowMeasure: thresholds.slowMeasure ?? 50,
      lowFPS: thresholds.lowFPS ?? 30,
      highMemory: thresholds.highMemory ?? 50 * 1024 * 1024, // 50MB
    };
  }

  /**
   * Create a performance mark
   */
  public mark(name: string, metadata?: Record<string, any>): void {
    const mark: PerformanceMark = {
      name,
      timestamp: performance.now(),
      metadata,
    };

    this.marks.push(mark);

    // Use native Performance API
    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark(name);
    }

    this.maintainHistorySize();
  }

  /**
   * Create a performance measure between two marks
   */
  public measure(
    name: string,
    startMark: string,
    endMark?: string,
    metadata?: Record<string, any>
  ): PerformanceMeasure | null {
    const start = this.marks.find((m) => m.name === startMark);
    if (!start) {
      console.warn(`Start mark "${startMark}" not found`);
      return null;
    }

    let end: PerformanceMark | undefined;
    if (endMark) {
      end = this.marks.find((m) => m.name === endMark);
      if (!end) {
        console.warn(`End mark "${endMark}" not found`);
        return null;
      }
    } else {
      // Use current time as end
      end = {
        name: "__current__",
        timestamp: performance.now(),
      };
    }

    const measure: PerformanceMeasure = {
      name,
      startMark,
      endMark: end.name,
      duration: end.timestamp - start.timestamp,
      timestamp: Date.now(),
      metadata,
    };

    this.measures.push(measure);

    // Use native Performance API
    if (typeof performance !== "undefined" && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (e) {
        // Silently fail if marks not found in native API
      }
    }

    // Check threshold
    if (measure.duration > this.thresholds.slowMeasure) {
      this.addWarning({
        type: "slow-measure",
        message: `Slow measure: ${name} took ${measure.duration.toFixed(2)}ms`,
        value: measure.duration,
        threshold: this.thresholds.slowMeasure,
        timestamp: Date.now(),
        metadata: { measure },
      });
    }

    this.maintainHistorySize();

    return measure;
  }

  /**
   * Record a component render
   */
  public recordRender(componentName: string, duration: number): void {
    let metrics = this.renderMetrics.get(componentName);

    if (!metrics) {
      metrics = {
        componentName,
        renderCount: 0,
        totalTime: 0,
        averageTime: 0,
        minTime: Infinity,
        maxTime: -Infinity,
        lastRenderTime: 0,
        timestamp: Date.now(),
      };
      this.renderMetrics.set(componentName, metrics);
    }

    metrics.renderCount++;
    metrics.totalTime += duration;
    metrics.averageTime = metrics.totalTime / metrics.renderCount;
    metrics.minTime = Math.min(metrics.minTime, duration);
    metrics.maxTime = Math.max(metrics.maxTime, duration);
    metrics.lastRenderTime = duration;
    metrics.timestamp = Date.now();

    // Check threshold
    if (duration > this.thresholds.slowRender) {
      this.addWarning({
        type: "slow-render",
        message: `Slow render: ${componentName} took ${duration.toFixed(2)}ms`,
        value: duration,
        threshold: this.thresholds.slowRender,
        timestamp: Date.now(),
        metadata: { componentName },
      });
    }
  }

  /**
   * Start monitoring performance
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.frameStartTime = performance.now();
    this.lastFPSCheck = Date.now();

    // Monitor frames
    this.monitorFrames();

    // Monitor memory (if available)
    if (this.isMemoryAPIAvailable()) {
      this.monitorMemory();
    }
  }

  /**
   * Stop monitoring performance
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;
  }

  /**
   * Get all performance marks
   */
  public getMarks(): PerformanceMark[] {
    return this.marks.slice();
  }

  /**
   * Get all performance measures
   */
  public getMeasures(): PerformanceMeasure[] {
    return this.measures.slice();
  }

  /**
   * Get render metrics for all components
   */
  public getRenderMetrics(): RenderMetrics[] {
    return Array.from(this.renderMetrics.values());
  }

  /**
   * Get render metrics for a specific component
   */
  public getComponentMetrics(componentName: string): RenderMetrics | undefined {
    return this.renderMetrics.get(componentName);
  }

  /**
   * Get frame metrics
   */
  public getFrameMetrics(): FrameMetrics[] {
    return this.frameMetrics.slice();
  }

  /**
   * Get memory metrics
   */
  public getMemoryMetrics(): MemoryMetrics[] {
    return this.memoryMetrics.slice();
  }

  /**
   * Get performance warnings
   */
  public getWarnings(): PerformanceWarning[] {
    return this.warnings.slice();
  }

  /**
   * Clear all performance data
   */
  public clear(): void {
    this.marks = [];
    this.measures = [];
    this.renderMetrics.clear();
    this.frameMetrics = [];
    this.memoryMetrics = [];
    this.warnings = [];
    this.frameCount = 0;

    // Clear native Performance API
    if (typeof performance !== "undefined") {
      if (performance.clearMarks) performance.clearMarks();
      if (performance.clearMeasures) performance.clearMeasures();
    }
  }

  /**
   * Generate performance report
   */
  public generateReport(): PerformanceReport {
    const renders = this.getRenderMetrics();
    const measures = this.getMeasures();
    const frames = this.getFrameMetrics();

    const slowestRender =
      renders.length > 0
        ? renders.reduce((prev, curr) =>
            curr.maxTime > prev.maxTime ? curr : prev
          )
        : null;

    const slowestMeasure =
      measures.length > 0
        ? measures.reduce((prev, curr) =>
            curr.duration > prev.duration ? curr : prev
          )
        : null;

    const averageFPS =
      frames.length > 0
        ? frames.reduce((sum, f) => sum + f.fps, 0) / frames.length
        : 0;

    return {
      marks: this.getMarks(),
      measures,
      renders,
      frames,
      memory: this.getMemoryMetrics(),
      summary: {
        totalMarks: this.marks.length,
        totalMeasures: measures.length,
        totalRenders: renders.reduce((sum, r) => sum + r.renderCount, 0),
        averageFPS,
        slowestRender,
        slowestMeasure,
      },
    };
  }

  /**
   * Export performance data as JSON
   */
  public export(): string {
    return JSON.stringify({
      report: this.generateReport(),
      warnings: this.getWarnings(),
      thresholds: this.thresholds,
      exportedAt: new Date().toISOString(),
    });
  }

  // Private methods

  private monitorFrames(): void {
    if (!this.isMonitoring) return;

    requestAnimationFrame(() => {
      const now = performance.now();
      const frameTime = now - this.frameStartTime;
      this.frameStartTime = now;
      this.frameCount++;

      // Calculate FPS every second
      const timeSinceLastCheck = Date.now() - this.lastFPSCheck;
      if (timeSinceLastCheck >= 1000) {
        const fps = Math.round((this.frameCount * 1000) / timeSinceLastCheck);

        const metrics: FrameMetrics = {
          fps,
          frameTime,
          droppedFrames: Math.max(0, 60 - fps),
          timestamp: Date.now(),
        };

        this.frameMetrics.push(metrics);
        this.maintainHistorySize();

        // Check threshold
        if (fps < this.thresholds.lowFPS) {
          this.addWarning({
            type: "low-fps",
            message: `Low FPS detected: ${fps} fps`,
            value: fps,
            threshold: this.thresholds.lowFPS,
            timestamp: Date.now(),
          });
        }

        this.frameCount = 0;
        this.lastFPSCheck = Date.now();
      }

      this.monitorFrames();
    });
  }

  private monitorMemory(): void {
    if (!this.isMonitoring) return;

    const checkMemory = () => {
      if (!this.isMonitoring) return;

      const memory = (performance as any).memory;
      if (memory) {
        const metrics: MemoryMetrics = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          timestamp: Date.now(),
        };

        this.memoryMetrics.push(metrics);
        this.maintainHistorySize();

        // Check threshold
        if (memory.usedJSHeapSize > this.thresholds.highMemory) {
          this.addWarning({
            type: "high-memory",
            message: `High memory usage: ${this.formatBytes(
              memory.usedJSHeapSize
            )}`,
            value: memory.usedJSHeapSize,
            threshold: this.thresholds.highMemory,
            timestamp: Date.now(),
          });
        }
      }

      setTimeout(checkMemory, 5000); // Check every 5 seconds
    };

    checkMemory();
  }

  private isMemoryAPIAvailable(): boolean {
    return (
      typeof performance !== "undefined" &&
      (performance as any).memory !== undefined
    );
  }

  private maintainHistorySize(): void {
    if (this.marks.length > this.maxHistorySize) {
      this.marks = this.marks.slice(-this.maxHistorySize);
    }

    if (this.measures.length > this.maxHistorySize) {
      this.measures = this.measures.slice(-this.maxHistorySize);
    }

    if (this.frameMetrics.length > this.maxHistorySize) {
      this.frameMetrics = this.frameMetrics.slice(-this.maxHistorySize);
    }

    if (this.memoryMetrics.length > this.maxHistorySize) {
      this.memoryMetrics = this.memoryMetrics.slice(-this.maxHistorySize);
    }

    if (this.warnings.length > this.maxHistorySize) {
      this.warnings = this.warnings.slice(-this.maxHistorySize);
    }
  }

  private addWarning(warning: PerformanceWarning): void {
    this.warnings.push(warning);
    this.maintainHistorySize();
  }

  private formatBytes(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

// ============================================================================
// Global Instance & Utilities
// ============================================================================

let globalMonitor: PerformanceMonitor | null = null;

export function initPerformanceMonitor(
  thresholds?: PerformanceThresholds
): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor(thresholds);
  }
  return globalMonitor;
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return globalMonitor;
}

/**
 * Measure execution time of a function
 */
export async function measureExecution<T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<T> {
  const monitor = getPerformanceMonitor() || initPerformanceMonitor();
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;

  monitor.mark(startMark);

  try {
    const result = await Promise.resolve(fn());
    monitor.mark(endMark);
    monitor.measure(name, startMark, endMark);
    return result;
  } catch (error) {
    monitor.mark(endMark);
    monitor.measure(name, startMark, endMark, { error: true });
    throw error;
  }
}

/**
 * Create a render profiler for a component
 */
export function profileRender(componentName: string) {
  const monitor = getPerformanceMonitor() || initPerformanceMonitor();

  return {
    start: () => {
      const mark = `render-${componentName}-${Date.now()}`;
      monitor.mark(mark);
      return mark;
    },
    end: (startMark: string) => {
      const endMark = `${startMark}-end`;
      monitor.mark(endMark);
      const measure = monitor.measure(
        `render-${componentName}`,
        startMark,
        endMark
      );
      if (measure) {
        monitor.recordRender(componentName, measure.duration);
      }
    },
  };
}

/**
 * Format duration for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}μs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

/**
 * Get performance insights
 */
export function getPerformanceInsights(): string[] {
  const monitor = getPerformanceMonitor();
  if (!monitor) return [];

  const insights: string[] = [];
  const report = monitor.generateReport();

  // FPS insights
  if (report.summary.averageFPS < 30) {
    insights.push(`Low average FPS: ${report.summary.averageFPS.toFixed(1)}`);
  }

  // Render insights
  if (report.summary.slowestRender) {
    const r = report.summary.slowestRender;
    insights.push(
      `Slowest component: ${r.componentName} (${r.maxTime.toFixed(2)}ms)`
    );
  }

  // Measure insights
  if (report.summary.slowestMeasure) {
    const m = report.summary.slowestMeasure;
    insights.push(
      `Slowest operation: ${m.name} (${m.duration.toFixed(2)}ms)`
    );
  }

  return insights;
}
