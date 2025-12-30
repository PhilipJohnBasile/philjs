/**
 * Performance Auto-Tuning for PhilJS
 *
 * Automatic runtime optimization based on:
 * - Device capabilities detection
 * - Network conditions
 * - User interaction patterns
 * - Resource usage monitoring
 * - Adaptive rendering strategies
 */

// =============================================================================
// Types
// =============================================================================

export interface DeviceCapabilities {
  cores: number;
  memory: number; // GB
  deviceType: 'mobile' | 'tablet' | 'desktop';
  gpu: 'low' | 'medium' | 'high';
  touchCapable: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  colorScheme: 'light' | 'dark';
}

export interface NetworkCondition {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'offline';
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
}

export interface PerformanceMetrics {
  fps: number;
  longestTask: number;
  memoryUsage: number;
  domNodes: number;
  layoutShifts: number;
  inputLatency: number;
}

export interface TuningConfig {
  /** Target FPS */
  targetFps: number;
  /** Enable adaptive rendering */
  adaptiveRendering: boolean;
  /** Enable image optimization */
  imageOptimization: boolean;
  /** Enable animation reduction */
  animationOptimization: boolean;
  /** Enable lazy loading */
  lazyLoading: boolean;
  /** Batch update threshold */
  batchThreshold: number;
  /** Concurrent task limit */
  concurrentLimit: number;
  /** Memory warning threshold (MB) */
  memoryThreshold: number;
  /** Enable prefetching */
  prefetching: boolean;
}

export interface TuningRecommendation {
  type: 'reduce-animation' | 'defer-rendering' | 'simplify-ui' | 'reduce-images' | 'increase-caching' | 'reduce-dom';
  reason: string;
  impact: 'high' | 'medium' | 'low';
  autoApply: boolean;
}

// =============================================================================
// Device Detection
// =============================================================================

/**
 * Detect device capabilities
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const win = typeof window !== 'undefined' ? window : null;

  // Core count
  const cores = nav?.hardwareConcurrency || 4;

  // Memory (Chrome only)
  const memory = (nav as any)?.deviceMemory || 4;

  // Device type
  const width = win?.innerWidth || 1024;
  const touch = (nav?.maxTouchPoints ?? 0) > 0;
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (width < 768) deviceType = 'mobile';
  else if (width < 1024 && touch) deviceType = 'tablet';

  // GPU estimation based on renderer
  let gpu: 'low' | 'medium' | 'high' = 'medium';
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
          if (/Mali|Adreno 3|PowerVR SGX/i.test(renderer)) gpu = 'low';
          else if (/NVIDIA|AMD|GeForce|Radeon/i.test(renderer)) gpu = 'high';
        }
      }
    } catch {}
  }

  // Reduced motion preference
  const reducedMotion = win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;

  // Save data preference
  const connection = (nav as any)?.connection;
  const saveData = connection?.saveData || false;

  // Color scheme
  const colorScheme = win?.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  return {
    cores,
    memory,
    deviceType,
    gpu,
    touchCapable: touch,
    reducedMotion,
    saveData,
    colorScheme,
  };
}

/**
 * Detect network conditions
 */
export function detectNetworkCondition(): NetworkCondition {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const connection = (nav as any)?.connection;

  if (!connection) {
    return {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
    };
  }

  return {
    effectiveType: connection.effectiveType || '4g',
    downlink: connection.downlink || 10,
    rtt: connection.rtt || 50,
    saveData: connection.saveData || false,
  };
}

// =============================================================================
// Performance Monitoring
// =============================================================================

