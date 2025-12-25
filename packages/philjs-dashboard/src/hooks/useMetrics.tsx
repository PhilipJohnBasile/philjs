/**
 * React/Philjs Hooks for Performance Monitoring
 * useWebVitals, usePerformanceObserver, useErrorBoundary
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  createContext,
  useContext,
} from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import type { WebVitalsMetrics, MetricsSnapshot, MetricsCollectorConfig } from '../collector/metrics';
import type { CapturedError, ErrorContext } from '../collector/errors';
import { MetricsCollector, calculatePerformanceScore } from '../collector/metrics';
import { ErrorTracker, captureReactError } from '../collector/errors';

// ============================================================================
// Types
// ============================================================================

export interface WebVitalsState {
  /** Current Web Vitals values */
  metrics: WebVitalsMetrics;
  /** Performance score (0-100) */
  score: number;
  /** Whether metrics are being collected */
  isCollecting: boolean;
  /** Last update timestamp */
  lastUpdate: number | null;
}

export interface PerformanceObserverOptions {
  /** Entry types to observe */
  entryTypes: PerformanceEntryType[];
  /** Buffer size for entries */
  bufferSize?: number;
  /** Callback on new entries */
  onEntry?: (entry: PerformanceEntry) => void;
}

export type PerformanceEntryType =
  | 'element'
  | 'event'
  | 'first-input'
  | 'largest-contentful-paint'
  | 'layout-shift'
  | 'longtask'
  | 'mark'
  | 'measure'
  | 'navigation'
  | 'paint'
  | 'resource';

export interface PerformanceEntries {
  entries: PerformanceEntry[];
  entriesByType: Map<string, PerformanceEntry[]>;
  clear: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  capturedError: CapturedError | null;
}

export interface ErrorBoundaryFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
}

export interface MetricsContextValue {
  collector: MetricsCollector | null;
  errorTracker: ErrorTracker | null;
  metrics: MetricsSnapshot | null;
  webVitals: WebVitalsMetrics;
  score: number;
  isCollecting: boolean;
  captureError: (error: Error, context?: ErrorContext) => Promise<CapturedError | null>;
  recordMetric: (name: string, value: number, unit?: string) => void;
  startTimer: (name: string) => () => void;
}

// ============================================================================
// Metrics Context
// ============================================================================

const MetricsContext = createContext<MetricsContextValue | null>(null);

export interface MetricsProviderProps {
  children: ReactNode;
  config?: MetricsCollectorConfig;
  errorConfig?: {
    maxBreadcrumbs?: number;
    ignorePatterns?: (string | RegExp)[];
  };
}

export function MetricsProvider({
  children,
  config,
  errorConfig,
}: MetricsProviderProps): JSX.Element {
  const collectorRef = useRef<MetricsCollector | null>(null);
  const errorTrackerRef = useRef<ErrorTracker | null>(null);
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);

  useEffect(() => {
    const collector = new MetricsCollector({
      ...config,
      onMetrics: (snapshot) => {
        setMetrics(snapshot);
      },
    });

    const errorTracker = new ErrorTracker(errorConfig);

    collectorRef.current = collector;
    errorTrackerRef.current = errorTracker;

    collector.start().then(() => {
      setIsCollecting(true);
    });

    return () => {
      collector.stop();
      errorTracker.destroy();
      setIsCollecting(false);
    };
  }, [config, errorConfig]);

  const webVitals = metrics?.webVitals ?? {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null,
  };

  const score = useMemo(
    () => calculatePerformanceScore(webVitals),
    [webVitals]
  );

  const captureError = useCallback(
    async (error: Error, context?: ErrorContext) => {
      return errorTrackerRef.current?.captureError(error, context) ?? null;
    },
    []
  );

  const recordMetric = useCallback(
    (name: string, value: number, unit?: string) => {
      collectorRef.current?.recordMetric(name, value, unit);
    },
    []
  );

  const startTimer = useCallback((name: string) => {
    return collectorRef.current?.startTimer(name) ?? (() => {});
  }, []);

  const value = useMemo<MetricsContextValue>(
    () => ({
      collector: collectorRef.current,
      errorTracker: errorTrackerRef.current,
      metrics,
      webVitals,
      score,
      isCollecting,
      captureError,
      recordMetric,
      startTimer,
    }),
    [metrics, webVitals, score, isCollecting, captureError, recordMetric, startTimer]
  );

  return <MetricsContext.Provider value={value}>{children}</MetricsContext.Provider>;
}