/**
 * Performance Monitor
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fps: 60,
    longestTask: 0,
    memoryUsage: 0,
    domNodes: 0,
    layoutShifts: 0,
    inputLatency: 0,
  };

  private observers: {
    longTask?: PerformanceObserver;
    layoutShift?: PerformanceObserver;
    interaction?: PerformanceObserver;
  } = {};

  private fpsHistory: number[] = [];
  private lastFrameTime = 0;
  private frameCount = 0;
  private running = false;

  /**
   * Start monitoring
   */
  start(): void {
    if (this.running) return;
    this.running = true;

    // FPS monitoring
    this.measureFps();

    // Long task observer
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        this.observers.longTask = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > this.metrics.longestTask) {
              this.metrics.longestTask = entry.duration;
            }
          }
        });
        this.observers.longTask.observe({ entryTypes: ['longtask'] });
      } catch {}

      // Layout shift observer
      try {
        this.observers.layoutShift = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              this.metrics.layoutShifts += (entry as any).value;
            }
          }
        });
        this.observers.layoutShift.observe({ entryTypes: ['layout-shift'] });
      } catch {}

      // First Input Delay
      try {
        this.observers.interaction = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.metrics.inputLatency = Math.max(
              this.metrics.inputLatency,
              (entry as any).processingStart - entry.startTime
            );
          }
        });
        this.observers.interaction.observe({ entryTypes: ['first-input'] });
      } catch {}
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.running = false;
    for (const observer of Object.values(this.observers)) {
      observer?.disconnect();
    }
    this.observers = {};
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    // Update DOM nodes count
    if (typeof document !== 'undefined') {
      this.metrics.domNodes = document.querySelectorAll('*').length;
    }

    // Update memory usage
    if ((performance as any).memory) {
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }

    return { ...this.metrics };
  }

  /**
   * Get average FPS
   */
  getAverageFps(): number {
    if (this.fpsHistory.length === 0) return 60;
    return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
  }

  private measureFps(): void {
    if (!this.running) return;

    const now = performance.now();
    this.frameCount++;

    if (now - this.lastFrameTime >= 1000) {
      this.metrics.fps = this.frameCount;
      this.fpsHistory.push(this.frameCount);
      if (this.fpsHistory.length > 60) this.fpsHistory.shift();
      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    requestAnimationFrame(() => this.measureFps());
  }
}

// =============================================================================
// Auto-Tuner
// =============================================================================

/**
 * Auto-Tuner for runtime optimization
 */
export class AutoTuner {
  private config: TuningConfig;
  private device: DeviceCapabilities;
  private network: NetworkCondition;
  private monitor: PerformanceMonitor;
  private recommendations: TuningRecommendation[] = [];
  private appliedOptimizations: Set<string> = new Set();
  private listeners: Set<(config: TuningConfig) => void> = new Set();

  constructor(config: Partial<TuningConfig> = {}) {
    this.config = {
      targetFps: config.targetFps ?? 60,
      adaptiveRendering: config.adaptiveRendering ?? true,
      imageOptimization: config.imageOptimization ?? true,
      animationOptimization: config.animationOptimization ?? true,
      lazyLoading: config.lazyLoading ?? true,
      batchThreshold: config.batchThreshold ?? 16,
      concurrentLimit: config.concurrentLimit ?? 4,
      memoryThreshold: config.memoryThreshold ?? 100,
      prefetching: config.prefetching ?? true,
    };

    this.device = detectDeviceCapabilities();
    this.network = detectNetworkCondition();
    this.monitor = new PerformanceMonitor();

    // Initial tuning based on device
    this.applyInitialTuning();
  }

  /**
   * Start auto-tuning
   */
  start(): void {
    this.monitor.start();

    // Listen for network changes
    if (typeof navigator !== 'undefined' && (navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', () => {
        this.network = detectNetworkCondition();
        this.adapt();
      });
    }

    // Periodic tuning
    setInterval(() => this.adapt(), 5000);
  }

  /**
   * Stop auto-tuning
   */
  stop(): void {
    this.monitor.stop();
  }

  /**
   * Get current configuration
   */
  getConfig(): TuningConfig {
    return { ...this.config };
  }

  /**
   * Get recommendations
   */
  getRecommendations(): TuningRecommendation[] {
    return [...this.recommendations];
  }

  /**
   * Subscribe to config changes
   */
  subscribe(listener: (config: TuningConfig) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Apply a specific optimization
   */
  applyOptimization(type: TuningRecommendation['type']): void {
    if (this.appliedOptimizations.has(type)) return;

    switch (type) {
      case 'reduce-animation':
        this.config.animationOptimization = true;
        this.appliedOptimizations.add(type);
        break;

      case 'defer-rendering':
        this.config.batchThreshold = Math.min(this.config.batchThreshold * 2, 64);
        this.appliedOptimizations.add(type);
        break;

      case 'simplify-ui':
        this.config.adaptiveRendering = true;
        this.appliedOptimizations.add(type);
        break;

      case 'reduce-images':
        this.config.imageOptimization = true;
        this.appliedOptimizations.add(type);
        break;

      case 'increase-caching':
        this.config.prefetching = true;
        this.appliedOptimizations.add(type);
        break;

      case 'reduce-dom':
        this.config.lazyLoading = true;
        this.appliedOptimizations.add(type);
        break;
    }

    this.notifyListeners();
  }

  private applyInitialTuning(): void {
    // Device-based tuning
    if (this.device.deviceType === 'mobile') {
      this.config.concurrentLimit = 2;
      this.config.batchThreshold = 32;
    }

    if (this.device.gpu === 'low') {
      this.config.animationOptimization = true;
      this.config.targetFps = 30;
    }

    if (this.device.reducedMotion) {
      this.config.animationOptimization = true;
    }

    if (this.device.memory < 4) {
      this.config.memoryThreshold = 50;
      this.config.lazyLoading = true;
    }

    // Network-based tuning
    if (this.network.saveData || this.network.effectiveType === 'slow-2g' || this.network.effectiveType === '2g') {
      this.config.imageOptimization = true;
      this.config.prefetching = false;
    }
  }

  private adapt(): void {
    const metrics = this.monitor.getMetrics();
    const avgFps = this.monitor.getAverageFps();
    this.recommendations = [];

    // FPS-based recommendations
    if (avgFps < this.config.targetFps * 0.8) {
      if (!this.appliedOptimizations.has('reduce-animation')) {
        this.recommendations.push({
          type: 'reduce-animation',
          reason: `FPS dropped to ${avgFps.toFixed(0)} (target: ${this.config.targetFps})`,
          impact: 'high',
          autoApply: true,
        });
      }

      if (!this.appliedOptimizations.has('defer-rendering')) {
        this.recommendations.push({
          type: 'defer-rendering',
          reason: 'Rendering is causing frame drops',
          impact: 'medium',
          autoApply: true,
        });
      }
    }

    // Memory-based recommendations
    if (metrics.memoryUsage > this.config.memoryThreshold) {
      this.recommendations.push({
        type: 'reduce-dom',
        reason: `Memory usage (${metrics.memoryUsage.toFixed(0)}MB) exceeds threshold`,
        impact: 'high',
        autoApply: true,
      });
    }

    // DOM size recommendations
    if (metrics.domNodes > 5000) {
      this.recommendations.push({
        type: 'reduce-dom',
        reason: `DOM has ${metrics.domNodes} nodes (recommended: <5000)`,
        impact: 'medium',
        autoApply: false,
      });
    }

    // Long task recommendations
    if (metrics.longestTask > 100) {
      this.recommendations.push({
        type: 'defer-rendering',
        reason: `Long task detected: ${metrics.longestTask.toFixed(0)}ms`,
        impact: 'high',
        autoApply: true,
      });
    }

    // Input latency recommendations
    if (metrics.inputLatency > 100) {
      this.recommendations.push({
        type: 'simplify-ui',
        reason: `Input latency: ${metrics.inputLatency.toFixed(0)}ms`,
        impact: 'high',
        autoApply: false,
      });
    }

    // Auto-apply high-impact recommendations
    for (const rec of this.recommendations) {
      if (rec.autoApply && rec.impact === 'high') {
        this.applyOptimization(rec.type);
      }
    }
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.config);
    }
  }
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Create an auto-tuner instance
 */
export function createAutoTuner(config?: Partial<TuningConfig>): AutoTuner {
  return new AutoTuner(config);
}

/**
 * Get recommended image quality based on conditions
 */
export function getRecommendedImageQuality(): { quality: number; format: 'webp' | 'avif' | 'jpeg'; maxWidth: number } {
  const device = detectDeviceCapabilities();
  const network = detectNetworkCondition();

  let quality = 80;
  let format: 'webp' | 'avif' | 'jpeg' = 'webp';
  let maxWidth = 1920;

  // Reduce quality for slow networks
  if (network.effectiveType === 'slow-2g' || network.effectiveType === '2g') {
    quality = 40;
    maxWidth = 640;
  } else if (network.effectiveType === '3g') {
    quality = 60;
    maxWidth = 1024;
  }

  // Reduce for mobile
  if (device.deviceType === 'mobile') {
    maxWidth = Math.min(maxWidth, 750);
  }

  // Use AVIF for high-end devices
  if (device.gpu === 'high' && network.effectiveType === '4g') {
    format = 'avif';
  }

  // Respect save data
  if (network.saveData || device.saveData) {
    quality = Math.min(quality, 50);
    maxWidth = Math.min(maxWidth, 640);
  }

  return { quality, format, maxWidth };
}

/**
 * Get recommended concurrent operations
 */
export function getRecommendedConcurrency(): number {
  const device = detectDeviceCapabilities();
  const network = detectNetworkCondition();

  let concurrency = device.cores;

  if (device.deviceType === 'mobile') {
    concurrency = Math.min(concurrency, 2);
  }

  if (network.effectiveType !== '4g') {
    concurrency = Math.min(concurrency, 2);
  }

  return Math.max(1, concurrency);
}

// =============================================================================
// Exports
// =============================================================================

export default {
  createAutoTuner,
  detectDeviceCapabilities,
  detectNetworkCondition,
  getRecommendedImageQuality,
  getRecommendedConcurrency,
  PerformanceMonitor,
  AutoTuner,
};