export function useMetricsContext(): MetricsContextValue {
  const context = useContext(MetricsContext);
  if (!context) {
    throw new Error('useMetricsContext must be used within a MetricsProvider');
  }
  return context;
}

// ============================================================================
// useWebVitals Hook
// ============================================================================

export interface UseWebVitalsOptions {
  /** Callback when metrics update */
  onUpdate?: (metrics: WebVitalsMetrics) => void;
  /** Initial collection delay in ms */
  delay?: number;
}

export function useWebVitals(options: UseWebVitalsOptions = {}): WebVitalsState {
  const { onUpdate, delay = 0 } = options;

  const [state, setState] = useState<WebVitalsState>({
    metrics: {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
      inp: null,
    },
    score: 0,
    isCollecting: false,
    lastUpdate: null,
  });

  const collectorRef = useRef<MetricsCollector | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const startCollection = async () => {
      const collector = new MetricsCollector({
        onMetrics: (snapshot) => {
          const newMetrics = snapshot.webVitals;
          const newScore = calculatePerformanceScore(newMetrics);

          setState({
            metrics: newMetrics,
            score: newScore,
            isCollecting: true,
            lastUpdate: Date.now(),
          });

          onUpdateRef.current?.(newMetrics);
        },
      });

      collectorRef.current = collector;
      await collector.start();
      setState((prev) => ({ ...prev, isCollecting: true }));
    };

    if (delay > 0) {
      timeoutId = setTimeout(startCollection, delay);
    } else {
      startCollection();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      collectorRef.current?.stop();
    };
  }, [delay]);

  return state;
}

// ============================================================================
// usePerformanceObserver Hook
// ============================================================================

export function usePerformanceObserver(
  options: PerformanceObserverOptions
): PerformanceEntries {
  const { entryTypes, bufferSize = 100, onEntry } = options;

  const [entries, setEntries] = useState<PerformanceEntry[]>([]);
  const entriesByType = useMemo(() => {
    const map = new Map<string, PerformanceEntry[]>();
    for (const entry of entries) {
      const existing = map.get(entry.entryType) || [];
      existing.push(entry);
      map.set(entry.entryType, existing);
    }
    return map;
  }, [entries]);

  const onEntryRef = useRef(onEntry);
  onEntryRef.current = onEntry;

  const clear = useCallback(() => {
    setEntries([]);
  }, []);

  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') {
      return;
    }

    const observers: PerformanceObserver[] = [];

    for (const entryType of entryTypes) {
      try {
        const observer = new PerformanceObserver((list) => {
          const newEntries = list.getEntries();

          for (const entry of newEntries) {
            onEntryRef.current?.(entry);
          }

          setEntries((prev) => {
            const updated = [...prev, ...newEntries];
            if (updated.length > bufferSize) {
              return updated.slice(-bufferSize);
            }
            return updated;
          });
        });

        observer.observe({ type: entryType as string, buffered: true });
        observers.push(observer);
      } catch {
        // Entry type not supported
        console.warn(`PerformanceObserver: ${entryType} not supported`);
      }
    }

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [entryTypes, bufferSize]);

  return { entries, entriesByType, clear };
}

// ============================================================================
// useErrorBoundary Hook
// ============================================================================

export interface UseErrorBoundaryOptions {
  /** Fallback component to render on error */
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Reset keys - error boundary resets when these change */
  resetKeys?: unknown[];
  /** Component name for error tracking */
  componentName?: string;
}

export function useErrorBoundary(options: UseErrorBoundaryOptions = {}): {
  ErrorBoundary: React.ComponentType<{ children: ReactNode }>;
  resetError: () => void;
  error: Error | null;
  hasError: boolean;
} {
  const { onError, resetKeys = [], componentName } = options;

  const [state, setState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null,
    errorInfo: null,
    capturedError: null,
  });

  const resetKeysRef = useRef(resetKeys);

  // Reset error when resetKeys change
  useEffect(() => {
    if (
      state.hasError &&
      JSON.stringify(resetKeysRef.current) !== JSON.stringify(resetKeys)
    ) {
      setState({
        hasError: false,
        error: null,
        errorInfo: null,
        capturedError: null,
      });
    }
    resetKeysRef.current = resetKeys;
  }, [resetKeys, state.hasError]);

  const resetError = useCallback(() => {
    setState({
      hasError: false,
      error: null,
      errorInfo: null,
      capturedError: null,
    });
  }, []);

  const handleError = useCallback(
    async (error: Error, errorInfo: ErrorInfo) => {
      const capturedError = await captureReactError(error, errorInfo, componentName);

      setState({
        hasError: true,
        error,
        errorInfo,
        capturedError,
      });

      onError?.(error, errorInfo);
    },
    [onError, componentName]
  );

  // Create error boundary component
  const ErrorBoundary = useMemo(() => {
    const { fallback: Fallback } = options;

    class ErrorBoundaryClass extends React.Component<
      { children: ReactNode },
      { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null }
    > {
      constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
      }

      static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
      }

      componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        handleError(error, errorInfo);
      }

      render() {
        if (this.state.hasError && this.state.error) {
          if (Fallback) {
            return (
              <Fallback
                error={this.state.error}
                errorInfo={this.state.errorInfo}
                resetError={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  resetError();
                }}
              />
            );
          }

          return (
            <div style={{ padding: '20px', color: '#ef4444' }}>
              <h2>Something went wrong</h2>
              <p>{this.state.error.message}</p>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  resetError();
                }}
              >
                Try again
              </button>
            </div>
          );
        }

        return this.props.children;
      }
    }

    return ErrorBoundaryClass;
  }, [options, handleError, resetError]);

  return {
    ErrorBoundary,
    resetError,
    error: state.error,
    hasError: state.hasError,
  };
}

// ============================================================================
// useMeasure Hook - Measure component render time
// ============================================================================

export interface UseMeasureResult {
  /** Start measuring */
  start: () => void;
  /** Stop measuring and record metric */
  stop: () => number;
  /** Get last measured duration */
  duration: number | null;
}

export function useMeasure(name: string): UseMeasureResult {
  const startTimeRef = useRef<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const stop = useCallback(() => {
    if (startTimeRef.current === null) {
      return 0;
    }

    const endTime = performance.now();
    const measuredDuration = endTime - startTimeRef.current;
    setDuration(measuredDuration);
    startTimeRef.current = null;

    // Record using Performance API
    if (typeof performance.measure === 'function') {
      try {
        performance.measure(name, {
          start: endTime - measuredDuration,
          end: endTime,
        });
      } catch {
        // Ignore errors
      }
    }

    return measuredDuration;
  }, [name]);

  return { start, stop, duration };
}

// ============================================================================
// useRenderCount Hook - Track component render count
// ============================================================================

export function useRenderCount(componentName?: string): number {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  useEffect(() => {
    if (componentName) {
      console.debug(`[${componentName}] Render count: ${renderCountRef.current}`);
    }
  });

  return renderCountRef.current;
}

// ============================================================================
// useNetworkStatus Hook - Monitor network conditions
// ============================================================================

export interface NetworkStatus {
  online: boolean;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | undefined;
  downlink: number | undefined;
  rtt: number | undefined;
  saveData: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const getNetworkInfo = useCallback((): NetworkStatus => {
    const connection = (navigator as Navigator & {
      connection?: {
        effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
        downlink?: number;
        rtt?: number;
        saveData?: boolean;
      };
    }).connection;

    return {
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData ?? false,
    };
  }, []);

  const [status, setStatus] = useState<NetworkStatus>(getNetworkInfo);

  useEffect(() => {
    const updateStatus = () => setStatus(getNetworkInfo());

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    const connection = (navigator as Navigator & {
      connection?: EventTarget;
    }).connection;

    if (connection) {
      connection.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, [getNetworkInfo]);

  return status;
}

// ============================================================================
// useIdleCallback Hook - Run tasks during idle time
// ============================================================================

export function useIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (typeof requestIdleCallback === 'undefined') {
      const timeoutId = setTimeout(() => callbackRef.current(), 1);
      return () => clearTimeout(timeoutId);
    }

    const idleCallbackId = requestIdleCallback(
      () => callbackRef.current(),
      options
    );

    return () => cancelIdleCallback(idleCallbackId);
  }, [options]);
}

// ============================================================================
// Import React for class component in useErrorBoundary
// ============================================================================

import React from 'react';
